"""Deterministic alert ingestion and incident queries."""
import json
import logging
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone

from ..core.config import get_connection

SCHEMA = """
CREATE TABLE IF NOT EXISTS wazuh_alerts (
  alert_id TEXT PRIMARY KEY, incident_id INTEGER NOT NULL, occurred_at TEXT NOT NULL,
  source_ip TEXT NOT NULL, honeypot TEXT NOT NULL, event_type TEXT NOT NULL,
  session_id TEXT, rule_id TEXT, rule_level INTEGER NOT NULL, detail TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS incidents (
  id INTEGER PRIMARY KEY, source_ip TEXT NOT NULL, first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL, risk_score INTEGER NOT NULL DEFAULT 0,
  risk_reasons TEXT NOT NULL DEFAULT '[]', detection TEXT NOT NULL DEFAULT '[]'
);
CREATE INDEX IF NOT EXISTS incidents_source_time ON incidents(source_ip, last_seen);
CREATE INDEX IF NOT EXISTS wazuh_alerts_incident_time ON wazuh_alerts(incident_id, occurred_at);
CREATE TABLE IF NOT EXISTS ingestion_checkpoints (source TEXT PRIMARY KEY, cursor TEXT NOT NULL);
"""


@contextmanager
def connection():
    conn = get_connection()
    try:
        with conn:
            yield conn
    finally:
        conn.close()


def normalize(hit: dict) -> dict:
    """Keep only known-safe fields; never persist raw credentials or token values."""
    src = hit["_source"]
    data = src.get("data") or {}
    rule = src.get("rule") or {}
    timestamp = datetime.fromisoformat(src["timestamp"].replace("Z", "+00:00"))
    if timestamp.tzinfo is None:
        raise ValueError("Alert timestamp must include timezone")
    # ponytail: srcip-less alerts keep as its own "unknown" source rather than dropping the whole alert.
    ip = data.get("srcip") or src.get("srcip") or "unknown"
    return {"alert_id": f'{hit["_index"]}:{hit["_id"]}', "occurred_at": timestamp.astimezone(timezone.utc).isoformat(timespec="microseconds"),
            "source_ip": str(ip), "honeypot": str(data.get("honeypot") or "unknown"),
            "event_type": str(data.get("event_type") or "unknown"), "session_id": data.get("session_id"),
            "rule_id": str(rule.get("id", "")), "rule_level": int(rule.get("level", 0)),
            "detail": json.dumps({key: data[key] for key in ("dstip",) if key in data})}


def recalculate(conn: sqlite3.Connection, incident_id: int) -> None:
    rows = conn.execute("SELECT * FROM wazuh_alerts WHERE incident_id=? ORDER BY occurred_at, alert_id", (incident_id,)).fetchall()
    events = [dict(row) for row in rows]
    types = [row["event_type"] for row in events]
    failures = sum(t == "auth_failure" for t in types)
    services = {row["honeypot"] for row in events if row["honeypot"] != "unknown"}
    detections = []
    if failures >= 3:
        detections.append("repeated_auth_failures")
    if any(t == "auth_success" and "auth_failure" in types[:i] for i, t in enumerate(types)):
        detections.append("login_after_failures")
    if len(services) >= 2:
        detections.append("cross_honeypot_activity")
    if "decoy_access" in types:
        detections.append("decoy_access")
    if "honeytoken" in types:
        detections.append("honeytoken_activation")
    if "command" in types:
        detections.append("command_execution")
    weights = {"repeated_auth_failures": 15, "login_after_failures": 20, "cross_honeypot_activity": 15,
               "decoy_access": 25, "honeytoken_activation": 35, "command_execution": 10}
    reasons = [{"reason": name, "points": weights[name]} for name in detections]
    level = min(20, max(0, max(row["rule_level"] for row in events) * 2))
    reasons.insert(0, {"reason": "max_wazuh_rule_level", "points": level})
    conn.execute("UPDATE incidents SET first_seen=?, last_seen=?, risk_score=?, risk_reasons=?, detection=? WHERE id=?",
                 (events[0]["occurred_at"], events[-1]["occurred_at"], min(100, sum(r["points"] for r in reasons)),
                  json.dumps(reasons), json.dumps(detections), incident_id))


def ingest(provider, limit: int = 100, source: str = "wazuh") -> int:
    if not 1 <= limit <= 1000:
        raise ValueError("limit must be between 1 and 1000")
    with connection() as conn:
        conn.row_factory = sqlite3.Row
        conn.executescript(SCHEMA)
        checkpoint = conn.execute("SELECT cursor FROM ingestion_checkpoints WHERE source=?", (source,)).fetchone()
        cursor = json.loads(checkpoint[0]) if checkpoint else None
    # ponytail: re-scan the last 48 hours after each complete pass; older late arrivals need a full backfill.
    def valid_cursor(value):
        return (isinstance(value, list) and len(value) in (2, 3) and
                isinstance(value[0], str) and
                (len(value) == 3 and all(isinstance(part, str) for part in value[1:]) or
                 len(value) == 2 and isinstance(value[1], int) and not isinstance(value[1], bool) and value[1] >= 0))

    if cursor is not None and not valid_cursor(cursor):
        raise ValueError("Invalid checkpoint")
    hits, next_cursor = provider.fetch(cursor, limit)
    if (not isinstance(hits, list) or len(hits) > limit or
            (next_cursor is not None and not valid_cursor(next_cursor)) or
            (hits and (next_cursor is None or next_cursor == cursor))):
        raise ValueError("Provider returned invalid page")
    with connection() as conn:
        conn.row_factory = sqlite3.Row
        conn.execute("BEGIN IMMEDIATE")
        current = conn.execute("SELECT cursor FROM ingestion_checkpoints WHERE source=?", (source,)).fetchone()
        if (json.loads(current[0]) if current else None) != cursor:
            return 0  # Another worker committed this page; retry next poll.
        count = 0
        for hit in hits:
            try:
                alert = normalize(hit)
            except (KeyError, TypeError, ValueError, OverflowError) as exc:
                logging.warning("Skipping malformed Wazuh alert %s: %s", hit.get("_id") if isinstance(hit, dict) else "unknown", exc)
                continue
            if conn.execute("SELECT 1 FROM wazuh_alerts WHERE alert_id=?", (alert["alert_id"],)).fetchone():
                continue
            # ponytail: 24-hour source window; upgrade to explicit session graph when cross-day campaigns matter.
            earlier = (datetime.fromisoformat(alert["occurred_at"]) - timedelta(hours=24)).isoformat(timespec="microseconds")
            later = (datetime.fromisoformat(alert["occurred_at"]) + timedelta(hours=24)).isoformat(timespec="microseconds")
            matches = conn.execute("SELECT id FROM incidents WHERE source_ip=? AND last_seen>=? AND first_seen<=? ORDER BY id",
                                   (alert["source_ip"], earlier, later)).fetchall()
            if matches:
                incident_id = matches[0][0]
                for match in matches[1:]:
                    conn.execute("UPDATE wazuh_alerts SET incident_id=? WHERE incident_id=?", (incident_id, match[0]))
                    conn.execute("DELETE FROM incidents WHERE id=?", (match[0],))
            else:
                incident_id = conn.execute("INSERT INTO incidents(source_ip, first_seen, last_seen) VALUES(?,?,?)",
                                           (alert["source_ip"], alert["occurred_at"], alert["occurred_at"])).lastrowid
            conn.execute("INSERT INTO wazuh_alerts(alert_id,incident_id,occurred_at,source_ip,honeypot,event_type,session_id,rule_id,rule_level,detail) VALUES(:alert_id,:incident_id,:occurred_at,:source_ip,:honeypot,:event_type,:session_id,:rule_id,:rule_level,:detail)",
                         {**alert, "incident_id": incident_id})
            recalculate(conn, incident_id)
            count += 1
        if not hits:
            latest = conn.execute("SELECT MAX(occurred_at) FROM wazuh_alerts").fetchone()[0]
            if latest:
                next_cursor = [(datetime.fromisoformat(latest) - timedelta(hours=48)).isoformat(), 0]
        if next_cursor is not None:
            conn.execute("INSERT INTO ingestion_checkpoints(source,cursor) VALUES(?,?) ON CONFLICT(source) DO UPDATE SET cursor=excluded.cursor",
                         (source, json.dumps(next_cursor)))
    return count


def serialize(row):
    item = dict(row)
    for key in ("risk_reasons", "detection", "detail"):
        if key in item:
            item[key] = json.loads(item[key])
    return item


def list_incidents(limit: int = 50, offset: int = 0):
    with connection() as conn:
        conn.row_factory = sqlite3.Row
        conn.executescript(SCHEMA)
        return [serialize(row) for row in conn.execute("SELECT * FROM incidents ORDER BY last_seen DESC, id DESC LIMIT ? OFFSET ?", (limit, offset))]


def get_incident(incident_id: int):
    with connection() as conn:
        conn.row_factory = sqlite3.Row
        conn.executescript(SCHEMA)
        row = conn.execute("SELECT * FROM incidents WHERE id=?", (incident_id,)).fetchone()
        return serialize(row) if row else None


def timeline(incident_id: int):
    with connection() as conn:
        conn.row_factory = sqlite3.Row
        conn.executescript(SCHEMA)
        return [serialize(row) for row in conn.execute("SELECT * FROM wazuh_alerts WHERE incident_id=? ORDER BY occurred_at, alert_id", (incident_id,))]

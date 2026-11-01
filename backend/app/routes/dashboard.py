"""
VYUH (CHAKRAVYUH) // Dashboard Snapshot API

Builds the SOC dashboard snapshot from live backend state:
  - shadow_worlds (in-memory per-attacker sessions)
  - telemetry_events (SQLite)
  - prod_auth_logs (east-west correlation)

This is the live-mode source of truth for the Next.js dashboard.
"""

from __future__ import annotations

import json
import sqlite3
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter

from app.core.shadow_world import (
    get_active_topology,
    get_all_shadow_worlds,
    prod_auth_logs,
)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

DB_PATH = Path(__file__).resolve().parents[2] / "data" / "vyuh_soc.db"

HONEYPOT_LAYOUT = [
    {
        "id": "hp-cowrie",
        "name": "cowrie-ssh",
        "host": "cowrie-ssh.hp.internal",
        "ip": "10.0.4.21",
        "type": "SSH",
        "x": 590,
        "y": 100,
        "protocols": ["ssh"],
    },
    {
        "id": "hp-web",
        "name": "web-decoy",
        "host": "web-decoy.hp.internal",
        "ip": "10.0.4.22",
        "type": "HTTP",
        "x": 590,
        "y": 225,
        "protocols": ["http"],
    },
    {
        "id": "hp-graphql",
        "name": "graphql-decoy",
        "host": "graphql-decoy.hp.internal",
        "ip": "10.0.4.23",
        "type": "GraphQL",
        "x": 590,
        "y": 350,
        "protocols": ["http"],
    },
    {
        "id": "hp-vault",
        "name": "vault-decoy",
        "host": "vault-decoy.hp.internal",
        "ip": "10.0.4.24",
        "type": "Object storage",
        "x": 590,
        "y": 485,
        "protocols": ["http"],
    },
]


def severity_for_level(level: int) -> str:
    if level >= 13:
        return "critical"
    if level >= 8:
        return "suspicious"
    return "info"


def severity_for_score(score: int) -> str:
    if score >= 90:
        return "critical"
    if score >= 60:
        return "suspicious"
    return "info"


def _to_iso(ts: str | None) -> str:
    if not ts:
        return datetime.now(timezone.utc).isoformat()
    if isinstance(ts, str) and "T" not in ts and ":" in ts:
        return f"{datetime.now(timezone.utc).date().isoformat()}T{ts}Z"
    return ts


def _events(conn: sqlite3.Connection) -> list[dict[str, Any]]:
    rows = conn.execute(
        "SELECT event_id, timestamp, stage, ip, wazuh_rule_id, wazuh_level, "
        "mitre_attack_id, mitre_engage_id, title, full_json "
        "FROM telemetry_events ORDER BY rowid DESC LIMIT 500"
    ).fetchall()

    destinations = {1: "edge-gw-01", 2: "cowrie-ssh", 3: "shadow-shell", 4: "vault-decoy"}
    out: list[dict[str, Any]] = []
    for row in rows:
        full = json.loads(row["full_json"]) if row["full_json"] else {}
        action = full.get("action", {}) or {}
        wazuh = full.get("wazuh", {}) or {}
        mitre = wazuh.get("mitreAttack", {}) or {}
        stage = int(row["stage"] or 0)
        protocol = "ssh" if stage == 3 else "http"
        destination = destinations.get(stage, "honeypot")
        out.append(
            {
                "id": row["event_id"],
                "timestamp": _to_iso(row["timestamp"]),
                "severity": severity_for_level(row["wazuh_level"] or 0),
                "sourceIp": row["ip"] or "unknown",
                "destination": destination,
                "destinationIp": "",
                "protocol": protocol,
                "eventType": "telemetry",
                "description": row["title"] or action.get("title") or "honeypot telemetry",
                "ruleId": str(row["wazuh_rule_id"] or 100500),
                "ruleLevel": row["wazuh_level"] or 3,
                "mitreId": mitre.get("id") or row["mitre_attack_id"] or "—",
                "mitreTactic": mitre.get("name") or "—",
                "mitreTechnique": (wazuh.get("mitreEngage", {}) or {}).get("id")
                or row["mitre_engage_id"]
                or "—",
                "honeypot": destination,
                "raw": full if full else None,
            }
        )
    return out


def build_live_snapshot() -> dict[str, Any]:
    sessions = get_all_shadow_worlds()
    topology = get_active_topology()

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    events = _events(conn)
    event_rows = conn.execute(
        "SELECT stage, wazuh_level, ip, event_id FROM telemetry_events"
    ).fetchall()
    conn.close()

    # --- metrics ------------------------------------------------------------
    total_attacks = len(event_rows)
    active_attackers = len(sessions)
    captured_sessions = sum(1 for s in sessions if s["highest_stage"] >= 3)
    critical_alerts = sum(
        1 for e in events if e["severity"] == "critical"
    )

    # --- attackers / nodes / connections ------------------------------------
    ip_attempts: Counter[str] = Counter(r["ip"] for r in event_rows if r["ip"])

    attackers: list[dict[str, Any]] = []
    nodes: list[dict[str, Any]] = []
    connections: list[dict[str, Any]] = []
    now_iso = datetime.now(timezone.utc).isoformat()

    for idx, sess in enumerate(sessions):
        ip = sess["current_ip"]
        stage = sess["highest_stage"]
        severity = severity_for_score(sess["threat_score"])
        status = "Contained" if sess["plausible_waf_drop"] else "Active"
        node_id = f"attacker-live-{idx}"
        first_seen = datetime.now(timezone.utc).timestamp() - sess["dwell_time_seconds"]
        first_seen_iso = datetime.fromtimestamp(first_seen, tz=timezone.utc).isoformat()
        attackers.append(
            {
                "id": node_id,
                "ip": ip,
                "firstSeen": first_seen_iso,
                "lastSeen": now_iso,
                "attempts": ip_attempts.get(ip, max(1, sess["command_count"])),
                "honeypots": ["cowrie-ssh", "vault-decoy"],
                "protocols": ["http", "ssh"],
                "severity": severity,
                "status": "active" if status == "Active" else "contained",
                "ja4h": sess.get("ja4h") or sess["http_fingerprint"],
            }
        )
        nodes.append(
            {
                "id": node_id,
                "label": ip,
                "ip": ip,
                "kind": "attacker",
                "severity": severity,
                "status": status,
                "x": 100,
                "y": 82 + idx * 90,
                "protocols": ["http", "ssh"],
                "connectionCount": 1,
                "firstSeen": first_seen_iso,
                "lastSeen": now_iso,
                "associatedHoneypot": "vault-decoy" if stage >= 4 else "cowrie-ssh",
                "threatClassification": f"stage-{stage}",
            }
        )
        # attacker -> honeypot edge based on progression
        target = (
            "hp-vault" if stage >= 4 else "hp-cowrie" if stage >= 2 else "edge-gw"
        )
        connections.append(
            {
                "id": f"e-live-att-{idx}",
                "source": node_id,
                "target": target,
                "severity": severity,
                "protocol": "http",
                "packets": ip_attempts.get(ip, 1),
                "lastSeen": now_iso,
                "label": f"Stage {stage} activity",
            }
        )

    # Static infrastructure nodes.
    nodes.extend(
        [
            {
                "id": "edge-gw",
                "label": "edge-gw-01",
                "ip": "10.0.0.1",
                "kind": "infrastructure",
                "severity": "info",
                "status": "Online",
                "x": 360,
                "y": 290,
                "protocols": ["https", "tcp"],
                "connectionCount": 2,
                "firstSeen": now_iso,
                "lastSeen": now_iso,
            },
            {
                "id": "wazuh",
                "label": "wazuh-manager",
                "ip": "10.0.0.5",
                "kind": "infrastructure",
                "severity": "info",
                "status": "Online",
                "x": 430,
                "y": 500,
                "protocols": ["tcp"],
                "connectionCount": 1,
                "firstSeen": now_iso,
                "lastSeen": now_iso,
            },
            {
                "id": "prod-web",
                "label": "prod-web-01",
                "ip": "10.0.1.10",
                "kind": "protected",
                "severity": "info",
                "status": "Protected",
                "x": 845,
                "y": 185,
                "protocols": ["https"],
                "connectionCount": 2,
                "firstSeen": now_iso,
                "lastSeen": now_iso,
            },
            {
                "id": "prod-db",
                "label": "prod-db-01",
                "ip": "10.0.1.20",
                "kind": "protected",
                "severity": "info",
                "status": "Protected",
                "x": 845,
                "y": 335,
                "protocols": ["tcp"],
                "connectionCount": 1,
                "firstSeen": now_iso,
                "lastSeen": now_iso,
            },
        ]
    )

    # Honeypot nodes + status.
    honeypots: list[dict[str, Any]] = []
    for hp in HONEYPOT_LAYOUT:
        hp_sev = "suspicious"
        hp_status = "online"
        if any(s["highest_stage"] >= 2 for s in sessions):
            hp_status = "under_attack"
        if any(s["highest_stage"] >= 3 for s in sessions):
            hp_status = "capturing"
        if hp["id"] == "hp-vault" and any(s["highest_stage"] >= 4 for s in sessions):
            hp_status = "under_attack"
            hp_sev = "critical"
        nodes.append(
            {
                "id": hp["id"],
                "label": hp["name"],
                "ip": hp["ip"],
                "kind": "honeypot",
                "severity": hp_sev,
                "status": hp_status,
                "x": hp["x"],
                "y": hp["y"],
                "protocols": hp["protocols"],
                "connectionCount": 1,
                "firstSeen": now_iso,
                "lastSeen": now_iso,
                "associatedHoneypot": hp["name"],
            }
        )
        honeypots.append(
            {
                "id": hp["id"],
                "name": hp["name"],
                "host": hp["host"],
                "ip": hp["ip"],
                "type": hp["type"],
                "status": hp_status,
                "sessions": captured_sessions,
                "interactions": total_attacks,
                "lastActivity": now_iso,
                "severity": hp_sev,
                "protocols": hp["protocols"],
            }
        )

    # Structural edges.
    connections.extend(
        [
            {
                "id": "e-live-struct-1",
                "source": "edge-gw",
                "target": "hp-cowrie",
                "severity": "info",
                "protocol": "tcp",
                "packets": 0,
                "lastSeen": now_iso,
                "label": "Forwarded traffic",
            },
            {
                "id": "e-live-struct-2",
                "source": "edge-gw",
                "target": "prod-web",
                "severity": "info",
                "protocol": "https",
                "packets": 0,
                "lastSeen": now_iso,
                "label": "Production traffic",
            },
            {
                "id": "e-live-struct-3",
                "source": "prod-web",
                "target": "prod-db",
                "severity": "info",
                "protocol": "tcp",
                "packets": 0,
                "lastSeen": now_iso,
                "label": "Query path",
            },
            {
                "id": "e-live-struct-4",
                "source": "hp-cowrie",
                "target": "wazuh",
                "severity": "info",
                "protocol": "tcp",
                "packets": len(events),
                "lastSeen": now_iso,
                "label": "Wazuh alert transport",
            },
        ]
    )

    # --- alerts -------------------------------------------------------------
    alerts: list[dict[str, Any]] = []
    seen_alerts: set[tuple[str, str]] = set()

    def add_alert(alert: dict[str, Any]) -> None:
        key = (alert["title"], alert.get("sourceIp") or "")
        if key not in seen_alerts:
            seen_alerts.add(key)
            alerts.append(alert)

    for sess in sessions:
        if sess.get("prod_correlated"):
            add_alert(
                {
                    "id": f"alert-prod-{sess['http_fingerprint'][:6]}",
                    "severity": "critical",
                    "title": "Production overlap detected",
                    "detail": (
                        f"{sess['current_ip']} matched prior failed SSH attempts on "
                        "real-prod-db-01 before entering the labyrinth."
                    ),
                    "sourceIp": sess["current_ip"],
                    "ruleId": "100510",
                }
            )
    for e in events:
        raw = e.get("raw") or {}
        attacker = raw.get("attacker", {}) or {}
        if attacker.get("tokenShared") or attacker.get("token_shared"):
            add_alert(
                {
                    "id": f"alert-share-{e['id'][:10]}",
                    "severity": "critical",
                    "title": "Syndicate token sharing",
                    "detail": "Honeytoken replayed from a different client fingerprint.",
                    "sourceIp": e["sourceIp"],
                    "ruleId": "100505",
                }
            )
        if attacker.get("topologyMutated") or attacker.get("topology_mutated"):
            add_alert(
                {
                    "id": f"alert-burn-{e['id'][:10]}",
                    "severity": "suspicious",
                    "title": "Burned breadcrumb replay",
                    "detail": "Invalidated breadcrumb replayed from a previous topology seed.",
                    "sourceIp": e["sourceIp"],
                    "ruleId": "100506",
                }
            )

    # --- analytics ----------------------------------------------------------
    severity_counts = Counter(e["severity"] for e in events)
    severity = [
        {"label": "Critical", "value": severity_counts.get("critical", 0)},
        {"label": "Suspicious", "value": severity_counts.get("suspicious", 0)},
        {"label": "Informational", "value": severity_counts.get("info", 0)},
    ]
    target_counts = Counter(e["destination"] for e in events)
    targeted_honeypots = [
        {"label": name, "value": count}
        for name, count in target_counts.most_common()
    ]
    protocol_counts = Counter(e["protocol"] for e in events)
    protocols = [
        {"label": name, "value": count}
        for name, count in protocol_counts.most_common()
    ]

    hour_buckets: dict[str, int] = defaultdict(int)
    for e in events:
        hour = e["timestamp"][11:13] if "T" in e["timestamp"] else "00"
        hour_buckets[hour] += 1
    volume = [
        {"label": f"{h:02d}:00", "value": hour_buckets.get(f"{h:02d}", 0)}
        for h in range(24)
    ]
    sessions_series = [
        {"label": f"{h:02d}:00", "value": 0} for h in range(0, 24, 3)
    ]

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": "wazuh-live",
        "metrics": {
            "totalAttacks": total_attacks,
            "activeAttackers": active_attackers,
            "capturedSessions": captured_sessions,
            "criticalAlerts": critical_alerts,
        },
        "nodes": nodes,
        "connections": connections,
        "events": events,
        "attackers": attackers,
        "honeypots": honeypots,
        "alerts": alerts,
        "analytics": {
            "volume": volume,
            "severity": severity,
            "targetedHoneypots": targeted_honeypots,
            "protocols": protocols,
            "sessions": sessions_series,
        },
    }


@router.get("/snapshot")
def dashboard_snapshot() -> dict[str, Any]:
    return build_live_snapshot()

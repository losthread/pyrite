from __future__ import annotations

import json
import os
import re
import sqlite3
import time
from collections import Counter
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter

from ..core.intelligence import DB_PATH
from ..core.shadow_world import get_all_shadow_worlds

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

# Only surface telemetry from the most recent window so a reload does not replay
# stale attacks forever. The window is evaluated against each event's embedded
# epoch timestamp (`evt_<epoch_ms>_<...>`), not the wall-clock string.
EVENT_WINDOW_MINUTES = int(os.getenv("VYUH_EVENT_WINDOW_MINUTES", "30"))
EVENT_WINDOW_MS = EVENT_WINDOW_MINUTES * 60_000

# The four-stage deception fleet exposed to the SOC.
HONEYPOTS = [
    {
        "id": "hp-cowrie",
        "name": "cowrie-ssh",
        "host": "cowrie-ssh.hp.internal",
        "ip": "10.0.4.21",
        "type": "SSH",
        "protocols": ["ssh"],
        "x": 500,
        "y": 150,
    },
    {
        "id": "hp-web",
        "name": "web-decoy",
        "host": "web-decoy.hp.internal",
        "ip": "10.0.4.22",
        "type": "HTTP",
        "protocols": ["http"],
        "x": 500,
        "y": 270,
    },
    {
        "id": "hp-graphql",
        "name": "graphql-decoy",
        "host": "graphql-decoy.hp.internal",
        "ip": "10.0.4.23",
        "type": "GraphQL",
        "protocols": ["http"],
        "x": 500,
        "y": 390,
    },
    {
        "id": "hp-vault",
        "name": "vault-decoy",
        "host": "vault-decoy.hp.internal",
        "ip": "10.0.4.24",
        "type": "Object storage",
        "protocols": ["http"],
        "x": 500,
        "y": 510,
    },
]

# Which decoy receives the telemetry for each stage of the attack chain.
STAGE_HONEYPOT = {
    1: ("hp-web", "web-decoy"),
    2: ("hp-web", "web-decoy"),
    3: ("hp-cowrie", "cowrie-ssh"),
    4: ("hp-vault", "vault-decoy"),
}

# Endpoint hints win over the stage default. Polymorphic personas route the same
# stage through different decoys (Morph-v2.0 sends stage 2 to the GraphQL debug
# gateway, stage 4 to the object-storage vault), so attribution must follow the
# endpoint the attacker actually hit.
ENDPOINT_TARGETS: tuple[tuple[str, tuple[str, str]], ...] = (
    ("graphql", ("hp-graphql", "graphql-decoy")),
    ("treasury", ("hp-vault", "vault-decoy")),
    ("/s3/", ("hp-vault", "vault-decoy")),
    ("vault", ("hp-vault", "vault-decoy")),
    ("etcd", ("hp-vault", "vault-decoy")),
    ("shell", ("hp-cowrie", "cowrie-ssh")),
    ("cowrie", ("hp-cowrie", "cowrie-ssh")),
    ("ssh", ("hp-cowrie", "cowrie-ssh")),
)

# Stable left-to-right ordering for edges and chips.
DECOY_ORDER = ("web-decoy", "graphql-decoy", "cowrie-ssh", "vault-decoy")

HONEYPOT_IDS = {hp["name"]: hp["id"] for hp in HONEYPOTS}


def _event_epoch_ms(raw: dict[str, Any]) -> int:
    event_id = str(raw.get("eventId", ""))
    match = re.match(r"evt_(\d{13})", event_id)
    if match:
        try:
            return int(match.group(1))
        except ValueError:
            return 0
    return 0


def _event_ts_ms(raw: dict[str, Any]) -> int:
    """Best-effort event timestamp: embedded epoch id, else parsed wall clock."""
    epoch = _event_epoch_ms(raw)
    if epoch > 0:
        return epoch

    value = str(raw.get("timestamp", "")).strip()
    if not value:
        return 0

    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S"):
        try:
            parsed = datetime.strptime(value, fmt).replace(tzinfo=timezone.utc)
            return int(parsed.timestamp() * 1000)
        except ValueError:
            continue

    for fmt in ("%H:%M:%S.%f", "%H:%M:%S"):
        try:
            parsed = datetime.strptime(value, fmt)
            now = datetime.now(timezone.utc)
            parsed = parsed.replace(
                year=now.year, month=now.month, day=now.day, tzinfo=timezone.utc
            )
            return int(parsed.timestamp() * 1000)
        except ValueError:
            continue
    return 0


def _event_level(raw: dict[str, Any]) -> int:
    try:
        return int((raw.get("wazuh") or {}).get("level") or 0)
    except (TypeError, ValueError):
        return 0


def _event_stage(raw: dict[str, Any]) -> int:
    try:
        return int(raw.get("stage") or 0)
    except (TypeError, ValueError):
        return 0


def _event_endpoint(raw: dict[str, Any]) -> str:
    return str((raw.get("action") or {}).get("endpoint") or "")


def _resolve_target(stage: int, endpoint: str = "") -> tuple[str, str]:
    """Return (honeypot id, honeypot name) for the decoy that received an event."""
    haystack = str(endpoint or "").lower()
    for needle, target in ENDPOINT_TARGETS:
        if needle in haystack:
            return target
    return STAGE_HONEYPOT.get(stage, ("hp-web", "web-decoy"))


def get_all_db_events(limit: int = 5000) -> list[dict[str, Any]]:
    """Read every persisted telemetry frame (oldest rows are trimmed by LIMIT)."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT full_json FROM telemetry_events ORDER BY rowid DESC LIMIT ?",
            (limit,),
        )
        rows = cursor.fetchall()
        conn.close()
    except Exception:
        return []

    events: list[dict[str, Any]] = []
    for (payload,) in rows:
        try:
            raw = json.loads(payload)
        except Exception:
            continue
        if isinstance(raw, dict):
            events.append(raw)
    return events


def _severity(level: int) -> str:
    if level >= 13:
        return "critical"
    if level >= 8:
        return "suspicious"
    return "info"


def _session_is_recent(session: dict[str, Any], now_epoch: float) -> bool:
    """Drop in-memory shadow worlds that have not been touched inside the window."""
    try:
        last_seen = datetime.strptime(
            str(session.get("last_seen", "")), "%Y-%m-%dT%H:%M:%SZ"
        ).replace(tzinfo=timezone.utc)
        return now_epoch - last_seen.timestamp() <= (EVENT_WINDOW_MS / 1000)
    except Exception:
        return False


def _session_epoch_ms(session: dict[str, Any]) -> int:
    try:
        last_seen = datetime.strptime(
            str(session.get("last_seen", "")), "%Y-%m-%dT%H:%M:%SZ"
        ).replace(tzinfo=timezone.utc)
        return int(last_seen.timestamp() * 1000)
    except Exception:
        return 0


def _build_analytics(
    all_events: list[dict[str, Any]],
    recent_events: list[dict[str, Any]],
    sessions: list[dict[str, Any]],
    now_ms: int,
) -> dict[str, Any]:
    """Derive every chart series from persisted telemetry, never from constants."""
    contained_times = [
        _session_epoch_ms(s)
        for s in sessions
        if s.get("plausible_waf_drop") and _session_epoch_ms(s) > 0
    ]

    def build_series(range_ms: int, buckets: int, label_fmt: str) -> list[dict[str, Any]]:
        bucket_ms = max(1, range_ms // buckets)
        start = now_ms - bucket_ms * buckets
        series: list[dict[str, Any]] = []
        for index in range(buckets):
            lower = start + index * bucket_ms
            upper = lower + bucket_ms
            bucket = [
                event
                for event in all_events
                if lower <= _event_ts_ms(event) < upper
            ]
            label = datetime.fromtimestamp(lower / 1000, tz=timezone.utc).strftime(
                label_fmt
            )
            series.append(
                {
                    "time": label,
                    "attacks": len(bucket),
                    "critical": sum(1 for e in bucket if _event_level(e) >= 13),
                    "contained": sum(
                        1 for ts in contained_times if lower <= ts < upper
                    ),
                }
            )
        return series

    series = {
        "1H": build_series(60 * 60_000, 6, "%H:%M"),
        "24H": build_series(24 * 60 * 60_000, 12, "%H:%M"),
        "7D": build_series(7 * 24 * 60 * 60_000, 7, "%a"),
    }

    severity_counts = {"Critical": 0, "Suspicious": 0, "Informational": 0}
    honeypot_counts: Counter[str] = Counter()
    protocol_counts: Counter[str] = Counter()
    for raw in recent_events:
        level = _event_level(raw)
        if level >= 13:
            severity_counts["Critical"] += 1
        elif level >= 8:
            severity_counts["Suspicious"] += 1
        else:
            severity_counts["Informational"] += 1

        stage = _event_stage(raw)
        target_id, target_name = _resolve_target(stage, _event_endpoint(raw))
        honeypot_counts[target_name] += 1
        protocol_counts["SSH" if target_id == "hp-cowrie" else "HTTP"] += 1

    # Unique attacker IPs per 5-minute slice of the live window.
    session_series: list[dict[str, Any]] = []
    slice_ms = 5 * 60_000
    start = now_ms - slice_ms * 6
    for index in range(6):
        lower = start + index * slice_ms
        upper = lower + slice_ms
        ips = {
            str((raw.get("attacker") or {}).get("ip") or "")
            for raw in recent_events
            if lower <= _event_ts_ms(raw) < upper
        }
        ips.discard("")
        session_series.append(
            {
                "label": datetime.fromtimestamp(
                    lower / 1000, tz=timezone.utc
                ).strftime("%H:%M"),
                "value": len(ips),
            }
        )

    one_hour = [{"label": point["time"], "value": point["attacks"]} for point in series["1H"]]

    return {
        "series": series,
        "volume": one_hour,
        "severity": [
            {"label": label, "value": value}
            for label, value in severity_counts.items()
        ],
        "targetedHoneypots": [
            {"label": label, "value": value}
            for label, value in honeypot_counts.most_common()
            if value > 0
        ],
        "protocols": [
            {"label": label, "value": value}
            for label, value in protocol_counts.most_common()
            if value > 0
        ],
        "sessions": session_series,
    }


def build_snapshot() -> dict[str, Any]:
    now_iso = datetime.now(timezone.utc).isoformat()
    now_ms = int(time.time() * 1000)
    all_db_events = get_all_db_events()
    raw_events = [
        raw
        for raw in all_db_events
        if 0 < now_ms - _event_ts_ms(raw) <= EVENT_WINDOW_MS
    ]
    total_db_events = len(raw_events)
    critical_db_events = sum(1 for r in raw_events if _event_level(r) >= 13)

    sessions = [
        s for s in get_all_shadow_worlds() if _session_is_recent(s, time.time())
    ]

    total_attacks = max(
        total_db_events, sum(s.get("command_count", 0) for s in sessions)
    )
    critical_alerts = critical_db_events

    def interactions_for(honeypot_id: str) -> int:
        return sum(
            1
            for raw in raw_events
            if _resolve_target(_event_stage(raw), _event_endpoint(raw))[0]
            == honeypot_id
        )

    # Decoy fleet + Wazuh manager (always present on the grid).
    nodes: list[dict[str, Any]] = []
    for hp in HONEYPOTS:
        interactions = interactions_for(hp["id"])
        nodes.append(
            {
                "id": hp["id"],
                "label": hp["name"],
                "ip": hp["ip"],
                "kind": "honeypot",
                "severity": "suspicious" if interactions > 0 else "info",
                "status": "Capturing" if interactions > 0 else "Online",
                "x": hp["x"],
                "y": hp["y"],
                "protocols": hp["protocols"],
                "connectionCount": interactions,
                "firstSeen": now_iso,
                "lastSeen": now_iso,
                "associatedHoneypot": hp["name"],
            }
        )
    nodes.append(
        {
            "id": "wazuh",
            "label": "wazuh-manager",
            "ip": "10.0.0.5",
            "kind": "infrastructure",
            "severity": "info",
            "status": "Online",
            "x": 820,
            "y": 270,
            "protocols": ["tcp"],
            "connectionCount": total_attacks,
            "firstSeen": now_iso,
            "lastSeen": now_iso,
        }
    )

    connections: list[dict[str, Any]] = []
    attackers: list[dict[str, Any]] = []
    events: list[dict[str, Any]] = []

    # Reconstruct attacker entities from the recent telemetry window. Shadow
    # worlds are in-memory, so a backend restart must not wipe attacker nodes:
    # any recent event recreates the attacker with correct honeypot edges, and
    # a live session (when present) enriches it with threat score and status.
    attacker_groups: dict[str, dict[str, Any]] = {}
    for raw in raw_events:
        attacker = raw.get("attacker", {}) or {}
        ip = str(attacker.get("ip") or "").strip()
        if not ip or ip == "SYSTEM_INTERNAL":
            continue
        stage = _event_stage(raw)
        ts_ms = _event_ts_ms(raw)
        group = attacker_groups.setdefault(
            ip,
            {
                "ip": ip,
                "ja4h": attacker.get("ja4h"),
                "events": 0,
                "stages": set(),
                "decoys": set(),
                "first_ms": ts_ms,
                "last_ms": ts_ms,
                "max_level": 0,
            },
        )
        group["events"] += 1
        group["stages"].add(stage)
        group["decoys"].add(_resolve_target(stage, _event_endpoint(raw))[1])
        group["first_ms"] = min(group["first_ms"], ts_ms)
        group["last_ms"] = max(group["last_ms"], ts_ms)
        group["max_level"] = max(group["max_level"], _event_level(raw))
        if attacker.get("ja4h") and not group["ja4h"]:
            group["ja4h"] = attacker.get("ja4h")

    sessions_by_ja4h = {str(s.get("ja4h")): s for s in sessions if s.get("ja4h")}
    sessions_by_ip = {
        str(s.get("current_ip") or s.get("initial_ip") or ""): s
        for s in sessions
    }

    # Sessions with no events inside the window still surface (freshly idle).
    for session in sessions:
        ip = str(session.get("current_ip") or session.get("initial_ip") or "")
        if ip and ip not in attacker_groups:
            attacker_groups[ip] = {
                "ip": ip,
                "ja4h": session.get("ja4h"),
                "events": 0,
                "stages": {int(session.get("highest_stage", 0) or 0)},
                "decoys": set(),
                "first_ms": _session_epoch_ms(session),
                "last_ms": _session_epoch_ms(session),
                "max_level": 0,
            }

    # Most recent attacker first so the graph and tables lead with live activity.
    ordered_attackers = sorted(
        attacker_groups.values(), key=lambda g: g["last_ms"], reverse=True
    )

    for idx, group in enumerate(ordered_attackers):
        ip = group["ip"]
        # Stable per-IP id so graph nodes and selections survive snapshot polls.
        att_id = f"attacker-{re.sub(r'[^0-9a-zA-Z]+', '-', ip).strip('-')}"
        session = sessions_by_ja4h.get(str(group["ja4h"])) or sessions_by_ip.get(ip)
        session_stage = (
            int(session.get("highest_stage", 0) or 0) if session else 0
        )
        stages = set(group["stages"]) | {session_stage}
        highest_stage = max(stages) if stages else 0

        if session:
            first_seen = session.get("last_seen", now_iso)
            last_seen = session.get("last_seen", now_iso)
        else:
            first_seen = datetime.fromtimestamp(
                group["first_ms"] / 1000, tz=timezone.utc
            ).strftime("%Y-%m-%dT%H:%M:%SZ")
            last_seen = datetime.fromtimestamp(
                group["last_ms"] / 1000, tz=timezone.utc
            ).strftime("%Y-%m-%dT%H:%M:%SZ")

        critical = (session and session.get("threat_score", 0) >= 80) or (
            group["max_level"] >= 13
        )
        sev = "critical" if critical else "suspicious"
        contained = bool(session and session.get("plausible_waf_drop"))
        attempts = max(
            group["events"],
            (session.get("command_count", 0) if session else 0),
        )
        protocols = ["tcp", "http"]
        if highest_stage >= 3:
            protocols.append("ssh")
        # Only the decoys this attacker actually reached, in a stable order.
        touched = [name for name in DECOY_ORDER if name in group["decoys"]]
        if not touched:
            touched = [_resolve_target(highest_stage)[1]]
        if "cowrie-ssh" in touched and "ssh" not in protocols:
            protocols.append("ssh")

        nodes.append(
            {
                "id": att_id,
                "label": ip,
                "ip": ip,
                "kind": "attacker",
                "severity": sev,
                "status": "Contained" if contained else "Active",
                "x": 120,
                "y": 150 + (idx * 90),
                "protocols": protocols,
                "connectionCount": attempts,
                "firstSeen": first_seen,
                "lastSeen": last_seen,
                "associatedHoneypot": touched[-1],
                "threatClassification": "Adversary Session",
            }
        )
        for hp_name in touched:
            connections.append(
                {
                    "id": f"{att_id}-{HONEYPOT_IDS[hp_name]}",
                    "source": att_id,
                    "target": HONEYPOT_IDS[hp_name],
                    "severity": sev,
                    "protocol": "ssh" if hp_name == "cowrie-ssh" else "http",
                    "packets": attempts,
                    "lastSeen": last_seen,
                    "label": "Observed Intrusion",
                }
            )
        attackers.append(
            {
                "id": att_id,
                "ip": ip,
                "firstSeen": first_seen,
                "lastSeen": last_seen,
                "attempts": attempts,
                "honeypots": touched,
                "protocols": protocols,
                "severity": sev,
                "status": "contained" if contained else "active",
                "ja4h": (session.get("ja4h") if session else group["ja4h"])
                or "not-captured",
            }
        )

    active_attackers = sum(1 for a in attackers if a["status"] == "active")
    captured_sessions = sum(1 for a in attackers if a["status"] == "contained")

    for raw in raw_events:
        action = raw.get("action", {}) or {}
        attacker = raw.get("attacker", {}) or {}
        wazuh = raw.get("wazuh", {}) or {}
        level = int(wazuh.get("level", 0) or 0)
        stage = _event_stage(raw)
        destination_id, destination = _resolve_target(stage, _event_endpoint(raw))
        destination_ip = next(
            (hp["ip"] for hp in HONEYPOTS if hp["id"] == destination_id),
            "10.0.4.22",
        )
        events.append(
            {
                "id": raw.get("eventId", f"evt-{len(events)}"),
                "timestamp": raw.get("timestamp", now_iso),
                "severity": _severity(level),
                "sourceIp": attacker.get("ip", "185.220.101.4"),
                "destination": destination,
                "destinationIp": destination_ip,
                "protocol": "ssh" if destination_id == "hp-cowrie" else "http",
                "eventType": action.get("title", "SOC_TELEMETRY"),
                "description": wazuh.get(
                    "description", action.get("title", "Telemetry Event")
                ),
                "ruleId": str(wazuh.get("ruleId", "100501")),
                "ruleLevel": level,
                "mitreId": (wazuh.get("mitreAttack", {}) or {}).get(
                    "id", "T1595"
                ),
                "mitreTactic": "Active Deception",
                "mitreTechnique": (wazuh.get("mitreAttack", {}) or {}).get(
                    "name", "Deception Controls"
                ),
                "mitreAttack": wazuh.get("mitreAttack"),
                "mitreD3fend": wazuh.get("mitreD3fend"),
                "mitreEngage": wazuh.get("mitreEngage"),
                "honeypot": destination,
                "sessionId": attacker.get("ja4h"),
                "raw": raw,
            }
        )

    honeypots: list[dict[str, Any]] = []
    for hp in HONEYPOTS:
        interactions = interactions_for(hp["id"])
        honeypots.append(
            {
                "id": hp["id"],
                "name": hp["name"],
                "host": hp["host"],
                "ip": hp["ip"],
                "type": hp["type"],
                "status": "capturing" if interactions > 0 else "online",
                "sessions": active_attackers if interactions > 0 else 0,
                "interactions": interactions,
                "lastActivity": now_iso,
                "severity": "critical"
                if hp["id"] == "hp-vault" and interactions > 0
                else ("suspicious" if interactions > 0 else "info"),
                "protocols": hp["protocols"],
            }
        )

    analytics = _build_analytics(all_db_events, raw_events, sessions, now_ms)

    return {
        "generatedAt": now_iso,
        "source": "pyrite-live",
        "wazuh": {
            "connected": True,
            "verified": total_db_events,
            "node": os.getenv("WAZUH_INDEXER_URL", "https://10.46.34.107:9200"),
        },
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
        "alerts": [],
        "analytics": analytics,
    }


@router.get("/snapshot")
def dashboard_snapshot() -> dict[str, Any]:
    return build_snapshot()

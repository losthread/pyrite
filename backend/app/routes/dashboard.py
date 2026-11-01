from __future__ import annotations

import json
import os
import re
import sqlite3
import time
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


def _event_epoch_ms(raw: dict[str, Any]) -> int:
    event_id = str(raw.get("eventId", ""))
    match = re.match(r"evt_(\d{13})", event_id)
    if match:
        try:
            return int(match.group(1))
        except ValueError:
            return 0
    return 0


def get_real_db_events() -> tuple[int, int, list[dict[str, Any]]]:
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT full_json FROM telemetry_events ORDER BY rowid DESC LIMIT 200")
        rows = cursor.fetchall()
        conn.close()

        now_ms = int(time.time() * 1000)
        recent: list[dict[str, Any]] = []
        for (payload,) in rows:
            try:
                raw = json.loads(payload)
            except Exception:
                continue
            if now_ms - _event_epoch_ms(raw) <= EVENT_WINDOW_MS:
                recent.append(raw)

        total_count = len(recent)
        critical_count = sum(
            1 for r in recent if (r.get("wazuh", {}) or {}).get("level", 0) >= 13
        )
        return total_count, critical_count, recent
    except Exception:
        return 0, 0, []


def _severity(level: int) -> str:
    if level >= 13:
        return "critical"
    if level >= 8:
        return "suspicious"
    return "info"


def build_snapshot() -> dict[str, Any]:
    now_iso = datetime.now(timezone.utc).isoformat()
    total_db_events, critical_db_events, raw_events = get_real_db_events()
    sessions = get_all_shadow_worlds()

    total_attacks = max(total_db_events, sum(s.get("command_count", 0) for s in sessions))
    active_attackers = len([s for s in sessions if not s.get("plausible_waf_drop")])
    captured_sessions = len([s for s in sessions if s.get("plausible_waf_drop")])
    critical_alerts = critical_db_events

    # Decoy fleet + Wazuh manager (always present on the grid).
    nodes: list[dict[str, Any]] = []
    for hp in HONEYPOTS:
        interactions = sum(
            1 for r in raw_events if r.get("stage") in (2, 3, 4) and hp["id"] in ("hp-cowrie", "hp-web", "hp-graphql", "hp-vault")
        )
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

    for idx, s in enumerate(sessions):
        att_id = f"attacker-real-{idx + 1}"
        ip = s.get("current_ip") or s.get("initial_ip") or "185.220.101.4"
        sev = "critical" if s.get("threat_score", 0) >= 80 else "suspicious"
        stage = s.get("highest_stage", 0)
        target = "hp-vault" if stage >= 4 else "hp-cowrie"
        nodes.append(
            {
                "id": att_id,
                "label": ip,
                "ip": ip,
                "kind": "attacker",
                "severity": sev,
                "status": "Contained" if s.get("plausible_waf_drop") else "Active",
                "x": 120,
                "y": 150 + (idx * 90),
                "protocols": ["tcp", "ssh"],
                "connectionCount": s.get("command_count", 0),
                "firstSeen": s.get("last_seen", now_iso),
                "lastSeen": s.get("last_seen", now_iso),
                "associatedHoneypot": "cowrie-ssh",
                "threatClassification": "Adversary Session",
            }
        )
        connections.append(
            {
                "id": f"e-real-{idx + 1}",
                "source": att_id,
                "target": target,
                "severity": sev,
                "protocol": "tcp",
                "packets": s.get("command_count", 0),
                "lastSeen": s.get("last_seen", now_iso),
                "label": "Observed Intrusion",
            }
        )
        attackers.append(
            {
                "id": att_id,
                "ip": ip,
                "firstSeen": s.get("last_seen", now_iso),
                "lastSeen": s.get("last_seen", now_iso),
                "attempts": s.get("command_count", 0),
                "honeypots": ["cowrie-ssh"],
                "protocols": ["tcp", "ssh"],
                "severity": sev,
                "status": "contained" if s.get("plausible_waf_drop") else "active",
                "ja4h": s.get("ja4h", "not-captured"),
            }
        )

    for raw in raw_events:
        action = raw.get("action", {}) or {}
        attacker = raw.get("attacker", {}) or {}
        wazuh = raw.get("wazuh", {}) or {}
        level = wazuh.get("level", 0)
        stage = raw.get("stage", 0)
        destination = {
            1: "edge-gw-01",
            2: "cowrie-ssh",
            3: "shadow-shell",
            4: "vault-decoy",
        }.get(stage, "cowrie-ssh")
        events.append(
            {
                "id": raw.get("eventId", f"evt-{len(events)}"),
                "timestamp": raw.get("timestamp", now_iso),
                "severity": _severity(level),
                "sourceIp": attacker.get("ip", "185.220.101.4"),
                "destination": destination,
                "destinationIp": "10.0.4.21",
                "protocol": "ssh" if stage == 3 else "http",
                "eventType": action.get("title", "SOC_TELEMETRY"),
                "description": wazuh.get("description", action.get("title", "Telemetry Event")),
                "ruleId": str(wazuh.get("ruleId", "100501")),
                "ruleLevel": level,
                "mitreId": (wazuh.get("mitreAttack", {}) or {}).get("id", "T1595"),
                "mitreTactic": "Active Deception",
                "mitreTechnique": (wazuh.get("mitreAttack", {}) or {}).get("name", "Deception Controls"),
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
        hp_events = sum(
            1 for r in raw_events if r.get("stage") == 4 and hp["id"] == "hp-vault"
        )
        honeypots.append(
            {
                "id": hp["id"],
                "name": hp["name"],
                "host": hp["host"],
                "ip": hp["ip"],
                "type": hp["type"],
                "status": "capturing" if hp_events > 0 or (hp["id"] == "hp-cowrie" and total_attacks > 0) else "online",
                "sessions": active_attackers if hp["id"] == "hp-cowrie" else 0,
                "interactions": hp_events if hp["id"] == "hp-vault" else (total_attacks if hp["id"] == "hp-cowrie" else 0),
                "lastActivity": now_iso,
                "severity": "critical" if hp_events > 0 else ("suspicious" if total_attacks > 0 and hp["id"] == "hp-cowrie" else "info"),
                "protocols": hp["protocols"],
            }
        )

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
        "analytics": {
            "volume": [{"label": now_iso[11:16], "value": total_attacks}],
            "severity": [
                {"label": "Critical", "value": critical_alerts},
                {"label": "Suspicious", "value": total_attacks - critical_alerts if total_attacks > critical_alerts else 0},
                {"label": "Informational", "value": 0},
            ],
            "targetedHoneypots": [
                {"label": "cowrie-ssh", "value": total_attacks},
                {"label": "vault-decoy", "value": sum(1 for r in raw_events if r.get("stage") == 4)},
            ],
            "protocols": [{"label": "TCP", "value": total_attacks}],
            "sessions": [{"label": now_iso[11:16], "value": active_attackers}],
        },
    }


@router.get("/snapshot")
def dashboard_snapshot() -> dict[str, Any]:
    return build_snapshot()

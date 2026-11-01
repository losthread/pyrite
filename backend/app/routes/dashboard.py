from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter

from ..core.intelligence import DB_PATH
from ..core.shadow_world import get_all_shadow_worlds

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


def get_real_db_events() -> tuple[int, int, list[dict[str, Any]]]:
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM telemetry_events")
        total_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM telemetry_events WHERE wazuh_level >= 13")
        critical_count = cursor.fetchone()[0]

        cursor.execute("SELECT full_json FROM telemetry_events ORDER BY id DESC LIMIT 50")
        rows = cursor.fetchall()
        events = []
        for r in rows:
            try:
                events.append(json.loads(r[0]))
            except Exception:
                pass
        conn.close()
        return total_count, critical_count, events
    except Exception:
        return 0, 0, []


def build_snapshot() -> dict[str, Any]:
    now_iso = datetime.now(timezone.utc).isoformat()
    total_db_events, critical_db_events, raw_events = get_real_db_events()
    sessions = get_all_shadow_worlds()

    total_attacks = max(total_db_events, sum(s.get("command_count", 1) for s in sessions))
    active_attackers = len([s for s in sessions if not s.get("plausible_waf_drop")])
    captured_sessions = len([s for s in sessions if s.get("plausible_waf_drop")])
    critical_alerts = critical_db_events

    # Decoy and Infrastructure Nodes (always present on grid)
    nodes = [
        {
            "id": "hp-cowrie",
            "label": "cowrie-ssh",
            "ip": "10.0.4.21",
            "kind": "honeypot",
            "severity": "info",
            "status": "Online",
            "x": 500,
            "y": 270,
            "protocols": ["ssh"],
            "connectionCount": len(sessions),
            "firstSeen": now_iso,
            "lastSeen": now_iso,
            "associatedHoneypot": "cowrie-ssh",
        },
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
            "connectionCount": 1 if total_attacks > 0 else 0,
            "firstSeen": now_iso,
            "lastSeen": now_iso,
        },
    ]

    connections = []
    attackers = []
    events = []

    # Map real shadow world sessions if any exist
    for idx, s in enumerate(sessions):
        att_id = f"attacker-real-{idx+1}"
        ip = s.get("current_ip") or s.get("initial_ip") or "185.220.101.4"
        sev = "critical" if s.get("threat_score", 0) >= 80 else "suspicious"
        nodes.append({
            "id": att_id,
            "label": ip,
            "ip": ip,
            "kind": "attacker",
            "severity": sev,
            "status": "Contained" if s.get("plausible_waf_drop") else "Active",
            "x": 120,
            "y": 270 + (idx * 90),
            "protocols": ["tcp", "ssh"],
            "connectionCount": s.get("command_count", 1),
            "firstSeen": s.get("last_seen", now_iso),
            "lastSeen": s.get("last_seen", now_iso),
            "associatedHoneypot": "cowrie-ssh",
            "threatClassification": "Adversary Session",
        })
        connections.append({
            "id": f"e-real-{idx+1}",
            "source": att_id,
            "target": "hp-cowrie",
            "severity": sev,
            "protocol": "tcp",
            "packets": s.get("command_count", 1),
            "lastSeen": s.get("last_seen", now_iso),
            "label": "Observed Intrusion",
        })
        attackers.append({
            "id": att_id,
            "ip": ip,
            "firstSeen": s.get("last_seen", now_iso),
            "lastSeen": s.get("last_seen", now_iso),
            "attempts": s.get("command_count", 1),
            "honeypots": ["cowrie-ssh"],
            "protocols": ["tcp", "ssh"],
            "severity": sev,
            "status": "contained" if s.get("plausible_waf_drop") else "active",
            "ja4h": s.get("ja4h", "not-captured"),
        })

    # Map real persisted telemetry events if any exist
    for raw in raw_events:
        action = raw.get("action", {})
        attacker = raw.get("attacker", {})
        wazuh = raw.get("wazuh", {})
        events.append({
            "id": raw.get("eventId", f"evt-{len(events)}"),
            "timestamp": raw.get("timestamp", now_iso),
            "severity": "critical" if wazuh.get("level", 0) >= 13 else "high",
            "sourceIp": attacker.get("ip", "185.220.101.4"),
            "destination": action.get("endpoint", "cowrie-ssh"),
            "destinationIp": "10.0.4.21",
            "protocol": "TCP",
            "eventType": action.get("title", "SOC_TELEMETRY"),
            "description": wazuh.get("description", action.get("title", "Telemetry Event")),
            "ruleId": str(wazuh.get("ruleId", "100501")),
            "ruleLevel": wazuh.get("level", 10),
            "mitreId": wazuh.get("mitreAttack", {}).get("id", "T1595"),
            "mitreTactic": "Active Deception",
            "mitreTechnique": wazuh.get("mitreAttack", {}).get("name", "Deception Controls"),
            "honeypot": action.get("endpoint", "cowrie-ssh"),
            "sessionId": attacker.get("ja4h"),
            "raw": raw,
        })

    return {
        "generatedAt": now_iso,
        "source": "pyrite-live",
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
        "honeypots": [
            {
                "id": "hp-cowrie",
                "name": "cowrie-ssh",
                "host": "cowrie-ssh.hp.internal",
                "ip": "10.0.4.21",
                "type": "SSH",
                "status": "under_attack" if total_attacks > 0 else "online",
                "sessions": active_attackers,
                "interactions": total_attacks,
                "lastActivity": now_iso,
                "severity": "critical" if critical_alerts > 0 else "info",
                "protocols": ["ssh"],
            }
        ],
        "alerts": [],
        "analytics": {
            "volume": [{"label": now_iso[11:16], "value": total_attacks}],
            "severity": [
                {"label": "Critical", "value": critical_alerts},
                {"label": "Suspicious", "value": total_attacks - critical_alerts if total_attacks > critical_alerts else 0},
                {"label": "Informational", "value": 0},
            ],
            "targetedHoneypots": [{"label": "cowrie-ssh", "value": total_attacks}],
            "protocols": [{"label": "TCP", "value": total_attacks}],
            "sessions": [{"label": now_iso[11:16], "value": active_attackers}],
        },
    }


@router.get("/snapshot")
def dashboard_snapshot() -> dict[str, Any]:
    return build_snapshot()

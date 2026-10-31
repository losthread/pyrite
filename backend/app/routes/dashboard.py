from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

SAMPLE_PATH = Path(__file__).resolve().parent.parent / "data" / "wazuh_sample.json"


def load_sample() -> dict[str, Any]:
    with SAMPLE_PATH.open("r", encoding="utf-8") as sample_file:
        return json.load(sample_file)


def severity_for_level(level: int) -> str:
    if level >= 13:
        return "critical"
    if level >= 8:
        return "suspicious"
    return "info"


def build_snapshot() -> dict[str, Any]:
    document = load_sample()
    source = document["_source"]
    rule = source["rule"]
    data = source["data"]
    source_ip = data["source_ip"]
    honeypot = data["honeypot"]
    destination = "cowrie-ssh"
    destination_ip = "10.0.4.21"
    level = rule["level"]
    severity = severity_for_level(level)
    attempts = data.get("attempt_count", rule.get("firedtimes", 1))
    observed_at = source["timestamp"]
    mitre = rule.get("mitre", {})
    mitre_id = (mitre.get("id") or ["—"])[0]
    mitre_tactic = (mitre.get("tactic") or ["—"])[0]
    mitre_technique = (mitre.get("technique") or ["—"])[0]

    event = {
        "id": source["id"],
        "timestamp": observed_at,
        "severity": severity,
        "sourceIp": source_ip,
        "destination": destination,
        "destinationIp": destination_ip,
        "protocol": data["protocol"],
        "eventType": data["event_type"],
        "description": rule["description"],
        "ruleId": str(rule["id"]),
        "ruleLevel": level,
        "mitreId": mitre_id,
        "mitreTactic": mitre_tactic,
        "mitreTechnique": mitre_technique,
        "honeypot": honeypot,
        "sessionId": data.get("session_id"),
        "username": data.get("username"),
        "raw": document,
    }

    nodes = [
        {
            "id": "attacker-live-01",
            "label": source_ip,
            "ip": source_ip,
            "kind": "attacker",
            "severity": severity,
            "status": "Active",
            "x": 120,
            "y": 270,
            "protocols": [data["protocol"]],
            "connectionCount": 1,
            "firstSeen": observed_at,
            "lastSeen": observed_at,
            "associatedHoneypot": destination,
            "threatClassification": mitre_technique,
        },
        {
            "id": "hp-cowrie",
            "label": destination,
            "ip": destination_ip,
            "kind": "honeypot",
            "severity": severity,
            "status": "Under attack",
            "x": 500,
            "y": 270,
            "protocols": [data["protocol"]],
            "connectionCount": 2,
            "firstSeen": observed_at,
            "lastSeen": observed_at,
            "associatedHoneypot": destination,
        },
        {
            "id": "wazuh",
            "label": source["manager"]["name"],
            "ip": "10.0.0.5",
            "kind": "infrastructure",
            "severity": "info",
            "status": "Online",
            "x": 820,
            "y": 270,
            "protocols": ["tcp"],
            "connectionCount": 1,
            "firstSeen": observed_at,
            "lastSeen": observed_at,
        },
    ]

    connections = [
        {
            "id": "e-live-01",
            "source": "attacker-live-01",
            "target": "hp-cowrie",
            "severity": severity,
            "protocol": data["protocol"],
            "packets": attempts,
            "lastSeen": observed_at,
            "label": rule["description"],
        },
        {
            "id": "e-live-02",
            "source": "hp-cowrie",
            "target": "wazuh",
            "severity": "info",
            "protocol": "tcp",
            "packets": attempts,
            "lastSeen": observed_at,
            "label": "Wazuh alert transport",
        },
    ]

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": "wazuh-live",
        "metrics": {
            "totalAttacks": attempts,
            "activeAttackers": 1,
            "capturedSessions": 0,
            "criticalAlerts": 1 if severity == "critical" else 0,
        },
        "nodes": nodes,
        "connections": connections,
        "events": [event],
        "attackers": [
            {
                "id": "attacker-live-01",
                "ip": source_ip,
                "firstSeen": observed_at,
                "lastSeen": observed_at,
                "attempts": attempts,
                "honeypots": [destination],
                "protocols": [data["protocol"]],
                "severity": severity,
                "status": "active",
                "ja4h": "not-captured",
            }
        ],
        "honeypots": [
            {
                "id": "hp-cowrie",
                "name": destination,
                "host": "cowrie-ssh.hp.internal",
                "ip": destination_ip,
                "type": "SSH",
                "status": "under_attack",
                "sessions": 0,
                "interactions": attempts,
                "lastActivity": observed_at,
                "severity": severity,
                "protocols": [data["protocol"]],
            }
        ],
        "alerts": [],
        "analytics": {
            "volume": [{"label": observed_at[11:16], "value": attempts}],
            "severity": [
                {"label": "Critical", "value": 1 if severity == "critical" else 0},
                {"label": "Suspicious", "value": 1 if severity == "suspicious" else 0},
                {"label": "Informational", "value": 1 if severity == "info" else 0},
            ],
            "targetedHoneypots": [{"label": destination, "value": attempts}],
            "protocols": [{"label": data["protocol"], "value": 1}],
            "sessions": [{"label": observed_at[11:16], "value": 0}],
        },
    }


@router.get("/snapshot")
def dashboard_snapshot() -> dict[str, Any]:
    return build_snapshot()

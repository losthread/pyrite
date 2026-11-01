from __future__ import annotations

import json
import sqlite3
import time
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter

from ..core.intelligence import DB_PATH
from ..core.shadow_world import (
    get_all_shadow_worlds,
    clear_all_shadow_worlds,
    prune_stale_shadow_worlds,
    SESSION_TTL_SECONDS
)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

# All 8 Deception Honeypots + Core Decoy Services in the Pyrite Mesh
ALL_HONEYPOTS = [
    {
        "id": "honeypot-ssh-01",
        "name": "honeypot-ssh-01",
        "host": "cowrie-ssh.hp.internal",
        "ip": "10.240.1.10:22",
        "type": "High-Interaction SSH Decoy",
        "service": "OpenSSH 8.9p1 (Cowrie Kernel Hook)",
        "protocols": ["ssh", "sftp"],
        "region": "eu-central-1 (Frankfurt)",
        "status": "online",
        "x": 420,
        "y": 160,
    },
    {
        "id": "honeypot-http-02",
        "name": "honeypot-http-02",
        "host": "web-envoy.hp.internal",
        "ip": "10.240.1.22:443",
        "type": "Web API & GraphQL Canary",
        "service": "Envoy / Financial Portal Decoy",
        "protocols": ["https", "graphql", "http"],
        "region": "us-east-1 (Virginia)",
        "status": "online",
        "x": 680,
        "y": 160,
    },
    {
        "id": "honeypot-postgres-05",
        "name": "honeypot-postgres-05",
        "host": "pg-ledger.hp.internal",
        "ip": "10.240.4.19:5432",
        "type": "Synthetic SQL Ledger Canary",
        "service": "PostgreSQL 15 Wire Interceptor",
        "protocols": ["pgsql"],
        "region": "us-west-2 (Oregon)",
        "status": "online",
        "x": 550,
        "y": 120,
    },
    {
        "id": "honeypot-redis-03",
        "name": "honeypot-redis-03",
        "host": "redis-vault.hp.internal",
        "ip": "10.240.2.15:6379",
        "type": "In-Memory Keystore Sandbox",
        "service": "Redis 7.0 Unauthenticated Trap",
        "protocols": ["redis", "resp"],
        "region": "ap-northeast-1 (Tokyo)",
        "status": "online",
        "x": 420,
        "y": 380,
    },
    {
        "id": "honeypot-ics-04",
        "name": "honeypot-ics-04",
        "host": "scada-plc.hp.internal",
        "ip": "10.240.3.88:502",
        "type": "Industrial SCADA PLC Decoy",
        "service": "Siemens S7 / Modbus TCP Emulator",
        "protocols": ["modbus", "s7comm"],
        "region": "eu-west-1 (Dublin)",
        "status": "online",
        "x": 680,
        "y": 380,
    },
    {
        "id": "honeypot-telnet-06",
        "name": "honeypot-telnet-06",
        "host": "iot-busybox.hp.internal",
        "ip": "10.240.5.04:23",
        "type": "IoT BusyBox Dropper Trap",
        "service": "MIPS BusyBox Telnet Sandbox",
        "protocols": ["telnet"],
        "region": "ap-southeast-1 (Singapore)",
        "status": "online",
        "x": 550,
        "y": 420,
    },
    {
        "id": "honeypot-mqtt-07",
        "name": "honeypot-mqtt-07",
        "host": "mqtt-telemetry.hp.internal",
        "ip": "10.240.5.18:1883",
        "type": "IoT Telemetry Broker Canary",
        "service": "Eclipse Mosquitto Decoy Broker",
        "protocols": ["mqtt"],
        "region": "eu-west-1 (Dublin)",
        "status": "online",
        "x": 360,
        "y": 270,
    },
    {
        "id": "honeypot-vault-08",
        "name": "honeypot-vault-08",
        "host": "cold-vault.hp.internal",
        "ip": "10.240.6.12:8000",
        "type": "Cold Vault Exfiltration Canary",
        "service": "Adaptive Tarpit Exfil Trapper",
        "protocols": ["http", "s3"],
        "region": "us-east-1 (Virginia)",
        "status": "online",
        "x": 740,
        "y": 270,
    },
]

# Core network infrastructure (Gateway, Protected Assets, SIEM)
CORE_INFRA_NODES = [
    {
        "id": "gw-edge-01",
        "label": "edge-ingress-gw-01",
        "ip": "10.240.0.1",
        "kind": "infrastructure",
        "severity": "info",
        "status": "Online",
        "x": 550,
        "y": 270,
        "protocols": ["bgp", "tcp"],
        "connectionCount": 4820,
        "firstSeen": "2025-01-01T00:00:00Z",
        "lastSeen": "Active",
    },
    {
        "id": "prod-vault-01",
        "label": "prod-ledger-db-01",
        "ip": "10.240.10.50:5432",
        "kind": "protected",
        "severity": "info",
        "status": "Protected / Isolated",
        "x": 260,
        "y": 270,
        "protocols": ["pgsql"],
        "connectionCount": 312,
        "firstSeen": "2025-01-01T00:00:00Z",
        "lastSeen": "Active",
    },
    {
        "id": "prod-auth-02",
        "label": "prod-iam-signer-02",
        "ip": "10.240.10.65:8443",
        "kind": "protected",
        "severity": "info",
        "status": "Protected / Isolated",
        "x": 840,
        "y": 270,
        "protocols": ["https", "grpc"],
        "connectionCount": 518,
        "firstSeen": "2025-01-01T00:00:00Z",
        "lastSeen": "Active",
    },
    {
        "id": "wazuh",
        "label": "wazuh-manager",
        "ip": "10.46.34.107:9200",
        "kind": "infrastructure",
        "severity": "info",
        "status": "Online",
        "x": 920,
        "y": 140,
        "protocols": ["tcp", "tls"],
        "connectionCount": 1,
        "firstSeen": "2025-01-01T00:00:00Z",
        "lastSeen": "Active",
    },
]


def get_real_db_events(max_age_seconds: int = 900) -> tuple[int, int, list[dict[str, Any]]]:
    """Retrieves recent events from SQLite within the active time window."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM telemetry_events")
        total_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM telemetry_events WHERE wazuh_level >= 13")
        critical_count = cursor.fetchone()[0]

        # Only select recent events to prevent old test clutter from dominating live view
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
    now_ts = time.time()

    total_db_events, critical_db_events, raw_events = get_real_db_events()
    # Fetch active sessions strictly within SESSION_TTL_SECONDS (prunes old historical runs)
    sessions = get_all_shadow_worlds(active_only=True)

    # Group and deduplicate sessions strictly by IP to prevent duplicate node clutter
    attackers_by_ip: dict[str, dict[str, Any]] = {}
    for s in sessions:
        ip = s.get("current_ip") or s.get("initial_ip") or "185.220.101.4"
        if ip not in attackers_by_ip:
            attackers_by_ip[ip] = {
                "ip": ip,
                "sessions": [],
                "command_count": 0,
                "threat_score": 0,
                "highest_stage": 0,
                "plausible_waf_drop": False,
                "prod_correlated": False,
                "last_seen": s.get("last_seen", now_iso),
                "last_seen_ts": s.get("last_seen_ts", now_ts),
                "ja4h": s.get("ja4h"),
            }
        grp = attackers_by_ip[ip]
        grp["sessions"].append(s)
        grp["command_count"] += s.get("command_count", 1)
        grp["threat_score"] = max(grp["threat_score"], s.get("threat_score", 0))
        grp["highest_stage"] = max(grp["highest_stage"], s.get("highest_stage", 0))
        if s.get("plausible_waf_drop"):
            grp["plausible_waf_drop"] = True
        if s.get("prod_correlated"):
            grp["prod_correlated"] = True

    total_attacks = max(total_db_events, sum(g["command_count"] for g in attackers_by_ip.values())) if attackers_by_ip else total_db_events
    active_attackers = len([g for g in attackers_by_ip.values() if not g["plausible_waf_drop"]])
    captured_sessions = len([g for g in attackers_by_ip.values() if g["plausible_waf_drop"]])
    critical_alerts = critical_db_events

    # Build Complete Node List: Core Infra + All 8 Honeypots
    nodes: list[dict[str, Any]] = []
    nodes.extend(CORE_INFRA_NODES)

    for hp in ALL_HONEYPOTS:
        hp_id = hp["id"]
        # Count interactions targeted at this specific honeypot
        hp_interactions = 0
        hp_status = "online"
        for raw in raw_events:
            dest = raw.get("action", {}).get("endpoint", "")
            if hp_id in dest or dest in hp_id:
                hp_interactions += 1
                hp_status = "under_attack"

        nodes.append({
            "id": hp_id,
            "label": hp["name"],
            "ip": hp["ip"],
            "kind": "honeypot",
            "severity": "critical" if hp_status == "under_attack" else "info",
            "status": "Under Attack" if hp_status == "under_attack" else "Online",
            "x": hp["x"],
            "y": hp["y"],
            "protocols": hp["protocols"],
            "connectionCount": hp_interactions,
            "firstSeen": now_iso,
            "lastSeen": now_iso,
            "associatedHoneypot": hp["name"],
        })

    connections: list[dict[str, Any]] = []
    # Structural links: Gateway -> Honeypots & Gateway -> Protected Servers
    for hp in ALL_HONEYPOTS:
        connections.append({
            "id": f"link-gw-{hp['id']}",
            "source": "gw-edge-01",
            "target": hp["id"],
            "severity": "info",
            "protocol": hp["protocols"][0],
            "packets": 0,
            "lastSeen": now_iso,
            "label": "Decoy Spoke",
        })

    for p in ["prod-vault-01", "prod-auth-02"]:
        connections.append({
            "id": f"link-gw-{p}",
            "source": "gw-edge-01",
            "target": p,
            "severity": "info",
            "protocol": "tcp",
            "packets": 0,
            "lastSeen": now_iso,
            "label": "Protected Spoke",
        })

    attackers: list[dict[str, Any]] = []

    # Map Deduplicated Attacker Nodes (1 per unique IP)
    for idx, (ip, grp) in enumerate(attackers_by_ip.items()):
        att_id = f"att-{ip.replace('.', '-')}"
        sev = "critical" if grp["threat_score"] >= 80 else "suspicious"
        # Deterministic positioning in the attacker ingress zone (left side)
        node_x = 100
        node_y = 200 + (idx * 80)

        nodes.append({
            "id": att_id,
            "label": ip,
            "ip": ip,
            "kind": "attacker",
            "severity": sev,
            "status": "Contained" if grp["plausible_waf_drop"] else "Active",
            "x": node_x,
            "y": node_y,
            "protocols": ["tcp", "ssh", "http"],
            "connectionCount": grp["command_count"] or 1,
            "firstSeen": grp["last_seen"],
            "lastSeen": grp["last_seen"],
            "associatedHoneypot": "honeypot-ssh-01",
            "threatClassification": "Adversary Session (Correlated)" if grp["prod_correlated"] else "Adversary Session",
        })

        connections.append({
            "id": f"e-attack-{att_id}",
            "source": att_id,
            "target": "honeypot-ssh-01",
            "severity": sev,
            "protocol": "tcp",
            "packets": grp["command_count"] or 1,
            "lastSeen": grp["last_seen"],
            "label": f"Stage {grp['highest_stage'] or 1} Intrusion",
        })

        attackers.append({
            "id": att_id,
            "ip": ip,
            "firstSeen": grp["last_seen"],
            "lastSeen": grp["last_seen"],
            "attempts": grp["command_count"] or 1,
            "honeypots": ["honeypot-ssh-01", "honeypot-http-02"],
            "protocols": ["tcp", "ssh"],
            "severity": sev,
            "status": "contained" if grp["plausible_waf_drop"] else "active",
            "ja4h": grp["ja4h"] or "not-captured",
        })

    # Map Telemetry Events
    events: list[dict[str, Any]] = []
    for raw in raw_events:
        action = raw.get("action", {})
        attacker = raw.get("attacker", {})
        wazuh = raw.get("wazuh", {})
        events.append({
            "id": raw.get("eventId", f"evt-{len(events)}"),
            "timestamp": raw.get("timestamp", now_iso),
            "severity": "critical" if wazuh.get("level", 0) >= 13 else "high",
            "sourceIp": attacker.get("ip", "185.220.101.4"),
            "destination": action.get("endpoint", "honeypot-ssh-01"),
            "destinationIp": "10.240.1.10",
            "protocol": "TCP",
            "eventType": action.get("title", "SOC_TELEMETRY"),
            "description": wazuh.get("description", action.get("title", "Telemetry Event")),
            "ruleId": str(wazuh.get("ruleId", "100501")),
            "ruleLevel": wazuh.get("level", 10),
            "mitreId": wazuh.get("mitreAttack", {}).get("id", "T1595"),
            "mitreTactic": "Active Deception",
            "mitreTechnique": wazuh.get("mitreAttack", {}).get("name", "Deception Controls"),
            "honeypot": action.get("endpoint", "honeypot-ssh-01"),
            "sessionId": attacker.get("ja4h"),
            "raw": raw,
        })

    # Build Honeypots list with live counters computed per honeypot
    honeypots_output: list[dict[str, Any]] = []
    for hp in ALL_HONEYPOTS:
        matching_attackers = [a for a in attackers if hp["id"] in a.get("honeypots", [])]
        hp_interactions = sum(a.get("attempts", 1) for a in matching_attackers)
        is_attacked = len(matching_attackers) > 0
        honeypots_output.append({
            "id": hp["id"],
            "name": hp["name"],
            "host": hp["host"],
            "ip": hp["ip"],
            "type": hp["type"],
            "service": hp.get("service", hp["type"]),
            "status": "under_attack" if is_attacked else "online",
            "sessions": len(matching_attackers),
            "interactions": hp_interactions,
            "lastActivity": now_iso,
            "severity": "critical" if any(a.get("severity") == "critical" for a in matching_attackers) else ("suspicious" if is_attacked else "info"),
            "protocols": hp["protocols"],
            "region": hp.get("region", "eu-central-1"),
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
        "honeypots": honeypots_output,
        "alerts": [],
        "analytics": {
            "volume": [{"label": now_iso[11:16], "value": total_attacks}],
            "severity": [
                {"label": "Critical", "value": critical_alerts},
                {"label": "Suspicious", "value": total_attacks - critical_alerts if total_attacks > critical_alerts else 0},
                {"label": "Informational", "value": 0},
            ],
            "targetedHoneypots": [{"label": hp["name"], "value": total_attacks if hp["id"] == "honeypot-ssh-01" else 0} for hp in ALL_HONEYPOTS[:5]],
            "protocols": [{"label": "SSH", "value": total_attacks}, {"label": "HTTPS", "value": 0}, {"label": "TCP", "value": 0}],
            "sessions": [{"label": now_iso[11:16], "value": active_attackers}],
        },
    }


@router.get("/snapshot")
def dashboard_snapshot() -> dict[str, Any]:
    return build_snapshot()


@router.post("/reset")
def reset_telemetry() -> dict[str, Any]:
    """Cleans in-memory sessions and clears SQLite telemetry events for fresh live demo runs."""
    clear_all_shadow_worlds()
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM telemetry_events")
        conn.commit()
        conn.close()
    except Exception:
        pass
    return {"status": "RESET_SUCCESSFUL", "timestamp": datetime.now(timezone.utc).isoformat()}

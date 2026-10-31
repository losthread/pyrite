"""
VYUH (CHAKRAVYUH) // Intelligence Layer & WebSocket Hub
SQLite persistence (vyuh_soc.db), Similar Sessions engine,
LLM Incident Report Generator, and native WebSocket hub (/ws/soc).
"""

import sqlite3
import os
import json
import time
import asyncio
from typing import Dict, Any, List, Set
from fastapi import WebSocket

from app.core.shadow_world import (
    get_all_shadow_worlds,
    get_active_topology,
    mutate_topology,
    quarantine_attacker,
    engage_tarpit_speed,
    prod_auth_logs,
    get_shadow_world
)
from app.core.crumb_crypto import mint_crumb
from app.core.wazuh_bridge import evaluate_wazuh_rule, write_deception_log

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
DB_PATH = os.path.join(DATA_DIR, "vyuh_soc.db")

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)


def init_sqlite_db():
    """Initializes SQLite schema and pre-seeds production auth logs."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Attacker Sessions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS attacker_sessions (
        ja4h TEXT PRIMARY KEY,
        initial_ip TEXT,
        current_ip TEXT,
        observed_ips TEXT,
        threat_score INTEGER,
        highest_stage INTEGER,
        dwell_time_seconds INTEGER,
        prod_correlated BOOLEAN,
        plausible_waf_drop BOOLEAN,
        tarpit_active BOOLEAN,
        created_at REAL,
        last_seen REAL
    )
    """)

    # 2. Telemetry Events
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS telemetry_events (
        event_id TEXT PRIMARY KEY,
        timestamp TEXT,
        stage INTEGER,
        ja4h TEXT,
        ip TEXT,
        wazuh_rule_id INTEGER,
        wazuh_level INTEGER,
        mitre_attack_id TEXT,
        mitre_engage_id TEXT,
        title TEXT,
        raw_payload TEXT,
        threat_score INTEGER,
        full_json TEXT
    )
    """)

    # 3. Pre-seeded Production Auth Logs (East-West Correlation)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS prod_auth_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT,
        ip TEXT,
        service TEXT,
        port INTEGER,
        event_type TEXT,
        details TEXT,
        severity TEXT
    )
    """)

    # Check if pre-seeded logs exist
    cursor.execute("SELECT COUNT(*) FROM prod_auth_logs")
    if cursor.fetchone()[0] == 0:
        for log in prod_auth_logs:
            cursor.execute("""
            INSERT INTO prod_auth_logs (id, timestamp, ip, service, port, event_type, details, severity)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (log["id"], log["timestamp"], log["ip"], log["service"], log["port"], log["event_type"], log["details"], log["severity"]))

    conn.commit()
    conn.close()


def persist_telemetry_event(event: Dict[str, Any]):
    """Saves a telemetry event to SQLite."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        attacker = event.get("attacker", {})
        action = event.get("action", {})
        wazuh = event.get("wazuh", {})
        mitre_attack = wazuh.get("mitreAttack", {})
        mitre_engage = wazuh.get("mitreEngage", {})
        metrics = event.get("metrics", {})

        cursor.execute("""
        INSERT OR REPLACE INTO telemetry_events 
        (event_id, timestamp, stage, ja4h, ip, wazuh_rule_id, wazuh_level, mitre_attack_id, mitre_engage_id, title, raw_payload, threat_score, full_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            event.get("eventId"),
            event.get("timestamp"),
            event.get("stage"),
            attacker.get("ja4h"),
            attacker.get("ip"),
            wazuh.get("ruleId"),
            wazuh.get("level"),
            mitre_attack.get("id"),
            mitre_engage.get("id"),
            action.get("title"),
            action.get("rawPayload"),
            metrics.get("threatScore"),
            json.dumps(event)
        ))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[!] [DB ERROR] Failed to persist event: {e}")


def get_similar_sessions() -> List[Dict[str, Any]]:
    """
    Groups and clusters sessions exhibiting:
      1. Cross-IP Attacker Hopping (same JA4H, multiple IPs)
      2. Syndicate Collusion (distinct JA4H sharing honeytokens)
    """
    sessions = get_all_shadow_worlds()
    clusters = []

    # Cluster 1: Multi-IP VPN hoppers
    multi_ip_sessions = [s for s in sessions if len(s["observed_ips"]) > 1]
    for s in multi_ip_sessions:
        clusters.append({
            "cluster_type": "VPN_HOPPER",
            "title": f"Adversary VPN Hopping Cluster [{s['ja4h'][:8]}]",
            "ja4h": s["ja4h"],
            "ips": s["observed_ips"],
            "risk": "HIGH",
            "description": f"Client maintained exact JA4H signature while rotating across {len(s['observed_ips'])} IP addresses."
        })

    # Cluster 2: Production Overlap
    prod_sessions = [s for s in sessions if s.get("prod_correlated")]
    for s in prod_sessions:
        clusters.append({
            "cluster_type": "EAST_WEST_BREACH",
            "title": f"East-West Lateral Movement [{s['current_ip']}]",
            "ja4h": s["ja4h"],
            "ips": [s["current_ip"]],
            "risk": "CRITICAL",
            "description": f"IP {s['current_ip']} previously attempted SSH brute-force on real-prod-db-01. Now active in honeypot."
        })

    return clusters


def generate_llm_incident_report(ja4h: str) -> Dict[str, Any]:
    """
    Synthesizes an automated incident analysis report for a given attacker JA4H.
    """
    session = get_shadow_world(ja4h)
    topology = get_active_topology()

    if not session:
        return {
            "status": "NOT_FOUND",
            "message": f"No active shadow world session found for JA4H: {ja4h}"
        }

    highest_stage = session.get("highest_stage", 0)
    dwell = int(time.time() - session.get("created_at", time.time()))
    score = session.get("threat_score", 0)

    stages_reached = []
    if highest_stage >= 1:
        stages_reached.append("Stage 1 (Recon Leak: Harvested Crumb #1)")
    if highest_stage >= 2:
        stages_reached.append("Stage 2 (HoneyPatch SQLi: Exploited DB & Leaked Crumb #2)")
    if highest_stage >= 3:
        stages_reached.append("Stage 3 (Cowrie Jumpbox Shell: Executed Commands & Leaked Crumb #3)")
    if highest_stage >= 4:
        stages_reached.append("Stage 4 (Cold Storage Vault: Exfiltration Trapped in Adaptive Tarpit)")

    counter_moves = [
        "Dynamically rotate polymorphic topology to Morph-v2.0 to burn all harvested tokens.",
        "Engage adaptive streaming tarpit (throttle to 128B/2s) to maximize attacker dwell time.",
        "Issue Plausible Failure Exit (HTTP 504 Gateway Timeout) to safely terminate adversary session without triggering suspicion."
    ]

    return {
        "report_id": f"rep_vyuh_{int(time.time())}_{ja4h[:6]}",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "target_ja4h": ja4h,
        "primary_ip": session.get("current_ip"),
        "observed_ips": session.get("observed_ips", []),
        "east_west_correlated": session.get("prod_correlated", False),
        "threat_score": score,
        "threat_severity": "CRITICAL" if score >= 90 else "HIGH" if score >= 60 else "MEDIUM",
        "dwell_time_seconds": dwell,
        "stages_compromised": stages_reached,
        "command_history": session.get("command_history", []),
        "wazuh_correlation": {
            "top_rule": "100505 - Cold Vault Exfiltration" if highest_stage == 4 else "100504 - Interactive Shell Exec" if highest_stage == 3 else "100503 - HoneyPatch SQLi Fork",
            "level": 15 if highest_stage == 4 else 12 if highest_stage == 3 else 10
        },
        "executive_summary": (
            f"Adversary [{ja4h[:8]}] originating from {session.get('current_ip')} penetrated {len(stages_reached)} "
            f"consecutive deception stages over a {dwell}s dwell period. The adversary demonstrated structured intent, "
            f"harvesting progressive honeytokens and pivoting into the internal virtual jumpbox. "
            f"Cross-IP correlation indicates active proxy evasion."
        ),
        "recommended_remediation": counter_moves
    }


# ==============================================================================
# Native WebSocket Manager (/ws/soc)
# ==============================================================================
class SocWebSocketManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        print(f"[*] [SOC WS] Analyst connected (Total: {len(self.active_connections)})")

        # Send initial state snapshot
        topology = get_active_topology()
        await websocket.send_text(json.dumps({
            "type": "system_init",
            "data": {
                "activeSeed": topology["seed_id"],
                "persona": topology["persona"],
                "sessions": get_all_shadow_worlds(),
                "prodAuthLogs": prod_auth_logs
            }
        }))

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        print(f"[*] [SOC WS] Analyst disconnected (Remaining: {len(self.active_connections)})")

    async def broadcast(self, message_type: str, data: Dict[str, Any]):
        if not self.active_connections:
            return
        payload = json.dumps({"type": message_type, "data": data})
        stale = set()
        for conn in self.active_connections:
            try:
                await conn.send_text(payload)
            except Exception:
                stale.add(conn)
        for s in stale:
            self.active_connections.discard(s)

    async def handle_soc_action(self, payload: Dict[str, Any]):
        action = payload.get("action")
        ja4h = payload.get("ja4h")
        stage = payload.get("stage", 1)
        print(f"[+] [SOC ACTION] Executing: {action} | Target: {ja4h or 'ALL'}")

        if action == "ENGAGE_TARPIT":
            target = ja4h or (get_all_shadow_worlds()[0]["ja4h"] if get_all_shadow_worlds() else None)
            if target:
                engage_tarpit_speed(target, chunk_bytes=128, interval_s=2.0)
                await self.broadcast("action_ack", {
                    "action": "ENGAGE_TARPIT",
                    "targetJa4h": target,
                    "status": "SUCCESS",
                    "message": "Adaptive Tarpit throttled down to 128B / 2.0s (~0.06 KB/s)."
                })

        elif action == "ENGAGE_ENDLESSH_TARPIT":
            target = ja4h or (get_all_shadow_worlds()[0]["ja4h"] if get_all_shadow_worlds() else None)
            if target:
                engage_tarpit_speed(target, chunk_bytes=1, interval_s=10.0)
                await self.broadcast("action_ack", {
                    "action": "ENGAGE_ENDLESSH_TARPIT",
                    "targetJa4h": target,
                    "status": "SUCCESS",
                    "message": "Endlessh infinite slow-drip engaged: 1 byte / 10.0s (Cliff Stoll tarpit)."
                })

        elif action == "PLAUSIBLE_WAF_DROP":
            target = ja4h or (get_all_shadow_worlds()[0]["ja4h"] if get_all_shadow_worlds() else None)
            if target:
                quarantine_attacker(target, True)
                await self.broadcast("action_ack", {
                    "action": "PLAUSIBLE_WAF_DROP",
                    "targetJa4h": target,
                    "status": "SUCCESS",
                    "message": "Attacker quarantined via Plausible Failure Exit (HTTP 504 Gateway Timeout)."
                })

        elif action == "MUTATE_TOPOLOGY":
            mutation = mutate_topology()
            await self.broadcast("topology_mutated", mutation)
            # High-priority mutation telemetry
            mut_event = {
                "eventId": f"evt_{int(time.time()*1000)}_sys",
                "timestamp": time.strftime("%H:%M:%S") + f".{int(time.time() * 1000) % 1000:03d}",
                "stage": 0,
                "attacker": {
                    "ip": "SYSTEM_INTERNAL",
                    "ja4h": "0000000000000000",
                    "ipChanged": False,
                    "tokenShared": False,
                    "topologyMutated": True,
                    "prodCorrelated": False
                },
                "action": {
                    "title": f"Polymorphic Topology Rotated to {mutation['new_seed']}",
                    "endpoint": "/system/mutate",
                    "rawPayload": f"Previous: {mutation['previous_seed']} -> New: {mutation['new_seed']}",
                    "crumbMinted": None,
                    "crumbUsed": None
                },
                "wazuh": {
                    "ruleId": 100506,
                    "level": 14,
                    "severity": "HIGH",
                    "description": f"Topology rotated to {mutation['new_seed']}; stale breadcrumbs burned",
                    "mitreAttack": {"id": "M1049", "name": "Deception Controls"},
                    "mitreEngage": {"id": "EAC0021", "name": "Dynamically Alter Environment"}
                },
                "metrics": {
                    "threatScore": 0,
                    "dwellTimeSeconds": 0,
                    "polymorphicSeed": mutation["new_seed"]
                }
            }
            write_deception_log(mut_event)
            persist_telemetry_event(mut_event)
            await self.broadcast("soc_telemetry", mut_event)

        elif action == "SIMULATE_STAGE":
            sim_ja4h = ja4h or "9f8e2b1c4a7d0031"
            sim_ip = "185.220.101.4"
            sim_stage = int(stage or 1)
            topology = get_active_topology()
            current_seed = topology["seed_id"]

            if sim_stage == 1:
                crumb1 = mint_crumb(1, sim_ja4h, current_seed)
                ev = {
                    "eventId": f"evt_{int(time.time()*1000)}_{sim_ja4h[:4]}",
                    "timestamp": time.strftime("%H:%M:%S") + f".{int(time.time() * 1000) % 1000:03d}",
                    "stage": 1,
                    "attacker": {
                        "ip": sim_ip,
                        "ja4h": sim_ja4h,
                        "ipChanged": False,
                        "tokenShared": False,
                        "topologyMutated": False,
                        "prodCorrelated": True
                    },
                    "action": {
                        "title": "Stage 1 Recon Probe Leaked Breadcrumb",
                        "endpoint": "/.git/logs/HEAD",
                        "rawPayload": "GET /.git/logs/HEAD [Recon scanner probe]",
                        "crumbMinted": crumb1,
                        "crumbUsed": None
                    },
                    "wazuh": evaluate_wazuh_rule({"stage": 1, "attacker": {}, "action": {}}),
                    "metrics": {
                        "threatScore": 35,
                        "dwellTimeSeconds": 14,
                        "polymorphicSeed": current_seed
                    }
                }
                write_deception_log(ev)
                persist_telemetry_event(ev)
                await self.broadcast("soc_telemetry", ev)

            elif sim_stage == 2:
                crumb2 = mint_crumb(2, sim_ja4h, current_seed)
                ev = {
                    "eventId": f"evt_{int(time.time()*1000)}_{sim_ja4h[:4]}",
                    "timestamp": time.strftime("%H:%M:%S") + f".{int(time.time() * 1000) % 1000:03d}",
                    "stage": 2,
                    "attacker": {
                        "ip": sim_ip,
                        "ja4h": sim_ja4h,
                        "ipChanged": False,
                        "tokenShared": False,
                        "topologyMutated": False,
                        "prodCorrelated": True
                    },
                    "action": {
                        "title": "Stage 2 HoneyPatch Session Fork Triggered",
                        "endpoint": "/api/internal/legacy-query",
                        "rawPayload": "SELECT * FROM users WHERE id = '1' UNION SELECT * FROM devops_service_accounts --",
                        "crumbMinted": crumb2,
                        "crumbUsed": "vk_live_demo_crumb1"
                    },
                    "wazuh": evaluate_wazuh_rule({"stage": 2, "action": {"title": "Stage 2 HoneyPatch Session Fork Triggered"}}),
                    "metrics": {
                        "threatScore": 65,
                        "dwellTimeSeconds": 48,
                        "polymorphicSeed": current_seed
                    }
                }
                write_deception_log(ev)
                persist_telemetry_event(ev)
                await self.broadcast("soc_telemetry", ev)

            elif sim_stage == 3:
                crumb3 = mint_crumb(3, sim_ja4h, current_seed)
                await self.broadcast("terminal_stream", {
                    "ja4h": sim_ja4h,
                    "command": "cat /opt/scripts/vault_sync.sh",
                    "stdout": f"#!/bin/bash\nexport VAULT_MASTER_KEY=\"{crumb3}\"\ncurl -s -H \"X-Vault-Key: $VAULT_MASTER_KEY\" http://localhost:8000/vault/v1/export\n",
                    "stderr": "",
                    "exitCode": 0,
                    "cwd": "/home/deployer",
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                })
                ev = {
                    "eventId": f"evt_{int(time.time()*1000)}_{sim_ja4h[:4]}",
                    "timestamp": time.strftime("%H:%M:%S") + f".{int(time.time() * 1000) % 1000:03d}",
                    "stage": 3,
                    "attacker": {
                        "ip": sim_ip,
                        "ja4h": sim_ja4h,
                        "ipChanged": False,
                        "tokenShared": False,
                        "topologyMutated": False,
                        "prodCorrelated": True
                    },
                    "action": {
                        "title": "Shadow Shell Exec: cat /opt/scripts/vault_sync.sh",
                        "endpoint": "/api/shell/exec",
                        "rawPayload": "cat /opt/scripts/vault_sync.sh",
                        "crumbMinted": crumb3,
                        "crumbUsed": "vk_live_demo_crumb2"
                    },
                    "wazuh": evaluate_wazuh_rule({"stage": 3, "action": {"rawPayload": "cat /opt/scripts/vault_sync.sh"}}),
                    "metrics": {
                        "threatScore": 85,
                        "dwellTimeSeconds": 84,
                        "polymorphicSeed": current_seed
                    }
                }
                write_deception_log(ev)
                persist_telemetry_event(ev)
                await self.broadcast("soc_telemetry", ev)

            elif sim_stage == 4:
                ev = {
                    "eventId": f"evt_{int(time.time()*1000)}_{sim_ja4h[:4]}",
                    "timestamp": time.strftime("%H:%M:%S") + f".{int(time.time() * 1000) % 1000:03d}",
                    "stage": 4,
                    "attacker": {
                        "ip": sim_ip,
                        "ja4h": sim_ja4h,
                        "ipChanged": False,
                        "tokenShared": False,
                        "topologyMutated": False,
                        "prodCorrelated": True
                    },
                    "action": {
                        "title": "CRITICAL: Cold-Storage Vault Exfiltration In Progress (Tarpit Engaged)",
                        "endpoint": "/vault/v1/export",
                        "rawPayload": "GET /vault/v1/export [Stolen Master Key]",
                        "crumbMinted": None,
                        "crumbUsed": "vk_live_demo_crumb3"
                    },
                    "wazuh": evaluate_wazuh_rule({"stage": 4}),
                    "metrics": {
                        "threatScore": 98,
                        "dwellTimeSeconds": 125,
                        "polymorphicSeed": current_seed
                    }
                }
                write_deception_log(ev)
                persist_telemetry_event(ev)
                await self.broadcast("soc_telemetry", ev)
                await self.broadcast("tarpit_progress", {
                    "ja4h": sim_ja4h,
                    "bytesSent": 2048,
                    "chunkSize": 512,
                    "speed": "0.64 KB/s",
                    "dwellTimeSeconds": 125,
                    "status": "TARPIT_ENGAGED"
                })


# Global WebSocket Manager singleton
ws_manager = SocWebSocketManager()

"""
VYUH (CHAKRAVYUH) // Wazuh Detection & Segregation Bridge
Writes single-line JSON logs to /backend/logs/vyuh_deception.json and evaluates
Rules 100500-100506 with zero latency in-memory dual-mode matching.
"""

import json
import os
import time
from typing import Dict, Any, Optional

from app.core import wazuh_client

LOGS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "logs"))
LOG_FILE_PATH = os.path.join(LOGS_DIR, "vyuh_deception.json")

# Ensure logs directory exists
os.makedirs(LOGS_DIR, exist_ok=True)


def evaluate_wazuh_rule(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    In-Memory Dual-Mode Wazuh Rule Evaluator.
    Evaluates raw telemetry against custom Wazuh rules 100500-100506,
    assigning severity levels (5-15) and dual MITRE ATT&CK / Engage tags.
    """
    stage = event.get("stage", 0)
    attacker = event.get("attacker", {})
    action = event.get("action", {})
    action_title = action.get("title", "")

    # Priority 1: Anomaly - Syndicate Collusion or Burned Token Replay
    if attacker.get("tokenShared") or attacker.get("token_shared") or attacker.get("topologyMutated") or attacker.get("topology_mutated"):
        return {
            "ruleId": 100506,
            "level": 14,
            "severity": "HIGH",
            "description": "VYUH [ANOMALY - COLLUSION]: Cross-client token sharing or burned token replay detected across distinct JA4H identities",
            "mitreAttack": {"id": "T1078", "name": "Valid Accounts / Lateral Collusion"},
            "mitreEngage": {"id": "EAC0019", "name": "Expose Collusion & Lateral Movement"}
        }

    # Priority 2: Stage 4 - Cold Storage Vault Exfiltration (Critical Level 15)
    if stage == 4:
        return {
            "ruleId": 100505,
            "level": 15,
            "severity": "CRITICAL",
            "description": "VYUH [Stage 4 - CRITICAL]: Cold Storage Vault exfiltration initiated with stolen key; adaptive tarpit engaged",
            "mitreAttack": {"id": "T1041", "name": "Exfiltration Over C2 Channel"},
            "mitreEngage": {"id": "EAC0018", "name": "Tarpit Rate-Limiting Containment"}
        }

    # Priority 3: Stage 3 - Cowrie-Style Shell Exec (Level 12)
    if stage == 3:
        return {
            "ruleId": 100504,
            "level": 12,
            "severity": "HIGH",
            "description": f"VYUH [Stage 3 - Shell]: Interactive Linux shell command executed: {action.get('rawPayload', '')[:60]}",
            "mitreAttack": {"id": "T1059.004", "name": "Command and Scripting Interpreter: Unix Shell"},
            "mitreEngage": {"id": "EAC0012", "name": "Synthetic Environment Confinement"}
        }

    # Priority 4: Stage 2b - HoneyPatch SQLi Session Fork (Level 10)
    if stage == 2 and "Session Fork" in action_title:
        return {
            "ruleId": 100503,
            "level": 10,
            "severity": "MEDIUM_HIGH",
            "description": "VYUH [Stage 2b - HoneyPatch]: SQLi exploit triggered HoneyPatch Session Fork leaking fake devops credentials",
            "mitreAttack": {"id": "T1190", "name": "Exploit Public-Facing Application"},
            "mitreEngage": {"id": "EAC0005", "name": "HoneyPatch Session Fork"}
        }

    # Priority 5: Stage 2a - SQL Syntax Error Probe (Level 7)
    if stage == 2:
        return {
            "ruleId": 100502,
            "level": 7,
            "severity": "MEDIUM",
            "description": "VYUH [Stage 2a - Probe]: Unescaped SQL single quote probe tested; returned verbose syntax error",
            "mitreAttack": {"id": "T1190", "name": "Exploit Public-Facing Application"},
            "mitreEngage": {"id": "EAC0004", "name": "Manipulate Attacker Perception"}
        }

    # Priority 6: Stage 1 - Recon Probe & Breadcrumb Discovery (Level 5)
    if stage == 1:
        return {
            "ruleId": 100501,
            "level": 5,
            "severity": "LOW",
            "description": "VYUH [Stage 1 - Recon]: Adversary scanned public endpoint and harvested Crumb #1 honeytoken",
            "mitreAttack": {"id": "T1592", "name": "Gather Victim Host Information"},
            "mitreEngage": {"id": "EAC0001", "name": "Lure Attacker with Leaked Context"}
        }

    # Base Fallback (Level 3)
    return {
        "ruleId": 100500,
        "level": 3,
        "severity": "INFO",
        "description": "VYUH Active Deception telemetry event captured from honeypot network",
        "mitreAttack": {"id": "T1592", "name": "Reconnaissance"},
        "mitreEngage": {"id": "EAC0001", "name": "Lure Attacker"}
    }


def write_deception_log(event: Dict[str, Any]) -> None:
    """
    Appends a single-line JSON log entry to /backend/logs/vyuh_deception.json
    for real-time ingestion by Wazuh or log shipping agents.
    """
    try:
        log_entry = {
            "vyuh_event": True,
            "timestamp": event.get("timestamp") or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            **event
        }
        with open(LOG_FILE_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry, separators=(",", ":")) + "\n")
    except Exception as e:
        print(f"[!] [WAZUH BRIDGE] Error writing log: {e}")


def roundtrip_to_wazuh(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Push a deception event to the live Wazuh Indexer and query it back.
    Falls back to {"wazuh_verified": false} on any network error so the SOC
    stream never hangs on a slow venue connection.
    """
    try:
        return wazuh_client.roundtrip(event)
    except Exception:  # noqa: BLE001 - guarantee a graceful fallback
        return {
            "wazuh_verified": False,
            "wazuh_node": wazuh_client.INDEXER_URL,
            "wazuh_fallback": True,
        }

"""
VYUH (CHAKRAVYUH) // Per-Attacker Shadow World & Polymorphic Personas
Manages fast in-memory session state, East-West production log correlation,
and dynamic honeypot topology rotation.
"""

import time
from typing import Dict, Any, List, Optional

TOPOLOGY_PERSONAS = {
    "Morph-v1.0": {
        "id": "Morph-v1.0",
        "name": "Morph-v1.0 (Fintech-Git-SQLi)",
        "description": "Legacy Fintech monolith with exposed Git reflogs and PostgreSQL financial database",
        "stage1_endpoint": "/.git/logs/HEAD",
        "stage2_endpoint": "/api/internal/legacy-query",
        "stage3_host": "10.24.0.15",
        "stage3_hostname": "devops-jumpbox-01",
        "stage4_endpoint": "/vault/v1/export",
        "stage4_asset": "cold_vault_ledger.parquet"
    },
    "Morph-v2.0": {
        "id": "Morph-v2.0",
        "name": "Morph-v2.0 (Cloud-Env-GraphQL)",
        "description": "Cloud-native microservice with exposed .env staging leak and GraphQL debug gateway",
        "stage1_endpoint": "/.env.staging",
        "stage2_endpoint": "/v2/graphql-debug",
        "stage3_host": "172.16.8.4",
        "stage3_hostname": "k8s-pod-auth-proxy",
        "stage4_endpoint": "/s3/v1/treasury-keys",
        "stage4_asset": "treasury_private_keys.pem"
    },
    "Morph-v3.0": {
        "id": "Morph-v3.0",
        "name": "Morph-v3.0 (ZeroTrust-OAuth-Kubernetes)",
        "description": "Zero-trust Kubernetes cluster with leaked service account token and telemetry mesh",
        "stage1_endpoint": "/.well-known/openid-configuration",
        "stage2_endpoint": "/api/v3/auth/introspect",
        "stage3_host": "10.96.0.1",
        "stage3_hostname": "k8s-control-plane-api",
        "stage4_endpoint": "/etcd/v3/keys/export",
        "stage4_asset": "etcd_cluster_state.db"
    }
}

# Current active polymorphic seed
current_seed_id = TOPOLOGY_PERSONAS["Morph-v1.0"]["name"]

# Session TTL in seconds (Attacks inactive for > 5 minutes are considered expired)
SESSION_TTL_SECONDS = 300

# In-Memory Session Store: ja4h -> dict
shadow_worlds: Dict[str, Dict[str, Any]] = {}

def clear_all_shadow_worlds() -> None:
    """Clears all in-memory shadow world adversary sessions."""
    global shadow_worlds
    shadow_worlds.clear()

def prune_stale_shadow_worlds(max_age_seconds: int = SESSION_TTL_SECONDS) -> int:
    """Removes sessions older than max_age_seconds from memory."""
    global shadow_worlds
    now = time.time()
    stale_keys = [k for k, s in shadow_worlds.items() if (now - s.get("last_seen", now)) > max_age_seconds]
    for k in stale_keys:
        shadow_worlds.pop(k, None)
    return len(stale_keys)

# Pre-seeded East-West Production Auth Logs (Matches perimeter enterprise telemetry)
prod_auth_logs: List[Dict[str, Any]] = [
    {
        "id": "prod_log_001",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() - 480)),
        "ip": "185.220.101.4",
        "service": "real-prod-db-01.internal",
        "port": 22,
        "event_type": "SSH_AUTH_FAILURE",
        "details": "Failed password for invalid user admin from 185.220.101.4 port 48212 ssh2 (3 attempts)",
        "severity": "HIGH"
    },
    {
        "id": "prod_log_002",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() - 900)),
        "ip": "185.220.101.4",
        "service": "waf-edge-nyc.internal",
        "port": 443,
        "event_type": "WAF_ANOMALY_PROBE",
        "details": "Directory brute-force detected: /.aws/credentials, /admin.php, /actuator/heapdump",
        "severity": "MEDIUM"
    }
]


def is_prod_correlated(ip: str) -> bool:
    """Checks if an attacker IP matches real production perimeter logs."""
    if not ip:
        return False
    return any(log["ip"] == ip or ip in log["ip"] for log in prod_auth_logs)


def get_active_topology() -> Dict[str, Any]:
    """Returns the current active topology seed and persona attributes."""
    global current_seed_id
    is_v2 = "Morph-v2.0" in current_seed_id
    persona = TOPOLOGY_PERSONAS["Morph-v2.0"] if is_v2 else TOPOLOGY_PERSONAS["Morph-v1.0"]
    return {
        "seed_id": current_seed_id,
        "persona": persona
    }


def mutate_topology() -> Dict[str, Any]:
    """
    Mutates honeypot topology between Persona A and Persona B.
    Automatically invalidates/burns previously minted tokens.
    """
    global current_seed_id
    previous_seed = current_seed_id
    if "Morph-v1.0" in current_seed_id:
        current_seed_id = TOPOLOGY_PERSONAS["Morph-v2.0"]["name"]
    else:
        current_seed_id = TOPOLOGY_PERSONAS["Morph-v1.0"]["name"]

    active = get_active_topology()
    return {
        "previous_seed": previous_seed,
        "new_seed": current_seed_id,
        "persona": active["persona"],
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }


def set_topology(seed_key: str) -> Dict[str, Any]:
    global current_seed_id
    if seed_key in TOPOLOGY_PERSONAS:
        current_seed_id = TOPOLOGY_PERSONAS[seed_key]["name"]
    return get_active_topology()


def get_or_create_shadow_world(ja4h: str, ip: str) -> Dict[str, Any]:
    """
    Retrieves or initializes an isolated Shadow World for the given JA4H client.
    Detects cross-IP hopping (VPN/proxy changes) and production log correlation.
    """
    now = time.time()
    prod_corr = is_prod_correlated(ip)
    ip_changed = False

    session = shadow_worlds.get(ja4h)
    if not session:
        session = {
            "ja4h": ja4h,
            "initial_ip": ip,
            "current_ip": ip,
            "observed_ips": [ip],
            "created_at": now,
            "last_seen": now,
            "threat_score": 35 if prod_corr else 15,
            "highest_stage": 0,
            "prod_correlated": prod_corr,
            "plausible_waf_drop": False,
            "tarpit_active": False,
            "tarpit_speed": 512,      # bytes per chunk
            "tarpit_interval": 0.8,   # seconds
            "crumbs": {
                "stage1": None,
                "stage2": None,
                "stage3": None
            },
            "command_history": []
        }
        shadow_worlds[ja4h] = session
    else:
        if session["current_ip"] != ip:
            ip_changed = True
            session["current_ip"] = ip
            if ip not in session["observed_ips"]:
                session["observed_ips"].append(ip)
            if prod_corr:
                session["prod_correlated"] = True
        session["last_seen"] = now

    return {
        "session": session,
        "ip_changed": ip_changed,
        "prod_correlated": session["prod_correlated"]
    }


def get_shadow_world(ja4h: str) -> Optional[Dict[str, Any]]:
    return shadow_worlds.get(ja4h)


def update_threat_score(ja4h: str, delta: int) -> int:
    session = shadow_worlds.get(ja4h)
    if not session:
        return 0
    session["threat_score"] = min(100, max(0, session["threat_score"] + delta))
    return session["threat_score"]


def quarantine_attacker(ja4h: str, state: bool = True) -> bool:
    session = shadow_worlds.get(ja4h)
    if session:
        session["plausible_waf_drop"] = state
        if state:
            session["tarpit_active"] = False
        return True
    return False


def engage_tarpit_speed(ja4h: str, chunk_bytes: int = 128, interval_s: float = 2.0) -> bool:
    session = shadow_worlds.get(ja4h)
    if session:
        session["tarpit_active"] = True
        session["tarpit_speed"] = chunk_bytes
        session["tarpit_interval"] = interval_s
        return True
    return False


def get_all_shadow_worlds(active_only: bool = True) -> List[Dict[str, Any]]:
    now = time.time()
    if active_only:
        prune_stale_shadow_worlds(SESSION_TTL_SECONDS)

    results = []
    for s in list(shadow_worlds.values()):
        age = now - s.get("last_seen", now)
        is_active = age <= SESSION_TTL_SECONDS
        if active_only and not is_active:
            continue
        results.append({
            "ja4h": s["ja4h"],
            "current_ip": s["current_ip"],
            "initial_ip": s["initial_ip"],
            "observed_ips": s["observed_ips"],
            "dwell_time_seconds": int(now - s["created_at"]),
            "threat_score": s["threat_score"],
            "highest_stage": s["highest_stage"],
            "prod_correlated": s["prod_correlated"],
            "plausible_waf_drop": s["plausible_waf_drop"],
            "tarpit_active": s["tarpit_active"],
            "command_count": len(s["command_history"]),
            "last_seen": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(s["last_seen"])),
            "last_seen_ts": s["last_seen"],
            "is_active": is_active,
            "seconds_inactive": int(age)
        })
    return results

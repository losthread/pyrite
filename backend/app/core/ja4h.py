"""
VYUH (CHAKRAVYUH) // JA4H Client Fingerprinter
Deterministically computes a 16-character SHA-256 fingerprint from HTTP client attributes.
Enables Cross-IP Threat Attribution (tracking adversaries hopping VPNs/proxies).
"""

import hashlib
import os
from typing import Dict, Any
from fastapi import Request

# Demo-safe default: the simulation override is enabled so attack_sim.py can
# demonstrate syndicate collusion. In production set VYUH_ALLOW_SIM_OVERRIDE=false
# so adversaries cannot choose their own fingerprint.
ALLOW_SIM_OVERRIDE = os.getenv("VYUH_ALLOW_SIM_OVERRIDE", "true").lower() in {
    "1",
    "true",
    "yes",
}


def extract_client_identity(request: Request) -> Dict[str, Any]:
    """
    Extracts attacker IP and computes deterministic 16-character JA4H fingerprint.
    
    Attributes included:
      1. Attacker IP (supports X-Forwarded-For, X-Real-IP, and direct socket host)
      2. HTTP Protocol Version (e.g. 1.1, 2.0)
      3. Normalized User-Agent
      4. Normalized Accept-Language
      5. Raw Header Key Ordering Signature (excluding ephemeral proxy hops)
      6. Optional X-Client-Fingerprint override header for machine-switch / syndicate demos
    """
    # 1. IP extraction
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        raw_ip = forwarded.split(",")[0].strip()
    else:
        raw_ip = request.headers.get("x-real-ip") or (request.client.host if request.client else "127.0.0.1")

    # Normalize IPv6 mapped IPv4 ("127.0.0.1" from "::ffff:127.0.0.1")
    ip = raw_ip.replace("::ffff:", "") if raw_ip else "127.0.0.1"

    # 2. HTTP Version
    http_version = request.scope.get("http_version", "1.1")

    # 3. User-Agent
    user_agent = (request.headers.get("user-agent") or "generic-curl").strip().lower()

    # 4. Accept-Language
    accept_language = (request.headers.get("accept-language") or "none").strip().lower()

    # 5. Header Key Order
    # request.headers.raw is a list of (name_bytes, value_bytes) preserving wire order
    raw_header_keys = []
    excluded = [
        "x-forwarded-for", "x-real-ip", "host", "connection",
        "authorization", "x-debug-token", "x-ssh-token", "x-vault-key",
        "x-client-fingerprint", "cookie", "content-length", "content-type",
        "transfer-encoding", "accept-encoding",
    ]
    if hasattr(request, "headers") and hasattr(request.headers, "raw"):
        for name_bytes, _ in request.headers.raw:
            h_name = name_bytes.decode("latin1", errors="ignore").lower()
            if h_name not in excluded:
                raw_header_keys.append(h_name)
    else:
        for k in request.headers.keys():
            k_lower = k.lower()
            if k_lower not in excluded:
                raw_header_keys.append(k_lower)

    header_order_sig = ",".join(raw_header_keys[:10])

    # 6. Override header for syndicate / machine switch demo
    test_override = (
        request.headers.get("x-client-fingerprint") if ALLOW_SIM_OVERRIDE else None
    )
    is_override = bool(test_override)

    if is_override:
        canonical_input = f"override:{test_override}"
    else:
        canonical_input = f"v={http_version}|ua={user_agent}|lang={accept_language}|headers={header_order_sig}"

    ja4h = hashlib.sha256(canonical_input.encode("utf-8")).hexdigest()

    return {
        "ip": ip,
        "ja4h": ja4h,
        "raw_fingerprint": canonical_input,
        "is_override": is_override
    }

"""
VYUH (CHAKRAVYUH) // Stateless HMAC-SHA256 Self-Describing Breadcrumbs
Generates and verifies cryptographically signed honeytokens with zero database overhead.
Automatically detects:
  - Topology mutations (replaying tokens after seed rotation -> Burned Token tripwire)
  - Syndicate sharing / lateral tool switching (token used from non-matching JA4H)
  - Token expiration (> 900s)
"""

import hmac
import hashlib
import json
import base64
import time
import os
import re
from typing import Dict, Any, Optional

HMAC_SECRET = os.getenv("VYUH_CRUMB_SECRET", "vyuh_chakravyuh_master_hmac_secret_2026").encode("utf-8")
TOKEN_MAX_AGE_SECONDS = 900  # 15 minutes TTL


def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _base64url_decode(s: str) -> bytes:
    padding = 4 - (len(s) % 4)
    if padding != 4:
        s += "=" * padding
    return base64.urlsafe_b64decode(s.encode("utf-8"))


def mint_crumb(stage: int, ja4h: str, seed: Optional[str] = None) -> str:
    """
    Mints a self-describing, HMAC-SHA256 signed breadcrumb honeytoken.
    Format: vk_live_<base64url_payload>.<10_char_hex_sig>
    """
    payload = {
        "s": int(stage),
        "f": str(ja4h),
        "t": int(time.time() * 1000),
        "seed": str(seed or "Morph-v1.0 (Fintech-Git-SQLi)")
    }

    payload_json = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    b64_payload = _base64url_encode(payload_json)

    sig = hmac.new(HMAC_SECRET, b64_payload.encode("utf-8"), hashlib.sha256).hexdigest()[:10]
    return f"vk_live_{b64_payload}.{sig}"


def verify_crumb(token: Optional[str], current_ja4h: Optional[str], current_seed: Optional[str]) -> Dict[str, Any]:
    """
    Decodes and verifies an incoming breadcrumb token.
    Flags:
      - valid: bool
      - topology_mutated: bool (Burned token replay attempt)
      - token_shared: bool (Syndicate collusion / lateral handover)
      - expired: bool (> 900s)
    """
    if not token or not isinstance(token, str):
        return {
            "valid": False,
            "topology_mutated": False,
            "token_shared": False,
            "expired": False,
            "reason": "MISSING_TOKEN"
        }

    match = re.match(r"^vk_live_([A-Za-z0-9_-]+)\.([a-f0-9]{10})$", token.strip())
    if not match:
        return {
            "valid": False,
            "topology_mutated": False,
            "token_shared": False,
            "expired": False,
            "reason": "INVALID_TOKEN_FORMAT"
        }

    b64_payload, provided_sig = match.groups()

    # 1. Verify HMAC signature
    expected_sig = hmac.new(HMAC_SECRET, b64_payload.encode("utf-8"), hashlib.sha256).hexdigest()[:10]
    if not hmac.compare_digest(provided_sig, expected_sig):
        return {
            "valid": False,
            "topology_mutated": False,
            "token_shared": False,
            "expired": False,
            "reason": "INVALID_SIGNATURE"
        }

    # 2. Decode JSON payload
    try:
        raw_bytes = _base64url_decode(b64_payload)
        payload = json.loads(raw_bytes.decode("utf-8"))
    except Exception:
        return {
            "valid": False,
            "topology_mutated": False,
            "token_shared": False,
            "expired": False,
            "reason": "CORRUPTED_PAYLOAD"
        }

    # 3. Expiration check (> 900s)
    token_time_s = (payload.get("t", 0)) / 1000.0
    age_seconds = time.time() - token_time_s
    expired = age_seconds > TOKEN_MAX_AGE_SECONDS

    # 4. Topology Mutation Check (Burned Token)
    topology_mutated = bool(current_seed and payload.get("seed") != current_seed)

    # 5. Attacker Fingerprint Check (Syndicate Collusion)
    token_shared = bool(current_ja4h and payload.get("f") != current_ja4h)

    return {
        "valid": True,
        "stage": payload.get("s"),
        "original_ja4h": payload.get("f"),
        "minted_at": payload.get("t"),
        "seed": payload.get("seed"),
        "topology_mutated": topology_mutated,
        "token_shared": token_shared,
        "expired": expired,
        "reason": "TOKEN_EXPIRED" if expired else None,
        "payload": payload
    }

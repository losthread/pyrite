"""
VYUH (CHAKRAVYUH) // JA4H HTTP Client Fingerprinter

Implements the FoxIO JA4H specification for HTTP/1.x and HTTP/2 requests:

    JA4H = {method}{version}{cookie}{referer}{header_count}{language}
           _{header_hash}_{cookie_hash}_{cookie_value_hash}

The `ja4h` value is a per-request forensic fingerprint (a probabilistic signal,
never proof of identity). A separate, stable `http_fingerprint` — built from
attributes that do not change between honeypot stages — is used for session
continuity and honeytoken binding, since true JA4H legitimately varies when the
client sends different auth headers on each trap stage.
"""

import hashlib
import os
from typing import Any, Dict

from fastapi import Request

# The X-Client-Fingerprint simulation override is a demo/testing hook and must
# be disabled outside isolated testing.
ALLOW_SIM_OVERRIDE = os.getenv("VYUH_ALLOW_SIM_OVERRIDE", "false").lower() in {
    "1",
    "true",
    "yes",
}

# Trusting X-Forwarded-For / X-Real-IP requires a trusted reverse proxy that
# strips client-supplied values. Off by default.
TRUST_PROXY = os.getenv("TRUST_PROXY", "false").lower() in {"1", "true", "yes"}

# Headers excluded from the *stable* http_fingerprint header-order signature.
# These change between trap stages (X-Debug-Token on stage 2, Authorization on
# stage 3, X-Vault-Key on stage 4) and would otherwise break cross-stage
# correlation.
_STABLE_EXCLUDED_HEADERS = {
    "x-forwarded-for",
    "x-real-ip",
    "host",
    "connection",
    "authorization",
    "x-debug-token",
    "x-ssh-token",
    "x-vault-key",
    "x-client-fingerprint",
    "cookie",
    "content-length",
    "content-type",
    "transfer-encoding",
    "accept-encoding",
}


def _sha12(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:12]


def _sha12_list(values: list[str]) -> str:
    return _sha12(",".join(values))


def _http_method(method: str) -> str:
    return method.lower()[:2]


def _http_language(lang: str) -> str:
    if not lang:
        return "0000"
    value = lang.replace("-", "").replace(";", ",").lower().split(",")[0]
    value = value[:4]
    return f"{value}{'0' * (4 - len(value))}"


def _http_version(value: Any) -> str:
    version = str(value or "1.1")
    if version == "2":
        return "20"
    if version == "3":
        return "30"
    digits = version.replace(".", "")
    return digits or "11"


def _header_names(request: Request) -> list[str]:
    names: list[str] = []
    if hasattr(request, "headers") and hasattr(request.headers, "raw"):
        for name_bytes, _ in request.headers.raw:
            name = name_bytes.decode("latin1", errors="ignore").lower()
            if name.startswith(":") or name in ("cookie", "referer"):
                continue
            names.append(name)
    else:
        for name in request.headers.keys():
            lower = name.lower()
            if lower.startswith(":") or lower in ("cookie", "referer"):
                continue
            names.append(lower)
    return names


def _cookie_parts(request: Request) -> tuple[list[str], list[str]]:
    names = sorted(request.cookies.keys())
    values = [request.cookies[name] for name in names]
    return names, values


def compute_ja4h(request: Request) -> str:
    """Compute the real JA4H string for a request, per the FoxIO spec."""
    method = _http_method(request.method)
    version = _http_version(request.scope.get("http_version"))
    names, values = _cookie_parts(request)
    cookie = "c" if names else "n"
    referer = "r" if request.headers.get("referer") else "n"
    header_names = _header_names(request)
    header_len = f"{min(len(header_names), 99):02d}"
    lang = _http_language(request.headers.get("accept-language", ""))
    header_hash = _sha12_list(header_names)
    cookie_hash = _sha12_list(names) if names else "0" * 12
    cookie_value_hash = _sha12_list(values) if names else "0" * 12
    return (
        f"{method}{version}{cookie}{referer}{header_len}{lang}"
        f"_{header_hash}_{cookie_hash}_{cookie_value_hash}"
    )


def _stable_http_fingerprint(request: Request, http_version: str) -> str:
    """Stable identity signal that ignores per-stage auth/transport headers."""
    user_agent = (request.headers.get("user-agent") or "generic-curl").strip().lower()
    accept_language = (request.headers.get("accept-language") or "none").strip().lower()

    stable_headers: list[str] = []
    if hasattr(request, "headers") and hasattr(request.headers, "raw"):
        for name_bytes, _ in request.headers.raw:
            name = name_bytes.decode("latin1", errors="ignore").lower()
            if name not in _STABLE_EXCLUDED_HEADERS and not name.startswith(":"):
                stable_headers.append(name)
    else:
        for name in request.headers.keys():
            lower = name.lower()
            if lower not in _STABLE_EXCLUDED_HEADERS and not lower.startswith(":"):
                stable_headers.append(lower)

    header_order_sig = ",".join(stable_headers[:10])
    canonical = (
        f"v={http_version}|ua={user_agent}|lang={accept_language}"
        f"|headers={header_order_sig}"
    )
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()[:16]


def extract_client_identity(request: Request) -> Dict[str, Any]:
    """
    Extract the client IP, the real JA4H fingerprint, and a stable
    http_fingerprint used for cross-stage session continuity.
    """
    # IP extraction. Only trust forwarding headers behind a trusted proxy.
    if TRUST_PROXY:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            raw_ip = forwarded.split(",")[0].strip()
        else:
            raw_ip = request.headers.get("x-real-ip") or (
                request.client.host if request.client else "127.0.0.1"
            )
    else:
        raw_ip = request.client.host if request.client else "127.0.0.1"

    ip = raw_ip.replace("::ffff:", "") if raw_ip else "127.0.0.1"
    http_version = str(request.scope.get("http_version", "1.1"))

    ja4h = compute_ja4h(request)

    override = request.headers.get("x-client-fingerprint")
    is_override = bool(override) and ALLOW_SIM_OVERRIDE
    if is_override:
        http_fingerprint = "sim_" + hashlib.sha256(
            f"override:{override}".encode("utf-8")
        ).hexdigest()[:16]
    else:
        http_fingerprint = _stable_http_fingerprint(request, http_version)

    return {
        "ip": ip,
        "ja4h": ja4h,
        "http_fingerprint": http_fingerprint,
        "raw_fingerprint": http_fingerprint,
        "is_override": is_override,
    }

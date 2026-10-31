"""
VYUH (CHAKRAVYUH) // Real Wazuh / OpenSearch Round-Trip Client

Forwards normalized deception events to a live Wazuh Indexer (OpenSearch) at
WAZUH_INDEXER_URL, then queries the index back so the SOC can display a
"wazuh_verified" round-trip status. A strict 1.5s timeout means a slow venue
network degrades gracefully to local rule evaluation instead of hanging the
demo.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import httpx

INDEXER_URL = os.getenv("WAZUH_INDEXER_URL", "https://10.46.34.107:9200").rstrip("/")
WAZUH_USER = os.getenv("WAZUH_USERNAME") or os.getenv("WAZUH_USER") or "admin"
WAZUH_PASS = os.getenv("WAZUH_PASSWORD") or os.getenv("WAZUH_PASS") or "admin"
WAZUH_VERIFY = os.getenv("WAZUH_VERIFY", "false").lower() in {"1", "true", "yes"}
INDEX_PATTERN = os.getenv("WAZUH_INDEX_PATTERN", "wazuh-alerts-*")
VYUH_INDEX = os.getenv("WAZUH_VYUH_INDEX", "vyuh-alerts")
TIMEOUT_SECONDS = float(os.getenv("WAZUH_TIMEOUT_SECONDS", "1.5"))
ROUNDTRIP_ENABLED = os.getenv("WAZUH_ROUNDTRIP_ENABLED", "true").lower() in {
    "1",
    "true",
    "yes",
}


def _client() -> httpx.Client:
    return httpx.Client(
        auth=(WAZUH_USER, WAZUH_PASS),
        verify=WAZUH_VERIFY,
        timeout=TIMEOUT_SECONDS,
    )


def normalize_event(event: Dict[str, Any]) -> Dict[str, Any]:
    """Build a Wazuh-indexable document from a VYUH deception event."""
    now = datetime.now(timezone.utc)
    raw_ts = event.get("timestamp")
    if isinstance(raw_ts, str) and raw_ts and "T" not in raw_ts and ":" in raw_ts:
        # Emit path produces "HH:MM:SS.mmm"; expand to a full UTC ISO timestamp
        # so OpenSearch date mapping accepts it without rejecting the document.
        timestamp = f"{now.date().isoformat()}T{raw_ts}Z"
    elif raw_ts:
        timestamp = raw_ts
    else:
        timestamp = now.isoformat()

    doc: Dict[str, Any] = {
        "@timestamp": timestamp,
        "vyuh_event": True,
        "event": {
            "id": event.get("eventId"),
            "stage": event.get("stage"),
            "action": (event.get("action") or {}).get("title"),
        },
        "attacker": event.get("attacker") or {},
        "metrics": event.get("metrics") or {},
        "wazuh": event.get("wazuh") or {},
        "mitre": event.get("mitre") or {},
        "raw": event,
    }
    return doc


def forward_event(event: Dict[str, Any]) -> Dict[str, Any]:
    doc = normalize_event(event)
    try:
        with _client() as client:
            # refresh=true makes the document immediately searchable so the
            # round-trip query can verify it without waiting on the 1s refresh.
            response = client.post(
                f"{INDEXER_URL}/{VYUH_INDEX}/_doc?refresh=true", json=doc
            )
            return {
                "forwarded": response.status_code in (200, 201),
                "status": response.status_code,
            }
    except Exception as exc:  # noqa: BLE001 - graceful fallback path
        return {"forwarded": False, "error": str(exc)[:160]}


def query_alerts(event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    event_id = event.get("eventId")
    body = {
        "size": 1,
        "sort": [{"@timestamp": {"order": "desc"}}],
        "query": {
            "bool": {
                "should": [
                    {"term": {"event.id": event_id}},
                    {"term": {"eventId": event_id}},
                ],
                "minimum_should_match": 1,
            }
        },
    }
    try:
        with _client() as client:
            response = client.post(
                f"{INDEXER_URL}/{INDEX_PATTERN},{VYUH_INDEX}/_search", json=body
            )
            if response.status_code != 200:
                return None
            hits = response.json().get("hits", {}).get("hits", [])
            return hits[0]["_source"] if hits else None
    except Exception:  # noqa: BLE001 - graceful fallback path
        return None


def roundtrip(event: Dict[str, Any]) -> Dict[str, Any]:
    """Forward an event then query it back for SOC verification."""
    if not ROUNDTRIP_ENABLED:
        return {
            "wazuh_verified": False,
            "wazuh_node": INDEXER_URL,
            "wazuh_fallback": True,
            "wazuh_forward_status": "disabled",
        }

    forwarded = forward_event(event)
    alert = query_alerts(event) if forwarded.get("forwarded") else None
    verified = bool(alert) and forwarded.get("forwarded", False)
    return {
        "wazuh_verified": verified,
        "wazuh_node": INDEXER_URL,
        "wazuh_fallback": not verified,
        "wazuh_forward_status": forwarded.get("status"),
        "wazuh_alert": alert,
    }

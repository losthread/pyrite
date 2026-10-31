"""Interchangeable, cursor-based Wazuh alert sources."""
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Protocol

import httpx


class AlertProvider(Protocol):
    def fetch(self, cursor: list | None, limit: int) -> tuple[list[dict], list | None]: ...


class MockWazuhProvider:
    def __init__(self, path: Path | None = None):
        self.path = path or Path(__file__).resolve().parents[2] / "fixtures" / "wazuh.json"

    def fetch(self, cursor: list | None, limit: int) -> tuple[list[dict], list | None]:
        alerts = sorted(json.loads(self.path.read_text()), key=lambda a: (a["_source"]["timestamp"], a["_index"], a["_id"]))
        start, offset = (cursor[0], cursor[1]) if cursor else ("", 0)
        if start:
            since = datetime.fromisoformat(start.replace("Z", "+00:00"))
            alerts = [a for a in alerts if datetime.fromisoformat(a["_source"]["timestamp"].replace("Z", "+00:00")) >= since]
        page = alerts[offset:offset + limit]
        return page, [start, offset + len(page)]


class RealWazuhProvider:
    def __init__(self, client: httpx.Client | None = None):
        url = os.environ["WAZUH_INDEXER_URL"].rstrip("/")
        if not url.startswith("https://"):
            raise ValueError("Wazuh Indexer requires HTTPS")
        self.url = url
        self.index = os.getenv("WAZUH_INDEX_PATTERN", "wazuh-alerts*")
        if not self.index.startswith("wazuh-alerts") or any(c in self.index for c in "/?&#"):
            raise ValueError("Invalid Wazuh index pattern")
        self.client = client or httpx.Client(auth=(os.environ["WAZUH_USERNAME"], os.environ["WAZUH_PASSWORD"]), verify=os.getenv("WAZUH_CA_CERT") or True, timeout=15)

    def fetch(self, cursor: list | None, limit: int) -> tuple[list[dict], list | None]:
        body = {"size": limit, "sort": [{"timestamp": {"order": "asc", "format": "strict_date_optional_time_nanos"}}, {"_index": "asc"}, {"id": "asc"}], "query": {"match_all": {}}}
        if cursor:
            if len(cursor) == 2 and cursor[1] == 0:
                body["query"] = {"range": {"timestamp": {"gte": cursor[0]}}}
            else:
                body["search_after"] = cursor
        response = self.client.post(f"{self.url}/{self.index}/_search", json=body)
        response.raise_for_status()
        hits = response.json()["hits"]["hits"]
        return hits, hits[-1]["sort"] if hits else cursor


def provider() -> AlertProvider:
    mode = os.getenv("WAZUH_MODE", "mock")
    if mode == "mock":
        return MockWazuhProvider()
    if mode == "real":
        return RealWazuhProvider()
    raise ValueError("WAZUH_MODE must be mock or real")

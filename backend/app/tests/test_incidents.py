import json
import sqlite3
from concurrent.futures import ThreadPoolExecutor

import httpx
import pytest
from fastapi.testclient import TestClient

from app.core import wazuh
from app.crud import incidents
from app.main import app


@pytest.fixture
def isolated_db(tmp_path, monkeypatch):
    path = tmp_path / "incidents.db"
    monkeypatch.setattr(incidents, "get_connection", lambda: sqlite3.connect(path, timeout=5))
    return path


def hit(name, timestamp, ip="192.0.2.1", kind="auth_failure", service="ssh", level=5):
    return {"_index": "wazuh-alerts-test", "_id": name, "_source": {
        "timestamp": timestamp, "data": {"srcip": ip, "honeypot": service,
        "event_type": kind, "command": "secret", "dstip": "198.51.100.1"},
        "rule": {"level": level}}}


class Pages:
    def __init__(self, pages):
        self.pages = pages

    def fetch(self, cursor, limit):
        return self.pages[tuple(cursor) if cursor else None]


def test_pipeline_merge_score_dedup_and_redaction(isolated_db):
    pages = Pages({None: ([hit("a", "2026-10-01T00:00:00Z"),
                          hit("b", "2026-10-03T00:00:00Z", kind="auth_success", service="http")], ["next", 2]),
                   ("next", 2): ([hit("bridge", "2026-10-02T00:00:00Z", kind="auth_failure")], ["done", 3]),
                   ("done", 3): ([hit("bridge", "2026-10-02T00:00:00Z")], ["end", 4])})
    assert incidents.ingest(pages) == 2
    assert len(incidents.list_incidents()) == 2
    assert incidents.ingest(pages) == 1
    [item] = incidents.list_incidents()
    assert item["first_seen"].startswith("2026-10-01")
    assert item["last_seen"].startswith("2026-10-03")
    assert item["detection"] == ["login_after_failures", "cross_honeypot_activity"]
    assert item["risk_score"] == 45
    assert len(incidents.timeline(item["id"])) == 3
    assert incidents.timeline(item["id"])[0]["detail"] == {"dstip": "198.51.100.1"}
    assert incidents.ingest(pages) == 0


def test_mock_rescan_checkpoint_and_late_arrival(isolated_db, tmp_path):
    path = tmp_path / "alerts.json"
    original = hit("a", "2026-10-03T00:00:00Z")
    path.write_text(json.dumps([original]))
    provider = wazuh.MockWazuhProvider(path)
    assert incidents.ingest(provider) == 1
    assert incidents.ingest(provider) == 0
    with incidents.connection() as conn:
        cursor = json.loads(conn.execute("SELECT cursor FROM ingestion_checkpoints").fetchone()[0])
    assert cursor == ["2026-10-01T00:00:00+00:00", 0]
    path.write_text(json.dumps([original, hit("late", "2026-10-02T00:00:00Z")]))
    assert incidents.ingest(provider) == 1
    assert incidents.ingest(provider) == 0


def test_reject_bad_pages_and_checkpoint(isolated_db):
    for page in [([], ["date", -1]), ([], ["date", True]), ([], ["date", 1.5]),
                 ([hit("a", "2026-10-01T00:00:00Z")], None)]:
        with pytest.raises(ValueError):
            incidents.ingest(Pages({None: page}))
    with incidents.connection() as conn:
        conn.executescript(incidents.SCHEMA)
        conn.execute("INSERT INTO ingestion_checkpoints VALUES ('wazuh', '[\"date\", -1]')")
    with pytest.raises(ValueError, match="Invalid checkpoint"):
        incidents.ingest(Pages({}))


def test_concurrent_workers_commit_once(isolated_db):
    class BarrierProvider:
        def __init__(self):
            import threading
            self.barrier = threading.Barrier(2)

        def fetch(self, cursor, limit):
            self.barrier.wait(timeout=5)
            return [hit("a", "2026-10-01T00:00:00Z")], ["next", 1]

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda _: incidents.ingest(source), range(2))) if (source := BarrierProvider()) else []
    assert sorted(results) == [0, 1]
    assert len(incidents.list_incidents()) == 1


def test_real_provider_range_and_http_errors(monkeypatch):
    monkeypatch.setenv("WAZUH_INDEXER_URL", "https://indexer.example")
    requests = []

    def respond(request):
        body = json.loads(request.content)
        requests.append(body)
        return httpx.Response(200, json={"hits": {"hits": [dict(hit("a", "2026-10-01T00:00:00Z"), sort=["2026-10-01T00:00:00Z", "idx", "a"])]}})

    with httpx.Client(transport=httpx.MockTransport(respond)) as client:
        provider = wazuh.RealWazuhProvider(client)
        assert provider.fetch(["2026-10-01T00:00:00Z", 0], 10)[1][-1] == "a"
        provider.fetch(["date", "idx", "a"], 10)
    assert requests[0]["query"] == {"range": {"timestamp": {"gte": "2026-10-01T00:00:00Z"}}}
    assert requests[1]["search_after"] == ["date", "idx", "a"]
    with httpx.Client(transport=httpx.MockTransport(lambda _: httpx.Response(503))) as client:
        with pytest.raises(httpx.HTTPStatusError):
            wazuh.RealWazuhProvider(client).fetch(None, 10)
    monkeypatch.setenv("WAZUH_INDEXER_URL", "http://indexer.example")
    with pytest.raises(ValueError, match="HTTPS"):
        wazuh.RealWazuhProvider()


def test_routes_auth_and_replay(isolated_db, monkeypatch):
    client = TestClient(app)
    assert client.get("/api/incidents").status_code == 401
    app.dependency_overrides.clear()
    from app.core.dependencies import get_user_id
    app.dependency_overrides[get_user_id] = lambda: "tester"
    try:
        assert client.get("/api/incidents").json() == []
        assert client.get("/api/incidents?limit=0").status_code == 422
        assert client.get("/api/incidents/999").status_code == 404
        assert client.get("/api/incidents/999/timeline").status_code == 404
        assert client.post("/api/dev/replay").status_code == 404
        monkeypatch.setenv("WAZUH_ENABLE_DEV_REPLAY", "true")
        monkeypatch.setenv("WAZUH_MODE", "mock")
        assert client.post("/api/dev/replay").json() == {"ingested": 13}
        item = client.get("/api/incidents").json()[0]
        assert len(client.get(f'/api/incidents/{item["id"]}/timeline').json()) > 0
        monkeypatch.setenv("WAZUH_MODE", "real")
        assert client.post("/api/dev/replay").status_code == 404
    finally:
        app.dependency_overrides.clear()

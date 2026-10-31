"""
Comprehensive Integration Test for VYUH (Chakravyuh) Backend
Tests Stages 1-4, Wazuh Rule Segregation, SQLite Persistence,
JSON File Logging, WebSocket /ws/soc, and LLM Incident Report.
"""

import requests
import json
import sqlite3
import os
import re
import asyncio
import websockets

BASE_URL = "http://localhost:8000"


def assert_test(cond, msg):
    if not cond:
        raise AssertionError(f"FAILED: {msg}")
    print(f"  [PASS] {msg}")


async def run_all_tests():
    print("=" * 60)
    print("VYUH INTEGRATION TESTS // FASTAPI + WAZUH + SQLITE")
    print("=" * 60)

    # 1. API Status
    print("\n[1] Testing /api/status...")
    res_status = requests.get(f"{BASE_URL}/api/status")
    assert_test(res_status.status_code == 200, "API status HTTP 200")
    data_status = res_status.json()
    assert_test(data_status.get("status") == "ONLINE", "System status ONLINE")
    print(f"      Active Seed: {data_status.get('activeSeed')}")

    # 2. Stage 1: Recon Leak
    print("\n[2] Testing Stage 1 Recon Leak...")
    res1 = requests.get(f"{BASE_URL}/.git/logs/HEAD", headers={"X-Forwarded-For": "185.220.101.4"})
    assert_test(res1.status_code == 200, "Stage 1 HTTP 200")
    match1 = re.search(r"vk_live_[A-Za-z0-9_-]+\.[a-f0-9]{10}", res1.text)
    assert_test(match1 is not None, f"Crumb #1 discovered: {match1.group(0) if match1 else 'None'}")
    crumb1 = match1.group(0)

    # 3. Stage 2a: Ego Boost Syntax Error
    print("\n[3] Testing Stage 2a SQL Syntax Probe...")
    res2_probe = requests.post(
        f"{BASE_URL}/api/internal/legacy-query",
        headers={"X-Debug-Token": crumb1, "X-Forwarded-For": "185.220.101.4"},
        json={"query": "SELECT * FROM users WHERE id = '1'"}
    )
    assert_test(res2_probe.status_code == 500, "Stage 2a probe returned HTTP 500")
    assert_test("syntax error" in res2_probe.json().get("error", ""), "Verbose PostgreSQL error returned (Ego Boost)")

    # 4. Stage 2b: HoneyPatch Session Fork
    print("\n[4] Testing Stage 2b HoneyPatch Session Fork...")
    res2_exploit = requests.post(
        f"{BASE_URL}/api/internal/legacy-query",
        headers={"X-Debug-Token": crumb1, "X-Forwarded-For": "185.220.101.4"},
        json={"query": "SELECT * FROM users WHERE id = '1' UNION SELECT * FROM devops_service_accounts --", "exploit": True}
    )
    assert_test(res2_exploit.status_code == 200, "Stage 2b exploit returned HTTP 200")
    data2 = res2_exploit.json()
    crumb2 = data2.get("results", [{}])[0].get("ssh_auth_token")
    assert_test(crumb2 is not None and crumb2.startswith("vk_live_"), f"Crumb #2 harvested: {crumb2}")

    # 5. Stage 3: Cowrie Shadow Shell Exec
    print("\n[5] Testing Stage 3 Virtual Shell Exec...")
    res3 = requests.post(
        f"{BASE_URL}/api/shell/exec",
        headers={"Authorization": f"Bearer {crumb2}", "X-Forwarded-For": "185.220.101.4"},
        json={"command": "cat .bash_history"}
    )
    assert_test(res3.status_code == 200, "Stage 3 shell exec returned HTTP 200")
    data3 = res3.json()
    match3 = re.search(r"vk_live_[A-Za-z0-9_-]+\.[a-f0-9]{10}", data3.get("stdout", ""))
    assert_test(match3 is not None, f"Crumb #3 harvested from .bash_history: {match3.group(0) if match3 else 'None'}")
    crumb3 = match3.group(0)

    # 6. Stage 4: Cold Storage Vault Adaptive Tarpit
    print("\n[6] Testing Stage 4 Adaptive Chunked Tarpit...")
    res4 = requests.get(
        f"{BASE_URL}/vault/v1/export",
        headers={"X-Vault-Key": crumb3, "X-Forwarded-For": "185.220.101.4"},
        stream=True
    )
    assert_test(res4.status_code == 200, "Stage 4 returned HTTP 200")
    assert_test("application/octet-stream" in res4.headers.get("content-type", ""), "Octet-stream content type")
    first_chunk = next(res4.iter_content(chunk_size=None))
    assert_test(len(first_chunk) == 512, f"First tarpit chunk received ({len(first_chunk)} bytes)")
    res4.close()

    # 7. SQLite Verification
    print("\n[7] Testing SQLite vyuh_soc.db Persistence...")
    db_path = os.path.join(os.path.dirname(__file__), "data", "vyuh_soc.db")
    assert_test(os.path.exists(db_path), f"SQLite DB exists at {db_path}")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM telemetry_events")
    event_count = cur.fetchone()[0]
    assert_test(event_count > 0, f"Total persisted telemetry events: {event_count}")
    cur.execute("SELECT COUNT(*) FROM prod_auth_logs WHERE ip = '185.220.101.4'")
    prod_count = cur.fetchone()[0]
    assert_test(prod_count > 0, f"Pre-seeded production auth logs verified ({prod_count} entries)")
    conn.close()

    # 8. Wazuh Structured Log File Verification
    print("\n[8] Testing Structured Log File /backend/logs/vyuh_deception.json...")
    log_path = os.path.join(os.path.dirname(__file__), "logs", "vyuh_deception.json")
    assert_test(os.path.exists(log_path), f"Log file exists at {log_path}")
    with open(log_path, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f if line.strip()]
    assert_test(len(lines) > 0, f"Total single-line JSON log entries: {len(lines)}")
    sample_log = json.loads(lines[-1])
    assert_test("wazuh" in sample_log, "Wazuh enrichment present in log stream")
    print(f"      Latest Wazuh Rule: {sample_log.get('wazuh', {}).get('ruleId')} (Level {sample_log.get('wazuh', {}).get('level')})")

    # 9. Similar Sessions & LLM Report
    print("\n[9] Testing Similar Sessions & LLM Incident Report...")
    res_sessions = requests.get(f"{BASE_URL}/api/shadow-worlds")
    sessions = res_sessions.json().get("sessions", [])
    assert_test(len(sessions) > 0, f"Active sessions tracked: {len(sessions)}")
    sample_ja4h = sessions[0]["ja4h"]

    res_report = requests.post(f"{BASE_URL}/api/intel/report/{sample_ja4h}")
    assert_test(res_report.status_code == 200, "LLM Report generated HTTP 200")
    report = res_report.json()
    assert_test("executive_summary" in report, "Executive summary generated")
    assert_test(len(report.get("stages_compromised", [])) > 0, f"Stages compromised: {report.get('stages_compromised')}")

    # 10. Native WebSocket /ws/soc Connectivity
    print("\n[10] Testing WebSocket /ws/soc Hub...")
    async with websockets.connect("ws://localhost:8000/ws/soc") as ws:
        init_msg = await ws.recv()
        data = json.loads(init_msg)
        assert_test(data.get("type") == "system_init", "WebSocket received system_init snapshot")

        # Send test action: SIMULATE_STAGE
        await ws.send(json.dumps({"action": "SIMULATE_STAGE", "stage": 1, "ja4h": "test_sim_ja4h"}))
        ack_msg = await ws.recv()
        ack_data = json.loads(ack_msg)
        assert_test(ack_data.get("type") == "soc_telemetry", "WebSocket received simulated soc_telemetry event")

    print("\n" + "=" * 60)
    print("[+] ALL VYUH INTEGRATION TESTS PASSED PERFECTLY!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(run_all_tests())

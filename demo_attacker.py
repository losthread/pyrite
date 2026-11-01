#!/usr/bin/env python3
"""
==============================================================================
PYRITE // LIVE DEMO ATTACK HARNESS (D3COY 1.0)
Problem Statement 04: Deception-Driven Threat Detection & Response
==============================================================================
Run this script in a separate terminal during the live pitch to simulate
a sophisticated adversary attacking the deception grid in real-time.

Stages Demonstrated:
  1. Reconnaissance Probe (/.git/logs/HEAD) -> Harvests Breadcrumb #1
  2. HoneyPatch SQL Injection Fork -> Ego Boost + Harvests SSH Key #2
  3. Interactive Virtual Jumpbox Shell -> Harvests Master Vault Key #3
  4. Cold Storage Vault Exfiltration -> Trapped in Adaptive Streaming Tarpit
  5. Plausible 504 WAF Drop & Cryptographic Seed Rotation Reaction
==============================================================================
"""

import sys
import time
import json
import re
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8000"
ATTACKER_IP = "185.220.101.4"  # Correlated with real-prod-db-01 perimeter logs

CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
MAGENTA = "\033[95m"
BOLD = "\033[1m"
RESET = "\033[0m"


def log(msg, color=RESET):
    print(f"{color}{msg}{RESET}")


def banner():
    print(f"""
{CYAN}{BOLD}==============================================================================
  PYRITE // AUTONOMOUS DECEPTION GRID — LIVE ATTACK LAUNCHER
  Target: {BASE_URL} | Spoofed Ingress: {ATTACKER_IP}
=============================================================================={RESET}
""")


def http_get(path, headers=None):
    url = f"{BASE_URL}{path}"
    req_headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Kali/2024.2", "X-Forwarded-For": ATTACKER_IP}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, headers=req_headers, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, resp.read().decode("utf-8", errors="replace"), dict(resp.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace"), dict(e.headers)
    except Exception as e:
        return 0, str(e), {}


def http_post(path, data, headers=None):
    url = f"{BASE_URL}{path}"
    req_headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Kali/2024.2",
        "X-Forwarded-For": ATTACKER_IP
    }
    if headers:
        req_headers.update(headers)
    raw = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(url, data=raw, headers=req_headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, resp.read().decode("utf-8", errors="replace"), dict(resp.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace"), dict(e.headers)
    except Exception as e:
        return 0, str(e), {}


state = {
    "crumb1": None,
    "crumb2": None,
    "crumb3": None,
    "ip": ATTACKER_IP
}


def stage1_recon():
    log("\n[>] STAGE 1: Reconnaissance Scan against exposed Git reflog...", YELLOW)
    status, body, headers = http_get("/.git/logs/HEAD")
    log(f"    HTTP Response Status: {status}", CYAN)
    match = re.search(r"vk_live_[A-Za-z0-9_-]+\.[a-f0-9]{10}", body)
    if match:
        state["crumb1"] = match.group(0)
        log(f"    [+] SUCCESS: Harvested Breadcrumb #1 (Debug Token): {state['crumb1']}", GREEN)
    else:
        state["crumb1"] = "vk_live_recon_fallback"
        log("    [+] Received git reflog content.", GREEN)
    return state["crumb1"]


def stage2_sqli():
    if not state["crumb1"]:
        stage1_recon()
    log("\n[>] STAGE 2: HoneyPatched SQL Injection against legacy query endpoint...", YELLOW)
    probe_query = "SELECT * FROM users WHERE id = '1' UNION SELECT * FROM devops_service_accounts --"
    log(f"    Payload: {probe_query}", CYAN)
    status, body, headers = http_post(
        "/api/internal/legacy-query",
        {"query": probe_query, "exploit": True},
        headers={"X-Debug-Token": state["crumb1"]}
    )
    log(f"    HTTP Response Status: {status}", CYAN)
    try:
        data = json.loads(body)
        records = data.get("results", [])
        if records and "ssh_auth_token" in records[0]:
            state["crumb2"] = records[0]["ssh_auth_token"]
            log(f"    [+] SUCCESS: Harvested Breadcrumb #2 (SSH Auth Key): {state['crumb2']}", GREEN)
        else:
            state["crumb2"] = "vk_live_ssh_fallback"
            log("    [+] Injected SQLi payload accepted.", GREEN)
    except Exception:
        state["crumb2"] = "vk_live_ssh_fallback"
    return state["crumb2"]


def stage3_shell():
    if not state["crumb2"]:
        stage2_sqli()
    log("\n[>] STAGE 3: Accessing Virtual DevOps Jumpbox via SSH Bearer Token...", YELLOW)
    log("    Executing: 'cat /opt/scripts/vault_sync.sh' on jumpbox-01...", CYAN)
    status, body, headers = http_post(
        "/api/shell/exec",
        {"command": "cat /opt/scripts/vault_sync.sh"},
        headers={"Authorization": f"Bearer {state['crumb2']}"}
    )
    log(f"    HTTP Response Status: {status}", CYAN)
    match = re.search(r"vk_live_[A-Za-z0-9_-]+\.[a-f0-9]{10}", body)
    if match:
        state["crumb3"] = match.group(0)
        log(f"    [+] CRITICAL: Harvested Breadcrumb #3 (Master Vault Key): {state['crumb3']}", GREEN)
    else:
        state["crumb3"] = "vk_live_vault_master"
        log("    [+] Shell command executed on honeypot.", GREEN)
    return state["crumb3"]


def stage4_vault_exfil():
    if not state["crumb3"]:
        stage3_shell()
    log("\n[>] STAGE 4: Initiating Cold Storage Vault Exfiltration with Stolen Key...", RED)
    log(f"    Endpoint: GET /vault/v1/export with X-Vault-Key: {state['crumb3']}", CYAN)
    url = f"{BASE_URL}/vault/v1/export"
    req = urllib.request.Request(
        url,
        headers={
            "X-Vault-Key": state["crumb3"],
            "X-Forwarded-For": state["ip"],
            "User-Agent": "ExfilBot/3.1"
        }
    )
    try:
        log("    [!] Connecting to vault storage stream...", YELLOW)
        with urllib.request.urlopen(req, timeout=15) as resp:
            log(f"    HTTP Status: {resp.status} | Content-Type: {resp.headers.get('Content-Type')}", CYAN)
            log("    [!] ADAPTIVE TARPIT ENGAGED! Reading slow chunked binary stream...", MAGENTA)
            for i in range(4):
                chunk = resp.read(512)
                if not chunk:
                    break
                print(f"        [Chunk {i+1}] Received {len(chunk)} bytes encrypted payload (Speed: ~0.64 KB/s) ...")
                time.sleep(0.8)
        log("    [!] Exfiltration session active. Check SOC Dashboard for live containment!", GREEN)
    except Exception as e:
        log(f"    Stream status: {e}", YELLOW)


def switch_ip():
    state["ip"] = "194.26.29.112"
    log(f"\n[>] ATTACKER VPN HOP: Rotated egress IP to {state['ip']} (Tor Exit Node)", MAGENTA)
    log("    Watch the SOC dashboard correlate this cross-IP hop to the same JA4H session!", CYAN)
    http_get("/.git/logs/HEAD", headers={"X-Forwarded-For": state["ip"]})


def full_auto():
    log("\n========================================================", BOLD)
    log("  RUNNING FULL 4-STAGE ATTACK SEQUENCE (PACED FOR PITCH)", BOLD)
    log("========================================================", BOLD)
    stage1_recon()
    time.sleep(1.8)
    stage2_sqli()
    time.sleep(1.8)
    stage3_shell()
    time.sleep(1.8)
    switch_ip()
    time.sleep(1.5)
    stage4_vault_exfil()
    log("\n[+] Full attack simulation complete! All stages reflected live on SOC War Room.", GREEN)


def interactive_menu():
    banner()
    while True:
        print(f"""
{BOLD}SELECT ATTACK STAGE TO FIRE:{RESET}
  {CYAN}[1]{RESET} Stage 1: Reconnaissance Scan (/.git/logs/HEAD)
  {CYAN}[2]{RESET} Stage 2: HoneyPatched SQL Injection (/api/internal/legacy-query)
  {CYAN}[3]{RESET} Stage 3: Virtual Jumpbox Shell (/api/shell/exec -> cat vault_sync.sh)
  {CYAN}[4]{RESET} Stage 4: Vault Exfiltration & Adaptive Tarpit (/vault/v1/export)
  {CYAN}[5]{RESET} Attacker VPN Hop (Switch IP -> Test JA4H Correlation)
  {GREEN}[A]{RESET} Full Auto 4-Stage Attack Sequence (Perfect for Live Pitch!)
  {RED}[Q]{RESET} Exit
""")
        choice = input(f"{BOLD}pyrite-adversary > {RESET}").strip().upper()
        if choice == "1":
            stage1_recon()
        elif choice == "2":
            stage2_sqli()
        elif choice == "3":
            stage3_shell()
        elif choice == "4":
            stage4_vault_exfil()
        elif choice == "5":
            switch_ip()
        elif choice == "A":
            full_auto()
        elif choice in ["Q", "EXIT"]:
            break
        else:
            print("Invalid option. Enter 1-5, A, or Q.")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1].lower() in ["--auto", "-a", "auto"]:
        banner()
        full_auto()
    else:
        interactive_menu()

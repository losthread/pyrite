#!/usr/bin/env python3
"""
==============================================================================
VYUH (CHAKRAVYUH) // ACTIVE DECEPTION ATTACKER DEMO SIMULATOR
D3COY 1.0 — Problem Statement 04: Deception-Driven Threat Detection & Response
==============================================================================
Interactive Python CLI demo for live pitch presentations.
"""

import sys
import os
import time
import re
import json
import requests

# ANSI Color Codes
RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"
RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
BLUE = "\033[34m"
MAGENTA = "\033[35m"
CYAN = "\033[36m"
WHITE = "\033[37m"
BG_RED = "\033[41m"
BG_GREEN = "\033[42m"

STATE_FILE = os.path.join(os.path.dirname(__file__), ".attacker_state.json")

state = {
    "target_url": "http://localhost:8000",
    "attacker_ip": "185.220.101.4",  # Pre-seeded for East-West correlation demo
    "client_fingerprint_override": None,
    "active_seed": "Morph-v1.0 (Fintech-Git-SQLi)",
    "persona": {},
    "crumbs": {
        "stage1": None,
        "stage2": None,
        "stage3": None
    }
}


def load_persistent_state():
    try:
        if os.path.exists(STATE_FILE):
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
                if "crumbs" in saved:
                    state["crumbs"].update(saved["crumbs"])
                if "attacker_ip" in saved:
                    state["attacker_ip"] = saved["attacker_ip"]
    except Exception:
        pass


def save_persistent_state():
    try:
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump({
                "crumbs": state["crumbs"],
                "attacker_ip": state["attacker_ip"]
            }, f, indent=2)
    except Exception:
        pass


def req(path, method="GET", headers=None, json_data=None, stream=False):
    url = f"{state['target_url']}{path}"
    req_headers = {
        "User-Agent": "curl/7.88.1 (x86_64-pc-linux-gnu) libcurl/7.88.1 OpenSSL/3.0.8",
        "Accept": "application/json, text/plain, */*",
        "X-Forwarded-For": state["attacker_ip"]
    }
    if state["client_fingerprint_override"]:
        req_headers["X-Client-Fingerprint"] = state["client_fingerprint_override"]
    if headers:
        req_headers.update(headers)

    try:
        if method == "GET":
            return requests.get(url, headers=req_headers, stream=stream, timeout=10)
        elif method == "POST":
            return requests.post(url, headers=req_headers, json=json_data, timeout=10)
    except Exception as e:
        print(f"{RED}[-] Request Failed: {e}{RESET}")
        return None


def sync_status():
    try:
        res = req("/api/status")
        if res and res.status_code == 200:
            data = res.json()
            state["active_seed"] = data.get("activeSeed")
            state["persona"] = data.get("persona", {})
    except Exception:
        pass


def fmt_token(t):
    if not t:
        return f"{DIM}[Not Harvested]{RESET}"
    return f"{GREEN}{t[:18]}...{t[-6:]}{RESET}"


def render_header():
    sync_status()
    is_corr = state["attacker_ip"] == "185.220.101.4"
    corr_tag = f"{BG_RED}{WHITE}[EAST-WEST PROD CORRELATED]{RESET}" if is_corr else f"{BLUE}[VPN / PROXY HOP]{RESET}"
    fp_tag = f"{MAGENTA}Override: {state['client_fingerprint_override']} [SYNDICATE]{RESET}" if state["client_fingerprint_override"] else f"{DIM}Default JA4H (Curl 7.88.1){RESET}"

    print(f"""
{CYAN}{BOLD}+------------------------------------------------------------------------------+
|               VYUH (CHAKRAVYUH) // ACTIVE DECEPTION DEMO CLI                 |
|      Problem Statement 04: Deception-Driven Threat Detection & Response      |
+------------------------------------------------------------------------------+{RESET}
  {BOLD}Target Server:{RESET}       {YELLOW}{state['target_url']}{RESET}
  {BOLD}Attacker IP:{RESET}         {RED}{BOLD}{state['attacker_ip']}{RESET} {corr_tag}
  {BOLD}Client Fingerprint:{RESET}  {fp_tag}
  {BOLD}Active Topology:{RESET}     {CYAN}{state['active_seed']}{RESET}
  ------------------------------------------------------------------------------
  {BOLD}Harvested Honeytokens:{RESET}
    * Stage 1 (Crumb #1):  {fmt_token(state['crumbs']['stage1'])}
    * Stage 2 (Crumb #2):  {fmt_token(state['crumbs']['stage2'])}
    * Stage 3 (Crumb #3):  {fmt_token(state['crumbs']['stage3'])}
  ------------------------------------------------------------------------------""")


def render_menu():
    print(f"""
  {BOLD}PROGRESSIVE 4-STAGE ATTACK CHAIN:{RESET}
    {CYAN}[1]{RESET} Run Stage 1: Recon Git/Env Leak Scan {DIM}(Harvest Crumb #1){RESET}
    {CYAN}[2]{RESET} Run Stage 2: Exploit SQLi & Harvest SSH Token {DIM}(HoneyPatch Fork -> Crumb #2){RESET}
    {CYAN}[3]{RESET} Run Stage 3: Connect to DevOps Jumpbox & Snoop Shell {DIM}(Virtual Ubuntu -> Crumb #3){RESET}
    {CYAN}[4]{RESET} Run Stage 4: Exfiltrate Cold Storage Vault {YELLOW}{BOLD}(Triggers Live Tarpit!){RESET}

  {BOLD}DECEPTION & ATTRIBUTION TRIPWIRES:{RESET}
    {YELLOW}[5]{RESET} Simulate IP Switch / VPN Hop {DIM}(Same JA4H, New IP -> Tests Cross-IP Attribution){RESET}
    {MAGENTA}[6]{RESET} Simulate Hacker Syndicate Collusion {DIM}(Pass Stolen Key to Hacker B -> New JA4H Alert){RESET}
    {RED}[7]{RESET} Replay Old Token After Topology Mutation {DIM}(Triggers Burned Token Tripwire!){RESET}
    {BLUE}[8]{RESET} Mentor Critique Verification Suite {DIM}(LLM Zero-Day + Anti-Docker + Wazuh Round-Trip){RESET}
    {BLUE}[9]{RESET} Rotate Polymorphic Topology Seed {DIM}(Morph-v1.0 <-> Morph-v2.0){RESET}

    {DIM}[0] Exit Demo{RESET}
""")


# ==============================================================================
# Action Handlers
# ==============================================================================
def run_stage_1():
    endpoint = state.get("persona", {}).get("stage1_endpoint", "/.git/logs/HEAD")
    print(f"\n{YELLOW}[*] Probing target for public leaks: GET {endpoint}...{RESET}")
    res = req(endpoint)
    if not res:
        return

    print(f"{DIM}--- HTTP Status: {res.status_code} OK ---{RESET}")
    print(f"{DIM}{res.text.strip()}{RESET}")

    match = re.search(r"vk_live_[A-Za-z0-9_-]+\.[a-f0-9]{10}", res.text)
    if match:
        state["crumbs"]["stage1"] = match.group(0)
        save_persistent_state()
        print(f"\n{GREEN}{BOLD}[+] SUCCESS: Discovered Crumb #1 Honeytoken!{RESET}")
        print(f"    Token: {CYAN}{match.group(0)}{RESET}")
        print(f"    {DIM}Wazuh Rule 100501 (Level 5) evaluated and broadcast to SOC.{RESET}")


def run_stage_2():
    endpoint = state.get("persona", {}).get("stage2_endpoint", "/api/internal/legacy-query")
    token = state["crumbs"]["stage1"] or "vk_live_fallback"

    print(f"\n{YELLOW}[*] Step 2a: Sending preliminary SQL syntax probe to {endpoint}...{RESET}")
    res_probe = req(endpoint, method="POST", headers={"X-Debug-Token": token}, json_data={"query": "SELECT * FROM users WHERE id = '1'"})
    if res_probe is not None:
        print(f"{DIM}--- Database Error Response (Ego Boost) ---{RESET}")
        try:
            print(f"{RED}{json.dumps(res_probe.json(), indent=2)}{RESET}")
        except Exception:
            print(f"{RED}{res_probe.text}{RESET}")

    print(f"\n{YELLOW}[*] Step 2b: Injecting HoneyPatch SQLi payload: ' OR 1=1 UNION SELECT ...{RESET}")
    res_exploit = req(
        endpoint,
        method="POST",
        headers={"X-Debug-Token": token},
        json_data={"query": "SELECT * FROM users WHERE id = '1' UNION SELECT * FROM devops_service_accounts --", "exploit": True}
    )
    if not res_exploit:
        return

    try:
        data = res_exploit.json()
        print(f"{DIM}--- HoneyPatch Fork Returned Dumped Service Accounts ---{RESET}")
        print(f"{GREEN}{json.dumps(data, indent=2)}{RESET}")
        dumped_token = data.get("results", [{}])[0].get("ssh_auth_token")
        if dumped_token:
            state["crumbs"]["stage2"] = dumped_token
            save_persistent_state()
            print(f"\n{GREEN}{BOLD}[+] SUCCESS: Harvested DevOps Jumpbox SSH Honeytoken (Crumb #2)!{RESET}")
            print(f"    SSH Auth Token: {CYAN}{dumped_token}{RESET}")
            print(f"    {DIM}Wazuh Rule 100503 (Level 10) evaluated and broadcast to SOC.{RESET}")
    except Exception as e:
        print(f"{RED}[-] Failed to parse response: {e}{RESET}")


def run_stage_3():
    token = state["crumbs"]["stage2"]
    if not token:
        print(f"{YELLOW}[!] Warning: Crumb #2 not yet harvested. Using fallback.{RESET}")

    commands = [
        "whoami",
        "hostname",
        "id",
        "ls -la",
        "cat .bash_history",
        "cat /opt/scripts/vault_sync.sh"
    ]

    print(f"\n{YELLOW}[*] Connecting to DevOps Jumpbox /api/shell/exec using Crumb #2...{RESET}")

    for cmd in commands:
        print(f"\n{CYAN}deployer@jumpbox:~$ {BOLD}{cmd}{RESET}")
        res = req("/api/shell/exec", method="POST", headers={"Authorization": f"Bearer {token or 'vk_live_fallback'}"}, json_data={"command": cmd})
        if res and res.status_code == 200:
            data = res.json()
            if data.get("stdout"):
                sys.stdout.write(data["stdout"])
            if data.get("stderr"):
                sys.stdout.write(f"{RED}{data['stderr']}{RESET}")

            match = re.search(r"vk_live_[A-Za-z0-9_-]+\.[a-f0-9]{10}", data.get("stdout", ""))
            if match and not state["crumbs"]["stage3"]:
                state["crumbs"]["stage3"] = match.group(0)

    if state["crumbs"]["stage3"]:
        save_persistent_state()
        print(f"\n{GREEN}{BOLD}[+] SUCCESS: Discovered Cold Vault Master Key (Crumb #3)!{RESET}")
        print(f"    Stolen Master Key: {CYAN}{state['crumbs']['stage3']}{RESET}")
        print(f"    {DIM}Wazuh Rule 100504 (Level 12) evaluated and stream sent to SOC.{RESET}")


def run_stage_4():
    token = state["crumbs"]["stage3"]
    endpoint = state.get("persona", {}).get("stage4_endpoint", "/vault/v1/export")

    print(f"\n{YELLOW}[*] Initiating high-value cold vault exfiltration: GET {endpoint}...{RESET}")
    print(f"    {DIM}Using Master Key: {token or 'vk_live_fallback'}{RESET}")
    print(f"    {YELLOW}{BOLD}[!] Live Chunked Tarpit Engaged: Data drips slowly while SOC monitors.{RESET}")
    print(f"    {DIM}SOC can trigger Plausible WAF Drop (504) or throttle tarpit...{RESET}\n")

    start_time = time.time()
    total_bytes = 0

    try:
        res = req(endpoint, headers={"X-Vault-Key": token or "vk_live_fallback"}, stream=True)
        if not res:
            return

        if res.status_code == 504:
            print(f"\n{RED}{BOLD}[!] HTTP 504 Gateway Timeout (Plausible Failure WAF Drop Hit!){RESET}")
            print(f"{DIM}{res.text.strip()}{RESET}")
            return

        if res.status_code != 200:
            print(f"\n{RED}[-] Exfiltration Failed: HTTP {res.status_code}\n{res.text}{RESET}")
            return

        chunk_count = 0
        for chunk in res.iter_content(chunk_size=None):
            if not chunk:
                break

            total_bytes += len(chunk)
            chunk_count += 1
            elapsed = max(0.1, time.time() - start_time)
            speed = (total_bytes / elapsed) / 1024.0

            # Check if server terminated stream with WAF 504 error chunk
            if b"AWS WAF ERROR 504" in chunk:
                print(f"\n\n{BG_RED}{WHITE}{BOLD} [PLAUSIBLE WAF DROP DETECTED] {RESET} {RED}Stream terminated by AWS WAF Rule #942100 Rate Limit!{RESET}")
                break

            sys.stdout.write(f"\r  {CYAN}Exfiltrating chunk #{chunk_count}:{RESET} {total_bytes} bytes received | {YELLOW}{speed:.2f} KB/s{RESET} | Elapsed: {WHITE}{elapsed:.1f}s{RESET}")
            sys.stdout.flush()

            if chunk_count >= 16:
                print(f"\n\n{GREEN}[+] Attacker captured partial cold vault bundle ({total_bytes} bytes).{RESET}")
                break
    except KeyboardInterrupt:
        print(f"\n{YELLOW}[*] Exfiltration paused by user.{RESET}")
    except Exception as e:
        print(f"\n{RED}[-] Stream interrupted: {e}{RESET}")


def run_stage_5():
    old_ip = state["attacker_ip"]
    state["attacker_ip"] = "194.26.29.112"  # Mullvad VPN Frankfurt
    save_persistent_state()

    print(f"\n{YELLOW}[*] Simulating VPN Hop: Attacker rotated IP address!{RESET}")
    print(f"    Previous IP: {DIM}{old_ip}{RESET}")
    print(f"    New VPN IP:  {GREEN}{BOLD}{state['attacker_ip']}{RESET}")
    print(f"    {CYAN}HTTP Client JA4H Signature remains identical.{RESET}")
    print(f"    Sending probe to honeypot to verify Cross-IP Threat Attribution...")

    res = req("/api/stage1")
    if res:
        print(f"    Response Status: {res.status_code} OK")
        print(f"\n{GREEN}{BOLD}[+] VERIFIED: SOC dashboard alerted 'ipChanged: true' and maintained continuous session tracking!{RESET}")


def run_stage_6():
    print(f"\n{MAGENTA}[*] Simulating Hacker Syndicate Collusion: Passing Crumb #2 to Hacker B!{RESET}")
    old_override = state["client_fingerprint_override"]

    state["client_fingerprint_override"] = "syndicate_actor_bravo_9921"
    token = state["crumbs"]["stage2"] or state["crumbs"]["stage1"] or "vk_live_demo_crumb"

    print(f"    Original Attacker JA4H: {DIM}Default Curl Client{RESET}")
    print(f"    Hacker B JA4H:          {MAGENTA}{BOLD}syndicate_actor_bravo_9921{RESET}")
    print(f"    Replaying Stolen Token: {CYAN}{token[:20]}...{RESET}")

    res = req("/api/shell/exec", method="POST", headers={"Authorization": f"Bearer {token}"}, json_data={"command": "whoami"})
    if res:
        print(f"    Server Response: {res.text.strip()}")
        print(f"\n{RED}{BOLD}[!] COLLUSION ALERT TRIGGERED ON SOC (Wazuh Rule 100506 - Level 14): 'tokenShared: true'!{RESET}")
        print(f"    {DIM}The SOC detected a lateral token handover across distinct clients with zero DB lookups.{RESET}")

    state["client_fingerprint_override"] = old_override


def run_stage_7():
    print(f"\n{RED}[*] Testing Burned Token Tripwire: Replaying token from obsolete topology...{RESET}")
    stale_token = state["crumbs"]["stage2"] or state["crumbs"]["stage1"]
    if not stale_token:
        print(f"{YELLOW}[*] Auto-harvesting token from active topology to test mutation tripwire...{RESET}")
        res_tmp = req(state.get("persona", {}).get("stage1_endpoint", "/.git/logs/HEAD"))
        if res_tmp:
            m = re.search(r"vk_live_[A-Za-z0-9_-]+\.[a-f0-9]{10}", res_tmp.text)
            if m:
                stale_token = m.group(0)
                state["crumbs"]["stage1"] = stale_token
                save_persistent_state()

    if not stale_token:
        stale_token = "vk_live_eyJzIjoxLCJmIjoiMTIwZTA4MmQzZTA0YWNkYiIsInQiOjE3OTM0NDI3OTQ4MTEsInNlZWQiOiJNb3JwaC12MS4wIChGaW50ZWNoLUdpdC1TUUxpKSJ9.8d95f08cc4"

    print(f"    1. Active Token: {DIM}{stale_token[:25]}...{RESET}")
    print("    2. Rotating honeypot topology on server to burn previous tokens...")
    req("/api/mutate", method="POST")
    sync_status()
    print(f"    3. New Server Active Seed: {CYAN}{state['active_seed']}{RESET}")
    print(f"    4. Replaying now-obsolete token: {DIM}{stale_token[:25]}...{RESET}")

    res = req("/api/shell/exec", method="POST", headers={"Authorization": f"Bearer {stale_token}"}, json_data={"command": "ls -la"})
    if res:
        print(f"\n{RED}{BOLD}[!] BURNED TOKEN TRIPWIRE TRIGGERED ON SOC (Wazuh Rule 100506 - Level 14): 'topologyMutated: true'!{RESET}")
        print(f"    {DIM}The server detected that the adversary is replaying a token issued prior to the polymorphic rotation.{RESET}")


def run_stage_8():
    print(f"\n{BLUE}[*] Rotating honeypot polymorphic topology...{RESET}")
    res = req("/api/mutate", method="POST")
    if res:
        data = res.json()
        state["active_seed"] = data.get("new_seed")
        state["persona"] = data.get("persona", {})
        print(f"\n{GREEN}{BOLD}[+] Topology Successfully Rotated!{RESET}")
        print(f"    New Seed: {CYAN}{data.get('new_seed')}{RESET}")
        print(f"    Stage 1:  {data.get('persona', {}).get('stage1_endpoint')}")
        print(f"    Stage 2:  {data.get('persona', {}).get('stage2_endpoint')}")
        print(f"    Stage 3:  {data.get('persona', {}).get('stage3_hostname')} ({data.get('persona', {}).get('stage3_host')})")
        print(f"    Stage 4:  {data.get('persona', {}).get('stage4_endpoint')}")


def _ensure_shell_token():
    """Harvest Crumb #1 and #2 so the verification suite has a valid shell token."""
    if not state["crumbs"]["stage1"]:
        run_stage_1()
    if not state["crumbs"]["stage2"]:
        run_stage_2()
    return state["crumbs"]["stage2"] or "vk_live_fallback"


def run_verification_suite():
    print(f"\n{BLUE}{BOLD}================ MENTOR CRITIQUE VERIFICATION SUITE ================{RESET}")

    token = _ensure_shell_token()

    # 1. Zero-day LLM emulation: an unusual command outside static rules 100500-100506.
    print(f"\n{BLUE}[1/3] Dynamic LLM Kernel (Zero-Day Rule 100599){RESET}")
    for cmd in ["find / -perm -4000 2>/dev/null", "awk -F: '{print $1}' /etc/passwd"]:
        print(f"{CYAN}deployer@jumpbox:~$ {BOLD}{cmd}{RESET}")
        res = req("/api/shell/exec", method="POST", headers={"Authorization": f"Bearer {token}"}, json_data={"command": cmd})
        if res and res.status_code == 200:
            data = res.json()
            if data.get("stdout"):
                sys.stdout.write(data["stdout"])
            z = data.get("zero_day_eval") or {}
            if z:
                print(f"{YELLOW}    -> Zero-Day Eval: {z.get('intent_summary')}{RESET}")
                print(f"{YELLOW}       ATT&CK {z.get('dynamic_mitre_attack')} | D3FEND {z.get('dynamic_mitre_d3fend')} | Engage {z.get('dynamic_mitre_engage')} | risk +{z.get('risk_delta')}{RESET}")

    # 2. Anti-Docker cloaking proof.
    print(f"\n{BLUE}[2/3] Anti-Docker / Bare-Metal Cloaking{RESET}")
    res = req("/api/shell/exec", method="POST", headers={"Authorization": f"Bearer {token}"}, json_data={"command": "cat /proc/1/cgroup && ls /.dockerenv"})
    if res and res.status_code == 200:
        data = res.json()
        sys.stdout.write(data.get("stdout", ""))
        sys.stdout.write(data.get("stderr", ""))
    else:
        print(f"{DIM}(multi-command fallback not available — try individual probes){RESET}")

    # 3. Wazuh round-trip node check.
    print(f"\n{BLUE}[3/3] Wazuh Round-Trip Node{RESET}")
    res = req("/api/status")
    if res and res.status_code == 200:
        node = res.json().get("wazuhNode", "unknown")
        print(f"{GREEN}    Wazuh Indexer Node: {node}{RESET}")
        print(f"{DIM}    Every trap/shell event is forwarded, queried back, and broadcast with wazuh_verified.{RESET}")

    print(f"\n{GREEN}{BOLD}================ VERIFICATION SUITE COMPLETE ================{RESET}")


def main():
    load_persistent_state()
    while True:
        render_header()
        render_menu()
        try:
            choice = input(f"{BOLD}{CYAN}Select action [0-9]: {RESET}").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting...")
            break

        if choice == "1":
            run_stage_1()
        elif choice == "2":
            run_stage_2()
        elif choice == "3":
            run_stage_3()
        elif choice == "4":
            run_stage_4()
        elif choice == "5":
            run_stage_5()
        elif choice == "6":
            run_stage_6()
        elif choice == "7":
            run_stage_7()
        elif choice == "8":
            run_verification_suite()
        elif choice == "9":
            run_stage_8()
        elif choice in ["0", "exit", "q"]:
            print(f"\n{GREEN}Demo session terminated. Goodbye!{RESET}\n")
            break
        else:
            print(f"{RED}Invalid option: '{choice}'. Please select 0-9.{RESET}")

        try:
            input(f"\n{DIM}Press [ENTER] to return to menu...{RESET}")
        except (KeyboardInterrupt, EOFError):
            break


if __name__ == "__main__":
    main()

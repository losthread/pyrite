"""
VYUH (CHAKRAVYUH) // Cowrie-Style Stateful Shadow Shell Engine
Simulates high-fidelity Ubuntu / K8s bash execution environments.
Fast-path sub-2ms command execution with realistic command parsing,
Crumb #3 honeytoken minting, and dynamic Ubuntu fallback.
"""

import time
from typing import Dict, Any
from app.core.crumb_crypto import mint_crumb
from app.core.shadow_world import get_active_topology


def execute_virtual_shell(command: str, session: Dict[str, Any], ja4h: str) -> Dict[str, Any]:
    """
    Executes a shell command in the context of an attacker's Shadow World.
    """
    trimmed = (command or "").strip()
    if not trimmed:
        return {"stdout": "", "stderr": "", "exit_code": 0, "crumb_minted": None}

    # Record command in attacker's shadow history
    session["command_history"].append({
        "cmd": trimmed,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    })

    topology = get_active_topology()
    persona = topology["persona"]
    seed_id = topology["seed_id"]
    hostname = persona.get("stage3_hostname", "devops-jumpbox-01")
    ip = persona.get("stage3_host", "10.24.0.15")
    stage4_endpoint = persona.get("stage4_endpoint", "/vault/v1/export")

    # Mint Crumb #3 for vault access discovery
    crumb3 = mint_crumb(3, ja4h, seed_id)
    session["crumbs"]["stage3"] = crumb3

    clean_cmd = trimmed
    if clean_cmd.startswith("sudo "):
        clean_cmd = clean_cmd[5:].strip()

    # 1. Fast-Path Linux Commands
    if clean_cmd == "whoami":
        return {"stdout": "deployer\n", "stderr": "", "exit_code": 0, "crumb_minted": None}

    elif clean_cmd == "id":
        return {
            "stdout": "uid=1001(deployer) gid=1001(deployer) groups=1001(deployer),27(sudo),999(docker)\n",
            "stderr": "",
            "exit_code": 0,
            "crumb_minted": None
        }

    elif clean_cmd == "hostname":
        return {"stdout": f"{hostname}\n", "stderr": "", "exit_code": 0, "crumb_minted": None}

    elif clean_cmd == "uname -a":
        return {
            "stdout": f"Linux {hostname} 5.15.0-88-generic #98-Ubuntu SMP Mon Oct 2 15:18:56 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux\n",
            "stderr": "",
            "exit_code": 0,
            "crumb_minted": None
        }

    elif clean_cmd == "pwd":
        return {"stdout": "/home/deployer\n", "stderr": "", "exit_code": 0, "crumb_minted": None}

    elif clean_cmd in ["ls", "ls -l", "ls -la", "ls -al"]:
        return {
            "stdout": """total 44
drwxr-xr-x 6 deployer deployer 4096 Oct 31 08:20 .
drwxr-xr-x 3 root     root     4096 Oct 20 11:00 ..
-rw------- 1 deployer deployer 1420 Oct 31 08:35 .bash_history
-rw-r--r-- 1 deployer deployer  220 Jan  6  2022 .bash_logout
-rw-r--r-- 1 deployer deployer 3771 Jan  6  2022 .bashrc
drwx------ 2 deployer deployer 4096 Oct 25 14:12 .ssh
drwxr-xr-x 2 deployer deployer 4096 Oct 31 08:15 /opt/scripts
-rw-r--r-- 1 deployer deployer  807 Jan  6  2022 .profile
-rw-r--r-- 1 deployer deployer  112 Oct 31 07:44 README.vault.txt
""",
            "stderr": "",
            "exit_code": 0,
            "crumb_minted": None
        }

    elif clean_cmd in ["cat .bash_history", "tail .bash_history", "history"]:
        return {
            "stdout": f"""cd /opt/scripts
./health_check.sh
docker ps
git pull origin main
# Automated Cold Vault Replication Test
curl -s -H "X-Vault-Key: {crumb3}" http://localhost:8000{stage4_endpoint} -o /tmp/vault_backup.dat
ls -lh /tmp/vault_backup.dat
rm /tmp/vault_backup.dat
# deployer session ended
history -c
exit
""",
            "stderr": "",
            "exit_code": 0,
            "crumb_minted": crumb3
        }

    elif clean_cmd in ["cat /opt/scripts/vault_sync.sh", "cat /opt/scripts/sync.sh", "cat vault_sync.sh"]:
        return {
            "stdout": f"""#!/usr/bin/env bash
# ==============================================================================
# VYUH INFRASTRUCTURE // Automated Cold Vault Snapshot Sync
# DO NOT COMMIT SECRETS TO PUBLIC REPOSITORIES
# ==============================================================================
set -euo pipefail

VAULT_ENDPOINT="http://localhost:8000{stage4_endpoint}"
VAULT_KEY="{crumb3}"
BACKUP_DIR="/var/backups/cold_vault"

echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] Starting automated snapshot sync..."
mkdir -p "$BACKUP_DIR"

curl -f -s -S \\
  -H "X-Vault-Key: $VAULT_KEY" \\
  "$VAULT_ENDPOINT" > "$BACKUP_DIR/snapshot_$(date +%Y%m%d).parquet"

echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] Cold storage snapshot verified."
""",
            "stderr": "",
            "exit_code": 0,
            "crumb_minted": crumb3
        }

    elif clean_cmd == "cat README.vault.txt":
        return {
            "stdout": f"NOTICE: Direct access to Cold Vault storage requires master authorization.\nUse /opt/scripts/vault_sync.sh to verify automated replication keys.\nCurrent replica target: {stage4_endpoint}\n",
            "stderr": "",
            "exit_code": 0,
            "crumb_minted": None
        }

    elif clean_cmd in ["ps aux", "ps -ef"]:
        return {
            "stdout": """USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  0.0  0.2 168392 12112 ?        Ss   08:00   0:02 /sbin/init
root         241  0.0  0.1  43120  6144 ?        Ss   08:00   0:00 /lib/systemd/systemd-journald
deployer    1042  0.0  0.4 712300 24190 ?        Ssl  08:10   0:04 /usr/bin/python3 /opt/vault/main.py
deployer    1198  0.0  0.2  14210  4120 pts/0    Ss   08:20   0:00 -bash
deployer    1250  0.0  0.1  18920  2100 pts/0    R+   08:35   0:00 ps aux
""",
            "stderr": "",
            "exit_code": 0,
            "crumb_minted": None
        }

    elif clean_cmd in ["netstat -tulnp", "ss -tulpn"]:
        return {
            "stdout": """Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name    
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      892/sshd: /usr/sbin 
tcp        0      0 0.0.0.0:8000            0.0.0.0:*               LISTEN      1042/python3 (vyuh-vault)
tcp        0      0 127.0.0.1:5432          0.0.0.0:*               LISTEN      771/postgres        
tcp6       0      0 :::22                   :::*                    LISTEN      892/sshd: /usr/sbin 
""",
            "stderr": "",
            "exit_code": 0,
            "crumb_minted": None
        }

    elif clean_cmd in ["env", "printenv"]:
        return {
            "stdout": f"""SHELL=/bin/bash
USER=deployer
HOME=/home/deployer
HOST_IP={ip}
VAULT_ENDPOINT=http://localhost:8000{stage4_endpoint}
INTERNAL_CLUSTER=vyuh-prod-east-01
LOGNAME=deployer
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
""",
            "stderr": "",
            "exit_code": 0,
            "crumb_minted": None
        }

    elif clean_cmd in ["ifconfig", "ip a", "ip addr"]:
        return {
            "stdout": f"""1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    inet 127.0.0.1/8 scope host lo
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
    inet {ip}/24 brd 10.24.0.255 scope global eth0
""",
            "stderr": "",
            "exit_code": 0,
            "crumb_minted": None
        }

    elif clean_cmd == "cat /etc/os-release":
        return {
            "stdout": """PRETTY_NAME="Ubuntu 22.04.3 LTS"
NAME="Ubuntu"
VERSION_ID="22.04"
VERSION="22.04.3 LTS (Jammy Jellyfish)"
VERSION_CODENAME=jammy
ID=ubuntu
ID_LIKE=debian
""",
            "stderr": "",
            "exit_code": 0,
            "crumb_minted": None
        }

    # 2. Dynamic Fallback Handlers
    if clean_cmd.startswith("cat ") or clean_cmd.startswith("head ") or clean_cmd.startswith("tail "):
        parts = clean_cmd.split()
        target_file = parts[1] if len(parts) > 1 else ""
        if "id_rsa" in target_file:
            return {"stdout": "", "stderr": f"cat: {target_file}: Permission denied\n", "exit_code": 1, "crumb_minted": None}
        return {"stdout": "", "stderr": f"cat: {target_file}: No such file or directory\n", "exit_code": 1, "crumb_minted": None}

    if clean_cmd.startswith("cd "):
        return {"stdout": "", "stderr": "", "exit_code": 0, "crumb_minted": None}

    if clean_cmd.startswith("curl ") or clean_cmd.startswith("wget "):
        return {
            "stdout": "HTTP/1.1 200 OK\nTransfer-Encoding: chunked\nConnected to Cold Vault Storage Service...\n",
            "stderr": "",
            "exit_code": 0,
            "crumb_minted": None
        }

    # Default unknown command
    first_word = clean_cmd.split()[0] if clean_cmd.split() else "command"
    return {"stdout": "", "stderr": f"bash: {first_word}: command not found\n", "exit_code": 127, "crumb_minted": None}

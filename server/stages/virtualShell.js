/**
 * AETHER-LABYRINTH // Stateful Shadow Shell Engine
 * Simulates high-fidelity Ubuntu / K8s bash execution environments.
 * Fast-path sub-2ms command execution with realistic command parsing,
 * breadcrumb #3 minting, and dynamic fallback.
 */

import { mintCrumb } from '../core/crumbCrypto.js';
import { getActiveTopology } from '../core/shadowWorld.js';

/**
 * Executes a shell command in the context of an attacker's Shadow World.
 *
 * @param {string} command - Shell command string
 * @param {object} session - Attacker's Shadow World session
 * @param {string} ja4h - Attacker JA4H fingerprint
 * @returns {{ stdout: string, stderr: string, exitCode: number, crumbMinted?: string }}
 */
export function executeVirtualShell(command, session, ja4h) {
  const trimmed = (command || '').trim();
  if (!trimmed) {
    return { stdout: '', stderr: '', exitCode: 0 };
  }

  // Record command in attacker's shadow history
  session.commandHistory.push({
    cmd: trimmed,
    timestamp: new Date().toISOString()
  });

  const { seedId, persona } = getActiveTopology();
  const hostname = persona.stage3Hostname || 'devops-jumpbox-01';
  const ip = persona.stage3Host || '10.24.0.15';
  const stage4Endpoint = persona.stage4Endpoint || '/vault/v1/export';

  // Mint Crumb #3 for vault access discovery
  const crumb3 = mintCrumb(3, ja4h, seedId);
  session.crumbs.stage3 = crumb3;

  // Split command line or handle pipes
  const cleanCmd = trimmed.replace(/^sudo\s+/, '');

  // 1. Fast-Path Linux Commands
  switch (cleanCmd) {
    case 'whoami':
      return { stdout: 'deployer\n', stderr: '', exitCode: 0 };

    case 'id':
      return {
        stdout: 'uid=1001(deployer) gid=1001(deployer) groups=1001(deployer),27(sudo),999(docker)\n',
        stderr: '',
        exitCode: 0
      };

    case 'hostname':
      return { stdout: `${hostname}\n`, stderr: '', exitCode: 0 };

    case 'uname -a':
      return {
        stdout: `Linux ${hostname} 5.15.0-88-generic #98-Ubuntu SMP Mon Oct 2 15:18:56 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux\n`,
        stderr: '',
        exitCode: 0
      };

    case 'pwd':
      return { stdout: '/home/deployer\n', stderr: '', exitCode: 0 };

    case 'ls':
    case 'ls -l':
    case 'ls -la':
    case 'ls -al':
      return {
        stdout: `total 44
drwxr-xr-x 6 deployer deployer 4096 Oct 31 08:20 .
drwxr-xr-x 3 root     root     4096 Oct 20 11:00 ..
-rw------- 1 deployer deployer 1420 Oct 31 08:35 .bash_history
-rw-r--r-- 1 deployer deployer  220 Jan  6  2022 .bash_logout
-rw-r--r-- 1 deployer deployer 3771 Jan  6  2022 .bashrc
drwx------ 2 deployer deployer 4096 Oct 25 14:12 .ssh
drwxr-xr-x 2 deployer deployer 4096 Oct 31 08:15 /opt/scripts
-rw-r--r-- 1 deployer deployer  807 Jan  6  2022 .profile
-rw-r--r-- 1 deployer deployer  112 Oct 31 07:44 README.vault.txt
`,
        stderr: '',
        exitCode: 0
      };

    case 'cat .bash_history':
    case 'tail .bash_history':
    case 'history':
      return {
        stdout: `cd /opt/scripts
./health_check.sh
docker ps
git pull origin main
# Automated Cold Vault Replication Test
curl -s -H "X-Vault-Key: ${crumb3}" http://localhost:4000${stage4Endpoint} -o /tmp/vault_backup.dat
ls -lh /tmp/vault_backup.dat
rm /tmp/vault_backup.dat
# deployer session ended
history -c
exit
`,
        stderr: '',
        exitCode: 0,
        crumbMinted: crumb3
      };

    case 'cat /opt/scripts/vault_sync.sh':
    case 'cat /opt/scripts/sync.sh':
    case 'cat vault_sync.sh':
      return {
        stdout: `#!/usr/bin/env bash
# ==============================================================================
# AETHER INFRASTRUCTURE // Automated Cold Vault Snapshot Sync
# DO NOT COMMIT SECRETS TO PUBLIC REPOSITORIES
# ==============================================================================
set -euo pipefail

VAULT_ENDPOINT="http://localhost:4000${stage4Endpoint}"
VAULT_KEY="${crumb3}"
BACKUP_DIR="/var/backups/cold_vault"

echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] Starting automated snapshot sync..."
mkdir -p "$BACKUP_DIR"

curl -f -s -S \\
  -H "X-Vault-Key: $VAULT_KEY" \\
  "$VAULT_ENDPOINT" > "\$BACKUP_DIR/snapshot_\$(date +%Y%m%d).parquet"

echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] Cold storage snapshot verified."
`,
        stderr: '',
        exitCode: 0,
        crumbMinted: crumb3
      };

    case 'cat README.vault.txt':
      return {
        stdout: `NOTICE: Direct access to Cold Vault storage requires master authorization.
Use /opt/scripts/vault_sync.sh to verify automated replication keys.
Current replica target: ${stage4Endpoint}
`,
        stderr: '',
        exitCode: 0
      };

    case 'ps aux':
    case 'ps -ef':
      return {
        stdout: `USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  0.0  0.2 168392 12112 ?        Ss   08:00   0:02 /sbin/init
root         241  0.0  0.1  43120  6144 ?        Ss   08:00   0:00 /lib/systemd/systemd-journald
deployer    1042  0.0  0.4 712300 24190 ?        Ssl  08:10   0:04 /usr/local/bin/node /opt/vault/index.js
deployer    1198  0.0  0.2  14210  4120 pts/0    Ss   08:20   0:00 -bash
deployer    1250  0.0  0.1  18920  2100 pts/0    R+   08:35   0:00 ps aux
`,
        stderr: '',
        exitCode: 0
      };

    case 'netstat -tulnp':
    case 'ss -tulpn':
      return {
        stdout: `Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name    
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      892/sshd: /usr/sbin 
tcp        0      0 0.0.0.0:4000            0.0.0.0:*               LISTEN      1042/node (aether-vault)
tcp        0      0 127.0.0.1:5432          0.0.0.0:*               LISTEN      771/postgres        
tcp6       0      0 :::22                   :::*                    LISTEN      892/sshd: /usr/sbin 
`,
        stderr: '',
        exitCode: 0
      };

    case 'env':
    case 'printenv':
      return {
        stdout: `SHELL=/bin/bash
USER=deployer
HOME=/home/deployer
HOST_IP=${ip}
VAULT_ENDPOINT=http://localhost:4000${stage4Endpoint}
INTERNAL_CLUSTER=aether-prod-east-01
LOGNAME=deployer
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
`,
        stderr: '',
        exitCode: 0
      };

    case 'ifconfig':
    case 'ip a':
    case 'ip addr':
      return {
        stdout: `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    inet 127.0.0.1/8 scope host lo
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
    inet ${ip}/24 brd 10.24.0.255 scope global eth0
`,
        stderr: '',
        exitCode: 0
      };

    case 'cat /etc/os-release':
      return {
        stdout: `PRETTY_NAME="Ubuntu 22.04.3 LTS"
NAME="Ubuntu"
VERSION_ID="22.04"
VERSION="22.04.3 LTS (Jammy Jellyfish)"
VERSION_CODENAME=jammy
ID=ubuntu
ID_LIKE=debian
`,
        stderr: '',
        exitCode: 0
      };
  }

  // 2. Dynamic Command Fallbacks
  if (cleanCmd.startsWith('cat ') || cleanCmd.startsWith('head ') || cleanCmd.startsWith('tail ')) {
    const file = cleanCmd.split(/\s+/)[1];
    if (file === '.ssh/id_rsa' || file === '/home/deployer/.ssh/id_rsa') {
      return {
        stdout: '',
        stderr: `cat: ${file}: Permission denied\n`,
        exitCode: 1
      };
    }
    return {
      stdout: '',
      stderr: `cat: ${file}: No such file or directory\n`,
      exitCode: 1
    };
  }

  if (cleanCmd.startsWith('cd ')) {
    return { stdout: '', stderr: '', exitCode: 0 };
  }

  if (cleanCmd.startsWith('curl ') || cleanCmd.startsWith('wget ')) {
    return {
      stdout: `HTTP/1.1 200 OK\nTransfer-Encoding: chunked\nConnected to Cold Vault Storage Service...\n`,
      stderr: '',
      exitCode: 0
    };
  }

  // Generic realistic unknown command output
  return {
    stdout: '',
    stderr: `bash: ${cleanCmd.split(/\s+/)[0]}: command not found\n`,
    exitCode: 127
  };
}

export default {
  executeVirtualShell
};

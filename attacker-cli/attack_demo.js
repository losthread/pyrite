#!/usr/bin/env node

/**
 * ==============================================================================
 * AETHER-LABYRINTH // ACTIVE DECEPTION ATTACKER DEMO CLI
 * D3COY 1.0 — Problem Statement 04: Deception-Driven Threat Detection & Response
 * ==============================================================================
 * Interactive CLI demo for live pitch presentations.
 * Uses zero external npm dependencies (Node.js 18+ built-ins: readline, fetch, http).
 */

import readline from 'readline';

// ANSI terminal color constants
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgBlue: '\x1b[44m'
};

// Attacker Session State
const state = {
  targetUrl: process.env.AETHER_TARGET || 'http://localhost:4000',
  attackerIp: '185.220.101.4', // Pre-seeded for East-West correlation demo
  clientFingerprintOverride: null,
  activeSeed: 'Morph-v1.0 (Fintech-Git-SQLi)',
  persona: null,
  crumbs: {
    stage1: null,
    stage2: null,
    stage3: null
  },
  burnedCrumbs: []
};

// Helper: Make HTTP request with attacker context headers
async function request(path, options = {}) {
  const url = `${state.targetUrl}${path}`;
  const headers = {
    'User-Agent': 'curl/7.88.1 (x86_64-pc-linux-gnu) libcurl/7.88.1 OpenSSL/3.0.8',
    'Accept': 'application/json, text/plain, */*',
    'X-Forwarded-For': state.attackerIp,
    ...(options.headers || {})
  };

  if (state.clientFingerprintOverride) {
    headers['X-Client-Fingerprint'] = state.clientFingerprintOverride;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });
    return res;
  } catch (err) {
    return {
      ok: false,
      status: 0,
      text: async () => `Connection Error: ${err.message}`,
      json: async () => ({ error: err.message })
    };
  }
}

// Fetch current honeypot status & topology
async function syncStatus() {
  try {
    const res = await request('/api/status');
    if (res.ok) {
      const data = await res.json();
      state.activeSeed = data.activeSeed;
      state.persona = data.persona;
    }
  } catch (e) {
    // server might be starting
  }
}

// Format token snippet for display
function fmtToken(t) {
  if (!t) return `${c.dim}[Not Harvested]${c.reset}`;
  return `${c.green}${t.slice(0, 18)}...${t.slice(-6)}${c.reset}`;
}

// Render Header Banner
function renderHeader() {
  console.log(`
${c.cyan}${c.bold}╔══════════════════════════════════════════════════════════════════════════════╗
║               AETHER-LABYRINTH // ACTIVE DECEPTION DEMO CLI                  ║
║      Problem Statement 04: Deception-Driven Threat Detection & Response      ║
╚══════════════════════════════════════════════════════════════════════════════╝${c.reset}
  ${c.bold}Target Server:${c.reset}       ${c.yellow}${state.targetUrl}${c.reset}
  ${c.bold}Attacker IP:${c.reset}         ${c.red}${c.bold}${state.attackerIp}${c.reset} ${state.attackerIp === '185.220.101.4' ? `${c.bgRed}${c.white}[EAST-WEST PROD CORRELATED]${c.reset}` : `${c.blue}[VPN / PROXY HOP]${c.reset}`}
  ${c.bold}Client Fingerprint:${c.reset}  ${state.clientFingerprintOverride ? `${c.magenta}Override: ${state.clientFingerprintOverride} [SYNDICATE]${c.reset}` : `${c.dim}Default JA4H (Curl 7.88.1)${c.reset}`}
  ${c.bold}Active Topology:${c.reset}     ${c.cyan}${state.activeSeed}${c.reset}
  ──────────────────────────────────────────────────────────────────────────────
  ${c.bold}Harvested Honeytokens:${c.reset}
    • Stage 1 (Crumb #1):  ${fmtToken(state.crumbs.stage1)}
    • Stage 2 (Crumb #2):  ${fmtToken(state.crumbs.stage2)}
    • Stage 3 (Crumb #3):  ${fmtToken(state.crumbs.stage3)}
  ──────────────────────────────────────────────────────────────────────────────`);
}

// Render Menu
function renderMenu() {
  console.log(`
  ${c.bold}PROGRESSIVE 4-STAGE ATTACK CHAIN:${c.reset}
    ${c.cyan}[1]${c.reset} Run Stage 1: Recon Git/Env Leak Scan ${c.dim}(Harvest Crumb #1)${c.reset}
    ${c.cyan}[2]${c.reset} Run Stage 2: Exploit SQLi & Harvest SSH Token ${c.dim}(HoneyPatch Fork -> Crumb #2)${c.reset}
    ${c.cyan}[3]${c.reset} Run Stage 3: Connect to DevOps Jumpbox & Snoop Shell ${c.dim}(Virtual Ubuntu -> Crumb #3)${c.reset}
    ${c.cyan}[4]${c.reset} Run Stage 4: Exfiltrate Cold Storage Vault ${c.yellow}${c.bold}(Triggers Live Tarpit!)${c.reset}

  ${c.bold}DECEPTION & ATTRIBUTION TRIPWIRES:${c.reset}
    ${c.yellow}[5]${c.reset} Simulate IP Switch / VPN Hop ${c.dim}(Same JA4H, New IP -> Tests Cross-IP Attribution)${c.reset}
    ${c.magenta}[6]${c.reset} Simulate Hacker Syndicate Collusion ${c.dim}(Pass Stolen Key to Hacker B -> New JA4H Alert)${c.reset}
    ${c.red}[7]${c.reset} Replay Old Token After Topology Mutation ${c.dim}(Triggers Burned Token Tripwire!)${c.reset}
    ${c.blue}[8]${c.reset} Rotate Polymorphic Topology Seed ${c.dim}(Morph-v1.0 <-> Morph-v2.0)${c.reset}

    ${c.dim}[0] Exit Demo${c.reset}
`);
}

// -----------------------------------------------------------------------------
// Action Handlers
// -----------------------------------------------------------------------------

// [1] Run Stage 1: Recon Scan
async function runStage1() {
  await syncStatus();
  const endpoint = state.persona?.stage1Endpoint || '/.git/logs/HEAD';

  console.log(`\n${c.yellow}[*] Probing target for sensitive public leaks: GET ${endpoint}...${c.reset}`);
  const res = await request(endpoint);
  const text = await res.text();

  console.log(`${c.dim}--- HTTP Status: ${res.status} OK ---${c.reset}`);
  console.log(`${c.dim}${text.trim()}${c.reset}`);

  // Extract breadcrumb token: vk_live_<base64url>.<sig>
  const match = text.match(/vk_live_[A-Za-z0-9_-]+\.[a-f0-9]{10}/);
  if (match) {
    state.crumbs.stage1 = match[0];
    console.log(`\n${c.green}${c.bold}[+] SUCCESS: Discovered Crumb #1 Honeytoken!${c.reset}`);
    console.log(`    Token: ${c.cyan}${match[0]}${c.reset}`);
    console.log(`    ${c.dim}Next objective: Query internal endpoint with leaked authorization.${c.reset}`);
  } else {
    console.log(`\n${c.yellow}[!] No breadcrumb found in response. (Server might be quarantined)${c.reset}`);
  }
}

// [2] Run Stage 2: Exploit SQLi & Harvest SSH Honeytoken
async function runStage2() {
  await syncStatus();
  const endpoint = state.persona?.stage2Endpoint || '/api/internal/legacy-query';

  console.log(`\n${c.yellow}[*] Step 2a: Sending preliminary SQL syntax probe to ${endpoint}...${c.reset}`);

  // Step 2a: Single quote probe (ego boost error)
  const probeRes = await request(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Token': state.crumbs.stage1 || 'vk_live_probe'
    },
    body: JSON.stringify({ query: "SELECT * FROM users WHERE id = '1'" })
  });

  const probeJson = await probeRes.json();
  console.log(`${c.dim}--- Database Probe Error Response (Ego Boost) ---${c.reset}`);
  console.log(`${c.red}${JSON.stringify(probeJson, null, 2)}${c.reset}`);

  // Step 2b: SQLi Exploit payload
  console.log(`\n${c.yellow}[*] Step 2b: Injecting HoneyPatch SQLi payload: ' OR 1=1 UNION SELECT ...${c.reset}`);
  const exploitRes = await request(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Token': state.crumbs.stage1 || 'vk_live_probe'
    },
    body: JSON.stringify({
      query: "SELECT * FROM users WHERE id = '1' UNION SELECT * FROM devops_service_accounts --",
      exploit: true
    })
  });

  const exploitJson = await exploitRes.json();
  console.log(`${c.dim}--- HoneyPatch Fork Returned Dumped Service Accounts ---${c.reset}`);
  console.log(`${c.green}${JSON.stringify(exploitJson, null, 2)}${c.reset}`);

  const dumpedToken = exploitJson?.results?.[0]?.ssh_auth_token;
  if (dumpedToken) {
    state.crumbs.stage2 = dumpedToken;
    console.log(`\n${c.green}${c.bold}[+] SUCCESS: Harvested DevOps Jumpbox SSH Honeytoken (Crumb #2)!${c.reset}`);
    console.log(`    Jumpbox Host: ${c.cyan}${exploitJson.results[0].jumpbox_ip}${c.reset}`);
    console.log(`    SSH Auth Token: ${c.cyan}${dumpedToken}${c.reset}`);
  }
}

// [3] Run Stage 3: Shadow Shell Commands
async function runStage3() {
  const token = state.crumbs.stage2;
  if (!token) {
    console.log(`\n${c.yellow}[!] Warning: Crumb #2 not yet harvested. Running Stage 2 first or using fallback.${c.reset}`);
  }

  const commands = [
    'whoami',
    'hostname',
    'id',
    'ls -la',
    'cat .bash_history',
    'cat /opt/scripts/vault_sync.sh'
  ];

  console.log(`\n${c.yellow}[*] Connecting to DevOps Jumpbox /api/shell/exec using Crumb #2...${c.reset}`);

  for (const cmd of commands) {
    console.log(`\n${c.cyan}deployer@jumpbox:~$ ${c.bold}${cmd}${c.reset}`);
    const res = await request('/api/shell/exec', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token || 'vk_live_fallback'}`
      },
      body: JSON.stringify({ command: cmd })
    });

    const data = await res.json();
    if (data.stdout) {
      process.stdout.write(data.stdout);
    }
    if (data.stderr) {
      process.stderr.write(`${c.red}${data.stderr}${c.reset}`);
    }

    // Check if command revealed Crumb #3
    const match = (data.stdout || '').match(/vk_live_[A-Za-z0-9_-]+\.[a-f0-9]{10}/);
    if (match && !state.crumbs.stage3) {
      state.crumbs.stage3 = match[0];
    }
  }

  if (state.crumbs.stage3) {
    console.log(`\n${c.green}${c.bold}[+] SUCCESS: Discovered Cold Vault Master Key (Crumb #3)!${c.reset}`);
    console.log(`    Stolen Master Key: ${c.cyan}${state.crumbs.stage3}${c.reset}`);
    console.log(`    ${c.dim}Next objective: Exfiltrate cold storage vault via Stage 4!${c.reset}`);
  }
}

// [4] Run Stage 4: Live Adaptive Streaming Tarpit
async function runStage4() {
  await syncStatus();
  const token = state.crumbs.stage3;
  const endpoint = state.persona?.stage4Endpoint || '/vault/v1/export';

  console.log(`\n${c.yellow}[*] Initiating high-value cold vault exfiltration: GET ${endpoint}...${c.reset}`);
  console.log(`    ${c.dim}Using Master Key: ${token || 'vk_live_fallback'}${c.reset}`);
  console.log(`    ${c.yellow}${c.bold}[!] Live Chunked Tarpit Engaged: Data will drip slowly while SOC monitors.${c.reset}`);
  console.log(`    ${c.dim}Press Ctrl+C to abort early, or wait for SOC quarantine 504...${c.reset}\n`);

  const startTime = Date.now();
  let totalBytes = 0;

  try {
    const url = `${state.targetUrl}${endpoint}`;
    const headers = {
      'User-Agent': 'curl/7.88.1 (x86_64-pc-linux-gnu)',
      'X-Forwarded-For': state.attackerIp,
      'X-Vault-Key': token || 'vk_live_demo_fallback'
    };
    if (state.clientFingerprintOverride) {
      headers['X-Client-Fingerprint'] = state.clientFingerprintOverride;
    }

    const res = await fetch(url, { headers });

    if (res.status === 504) {
      const text = await res.text();
      console.log(`\n${c.red}${c.bold}[!] HTTP 504 Gateway Timeout (Plausible Failure WAF Drop Hit!)${c.reset}`);
      console.log(`${c.dim}${text.trim()}${c.reset}`);
      return;
    }

    if (!res.ok) {
      const err = await res.text();
      console.log(`\n${c.red}[-] Exfiltration Failed: HTTP ${res.status}\n${err}${c.reset}`);
      return;
    }

    // Stream chunks
    const reader = res.body.getReader();
    let chunkCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.length;
      chunkCount++;
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const speed = ((totalBytes / (elapsed || 1)) / 1024).toFixed(2);

      // Check if server dropped WAF 504 in the stream
      const chunkStr = new TextDecoder().decode(value);
      if (chunkStr.includes('AWS WAF ERROR 504')) {
        console.log(`\n${c.bgRed}${c.white}${c.bold} [PLAUSIBLE WAF DROP DETECTED] ${c.reset} ${c.red}Server terminated stream: AWS-WAF-RULE-942100 Gateway Timeout${c.reset}`);
        break;
      }

      process.stdout.write(`\r  ${c.cyan}Exfiltrating chunk #${chunkCount}:${c.reset} ${totalBytes} bytes received | ${c.yellow}${speed} KB/s${c.reset} | Elapsed: ${c.white}${elapsed}s${c.reset}`);

      // Stop after 16 chunks for demo if not aborted
      if (chunkCount >= 16) {
        console.log(`\n\n${c.green}[+] Attacker received partial exfiltration bundle (${totalBytes} bytes).${c.reset}`);
        break;
      }
    }
  } catch (err) {
    console.log(`\n${c.red}[-] Stream interrupted: ${err.message}${c.reset}`);
  }
}

// [5] Simulate IP Switch / VPN Hop (Same JA4H, New IP)
async function runStage5() {
  const oldIp = state.attackerIp;
  state.attackerIp = '194.26.29.112'; // Mullvad VPN Exit Node Frankfurt

  console.log(`\n${c.yellow}[*] Simulating VPN Hop: Attacker rotated IP address!${c.reset}`);
  console.log(`    Previous IP: ${c.dim}${oldIp}${c.reset}`);
  console.log(`    New VPN IP:  ${c.green}${c.bold}${state.attackerIp}${c.reset}`);
  console.log(`    ${c.cyan}HTTP Client Signature (JA4H) remains constant.${c.reset}`);
  console.log(`    Sending probe to honeypot to verify Cross-IP Attribution...`);

  const res = await request('/api/stage1');
  console.log(`    Response Status: ${res.status} OK`);
  console.log(`\n${c.green}${c.bold}[+] VERIFIED: SOC dashboard alerted "ipChanged: true" and maintained continuous session tracking!${c.reset}`);
}

// [6] Simulate Hacker Syndicate Sharing (New JA4H / Tool Switch)
async function runStage6() {
  console.log(`\n${c.magenta}[*] Simulating Hacker Syndicate Collusion: Passing Crumb #2 to Hacker B!${c.reset}`);
  const previousOverride = state.clientFingerprintOverride;

  // Change JA4H override to simulate distinct machine / client
  state.clientFingerprintOverride = 'syndicate_actor_bravo_9921';
  const token = state.crumbs.stage2 || state.crumbs.stage1 || 'vk_live_demo_crumb';

  console.log(`    Original Attacker JA4H: ${c.dim}Default Curl Client${c.reset}`);
  console.log(`    Hacker B JA4H:          ${c.magenta}${c.bold}syndicate_actor_bravo_9921${c.reset}`);
  console.log(`    Replaying Stolen Token: ${c.cyan}${token.slice(0, 20)}...${c.reset}`);

  const res = await request('/api/shell/exec', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ command: 'whoami' })
  });

  const json = await res.json();
  console.log(`    Server Response: ${JSON.stringify(json)}`);
  console.log(`\n${c.red}${c.bold}[!] COLLUSION ALERT TRIGGERED ON SOC: "tokenShared: true"!${c.reset}`);
  console.log(`    ${c.dim}The SOC detected a lateral token handover across distinct clients with zero DB lookups.${c.reset}`);

  // Restore
  state.clientFingerprintOverride = previousOverride;
}

// [7] Replay Old Token After Topology Mutation (Burned Token Tripwire)
async function runStage7() {
  console.log(`\n${c.red}[*] Testing Burned Token Tripwire: Replaying token from obsolete topology...${c.reset}`);

  // Save current token as burned
  const staleToken = state.crumbs.stage2 || state.crumbs.stage1;
  if (!staleToken) {
    console.log(`${c.yellow}[!] Please run Stage 1 or Stage 2 first to harvest a token.${c.reset}`);
    return;
  }

  // Mutate topology on server first
  console.log(`    1. Rotating honeypot topology on server...`);
  await request('/api/mutate', { method: 'POST' });
  await syncStatus();
  console.log(`    2. New Server Active Seed: ${c.cyan}${state.activeSeed}${c.reset}`);
  console.log(`    3. Replaying obsolete token: ${c.dim}${staleToken.slice(0, 25)}...${c.reset}`);

  const res = await request('/api/shell/exec', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staleToken}`
    },
    body: JSON.stringify({ command: 'ls -la' })
  });

  console.log(`\n${c.red}${c.bold}[!] BURNED TOKEN TRIPWIRE TRIGGERED ON SOC: "topologyMutated: true"!${c.reset}`);
  console.log(`    ${c.dim}The server detected that the adversary is replaying a token issued prior to the polymorphic rotation.${c.reset}`);
}

// [8] Rotate Topology
async function runStage8() {
  console.log(`\n${c.blue}[*] Rotating honeypot polymorphic topology...${c.reset}`);
  const res = await request('/api/mutate', { method: 'POST' });
  const data = await res.json();
  state.activeSeed = data.newSeed;
  state.persona = data.persona;
  console.log(`\n${c.green}${c.bold}[+] Topology Successfully Rotated!${c.reset}`);
  console.log(`    New Seed: ${c.cyan}${data.newSeed}${c.reset}`);
  console.log(`    Stage 1:  ${data.persona.stage1Endpoint}`);
  console.log(`    Stage 2:  ${data.persona.stage2Endpoint}`);
  console.log(`    Stage 3:  ${data.persona.stage3Hostname} (${data.persona.stage3Host})`);
  console.log(`    Stage 4:  ${data.persona.stage4Endpoint}`);
}

// -----------------------------------------------------------------------------
// Interactive Readline CLI Loop
// -----------------------------------------------------------------------------
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function promptUser() {
  renderHeader();
  renderMenu();
  rl.question(`${c.bold}${c.cyan}Select action [0-8]: ${c.reset}`, async (answer) => {
    const choice = answer.trim();

    switch (choice) {
      case '1':
        await runStage1();
        break;
      case '2':
        await runStage2();
        break;
      case '3':
        await runStage3();
        break;
      case '4':
        await runStage4();
        break;
      case '5':
        await runStage5();
        break;
      case '6':
        await runStage6();
        break;
      case '7':
        await runStage7();
        break;
      case '8':
        await runStage8();
        break;
      case '0':
      case 'exit':
      case 'q':
        console.log(`\n${c.green}Demo session terminated. Goodbye!${c.reset}\n`);
        rl.close();
        process.exit(0);
        return;
      default:
        console.log(`${c.red}Invalid option: "${choice}". Please choose 0-8.${c.reset}`);
    }

    rl.question(`\n${c.dim}Press [ENTER] to return to menu...${c.reset}`, () => {
      promptUser();
    });
  });
}

// Initialize and start CLI
(async () => {
  await syncStatus();
  promptUser();
})();

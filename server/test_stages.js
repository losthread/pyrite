// Test script for verifying AETHER-LABYRINTH stages

async function runTests() {
  const assert = (cond, msg) => {
    if (!cond) throw new Error('ASSERTION FAILED: ' + msg);
    console.log('  [PASS] ' + msg);
  };

  console.log('[*] Testing Stage 1: Recon Leak...');
  const res1 = await fetch('http://localhost:4000/.git/logs/HEAD', {
    headers: { 'X-Forwarded-For': '185.220.101.4' }
  });
  const text1 = await res1.text();
  assert(res1.status === 200, 'Stage 1 HTTP 200 OK');
  const tokenMatch1 = text1.match(/vk_live_[A-Za-z0-9_-]+\.[a-f0-9]{10}/);
  assert(tokenMatch1 !== null, 'Stage 1 leaked Crumb #1: ' + tokenMatch1?.[0]);
  const crumb1 = tokenMatch1[0];

  console.log('\n[*] Testing Stage 2: SQLi Ego Boost Probe...');
  const res2Probe = await fetch('http://localhost:4000/api/internal/legacy-query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Token': crumb1,
      'X-Forwarded-For': '185.220.101.4'
    },
    body: JSON.stringify({ query: "SELECT * FROM users WHERE id = '1'" })
  });
  const json2Probe = await res2Probe.json();
  assert(res2Probe.status === 500, 'Stage 2 probe returns 500 DB error');
  assert(json2Probe.error.includes('syntax error'), 'Verbose Postgres error returned');

  console.log('\n[*] Testing Stage 2: HoneyPatch Session Fork...');
  const res2Exploit = await fetch('http://localhost:4000/api/internal/legacy-query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Token': crumb1,
      'X-Forwarded-For': '185.220.101.4'
    },
    body: JSON.stringify({ query: "' UNION SELECT * FROM devops_service_accounts --", exploit: true })
  });
  const json2Exploit = await res2Exploit.json();
  assert(res2Exploit.status === 200, 'Stage 2 exploit HTTP 200 OK');
  const crumb2 = json2Exploit.results[0].ssh_auth_token;
  assert(crumb2.startsWith('vk_live_'), 'Stage 2 yielded Crumb #2: ' + crumb2);

  console.log('\n[*] Testing Stage 3: Virtual Shadow Shell...');
  const res3 = await fetch('http://localhost:4000/api/shell/exec', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + crumb2,
      'X-Forwarded-For': '185.220.101.4'
    },
    body: JSON.stringify({ command: 'cat .bash_history' })
  });
  const json3 = await res3.json();
  assert(res3.status === 200, 'Stage 3 shell HTTP 200 OK');
  const tokenMatch3 = json3.stdout.match(/vk_live_[A-Za-z0-9_-]+\.[a-f0-9]{10}/);
  assert(tokenMatch3 !== null, 'Stage 3 yielded Crumb #3: ' + tokenMatch3?.[0]);
  const crumb3 = tokenMatch3[0];

  console.log('\n[*] Testing Stage 4: Tarpit Header Response...');
  const res4 = await fetch('http://localhost:4000/vault/v1/export', {
    headers: {
      'X-Vault-Key': crumb3,
      'X-Forwarded-For': '185.220.101.4'
    }
  });
  assert(res4.status === 200, 'Stage 4 HTTP 200 OK');
  assert(res4.headers.get('content-type') === 'application/octet-stream', 'Streaming octet-stream header');
  // Read first chunk
  const reader = res4.body.getReader();
  const chunk = await reader.read();
  assert(chunk.value.length > 0, `Received first tarpit chunk: ${chunk.value.length} bytes`);
  reader.cancel();

  console.log('\n[*] Testing Status & Shadow Worlds...');
  const resStatus = await fetch('http://localhost:4000/api/shadow-worlds');
  const jsonStatus = await resStatus.json();
  assert(jsonStatus.sessions.length > 0, 'Shadow world session successfully tracked');
  assert(jsonStatus.sessions[0].prodCorrelated === true, 'East-West correlation confirmed (185.220.101.4)');

  console.log('\n[🎉] ALL TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('\n[❌] TEST FAILED:', err);
  process.exit(1);
});

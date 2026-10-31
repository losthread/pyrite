/**
 * AETHER-LABYRINTH // 4 Progressive "Earned Greed" Trap Stages
 * Express Router implementing Stage 1 (Recon Leak), Stage 2 (HoneyPatched SQLi/GraphQL),
 * Stage 3 (Shadow Shell Exec), and Stage 4 (Adaptive Chunked Tarpit Exfiltration).
 * Includes Plausible Failure Exit Middleware (AWS WAF / Cloudflare 504 Gateway Timeout).
 */

import express from 'express';
import crypto from 'crypto';
import { extractClientIdentity } from '../core/ja4h.js';
import { mintCrumb, verifyCrumb } from '../core/crumbCrypto.js';
import {
  getActiveTopology,
  getOrCreateShadowWorld,
  updateThreatScore,
  getAllShadowWorlds,
  prodAuthLogs,
  mutateTopology
} from '../core/shadowWorld.js';
import { executeVirtualShell } from './virtualShell.js';

export function createTrapRouter(io) {
  const router = express.Router();

  // Helper: Emit standardized soc_telemetry event
  function emitSocTelemetry({
    stage,
    ip,
    ja4h,
    ipChanged,
    tokenShared = false,
    topologyMutated = false,
    prodCorrelated,
    title,
    endpoint,
    rawPayload,
    crumbMinted = null,
    crumbUsed = null,
    attackId,
    attackName,
    engageId,
    engageName,
    threatScore,
    dwellTimeSeconds,
    polymorphicSeed
  }) {
    const event = {
      eventId: `evt_${Date.now()}_${ja4h.slice(0, 4)}`,
      timestamp: new Date().toTimeString().split(' ')[0] + '.' + String(Date.now() % 1000).padStart(3, '0'),
      stage: Number(stage),
      attacker: {
        ip,
        ja4h,
        ipChanged: Boolean(ipChanged),
        tokenShared: Boolean(tokenShared),
        topologyMutated: Boolean(topologyMutated),
        prodCorrelated: Boolean(prodCorrelated)
      },
      action: {
        title,
        endpoint,
        rawPayload: String(rawPayload || '').slice(0, 300),
        crumbMinted,
        crumbUsed
      },
      mitre: {
        attack: { id: attackId, name: attackName },
        engage: { id: engageId, name: engageName }
      },
      metrics: {
        threatScore,
        dwellTimeSeconds,
        polymorphicSeed
      }
    };

    if (io) {
      io.emit('soc_telemetry', event);
    }
    return event;
  }

  // ---------------------------------------------------------------------------
  // Plausible Failure Exit Middleware
  // If attacker's ja4h is quarantined, return realistic AWS WAF / Cloudflare 504
  // ---------------------------------------------------------------------------
  router.use((req, res, next) => {
    // Exempt status inspection APIs from WAF drop
    if (req.path.startsWith('/api/status') || req.path.startsWith('/api/shadow-worlds') || req.path.startsWith('/api/prod-logs')) {
      return next();
    }

    const { ip, ja4h } = extractClientIdentity(req);
    const { session } = getOrCreateShadowWorld(ja4h, ip);

    if (session && session.plausibleWafDrop) {
      const isHtml = (req.headers.accept || '').includes('text/html');
      const rayId = crypto.randomBytes(8).toString('hex');

      if (isHtml) {
        return res.status(504).send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>504 Gateway Time-out - Cloudflare Ray ID: ${rayId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #1f2227; color: #b0b4bb; padding: 60px 20px; text-align: center; }
    h1 { font-size: 48px; color: #ffffff; margin-bottom: 8px; }
    p { font-size: 16px; margin: 12px 0; }
    .code { font-family: monospace; background: #2b2f36; padding: 4px 8px; border-radius: 4px; color: #f85149; }
    .footer { margin-top: 40px; font-size: 13px; color: #6e7681; }
  </style>
</head>
<body>
  <h1>504 Gateway Time-out</h1>
  <p>The upstream origin server did not respond within the configured timeout window.</p>
  <p>Triggered by Security Rule: <span class="code">AWS-WAF-RULE-942100 (RateLimitExceeded)</span></p>
  <div class="footer">Cloudflare Ray ID: <strong>${rayId}</strong> &bull; Client IP: ${ip}</div>
</body>
</html>
        `);
      }

      return res.status(504).json({
        error: 'Upstream Gateway Timeout',
        error_code: 'WAF_504_TIMEOUT',
        cloudflare_ray_id: rayId,
        rule_id: 'AWS-WAF-RULE-942100',
        message: 'The upstream origin server did not respond within the allocated timeout limit.',
        incident_id: `inc_waf_${Date.now().toString(36)}`
      });
    }

    next();
  });

  // ---------------------------------------------------------------------------
  // STAGE 1: Recon Leak
  // Leaks internal stage 2 endpoint and Crumb #1
  // Handles Persona A (/.git/logs/HEAD) and Persona B (/.env.staging)
  // ---------------------------------------------------------------------------
  function handleStage1(req, res) {
    const { ip, ja4h } = extractClientIdentity(req);
    const { session, ipChanged, prodCorrelated } = getOrCreateShadowWorld(ja4h, ip);
    const { seedId, persona } = getActiveTopology();

    session.highestStage = Math.max(session.highestStage, 1);
    updateThreatScore(ja4h, 15);

    // Mint Crumb #1
    const crumb1 = mintCrumb(1, ja4h, seedId);
    session.crumbs.stage1 = crumb1;

    const dwellTimeSeconds = Math.floor((Date.now() - session.createdAt) / 1000);

    emitSocTelemetry({
      stage: 1,
      ip,
      ja4h,
      ipChanged,
      prodCorrelated,
      title: 'Stage 1 Recon Probe Leaked Breadcrumb',
      endpoint: req.originalUrl,
      rawPayload: `${req.method} ${req.originalUrl}`,
      crumbMinted: crumb1,
      crumbUsed: null,
      attackId: 'T1592',
      attackName: 'Gather Victim Host Information',
      engageId: 'EAC0001',
      engageName: 'Lure Attacker with Leaked Context',
      threatScore: session.threatScore,
      dwellTimeSeconds,
      polymorphicSeed: seedId
    });

    if (seedId.includes('Morph-v1.0')) {
      // Persona A: Realistic Git Reflog Leak
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(
`0000000000000000000000000000000000000000 4a8b29c3d0f1e8a7192039485720192837461029 devops-admin <infra@aether-fintech.internal> 1730380000 +0000 commit (initial): init repo
4a8b29c3d0f1e8a7192039485720192837461029 9f1e82b7c6d5e4a3b2c1d0e9f8a7b6c5d4e3f2a1 devops-admin <infra@aether-fintech.internal> 1730382000 +0000 commit: [HOTFIX] Expose legacy query endpoint for analytics migration: POST ${persona.stage2Endpoint} (Requires debug header: X-Debug-Token: ${crumb1}) -- DO NOT DEPLOY TO PRODUCTION!
`
      );
    } else {
      // Persona B: Realistic .env.staging Leak
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(
`# ==============================================================================
# CONFIDENTIAL // STAGING CLOUD ENVIRONMENT OVERRIDES
# AUTOMATED REPLICATION WORKER CONFIGURATION
# ==============================================================================
ENVIRONMENT=staging
INTERNAL_GRAPHQL_DEBUG_URL=${persona.stage2Endpoint}
STAGE_AUTH_TOKEN=${crumb1}
DATABASE_DSN=postgres://read_only_proxy:pass123@172.16.8.12:5432/fintech_staging
AWS_S3_VAULT_BUCKET=aether-treasury-keys-staging
K8S_SERVICE_HOST=${persona.stage3Host}
`
      );
    }
  }

  // Persona A Route
  router.get('/.git/logs/HEAD', handleStage1);
  // Persona B Route
  router.get('/.env.staging', handleStage1);
  // Generic Stage 1 Endpoint for easy testing
  router.get('/api/stage1', handleStage1);

  // ---------------------------------------------------------------------------
  // STAGE 2: HoneyPatched Vulnerability
  // Expects Crumb #1. If single quote -> verbose DB error.
  // If SQLi (' OR 1=1 / UNION SELECT) -> HoneyPatch Session Fork leaking Crumb #2!
  // ---------------------------------------------------------------------------
  function handleStage2(req, res) {
    const { ip, ja4h } = extractClientIdentity(req);
    const { session, ipChanged, prodCorrelated } = getOrCreateShadowWorld(ja4h, ip);
    const { seedId, persona } = getActiveTopology();

    // Check token from headers or body
    const token = req.headers['x-debug-token'] || req.headers['authorization']?.replace('Bearer ', '') || req.body?.token;
    const query = String(req.body?.query || req.query?.query || '').trim();

    // Verify Crumb #1
    const verifyResult = verifyCrumb(token, ja4h, seedId);

    session.highestStage = Math.max(session.highestStage, 2);
    updateThreatScore(ja4h, 25);
    const dwellTimeSeconds = Math.floor((Date.now() - session.createdAt) / 1000);

    // Check for SQLi patterns
    const isSqliExploit = query.match(/('|--|#|\/\*).*(\bor\b.*=|\bunion\b\s+\bselect\b|\b1=1\b|admin)/i) 
      || query.includes("' OR 1=1") 
      || query.includes("UNION SELECT")
      || req.body?.exploit === true;
    const isSingleQuoteProbe = query.includes("'") && !isSqliExploit;

    // Mint Crumb #2
    const crumb2 = mintCrumb(2, ja4h, seedId);
    session.crumbs.stage2 = crumb2;

    // 1. Ego-Boost Probe: Single quote error
    if (isSingleQuoteProbe && !isSqliExploit) {
      emitSocTelemetry({
        stage: 2,
        ip,
        ja4h,
        ipChanged,
        tokenShared: verifyResult.tokenShared,
        topologyMutated: verifyResult.topologyMutated,
        prodCorrelated,
        title: 'Stage 2 SQLi Syntax Error Triggered (Ego Boost)',
        endpoint: req.originalUrl,
        rawPayload: query,
        crumbMinted: null,
        crumbUsed: token,
        attackId: 'T1190',
        attackName: 'Exploit Public-Facing Application',
        engageId: 'EAC0004',
        engageName: 'Manipulate Attacker Perception',
        threatScore: session.threatScore,
        dwellTimeSeconds,
        polymorphicSeed: seedId
      });

      return res.status(500).json({
        status: 'error',
        engine: 'PostgreSQL 15.4 (Ubuntu 22.04.3 LTS)',
        code: '42601',
        error: `syntax error at or near "'": line 1: SELECT * FROM service_accounts WHERE user_id = '${query}'`,
        hint: 'Unterminated quoted string starting at line 1 column 54.',
        query_context: 'legacy_query_executor.go:142'
      });
    }

    // 2. HoneyPatch Session Fork (Exploit executed!)
    if (isSqliExploit || req.body?.exploit === true) {
      emitSocTelemetry({
        stage: 2,
        ip,
        ja4h,
        ipChanged,
        tokenShared: verifyResult.tokenShared,
        topologyMutated: verifyResult.topologyMutated,
        prodCorrelated,
        title: 'Stage 2 HoneyPatch Session Fork Triggered',
        endpoint: req.originalUrl,
        rawPayload: query || 'UNION SELECT * FROM devops_service_accounts',
        crumbMinted: crumb2,
        crumbUsed: token,
        attackId: 'T1190',
        attackName: 'Exploit Public-Facing Application',
        engageId: 'EAC0005',
        engageName: 'HoneyPatch Session Fork',
        threatScore: Math.max(session.threatScore, 65),
        dwellTimeSeconds,
        polymorphicSeed: seedId
      });

      return res.status(200).json({
        status: 'success',
        affected_rows: 3,
        execution_time_ms: 1.8,
        results: [
          {
            id: 101,
            username: 'svc_jumpbox_deployer',
            role: 'cluster-admin',
            jumpbox_ip: persona.stage3Host,
            hostname: persona.stage3Hostname,
            shell_auth_endpoint: '/api/shell/exec',
            ssh_auth_token: crumb2,
            last_rotated: '2026-10-30T19:40:11Z'
          },
          {
            id: 102,
            username: 'svc_ci_builder',
            role: 'read-only',
            jumpbox_ip: '10.24.0.18',
            hostname: 'ci-runner-agent-04',
            shell_auth_endpoint: '/api/shell/exec',
            ssh_auth_token: 'expired_ci_token_rev_4418',
            last_rotated: '2026-10-25T11:12:00Z'
          }
        ],
        warning: 'INTERNAL_DEBUG_UNFILTERED: Unsanitized input delivered to query executor.'
      });
    }

    // Default response if benign query
    return res.status(200).json({
      status: 'success',
      data: [],
      message: 'Query executed successfully. 0 records returned.',
      hint: 'Requires valid account_id parameter.'
    });
  }

  // Persona A Route
  router.post('/api/internal/legacy-query', handleStage2);
  // Persona B Route
  router.post('/v2/graphql-debug', handleStage2);
  // Generic Stage 2 Endpoint
  router.post('/api/stage2', handleStage2);

  // ---------------------------------------------------------------------------
  // STAGE 3: Stateful Shadow Shell
  // Expects Crumb #2. Executes Linux commands inside virtual Ubuntu jumpbox.
  // Mints Crumb #3 in .bash_history and /opt/scripts/vault_sync.sh.
  // ---------------------------------------------------------------------------
  router.post('/api/shell/exec', (req, res) => {
    const { ip, ja4h } = extractClientIdentity(req);
    const { session, ipChanged, prodCorrelated } = getOrCreateShadowWorld(ja4h, ip);
    const { seedId } = getActiveTopology();

    const authHeader = req.headers['authorization'] || req.headers['x-ssh-token'] || req.body?.token;
    const token = typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';
    const command = String(req.body?.command || req.query?.cmd || '').trim();

    // Verify Crumb #2
    const verifyResult = verifyCrumb(token, ja4h, seedId);

    if (!verifyResult.valid && !token.includes('vk_live_')) {
      return res.status(401).json({
        stdout: '',
        stderr: 'Permission denied (publickey,gssapi-keyex,gssapi-with-mic).\n',
        exitCode: 255
      });
    }

    session.highestStage = Math.max(session.highestStage, 3);
    updateThreatScore(ja4h, 20);
    const dwellTimeSeconds = Math.floor((Date.now() - session.createdAt) / 1000);

    // Execute command in virtual shell
    const result = executeVirtualShell(command, session, ja4h);

    // Emit terminal stream event
    if (io) {
      io.emit('terminal_stream', {
        ja4h,
        command,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        cwd: '/home/deployer',
        timestamp: new Date().toISOString()
      });
    }

    // Emit SOC Telemetry
    emitSocTelemetry({
      stage: 3,
      ip,
      ja4h,
      ipChanged,
      tokenShared: verifyResult.tokenShared,
      topologyMutated: verifyResult.topologyMutated,
      prodCorrelated,
      title: `Shadow Shell Exec: ${command}`,
      endpoint: '/api/shell/exec',
      rawPayload: command,
      crumbMinted: result.crumbMinted || null,
      crumbUsed: token,
      attackId: 'T1059.004',
      attackName: 'Command and Scripting Interpreter: Unix Shell',
      engageId: 'EAC0012',
      engageName: 'Synthetic Environment Confinement',
      threatScore: Math.max(session.threatScore, 85),
      dwellTimeSeconds,
      polymorphicSeed: seedId
    });

    return res.status(200).json(result);
  });

  // ---------------------------------------------------------------------------
  // STAGE 4: Cold-Storage Vault & Adaptive Tarpit
  // Expects Crumb #3. Verifies token and initiates chunked streaming tarpit.
  // ---------------------------------------------------------------------------
  function handleStage4(req, res) {
    const { ip, ja4h } = extractClientIdentity(req);
    const { session, ipChanged, prodCorrelated } = getOrCreateShadowWorld(ja4h, ip);
    const { seedId, persona } = getActiveTopology();

    const vaultKey = req.headers['x-vault-key']
      || req.headers['authorization']?.replace(/^Bearer\s+/i, '')
      || req.query?.key
      || req.query?.token;

    // Verify Crumb #3
    const verifyResult = verifyCrumb(vaultKey, ja4h, seedId);

    if (!verifyResult.valid && !String(vaultKey).startsWith('vk_live_')) {
      return res.status(403).json({
        error: 'VAULT_ACCESS_DENIED',
        status: 403,
        message: 'Invalid or missing master KMS key authorization.',
        hint: 'Expected X-Vault-Key header'
      });
    }

    session.highestStage = 4;
    session.threatScore = 98; // CRITICAL
    session.tarpitActive = true;
    const dwellTimeSeconds = Math.floor((Date.now() - session.createdAt) / 1000);

    emitSocTelemetry({
      stage: 4,
      ip,
      ja4h,
      ipChanged,
      tokenShared: verifyResult.tokenShared,
      topologyMutated: verifyResult.topologyMutated,
      prodCorrelated,
      title: 'CRITICAL: Cold-Storage Vault Exfiltration In Progress (Tarpit Engaged)',
      endpoint: req.originalUrl,
      rawPayload: `${req.method} ${req.originalUrl} [Key: ${String(vaultKey).slice(0, 15)}...]`,
      crumbMinted: null,
      crumbUsed: vaultKey,
      attackId: 'T1041',
      attackName: 'Exfiltration Over C2 Channel',
      engageId: 'EAC0018',
      engageName: 'Tarpit Rate-Limiting Containment',
      threatScore: 98,
      dwellTimeSeconds,
      polymorphicSeed: seedId
    });

    // Start Chunked Streaming Tarpit
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Content-Disposition', `attachment; filename="${persona.stage4Asset}"`);
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering if proxied
    res.flushHeaders?.();

    let totalBytesSent = 0;
    const maxBytes = 64 * 1024; // 64 KB total exfiltration payload

    const tarpitTimer = setInterval(() => {
      // Check if session was quarantined via Plausible WAF Drop during the stream
      if (session.plausibleWafDrop) {
        clearInterval(tarpitTimer);
        // Realistic WAF termination chunk
        res.write(`\n--- AWS WAF ERROR 504: Origin Socket Reset [Rule #942100 Rate Limit Hit] ---\n`);
        return res.end();
      }

      // Check if connection was closed by attacker
      if (res.writableEnded || res.closed) {
        clearInterval(tarpitTimer);
        session.tarpitActive = false;
        return;
      }

      // Generate chunk of realistic high-entropy encrypted binary data
      const chunkSize = session.tarpitSpeed || 512;
      const fakeEncryptedChunk = crypto.randomBytes(chunkSize);
      res.write(fakeEncryptedChunk);
      totalBytesSent += chunkSize;

      const currentDwell = Math.floor((Date.now() - session.createdAt) / 1000);
      const speedKb = ((chunkSize / ((session.tarpitInterval || 800) / 1000)) / 1024).toFixed(2);

      // Emit tarpit progress to SOC
      if (io) {
        io.emit('tarpit_progress', {
          ja4h,
          bytesSent: totalBytesSent,
          chunkSize,
          speed: `${speedKb} KB/s`,
          dwellTimeSeconds: currentDwell,
          status: 'TARPIT_ENGAGED'
        });
      }

      if (totalBytesSent >= maxBytes) {
        clearInterval(tarpitTimer);
        session.tarpitActive = false;
        res.end();
      }
    }, session.tarpitInterval || 800);

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(tarpitTimer);
      session.tarpitActive = false;
    });
  }

  // Persona A Route
  router.get('/vault/v1/export', handleStage4);
  // Persona B Route
  router.get('/s3/v1/treasury-keys', handleStage4);
  // Generic Stage 4 Endpoint
  router.get('/api/stage4', handleStage4);

  // ---------------------------------------------------------------------------
  // SOC DASHBOARD INSPECTION & RESET APIS
  // ---------------------------------------------------------------------------
  router.get('/api/status', (req, res) => {
    const topology = getActiveTopology();
    res.json({
      status: 'ONLINE',
      system: 'AETHER-LABYRINTH Active Deception Engine',
      version: '1.0.0',
      activeSeed: topology.seedId,
      persona: topology.persona,
      activeSessions: getAllShadowWorlds().length,
      prodCorrelationCount: prodAuthLogs.length,
      timestamp: new Date().toISOString()
    });
  });

  router.get('/api/shadow-worlds', (req, res) => {
    res.json({
      sessions: getAllShadowWorlds()
    });
  });

  router.get('/api/prod-logs', (req, res) => {
    res.json({
      logs: prodAuthLogs
    });
  });

  router.post('/api/mutate', (req, res) => {
    const mutation = mutateTopology();
    if (io) {
      io.emit('topology_mutated', mutation);
    }
    res.json(mutation);
  });

  return router;
}

export default {
  createTrapRouter
};

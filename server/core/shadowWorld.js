/**
 * AETHER-LABYRINTH // Per-Attacker Shadow World & Polymorphic Mutation Engine
 * Manages zero-dependency in-memory Map stores for attacker sessions, East-West production
 * log correlation, and dynamic honeypot topology rotation.
 */

// Polymorphic Persona Definitions
export const TOPOLOGY_PERSONAS = {
  'Morph-v1.0': {
    id: 'Morph-v1.0',
    name: 'Morph-v1.0 (Fintech-Git-SQLi)',
    description: 'Legacy Fintech monolith with exposed Git reflogs and PostgreSQL financial database',
    stage1Endpoint: '/.git/logs/HEAD',
    stage2Endpoint: '/api/internal/legacy-query',
    stage3Host: '10.24.0.15',
    stage3Hostname: 'devops-jumpbox-01',
    stage4Endpoint: '/vault/v1/export',
    stage4Asset: 'cold_vault_ledger.parquet'
  },
  'Morph-v2.0': {
    id: 'Morph-v2.0',
    name: 'Morph-v2.0 (Cloud-Env-GraphQL)',
    description: 'Cloud-native microservice with exposed .env staging leak and GraphQL debug gateway',
    stage1Endpoint: '/.env.staging',
    stage2Endpoint: '/v2/graphql-debug',
    stage3Host: '172.16.8.4',
    stage3Hostname: 'k8s-pod-auth-proxy',
    stage4Endpoint: '/s3/v1/treasury-keys',
    stage4Asset: 'treasury_private_keys.pem'
  }
};

// Current active polymorphic seed
let currentSeedId = TOPOLOGY_PERSONAS['Morph-v1.0'].name;

// In-Memory Shadow World Store: Map<ja4h, ShadowSession>
const shadowWorlds = new Map();

// Pre-seeded East-West Production Auth Logs (Simulates perimeter enterprise logs)
export const prodAuthLogs = [
  {
    id: 'prod_log_001',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    ip: '185.220.101.4',
    service: 'real-prod-db-01.internal',
    port: 22,
    eventType: 'SSH_AUTH_FAILURE',
    details: 'Failed password for invalid user admin from 185.220.101.4 port 48212 ssh2 (3 attempts)',
    severity: 'HIGH'
  },
  {
    id: 'prod_log_002',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    ip: '185.220.101.4',
    service: 'waf-edge-nyc.internal',
    port: 443,
    eventType: 'WAF_ANOMALY_PROBE',
    details: 'Directory brute-force detected: /.aws/credentials, /admin.php, /actuator/heapdump',
    severity: 'MEDIUM'
  }
];

/**
 * Checks whether an IP address matches known hostile production authentication logs.
 *
 * @param {string} ip
 * @returns {boolean}
 */
export function isProdCorrelated(ip) {
  if (!ip) return false;
  return prodAuthLogs.some(log => log.ip === ip || ip.includes(log.ip));
}

/**
 * Returns the currently active topology persona object and seed ID.
 */
export function getActiveTopology() {
  const isV2 = currentSeedId.includes('Morph-v2.0');
  const persona = isV2 ? TOPOLOGY_PERSONAS['Morph-v2.0'] : TOPOLOGY_PERSONAS['Morph-v1.0'];
  return {
    seedId: currentSeedId,
    persona
  };
}

/**
 * Mutates the honeypot topology between Persona A and Persona B.
 * Automatically burns previously minted breadcrumbs.
 */
export function mutateTopology() {
  const previousSeed = currentSeedId;
  if (currentSeedId.includes('Morph-v1.0')) {
    currentSeedId = TOPOLOGY_PERSONAS['Morph-v2.0'].name;
  } else {
    currentSeedId = TOPOLOGY_PERSONAS['Morph-v1.0'].name;
  }

  const active = getActiveTopology();
  return {
    previousSeed,
    newSeed: currentSeedId,
    persona: active.persona,
    timestamp: new Date().toISOString()
  };
}

/**
 * Sets explicit topology by seed key.
 */
export function setTopology(seedKey) {
  if (TOPOLOGY_PERSONAS[seedKey]) {
    currentSeedId = TOPOLOGY_PERSONAS[seedKey].name;
  }
  return getActiveTopology();
}

/**
 * Retrieves or initializes an isolated Shadow World for the given JA4H fingerprint.
 *
 * @param {string} ja4h - 16-char client fingerprint
 * @param {string} ip - Current remote IP address
 * @returns {{ session: object, ipChanged: boolean, prodCorrelated: boolean }}
 */
export function getOrCreateShadowWorld(ja4h, ip) {
  const now = Date.now();
  const prodCorrelated = isProdCorrelated(ip);
  let session = shadowWorlds.get(ja4h);
  let ipChanged = false;

  if (!session) {
    session = {
      ja4h,
      initialIp: ip,
      currentIp: ip,
      observedIps: [ip],
      createdAt: now,
      lastSeen: now,
      threatScore: prodCorrelated ? 35 : 15, // boosted if correlated with real prod attack
      highestStage: 0,
      prodCorrelated,
      plausibleWafDrop: false, // Quarantine flag for realistic HTTP 504 exit
      tarpitActive: false,
      tarpitSpeed: 512, // 512 bytes per chunk
      tarpitInterval: 800, // 800ms between chunks (~0.6 KB/s)
      crumbs: {
        stage1: null,
        stage2: null,
        stage3: null
      },
      commandHistory: [],
      terminalLogs: []
    };
    shadowWorlds.set(ja4h, session);
  } else {
    // Session exists - check if IP has changed (VPN hop / proxy rotation)
    if (session.currentIp !== ip) {
      ipChanged = true;
      session.currentIp = ip;
      if (!session.observedIps.includes(ip)) {
        session.observedIps.push(ip);
      }
      // Re-evaluate production correlation on new IP
      if (prodCorrelated) {
        session.prodCorrelated = true;
      }
    }
    session.lastSeen = now;
  }

  return { session, ipChanged, prodCorrelated: session.prodCorrelated };
}

/**
 * Retrieves a shadow world session if it exists.
 */
export function getShadowWorld(ja4h) {
  return shadowWorlds.get(ja4h) || null;
}

/**
 * Updates threat score progressively (bounded 0 - 100).
 */
export function updateThreatScore(ja4h, delta) {
  const session = shadowWorlds.get(ja4h);
  if (!session) return;
  session.threatScore = Math.min(100, Math.max(0, session.threatScore + delta));
  return session.threatScore;
}

/**
 * Quarantines an attacker using the Plausible Failure WAF Drop mechanism.
 */
export function quarantineAttacker(ja4h, state = true) {
  const session = shadowWorlds.get(ja4h);
  if (session) {
    session.plausibleWafDrop = state;
    if (state) {
      session.tarpitActive = false; // Stop any ongoing streaming tarpits
    }
    return true;
  }
  return false;
}

/**
 * Engages high-dwell adaptive tarpit rate.
 */
export function engageTarpitSpeed(ja4h, bytes = 128, intervalMs = 2000) {
  const session = shadowWorlds.get(ja4h);
  if (session) {
    session.tarpitActive = true;
    session.tarpitSpeed = bytes;
    session.tarpitInterval = intervalMs;
    return true;
  }
  return false;
}

/**
 * Returns formatted snapshots of all active shadow sessions for the SOC dashboard.
 */
export function getAllShadowWorlds() {
  const now = Date.now();
  return Array.from(shadowWorlds.values()).map(s => ({
    ja4h: s.ja4h,
    currentIp: s.currentIp,
    initialIp: s.initialIp,
    observedIps: s.observedIps,
    dwellTimeSeconds: Math.floor((now - s.createdAt) / 1000),
    threatScore: s.threatScore,
    highestStage: s.highestStage,
    prodCorrelated: s.prodCorrelated,
    plausibleWafDrop: s.plausibleWafDrop,
    tarpitActive: s.tarpitActive,
    commandCount: s.commandHistory.length,
    lastSeen: new Date(s.lastSeen).toISOString()
  }));
}

/**
 * Clears in-memory stores for reset / testing.
 */
export function resetShadowWorlds() {
  shadowWorlds.clear();
}

export default {
  TOPOLOGY_PERSONAS,
  prodAuthLogs,
  isProdCorrelated,
  getActiveTopology,
  mutateTopology,
  setTopology,
  getOrCreateShadowWorld,
  getShadowWorld,
  updateThreatScore,
  quarantineAttacker,
  engageTarpitSpeed,
  getAllShadowWorlds,
  resetShadowWorlds
};

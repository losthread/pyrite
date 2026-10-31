/**
 * AETHER-LABYRINTH // Stateless HMAC-SHA256 Self-Describing Breadcrumbs
 * Generates and verifies cryptographically signed honeytokens with zero database overhead.
 * Automatically detects:
 *   - Topology mutations (replaying tokens after seed rotation -> Burned Token tripwire)
 *   - Syndicate sharing / lateral tool switching (token used from non-matching JA4H)
 *   - Token expiration (> 900s)
 */

import crypto from 'crypto';

const HMAC_SECRET = process.env.AETHER_CRUMB_SECRET || 'aether_labyrinth_master_hmac_secret_2026';
const TOKEN_MAX_AGE_SECONDS = 900; // 15 minutes TTL

/**
 * Mints a self-describing, HMAC-SHA256 signed breadcrumb token.
 * Format: vk_live_<base64url_payload>.<10_char_hex_sig>
 *
 * @param {number} stage - Trap stage number (1, 2, 3)
 * @param {string} ja4h - Attacker JA4H fingerprint (16-char hex)
 * @param {string} seed - Polymorphic topology seed identifier
 * @returns {string} Realistic API/access token
 */
export function mintCrumb(stage, ja4h, seed) {
  const payload = {
    s: Number(stage),
    f: String(ja4h),
    t: Date.now(),
    seed: String(seed || 'Morph-v1.0 (Fintech-Git-SQLi)')
  };

  const payloadString = JSON.stringify(payload);
  const b64Payload = Buffer.from(payloadString, 'utf8').toString('base64url');

  const sig = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(b64Payload)
    .digest('hex')
    .slice(0, 10);

  return `vk_live_${b64Payload}.${sig}`;
}

/**
 * Decodes and verifies an incoming breadcrumb token.
 *
 * @param {string} token - The token string to inspect
 * @param {string} currentJa4h - The current request's JA4H fingerprint
 * @param {string} currentSeedId - The server's currently active polymorphic seed
 * @returns {{
 *   valid: boolean,
 *   stage?: number,
 *   originalJa4h?: string,
 *   mintedAt?: number,
 *   seed?: string,
 *   topologyMutated: boolean,
 *   tokenShared: boolean,
 *   expired: boolean,
 *   reason?: string,
 *   payload?: object
 * }}
 */
export function verifyCrumb(token, currentJa4h, currentSeedId) {
  if (!token || typeof token !== 'string') {
    return {
      valid: false,
      topologyMutated: false,
      tokenShared: false,
      expired: false,
      reason: 'MISSING_TOKEN'
    };
  }

  // Token regex: vk_live_<base64url>.<10_hex_chars>
  const match = token.trim().match(/^vk_live_([A-Za-z0-9_-]+)\.([a-f0-9]{10})$/);
  if (!match) {
    return {
      valid: false,
      topologyMutated: false,
      tokenShared: false,
      expired: false,
      reason: 'INVALID_TOKEN_FORMAT'
    };
  }

  const [, b64Payload, providedSig] = match;

  // 1. Verify HMAC Signature
  const expectedSig = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(b64Payload)
    .digest('hex')
    .slice(0, 10);

  if (providedSig !== expectedSig) {
    return {
      valid: false,
      topologyMutated: false,
      tokenShared: false,
      expired: false,
      reason: 'INVALID_SIGNATURE'
    };
  }

  // 2. Decode JSON payload
  let payload;
  try {
    const rawPayload = Buffer.from(b64Payload, 'base64url').toString('utf8');
    payload = JSON.parse(rawPayload);
  } catch (err) {
    return {
      valid: false,
      topologyMutated: false,
      tokenShared: false,
      expired: false,
      reason: 'CORRUPTED_PAYLOAD'
    };
  }

  // 3. Check expiration (> 900 seconds)
  const ageSeconds = (Date.now() - (payload.t || 0)) / 1000;
  const expired = ageSeconds > TOKEN_MAX_AGE_SECONDS;

  // 4. Check Polymorphic Topology Seed
  const topologyMutated = Boolean(currentSeedId && payload.seed !== currentSeedId);

  // 5. Check Attacker Fingerprint (Syndicate / Collusion Detection)
  const tokenShared = Boolean(currentJa4h && payload.f !== currentJa4h);

  return {
    valid: true,
    stage: payload.s,
    originalJa4h: payload.f,
    mintedAt: payload.t,
    seed: payload.seed,
    topologyMutated,
    tokenShared,
    expired,
    reason: expired ? 'TOKEN_EXPIRED' : null,
    payload
  };
}

export default {
  mintCrumb,
  verifyCrumb
};

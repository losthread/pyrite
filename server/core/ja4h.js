/**
 * AETHER-LABYRINTH // JA4H Client Fingerprinter
 * Deterministically computes a 16-character SHA-256 fingerprint from HTTP client attributes.
 * Enables Cross-IP Threat Attribution (tracking adversaries hopping VPNs/proxies).
 */

import crypto from 'crypto';

/**
 * Normalizes and computes the JA4H fingerprint for an incoming Express HTTP request.
 *
 * @param {import('express').Request} req
 * @returns {{ ip: string, ja4h: string, rawFingerprintInput: string, isOverride: boolean }}
 */
export function extractClientIdentity(req) {
  // 1. Attacker IP extraction (supports reverse proxy headers and direct sockets)
  const forwardedFor = req.headers['x-forwarded-for'];
  const rawIp = (typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : null)
    || req.headers['x-real-ip']
    || req.socket.remoteAddress
    || '127.0.0.1';

  // Normalize IPv6 mapped IPv4 (e.g. "::ffff:127.0.0.1" -> "127.0.0.1")
  const ip = rawIp.replace(/^.*:/, '') || '127.0.0.1';

  // 2. HTTP Version
  const httpVersion = req.httpVersion || '1.1';

  // 3. User-Agent (normalized)
  const userAgent = (req.headers['user-agent'] || 'generic-curl').trim().toLowerCase();

  // 4. Accept-Language
  const acceptLanguage = (req.headers['accept-language'] || 'none').trim().toLowerCase();

  // 5. Header Key Order (raw signature preserved from wire)
  // req.rawHeaders is an array of [key, value, key, value, ...]
  const rawHeaderKeys = [];
  if (Array.isArray(req.rawHeaders)) {
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      const headerName = req.rawHeaders[i].toLowerCase();
      // Exclude ephemeral / proxy headers from the JA4H signature
      if (!['x-forwarded-for', 'x-real-ip', 'host', 'connection'].includes(headerName)) {
        rawHeaderKeys.push(headerName);
      }
    }
  } else {
    rawHeaderKeys.push(...Object.keys(req.headers).map(k => k.toLowerCase()));
  }
  const headerOrderSignature = rawHeaderKeys.slice(0, 10).join(',');

  // 6. Optional test override header for machine-switch / syndicate demos
  const testOverride = req.headers['x-client-fingerprint'];
  const isOverride = Boolean(testOverride);

  // Combine into canonical input string
  const canonicalInput = isOverride
    ? `override:${testOverride}`
    : `v=${httpVersion}|ua=${userAgent}|lang=${acceptLanguage}|headers=${headerOrderSignature}`;

  // Deterministic 16-character SHA-256 hash
  const ja4h = crypto
    .createHash('sha256')
    .update(canonicalInput)
    .digest('hex')
    .slice(0, 16);

  return {
    ip,
    ja4h,
    rawFingerprintInput: canonicalInput,
    isOverride
  };
}

export default {
  extractClientIdentity
};

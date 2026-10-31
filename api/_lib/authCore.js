import crypto from 'crypto';

// Load server environment variables with fallback
export function getAccessPassword() {
  return process.env.DOSTFLIX_ACCESS_PASSWORD || 'accesstoourchaos';
}

export function getSessionSecret() {
  return process.env.DOSTFLIX_SESSION_SECRET || 'dostflix_private_session_secret_2026_inner_circle';
}

// Constant-time string comparison to prevent timing attacks
export function constantTimeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Execute dummy timingSafeEqual to avoid leaking length via response timing
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// In-memory sliding window rate limiter
// IP -> { count, lastAttempt, blockedUntil }
const attemptsMap = new Map();

export function checkRateLimit(ip) {
  const now = Date.now();
  const record = attemptsMap.get(ip);
  if (!record) return { allowed: true, remaining: 5 };

  if (record.blockedUntil && now < record.blockedUntil) {
    const waitSec = Math.ceil((record.blockedUntil - now) / 1000);
    return { 
      allowed: false, 
      waitSec, 
      error: `Too many failed attempts. Please wait ${waitSec}s before trying again.` 
    };
  }

  // Clear stale window (> 15 minutes)
  if (now - record.lastAttempt > 15 * 60 * 1000) {
    attemptsMap.delete(ip);
    return { allowed: true, remaining: 5 };
  }

  if (record.count >= 5) {
    // 30-second lockout after 5 fails; 2-minute lockout after 8+ fails
    const blockDuration = record.count >= 8 ? 2 * 60 * 1000 : 30 * 1000;
    record.blockedUntil = now + blockDuration;
    const waitSec = Math.ceil(blockDuration / 1000);
    return { 
      allowed: false, 
      waitSec, 
      error: `Too many failed attempts. Please wait ${waitSec}s before trying again.` 
    };
  }

  return { allowed: true, remaining: 5 - record.count };
}

export function recordFailedAttempt(ip) {
  const now = Date.now();
  const record = attemptsMap.get(ip) || { count: 0, lastAttempt: now };
  record.count += 1;
  record.lastAttempt = now;
  attemptsMap.set(ip, record);
}

export function resetRateLimit(ip) {
  attemptsMap.delete(ip);
}

// Cookie name and session lifetime (30 days)
export const COOKIE_NAME = 'dostflix_session';
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

// Create HMAC-SHA256 signed session token
export function createSessionToken() {
  const payload = {
    v: 1,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS
  };
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payloadStr)
    .digest('base64url');
  return `${payloadStr}.${signature}`;
}

// Verify HMAC-SHA256 signed session token
export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payloadStr, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payloadStr)
    .digest('base64url');

  if (!constantTimeCompare(signature, expectedSig)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || now > payload.exp) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Parse cookies from Cookie header
export function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach((cookie) => {
    let [name, ...rest] = cookie.split('=');
    name = name?.trim();
    if (!name) return;
    const value = rest.join('=').trim();
    list[name] = decodeURIComponent(value);
  });
  return list;
}

// Generate Set-Cookie headers
export function makeSessionCookie(token, isProduction = false) {
  const secure = isProduction ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure}`;
}

export function makeLogoutCookie(isProduction = false) {
  const secure = isProduction ? '; Secure' : '';
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}`;
}

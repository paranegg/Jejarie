const crypto = require('crypto');

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function signature(value) {
  return crypto.createHmac('sha256', process.env.SESSION_SECRET || '').update(value).digest('base64url');
}

function createSession() {
  const payload = base64url(JSON.stringify({ exp: Date.now() + 12 * 60 * 60 * 1000 }));
  return payload + '.' + signature(payload);
}

function getCookie(req, name) {
  const cookies = String(req.headers.cookie || '').split(';');
  for (const cookie of cookies) {
    const parts = cookie.trim().split('=');
    if (parts.shift() === name) return decodeURIComponent(parts.join('='));
  }
  return '';
}

function isAuthenticated(req) {
  if (!process.env.SESSION_SECRET) return false;
  const token = getCookie(req, 'jejarie_session');
  const [payload, supplied] = token.split('.');
  if (!payload || !supplied) return false;
  const expected = signature(payload);
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now();
  } catch (_) {
    return false;
  }
}

function secureEqual(a, b) {
  const left = crypto.createHash('sha256').update(String(a || '')).digest();
  const right = crypto.createHash('sha256').update(String(b || '')).digest();
  return crypto.timingSafeEqual(left, right);
}

module.exports = { createSession, isAuthenticated, secureEqual };

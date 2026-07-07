'use strict';

const crypto = require('crypto');

const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';
const COOKIE = 'pb_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

function sign(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verify(token) {
  if (!token || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function createSession(client) {
  return sign({
    cid: client.id,
    name: client.name,
    email: client.email,
    whatsapp: client.whatsapp,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE,
  });
}

function parseCookies(header = '') {
  return Object.fromEntries(
    header.split(';').map((c) => {
      const i = c.indexOf('=');
      return [c.slice(0, i).trim(), decodeURIComponent(c.slice(i + 1))];
    }).filter((p) => p[0])
  );
}

function getSession(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  return verify(cookies[COOKIE]);
}

function sessionCookie(token, secure) {
  const flags = ['Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${MAX_AGE}`];
  if (secure) flags.push('Secure');
  return `${COOKIE}=${encodeURIComponent(token)}; ${flags.join('; ')}`;
}

function clearCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

module.exports = { createSession, getSession, sessionCookie, clearCookie };

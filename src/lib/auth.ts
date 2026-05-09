import crypto from 'crypto';

const SECRET = process.env.SCORING_SECRET || 'dev-only-do-not-use-in-prod';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export interface UserTokenPayload {
  uid: string;
  nick: string;
  iat: number;
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s: string): Buffer {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

export function signUserToken(uid: string, nick: string): string {
  const payload: UserTokenPayload = { uid, nick, iat: Date.now() };
  const data = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = b64url(crypto.createHmac('sha256', SECRET).update(data).digest());
  return `${data}.${sig}`;
}

export function verifyUserToken(token: string | null | undefined): UserTokenPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expected = b64url(crypto.createHmac('sha256', SECRET).update(data).digest());
  // timing-safe compare
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let payload: UserTokenPayload;
  try {
    payload = JSON.parse(fromB64url(data).toString('utf8'));
  } catch {
    return null;
  }
  if (typeof payload?.iat !== 'number' || Date.now() - payload.iat > TOKEN_TTL_MS) return null;
  if (typeof payload.uid !== 'string' || typeof payload.nick !== 'string') return null;
  return payload;
}

export function extractBearerToken(req: Request): string | null {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth) return null;
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export function authedUser(req: Request): UserTokenPayload | null {
  return verifyUserToken(extractBearerToken(req));
}

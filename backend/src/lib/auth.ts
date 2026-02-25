import crypto from 'node:crypto';

interface AuthUser {
  id: string;
  username: string;
  role: string;
}

export interface AuthTokenPayload {
  v: number;
  sub: string;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

export type TokenVerifyResult =
  | { ok: true; payload: AuthTokenPayload }
  | { ok: false; reason: string };

const TOKEN_VERSION = 1;

const safeCompare = (a: string, b: string): boolean => {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufferA, bufferB);
};

export const hashPassword = (
  password: string,
  salt = crypto.randomBytes(16).toString('hex'),
): string => {
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
};

export const verifyPassword = (password: string, passwordHash: string): boolean => {
  const [salt, hash] = passwordHash.split(':');
  if (!salt || !hash) {
    return false;
  }

  const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return safeCompare(verifyHash, hash);
};

const sign = (payloadBase64: string, secret: string): string => {
  return crypto.createHmac('sha256', secret).update(payloadBase64).digest('base64url');
};

export const createToken = (user: AuthUser, secret: string, ttlHours: number): string => {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + ttlHours * 60 * 60 * 1000;

  const payload: AuthTokenPayload = {
    v: TOKEN_VERSION,
    sub: user.id,
    username: user.username,
    role: user.role,
    iat: issuedAt,
    exp: expiresAt,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = sign(payloadBase64, secret);

  return `${payloadBase64}.${signature}`;
};

export const verifyToken = (token: string, secret: string): TokenVerifyResult => {
  const [payloadBase64, signature] = token.split('.');
  if (!payloadBase64 || !signature) {
    return { ok: false, reason: 'malformed token' };
  }

  const expected = sign(payloadBase64, secret);
  if (!safeCompare(signature, expected)) {
    return { ok: false, reason: 'invalid signature' };
  }

  let payload: AuthTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
  } catch {
    return { ok: false, reason: 'invalid payload' };
  }

  if (!payload.exp || Date.now() > payload.exp) {
    return { ok: false, reason: 'expired token' };
  }

  if (payload.v !== TOKEN_VERSION) {
    return { ok: false, reason: 'unsupported token version' };
  }

  return { ok: true, payload };
};

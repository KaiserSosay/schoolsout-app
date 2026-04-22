import { createHmac, randomBytes } from 'node:crypto';
import { env } from '@/lib/env';

export function newToken(): string {
  return randomBytes(24).toString('base64url');
}

export function signToken(payload: string): string {
  return createHmac('sha256', env.CRON_SECRET).update(payload).digest('base64url');
}

export function verifyToken(payload: string, sig: string): boolean {
  return signToken(payload) === sig;
}

// URL-safe base32-ish charset for kid access tokens.
// Excludes ambiguous characters: 0/O, 1/I/L. Matches the admin smoke-test script.
const KID_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateKidAccessToken(length = 10): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += KID_CHARSET[bytes[i]! % KID_CHARSET.length];
  }
  return out;
}

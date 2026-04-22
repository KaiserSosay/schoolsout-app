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

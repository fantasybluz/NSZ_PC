import type { UserRecord } from '../../lib/types.ts';

export interface AccessTokenVerification {
  ok: boolean;
  userId: string | null;
  reason?: string;
}

export interface AccessTokenService {
  issueToken(user: UserRecord): string;
  verifyToken(token: string): AccessTokenVerification;
}

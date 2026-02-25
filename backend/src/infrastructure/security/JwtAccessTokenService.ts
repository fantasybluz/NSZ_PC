import { createToken, verifyToken } from '../../lib/auth.ts';
import type { UserRecord } from '../../lib/types.ts';
import type {
  AccessTokenService,
  AccessTokenVerification,
} from '../../domain/auth/AccessTokenService.ts';

interface JwtAccessTokenConfig {
  secret: string;
  tokenTtlHours: number;
}

export class JwtAccessTokenService implements AccessTokenService {
  private readonly config: JwtAccessTokenConfig;

  constructor(config: JwtAccessTokenConfig) {
    this.config = config;
  }

  issueToken(user: UserRecord): string {
    return createToken(user, this.config.secret, this.config.tokenTtlHours);
  }

  verifyToken(token: string): AccessTokenVerification {
    const verification = verifyToken(token, this.config.secret);
    if (!verification.ok) {
      return {
        ok: false,
        userId: null,
        reason: verification.reason,
      };
    }

    return {
      ok: true,
      userId: verification.payload.sub,
    };
  }
}

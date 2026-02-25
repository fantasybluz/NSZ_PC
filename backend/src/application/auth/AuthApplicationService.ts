import type { AuthRepository } from '../../domain/auth/AuthRepository.ts';
import type {
  AccessTokenService,
  AccessTokenVerification,
} from '../../domain/auth/AccessTokenService.ts';
import type { PasswordService } from '../../domain/auth/PasswordService.ts';
import { toPublicUser } from '../../domain/auth/userMapper.ts';
import type { LoginInput, PasswordChangeInput, PublicUser } from '../../lib/types.ts';

interface AuthAppConfig {
  tokenTtlHours: number;
}

export interface LoginSuccessPayload {
  token: string;
  expiresInHours: number;
  user: PublicUser;
}

export type LoginResult =
  | { kind: 'ok'; data: LoginSuccessPayload }
  | { kind: 'invalid_credentials' };

export type TokenAuthResult =
  | { kind: 'ok'; user: PublicUser }
  | { kind: 'missing_token' }
  | { kind: 'invalid_token'; reason?: string }
  | { kind: 'user_not_found' };

export type ChangePasswordResult =
  | { kind: 'ok' }
  | { kind: 'user_not_found' }
  | { kind: 'invalid_current_password' };

export class AuthApplicationService {
  private readonly repository: AuthRepository;
  private readonly tokenService: AccessTokenService;
  private readonly passwordService: PasswordService;
  private readonly config: AuthAppConfig;

  constructor(
    repository: AuthRepository,
    tokenService: AccessTokenService,
    passwordService: PasswordService,
    config: AuthAppConfig,
  ) {
    this.repository = repository;
    this.tokenService = tokenService;
    this.passwordService = passwordService;
    this.config = config;
  }

  async login(input: LoginInput): Promise<LoginResult> {
    const user = await this.repository.findByUsername(input.username);
    if (!user) {
      return { kind: 'invalid_credentials' };
    }

    const verified = this.passwordService.verify(input.password, user.passwordHash);
    if (!verified) {
      return { kind: 'invalid_credentials' };
    }

    const token = this.tokenService.issueToken(user);
    return {
      kind: 'ok',
      data: {
        token,
        expiresInHours: this.config.tokenTtlHours,
        user: toPublicUser(user),
      },
    };
  }

  async authenticateHeader(authorizationHeader?: string): Promise<TokenAuthResult> {
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      return { kind: 'missing_token' };
    }

    const token = authorizationHeader.slice(7).trim();
    if (!token) {
      return { kind: 'missing_token' };
    }

    return this.authenticateAccessToken(token);
  }

  async authenticateAccessToken(token: string): Promise<TokenAuthResult> {
    const verification: AccessTokenVerification = this.tokenService.verifyToken(token);
    if (!verification.ok || !verification.userId) {
      return { kind: 'invalid_token', reason: verification.reason };
    }

    const user = await this.repository.findById(verification.userId);
    if (!user) {
      return { kind: 'user_not_found' };
    }

    return {
      kind: 'ok',
      user: toPublicUser(user),
    };
  }

  async changePassword(userId: string, input: PasswordChangeInput): Promise<ChangePasswordResult> {
    const user = await this.repository.findById(userId);
    if (!user) {
      return { kind: 'user_not_found' };
    }

    const verified = this.passwordService.verify(input.currentPassword, user.passwordHash);
    if (!verified) {
      return { kind: 'invalid_current_password' };
    }

    const nextHash = this.passwordService.hash(input.newPassword);
    await this.repository.updatePassword(user.id, nextHash);
    return { kind: 'ok' };
  }
}

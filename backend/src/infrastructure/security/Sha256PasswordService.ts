import { hashPassword, verifyPassword } from '../../lib/auth.ts';
import type { PasswordService } from '../../domain/auth/PasswordService.ts';

export class Sha256PasswordService implements PasswordService {
  hash(rawPassword: string): string {
    return hashPassword(rawPassword);
  }

  verify(rawPassword: string, passwordHash: string): boolean {
    return verifyPassword(rawPassword, passwordHash);
  }
}

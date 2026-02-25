import type { UserRecord } from '../../lib/types.ts';

export interface AuthRepository {
  findById(userId: string): Promise<UserRecord | null>;
  findByUsername(username: string): Promise<UserRecord | null>;
  updatePassword(userId: string, passwordHash: string): Promise<boolean>;
}

import type { AuthRepository } from '../../domain/auth/AuthRepository.ts';
import type { UserRecord } from '../../lib/types.ts';
import { mutateDb, readDb } from '../../lib/store.ts';

export class StoreAuthRepository implements AuthRepository {
  async findById(userId: string): Promise<UserRecord | null> {
    const db = await readDb();
    return db.users.find((user) => user.id === userId) || null;
  }

  async findByUsername(username: string): Promise<UserRecord | null> {
    const db = await readDb();
    return db.users.find((user) => user.username === username) || null;
  }

  async updatePassword(userId: string, passwordHash: string): Promise<boolean> {
    let updated = false;

    await mutateDb((draft) => {
      const index = draft.users.findIndex((user) => user.id === userId);
      if (index === -1) {
        return;
      }

      draft.users[index].passwordHash = passwordHash;
      updated = true;
    });

    return updated;
  }
}

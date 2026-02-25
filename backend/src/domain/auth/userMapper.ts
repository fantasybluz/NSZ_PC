import type { PublicUser, UserRecord } from '../../lib/types.ts';

export const toPublicUser = (user: UserRecord): PublicUser => {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
};

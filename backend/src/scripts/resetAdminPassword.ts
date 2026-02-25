import crypto from 'node:crypto';

import { hashPassword } from '../lib/auth.ts';
import { loadEnvFile } from '../lib/env.ts';
import { initStore, mutateDb } from '../lib/store.ts';

await loadEnvFile();

const username = process.argv[3] || process.env.ADMIN_USERNAME || 'admin';
const newPassword = process.argv[2];

if (!newPassword) {
  console.error('Usage: npm run reset-admin -- <newPassword> [username]');
  process.exit(1);
}

await initStore({
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123456',
});

let affected = false;

await mutateDb((draft) => {
  const userIndex = draft.users.findIndex((user) => user.username === username);
  if (userIndex === -1) {
    draft.users.push({
      id: crypto.randomUUID(),
      username,
      passwordHash: hashPassword(newPassword),
      role: 'admin',
      createdAt: new Date().toISOString(),
    });
    affected = true;
    return;
  }

  draft.users[userIndex].passwordHash = hashPassword(newPassword);
  affected = true;
});

if (affected) {
  console.log(`Admin password updated for user: ${username}`);
}

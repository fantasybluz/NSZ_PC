import path from 'node:path';

import { loadEnvFile } from '../lib/env.ts';
import { initStore } from '../lib/store.ts';

await loadEnvFile();

const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
const dbPath = process.env.DB_PATH?.trim() || 'data/db.sqlite';

await initStore({
  adminUsername,
  adminPassword,
});

console.log(`SQLite database initialized: ${path.resolve(process.cwd(), dbPath)}`);

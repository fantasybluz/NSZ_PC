import { loadEnvFile } from '../lib/env.ts';
import { initStore } from '../lib/store.ts';

await loadEnvFile('.env', { overrideExisting: true });

const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
const databaseUrl =
  process.env.DATABASE_URL?.trim() || 'postgresql://postgres:postgres@127.0.0.1:5432/nszpc';

const maskedDatabaseUrl = databaseUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');

await initStore({
  adminUsername,
  adminPassword,
});

console.log(`PostgreSQL initialized: ${maskedDatabaseUrl}`);

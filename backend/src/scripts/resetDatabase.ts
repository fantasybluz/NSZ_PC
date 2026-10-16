import { loadAppEnv } from '../lib/env.ts';
import { resetStore } from '../lib/store.ts';

await loadAppEnv();

const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';

await resetStore({ adminUsername, adminPassword });

console.log('Database reset to clean baseline.');

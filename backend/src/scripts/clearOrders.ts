import { loadAppEnv } from '../lib/env.ts';
import { initStore, mutateDb } from '../lib/store.ts';

await loadAppEnv();

const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';

await initStore({ adminUsername, adminPassword });

let removed = 0;

await mutateDb((draft) => {
  removed = Array.isArray(draft.orders) ? draft.orders.length : 0;
  draft.orders = [];
});

console.log(`Cleared ${removed} orders.`);

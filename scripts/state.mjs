// 網站資料的匯出／匯入（D1 的 app_state，見 migrations/0001_app_state.sql）
//
//   node scripts/state.mjs export [--remote] > backup.json   匯出成一份 JSON（備份用）
//   node scripts/state.mjs import backup.json [--remote]      用這份 JSON 蓋掉資料庫裡的資料
//
// 不加 --remote 是本機 `wrangler dev` 用的資料庫，加了是正式環境。
// JSON 的格式跟原本 Node 版的 backend/data/db.json 一樣（meta、categories、builds、orders…），
// 舊檔案裡的 users（帳號密碼）會略過：後台登入改用 Cloudflare Access 了。
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const DATABASE = 'nszpc';
const KEYS = [
  'meta',
  'categories',
  'builds',
  'orders',
  'blogPosts',
  'siteContent',
];
// D1 一個 SQL 指令最多 100KB：大的集合拆成幾段，用 data = data || '…' 接起來
const CHUNK_CHARS = 20_000;

const args = process.argv.slice(2);
const remote = args.includes('--remote');
const [command, file] = args.filter((arg) => !arg.startsWith('--'));

const wrangler = (extra) =>
  execFileSync('npx', ['wrangler', 'd1', 'execute', DATABASE, remote ? '--remote' : '--local', ...extra], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });

const quote = (value) => `'${value.replaceAll("'", "''")}'`;

if (command === 'export') {
  const output = wrangler(['--json', '--command', 'SELECT key, data FROM app_state']);
  const [{ results }] = JSON.parse(output);
  const state = {};
  for (const { key, data } of results) {
    state[key] = JSON.parse(data);
  }
  process.stdout.write(`${JSON.stringify(state, null, 2)}\n`);
} else if (command === 'import' && file) {
  const state = JSON.parse(readFileSync(file, 'utf8'));
  const now = new Date().toISOString();
  const statements = ['DELETE FROM app_state;', 'DELETE FROM state_versions;'];

  for (const key of KEYS) {
    if (!(key in state)) {
      continue;
    }
    const json = JSON.stringify(state[key]);
    for (let start = 0; start < json.length; start += CHUNK_CHARS) {
      const chunk = quote(json.slice(start, start + CHUNK_CHARS));
      statements.push(
        start === 0
          ? `INSERT INTO app_state (key, data, updated_at) VALUES (${quote(key)}, ${chunk}, ${quote(now)});`
          : `UPDATE app_state SET data = data || ${chunk} WHERE key = ${quote(key)};`,
      );
    }
  }
  statements.push('INSERT INTO state_versions (version) VALUES (1);');

  const skipped = Object.keys(state).filter((key) => !KEYS.includes(key));
  if (skipped.length > 0) {
    console.error(`略過：${skipped.join(', ')}`);
  }

  const dir = mkdtempSync(path.join(tmpdir(), 'nszpc-state-'));
  try {
    const sqlFile = path.join(dir, 'import.sql');
    writeFileSync(sqlFile, `${statements.join('\n')}\n`);
    wrangler(['--yes', '--file', sqlFile]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  console.error(`已匯入 ${remote ? '正式環境' : '本機'}：${KEYS.filter((key) => key in state).join(', ')}`);
} else {
  console.error('用法：node scripts/state.mjs export [--remote] > backup.json');
  console.error('      node scripts/state.mjs import backup.json [--remote]');
  process.exit(1);
}

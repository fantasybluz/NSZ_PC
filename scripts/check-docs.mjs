// 文件跟程式碼要一致：改了路由、資料表、版號卻忘了改文件，這裡會失敗（npm run check 第一步，見 docs/README.md「自動檢查」）
// 需要 Node 22.18 以上（直接 import backend/src/routes.ts）
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ROUTES } from '../backend/src/routes.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const errors = [];
const fail = (message) => errors.push(message);

// ---- docs/api.md 的標題 == ROUTES ----
const routeKeys = ROUTES.map((r) => `${r.method} ${r.path}`);
const documented = [...read('docs/api.md').matchAll(/^### `(GET|HEAD|POST|PUT|PATCH|DELETE) (\/\S*)`$/gm)].map(
  (m) => `${m[1]} ${m[2]}`,
);
for (const key of routeKeys) if (!documented.includes(key)) fail(`docs/api.md 少了 ### \`${key}\``);
for (const key of documented) if (!routeKeys.includes(key)) fail(`docs/api.md 有 ### \`${key}\`，但 backend/src/routes.ts 的 ROUTES 沒有`);
for (const key of new Set(documented)) {
  if (documented.filter((k) => k === key).length > 1) fail(`docs/api.md 的 ### \`${key}\` 重複了`);
}
for (const key of new Set(routeKeys)) {
  if (routeKeys.filter((k) => k === key).length > 1) fail(`ROUTES 的 ${key} 重複了`);
}

// ---- worker.ts 裡的路徑字串都在 ROUTES 裡 ----
const worker = read('backend/src/worker.ts');
const segmentsOf = (p) => p.split('/').filter(Boolean);
const hasRoute = (method, p) => routeKeys.includes(`${method} ${p}`);

// parts[n] === 'xxx'：ROUTES 裡要有第 n 段是 xxx 的路徑
for (const [, index, segment] of worker.matchAll(/parts\[(\d+)\] === '([^']+)'/g)) {
  if (!ROUTES.some((r) => segmentsOf(r.path)[Number(index)] === segment)) {
    fail(`worker.ts 處理 parts[${index}] === '${segment}'，但 ROUTES 沒有這樣的路徑`);
  }
}
// 公開 API 的 switch：case 'xxx' → GET /api/public/xxx
for (const [, name] of worker.matchAll(/case '([^']+)':/g)) {
  if (!hasRoute('GET', `/api/public/${name}`)) fail(`worker.ts 有 case '${name}'，但 ROUTES 沒有 GET /api/public/${name}`);
}
// 後台集合（resolveCollectionName）：每個要有五支 CRUD
const resolver = /const resolveCollectionName[\s\S]*?\n};/.exec(worker)?.[0];
if (!resolver) fail('worker.ts 找不到 resolveCollectionName（改名了的話要一起改 scripts/check-docs.mjs）');
const collections = resolver ? [...resolver.matchAll(/(?:value|direct) === '([^']+)'/g)].map((m) => m[1]) : [];
if (resolver && collections.length === 0) fail('resolveCollectionName 裡找不到任何集合名稱');
for (const name of collections) {
  for (const [method, suffix] of [['GET', ''], ['POST', ''], ['GET', '/:id'], ['PUT', '/:id'], ['DELETE', '/:id']]) {
    if (!hasRoute(method, `/api/admin/${name}${suffix}`)) fail(`ROUTES 少了 ${method} /api/admin/${name}${suffix}`);
  }
}
// fetch 裡直接比對的網址（robots.txt、sitemap.xml）
for (const [, p] of worker.matchAll(/url\.pathname === '(\/[^']*)'/g)) {
  if (!hasRoute('GET', p)) fail(`worker.ts 處理 ${p}，但 ROUTES 沒有 GET ${p}`);
}
// 反過來：ROUTES 裡 /api/* 的每一段都要出現在 worker.ts（刪了路由卻沒改 ROUTES）
for (const r of ROUTES.filter((item) => item.path.startsWith('/api/'))) {
  for (const segment of segmentsOf(r.path).filter((s) => !s.startsWith(':'))) {
    if (!worker.includes(`'${segment}'`)) fail(`ROUTES 有 ${r.method} ${r.path}，但 worker.ts 裡沒有 '${segment}'`);
  }
}

// ---- architecture.md 提到 run_worker_first 的每個路徑、每張資料表 ----
const architecture = read('docs/architecture.md');
const wrangler = read('wrangler.jsonc');
const workerFirstBlock = /"run_worker_first":\s*\[([\s\S]*?)\]/.exec(wrangler)?.[1];
if (!workerFirstBlock) fail('wrangler.jsonc 找不到 run_worker_first');
const workerFirst = workerFirstBlock
  ? [...workerFirstBlock.replace(/\/\/.*$/gm, '').matchAll(/"([^"]+)"/g)].map((m) => m[1])
  : [];
for (const p of workerFirst) {
  if (!architecture.includes(`\`${p}\``)) fail(`docs/architecture.md 沒有提到 run_worker_first 的 \`${p}\``);
}

const sql = readdirSync(path.join(root, 'migrations'))
  .filter((f) => f.endsWith('.sql'))
  .map((f) => read(`migrations/${f}`))
  .join('\n');
for (const [, table] of sql.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/gi)) {
  if (!architecture.includes(`\`${table}\``)) fail(`docs/architecture.md 沒有提到資料表 \`${table}\``);
}

// ---- VERSION == CHANGELOG 最新一版（發版流程見 RELEASING.md） ----
const version = read('VERSION').trim();
const headings = [...read('CHANGELOG.md').matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
if (!/^\d+\.\d+\.\d+$/.test(version)) fail(`VERSION 不是 x.y.z：${version}`);
if (headings[0] !== '未發佈') fail('CHANGELOG.md 最上面要是「## 未發佈」');
if (headings[1] !== version) fail(`CHANGELOG.md 最新的一版是 ${headings[1]}，VERSION 是 ${version}`);

// ---- 文件裡的相對連結都指得到 ----
const markdownFiles = [
  'README.md', 'CLAUDE.md', 'RELEASING.md', 'CHANGELOG.md',
  'backend/README.md', 'backend/SKILL.md', 'frontend/README.md', 'frontend/SKILL.md',
  ...readdirSync(path.join(root, 'docs'), { recursive: true })
    .filter((f) => String(f).endsWith('.md'))
    .map((f) => `docs/${f}`),
].filter((f) => existsSync(path.join(root, f)));

// GitHub 的標題錨點：小寫、拿掉標點（留中文、英數字、-、_），空白換成 -
const slug = (heading) =>
  heading
    .replace(/`/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '')
    .replace(/\s/g, '-');
const anchorsOf = (file) => {
  const seen = new Map();
  const anchors = new Set();
  const text = read(file).replace(/^```[\s\S]*?^```/gm, '');
  for (const [, heading] of text.matchAll(/^#{1,6} (.+)$/gm)) {
    const base = slug(heading.trim());
    const count = seen.get(base) ?? 0;
    anchors.add(count ? `${base}-${count}` : base);
    seen.set(base, count + 1);
  }
  return anchors;
};

for (const file of markdownFiles) {
  const text = read(file).replace(/^```[\s\S]*?^```/gm, '').replace(/`[^`\n]*`/g, '');
  for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^[a-z]+:/i.test(target)) continue; // https:、mailto:
    const [rawPath, anchor] = target.split('#');
    const resolved = rawPath ? path.join(path.dirname(file), decodeURIComponent(rawPath)) : file;
    const absolute = path.join(root, resolved);
    if (!existsSync(absolute)) {
      fail(`${file} 的連結 ${target} 指到不存在的檔案`);
      continue;
    }
    if (anchor && statSync(absolute).isFile() && resolved.endsWith('.md')) {
      if (!anchorsOf(resolved).has(decodeURIComponent(anchor))) fail(`${file} 的連結 ${target} 找不到 #${anchor} 這個標題`);
    }
  }
}

if (errors.length) {
  console.error(`文件檢查沒過（${errors.length} 個問題）：\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(
  `文件檢查通過：${ROUTES.length} 個路由、${workerFirst.length} 個 run_worker_first 路徑、版號 ${version}、${markdownFiles.length} 份文件的連結`,
);

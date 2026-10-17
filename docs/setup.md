# 設定與部署

## 需要的東西

- Node.js 22.18 以上（`scripts/check-docs.mjs` 直接 import `.ts`，要 Node 內建的 type stripping）
- Cloudflare 帳號（`npx wrangler login`）

```bash
npm install
npm --prefix frontend install
```

## 本機開發

```bash
cp .dev.vars.example .dev.vars   # DEV_ADMIN_EMAIL=你的 email：本機不經過 Access，直接當這個 email 登入後台
npm run dev:api                  # 先套用本機 D1 migration，再開 wrangler dev：http://localhost:8787（API、本機 D1、R2）
npm run dev:web                  # 前端 Vite：http://localhost:5173
```

- 開 http://localhost:5173 。Vite 把 `/api`、`/openapi.json`、`/api-docs`、`/media` 代理到 8787（`frontend/vite.config.ts`）
- `DEV_ADMIN_EMAIL` 只在網址是 localhost／127.0.0.1 時有效；正式環境不會讀 `.dev.vars`
- 本機的 D1、R2 存在 `.wrangler/`，刪掉就是清空。資料庫是空的時候第一次讀會寫入 `store.ts` 的範例內容
- 本機 R2 是空的，DPOM 發布的照片要在正式環境才看得到
- Swagger UI：http://localhost:5173/api-docs

## 資料匯出、匯入

[`scripts/state.mjs`](../scripts/state.mjs)，用 `wrangler d1 execute` 讀寫 `app_state`：

```bash
npm run state:export -- --remote > backup.json   # 匯出正式環境（不加 --remote 是本機）
npm run state:import -- backup.json              # 用這份 JSON 蓋掉本機的資料（加 --remote 是蓋掉正式環境）
```

- 匯入會先刪掉 `app_state` 和 `state_versions` 的全部資料，再寫入檔案裡有的集合（`meta`、`categories`、`builds`、`orders`、`blogPosts`、`siteContent`）
- 舊 Node 版的 `backend/data/db.json` 格式也可以匯入，`users`（帳號密碼）和庫存、進貨的集合會略過
- D1 一個 SQL 指令最多 100KB，大的集合會拆成 20,000 字一段接起來
- 備份檔裡有完整資料（含服務費），不要 commit；`backend/data/` 在 `.gitignore`

## 檢查

```bash
npm run check
```

依序跑：

1. `node scripts/check-docs.mjs`：文件和程式碼一致、版號（見 [README.md](README.md#自動檢查)）
2. `npm run typecheck`：後端 `tsc -p backend/tsconfig.json`
3. `npm run lint`：前端 ESLint
4. `npm run build`：前端 `tsc -b && vite build`，輸出到 `frontend/dist`

commit 前要過。

## 部署

```bash
npm run deploy
```

= `npm run check` → `wrangler d1 migrations apply nszpc --remote` → `wrangler deploy`（前端 `frontend/dist` 一起上傳）。
沒有 CI，部署是在自己的電腦上跑。發版流程見 [RELEASING.md](../RELEASING.md)。

改了 `wrangler.jsonc` 的綁定、vars 要跑 `npm run cf-typegen`，更新 `worker-configuration.d.ts`。

## Cloudflare 的資源

都在 `wrangler.jsonc`：

| 名稱 | 種類 | 用途 |
|---|---|---|
| Worker `nszpc` | Worker | 入口 `backend/src/worker.ts`，custom domain `nszpc.bluz.dev`；`workers_dev`、`preview_urls` 關掉 |
| `ASSETS` | 靜態檔 | `frontend/dist`，SPA 模式（找不到的路徑回 `index.html`） |
| `DB` → D1 `nszpc` | D1 | 網站資料，`database_id` 寫在 `wrangler.jsonc`，migration 在 `migrations/` |
| `MEDIA` → R2 `nszpc-media` | R2 | 出機照片（DPOM 發布時上傳），網址 `/media/orders/...` |
| `ACCESS_TEAM_DOMAIN`、`ACCESS_AUD`、`ADMIN_EMAILS` | vars | 後台登入（見下面）。都不是秘密，直接寫在 `wrangler.jsonc` |
| `WebsiteAPI` | Worker entrypoint | 給 DPOM 的 RPC，DPOM 的 `wrangler.jsonc` 用 `services` 綁這個 Worker |

換 Cloudflare 帳號的話：`npx wrangler d1 create nszpc`、`npx wrangler r2 bucket create nszpc-media`，把新的 `database_id` 填進去，
再 `npm run state:import -- backup.json --remote` 把資料搬過去（照片要另外搬）。

## Cloudflare Access（後台登入）

在 Cloudflare 後台 › Zero Trust › Access › Applications：

1. **Add an application** › **Self-hosted**
2. Application name：`nszpc-admin`；Session duration 照預設
3. **Public hostname** 加三筆（網域都是 `nszpc.bluz.dev`）：path 分別填 `admin`、`api/admin`、`api/auth`
4. **Policy**：Action 選 Allow，Include › Emails 填可以進後台的 email
5. 存好後在應用的 Overview 複製 **Application Audience (AUD) Tag**，填進 `wrangler.jsonc` 的 `ACCESS_AUD`，再 `npm run deploy`

- `ACCESS_TEAM_DOMAIN` 是 Zero Trust 的 team domain（`<team>.cloudflareaccess.com`）
- 要加減管理員：Access 的 Policy 和 `wrangler.jsonc` 的 `ADMIN_EMAILS`（逗號分隔）兩邊都要改，再部署
- 後台顯示「後台登入還沒設定好」：`ACCESS_AUD`、`ACCESS_TEAM_DOMAIN`、`ADMIN_EMAILS` 有一個是空的（API 回 503）
- 後台顯示「這個帳號沒有後台權限」：Access 放行了，但 email 不在 `ADMIN_EMAILS`（403）
- 後台一直要求重新登入（401）：通常是 `ACCESS_AUD` 填錯，或 Access 應用漏了某個路徑

## 換成客戶自己的網域

1. 網域加進 Cloudflare（同一個帳號）
2. `wrangler.jsonc` 的 `routes` 改成新網域（`{ "pattern": "example.com", "custom_domain": true }`）
3. Access 應用的三個 Public hostname 換成新網域
4. `frontend/index.html` 的 `og:url`、`og:image`、`twitter:image` 換成新網域（分享縮圖要完整網址）
5. `npm run deploy`
6. DPOM 的 `wrangler.jsonc` 的 `WEBSITE_URL` 也要改，DPOM 重新部署
7. 後台側欄的 `nszpc.bluz.dev` 字樣在 `frontend/src/components/AdminShell.tsx`；DPOM 的網址在 `frontend/src/lib/adminAuth.ts` 的 `INTERNAL_SYSTEM_URL`
8. 到 Google Search Console 重新提交新網域的 sitemap（見下面）

`robots.txt`、`sitemap.xml`、各頁的 canonical、`og:url` 都是用請求的網域產生的，不用改。

## 分享縮圖

- 全站預設圖是 `frontend/public/og-image.jpg`（1200×630），寫在 `frontend/index.html`
- LINE 會快取縮圖：改了之後要看新的，用 [LINE Page Poker](https://poker.line.naver.jp/) 清快取
- favicon 換圖時，`index.html` 裡的 `?v=` 加一，瀏覽器才會重抓

## Google Search Console

上線（或換網域）後，到 [Google Search Console](https://search.google.com/search-console) 加入網域、驗證，提交 `https://<網域>/sitemap.xml`。
sitemap 每次請求都從資料庫產生，新增文章、出機紀錄不用重新提交。

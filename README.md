# NSZPC Web

NSZPC 星辰電腦網站：

- 前台：首頁、分類總覽、推薦配單、近期出機、技術文章
- 後台：網站內容、推薦配單、分類、出機紀錄、文章（庫存、進貨、同行拿貨、訂單和報價單在 DPOM（星辰電腦內部管理系統，https://dpom.bluz.dev））

目前網址（給客戶 demo 用）：<https://nszpc.bluz.dev>

## 架構

整個網站是一個 Cloudflare Worker（免費方案就夠用）：

```text
瀏覽器 ──▶ Cloudflare ──┬─ /api/*、/openapi.json、/api-docs ─▶ Worker（backend/src/worker.ts）─▶ D1（資料）
                        │      └─ /api/admin/*、/api/auth/me：Cloudflare Access 登入 + Worker 再驗一次 JWT
                        └─ 其他網址 ─▶ 前端靜態檔案（frontend/dist，React SPA）
```

| 部分 | 技術 | 位置 |
|---|---|---|
| 前端 | React 19 + TypeScript + Vite + React Router | `frontend/` |
| API | TypeScript，DDD 分層（application / domain / infrastructure） | `backend/src/` |
| 資料 | Cloudflare D1（SQLite） | `migrations/`、`backend/src/lib/store.ts` |
| 後台登入 | Cloudflare Access | `backend/src/lib/access.ts` |
| 部署設定 | Wrangler | `wrangler.jsonc` |

### 資料怎麼存

所有內容是一份 JSON（跟原本 PostgreSQL 版的 `app_state` 一樣），存在 D1 的 `app_state` 表，每個集合一列
（`categories`、`builds`、`orders`、`blogPosts`、`siteContent`、`meta`）。

- 每次寫入是「整份讀出來 → 改 → 只寫回有變的集合」，同一個 D1 batch（交易）裡插入新的版本號（`state_versions`）。
  兩個人同時改時，後寫的會撞到版本號、整個重讀重做，不會蓋掉對方的修改
- D1 單列上限 2MB：單一集合（例如文章）超過約 1.9MB 會寫入失敗，到時候要把那個集合拆成獨立的表
- 第一次啟動、資料庫是空的時候，會寫入 `store.ts` 裡的範例內容

### 後台登入（Cloudflare Access）

網站本身不存帳號密碼。進 `/admin` 時 Cloudflare 會先要求登入，只放行 Access 規則裡的 email；
通過後 Cloudflare 在請求加上 `Cf-Access-Jwt-Assertion`（JWT），Worker 再自己驗一次：

- RS256 簽章（公鑰從 `https://<team>/cdn-cgi/access/certs` 抓、快取）
- `iss` 是自己的 team domain、`aud` 是這個 Access 應用的 AUD tag、沒過期
- email 在 `ADMIN_EMAILS`（`wrangler.jsonc`）

所以就算 Access 的設定被改錯、拿掉，沒有正確 JWT 的請求還是進不了後台 API。`ACCESS_AUD` 沒設的話後台 API 一律回 503。

> 原本用帳號密碼（scrypt）登入：Workers 免費方案每個請求只有 10ms CPU，scrypt 會超過，所以改成 Access。

## 第一次設定

需要 Node.js 22+、Cloudflare 帳號（`npx wrangler login`）。

```bash
npm install
npm --prefix frontend install
```

D1 資料庫 `nszpc` 已經建好（`wrangler.jsonc` 的 `database_id`）。換帳號的話：`npx wrangler d1 create nszpc`，把新的 id 填進去。

### Cloudflare Access（後台登入）

在 Cloudflare 後台 › Zero Trust › Access › Applications：

1. **Add an application** › **Self-hosted**
2. Application name：`nszpc-admin`；Session duration 照預設
3. **Public hostname** 加三筆（網域都是 `nszpc.bluz.dev`）：path 分別填 `admin`、`api/admin`、`api/auth`
4. **Policy**：Action 選 Allow，Include › Emails 填可以進後台的 email
5. 存好後在應用的 Overview 複製 **Application Audience (AUD) Tag**，填進 `wrangler.jsonc` 的 `ACCESS_AUD`，再 `npm run deploy`

要加減管理員：Access 的 Policy 和 `wrangler.jsonc` 的 `ADMIN_EMAILS` 兩邊都要改。

## 本機開發

```bash
cp .dev.vars.example .dev.vars   # 本機不經過 Access，直接當 DEV_ADMIN_EMAIL 登入後台（只在 localhost 有效）
npm run dev:api                  # API + 本機 D1，http://localhost:8787
npm run dev:web                  # 前端，http://localhost:5173（/api 代理到 8787）
```

本機資料庫一開始是空的（會寫入範例內容）；要用正式環境的資料：

```bash
npm run state:export -- --remote > backup.json
npm run state:import -- backup.json
```

## 指令

| 指令 | 做什麼 |
|---|---|
| `npm run check` | 後端型別檢查、前端 lint、前端 build |
| `npm run deploy` | `check` → 套用 D1 migration → 部署 Worker（前端一起上傳） |
| `npm run state:export -- [--remote] > file.json` | 匯出網站資料（備份） |
| `npm run state:import -- file.json [--remote]` | 用 JSON 蓋掉網站資料（舊版 `backend/data/db.json` 格式也可以，`users` 會略過） |
| `npm run cf-typegen` | 改 `wrangler.jsonc` 後重新產生 Workers 型別（`worker-configuration.d.ts`） |

## 換成客戶自己的網域

1. 網域加進 Cloudflare（同一個帳號）
2. `wrangler.jsonc` 的 `routes` 改成新網域（`{ "pattern": "example.com", "custom_domain": true }`）
3. Access 應用的三個 Public hostname 換成新網域
4. `frontend/index.html` 的 `og:url`、`og:image`、`twitter:image` 換成新網域（分享縮圖要完整網址），`npm run deploy`
5. DPOM 的 `wrangler.jsonc` 的 `WEBSITE_URL` 也要改

## 安全

- 後台 API：Cloudflare Access + Worker 驗 JWT（見上面）
- API 回應：`X-Content-Type-Options`、`X-Frame-Options: DENY`、HSTS、最嚴格的 CSP（`backend/src/lib/http.ts`）
- 前端靜態檔案：CSP 只開 Google Fonts、YouTube / Google 地圖 iframe、https 圖片（`frontend/public/_headers`）
- `workers.dev` 和預覽網址關掉，只留正式網址

## 分享縮圖（LINE、FB、Discord）

- 爬蟲不會跑 JS，所以全站預設的標題和 `frontend/public/og-image.jpg`（1200×630）直接寫在 `frontend/index.html`
- 出機紀錄、推薦配單、分類、文章頁（`/orders/item/*`、`/builds/item/*`、`/categories/item/*`、`/blog/*`）會先經過 Worker，
  用 HTMLRewriter 換成那一頁的標題、說明和第一張照片（`backend/src/lib/sharePreview.ts`）；沒有照片就用預設圖
- LINE 會快取縮圖：改了之後要看新的，用 [LINE Page Poker](https://poker.line.naver.jp/) 清快取

## SEO

- `robots.txt`、`sitemap.xml` 由 Worker 產生（`backend/src/lib/sitemap.ts`），sitemap 直接從資料庫列出文章、分類、推薦配單、出機紀錄；後台和 API 不收錄
- 技術文章（`/blog`、`/blog/:slug`）在 Worker 先加上 canonical、關鍵字、發布日期、結構化資料（`BlogPosting`、`BreadcrumbList`、`Blog`、`ItemList`），
  文章內容直接寫進 HTML，不跑 JS 的爬蟲也讀得到（`backend/src/lib/sharePreview.ts`）；前端載入後 React 會整個換掉
- 前端的 `src/lib/seo.ts` 更新的是同一批標籤，兩邊的標題寫法要一致
- 上線後到 Google Search Console 提交 `https://<網域>/sitemap.xml`

## 文件

- 功能用法：[docs/feature-usage.md](docs/feature-usage.md)
- 資料設計：[docs/database-design.md](docs/database-design.md)
- 前端：[frontend/README.md](frontend/README.md)
- 後端：[backend/README.md](backend/README.md)

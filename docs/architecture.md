# 架構

## 整體

```
瀏覽器（客人、後台管理員）           DPOM（星辰電腦內部管理系統，另一個 Worker）
   │  https://nszpc.bluz.dev               │  Workers RPC（service binding）
   ▼                                       ▼
Cloudflare ── /admin、/api/admin/*、/api/auth/*：Cloudflare Access 先要求登入
   │
   ▼
Cloudflare Worker「nszpc」（backend/src/worker.ts）
   ├─ /api/*、/openapi.json、/api-docs、/docs → route()（REST API）── D1「nszpc」（整份網站資料）
   ├─ /media/*                                → R2「nszpc-media」（出機照片）
   ├─ /orders/item/*、/builds/item/*、/categories/item/*、/blog、/blog/*
   │                                          → index.html 經過 HTMLRewriter（分享縮圖、文章 SEO）
   ├─ /robots.txt、/sitemap.xml               → 從資料庫產生
   ├─ WebsiteAPI（rpc.ts）                    ← DPOM 發布、拿掉出機紀錄
   └─ 其他網址 → frontend/dist（React SPA 的靜態檔，找不到的路徑回 index.html）
```

- **一個 Worker 同時回前端和 API**（[ADR 0001](decisions/0001-cloudflare-workers.md)）：`wrangler.jsonc` 的 `assets`（`directory: frontend/dist`、
  `binding: ASSETS`、`not_found_handling: single-page-application`）。只有 `run_worker_first` 列出的路徑會先進 Worker：
  `/api/*`、`/openapi.json`、`/api-docs`、`/api-docs/*`、`/docs`、`/media/*`、`/orders/item/*`、`/builds/item/*`、`/categories/item/*`、`/blog`、`/blog/*`、`/robots.txt`、`/sitemap.xml`。
  其他網址（`/`、`/categories`、`/orders/tags`、`/admin` …）由 Cloudflare 直接回靜態檔，不經過 Worker 程式
- **網域**：`routes` 是 custom domain `nszpc.bluz.dev`（先用 bluz.dev 的子網域給客戶 demo）。`workers_dev`、`preview_urls` 都關掉，
  因為那些網址前面沒有 Cloudflare Access
- 同網域，所以前端打 API 用相對路徑（`frontend/src/lib/adminAuth.ts` 的 `getApiBaseUrl()`，`VITE_API_BASE_URL` 有設才用別的），不用 CORS
- 本機開發是兩個程式：`wrangler dev`（8787，API + 本機 D1、R2）和 Vite（5173，把 `/api`、`/openapi.json`、`/api-docs`、`/media` 代理到 8787），見 [setup.md](setup.md)

| 資料夾 | 內容 |
|---|---|
| `backend/src/worker.ts` | Worker 入口：路由、CSRF 檢查、後台登入檢查、錯誤處理 |
| `backend/src/routes.ts` | 路由清單（只給 `scripts/check-docs.mjs` 比對文件用） |
| `backend/src/rpc.ts` | `WebsiteAPI`：給 DPOM 的 RPC |
| `backend/src/application/content/` | 用例：`CollectionCrudService`（後台 CRUD）、`PublicContentQueryService`（公開查詢）、`SiteContentService`（網站文字）、`collectionValidators.ts` |
| `backend/src/domain/content/` | `ContentRepository` 介面 |
| `backend/src/infrastructure/persistence/` | `StoreContentRepository`：用 `lib/store.ts` 實作 |
| `backend/src/interfaces/http/` | `serviceContainer.ts`：把上面組起來 |
| `backend/src/lib/` | `store.ts`（D1 讀寫、資料整理、範例內容）、`validation.ts`、`types.ts`、`access.ts`、`http.ts`、`openapi.ts`、`sharePreview.ts`、`sitemap.ts` |
| `frontend/src/` | React 前端：`pages/`、`components/`、`lib/`（API、SEO、版號）、`styles/`、`data/`（API 失敗時的備用內容） |
| `migrations/` | D1 資料表（`wrangler d1 migrations`） |
| `scripts/` | `state.mjs`（資料匯出匯入）、`check-docs.mjs`（文件、版號檢查） |

## 資料表

定義在 [`migrations/`](../migrations/)。改資料表要**新增**一個 migration（`0003_xxx.sql`），不要改已經部署過的；`npm run deploy` 會先跑 `wrangler d1 migrations apply nszpc --remote`。

| 資料表 | 內容 |
|---|---|
| `app_state` | 整個網站的資料，每個集合一列：`key` 是集合名稱（`meta`、`categories`、`builds`、`orders`、`blogPosts`、`siteContent`），`data` 是那個集合的 JSON，`updated_at` 是寫入時間 |
| `state_versions` | 寫入的版本號，只有一個欄位 `version`（主鍵）。每次寫入插入「讀到的版本 + 1」、刪掉比它小的，所以平常只有一列 |

`0002_drop_internal_collections.sql` 刪掉 `app_state` 裡的 `inventories`、`procurements`、`personalProcurements`（庫存、進貨、同行拿貨，裡面有進貨成本），這些搬到 DPOM 了（[ADR 0003](decisions/0003-dpom-owns-internal-data.md)）。

## 資料：整份 JSON

網站的資料不拆成很多張表，而是一份 JSON（`DbSchema`，型別在 [`backend/src/lib/types.ts`](../backend/src/lib/types.ts)），讀寫在 [`backend/src/lib/store.ts`](../backend/src/lib/store.ts)（[ADR 0001](decisions/0001-cloudflare-workers.md)）：

| 集合 | 型別 | 內容 |
|---|---|---|
| `meta` | `DbMeta` | `createdAt`、`updatedAt`、`version`（資料格式版本，目前是 1，跟 `state_versions` 無關） |
| `builds` | `BuildRecord[]` | 推薦配單：名稱、簡介、需求說明、價格、成交日期（`YYYY/MM/DD`）、徽章、標籤、圖片、CPU／主機板／RAM／硬碟／GPU／電源／機殼、配件、其他規格、YouTube 網址 |
| `categories` | `CategoryRecord[]` | 分類：標題、摘要、主／次分類、標籤、重點、介紹、主圖、推薦（拿來對推薦配單）、FAQ |
| `orders` | `OrderRecord[]` | 出機紀錄：日期、品名、需求說明、地區、售價 `salePrice`、服務費 `serviceFee`（不公開，DPOM 發布的一律 0）、狀態、標籤、照片網址、八項規格、YouTube 網址 |
| `blogPosts` | `BlogPostRecord[]` | 技術文章：`slug`、標題、摘要、封面、發布／更新日期（`YYYY-MM-DD`）、作者、閱讀分鐘數、標籤、段落（標題、段落、條列）、YouTube 網址 |
| `siteContent` | `SiteContentRecord` | 網站文字：首頁標題、數字、出機標籤庫、服務流程、客戶回饋、聯絡管道、footer 地址和標語……，加上前台已經不顯示的 13 個舊欄位（`RetiredSiteContentKey`，[ADR 0006](decisions/0006-remove-admin-generators.md)） |

- **讀**（`readDb`）：一個 D1 batch 讀出全部的 `app_state` 和 `MAX(version)`，每個集合用 `normalize*` 函式整理（缺的欄位補預設值、
  格式不對的那筆丟掉，例如出機紀錄沒有 `id`、`date`、`item`、`location` 的不要）。整張表是空的（第一次啟動）就寫入 `defaultDb()` 的範例內容
- **寫**（`mutateDb`）：讀出整份 → 交給 mutator 改 → 只把 JSON 有變的集合寫回去。寫回的 batch（D1 的 batch 是一個交易）第一句是
  `INSERT INTO state_versions (version) VALUES (讀到的版本 + 1)`：兩個請求同時改時，後寫的撞到主鍵、整個 batch 回滾，
  **重讀重做**，最多 5 次（`MAX_WRITE_ATTEMPTS`），都失敗才丟錯誤（API 回 500）
- **單列上限**：D1 一列最多 2MB，程式留到 1,900,000 bytes（`MAX_ROW_BYTES`），某個集合超過就寫入失敗。到時候要把那個集合拆成自己的表
- **新增**的資料放在陣列最前面（`unshift`），所以公開的出機紀錄「前 N 筆」就是最新的 N 筆；文章讀出來時照 `publishedAt` 新到舊排
- **id** 是 `crypto.randomUUID()`；文章對外用 `slug`

加欄位時要一起改：`types.ts` 的型別、`validation.ts` 的檢查、`store.ts` 的 `normalize*`（不然讀出來會被丟掉）、前端的表單和型別。
加集合還要改 `store.ts` 的 `COLLECTION_KEYS`、`scripts/state.mjs` 的 `KEYS`、`ContentRepository.ts`、`collectionValidators.ts`、`worker.ts` 的 `resolveCollectionName`。

## 出機照片（R2）

R2 bucket `nszpc-media`，binding `MEDIA`。只有 DPOM 透過 RPC 的 `replaceOrderImages` 會寫進來，key 是 `orders/<DPOM 單號>/<時間戳>-<序號>.<副檔名>`，
官網網址是 `/media/orders/...`（[api.md](api.md#get-mediaordersreffile)）。換照片時先刪掉同一個單號底下的舊檔，新檔名帶時間戳，所以可以快取一年。
後台手動貼的照片網址（任何 https 圖片）不會進 R2。

## DPOM 發布出機紀錄（WebsiteAPI）

[ADR 0003](decisions/0003-dpom-owns-internal-data.md)。庫存、進貨、同行拿貨、訂單、報價都在 DPOM（https://dpom.bluz.dev），官網只放公開內容。
DPOM 的訂單按「發布到官網」時，透過 service binding 呼叫這個 Worker 的 `WebsiteAPI`（[`backend/src/rpc.ts`](../backend/src/rpc.ts)）：

1. `orderTags()`：拿官網用過的標籤給 DPOM 選
2. `replaceOrderImages(ref, images)`：照片存進 R2，拿到網址
3. `publishOrder(orderId, input, images)`：新增或更新出機紀錄，`serviceFee` 一律存 0；回傳 `id` 給 DPOM 記著，下次發布就是更新
4. `unpublishOrder(orderId, ref)`：從官網拿掉，連照片一起刪

RPC 沒有公開網址，只有綁定的 Worker 叫得到，所以不另外驗身分、也不經過 CSRF 檢查。寫入用的是跟後台一樣的 `validateOrderInput`。
DPOM 那邊的 `wrangler.jsonc` 有 `WEBSITE_URL`（拿來組「在官網上看」的連結），換網域時要改（[setup.md](setup.md#換成客戶自己的網域)）。

## 後台登入（Cloudflare Access）

[ADR 0002](decisions/0002-cloudflare-access.md)。網站不存帳號密碼：

1. 進 `/admin`（或打 `/api/admin/*`、`/api/auth/*`）時，Cloudflare Access 先要求登入（email 驗證碼），只放行 Access Policy 裡的 email
2. 通過後 Cloudflare 在請求加上 `Cf-Access-Jwt-Assertion`
3. Worker 再自己驗一次（[`backend/src/lib/access.ts`](../backend/src/lib/access.ts)）：只收 RS256、公鑰從 `https://<ACCESS_TEAM_DOMAIN>/cdn-cgi/access/certs` 抓
   （同一個 isolate 快取，遇到不認得的 `kid` 才重抓，最多每分鐘一次）、`iss` 是自己的 team domain、`aud` 含 `ACCESS_AUD`、
   `exp`／`nbf`（容許 30 秒誤差）、要有 email（service token 不收）、email 在 `ADMIN_EMAILS`

所以 Access 的設定哪天被改錯、拿掉，沒有正確 JWT 的請求還是進不了後台 API。三個設定（`ACCESS_TEAM_DOMAIN`、`ACCESS_AUD`、`ADMIN_EMAILS`）在 `wrangler.jsonc` 的 `vars`，
有一個是空的後台 API 一律回 503。加減管理員：Access 的 Policy 和 `ADMIN_EMAILS` 兩邊都要改。

- **本機**：`.dev.vars` 的 `DEV_ADMIN_EMAIL` 有設、而且網址是 localhost／127.0.0.1 時，直接當那個 email 登入，不驗 JWT。正式環境沒有 `.dev.vars`
- **登出**：前端導到 `/cdn-cgi/access/logout`（Access 的登出），前端不存任何 token
- 驗簽只要一次 WebCrypto RSA 驗證，不會超過 Workers 免費方案每個請求 10ms CPU（原本的 scrypt 密碼會）

## 分享縮圖和 SEO

[ADR 0005](decisions/0005-share-preview-and-seo.md)。前端是 SPA，每一頁拿到的都是同一份 `index.html`，`#root` 是空的；
LINE、FB、Discord 的爬蟲不跑 JS，搜尋引擎也不一定跑。

- **全站預設**：`frontend/index.html` 直接寫好標題、description、`og:*`、`twitter:*`，分享圖是 `frontend/public/og-image.jpg`（1200×630），
  `og:url`、`og:image`、`twitter:image` 是完整網址（`https://nszpc.bluz.dev/...`，換網域要改）
- **各頁**：`/orders/item/*`、`/builds/item/*`、`/categories/item/*`、`/blog`、`/blog/*` 先經過 Worker，`env.ASSETS.fetch` 拿 `index.html`，
  [`backend/src/lib/sharePreview.ts`](../backend/src/lib/sharePreview.ts) 用 HTMLRewriter 換成那一頁的標題、說明（最多 110 字）、第一張照片
  （有照片才換，並拿掉 `og:image:width`／`height`／`type`）。找不到資料、或讀資料出錯就照原樣回傳。`SHARE_PREVIEW_PATHS` 要跟 `run_worker_first` 一致
- **技術文章**另外加 `<link rel="canonical">`、keywords、`article:published_time`／`modified_time`、JSON-LD（文章：`BlogPosting` + `BreadcrumbList`；
  列表：`Blog` + `ItemList`，`data-seo-id="page-seo"`），並把文章內容（已跳脫的 HTML）直接寫進 `#root`；前端載入後 React 整個換掉
- **前端**：[`frontend/src/lib/seo.ts`](../frontend/src/lib/seo.ts) 的 `applySeo` 在瀏覽器裡更新同一批標籤（canonical、`data-seo-id="page-seo"` 的 JSON-LD），不會重複；
  兩邊的標題寫法要一致（例如文章是「`<標題>`｜NSZPC 技術文章」）。`/admin` 會加 `noindex`
- **robots.txt、sitemap.xml**：[`backend/src/lib/sitemap.ts`](../backend/src/lib/sitemap.ts) 產生，sitemap 直接從資料庫列出所有文章、分類、推薦配單、出機紀錄
- 沒做：FAQ 的結構化資料（Google 已經不顯示一般網站的 FAQ rich result）、`llms.txt`

## 安全

[ADR 0007](decisions/0007-security.md)。

- **後台 API**：Cloudflare Access + Worker 驗 JWT（見上面）
- **CSRF**：`worker.ts` 的 `isCrossSiteWrite`：GET、HEAD、OPTIONS 以外的請求，`Sec-Fetch-Site: cross-site`，或有 `Origin` 而且不是自己網站，就回 403。
  沒有 `Origin` 的（例如 curl）放行，反正後台 API 還要 Access JWT。本機開發 `Origin` 和網址都是 localhost／127.0.0.1 時不算跨站（Vite 5173 代理到 8787）。
  DPOM 走 RPC，不經過這裡
- **API 回應的標頭**：`backend/src/lib/http.ts` 的 `API_SECURITY_HEADERS`（`nosniff`、`X-Frame-Options: DENY`、`Referrer-Policy`、HSTS、CSP `default-src 'none'; frame-ancestors 'none'`），
  回應自己有設的不蓋掉（`/api-docs` 有自己的 CSP，允許 unpkg 的 Swagger UI；`/media/*` 是 `default-src 'none'; sandbox`）
- **靜態檔的標頭**：[`frontend/public/_headers`](../frontend/public/_headers)。CSP：`script-src 'self'`、`style-src 'self' 'unsafe-inline'`、
  圖片允許 `https:`（後台可以貼任何 https 圖片網址）、`frame-src` 只開 YouTube、youtube-nocookie、Google（地圖）、`frame-ancestors 'none'`。
  `/assets/*` 快取一年；`/admin*` 加 `X-Robots-Tag: noindex`。Worker 改寫過的頁面（`/blog` 等）也有這些標頭（2026-10-17 用 curl 看過正式環境）
- **body 大小**：寫入的 JSON 最多 1MB（`readJsonObject`）
- **公開資料不含**服務費、客人資料、進貨成本；公開出機紀錄一次最多 100 筆
- **套件**：`npm audit` 是 0（2026-10-17）
- `workers.dev`、預覽網址關掉，只留正式網址

## 版號

[ADR 0008](decisions/0008-version-in-admin-only.md)。repo 根目錄的 `VERSION` 是唯一的來源：

- Worker：`wrangler.jsonc` 的 `rules` 把 `VERSION` 當文字打包，`/api/health` 回傳
- 前端：`frontend/vite.config.ts` 讀 `VERSION`、`git rev-parse --short HEAD`、建置日期，寫進 `__APP_VERSION__`、`__BUILD_SHA__`、`__BUILD_DATE__`；
  `CHANGELOG.md` 用 `?raw` 讀進來（`frontend/src/lib/changelog.ts`）
- 只在後台顯示：側欄最下面的版號，點進 `/admin/changelog`。看過的版號存在 localStorage（`nszpc-admin-seen-version`），版號變了顯示 NEW

## 前端

React 19 + TypeScript + Vite + React Router（`frontend/src/App.tsx`）。

**前台頁面**（`frontend/src/pages/`）：

| 網址 | 頁面 |
|---|---|
| `/` | `Home.tsx`：大標＋分類照片列、探索推薦配單、近期出機、跟星辰買電腦，最好。（數字＋服務流程）、客戶怎麼說、聯絡我們（聯絡管道＋Google 地圖） |
| `/categories` | `Categories.tsx`：分類總覽，可以用標籤、關鍵字篩選 |
| `/categories/item/:id` | `CategoryDetail.tsx`：分類介紹、重點、FAQ、對得上的推薦配單 |
| `/builds/item/:id` | `BuildDetail.tsx`：推薦配單 |
| `/orders/tags` | `OrderTagOverview.tsx`：出機紀錄，用標籤篩選（多個標籤是 AND） |
| `/orders/item/:id` | `OrderDetail.tsx`：一筆出機紀錄 |
| `/blog`、`/blog/:slug` | `Blog.tsx`、`BlogDetail.tsx`：技術文章 |
| `/brand`、`/cases/*` | 舊網址，轉到 `/categories`；其他找不到的網址轉到 `/` |

公開資料由 `frontend/src/lib/public*.ts` 打 `/api/public/*`，打不到時用 `frontend/src/data/` 的備用內容（頁面不會空白）。

**版面（Apple 風格）**：[ADR 0004](decisions/0004-apple-style.md)，規格在 [`DESIGN.md`](../DESIGN.md)。CSS 依序疊三層：
`App.css`（原本的樣式）→ `styles/apple.css`（DESIGN.md 的顏色、字、按鈕、白卡、毛玻璃頂欄，後台也用）→ `styles/apple-site.css`（前台的 apple.com/tw/mac 版面：
白和淺灰交替的滿版區塊 `tile`、大標、`section-card` 自動變滿版區塊）。

- `components/Menu.tsx`：44px 半透明細條導覽（首頁、出機紀錄、分類總覽、技術文章、聯絡我們），手機是全螢幕選單；**不放後台連結**
- `components/Shelf.tsx`：橫向捲動的卡片列（推薦配單、近期出機、服務流程），右下角上一頁／下一頁圓鈕
- footer（在 `App.tsx`）：分欄的探索、聯絡星辰、門市，最下面版權；也不放後台連結
- `/#contact` 這種網址會捲到那一段（`AppFrame`）

**後台**（`/admin`，[ADR 0004](decisions/0004-apple-style.md)）：不顯示前台的頂欄和 footer，外框是 `components/AdminShell.tsx`：

- 左側固定選單：出機紀錄、推薦配單、分類總覽、技術文章、網站文字；下面是「內部管理系統」（DPOM）、「查看官網」、email、版號、切換帳號、登出。
  平板只剩圖示，手機變成上方可橫向捲動的分頁
- 出機紀錄、推薦配單、分類總覽、網站文字是同一頁（`pages/AdminDashboard.tsx`）的分頁，用網址的 `#hash` 記住（`#orders`、`#builds`、`#categories`、`#siteContent`，
  `pages/adminDashboard/shared.ts` 的 `adminTabFromHash`，預設 `#orders`）
- 技術文章是另一頁 `/admin/blog`（`pages/AdminBlogManager.tsx`），更新紀錄是 `/admin/changelog`（`pages/AdminChangelog.tsx`）；`/admin/login` 是舊網址，轉到 `/admin`
- 圖示用 `@fortawesome/fontawesome-free`（打包進來，不用 CDN）

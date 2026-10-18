# API

Worker（[`backend/src/worker.ts`](../backend/src/worker.ts)）處理的每一個網址。路由寫在 `route()`、`handleCrudCollection()` 和 `fetch` 裡，
清單另外列在 [`backend/src/routes.ts`](../backend/src/routes.ts) 的 `ROUTES`。

> **這份文件跟 `ROUTES` 要一致**：`npm run check` 會跑 [`scripts/check-docs.mjs`](../scripts/check-docs.mjs)，
> 比對這裡的 `###` 標題和 `ROUTES`，也會檢查 `worker.ts` 裡出現的路徑字串（`parts[n] === '...'`、`case '...'`、集合名稱）都在 `ROUTES` 裡。
> 新增、刪除、改路徑時，三個地方一起改。

DPOM 呼叫的 `WebsiteAPI` 不是 HTTP 路由，寫在最下面的「[內部 RPC](#內部-rpcwebsiteapi)」。

## 共通規則

- 資料都是 JSON，成功回 `{ "data": ... }`，型別在 [`backend/src/lib/types.ts`](../backend/src/lib/types.ts)
- 錯誤一律回 `{ "error": { "message": "...", "details": ... } }`（`details` 可能沒有、是字串或字串陣列），
  寫在 [`backend/src/lib/http.ts`](../backend/src/lib/http.ts)。HTTP 狀態碼：
  - `400` body 不是 JSON 物件（`Invalid JSON payload`）或超過 1MB（`Request body too large`）
  - `401` 沒有 Cloudflare Access 的 JWT 或 JWT 驗不過（`details`：「請重新整理頁面，重新登入」）
  - `403` email 不在 `ADMIN_EMAILS`（`details`：「這個帳號沒有後台權限」）；
    或是**跨站請求**：GET、HEAD、OPTIONS 以外的請求，`Sec-Fetch-Site` 是 `cross-site`，或 `Origin` 不是自己網站（`details`：「不接受從其他網站送出的請求」）。
    本機開發 `Origin` 和網址都是 localhost／127.0.0.1 時不算跨站（Vite 5173 代理到 8787）
  - `404` 找不到（`Resource not found`）、`405` 方法不對（有 `Allow` 標頭）
  - `422` 輸入檢查沒過（`message` 是 `Validation failed`，`details` 是錯誤陣列，例如 `["name is required"]`，檢查在 [`backend/src/lib/validation.ts`](../backend/src/lib/validation.ts)）
  - `500` 其他錯誤（`Internal server error`）；同時寫入撞版本號重試 5 次還是失敗也是 500（見 [architecture.md](architecture.md#資料整份-json)）
  - `503` 後台登入還沒設定好：`ACCESS_AUD`、`ACCESS_TEAM_DOMAIN`、`ADMIN_EMAILS` 有一個是空的
- **後台登入**（標「後台」的）：要有 Cloudflare 加上的 `Cf-Access-Jwt-Assertion`，Worker 驗 RS256 簽章、`iss`、`aud`、期限，
  email 要在 `ADMIN_EMAILS`（[`backend/src/lib/access.ts`](../backend/src/lib/access.ts)）。本機 `.dev.vars` 有 `DEV_ADMIN_EMAIL`、而且網址是 localhost 時直接當那個 email 登入
- **安全性標頭**：經過 `route()` 的回應都會補上 `API_SECURITY_HEADERS`（`X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY`、
  `Referrer-Policy`、HSTS、CSP `default-src 'none'; frame-ancestors 'none'`；回應自己有設的不蓋掉）。`/robots.txt`、`/sitemap.xml`、前端頁面不經過這裡
- API 的回應都是 `Cache-Control: no-store`

## 公開

### `GET /api/health`

不用登入。回 `{ status: "ok", version, timestamp }`，`version` 是 repo 根目錄 `VERSION` 的內容。GET、HEAD 以外回 405。

### `HEAD /api/health`

同上，只回狀態碼和標頭（給監控用）。HEAD 的回應一律不帶 body（`worker.ts` 的 `withoutBody`）。

### `GET /api/public/builds`

不用登入。全部的推薦配單（`BuildRecord[]`）。

### `GET /api/public/categories`

不用登入。全部的分類（`CategoryRecord[]`）。

### `GET /api/public/orders`

不用登入。出機紀錄，照存的順序（新增的在最前面）取前 `limit` 筆。

- `?limit=`：預設 5，最小 1、最多 100，不是數字就用 5；**`?limit=all` 是全部**（出機紀錄整份存在 D1 的一列，最多約 1.9MB，所以全部也有上限）
- **不含 `serviceFee`**（服務費不公開，只有售價 `salePrice`）
- 前端首頁拿 12 筆，出機標籤頁拿全部（`limit=all`）在前端篩選；出機詳細頁用下面的 `/api/public/orders/:id`

### `GET /api/public/orders/:id`

不用登入。一筆出機紀錄（出機詳細頁用），**不含 `serviceFee`**，沒有回 404。不管總共幾筆，每一筆的出機頁都打得開（sitemap 也列出全部）。

### `GET /api/public/blog-posts`

不用登入。全部的技術文章（`BlogPostRecord[]`），照發布日期新到舊。

### `GET /api/public/site-content`

不用登入。網站文字（`SiteContentRecord`），包含前台已經不顯示的舊欄位。

## 後台

`/api/auth/*` 只有 `me`，其他回 404。`/api/admin/*` 一律先做後台登入檢查，沒過就回 401／403／503，不管路徑對不對。

### `GET /api/auth/me`

後台。回目前登入的人：`{ id, username, role: "admin", createdAt: "" }`，`id`、`username` 都是 email。前端用它判斷能不能進後台、顯示 email。

### `GET /api/admin/site-content`

後台。網站文字（跟公開的一樣）。

### `PUT /api/admin/site-content`

後台。存網站文字，回存好的 `SiteContentRecord`。

- 必填：`homeHeroTitle`、`homeContactSubtitle`、`categoriesHeroSubtitle`、`brandHeroTitle`、`footerAddress`、`footerSlogan`，
  `homeStats`、`categoriesQuickTags`、`shipmentTagCatalog`、`shippingSteps`、`testimonials`、`contactChannels` 至少一筆
- 舊欄位（`types.ts` 的 `RetiredSiteContentKey`，13 個）不用帶：有帶而且有內容才更新，沒帶就沿用資料庫原本的值
- 讀出原本的值、合併、寫回去在同一個 `mutateDb` 裡（有版本號檢查），別人同時存了會重讀重做，不會用舊資料蓋掉對方剛存的東西

### `GET /api/admin/builds`

後台。全部的推薦配單。

### `POST /api/admin/builds`

後台。新增推薦配單，回 201 和新的資料（`id`、`createdAt`、`updatedAt` 由伺服器產生，加在最前面）。
必填：`name`、`description`、`requirementIntro`、`price`（大於 0）、`dealDate`（`YYYY/MM/DD`）、`image`、`cpu`、`motherboard`、`ram`、`storage`、`gpu`、`psu`、`pcCase`、`tags`（至少一個）。

### `GET /api/admin/builds/:id`

後台。一筆推薦配單，沒有回 404。

### `PUT /api/admin/builds/:id`

後台。整筆更新（檢查跟新增一樣），回更新後的資料，沒有回 404。

### `DELETE /api/admin/builds/:id`

後台。刪除，回被刪掉的那筆，沒有回 404。

### `GET /api/admin/categories`

後台。全部的分類。

### `POST /api/admin/categories`

後台。新增分類，回 201。必填：`title`、`summary`、`primaryCategory`、`secondaryCategory`、`detailIntro`、`detailHeroImage`，
`tags`、`points`、`detailRecommendations`、`detailFaqs`（`{ question, answer }`）至少一筆。

### `GET /api/admin/categories/:id`

後台。一筆分類，沒有回 404。

### `PUT /api/admin/categories/:id`

後台。整筆更新，沒有回 404。

### `DELETE /api/admin/categories/:id`

後台。刪除，回被刪掉的那筆。

### `GET /api/admin/orders`

後台。全部的出機紀錄，**含 `serviceFee`**。

### `POST /api/admin/orders`

後台。手動新增出機紀錄，回 201。必填：`date`、`item`、`requirementIntro`、`location`、`cpu`、`motherboard`、`ram`、`storage`、`gpu`、`psu`、`cooler`、`pcCase`、
`tags`（至少一個），`salePrice`、`serviceFee` 要是 0 以上的數字。`status` 是 `pending`／`shipping`／`delivered`／`cancelled`，沒給是 `pending`。
`images` 是照片網址陣列（DPOM 發布的是 `/media/orders/...`）。一般是從 DPOM 發布過來（見下面的 RPC），這裡是後台手動補的。

### `GET /api/admin/orders/:id`

後台。一筆出機紀錄，沒有回 404。

### `PUT /api/admin/orders/:id`

後台。整筆更新，沒有回 404。

### `DELETE /api/admin/orders/:id`

後台。刪除出機紀錄，回被刪掉的那筆，沒有回 404。**R2 裡這筆的照片也會一起刪**（[`backend/src/lib/media.ts`](../backend/src/lib/media.ts) 的 `deleteOrderMedia`），只刪屬於這筆的：

- 只看 `images` 裡 `/media/orders/<ref>/<file>` 這種網址（外部網址不管）
- 別筆出機紀錄還在用的照片不刪
- 照片所在的資料夾（`orders/<ref>/`）沒有別筆在用，就整個資料夾清掉（包括沒列在 `images` 的舊檔）

刪照片失敗只記 log，不影響刪紀錄的結果。DPOM 的「從官網拿掉」走 RPC 的 `unpublishOrder`（見下面）。

### `GET /api/admin/blog-posts`

後台。全部的技術文章。

### `POST /api/admin/blog-posts`

後台。新增文章，回 201。必填：`slug`（小寫英數字和 `-`）、`title`、`summary`、`coverImage`、`publishedAt` 和 `updatedAt`（`YYYY-MM-DD`）、`authorName`、
`readingMinutes`（正整數）、`tags`（至少一個）、`sections`（`{ heading, paragraphs, bullets }`，至少一段有標題和段落）。

- **`slug` 不能跟別篇重複**（文章網址是 `/blog/<slug>`），重複回 422，`details` 是「Slug「…」已經有別篇文章在用了，請換一個」。
  檢查跟寫入在同一個 `mutateDb` 裡，兩個請求同時存同一個 slug 也擋得住
- **`updatedAt` 照送來的存**（後台表單的「更新日」），不會被伺服器改成存檔時間；sitemap 的 `lastmod`、文章頁的 `article:modified_time` 都用它。
  其他集合的 `updatedAt` 是伺服器寫入的時間（ISO）

### `GET /api/admin/blog-posts/:id`

後台。一篇文章（用 `id`，不是 `slug`），沒有回 404。

### `PUT /api/admin/blog-posts/:id`

後台。整篇更新，沒有回 404。檢查跟新增一樣：`slug` 不能跟別篇重複（跟自己一樣沒關係），`updatedAt` 照送來的存。

### `DELETE /api/admin/blog-posts/:id`

後台。刪除文章。

## API 文件

### `GET /openapi.json`

不用登入。OpenAPI 3 文件（[`backend/src/lib/openapi.ts`](../backend/src/lib/openapi.ts)），伺服器網址用目前的網域。
列了 `/api/health`、`/api/auth/me`、`/api/public/*`、`/api/admin/*`（含技術文章）；公開的出機紀錄用 `PublicOrder`（沒有 `serviceFee`）。
`/media`、`/robots.txt`、`/sitemap.xml`、前端頁面沒有列，以這份文件為準。

### `GET /api-docs`

不用登入。Swagger UI 的頁面（從 unpkg 載入 `swagger-ui-dist@5`），自己的 CSP 允許 `https://unpkg.com`。`/api-docs/` 底下其他路徑也回同一頁。

### `GET /api-docs/init.js`

不用登入。Swagger UI 的初始化 script（分成另一支檔案，CSP 才不用開 `'unsafe-inline'` 給 script）。

### `GET /docs`

不用登入。跟 `/api-docs` 一樣的頁面。

## 照片

### `GET /media/orders/:ref/:file`

不用登入。出機照片，從 R2（`MEDIA`）讀。`:ref` 是 DPOM 的單號（英數字和 `-`），`:file` 是 `<時間戳>-<序號>.<副檔名>`（英數字、`.`、`-`）；
不符合格式或檔案不存在回 404。`Cache-Control: public, max-age=31536000, immutable`（換照片時檔名會變），CSP `default-src 'none'; sandbox`。

### `HEAD /media/orders/:ref/:file`

同上，只回標頭。

## 搜尋引擎

### `GET /robots.txt`

不用登入。Worker 產生（[`backend/src/lib/sitemap.ts`](../backend/src/lib/sitemap.ts)）：全部允許，擋 `/admin`、`/api/`、`/api-docs`，最後一行是 sitemap 的網址。快取 1 小時。
GET、HEAD 以外回 405。

### `HEAD /robots.txt`

同上，只回標頭。

### `GET /sitemap.xml`

不用登入。從資料庫產生：`/`、`/blog`、`/categories`、`/orders/tags`，以及每一篇文章、分類、推薦配單、出機紀錄（全部，不限筆數）的網址，
`lastmod` 是更新日期（文章用後台填的「更新日」）。快取 1 小時。GET、HEAD 以外回 405。

### `HEAD /sitemap.xml`

同上，只回標頭。

## 前端頁面（改寫分享縮圖和 SEO）

這幾個網址回的是前端的 `index.html`（`env.ASSETS.fetch`），Worker 用 HTMLRewriter 換掉 `<title>`、description、`og:*`、`twitter:*`，
找不到資料就照原樣回傳（[`backend/src/lib/sharePreview.ts`](../backend/src/lib/sharePreview.ts)，說明在 [architecture.md](architecture.md#分享縮圖和-seo)）。

### `GET /orders/item/:id`

出機紀錄頁：標題「`<品名>`｜星辰電腦 NSZPC 出機紀錄」，說明是地區・CPU・GPU・RAM・售價，圖片是第一張照片。

### `GET /builds/item/:id`

推薦配單頁：標題「`<名稱>`｜星辰電腦 NSZPC 推薦配單」，說明是簡介・價格，圖片是配單的 `image`。

### `GET /categories/item/:id`

分類頁：標題「`<分類>`｜星辰電腦 NSZPC」，說明是 `summary`，圖片是 `detailHeroImage`。

### `GET /blog`

文章列表：另外加 canonical、keywords、JSON-LD（`Blog`、`ItemList`），文章清單直接寫進 `#root`。

### `GET /blog/:slug`

一篇文章：另外加 canonical、keywords、`article:published_time`／`modified_time`、JSON-LD（`BlogPosting`、`BreadcrumbList`），文章內容直接寫進 `#root`。

## 內部 RPC（WebsiteAPI）

[`backend/src/rpc.ts`](../backend/src/rpc.ts) 的 `WebsiteAPI`（`WorkerEntrypoint`），`worker.ts` 有 `export { WebsiteAPI }`。
只有在 `wrangler.jsonc` 的 `services` 綁了這個 Worker 的 Worker（DPOM）叫得到，沒有公開網址，所以不經過 CSRF 檢查、也不驗 Access
（DPOM 本身在 Cloudflare Access 後面）。寫入走 `validateOrderInput`，跟後台手動新增的檢查一樣。

| 方法 | 做什麼 |
|---|---|
| `replaceOrderImages(ref, images)` | 先刪掉 R2 裡 `orders/<ref>/` 的舊照片，再存新的，回傳官網網址陣列（`/media/orders/<ref>/<時間戳>-<序號>.<副檔名>`）。一次最多 10 張、每張最大 10MB，格式只收 jpeg、png、webp、gif（瀏覽器都能顯示的；**HEIC 不收**，大部分瀏覽器看不到）；不符合直接丟錯誤，訊息是中文、寫出是哪張照片（例如「照片「IMG_1234.HEIC」是 HEIC 格式，多數瀏覽器看不到，請先轉成 JPEG 再發布」） |
| `publishOrder(orderId, input, images)` | 新增或更新一筆出機紀錄：`orderId` 有給而且還在就更新，不然新增。**`serviceFee` 一律存 0**（售價不含服務費、不帶客人資料）。回 `{ ok: true, id, path: "/orders/item/<id>" }` 或 `{ ok: false, errors }` |
| `unpublishOrder(orderId, ref)` | 刪掉出機紀錄和 R2 裡 `orders/<ref>/` 的照片 |
| `orderTags()` | 官網出機紀錄用過的標籤，用得多的排前面（DPOM 發布時給選） |

`ref` 只能是 1～64 個英數字或 `-`（例如 `dpom-14`），不符合丟 `invalid ref`。

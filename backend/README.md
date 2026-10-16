# NSZPC Backend

跑在 Cloudflare Workers 上的 API，資料存在 Cloudflare D1。部署、本機開發、後台登入的設定見[根目錄的 README](../README.md)。

## 功能範圍

- 前台公開 API：推薦配單、分類、出機紀錄、技術文章、網站內容
- 後台 API：上面這些的 CRUD，以及網站內容編輯（庫存、進貨、同行拿貨、訂單和報價單在 DPOM（星辰電腦內部管理系統，https://dpom.bluz.dev））
- OpenAPI 文件：`/openapi.json`、Swagger UI：`/api-docs`

## 結構（DDD 分層）

| 路徑 | 內容 |
|---|---|
| `src/worker.ts` | Worker 入口：路由、後台登入檢查、錯誤處理 |
| `src/lib/access.ts` | Cloudflare Access 的 JWT 驗證 |
| `src/lib/store.ts` | D1 讀寫（整份 JSON、版本號防同時寫入）、資料正規化、範例內容 |
| `src/lib/http.ts` | Response 小工具、API 的安全標頭 |
| `src/lib/validation.ts` | 所有寫入的輸入檢查 |
| `src/lib/types.ts` | 資料型別 |
| `src/lib/openapi.ts` | OpenAPI 文件 |
| `src/application/*` | 用例（CRUD、公開查詢、網站內容、主控台） |
| `src/domain/*` | 介面 |
| `src/infrastructure/*` | 介面的實作（存在 store.ts） |

## API 概覽

### 公開（不用登入）

- `GET /api/health`
- `GET /api/public/builds`
- `GET /api/public/categories`
- `GET /api/public/orders?limit=5`（最多 20）
- `GET /api/public/blog-posts`
- `GET /api/public/site-content`

### 後台（Cloudflare Access）

- `GET /api/auth/me`：目前登入的人（email）
- `GET /api/admin/dashboard`
- `GET|PUT /api/admin/site-content`
- `GET|POST /api/admin/<collection>`、`GET|PUT|DELETE /api/admin/<collection>/:id`
  - collection：`builds`、`categories`、`orders`、`blog-posts`

錯誤格式：`{ "error": { "message": "...", "details": ... } }`；未登入 401、沒有權限 403、Access 還沒設定 503、輸入錯誤 422。

## 修改時注意

- 新增或改欄位：同時改 `src/lib/validation.ts`、`src/lib/types.ts`、`store.ts` 的 normalize 函式
- 新增集合：`src/domain/content/ContentRepository.ts`、`src/application/content/collectionValidators.ts`、`src/lib/types.ts`、
  `store.ts` 的 `COLLECTION_KEYS`、`scripts/state.mjs` 的 `KEYS`
- 改了 `wrangler.jsonc`：`npm run cf-typegen`
- Worker 免費方案每個請求 10ms CPU：不要在請求裡做重的運算（例如密碼雜湊）

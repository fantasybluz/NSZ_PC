# NSZPC Frontend

前台與後台管理介面（React + TypeScript + Vite）。

## 功能範圍

- 首頁：推薦配單、近期出機、出貨流程、客戶回饋、聯絡資訊
- 分類總覽與分類細節頁
- 出機標籤總覽與單一出機詳情
- 技術文章列表與文章詳情（含 SEO）
- 後台登入與內容管理頁面

## 技術棧

- `React 19`
- `TypeScript`
- `Vite`
- `react-router-dom`

## 環境需求

- Node.js 22+（建議）
- npm

## 啟動方式

在 repo 根目錄（API 和前端要一起跑，見[根目錄的 README](../README.md)）：

```bash
npm run dev:api   # API + 本機 D1，http://localhost:8787
npm run dev:web   # 前端，http://localhost:5173（/api 代理到 8787，見 vite.config.ts）
```

## 環境變數

前端和 API 在同一個網址（Cloudflare Worker），`VITE_API_BASE_URL` 留空就好（預設用相對路徑）；
只有要連別的後端時才在 `frontend/.env` 設定。

## 可用指令

- `npm run dev`：開發模式
- `npm run build`：建置正式版
- `npm run lint`：ESLint 檢查
- `npm run preview`：本機預覽 build 結果

## 主要路由

- `/`：首頁
- `/categories`：分類總覽
- `/categories/item/:id`：分類細節
- `/builds/item/:id`：推薦配單細節
- `/orders/tags`：出機標籤總覽
- `/orders/item/:id`：出機詳情
- `/blog`：技術文章列表
- `/blog/:slug`：技術文章詳情
- `/admin/login`：舊的登入網址，會轉到 `/admin`（由 Cloudflare Access 登入）
- `/admin`：後台管理主頁
- `/admin/blog`：後台文章管理

## 與後端整合

前端主要讀取以下 API：

- `GET /api/public/builds`
- `GET /api/public/categories`
- `GET /api/public/orders`
- `GET /api/public/blog-posts`
- `GET /api/public/site-content`

管理後台流程：

1. 進入 `/admin`（要整頁載入，選單的「後台登入」是一般連結，不是 React Router 的連結）
2. Cloudflare Access 要求登入，只放行指定的 email
3. 之後瀏覽器帶著 Access 的 cookie，API 由 Cloudflare 加上 JWT，前端不存 token
4. 登出：`/cdn-cgi/access/logout`（`src/lib/adminAuth.ts` 的 `logoutAdmin`）

本機開發時不經過 Access，以 `.dev.vars` 的 `DEV_ADMIN_EMAIL` 登入。

## 常見問題

- 後台顯示「後台登入還沒設定好」：`wrangler.jsonc` 的 `ACCESS_AUD` 還沒填（見根目錄 README 的 Cloudflare Access）。
- 後台顯示「這個帳號沒有後台權限」：email 不在 `ADMIN_EMAILS`。
- 本機 API 無資料：確認有在跑 `npm run dev:api`。

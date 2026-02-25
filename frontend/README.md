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

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

預設網址：`http://localhost:5173`

## 環境變數

`frontend/.env`

```bash
VITE_API_BASE_URL=http://localhost:3000
```

未設定時預設使用 `http://localhost:3000`。

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
- `/admin/login`：後台登入
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

1. 先啟動 backend（預設 `http://localhost:3000`）
2. 進入 `/admin/login`
3. 使用 backend `.env` 的管理員帳密登入

登入後會儲存：

- `nszpc_admin_token`
- `nszpc_admin_user`

## 常見問題

- 登入失敗：確認 backend 是否已啟動、帳密是否正確。
- API 無資料：確認 backend DB 已初始化（`npm run db:init`）。
- CORS 問題：檢查 backend `CORS_ORIGIN` 是否為前端網址。

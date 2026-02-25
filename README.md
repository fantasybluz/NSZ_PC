# NSZPC Web Monorepo

NSZPC 星辰電腦網站專案，包含：

- 前台網站（分類總覽、近期出機、技術文章）
- 後台管理（推薦配單、分類、出機紀錄、文章、站點內容）
- 後端 API（Node.js + TypeScript + DDD 分層）
- 本地 SQLite 資料庫

## 技術棧

- Frontend: `React 19` + `TypeScript` + `Vite` + `React Router`
- Backend: `Node.js` + `TypeScript`（`--experimental-strip-types`）
- Data: `SQLite`（`backend/data/db.sqlite`）

## 專案結構

```text
nszpc_web/
├─ frontend/      # 前台與後台管理介面
├─ backend/       # API + DDD 架構 + SQLite
├─ package.json   # 根目錄（目前僅保留最小設定）
└─ README.md
```

## 環境需求

- Node.js 22+（建議）
- npm

## 本機快速啟動

1. 啟動後端

```bash
cd backend
npm install
cp .env.example .env
npm run db:init
npm run dev
```

2. 啟動前端

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## 開發網址

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/api-docs`
- OpenAPI JSON: `http://localhost:3000/openapi.json`

## 預設管理員

- 帳號：`ADMIN_USERNAME`（預設 `admin`）
- 密碼：`ADMIN_PASSWORD`（請在 `backend/.env` 自行設定）

## 環境變數

- 前端：`frontend/.env`
  - `VITE_API_BASE_URL=http://localhost:3000`
- 後端：`backend/.env`
  - `PORT`
  - `CORS_ORIGIN`
  - `AUTH_SECRET`
  - `TOKEN_TTL_HOURS`
  - `ADMIN_USERNAME`
  - `ADMIN_PASSWORD`
  - `DB_PATH`

## 部署建議

- 前端：部署靜態檔（Vercel / Cloudflare Pages / Netlify）
- 後端：獨立 Node 服務（Render / Fly / Railway）
- 正式環境請至少調整：
  - `AUTH_SECRET` 為高強度隨機字串
  - `ADMIN_PASSWORD` 非預設值
  - `CORS_ORIGIN` 指向正式前端網域

## 進一步文件

- 前端說明：[frontend/README.md](frontend/README.md)
- 後端說明：[backend/README.md](backend/README.md)

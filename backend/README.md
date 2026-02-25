# NSZPC Backend

NSZPC 後台 API（Node.js + TypeScript），採用 DDD 分層設計，提供：

- 管理員登入與密碼管理
- 後台 CRUD：推薦配單、主要分類、近期出貨、站點文案
- 公開 API：給前台載入首頁/分類/配單資料
- Swagger / OpenAPI 文件
- SQLite 本地資料庫（`backend/data/db.sqlite`）

## DDD 架構

`backend/src` 主要分層：

- `domain/`：領域介面與核心模型（例如 `AuthRepository`、`ContentRepository`）
- `application/`：Use Case / Application Service（登入、CRUD、公開查詢、儀表板）
- `infrastructure/`：資料持久化與安全實作（SQLite Repository、JWT、Password Service）
- `interfaces/`：介面層與組裝（HTTP service container、server 路由）
- `lib/`：通用基礎工具（HTTP helper、validation、store、openapi）

## 環境需求

- Node.js（需支援 `--experimental-strip-types`，建議 Node 22+）
- npm

## 快速啟動

```bash
cd backend
npm install
cp .env.example .env
npm run db:init
npm run dev
```

啟動後預設：

- API Base URL：`http://localhost:3000`
- Swagger UI：`http://localhost:3000/api-docs`
- OpenAPI JSON：`http://localhost:3000/openapi.json`

## 環境變數

`.env`（可參考 `.env.example`）：

- `PORT`：API 埠號，預設 `3000`
- `CORS_ORIGIN`：允許前端來源，預設 `http://localhost:5173`
- `AUTH_SECRET`：JWT 簽章密鑰（正式環境務必更換）
- `TOKEN_TTL_HOURS`：登入 token 有效時數，預設 `8`
- `ADMIN_USERNAME`：初始管理員帳號，預設 `admin`
- `ADMIN_PASSWORD`：初始管理員密碼
- `DB_PATH`：SQLite 資料庫路徑（相對於 `backend`），預設 `data/db.sqlite`

## 管理員帳號

首次啟動會自動初始化資料檔並建立管理員。

- 帳號：`ADMIN_USERNAME`
- 密碼：`ADMIN_PASSWORD`

重設管理員密碼：

```bash
npm run reset-admin -- <newPassword> [username]
```

例如：

```bash
npm run reset-admin -- change-this-password admin
```

## 可用指令

- `npm run dev`：開發模式（watch）
- `npm run start`：直接啟動 API
- `npm run db:init`：初始化本地 SQLite 資料庫（若存在舊 `db.json` 會先匯入）
- `npm run reset-admin -- <newPassword> [username]`：重設/建立管理員密碼

## API 概覽

### 公開路由

- `GET /api/health`
- `GET /api/public/builds`
- `GET /api/public/categories`
- `GET /api/public/orders?limit=5`（`1~20`）
- `GET /api/public/site-content`

### 認證路由

- `POST /api/auth/login`
- `GET /api/auth/me`（Bearer Token）
- `PUT /api/auth/password`（Bearer Token）

### 後台路由（Bearer Token）

- `GET /api/admin/dashboard`
- `GET /api/admin/site-content`
- `PUT /api/admin/site-content`

CRUD 資源：

- `builds`
- `categories`
- `orders`
- `inventories`
- `procurements`
- `personal-procurements`

對每個資源都支援：

- `GET /api/admin/<resource>`
- `POST /api/admin/<resource>`
- `GET /api/admin/<resource>/:id`
- `PUT /api/admin/<resource>/:id`
- `DELETE /api/admin/<resource>/:id`

完整 schema 與 request/response 請看 Swagger。

## 推薦配單資料欄位

`builds` 目前主要欄位：

- `name`
- `description`
- `price`
- `dealDate`（格式 `YYYY/MM/DD`）
- `image`
- `badge`
- `cpu`
- `ram`
- `storage`
- `gpu`
- `psu`
- `pcCase`
- `specs`（需求說明條列，可空陣列）

## 資料儲存

資料存在：

- `backend/data/db.sqlite`

首次初始化時若偵測到 `backend/data/db.json`，會自動匯入資料到 SQLite。

## 常見問題

- `401 Unauthorized`：請先登入取得 token，並帶 `Authorization: Bearer <token>`。
- 前端呼叫被 CORS 擋住：確認 `CORS_ORIGIN` 與前端網址一致。
- 登入失敗：檢查 `.env` 的 `ADMIN_USERNAME` / `ADMIN_PASSWORD`，或用 `reset-admin` 重設。

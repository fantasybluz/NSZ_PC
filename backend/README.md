# NSZPC Backend

NSZPC 後台 API（Node.js + TypeScript），採用 DDD 分層設計，使用 PostgreSQL 作為主要資料庫。

## 功能範圍

- 認證：管理員登入、查看登入者、修改密碼
- 公開 API：前台資料（配單、分類、出機、文章、站點內容）
- 後台 API：各資源 CRUD 與站點內容管理
- 文件：Swagger UI / OpenAPI JSON
- 資料儲存：PostgreSQL（`DATABASE_URL`）

## DDD 架構

`backend/src` 主要分層：

- `domain/`：領域介面與核心模型（例如 `AuthRepository`、`ContentRepository`）
- `application/`：Use Case / Application Service（登入、CRUD、公開查詢、儀表板）
- `infrastructure/`：資料持久化與安全實作（PostgreSQL Store、JWT、Password Service）
- `interfaces/`：介面層與組裝（HTTP service container、server 路由）
- `lib/`：通用基礎工具（HTTP helper、validation、store、openapi）

## 環境需求

- Node.js（需支援 `--experimental-strip-types`，建議 Node 22+）
- npm
- PostgreSQL 14+（建議）

## 用 Docker 啟動本機 PostgreSQL（建議）

在專案根目錄執行：

```bash
docker compose up -d
```

預設：

- PostgreSQL：`127.0.0.1:5432`
  - database: `nszpc`
  - username: `postgres`
  - password: `postgres`
- pgAdmin：`http://localhost:5050`
  - email: `admin@nszpc.dev`
  - password: `change-this-password`

關閉服務：

```bash
docker compose down
```

## 快速啟動

```bash
cd backend
npm install
cp .env.example .env
npm run db:init
npm run dev
```

啟動後預設網址：

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
- `DATABASE_URL`：PostgreSQL 連線字串
  - 預設：`postgresql://postgres:postgres@127.0.0.1:5432/nszpc`

## 管理員帳號

首次初始化會自動建立管理員：

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
- `npm run start`：正式啟動模式
- `npm run db:init`：初始化 PostgreSQL schema 與初始資料
- `npm run reset-admin -- <newPassword> [username]`：重設或建立管理員密碼

## API 概覽

### 公開路由

- `GET /api/health`
- `GET /api/public/builds`
- `GET /api/public/categories`
- `GET /api/public/orders?limit=5`（`1~20`）
- `GET /api/public/blog-posts`
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
- `blog-posts`
- `categories`
- `orders`
- `inventories`
- `procurements`
- `personal-procurements`

每個資源都支援：

- `GET /api/admin/<resource>`
- `POST /api/admin/<resource>`
- `GET /api/admin/<resource>/:id`
- `PUT /api/admin/<resource>/:id`
- `DELETE /api/admin/<resource>/:id`

完整 schema 與 request/response 請看 Swagger。

## 初始化與資料遷移

- `npm run db:init` 會建立必要 schema 並初始化資料。
- 若偵測到 `backend/data/db.json`，首次初始化會自動匯入其資料。

## 安全建議（上線前）

- 更換 `AUTH_SECRET`（高強度隨機字串）
- 更換 `ADMIN_PASSWORD`
- `CORS_ORIGIN` 設定為正式前端網域（避免 `*`）
- `DATABASE_URL` 使用最小權限帳號

## 常見問題

- `401 Unauthorized`：請先登入，並帶 `Authorization: Bearer <token>`。
- DB 連線失敗：確認 PostgreSQL 已啟動，且 `DATABASE_URL` 正確。
- CORS 錯誤：確認 `CORS_ORIGIN` 與前端實際網址一致。
- 登入失敗：檢查 `ADMIN_USERNAME` / `ADMIN_PASSWORD`，或使用 `reset-admin`。

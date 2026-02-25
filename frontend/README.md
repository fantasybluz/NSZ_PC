# NSZPC Frontend

NSZPC 前台與後台管理介面（React + TypeScript + Vite）。

主要功能：

- 前台展示：首頁、分類總覽、出貨流程
- 動態頁面：分類細節頁、推薦配單細節頁
- 後台登入與控制台：
  - 推薦配單管理（新增 / 彈窗編輯 / 刪除）
  - 主要分類管理（新增 / 刪除）
  - 近期出貨管理（新增 / 彈窗編輯 / 刪除）

## 環境需求

- Node.js 18+
- npm

## 快速啟動

```bash
cd frontend
npm install
npm run dev
```

預設網址：`http://localhost:5173`

## API 連線設定

前端會呼叫 backend API。

可透過環境變數設定 API Base URL：

```bash
# frontend/.env
VITE_API_BASE_URL=http://localhost:3000
```

若未設定，預設使用 `http://localhost:3000`。

## 可用指令

- `npm run dev`：啟動開發伺服器
- `npm run build`：建置 production
- `npm run lint`：執行 ESLint
- `npm run preview`：預覽建置結果

## 路由

- `/`：首頁
- `/categories`：分類總覽
- `/categories/item/:id`：分類細節
- `/builds/item/:id`：推薦配單細節
- `/brand`：出貨流程
- `/admin/login`：後台登入
- `/admin`：後台控制台

## 後台登入流程

1. 先啟動 backend（預設 `http://localhost:3000`）。
2. 進入 `/admin/login`。
3. 使用 backend `.env` 裡的管理員帳密登入。

登入後 token 會存到瀏覽器 `localStorage`：

- `nszpc_admin_token`
- `nszpc_admin_user`

## 資料來源說明

前端資料優先讀 backend 公開 API：

- `/api/public/builds`
- `/api/public/categories`
- `/api/public/orders`
- `/api/public/site-content`

若 API 異常，部分頁面會使用前端 fallback 資料以維持可顯示。

## 推薦配單顯示邏輯

- 首頁卡片顯示：名稱、描述、價格、成交日期
- 進入「查看細節」後才顯示核心配備：
  - CPU / RAM / 硬碟 / 顯示卡 / 電源供應器 / 機殼
  - 需求說明（條列）

## 與後端一起開發（建議）

開兩個 terminal：

```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm run dev
```

## 常見問題

- 後台登入失敗：確認 backend 有啟動，且 `VITE_API_BASE_URL` 指向正確 API。
- 畫面無資料：先看 backend `data/db.sqlite` 是否有資料，或檢查 API 回應。
- CORS 錯誤：到 backend 調整 `CORS_ORIGIN`。

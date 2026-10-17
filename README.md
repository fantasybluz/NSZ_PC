# NSZPC Web（星辰電腦官網）

星辰電腦 NSZPC 的官網和後台：

- 前台：首頁、分類總覽、推薦配單、出機紀錄、技術文章
- 後台（`/admin`，Cloudflare Access 登入）：出機紀錄、推薦配單、分類總覽、技術文章、網站文字
- 庫存、進貨、同行拿貨、訂單、報價單在內部管理系統 DPOM（https://dpom.bluz.dev），DPOM 的訂單可以一鍵發布成這裡的出機紀錄

目前網址（給客戶 demo 用）：<https://nszpc.bluz.dev>

整個網站是一個 Cloudflare Worker（免費方案）：React 前端（`frontend/`）當靜態檔，API 在 `backend/src/`，資料是 D1 裡的一份 JSON，出機照片在 R2。

| 部分 | 技術 | 位置 |
|---|---|---|
| 前端 | React 19 + TypeScript + Vite + React Router | `frontend/` |
| API | TypeScript，DDD 分層（application / domain / infrastructure / interfaces） | `backend/src/` |
| 資料 | Cloudflare D1（整份 JSON）、R2（出機照片） | `migrations/`、`backend/src/lib/store.ts` |
| 後台登入 | Cloudflare Access + Worker 驗 JWT | `backend/src/lib/access.ts` |
| 部署設定 | Wrangler | `wrangler.jsonc` |

## 快速開始

需要 Node.js 22.18+。

```bash
npm install && npm --prefix frontend install
cp .dev.vars.example .dev.vars   # 本機直接當 DEV_ADMIN_EMAIL 登入後台
npm run dev:api                  # API + 本機 D1：http://localhost:8787
npm run dev:web                  # 前端：http://localhost:5173
```

| 指令 | 做什麼 |
|---|---|
| `npm run check` | 文件檢查、後端型別檢查、前端 lint、前端 build |
| `npm run deploy` | `check` → 套用 D1 migration → 部署 Worker |
| `npm run state:export -- [--remote] > file.json` | 匯出網站資料 |
| `npm run state:import -- file.json [--remote]` | 用 JSON 蓋掉網站資料 |
| `npm run cf-typegen` | 改 `wrangler.jsonc` 後重新產生 Workers 型別 |

## 文件

從 [docs/README.md](docs/README.md) 開始：

- [docs/requirements.md](docs/requirements.md)：前台、後台有哪些功能和規則
- [docs/architecture.md](docs/architecture.md)：架構、資料、登入、分享縮圖和 SEO、安全
- [docs/api.md](docs/api.md)：每一支 API 和給 DPOM 的 RPC
- [docs/setup.md](docs/setup.md)：本機開發、部署、Cloudflare Access、換網域、Search Console
- [docs/decisions/](docs/decisions/)：重要決定（ADR）
- [DESIGN.md](DESIGN.md)：介面設計規格（Apple 風格）
- [CHANGELOG.md](CHANGELOG.md)、[RELEASING.md](RELEASING.md)：更新紀錄、怎麼發版
- [CLAUDE.md](CLAUDE.md)：改程式時要一起改哪些文件、慣例

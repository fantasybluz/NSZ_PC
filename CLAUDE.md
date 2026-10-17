# 星辰電腦官網（nszpc_web）

星辰電腦 NSZPC（高雄的客製化電腦店）的官網和後台。Cloudflare Worker 後端（`backend/src/`）+ React/Vite 前端（`frontend/src/`），部署成同一個 Worker，
網址 <https://nszpc.bluz.dev>（給客戶 demo，之後換客戶自己的網域）。工作分支是 `cloudflare`。
庫存、進貨、訂單、報價單在另一個系統 DPOM（`nszpc_dpom`），DPOM 用 Workers RPC 把訂單發布成這裡的出機紀錄。

先讀 [docs/README.md](docs/README.md)，需求在 [docs/requirements.md](docs/requirements.md)，架構在 [docs/architecture.md](docs/architecture.md)，API 在 [docs/api.md](docs/api.md)。

## 指令

- `npm run dev:api`：套用本機 D1 migration + `wrangler dev`（8787）；`.dev.vars` 要有 `DEV_ADMIN_EMAIL` 才能進後台（只在 localhost 有效）
- `npm run dev:web`：Vite（5173），`/api`、`/media`、`/openapi.json`、`/api-docs` 代理到 8787。兩個都要開
- `npm run check`：文件檢查（`scripts/check-docs.mjs`）→ 後端型別檢查 → 前端 lint → 前端 build。**commit 前要過**
- `npm run deploy`：`check` → 正式環境 D1 migration → `wrangler deploy`。**使用者說要部署才部署**
- `npm run state:export -- --remote > backup.json`、`npm run state:import -- backup.json [--remote]`：網站資料備份、還原
- `npm run cf-typegen`：改了 `wrangler.jsonc` 的綁定、vars 之後跑

## 改程式時，同一個 commit 要一起改的文件

| 改了什麼 | 要改 |
|---|---|
| 新增、刪除、改路由（`backend/src/worker.ts`） | `backend/src/routes.ts` 的 `ROUTES`、`docs/api.md` 對應的 `### \`METHOD /path\`` 段落（`check-docs.mjs` 會比對）、`backend/src/lib/openapi.ts` |
| `wrangler.jsonc` 的 `run_worker_first` | `docs/architecture.md`（會檢查每個路徑都有提到）；分享縮圖的頁面還要改 `sharePreview.ts` 的 `SHARE_PREVIEW_PATHS` |
| 資料表 | 新增 `migrations/000X_*.sql`（不要改已部署的），更新 `docs/architecture.md` 的資料表段落（會檢查） |
| 資料欄位（JSON 裡的） | `backend/src/lib/types.ts`、`validation.ts`、`store.ts` 的 `normalize*`（漏了讀出來會被丟掉）、前端表單和型別、`docs/architecture.md` 的集合表、`docs/api.md` 的必填欄位 |
| 新的集合 | 上面那些，加上 `store.ts` 的 `COLLECTION_KEYS`、`scripts/state.mjs` 的 `KEYS`、`ContentRepository.ts`、`collectionValidators.ts`、`worker.ts` 的 `resolveCollectionName` |
| 給 DPOM 的 RPC（`backend/src/rpc.ts`） | `docs/api.md` 的「內部 RPC」、`docs/architecture.md`；DPOM 那邊的呼叫也要一起看 |
| 功能、規則、前台或後台的畫面 | `docs/requirements.md` |
| 管理員或客人看得到的改動 | `CHANGELOG.md` 的「## 未發佈」（寫給管理員看，說能做什麼了） |
| vars、綁定、部署方式、Access、網域 | `docs/setup.md` |
| 重要的技術選擇 | `docs/decisions/` 新增一份 ADR（背景、決定、代價） |
| 發版 | `VERSION` + `CHANGELOG.md`，照 `RELEASING.md` |

## 慣例

- 註解、文件、commit 訊息用繁體中文（台灣用語），寫具體、白話；錯誤訊息要給管理員看得懂
- **介面照 [DESIGN.md](DESIGN.md)**（Apple 風格）：寫 UI 前先看。互動色只有 Action Blue（`#0066cc`），不要加新的顏色、漸層、裝飾陰影。
  前台的版面是 apple.com/tw/mac（滿版區塊白和淺灰交替、大標、`components/Shelf.tsx` 的橫向卡片列），樣式放 `styles/apple-site.css`；前後台共用的放 `styles/apple.css`（`App.css` 是舊的底層，新樣式不要加在那裡）
- **前台不能出現給管理者看的字**：不寫「可在後台編輯」「待補充」「未標示」「尚未設定」，不放後台連結。沒填的欄位、沒有的影片就整格／整段不顯示
- **前台不顯示服務費、客人資料、版號**。公開 API（`/api/public/*`）回傳前先拿掉不公開的欄位（例如 `serviceFee`）
- 新的頁面、卡片要在 **393px 和 1440px** 寬都看過
- 後台的頁面包在 `components/AdminShell.tsx` 裡；後台首頁的分頁用 `#hash`（`adminDashboard/shared.ts` 的 `ADMIN_TAB_KEYS`）
- 輸入檢查寫在 `backend/src/lib/validation.ts`，錯誤格式 `{ error: { message, details } }`（`lib/http.ts`）
- 前台已經不用的網站文字欄位不要刪資料：加到 `types.ts` 的 `RetiredSiteContentKey`，從後台表單拿掉，存檔時沿用舊值（ADR 0006）
- 資料是一份 JSON（`store.ts`）：寫入一律走 `mutateDb`，不要自己寫 SQL 改 `app_state`；不要在一個請求裡做很重的運算（Workers 免費方案每個請求 10ms CPU）
- 會改資料的 API 要經過 `isCrossSiteWrite`（CSRF），後台 API 要經過 `requireAdmin`
- 分享縮圖、文章 SEO 的標題寫法在 `backend/src/lib/sharePreview.ts` 和 `frontend/src/lib/seo.ts`（及各頁）兩邊，要一致
- 換網域要改的地方列在 `docs/setup.md`，不要在別處寫死 `nszpc.bluz.dev`
- 不要 commit `backend/data/`（舊資料，有進貨成本）、`.dev.vars`、匯出的備份 JSON；`docker/` 沒有進版控，不要動

# NSZPC Backend

跑在 Cloudflare Workers 上的 API（入口 `src/worker.ts`），資料存在 D1，出機照片在 R2，後台登入是 Cloudflare Access。
這個資料夾沒有自己的開發指令，從 repo 根目錄跑（`npm run dev:api`、`npm run typecheck`、`npm run deploy`）。

詳細的說明都在 `docs/`，這裡不重複寫：

- 分層、資料表、整份 JSON 的讀寫、登入、安全：[docs/architecture.md](../docs/architecture.md)
- 每一支 API、錯誤格式、給 DPOM 的 RPC：[docs/api.md](../docs/api.md)
- 本機開發、部署、vars、Access 設定：[docs/setup.md](../docs/setup.md)
- 改程式時要一起改哪些檔案和文件：[CLAUDE.md](../CLAUDE.md)

| 路徑 | 內容 |
|---|---|
| `src/worker.ts` | Worker 入口：路由、CSRF、後台登入檢查、錯誤處理 |
| `src/routes.ts` | 路由清單，`docs/api.md` 要跟它一致（`npm run check` 會比對） |
| `src/rpc.ts` | `WebsiteAPI`：給 DPOM 的 RPC |
| `src/application/content/` | 用例：後台 CRUD、公開查詢、網站文字 |
| `src/domain/content/` | `ContentRepository` 介面 |
| `src/infrastructure/persistence/` | 用 `lib/store.ts` 實作的 repository |
| `src/interfaces/http/` | 把服務組起來的 `serviceContainer.ts` |
| `src/lib/` | `store.ts`、`validation.ts`、`types.ts`、`access.ts`、`http.ts`、`openapi.ts`、`sharePreview.ts`、`sitemap.ts` |

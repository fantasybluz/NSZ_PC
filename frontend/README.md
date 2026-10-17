# NSZPC Frontend

前台和後台的介面（React 19 + TypeScript + Vite + React Router），建置成 `dist/`，由根目錄的 Worker 當靜態檔提供。

```bash
npm run dev       # Vite（5173）；要搭配根目錄的 npm run dev:api（8787），/api、/media 會代理過去
npm run build     # tsc -b && vite build
npm run lint      # ESLint
npm run preview   # 預覽 build 結果
```

平常從 repo 根目錄跑 `npm run dev:web`、`npm run check` 就好。

詳細的說明都在 `docs/`，這裡不重複寫：

- 頁面、後台分頁、版面（Apple 風格、`Shelf`、`AdminShell`）：[docs/architecture.md](../docs/architecture.md#前端)
- 每一頁要做什麼、前台的規則：[docs/requirements.md](../docs/requirements.md)
- 介面規格：[DESIGN.md](../DESIGN.md)
- 慣例（393px／1440px、前台不放給管理者看的字）：[CLAUDE.md](../CLAUDE.md)

| 路徑 | 內容 |
|---|---|
| `src/App.tsx` | 路由、全站 SEO 預設值、前台的頂欄和 footer |
| `src/pages/` | 各頁；`AdminDashboard.tsx`（後台四個分頁）、`AdminBlogManager.tsx`、`AdminChangelog.tsx` |
| `src/components/` | `Menu`、`Shelf`、`ProductCard`、`AdminShell` |
| `src/lib/` | 打 API（`public*.ts`、`adminAuth.ts`）、`seo.ts`、`version.ts`、`changelog.ts` |
| `src/data/` | API 讀不到時的備用內容 |
| `src/styles/` | `apple.css`（DESIGN.md 的基本樣式）、`apple-site.css`（前台版面） |
| `public/` | `_headers`（靜態檔的 CSP 等標頭）、圖示、`og-image.jpg`、圖片 |

前端和 API 同一個網址，打 API 用相對路徑；`VITE_API_BASE_URL` 只有要連別的後端時才在 `frontend/.env` 設定。

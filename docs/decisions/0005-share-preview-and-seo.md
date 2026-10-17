# 0005 分享縮圖和 SEO 由 Worker 改寫 HTML

- 狀態：採用
- 日期：2026-10-16

## 背景

前端是 SPA，每個網址回的都是同一份 `index.html`，`#root` 是空的，標題、說明都是 React 跑起來之後才設的。

- LINE、FB、Discord 的爬蟲不跑 JS：分享出機紀錄、文章的連結，縮圖和標題都是空的或全站一樣
- 搜尋引擎不一定跑 JS；`/robots.txt`、`/sitemap.xml` 原本也會回 `index.html`

選項：

1. 改成 SSR（例如 React Router 的 framework mode）
2. 建置時預先產生每一頁的 HTML
3. Worker 收到這幾頁的請求時，用 HTMLRewriter 改 `index.html`

## 決定

用 3（`backend/src/lib/sharePreview.ts`、`sitemap.ts`）：

- `frontend/index.html` 寫好全站預設的標題和分享圖（`og-image.jpg`，1200×630，完整網址）
- 出機紀錄、推薦配單、分類、文章頁放進 `run_worker_first`，Worker 從資料庫找那一筆，換掉 `<title>`、description、`og:*`、`twitter:*`、照片；找不到就照原樣
- 技術文章另外加 canonical、keywords、發布／更新時間、JSON-LD（`BlogPosting`、`BreadcrumbList`、`Blog`、`ItemList`），
  **文章內容直接寫進 `#root`**，不跑 JS 也讀得到；前端載入後 React 整個換掉
- `robots.txt`、`sitemap.xml` 由 Worker 從資料庫產生，新增文章、出機紀錄不用另外改
- 參考 claude-seo 的檢查項目，但**沒做 FAQ 結構化資料**（Google 已經不對一般網站顯示 FAQ rich result）、**沒做 `llms.txt`**（還不是搜尋引擎、AI 搜尋普遍採用的標準，robots.txt 已經允許它們讀前台）

理由：不用改前端架構（1 要重寫路由和資料載入），資料改了馬上生效（2 每次改都要重新建置）。

## 代價

- 標題寫法寫在兩個地方（Worker 的 `sharePreview.ts`、前端的 `lib/seo.ts` 和各頁），要手動保持一致
- 這幾頁每次都要讀一次資料庫
- `SHARE_PREVIEW_PATHS` 要跟 `wrangler.jsonc` 的 `run_worker_first` 一致，加新的頁面兩邊都要改
- 寫進 `#root` 的文章是簡化版 HTML，不是前端畫出來的樣子（只給爬蟲看）
- LINE 會快取縮圖，改了之後要用 LINE Page Poker 清快取

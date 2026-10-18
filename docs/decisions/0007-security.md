# 0007 資安：擋跨站請求、套件漏洞清零、公開出機紀錄上限 100

- 狀態：採用（「公開出機紀錄上限 100」那一條已被 [0009](0009-public-order-by-id-and-no-fake-data.md) 取代）
- 日期：2026-10-17

## 背景

搬到 Cloudflare 時已經有：Cloudflare Access + Worker 驗 JWT、API 和靜態檔的安全性標頭、body 上限 1MB、`workers.dev` 關掉。檢查後還缺：

- 會改資料的請求沒有檢查來源。後台的登入是 Access 的 cookie，別的網站可以讓已登入的管理員的瀏覽器送出請求（CSRF）
- `npm audit` 有 react-router（high）、echarts（moderate）和開發工具的漏洞
- 公開出機紀錄上限是 20 筆，出機詳細頁是從列表裡找，超過 20 筆後比較舊的出機頁打不開

## 決定

- **CSRF**：`worker.ts` 的 `isCrossSiteWrite`，GET、HEAD、OPTIONS 以外的請求，`Sec-Fetch-Site: cross-site` 或 `Origin` 不是自己網站就回 403。
  **本機例外**：`Origin` 和網址都是 localhost／127.0.0.1 時不算跨站（Vite 5173 代理到 wrangler 8787，Origin 的 port 不一樣）。
  沒有 `Origin` 的請求放行（不是瀏覽器送的，而且後台 API 還要 JWT）。DPOM 走 RPC，不受影響
- **套件**：`npm audit fix`，`npm audit` 0；順便拿掉沒用到的 bootstrap、react-bootstrap、echarts
- **公開出機紀錄上限 100**（`PublicContentQueryService.listOrders`）：出機標籤頁、詳細頁拿 100 筆
- `_headers` 拿掉 Google Fonts（沒用到）

## 代價

- 上限 100 只是把問題延後：超過 100 筆，第 101 筆以後的出機頁還是打不開（要改成用 id 查一筆的 API）
- 每次載入出機頁都下載 100 筆
- 沒有次數限制（rate limiting）：公開 API 可以一直打，靠 Cloudflare 本身的防護

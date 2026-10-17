# 0002 後台登入用 Cloudflare Access，Worker 再驗 JWT

- 狀態：採用
- 日期：2026-10-16

## 背景

原本後台用帳號密碼登入：密碼用 scrypt 雜湊存在 `app_state` 的 `users`，登入後發自己的 JWT。搬到 Workers（[0001](0001-cloudflare-workers.md)）後：

- Workers 免費方案每個請求只有 10ms CPU，scrypt 會超過
- 舊程式在讀資料時（`defaultDb` 當 fallback）每次都算一次預設管理員密碼的 scrypt，每個請求都超時
- 自己做帳號密碼還要處理忘記密碼、暴力嘗試、token 外洩

## 決定

用 Cloudflare Access（Zero Trust 的 Self-hosted application，免費方案 50 人內免費）：

- Access 保護 `nszpc.bluz.dev` 的 `admin`、`api/admin`、`api/auth` 三個路徑，Policy 只放行管理員的 email，登入方式是 email 驗證碼
- Worker 不相信「有經過 Access」，自己再驗 `Cf-Access-Jwt-Assertion`（`backend/src/lib/access.ts`）：RS256、公鑰從 `/cdn-cgi/access/certs` 抓、
  `iss`、`aud`（`ACCESS_AUD`）、期限、email 在 `ADMIN_EMAILS`
- 網站完全不存密碼，拿掉 `/api/auth/login`、`/api/auth/password` 和 `users`（匯入舊資料時 `users` 會略過）
- 本機開發用 `.dev.vars` 的 `DEV_ADMIN_EMAIL`，只在 localhost 有效

## 代價

- 綁 Cloudflare Zero Trust：換平台要重做登入
- 管理員名單要改兩個地方：Access 的 Policy 和 `wrangler.jsonc` 的 `ADMIN_EMAILS`
- Access 應用的路徑設定錯了（漏一個路徑），那個路徑的請求不會有 JWT，Worker 一律回 401（不會被放進來，但後台會壞）
- `workers.dev` 和預覽網址前面沒有 Access，所以要關掉（`workers_dev: false`、`preview_urls: false`）
- 本機沒辦法測真的 Access 流程，只能部署後測

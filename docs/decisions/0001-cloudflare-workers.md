# 0001 搬到 Cloudflare Workers + D1，整個網站存成一份 JSON

- 狀態：採用
- 日期：2026-10-16

## 背景

第一版是 Node（`backend/src/server.ts`）+ PostgreSQL，資料是 PostgreSQL 裡一列 `app_state`（整份 JSON），本機開發用 `backend/data/db.json`。
使用者要把整個網站搬到 Cloudflare，先用免費方案給客戶 demo（網址 `nszpc.bluz.dev`），客戶買了自己的網域再換過去。

選項：

1. 照原本的設計拆成很多張 D1 資料表（`docs/database-design.md` 以前寫過 PostgreSQL 的正規化 DDL）
2. 沿用「整份 JSON」：D1 存一份網站狀態，程式幾乎不用改

## 決定

用 Cloudflare Workers + D1 + 靜態檔（`assets`），前端和 API 部署成同一個 Worker、同一個網域。資料用 2：

- D1 的 `app_state` 表，每個集合一列（`categories`、`builds`、`orders`、`blogPosts`、`siteContent`、`meta`），
  不是一整列：D1 單列上限 2MB，分開存比較不會撞到
- 寫入時用版本號做樂觀鎖：同一個 batch（交易）裡 `INSERT INTO state_versions` 讀到的版本 + 1，兩個人同時存時後寫的撞主鍵、整個回滾
- 原本的 store、normalize、validation、DDD 分層都留著，只換掉存取層（`backend/src/lib/store.ts`）
- 資料量很小（幾十筆配單、出機紀錄、文章），整份讀寫在免費方案的限制內
- 匯出匯入用 `scripts/state.mjs`，格式跟舊的 `db.json` 一樣

## 代價

- **每個請求都整份讀**、寫入時整份讀出再寫回有變的集合；資料變多時會變慢
- 某個集合超過約 1.9MB（`MAX_ROW_BYTES`）就存不進去，到時候要把那個集合拆成獨立的表
- 同時寫入時後寫的那個要**重讀重做**（最多 5 次，都失敗回 500）；目前只有一兩個人在改，夠用。
  （討論時說的是「會回 409」，實際程式是自動重試，見 `store.ts` 的 `mutateDb`）
- 沒辦法用 SQL 查詢、索引；要找一筆也是整份讀出來找
- 綁 Cloudflare：Worker 執行環境不是 Node，免費方案每個請求 10ms CPU（所以密碼雜湊不能做，見 [0002](0002-cloudflare-access.md)）

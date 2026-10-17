# 0003 內部資料搬到 DPOM，官網只放公開內容；DPOM 用 Workers RPC 發布出機紀錄

- 狀態：採用
- 日期：2026-10-16

## 背景

官網後台原本還有庫存管理、公司進貨、同行拿貨（存在 `app_state` 的 `inventories`、`procurements`、`personalProcurements`，裡面有進貨成本），
出機紀錄也有服務費。星辰電腦另外有內部管理系統 DPOM（https://dpom.bluz.dev），庫存（批次、先進先出）、進貨單、訂單、報價單、檢測表都做得比較完整。
兩邊各記一份會對不上；進貨成本放在對外的網站也不安全。

## 決定

- 庫存、進貨、同行拿貨、訂單、報價只在 DPOM。官網拿掉這三個後台分頁、API 集合、檢查和範例資料，
  `migrations/0002_drop_internal_collections.sql` 刪掉存著的資料
- 官網只放公開內容：推薦配單、分類、出機紀錄、技術文章、網站文字。後台側欄放「內部管理系統」連到 DPOM
- DPOM 的訂單按「發布到官網」，用 **Workers RPC**（官網的 `WebsiteAPI`，DPOM 的 `wrangler.jsonc` 用 `services` 綁定）發布成出機紀錄，
  **不開公開的 HTTP API**：沒有網址可以打，不用 API key、不用處理 CSRF；DPOM 本身在 Cloudflare Access 後面
- 發布的內容：品名、需求說明、地區、售價、狀態、規格、標籤、照片（存進 R2 `nszpc-media`）。**售價不含服務費（`serviceFee` 一律存 0）、不帶客人資料**
- 公開的 `/api/public/orders` 也不回 `serviceFee`，出機頁不顯示服務費

## 代價

- 兩個 Worker 要在同一個 Cloudflare 帳號才能綁 service binding；換帳號或拆開部署要改成 HTTP API 加驗證
- 官網後台的出機紀錄還是可以手動改，DPOM 再發布一次會蓋掉（包括服務費會變回 0）
- 後台手動刪出機紀錄不會刪 R2 的照片（只有 RPC 的 `unpublishOrder` 會）
- 換網域時 DPOM 的 `WEBSITE_URL` 也要改

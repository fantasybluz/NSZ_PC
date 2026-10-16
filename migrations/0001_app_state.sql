-- 網站的所有資料（分類、配單、出機紀錄、文章、庫存、進貨、站點內容）是一份 JSON，
-- 跟原本 PostgreSQL 的 app_state 一樣，只是每個集合各存一列，避免單列超過 D1 的 2MB 上限。
CREATE TABLE app_state (
  key TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 寫入時的版本號：每次寫入在同一個 batch（交易）裡插入「讀到的版本 + 1」，
-- 兩個請求同時改時，後寫的那個會撞到主鍵、整個 batch 回滾，再重讀重做，不會蓋掉別人的修改。
CREATE TABLE state_versions (
  version INTEGER PRIMARY KEY
);

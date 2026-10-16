-- 官網後台拿掉「庫存管理、公司進貨、同行拿貨」：這些改由 DPOM（星辰電腦內部管理系統）管。
-- 刪掉存著的資料（裡面有進貨成本）。
DELETE FROM app_state WHERE key IN ('inventories', 'procurements', 'personalProcurements');

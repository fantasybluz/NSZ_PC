# 0006 拿掉後台的估價單、出機檢查單；網站文字的舊欄位從後台拿掉但資料保留

- 狀態：採用
- 日期：2026-10-17

## 背景

- 官網後台的出機紀錄有「產出估價單」「出機檢查單」，DPOM 有完整的報價單和檢測表（[0003](0003-dpom-owns-internal-data.md)），兩邊做一樣的事
- 前台改版（[0004](0004-apple-style.md)）後，「網站文字」有 13 個欄位前台已經不顯示了（首頁主標籤、各區塊副標、品牌作品集、服務項目、聯絡地址電話 LINE……），
  後台還要求必填，管理員不知道改了會出現在哪裡

## 決定

- 拿掉官網後台的估價單、出機檢查單產生器，用 DPOM 的
- 13 個舊欄位（`backend/src/lib/types.ts` 的 `RetiredSiteContentKey`）從後台表單拿掉，後端不再要求必填
- **資料保留**：資料庫裡的值不刪，`PUT /api/admin/site-content` 沒帶的舊欄位沿用原本的值（`SiteContentService` 存檔時合併），`GET` 照樣回傳
- 「出機紀錄區塊標題」改名「首頁近期出機標題」

理由：舊欄位哪天前台又要用，資料還在；也不用寫 migration 改 JSON。

## 代價

- `SiteContentRecord` 裡有前台、後台都用不到的欄位，`store.ts` 的 normalize 還是會幫它們補預設值
- 要把舊欄位重新用起來，要記得把它從 `RetiredSiteContentKey` 拿掉、加回必填檢查和後台表單
- 要改舊欄位的值只能直接改資料（`npm run state:export` → 改 → `state:import`）

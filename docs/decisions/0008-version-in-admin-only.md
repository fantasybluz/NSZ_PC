# 0008 版號和更新紀錄只放後台，VERSION 是唯一來源

- 狀態：採用
- 日期：2026-10-17

## 背景

改了很多版（搬 Cloudflare、Apple 風格、分享縮圖、SEO……），管理員不知道這次改了什麼。DPOM、cocktail-party 已經有一套做法：
`VERSION` 檔、`CHANGELOG.md`、側欄顯示版號、點進去看更新紀錄。

## 決定

- 照 DPOM、cocktail-party 同一套：repo 根目錄的 `VERSION` 是唯一的版號來源，Worker（`/api/health`，`wrangler.jsonc` 的 `rules` 把它當文字打包）和前端（`vite.config.ts`）都讀它
- `CHANGELOG.md` 寫給管理員看，「## 版本號」底下「- 項目」；平常寫在「## 未發佈」，發版時改成版號（`RELEASING.md`）
- **只放後台**：側欄最下面顯示版號，點進 `/admin/changelog`，有新版顯示 NEW（看過的版號存 localStorage）。前台不顯示版號（客人不需要知道）
- `npm run check` 檢查 `VERSION` 跟 `CHANGELOG.md` 最新一版一致（現在在 `scripts/check-docs.mjs`）
- 依 git 紀錄補上 1.0.0～2.5.0

## 代價

- 發版要記得改兩個地方（`VERSION`、`CHANGELOG.md`），漏了 `npm run check` 會擋
- 「已看過」存在瀏覽器，換電腦、清資料會當成第一次（第一次不顯示 NEW）

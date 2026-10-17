# 發行新版

版號是給管理後台的人看「這版改了什麼」用的：後台側欄最下面顯示版號，點進去是「更新紀錄」（前台不顯示）。

## 流程

1. 改好程式後：`npm run check`（含版號檢查、型別檢查、lint、建置）
2. 平常改的東西先寫在 `CHANGELOG.md` 的「## 未發佈」底下（已經部署、還沒發版的會顯示成「下一版」）
3. 要發版時：改 `VERSION`（例如 `2.6.0`），把「## 未發佈」那段的標題改成 `## 2.6.0`，上面再補一段空的「## 未發佈」
4. `npm run deploy`，commit、打標籤、推上去：

   ```bash
   git tag v2.6.0
   git push origin cloudflare v2.6.0
   ```

## 版號怎麼跳

- 新功能：第二碼（`2.6.0`）
- 只有修正、文字調整：第三碼（`2.5.1`）
- 大改版（例如換架構、換網址）：第一碼

## 版號從哪裡來

- `VERSION` 是唯一的來源：Worker 的 `/api/health`（`backend/src/worker.ts`）和前端（`frontend/vite.config.ts`）都讀它
- 前端建置時把版號、commit、建置日期寫進 `__APP_VERSION__`、`__BUILD_SHA__`、`__BUILD_DATE__`，`CHANGELOG.md` 用 `?raw` 直接讀進來
- 每個人看過的版號存在瀏覽器的 localStorage，版號變了後台側欄就顯示 NEW，打開更新紀錄後消失
- `scripts/check-version.mjs` 檢查 `VERSION` 跟 `CHANGELOG.md` 最新的一版一致（`npm run check` 會跑）

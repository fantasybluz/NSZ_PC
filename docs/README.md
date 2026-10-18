# 文件

這個資料夾放「程式碼看不出來」的東西：要做什麼、為什麼這樣做、怎麼設定。
程式碼本身的細節（某個函式怎麼寫）留在程式碼的註解，不要抄到這裡。

| 文件 | 內容 | 什麼時候要改 |
|---|---|---|
| [requirements.md](requirements.md) | 前台、後台現在有哪些功能、已經決定的規則、已知的限制 | 加功能、改規則、需求有變 |
| [architecture.md](architecture.md) | 系統怎麼組成：Worker、D1 資料表和 JSON 資料、R2、DPOM 的 RPC、登入、分享縮圖和 SEO、安全、前端結構 | 改資料表或資料欄位、改流程、加新的 Cloudflare 資源或外部服務 |
| [api.md](api.md) | Worker 處理的每一個網址，和給 DPOM 的 RPC | 新增、刪除、改 API 的路徑或行為 |
| [setup.md](setup.md) | 本機開發、資料匯出匯入、部署、Cloudflare 資源、Access、換網域、Search Console | 部署方式、vars、綁定有變 |
| [decisions/](decisions/) | 重要決定的來龍去脈（ADR） | 做了會影響之後很久的選擇 |
| [../DESIGN.md](../DESIGN.md) | 介面的設計規格（Apple 風格，用 getdesign 裝的） | 改整體風格時（改了要在 decisions/ 寫一份 ADR） |
| [../CHANGELOG.md](../CHANGELOG.md) | 每一版改了什麼（給管理員看，會顯示在後台的「更新紀錄」） | 每次改了管理員或客人看得到的東西 |
| [../RELEASING.md](../RELEASING.md) | 怎麼發版 | 發版流程有變 |
| [../CLAUDE.md](../CLAUDE.md) | 給 AI（和人）的工作守則：指令、改什麼要改哪份文件、慣例 | 慣例有變 |

`backend/README.md`、`frontend/README.md`、`backend/SKILL.md`、`frontend/SKILL.md` 只是指到這裡的入口，不要在那邊重寫一份。

## ADR

| 編號 | 決定 |
|---|---|
| [0001](decisions/0001-cloudflare-workers.md) | 搬到 Cloudflare Workers + D1，整個網站存成一份 JSON |
| [0002](decisions/0002-cloudflare-access.md) | 後台登入用 Cloudflare Access，Worker 再驗 JWT |
| [0003](decisions/0003-dpom-owns-internal-data.md) | 內部資料搬到 DPOM，官網只放公開內容；DPOM 用 Workers RPC 發布出機紀錄 |
| [0004](decisions/0004-apple-style.md) | 介面改成 Apple 風格：後台左側選單、前台 apple.com/tw/mac 的版面 |
| [0005](decisions/0005-share-preview-and-seo.md) | 分享縮圖和 SEO 由 Worker 改寫 HTML |
| [0006](decisions/0006-remove-admin-generators.md) | 拿掉後台的估價單、出機檢查單；網站文字的舊欄位從後台拿掉但資料保留 |
| [0007](decisions/0007-security.md) | 資安：擋跨站請求、套件漏洞清零、公開出機紀錄上限 100 |
| [0008](decisions/0008-version-in-admin-only.md) | 版號和更新紀錄只放後台，VERSION 是唯一來源 |
| [0009](decisions/0009-public-order-by-id-and-no-fake-data.md) | 出機紀錄用 id 查一筆、出機紀錄頁拿全部；前台讀不到資料時不顯示假的出機紀錄和推薦配單，沒照片顯示空白格 |

## 維護規則

1. **文件跟程式碼放在同一個 commit**。改了功能、API、資料欄位，同一個 commit 裡把對應的文件改好，不要「之後再補」。
2. **改了什麼，對照上表改哪份**（[CLAUDE.md](../CLAUDE.md) 有更細的對照表）。不確定就問自己：下一個接手的人（或 AI）只看文件，會不會被誤導？
3. **CHANGELOG 寫給管理員看**：說「能做什麼了」，不說「改了哪個檔案」。平常寫在「## 未發佈」底下，發版時改成版號（見下面「發版」）。
4. **決定寫成 ADR**：選了 A 不選 B、而且之後有人可能會問「為什麼不用 B」的，在 `decisions/` 加一份，編號往下接（`0009-xxx.md`），
   開頭寫狀態、日期，內文分「背景」「決定」「代價」。決定改了就新增一份取代舊的，舊的標「已被 000X 取代」，不要直接刪。
5. **寫具體的事實**：數字、限制、指令、檔名都寫出來（例如「公開出機紀錄一次最多 100 筆」「D1 一列最多 2MB」），不要寫「有一些限制」。
6. **寫現在的樣子**：拿掉的功能就從文件拿掉（為什麼拿掉寫在 ADR），不要留「以下為舊設計，僅供參考」。

## 自動檢查

`npm run check` 第一步跑 [`scripts/check-docs.mjs`](../scripts/check-docs.mjs)，文件跟程式碼對不上就失敗：

- [api.md](api.md) 的 `### \`METHOD /path\`` 標題要跟 [`backend/src/routes.ts`](../backend/src/routes.ts) 的 `ROUTES` 一模一樣（不能多、不能少、不能重複）
- `backend/src/worker.ts` 裡的路徑字串（`parts[n] === '...'`、公開 API 的 `case '...'`、`resolveCollectionName` 的集合）都要在 `ROUTES` 裡，
  後台的每個集合要有完整的五支 CRUD
- `wrangler.jsonc` 的 `run_worker_first` 每一個路徑，[architecture.md](architecture.md) 都要用 `` `路徑` `` 提到
- [architecture.md](architecture.md) 要用 `` `表名` `` 提到 `migrations/*.sql` 裡每一個 `CREATE TABLE`
- `VERSION` 是 `x.y.z`、[CHANGELOG.md](../CHANGELOG.md) 最上面是「## 未發佈」、下一個標題跟 `VERSION` 一樣
- 文件裡的相對連結（`docs/`、根目錄和 `backend/`、`frontend/` 的 `.md`）都要指到存在的檔案，`#錨點` 要對得到標題

沒有 CI，部署（`npm run deploy`）會先跑 `npm run check`，所以文件沒跟上就部署不了。

## 發版

見 [RELEASING.md](../RELEASING.md)。簡單說：

1. `npm run check` 要過
2. 改 `VERSION`（例如 `2.6.0`），把 CHANGELOG 的「## 未發佈」改成 `## 2.6.0`，上面再補一段空的「## 未發佈」
3. `npm run deploy`，commit、打標籤（`v2.6.0`）、推上去

版號怎麼跳：新功能跳第二碼（`2.6.0`）；只有修正、文字調整跳第三碼（`2.5.1`）；大改版（換架構、換網址）跳第一碼。

# NSZPC Database Design

本文件說明 NSZPC 專案目前的 PostgreSQL 資料儲存設計，並提供下一階段可落地的正規化資料表方案。

## 1. 設計目標

- 支援前台內容展示與後台 CRUD 維運。
- 保持資料一致性，避免標籤與內容欄位漂移。
- 兼顧開發速度與未來擴充性（報價、庫存、採購、SEO 文章）。

## 2. 目前實作（v1）

目前 backend 使用 PostgreSQL，但採用「單表 + JSONB Snapshot」模式。

實際資料表：

```sql
CREATE TABLE IF NOT EXISTS app_state (
  id SMALLINT PRIMARY KEY CHECK (id = 1),
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

資料以單筆 `id = 1` 儲存完整網站狀態（`DbSchema`），包含：

- `users`
- `builds`
- `categories`
- `orders`
- `blogPosts`
- `inventories`
- `procurements`
- `personalProcurements`
- `siteContent`

### 2.1 優點

- 開發快，單次讀寫邏輯簡單。
- 適合原型期或資料量小的內容網站。

### 2.2 風險

- 無法用 SQL 精準查詢、排序與索引各業務欄位。
- 單筆資料鎖競爭會隨資料量增加而放大。
- 不利於後續報表、統計、審計與資料治理。

## 3. 邏輯資料模型（Domain）

核心 Aggregate 與資料內容：

- `User`: 後台管理者帳號與權限。
- `Build`: 推薦配單與配備說明。
- `Category`: 分類總覽與分類詳情（重點、FAQ、推薦）。
- `Order`: 近期出機紀錄（需求、配備、標籤、狀態）。
- `BlogPost`: 技術文章（SEO、段落、標籤、影片）。
- `Inventory`: 庫存品項與成本/售價。
- `Procurement`: 同行拿貨紀錄（多品項）。
- `PersonalProcurement`: 公司進貨紀錄（多品項）。
- `SiteContent`: 首頁與共用文案、流程、聯絡資訊、標籤庫。

## 4. 主要欄位與約束（v1 業務規則）

以下規則來自後端 validator：

- 日期格式
  - 出機/配單/採購日期：`YYYY/MM/DD`
  - 文章日期：`YYYY-MM-DD`
- `Build`
  - 必填：`name`, `description`, `requirementIntro`, `price>0`, `dealDate`, `image`, `cpu`, `ram`, `storage`, `gpu`, `psu`, `pcCase`
- `Category`
  - 必填：`title`, `summary`, `primaryCategory`, `secondaryCategory`, `detailIntro`, `detailHeroImage`
  - `tags`, `points`, `detailRecommendations`, `detailFaqs` 至少一筆
- `Order`
  - 必填：`date`, `item`, `requirementIntro`, `tags(>=1)`, `location`, `cpu`, `ram`, `storage`, `gpu`, `psu`, `pcCase`
  - `status` 僅允許：`pending`, `shipping`, `delivered`, `cancelled`
  - `salePrice >= 0`
- `BlogPost`
  - `slug` 必須 kebab-case
  - 必填：`title`, `summary`, `coverImage`, `publishedAt`, `updatedAt`, `authorName`
  - `tags` 至少一筆，`sections` 至少一個有效段落
- `Inventory`
  - `category` 僅允許：`cpu`, `motherboard`, `gpu`, `ram`, `ssd`, `hdd`, `cooler`, `psu`, `case`
  - `quantity >= 0`, `retailPrice >= 0`, `costPrice >= 0`, `costPrice <= retailPrice`
  - 主機板需 `motherboardFormFactor`
- `Procurement` / `PersonalProcurement`
  - 必填採購主資訊
  - `items` 至少一筆且每筆需 `productName`, `quantity>0`, `unitPrice>=0`

## 5. 建議目標（v2：正規化 PostgreSQL）

建議將 `app_state` 遷移為多資料表設計，並保留 JSONB 作為彈性欄位而非主儲存。

### 5.1 建議資料表清單

- `users`
- `builds`
- `categories`
- `category_faqs`
- `category_recommendations`
- `category_tags`
- `orders`
- `order_tags`
- `blog_posts`
- `blog_post_tags`
- `blog_post_sections`
- `blog_post_section_bullets`
- `inventories`
- `procurements`
- `procurement_items`
- `personal_procurements`
- `personal_procurement_items`
- `site_contents`（單筆版本化）
- `site_content_lists`（可選，存流程/回饋/聯絡陣列）

### 5.2 關聯重點

- `categories 1:N category_faqs`
- `categories 1:N category_recommendations`
- `categories 1:N category_tags`
- `orders 1:N order_tags`
- `blog_posts 1:N blog_post_sections`
- `blog_post_sections 1:N blog_post_section_bullets`
- `blog_posts 1:N blog_post_tags`
- `procurements 1:N procurement_items`
- `personal_procurements 1:N personal_procurement_items`

## 6. 建議 DDL（精簡版）

以下為可直接作為 migration 起點的核心表：

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE builds (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  detail_intro TEXT NOT NULL,
  requirement_intro TEXT NOT NULL,
  youtube_embed_url TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL CHECK (price > 0),
  deal_date DATE NOT NULL,
  badge TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL,
  cpu TEXT NOT NULL,
  ram TEXT NOT NULL,
  storage TEXT NOT NULL,
  gpu TEXT NOT NULL,
  psu TEXT NOT NULL,
  pc_case TEXT NOT NULL,
  specs JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY,
  deal_date DATE NOT NULL,
  item TEXT NOT NULL,
  requirement_intro TEXT NOT NULL,
  youtube_embed_url TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL,
  sale_price INTEGER NOT NULL CHECK (sale_price >= 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'shipping', 'delivered', 'cancelled')),
  cpu TEXT NOT NULL,
  ram TEXT NOT NULL,
  storage TEXT NOT NULL,
  gpu TEXT NOT NULL,
  psu TEXT NOT NULL,
  pc_case TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_tags (
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (order_id, tag)
);
```

## 7. 索引策略（v2）

建議至少建立：

- `users(username)` unique
- `builds(deal_date DESC)`
- `orders(deal_date DESC)`
- `orders(status, deal_date DESC)`
- `order_tags(tag)`
- `blog_posts(slug)` unique
- `blog_posts(published_at DESC)`
- `inventories(category, brand)`
- `procurements(date DESC)`
- `personal_procurements(date DESC)`

## 8. 遷移策略（從 v1 到 v2）

1. 新增 v2 正規化資料表（不移除 `app_state`）。
2. 撰寫一次性 migration script，將 `app_state.data` 拆寫入 v2 tables。
3. 雙寫期間：API 寫入同時更新 v1 + v2。
4. 比對一致性後，讀取來源切到 v2。
5. 穩定後移除 v1 雙寫，保留 `app_state` 作為備份快照或移除。

## 9. 備份與維運

- PostgreSQL 採每日快照與定期 PITR（若使用託管服務可直接開啟）。
- 每次 migration 前先備份。
- 正式環境建立 migration 版本表（例如 `schema_migrations`）。
- 對高風險欄位（價格、庫存、採購）保留審計欄位與操作紀錄。

## 10. 命名規範

- Table: `snake_case` 複數（`blog_posts`）。
- PK: `id UUID`。
- FK: `<entity>_id`。
- 時間欄位統一：`created_at`, `updated_at`（`TIMESTAMPTZ`）。
- 列舉欄位優先 `CHECK` 或獨立 code table。


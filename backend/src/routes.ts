// 這個 Worker 處理的每一個網址（worker.ts 的 fetch、route()、handleCrudCollection）。
// 改了 worker.ts 的路由要一起改這張表，docs/api.md 的 `### \`METHOD /path\`` 標題也要跟這裡一模一樣：
// scripts/check-docs.mjs（npm run check）會比對兩邊，也會檢查 worker.ts 裡的路徑字串都在這張表裡。
// 這張表只給文件檢查用，worker.ts 沒有拿它來分派請求。

export type RouteAuth = 'public' | 'admin';

export interface RouteEntry {
  method: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  auth: RouteAuth;
}

/** 後台 CRUD 的集合：網址用 blog-posts，資料裡叫 blogPosts（worker.ts 的 resolveCollectionName） */
const COLLECTIONS = ['builds', 'categories', 'orders', 'blog-posts'] as const;

export const ROUTES: RouteEntry[] = [
  { method: 'GET', path: '/api/health', auth: 'public' },
  { method: 'HEAD', path: '/api/health', auth: 'public' },

  { method: 'GET', path: '/api/public/builds', auth: 'public' },
  { method: 'GET', path: '/api/public/categories', auth: 'public' },
  { method: 'GET', path: '/api/public/orders', auth: 'public' },
  { method: 'GET', path: '/api/public/orders/:id', auth: 'public' },
  { method: 'GET', path: '/api/public/blog-posts', auth: 'public' },
  { method: 'GET', path: '/api/public/site-content', auth: 'public' },

  { method: 'GET', path: '/api/auth/me', auth: 'admin' },

  { method: 'GET', path: '/api/admin/site-content', auth: 'admin' },
  { method: 'PUT', path: '/api/admin/site-content', auth: 'admin' },
  ...COLLECTIONS.flatMap((name): RouteEntry[] => [
    { method: 'GET', path: `/api/admin/${name}`, auth: 'admin' },
    { method: 'POST', path: `/api/admin/${name}`, auth: 'admin' },
    { method: 'GET', path: `/api/admin/${name}/:id`, auth: 'admin' },
    { method: 'PUT', path: `/api/admin/${name}/:id`, auth: 'admin' },
    { method: 'DELETE', path: `/api/admin/${name}/:id`, auth: 'admin' },
  ]),

  { method: 'GET', path: '/openapi.json', auth: 'public' },
  { method: 'GET', path: '/api-docs', auth: 'public' },
  { method: 'GET', path: '/api-docs/init.js', auth: 'public' },
  { method: 'GET', path: '/docs', auth: 'public' },

  { method: 'GET', path: '/media/orders/:ref/:file', auth: 'public' },
  { method: 'HEAD', path: '/media/orders/:ref/:file', auth: 'public' },

  { method: 'GET', path: '/robots.txt', auth: 'public' },
  { method: 'HEAD', path: '/robots.txt', auth: 'public' },
  { method: 'GET', path: '/sitemap.xml', auth: 'public' },
  { method: 'HEAD', path: '/sitemap.xml', auth: 'public' },

  // 前端頁面，回 index.html 前先換分享縮圖和 SEO 的標籤（lib/sharePreview.ts）
  { method: 'GET', path: '/orders/item/:id', auth: 'public' },
  { method: 'GET', path: '/builds/item/:id', auth: 'public' },
  { method: 'GET', path: '/categories/item/:id', auth: 'public' },
  { method: 'GET', path: '/blog', auth: 'public' },
  { method: 'GET', path: '/blog/:slug', auth: 'public' },
];

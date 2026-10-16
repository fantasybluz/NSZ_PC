// robots.txt 和 sitemap.xml：前端是 SPA，這兩個網址原本會回 index.html，搜尋引擎讀不到。
// sitemap 直接從資料庫產生，新增文章、出機紀錄不用另外改。

import type { CollectionName } from './types.ts';

interface SitemapSource {
  list(collection: CollectionName): Promise<unknown[]>;
}

const escapeXml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char] ?? char);

/** sitemap 的 lastmod 只要日期 */
const day = (value: unknown): string => {
  const match = typeof value === 'string' ? /^\d{4}-\d{2}-\d{2}/.exec(value) : null;
  return match ? match[0] : '';
};

const XML_HEADERS = { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' };

export const robotsTxt = (origin: string): Response =>
  new Response(
    [
      // 一般搜尋引擎和 AI 搜尋（Google、Bing、ChatGPT、Perplexity…）都可以讀前台；後台、API 不用收錄
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin',
      'Disallow: /api/',
      'Disallow: /api-docs',
      '',
      `Sitemap: ${origin}/sitemap.xml`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } },
  );

export const sitemapXml = async (origin: string, source: SitemapSource): Promise<Response> => {
  const [blogPosts, categories, builds, orders] = (await Promise.all([
    source.list('blogPosts'),
    source.list('categories'),
    source.list('builds'),
    source.list('orders'),
  ])) as Record<string, unknown>[][];

  const latest = (items: Record<string, unknown>[], key = 'updatedAt'): string =>
    items.map((item) => day(item[key])).filter(Boolean).sort().pop() ?? '';

  const urls: Array<{ path: string; lastmod: string }> = [
    { path: '/', lastmod: latest([...builds, ...orders, ...categories]) },
    { path: '/blog', lastmod: latest(blogPosts) },
    { path: '/categories', lastmod: latest(categories) },
    { path: '/orders/tags', lastmod: latest(orders) },
    ...blogPosts.map((post) => ({
      path: `/blog/${encodeURIComponent(String(post.slug ?? ''))}`,
      lastmod: day(post.updatedAt) || day(post.publishedAt),
    })),
    ...categories.map((item) => ({ path: `/categories/item/${encodeURIComponent(String(item.id))}`, lastmod: day(item.updatedAt) })),
    ...builds.map((item) => ({ path: `/builds/item/${encodeURIComponent(String(item.id))}`, lastmod: day(item.updatedAt) })),
    ...orders.map((item) => ({ path: `/orders/item/${encodeURIComponent(String(item.id))}`, lastmod: day(item.updatedAt) })),
  ];

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(
      ({ path, lastmod }) =>
        `  <url><loc>${escapeXml(origin + path)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`,
    ),
    '</urlset>',
    '',
  ].join('\n');

  return new Response(body, { headers: XML_HEADERS });
};

// 分享縮圖和 SEO：LINE、FB、Discord 的爬蟲不會跑 JS，搜尋引擎也不一定會跑，只看 HTML。
// 前端是 SPA，每一頁拿到的都是同一份 index.html（全站預設的標題和 og-image.jpg），
// 所以出機紀錄、推薦配單、分類、文章的網址先經過 Worker（wrangler.jsonc 的 run_worker_first），
// 用 HTMLRewriter 換成那一頁的標題、說明和照片。找不到資料就照原樣回傳。
// 技術文章（/blog、/blog/:slug）另外加上 canonical、關鍵字、發布日期、結構化資料（JSON-LD），
// 並把文章內容直接寫進 #root，不跑 JS 也讀得到；前端載入後 React 會整個換掉。
// 前端的 lib/seo.ts 會更新同一批標籤（canonical、data-seo-id="page-seo" 的 JSON-LD），不會重複。

import type { CollectionName } from './types.ts';

interface SharePreview {
  title: string;
  description: string;
  image: string;
  type: 'website' | 'article';
  // 以下只有技術文章有
  keywords?: string[];
  publishedTime?: string;
  modifiedTime?: string;
  jsonLd?: Record<string, unknown>[];
  /** 寫進 #root 的文章內容（已經跳脫過的 HTML） */
  bodyHtml?: string;
}

interface PreviewSource {
  get(collection: CollectionName, id: string): Promise<{ kind: string; data?: unknown }>;
  list(collection: CollectionName): Promise<unknown[]>;
}

/** 走 Worker 的頁面（要跟 wrangler.jsonc 的 run_worker_first 一致） */
export const SHARE_PREVIEW_PATHS = /^\/(orders\/item|builds\/item|categories\/item)\/[^/]+\/?$|^\/blog(\/[^/]+)?\/?$/;

const SITE_NAME = '星辰電腦 NSZPC';
const MAX_DESCRIPTION = 110;

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const texts = (value: unknown): string[] => (Array.isArray(value) ? value.map(text).filter(Boolean) : []);

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char);

/** 文章日期只有 YYYY-MM-DD，補成台灣時間（跟前端 BlogDetail 一樣） */
const isoDate = (value: unknown): string => {
  const date = text(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T08:00:00+08:00` : date;
};

const BLOG_LIST_TITLE = 'NSZPC 技術文章｜配單、散熱與升級指南';
const BLOG_LIST_DESCRIPTION = '收錄遊戲主機、創作工作站、直播配單與散熱調校的實務文章。';
const PUBLISHER = (origin: string) => ({
  '@type': 'Organization',
  name: 'NSZPC 星辰電腦',
  url: origin,
  logo: { '@type': 'ImageObject', url: `${origin}/images/NSZ_LOGO.png` },
});

const clip = (value: string): string => {
  const flat = value.replace(/\s+/g, ' ').trim();
  return flat.length > MAX_DESCRIPTION ? `${flat.slice(0, MAX_DESCRIPTION - 1)}…` : flat;
};

const price = (value: unknown): string =>
  typeof value === 'number' && value > 0 ? `NT$ ${value.toLocaleString('en-US')}` : '';

const joinParts = (...parts: string[]): string => parts.filter(Boolean).join('・');

const findPreview = async (pathname: string, origin: string, source: PreviewSource): Promise<SharePreview | null> => {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 1 && parts[0] === 'blog') {
    return blogListPreview(origin, source);
  }
  const id = decodeURIComponent(parts[parts.length - 1] ?? '');
  if (!id) {
    return null;
  }

  const getOne = async (collection: CollectionName): Promise<Record<string, unknown> | null> => {
    const result = await source.get(collection, id);
    return result.kind === 'ok' && result.data ? (result.data as Record<string, unknown>) : null;
  };

  if (parts[0] === 'orders') {
    const order = await getOne('orders');
    if (!order) return null;
    const images = Array.isArray(order.images) ? order.images.map(text).filter(Boolean) : [];
    const specs = joinParts(text(order.cpu), text(order.gpu), text(order.ram));
    return {
      title: `${text(order.item) || '客製化主機'}｜${SITE_NAME} 出機紀錄`,
      // 售價是官網上本來就公開的（不含服務費）
      description: clip(joinParts(text(order.location), specs, price(order.salePrice)) || text(order.requirementIntro)),
      image: images[0] ?? '',
      type: 'article',
    };
  }

  if (parts[0] === 'builds') {
    const build = await getOne('builds');
    if (!build) return null;
    return {
      title: `${text(build.name)}｜${SITE_NAME} 推薦配單`,
      description: clip(joinParts(text(build.description), price(build.price))),
      image: text(build.image),
      type: 'article',
    };
  }

  if (parts[0] === 'categories') {
    const category = await getOne('categories');
    if (!category) return null;
    return {
      title: `${text(category.title)}｜${SITE_NAME}`,
      description: clip(text(category.summary)),
      image: text(category.detailHeroImage),
      type: 'website',
    };
  }

  if (parts[0] === 'blog') {
    const posts = (await source.list('blogPosts')) as Record<string, unknown>[];
    const post = posts.find((item) => item.slug === id);
    return post ? blogPostPreview(post, origin) : null;
  }

  return null;
};

const blogPostPreview = (post: Record<string, unknown>, origin: string): SharePreview => {
  const title = text(post.title);
  const summary = text(post.summary);
  const tags = texts(post.tags);
  const url = `${origin}/blog/${encodeURIComponent(text(post.slug))}`;
  const image = text(post.coverImage) ? absolute(text(post.coverImage), origin) : '';
  const published = isoDate(post.publishedAt);
  const modified = isoDate(post.updatedAt) || published;
  const sections = (Array.isArray(post.sections) ? post.sections : []) as Record<string, unknown>[];
  const author = text(post.authorName) || 'NSZPC 技術團隊';

  const bodyHtml = [
    '<main class="page-wrap"><article class="page blog-detail-page">',
    `<nav aria-label="麵包屑"><a href="/">首頁</a> › <a href="/blog">技術文章</a></nav>`,
    `<h1>${escapeHtml(title)}</h1>`,
    `<p>${escapeHtml(summary)}</p>`,
    `<p><small>${escapeHtml(author)}・<time datetime="${escapeHtml(published)}">${escapeHtml(text(post.publishedAt))}</time></small></p>`,
    ...sections.map((section) => {
      const bullets = texts(section.bullets);
      return [
        '<section>',
        `<h2>${escapeHtml(text(section.heading))}</h2>`,
        ...texts(section.paragraphs).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`),
        bullets.length ? `<ul>${bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '',
        '</section>',
      ].join('');
    }),
    tags.length ? `<p>${tags.map((tag) => `#${escapeHtml(tag)}`).join(' ')}</p>` : '',
    '</article></main>',
  ].join('');

  return {
    // 跟前端 BlogDetail 的標題一樣，搜尋引擎跑不跑 JS 看到的都相同
    title: `${title}｜NSZPC 技術文章`,
    description: clip(summary),
    image,
    type: 'article',
    keywords: [...tags, 'NSZPC 技術文章', '客製化主機'],
    publishedTime: published,
    modifiedTime: modified,
    bodyHtml,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        description: summary,
        ...(image ? { image: [image] } : {}),
        datePublished: published,
        dateModified: modified,
        author: { '@type': 'Person', name: author },
        publisher: PUBLISHER(origin),
        mainEntityOfPage: url,
        articleSection: '技術文章',
        keywords: tags.join(', '),
        inLanguage: 'zh-Hant',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首頁', item: origin },
          { '@type': 'ListItem', position: 2, name: '技術文章', item: `${origin}/blog` },
          { '@type': 'ListItem', position: 3, name: title, item: url },
        ],
      },
    ],
  };
};

const blogListPreview = async (origin: string, source: PreviewSource): Promise<SharePreview> => {
  const posts = (await source.list('blogPosts')) as Record<string, unknown>[];
  const items = posts.map((post) => ({
    url: `${origin}/blog/${encodeURIComponent(text(post.slug))}`,
    path: `/blog/${encodeURIComponent(text(post.slug))}`,
    title: text(post.title),
    summary: text(post.summary),
  }));
  return {
    title: BLOG_LIST_TITLE,
    description: BLOG_LIST_DESCRIPTION,
    image: `${origin}/images/carousel/IMG_6486.JPG`,
    type: 'website',
    keywords: ['技術文章', '組電腦教學', '客製化主機', '散熱調校', '升級建議'],
    bodyHtml: [
      '<main class="page-wrap"><section class="page">',
      '<h1>技術文章</h1>',
      `<p>${escapeHtml(BLOG_LIST_DESCRIPTION)}</p>`,
      '<ul>',
      ...items.map((item) => `<li><a href="${escapeHtml(item.path)}">${escapeHtml(item.title)}</a><p>${escapeHtml(item.summary)}</p></li>`),
      '</ul></section></main>',
    ].join(''),
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'NSZPC 技術文章',
        description: BLOG_LIST_DESCRIPTION,
        url: `${origin}/blog`,
        inLanguage: 'zh-Hant',
        publisher: PUBLISHER(origin),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, url: item.url, name: item.title })),
      },
    ],
  };
};

const absolute = (value: string, origin: string): string => {
  try {
    const url = new URL(value, origin);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch {
    return '';
  }
};

/** 把 index.html 的標題、og、twitter 標籤換成這一頁的 */
export const withSharePreview = async (page: Response, url: URL, source: PreviewSource): Promise<Response> => {
  const isHtml = (page.headers.get('Content-Type') ?? '').includes('text/html');
  if (!page.ok || !isHtml) {
    return page;
  }

  let preview: SharePreview | null = null;
  try {
    preview = await findPreview(url.pathname, url.origin, source);
  } catch (error) {
    console.error('share preview', error);
  }
  if (!preview) {
    return page;
  }

  const { title, description, type } = preview;
  const image = preview.image ? absolute(preview.image, url.origin) : '';
  const pageUrl = `${url.origin}${url.pathname}`;
  const setContent = (value: string) => ({
    element(element: Element) {
      element.setAttribute('content', value);
    },
  });

  let rewriter = new HTMLRewriter()
    .on('title', { element: (element) => void element.setInnerContent(title) })
    .on('meta[name="description"]', setContent(description))
    .on('meta[property="og:type"]', setContent(type))
    .on('meta[property="og:title"]', setContent(title))
    .on('meta[property="og:description"]', setContent(description))
    .on('meta[property="og:url"]', setContent(pageUrl))
    .on('meta[name="twitter:title"]', setContent(title))
    .on('meta[name="twitter:description"]', setContent(description));

  // 這一頁有照片就換掉預設圖（尺寸不知道，寬高標籤拿掉讓爬蟲自己讀）
  if (image) {
    rewriter = rewriter
      .on('meta[property="og:image"]', setContent(image))
      .on('meta[name="twitter:image"]', setContent(image))
      .on('meta[property="og:image:alt"]', setContent(title))
      .on('meta[property="og:image:type"], meta[property="og:image:width"], meta[property="og:image:height"]', {
        element: (element) => void element.remove(),
      });
  }

  // 技術文章：canonical、關鍵字、發布日期、JSON-LD 加在 <head> 最後，內容寫進 #root
  const head: string[] = [`<link rel="canonical" href="${escapeHtml(pageUrl)}" />`];
  if (preview.keywords?.length) {
    head.push(`<meta name="keywords" content="${escapeHtml(preview.keywords.join(', '))}" />`);
  }
  if (preview.publishedTime) {
    head.push(`<meta property="article:published_time" content="${escapeHtml(preview.publishedTime)}" />`);
  }
  if (preview.modifiedTime) {
    head.push(`<meta property="article:modified_time" content="${escapeHtml(preview.modifiedTime)}" />`);
  }
  if (preview.jsonLd?.length) {
    // < 換成 \u003c，內容裡有 </script> 也不會跳出去
    const data = JSON.stringify(preview.jsonLd).replace(/</g, '\\u003c');
    head.push(`<script type="application/ld+json" data-seo-id="page-seo">${data}</script>`);
  }
  rewriter = rewriter.on('head', { element: (element) => void element.append(head.join('\n'), { html: true }) });

  const { bodyHtml } = preview;
  if (bodyHtml) {
    rewriter = rewriter.on('#root', { element: (element) => void element.setInnerContent(bodyHtml, { html: true }) });
  }

  return rewriter.transform(page);
};

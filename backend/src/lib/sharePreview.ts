// 分享縮圖：LINE、FB、Discord 的爬蟲不會跑 JS，只看 HTML 裡的 og 標籤。
// 前端是 SPA，每一頁拿到的都是同一份 index.html（全站預設的標題和 og-image.jpg），
// 所以出機紀錄、推薦配單、分類、文章的網址先經過 Worker（wrangler.jsonc 的 run_worker_first），
// 用 HTMLRewriter 換成那一頁的標題、說明和照片。找不到資料就照原樣回傳。

import type { CollectionName } from './types.ts';

interface SharePreview {
  title: string;
  description: string;
  image: string;
  type: 'website' | 'article';
}

interface PreviewSource {
  get(collection: CollectionName, id: string): Promise<{ kind: string; data?: unknown }>;
  list(collection: CollectionName): Promise<unknown[]>;
}

/** 走 Worker 的頁面（要跟 wrangler.jsonc 的 run_worker_first 一致） */
export const SHARE_PREVIEW_PATHS = /^\/(orders\/item|builds\/item|categories\/item)\/[^/]+\/?$|^\/blog\/[^/]+\/?$/;

const SITE_NAME = '星辰電腦 NSZPC';
const MAX_DESCRIPTION = 110;

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const clip = (value: string): string => {
  const flat = value.replace(/\s+/g, ' ').trim();
  return flat.length > MAX_DESCRIPTION ? `${flat.slice(0, MAX_DESCRIPTION - 1)}…` : flat;
};

const price = (value: unknown): string =>
  typeof value === 'number' && value > 0 ? `NT$ ${value.toLocaleString('en-US')}` : '';

const joinParts = (...parts: string[]): string => parts.filter(Boolean).join('・');

const findPreview = async (pathname: string, source: PreviewSource): Promise<SharePreview | null> => {
  const parts = pathname.split('/').filter(Boolean);
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
    if (!post) return null;
    return {
      title: `${text(post.title)}｜${SITE_NAME} 技術文章`,
      description: clip(text(post.summary)),
      image: text(post.coverImage),
      type: 'article',
    };
  }

  return null;
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
    preview = await findPreview(url.pathname, source);
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

  return rewriter.transform(page);
};

export interface SeoPayload {
  title: string;
  description: string;
  keywords?: string[];
  canonicalPath?: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
  jsonLdId?: string;
}

const ensureMeta = (attribute: 'name' | 'property', key: string): HTMLMetaElement => {
  const selector = `meta[${attribute}="${key}"]`;
  const existed = document.head.querySelector(selector);

  if (existed instanceof HTMLMetaElement) {
    return existed;
  }

  const element = document.createElement('meta');
  element.setAttribute(attribute, key);
  document.head.appendChild(element);
  return element;
};

const setMetaByName = (name: string, content: string): void => {
  const element = ensureMeta('name', name);
  element.setAttribute('content', content);
};

const setMetaByProperty = (property: string, content: string): void => {
  const element = ensureMeta('property', property);
  element.setAttribute('content', content);
};

const ensureCanonicalLink = (): HTMLLinkElement => {
  const existed = document.head.querySelector('link[rel="canonical"]');

  if (existed instanceof HTMLLinkElement) {
    return existed;
  }

  const element = document.createElement('link');
  element.setAttribute('rel', 'canonical');
  document.head.appendChild(element);
  return element;
};

const upsertJsonLd = (id: string, value: SeoPayload['jsonLd']): void => {
  const selector = `script[type="application/ld+json"][data-seo-id="${id}"]`;
  const existed = document.head.querySelector(selector);

  if (!value) {
    existed?.remove();
    return;
  }

  const script =
    existed instanceof HTMLScriptElement ? existed : document.createElement('script');

  script.type = 'application/ld+json';
  script.dataset.seoId = id;
  script.textContent = JSON.stringify(value);

  if (!(existed instanceof HTMLScriptElement)) {
    document.head.appendChild(script);
  }
};

const toAbsoluteUrl = (input: string): string => {
  if (!input) {
    return '';
  }

  if (input.startsWith('http://') || input.startsWith('https://')) {
    return input;
  }

  return `${window.location.origin}${input.startsWith('/') ? '' : '/'}${input}`;
};

export const applySeo = (payload: SeoPayload): void => {
  const title = payload.title.trim();
  const description = payload.description.trim();

  document.title = title;

  setMetaByName('description', description);
  setMetaByName(
    'robots',
    payload.noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large',
  );

  if (payload.keywords && payload.keywords.length > 0) {
    setMetaByName('keywords', payload.keywords.join(', '));
  }

  const canonicalHref = payload.canonicalPath
    ? toAbsoluteUrl(payload.canonicalPath)
    : window.location.href;

  const canonicalLink = ensureCanonicalLink();
  canonicalLink.setAttribute('href', canonicalHref);

  const ogImage = payload.ogImage ? toAbsoluteUrl(payload.ogImage) : '';

  setMetaByProperty('og:site_name', 'NSZPC 星辰電腦');
  setMetaByProperty('og:locale', 'zh_TW');
  setMetaByProperty('og:type', payload.ogType || 'website');
  setMetaByProperty('og:title', title);
  setMetaByProperty('og:description', description);
  setMetaByProperty('og:url', canonicalHref);

  if (ogImage) {
    setMetaByProperty('og:image', ogImage);
  }

  setMetaByName('twitter:card', ogImage ? 'summary_large_image' : 'summary');
  setMetaByName('twitter:title', title);
  setMetaByName('twitter:description', description);

  if (ogImage) {
    setMetaByName('twitter:image', ogImage);
  }

  upsertJsonLd(payload.jsonLdId || 'page-seo', payload.jsonLd);
};

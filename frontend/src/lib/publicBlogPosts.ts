import {
  blogPosts as staticBlogPosts,
  type BlogArticleSection,
  type BlogPost,
} from '../data/blogPosts';
import { getApiBaseUrl } from './adminAuth';
import { dedupeCaseInsensitive } from './textUtils';

export interface PublicBlogArticleSection {
  heading: string;
  paragraphs: string[];
  bullets: string[];
}

export interface PublicBlogPost {
  id: string;
  slug: string;
  title: string;
  summary: string;
  coverImage: string;
  publishedAt: string;
  updatedAt: string;
  authorName: string;
  readingMinutes: number;
  tags: string[];
  youtubeEmbedUrl?: string;
  sections: PublicBlogArticleSection[];
}

interface PublicBlogPostsResponse {
  data?: unknown;
}

const BLOG_DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const BLOG_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const asString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const normalizeStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return dedupeCaseInsensitive(
    value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean),
  );
};

const toKebabSlug = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const normalizeYouTubeEmbedUrl = (value: string): string => {
  const raw = value.trim();
  if (!raw) {
    return '';
  }

  try {
    const parsed = new URL(raw);
    const hostname = parsed.hostname.toLowerCase();

    if (hostname === 'youtu.be') {
      const id = parsed.pathname.replaceAll('/', '').trim();
      if (id) {
        return `https://www.youtube.com/embed/${id}`;
      }
    }

    if (hostname === 'www.youtube.com' || hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        const id = parsed.searchParams.get('v')?.trim() || '';
        if (id) {
          return `https://www.youtube.com/embed/${id}`;
        }
      }

      if (parsed.pathname.startsWith('/embed/')) {
        const id = parsed.pathname.replace('/embed/', '').split('/')[0]?.trim() || '';
        if (id) {
          return `https://www.youtube.com/embed/${id}`;
        }
      }

      if (parsed.pathname.startsWith('/shorts/')) {
        const id = parsed.pathname.replace('/shorts/', '').split('/')[0]?.trim() || '';
        if (id) {
          return `https://www.youtube.com/embed/${id}`;
        }
      }
    }
  } catch {
    return '';
  }

  return '';
};

const normalizeSection = (value: unknown): PublicBlogArticleSection | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const heading = asString(raw.heading);
  const paragraphs = normalizeStringList(raw.paragraphs);
  const bullets = normalizeStringList(raw.bullets);

  if (!heading || paragraphs.length === 0) {
    return null;
  }

  return {
    heading,
    paragraphs,
    bullets,
  };
};

const sanitizeBlogPost = (value: unknown, index: number): PublicBlogPost | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const title = asString(raw.title);
  const summary = asString(raw.summary);
  const coverImage = asString(raw.coverImage);
  const rawSlug = asString(raw.slug).toLowerCase();
  const slug = BLOG_SLUG_PATTERN.test(rawSlug) ? rawSlug : toKebabSlug(rawSlug || title) || `blog-post-${index + 1}`;
  const publishedAtRaw = asString(raw.publishedAt);
  const updatedAtRaw = asString(raw.updatedAt);
  const authorName = asString(raw.authorName) || 'NSZPC 技術團隊';
  const readingMinutes = Number(raw.readingMinutes);
  const tags = normalizeStringList(raw.tags);
  const sections = Array.isArray(raw.sections)
    ? raw.sections
        .map((item) => normalizeSection(item))
        .filter((item): item is PublicBlogArticleSection => item !== null)
    : [];

  if (!title || !summary || !coverImage || sections.length === 0) {
    return null;
  }

  const publishedAt = BLOG_DATE_PATTERN.test(publishedAtRaw) ? publishedAtRaw : new Date().toISOString().slice(0, 10);
  const updatedAt = BLOG_DATE_PATTERN.test(updatedAtRaw) ? updatedAtRaw : publishedAt;

  return {
    id: asString(raw.id) || `public-blog-${index + 1}`,
    slug,
    title,
    summary,
    coverImage,
    publishedAt,
    updatedAt,
    authorName,
    readingMinutes: Number.isInteger(readingMinutes) && readingMinutes > 0 ? readingMinutes : 5,
    tags: tags.length > 0 ? tags : ['技術文章'],
    youtubeEmbedUrl: normalizeYouTubeEmbedUrl(asString(raw.youtubeEmbedUrl)) || undefined,
    sections,
  };
};

const toFallbackSection = (section: BlogArticleSection): PublicBlogArticleSection => ({
  heading: section.heading,
  paragraphs: [...section.paragraphs],
  bullets: section.bullets ? [...section.bullets] : [],
});

const toFallbackPost = (post: BlogPost, index: number): PublicBlogPost => ({
  id: `fallback-blog-${index + 1}`,
  slug: post.slug,
  title: post.title,
  summary: post.summary,
  coverImage: post.coverImage,
  publishedAt: post.publishedAt,
  updatedAt: post.updatedAt,
  authorName: post.authorName,
  readingMinutes: post.readingMinutes,
  tags: dedupeCaseInsensitive(post.tags),
  sections: post.sections.map((section) => toFallbackSection(section)),
});

export const fallbackPublicBlogPosts: PublicBlogPost[] = staticBlogPosts.map((post, index) =>
  toFallbackPost(post, index),
);

export const getBlogDetailPath = (slug: string): string => {
  return `/blog/${encodeURIComponent(slug)}`;
};

export const fetchPublicBlogPosts = async (): Promise<PublicBlogPost[]> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/public/blog-posts`);
    const payload = (await response.json()) as PublicBlogPostsResponse;

    if (!response.ok || !Array.isArray(payload.data)) {
      return fallbackPublicBlogPosts;
    }

    const parsed = payload.data
      .map((item, index) => sanitizeBlogPost(item, index))
      .filter((item): item is PublicBlogPost => item !== null)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.title.localeCompare(b.title));

    if (parsed.length === 0) {
      return fallbackPublicBlogPosts;
    }

    return parsed;
  } catch {
    return fallbackPublicBlogPosts;
  }
};

import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import {
  fetchPublicBlogPosts,
  getBlogDetailPath,
  type PublicBlogPost,
} from '../lib/publicBlogPosts';
import { applySeo } from '../lib/seo';

const formatDate = (value: string): string => {
  const parsed = new Date(`${value}T00:00:00+08:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const BlogDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [posts, setPosts] = React.useState<PublicBlogPost[]>([]);
  const [loading, setLoading] = React.useState(true);

  const decodedSlug = React.useMemo(() => {
    if (!slug) {
      return '';
    }

    try {
      return decodeURIComponent(slug);
    } catch {
      return slug;
    }
  }, [slug]);

  React.useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      const next = await fetchPublicBlogPosts();
      if (!active) {
        return;
      }

      setPosts(next);
      setLoading(false);
    };

    bootstrap().catch(() => {
      if (!active) {
        return;
      }

      setPosts([]);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const post = React.useMemo(() => {
    if (!decodedSlug) {
      return null;
    }

    return posts.find((item) => item.slug === decodedSlug) || null;
  }, [decodedSlug, posts]);

  React.useEffect(() => {
    if (!post) {
      return;
    }

    const canonicalPath = getBlogDetailPath(post.slug);
    const postUrl = `${window.location.origin}${canonicalPath}`;

    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.summary,
      image: [`${window.location.origin}${post.coverImage}`],
      datePublished: `${post.publishedAt}T08:00:00+08:00`,
      dateModified: `${post.updatedAt}T08:00:00+08:00`,
      author: {
        '@type': 'Person',
        name: post.authorName,
      },
      publisher: {
        '@type': 'Organization',
        name: 'NSZPC 星辰電腦',
        logo: {
          '@type': 'ImageObject',
          url: `${window.location.origin}/images/NSZ_LOGO.png`,
        },
      },
      mainEntityOfPage: postUrl,
      articleSection: '技術文章',
      keywords: post.tags.join(', '),
    };

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: '首頁',
          item: window.location.origin,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: '技術文章',
          item: `${window.location.origin}/blog`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: post.title,
          item: postUrl,
        },
      ],
    };

    applySeo({
      title: `${post.title}｜NSZPC 技術文章`,
      description: post.summary,
      keywords: [...post.tags, 'NSZPC 技術文章', '客製化主機'],
      canonicalPath,
      ogType: 'article',
      ogImage: post.coverImage,
      jsonLd: [articleSchema, breadcrumbSchema],
      jsonLdId: 'page-seo',
    });
  }, [post]);

  if (!decodedSlug) {
    return <Navigate to="/blog" replace />;
  }

  if (loading) {
    return (
      <div className="page blog-detail-page">
        <section className="section-card reveal">
          <p className="admin-note">讀取文章中...</p>
        </section>
      </div>
    );
  }

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <div className="page blog-detail-page">
      <section className="page-hero reveal blog-detail-hero">
        <div>
          <p className="section-kicker">Tech Blog</p>
          <h1>{post.title}</h1>
          <p>{post.summary}</p>

          <div className="blog-detail-meta-row">
            <time dateTime={post.publishedAt}>發布：{formatDate(post.publishedAt)}</time>
            <time dateTime={post.updatedAt}>更新：{formatDate(post.updatedAt)}</time>
            <span>作者：{post.authorName}</span>
            <span>閱讀 {post.readingMinutes} 分鐘</span>
          </div>

          <div className="tag-cloud blog-detail-tags">
            {post.tags.map((tag) => (
              <Link key={`${post.id}-${tag}`} to={`/blog?tag=${encodeURIComponent(tag)}`} className="tag-pill">
                #{tag}
              </Link>
            ))}
          </div>

          <div className="hero-actions">
            <Link to="/blog" className="solid-btn">
              回技術文章
            </Link>
            <Link to="/categories" className="ghost-btn">
              看分類總覽
            </Link>
          </div>
        </div>

        <div className="blog-detail-cover-wrap">
          <img src={post.coverImage} alt={post.title} className="blog-detail-cover" loading="lazy" />
        </div>
      </section>

      <section className="section-card reveal">
        <div className="blog-detail-content">
          {post.sections.map((section) => (
            <article key={section.heading} className="blog-detail-section">
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={`${section.heading}-${paragraph}`}>{paragraph}</p>
              ))}
              {section.bullets.length > 0 ? (
                <ul className="detail-list">
                  {section.bullets.map((item) => (
                    <li key={`${section.heading}-${item}`}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="section-card reveal">
        <div className="section-head">
          <p className="section-kicker">Video</p>
          <h2 className="section-title">影片補充（可在後台編輯）</h2>
        </div>
        {post.youtubeEmbedUrl ? (
          <div className="build-video-frame">
            <iframe
              src={post.youtubeEmbedUrl}
              title={`${post.title} 影片`}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="build-video-placeholder">
            <p>目前尚未設定影片，後台可隨時補上 YouTube 連結。</p>
          </div>
        )}
      </section>

      <section className="section-card reveal">
        <div className="section-head">
          <p className="section-kicker">Next Step</p>
          <h2 className="section-title">看實際案例</h2>
        </div>
        <p>如果你已經有大概方向，可以直接到近期出貨與配單頁面對照需求與規格。</p>
        <div className="hero-actions">
          <Link to="/orders/tags" className="text-link">
            前往近期出貨
            <i className="fa-solid fa-arrow-right" />
          </Link>
          <Link to="/" className="text-link">
            回首頁
            <i className="fa-solid fa-arrow-right" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default BlogDetail;

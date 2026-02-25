import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import {
  fetchPublicBlogPosts,
  getBlogDetailPath,
  type PublicBlogPost,
} from '../lib/publicBlogPosts';
import { applySeo } from '../lib/seo';

const normalize = (value: string): string => value.trim().toLowerCase();

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

const Blog: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [posts, setPosts] = React.useState<PublicBlogPost[]>([]);
  const [postsLoading, setPostsLoading] = React.useState(true);
  const [keyword, setKeyword] = React.useState('');

  React.useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      const next = await fetchPublicBlogPosts();
      if (!active) {
        return;
      }

      setPosts(next);
      setPostsLoading(false);
    };

    bootstrap().catch(() => {
      if (!active) {
        return;
      }

      setPosts([]);
      setPostsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const tagOptions = React.useMemo(() => {
    const all = posts.flatMap((post) => post.tags).map((tag) => tag.trim()).filter(Boolean);
    return [...new Set(all)];
  }, [posts]);

  const activeTag = React.useMemo(() => {
    const raw = new URLSearchParams(location.search).get('tag')?.trim() || '';

    if (!raw) {
      return '全部';
    }

    const exists = tagOptions.some((tag) => normalize(tag) === normalize(raw));
    return exists ? raw : '全部';
  }, [location.search, tagOptions]);

  const filteredPosts = React.useMemo(() => {
    const keywordValue = keyword.trim().toLowerCase();

    return posts.filter((post) => {
      if (activeTag !== '全部') {
        const matchedTag = post.tags.some((tag) => normalize(tag) === normalize(activeTag));
        if (!matchedTag) {
          return false;
        }
      }

      if (!keywordValue) {
        return true;
      }

      const searchable = [
        post.title,
        post.summary,
        post.authorName,
        ...post.tags,
        ...post.sections.flatMap((section) => [section.heading, ...section.paragraphs, ...section.bullets]),
      ]
        .join(' ')
        .toLowerCase();

      return searchable.includes(keywordValue);
    });
  }, [activeTag, keyword, posts]);

  React.useEffect(() => {
    const baseUrl = `${window.location.origin}/blog`;
    const blogSchema = {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'NSZPC 技術文章',
      description: '整理配單邏輯、散熱與升級策略，幫你快速理解組機決策。',
      url: baseUrl,
      publisher: {
        '@type': 'Organization',
        name: 'NSZPC 星辰電腦',
        logo: {
          '@type': 'ImageObject',
          url: `${window.location.origin}/images/NSZ_LOGO.png`,
        },
      },
    };

    const itemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: posts.map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${window.location.origin}${getBlogDetailPath(post.slug)}`,
        name: post.title,
      })),
    };

    applySeo({
      title: 'NSZPC 技術文章｜配單、散熱與升級指南',
      description: '收錄遊戲主機、創作工作站、直播配單與散熱調校的實務文章。',
      keywords: ['技術文章', '組電腦教學', '客製化主機', '散熱調校', '升級建議'],
      canonicalPath: '/blog',
      ogType: 'website',
      ogImage: '/images/carousel/IMG_6486.JPG',
      jsonLd: [blogSchema, itemListSchema],
      jsonLdId: 'page-seo',
    });
  }, [posts]);

  const handleTagChange = (tag: string) => {
    const params = new URLSearchParams(location.search);

    if (tag === '全部') {
      params.delete('tag');
    } else {
      params.set('tag', tag);
    }

    const nextSearch = params.toString();
    navigate({
      pathname: '/blog',
      search: nextSearch ? `?${nextSearch}` : '',
    });
  };

  return (
    <div className="page blog-list-page">
      <section className="page-hero reveal">
        <p className="section-kicker">Tech Blog</p>
        <h1>技術文章</h1>
        <p>整理組機決策、散熱調校與升級邏輯，讓你在下單前就知道每個零件的取捨原因。</p>
      </section>

      <section className="section-card reveal">
        <div className="section-head">
          <p className="section-kicker">Filter</p>
          <h2 className="section-title">文章篩選</h2>
        </div>

        <div className="blog-filter-toolbar">
          <div className="tag-cloud">
            <button
              type="button"
              className={`tag-pill tag-pill-button ${activeTag === '全部' ? 'active' : ''}`}
              onClick={() => handleTagChange('全部')}
            >
              全部
            </button>
            {tagOptions.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`tag-pill tag-pill-button ${normalize(activeTag) === normalize(tag) ? 'active' : ''}`}
                onClick={() => handleTagChange(tag)}
              >
                #{tag}
              </button>
            ))}
          </div>

          <label className="auth-field blog-search-field" htmlFor="blog-search-input">
            搜尋關鍵字
            <input
              id="blog-search-input"
              type="text"
              placeholder="例如：2K 高刷、散熱、直播"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="section-card reveal">
        <div className="section-head">
          <p className="section-kicker">Articles</p>
          <h2 className="section-title">技術文章列表 ({filteredPosts.length})</h2>
        </div>

        {postsLoading ? <p className="admin-note">讀取技術文章中...</p> : null}

        {!postsLoading && filteredPosts.length > 0 ? (
          <div className="blog-grid">
            {filteredPosts.map((post) => (
              <article key={post.id} className="blog-card">
                <Link to={getBlogDetailPath(post.slug)} className="blog-card-cover-link" aria-label={`閱讀 ${post.title}`}>
                  <img src={post.coverImage} alt={post.title} className="blog-card-cover" loading="lazy" />
                </Link>

                <div className="blog-card-body">
                  <div className="blog-card-meta">
                    <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                    <span>閱讀 {post.readingMinutes} 分鐘</span>
                  </div>

                  <h3>
                    <Link to={getBlogDetailPath(post.slug)}>{post.title}</Link>
                  </h3>
                  <p>{post.summary}</p>

                  <div className="tag-cloud blog-card-tags">
                    {post.tags.map((tag) => (
                      <button
                        key={`${post.id}-${tag}`}
                        type="button"
                        className="tag-pill tag-pill-button"
                        onClick={() => handleTagChange(tag)}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>

                  <Link to={getBlogDetailPath(post.slug)} className="text-link">
                    閱讀全文
                    <i className="fa-solid fa-arrow-right" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {!postsLoading && filteredPosts.length === 0 ? (
          <p className="admin-note">目前沒有符合條件的文章，請調整標籤或關鍵字。</p>
        ) : null}
      </section>
    </div>
  );
};

export default Blog;

import React from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import {
  clearAuth,
  getApiBaseUrl,
  getStoredToken,
  toApiErrorMessage,
} from '../lib/adminAuth';
import { getBlogDetailPath } from '../lib/publicBlogPosts';

interface AdminBlogSection {
  heading: string;
  paragraphs: string[];
  bullets: string[];
}

interface AdminBlogPost {
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
  youtubeEmbedUrl: string;
  sections: AdminBlogSection[];
  createdAt: string;
}

interface BlogPostsResponse {
  data: unknown;
}

interface BlogFormSectionState {
  heading: string;
  paragraphsText: string;
  bulletsText: string;
}

interface BlogFormState {
  slug: string;
  title: string;
  summary: string;
  coverImage: string;
  publishedAt: string;
  updatedAt: string;
  authorName: string;
  readingMinutesText: string;
  tagsText: string;
  youtubeEmbedUrl: string;
  sections: BlogFormSectionState[];
}

const BLOG_PAGE_SIZE = 9;
const BLOG_DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const BLOG_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const createEmptySection = (): BlogFormSectionState => ({
  heading: '',
  paragraphsText: '',
  bulletsText: '',
});

const defaultBlogForm: BlogFormState = {
  slug: '',
  title: '',
  summary: '',
  coverImage: '',
  publishedAt: '',
  updatedAt: '',
  authorName: 'NSZPC 技術團隊',
  readingMinutesText: '5',
  tagsText: '',
  youtubeEmbedUrl: '',
  sections: [createEmptySection()],
};

const asString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const parseTextList = (value: string): string[] => {
  return value
    .split(/[\n,，；;]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const dedupeCaseInsensitive = (values: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const trimmed = value.trim();
    const normalized = trimmed.toLowerCase();
    if (!trimmed || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    result.push(trimmed);
  });

  return result;
};

const normalizeUnknownStringList = (value: unknown): string[] => {
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

const normalizeSection = (value: unknown): AdminBlogSection | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const heading = asString(raw.heading);
  const paragraphs = normalizeUnknownStringList(raw.paragraphs);
  const bullets = normalizeUnknownStringList(raw.bullets);

  if (!heading || paragraphs.length === 0) {
    return null;
  }

  return {
    heading,
    paragraphs,
    bullets,
  };
};

const normalizeBlogPost = (value: unknown): AdminBlogPost | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const id = asString(raw.id);
  const title = asString(raw.title);
  const summary = asString(raw.summary);
  const coverImage = asString(raw.coverImage);
  const rawSlug = asString(raw.slug).toLowerCase();
  const slug = BLOG_SLUG_PATTERN.test(rawSlug) ? rawSlug : toKebabSlug(rawSlug || title);

  const sections = Array.isArray(raw.sections)
    ? raw.sections
        .map((item) => normalizeSection(item))
        .filter((item): item is AdminBlogSection => item !== null)
    : [];

  if (!id || !slug || !title || !summary || !coverImage || sections.length === 0) {
    return null;
  }

  const readingMinutes = Number(raw.readingMinutes);
  const tags = normalizeUnknownStringList(raw.tags);

  return {
    id,
    slug,
    title,
    summary,
    coverImage,
    publishedAt: asString(raw.publishedAt),
    updatedAt: asString(raw.updatedAt),
    authorName: asString(raw.authorName) || 'NSZPC 技術團隊',
    readingMinutes: Number.isInteger(readingMinutes) && readingMinutes > 0 ? readingMinutes : 5,
    tags: tags.length > 0 ? tags : ['技術文章'],
    youtubeEmbedUrl: asString(raw.youtubeEmbedUrl),
    sections,
    createdAt: asString(raw.createdAt),
  };
};

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

const AdminBlogManager: React.FC = () => {
  const navigate = useNavigate();
  const token = getStoredToken();
  const apiBaseUrl = getApiBaseUrl();

  const [posts, setPosts] = React.useState<AdminBlogPost[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const [blogForm, setBlogForm] = React.useState<BlogFormState>(defaultBlogForm);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const [searchKeyword, setSearchKeyword] = React.useState('');
  const [page, setPage] = React.useState(1);

  const resetForm = () => {
    setBlogForm(defaultBlogForm);
    setEditingId(null);
    setIsModalOpen(false);
  };

  const loadBlogPosts = React.useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/blog-posts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = (await response.json()) as BlogPostsResponse | unknown;
      if (!response.ok) {
        throw new Error(toApiErrorMessage(payload, '讀取技術文章失敗'));
      }

      const list = (payload as BlogPostsResponse).data;
      const normalized = Array.isArray(list)
        ? list
            .map((item) => normalizeBlogPost(item))
            .filter((item): item is AdminBlogPost => item !== null)
            .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.title.localeCompare(b.title))
        : [];

      setPosts(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : '讀取技術文章失敗';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, token]);

  React.useEffect(() => {
    if (!token) {
      return;
    }

    loadBlogPosts().catch(() => {
      setError('讀取技術文章失敗');
    });
  }, [loadBlogPosts, token]);

  React.useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      resetForm();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen]);

  React.useEffect(() => {
    setPage(1);
  }, [searchKeyword]);

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    clearAuth();
    navigate('/admin/login', { replace: true });
  };

  const openCreateModal = () => {
    setError('');
    setSuccess('');
    setEditingId(null);
    setBlogForm(defaultBlogForm);
    setIsModalOpen(true);
  };

  const handleFieldChange = <K extends keyof BlogFormState>(key: K, value: BlogFormState[K]) => {
    setBlogForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSectionFieldChange = <K extends keyof BlogFormSectionState>(
    index: number,
    key: K,
    value: BlogFormSectionState[K],
  ) => {
    setBlogForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, [key]: value } : section,
      ),
    }));
  };

  const handleAddSection = () => {
    setBlogForm((prev) => ({
      ...prev,
      sections: [...prev.sections, createEmptySection()],
    }));
  };

  const handleRemoveSection = (index: number) => {
    setBlogForm((prev) => {
      const next = prev.sections.filter((_, sectionIndex) => sectionIndex !== index);
      return {
        ...prev,
        sections: next.length > 0 ? next : [createEmptySection()],
      };
    });
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess('');

    const slug = toKebabSlug(blogForm.slug || blogForm.title) || `blog-${Date.now()}`;
    const title = blogForm.title.trim();
    const summary = blogForm.summary.trim();
    const coverImage = blogForm.coverImage.trim();
    const publishedAt = blogForm.publishedAt.trim();
    const updatedAt = blogForm.updatedAt.trim();
    const authorName = blogForm.authorName.trim();
    const youtubeEmbedUrl = blogForm.youtubeEmbedUrl.trim();
    const readingMinutes = Number(blogForm.readingMinutesText);
    const tags = dedupeCaseInsensitive(parseTextList(blogForm.tagsText));

    const sections = blogForm.sections
      .map((section) => ({
        heading: section.heading.trim(),
        paragraphs: dedupeCaseInsensitive(parseTextList(section.paragraphsText)),
        bullets: dedupeCaseInsensitive(parseTextList(section.bulletsText)),
      }))
      .filter((section) => section.heading && section.paragraphs.length > 0);

    if (!slug || !BLOG_SLUG_PATTERN.test(slug)) {
      setError('Slug 需為英數與連字號（kebab-case）');
      return;
    }

    if (!title || !summary || !coverImage || !authorName) {
      setError('請填寫標題、摘要、封面圖、作者');
      return;
    }

    if (!BLOG_DATE_PATTERN.test(publishedAt) || !BLOG_DATE_PATTERN.test(updatedAt)) {
      setError('發布日與更新日格式需為 YYYY-MM-DD');
      return;
    }

    if (!Number.isInteger(readingMinutes) || readingMinutes <= 0) {
      setError('閱讀時間需為正整數');
      return;
    }

    if (tags.length === 0) {
      setError('請至少提供一個文章標籤');
      return;
    }

    if (sections.length === 0) {
      setError('至少需要一個段落，且需填寫段落標題與內容');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const isEdit = Boolean(editingId);
      const endpoint = isEdit
        ? `${apiBaseUrl}/api/admin/blog-posts/${editingId}`
        : `${apiBaseUrl}/api/admin/blog-posts`;

      const response = await fetch(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug,
          title,
          summary,
          coverImage,
          publishedAt,
          updatedAt,
          authorName,
          readingMinutes,
          tags,
          youtubeEmbedUrl,
          sections,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(toApiErrorMessage(payload, isEdit ? '更新文章失敗' : '新增文章失敗'));
      }

      setSuccess(isEdit ? '技術文章已更新' : '技術文章已新增');
      resetForm();
      await loadBlogPosts();
    } catch (err) {
      const message = err instanceof Error ? err.message : '儲存文章失敗';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (post: AdminBlogPost) => {
    setSuccess('');
    setError('');
    setEditingId(post.id);
    setBlogForm({
      slug: post.slug,
      title: post.title,
      summary: post.summary,
      coverImage: post.coverImage,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      authorName: post.authorName,
      readingMinutesText: String(post.readingMinutes),
      tagsText: post.tags.join('\n'),
      youtubeEmbedUrl: post.youtubeEmbedUrl || '',
      sections:
        post.sections.length > 0
          ? post.sections.map((section) => ({
              heading: section.heading,
              paragraphsText: section.paragraphs.join('\n'),
              bulletsText: section.bullets.join('\n'),
            }))
          : [createEmptySection()],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (post: AdminBlogPost) => {
    const confirmed = window.confirm(`確定要刪除文章「${post.title}」嗎？`);
    if (!confirmed) {
      return;
    }

    setDeletingId(post.id);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/blog-posts/${post.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(toApiErrorMessage(payload, '刪除文章失敗'));
      }

      if (editingId === post.id) {
        resetForm();
      }

      setSuccess('技術文章已刪除');
      await loadBlogPosts();
    } catch (err) {
      const message = err instanceof Error ? err.message : '刪除文章失敗';
      setError(message);
    } finally {
      setDeletingId(null);
    }
  };

  const normalizedKeyword = searchKeyword.trim().toLowerCase();
  const filteredPosts = normalizedKeyword
    ? posts.filter((post) => {
        const fields = [
          post.slug,
          post.title,
          post.summary,
          post.authorName,
          post.coverImage,
          post.publishedAt,
          post.updatedAt,
          post.youtubeEmbedUrl,
          ...post.tags,
          ...post.sections.flatMap((section) => [section.heading, ...section.paragraphs, ...section.bullets]),
        ];

        return fields.some((field) => field.toLowerCase().includes(normalizedKeyword));
      })
    : posts;

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / BLOG_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedPosts = filteredPosts.slice((safePage - 1) * BLOG_PAGE_SIZE, safePage * BLOG_PAGE_SIZE);

  return (
    <div className="page admin-page">
      <section className="section-card reveal">
        <p className="section-kicker">Tech Blog Manager</p>
        <h1 className="section-title">技術文章管理</h1>
        <p className="section-sub">集中管理每篇文章內容、標籤、段落與 YouTube 影片嵌入欄位。</p>

        <div className="admin-actions">
          <button type="button" className="solid-btn" onClick={openCreateModal}>
            新增技術文章
          </button>
          <button type="button" className="ghost-btn" onClick={() => loadBlogPosts()} disabled={loading}>
            重新載入
          </button>
          <button type="button" className="ghost-btn" onClick={handleLogout}>
            登出
          </button>
        </div>

        <div className="admin-links">
          <Link to="/admin" className="text-link">
            回後台控制台
            <i className="fa-solid fa-arrow-right" />
          </Link>
          <Link to="/blog" className="text-link">
            看前台文章頁
            <i className="fa-solid fa-arrow-right" />
          </Link>
        </div>
      </section>

      <section className="section-card reveal">
        <div className="admin-list-tools">
          <label className="auth-field admin-search-field" htmlFor="blog-admin-search">
            查詢技術文章
            <input
              id="blog-admin-search"
              type="text"
              placeholder="可搜尋標題、slug、標籤、段落內容..."
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
          </label>
          {searchKeyword ? (
            <button type="button" className="ghost-btn" onClick={() => setSearchKeyword('')}>
              清除查詢
            </button>
          ) : null}
        </div>

        {error ? <p className="auth-error">{error}</p> : null}
        {success ? <p className="admin-success">{success}</p> : null}

        {loading ? <p className="admin-note">讀取技術文章中...</p> : null}
        {!loading && posts.length === 0 ? <p className="admin-note">目前沒有技術文章。</p> : null}
        {!loading && posts.length > 0 && filteredPosts.length === 0 ? (
          <p className="admin-note">查無符合條件的技術文章。</p>
        ) : null}

        <div className="admin-category-list">
          {pagedPosts.map((post) => (
            <article key={post.id} className="admin-category-item">
              <div className="admin-order-top">
                <strong>{post.title}</strong>
                <a className="text-link" href={getBlogDetailPath(post.slug)} target="_blank" rel="noreferrer">
                  查看頁面
                  <i className="fa-solid fa-arrow-right" />
                </a>
              </div>

              <p>{post.summary}</p>
              <p className="admin-note">Slug：{post.slug}</p>
              <p className="admin-note">
                發布：{formatDate(post.publishedAt)} ｜ 更新：{formatDate(post.updatedAt)} ｜ 閱讀 {post.readingMinutes} 分鐘
              </p>
              <p className="admin-note">作者：{post.authorName}</p>
              <p className="admin-note">影片：{post.youtubeEmbedUrl ? '已設定' : '未設定（已預留）'}</p>

              <div className="tag-cloud">
                {post.tags.map((tag) => (
                  <span key={`${post.id}-${tag}`} className="tag-pill">
                    #{tag}
                  </span>
                ))}
              </div>

              <p className="admin-note">段落數：{post.sections.length}（含重點條列）</p>

              <div className="admin-order-item-actions">
                <button type="button" className="ghost-btn" onClick={() => startEdit(post)}>
                  編輯
                </button>
                <button
                  type="button"
                  className="ghost-btn order-delete-btn"
                  onClick={() => handleDelete(post)}
                  disabled={deletingId === post.id}
                >
                  {deletingId === post.id ? '刪除中...' : '刪除'}
                </button>
              </div>
            </article>
          ))}
        </div>

        {filteredPosts.length > BLOG_PAGE_SIZE ? (
          <div className="admin-pagination">
            <button type="button" className="ghost-btn" onClick={() => setPage(safePage - 1)} disabled={safePage <= 1}>
              上一頁
            </button>
            <span className="admin-pagination-status">
              第 {safePage} / {totalPages} 頁（共 {filteredPosts.length} 筆）
            </span>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => setPage(safePage + 1)}
              disabled={safePage >= totalPages}
            >
              下一頁
            </button>
          </div>
        ) : null}
      </section>

      {isModalOpen ? (
        <div className="admin-modal-overlay" onClick={resetForm}>
          <section
            className="admin-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-blog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-modal-head">
              <h3 id="edit-blog-title">{editingId ? '編輯技術文章' : '新增技術文章'}</h3>
              <button type="button" className="admin-modal-close" onClick={resetForm}>
                關閉
              </button>
            </div>

            <form className="admin-build-form" onSubmit={handleSave}>
              <div className="admin-form-grid">
                <label className="auth-field" htmlFor="blog-form-title">
                  文章標題
                  <input
                    id="blog-form-title"
                    type="text"
                    value={blogForm.title}
                    onChange={(event) => handleFieldChange('title', event.target.value)}
                  />
                </label>

                <label className="auth-field" htmlFor="blog-form-slug">
                  Slug（留空會由標題自動轉換）
                  <input
                    id="blog-form-slug"
                    type="text"
                    placeholder="example-blog-slug"
                    value={blogForm.slug}
                    onChange={(event) => handleFieldChange('slug', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="blog-form-summary">
                  文章摘要
                  <textarea
                    id="blog-form-summary"
                    rows={3}
                    value={blogForm.summary}
                    onChange={(event) => handleFieldChange('summary', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="blog-form-cover-image">
                  封面圖片
                  <input
                    id="blog-form-cover-image"
                    type="text"
                    value={blogForm.coverImage}
                    onChange={(event) => handleFieldChange('coverImage', event.target.value)}
                  />
                </label>

                <label className="auth-field" htmlFor="blog-form-published-at">
                  發布日（YYYY-MM-DD）
                  <input
                    id="blog-form-published-at"
                    type="text"
                    value={blogForm.publishedAt}
                    onChange={(event) => handleFieldChange('publishedAt', event.target.value)}
                  />
                </label>

                <label className="auth-field" htmlFor="blog-form-updated-at">
                  更新日（YYYY-MM-DD）
                  <input
                    id="blog-form-updated-at"
                    type="text"
                    value={blogForm.updatedAt}
                    onChange={(event) => handleFieldChange('updatedAt', event.target.value)}
                  />
                </label>

                <label className="auth-field" htmlFor="blog-form-author-name">
                  作者
                  <input
                    id="blog-form-author-name"
                    type="text"
                    value={blogForm.authorName}
                    onChange={(event) => handleFieldChange('authorName', event.target.value)}
                  />
                </label>

                <label className="auth-field" htmlFor="blog-form-reading-minutes">
                  閱讀分鐘
                  <input
                    id="blog-form-reading-minutes"
                    type="number"
                    min={1}
                    step={1}
                    value={blogForm.readingMinutesText}
                    onChange={(event) => handleFieldChange('readingMinutesText', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="blog-form-tags">
                  標籤（可換行或逗號分隔）
                  <textarea
                    id="blog-form-tags"
                    rows={3}
                    value={blogForm.tagsText}
                    onChange={(event) => handleFieldChange('tagsText', event.target.value)}
                  />
                </label>

                <label className="auth-field admin-field-wide" htmlFor="blog-form-youtube-url">
                  YouTube 連結（可空白，支援 watch/share/embed）
                  <input
                    id="blog-form-youtube-url"
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={blogForm.youtubeEmbedUrl}
                    onChange={(event) => handleFieldChange('youtubeEmbedUrl', event.target.value)}
                  />
                </label>

                <div className="admin-field-wide admin-content-block">
                  <h3>段落內容</h3>
                  {blogForm.sections.map((section, index) => (
                    <article key={`blog-section-${index}`} className="admin-site-array-item">
                      <label className="auth-field" htmlFor={`blog-section-heading-${index}`}>
                        段落標題
                        <input
                          id={`blog-section-heading-${index}`}
                          type="text"
                          value={section.heading}
                          onChange={(event) => handleSectionFieldChange(index, 'heading', event.target.value)}
                        />
                      </label>

                      <label className="auth-field" htmlFor={`blog-section-paragraphs-${index}`}>
                        段落內容（每行一段）
                        <textarea
                          id={`blog-section-paragraphs-${index}`}
                          rows={4}
                          value={section.paragraphsText}
                          onChange={(event) => handleSectionFieldChange(index, 'paragraphsText', event.target.value)}
                        />
                      </label>

                      <label className="auth-field" htmlFor={`blog-section-bullets-${index}`}>
                        重點條列（可空白，每行一點）
                        <textarea
                          id={`blog-section-bullets-${index}`}
                          rows={3}
                          value={section.bulletsText}
                          onChange={(event) => handleSectionFieldChange(index, 'bulletsText', event.target.value)}
                        />
                      </label>

                      <button
                        type="button"
                        className="ghost-btn admin-icon-btn"
                        onClick={() => handleRemoveSection(index)}
                        disabled={blogForm.sections.length <= 1}
                      >
                        移除段落
                      </button>
                    </article>
                  ))}

                  <button type="button" className="ghost-btn" onClick={handleAddSection}>
                    + 新增段落
                  </button>
                </div>
              </div>

              {error ? <p className="auth-error">{error}</p> : null}

              <div className="admin-modal-actions">
                <button type="submit" className="solid-btn" disabled={isSaving}>
                  {isSaving ? '儲存中...' : editingId ? '儲存變更' : '新增文章'}
                </button>
                <button type="button" className="ghost-btn" onClick={resetForm}>
                  取消
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
};

export default AdminBlogManager;

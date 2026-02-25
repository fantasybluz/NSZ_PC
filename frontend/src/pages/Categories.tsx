import React from 'react';
import { Link } from 'react-router-dom';

import {
  fallbackPublicCategories,
  fetchPublicCategories,
  getCategoryDetailPath,
  type PublicCategory,
} from '../lib/publicCategories';
import {
  defaultPublicSiteContent,
  fetchPublicSiteContent,
} from '../lib/publicSiteContent';
import { dedupeCaseInsensitive, normalizeLower } from '../lib/textUtils';

const isTagMatched = (category: PublicCategory, keyword: string): boolean => {
  const normalizedKeyword = normalizeLower(keyword);
  if (!normalizedKeyword) {
    return true;
  }

  const tagsMatched = category.tags.some((tag) => {
    const normalizedTag = normalizeLower(tag);
    return (
      normalizedTag === normalizedKeyword ||
      normalizedTag.includes(normalizedKeyword) ||
      normalizedKeyword.includes(normalizedTag)
    );
  });

  if (tagsMatched) {
    return true;
  }

  const searchable = [
    category.title,
    category.summary,
    category.primaryCategory,
    category.secondaryCategory,
    ...category.points,
  ]
    .join(' ')
    .toLowerCase();

  return searchable.includes(normalizedKeyword);
};

const Categories: React.FC = () => {
  const [categories, setCategories] = React.useState<PublicCategory[]>(fallbackPublicCategories);
  const [siteContent, setSiteContent] = React.useState(defaultPublicSiteContent);
  const [activeTag, setActiveTag] = React.useState('全部');
  const [searchKeyword, setSearchKeyword] = React.useState('');

  React.useEffect(() => {
    const loadCategories = async () => {
      const next = await fetchPublicCategories();
      setCategories(next);
    };

    loadCategories().catch(() => {
      // Keep fallback categories when request fails unexpectedly.
    });
  }, []);

  React.useEffect(() => {
    const loadSiteContent = async () => {
      const next = await fetchPublicSiteContent();
      setSiteContent(next);
    };

    loadSiteContent().catch(() => {
      // Keep fallback site content when request fails unexpectedly.
    });
  }, []);

  const tagOptions = React.useMemo(() => {
    const all = [
      ...siteContent.categoriesQuickTags,
      ...categories.flatMap((category) => category.tags),
    ];

    return dedupeCaseInsensitive(all);
  }, [categories, siteContent.categoriesQuickTags]);

  const visibleCategories = React.useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return categories.filter((category) => {
      if (activeTag !== '全部' && !isTagMatched(category, activeTag)) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const searchable = [
        category.title,
        category.summary,
        category.primaryCategory,
        category.secondaryCategory,
        ...category.tags,
        ...category.points,
      ]
        .join(' ')
        .toLowerCase();

      return searchable.includes(keyword);
    });
  }, [activeTag, categories, searchKeyword]);

  React.useEffect(() => {
    if (activeTag === '全部') {
      return;
    }

    const exists = tagOptions.some((tag) => normalizeLower(tag) === normalizeLower(activeTag));
    if (!exists) {
      setActiveTag('全部');
    }
  }, [activeTag, tagOptions]);

  return (
    <div className="page categories-page">
      <section className="page-hero reveal">
        <p className="section-kicker">Categories</p>
        <h1>分類總覽</h1>
        <p>{siteContent.categoriesHeroSubtitle}</p>
      </section>

      <section className="section-card reveal">
        <div className="section-head">
          <p className="section-kicker">Category Filter</p>
          <h2 className="section-title">分類篩選</h2>
        </div>

        <div className="portfolio-tag-toolbar">
          <div className="tag-cloud">
            <button
              type="button"
              className={`tag-pill tag-pill-button ${activeTag === '全部' ? 'active' : ''}`}
              onClick={() => setActiveTag('全部')}
            >
              全部
            </button>
            {tagOptions.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`tag-pill tag-pill-button ${
                  normalizeLower(activeTag) === normalizeLower(tag) ? 'active' : ''
                }`}
                onClick={() => setActiveTag(tag)}
              >
                #{tag}
              </button>
            ))}
          </div>

          <label className="auth-field blog-search-field" htmlFor="category-search-input">
            搜尋分類
            <input
              id="category-search-input"
              type="text"
              placeholder="例如：直播、剪輯、白色主題"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="section-card reveal">
        <div className="section-head">
          <p className="section-kicker">Category Overview</p>
          <h2 className="section-title">分類列表 ({visibleCategories.length})</h2>
        </div>

        <div className="category-grid">
          {visibleCategories.map((category) => (
            <article key={category.id} className="category-card">
              <h3>{category.title}</h3>
              <p>{category.summary}</p>
              <p className="admin-note">
                主分類：{category.primaryCategory} ／ 次分類：{category.secondaryCategory}
              </p>

              <div className="brand-portfolio-tags">
                {category.tags.map((tag) => (
                  <span key={`${category.id}-${tag}`} className="tag-pill">
                    {tag}
                  </span>
                ))}
              </div>

              <ul>
                {category.points.slice(0, 4).map((point) => (
                  <li key={`${category.id}-${point}`}>{point}</li>
                ))}
              </ul>

              <Link className="text-link" to={getCategoryDetailPath(category.id)}>
                查看分類詳情
                <i className="fa-solid fa-arrow-right" />
              </Link>
            </article>
          ))}
        </div>

        {visibleCategories.length === 0 ? (
          <p className="admin-note">目前沒有符合條件的分類，請調整標籤或關鍵字。</p>
        ) : null}
      </section>
    </div>
  );
};

export default Categories;

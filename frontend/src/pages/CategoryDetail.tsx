import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import ProductCard from '../components/ProductCard';
import { carouselImages } from '../data/siteData';
import {
  fallbackPublicBuilds,
  fetchPublicBuilds,
  getBuildDetailPath,
  type PublicBuild,
} from '../lib/publicBuilds';
import {
  fallbackPublicCategories,
  fetchPublicCategories,
  type PublicCategory,
} from '../lib/publicCategories';
import { dedupeCaseInsensitive, normalizeLower } from '../lib/textUtils';

const hashToIndex = (text: string, length: number): number => {
  const value = Array.from(text).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return Math.abs(value) % Math.max(length, 1);
};

const buildFallbackRecommendations = (category: PublicCategory): string[] => [
  `先依 ${category.title} 的核心需求排序，預算配置會更有效率。`,
  '先決定未來 6-12 個月的升級目標，再挑主板與電供等基礎平台。',
  '若需求有變動，建議優先調整最影響體感的零件，不要一次全部重配。',
];

const buildFallbackFaqs = (category: PublicCategory): Array<{ question: string; answer: string }> => [
  {
    question: `${category.title} 適合新手嗎？`,
    answer: '可以，會依預算與用途拆成好理解的選配層級，降低踩雷機率。',
  },
  {
    question: '如果之後想升級，現在需要先預留嗎？',
    answer: '建議先預留關鍵升級路線，後續升級成本會更低、相容性也更好。',
  },
];

const scoreBuildForCategory = (category: PublicCategory, build: PublicBuild): number => {
  const buildText = [
    build.name,
    build.description,
    build.detailIntro,
    build.requirementIntro,
    build.cpu || '',
    build.ram || '',
    build.storage || '',
    build.gpu || '',
    build.psu || '',
    build.pcCase || '',
    ...build.specs,
  ]
    .join(' ')
    .toLowerCase();

  const strongKeywords = dedupeCaseInsensitive([
    category.title,
    category.primaryCategory,
    category.secondaryCategory,
    ...category.tags,
  ]);

  const weakKeywords = dedupeCaseInsensitive([
    category.summary,
    category.detailIntro,
    ...category.points,
  ]);

  let score = 0;

  strongKeywords.forEach((keyword) => {
    const normalizedKeyword = normalizeLower(keyword);
    if (normalizedKeyword && buildText.includes(normalizedKeyword)) {
      score += 3;
    }
  });

  weakKeywords.forEach((keyword) => {
    const normalizedKeyword = normalizeLower(keyword);
    if (normalizedKeyword && buildText.includes(normalizedKeyword)) {
      score += 1;
    }
  });

  return score;
};

const CategoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const decodedId = React.useMemo(() => {
    if (!id) {
      return '';
    }

    try {
      return decodeURIComponent(id);
    } catch {
      return id;
    }
  }, [id]);

  const [categories, setCategories] = React.useState<PublicCategory[]>(fallbackPublicCategories);
  const [builds, setBuilds] = React.useState<PublicBuild[]>(fallbackPublicBuilds);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadBuilds = async () => {
      const next = await fetchPublicBuilds();
      setBuilds(next);
    };

    loadBuilds().catch(() => {
      // Keep fallback builds when request fails.
    });
  }, []);

  React.useEffect(() => {
    const loadCategories = async () => {
      const next = await fetchPublicCategories();
      setCategories(next);
      setIsLoading(false);
    };

    loadCategories().catch(() => {
      setIsLoading(false);
    });
  }, []);

  if (!decodedId) {
    return <Navigate to="/categories" replace />;
  }

  const category = categories.find((item) => item.id === decodedId);

  if (!category && !isLoading) {
    return <Navigate to="/categories" replace />;
  }

  if (!category) {
    return (
      <div className="page category-detail-page">
        <section className="section-card reveal">
          <p className="admin-note">讀取分類內容中...</p>
        </section>
      </div>
    );
  }

  const heroImage =
    category.detailHeroImage || carouselImages[hashToIndex(category.id, carouselImages.length)];
  const recommendations =
    category.detailRecommendations.length > 0
      ? category.detailRecommendations
      : buildFallbackRecommendations(category);
  const faqs = category.detailFaqs.length > 0 ? category.detailFaqs : buildFallbackFaqs(category);
  const recommendedBuilds = [...builds]
    .map((build) => ({
      build,
      score: scoreBuildForCategory(category, build),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.build.price - right.build.price;
    })
    .map((item) => item.build)
    .slice(0, 3);

  return (
    <div className="page category-detail-page">
      <section className="page-hero reveal category-detail-hero">
        <div>
          <p className="section-kicker">Category Detail</p>
          <h1>{category.title}</h1>
          <p>{category.detailIntro || category.summary}</p>
          <div className="hero-actions">
            <Link to="/categories" className="solid-btn">
              回分類總覽
            </Link>
            <Link to="/orders/tags" className="ghost-btn">
              查看近期出機
            </Link>
          </div>
        </div>

        <div className="category-detail-media">
          <img src={heroImage} alt={category.title} loading="lazy" />
        </div>
      </section>

      <section className="section-card reveal">
        <div className="section-head">
          <p className="section-kicker">Highlights</p>
          <h2 className="section-title">這個分類的核心重點</h2>
        </div>

        <div className="detail-card-grid">
          {category.points.map((item) => (
            <article key={item} className="detail-card-item">
              <i className="fa-solid fa-circle-check" aria-hidden="true" />
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-card reveal">
        <div className="section-head">
          <p className="section-kicker">Recommendations</p>
          <h2 className="section-title">建議規劃方式</h2>
        </div>

        <ul className="detail-list">
          {recommendations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="section-card reveal">
        <div className="section-head">
          <p className="section-kicker">FAQ</p>
          <h2 className="section-title">常見問題</h2>
        </div>

        <div className="faq-grid">
          {faqs.map((faq) => (
            <article key={faq.question} className="faq-item">
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-card reveal">
        <div className="section-head">
          <p className="section-kicker">Suggested Build</p>
          <h2 className="section-title">你可能有興趣的主機</h2>
        </div>

        <div className="build-grid">
          {recommendedBuilds.map((build) => (
            <ProductCard
              key={build.id}
              name={build.name}
              image={build.image}
              description={build.description}
              price={build.price}
              dealDate={build.dealDate}
              badge={build.badge}
              detailPath={getBuildDetailPath(build.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default CategoryDetail;

import { carouselImages, productCategories } from '../data/siteData';
import { getApiBaseUrl } from './adminAuth';

export interface PublicCategoryFaq {
  question: string;
  answer: string;
}

export interface PublicCategory {
  id: string;
  title: string;
  summary: string;
  primaryCategory: string;
  secondaryCategory: string;
  tags: string[];
  points: string[];
  detailIntro: string;
  detailHeroImage: string;
  detailRecommendations: string[];
  detailFaqs: PublicCategoryFaq[];
}

interface PublicCategoriesResponse {
  data?: unknown;
}

const sanitizePoints = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
};

const sanitizeFaqs = (value: unknown): PublicCategoryFaq[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const typed = item as Record<string, unknown>;
      const question = typeof typed.question === 'string' ? typed.question.trim() : '';
      const answer = typeof typed.answer === 'string' ? typed.answer.trim() : '';

      if (!question || !answer) {
        return null;
      }

      return { question, answer };
    })
    .filter((item): item is PublicCategoryFaq => item !== null);
};

const inferFallbackCategoryMeta = (
  title: string,
  summary: string,
  points: string[],
): Pick<PublicCategory, 'primaryCategory' | 'secondaryCategory' | 'tags'> => {
  const searchable = `${title} ${summary} ${points.join(' ')}`.toLowerCase();

  if (/直播|創作|剪輯|影音|premiere|davinci|blender|obs|ai/.test(searchable)) {
    return {
      primaryCategory: '創作與直播',
      secondaryCategory: '影音輸出',
      tags: ['直播', '剪輯', '多工', 'AI 創作'],
    };
  }

  if (/升級|零組件|顯示卡|記憶體|ssd|電供|瓶頸/.test(searchable)) {
    return {
      primaryCategory: '零組件升級',
      secondaryCategory: '效能強化',
      tags: ['顯卡升級', '記憶體', 'SSD', '電供'],
    };
  }

  if (/企業|工作室|批量|採購|部署/.test(searchable)) {
    return {
      primaryCategory: '商用部署',
      secondaryCategory: '企業採購',
      tags: ['批量採購', '規格一致', '維運支援'],
    };
  }

  if (/機殼|外觀|桌搭|燈效|白色|玻璃側透|雙艙/.test(searchable)) {
    return {
      primaryCategory: '主題機殼',
      secondaryCategory: '外觀與風道',
      tags: ['白色主題', 'ARGB', '玻璃側透', '整線'],
    };
  }

  const fallbackTags = [...new Set([title, ...points].map((item) => item.trim()).filter(Boolean))].slice(0, 4);

  return {
    primaryCategory: '自訂分類',
    secondaryCategory: '一般需求',
    tags: fallbackTags.length > 0 ? fallbackTags : ['入門推薦'],
  };
};

const sanitizeCategory = (value: unknown): PublicCategory | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;

  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  const summary = typeof raw.summary === 'string' ? raw.summary.trim() : '';
  const points = sanitizePoints(raw.points);
  const fallbackMeta = inferFallbackCategoryMeta(title, summary, points);
  const primaryCategory =
    typeof raw.primaryCategory === 'string' && raw.primaryCategory.trim()
      ? raw.primaryCategory.trim()
      : fallbackMeta.primaryCategory;
  const secondaryCategory =
    typeof raw.secondaryCategory === 'string' && raw.secondaryCategory.trim()
      ? raw.secondaryCategory.trim()
      : fallbackMeta.secondaryCategory;
  const tags = sanitizePoints(raw.tags);
  const detailIntro = typeof raw.detailIntro === 'string' ? raw.detailIntro.trim() : '';
  const detailHeroImage = typeof raw.detailHeroImage === 'string' ? raw.detailHeroImage.trim() : '';
  const detailRecommendations = sanitizePoints(raw.detailRecommendations);
  const detailFaqs = sanitizeFaqs(raw.detailFaqs);

  if (!id || !title || !summary || points.length === 0) {
    return null;
  }

  return {
    id,
    title,
    summary,
    primaryCategory,
    secondaryCategory,
    tags: tags.length > 0 ? tags : fallbackMeta.tags,
    points,
    detailIntro: detailIntro || summary,
    detailHeroImage,
    detailRecommendations,
    detailFaqs,
  };
};

export const fallbackPublicCategories: PublicCategory[] = productCategories.map((category, index) => {
  const fallbackHeroImage = carouselImages[index % carouselImages.length];

  return {
    id: `fallback-${index + 1}`,
    title: category.title,
    summary: category.summary,
    primaryCategory: category.primaryCategory,
    secondaryCategory: category.secondaryCategory,
    tags: category.tags,
    points: category.points,
    detailIntro: `${category.summary} 會先依需求說明拆解優先順序，再提供對應建議。`,
    detailHeroImage: fallbackHeroImage,
    detailRecommendations: [
      `先定義 ${category.title} 的核心目標，再安排預算比例。`,
      '優先確認未來升級方向，避免重複投入。',
      '從最影響使用體感的項目開始調整最有效率。',
    ],
    detailFaqs: [
      {
        question: `${category.title} 適合新手嗎？`,
        answer: '可以，會先把需求拆成清楚的階段，再逐步確認。',
      },
      {
        question: '未來要升級會不會受限？',
        answer: '會先預留升級餘裕，降低後續升級成本。',
      },
    ],
  };
});

export const getCategoryDetailPath = (id: string): string => {
  return `/categories/item/${encodeURIComponent(id)}`;
};

export const fetchPublicCategories = async (): Promise<PublicCategory[]> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/public/categories`);
    const payload = (await response.json()) as PublicCategoriesResponse;

    if (!response.ok || !Array.isArray(payload.data)) {
      return fallbackPublicCategories;
    }

    const parsed = payload.data
      .map((item) => sanitizeCategory(item))
      .filter((item): item is PublicCategory => item !== null);

    if (parsed.length === 0) {
      return fallbackPublicCategories;
    }

    return parsed;
  } catch {
    return fallbackPublicCategories;
  }
};

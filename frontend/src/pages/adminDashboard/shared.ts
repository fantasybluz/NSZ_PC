import type { AdminUser } from '../../lib/adminAuth';

export type OrderStatus = 'pending' | 'shipping' | 'delivered' | 'cancelled';
export type AdminTabKey =
  | 'siteContent'
  | 'builds'
  | 'categories'
  | 'orders';

export interface AdminBuild {
  id: string;
  name: string;
  description: string;
  detailIntro?: string;
  requirementIntro?: string;
  youtubeEmbedUrl?: string;
  price: number;
  dealDate?: string;
  image: string;
  badge?: string;
  tags: string[];
  cpu?: string;
  motherboard?: string;
  ram?: string;
  storage?: string;
  gpu?: string;
  psu?: string;
  pcCase?: string;
  accessories?: string[];
  specs: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrder {
  id: string;
  date: string;
  item: string;
  requirementIntro: string;
  youtubeEmbedUrl?: string;
  tags: string[];
  location: string;
  salePrice: number;
  serviceFee: number;
  status: OrderStatus;
  images?: string[];
  cpu: string;
  motherboard: string;
  ram: string;
  storage: string;
  gpu: string;
  psu: string;
  cooler: string;
  pcCase: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCategory {
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
  detailFaqs: AdminCategoryFaq[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminCategoryFaq {
  question: string;
  answer: string;
}

export interface MeResponse {
  data: AdminUser;
}

export interface BuildsResponse {
  data: AdminBuild[];
}

export interface OrdersResponse {
  data: AdminOrder[];
}

export interface CategoriesResponse {
  data: AdminCategory[];
}

export const statusOptions: Array<{ value: OrderStatus; label: string }> = [
  { value: 'pending', label: '待處理' },
  { value: 'shipping', label: '配送中' },
  { value: 'delivered', label: '已送達' },
  { value: 'cancelled', label: '已取消' },
];

export const statusLabelMap: Record<OrderStatus, string> = {
  pending: '待處理',
  shipping: '配送中',
  delivered: '已送達',
  cancelled: '已取消',
};

// 後台首頁的分頁，用網址 #hash 記住；沒有或不認得就是出機紀錄
export const ADMIN_TAB_KEYS: AdminTabKey[] = ['orders', 'builds', 'categories', 'siteContent'];

export const adminTabFromHash = (hash: string): AdminTabKey => {
  const key = hash.replace(/^#/, '') as AdminTabKey;
  return ADMIN_TAB_KEYS.includes(key) ? key : 'orders';
};
export interface BuildFormState {
  name: string;
  description: string;
  detailIntro: string;
  requirementIntro: string;
  youtubeEmbedUrl: string;
  priceText: string;
  dealDate: string;
  image: string;
  badge: string;
  tagsText: string;
  cpu: string;
  motherboard: string;
  ram: string;
  storage: string;
  gpu: string;
  psu: string;
  pcCase: string;
  accessoriesText: string;
  specsText: string;
}

export interface OrderFormState {
  date: string;
  item: string;
  requirementIntro: string;
  youtubeEmbedUrl: string;
  tagsText: string;
  imagesText: string;
  location: string;
  salePriceText: string;
  serviceFeeText: string;
  status: OrderStatus;
  cpu: string;
  motherboard: string;
  ram: string;
  storage: string;
  gpu: string;
  psu: string;
  cooler: string;
  pcCase: string;
}

export interface CategoryFormState {
  title: string;
  summary: string;
  primaryCategory: string;
  secondaryCategory: string;
  tagsText: string;
  pointsText: string;
  detailIntro: string;
  detailHeroImage: string;
  detailRecommendationsText: string;
  detailFaqsText: string;
}

export interface AdminSiteStat {
  value: string;
  label: string;
}

export interface AdminShippingStep {
  title: string;
  description: string;
}

export interface AdminTestimonial {
  quote: string;
  name: string;
  tag: string;
}

export interface AdminContactChannel {
  icon: string;
  label: string;
  value: string;
  href: string;
}

export interface AdminSiteContent {
  homeHeroTitle: string;
  homeContactSubtitle: string;
  homeStats: AdminSiteStat[];
  categoriesHeroSubtitle: string;
  categoriesQuickTags: string[];
  brandHeroTitle: string;
  shipmentTagCatalog: string[];
  shippingSteps: AdminShippingStep[];
  testimonials: AdminTestimonial[];
  contactChannels: AdminContactChannel[];
  footerAddress: string;
  footerSlogan: string;
  updatedAt: string;
}

export interface SiteContentResponse {
  data: AdminSiteContent;
}

export interface SiteContentFormState {
  homeHeroTitle: string;
  homeContactSubtitle: string;
  homeStats: AdminSiteStat[];
  categoriesHeroSubtitle: string;
  categoriesQuickTagsText: string;
  brandHeroTitle: string;
  shipmentTagCatalogText: string;
  shippingSteps: AdminShippingStep[];
  testimonials: AdminTestimonial[];
  contactChannels: AdminContactChannel[];
  footerAddress: string;
  footerSlogan: string;
}

export const defaultBuildForm: BuildFormState = {
  name: '',
  description: '',
  detailIntro: '',
  requirementIntro: '',
  youtubeEmbedUrl: '',
  priceText: '',
  dealDate: '',
  image: '',
  badge: '',
  tagsText: '',
  cpu: '',
  motherboard: '',
  ram: '',
  storage: '',
  gpu: '',
  psu: '',
  pcCase: '',
  accessoriesText: '',
  specsText: '',
};

export const defaultOrderForm: OrderFormState = {
  date: '',
  item: '',
  requirementIntro: '',
  youtubeEmbedUrl: '',
  tagsText: '',
  imagesText: '',
  location: '',
  salePriceText: '',
  serviceFeeText: '',
  status: 'pending',
  cpu: '',
  motherboard: '',
  ram: '',
  storage: '',
  gpu: '',
  psu: '',
  cooler: '',
  pcCase: '',
};

export const defaultCategoryForm: CategoryFormState = {
  title: '',
  summary: '',
  primaryCategory: '',
  secondaryCategory: '',
  tagsText: '',
  pointsText: '',
  detailIntro: '',
  detailHeroImage: '',
  detailRecommendationsText: '',
  detailFaqsText: '',
};

export const defaultSiteContentForm: SiteContentFormState = {
  homeHeroTitle: '',
  homeContactSubtitle: '',
  homeStats: [],
  categoriesHeroSubtitle: '',
  categoriesQuickTagsText: '',
  brandHeroTitle: '',
  shipmentTagCatalogText: '',
  shippingSteps: [],
  testimonials: [],
  contactChannels: [],
  footerAddress: '',
  footerSlogan: '',
};

export const createEmptySiteStat = (): AdminSiteStat => ({
  value: '',
  label: '',
});

export const createEmptyShippingStep = (): AdminShippingStep => ({
  title: '',
  description: '',
});

export const createEmptyTestimonial = (): AdminTestimonial => ({
  quote: '',
  name: '',
  tag: '',
});

export const createEmptyContactChannel = (): AdminContactChannel => ({
  icon: '',
  label: '',
  value: '',
  href: '',
});

export const BUILD_PAGE_SIZE = 9;
export const CATEGORY_PAGE_SIZE = 9;
export const ORDER_PAGE_SIZE = 9;

export const orderPriceDistributionRanges: Array<{ key: string; label: string; min: number; max: number | null }> = [
  { key: 'range1to3', label: '1-3 萬', min: 10_000, max: 30_000 },
  { key: 'range3to5', label: '3-5 萬', min: 30_000, max: 50_000 },
  { key: 'range5to8', label: '5-8 萬', min: 50_000, max: 80_000 },
  { key: 'range8plus', label: '8 萬以上', min: 80_000, max: null },
];

export const splitLineList = (input: string): string[] => {
  return input
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
};

export const parsePipeRows = (input: string, expectedParts: number, label: string): string[][] => {
  const lines = splitLineList(input);
  if (lines.length === 0) {
    throw new Error(`${label} 至少需要一筆資料`);
  }

  return lines.map((line, index) => {
    const parts = line.split('|').map((item) => item.trim());
    if (parts.length !== expectedParts || parts.some((item) => !item)) {
      throw new Error(`${label} 第 ${index + 1} 行格式錯誤`);
    }

    return parts;
  });
};

export const serializeCategoryFaqs = (value: AdminCategoryFaq[]): string => {
  return value.map((item) => `${item.question} | ${item.answer}`).join('\n');
};

export const splitTextList = (input: string): string[] => {
  return input
    .split(/[\n,，；;]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

export const dedupeCaseInsensitive = (values: string[]): string[] => {
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

export const parseTagTextValue = (input: string): string[] => {
  return dedupeCaseInsensitive(splitTextList(input));
};

export const createDefaultOrderStorageFields = (): string[] => [''];

const splitStorageItems = (input: string): string[] => {
  return input
    .split(/\s\/\s|[\n,，+、]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

export const normalizeOrderStorageFields = (input: string): string[] => {
  const items = splitStorageItems(input);
  return items.length > 0 ? items : createDefaultOrderStorageFields();
};

export const serializeOrderStorageFields = (value: string[]): string => {
  return value
    .map((item) => item.trim())
    .filter(Boolean)
    .join(' + ');
};

export const normalizeUnknownStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
};

export const inferFallbackCategoryMeta = (
  title: string,
  summary: string,
  points: string[],
): Pick<AdminCategory, 'primaryCategory' | 'secondaryCategory' | 'tags'> => {
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

  const fallbackTags = [...new Set([title, ...points])]
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);

  return {
    primaryCategory: '自訂分類',
    secondaryCategory: '一般需求',
    tags: fallbackTags.length > 0 ? fallbackTags : ['入門推薦'],
  };
};

export const normalizeCategoryFaqList = (value: unknown): AdminCategoryFaq[] => {
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
    .filter((item): item is AdminCategoryFaq => item !== null);
};

export const isOrderStatusValue = (value: unknown): value is OrderStatus => {
  return value === 'pending' || value === 'shipping' || value === 'delivered' || value === 'cancelled';
};

export const deriveOrderTags = (item: string, fields: string[]): string[] => {
  const searchable = [item, ...fields].join(' ').toLowerCase();
  const tags: string[] = [];

  if (/4k|2k|高幀|fps|電競|遊戲/.test(searchable)) {
    tags.push('遊戲主機');
  }

  if (/直播|實況|obs/.test(searchable)) {
    tags.push('直播用途');
  }

  if (/剪輯|創作|建模|渲染|工作站|premiere|blender|davinci|ai|生成/.test(searchable)) {
    tags.push('創作工作站');
  }

  if (/白色|主題|側透|雙艙/.test(searchable)) {
    tags.push('白色主題');
  }

  if (/企業|批量|工作室|商用/.test(searchable)) {
    tags.push('企業部署');
  }

  if (/sff|小型|itx|a4-h2o/.test(searchable)) {
    tags.push('SFF 小型');
  }

  if (/5080|5090|rtx 50/.test(searchable)) {
    tags.push('旗艦效能');
  } else if (/4070|4060/.test(searchable)) {
    tags.push('主流效能');
  }

  if (tags.length === 0) {
    tags.push('客製配單');
  }

  return [...new Set(tags)];
};

export const normalizeAdminOrder = (value: unknown): AdminOrder | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  const date = typeof raw.date === 'string' ? raw.date.trim() : '';
  const item = typeof raw.item === 'string' ? raw.item.trim() : '';
  const location = typeof raw.location === 'string' ? raw.location.trim() : '';
  const cpu = typeof raw.cpu === 'string' ? raw.cpu.trim() : '';
  const motherboard = typeof raw.motherboard === 'string' ? raw.motherboard.trim() : '';
  const ram = typeof raw.ram === 'string' ? raw.ram.trim() : '';
  const storage = typeof raw.storage === 'string' ? raw.storage.trim() : '';
  const gpu = typeof raw.gpu === 'string' ? raw.gpu.trim() : '';
  const psu = typeof raw.psu === 'string' ? raw.psu.trim() : '';
  const cooler = typeof raw.cooler === 'string' ? raw.cooler.trim() : '';
  const pcCase = typeof raw.pcCase === 'string' ? raw.pcCase.trim() : '';
  const tags = normalizeUnknownStringList(raw.tags);
  const images = normalizeUnknownStringList(raw.images);

  if (!id || !date || !item || !location) {
    return null;
  }

  const status = isOrderStatusValue(raw.status) ? raw.status : 'pending';

  return {
    id,
    date,
    item,
    requirementIntro:
      typeof raw.requirementIntro === 'string' && raw.requirementIntro.trim()
        ? raw.requirementIntro.trim()
        : `客戶需求以「${item}」為主軸，會先依用途與預算拆解再安排配置重點。`,
    youtubeEmbedUrl: typeof raw.youtubeEmbedUrl === 'string' ? raw.youtubeEmbedUrl.trim() : '',
    tags: tags.length > 0 ? tags : deriveOrderTags(item, [cpu, motherboard, ram, storage, gpu, psu, cooler, pcCase]),
    images,
    location,
    salePrice: Math.max(0, Math.trunc(toFiniteNumber(raw.salePrice))),
    serviceFee: Math.max(0, Math.trunc(toFiniteNumber(raw.serviceFee))),
    status,
    cpu,
    motherboard,
    ram,
    storage,
    gpu,
    psu,
    cooler,
    pcCase,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '',
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : '',
  };
};

export const normalizeAdminCategory = (value: unknown): AdminCategory | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  const summary = typeof raw.summary === 'string' ? raw.summary.trim() : '';
  const points = normalizeUnknownStringList(raw.points);

  if (!id || !title || !summary || points.length === 0) {
    return null;
  }

  const fallbackMeta = inferFallbackCategoryMeta(title, summary, points);
  const tags = normalizeUnknownStringList(raw.tags);
  const detailRecommendations = normalizeUnknownStringList(raw.detailRecommendations);
  const detailFaqs = normalizeCategoryFaqList(raw.detailFaqs);

  return {
    id,
    title,
    summary,
    primaryCategory:
      typeof raw.primaryCategory === 'string' && raw.primaryCategory.trim()
        ? raw.primaryCategory.trim()
        : fallbackMeta.primaryCategory,
    secondaryCategory:
      typeof raw.secondaryCategory === 'string' && raw.secondaryCategory.trim()
        ? raw.secondaryCategory.trim()
        : fallbackMeta.secondaryCategory,
    tags: tags.length > 0 ? tags : fallbackMeta.tags,
    points,
    detailIntro: typeof raw.detailIntro === 'string' && raw.detailIntro.trim() ? raw.detailIntro.trim() : summary,
    detailHeroImage: typeof raw.detailHeroImage === 'string' ? raw.detailHeroImage.trim() : '',
    detailRecommendations:
      detailRecommendations.length > 0
        ? detailRecommendations
        : [`先釐清 ${title} 的核心需求，再安排預算比例。`],
    detailFaqs:
      detailFaqs.length > 0
        ? detailFaqs
        : [
            {
              question: `${title} 適合新手嗎？`,
              answer: '可以，會先依需求說明拆解重點，再逐步確認。',
            },
          ],
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '',
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : '',
  };
};

export const toFiniteNumber = (value: unknown, fallback = 0): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return numeric;
};

export const formatCurrency = (value: number): string => {
  return `NT$ ${value.toLocaleString('zh-TW')}`;
};

export const parseYyyyMmDdDate = (value: string): Date | null => {
  const matched = value.trim().match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (!matched) {
    return null;
  }

  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

export const isDealDateFormat = (value: string): boolean => {
  return /^\d{4}\/(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])$/.test(value);
};

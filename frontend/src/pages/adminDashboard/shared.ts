import type { AdminUser } from '../../lib/adminAuth';

export type OrderStatus = 'pending' | 'shipping' | 'delivered' | 'cancelled';
export type InventoryCategory =
  | 'cpu'
  | 'motherboard'
  | 'gpu'
  | 'ram'
  | 'ssd'
  | 'hdd'
  | 'cooler'
  | 'psu'
  | 'case';
export type AdminTabKey =
  | 'siteContent'
  | 'builds'
  | 'categories'
  | 'orders'
  | 'procurements'
  | 'personalProcurements'
  | 'inventories';

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
  images: string[];
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

export interface AdminInventory {
  id: string;
  category: InventoryCategory;
  brand: string;
  productName: string;
  motherboardFormFactor: string;
  quantity: number;
  taxIncluded: boolean;
  retailPrice: number;
  costPrice: number;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoriesResponse {
  data: AdminInventory[];
}

export interface AdminProcurementItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  taxIncluded: boolean;
}

export interface AdminProcurement {
  id: string;
  date: string;
  peerName: string;
  supplierName: string;
  source: string;
  taxIncluded: boolean;
  settledThisWeek: boolean;
  items: AdminProcurementItem[];
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProcurementsResponse {
  data: AdminProcurement[];
}

export interface AdminPersonalProcurement {
  id: string;
  date: string;
  supplierName: string;
  source: string;
  taxIncluded: boolean;
  items: AdminProcurementItem[];
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalProcurementsResponse {
  data: AdminPersonalProcurement[];
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

export const procurementSettlementLabels = {
  settled: '已結清',
  unsettled: '未結清',
} as const;

export const inventoryCategoryLabels: Record<InventoryCategory, string> = {
  cpu: 'CPU',
  motherboard: '主機板',
  gpu: '顯示卡',
  ram: '記憶體',
  ssd: 'SSD',
  hdd: 'HDD',
  cooler: '散熱器',
  psu: '電源供應器',
  case: '機殼',
};

export const inventoryCategories: InventoryCategory[] = [
  'cpu',
  'motherboard',
  'gpu',
  'ram',
  'ssd',
  'hdd',
  'cooler',
  'psu',
  'case',
];

export const inventoryMotherboardFormFactors = ['ATX', 'MATX', 'ITX', 'E-ATX', 'SSI-EEB', '其他'];

export const inventoryBrandPresets: Record<InventoryCategory, string[]> = {
  cpu: ['Intel', 'AMD'],
  motherboard: ['ASUS', 'Gigabyte', 'MSI', 'ASRock'],
  gpu: ['ASUS', 'Gigabyte', 'MSI', 'ASRock', 'ZOTAC', 'GALAX', 'Sapphire', 'PowerColor'],
  ram: ['Kingston', 'Corsair', 'G.SKILL', 'Team', 'ADATA'],
  ssd: ['Samsung', 'WD', 'Crucial', 'Kingston', 'ADATA', 'Solidigm'],
  hdd: ['Seagate', 'WD', 'Toshiba'],
  cooler: ['Thermalright', 'Noctua', 'DeepCool', 'Cooler Master', 'NZXT', 'Corsair'],
  psu: ['Seasonic', 'Corsair', 'FSP', 'Cooler Master', 'Super Flower', 'Antec'],
  case: ['Lian Li', 'Montech', 'Fractal', 'Darkflash', 'NZXT', 'Cooler Master'],
};

export const adminTabOptions: Array<{ key: AdminTabKey; label: string }> = [
  { key: 'siteContent', label: '網站內容管理' },
  { key: 'builds', label: '推薦配單管理' },
  { key: 'categories', label: '分類總覽管理' },
  { key: 'orders', label: '訂單管理' },
  { key: 'procurements', label: '同行拿貨紀錄' },
  { key: 'personalProcurements', label: '公司進貨紀錄' },
  { key: 'inventories', label: '庫存管理' },
];

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

export interface InventoryFormState {
  category: InventoryCategory;
  brand: string;
  productName: string;
  motherboardFormFactor: string;
  quantityText: string;
  taxIncluded: boolean;
  retailPriceText: string;
  costPriceText: string;
  note: string;
}

export interface ProcurementFormState {
  date: string;
  peerName: string;
  supplierName: string;
  source: string;
  taxIncluded: boolean;
  settledThisWeek: boolean;
  note: string;
}

export interface PersonalProcurementFormState {
  date: string;
  supplierName: string;
  source: string;
  taxIncluded: boolean;
  note: string;
}

export interface ProcurementItemFormState {
  productName: string;
  quantityText: string;
  unitPriceText: string;
  taxIncluded: boolean;
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

export interface AdminBrandPortfolio {
  id: string;
  name: string;
  tagline: string;
  focus: string[];
  tags: string[];
  images: string[];
}

export interface AdminSiteContent {
  homeHeroKicker: string;
  homeHeroTitle: string;
  homeHeroSubtitle: string;
  homeCategorySubtitle: string;
  homeBuildSubtitle: string;
  homeWorkflowSubtitle: string;
  homeContactSubtitle: string;
  homeStats: AdminSiteStat[];
  categoriesHeroSubtitle: string;
  categoriesQuickTags: string[];
  categoriesPortfolioTitle: string;
  categoriesPortfolioSubtitle: string;
  categoriesBrandPortfolios: AdminBrandPortfolio[];
  brandHeroTitle: string;
  brandHeroSubtitle: string;
  shipmentTagCatalog: string[];
  shippingSteps: AdminShippingStep[];
  serviceHighlights: string[];
  testimonials: AdminTestimonial[];
  contactChannels: AdminContactChannel[];
  footerAddress: string;
  footerSlogan: string;
  contactAddress: string;
  contactPhone: string;
  contactLine: string;
  updatedAt: string;
}

export interface SiteContentResponse {
  data: AdminSiteContent;
}

export interface SiteContentFormState {
  homeHeroKicker: string;
  homeHeroTitle: string;
  homeHeroSubtitle: string;
  homeCategorySubtitle: string;
  homeBuildSubtitle: string;
  homeWorkflowSubtitle: string;
  homeContactSubtitle: string;
  homeStats: AdminSiteStat[];
  categoriesHeroSubtitle: string;
  categoriesQuickTagsText: string;
  categoriesPortfolioTitle: string;
  categoriesPortfolioSubtitle: string;
  categoriesBrandPortfolios: AdminBrandPortfolio[];
  brandHeroTitle: string;
  brandHeroSubtitle: string;
  shipmentTagCatalogText: string;
  shippingSteps: AdminShippingStep[];
  serviceHighlightsText: string;
  testimonials: AdminTestimonial[];
  contactChannels: AdminContactChannel[];
  footerAddress: string;
  footerSlogan: string;
  contactAddress: string;
  contactPhone: string;
  contactLine: string;
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

export const defaultInventoryForm: InventoryFormState = {
  category: 'cpu',
  brand: '',
  productName: '',
  motherboardFormFactor: '',
  quantityText: '0',
  taxIncluded: true,
  retailPriceText: '',
  costPriceText: '',
  note: '',
};

export const defaultProcurementForm: ProcurementFormState = {
  date: '',
  peerName: '',
  supplierName: '',
  source: '',
  taxIncluded: true,
  settledThisWeek: false,
  note: '',
};

export const defaultPersonalProcurementForm: PersonalProcurementFormState = {
  date: '',
  supplierName: '',
  source: '',
  taxIncluded: true,
  note: '',
};

export const defaultSiteContentForm: SiteContentFormState = {
  homeHeroKicker: '',
  homeHeroTitle: '',
  homeHeroSubtitle: '',
  homeCategorySubtitle: '',
  homeBuildSubtitle: '',
  homeWorkflowSubtitle: '',
  homeContactSubtitle: '',
  homeStats: [],
  categoriesHeroSubtitle: '',
  categoriesQuickTagsText: '',
  categoriesPortfolioTitle: '',
  categoriesPortfolioSubtitle: '',
  categoriesBrandPortfolios: [],
  brandHeroTitle: '',
  brandHeroSubtitle: '',
  shipmentTagCatalogText: '',
  shippingSteps: [],
  serviceHighlightsText: '',
  testimonials: [],
  contactChannels: [],
  footerAddress: '',
  footerSlogan: '',
  contactAddress: '',
  contactPhone: '',
  contactLine: '',
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

export const createEmptyBrandPortfolio = (): AdminBrandPortfolio => ({
  id: '',
  name: '',
  tagline: '',
  focus: [],
  tags: [],
  images: [],
});

export const BUILD_PAGE_SIZE = 9;
export const CATEGORY_PAGE_SIZE = 9;
export const ORDER_PAGE_SIZE = 9;
export const PROCUREMENT_PAGE_SIZE = 9;
export const PERSONAL_PROCUREMENT_PAGE_SIZE = 9;
export const INVENTORY_PAGE_SIZE = 9;
export const WEEKLY_PROCUREMENT_PAGE_SIZE = 8;

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

export const splitCommaList = (input: string): string[] => {
  return input
    .split(/[,，]/)
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

export const createDefaultProcurementItems = (taxIncluded = true): ProcurementItemFormState[] => [
  {
    productName: '',
    quantityText: '1',
    unitPriceText: '',
    taxIncluded,
  },
];

export const createDefaultPersonalProcurementItems = (taxIncluded = true): ProcurementItemFormState[] => [
  {
    productName: '',
    quantityText: '1',
    unitPriceText: '',
    taxIncluded,
  },
];

export const splitStorageItems = (input: string): string[] => {
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

export const isInventoryCategory = (value: unknown): value is InventoryCategory => {
  return inventoryCategories.includes(value as InventoryCategory);
};

export const normalizeAdminInventory = (value: unknown): AdminInventory | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  const category = raw.category;
  const brand = typeof raw.brand === 'string' ? raw.brand.trim() : '';
  const productName = typeof raw.productName === 'string' ? raw.productName.trim() : '';
  const quantity = Number(raw.quantity);
  const retailPrice = Number(raw.retailPrice);
  const costPrice = Number(raw.costPrice);
  const taxIncluded = typeof raw.taxIncluded === 'boolean' ? raw.taxIncluded : true;

  if (
    !id ||
    !isInventoryCategory(category) ||
    !brand ||
    !productName ||
    !Number.isInteger(quantity) ||
    quantity < 0 ||
    !Number.isFinite(retailPrice) ||
    retailPrice < 0 ||
    !Number.isFinite(costPrice) ||
    costPrice < 0
  ) {
    return null;
  }

  return {
    id,
    category,
    brand,
    productName,
    motherboardFormFactor: typeof raw.motherboardFormFactor === 'string' ? raw.motherboardFormFactor.trim().toUpperCase() : '',
    quantity: Math.trunc(quantity),
    taxIncluded,
    retailPrice: Math.trunc(retailPrice),
    costPrice: Math.trunc(costPrice),
    note: typeof raw.note === 'string' ? raw.note.trim() : '',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '',
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : '',
  };
};

export const normalizeAdminProcurementItem = (
  value: unknown,
  defaultTaxIncluded: boolean,
): AdminProcurementItem | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const productName = typeof raw.productName === 'string' ? raw.productName.trim() : '';
  const quantity = Number(raw.quantity);
  const unitPrice = Number(raw.unitPrice);
  const taxIncluded = typeof raw.taxIncluded === 'boolean' ? raw.taxIncluded : defaultTaxIncluded;

  if (!productName || !Number.isInteger(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
    return null;
  }

  return {
    productName,
    quantity: Math.trunc(quantity),
    unitPrice: Math.trunc(unitPrice),
    taxIncluded,
  };
};

export const normalizeAdminProcurement = (value: unknown): AdminProcurement | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  const date = typeof raw.date === 'string' ? raw.date.trim() : '';
  const peerName = typeof raw.peerName === 'string' ? raw.peerName.trim() : '';
  const supplierName = typeof raw.supplierName === 'string' ? raw.supplierName.trim() : '';
  const source = typeof raw.source === 'string' ? raw.source.trim() : '';
  const procurementTaxIncluded = Boolean(raw.taxIncluded);
  const items = Array.isArray(raw.items)
    ? raw.items
        .map((item) => normalizeAdminProcurementItem(item, procurementTaxIncluded))
        .filter((item): item is AdminProcurementItem => item !== null)
    : [];

  if (!id || !date || !peerName || !supplierName || !source || items.length === 0) {
    return null;
  }

  return {
    id,
    date,
    peerName,
    supplierName,
    source,
    taxIncluded: procurementTaxIncluded,
    settledThisWeek: Boolean(raw.settledThisWeek),
    items,
    note: typeof raw.note === 'string' ? raw.note.trim() : '',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '',
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : '',
  };
};

export const normalizeAdminPersonalProcurement = (value: unknown): AdminPersonalProcurement | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  const date = typeof raw.date === 'string' ? raw.date.trim() : '';
  const supplierName = typeof raw.supplierName === 'string' ? raw.supplierName.trim() : '';
  const source = typeof raw.source === 'string' ? raw.source.trim() : '';
  const defaultTaxIncluded = Boolean(raw.taxIncluded);
  const items = Array.isArray(raw.items)
    ? raw.items
        .map((item) => normalizeAdminProcurementItem(item, defaultTaxIncluded))
        .filter((item): item is AdminProcurementItem => item !== null)
    : [];

  if (!id || !date || !supplierName || !source || items.length === 0) {
    return null;
  }

  return {
    id,
    date,
    supplierName,
    source,
    taxIncluded: defaultTaxIncluded,
    items,
    note: typeof raw.note === 'string' ? raw.note.trim() : '',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '',
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : '',
  };
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

export const escapeHtml = (value: string): string => {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
};

export const formatSignedCurrency = (value: number): string => {
  return `${value > 0 ? '+' : ''}NT$ ${value.toLocaleString('zh-TW')}`;
};

export const calculateUntaxedPrice = (price: number, taxIncluded: boolean): number => {
  if (!taxIncluded) {
    return Math.max(0, Math.trunc(price));
  }

  return Math.max(0, Math.round(price / 1.05));
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

export const getWeekStartDate = (date: Date): Date => {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

export const isSameWeekDate = (left: Date, right: Date): boolean => {
  return getWeekStartDate(left).getTime() === getWeekStartDate(right).getTime();
};

export const getQuoteNumber = (order: AdminOrder): string => {
  const quoteDate = order.date.replace(/\D/g, '').slice(0, 8);
  const fallbackDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const safeDate = quoteDate || fallbackDate;
  const safeId = order.id.replace(/[^a-z0-9]/gi, '').slice(-6).toUpperCase() || '000000';
  return `QT-${safeDate}-${safeId}`;
};

export const isDealDateFormat = (value: string): boolean => {
  return /^\d{4}\/(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])$/.test(value);
};

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Pool, type PoolClient } from 'pg';
import { fileURLToPath } from 'node:url';

import { hashPassword } from './auth.ts';
import type {
  BlogArticleSectionRecord,
  BlogPostRecord,
  BuildRecord,
  CategoryRecord,
  DbSchema,
  InventoryCategory,
  InventoryRecord,
  OrderRecord,
  PersonalProcurementRecord,
  ProcurementRecord,
  PublicUser,
  SiteContentRecord,
  UserRecord,
} from './types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIRECTORY = path.resolve(__dirname, '../../data');
const LEGACY_JSON_FILE = path.resolve(DATA_DIRECTORY, 'db.json');
const DEFAULT_POSTGRES_URL = 'postgresql://postgres:postgres@127.0.0.1:5432/nszpc';

let writeQueue: Promise<void> = Promise.resolve();
let pgPool: Pool | null = null;

const now = (): string => new Date().toISOString();

const asString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const normalizeStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map((item) => asString(item)).filter(Boolean))];
};

const normalizeUsers = (value: unknown): UserRecord[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const typed = item as Record<string, unknown>;
      const id = asString(typed.id);
      const username = asString(typed.username);
      const passwordHash = asString(typed.passwordHash);
      const role = asString(typed.role) || 'admin';
      const createdAt = asString(typed.createdAt) || now();

      if (!id || !username || !passwordHash) {
        return null;
      }

      return {
        id,
        username,
        passwordHash,
        role,
        createdAt,
      };
    })
    .filter((item): item is UserRecord => item !== null);
};

const DEAL_DATE_PATTERN = /^\d{4}\/(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])$/;
const BLOG_DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

const getTodayDealDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

const getTodayBlogDate = (): string => {
  return new Date().toISOString().slice(0, 10);
};

const normalizeBuilds = (value: unknown): BuildRecord[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const typed = item as Record<string, unknown>;
      const id = asString(typed.id);
      const name = asString(typed.name);
      const description = asString(typed.description);
      const image = asString(typed.image);
      const price = Number(typed.price);
      const rawDealDate = asString(typed.dealDate);
      const dealDate = DEAL_DATE_PATTERN.test(rawDealDate) ? rawDealDate : getTodayDealDate();
      const specs = normalizeStringList(typed.specs);
      const tags = normalizeStringList(typed.tags);

      if (!id || !name || !description || !image || !Number.isFinite(price) || price <= 0) {
        return null;
      }

      return {
        id,
        name,
        description,
        detailIntro: asString(typed.detailIntro) || description,
        requirementIntro:
          asString(typed.requirementIntro) || '此配單會先依用途與預算拆解需求，再安排升級路線。',
        youtubeEmbedUrl: asString(typed.youtubeEmbedUrl),
        price: Math.trunc(price),
        dealDate,
        badge: asString(typed.badge),
        tags,
        image,
        cpu: asString(typed.cpu) || '待補充',
        motherboard: asString(typed.motherboard) || '待補充',
        ram: asString(typed.ram) || '待補充',
        storage: asString(typed.storage) || '待補充',
        gpu: asString(typed.gpu) || '待補充',
        psu: asString(typed.psu) || '待補充',
        pcCase: asString(typed.pcCase) || '待補充',
        accessories: normalizeStringList(typed.accessories),
        specs,
        createdAt: asString(typed.createdAt) || now(),
        updatedAt: asString(typed.updatedAt) || now(),
      };
    })
    .filter((item): item is BuildRecord => item !== null);
};

const inventoryCategorySet = new Set<InventoryCategory>([
  'cpu',
  'motherboard',
  'gpu',
  'ram',
  'ssd',
  'hdd',
  'cooler',
  'psu',
  'case',
]);

const brandTagPreset: Record<string, string[]> = {
  darkflash: ['白色主題', 'ARGB', '玻璃側透', '機殼整線'],
  asus: ['ROG 生態', '高效能', '電競', '主板調校'],
  montech: ['高 CP 值', '散熱效率', '預算配單', '升級彈性'],
  lianli: ['質感機殼', '雙艙設計', '模組化', '水冷擴充'],
};

const deriveBrandTags = (id: string, name: string, focus: string[]): string[] => {
  const preset = brandTagPreset[id.toLowerCase()];
  if (preset && preset.length > 0) {
    return preset;
  }

  const fromFocus = focus.flatMap((item) =>
    item
      .split(/[\s,，、/／]+/)
      .map((part) => part.trim())
      .filter(Boolean),
  );

  const fallback = [name, ...fromFocus.slice(0, 5)];
  return [...new Set(fallback)].filter(Boolean);
};

const categoryDetailHeroImages = [
  '/images/carousel/IMG_6486.JPG',
  '/images/carousel/IMG_6158.JPG',
  '/images/carousel/IMG_6544.JPG',
  '/images/carousel/IMG_4722.JPG',
];

const defaultCategoryDetails = (
  title: string,
  summary: string,
  points: string[],
  index: number,
): Pick<
  CategoryRecord,
  'detailIntro' | 'detailHeroImage' | 'detailRecommendations' | 'detailFaqs'
> => {
  const firstPoint = points[0] || '使用情境評估';

  return {
    detailIntro: `${summary} 我們會先確認實際需求，再提供可直接執行的配單方向。`,
    detailHeroImage: categoryDetailHeroImages[index % categoryDetailHeroImages.length],
    detailRecommendations: [
      `先釐清 ${title} 的優先目標，預算會更有效率。`,
      `先確定「${firstPoint}」這類核心需求，再安排升級順序。`,
      '建議預留後續 6-12 個月擴充空間，避免重複換料。',
    ],
    detailFaqs: [
      {
        question: `${title} 適合新手嗎？`,
        answer: '可以，會依用途拆解成可理解的選配層級，再逐步確認。',
      },
      {
        question: '後續升級會不會卡規格？',
        answer: '配單時會同步檢查主板擴充性與電供餘裕，降低升級阻力。',
      },
    ],
  };
};

const inferFallbackCategoryMeta = (
  title: string,
  summary: string,
  points: string[],
): Pick<CategoryRecord, 'primaryCategory' | 'secondaryCategory' | 'tags'> => {
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

const normalizeCategoryFaqs = (value: unknown): CategoryRecord['detailFaqs'] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const typed = item as Record<string, unknown>;
      const question = asString(typed.question);
      const answer = asString(typed.answer);
      if (!question || !answer) {
        return null;
      }

      return { question, answer };
    })
    .filter((item): item is CategoryRecord['detailFaqs'][number] => item !== null);
};

const normalizeCategories = (value: unknown): CategoryRecord[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const typed = item as Record<string, unknown>;
      const id = asString(typed.id);
      const title = asString(typed.title);
      const summary = asString(typed.summary);
      const points = normalizeStringList(typed.points);

      if (!id || !title || !summary || points.length === 0) {
        return null;
      }

      const fallbackDetail = defaultCategoryDetails(title, summary, points, index);
      const fallbackMeta = inferFallbackCategoryMeta(title, summary, points);
      const detailRecommendations = normalizeStringList(typed.detailRecommendations);
      const detailFaqs = normalizeCategoryFaqs(typed.detailFaqs);
      const tags = normalizeStringList(typed.tags);

      return {
        id,
        title,
        summary,
        primaryCategory: asString(typed.primaryCategory) || fallbackMeta.primaryCategory,
        secondaryCategory: asString(typed.secondaryCategory) || fallbackMeta.secondaryCategory,
        tags: tags.length > 0 ? tags : fallbackMeta.tags,
        points,
        detailIntro: asString(typed.detailIntro) || fallbackDetail.detailIntro,
        detailHeroImage: asString(typed.detailHeroImage) || fallbackDetail.detailHeroImage,
        detailRecommendations:
          detailRecommendations.length > 0
            ? detailRecommendations
            : fallbackDetail.detailRecommendations,
        detailFaqs: detailFaqs.length > 0 ? detailFaqs : fallbackDetail.detailFaqs,
        createdAt: asString(typed.createdAt) || now(),
        updatedAt: asString(typed.updatedAt) || now(),
      };
    })
    .filter((item): item is CategoryRecord => item !== null);
};

const orderStatusSet = new Set(['pending', 'shipping', 'delivered', 'cancelled']);

const normalizeOrderStatus = (value: unknown): OrderRecord['status'] => {
  const normalized = asString(value).toLowerCase();
  if (orderStatusSet.has(normalized)) {
    return normalized as OrderRecord['status'];
  }

  return 'pending';
};

const deriveOrderTags = (item: string, fields: string[]): string[] => {
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

const normalizeOrders = (value: unknown): OrderRecord[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const typed = item as Record<string, unknown>;
      const id = asString(typed.id);
      const date = asString(typed.date);
      const orderItem = asString(typed.item);
      const requirementIntro = asString(typed.requirementIntro);
      const location = asString(typed.location);
      const tags = normalizeStringList(typed.tags);
      const cpu = asString(typed.cpu) || '待補充';
      const motherboard = asString(typed.motherboard) || '待補充';
      const ram = asString(typed.ram) || '待補充';
      const storage = asString(typed.storage) || '待補充';
      const gpu = asString(typed.gpu) || '待補充';
      const psu = asString(typed.psu) || '待補充';
      const cooler = asString(typed.cooler) || '待補充';
      const pcCase = asString(typed.pcCase) || '待補充';

      if (!id || !date || !orderItem || !location) {
        return null;
      }

      return {
        id,
        date,
        item: orderItem,
        requirementIntro: requirementIntro || `客戶需求以「${orderItem}」為核心，配單會先依用途與預算拆解後再規劃。`,
        youtubeEmbedUrl: asString(typed.youtubeEmbedUrl),
        tags: tags.length > 0 ? tags : deriveOrderTags(orderItem, [cpu, motherboard, ram, storage, gpu, psu, cooler, pcCase]),
        location,
        salePrice: Math.max(0, Math.trunc(Number(typed.salePrice) || 0)),
        serviceFee: Math.max(0, Math.trunc(Number(typed.serviceFee) || 0)),
        status: normalizeOrderStatus(typed.status),
        cpu,
        motherboard,
        ram,
        storage,
        gpu,
        psu,
        cooler,
        pcCase,
        createdAt: asString(typed.createdAt) || now(),
        updatedAt: asString(typed.updatedAt) || now(),
      };
    })
    .filter((item): item is OrderRecord => item !== null);
};

const normalizeBlogSections = (value: unknown): BlogArticleSectionRecord[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const typed = item as Record<string, unknown>;
      const heading = asString(typed.heading);
      const paragraphs = normalizeStringList(typed.paragraphs);
      const bullets = normalizeStringList(typed.bullets);
      if (!heading || paragraphs.length === 0) {
        return null;
      }

      return {
        heading,
        paragraphs,
        bullets,
      };
    })
    .filter((item): item is BlogArticleSectionRecord => item !== null);
};

const normalizeBlogPosts = (value: unknown): BlogPostRecord[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const typed = item as Record<string, unknown>;
      const id = asString(typed.id);
      const slug = asString(typed.slug).toLowerCase();
      const title = asString(typed.title);
      const summary = asString(typed.summary);
      const coverImage = asString(typed.coverImage);
      const rawPublishedAt = asString(typed.publishedAt);
      const rawUpdatedAt = asString(typed.updatedAt);
      const readingMinutes = Number(typed.readingMinutes);

      if (!id || !slug || !title || !summary || !coverImage) {
        return null;
      }

      const publishedAt = BLOG_DATE_PATTERN.test(rawPublishedAt) ? rawPublishedAt : getTodayBlogDate();
      const updatedAt = BLOG_DATE_PATTERN.test(rawUpdatedAt) ? rawUpdatedAt : publishedAt;
      const tags = normalizeStringList(typed.tags);
      const sections = normalizeBlogSections(typed.sections);

      return {
        id,
        slug,
        title,
        summary,
        coverImage,
        publishedAt,
        updatedAt,
        authorName: asString(typed.authorName) || 'NSZPC 技術團隊',
        readingMinutes: Number.isInteger(readingMinutes) && readingMinutes > 0 ? readingMinutes : 5,
        tags: tags.length > 0 ? tags : ['技術文章'],
        youtubeEmbedUrl: asString(typed.youtubeEmbedUrl),
        sections:
          sections.length > 0
            ? sections
            : [
                {
                  heading: '重點整理',
                  paragraphs: [summary],
                  bullets: [],
                },
              ],
        createdAt: asString(typed.createdAt) || now(),
      };
    })
    .filter((item): item is BlogPostRecord => item !== null)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.title.localeCompare(b.title));
};

const normalizeInventoryCategory = (value: unknown): InventoryCategory => {
  const normalized = asString(value).toLowerCase();
  if (inventoryCategorySet.has(normalized as InventoryCategory)) {
    return normalized as InventoryCategory;
  }

  return 'cpu';
};

const normalizeInventories = (value: unknown): InventoryRecord[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const typed = item as Record<string, unknown>;
      const id = asString(typed.id);
      const brand = asString(typed.brand);
      const productName = asString(typed.productName);
      const quantity = Number(typed.quantity);
      const retailPrice = Number(typed.retailPrice);
      const costPrice = Number(typed.costPrice);

      if (
        !id ||
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
        category: normalizeInventoryCategory(typed.category),
        brand,
        productName,
        motherboardFormFactor: asString(typed.motherboardFormFactor).toUpperCase(),
        quantity: Math.max(0, Math.trunc(quantity)),
        taxIncluded: typeof typed.taxIncluded === 'boolean' ? typed.taxIncluded : true,
        retailPrice: Math.max(0, Math.trunc(retailPrice)),
        costPrice: Math.max(0, Math.trunc(costPrice)),
        note: asString(typed.note),
        createdAt: asString(typed.createdAt) || now(),
        updatedAt: asString(typed.updatedAt) || now(),
      };
    })
    .filter((item): item is InventoryRecord => item !== null)
    .sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }

      if (a.brand !== b.brand) {
        return a.brand.localeCompare(b.brand);
      }

      return a.productName.localeCompare(b.productName);
    });
};

const normalizeProcurementItems = (
  value: unknown,
  defaultTaxIncluded: boolean,
): ProcurementRecord['items'] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const typed = item as Record<string, unknown>;
      const productName = asString(typed.productName);
      const quantity = Number(typed.quantity);
      const unitPrice = Number(typed.unitPrice);
      const taxIncluded = typeof typed.taxIncluded === 'boolean' ? typed.taxIncluded : defaultTaxIncluded;

      if (
        !productName ||
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(unitPrice) ||
        unitPrice < 0
      ) {
        return null;
      }

      return {
        productName,
        quantity: Math.trunc(quantity),
        unitPrice: Math.trunc(unitPrice),
        taxIncluded,
      };
    })
    .filter((item): item is ProcurementRecord['items'][number] => item !== null);
};

const normalizeProcurements = (value: unknown): ProcurementRecord[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const typed = item as Record<string, unknown>;
      const id = asString(typed.id);
      const date = asString(typed.date);
      const peerName = asString(typed.peerName);
      const supplierName = asString(typed.supplierName);
      const source = asString(typed.source);
      const taxIncluded = Boolean(typed.taxIncluded);
      const items = normalizeProcurementItems(typed.items, taxIncluded);

      if (!id || !date || !peerName || !supplierName || !source || items.length === 0) {
        return null;
      }

      return {
        id,
        date,
        peerName,
        supplierName,
        source,
        taxIncluded,
        settledThisWeek: Boolean(typed.settledThisWeek),
        items,
        note: asString(typed.note),
        createdAt: asString(typed.createdAt) || now(),
        updatedAt: asString(typed.updatedAt) || now(),
      };
    })
    .filter((item): item is ProcurementRecord => item !== null)
    .sort((a, b) => b.date.localeCompare(a.date) || a.peerName.localeCompare(b.peerName));
};

const normalizePersonalProcurements = (value: unknown): PersonalProcurementRecord[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const typed = item as Record<string, unknown>;
      const id = asString(typed.id);
      const date = asString(typed.date);
      const supplierName = asString(typed.supplierName);
      const source = asString(typed.source);
      const taxIncluded = Boolean(typed.taxIncluded);
      const items = normalizeProcurementItems(typed.items, taxIncluded);

      if (!id || !date || !supplierName || !source || items.length === 0) {
        return null;
      }

      return {
        id,
        date,
        supplierName,
        source,
        taxIncluded,
        items,
        note: asString(typed.note),
        createdAt: asString(typed.createdAt) || now(),
        updatedAt: asString(typed.updatedAt) || now(),
      };
    })
    .filter((item): item is PersonalProcurementRecord => item !== null)
    .sort((a, b) => b.date.localeCompare(a.date) || a.supplierName.localeCompare(b.supplierName));
};

const baseSiteContent = (): Omit<SiteContentRecord, 'updatedAt'> => ({
  homeHeroKicker: 'Kaohsiung Custom PC Builder',
  homeHeroTitle: '你的主機不只要跑得快，還要看起來就是你的風格。',
  homeHeroSubtitle:
    'NSZPC 以實際使用情境做配單，從效能、散熱、噪音到外觀同步規劃，讓你第一次組機就走在對的升級路線上。',
  homeCategorySubtitle: '先選方向，再看細節，會比一開始就盯規格更快找到答案。',
  homeBuildSubtitle: '可直接下單，也可再微調外觀、儲存容量和散熱配置。',
  homeWorkflowSubtitle: '每台主機都遵循固定流程，目標是讓你收到機器時就能穩定投入工作或遊戲。',
  homeContactSubtitle: '想問配單、交期或升級都可以直接私訊，會在工作時間內盡快回覆。',
  homeStats: [
    { value: '600+', label: '累積組裝案例' },
    { value: '48h', label: '平均報價回覆' },
    { value: '4.9/5', label: 'Google 在地評價' },
  ],
  categoriesHeroSubtitle: '依照使用情境整理分類，點進去可查看需求重點與建議方向。',
  categoriesQuickTags: ['電競高幀率', '直播剪輯', 'AI 算圖', '白色主題', '靜音工作站', '小型機殼'],
  categoriesPortfolioTitle: '品牌機殼作品集',
  categoriesPortfolioSubtitle:
    '每個品牌都整理了核心重點與實拍縮圖，直接在分類總覽比較最直覺。',
  categoriesBrandPortfolios: [
    {
      id: 'darkflash',
      name: 'Darkflash 作品集',
      tagline: '白色主題與玻璃側透的高人氣方案',
      focus: ['ARGB 整體燈效同步', '前後風道平衡', '電源倉與線材遮蔽優化'],
      tags: ['白色主題', 'ARGB', '玻璃側透', '機殼整線'],
      images: [
        '/images/carousel/IMG_4722.JPG',
        '/images/carousel/IMG_4730.JPG',
        '/images/carousel/IMG_6165.JPG',
      ],
    },
    {
      id: 'asus',
      name: 'ASUS 系列作品集',
      tagline: 'ROG 生態整合，效能與外觀一致化',
      focus: ['ROG BIOS 調校', '高負載溫控曲線', '同步驅動版本管理'],
      tags: ['ROG 生態', '高效能', '電競', '主板調校'],
      images: [
        '/images/carousel/IMG_4729.JPG',
        '/images/carousel/IMG_6158.JPG',
        '/images/carousel/IMG_6477.JPG',
      ],
    },
    {
      id: 'montech',
      name: 'Montech 系列作品集',
      tagline: '高 CP 值與散熱效率並重',
      focus: ['預算效率最大化', '散熱壓測驗證', '升級路線清楚'],
      tags: ['高 CP 值', '散熱效率', '預算配單', '升級彈性'],
      images: [
        '/images/carousel/IMG_6159.JPG',
        '/images/carousel/IMG_6486.JPG',
        '/images/carousel/IMG_6488.JPG',
      ],
    },
    {
      id: 'lianli',
      name: 'Lian Li 系列作品集',
      tagline: '鋁件質感與模組化機殼配置',
      focus: ['模組化風扇配置', '雙艙視覺比例', '進階水冷預留空間'],
      tags: ['質感機殼', '雙艙設計', '模組化', '水冷擴充'],
      images: [
        '/images/carousel/IMG_4730.JPG',
        '/images/carousel/IMG_6165.JPG',
        '/images/carousel/IMG_6544.JPG',
      ],
    },
  ],
  brandHeroTitle: '近期出機',
  brandHeroSubtitle: '依近期實際出機案例整理，包含需求重點與配備說明。',
  shipmentTagCatalog: [
    '4K 遊戲',
    '2K 高刷',
    '高幀率',
    '電競',
    '直播用途',
    '創作工作站',
    'AI 生成',
    '白色主題',
    '企業部署',
    'SFF 小型',
    '旗艦效能',
    '主流效能',
  ],
  shippingSteps: [
    {
      title: '需求訪談',
      description: '先確認遊戲、創作軟體、預算與外觀風格，避免錯配。',
    },
    {
      title: '配置提案',
      description: '提供主配單與替代方案，清楚說明每項硬體取捨。',
    },
    {
      title: '組裝與壓測',
      description: '完成整線、風道調校與長時間壓力測試，確保穩定。',
    },
    {
      title: '出貨與售後',
      description: '提供驗機影片、保固資訊與後續升級建議。',
    },
  ],
  serviceHighlights: [
    '出貨前會提供壓測與驗機影片',
    '每張配單附替代方案，避免缺貨卡單',
    '提供後續升級優先順序，不走回頭路',
    '高雄在地可預約到店諮詢',
  ],
  testimonials: [
    {
      quote: '配單不是只看跑分，連噪音與桌面動線都一起考慮，成品很滿意。',
      name: 'Kai．影音剪輯師',
      tag: 'Studio Build',
    },
    {
      quote: '回訊速度很快，顯卡缺貨時也給了替代方案，沒有硬推高價料件。',
      name: 'Ryan．FPS 玩家',
      tag: 'Gaming Build',
    },
    {
      quote: '公司一次採購十台，規格與標籤整理得很完整，後續維護也省事。',
      name: 'Mia．工作室管理',
      tag: 'Business Batch',
    },
  ],
  contactChannels: [
    {
      icon: 'fa-brands fa-line',
      label: 'LINE',
      value: '@nightstarzpc',
      href: 'https://line.me/R/ti/p/@nightstarzpc',
    },
    {
      icon: 'fa-brands fa-facebook-f',
      label: 'Facebook',
      value: '星辰電腦 NSZPC',
      href: 'https://www.facebook.com/nightstarzpc/',
    },
    {
      icon: 'fa-brands fa-instagram',
      label: 'Instagram',
      value: '@nightstarzpc',
      href: 'https://www.instagram.com/nightstarzpc/',
    },
    {
      icon: 'fa-brands fa-youtube',
      label: 'YouTube',
      value: '星辰電腦 NSZPC',
      href: 'https://www.youtube.com/@nszpc8729',
    },
  ],
  footerAddress: '高雄市前鎮區凱旋三路 217 號',
  footerSlogan: 'Build with purpose. Tune for longevity.',
  contactAddress: '高雄市前鎮區凱旋三路 217 號',
  contactPhone: '07-000-0000',
  contactLine: '@nightstarzpc',
});

const defaultSiteContent = (): SiteContentRecord => ({
  ...baseSiteContent(),
  updatedAt: now(),
});

const normalizeSiteStats = (value: unknown): SiteContentRecord['homeStats'] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const typed = item as Record<string, unknown>;
      const statValue = asString(typed.value);
      const statLabel = asString(typed.label);
      if (!statValue || !statLabel) {
        return null;
      }

      return {
        value: statValue,
        label: statLabel,
      };
    })
    .filter((item): item is SiteContentRecord['homeStats'][number] => item !== null);
};

const normalizeShippingSteps = (value: unknown): SiteContentRecord['shippingSteps'] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const typed = item as Record<string, unknown>;
      const title = asString(typed.title);
      const description = asString(typed.description);
      if (!title || !description) {
        return null;
      }

      return { title, description };
    })
    .filter((item): item is SiteContentRecord['shippingSteps'][number] => item !== null);
};

const normalizeTestimonials = (value: unknown): SiteContentRecord['testimonials'] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const typed = item as Record<string, unknown>;
      const quote = asString(typed.quote);
      const name = asString(typed.name);
      const tag = asString(typed.tag);
      if (!quote || !name || !tag) {
        return null;
      }

      return { quote, name, tag };
    })
    .filter((item): item is SiteContentRecord['testimonials'][number] => item !== null);
};

const normalizeContactChannels = (value: unknown): SiteContentRecord['contactChannels'] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const typed = item as Record<string, unknown>;
      const icon = asString(typed.icon);
      const label = asString(typed.label);
      const channelValue = asString(typed.value);
      const href = asString(typed.href);
      if (!icon || !label || !channelValue || !href) {
        return null;
      }

      return { icon, label, value: channelValue, href };
    })
    .filter((item): item is SiteContentRecord['contactChannels'][number] => item !== null);
};

const normalizeBrandPortfolios = (value: unknown): SiteContentRecord['categoriesBrandPortfolios'] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const typed = item as Record<string, unknown>;
      const id = asString(typed.id);
      const name = asString(typed.name);
      const tagline = asString(typed.tagline);
      const focus = normalizeStringList(typed.focus);
      const images = normalizeStringList(typed.images);
      const tags = normalizeStringList(typed.tags);
      const resolvedTags = tags.length > 0 ? tags : deriveBrandTags(id, name, focus);

      if (!id || !name || !tagline || focus.length === 0 || images.length === 0 || resolvedTags.length === 0) {
        return null;
      }

      return { id, name, tagline, focus, images, tags: resolvedTags };
    })
    .filter((item): item is SiteContentRecord['categoriesBrandPortfolios'][number] => item !== null);
};

const normalizeSiteContent = (value: unknown): SiteContentRecord => {
  const fallback = defaultSiteContent();
  if (!value || typeof value !== 'object') {
    return fallback;
  }

  const raw = value as Record<string, unknown>;
  const legacyHeroTitle = asString(raw.heroTitle);
  const legacyHeroSubtitle = asString(raw.heroSubtitle);
  const legacyContactAddress = asString(raw.contactAddress);
  const legacyContactPhone = asString(raw.contactPhone);
  const legacyContactLine = asString(raw.contactLine);

  const homeStats = normalizeSiteStats(raw.homeStats);
  const categoriesQuickTags = normalizeStringList(raw.categoriesQuickTags);
  const categoriesBrandPortfolios = normalizeBrandPortfolios(raw.categoriesBrandPortfolios);
  const shipmentTagCatalog = normalizeStringList(raw.shipmentTagCatalog);
  const shippingSteps = normalizeShippingSteps(raw.shippingSteps);
  const serviceHighlights = normalizeStringList(raw.serviceHighlights);
  const testimonials = normalizeTestimonials(raw.testimonials);
  const contactChannels = normalizeContactChannels(raw.contactChannels);

  const resolvedContactChannels = contactChannels.length
    ? contactChannels
    : fallback.contactChannels.map((item, index) => {
        if (index === 0 && legacyContactLine) {
          return {
            ...item,
            value: legacyContactLine,
          };
        }

        return item;
      });

  const footerAddress = asString(raw.footerAddress) || legacyContactAddress || fallback.footerAddress;
  const contactAddress = asString(raw.contactAddress) || footerAddress;
  const contactLine = asString(raw.contactLine) || resolvedContactChannels[0]?.value || fallback.contactLine;

  return {
    homeHeroKicker: asString(raw.homeHeroKicker) || fallback.homeHeroKicker,
    homeHeroTitle: asString(raw.homeHeroTitle) || legacyHeroTitle || fallback.homeHeroTitle,
    homeHeroSubtitle: asString(raw.homeHeroSubtitle) || legacyHeroSubtitle || fallback.homeHeroSubtitle,
    homeCategorySubtitle: asString(raw.homeCategorySubtitle) || fallback.homeCategorySubtitle,
    homeBuildSubtitle: asString(raw.homeBuildSubtitle) || fallback.homeBuildSubtitle,
    homeWorkflowSubtitle: asString(raw.homeWorkflowSubtitle) || fallback.homeWorkflowSubtitle,
    homeContactSubtitle: asString(raw.homeContactSubtitle) || fallback.homeContactSubtitle,
    homeStats: homeStats.length ? homeStats : fallback.homeStats,
    categoriesHeroSubtitle: asString(raw.categoriesHeroSubtitle) || fallback.categoriesHeroSubtitle,
    categoriesQuickTags: categoriesQuickTags.length ? categoriesQuickTags : fallback.categoriesQuickTags,
    categoriesPortfolioTitle: asString(raw.categoriesPortfolioTitle) || fallback.categoriesPortfolioTitle,
    categoriesPortfolioSubtitle:
      asString(raw.categoriesPortfolioSubtitle) || fallback.categoriesPortfolioSubtitle,
    categoriesBrandPortfolios:
      categoriesBrandPortfolios.length ? categoriesBrandPortfolios : fallback.categoriesBrandPortfolios,
    brandHeroTitle: asString(raw.brandHeroTitle) || fallback.brandHeroTitle,
    brandHeroSubtitle: asString(raw.brandHeroSubtitle) || fallback.brandHeroSubtitle,
    shipmentTagCatalog: shipmentTagCatalog.length ? shipmentTagCatalog : fallback.shipmentTagCatalog,
    shippingSteps: shippingSteps.length ? shippingSteps : fallback.shippingSteps,
    serviceHighlights: serviceHighlights.length ? serviceHighlights : fallback.serviceHighlights,
    testimonials: testimonials.length ? testimonials : fallback.testimonials,
    contactChannels: resolvedContactChannels,
    footerAddress,
    footerSlogan: asString(raw.footerSlogan) || fallback.footerSlogan,
    contactAddress,
    contactPhone: asString(raw.contactPhone) || legacyContactPhone || fallback.contactPhone,
    contactLine,
    updatedAt: asString(raw.updatedAt) || fallback.updatedAt,
  };
};

const defaultDb = (adminUsername: string, adminPassword: string): DbSchema => {
  const adminId = crypto.randomUUID();

  return {
    meta: {
      createdAt: now(),
      updatedAt: now(),
      version: 1,
    },
    users: [
      {
        id: adminId,
        username: adminUsername,
        passwordHash: hashPassword(adminPassword),
        role: 'admin',
        createdAt: now(),
      },
    ],
    categories: [
      {
        id: crypto.randomUUID(),
        title: 'Darkflash 機殼系列',
        summary: '主打外觀與燈效，適合桌搭主題機。',
        primaryCategory: '主題機殼',
        secondaryCategory: '外觀與風道',
        tags: ['白色主題', 'ARGB', '玻璃側透', '整線'],
        points: ['現貨快速交期', '風道改造建議', '線材與燈效同步'],
        detailIntro:
          '聚焦白色主題、玻璃側透與燈效一致性，兼顧風道與實際散熱表現。',
        detailHeroImage: '/images/carousel/IMG_6486.JPG',
        detailRecommendations: [
          '先確定桌搭視覺方向，再反推機殼與風扇配置。',
          '優先規劃風道與整線，再調整燈效細節。',
          '預留至少 1-2 組擴充風扇位，方便後續升級。',
        ],
        detailFaqs: [
          {
            question: '白色主題會比較貴嗎？',
            answer: '通常會有些價差，但可用同級替代品控制總預算。',
          },
          {
            question: '燈效會不會很難調整？',
            answer: '會盡量統一控制生態，日常只需一套軟體即可管理。',
          },
        ],
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: crypto.randomUUID(),
        title: '核心零組件升級',
        summary: '顯示卡、記憶體、SSD 與電供配平建議。',
        primaryCategory: '零組件升級',
        secondaryCategory: '效能強化',
        tags: ['顯卡升級', '記憶體', 'SSD', '電供'],
        points: ['預算分配試算', '同價位替代方案', '舊機升級檢測'],
        detailIntro:
          '以體感效能為優先，從瓶頸檢測開始，避免無效堆料與預算浪費。',
        detailHeroImage: '/images/carousel/IMG_6158.JPG',
        detailRecommendations: [
          '先找出瓶頸零件，再安排升級優先順序。',
          '升級顯卡時同步檢查電供與散熱餘裕。',
          '評估主板與機殼相容性，避免升級卡規格。',
        ],
        detailFaqs: [
          {
            question: '只升級顯卡就夠了嗎？',
            answer: '要看 CPU 與電供是否同步成為瓶頸，通常會一起評估。',
          },
          {
            question: '升級後需要重灌系統嗎？',
            answer: '不一定，但更換核心平台時通常建議重整系統。',
          },
        ],
        createdAt: now(),
        updatedAt: now(),
      },
    ],
    builds: [
      {
        id: crypto.randomUUID(),
        name: 'NSZ Flux 4060',
        description: '主流 1080p 遊戲與日常直播配置。',
        detailIntro:
          '這台以 1080p 高幀率遊戲與日常直播為核心，優先兼顧穩定輸出、散熱效率與升級彈性。',
        requirementIntro:
          '適合想要一台兼顧遊戲與直播的新手玩家，會優先確保錄播流暢、畫面幀率與後續升級空間。',
        youtubeEmbedUrl: '',
        price: 36900,
        dealDate: '2026/02/09',
        badge: '熱銷',
        tags: ['直播', '剪輯', '多工'],
        image: '/images/carousel/IMG_4722.JPG',
        cpu: 'Ryzen 5 7600',
        ram: 'DDR5 32GB',
        storage: '1TB Gen4 SSD',
        gpu: 'RTX 4060',
        psu: '650W 80+ Gold',
        pcCase: 'Darkflash DRX White',
        specs: ['RTX 4060', 'Ryzen 5 7600', 'DDR5 32GB'],
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: crypto.randomUUID(),
        name: 'NSZ Apex 4070 Super',
        description: '2K 高刷新體驗，效能與散熱平衡。',
        detailIntro:
          '這台主打 2K 高刷新遊戲體驗，搭配穩定散熱與供電配置，適合長時間遊戲或實況需求。',
        requirementIntro:
          '如果你主要打 FPS、3A 遊戲，並希望保留未來顯卡或儲存升級彈性，這類配法會比較穩妥。',
        youtubeEmbedUrl: '',
        price: 53900,
        dealDate: '2026/02/08',
        badge: '推薦',
        tags: ['顯卡升級', 'SSD', '電供'],
        image: '/images/carousel/IMG_6486.JPG',
        cpu: 'Ryzen 7 7800X3D',
        ram: 'DDR5 32GB',
        storage: '2TB Gen4 SSD',
        gpu: 'RTX 4070 Super',
        psu: '750W 80+ Gold',
        pcCase: 'Darkflash DY470 White',
        specs: ['RTX 4070 Super', 'Ryzen 7 7800X3D', '2TB Gen4 SSD'],
        createdAt: now(),
        updatedAt: now(),
      },
    ].map((build) => ({
      ...build,
      motherboard: asString((build as { motherboard?: string }).motherboard) || '待補充',
      accessories: normalizeStringList((build as { accessories?: string[] }).accessories),
    })),
    orders: [
      {
        id: crypto.randomUUID(),
        date: '2026/02/12',
        item: 'RTX 5080 高階遊戲主機',
        location: '新北市',
        salePrice: 86900,
        status: 'delivered',
        cpu: 'Ryzen 7 9800X3D',
        ram: 'DDR5 64GB',
        storage: '2TB Gen4 SSD',
        gpu: 'RTX 5080',
        psu: '1000W 80+ Gold',
        pcCase: 'Lian Li O11 Vision White',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: crypto.randomUUID(),
        date: '2026/02/12',
        item: 'AI 影像生成工作站',
        location: '台北市',
        salePrice: 95800,
        status: 'shipping',
        cpu: 'Core Ultra 9 285K',
        ram: 'DDR5 96GB',
        storage: '4TB Gen4 SSD',
        gpu: 'RTX 5090',
        psu: '1200W 80+ Platinum',
        pcCase: 'Lian Li O11D EVO',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: crypto.randomUUID(),
        date: '2026/02/11',
        item: '白色雙艙直播主機',
        location: '桃園市',
        salePrice: 51800,
        status: 'delivered',
        cpu: 'Ryzen 7 7800X3D',
        ram: 'DDR5 32GB',
        storage: '2TB Gen4 SSD',
        gpu: 'RTX 4070 Ti Super',
        psu: '850W 80+ Gold',
        pcCase: 'Darkflash DY470 White',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: crypto.randomUUID(),
        date: '2026/02/11',
        item: '企業批量設計工作機',
        location: '新竹市',
        salePrice: 47200,
        status: 'shipping',
        cpu: 'Core i7-14700',
        ram: 'DDR5 64GB',
        storage: '2TB Gen4 SSD',
        gpu: 'RTX 4070 Super',
        psu: '850W 80+ Gold',
        pcCase: 'Fractal North',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: crypto.randomUUID(),
        date: '2026/02/10',
        item: '2K 電競高幀率主機',
        location: '台中市',
        salePrice: 38800,
        status: 'delivered',
        cpu: 'Ryzen 7 7700',
        ram: 'DDR5 32GB',
        storage: '1TB Gen4 SSD',
        gpu: 'RTX 4070',
        psu: '750W 80+ Gold',
        pcCase: 'Montech Air 903',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: crypto.randomUUID(),
        date: '2026/02/09',
        item: 'RTX 4070 Super 遊戲主機',
        location: '台北市',
        salePrice: 53900,
        status: 'delivered',
        cpu: 'Ryzen 7 7800X3D',
        ram: 'DDR5 32GB',
        storage: '2TB Gen4 SSD',
        gpu: 'RTX 4070 Super',
        psu: '750W 80+ Gold',
        pcCase: 'Darkflash DY470 White',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: crypto.randomUUID(),
        date: '2026/02/08',
        item: 'Intel 創作者剪輯主機',
        location: '台中市',
        salePrice: 62900,
        status: 'shipping',
        cpu: 'Core i7-14700K',
        ram: 'DDR5 64GB',
        storage: '2TB Gen4 SSD',
        gpu: 'RTX 4080 Super',
        psu: '850W 80+ Gold',
        pcCase: 'Fractal North',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: crypto.randomUUID(),
        date: '2026/02/07',
        item: 'AMD 創作渲染主機',
        location: '嘉義市',
        salePrice: 67800,
        status: 'pending',
        cpu: 'Ryzen 9 7950X',
        ram: 'DDR5 64GB',
        storage: '2TB Gen4 SSD',
        gpu: 'RTX 4080 Super',
        psu: '1000W 80+ Gold',
        pcCase: 'Lian Li Lancool 216',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: crypto.randomUUID(),
        date: '2026/02/06',
        item: '白色主題直播主機',
        location: '高雄市',
        salePrice: 32900,
        status: 'delivered',
        cpu: 'Ryzen 5 7600',
        ram: 'DDR5 32GB',
        storage: '1TB Gen4 SSD',
        gpu: 'RTX 4060 Ti',
        psu: '650W 80+ Gold',
        pcCase: 'Darkflash DRX White',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: crypto.randomUUID(),
        date: '2026/02/05',
        item: 'SFF 小型剪輯主機',
        location: '屏東市',
        salePrice: 35900,
        status: 'delivered',
        cpu: 'Core i5-14600K',
        ram: 'DDR5 32GB',
        storage: '1TB Gen4 SSD',
        gpu: 'RTX 4070',
        psu: '750W SFX 80+ Gold',
        pcCase: 'Lian Li A4-H2O',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: crypto.randomUUID(),
        date: '2026/02/04',
        item: '企業批量辦公工作站',
        location: '新竹市',
        salePrice: 28900,
        status: 'shipping',
        cpu: 'Core i5-14500',
        ram: 'DDR5 32GB',
        storage: '1TB Gen4 SSD',
        gpu: 'RTX 4060',
        psu: '650W 80+ Gold',
        pcCase: 'Montech Air 100',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: crypto.randomUUID(),
        date: '2026/02/03',
        item: '4K 剪輯與建模主機',
        location: '台南市',
        salePrice: 74200,
        status: 'pending',
        cpu: 'Core i9-14900K',
        ram: 'DDR5 96GB',
        storage: '4TB Gen4 SSD',
        gpu: 'RTX 4090',
        psu: '1000W 80+ Gold',
        pcCase: 'Lian Li O11 Dynamic',
        createdAt: now(),
        updatedAt: now(),
      },
    ].map((order) => {
      const motherboard = asString((order as { motherboard?: string }).motherboard) || '待補充';
      const cooler = asString((order as { cooler?: string }).cooler) || '待補充';
      const serviceFee = Math.max(
        0,
        Math.trunc(Number((order as { serviceFee?: number }).serviceFee) || 0),
      );

      return {
        ...order,
        motherboard,
        cooler,
        serviceFee,
        requirementIntro: `客戶需求以「${order.item}」為核心，配單會先依用途與預算拆解後再規劃。`,
        youtubeEmbedUrl: '',
        tags: deriveOrderTags(order.item, [
          order.cpu,
          motherboard,
          order.ram,
          order.storage,
          order.gpu,
          order.psu,
          cooler,
          order.pcCase,
        ]),
      };
    }),
    blogPosts: [
      {
        id: crypto.randomUUID(),
        slug: 'gaming-pc-budget-allocation-guide',
        title: '遊戲主機預算怎麼分：先抓顯卡，再回推整體平台',
        summary:
          '整理 3 萬、5 萬、8 萬級距的配單邏輯，避免把預算花在體感差異小的零件。',
        coverImage: '/images/carousel/IMG_6486.JPG',
        publishedAt: '2026-02-20',
        updatedAt: '2026-02-20',
        authorName: 'NSZPC 技術團隊',
        readingMinutes: 6,
        tags: ['預算規劃', '遊戲主機', '顯示卡', '升級策略'],
        youtubeEmbedUrl: '',
        sections: [
          {
            heading: '先定解析度與更新率，再決定顯示卡等級',
            paragraphs: [
              '目標 1080p 高幀率可抓中高階顯示卡；若是 2K 高刷或 4K，顯示卡預算比例要明顯提高。',
              '先確定螢幕規格與遊戲類型，再安排 CPU、主板與散熱，避免把預算放錯位置。',
            ],
            bullets: [],
          },
          {
            heading: '主機預算比例建議',
            paragraphs: [
              '可先用顯示卡 35%-45%、CPU 15%-22% 作為起點，再依用途與升級計畫微調。',
            ],
            bullets: ['偏競技遊戲：提高 CPU 與記憶體權重', '偏 3A 單機：優先顯示卡與散熱', '預算有限先保留電源與主板升級空間'],
          },
        ],
        createdAt: now(),
      },
      {
        id: crypto.randomUUID(),
        slug: 'airflow-and-noise-balance-for-creator-pc',
        title: '創作者主機散熱與噪音平衡：風道比堆風扇更重要',
        summary: '剪輯與渲染工作站要長時間穩定輸出，重點在風道規劃、曲線設定與灰塵管理。',
        coverImage: '/images/carousel/IMG_6158.JPG',
        publishedAt: '2026-02-17',
        updatedAt: '2026-02-18',
        authorName: 'NSZPC 技術團隊',
        readingMinutes: 7,
        tags: ['散熱調校', '創作工作站', '噪音控制', '風道'],
        youtubeEmbedUrl: '',
        sections: [
          {
            heading: '正壓或微正壓是長期使用的安全選擇',
            paragraphs: [
              '對多數創作者主機，微正壓可降低灰塵從縫隙倒灌，維持散熱器效率。',
              '進氣與排氣不需追求極端數值，重點是熱區附近有穩定氣流通過。',
            ],
            bullets: [],
          },
          {
            heading: '風扇曲線先穩後快',
            paragraphs: ['曲線不要太激進，避免輕載時頻繁升降轉造成噪音波動。'],
            bullets: ['CPU 70 度內維持平滑曲線', 'GPU 75 度後再逐步提高轉速', '機殼與顯卡風扇分開調校'],
          },
        ],
        createdAt: now(),
      },
      {
        id: crypto.randomUUID(),
        slug: 'streaming-pc-cpu-gpu-memory-planning',
        title: '直播主機怎麼選：CPU、顯卡編碼與記憶體容量的取捨',
        summary: '直播除了遊戲畫面，還有擷取、插件與多視窗需求，配單邏輯和純遊戲主機不同。',
        coverImage: '/images/carousel/IMG_4722.JPG',
        publishedAt: '2026-02-14',
        updatedAt: '2026-02-14',
        authorName: 'NSZPC 技術團隊',
        readingMinutes: 6,
        tags: ['直播用途', 'CPU', '記憶體', '編碼器'],
        youtubeEmbedUrl: '',
        sections: [
          {
            heading: '直播瓶頸通常不只在顯示卡',
            paragraphs: [
              'OBS 場景切換、瀏覽器來源、過場與插件都會吃 CPU 與記憶體，單純拉顯卡不一定能解決穩定度問題。',
            ],
            bullets: [],
          },
          {
            heading: '記憶體容量與頻率建議',
            paragraphs: ['直播加遊戲建議 32GB 起跳，同時剪精華或多工具並行時 64GB 會更穩。'],
            bullets: ['32GB：主流直播與遊戲並行', '64GB：多工與高負載插件更有餘裕', '頻率與時序需配合平台相容性'],
          },
        ],
        createdAt: now(),
      },
    ],
    inventories: [
      {
        id: crypto.randomUUID(),
        category: 'cpu',
        brand: 'AMD',
        productName: 'Ryzen 7 7800X3D',
        motherboardFormFactor: '',
        quantity: 12,
        retailPrice: 12990,
        costPrice: 11300,
        taxIncluded: true,
        note: '盒裝含原廠保固',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: crypto.randomUUID(),
        category: 'motherboard',
        brand: 'ASUS',
        productName: 'ROG STRIX B650-A GAMING WIFI',
        motherboardFormFactor: 'ATX',
        quantity: 6,
        retailPrice: 7590,
        costPrice: 6840,
        taxIncluded: true,
        note: '白色主題常用款',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: crypto.randomUUID(),
        category: 'motherboard',
        brand: 'Gigabyte',
        productName: 'B650M AORUS ELITE AX',
        motherboardFormFactor: 'MATX',
        quantity: 7,
        retailPrice: 5390,
        costPrice: 4860,
        taxIncluded: true,
        note: '',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: crypto.randomUUID(),
        category: 'motherboard',
        brand: 'MSI',
        productName: 'MAG B760M MORTAR WIFI II',
        motherboardFormFactor: 'MATX',
        quantity: 5,
        retailPrice: 5890,
        costPrice: 5280,
        taxIncluded: true,
        note: 'Intel 平台常備',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: crypto.randomUUID(),
        category: 'motherboard',
        brand: 'ASRock',
        productName: 'B650E STEEL LEGEND WIFI',
        motherboardFormFactor: 'ATX',
        quantity: 4,
        retailPrice: 6790,
        costPrice: 6120,
        taxIncluded: true,
        note: '',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: crypto.randomUUID(),
        category: 'gpu',
        brand: 'MSI',
        productName: 'RTX 4070 SUPER 12G',
        motherboardFormFactor: '',
        quantity: 9,
        retailPrice: 20990,
        costPrice: 19450,
        taxIncluded: true,
        note: '',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: crypto.randomUUID(),
        category: 'ram',
        brand: 'Kingston',
        productName: 'FURY Beast DDR5 32GB (16x2) 6000',
        motherboardFormFactor: '',
        quantity: 14,
        retailPrice: 3290,
        costPrice: 2860,
        taxIncluded: true,
        note: '',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: crypto.randomUUID(),
        category: 'ssd',
        brand: 'Samsung',
        productName: '990 PRO 2TB PCIe 4.0',
        motherboardFormFactor: '',
        quantity: 10,
        retailPrice: 4790,
        costPrice: 4250,
        taxIncluded: true,
        note: '',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: crypto.randomUUID(),
        category: 'hdd',
        brand: 'Seagate',
        productName: 'BarraCuda 4TB 3.5"',
        motherboardFormFactor: '',
        quantity: 8,
        retailPrice: 2990,
        costPrice: 2540,
        taxIncluded: true,
        note: '',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: crypto.randomUUID(),
        category: 'cooler',
        brand: 'Thermalright',
        productName: 'Phantom Spirit 120 SE',
        motherboardFormFactor: '',
        quantity: 11,
        retailPrice: 1390,
        costPrice: 1120,
        taxIncluded: true,
        note: '風冷',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: crypto.randomUUID(),
        category: 'psu',
        brand: 'Seasonic',
        productName: 'FOCUS GX-850',
        motherboardFormFactor: '',
        quantity: 8,
        retailPrice: 4290,
        costPrice: 3710,
        taxIncluded: true,
        note: '',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: crypto.randomUUID(),
        category: 'case',
        brand: 'Lian Li',
        productName: 'LANCOOL 216',
        motherboardFormFactor: '',
        quantity: 6,
        retailPrice: 2790,
        costPrice: 2320,
        taxIncluded: true,
        note: '',
        createdAt: now(),
        updatedAt: now(),
      },
    ],
    procurements: [
      {
        id: crypto.randomUUID(),
        date: '2026/02/11',
        peerName: '高雄同行 A',
        supplierName: '原價屋建國店',
        source: '門市現貨',
        taxIncluded: true,
        settledThisWeek: false,
        items: [
          {
            productName: 'Ryzen 7 9700X',
            quantity: 2,
            unitPrice: 11800,
            taxIncluded: true,
          },
          {
            productName: 'DDR5 32GB (16x2) 6000',
            quantity: 2,
            unitPrice: 2850,
            taxIncluded: true,
          },
        ],
        note: '週末客戶交機用，先代墊。',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: crypto.randomUUID(),
        date: '2026/02/11',
        peerName: '台南同行 B',
        supplierName: '欣亞台南店',
        source: '門市調貨',
        taxIncluded: false,
        settledThisWeek: true,
        items: [
          {
            productName: 'RTX 5070 12GB',
            quantity: 1,
            unitPrice: 21900,
            taxIncluded: false,
          },
          {
            productName: '2TB Gen4 SSD',
            quantity: 2,
            unitPrice: 3490,
            taxIncluded: false,
          },
        ],
        note: '',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: crypto.randomUUID(),
        date: '2026/02/10',
        peerName: '屏東同行 C',
        supplierName: '代理商倉庫',
        source: '代理商直送',
        taxIncluded: true,
        settledThisWeek: true,
        items: [
          {
            productName: '850W 80+ Gold 電源供應器',
            quantity: 3,
            unitPrice: 3480,
            taxIncluded: true,
          },
          {
            productName: 'M-ATX 機殼白色款',
            quantity: 3,
            unitPrice: 1980,
            taxIncluded: true,
          },
        ],
        note: '含運費。',
        createdAt: now(),
        updatedAt: now(),
      },
    ],
    personalProcurements: [
      {
        id: crypto.randomUUID(),
        date: '2026/02/12',
        supplierName: '原價屋建國店',
        source: '門市現貨',
        taxIncluded: true,
        items: [
          {
            productName: 'Ryzen 7 9700X',
            quantity: 1,
            unitPrice: 11800,
            taxIncluded: true,
          },
          {
            productName: 'DDR5 32GB (16x2) 6000',
            quantity: 1,
            unitPrice: 2850,
            taxIncluded: true,
          },
        ],
        note: '展示機升級備料',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: crypto.randomUUID(),
        date: '2026/02/09',
        supplierName: '欣亞台南店',
        source: '門市調貨',
        taxIncluded: false,
        items: [
          {
            productName: '2TB Gen4 SSD',
            quantity: 2,
            unitPrice: 3490,
            taxIncluded: false,
          },
        ],
        note: '',
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: crypto.randomUUID(),
        date: '2026/01/28',
        supplierName: '代理商倉庫',
        source: '代理商直送',
        taxIncluded: true,
        items: [
          {
            productName: '850W 80+ Gold 電源供應器',
            quantity: 2,
            unitPrice: 3480,
            taxIncluded: true,
          },
          {
            productName: 'M-ATX 機殼白色款',
            quantity: 2,
            unitPrice: 1980,
            taxIncluded: true,
          },
        ],
        note: '本月尾單預備',
        createdAt: now(),
        updatedAt: now(),
      },
    ],
    siteContent: defaultSiteContent(),
  };
};

const hasOwn = (value: Record<string, unknown>, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

const normalizeDbMeta = (value: unknown, fallback: DbSchema['meta']): DbSchema['meta'] => {
  if (!value || typeof value !== 'object') {
    return fallback;
  }

  const typed = value as Record<string, unknown>;
  const createdAt = asString(typed.createdAt) || fallback.createdAt;
  const updatedAt = asString(typed.updatedAt) || fallback.updatedAt;
  const parsedVersion = Number(typed.version);
  const version =
    Number.isInteger(parsedVersion) && parsedVersion > 0 ? parsedVersion : fallback.version;

  return {
    createdAt,
    updatedAt,
    version,
  };
};

const normalizeDbSnapshot = (
  value: unknown,
  adminUsername: string,
  adminPassword: string,
): DbSchema => {
  const fallback = defaultDb(adminUsername, adminPassword);

  if (!value || typeof value !== 'object') {
    return fallback;
  }

  const raw = value as Record<string, unknown>;

  return {
    meta: normalizeDbMeta(raw.meta, fallback.meta),
    users: hasOwn(raw, 'users') ? normalizeUsers(raw.users) : fallback.users,
    categories: hasOwn(raw, 'categories') ? normalizeCategories(raw.categories) : fallback.categories,
    builds: hasOwn(raw, 'builds') ? normalizeBuilds(raw.builds) : fallback.builds,
    orders: hasOwn(raw, 'orders') ? normalizeOrders(raw.orders) : fallback.orders,
    blogPosts: hasOwn(raw, 'blogPosts') ? normalizeBlogPosts(raw.blogPosts) : fallback.blogPosts,
    inventories: hasOwn(raw, 'inventories') ? normalizeInventories(raw.inventories) : fallback.inventories,
    procurements: hasOwn(raw, 'procurements') ? normalizeProcurements(raw.procurements) : fallback.procurements,
    personalProcurements: hasOwn(raw, 'personalProcurements')
      ? normalizePersonalProcurements(raw.personalProcurements)
      : fallback.personalProcurements,
    siteContent: hasOwn(raw, 'siteContent') ? normalizeSiteContent(raw.siteContent) : fallback.siteContent,
  };
};

const resolvePostgresConnectionString = (): string => {
  const configured = asString(process.env.DATABASE_URL);
  if (!configured) {
    return DEFAULT_POSTGRES_URL;
  }

  return configured;
};

const getPostgresPool = (): Pool => {
  if (pgPool) {
    return pgPool;
  }

  pgPool = new Pool({
    connectionString: resolvePostgresConnectionString(),
  });

  return pgPool;
};

const runPostgresMigrations = async (client: PoolClient): Promise<void> => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      id SMALLINT PRIMARY KEY CHECK (id = 1),
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

const withPostgresClient = async <T>(handler: (client: PoolClient) => Promise<T>): Promise<T> => {
  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    return await handler(client);
  } finally {
    client.release();
  }
};

const getSeedCredentials = (): { adminUsername: string; adminPassword: string } => {
  return {
    adminUsername: process.env.ADMIN_USERNAME || 'admin',
    adminPassword: process.env.ADMIN_PASSWORD || 'admin123456',
  };
};

const normalizeStoredSnapshot = (value: unknown): DbSchema => {
  const { adminUsername, adminPassword } = getSeedCredentials();
  if (typeof value === 'string') {
    try {
      return normalizeDbSnapshot(JSON.parse(value), adminUsername, adminPassword);
    } catch {
      return normalizeDbSnapshot({}, adminUsername, adminPassword);
    }
  }

  return normalizeDbSnapshot(value, adminUsername, adminPassword);
};

const loadLegacyJsonSeed = async (
  adminUsername: string,
  adminPassword: string,
): Promise<DbSchema | null> => {
  try {
    const raw = await fs.readFile(LEGACY_JSON_FILE, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    return normalizeDbSnapshot(parsed, adminUsername, adminPassword);
  } catch {
    return null;
  }
};

const readStateRow = async (client: PoolClient): Promise<unknown | null> => {
  const result = await client.query<{ data: unknown }>(
    'SELECT data FROM app_state WHERE id = 1',
  );

  if (!result.rowCount || !result.rows[0]) {
    return null;
  }

  return result.rows[0].data;
};

const writeStateRow = async (client: PoolClient, snapshot: DbSchema): Promise<void> => {
  await client.query(
    `
      INSERT INTO app_state (id, data, updated_at)
      VALUES (1, $1::jsonb, $2::timestamptz)
      ON CONFLICT (id)
      DO UPDATE SET
        data = EXCLUDED.data,
        updated_at = EXCLUDED.updated_at
    `,
    [JSON.stringify(snapshot), snapshot.meta.updatedAt],
  );
};

const ensurePostgresStore = async ({
  adminUsername,
  adminPassword,
}: {
  adminUsername: string;
  adminPassword: string;
}): Promise<void> => {
  await withPostgresClient(async (client) => {
    await runPostgresMigrations(client);

    const existing = await readStateRow(client);
    if (existing) {
      return;
    }

    const legacySeed = await loadLegacyJsonSeed(adminUsername, adminPassword);
    const seed = legacySeed || defaultDb(adminUsername, adminPassword);
    const normalized = normalizeDbSnapshot(seed, adminUsername, adminPassword);

    await writeStateRow(client, normalized);
  });
};

const ensureStoreReadyForRead = async (): Promise<void> => {
  const { adminUsername, adminPassword } = getSeedCredentials();
  await ensurePostgresStore({ adminUsername, adminPassword });
};

export const readDb = async (): Promise<DbSchema> => {
  await ensureStoreReadyForRead();

  return withPostgresClient(async (client) => {
    await runPostgresMigrations(client);
    const stored = await readStateRow(client);
    if (!stored) {
      const { adminUsername, adminPassword } = getSeedCredentials();
      return defaultDb(adminUsername, adminPassword);
    }

    return normalizeStoredSnapshot(stored);
  });
};

export const mutateDb = <T>(mutator: (draft: DbSchema) => T | Promise<T>): Promise<T> => {
  const next = writeQueue.then(async () => {
    await ensureStoreReadyForRead();

    return withPostgresClient(async (client) => {
      await runPostgresMigrations(client);
      await client.query('BEGIN');

      try {
        const locked = await client.query<{ data: unknown }>(
          'SELECT data FROM app_state WHERE id = 1 FOR UPDATE',
        );

        const current =
          locked.rowCount && locked.rows[0]
            ? normalizeStoredSnapshot(locked.rows[0].data)
            : defaultDb(getSeedCredentials().adminUsername, getSeedCredentials().adminPassword);

        const draft = structuredClone(current);
        const result = await mutator(draft);

        draft.meta.updatedAt = now();
        draft.meta.createdAt = asString(draft.meta.createdAt) || draft.meta.updatedAt;
        draft.meta.version = Number.isInteger(draft.meta.version) && draft.meta.version > 0 ? draft.meta.version : 1;

        await writeStateRow(client, draft);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    });
  });

  writeQueue = next.then(
    () => undefined,
    () => undefined,
  );

  return next;
};

export const initStore = async ({
  adminUsername,
  adminPassword,
}: {
  adminUsername: string;
  adminPassword: string;
}): Promise<void> => {
  await ensurePostgresStore({ adminUsername, adminPassword });

  const db = await readDb();
  if (!Array.isArray(db.users) || db.users.length === 0) {
    await mutateDb((draft) => {
      draft.users = [
        {
          id: crypto.randomUUID(),
          username: adminUsername,
          passwordHash: hashPassword(adminPassword),
          role: 'admin',
          createdAt: now(),
        },
      ];
    });
  }
};

export const withoutSensitiveUserFields = (user: UserRecord): PublicUser => {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
};

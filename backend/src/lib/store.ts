import type {
  BlogArticleSectionRecord,
  BlogPostRecord,
  BuildRecord,
  CategoryRecord,
  DbSchema,
  OrderRecord,
  SiteContentRecord,
} from './types.ts';

const now = (): string => new Date().toISOString();

const asString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const normalizeStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map((item) => asString(item)).filter(Boolean))];
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
        cpu: asString(typed.cpu) || '',
        motherboard: asString(typed.motherboard) || '',
        ram: asString(typed.ram) || '',
        storage: asString(typed.storage) || '',
        gpu: asString(typed.gpu) || '',
        psu: asString(typed.psu) || '',
        pcCase: asString(typed.pcCase) || '',
        accessories: normalizeStringList(typed.accessories),
        specs,
        createdAt: asString(typed.createdAt) || now(),
        updatedAt: asString(typed.updatedAt) || now(),
      };
    })
    .filter((item) => item !== null);
};

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
      const images = normalizeStringList(typed.images);
      const cpu = asString(typed.cpu) || '';
      const motherboard = asString(typed.motherboard) || '';
      const ram = asString(typed.ram) || '';
      const storage = asString(typed.storage) || '';
      const gpu = asString(typed.gpu) || '';
      const psu = asString(typed.psu) || '';
      const cooler = asString(typed.cooler) || '';
      const pcCase = asString(typed.pcCase) || '';

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
        images,
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
    .filter((item) => item !== null);
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
    .filter((item) => item !== null);
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

// 第一次啟動（D1 還沒有資料）時寫進去的範例內容
const defaultDb = (): DbSchema => {
  return {
    meta: {
      createdAt: now(),
      updatedAt: now(),
      version: 1,
    },
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
      motherboard: asString((build as { motherboard?: string }).motherboard) || '',
      accessories: normalizeStringList((build as { accessories?: string[] }).accessories),
    })),
    orders: [
      {
        id: crypto.randomUUID(),
        date: '2026/02/12',
        item: 'RTX 5080 高階遊戲主機',
        location: '新北市',
        salePrice: 86900,
        status: 'delivered' as const,
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
        status: 'shipping' as const,
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
        status: 'delivered' as const,
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
        status: 'shipping' as const,
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
        status: 'delivered' as const,
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
        status: 'delivered' as const,
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
        status: 'shipping' as const,
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
        status: 'pending' as const,
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
        status: 'delivered' as const,
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
        status: 'delivered' as const,
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
        status: 'shipping' as const,
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
        status: 'pending' as const,
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
      const motherboard = asString((order as { motherboard?: string }).motherboard) || '';
      const cooler = asString((order as { cooler?: string }).cooler) || '';
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

const COLLECTION_KEYS = [
  'categories',
  'builds',
  'orders',
  'blogPosts',
  'siteContent',
] as const satisfies readonly (keyof DbSchema)[];

const STATE_KEYS = ['meta', ...COLLECTION_KEYS] as const;
// 缺的集合才用範例內容補（範例每次都產生新的 id，只在真的缺的時候算一次）
const normalizeDbSnapshot = (value: unknown): DbSchema => {
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  let fallbackCache: DbSchema | null = null;
  const fallback = (): DbSchema => (fallbackCache ??= defaultDb());

  return {
    meta: normalizeDbMeta(raw.meta, { createdAt: now(), updatedAt: now(), version: 1 }),
    categories: hasOwn(raw, 'categories') ? normalizeCategories(raw.categories) : fallback().categories,
    builds: hasOwn(raw, 'builds') ? normalizeBuilds(raw.builds) : fallback().builds,
    orders: hasOwn(raw, 'orders') ? normalizeOrders(raw.orders) : fallback().orders,
    blogPosts: hasOwn(raw, 'blogPosts') ? normalizeBlogPosts(raw.blogPosts) : fallback().blogPosts,
    siteContent: hasOwn(raw, 'siteContent') ? normalizeSiteContent(raw.siteContent) : fallback().siteContent,
  };
};

/*
 * 存在 Cloudflare D1（migrations/0001_app_state.sql）：
 * - app_state：每個集合一列（key = 集合名稱，data = JSON），單列不能超過 D1 的 2MB
 * - state_versions：寫入時的版本號，用來偵測同時寫入（見 mutateDb）
 */

// D1 單列上限 2,000,000 bytes，留一點空間
const MAX_ROW_BYTES = 1_900_000;
const MAX_WRITE_ATTEMPTS = 5;

let database: D1Database | null = null;

/** 每個請求開始時叫一次（Worker 的 env.DB） */
export const useDatabase = (db: D1Database): void => {
  database = db;
};

const db = (): D1Database => {
  if (!database) {
    throw new Error('store: useDatabase() was not called');
  }
  return database;
};

interface LoadedState {
  version: number;
  // 資料庫裡每一列原本的 JSON 字串，寫回時只寫有變的
  rows: Map<string, string>;
  snapshot: DbSchema;
}

const loadState = async (): Promise<LoadedState> => {
  // 同一個 batch 是同一個交易，讀到的版本號和資料是一致的
  const [stateResult, versionResult] = await db().batch([
    db().prepare('SELECT key, data FROM app_state'),
    db().prepare('SELECT COALESCE(MAX(version), 0) AS version FROM state_versions'),
  ]);

  const rows = new Map<string, string>();
  const raw: Record<string, unknown> = {};
  for (const row of stateResult.results as { key: string; data: string }[]) {
    rows.set(row.key, row.data);
    try {
      raw[row.key] = JSON.parse(row.data);
    } catch {
      // 壞掉的那一列當作沒有，normalize 會補預設值
    }
  }

  const version = Number((versionResult.results[0] as { version: number } | undefined)?.version ?? 0);
  return { version, rows, snapshot: normalizeDbSnapshot(raw) };
};

const isVersionConflict = (error: unknown): boolean =>
  error instanceof Error && /UNIQUE constraint failed: state_versions/i.test(error.message);

/** 把 draft 有變的集合寫回去；版本號被別人搶先就回 false */
const writeState = async (loaded: LoadedState, draft: DbSchema): Promise<boolean> => {
  const timestamp = draft.meta.updatedAt;
  const nextVersion = loaded.version + 1;
  const statements: D1PreparedStatement[] = [
    db().prepare('INSERT INTO state_versions (version) VALUES (?)').bind(nextVersion),
    db().prepare('DELETE FROM state_versions WHERE version < ?').bind(nextVersion),
  ];

  for (const key of STATE_KEYS) {
    const json = JSON.stringify(draft[key]);
    if (loaded.rows.get(key) === json) {
      continue;
    }
    if (new TextEncoder().encode(json).byteLength > MAX_ROW_BYTES) {
      throw new Error(`store: ${key} is larger than ${MAX_ROW_BYTES} bytes`);
    }
    statements.push(
      db()
        .prepare(
          `INSERT INTO app_state (key, data, updated_at) VALUES (?, ?, ?)
           ON CONFLICT (key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
        )
        .bind(key, json, timestamp),
    );
  }

  try {
    await db().batch(statements);
    return true;
  } catch (error) {
    if (isVersionConflict(error)) {
      return false;
    }
    throw error;
  }
};

export const readDb = async (): Promise<DbSchema> => {
  const loaded = await loadState();
  if (loaded.rows.size > 0) {
    return loaded.snapshot;
  }

  // 第一次：把範例內容存起來，之後 id 才會固定
  await writeState(loaded, loaded.snapshot);
  return (await loadState()).snapshot;
};

/**
 * 讀出整份資料、交給 mutator 改、再寫回去。
 * 兩個請求同時改的話，後寫的會發現版本號被搶先，整個重讀重做（最多 MAX_WRITE_ATTEMPTS 次）。
 */
export const mutateDb = async <T>(mutator: (draft: DbSchema) => T | Promise<T>): Promise<T> => {
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
    const loaded = await loadState();
    const draft = structuredClone(loaded.snapshot);
    const result = await mutator(draft);

    draft.meta.updatedAt = now();
    draft.meta.createdAt = asString(draft.meta.createdAt) || draft.meta.updatedAt;
    draft.meta.version = Number.isInteger(draft.meta.version) && draft.meta.version > 0 ? draft.meta.version : 1;

    if (await writeState(loaded, draft)) {
      return result;
    }
  }

  throw new Error('store: too many concurrent writes, please retry');
};

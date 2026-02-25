import { getApiBaseUrl } from './adminAuth';

export interface PublicSiteStat {
  value: string;
  label: string;
}

export interface PublicShippingStep {
  title: string;
  description: string;
}

export interface PublicTestimonial {
  quote: string;
  name: string;
  tag: string;
}

export interface PublicContactChannel {
  icon: string;
  label: string;
  value: string;
  href: string;
}

export interface PublicBrandPortfolio {
  id: string;
  name: string;
  tagline: string;
  focus: string[];
  tags: string[];
  images: string[];
}

export interface PublicSiteContent {
  homeHeroKicker: string;
  homeHeroTitle: string;
  homeHeroSubtitle: string;
  homeCategorySubtitle: string;
  homeBuildSubtitle: string;
  homeWorkflowSubtitle: string;
  homeContactSubtitle: string;
  homeStats: PublicSiteStat[];
  categoriesHeroSubtitle: string;
  categoriesQuickTags: string[];
  categoriesPortfolioTitle: string;
  categoriesPortfolioSubtitle: string;
  categoriesBrandPortfolios: PublicBrandPortfolio[];
  brandHeroTitle: string;
  brandHeroSubtitle: string;
  shipmentTagCatalog: string[];
  shippingSteps: PublicShippingStep[];
  serviceHighlights: string[];
  testimonials: PublicTestimonial[];
  contactChannels: PublicContactChannel[];
  footerAddress: string;
  footerSlogan: string;
  contactAddress: string;
  contactPhone: string;
  contactLine: string;
}

interface PublicSiteContentResponse {
  data?: unknown;
}

const asString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const parseStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map((item) => asString(item)).filter(Boolean))];
};

const parseStats = (value: unknown): PublicSiteStat[] => {
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
      const label = asString(typed.label);
      if (!statValue || !label) {
        return null;
      }

      return { value: statValue, label };
    })
    .filter((item): item is PublicSiteStat => item !== null);
};

const parseShippingSteps = (value: unknown): PublicShippingStep[] => {
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
    .filter((item): item is PublicShippingStep => item !== null);
};

const parseTestimonials = (value: unknown): PublicTestimonial[] => {
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
    .filter((item): item is PublicTestimonial => item !== null);
};

const parseContactChannels = (value: unknown): PublicContactChannel[] => {
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

      return {
        icon,
        label,
        value: channelValue,
        href,
      };
    })
    .filter((item): item is PublicContactChannel => item !== null);
};

const parseBrandPortfolios = (value: unknown): PublicBrandPortfolio[] => {
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
      const focus = parseStringList(typed.focus);
      const tags = parseStringList(typed.tags);
      const images = parseStringList(typed.images);

      const derivedTags = tags.length
        ? tags
        : [name, ...focus]
          .flatMap((item) => item.split(/[\s,，、/／]+/))
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 6);

      if (!id || !name || !tagline || focus.length === 0 || images.length === 0) {
        return null;
      }

      return {
        id,
        name,
        tagline,
        focus,
        tags: [...new Set(derivedTags)],
        images,
      };
    })
    .filter((item): item is PublicBrandPortfolio => item !== null);
};

export const defaultPublicSiteContent: PublicSiteContent = {
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
  categoriesPortfolioSubtitle: '每個品牌都整理了核心重點與實拍縮圖，直接在分類總覽比較最直覺。',
  categoriesBrandPortfolios: [
    {
      id: 'darkflash',
      name: 'Darkflash 作品集',
      tagline: '白色主題與玻璃側透的高人氣方案',
      focus: ['ARGB 整體燈效同步', '前後風道平衡', '電源倉與線材遮蔽優化'],
      tags: ['白色主題', 'ARGB', '玻璃側透', '機殼整線'],
      images: ['/images/carousel/IMG_4722.JPG', '/images/carousel/IMG_4730.JPG', '/images/carousel/IMG_6165.JPG'],
    },
    {
      id: 'asus',
      name: 'ASUS 系列作品集',
      tagline: 'ROG 生態整合，效能與外觀一致化',
      focus: ['ROG BIOS 調校', '高負載溫控曲線', '同步驅動版本管理'],
      tags: ['ROG 生態', '高效能', '電競', '主板調校'],
      images: ['/images/carousel/IMG_4729.JPG', '/images/carousel/IMG_6158.JPG', '/images/carousel/IMG_6477.JPG'],
    },
    {
      id: 'montech',
      name: 'Montech 系列作品集',
      tagline: '高 CP 值與散熱效率並重',
      focus: ['預算效率最大化', '散熱壓測驗證', '升級路線清楚'],
      tags: ['高 CP 值', '散熱效率', '預算配單', '升級彈性'],
      images: ['/images/carousel/IMG_6159.JPG', '/images/carousel/IMG_6486.JPG', '/images/carousel/IMG_6488.JPG'],
    },
    {
      id: 'lianli',
      name: 'Lian Li 系列作品集',
      tagline: '鋁件質感與模組化機殼配置',
      focus: ['模組化風扇配置', '雙艙視覺比例', '進階水冷預留空間'],
      tags: ['質感機殼', '雙艙設計', '模組化', '水冷擴充'],
      images: ['/images/carousel/IMG_4730.JPG', '/images/carousel/IMG_6165.JPG', '/images/carousel/IMG_6544.JPG'],
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
};

const sanitizeSiteContent = (value: unknown): PublicSiteContent | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;

  const homeStats = parseStats(raw.homeStats);
  const categoriesQuickTags = parseStringList(raw.categoriesQuickTags);
  const categoriesBrandPortfolios = parseBrandPortfolios(raw.categoriesBrandPortfolios);
  const shipmentTagCatalog = parseStringList(raw.shipmentTagCatalog);
  const shippingSteps = parseShippingSteps(raw.shippingSteps);
  const serviceHighlights = parseStringList(raw.serviceHighlights);
  const testimonials = parseTestimonials(raw.testimonials);
  const contactChannels = parseContactChannels(raw.contactChannels);

  return {
    homeHeroKicker: asString(raw.homeHeroKicker) || defaultPublicSiteContent.homeHeroKicker,
    homeHeroTitle: asString(raw.homeHeroTitle) || defaultPublicSiteContent.homeHeroTitle,
    homeHeroSubtitle: asString(raw.homeHeroSubtitle) || defaultPublicSiteContent.homeHeroSubtitle,
    homeCategorySubtitle: asString(raw.homeCategorySubtitle) || defaultPublicSiteContent.homeCategorySubtitle,
    homeBuildSubtitle: asString(raw.homeBuildSubtitle) || defaultPublicSiteContent.homeBuildSubtitle,
    homeWorkflowSubtitle: asString(raw.homeWorkflowSubtitle) || defaultPublicSiteContent.homeWorkflowSubtitle,
    homeContactSubtitle: asString(raw.homeContactSubtitle) || defaultPublicSiteContent.homeContactSubtitle,
    homeStats: homeStats.length ? homeStats : defaultPublicSiteContent.homeStats,
    categoriesHeroSubtitle:
      asString(raw.categoriesHeroSubtitle) || defaultPublicSiteContent.categoriesHeroSubtitle,
    categoriesQuickTags: categoriesQuickTags.length
      ? categoriesQuickTags
      : defaultPublicSiteContent.categoriesQuickTags,
    categoriesPortfolioTitle:
      asString(raw.categoriesPortfolioTitle) || defaultPublicSiteContent.categoriesPortfolioTitle,
    categoriesPortfolioSubtitle:
      asString(raw.categoriesPortfolioSubtitle) || defaultPublicSiteContent.categoriesPortfolioSubtitle,
    categoriesBrandPortfolios: categoriesBrandPortfolios.length
      ? categoriesBrandPortfolios
      : defaultPublicSiteContent.categoriesBrandPortfolios,
    brandHeroTitle: asString(raw.brandHeroTitle) || defaultPublicSiteContent.brandHeroTitle,
    brandHeroSubtitle: asString(raw.brandHeroSubtitle) || defaultPublicSiteContent.brandHeroSubtitle,
    shipmentTagCatalog: shipmentTagCatalog.length
      ? shipmentTagCatalog
      : defaultPublicSiteContent.shipmentTagCatalog,
    shippingSteps: shippingSteps.length ? shippingSteps : defaultPublicSiteContent.shippingSteps,
    serviceHighlights: serviceHighlights.length ? serviceHighlights : defaultPublicSiteContent.serviceHighlights,
    testimonials: testimonials.length ? testimonials : defaultPublicSiteContent.testimonials,
    contactChannels: contactChannels.length ? contactChannels : defaultPublicSiteContent.contactChannels,
    footerAddress: asString(raw.footerAddress) || defaultPublicSiteContent.footerAddress,
    footerSlogan: asString(raw.footerSlogan) || defaultPublicSiteContent.footerSlogan,
    contactAddress: asString(raw.contactAddress) || defaultPublicSiteContent.contactAddress,
    contactPhone: asString(raw.contactPhone) || defaultPublicSiteContent.contactPhone,
    contactLine: asString(raw.contactLine) || defaultPublicSiteContent.contactLine,
  };
};

export const fetchPublicSiteContent = async (): Promise<PublicSiteContent> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/public/site-content`);
    const payload = (await response.json()) as PublicSiteContentResponse;

    if (!response.ok) {
      return defaultPublicSiteContent;
    }

    const parsed = sanitizeSiteContent(payload.data);
    return parsed || defaultPublicSiteContent;
  } catch {
    return defaultPublicSiteContent;
  }
};

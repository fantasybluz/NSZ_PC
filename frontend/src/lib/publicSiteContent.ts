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

export interface PublicSiteContent {
  homeHeroTitle: string;
  homeContactSubtitle: string;
  homeStats: PublicSiteStat[];
  categoriesHeroSubtitle: string;
  categoriesQuickTags: string[];
  brandHeroTitle: string;
  shipmentTagCatalog: string[];
  shippingSteps: PublicShippingStep[];
  testimonials: PublicTestimonial[];
  contactChannels: PublicContactChannel[];
  footerAddress: string;
  footerSlogan: string;
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

export const defaultPublicSiteContent: PublicSiteContent = {
  homeHeroTitle: '你的主機不只要跑得快，還要看起來就是你的風格。',
  homeContactSubtitle: '想問配單、交期或升級都可以直接私訊，會在工作時間內盡快回覆。',
  homeStats: [
    { value: '600+', label: '累積組裝案例' },
    { value: '48h', label: '平均報價回覆' },
    { value: '4.9/5', label: 'Google 在地評價' },
  ],
  categoriesHeroSubtitle: '依照使用情境整理分類，點進去可查看需求重點與建議方向。',
  categoriesQuickTags: ['電競高幀率', '直播剪輯', 'AI 算圖', '白色主題', '靜音工作站', '小型機殼'],
  brandHeroTitle: '出機紀錄',
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
};

const sanitizeSiteContent = (value: unknown): PublicSiteContent | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;

  const homeStats = parseStats(raw.homeStats);
  const categoriesQuickTags = parseStringList(raw.categoriesQuickTags);
  const shipmentTagCatalog = parseStringList(raw.shipmentTagCatalog);
  const shippingSteps = parseShippingSteps(raw.shippingSteps);
  const testimonials = parseTestimonials(raw.testimonials);
  const contactChannels = parseContactChannels(raw.contactChannels);

  return {
    homeHeroTitle: asString(raw.homeHeroTitle) || defaultPublicSiteContent.homeHeroTitle,
    homeContactSubtitle: asString(raw.homeContactSubtitle) || defaultPublicSiteContent.homeContactSubtitle,
    homeStats: homeStats.length ? homeStats : defaultPublicSiteContent.homeStats,
    categoriesHeroSubtitle:
      asString(raw.categoriesHeroSubtitle) || defaultPublicSiteContent.categoriesHeroSubtitle,
    categoriesQuickTags: categoriesQuickTags.length
      ? categoriesQuickTags
      : defaultPublicSiteContent.categoriesQuickTags,
    brandHeroTitle: asString(raw.brandHeroTitle) || defaultPublicSiteContent.brandHeroTitle,
    shipmentTagCatalog: shipmentTagCatalog.length
      ? shipmentTagCatalog
      : defaultPublicSiteContent.shipmentTagCatalog,
    shippingSteps: shippingSteps.length ? shippingSteps : defaultPublicSiteContent.shippingSteps,
    testimonials: testimonials.length ? testimonials : defaultPublicSiteContent.testimonials,
    contactChannels: contactChannels.length ? contactChannels : defaultPublicSiteContent.contactChannels,
    footerAddress: asString(raw.footerAddress) || defaultPublicSiteContent.footerAddress,
    footerSlogan: asString(raw.footerSlogan) || defaultPublicSiteContent.footerSlogan,
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

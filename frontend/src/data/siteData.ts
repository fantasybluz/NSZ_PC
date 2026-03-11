export const carouselImageFiles = [
  'IMG_4722.JPG',
  'IMG_4729.JPG',
  'IMG_4730.JPG',
  'IMG_6158.JPG',
  'IMG_6159.JPG',
  'IMG_6165.JPG',
  'IMG_6477.JPG',
  'IMG_6486.JPG',
  'IMG_6488.JPG',
  'IMG_6538.JPG',
  'IMG_6539.JPG',
  'IMG_6542.JPG',
  'IMG_6544.JPG',
  'IMG_7009.JPG',
  'IMG_7011.JPG',
  'IMG_7012.JPG',
  'IMG_7622.JPG',
  'IMG_7623.JPG',
  'IMG_7626.JPG',
  'IMG_7964.JPG',
  'IMG_7965.JPG',
] as const;

export const carouselImages = carouselImageFiles.map(
  (filename) => `/images/carousel/${filename}`,
);

export interface BuildPackage {
  name: string;
  image: string;
  description: string;
  detailIntro: string;
  requirementIntro: string;
  youtubeEmbedUrl?: string;
  price: number;
  dealDate: string;
  badge?: string;
  tags?: string[];
  cpu: string;
  motherboard?: string;
  ram: string;
  storage: string;
  gpu: string;
  psu: string;
  pcCase: string;
  accessories?: string[];
  specs: string[];
}

export const featuredBuilds: BuildPackage[] = [
  {
    name: 'NSZ Flux 4060',
    image: carouselImages[0],
    description: '主流 1080p 遊戲與日常直播，靜音風道與散熱均衡。',
    detailIntro:
      '這台以 1080p 高幀率遊戲和日常直播為核心，會優先平衡散熱、噪音與後續升級彈性。',
    requirementIntro:
      '適合想同時玩遊戲與開直播的新手玩家，需求重點是穩定輸出、畫面順暢與長時間運作。',
    price: 36900,
    dealDate: '2026/02/09',
    badge: '熱銷',
    cpu: 'Ryzen 5 7600',
    ram: 'DDR5 32GB',
    storage: '1TB Gen4 SSD',
    gpu: 'RTX 4060',
    psu: '650W 80+ Gold',
    pcCase: 'Darkflash DRX White',
    specs: ['RTX 4060', 'Ryzen 5 7600', 'DDR5 32GB'],
  },
  {
    name: 'NSZ Apex 4070 Super',
    image: carouselImages[7],
    description: '2K 高刷新體驗，適合 FPS 和 3A 遊戲兼顧。',
    detailIntro:
      '針對 2K 解析度高刷新遊戲設計，重點在幀率穩定、溫控平衡與未來升級可用性。',
    requirementIntro:
      '適合主玩 FPS 與 3A 的玩家，若你同時有錄影或直播需求，這套規格也能穩定應對。',
    price: 53900,
    dealDate: '2026/02/08',
    badge: '推薦',
    cpu: 'Ryzen 7 7800X3D',
    ram: 'DDR5 32GB',
    storage: '2TB Gen4 SSD',
    gpu: 'RTX 4070 Super',
    psu: '750W 80+ Gold',
    pcCase: 'Darkflash DY470 White',
    specs: ['RTX 4070 Super', 'Ryzen 7 7800X3D', '2TB Gen4 SSD'],
  },
  {
    name: 'NSZ Studio X',
    image: carouselImages[10],
    description: '剪輯與建模工作站，長時間運作也穩定。',
    detailIntro:
      '這台是剪輯與建模導向工作站，會優先確保長時間輸出穩定性、儲存吞吐與散熱效率。',
    requirementIntro:
      '適合 Premiere、DaVinci、Blender 等創作工作流，需求重點在多工順暢與素材管理效率。',
    price: 72900,
    dealDate: '2026/02/06',
    cpu: 'Core i7-14700K',
    ram: 'DDR5 64GB',
    storage: '2TB Gen4 SSD',
    gpu: 'RTX 4080 Super',
    psu: '850W 80+ Gold',
    pcCase: 'Fractal North',
    specs: ['RTX 4080 Super', 'Core i7-14700K', 'DDR5 64GB'],
  },
  {
    name: 'NSZ Tiny Creator',
    image: carouselImages[15],
    description: '小體積機殼配置，桌面空間友善，兼顧效能。',
    detailIntro:
      '主打小體積桌面佈局，兼顧日常創作效能與安靜度，適合想保留空間又不犧牲體驗的使用者。',
    requirementIntro:
      '適合桌面空間有限、又希望有一定遊戲與創作能力的族群，重點在溫控、噪音與整線。',
    price: 44900,
    dealDate: '2026/02/04',
    cpu: 'Core i5-14600K',
    ram: 'DDR5 32GB',
    storage: '1TB Gen4 SSD',
    gpu: 'RTX 4070',
    psu: '750W SFX 80+ Gold',
    pcCase: 'Lian Li A4-H2O',
    specs: ['RTX 4070', 'Core i5-14600K', '1TB Gen4 SSD'],
  },
];

export interface ProductCategory {
  title: string;
  summary: string;
  primaryCategory: string;
  secondaryCategory: string;
  tags: string[];
  points: string[];
  link: string;
}

export const productCategories: ProductCategory[] = [
  {
    title: 'Darkflash 機殼系列',
    summary: '主打外型與燈效，適合想做白色主題或雙艙風格的玩家。',
    primaryCategory: '主題機殼',
    secondaryCategory: '外觀與風道',
    tags: ['白色主題', 'ARGB', '玻璃側透', '整線'],
    points: ['現貨快速交期', '風道改造建議', '線材與燈效同步'],
    link: '/categories/item/fallback-1',
  },
  {
    title: '核心零組件升級',
    summary: '顯示卡、記憶體、SSD 與電供配平建議，不盲目堆料。',
    primaryCategory: '零組件升級',
    secondaryCategory: '效能強化',
    tags: ['顯卡升級', '記憶體', 'SSD', '電供'],
    points: ['預算分配試算', '同價位替代方案', '舊機升級檢測'],
    link: '/categories/item/fallback-2',
  },
  {
    title: '直播與創作配單',
    summary: '針對 OBS、Premiere、Blender 等場景做硬體重點配置。',
    primaryCategory: '創作與直播',
    secondaryCategory: '影音輸出',
    tags: ['直播', '剪輯', '多工', 'AI 創作'],
    points: ['多工穩定性優先', '靜音與散熱兼顧', '可擴充主板路線'],
    link: '/categories/item/fallback-3',
  },
  {
    title: '企業/工作室批量採購',
    summary: '同規格批量建置，建立維護流程與後續保固服務。',
    primaryCategory: '商用部署',
    secondaryCategory: '企業採購',
    tags: ['批量採購', '規格一致', '維運支援'],
    points: ['規格文件化', '批次出貨檢核', '遠端協助支援'],
    link: '/categories/item/fallback-4',
  },
];

export interface CategoryFaqItem {
  question: string;
  answer: string;
}

export interface CategoryDetail {
  slug: string;
  title: string;
  subtitle: string;
  intro: string;
  heroImage: string;
  highlights: string[];
  recommendations: string[];
  faqs: CategoryFaqItem[];
}

export const categoryDetails: Record<string, CategoryDetail> = {
  'darkflash-case': {
    slug: 'darkflash-case',
    title: 'Darkflash 機殼系列',
    subtitle: '外觀風格與風道平衡兼顧',
    intro:
      '適合想做白色主題、玻璃側透、ARGB 燈效同步的玩家。這類方案重點在外觀一致性，但散熱和線材依然會先確保。',
    heroImage: carouselImages[7],
    highlights: ['白色桌搭主題規劃', 'ARGB 燈效同步配置', '雙艙或側透機殼線材隱藏'],
    recommendations: [
      '先確定桌面風格與顏色，避免後續零件色差。',
      '風扇數量與轉速曲線要先規劃，避免好看但悶熱。',
      '建議預留 1-2 組擴充風扇位，方便後續升級。',
    ],
    faqs: [
      {
        question: '白色主題是否比較貴？',
        answer: '通常會比同級黑色配置高一些，但可以透過料件替代控制價差。',
      },
      {
        question: '燈效會不會很難調？',
        answer: '會先統一控制生態，日常只要用一套軟體即可調整。',
      },
    ],
  },
  'components-upgrade': {
    slug: 'components-upgrade',
    title: '核心零組件升級',
    subtitle: '同預算下把效能花在刀口上',
    intro:
      '以顯示卡、記憶體、SSD、電供為核心，先找瓶頸再升級，不做無效堆料，確保每一筆預算都對體感有差。',
    heroImage: carouselImages[11],
    highlights: ['舊機瓶頸檢測', '同價位替代規格比對', '升級後穩定性壓測'],
    recommendations: [
      '優先升級最影響體感的零件，例如顯卡或儲存。',
      '電供瓦數與品質要同步檢查，避免升級後不穩。',
      '主板和機殼擴充性要先看，避免升級卡關。',
    ],
    faqs: [
      {
        question: '只換顯卡就夠嗎？',
        answer: '要看 CPU 與電供是否成為新瓶頸，通常會一起評估。',
      },
      {
        question: '升級後會需要重灌嗎？',
        answer: '不一定，但更換核心平台時會建議重整系統以降低問題。',
      },
    ],
  },
  'creator-streaming': {
    slug: 'creator-streaming',
    title: '直播與創作配單',
    subtitle: '多工穩定、長時間輸出優先',
    intro:
      '針對 OBS、Premiere、DaVinci、Blender 等高負載情境設計，重點是長時間穩定輸出，不只看短時間跑分。',
    heroImage: carouselImages[15],
    highlights: ['直播與剪輯多工配置', '長時輸出溫控與噪音平衡', '儲存分層與素材盤規劃'],
    recommendations: [
      '系統碟、素材碟、備份碟分開，專案管理效率更高。',
      '若會同時開遊戲與串流，記憶體建議 32GB 起跳。',
      '長時間運作建議優先考慮散熱器與風道配置。',
    ],
    faqs: [
      {
        question: '剪輯和直播可以同一台嗎？',
        answer: '可以，會依你的工作比例做 CPU/GPU 權重配置。',
      },
      {
        question: '需要上到工作站等級嗎？',
        answer: '多數創作者不一定需要，會先看你的素材規模與解析度。',
      },
    ],
  },
  'business-batch': {
    slug: 'business-batch',
    title: '企業/工作室批量採購',
    subtitle: '規格標準化與後續維護效率',
    intro:
      '適合公司、工作室、教室等場景。重點在同規格一致性、批次出貨檢核、可追蹤的維護流程，降低長期管理成本。',
    heroImage: carouselImages[18],
    highlights: ['同規格批量建置', '批次驗收清單與標籤', '售後維護與升級排程'],
    recommendations: [
      '先定義用途分級，再決定標準機型與擴充選配。',
      '建立資產標籤與零件紀錄，後續維護效率會高很多。',
      '建議保留小比例備援機，降低突發停機影響。',
    ],
    faqs: [
      {
        question: '可以分批交機嗎？',
        answer: '可以，通常會按優先部門分批建置與交付。',
      },
      {
        question: '後續升級能統一規格嗎？',
        answer: '可在初期就設計升級路線，後續維護會更一致。',
      },
    ],
  },
};

export interface ShippingStep {
  title: string;
  description: string;
}

export const shippingSteps: ShippingStep[] = [
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
];

export interface RecentOrder {
  date: string;
  item: string;
  requirementIntro?: string;
  youtubeEmbedUrl?: string;
  tags?: string[];
  location: string;
  cpu: string;
  motherboard?: string;
  ram: string;
  storage: string;
  gpu: string;
  psu: string;
  cooler?: string;
  pcCase: string;
  images?: string[];
  serviceFee?: number;
}

export const recentOrders: RecentOrder[] = [
  {
    date: '2026/02/12',
    item: 'RTX 5080 高階遊戲主機',
    location: '新北市',
    cpu: 'Ryzen 7 9800X3D',
    ram: 'DDR5 64GB',
    storage: '2TB Gen4 SSD',
    gpu: 'RTX 5080',
    psu: '1000W 80+ Gold',
    pcCase: 'Lian Li O11 Vision White',
  },
  {
    date: '2026/02/12',
    item: 'AI 影像生成工作站',
    location: '台北市',
    cpu: 'Core Ultra 9 285K',
    ram: 'DDR5 96GB',
    storage: '4TB Gen4 SSD',
    gpu: 'RTX 5090',
    psu: '1200W 80+ Platinum',
    pcCase: 'Lian Li O11D EVO',
  },
  {
    date: '2026/02/11',
    item: '白色雙艙直播主機',
    location: '桃園市',
    cpu: 'Ryzen 7 7800X3D',
    ram: 'DDR5 32GB',
    storage: '2TB Gen4 SSD',
    gpu: 'RTX 4070 Ti Super',
    psu: '850W 80+ Gold',
    pcCase: 'Darkflash DY470 White',
  },
  {
    date: '2026/02/11',
    item: '企業批量設計工作機',
    location: '新竹市',
    cpu: 'Core i7-14700',
    ram: 'DDR5 64GB',
    storage: '2TB Gen4 SSD',
    gpu: 'RTX 4070 Super',
    psu: '850W 80+ Gold',
    pcCase: 'Fractal North',
  },
  {
    date: '2026/02/10',
    item: '2K 電競高幀率主機',
    location: '台中市',
    cpu: 'Ryzen 7 7700',
    ram: 'DDR5 32GB',
    storage: '1TB Gen4 SSD',
    gpu: 'RTX 4070',
    psu: '750W 80+ Gold',
    pcCase: 'Montech Air 903',
  },
  {
    date: '2026/02/09',
    item: 'RTX 4070 Super 遊戲主機',
    location: '台北市',
    cpu: 'Ryzen 7 7800X3D',
    ram: 'DDR5 32GB',
    storage: '2TB Gen4 SSD',
    gpu: 'RTX 4070 Super',
    psu: '750W 80+ Gold',
    pcCase: 'Darkflash DY470 White',
  },
  {
    date: '2026/02/08',
    item: 'Intel 創作者剪輯主機',
    location: '台中市',
    cpu: 'Core i7-14700K',
    ram: 'DDR5 64GB',
    storage: '2TB Gen4 SSD',
    gpu: 'RTX 4080 Super',
    psu: '850W 80+ Gold',
    pcCase: 'Fractal North',
  },
  {
    date: '2026/02/07',
    item: 'AMD 創作渲染主機',
    location: '嘉義市',
    cpu: 'Ryzen 9 7950X',
    ram: 'DDR5 64GB',
    storage: '2TB Gen4 SSD',
    gpu: 'RTX 4080 Super',
    psu: '1000W 80+ Gold',
    pcCase: 'Lian Li Lancool 216',
  },
  {
    date: '2026/02/06',
    item: '白色主題直播主機',
    location: '高雄市',
    cpu: 'Ryzen 5 7600',
    ram: 'DDR5 32GB',
    storage: '1TB Gen4 SSD',
    gpu: 'RTX 4060 Ti',
    psu: '650W 80+ Gold',
    pcCase: 'Darkflash DRX White',
  },
  {
    date: '2026/02/05',
    item: 'SFF 小型剪輯主機',
    location: '屏東市',
    cpu: 'Core i5-14600K',
    ram: 'DDR5 32GB',
    storage: '1TB Gen4 SSD',
    gpu: 'RTX 4070',
    psu: '750W SFX 80+ Gold',
    pcCase: 'Lian Li A4-H2O',
  },
  {
    date: '2026/02/04',
    item: '企業批量辦公工作站',
    location: '新竹市',
    cpu: 'Core i5-14500',
    ram: 'DDR5 32GB',
    storage: '1TB Gen4 SSD',
    gpu: 'RTX 4060',
    psu: '650W 80+ Gold',
    pcCase: 'Montech Air 100',
  },
  {
    date: '2026/02/03',
    item: '4K 剪輯與建模主機',
    location: '台南市',
    cpu: 'Core i9-14900K',
    ram: 'DDR5 96GB',
    storage: '4TB Gen4 SSD',
    gpu: 'RTX 4090',
    psu: '1000W 80+ Gold',
    pcCase: 'Lian Li O11 Dynamic',
  },
  {
    date: '2026/02/02',
    item: '大型遊戲實況主機',
    location: '宜蘭市',
    cpu: 'Ryzen 7 9700X',
    ram: 'DDR5 32GB',
    storage: '2TB Gen4 SSD',
    gpu: 'RTX 4070 Ti',
    psu: '850W 80+ Gold',
    pcCase: 'Montech Sky Two',
  },
  {
    date: '2026/02/01',
    item: 'SFF 小型電競主機',
    location: '台南市',
    cpu: 'Core i5-14600KF',
    ram: 'DDR5 32GB',
    storage: '1TB Gen4 SSD',
    gpu: 'RTX 4060 Ti',
    psu: '750W SFX 80+ Gold',
    pcCase: 'Cooler Master NR200P',
  },
  {
    date: '2026/01/31',
    item: '教育單位教室主機',
    location: '彰化市',
    cpu: 'Core i5-14400',
    ram: 'DDR5 16GB',
    storage: '1TB NVMe SSD',
    gpu: 'RTX 4060',
    psu: '650W 80+ Bronze',
    pcCase: 'Montech Air 100 Lite',
  },
  {
    date: '2026/01/30',
    item: '白色展示機組裝案',
    location: '苗栗市',
    cpu: 'Ryzen 5 7600X',
    ram: 'DDR5 32GB',
    storage: '1TB Gen4 SSD',
    gpu: 'RTX 4070',
    psu: '750W 80+ Gold',
    pcCase: 'Darkflash DY470 White',
  },
];

export interface Testimonial {
  quote: string;
  name: string;
  tag: string;
}

export const testimonials: Testimonial[] = [
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
];

export interface CaseProfile {
  id: string;
  name: string;
  tagline: string;
  description: string;
  focus: string[];
  gallery: number[];
}

export const caseProfiles: Record<string, CaseProfile> = {
  darkflash: {
    id: 'darkflash',
    name: 'Darkflash 作品集',
    tagline: '白色主題與玻璃側透的高人氣方案',
    description:
      '以視覺一致性和整線細節為核心，適合想要高完成度桌搭的玩家。',
    focus: ['ARGB 整體燈效同步', '前後風道平衡', '電源倉與線材遮蔽優化'],
    gallery: [0, 2, 5, 7, 12, 18],
  },
  asus: {
    id: 'asus',
    name: 'ASUS 系列作品集',
    tagline: 'ROG 生態整合，效能與外觀一致化',
    description:
      '針對 ROG 主機板、顯卡與周邊做整體搭配，兼顧穩定與可擴充。',
    focus: ['ROG BIOS 調校', '高負載溫控曲線', '同步驅動版本管理'],
    gallery: [1, 3, 8, 10, 14, 19],
  },
  montech: {
    id: 'montech',
    name: 'Montech 系列作品集',
    tagline: '高 CP 值與散熱效率並重',
    description:
      '以預算效率為前提，保留未來升級空間，適合首組玩家與學生族群。',
    focus: ['預算效率最大化', '散熱壓測驗證', '升級路線清楚'],
    gallery: [4, 6, 9, 11, 15, 20],
  },
  lianli: {
    id: 'lianli',
    name: 'Lian Li 系列作品集',
    tagline: '鋁件質感與模組化機殼配置',
    description: '適合追求高質感外觀和進階水冷規劃的玩家與創作者。',
    focus: ['模組化風扇配置', '雙艙視覺比例', '進階水冷預留空間'],
    gallery: [2, 6, 13, 16, 17, 19],
  },
};

export const defaultCaseProfile: CaseProfile = {
  id: 'all',
  name: '品牌機殼作品集',
  tagline: '依品牌風格快速找到你要的主機方向',
  description:
    '從外型、風道、噪音到升級性，我們把每個品牌的優勢整理成可比較的方案。',
  focus: ['同預算品牌比較', '外觀與效能配平', '可維護性優先'],
  gallery: [0, 5, 10, 15, 18, 20],
};

export const contactChannels = [
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
] as const;

export const serviceHighlights = [
  '出貨前會提供壓測與驗機影片',
  '每張配單附替代方案，避免缺貨卡單',
  '提供後續升級優先順序，不走回頭路',
  '高雄在地可預約到店諮詢',
];

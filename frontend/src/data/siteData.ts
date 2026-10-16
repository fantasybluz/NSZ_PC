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

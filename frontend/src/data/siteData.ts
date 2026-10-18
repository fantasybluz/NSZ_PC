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

// 前台的範例推薦配單、範例出機紀錄已經拿掉：API 讀不到時不顯示假資料（見 docs/requirements.md）
export const carouselImages = carouselImageFiles.map(
  (filename) => `/images/carousel/${filename}`,
);

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


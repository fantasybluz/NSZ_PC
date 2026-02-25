export interface BlogArticleSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  summary: string;
  coverImage: string;
  publishedAt: string;
  updatedAt: string;
  authorName: string;
  readingMinutes: number;
  tags: string[];
  sections: BlogArticleSection[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'gaming-pc-budget-allocation-guide',
    title: '遊戲主機預算怎麼分：先抓顯卡，再回推整體平台',
    summary:
      '這篇整理 3 萬、5 萬、8 萬級距的配單邏輯，避免把預算花在體感差異小的零件。',
    coverImage: '/images/carousel/IMG_6486.JPG',
    publishedAt: '2026-02-20',
    updatedAt: '2026-02-20',
    authorName: 'NSZPC 技術團隊',
    readingMinutes: 6,
    tags: ['預算規劃', '遊戲主機', '顯示卡', '升級策略'],
    sections: [
      {
        heading: '先定解析度與更新率，再決定顯示卡等級',
        paragraphs: [
          '如果目標是 1080p 高幀率，顯示卡可抓中高階；若是 2K 高刷或 4K 遊戲，顯示卡預算比例要明顯提高。',
          '先確定螢幕規格與常玩遊戲類型，才能避免 CPU、主機板過度堆料，卻把最關鍵的顯示卡壓縮掉。',
        ],
      },
      {
        heading: '主機預算比例建議',
        paragraphs: [
          '可用「顯示卡 35%-45%、CPU 15%-22%、其餘分配給記憶體/儲存/電源/機殼」作為起點，再依需求微調。',
        ],
        bullets: [
          '偏競技遊戲：提高 CPU 與記憶體頻率權重。',
          '偏 3A 單機：優先拉高顯示卡與散熱能力。',
          '預算有限時：先保留電源與主板升級空間。',
        ],
      },
      {
        heading: '容易踩雷的三件事',
        paragraphs: [
          '第一是只看單一跑分；第二是忽略電源品質；第三是沒有預留未來 12 個月的升級路線。',
          '合理的配單不只看今天跑得快，也要確保下次升級不必整台重組。',
        ],
      },
    ],
  },
  {
    slug: 'airflow-and-noise-balance-for-creator-pc',
    title: '創作者主機散熱與噪音平衡：風道比堆風扇更重要',
    summary:
      '剪輯與渲染工作站要長時間穩定輸出，重點在風道規劃、曲線設定與灰塵管理。',
    coverImage: '/images/carousel/IMG_6158.JPG',
    publishedAt: '2026-02-17',
    updatedAt: '2026-02-18',
    authorName: 'NSZPC 技術團隊',
    readingMinutes: 7,
    tags: ['散熱調校', '創作工作站', '噪音控制', '風道'],
    sections: [
      {
        heading: '正壓或微正壓是長期使用的安全選擇',
        paragraphs: [
          '對大多數創作主機，建議採微正壓風道，降低灰塵從縫隙倒灌，維持散熱器效率。',
          '進氣與排氣風量不需要追求極端，重點是熱區附近有穩定氣流通過。',
        ],
      },
      {
        heading: '風扇曲線先穩後快',
        paragraphs: [
          '曲線設定不要太激進，避免輕載時頻繁升降轉造成噪音波動，影響剪輯錄音與工作專注度。',
        ],
        bullets: [
          'CPU 溫度 70 度內維持平滑曲線。',
          'GPU 溫度 75 度後再逐步拉高轉速。',
          '機殼風扇與顯卡風扇分開調校，避免互相干擾。',
        ],
      },
      {
        heading: '三個月一次的保養節奏',
        paragraphs: [
          '定期清理濾網、風扇與散熱鰭片，通常比更換新風扇更有感。若長期在高溫環境工作，建議縮短清理週期。',
        ],
      },
    ],
  },
  {
    slug: 'streaming-pc-cpu-gpu-memory-planning',
    title: '直播主機怎麼選：CPU、顯卡編碼與記憶體容量的取捨',
    summary:
      '直播場景除了遊戲畫面，還有擷取、插件與多視窗需求，配單邏輯和純遊戲主機不同。',
    coverImage: '/images/carousel/IMG_4722.JPG',
    publishedAt: '2026-02-14',
    updatedAt: '2026-02-14',
    authorName: 'NSZPC 技術團隊',
    readingMinutes: 6,
    tags: ['直播用途', 'CPU', '記憶體', '編碼器'],
    sections: [
      {
        heading: '直播瓶頸通常不只在顯示卡',
        paragraphs: [
          'OBS 場景切換、瀏覽器來源、過場與插件都會吃 CPU 與記憶體，若只拉高顯示卡，直播穩定性不一定會變好。',
        ],
      },
      {
        heading: '記憶體容量與頻率的實務建議',
        paragraphs: [
          '直播加遊戲建議 32GB 起跳；同時剪精華、開多視窗或跑 AI 工具時，64GB 會更穩。',
        ],
        bullets: [
          '32GB：主流直播與遊戲並行。',
          '64GB：多工作業與高負載插件更有餘裕。',
          '頻率與時序要搭配平台相容性，不要只追單一數字。',
        ],
      },
      {
        heading: '編碼器選擇重點',
        paragraphs: [
          '現代顯卡硬體編碼品質已足夠多數平台需求，關鍵是整體穩定度與溫控，而不是單純提高位元率。',
        ],
      },
    ],
  },
  {
    slug: 'ssd-and-storage-layout-for-editing-workflow',
    title: '剪輯工作站硬碟配置：系統碟、素材碟、快取碟怎麼拆',
    summary:
      '用對儲存分層能明顯降低掉幀與卡頓，這篇用實務流程拆解 SSD 佈局。',
    coverImage: '/images/carousel/IMG_6477.JPG',
    publishedAt: '2026-02-11',
    updatedAt: '2026-02-12',
    authorName: 'NSZPC 技術團隊',
    readingMinutes: 8,
    tags: ['儲存規劃', '剪輯工作站', 'SSD', '效能優化'],
    sections: [
      {
        heading: '至少兩顆 SSD 的基本分工',
        paragraphs: [
          '系統與軟體獨立一顆，素材與專案另一顆，能避免讀寫互搶造成時間軸卡頓。',
          '若預算允許，快取與輸出再獨立一顆，可提升高碼率素材處理穩定度。',
        ],
      },
      {
        heading: '容量不是唯一，持續寫入能力同樣重要',
        paragraphs: [
          '長時間轉檔或代理檔生成會考驗 SSD 寫入持續性，建議優先選擇有穩定韌體與散熱條件的型號。',
        ],
      },
      {
        heading: '備份策略要先設計',
        paragraphs: [
          '專案分層再好，沒有備份仍有風險。至少準備定期快照與異地副本，避免單點故障。',
        ],
      },
    ],
  },
];

export const getBlogDetailPath = (slug: string): string => {
  return `/blog/${encodeURIComponent(slug)}`;
};

export const getBlogPostBySlug = (slug: string): BlogPost | undefined => {
  return blogPosts.find((post) => post.slug === slug);
};

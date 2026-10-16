export type OrderStatus = 'pending' | 'shipping' | 'delivered' | 'cancelled';

// 後台登入的人（Cloudflare Access 驗過的 email）；欄位跟前端的 AdminUser 一樣
export interface PublicUser {
  id: string;
  username: string;
  role: 'admin';
  createdAt: string;
}

export interface BuildRecord {
  id: string;
  name: string;
  description: string;
  detailIntro: string;
  requirementIntro: string;
  youtubeEmbedUrl: string;
  price: number;
  dealDate: string;
  badge?: string;
  tags: string[];
  image: string;
  cpu: string;
  motherboard: string;
  ram: string;
  storage: string;
  gpu: string;
  psu: string;
  pcCase: string;
  accessories: string[];
  specs: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRecord {
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
  detailFaqs: CategoryFaqRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryFaqRecord {
  question: string;
  answer: string;
}

export interface OrderRecord {
  id: string;
  date: string;
  item: string;
  requirementIntro: string;
  youtubeEmbedUrl: string;
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

export interface BlogArticleSectionRecord {
  heading: string;
  paragraphs: string[];
  bullets: string[];
}

export interface BlogPostRecord {
  id: string;
  slug: string;
  title: string;
  summary: string;
  coverImage: string;
  publishedAt: string;
  updatedAt: string;
  authorName: string;
  readingMinutes: number;
  tags: string[];
  youtubeEmbedUrl: string;
  sections: BlogArticleSectionRecord[];
  createdAt: string;
}

export interface SiteStatRecord {
  value: string;
  label: string;
}

export interface ShippingStepRecord {
  title: string;
  description: string;
}

export interface TestimonialRecord {
  quote: string;
  name: string;
  tag: string;
}

export interface ContactChannelRecord {
  icon: string;
  label: string;
  value: string;
  href: string;
}

export interface BrandPortfolioRecord {
  id: string;
  name: string;
  tagline: string;
  focus: string[];
  images?: string[];
  tags: string[];
}

export interface SiteContentRecord {
  homeHeroKicker: string;
  homeHeroTitle: string;
  homeHeroSubtitle: string;
  homeCategorySubtitle: string;
  homeBuildSubtitle: string;
  homeWorkflowSubtitle: string;
  homeContactSubtitle: string;
  homeStats: SiteStatRecord[];
  categoriesHeroSubtitle: string;
  categoriesQuickTags: string[];
  categoriesPortfolioTitle: string;
  categoriesPortfolioSubtitle: string;
  categoriesBrandPortfolios: BrandPortfolioRecord[];
  brandHeroTitle: string;
  brandHeroSubtitle: string;
  shipmentTagCatalog: string[];
  shippingSteps: ShippingStepRecord[];
  serviceHighlights: string[];
  testimonials: TestimonialRecord[];
  contactChannels: ContactChannelRecord[];
  footerAddress: string;
  footerSlogan: string;
  contactAddress: string;
  contactPhone: string;
  contactLine: string;
  updatedAt: string;
}

export interface DbMeta {
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface DbSchema {
  meta: DbMeta;
  categories: CategoryRecord[];
  builds: BuildRecord[];
  orders: OrderRecord[];
  blogPosts: BlogPostRecord[];
  siteContent: SiteContentRecord;
}

export type CollectionName =
  | 'builds'
  | 'categories'
  | 'orders'
  | 'blogPosts';

export type MutablePayload = Record<string, unknown>;

export interface ValidationResult<T> {
  ok: boolean;
  errors: string[];
  value: T;
}

export interface BuildInput {
  name: string;
  description: string;
  detailIntro: string;
  requirementIntro: string;
  youtubeEmbedUrl: string;
  price: number;
  dealDate: string;
  image: string;
  badge: string;
  tags: string[];
  cpu: string;
  motherboard: string;
  ram: string;
  storage: string;
  gpu: string;
  psu: string;
  pcCase: string;
  accessories: string[];
  specs: string[];
}

export interface CategoryInput {
  title: string;
  summary: string;
  primaryCategory: string;
  secondaryCategory: string;
  tags: string[];
  points: string[];
  detailIntro: string;
  detailHeroImage: string;
  detailRecommendations: string[];
  detailFaqs: CategoryFaqRecord[];
}

export interface OrderInput {
  date: string;
  item: string;
  requirementIntro: string;
  youtubeEmbedUrl: string;
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
}

export interface BlogPostInput {
  slug: string;
  title: string;
  summary: string;
  coverImage: string;
  publishedAt: string;
  updatedAt: string;
  authorName: string;
  readingMinutes: number;
  tags: string[];
  youtubeEmbedUrl: string;
  sections: BlogArticleSectionRecord[];
}

export interface SiteContentInput {
  homeHeroKicker: string;
  homeHeroTitle: string;
  homeHeroSubtitle: string;
  homeCategorySubtitle: string;
  homeBuildSubtitle: string;
  homeWorkflowSubtitle: string;
  homeContactSubtitle: string;
  homeStats: SiteStatRecord[];
  categoriesHeroSubtitle: string;
  categoriesQuickTags: string[];
  categoriesPortfolioTitle: string;
  categoriesPortfolioSubtitle: string;
  categoriesBrandPortfolios: BrandPortfolioRecord[];
  brandHeroTitle: string;
  brandHeroSubtitle: string;
  shipmentTagCatalog: string[];
  shippingSteps: ShippingStepRecord[];
  serviceHighlights: string[];
  testimonials: TestimonialRecord[];
  contactChannels: ContactChannelRecord[];
  footerAddress: string;
  footerSlogan: string;
  contactAddress: string;
  contactPhone: string;
  contactLine: string;
}


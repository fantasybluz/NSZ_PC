import type { ContentRepository } from '../../domain/content/ContentRepository.ts';
import type {
  BlogPostRecord,
  BuildRecord,
  CategoryRecord,
  OrderRecord,
  SiteContentRecord,
} from '../../lib/types.ts';

export class PublicContentQueryService {
  private readonly repository: ContentRepository;

  constructor(repository: ContentRepository) {
    this.repository = repository;
  }

  async listBuilds(): Promise<BuildRecord[]> {
    const snapshot = await this.repository.getPublicContent();
    return snapshot.builds;
  }

  async listCategories(): Promise<CategoryRecord[]> {
    const snapshot = await this.repository.getPublicContent();
    return snapshot.categories;
  }

  // 公開的出機紀錄不給服務費（只給售價）；後台的 /api/admin/orders 照舊有
  async listOrders(limit: number): Promise<Omit<OrderRecord, 'serviceFee'>[]> {
    const snapshot = await this.repository.getPublicContent();
    const safeLimit = Math.max(1, Math.min(Number.isFinite(limit) ? Math.trunc(limit) : 5, 20));
    return snapshot.orders.slice(0, safeLimit).map(({ serviceFee: _serviceFee, ...order }) => order);
  }

  async listBlogPosts(): Promise<BlogPostRecord[]> {
    const snapshot = await this.repository.getPublicContent();
    return snapshot.blogPosts;
  }

  async getSiteContent(): Promise<SiteContentRecord> {
    const snapshot = await this.repository.getPublicContent();
    return snapshot.siteContent;
  }
}

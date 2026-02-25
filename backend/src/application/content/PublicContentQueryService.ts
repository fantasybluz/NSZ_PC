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

  async listOrders(limit: number): Promise<OrderRecord[]> {
    const snapshot = await this.repository.getPublicContent();
    const safeLimit = Math.max(1, Math.min(Number.isFinite(limit) ? Math.trunc(limit) : 5, 20));
    return snapshot.orders.slice(0, safeLimit);
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

import type { ContentRepository } from '../../domain/content/ContentRepository.ts';
import type {
  BlogPostRecord,
  BuildRecord,
  CategoryRecord,
  OrderRecord,
  SiteContentRecord,
} from '../../lib/types.ts';

export type PublicOrder = Omit<OrderRecord, 'serviceFee'>;

const toPublicOrder = ({ serviceFee: _serviceFee, ...order }: OrderRecord): PublicOrder => order;

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

  // 公開的出機紀錄不給服務費（只給售價）；後台的 /api/admin/orders 照舊有。
  // limit：首頁拿幾筆就給幾筆（1～100）；'all' 是全部（出機標籤頁要用全部的紀錄篩選）。
  // 出機紀錄整份存在 D1 的一列（最多約 1.9MB），全部給也不會無限大
  async listOrders(limit: number | 'all'): Promise<PublicOrder[]> {
    const snapshot = await this.repository.getPublicContent();
    const orders =
      limit === 'all'
        ? snapshot.orders
        : snapshot.orders.slice(0, Math.max(1, Math.min(Number.isFinite(limit) ? Math.trunc(limit) : 5, 100)));
    return orders.map(toPublicOrder);
  }

  /** 一筆出機紀錄（出機詳細頁用），沒有回 null */
  async getOrder(id: string): Promise<PublicOrder | null> {
    const snapshot = await this.repository.getPublicContent();
    const order = snapshot.orders.find((item) => item.id === id);
    return order ? toPublicOrder(order) : null;
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

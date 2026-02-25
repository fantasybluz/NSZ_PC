import type {
  BlogPostRecord,
  BuildRecord,
  CategoryRecord,
  CollectionName,
  DbSchema,
  OrderRecord,
  SiteContentRecord,
} from '../../lib/types.ts';

export type ManagedCollection = CollectionName;
export type ManagedEntity = DbSchema[CollectionName][number];
export type ManagedEntityPayload = Record<string, unknown>;

export interface DashboardOverview {
  totals: {
    builds: number;
    categories: number;
    orders: number;
    users: number;
  };
  recentOrders: OrderRecord[];
  lastUpdatedAt: string;
}

export interface PublicContentSnapshot {
  builds: BuildRecord[];
  categories: CategoryRecord[];
  orders: OrderRecord[];
  blogPosts: BlogPostRecord[];
  siteContent: SiteContentRecord;
}

export interface ContentRepository {
  getDashboardOverview(): Promise<DashboardOverview>;
  getPublicContent(): Promise<PublicContentSnapshot>;
  getSiteContent(): Promise<SiteContentRecord>;
  replaceSiteContent(next: SiteContentRecord): Promise<void>;

  listManagedCollection(collection: ManagedCollection): Promise<ManagedEntity[]>;
  findManagedEntity(collection: ManagedCollection, entityId: string): Promise<ManagedEntity | null>;
  createManagedEntity(collection: ManagedCollection, entity: ManagedEntity): Promise<void>;
  updateManagedEntity(
    collection: ManagedCollection,
    entityId: string,
    payload: ManagedEntityPayload,
    updatedAt: string,
  ): Promise<ManagedEntity | null>;
  removeManagedEntity(collection: ManagedCollection, entityId: string): Promise<ManagedEntity | null>;
}

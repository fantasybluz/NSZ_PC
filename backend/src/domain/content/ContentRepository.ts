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

/**
 * 寫入前的檢查（例如文章 slug 不能重複）：在同一個 mutateDb 裡、拿最新的那份資料跑，
 * 回傳錯誤訊息；有錯就不寫入。這樣兩個請求同時存同一個 slug 也擋得住。
 */
export type EntityGuard = (list: ManagedEntity[]) => string[];

export type EntityWriteResult =
  | { kind: 'ok'; data: ManagedEntity }
  | { kind: 'not_found' }
  | { kind: 'conflict'; errors: string[] };

export interface PublicContentSnapshot {
  builds: BuildRecord[];
  categories: CategoryRecord[];
  orders: OrderRecord[];
  blogPosts: BlogPostRecord[];
  siteContent: SiteContentRecord;
}

export interface ContentRepository {
  getPublicContent(): Promise<PublicContentSnapshot>;
  getSiteContent(): Promise<SiteContentRecord>;
  /** 在同一個 mutateDb（有版本號檢查）裡讀出目前的網站文字、算出新的、寫回去 */
  updateSiteContent(build: (current: SiteContentRecord) => SiteContentRecord): Promise<SiteContentRecord>;

  listManagedCollection(collection: ManagedCollection): Promise<ManagedEntity[]>;
  findManagedEntity(collection: ManagedCollection, entityId: string): Promise<ManagedEntity | null>;
  createManagedEntity(
    collection: ManagedCollection,
    entity: ManagedEntity,
    guard?: EntityGuard,
  ): Promise<EntityWriteResult>;
  updateManagedEntity(
    collection: ManagedCollection,
    entityId: string,
    payload: ManagedEntityPayload,
    updatedAt: string,
    guard?: EntityGuard,
  ): Promise<EntityWriteResult>;
  removeManagedEntity(collection: ManagedCollection, entityId: string): Promise<ManagedEntity | null>;
}

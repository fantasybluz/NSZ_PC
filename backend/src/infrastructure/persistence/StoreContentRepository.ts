import type {
  ContentRepository,
  EntityGuard,
  EntityWriteResult,
  ManagedCollection,
  ManagedEntity,
  ManagedEntityPayload,
  PublicContentSnapshot,
} from '../../domain/content/ContentRepository.ts';
import type { SiteContentRecord } from '../../lib/types.ts';
import { mutateDb, readDb } from '../../lib/store.ts';

export class StoreContentRepository implements ContentRepository {
  async getPublicContent(): Promise<PublicContentSnapshot> {
    const db = await readDb();
    return {
      builds: db.builds,
      categories: db.categories,
      orders: db.orders,
      blogPosts: db.blogPosts,
      siteContent: db.siteContent,
    };
  }

  async getSiteContent(): Promise<SiteContentRecord> {
    const db = await readDb();
    return db.siteContent;
  }

  async updateSiteContent(
    build: (current: SiteContentRecord) => SiteContentRecord,
  ): Promise<SiteContentRecord> {
    // 讀和寫在同一個 mutateDb 裡：別人同時存了的話版本號會對不上，整個重讀重做，不會蓋掉別人的改動
    return mutateDb((draft) => {
      draft.siteContent = build(draft.siteContent);
      return draft.siteContent;
    });
  }

  async listManagedCollection(collection: ManagedCollection): Promise<ManagedEntity[]> {
    const db = await readDb();
    return db[collection] as ManagedEntity[];
  }

  async findManagedEntity(collection: ManagedCollection, entityId: string): Promise<ManagedEntity | null> {
    const db = await readDb();
    const list = db[collection] as ManagedEntity[];
    return list.find((item) => item.id === entityId) || null;
  }

  async createManagedEntity(
    collection: ManagedCollection,
    entity: ManagedEntity,
    guard?: EntityGuard,
  ): Promise<EntityWriteResult> {
    return mutateDb((draft): EntityWriteResult => {
      const list = draft[collection] as ManagedEntity[];
      const errors = guard?.(list) ?? [];
      if (errors.length > 0) {
        return { kind: 'conflict', errors };
      }
      list.unshift(entity);
      return { kind: 'ok', data: entity };
    });
  }

  async updateManagedEntity(
    collection: ManagedCollection,
    entityId: string,
    payload: ManagedEntityPayload,
    updatedAt: string,
    guard?: EntityGuard,
  ): Promise<EntityWriteResult> {
    return mutateDb((draft): EntityWriteResult => {
      const list = draft[collection] as ManagedEntity[];
      const index = list.findIndex((item) => item.id === entityId);
      if (index === -1) {
        return { kind: 'not_found' };
      }

      const errors = guard?.(list) ?? [];
      if (errors.length > 0) {
        return { kind: 'conflict', errors };
      }

      const updated = {
        ...list[index],
        ...payload,
        updatedAt,
      } as ManagedEntity;
      list[index] = updated;
      return { kind: 'ok', data: updated };
    });
  }

  async removeManagedEntity(collection: ManagedCollection, entityId: string): Promise<ManagedEntity | null> {
    return mutateDb((draft) => {
      const list = draft[collection] as ManagedEntity[];
      const index = list.findIndex((item) => item.id === entityId);
      if (index === -1) {
        return null;
      }
      const [removed] = list.splice(index, 1);
      return removed;
    });
  }
}

import type {
  ContentRepository,
  DashboardOverview,
  ManagedCollection,
  ManagedEntity,
  ManagedEntityPayload,
  PublicContentSnapshot,
} from '../../domain/content/ContentRepository.ts';
import type { SiteContentRecord } from '../../lib/types.ts';
import { mutateDb, readDb } from '../../lib/store.ts';

export class StoreContentRepository implements ContentRepository {
  async getDashboardOverview(): Promise<DashboardOverview> {
    const db = await readDb();
    return {
      totals: {
        builds: db.builds.length,
        categories: db.categories.length,
        orders: db.orders.length,
        users: db.users.length,
      },
      recentOrders: db.orders.slice(0, 5),
      lastUpdatedAt: db.meta.updatedAt,
    };
  }

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

  async replaceSiteContent(next: SiteContentRecord): Promise<void> {
    await mutateDb((draft) => {
      draft.siteContent = next;
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

  async createManagedEntity(collection: ManagedCollection, entity: ManagedEntity): Promise<void> {
    await mutateDb((draft) => {
      const list = draft[collection] as ManagedEntity[];
      list.unshift(entity);
    });
  }

  async updateManagedEntity(
    collection: ManagedCollection,
    entityId: string,
    payload: ManagedEntityPayload,
    updatedAt: string,
  ): Promise<ManagedEntity | null> {
    let updated: ManagedEntity | null = null;

    await mutateDb((draft) => {
      const list = draft[collection] as ManagedEntity[];
      const index = list.findIndex((item) => item.id === entityId);
      if (index === -1) {
        return;
      }

      updated = {
        ...list[index],
        ...payload,
        updatedAt,
      } as ManagedEntity;

      list[index] = updated;
    });

    return updated;
  }

  async removeManagedEntity(collection: ManagedCollection, entityId: string): Promise<ManagedEntity | null> {
    let removed: ManagedEntity | null = null;

    await mutateDb((draft) => {
      const list = draft[collection] as ManagedEntity[];
      const index = list.findIndex((item) => item.id === entityId);
      if (index === -1) {
        return;
      }

      [removed] = list.splice(index, 1);
    });

    return removed;
  }
}

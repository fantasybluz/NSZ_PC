import type {
  ContentRepository,
  EntityGuard,
  ManagedCollection,
  ManagedEntity,
} from '../../domain/content/ContentRepository.ts';
import type { MutablePayload, ValidationResult } from '../../lib/types.ts';

type CrudValidator = (payload: MutablePayload) => ValidationResult<Record<string, unknown>>;

export type CrudReadResult =
  | { kind: 'ok'; data: ManagedEntity }
  | { kind: 'not_found' };

export type CrudWriteResult =
  | { kind: 'ok'; data: ManagedEntity }
  | { kind: 'not_found' }
  | { kind: 'validation_failed'; errors: string[] };

/**
 * 寫入前要跟同集合其他資料比對的規則（在 mutateDb 裡跑，見 ContentRepository 的 EntityGuard）。
 * selfId：更新時是自己的 id（不跟自己比），新增時是 null。
 */
const uniquenessGuards: Partial<
  Record<ManagedCollection, (value: Record<string, unknown>, selfId: string | null) => EntityGuard>
> = {
  // 文章網址是 /blog/<slug>，重複的話其中一篇會打不開
  blogPosts: (value, selfId) => (list) => {
    const slug = String(value.slug ?? '');
    const taken = list.some((item) => item.id !== selfId && 'slug' in item && item.slug === slug);
    return taken ? [`Slug「${slug}」已經有別篇文章在用了，請換一個`] : [];
  },
};

/**
 * 更新時間：一般集合用寫入的時間（ISO）。
 * 文章的 updatedAt 是後台表單填的「更新日」（YYYY-MM-DD，validateBlogPostInput 檢查過），
 * sitemap 的 lastmod、文章頁的 article:modified_time 都用它，所以照填的存，不要蓋掉。
 */
const resolveUpdatedAt = (value: Record<string, unknown>, timestamp: string): string =>
  typeof value.updatedAt === 'string' && value.updatedAt ? value.updatedAt : timestamp;

export class CollectionCrudService {
  private readonly repository: ContentRepository;
  private readonly validators: Record<ManagedCollection, CrudValidator>;

  constructor(
    repository: ContentRepository,
    validators: Record<ManagedCollection, CrudValidator>,
  ) {
    this.repository = repository;
    this.validators = validators;
  }

  async list(collection: ManagedCollection): Promise<ManagedEntity[]> {
    return this.repository.listManagedCollection(collection);
  }

  async get(collection: ManagedCollection, entityId: string): Promise<CrudReadResult> {
    const found = await this.repository.findManagedEntity(collection, entityId);
    if (!found) {
      return { kind: 'not_found' };
    }

    return { kind: 'ok', data: found };
  }

  async create(collection: ManagedCollection, payload: MutablePayload): Promise<CrudWriteResult> {
    const validation = this.validators[collection](payload);
    if (!validation.ok) {
      return {
        kind: 'validation_failed',
        errors: validation.errors,
      };
    }

    const timestamp = new Date().toISOString();
    const created = {
      id: crypto.randomUUID(),
      ...validation.value,
      createdAt: timestamp,
      updatedAt: resolveUpdatedAt(validation.value, timestamp),
    } as ManagedEntity;

    const result = await this.repository.createManagedEntity(
      collection,
      created,
      uniquenessGuards[collection]?.(validation.value, null),
    );
    if (result.kind === 'conflict') {
      return { kind: 'validation_failed', errors: result.errors };
    }
    return result;
  }

  async update(
    collection: ManagedCollection,
    entityId: string,
    payload: MutablePayload,
  ): Promise<CrudWriteResult> {
    const validation = this.validators[collection](payload);
    if (!validation.ok) {
      return {
        kind: 'validation_failed',
        errors: validation.errors,
      };
    }

    const result = await this.repository.updateManagedEntity(
      collection,
      entityId,
      validation.value,
      resolveUpdatedAt(validation.value, new Date().toISOString()),
      uniquenessGuards[collection]?.(validation.value, entityId),
    );
    if (result.kind === 'conflict') {
      return { kind: 'validation_failed', errors: result.errors };
    }
    return result;
  }

  async remove(collection: ManagedCollection, entityId: string): Promise<CrudReadResult> {
    const removed = await this.repository.removeManagedEntity(collection, entityId);
    if (!removed) {
      return { kind: 'not_found' };
    }

    return { kind: 'ok', data: removed };
  }
}

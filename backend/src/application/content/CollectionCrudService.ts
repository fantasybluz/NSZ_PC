import crypto from 'node:crypto';

import type {
  ContentRepository,
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
      updatedAt: timestamp,
    } as ManagedEntity;

    await this.repository.createManagedEntity(collection, created);
    return { kind: 'ok', data: created };
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

    const updatedAt = new Date().toISOString();
    const updated = await this.repository.updateManagedEntity(
      collection,
      entityId,
      validation.value,
      updatedAt,
    );

    if (!updated) {
      return { kind: 'not_found' };
    }

    return { kind: 'ok', data: updated };
  }

  async remove(collection: ManagedCollection, entityId: string): Promise<CrudReadResult> {
    const removed = await this.repository.removeManagedEntity(collection, entityId);
    if (!removed) {
      return { kind: 'not_found' };
    }

    return { kind: 'ok', data: removed };
  }
}

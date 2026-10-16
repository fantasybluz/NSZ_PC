import type { ManagedCollection } from '../../domain/content/ContentRepository.ts';
import type { MutablePayload, ValidationResult } from '../../lib/types.ts';
import {
  validateBlogPostInput,
  validateBuildInput,
  validateCategoryInput,
  validateOrderInput,
} from '../../lib/validation.ts';

export type CollectionValidator = (payload: MutablePayload) => ValidationResult<Record<string, unknown>>;

export const collectionValidators: Record<ManagedCollection, CollectionValidator> = {
  builds: validateBuildInput as unknown as CollectionValidator,
  blogPosts: validateBlogPostInput as unknown as CollectionValidator,
  categories: validateCategoryInput as unknown as CollectionValidator,
  orders: validateOrderInput as unknown as CollectionValidator,
};

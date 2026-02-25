import type { ManagedCollection } from '../../domain/content/ContentRepository.ts';
import type { MutablePayload, ValidationResult } from '../../lib/types.ts';
import {
  validateBlogPostInput,
  validateBuildInput,
  validateCategoryInput,
  validateInventoryInput,
  validateOrderInput,
  validatePersonalProcurementInput,
  validateProcurementInput,
} from '../../lib/validation.ts';

export type CollectionValidator = (payload: MutablePayload) => ValidationResult<Record<string, unknown>>;

export const collectionValidators: Record<ManagedCollection, CollectionValidator> = {
  builds: validateBuildInput as CollectionValidator,
  blogPosts: validateBlogPostInput as CollectionValidator,
  categories: validateCategoryInput as CollectionValidator,
  orders: validateOrderInput as CollectionValidator,
  inventories: validateInventoryInput as CollectionValidator,
  procurements: validateProcurementInput as CollectionValidator,
  personalProcurements: validatePersonalProcurementInput as CollectionValidator,
};

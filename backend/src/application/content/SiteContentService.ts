import type { ContentRepository } from '../../domain/content/ContentRepository.ts';
import type {
  MutablePayload,
  SiteContentInput,
  SiteContentRecord,
  ValidationResult,
} from '../../lib/types.ts';

export type SiteContentUpdateResult =
  | { kind: 'ok'; data: SiteContentRecord }
  | { kind: 'validation_failed'; errors: string[] };

type SiteContentValidator = (payload: MutablePayload) => ValidationResult<SiteContentInput>;

export class SiteContentService {
  private readonly repository: ContentRepository;
  private readonly validateSiteContent: SiteContentValidator;

  constructor(
    repository: ContentRepository,
    validateSiteContent: SiteContentValidator,
  ) {
    this.repository = repository;
    this.validateSiteContent = validateSiteContent;
  }

  async getSiteContent(): Promise<SiteContentRecord> {
    return this.repository.getSiteContent();
  }

  async updateSiteContent(payload: MutablePayload): Promise<SiteContentUpdateResult> {
    const validation = this.validateSiteContent(payload);
    if (!validation.ok) {
      return {
        kind: 'validation_failed',
        errors: validation.errors,
      };
    }

    const updatedAt = new Date().toISOString();
    const next: SiteContentRecord = {
      ...validation.value,
      updatedAt,
    };

    await this.repository.replaceSiteContent(next);
    return { kind: 'ok', data: next };
  }
}

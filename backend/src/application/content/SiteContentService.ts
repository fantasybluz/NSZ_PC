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

    // 沒帶的舊欄位沿用原本的值（types.ts 的 RetiredSiteContentKey）。
    // 讀「目前的值」和寫回去在同一個 mutateDb 裡，同時有人存檔也不會蓋掉對方的改動
    const updatedAt = new Date().toISOString();
    const next = await this.repository.updateSiteContent((current) => ({
      ...current,
      ...validation.value,
      updatedAt,
    }));

    return { kind: 'ok', data: next };
  }
}

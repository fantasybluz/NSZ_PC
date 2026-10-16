import { AdminDashboardService } from '../../application/content/AdminDashboardService.ts';
import { CollectionCrudService } from '../../application/content/CollectionCrudService.ts';
import { PublicContentQueryService } from '../../application/content/PublicContentQueryService.ts';
import { SiteContentService } from '../../application/content/SiteContentService.ts';
import { collectionValidators } from '../../application/content/collectionValidators.ts';
import { StoreContentRepository } from '../../infrastructure/persistence/StoreContentRepository.ts';
import { validateSiteContentInput } from '../../lib/validation.ts';

// 登入改由 Cloudflare Access 處理（lib/access.ts），這裡只剩內容相關的服務
export interface ServiceContainer {
  dashboardService: AdminDashboardService;
  publicQueryService: PublicContentQueryService;
  siteContentService: SiteContentService;
  crudService: CollectionCrudService;
}

export const createServiceContainer = (): ServiceContainer => {
  const contentRepository = new StoreContentRepository();

  return {
    dashboardService: new AdminDashboardService(contentRepository),
    publicQueryService: new PublicContentQueryService(contentRepository),
    siteContentService: new SiteContentService(contentRepository, validateSiteContentInput),
    crudService: new CollectionCrudService(contentRepository, collectionValidators),
  };
};

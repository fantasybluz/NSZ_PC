import { AuthApplicationService } from '../../application/auth/AuthApplicationService.ts';
import { AdminDashboardService } from '../../application/content/AdminDashboardService.ts';
import { CollectionCrudService } from '../../application/content/CollectionCrudService.ts';
import { PublicContentQueryService } from '../../application/content/PublicContentQueryService.ts';
import { SiteContentService } from '../../application/content/SiteContentService.ts';
import { collectionValidators } from '../../application/content/collectionValidators.ts';
import { StoreAuthRepository } from '../../infrastructure/persistence/StoreAuthRepository.ts';
import { StoreContentRepository } from '../../infrastructure/persistence/StoreContentRepository.ts';
import { JwtAccessTokenService } from '../../infrastructure/security/JwtAccessTokenService.ts';
import { Sha256PasswordService } from '../../infrastructure/security/Sha256PasswordService.ts';
import { validateSiteContentInput } from '../../lib/validation.ts';

interface ServiceContainerConfig {
  authSecret: string;
  tokenTtlHours: number;
}

export interface ServiceContainer {
  authService: AuthApplicationService;
  dashboardService: AdminDashboardService;
  publicQueryService: PublicContentQueryService;
  siteContentService: SiteContentService;
  crudService: CollectionCrudService;
}

export const createServiceContainer = (config: ServiceContainerConfig): ServiceContainer => {
  const authRepository = new StoreAuthRepository();
  const contentRepository = new StoreContentRepository();
  const tokenService = new JwtAccessTokenService({
    secret: config.authSecret,
    tokenTtlHours: config.tokenTtlHours,
  });
  const passwordService = new Sha256PasswordService();

  return {
    authService: new AuthApplicationService(authRepository, tokenService, passwordService, {
      tokenTtlHours: config.tokenTtlHours,
    }),
    dashboardService: new AdminDashboardService(contentRepository),
    publicQueryService: new PublicContentQueryService(contentRepository),
    siteContentService: new SiteContentService(contentRepository, validateSiteContentInput),
    crudService: new CollectionCrudService(contentRepository, collectionValidators),
  };
};

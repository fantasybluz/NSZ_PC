import type { DashboardOverview } from '../../domain/content/ContentRepository.ts';
import type { ContentRepository } from '../../domain/content/ContentRepository.ts';

export class AdminDashboardService {
  private readonly repository: ContentRepository;

  constructor(repository: ContentRepository) {
    this.repository = repository;
  }

  async getOverview(): Promise<DashboardOverview> {
    return this.repository.getDashboardOverview();
  }
}

import type { FilterResult, PopularityCriteria, PopularityFilterDetails, Repository } from '../../../types/index.js';
import { BaseFilterStage } from '../filter-stage.js';

export class PopularityFilter extends BaseFilterStage {
  id = 1;
  name = 'basic_popularity';
  description = '基本人気度フィルタ - スター数、フォーク数、アーカイブ状況をチェック';

  constructor(private criteria: PopularityCriteria) {
    super();
  }

  async evaluate(repository: Repository): Promise<FilterResult> {
    console.debug(`[PopularityFilter] Evaluating ${repository.full_name}`);

    const checks = {
      stars: (repository.stars_count ?? 0) >= this.criteria.min_stars,
      forks: (repository.forks_count ?? 0) >= this.criteria.min_forks,
      not_archived: this.criteria.not_archived ? !repository.archived : true,
      not_disabled: this.criteria.not_disabled ? !repository.disabled : true,
    };

    const passed = Object.values(checks).every((check) => check);

    // スコア計算 (0-1の範囲)
    const starScore = this.normalizeScore(
      repository.stars_count ?? 0,
      this.criteria.min_stars,
      this.criteria.min_stars * 10,
    );
    const forkScore = this.normalizeScore(
      repository.forks_count ?? 0,
      this.criteria.min_forks,
      this.criteria.min_forks * 10,
    );

    // アーカイブ・無効化のペナルティ
    const archiveScore = repository.archived ? 0 : 1;
    const disabledScore = repository.disabled ? 0 : 1;

    const score = (starScore + forkScore + archiveScore + disabledScore) / 4;

    const details: PopularityFilterDetails = {
      checks,
      stars_count: repository.stars_count,
      forks_count: repository.forks_count,
      archived: repository.archived ?? false,
      disabled: repository.disabled ?? false,
    };

    console.debug(`[PopularityFilter] ${repository.full_name}: passed=${passed}, score=${score.toFixed(3)}`);

    return this.createResult(passed, score, details);
  }
}

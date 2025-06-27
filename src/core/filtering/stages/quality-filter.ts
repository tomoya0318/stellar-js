import type { FilterResult, QualityCriteria, QualityFilterDetails, Repository } from '../../../types/index.js';
import { BaseFilterStage } from '../filter-stage.js';

export class QualityFilter extends BaseFilterStage {
  id = 3;
  name = 'quality_filter';
  description = '品質フィルタ - ライセンス、ドキュメント、プロジェクト管理機能をチェック';

  constructor(private criteria: QualityCriteria) {
    super();
  }

  async evaluate(repository: Repository): Promise<FilterResult> {
    console.debug(`[QualityFilter] Evaluating ${repository.full_name}`);

    const topics = Array.isArray(repository.topics) ? repository.topics : [];
    const hasDescription = repository.description !== null && repository.description.length > 10;

    const checks = {
      // Note: README check skipped (requires additional API calls for file contents)
      has_readme: true, // Assumed true (would require GitHub API call to verify)
      has_license: this.criteria.has_license ? repository.license !== null : true,
      documentation_quality: hasDescription,
    };

    const passed = this.criteria.has_license ? checks.has_license : true;

    // 品質スコア計算
    const licenseScore = checks.has_license ? 1 : 0;
    const descriptionScore = checks.documentation_quality ? 1 : 0;
    const homepageScore = repository.homepage ? 0.5 : 0;
    const topicsScore = this.normalizeScore(topics.length, 0, 5);
    const featuresScore =
      ((repository.has_issues ? 1 : 0) + (repository.has_projects ? 0.5 : 0) + (repository.has_wiki ? 0.5 : 0)) / 2;

    const score = (licenseScore + descriptionScore + homepageScore + topicsScore + featuresScore) / 5;

    const details: QualityFilterDetails = {
      checks,
      readme_score: 0.8, // Fixed value (actual README analysis not implemented)
      license_name: typeof repository.license === 'string' ? repository.license : null,
      has_description: hasDescription,
    };

    console.debug(`[QualityFilter] ${repository.full_name}: passed=${passed}, score=${score.toFixed(3)}`);

    return this.createResult(passed, score, details);
  }
}

import type {
  FilterResult,
  FinalSelectionCriteria,
  FinalSelectionFilterDetails,
  QualityAssessment,
  Repository,
} from '../../../types/index.js';
import { BaseFilterStage } from '../filter-stage.js';

export class FinalSelectionFilter extends BaseFilterStage {
  id = 4;
  name = 'final_selection';
  description = '最終選定フィルタ - 総合スコアとランキングに基づく最終選別';

  constructor(
    private criteria: FinalSelectionCriteria,
    private qualityAssessments: QualityAssessment[],
  ) {
    super();
  }

  async evaluate(repository: Repository): Promise<FilterResult> {
    console.debug(`[FinalSelectionFilter] Evaluating ${repository.full_name}`);

    // 該当リポジトリの品質評価を取得
    const assessment = this.qualityAssessments.find((a) => a.repository_id === repository.id);

    if (!assessment) {
      console.warn(`[FinalSelectionFilter] No quality assessment found for ${repository.full_name}`);
      return this.createResult(false, 0, {
        error: 'No quality assessment found',
        repository_id: repository.id,
      });
    }

    const checks = {
      meets_minimum_score: assessment.overall_score >= this.criteria.min_overall_score,
      in_top_percentile: this.isInTopPercentile(assessment, this.criteria.top_percentile),
    };

    const passed = checks.meets_minimum_score && checks.in_top_percentile;

    // 最終スコアは品質評価の総合スコアをそのまま使用
    const score = assessment.overall_score;

    const details: FinalSelectionFilterDetails = {
      overall_score: assessment.overall_score,
      popularity_score: assessment.popularity_score,
      activity_score: assessment.activity_score,
      quality_score: assessment.quality_score,
      community_score: assessment.community_score,
      overall_rank: assessment.overall_rank,
      popularity_rank: assessment.popularity_rank,
      checks,
      percentile_rank: this.calculatePercentileRank(assessment),
    };

    console.debug(
      `[FinalSelectionFilter] ${repository.full_name}: passed=${passed}, score=${score.toFixed(3)}, rank=${assessment.overall_rank}`,
    );

    return this.createResult(passed, score, details);
  }

  private isInTopPercentile(assessment: QualityAssessment, topPercentile: number): boolean {
    if (!assessment.overall_rank) return false;

    const totalCount = this.qualityAssessments.length;
    const requiredRank = Math.ceil(totalCount * (topPercentile / 100));

    return assessment.overall_rank <= requiredRank;
  }

  private calculatePercentileRank(assessment: QualityAssessment): number {
    if (!assessment.overall_rank) return 0;

    const totalCount = this.qualityAssessments.length;
    return Math.round(((totalCount - assessment.overall_rank + 1) / totalCount) * 100);
  }
}

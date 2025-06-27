import type { ActivityCriteria, ActivityFilterDetails, FilterResult, Repository } from '../../../types/index.js';
import { BaseFilterStage } from '../filter-stage.js';

export class ActivityFilter extends BaseFilterStage {
  id = 2;
  name = 'activity_filter';
  description = '活動度フィルタ - 最近のプッシュ活動、イシュー・プルリクエストの状況をチェック';

  constructor(private criteria: ActivityCriteria) {
    super();
  }

  async evaluate(repository: Repository): Promise<FilterResult> {
    console.debug(`[ActivityFilter] Evaluating ${repository.full_name}`);

    const pushDaysAgo = this.calculateDaysAgo(repository.pushed_at);
    const updateDaysAgo = this.calculateDaysAgo(repository.updated_at);

    const checks = {
      // Note: contributors check skipped (requires additional API calls)
      recent_activity: updateDaysAgo <= this.criteria.recent_activity_days,
      push_activity: pushDaysAgo <= this.criteria.min_push_activity_days,
    };

    const passed = Object.values(checks).every((check) => check);

    // アクティビティスコア計算
    const pushScore = this.normalizeScore(
      this.criteria.min_push_activity_days - pushDaysAgo,
      0,
      this.criteria.min_push_activity_days,
    );

    const updateScore = this.normalizeScore(
      this.criteria.recent_activity_days - updateDaysAgo,
      0,
      this.criteria.recent_activity_days,
    );

    // イシューアクティビティスコア
    const issueScore = this.normalizeScore(repository.open_issues_count ?? 0, 0, 50);

    const score = (pushScore + updateScore + issueScore) / 3;

    const details: ActivityFilterDetails = {
      checks: {
        contributors: true, // Skipped for now (requires additional API calls)
        recent_activity: checks.recent_activity,
        push_activity: checks.push_activity,
      },
      contributors_count: 0, // Not implemented (would require GitHub API call)
      last_push_days: pushDaysAgo,
      last_update_days: updateDaysAgo,
    };

    console.debug(`[ActivityFilter] ${repository.full_name}: passed=${passed}, score=${score.toFixed(3)}`);

    return this.createResult(passed, score, details);
  }
}

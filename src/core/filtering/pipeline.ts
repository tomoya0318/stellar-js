import { eq } from 'drizzle-orm';
import { repository_filter_status } from '../../../drizzle/schema.js';
import { getDatabase } from '../../repository/database.js';
import type {
  FilterDetails,
  FilterStageResult,
  FilteringSummary,
  InsertRepositoryFilterStatus,
  Repository,
  RepositoryFilterStatus,
} from '../../types/index.js';
import type { FilterStage } from './filter-stage.js';

export class FilteringPipeline {
  private stages: FilterStage[] = [];

  addStage(stage: FilterStage): void {
    this.stages.push(stage);
    this.stages.sort((a, b) => a.id - b.id);
    console.info(`[FilteringPipeline] Added stage: ${stage.name} (ID: ${stage.id})`);
  }

  async execute(repository: Repository): Promise<FilteringSummary> {
    console.info(`[FilteringPipeline] Starting pipeline for ${repository.full_name}`);

    const results: FilterStageResult[] = [];

    for (const stage of this.stages) {
      console.debug(`[FilteringPipeline] Executing stage: ${stage.name}`);

      try {
        const result = await stage.evaluate(repository);

        const stageResult: FilterStageResult = {
          stage: stage.name,
          passed: result.passed,
          score: result.score,
          details: result.details,
        };

        results.push(stageResult);

        // データベースに結果を記録
        await this.recordStageResult(repository.id, stage.id, result);

        console.info(
          `[FilteringPipeline] Stage ${stage.name}: ${result.passed ? 'PASSED' : 'FAILED'} (score: ${result.score.toFixed(3)})`,
        );

        // 段階で失敗したら後続をスキップ（最終選定は除く）
        if (!result.passed && stage.name !== 'final_selection') {
          console.info(`[FilteringPipeline] Pipeline stopped at stage: ${stage.name}`);

          // 残りのステージをスキップとして記録
          for (const remainingStage of this.stages.slice(this.stages.indexOf(stage) + 1)) {
            await this.recordStageResult(
              repository.id,
              remainingStage.id,
              {
                passed: false,
                score: 0,
                details: { error: '', skipped: true, reason: `Previous stage ${stage.name} failed` },
              },
              'skipped',
            );

            results.push({
              stage: remainingStage.name,
              passed: false,
              score: 0,
              details: { error: '', skipped: true },
            });
          }
          break;
        }
      } catch (error) {
        console.error(`[FilteringPipeline] Error in stage ${stage.name}:`, error);

        const errorResult: FilterStageResult = {
          stage: stage.name,
          passed: false,
          score: 0,
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        };

        results.push(errorResult);

        // エラーをデータベースに記録
        await this.recordStageResult(
          repository.id,
          stage.id,
          {
            passed: false,
            score: 0,
            details: { error: error instanceof Error ? error.message : 'Unknown error' },
          },
          'failed',
        );

        break;
      }
    }

    const summary: FilteringSummary = {
      repository: repository.id,
      stages: results,
    };

    const passedStages = results.filter((r) => r.passed).length;
    const totalStages = this.stages.length;

    console.info(
      `[FilteringPipeline] Pipeline completed for ${repository.full_name}: ${passedStages}/${totalStages} stages passed`,
    );

    return summary;
  }

  private async recordStageResult(
    repositoryId: number,
    stageId: number,
    result: { passed: boolean; score: number; details: FilterDetails },
    status?: 'pending' | 'passed' | 'failed' | 'skipped',
  ): Promise<void> {
    const db = getDatabase();

    const statusValue = status || (result.passed ? 'passed' : 'failed');

    const filterStatus: InsertRepositoryFilterStatus = {
      repository_id: repositoryId,
      stage_id: stageId,
      status: statusValue,
      score: result.score,
      details: JSON.stringify(result.details),
    };

    try {
      await db.insert(repository_filter_status).values(filterStatus);
      console.debug(
        `[FilteringPipeline] Recorded stage result: repo=${repositoryId}, stage=${stageId}, status=${statusValue}`,
      );
    } catch (error) {
      console.error('[FilteringPipeline] Failed to record stage result:', error);
    }
  }

  getStages(): FilterStage[] {
    return [...this.stages];
  }

  getStageCount(): number {
    return this.stages.length;
  }

  async getRepositoryFilterHistory(repositoryId: number): Promise<RepositoryFilterStatus[]> {
    const db = getDatabase();

    try {
      const history = await db
        .select()
        .from(repository_filter_status)
        .where(eq(repository_filter_status.repository_id, repositoryId));

      return history;
    } catch (error) {
      console.error(`[FilteringPipeline] Failed to get filter history for repository ${repositoryId}:`, error);
      return [];
    }
  }
}

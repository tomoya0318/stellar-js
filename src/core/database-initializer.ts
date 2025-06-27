/**
 * データベース初期化とフィルタリングステージ登録
 */

import { eq } from 'drizzle-orm';
import { filtering_stages } from '../../drizzle/schema.js';
import { getDatabase } from '../repository/database.js';
import type { InsertFilteringStage } from '../types/index.js';

export class DatabaseInitializer {
  private db = getDatabase();

  /**
   * フィルタリングステージを初期化
   */
  async initializeFilteringStages(): Promise<void> {
    console.info('[DatabaseInitializer] Initializing filtering stages...');

    const stages: InsertFilteringStage[] = [
      {
        id: 1,
        name: 'basic_popularity',
        description: '基本人気度フィルタ - スター数、フォーク数、アーカイブ状況をチェック',
        order_index: 1,
        criteria: JSON.stringify({
          type: 'popularity',
          fields: ['min_stars', 'min_forks', 'not_archived', 'not_disabled'],
        }),
      },
      {
        id: 2,
        name: 'activity_filter',
        description: '活動度フィルタ - 最近のプッシュ活動、イシュー・プルリクエストの状況をチェック',
        order_index: 2,
        criteria: JSON.stringify({
          type: 'activity',
          fields: ['min_contributors', 'min_commits', 'recent_activity_days', 'min_push_activity_days'],
        }),
      },
      {
        id: 3,
        name: 'quality_filter',
        description: '品質フィルタ - ライセンス、ドキュメント、プロジェクト管理機能をチェック',
        order_index: 3,
        criteria: JSON.stringify({
          type: 'quality',
          fields: ['has_readme', 'min_readme_quality', 'has_license', 'max_issue_close_time'],
        }),
      },
      {
        id: 4,
        name: 'final_selection',
        description: '最終選定フィルタ - 総合スコアとランキングに基づく最終選別',
        order_index: 4,
        criteria: JSON.stringify({
          type: 'final_selection',
          fields: ['min_overall_score', 'top_percentile'],
        }),
      },
    ];

    for (const stage of stages) {
      try {
        // stage.idが未定義の場合はスキップ
        if (stage.id === undefined) {
          console.warn(`[DatabaseInitializer] Skipping stage with undefined id: ${stage.name}`);
          continue;
        }

        // 既存チェック
        const existing = await this.db
          .select()
          .from(filtering_stages)
          .where(eq(filtering_stages.id, stage.id))
          .limit(1);

        if (existing.length === 0) {
          // 新規作成
          await this.db.insert(filtering_stages).values(stage);
          console.info(`[DatabaseInitializer] Created filtering stage: ${stage.name} (ID: ${stage.id})`);
        } else {
          console.debug(`[DatabaseInitializer] Filtering stage already exists: ${stage.name} (ID: ${stage.id})`);
        }
      } catch (error) {
        console.error(`[DatabaseInitializer] Failed to initialize stage ${stage.name}:`, error);
        throw error;
      }
    }

    console.info('[DatabaseInitializer] Filtering stages initialization completed');
  }

  /**
   * データベース全体の初期化
   */
  async initialize(): Promise<void> {
    console.info('[DatabaseInitializer] Starting database initialization...');

    try {
      // フィルタリングステージの初期化
      await this.initializeFilteringStages();

      console.info('[DatabaseInitializer] Database initialization completed successfully');
    } catch (error) {
      console.error('[DatabaseInitializer] Database initialization failed:', error);
      throw error;
    }
  }
}

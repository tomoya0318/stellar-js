import { desc, eq } from 'drizzle-orm';
import { batch_repositories, collection_batches, repositories } from '../../drizzle/schema.js';
import { GitHubClient } from '../api/github-client.js';
import { getDatabase } from '../repository/database.js';
import type {
  ActivityCriteria,
  GitHubRepository,
  InsertBatchRepository,
  InsertCollectionBatch,
  InsertRepository,
  PopularityCriteria,
  QualityCriteria,
  Repository,
} from '../types/index.js';
import { DatabaseInitializer } from './database-initializer.js';
import { FilteringPipeline } from './filtering/pipeline.js';
import { ActivityFilter } from './filtering/stages/activity-filter.js';
import { PopularityFilter } from './filtering/stages/popularity-filter.js';
import { QualityFilter } from './filtering/stages/quality-filter.js';

export interface CollectionConfig {
  query: string;
  maxRepositories: number;
  batchSize: number;
  criteria: {
    popularity: PopularityCriteria;
    activity: ActivityCriteria;
    quality: QualityCriteria;
  };
}

export class RepositoryCollector {
  private githubClient: GitHubClient;
  private pipeline: FilteringPipeline;
  private db: ReturnType<typeof getDatabase>;

  constructor(githubToken: string) {
    this.githubClient = new GitHubClient(githubToken);
    this.pipeline = new FilteringPipeline();
    this.db = getDatabase();

    console.info('[RepositoryCollector] Initialized');
  }

  async setupPipeline(config: CollectionConfig): Promise<void> {
    console.info('[RepositoryCollector] Setting up filtering pipeline');

    // データベース初期化（フィルタリングステージ登録）
    const initializer = new DatabaseInitializer();
    await initializer.initialize();

    // フィルタリングステージを追加
    this.pipeline.addStage(new PopularityFilter(config.criteria.popularity));
    this.pipeline.addStage(new ActivityFilter(config.criteria.activity));
    this.pipeline.addStage(new QualityFilter(config.criteria.quality));

    console.info(`[RepositoryCollector] Pipeline configured with ${this.pipeline.getStageCount()} stages`);
  }

  async collectRepositories(config: CollectionConfig): Promise<void> {
    console.info(`[RepositoryCollector] Starting collection with query: ${config.query}`);

    // コレクションバッチを作成
    const batchId = await this.createCollectionBatch(config);

    try {
      // GitHubからリポジトリを検索
      console.info('[RepositoryCollector] Searching repositories on GitHub');
      const githubRepos = await this.githubClient.searchRepositories(
        config.query,
        'stars',
        'desc',
        config.maxRepositories,
      );

      console.info(`[RepositoryCollector] Found ${githubRepos.length} repositories`);

      // バッチサイズごとに処理
      for (let i = 0; i < githubRepos.length; i += config.batchSize) {
        const batch = githubRepos.slice(i, i + config.batchSize);
        console.info(
          `[RepositoryCollector] Processing batch ${Math.floor(i / config.batchSize) + 1}/${Math.ceil(githubRepos.length / config.batchSize)}`,
        );

        await this.processBatch(batch, batchId);
      }

      // バッチを完了にマーク
      await this.completeCollectionBatch(batchId, githubRepos.length);

      console.info(
        `[RepositoryCollector] Collection completed successfully. Total: ${githubRepos.length} repositories`,
      );
    } catch (error) {
      console.error('[RepositoryCollector] Collection failed:', error);
      await this.failCollectionBatch(batchId, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private async processBatch(githubRepos: GitHubRepository[], batchId: number): Promise<void> {
    for (const githubRepo of githubRepos) {
      try {
        // リポジトリをデータベースに保存
        const repository = await this.storeRepository(githubRepo);

        // バッチ関連を記録
        await this.addRepositoryToBatch(batchId, repository.id);

        // フィルタリングパイプラインを実行
        await this.pipeline.execute(repository);

        console.debug(`[RepositoryCollector] Processed: ${repository.full_name}`);
      } catch (error) {
        console.error(`[RepositoryCollector] Failed to process ${githubRepo.full_name}:`, error);
        // 個別の失敗は継続する
      }
    }
  }

  private async storeRepository(githubRepo: GitHubRepository): Promise<Repository> {
    const insertData: InsertRepository = {
      id: githubRepo.id,
      full_name: githubRepo.full_name,
      name: githubRepo.name,
      owner: githubRepo.owner.login,
      description: githubRepo.description,
      language: githubRepo.language,
      license:
        typeof githubRepo.license === 'object' && githubRepo.license && 'name' in githubRepo.license
          ? (githubRepo.license as { name: string }).name
          : typeof githubRepo.license === 'string'
            ? githubRepo.license
            : null,
      homepage: githubRepo.homepage,
      topics: JSON.stringify(githubRepo.topics),
      created_at: githubRepo.created_at,
      updated_at: githubRepo.updated_at,
      pushed_at: githubRepo.pushed_at,
      stars_count: githubRepo.stargazers_count,
      forks_count: githubRepo.forks_count,
      watchers_count: githubRepo.watchers_count,
      size: githubRepo.size,
      open_issues_count: githubRepo.open_issues_count,
      has_issues: githubRepo.has_issues,
      has_projects: githubRepo.has_projects,
      has_wiki: githubRepo.has_wiki,
      has_pages: githubRepo.has_pages,
      has_downloads: githubRepo.has_downloads,
      archived: githubRepo.archived,
      disabled: githubRepo.disabled,
    };

    try {
      // 既存レコードをチェック
      const existing = await this.db.select().from(repositories).where(eq(repositories.id, githubRepo.id)).limit(1);

      if (existing.length > 0) {
        // 更新
        await this.db
          .update(repositories)
          .set({ ...insertData, last_updated_at: new Date().toISOString() })
          .where(eq(repositories.id, githubRepo.id));

        if (!existing[0]) {
          throw new Error(`Repository ${githubRepo.id} not found after update`);
        }
        return existing[0];
      }
      // 新規作成
      await this.db.insert(repositories).values(insertData);

      const created = await this.db.select().from(repositories).where(eq(repositories.id, githubRepo.id)).limit(1);

      if (!created[0]) {
        throw new Error(`Repository ${githubRepo.id} not found after creation`);
      }
      return created[0];
    } catch (error) {
      console.error(`[RepositoryCollector] Failed to store repository ${githubRepo.full_name}:`, error);
      throw error;
    }
  }

  private async createCollectionBatch(config: CollectionConfig): Promise<number> {
    const batchData: InsertCollectionBatch = {
      name: `Collection-${new Date().toISOString()}`,
      description: `Repository collection with query: ${config.query}`,
      query_params: JSON.stringify({
        query: config.query,
        max_repositories: config.maxRepositories,
        batch_size: config.batchSize,
      }),
      status: 'running',
    };

    const result = await this.db.insert(collection_batches).values(batchData).returning({ id: collection_batches.id });

    if (!result[0]) {
      throw new Error('Failed to create collection batch');
    }
    console.info(`[RepositoryCollector] Created collection batch: ${result[0].id}`);
    return result[0].id;
  }

  private async addRepositoryToBatch(batchId: number, repositoryId: number): Promise<void> {
    const batchRepo: InsertBatchRepository = {
      batch_id: batchId,
      repository_id: repositoryId,
    };

    await this.db.insert(batch_repositories).values(batchRepo);
  }

  private async completeCollectionBatch(batchId: number, totalCollected: number): Promise<void> {
    await this.db
      .update(collection_batches)
      .set({
        status: 'completed',
        total_collected: totalCollected,
        completed_at: new Date().toISOString(),
      })
      .where(eq(collection_batches.id, batchId));

    console.info(`[RepositoryCollector] Completed collection batch: ${batchId}`);
  }

  private async failCollectionBatch(batchId: number, errorMessage: string): Promise<void> {
    await this.db
      .update(collection_batches)
      .set({
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .where(eq(collection_batches.id, batchId));

    console.error(`[RepositoryCollector] Failed collection batch: ${batchId}`);
  }

  async getCollectionSummary(): Promise<{
    totalRepositories: number;
    totalBatches: number;
    recentBatches: {
      id: number;
      name: string;
      description: string | null;
      status: string;
      started_at: string | null;
      completed_at: string | null;
    }[];
  }> {
    const [totalRepos] = await this.db.select({ count: repositories.id }).from(repositories);

    const [totalBatches] = await this.db.select({ count: collection_batches.id }).from(collection_batches);

    const recentBatches = await this.db
      .select()
      .from(collection_batches)
      .orderBy(desc(collection_batches.started_at))
      .limit(5);

    return {
      totalRepositories: totalRepos?.count || 0,
      totalBatches: totalBatches?.count || 0,
      recentBatches,
    };
  }
}

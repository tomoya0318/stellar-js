import 'dotenv/config';
import { type CollectionConfig, RepositoryCollector } from './core/collector.js';

async function main() {
  console.info('🌟 Stellar-JS: GitHub Repository Mining Tool');
  console.info('==========================================\n');

  // 環境変数の確認
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    console.error('❌ GITHUB_TOKEN environment variable is required');
    console.info('💡 Create a GitHub personal access token and set it in .env file');
    console.info('   See: https://github.com/settings/tokens\n');
    process.exit(1);
  }

  // 設定
  const config: CollectionConfig = {
    query: process.env.DEFAULT_QUERY || 'language:typescript stars:>100',
    maxRepositories: Number.parseInt(process.env.MAX_REPOSITORIES || '1000'),
    batchSize: Number.parseInt(process.env.COLLECTION_BATCH_SIZE || '100'),
    criteria: {
      popularity: {
        min_stars: 100,
        min_forks: 10,
        not_archived: true,
        not_disabled: true,
      },
      activity: {
        min_contributors: 5,
        min_commits: 100,
        recent_activity_days: 90,
        min_push_activity_days: 180,
      },
      quality: {
        has_readme: true,
        min_readme_quality: 0.6,
        has_license: true,
        max_issue_close_time: 30,
      },
    },
  };

  console.info('📋 Collection Configuration:');
  console.info(`   Query: ${config.query}`);
  console.info(`   Max Repositories: ${config.maxRepositories}`);
  console.info(`   Batch Size: ${config.batchSize}`);
  console.info('');

  try {
    // コレクターを初期化
    const collector = new RepositoryCollector(githubToken);

    // パイプラインを設定
    await collector.setupPipeline(config);

    // 既存データの確認
    const summary = await collector.getCollectionSummary();
    console.info('📊 Current Database Status:');
    console.info(`   Total Repositories: ${summary.totalRepositories}`);
    console.info(`   Total Batches: ${summary.totalBatches}`);
    console.info('');

    // コレクション開始
    console.info('🚀 Starting repository collection...\n');
    const startTime = performance.now();

    await collector.collectRepositories(config);

    const endTime = performance.now();
    const duration = Math.round((endTime - startTime) / 1000);

    // 完了レポート
    const finalSummary = await collector.getCollectionSummary();
    console.info('\n✅ Collection Completed Successfully!');
    console.info('=====================================');
    console.info(`   Duration: ${duration} seconds`);
    console.info(`   Total Repositories: ${finalSummary.totalRepositories}`);
    console.info(`   New Repositories: ${finalSummary.totalRepositories - summary.totalRepositories}`);
    console.info(`   Total Batches: ${finalSummary.totalBatches}`);
    console.info('');
    console.info('💾 Data has been saved to the SQLite database');
    console.info('🔍 Use `npm run db:studio` to explore the collected data');
  } catch (error) {
    console.error('\n❌ Collection Failed!');
    console.error('====================');

    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);

      // 具体的なエラーハンドリング
      if (error.message.includes('rate limit')) {
        console.info('\n💡 GitHub API rate limit exceeded. Wait and try again later.');
        console.info('   Authenticated requests have higher limits (5000/hour vs 60/hour)');
      } else if (error.message.includes('Authentication failed')) {
        console.info('\n💡 GitHub token is invalid or expired.');
        console.info('   Generate a new token at: https://github.com/settings/tokens');
      } else if (error.message.includes('Network')) {
        console.info('\n💡 Network connection issue. Check your internet connection.');
      }
    } else {
      console.error('Unknown error occurred:', error);
    }

    process.exit(1);
  }
}

// プロセス終了時のクリーンアップ
process.on('SIGINT', () => {
  console.info('\n🛑 Gracefully shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.info('\n🛑 Gracefully shutting down...');
  process.exit(0);
});

// 未処理の拒否をキャッチ
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// エントリーポイント
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

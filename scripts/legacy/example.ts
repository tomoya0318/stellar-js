#!/usr/bin/env tsx
/**
 * Stellar-JS使用例
 *
 * このスクリプトは少数のTypeScriptリポジトリを収集してフィルタリングを行う例です。
 * GitHub Personal Access Tokenが .env ファイルに設定されている必要があります。
 */

import 'dotenv/config';
import { RepositoryCollector } from '../../src/core/collector.js';

const main = async () => {
  // 環境変数チェック
  if (!process.env.GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN environment variable is required');
    console.log('Create a .env file with: GITHUB_TOKEN=your_github_token');
    process.exit(1);
  }

  console.log('🚀 Stellar-JS Example: GitHub Repository Mining');
  console.log('='.repeat(50));

  // コレクターを初期化
  const collector = new RepositoryCollector(process.env.GITHUB_TOKEN);

  // フィルタリング設定（テスト用の小さな値）
  const config = {
    query: 'language:typescript stars:>1000 created:>2023-01-01',
    maxRepositories: 10, // テスト用に少数に設定
    batchSize: 5,
    criteria: {
      popularity: {
        min_stars: 1000,
        min_forks: 50,
        not_archived: true,
        not_disabled: true,
      },
      activity: {
        min_contributors: 3,
        min_commits: 50,
        recent_activity_days: 180,
        min_push_activity_days: 60,
      },
      quality: {
        has_readme: true,
        min_readme_quality: 0.5,
        has_license: true,
        max_issue_close_time: 60,
      },
    },
  };

  try {
    console.log('📋 Configuration:');
    console.log(`   Query: ${config.query}`);
    console.log(`   Max Repositories: ${config.maxRepositories}`);
    console.log(`   Batch Size: ${config.batchSize}`);
    console.log('');

    // パイプラインをセットアップ
    console.log('🔧 Setting up filtering pipeline...');
    await collector.setupPipeline(config);

    // データ収集を実行
    console.log('🔍 Starting repository collection...');
    await collector.collectRepositories(config);

    // 収集結果の確認
    console.log('');
    console.log('📊 Collection Results:');
    const summary = await collector.getCollectionSummary();
    console.log(`   Total Repositories: ${summary.totalRepositories}`);
    console.log(`   Total Batches: ${summary.totalBatches}`);

    if (summary.recentBatches.length > 0) {
      console.log('   Recent Batches:');
      for (const batch of summary.recentBatches.slice(0, 3)) {
        console.log(`     - ${batch.name}: ${batch.status}`);
      }
    }

    console.log('');
    console.log('✅ Collection completed successfully!');
    console.log('');
    console.log('💡 Next steps:');
    console.log('   - View data with: npm run db:studio');
    console.log('   - Run analysis queries on the collected data');
    console.log('   - Adjust criteria and collect more repositories');
  } catch (error) {
    console.error('');
    console.error('❌ Error during collection:');
    console.error(error instanceof Error ? error.message : error);
    console.error('');
    console.log('🔧 Troubleshooting:');
    console.log('   - Check your GitHub token is valid');
    console.log('   - Ensure you have internet connection');
    console.log('   - Check GitHub API rate limits');
    process.exit(1);
  }
};

// メイン実行
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

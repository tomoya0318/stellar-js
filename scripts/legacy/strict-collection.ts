#!/usr/bin/env tsx
/**
 * 厳格基準でのリポジトリ収集
 *
 * 高品質で活発に開発されているTypeScriptプロジェクトのみを収集します。
 * 未実装機能に依存せず、現状で動作する機能のみを使用した現実的な基準設定。
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

  console.log('🎯 Stellar-JS: Strict Collection Mode');
  console.log('='.repeat(50));
  console.log('Target: High-quality, actively developed TypeScript projects');
  console.log('');

  // コレクターを初期化
  const collector = new RepositoryCollector(process.env.GITHUB_TOKEN);

  // 厳格な基準設定（現状実装で完全動作する部分のみ）
  const config = {
    query: 'language:typescript stars:>5000 created:>2022-01-01', // より多くの候補を確保
    maxRepositories: 50, // より多くのデータ収集
    batchSize: 10,
    criteria: {
      // 人気度フィルター（完全動作）
      popularity: {
        min_stars: 5000, // 5倍厳格化（1000 → 5000）
        min_forks: 500, // 10倍厳格化（50 → 500）
        not_archived: true, // アーカイブされていない
        not_disabled: true, // 無効化されていない
      },
      // 活動度フィルター（実装済み部分のみ）
      activity: {
        min_contributors: 10, // 目標値（現在は無視される）
        min_commits: 200, // 目標値（現在は無視される）
        recent_activity_days: 90, // 実装済み: より厳格（180 → 90）
        min_push_activity_days: 30, // 実装済み: より厳格（60 → 30）
      },
      // 品質フィルター（実装済み部分のみ）
      quality: {
        has_readme: true, // 目標値（現在は無視される）
        min_readme_quality: 0.8, // 目標値（現在は無視される）
        has_license: true, // 実装済み: ライセンス必須
        max_issue_close_time: 30, // 目標値（現在は無視される）
      },
    },
  };

  try {
    console.log('📋 Strict Collection Configuration:');
    console.log(`   Query: ${config.query}`);
    console.log(`   Max Repositories: ${config.maxRepositories}`);
    console.log(`   Batch Size: ${config.batchSize}`);
    console.log('');
    console.log('🔍 Filtering Criteria:');
    console.log(`   ⭐ Min Stars: ${config.criteria.popularity.min_stars.toLocaleString()}`);
    console.log(`   🍴 Min Forks: ${config.criteria.popularity.min_forks.toLocaleString()}`);
    console.log(`   📅 Recent Activity: ${config.criteria.activity.recent_activity_days} days`);
    console.log(`   📤 Recent Push: ${config.criteria.activity.min_push_activity_days} days`);
    console.log(`   📄 License Required: ${config.criteria.quality.has_license ? 'Yes' : 'No'}`);
    console.log('');

    // パイプラインをセットアップ
    console.log('🔧 Setting up strict filtering pipeline...');
    await collector.setupPipeline(config);

    // データ収集を実行
    console.log('🔍 Starting strict repository collection...');
    const startTime = Date.now();
    await collector.collectRepositories(config);
    const endTime = Date.now();

    // 収集結果の確認
    console.log('');
    console.log('📊 Collection Results:');
    const summary = await collector.getCollectionSummary();
    console.log(`   Total Repositories Stored: ${summary.totalRepositories}`);
    console.log(`   Total Collection Batches: ${summary.totalBatches}`);
    console.log(`   Processing Time: ${((endTime - startTime) / 1000).toFixed(2)} seconds`);
    console.log('');

    if (summary.recentBatches.length > 0) {
      console.log('📦 Recent Collection Batches:');
      for (const batch of summary.recentBatches.slice(0, 3)) {
        console.log(`   • ${batch.name}`);
        console.log(`     Status: ${batch.status}`);
        console.log(`     Started: ${batch.started_at ? new Date(batch.started_at).toLocaleString() : 'N/A'}`);
        console.log(`     Completed: ${batch.completed_at ? new Date(batch.completed_at).toLocaleString() : 'N/A'}`);
        console.log('');
      }
    }

    console.log('✅ Strict collection completed successfully!');
    console.log('');
    console.log('🎯 Quality Summary:');
    console.log('   • Only projects with 5000+ stars collected');
    console.log('   • Only projects with 500+ forks collected');
    console.log('   • Only recently active projects (within 90 days)');
    console.log('   • Only projects with recent pushes (within 30 days)');
    console.log('   • Only projects with proper licenses');
    console.log('');
    console.log('💡 Next steps:');
    console.log('   - View collected data: npm run db:studio');
    console.log('   - Analyze project quality distribution');
    console.log('   - Export data for further analysis');
  } catch (error) {
    console.error('');
    console.error('❌ Strict collection failed:');
    console.error(error instanceof Error ? error.message : error);
    console.error('');
    console.log('🔧 Troubleshooting:');
    console.log('   - Check your GitHub token permissions');
    console.log('   - Verify internet connectivity');
    console.log('   - Check GitHub API rate limits');
    console.log('   - Try reducing maxRepositories or batchSize');
    process.exit(1);
  }
};

// メイン実行
main().catch((error) => {
  console.error('Fatal error during strict collection:', error);
  process.exit(1);
});

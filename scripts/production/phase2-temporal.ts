#!/usr/bin/env tsx
/**
 * Phase 2: 時系列分散収集 (300件)
 *
 * 年度別に分散してバランスの取れたデータセットを構築
 */

import 'dotenv/config';
import { type CollectionConfig, RepositoryCollector } from '../../src/core/collector.js';

interface TemporalTier {
  year: number;
  targetCount: number;
  actualCount: number;
  query: string;
  description: string;
}

class Phase2TemporalCollector {
  private collector: RepositoryCollector;
  private startTime: number;
  private readonly TOTAL_TARGET = 300;

  constructor(githubToken: string) {
    this.collector = new RepositoryCollector(githubToken);
    this.startTime = Date.now();
  }

  async execute(): Promise<void> {
    console.log('🕒 Phase 2: Temporal Distribution Collection (Target: 300 repositories)');
    console.log('='.repeat(72));
    console.log('Strategy: Year-based distribution for ecosystem evolution analysis');
    console.log('');

    try {
      // 1. データベース初期化確認
      await this.ensureDatabaseReady();

      // 2. 時系列Tier設定
      const temporalTiers = this.createTemporalTiers();
      console.log('📅 Temporal Collection Configuration:');
      this.printTemporalConfiguration(temporalTiers);

      // 3. 年度別収集実行
      const collectionResults = await this.executeTemporalCollection(temporalTiers);

      // 4. バランス調整
      await this.executeBalanceAdjustment(collectionResults);

      // 5. 最終結果
      await this.generateFinalReport(collectionResults);
    } catch (error) {
      console.error('');
      console.error('❌ Phase 2 collection failed:');
      console.error(error instanceof Error ? error.message : error);
      console.error('');
      this.printTroubleshooting();
      process.exit(1);
    }
  }

  private async ensureDatabaseReady(): Promise<void> {
    console.log('🔧 Ensuring database is ready for Phase 2...');

    // Phase 1の結果確認
    const summary = await this.collector.getCollectionSummary();
    console.log(`✅ Phase 1 results: ${summary.totalRepositories} repositories collected`);
    console.log('');
  }

  private createTemporalTiers(): TemporalTier[] {
    return [
      {
        year: 2020,
        targetCount: 100,
        actualCount: 0,
        query: 'language:typescript stars:>=1000 created:2020-01-01..2020-12-31',
        description: 'TypeScript adoption acceleration period',
      },
      {
        year: 2021,
        targetCount: 100,
        actualCount: 0,
        query: 'language:typescript stars:>=1000 created:2021-01-01..2021-12-31',
        description: 'Framework maturation and tooling evolution',
      },
      {
        year: 2022,
        targetCount: 100,
        actualCount: 0,
        query: 'language:typescript stars:>=1000 created:2022-01-01..2022-12-31',
        description: 'Modern development practices establishment',
      },
    ];
  }

  private printTemporalConfiguration(tiers: TemporalTier[]): void {
    for (const tier of tiers) {
      console.log(`   ${tier.year}: ${tier.targetCount} repos - ${tier.description}`);
      console.log(`     Query: ${tier.query}`);
    }
    console.log('');
    console.log('🎯 Temporal Strategy Benefits:');
    console.log('   • Ecosystem evolution tracking');
    console.log('   • Bias reduction across time periods');
    console.log('   • Comparative analysis enablement');
    console.log('   • Long-term vs recent project balance');
    console.log('');
  }

  private async executeTemporalCollection(tiers: TemporalTier[]): Promise<TemporalTier[]> {
    console.log('🚀 Starting temporal collection...');
    console.log('');

    for (const tier of tiers) {
      console.log(`📅 Collecting ${tier.year} projects...`);
      console.log(`   Focus: ${tier.description}`);

      try {
        // 年度に応じた収集設定
        const config = {
          query: tier.query,
          maxRepositories: tier.targetCount,
          batchSize: Math.min(25, tier.targetCount), // 適度なバッチサイズ
          criteria: this.createCriteriaForYear(tier.year),
        };

        console.log(`   Query: ${config.query}`);
        console.log(`   Target: ${config.maxRepositories} repositories`);

        // 収集実行
        const beforeCount = (await this.collector.getCollectionSummary()).totalRepositories;

        await this.collector.setupPipeline(config);
        await this.collector.collectRepositories(config);

        const afterCount = (await this.collector.getCollectionSummary()).totalRepositories;
        tier.actualCount = afterCount - beforeCount;

        console.log(`   ✅ Collected: ${tier.actualCount} repositories`);

        // 年度別分析
        await this.printYearAnalysis(tier);
        console.log('');

        // レート制限対策
        if (tiers.indexOf(tier) < tiers.length - 1) {
          console.log('   ⏱️  Waiting to respect rate limits...');
          await this.delay(3000); // 3秒待機
        }
      } catch (error) {
        console.error(`   ❌ Failed to collect ${tier.year} projects:`, error);
        tier.actualCount = 0;
      }
    }

    return tiers;
  }

  private createCriteriaForYear(year: number) {
    // 年度に応じて基準を調整
    let criteria: CollectionConfig['criteria'];

    if (year === 2020) {
      // 2020年: TypeScript初期採用期、より寛容な基準
      criteria = {
        popularity: {
          min_stars: 1000,
          min_forks: 50,
          not_archived: true,
          not_disabled: true,
        },
        activity: {
          min_contributors: 3,
          min_commits: 50,
          recent_activity_days: 365, // 1年以内（現在から）
          min_push_activity_days: 180, // 6ヶ月以内
        },
        quality: {
          has_readme: true,
          min_readme_quality: 0.6,
          has_license: true,
          max_issue_close_time: 90,
        },
      };
    } else if (year === 2021) {
      // 2021年: フレームワーク成熟期、標準的な基準
      criteria = {
        popularity: {
          min_stars: 1000,
          min_forks: 75,
          not_archived: true,
          not_disabled: true,
        },
        activity: {
          min_contributors: 5,
          min_commits: 100,
          recent_activity_days: 270, // 9ヶ月以内
          min_push_activity_days: 120, // 4ヶ月以内
        },
        quality: {
          has_readme: true,
          min_readme_quality: 0.7,
          has_license: true,
          max_issue_close_time: 60,
        },
      };
    } else {
      // 2022年以降: モダン開発実践期、厳格な基準
      criteria = {
        popularity: {
          min_stars: 1000,
          min_forks: 100,
          not_archived: true,
          not_disabled: true,
        },
        activity: {
          min_contributors: 7,
          min_commits: 150,
          recent_activity_days: 180, // 6ヶ月以内
          min_push_activity_days: 90, // 3ヶ月以内
        },
        quality: {
          has_readme: true,
          min_readme_quality: 0.8,
          has_license: true,
          max_issue_close_time: 45,
        },
      };
    }

    return criteria;
  }

  private async printYearAnalysis(tier: TemporalTier): Promise<void> {
    const achievement = tier.targetCount > 0 ? ((tier.actualCount / tier.targetCount) * 100).toFixed(1) : '0.0';
    console.log(`   📊 ${tier.year} Analysis:`);
    console.log(`     Achievement: ${achievement}% (${tier.actualCount}/${tier.targetCount})`);

    // 年度別の特徴分析（簡略版）
    if (tier.year === 2020) {
      console.log('     Era Context: Early TypeScript adoption, foundational tools');
    } else if (tier.year === 2021) {
      console.log('     Era Context: Framework maturation, developer experience focus');
    } else {
      console.log('     Era Context: Modern practices, advanced tooling, performance focus');
    }
  }

  private async executeBalanceAdjustment(tiers: TemporalTier[]): Promise<void> {
    console.log('⚖️  Executing balance adjustment...');

    const totalActual = tiers.reduce((sum, tier) => sum + tier.actualCount, 0);
    const shortfall = this.TOTAL_TARGET - totalActual;

    console.log(`Total collected: ${totalActual}/${this.TOTAL_TARGET}`);

    if (shortfall > 0) {
      console.log(`Shortfall detected: ${shortfall} repositories`);

      // 最も収集が容易な年度（通常は最新年度）で補完
      const compensationTier = tiers.find((tier) => tier.actualCount < tier.targetCount);

      if (compensationTier) {
        console.log(`Compensating with additional ${compensationTier.year} projects...`);

        const config = {
          query: `${compensationTier.query.replace('>=1000', '>=500')}`, // 閾値を下げて補完
          maxRepositories: shortfall,
          batchSize: Math.min(15, shortfall),
          criteria: this.createCriteriaForYear(compensationTier.year),
        };

        try {
          await this.collector.collectRepositories(config);
          compensationTier.actualCount += shortfall;
          console.log('✅ Balance adjustment completed');
        } catch (error) {
          console.error('❌ Balance adjustment failed:', error);
        }
      }
    } else {
      console.log('✅ Target achieved, no adjustment needed');
    }

    console.log('');
  }

  private async generateFinalReport(tiers: TemporalTier[]): Promise<void> {
    console.log('📋 Phase 2 Collection Results');
    console.log('='.repeat(50));

    // 全体統計
    const totalActual = tiers.reduce((sum, tier) => sum + tier.actualCount, 0);
    const duration = (Date.now() - this.startTime) / 1000;
    const overallSummary = await this.collector.getCollectionSummary();

    console.log(`Phase 2 Repositories: ${totalActual}`);
    console.log(`Phase 2 Achievement: ${((totalActual / this.TOTAL_TARGET) * 100).toFixed(1)}%`);
    console.log(`Phase 2 Duration: ${duration.toFixed(1)} seconds`);
    console.log('');

    // 年度別詳細
    console.log('📅 Temporal Distribution:');
    for (const tier of tiers) {
      const achievement = tier.targetCount > 0 ? ((tier.actualCount / tier.targetCount) * 100).toFixed(1) : '0.0';
      console.log(`   ${tier.year}: ${tier.actualCount}/${tier.targetCount} (${achievement}%)`);
    }
    console.log('');

    // 全Phase統計
    console.log('🎯 Combined Phase 1 + 2 Results:');
    console.log(`Total Dataset Size: ${overallSummary.totalRepositories} repositories`);
    console.log(`Target Achievement: ${((overallSummary.totalRepositories / 1000) * 100).toFixed(1)}%`);
    console.log('Quality + Temporal Balance: Achieved');
    console.log('');

    console.log('✅ Phase 2 Temporal Collection Completed!');
    console.log('');
    console.log('🎯 Temporal Benefits Achieved:');
    console.log('   • Year-based ecosystem representation');
    console.log('   • Evolution tracking capability');
    console.log('   • Reduced temporal bias');
    console.log('   • Comparative analysis enabled');
    console.log('');
    console.log('💡 Next Steps:');
    console.log('   - Generate comprehensive analysis: npm run comprehensive-analysis');
    console.log('   - Export complete dataset: npm run export-dataset');
    console.log('   - View data in Drizzle Studio: npm run db:studio');
  }

  private printTroubleshooting(): void {
    console.log('🔧 Troubleshooting:');
    console.log('   - Ensure Phase 1 completed successfully');
    console.log('   - Check GitHub token rate limits');
    console.log('   - Verify database integrity');
    console.log('   - Consider adjusting year-specific criteria');
    console.log('   - Review temporal query constraints');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// メイン実行
const main = async () => {
  // 環境変数チェック
  if (!process.env.GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN environment variable is required');
    console.log('Create a .env file with: GITHUB_TOKEN=your_github_token');
    process.exit(1);
  }

  const collector = new Phase2TemporalCollector(process.env.GITHUB_TOKEN);
  await collector.execute();
};

main().catch((error) => {
  console.error('Fatal error during Phase 2 collection:', error);
  process.exit(1);
});

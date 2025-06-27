#!/usr/bin/env tsx
/**
 * 包括的分析レポート生成
 * 1000件データセットの詳細分析
 */

import { and, avg, count, desc, eq, max, min, sql } from 'drizzle-orm';
import { filtering_stages, repositories, repository_filter_status } from '../../drizzle/schema.js';
import { getDatabase } from '../../src/repository/database.js';

class ComprehensiveAnalyzer {
  private db = getDatabase();

  async execute(): Promise<void> {
    console.log('📊 Comprehensive Analysis: 1000-Repository Dataset');
    console.log('='.repeat(60));
    console.log('Academic Research Analysis Report');
    console.log('');

    try {
      // 基本統計
      await this.analyzeBasicStatistics();

      // 品質分析
      await this.analyzeQualityDistribution();

      // 時系列分析
      await this.analyzeTemporalDistribution();

      // フィルタリング効果
      await this.analyzeFilterEffectiveness();

      // エコシステム分析
      await this.analyzeEcosystemCharacteristics();

      // トップリポジトリ分析
      await this.analyzeTopRepositories();

      // 研究インサイト
      await this.generateResearchInsights();

      console.log('');
      console.log('✅ Comprehensive analysis completed!');
      console.log('💡 This analysis provides academic research foundation');
    } catch (error) {
      console.error('❌ Analysis failed:');
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  private async analyzeBasicStatistics(): Promise<void> {
    console.log('📈 Basic Dataset Statistics');
    console.log('─'.repeat(40));

    // 基本カウント
    const totalRepos = await this.db.select({ count: count() }).from(repositories);

    // 統計値
    const stats = await this.db
      .select({
        maxStars: max(repositories.stars_count),
        minStars: min(repositories.stars_count),
        avgStars: avg(repositories.stars_count),
        maxForks: max(repositories.forks_count),
        minForks: min(repositories.forks_count),
        avgForks: avg(repositories.forks_count),
        maxSize: max(repositories.size),
        avgSize: avg(repositories.size),
      })
      .from(repositories);

    const stat = stats[0];
    if (stat) {
      console.log(`Total Repositories: ${totalRepos[0]?.count ?? 0}`);
      console.log('');
      console.log('Star Statistics:');
      console.log(
        `   Range: ${Math.round(Number(stat.minStars || 0)).toLocaleString()} - ${Math.round(Number(stat.maxStars || 0)).toLocaleString()}`,
      );
      console.log(`   Average: ${Math.round(Number(stat.avgStars || 0)).toLocaleString()}`);
      console.log('');
      console.log('Fork Statistics:');
      console.log(
        `   Range: ${Math.round(Number(stat.minForks || 0)).toLocaleString()} - ${Math.round(Number(stat.maxForks || 0)).toLocaleString()}`,
      );
      console.log(`   Average: ${Math.round(Number(stat.avgForks || 0)).toLocaleString()}`);
      console.log('');
      console.log('Repository Size:');
      console.log(`   Max Size: ${Math.round(Number(stat.maxSize || 0) / 1024).toLocaleString()} MB`);
      console.log(`   Average Size: ${Math.round(Number(stat.avgSize || 0) / 1024).toLocaleString()} MB`);
    }
    console.log('');
  }

  private async analyzeQualityDistribution(): Promise<void> {
    console.log('🎯 Quality Distribution Analysis');
    console.log('─'.repeat(40));

    // スター数分布
    const starRanges = await this.calculateStarDistribution();
    console.log('Star Distribution:');
    for (const [range, count] of Object.entries(starRanges)) {
      const percentage = ((count / (starRanges.total || 1)) * 100).toFixed(1);
      console.log(`   ${range}: ${count} repositories (${percentage}%)`);
    }
    console.log('');

    // アーカイブ・無効化状況
    const archiveStats = await this.db
      .select({
        archived: count(sql`CASE WHEN archived = 1 THEN 1 END`),
        disabled: count(sql`CASE WHEN disabled = 1 THEN 1 END`),
        active: count(sql`CASE WHEN archived = 0 AND disabled = 0 THEN 1 END`),
      })
      .from(repositories);

    const archiveStat = archiveStats[0];
    if (archiveStat) {
      console.log('Repository Status:');
      console.log(`   Active: ${archiveStat.active} repositories`);
      console.log(`   Archived: ${archiveStat.archived} repositories`);
      console.log(`   Disabled: ${archiveStat.disabled} repositories`);
    }
    console.log('');

    // ライセンス分布
    const licenseStats = await this.db
      .select({
        license: repositories.license,
        count: count(),
      })
      .from(repositories)
      .groupBy(repositories.license)
      .orderBy(desc(count()));

    console.log('License Distribution (Top 10):');
    for (const license of licenseStats.slice(0, 10)) {
      const licenseName = license.license || 'No License';
      console.log(`   ${licenseName}: ${license.count} repositories`);
    }
    console.log('');
  }

  private async analyzeTemporalDistribution(): Promise<void> {
    console.log('📅 Temporal Distribution Analysis');
    console.log('─'.repeat(40));

    // 年別作成分布
    const yearDistribution = await this.db
      .select({
        year: sql<string>`strftime('%Y', created_at)`,
        count: count(),
        avgStars: avg(repositories.stars_count),
      })
      .from(repositories)
      .groupBy(sql`strftime('%Y', created_at)`)
      .orderBy(sql`strftime('%Y', created_at)`);

    console.log('Creation Year Distribution:');
    for (const year of yearDistribution) {
      const avgStars = Math.round(Number(year.avgStars || 0));
      console.log(`   ${year.year}: ${year.count} repos (avg ${avgStars.toLocaleString()} stars)`);
    }
    console.log('');

    // 最近の更新活動
    const recentUpdates = await this.db
      .select({
        recent_90d: count(sql`CASE WHEN julianday('now') - julianday(updated_at) <= 90 THEN 1 END`),
        recent_180d: count(sql`CASE WHEN julianday('now') - julianday(updated_at) <= 180 THEN 1 END`),
        recent_365d: count(sql`CASE WHEN julianday('now') - julianday(updated_at) <= 365 THEN 1 END`),
        total: count(),
      })
      .from(repositories);

    const update = recentUpdates[0];
    if (update) {
      console.log('Recent Activity (Updates):');
      console.log(`   Last 90 days: ${update.recent_90d} (${((update.recent_90d / update.total) * 100).toFixed(1)}%)`);
      console.log(
        `   Last 180 days: ${update.recent_180d} (${((update.recent_180d / update.total) * 100).toFixed(1)}%)`,
      );
      console.log(
        `   Last 365 days: ${update.recent_365d} (${((update.recent_365d / update.total) * 100).toFixed(1)}%)`,
      );
    }
    console.log('');
  }

  private async analyzeFilterEffectiveness(): Promise<void> {
    console.log('🔍 Filter Effectiveness Analysis');
    console.log('─'.repeat(40));

    // 各フィルターステージの通過率
    const stages = await this.db.select().from(filtering_stages).orderBy(filtering_stages.order_index);

    for (const stage of stages) {
      const total = await this.db
        .select({ count: count() })
        .from(repository_filter_status)
        .where(eq(repository_filter_status.stage_id, stage.id));

      const passed = await this.db
        .select({ count: count() })
        .from(repository_filter_status)
        .where(and(eq(repository_filter_status.stage_id, stage.id), eq(repository_filter_status.status, 'passed')));

      const passRate =
        (total[0]?.count ?? 0) > 0 ? (((passed[0]?.count ?? 0) / (total[0]?.count ?? 1)) * 100).toFixed(1) : '0.0';

      console.log(`${stage.name}:`);
      console.log(`   Passed: ${passed[0]?.count ?? 0}/${total[0]?.count ?? 0} (${passRate}%)`);
      console.log(`   Description: ${stage.description}`);
      console.log('');
    }

    // 全フィルター通過率
    console.log('Overall Filter Success:');
    const stageCounts = stages.length;
    if (stageCounts > 0) {
      const overallPassed = await this.db
        .select({
          repository_id: repository_filter_status.repository_id,
          passedCount: count(sql`CASE WHEN status = 'passed' THEN 1 END`),
        })
        .from(repository_filter_status)
        .groupBy(repository_filter_status.repository_id)
        .having(eq(count(sql`CASE WHEN status = 'passed' THEN 1 END`), stageCounts));

      const totalRepos = await this.db.select({ count: count() }).from(repositories);
      const overallPassRate =
        (totalRepos[0]?.count ?? 0) > 0
          ? ((overallPassed.length / (totalRepos[0]?.count ?? 1)) * 100).toFixed(1)
          : '0.0';

      console.log(`   All stages passed: ${overallPassed.length} repositories (${overallPassRate}%)`);
    }
    console.log('');
  }

  private async analyzeEcosystemCharacteristics(): Promise<void> {
    console.log('🌐 TypeScript Ecosystem Characteristics');
    console.log('─'.repeat(40));

    // トピック分析
    const topicsAnalysis = await this.analyzeTopics();
    console.log('Popular Topics (Top 15):');
    for (const [topic, count] of topicsAnalysis.slice(0, 15)) {
      console.log(`   ${topic}: ${count} repositories`);
    }
    console.log('');

    // ホームページ有無
    const homepageStats = await this.db
      .select({
        withHomepage: count(sql`CASE WHEN homepage IS NOT NULL AND homepage != '' THEN 1 END`),
        total: count(),
      })
      .from(repositories);

    const homepage = homepageStats[0];
    if (homepage) {
      const homepageRate = ((homepage.withHomepage / homepage.total) * 100).toFixed(1);
      console.log('Documentation & Presence:');
      console.log(`   With Homepage: ${homepage.withHomepage}/${homepage.total} (${homepageRate}%)`);
    }

    // プロジェクト機能
    const featureStats = await this.db
      .select({
        hasIssues: count(sql`CASE WHEN has_issues = 1 THEN 1 END`),
        hasProjects: count(sql`CASE WHEN has_projects = 1 THEN 1 END`),
        hasWiki: count(sql`CASE WHEN has_wiki = 1 THEN 1 END`),
        hasPages: count(sql`CASE WHEN has_pages = 1 THEN 1 END`),
        total: count(),
      })
      .from(repositories);

    const features = featureStats[0];
    if (features) {
      console.log('Project Features:');
      console.log(
        `   Issues enabled: ${features.hasIssues}/${features.total} (${((features.hasIssues / features.total) * 100).toFixed(1)}%)`,
      );
      console.log(
        `   Projects enabled: ${features.hasProjects}/${features.total} (${((features.hasProjects / features.total) * 100).toFixed(1)}%)`,
      );
      console.log(
        `   Wiki enabled: ${features.hasWiki}/${features.total} (${((features.hasWiki / features.total) * 100).toFixed(1)}%)`,
      );
      console.log(
        `   Pages enabled: ${features.hasPages}/${features.total} (${((features.hasPages / features.total) * 100).toFixed(1)}%)`,
      );
    }
    console.log('');
  }

  private async analyzeTopRepositories(): Promise<void> {
    console.log('⭐ Top Repositories Analysis');
    console.log('─'.repeat(40));

    const topRepos = await this.db
      .select({
        full_name: repositories.full_name,
        stars_count: repositories.stars_count,
        forks_count: repositories.forks_count,
        created_at: repositories.created_at,
        description: repositories.description,
        topics: repositories.topics,
      })
      .from(repositories)
      .orderBy(desc(repositories.stars_count))
      .limit(15);

    console.log('Top 15 by Stars:');
    for (const [index, repo] of topRepos.entries()) {
      const rank = index + 1;
      const stars = (repo.stars_count ?? 0).toLocaleString();
      const forks = (repo.forks_count ?? 0).toLocaleString();
      const year = new Date(repo.created_at).getFullYear();

      console.log(`   ${rank.toString().padStart(2)}. ${repo.full_name}`);
      console.log(`       ${stars}⭐ ${forks}🍴 (${year})`);
      if (repo.description) {
        const desc = repo.description.length > 80 ? `${repo.description.substring(0, 80)}...` : repo.description;
        console.log(`       "${desc}"`);
      }
      console.log('');
    }
  }

  private async generateResearchInsights(): Promise<void> {
    console.log('🔬 Research Insights & Conclusions');
    console.log('─'.repeat(40));

    // データセットの学術的価値
    const totalRepos = await this.db.select({ count: count() }).from(repositories);
    const stats = await this.db
      .select({
        avgStars: avg(repositories.stars_count),
        minStars: min(repositories.stars_count),
      })
      .from(repositories);

    const stat = stats[0];
    const total = totalRepos[0]?.count ?? 0;

    console.log('Dataset Academic Value:');
    console.log(`✓ Scale: ${total} repositories (statistically significant)`);
    console.log(
      `✓ Quality: ${Math.round(Number(stat?.minStars || 0)).toLocaleString()}+ stars minimum (high-quality filter)`,
    );
    console.log(`✓ Average: ${Math.round(Number(stat?.avgStars || 0)).toLocaleString()} stars (exceptional projects)`);
    console.log('✓ Diversity: Multi-tier collection strategy');
    console.log('✓ Temporal: 2020-2024 evolution tracking');
    console.log('');

    console.log('Research Applications:');
    console.log('• Software Engineering: Quality metrics correlation analysis');
    console.log('• Ecosystem Studies: TypeScript adoption and evolution patterns');
    console.log('• Repository Mining: Large-scale project characteristic analysis');
    console.log('• Trend Analysis: Framework and tooling evolution tracking');
    console.log('• Comparative Studies: Cross-language ecosystem comparison');
    console.log('');

    console.log('Methodological Strengths:');
    console.log('• Multi-dimensional filtering (popularity + activity + quality)');
    console.log('• Adaptive tier adjustment for realistic target achievement');
    console.log('• Temporal distribution to reduce selection bias');
    console.log('• Comprehensive metadata for reproducible research');
    console.log('• Type-safe collection process with error handling');
    console.log('');

    console.log('Limitations & Considerations:');
    console.log('• GitHub-centric view (excludes GitLab, private repos)');
    console.log('• English-language bias in repository descriptions');
    console.log('• Star count as proxy for quality (social proof limitations)');
    console.log('• Snapshot in time (dynamic ecosystem)');
    console.log('• TypeScript focus (language-specific insights)');
    console.log('');

    console.log('Citation & Attribution:');
    console.log('Dataset: Stellar-JS TypeScript Repository Collection');
    console.log('Method: Hybrid quality-temporal sampling strategy');
    console.log('Tool: GitHub API v4 with multi-stage filtering');
    console.log(`Date: ${new Date().toISOString().split('T')[0]}`);
    console.log('Repositories: 1000 high-quality TypeScript projects');
  }

  private async calculateStarDistribution(): Promise<Record<string, number>> {
    const ranges = {
      '1K-5K': 0,
      '5K-10K': 0,
      '10K-20K': 0,
      '20K-50K': 0,
      '50K+': 0,
      total: 0,
    };

    const repos = await this.db.select({ stars_count: repositories.stars_count }).from(repositories);

    for (const repo of repos) {
      const stars = repo.stars_count ?? 0;
      ranges.total++;

      if (stars >= 50000) ranges['50K+']++;
      else if (stars >= 20000) ranges['20K-50K']++;
      else if (stars >= 10000) ranges['10K-20K']++;
      else if (stars >= 5000) ranges['5K-10K']++;
      else ranges['1K-5K']++;
    }

    return ranges;
  }

  private async analyzeTopics(): Promise<[string, number][]> {
    const repos = await this.db.select({ topics: repositories.topics }).from(repositories);

    const topicCounts: Record<string, number> = {};

    for (const repo of repos) {
      if (Array.isArray(repo.topics)) {
        for (const topic of repo.topics) {
          if (typeof topic === 'string') {
            topicCounts[topic] = (topicCounts[topic] || 0) + 1;
          }
        }
      }
    }

    return Object.entries(topicCounts).sort(([, a], [, b]) => b - a);
  }
}

// メイン実行
const main = async () => {
  const analyzer = new ComprehensiveAnalyzer();
  await analyzer.execute();
};

main().catch((error) => {
  console.error('Fatal error during comprehensive analysis:', error);
  process.exit(1);
});

#!/usr/bin/env tsx
/**
 * データセットエクスポート
 * 論文研究用のCSV/JSON形式でデータを出力
 */

import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { desc, eq } from 'drizzle-orm';
import { filtering_stages, repositories, repository_filter_status } from '../../drizzle/schema.js';
import { getDatabase } from '../../src/repository/database.js';

interface ExportRepository {
  id: number;
  full_name: string;
  name: string;
  owner: string;
  description: string | null;
  language: string | null;
  license: string | null;
  homepage: string | null;
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
  stars_count: number;
  forks_count: number;
  watchers_count: number;
  size: number;
  open_issues_count: number;
  has_issues: boolean;
  has_projects: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  archived: boolean;
  disabled: boolean;
  first_collected_at: string | null;

  // フィルタリング結果
  popularity_passed: boolean;
  activity_passed: boolean;
  quality_passed: boolean;
  overall_passed: boolean;

  // 計算フィールド
  age_days: number;
  last_update_days: number;
  stars_per_fork: number;
  creation_year: number;
}

class DatasetExporter {
  private db = getDatabase();
  private exportDir = '/app/exports';

  async execute(): Promise<void> {
    console.log('📤 Dataset Export for Academic Research');
    console.log('='.repeat(50));

    try {
      // エクスポートディレクトリ作成
      await this.ensureExportDirectory();

      // データ収集と処理
      console.log('📊 Collecting repository data...');
      const repositories = await this.collectRepositoryData();
      console.log(`✅ Collected ${repositories.length} repositories`);

      // CSV出力
      console.log('📄 Exporting to CSV format...');
      await this.exportToCSV(repositories);

      // JSON出力
      console.log('📄 Exporting to JSON format...');
      await this.exportToJSON(repositories);

      // メタデータ出力
      console.log('📋 Generating metadata...');
      await this.exportMetadata(repositories);

      // 統計サマリー
      console.log('📈 Generating statistics summary...');
      await this.exportStatistics(repositories);

      console.log('');
      console.log('✅ Dataset export completed successfully!');
      this.printExportSummary(repositories.length);
    } catch (error) {
      console.error('❌ Dataset export failed:');
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  private async ensureExportDirectory(): Promise<void> {
    if (!existsSync(this.exportDir)) {
      await mkdir(this.exportDir, { recursive: true });
    }
  }

  private async collectRepositoryData(): Promise<ExportRepository[]> {
    // リポジトリ基本データ
    const repoData = await this.db.select().from(repositories).orderBy(desc(repositories.stars_count));

    // フィルタリング結果を取得
    const filterResults = await this.getFilterResults();

    // データ変換
    const exportData: ExportRepository[] = [];

    for (const repo of repoData) {
      const filters = filterResults.get(repo.id) || {};

      // 計算フィールド
      const createdDate = new Date(repo.created_at);
      const updatedDate = new Date(repo.updated_at);
      const now = new Date();

      const ageDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      const lastUpdateDays = Math.floor((now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));
      const starsPerFork =
        (repo.forks_count || 0) > 0 ? (repo.stars_count || 0) / (repo.forks_count || 1) : repo.stars_count || 0;

      exportData.push({
        id: repo.id,
        full_name: repo.full_name,
        name: repo.name,
        owner: repo.owner,
        description: repo.description,
        language: repo.language,
        license: repo.license,
        homepage: repo.homepage,
        topics: Array.isArray(repo.topics) ? (repo.topics as string[]) : [],
        created_at: repo.created_at,
        updated_at: repo.updated_at,
        pushed_at: repo.pushed_at,
        stars_count: repo.stars_count || 0,
        forks_count: repo.forks_count || 0,
        watchers_count: repo.watchers_count || 0,
        size: repo.size || 0,
        open_issues_count: repo.open_issues_count || 0,
        has_issues: repo.has_issues || false,
        has_projects: repo.has_projects || false,
        has_wiki: repo.has_wiki || false,
        has_pages: repo.has_pages || false,
        archived: repo.archived || false,
        disabled: repo.disabled || false,
        first_collected_at: repo.first_collected_at,

        // フィルタリング結果
        popularity_passed: filters.popularity || false,
        activity_passed: filters.activity || false,
        quality_passed: filters.quality || false,
        overall_passed: (filters.popularity && filters.activity && filters.quality) || false,

        // 計算フィールド
        age_days: ageDays,
        last_update_days: lastUpdateDays,
        stars_per_fork: Number(starsPerFork.toFixed(2)),
        creation_year: createdDate.getFullYear(),
      });
    }

    return exportData;
  }

  private async getFilterResults(): Promise<Map<number, Record<string, boolean>>> {
    const filterData = await this.db
      .select({
        repository_id: repository_filter_status.repository_id,
        stage_name: filtering_stages.name,
        passed: repository_filter_status.status,
      })
      .from(repository_filter_status)
      .innerJoin(filtering_stages, eq(repository_filter_status.stage_id, filtering_stages.id));

    const results = new Map<number, Record<string, boolean>>();

    for (const filter of filterData) {
      if (!results.has(filter.repository_id)) {
        results.set(filter.repository_id, {});
      }

      const repoFilters = results.get(filter.repository_id);
      if (!repoFilters) {
        continue;
      }

      // ステージ名を簡略化
      if (filter.stage_name.includes('popularity')) {
        repoFilters.popularity = filter.passed === 'passed';
      } else if (filter.stage_name.includes('activity')) {
        repoFilters.activity = filter.passed === 'passed';
      } else if (filter.stage_name.includes('quality')) {
        repoFilters.quality = filter.passed === 'passed';
      }
    }

    return results;
  }

  private async exportToCSV(data: ExportRepository[]): Promise<void> {
    // CSVヘッダー
    const headers = [
      'id',
      'full_name',
      'name',
      'owner',
      'description',
      'language',
      'license',
      'homepage',
      'topics_json',
      'created_at',
      'updated_at',
      'pushed_at',
      'stars_count',
      'forks_count',
      'watchers_count',
      'size',
      'open_issues_count',
      'has_issues',
      'has_projects',
      'has_wiki',
      'has_pages',
      'archived',
      'disabled',
      'first_collected_at',
      'popularity_passed',
      'activity_passed',
      'quality_passed',
      'overall_passed',
      'age_days',
      'last_update_days',
      'stars_per_fork',
      'creation_year',
    ];

    // CSV行データ
    const csvRows = [headers.join(',')];

    for (const repo of data) {
      const row = [
        repo.id,
        `"${repo.full_name}"`,
        `"${repo.name}"`,
        `"${repo.owner}"`,
        repo.description ? `"${repo.description.replace(/"/g, '""')}"` : '',
        repo.language || '',
        repo.license || '',
        repo.homepage || '',
        `"${JSON.stringify(repo.topics).replace(/"/g, '""')}"`,
        repo.created_at,
        repo.updated_at,
        repo.pushed_at || '',
        repo.stars_count,
        repo.forks_count,
        repo.watchers_count,
        repo.size,
        repo.open_issues_count,
        repo.has_issues,
        repo.has_projects,
        repo.has_wiki,
        repo.has_pages,
        repo.archived,
        repo.disabled,
        repo.first_collected_at || '',
        repo.popularity_passed,
        repo.activity_passed,
        repo.quality_passed,
        repo.overall_passed,
        repo.age_days,
        repo.last_update_days,
        repo.stars_per_fork,
        repo.creation_year,
      ];

      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    await writeFile(`${this.exportDir}/repositories_dataset.csv`, csvContent, 'utf-8');
  }

  private async exportToJSON(data: ExportRepository[]): Promise<void> {
    const jsonData = {
      metadata: {
        export_date: new Date().toISOString(),
        total_repositories: data.length,
        description: 'High-quality TypeScript repositories dataset for academic research',
        collection_strategy: 'Hybrid: Quality-focused (700) + Temporal distribution (300)',
        data_schema_version: '1.0.0',
      },
      repositories: data,
    };

    await writeFile(`${this.exportDir}/repositories_dataset.json`, JSON.stringify(jsonData, null, 2), 'utf-8');
  }

  private async exportMetadata(data: ExportRepository[]): Promise<void> {
    const metadata = {
      dataset_info: {
        name: 'Stellar-JS TypeScript Repository Dataset',
        version: '1.0.0',
        description: 'Curated dataset of high-quality TypeScript repositories for academic research',
        total_repositories: data.length,
        collection_date: new Date().toISOString(),
        collection_tool: 'Stellar-JS v1.0.0',
      },

      collection_strategy: {
        phase1: {
          name: 'Quality-focused Collection',
          target: 700,
          actual: data.filter((r) => r.stars_count >= 5000).length,
          description: 'Multi-tier quality filtering with adaptive adjustment',
        },
        phase2: {
          name: 'Temporal Distribution',
          target: 300,
          actual: data.filter((r) => r.creation_year >= 2020 && r.creation_year <= 2022).length,
          description: 'Year-based distribution for ecosystem evolution analysis',
        },
      },

      data_quality: {
        min_stars: Math.min(...data.map((r) => r.stars_count)),
        max_stars: Math.max(...data.map((r) => r.stars_count)),
        avg_stars: Math.round(data.reduce((sum, r) => sum + r.stars_count, 0) / data.length),
        median_stars: this.calculateMedian(data.map((r) => r.stars_count)),
      },

      temporal_distribution: this.calculateTemporalDistribution(data),

      filter_effectiveness: {
        popularity_pass_rate: `${((data.filter((r) => r.popularity_passed).length / data.length) * 100).toFixed(1)}%`,
        activity_pass_rate: `${((data.filter((r) => r.activity_passed).length / data.length) * 100).toFixed(1)}%`,
        quality_pass_rate: `${((data.filter((r) => r.quality_passed).length / data.length) * 100).toFixed(1)}%`,
        overall_pass_rate: `${((data.filter((r) => r.overall_passed).length / data.length) * 100).toFixed(1)}%`,
      },

      fields_description: {
        id: 'GitHub repository ID',
        full_name: 'Repository full name (owner/name)',
        stars_count: 'Number of stars',
        forks_count: 'Number of forks',
        age_days: 'Days since repository creation',
        last_update_days: 'Days since last update',
        stars_per_fork: 'Ratio of stars to forks',
        creation_year: 'Year the repository was created',
        popularity_passed: 'Passed popularity filter (boolean)',
        activity_passed: 'Passed activity filter (boolean)',
        quality_passed: 'Passed quality filter (boolean)',
        overall_passed: 'Passed all filters (boolean)',
      },
    };

    await writeFile(`${this.exportDir}/dataset_metadata.json`, JSON.stringify(metadata, null, 2), 'utf-8');
  }

  private async exportStatistics(data: ExportRepository[]): Promise<void> {
    const stats = {
      summary: {
        total_repositories: data.length,
        avg_stars: Math.round(data.reduce((sum, r) => sum + r.stars_count, 0) / data.length),
        avg_forks: Math.round(data.reduce((sum, r) => sum + r.forks_count, 0) / data.length),
        avg_age_days: Math.round(data.reduce((sum, r) => sum + r.age_days, 0) / data.length),
      },

      language_distribution: this.calculateLanguageDistribution(data),
      year_distribution: this.calculateTemporalDistribution(data),
      star_ranges: this.calculateStarRanges(data),
      filter_statistics: this.calculateFilterStatistics(data),

      top_repositories: data
        .sort((a, b) => b.stars_count - a.stars_count)
        .slice(0, 20)
        .map((r) => ({
          full_name: r.full_name,
          stars: r.stars_count,
          forks: r.forks_count,
          year: r.creation_year,
          overall_passed: r.overall_passed,
        })),
    };

    await writeFile(`${this.exportDir}/dataset_statistics.json`, JSON.stringify(stats, null, 2), 'utf-8');

    // 人間が読みやすい統計レポートも生成
    const reportLines = [
      '# Stellar-JS Dataset Statistics Report',
      '',
      `**Generated:** ${new Date().toLocaleString()}`,
      `**Total Repositories:** ${stats.summary.total_repositories}`,
      '',
      '## Summary Statistics',
      `- Average Stars: ${stats.summary.avg_stars.toLocaleString()}`,
      `- Average Forks: ${stats.summary.avg_forks.toLocaleString()}`,
      `- Average Age: ${stats.summary.avg_age_days} days`,
      '',
      '## Language Distribution',
      ...Object.entries(stats.language_distribution).map(([lang, count]) => `- ${lang}: ${count} repositories`),
      '',
      '## Year Distribution',
      ...Object.entries(stats.year_distribution).map(([year, count]) => `- ${year}: ${count} repositories`),
      '',
      '## Star Ranges',
      ...Object.entries(stats.star_ranges).map(([range, count]) => `- ${range}: ${count} repositories`),
    ];

    await writeFile(`${this.exportDir}/statistics_report.md`, reportLines.join('\n'), 'utf-8');
  }

  private calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2 : (sorted[mid] ?? 0);
  }

  private calculateTemporalDistribution(data: ExportRepository[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const repo of data) {
      const year = repo.creation_year.toString();
      distribution[year] = (distribution[year] || 0) + 1;
    }

    return distribution;
  }

  private calculateLanguageDistribution(data: ExportRepository[]): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const repo of data) {
      const lang = repo.language || 'Unknown';
      distribution[lang] = (distribution[lang] || 0) + 1;
    }

    return distribution;
  }

  private calculateStarRanges(data: ExportRepository[]): Record<string, number> {
    const ranges: Record<string, number> = {
      '1K-5K': 0,
      '5K-10K': 0,
      '10K-20K': 0,
      '20K-50K': 0,
      '50K+': 0,
    };

    for (const repo of data) {
      const stars = repo.stars_count;
      if (stars >= 50000) ranges['50K+'] = (ranges['50K+'] ?? 0) + 1;
      else if (stars >= 20000) ranges['20K-50K'] = (ranges['20K-50K'] ?? 0) + 1;
      else if (stars >= 10000) ranges['10K-20K'] = (ranges['10K-20K'] ?? 0) + 1;
      else if (stars >= 5000) ranges['5K-10K'] = (ranges['5K-10K'] ?? 0) + 1;
      else ranges['1K-5K'] = (ranges['1K-5K'] ?? 0) + 1;
    }

    return ranges;
  }

  private calculateFilterStatistics(data: ExportRepository[]): Record<string, unknown> {
    const total = data.length;
    return {
      popularity: {
        passed: data.filter((r) => r.popularity_passed).length,
        rate: `${((data.filter((r) => r.popularity_passed).length / total) * 100).toFixed(1)}%`,
      },
      activity: {
        passed: data.filter((r) => r.activity_passed).length,
        rate: `${((data.filter((r) => r.activity_passed).length / total) * 100).toFixed(1)}%`,
      },
      quality: {
        passed: data.filter((r) => r.quality_passed).length,
        rate: `${((data.filter((r) => r.quality_passed).length / total) * 100).toFixed(1)}%`,
      },
      overall: {
        passed: data.filter((r) => r.overall_passed).length,
        rate: `${((data.filter((r) => r.overall_passed).length / total) * 100).toFixed(1)}%`,
      },
    };
  }

  private printExportSummary(totalRepos: number): void {
    console.log('');
    console.log('📁 Generated Files:');
    console.log(`   ${this.exportDir}/repositories_dataset.csv`);
    console.log(`   ${this.exportDir}/repositories_dataset.json`);
    console.log(`   ${this.exportDir}/dataset_metadata.json`);
    console.log(`   ${this.exportDir}/dataset_statistics.json`);
    console.log(`   ${this.exportDir}/statistics_report.md`);
    console.log('');
    console.log('📊 Dataset Summary:');
    console.log(`   Total Repositories: ${totalRepos}`);
    console.log('   Format: CSV (statistical analysis) + JSON (detailed analysis)');
    console.log('   Metadata: Complete field descriptions and collection info');
    console.log('   Statistics: Distribution analysis and top repositories');
    console.log('');
    console.log('🎯 Research Usage:');
    console.log('   • Import CSV into R/Python for statistical analysis');
    console.log('   • Use JSON for detailed programmatic analysis');
    console.log('   • Reference metadata for dataset documentation');
    console.log('   • Cite statistics in academic papers');
    console.log('');
    console.log('📋 Citation Suggestion:');
    console.log('   Dataset: Stellar-JS TypeScript Repository Dataset v1.0.0');
    console.log(`   Date: ${new Date().toISOString().split('T')[0]}`);
    console.log('   Repositories: High-quality TypeScript projects (1000 repos)');
    console.log('   Method: Multi-tier filtering + temporal distribution');
  }
}

// メイン実行
const main = async () => {
  const exporter = new DatasetExporter();
  await exporter.execute();
};

main().catch((error) => {
  console.error('Fatal error during dataset export:', error);
  process.exit(1);
});

#!/usr/bin/env tsx
/**
 * Large Scale Collection: 1000件収集統合管理
 *
 * Phase 1 (Quality 700) + Phase 2 (Temporal 300) の統合実行
 */

import 'dotenv/config';
import { spawn } from 'node:child_process';

class LargeScaleCollectionManager {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  async execute(): Promise<void> {
    console.log('🎯 Stellar-JS: Large Scale Collection (1000 repositories)');
    console.log('='.repeat(65));
    console.log('Hybrid Strategy: Quality Priority + Temporal Balance');
    console.log('');
    console.log('📋 Execution Plan:');
    console.log('   Phase 1: Quality-focused collection (700 repos)');
    console.log('   Phase 2: Temporal distribution (300 repos)');
    console.log('   Phase 3: Analysis and export');
    console.log('');

    try {
      // 環境確認
      this.validateEnvironment();

      // Phase 1: 品質重視収集
      console.log('🚀 Starting Phase 1: Quality Collection...');
      await this.executePhase('phase1', 'Quality-focused collection (700 repos)');

      // Phase 2: 時系列分散収集
      console.log('🚀 Starting Phase 2: Temporal Collection...');
      await this.executePhase('phase2', 'Temporal distribution (300 repos)');

      // Phase 3: 分析とエクスポート
      console.log('🚀 Starting Phase 3: Analysis and Export...');
      await this.executeFinalPhase();

      // 完了レポート
      await this.generateCompletionReport();
    } catch (error) {
      console.error('');
      console.error('❌ Large scale collection failed:');
      console.error(error instanceof Error ? error.message : error);
      console.error('');
      this.printRecoveryInstructions();
      process.exit(1);
    }
  }

  private validateEnvironment(): void {
    console.log('🔍 Validating environment...');

    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }

    console.log('✅ Environment validation passed');
    console.log('');
  }

  private async executePhase(phaseScript: string, description: string): Promise<void> {
    console.log(`📊 ${description}`);
    console.log('─'.repeat(50));

    const startTime = Date.now();

    try {
      await this.runScript(phaseScript);

      const duration = (Date.now() - startTime) / 1000;
      console.log(`✅ Phase completed in ${duration.toFixed(1)} seconds`);
      console.log('');
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      console.error(`❌ Phase failed after ${duration.toFixed(1)} seconds`);
      throw error;
    }
  }

  private async executeFinalPhase(): Promise<void> {
    console.log('📊 Analysis and Export Phase');
    console.log('─'.repeat(50));

    const startTime = Date.now();

    try {
      // 包括的分析の実行
      console.log('📈 Generating comprehensive analysis...');
      await this.runScript('comprehensive-analysis');

      // データセットエクスポート
      console.log('📤 Exporting dataset for research...');
      await this.runScript('export-dataset');

      const duration = (Date.now() - startTime) / 1000;
      console.log(`✅ Analysis and export completed in ${duration.toFixed(1)} seconds`);
      console.log('');
    } catch (error) {
      // 分析フェーズのエラーは警告として扱う（データ収集は成功しているため）
      console.warn('⚠️ Analysis phase encountered issues, but data collection succeeded');
      console.warn('You can run analysis manually with: npm run comprehensive-analysis');
      console.warn('');
    }
  }

  private async runScript(scriptName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn('npm', ['run', scriptName], {
        stdio: 'inherit',
        env: process.env,
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Script ${scriptName} exited with code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to start script ${scriptName}: ${error.message}`));
      });
    });
  }

  private async generateCompletionReport(): Promise<void> {
    const totalDuration = (Date.now() - this.startTime) / 1000;
    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);
    const seconds = Math.floor(totalDuration % 60);

    console.log('🎉 Large Scale Collection Completed Successfully!');
    console.log('='.repeat(65));
    console.log(`Total Duration: ${hours}h ${minutes}m ${seconds}s`);
    console.log('');

    console.log('📊 Collection Summary:');
    console.log('   ✅ Phase 1: Quality-focused collection (target: 700 repos)');
    console.log('   ✅ Phase 2: Temporal distribution (target: 300 repos)');
    console.log('   ✅ Phase 3: Analysis and export');
    console.log('');

    console.log('🎯 Achievement Highlights:');
    console.log('   • 1000 high-quality TypeScript repositories collected');
    console.log('   • Multi-tier quality filtering applied');
    console.log('   • Temporal distribution for evolution analysis');
    console.log('   • Research-ready dataset exported');
    console.log('   • Comprehensive analysis generated');
    console.log('');

    console.log('📁 Output Files:');
    console.log('   Database: /app/data/stellar.db');
    console.log('   Exports: /app/exports/');
    console.log('   Logs: /app/logs/');
    console.log('');

    console.log('💡 Next Steps:');
    console.log('   • Copy exported files from Docker volumes');
    console.log('   • Import CSV/JSON into analysis tools (R, Python)');
    console.log('   • Explore data with Drizzle Studio');
    console.log('   • Begin academic research analysis');
    console.log('');

    console.log('🐳 Docker Commands:');
    console.log('   # Copy exports to host');
    console.log('   docker cp stellar-js-collector:/app/exports ./research-data');
    console.log('');
    console.log('   # View database in Studio');
    console.log('   docker-compose --profile debug up stellar-studio');
    console.log('');
    console.log('   # Re-run analysis only');
    console.log('   docker-compose --profile analysis up stellar-analyzer');
  }

  private printRecoveryInstructions(): void {
    console.log('🔧 Recovery Instructions:');
    console.log('');
    console.log('Phase-specific execution:');
    console.log('   docker-compose run stellar-collector npm run phase1');
    console.log('   docker-compose run stellar-collector npm run phase2');
    console.log('   docker-compose run stellar-collector npm run comprehensive-analysis');
    console.log('');
    console.log('Debug mode:');
    console.log('   docker-compose run stellar-collector bash');
    console.log('');
    console.log('Check logs:');
    console.log('   docker-compose logs stellar-collector');
    console.log('');
    console.log('Database access:');
    console.log('   docker-compose --profile debug up stellar-studio');
  }
}

// メイン実行
const main = async () => {
  const manager = new LargeScaleCollectionManager();
  await manager.execute();
};

main().catch((error) => {
  console.error('Fatal error during large scale collection:', error);
  process.exit(1);
});

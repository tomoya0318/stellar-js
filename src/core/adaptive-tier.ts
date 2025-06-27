/**
 * 動的Tier調整システム
 * スター数分布に基づいて収集目標を柔軟に調整する
 */

export interface TierConfig {
  id: string;
  name: string;
  minStars: number;
  maxStars?: number;
  targetCount: number;
  actualCount: number;
  query: string;
}

export interface AdaptiveTierResult {
  originalTiers: TierConfig[];
  adjustedTiers: TierConfig[];
  adjustmentReason: string;
  totalTarget: number;
  totalActual: number;
}

export class AdaptiveTierManager {
  private readonly TOTAL_TARGET = 700; // Phase1の目標数
  private readonly MIN_STARS_THRESHOLD = 1000; // 最低品質閾値

  /**
   * 初期Tier設定
   */
  createInitialTiers(): TierConfig[] {
    return [
      {
        id: 'ultra-high',
        name: '超高品質',
        minStars: 20000,
        targetCount: 100,
        actualCount: 0,
        query: 'language:javascript stars:>=20000',
      },
      {
        id: 'very-high',
        name: '非常に高品質',
        minStars: 10000,
        maxStars: 19999,
        targetCount: 150,
        actualCount: 0,
        query: 'language:javascript stars:10000..19999',
      },
      {
        id: 'high',
        name: '高品質',
        minStars: 5000,
        maxStars: 9999,
        targetCount: 250,
        actualCount: 0,
        query: 'language:javascript stars:5000..9999',
      },
      {
        id: 'good',
        name: '良品質',
        minStars: 1000,
        maxStars: 4999,
        targetCount: 200,
        actualCount: 0,
        query: 'language:javascript stars:1000..4999',
      },
    ];
  }

  /**
   * Tier調整メイン処理
   */
  async adjustTiers(tiers: TierConfig[]): Promise<AdaptiveTierResult> {
    const originalTiers = [...tiers];
    const adjustedTiers = [...tiers];

    console.log('🔧 Starting adaptive tier adjustment...');
    console.log(`Total target: ${this.TOTAL_TARGET}, Current actual: ${this.getTotalActual(tiers)}`);

    // 1. 上位Tierの不足分を計算
    const shortfalls = this.calculateShortfalls(tiers);
    console.log('📊 Tier shortfalls:', shortfalls);

    // 2. 調整戦略を決定
    const adjustmentStrategy = this.determineAdjustmentStrategy(shortfalls, tiers);

    // 3. 調整を実行
    const adjustmentResult = await this.executeAdjustment(adjustedTiers, adjustmentStrategy);

    return {
      originalTiers,
      adjustedTiers,
      adjustmentReason: adjustmentResult.reason,
      totalTarget: this.TOTAL_TARGET,
      totalActual: this.getTotalActual(adjustedTiers),
    };
  }

  /**
   * 各Tierの不足分を計算
   */
  private calculateShortfalls(tiers: TierConfig[]): Record<string, number> {
    const shortfalls: Record<string, number> = {};

    for (const tier of tiers) {
      const shortfall = tier.targetCount - tier.actualCount;
      if (shortfall > 0) {
        shortfalls[tier.id] = shortfall;
      }
    }

    return shortfalls;
  }

  /**
   * 調整戦略を決定
   */
  private determineAdjustmentStrategy(
    shortfalls: Record<string, number>,
    _tiers: TierConfig[],
  ): 'compensate-lower' | 'reduce-threshold' | 'mixed' {
    const totalShortfall = Object.values(shortfalls).reduce((sum, s) => sum + s, 0);
    const ultraHighShortfall = shortfalls['ultra-high'] || 0;

    console.log(`📋 Total shortfall: ${totalShortfall}, Ultra-high shortfall: ${ultraHighShortfall}`);

    // 超高品質Tierの不足が大きい場合は閾値を下げる
    if (ultraHighShortfall > 50) {
      return 'reduce-threshold';
    }

    // 全体的な不足が少ない場合は下位Tierで補完
    if (totalShortfall <= 100) {
      return 'compensate-lower';
    }

    // 混合戦略
    return 'mixed';
  }

  /**
   * 調整を実行
   */
  private async executeAdjustment(tiers: TierConfig[], strategy: string): Promise<{ reason: string }> {
    console.log(`🎯 Executing adjustment strategy: ${strategy}`);

    switch (strategy) {
      case 'compensate-lower':
        return this.compensateWithLowerTiers(tiers);

      case 'reduce-threshold':
        return this.reduceThresholds(tiers);

      case 'mixed':
        return this.executeMixedStrategy(tiers);

      default:
        return { reason: 'No adjustment needed' };
    }
  }

  /**
   * 下位Tierで補完
   */
  private compensateWithLowerTiers(tiers: TierConfig[]): { reason: string } {
    const shortfalls = this.calculateShortfalls(tiers);
    const totalShortfall = Object.values(shortfalls).reduce((sum, s) => sum + s, 0);

    // 下位Tierの目標数を増加
    const lowerTiers = ['high', 'good'];
    const compensationPerTier = Math.ceil(totalShortfall / lowerTiers.length);

    for (const tierId of lowerTiers) {
      const tier = tiers.find((t) => t.id === tierId);
      if (tier) {
        tier.targetCount += compensationPerTier;
        console.log(`📈 Increased ${tier.name} target by ${compensationPerTier} (new: ${tier.targetCount})`);
      }
    }

    return { reason: `下位Tierで${totalShortfall}件補完（${lowerTiers.join(', ')}の目標数増加）` };
  }

  /**
   * 閾値を下げる
   */
  private reduceThresholds(tiers: TierConfig[]): { reason: string } {
    const ultraHighTier = tiers.find((t) => t.id === 'ultra-high');
    const veryHighTier = tiers.find((t) => t.id === 'very-high');

    if (ultraHighTier) {
      // 超高品質の閾値を20000→15000に下げる
      ultraHighTier.minStars = 15000;
      ultraHighTier.query = 'language:javascript stars:>=15000';
      console.log(`🔽 Reduced ultra-high tier threshold to ${ultraHighTier.minStars} stars`);
    }

    if (veryHighTier && ultraHighTier) {
      // 非常に高品質の範囲を調整
      veryHighTier.maxStars = 14999;
      veryHighTier.query = 'language:javascript stars:10000..14999';
      console.log(`🔄 Adjusted very-high tier range to ${veryHighTier.minStars}-${veryHighTier.maxStars} stars`);
    }

    return { reason: '超高品質Tierの閾値を20,000→15,000に下げて収集範囲を拡大' };
  }

  /**
   * 混合戦略
   */
  private executeMixedStrategy(tiers: TierConfig[]): { reason: string } {
    // まず閾値を少し下げる
    const thresholdResult = this.reduceThresholds(tiers);

    // それでも不足する場合は下位Tierで補完
    const compensationResult = this.compensateWithLowerTiers(tiers);

    return {
      reason: `混合戦略: ${thresholdResult.reason}、加えて${compensationResult.reason}`,
    };
  }

  /**
   * 実際の収集可能数を予測（GitHub API制限を考慮）
   */
  async estimateAvailableCount(tier: TierConfig): Promise<number> {
    // 実際の実装では GitHub Search API を使用
    // ここでは推定値を返す

    if (tier.minStars >= 20000) {
      return Math.min(tier.targetCount, 80); // 超高品質は少ない
    }
    if (tier.minStars >= 10000) {
      return Math.min(tier.targetCount, 200);
    }
    if (tier.minStars >= 5000) {
      return Math.min(tier.targetCount, 400);
    }
    return tier.targetCount; // 1000+は十分存在
  }

  /**
   * 品質保証チェック
   */
  validateQualityStandards(tiers: TierConfig[]): boolean {
    // 最低品質閾値の維持
    const lowestTier = tiers[tiers.length - 1];
    if (lowestTier && lowestTier.minStars < this.MIN_STARS_THRESHOLD) {
      console.warn(
        `⚠️ Quality standard violation: lowest tier has ${lowestTier.minStars} stars (minimum: ${this.MIN_STARS_THRESHOLD})`,
      );
      return false;
    }

    // 総数の確認
    const totalTarget = this.getTotalTarget(tiers);
    if (totalTarget < this.TOTAL_TARGET * 0.9) {
      // 90%未満は警告
      console.warn(`⚠️ Total target too low: ${totalTarget} (minimum: ${this.TOTAL_TARGET * 0.9})`);
      return false;
    }

    return true;
  }

  /**
   * ユーティリティメソッド
   */
  private getTotalActual(tiers: TierConfig[]): number {
    return tiers.reduce((sum, tier) => sum + tier.actualCount, 0);
  }

  private getTotalTarget(tiers: TierConfig[]): number {
    return tiers.reduce((sum, tier) => sum + tier.targetCount, 0);
  }

  /**
   * 進捗レポート生成
   */
  generateProgressReport(tiers: TierConfig[]): string {
    const lines = ['📊 Tier Collection Progress:', ''];

    for (const tier of tiers) {
      const progress = tier.targetCount > 0 ? ((tier.actualCount / tier.targetCount) * 100).toFixed(1) : '0.0';
      const stars = tier.maxStars
        ? `${tier.minStars.toLocaleString()}-${tier.maxStars.toLocaleString()}`
        : `${tier.minStars.toLocaleString()}+`;

      lines.push(`   ${tier.name} (${stars}⭐): ${tier.actualCount}/${tier.targetCount} (${progress}%)`);
    }

    const totalActual = this.getTotalActual(tiers);
    const totalTarget = this.getTotalTarget(tiers);
    const overallProgress = totalTarget > 0 ? ((totalActual / totalTarget) * 100).toFixed(1) : '0.0';

    lines.push('');
    lines.push(`📈 Overall Progress: ${totalActual}/${totalTarget} (${overallProgress}%)`);

    return lines.join('\n');
  }
}

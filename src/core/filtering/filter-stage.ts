import type { FilterDetails, FilterResult, Repository } from '../../types/index.js';

export interface FilterStage {
  id: number;
  name: string;
  description: string;
  evaluate(repository: Repository): Promise<FilterResult>;
}

export abstract class BaseFilterStage implements FilterStage {
  abstract id: number;
  abstract name: string;
  abstract description: string;

  abstract evaluate(repository: Repository): Promise<FilterResult>;

  protected createResult(passed: boolean, score: number, details: FilterDetails): FilterResult {
    return {
      passed,
      score,
      details,
    };
  }

  protected calculateDaysAgo(dateString: string | null): number {
    if (!dateString) return Number.MAX_SAFE_INTEGER;

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  protected normalizeScore(value: number, min: number, max: number): number {
    if (max === min) return value >= min ? 1 : 0;
    return Math.min(Math.max((value - min) / (max - min), 0), 1);
  }
}

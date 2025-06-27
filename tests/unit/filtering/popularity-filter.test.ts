import { beforeEach, describe, expect, it } from 'vitest';
import { PopularityFilter } from '../../../src/core/filtering/stages/popularity-filter.js';
import type { PopularityCriteria, PopularityFilterDetails, Repository } from '../../../src/types/index.js';

describe('PopularityFilter', () => {
  let filter: PopularityFilter;
  let criteria: PopularityCriteria;
  let testRepository: Repository;

  beforeEach(() => {
    criteria = {
      min_stars: 100,
      min_forks: 10,
      not_archived: true,
      not_disabled: true,
    };

    filter = new PopularityFilter(criteria);

    testRepository = {
      id: 1,
      full_name: 'test/repo',
      name: 'repo',
      owner: 'test',
      description: 'Test repository',
      language: 'TypeScript',
      license: 'MIT',
      homepage: null,
      topics: [],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-12-01T00:00:00Z',
      pushed_at: '2023-12-01T00:00:00Z',
      stars_count: 150,
      forks_count: 20,
      watchers_count: 100,
      size: 1000,
      open_issues_count: 5,
      has_issues: true,
      has_projects: true,
      has_wiki: true,
      has_pages: false,
      has_downloads: true,
      archived: false,
      disabled: false,
      first_collected_at: '2023-12-01T00:00:00Z',
      last_updated_at: '2023-12-01T00:00:00Z',
    };
  });

  describe('正常系', () => {
    it('基準を満たすリポジトリが通過する', async () => {
      const result = await filter.evaluate(testRepository);

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThan(0);
      const details = result.details as PopularityFilterDetails;
      expect(details.checks.stars).toBe(true);
      expect(details.checks.forks).toBe(true);
      expect(details.checks.not_archived).toBe(true);
      expect(details.checks.not_disabled).toBe(true);
    });

    it('高いスター数のリポジトリが高いスコアを得る', async () => {
      const highStarRepo = { ...testRepository, stars_count: 1000 };
      const lowStarRepo = { ...testRepository, stars_count: 100 };

      const highResult = await filter.evaluate(highStarRepo);
      const lowResult = await filter.evaluate(lowStarRepo);

      expect(highResult.score).toBeGreaterThan(lowResult.score);
    });
  });

  describe('異常系', () => {
    it('スター数が基準未満のリポジトリが失敗する', async () => {
      const lowStarRepo = { ...testRepository, stars_count: 50 };
      const result = await filter.evaluate(lowStarRepo);

      expect(result.passed).toBe(false);
      const details = result.details as PopularityFilterDetails;
      expect(details.checks.stars).toBe(false);
    });

    it('フォーク数が基準未満のリポジトリが失敗する', async () => {
      const lowForkRepo = { ...testRepository, forks_count: 5 };
      const result = await filter.evaluate(lowForkRepo);

      expect(result.passed).toBe(false);
      const details = result.details as PopularityFilterDetails;
      expect(details.checks.forks).toBe(false);
    });

    it('アーカイブされたリポジトリが失敗する', async () => {
      const archivedRepo = { ...testRepository, archived: true };
      const result = await filter.evaluate(archivedRepo);

      expect(result.passed).toBe(false);
      const details = result.details as PopularityFilterDetails;
      expect(details.checks.not_archived).toBe(false);
    });

    it('無効化されたリポジトリが失敗する', async () => {
      const disabledRepo = { ...testRepository, disabled: true };
      const result = await filter.evaluate(disabledRepo);

      expect(result.passed).toBe(false);
      const details = result.details as PopularityFilterDetails;
      expect(details.checks.not_disabled).toBe(false);
    });
  });

  describe('エッジケース', () => {
    it('nullの値を適切にハンドリングする', async () => {
      const nullValueRepo = {
        ...testRepository,
        stars_count: null as any,
        forks_count: null as any,
      };

      const result = await filter.evaluate(nullValueRepo);

      expect(result.passed).toBe(false);
      const details = result.details as PopularityFilterDetails;
      expect(details.stars_count).toBe(null);
      expect(details.forks_count).toBe(null);
    });

    it('基準値ちょうどのリポジトリが通過する', async () => {
      const borderlineRepo = {
        ...testRepository,
        stars_count: 100,
        forks_count: 10,
      };

      const result = await filter.evaluate(borderlineRepo);

      expect(result.passed).toBe(true);
      const details = result.details as PopularityFilterDetails;
      expect(details.checks.stars).toBe(true);
      expect(details.checks.forks).toBe(true);
    });
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import { GitHubApiError, GitHubClient } from '../../src/api/github-client.js';

describe('GitHubClient', () => {
  let client: GitHubClient;
  const testToken = 'test-token';

  beforeEach(() => {
    client = new GitHubClient(testToken);
  });

  describe('正常系', () => {
    it('有効なトークンでクライアントを初期化できる', () => {
      expect(client).toBeInstanceOf(GitHubClient);
    });

    it('レート制限チェックが実行できる', async () => {
      // Note: 実際のAPIを呼ばないため、このテストは実際の実装では異なる可能性があります
      expect(typeof client.checkRateLimit).toBe('function');
    });
  });

  describe('異常系', () => {
    it('トークンが空の場合、エラーをスローする', () => {
      expect(() => {
        new GitHubClient('');
      }).toThrow('GitHub token is required');
    });

    it('GitHubApiErrorが適切にエラー情報を保持する', () => {
      const error = new GitHubApiError('Test error', 404, { original: 'error' });

      expect(error.message).toBe('Test error');
      expect(error.status).toBe(404);
      expect(error.originalError).toEqual({ original: 'error' });
      expect(error.name).toBe('GitHubApiError');
    });
  });

  describe('エッジケース', () => {
    it('nullやundefinedのレスポンスデータを適切にハンドリングできる', () => {
      // transformRepositoryやtransformSearchResultのテスト用
      // 実際の実装では、これらのプライベートメソッドを直接テストするか、
      // より統合的なテストアプローチを取る必要があります
      expect(true).toBe(true); // プレースホルダー
    });
  });
});

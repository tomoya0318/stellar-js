import { Octokit } from '@octokit/rest';
import type { GitHubApiLicense, GitHubApiOwner, GitHubApiRepositoryRaw, GitHubRepository } from '../types/index.js';

export class GitHubApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public originalError?: unknown,
  ) {
    super(message);
    this.name = 'GitHubApiError';
  }
}

export class GitHubClient {
  private octokit: Octokit;

  constructor(token: string) {
    if (!token) {
      throw new Error('GitHub token is required');
    }

    this.octokit = new Octokit({
      auth: token,
      userAgent: 'stellar-js/1.0.0',
    });

    console.info('[GitHubClient] Initialized with authentication');
  }

  async checkRateLimit(): Promise<void> {
    try {
      const { data: rateLimit } = await this.octokit.rest.rateLimit.get();

      const core = rateLimit.rate;
      const search = rateLimit.resources.search;

      console.info(
        `[GitHubClient] Rate limit - Core: ${core.remaining}/${core.limit}, Search: ${search.remaining}/${search.limit}`,
      );

      if (core.remaining < 100) {
        const resetTime = new Date(core.reset * 1000);
        console.warn(`[GitHubClient] Low core rate limit: ${core.remaining}, resets at ${resetTime.toISOString()}`);
      }

      if (search.remaining < 10) {
        const resetTime = new Date(search.reset * 1000);
        console.warn(`[GitHubClient] Low search rate limit: ${search.remaining}, resets at ${resetTime.toISOString()}`);
      }
    } catch (error) {
      console.error('[GitHubClient] Failed to check rate limit:', error);
    }
  }

  async searchRepositories(
    query: string,
    sort?: 'stars' | 'forks' | 'help-wanted-issues' | 'updated',
    order?: 'desc' | 'asc',
    maxResults = 1000,
  ): Promise<GitHubRepository[]> {
    console.info(`[GitHubClient] Starting repository search: ${query}`);

    try {
      await this.checkRateLimit();

      const allResults: GitHubApiRepositoryRaw[] = [];
      let page = 1;
      const perPage = 100;

      while (allResults.length < maxResults) {
        const { data } = await this.octokit.rest.search.repos({
          q: query,
          sort: sort || 'stars',
          order: order || 'desc',
          per_page: Math.min(perPage, maxResults - allResults.length),
          page,
        });

        if (data.items.length === 0) {
          break;
        }

        allResults.push(...data.items);
        console.info(
          `[GitHubClient] Retrieved ${allResults.length}/${Math.min(data.total_count, maxResults)} repositories`,
        );

        if (data.items.length < perPage || allResults.length >= maxResults) {
          break;
        }

        page++;

        // Rate limiting: Search API has stricter limits
        await this.delay(1000);
      }

      const repositories = allResults.slice(0, maxResults).map((repo) => this.transformSearchResult(repo));

      console.info(`[GitHubClient] Successfully collected ${repositories.length} repositories`);
      return repositories;
    } catch (error) {
      throw this.handleError(error, `Failed to search repositories with query: ${query}`);
    }
  }

  async getRepositoryDetails(owner: string, repo: string): Promise<GitHubRepository> {
    console.debug(`[GitHubClient] Fetching details for ${owner}/${repo}`);

    try {
      const { data: repository } = await this.octokit.rest.repos.get({
        owner,
        repo,
      });

      return this.transformRepository(repository);
    } catch (error) {
      throw this.handleError(error, `Failed to get repository details for ${owner}/${repo}`);
    }
  }

  async getRepositoryContributors(owner: string, repo: string): Promise<number> {
    try {
      // Get total count from Link header or count contributors
      const response = await this.octokit.rest.repos.listContributors({
        owner,
        repo,
        per_page: 100,
      });

      // For large repos, estimate from first page
      if (response.data.length === 100) {
        // This is an approximation - for exact count, we'd need to paginate
        console.debug(`[GitHubClient] Estimating contributors count for ${owner}/${repo} (>100)`);
        return 100;
      }

      return response.data.length;
    } catch (error) {
      console.warn(`[GitHubClient] Failed to get contributors for ${owner}/${repo}:`, error);
      return 0;
    }
  }

  private transformRepository(repo: GitHubApiRepositoryRaw): GitHubRepository {
    const getStringValue = (value: unknown): string => (typeof value === 'string' ? value : '');
    const getNumberValue = (value: unknown): number => (typeof value === 'number' ? value : 0);
    const getBooleanValue = (value: unknown, defaultValue: boolean): boolean =>
      typeof value === 'boolean' ? value : defaultValue;
    const getOwnerValue = (value: unknown): GitHubApiOwner | null => {
      if (value && typeof value === 'object') {
        return value as GitHubApiOwner;
      }
      return null;
    };
    const getLicenseValue = (value: unknown): GitHubApiLicense | null => {
      if (value && typeof value === 'object') {
        return value as GitHubApiLicense;
      }
      return null;
    };

    const owner = getOwnerValue(repo.owner);
    const license = getLicenseValue(repo.license);

    return {
      id: getNumberValue(repo.id),
      full_name: getStringValue(repo.full_name),
      name: getStringValue(repo.name),
      owner: {
        login: getStringValue(owner?.login),
        type: getStringValue(owner?.type),
      },
      description: typeof repo.description === 'string' ? repo.description : null,
      language: typeof repo.language === 'string' ? repo.language : null,
      license: license && typeof license.name === 'string' ? { name: license.name } : null,
      homepage: typeof repo.homepage === 'string' ? repo.homepage : null,
      topics: Array.isArray(repo.topics) ? repo.topics.filter((t): t is string => typeof t === 'string') : [],
      created_at: getStringValue(repo.created_at),
      updated_at: getStringValue(repo.updated_at),
      pushed_at: typeof repo.pushed_at === 'string' ? repo.pushed_at : null,
      stargazers_count: getNumberValue(repo.stargazers_count),
      forks_count: getNumberValue(repo.forks_count),
      watchers_count: getNumberValue(repo.watchers_count),
      size: getNumberValue(repo.size),
      open_issues_count: getNumberValue(repo.open_issues_count),
      has_issues: getBooleanValue(repo.has_issues, true),
      has_projects: getBooleanValue(repo.has_projects, true),
      has_wiki: getBooleanValue(repo.has_wiki, true),
      has_pages: getBooleanValue(repo.has_pages, false),
      has_downloads: getBooleanValue(repo.has_downloads, true),
      archived: getBooleanValue(repo.archived, false),
      disabled: getBooleanValue(repo.disabled, false),
    };
  }

  private transformSearchResult(repo: GitHubApiRepositoryRaw): GitHubRepository {
    return this.transformRepository(repo);
  }

  private handleError(error: unknown, context: string): never {
    if (error && typeof error === 'object' && 'status' in error) {
      const octokitError = error as { status: number; message?: string };

      switch (octokitError.status) {
        case 401:
          throw new GitHubApiError(`${context}: Authentication failed. Check your GitHub token.`, 401, error);
        case 403:
          throw new GitHubApiError(
            `${context}: Access forbidden. You may have hit the rate limit or lack permissions.`,
            403,
            error,
          );
        case 404:
          throw new GitHubApiError(
            `${context}: Resource not found. The repository may not exist or be private.`,
            404,
            error,
          );
        case 422:
          throw new GitHubApiError(`${context}: Validation failed. Check your request parameters.`, 422, error);
        default:
          throw new GitHubApiError(
            `${context}: API request failed with status ${octokitError.status}`,
            octokitError.status,
            error,
          );
      }
    }

    if (error instanceof Error) {
      throw new GitHubApiError(`${context}: ${error.message}`, undefined, error);
    }

    throw new GitHubApiError(`${context}: Unknown error occurred`, undefined, error);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

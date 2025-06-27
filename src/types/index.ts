import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type {
  batch_repositories,
  collection_batches,
  filtering_stages,
  quality_assessments,
  repositories,
  repository_filter_status,
  repository_metrics,
} from '../../drizzle/schema';

// Database model types
export type Repository = InferSelectModel<typeof repositories>;
export type InsertRepository = InferInsertModel<typeof repositories>;

export type FilteringStage = InferSelectModel<typeof filtering_stages>;
export type InsertFilteringStage = InferInsertModel<typeof filtering_stages>;

export type RepositoryFilterStatus = InferSelectModel<typeof repository_filter_status>;
export type InsertRepositoryFilterStatus = InferInsertModel<typeof repository_filter_status>;

export type RepositoryMetrics = InferSelectModel<typeof repository_metrics>;
export type InsertRepositoryMetrics = InferInsertModel<typeof repository_metrics>;

export type QualityAssessment = InferSelectModel<typeof quality_assessments>;
export type InsertQualityAssessment = InferInsertModel<typeof quality_assessments>;

export type CollectionBatch = InferSelectModel<typeof collection_batches>;
export type InsertCollectionBatch = InferInsertModel<typeof collection_batches>;

export type BatchRepository = InferSelectModel<typeof batch_repositories>;
export type InsertBatchRepository = InferInsertModel<typeof batch_repositories>;

// Filter result types
export interface PopularityFilterDetails {
  checks: {
    stars: boolean;
    forks: boolean;
    not_archived: boolean;
    not_disabled: boolean;
  };
  stars_count: number | null;
  forks_count: number | null;
  archived: boolean | null;
  disabled: boolean | null;
  [key: string]: unknown;
}

export interface ActivityFilterDetails {
  checks: {
    contributors: boolean;
    recent_activity: boolean;
    push_activity: boolean;
  };
  contributors_count: number;
  last_push_days: number | null;
  last_update_days: number;
  [key: string]: unknown;
}

export interface QualityFilterDetails {
  checks: {
    has_readme: boolean;
    has_license: boolean;
    documentation_quality: boolean;
  };
  readme_score: number;
  license_name: string | null;
  has_description: boolean;
  [key: string]: unknown;
}

export interface FilterErrorDetails {
  error: string;
  skipped?: boolean;
  reason?: string;
  [key: string]: unknown;
}

export interface FinalSelectionFilterDetails {
  overall_score: number;
  popularity_score: number;
  activity_score: number;
  quality_score: number;
  community_score: number;
  overall_rank: number | null;
  popularity_rank: number | null;
  percentile_rank: number;
  checks: {
    meets_minimum_score: boolean;
    in_top_percentile: boolean;
  };
  [key: string]: unknown;
}

export type FilterDetails =
  | PopularityFilterDetails
  | ActivityFilterDetails
  | QualityFilterDetails
  | FinalSelectionFilterDetails
  | FilterErrorDetails;

export interface FilterResult {
  passed: boolean;
  score: number;
  details: FilterDetails;
}

export interface FilterStageResult {
  stage: string;
  passed: boolean;
  score: number;
  details: FilterDetails;
}

export interface FilteringSummary {
  repository: number;
  stages: FilterStageResult[];
}

// GitHub API raw response types (from GitHub API)
export interface GitHubApiOwner {
  login?: unknown;
  type?: unknown;
  [key: string]: unknown;
}

export interface GitHubApiLicense {
  name?: unknown;
  [key: string]: unknown;
}

export interface GitHubApiRepositoryRaw {
  id?: unknown;
  full_name?: unknown;
  name?: unknown;
  owner?: GitHubApiOwner | null;
  description?: unknown;
  language?: unknown;
  license?: GitHubApiLicense | null;
  homepage?: unknown;
  topics?: unknown[];
  created_at?: unknown;
  updated_at?: unknown;
  pushed_at?: unknown;
  stargazers_count?: unknown;
  forks_count?: unknown;
  watchers_count?: unknown;
  size?: unknown;
  open_issues_count?: unknown;
  has_issues?: unknown;
  has_projects?: unknown;
  has_wiki?: unknown;
  has_pages?: unknown;
  has_downloads?: unknown;
  archived?: unknown;
  disabled?: unknown;
  [key: string]: unknown;
}

// GitHub API response types (transformed)
export interface GitHubRepository {
  id: number;
  full_name: string;
  name: string;
  owner: {
    login: string;
    type: string;
  };
  description: string | null;
  language: string | null;
  license:
    | {
        name: string;
      }
    | null
    | string;
  homepage: string | null;
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  size: number;
  open_issues_count: number;
  has_issues: boolean;
  has_projects: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  has_downloads: boolean;
  archived: boolean;
  disabled: boolean;
}

// Filtering criteria types
export interface PopularityCriteria {
  min_stars: number;
  min_forks: number;
  not_archived: boolean;
  not_disabled: boolean;
}

export interface ActivityCriteria {
  min_contributors: number;
  min_commits: number;
  recent_activity_days: number;
  min_push_activity_days: number;
}

export interface QualityCriteria {
  has_readme: boolean;
  min_readme_quality: number;
  has_license: boolean;
  max_issue_close_time: number;
}

export interface FinalSelectionCriteria {
  min_overall_score: number;
  top_percentile: number;
}

export type FilterCriteria = PopularityCriteria | ActivityCriteria | QualityCriteria | FinalSelectionCriteria;

// Collection status types
export type CollectionStatus = 'running' | 'completed' | 'failed' | 'paused';
export type FilterStatus = 'pending' | 'passed' | 'failed' | 'skipped';

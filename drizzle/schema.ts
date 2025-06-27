import { sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// 1. リポジトリ基本情報
export const repositories = sqliteTable('repositories', {
  id: integer('id').primaryKey(),
  full_name: text('full_name').notNull().unique(),
  name: text('name').notNull(),
  owner: text('owner').notNull(),
  description: text('description'),
  language: text('language'),
  license: text('license'),
  homepage: text('homepage'),
  topics: text('topics', { mode: 'json' }),
  created_at: text('created_at').notNull(),
  updated_at: text('updated_at').notNull(),
  pushed_at: text('pushed_at'),

  // GitHub基本メトリクス
  stars_count: integer('stars_count').default(0),
  forks_count: integer('forks_count').default(0),
  watchers_count: integer('watchers_count').default(0),
  size: integer('size').default(0),
  open_issues_count: integer('open_issues_count').default(0),

  // フラグ
  has_issues: integer('has_issues', { mode: 'boolean' }).default(true),
  has_projects: integer('has_projects', { mode: 'boolean' }).default(true),
  has_wiki: integer('has_wiki', { mode: 'boolean' }).default(true),
  has_pages: integer('has_pages', { mode: 'boolean' }).default(false),
  has_downloads: integer('has_downloads', { mode: 'boolean' }).default(true),
  archived: integer('archived', { mode: 'boolean' }).default(false),
  disabled: integer('disabled', { mode: 'boolean' }).default(false),

  // 収集メタデータ
  first_collected_at: text('first_collected_at').default(sql`(datetime('now'))`),
  last_updated_at: text('last_updated_at').default(sql`(datetime('now'))`),
});

// 2. フィルタリング段階定義
export const filtering_stages = sqliteTable('filtering_stages', {
  id: integer('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  order_index: integer('order_index').notNull(),
  criteria: text('criteria', { mode: 'json' }).notNull(),
  created_at: text('created_at').default(sql`(datetime('now'))`),
});

// 3. リポジトリフィルタリング状況
export const repository_filter_status = sqliteTable('repository_filter_status', {
  id: integer('id').primaryKey(),
  repository_id: integer('repository_id')
    .notNull()
    .references(() => repositories.id),
  stage_id: integer('stage_id')
    .notNull()
    .references(() => filtering_stages.id),
  status: text('status', { enum: ['pending', 'passed', 'failed', 'skipped'] }).notNull(),
  score: real('score'),
  details: text('details', { mode: 'json' }),
  evaluated_at: text('evaluated_at').default(sql`(datetime('now'))`),
});

// 4. 詳細メトリクス（時系列対応）
export const repository_metrics = sqliteTable('repository_metrics', {
  id: integer('id').primaryKey(),
  repository_id: integer('repository_id')
    .notNull()
    .references(() => repositories.id),

  // 活動指標
  contributors_count: integer('contributors_count'),
  commits_count: integer('commits_count'),
  branches_count: integer('branches_count'),
  tags_count: integer('tags_count'),

  // コミュニティ健全性
  avg_issue_close_time_days: real('avg_issue_close_time_days'),
  avg_pr_merge_time_days: real('avg_pr_merge_time_days'),
  issue_response_rate: real('issue_response_rate'),
  pr_acceptance_rate: real('pr_acceptance_rate'),

  // コード品質指標
  readme_quality_score: real('readme_quality_score'),
  has_tests: integer('has_tests', { mode: 'boolean' }),
  has_ci: integer('has_ci', { mode: 'boolean' }),
  has_contributing_guide: integer('has_contributing_guide', { mode: 'boolean' }),
  has_code_of_conduct: integer('has_code_of_conduct', { mode: 'boolean' }),

  // 外部指標
  npm_weekly_downloads: integer('npm_weekly_downloads'),
  dependent_repos_count: integer('dependent_repos_count'),

  // 収集メタデータ
  collected_at: text('collected_at').default(sql`(datetime('now'))`),
});

// 5. 品質評価結果
export const quality_assessments = sqliteTable('quality_assessments', {
  id: integer('id').primaryKey(),
  repository_id: integer('repository_id')
    .notNull()
    .references(() => repositories.id),

  // 複合スコア
  popularity_score: real('popularity_score').notNull(),
  activity_score: real('activity_score').notNull(),
  quality_score: real('quality_score').notNull(),
  community_score: real('community_score').notNull(),
  overall_score: real('overall_score').notNull(),

  // ランキング情報
  popularity_rank: integer('popularity_rank'),
  overall_rank: integer('overall_rank'),

  // 評価メタデータ
  assessment_version: text('assessment_version').notNull(),
  assessed_at: text('assessed_at').default(sql`(datetime('now'))`),
});

// 6. 収集バッチ管理
export const collection_batches = sqliteTable('collection_batches', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  query_params: text('query_params', { mode: 'json' }),
  total_found: integer('total_found'),
  total_collected: integer('total_collected'),
  status: text('status', { enum: ['running', 'completed', 'failed', 'paused'] }).notNull(),
  started_at: text('started_at').default(sql`(datetime('now'))`),
  completed_at: text('completed_at'),
  error_message: text('error_message'),
});

// 7. バッチ-リポジトリ関連
export const batch_repositories = sqliteTable('batch_repositories', {
  id: integer('id').primaryKey(),
  batch_id: integer('batch_id')
    .notNull()
    .references(() => collection_batches.id),
  repository_id: integer('repository_id')
    .notNull()
    .references(() => repositories.id),
  added_at: text('added_at').default(sql`(datetime('now'))`),
});

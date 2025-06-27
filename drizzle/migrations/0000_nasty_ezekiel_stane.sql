CREATE TABLE `batch_repositories` (
	`id` integer PRIMARY KEY NOT NULL,
	`batch_id` integer NOT NULL,
	`repository_id` integer NOT NULL,
	`added_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`batch_id`) REFERENCES `collection_batches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `collection_batches` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`query_params` text,
	`total_found` integer,
	`total_collected` integer,
	`status` text NOT NULL,
	`started_at` text DEFAULT (datetime('now')),
	`completed_at` text,
	`error_message` text
);
--> statement-breakpoint
CREATE TABLE `filtering_stages` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`order_index` integer NOT NULL,
	`criteria` text NOT NULL,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `filtering_stages_name_unique` ON `filtering_stages` (`name`);--> statement-breakpoint
CREATE TABLE `quality_assessments` (
	`id` integer PRIMARY KEY NOT NULL,
	`repository_id` integer NOT NULL,
	`popularity_score` real NOT NULL,
	`activity_score` real NOT NULL,
	`quality_score` real NOT NULL,
	`community_score` real NOT NULL,
	`overall_score` real NOT NULL,
	`popularity_rank` integer,
	`overall_rank` integer,
	`assessment_version` text NOT NULL,
	`assessed_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `repositories` (
	`id` integer PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`name` text NOT NULL,
	`owner` text NOT NULL,
	`description` text,
	`language` text,
	`license` text,
	`homepage` text,
	`topics` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`pushed_at` text,
	`stars_count` integer DEFAULT 0,
	`forks_count` integer DEFAULT 0,
	`watchers_count` integer DEFAULT 0,
	`size` integer DEFAULT 0,
	`open_issues_count` integer DEFAULT 0,
	`has_issues` integer DEFAULT true,
	`has_projects` integer DEFAULT true,
	`has_wiki` integer DEFAULT true,
	`has_pages` integer DEFAULT false,
	`has_downloads` integer DEFAULT true,
	`archived` integer DEFAULT false,
	`disabled` integer DEFAULT false,
	`first_collected_at` text DEFAULT (datetime('now')),
	`last_updated_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `repositories_full_name_unique` ON `repositories` (`full_name`);--> statement-breakpoint
CREATE TABLE `repository_filter_status` (
	`id` integer PRIMARY KEY NOT NULL,
	`repository_id` integer NOT NULL,
	`stage_id` integer NOT NULL,
	`status` text NOT NULL,
	`score` real,
	`details` text,
	`evaluated_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`stage_id`) REFERENCES `filtering_stages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `repository_metrics` (
	`id` integer PRIMARY KEY NOT NULL,
	`repository_id` integer NOT NULL,
	`contributors_count` integer,
	`commits_count` integer,
	`branches_count` integer,
	`tags_count` integer,
	`avg_issue_close_time_days` real,
	`avg_pr_merge_time_days` real,
	`issue_response_rate` real,
	`pr_acceptance_rate` real,
	`readme_quality_score` real,
	`has_tests` integer,
	`has_ci` integer,
	`has_contributing_guide` integer,
	`has_code_of_conduct` integer,
	`npm_weekly_downloads` integer,
	`dependent_repos_count` integer,
	`collected_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`repository_id`) REFERENCES `repositories`(`id`) ON UPDATE no action ON DELETE no action
);

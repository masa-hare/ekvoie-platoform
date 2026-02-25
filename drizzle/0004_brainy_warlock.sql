CREATE TABLE `anonymous_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`expiresAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `anonymous_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `anonymous_users_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `deletion_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postType` enum('opinion','solution') NOT NULL,
	`postId` int NOT NULL,
	`content` text NOT NULL,
	`reason` text,
	`deletedBy` int,
	`deletedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deletion_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `solution_votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`solutionId` int NOT NULL,
	`anonymousUserId` int NOT NULL,
	`voteType` enum('support','oppose','pass') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `solution_votes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `solutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`opinionId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text NOT NULL,
	`createdBy` int,
	`anonymousUserId` int,
	`approvalStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`isVisible` boolean NOT NULL DEFAULT true,
	`supportCount` int NOT NULL DEFAULT 0,
	`opposeCount` int NOT NULL DEFAULT 0,
	`passCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `solutions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `opinion_groups` ADD `themeJa` varchar(200) NOT NULL;--> statement-breakpoint
ALTER TABLE `opinion_groups` ADD `themeEn` varchar(200) NOT NULL;--> statement-breakpoint
ALTER TABLE `opinion_groups` ADD `summaryJa` text NOT NULL;--> statement-breakpoint
ALTER TABLE `opinion_groups` ADD `summaryEn` text NOT NULL;--> statement-breakpoint
ALTER TABLE `opinion_groups` ADD `sentiment` enum('positive','negative','neutral','mixed') DEFAULT 'neutral' NOT NULL;--> statement-breakpoint
ALTER TABLE `opinion_groups` ADD `opinionCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `opinions` ADD `anonymousUserId` int;--> statement-breakpoint
ALTER TABLE `opinions` ADD `problemStatement` text;--> statement-breakpoint
ALTER TABLE `opinions` ADD `approvalStatus` enum('pending','approved','rejected') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `votes` ADD `anonymousUserId` int;--> statement-breakpoint
ALTER TABLE `opinion_groups` DROP COLUMN `title`;--> statement-breakpoint
ALTER TABLE `opinion_groups` DROP COLUMN `summary`;--> statement-breakpoint
ALTER TABLE `opinion_groups` DROP COLUMN `theme`;
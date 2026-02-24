CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `opinion_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`summary` text NOT NULL,
	`theme` text,
	`opinionIds` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `opinion_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `opinions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`categoryId` int,
	`audioUrl` text NOT NULL,
	`audioFileKey` varchar(500) NOT NULL,
	`transcription` text NOT NULL,
	`language` varchar(10),
	`isModerated` boolean NOT NULL DEFAULT false,
	`isVisible` boolean NOT NULL DEFAULT true,
	`agreeCount` int NOT NULL DEFAULT 0,
	`disagreeCount` int NOT NULL DEFAULT 0,
	`passCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `opinions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`opinionId` int NOT NULL,
	`voteType` enum('agree','disagree','pass') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `votes_id` PRIMARY KEY(`id`)
);

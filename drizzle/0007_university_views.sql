-- Redesign: drop solutions/solution_votes (no more solution proposals or ranking),
-- add university_views (institutional response, matched to a category, not an individual opinion).

DROP TABLE IF EXISTS `solution_votes`;
--> statement-breakpoint
DROP TABLE IF EXISTS `solutions`;
--> statement-breakpoint
CREATE TABLE `university_views` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`body` text NOT NULL,
	`responseStatus` enum('answered','checking','cannot_answer') NOT NULL DEFAULT 'checking',
	`reason` text,
	`approvalStatus` enum('draft','published') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `university_views_id` PRIMARY KEY(`id`)
);

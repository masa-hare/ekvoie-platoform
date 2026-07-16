-- V2 redesign: human-managed themes, theme-level university views, and two-choice votes.
CREATE TABLE `themes` (
  `id` int AUTO_INCREMENT NOT NULL,
  `categoryId` int NOT NULL,
  `title` varchar(200) NOT NULL,
  `createdBy` int,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `themes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `opinions` ADD COLUMN `themeId` int;
--> statement-breakpoint
ALTER TABLE `university_views` ADD COLUMN `themeId` int;
--> statement-breakpoint
-- Preserve existing university view text by creating one explicitly named
-- administrator-reviewable theme for each old category linkage. It remains a
-- draft until a human reviews and publishes it.
INSERT INTO `themes` (`categoryId`, `title`, `createdBy`)
SELECT c.`id`, CONCAT(c.`name`, '（既存見解の確認用テーマ）'), NULL
FROM `university_views` uv
INNER JOIN `categories` c ON c.`id` = uv.`categoryId`;
--> statement-breakpoint
UPDATE `university_views` uv
INNER JOIN `themes` t ON t.`categoryId` = uv.`categoryId`
SET uv.`themeId` = t.`id`, uv.`approvalStatus` = 'draft';
--> statement-breakpoint
DELETE FROM `votes` WHERE `voteType` = 'pass';
--> statement-breakpoint
ALTER TABLE `opinions` DROP COLUMN `passCount`;
--> statement-breakpoint
ALTER TABLE `votes` MODIFY COLUMN `voteType` enum('agree','disagree') NOT NULL;
--> statement-breakpoint
ALTER TABLE `university_views` DROP COLUMN `categoryId`;
--> statement-breakpoint
ALTER TABLE `university_views` MODIFY COLUMN `themeId` int NOT NULL;
--> statement-breakpoint
DROP TABLE IF EXISTS `opinion_groups`;

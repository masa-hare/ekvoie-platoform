CREATE TABLE `opinion_reports` (
  `id` int AUTO_INCREMENT NOT NULL,
  `opinionId` int NOT NULL,
  `reason` enum('personal_information','harassment_or_hate','threat_or_illegal_content','other_policy_violation') NOT NULL,
  `status` enum('open','reviewed','dismissed') NOT NULL DEFAULT 'open',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `opinion_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `university_views` ADD COLUMN `nextReviewAt` timestamp;

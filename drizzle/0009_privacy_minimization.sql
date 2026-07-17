-- Privacy minimization: retain only the text required to publish an opinion,
-- and remove historical copies or identifiers that the current product no
-- longer needs.
ALTER TABLE `deletion_logs` DROP COLUMN `content`;
--> statement-breakpoint
ALTER TABLE `deletion_logs` DROP COLUMN `deletedBy`;
--> statement-breakpoint
UPDATE `deletion_logs`
SET `reason` = 'other_policy_violation'
WHERE `reason` IS NULL
   OR `reason` NOT IN ('personal_information', 'harassment_or_hate', 'threat_or_illegal_content', 'off_topic_or_spam', 'other_policy_violation');
--> statement-breakpoint
ALTER TABLE `deletion_logs`
  MODIFY COLUMN `reason` enum('personal_information','harassment_or_hate','threat_or_illegal_content','off_topic_or_spam','other_policy_violation') NOT NULL;
--> statement-breakpoint
ALTER TABLE `opinions` DROP COLUMN `userId`;
--> statement-breakpoint
ALTER TABLE `opinions` DROP COLUMN `problemStatement`;
--> statement-breakpoint
ALTER TABLE `opinions` DROP COLUMN `audioUrl`;
--> statement-breakpoint
ALTER TABLE `opinions` DROP COLUMN `audioFileKey`;
--> statement-breakpoint
ALTER TABLE `opinions` DROP COLUMN `language`;
--> statement-breakpoint
ALTER TABLE `opinions` CHANGE COLUMN `transcription` `body` text NOT NULL;
--> statement-breakpoint
ALTER TABLE `votes` DROP COLUMN `userId`;
--> statement-breakpoint
ALTER TABLE `themes` DROP COLUMN `createdBy`;
--> statement-breakpoint
DROP TABLE IF EXISTS `users`;

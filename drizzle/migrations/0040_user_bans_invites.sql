-- CIM-AUDIT-043: reversible user bans and first-login role invites
ALTER TABLE `users`
  ADD COLUMN `bannedAt` timestamp NULL,
  ADD COLUMN `banReason` varchar(500) NULL,
  ADD COLUMN `bannedBy` int NULL;

CREATE TABLE `userInvites` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(320) NOT NULL,
  `role` enum('free','home_user','basic','professional','rule_editor','admin','org_admin') NOT NULL DEFAULT 'free',
  `invitedBy` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `consumedAt` timestamp NULL,
  `consumedByUserId` int NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `userInvites_email_unique` (`email`)
);

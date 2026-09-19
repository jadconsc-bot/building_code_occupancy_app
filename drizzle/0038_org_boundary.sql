-- Organization boundary and invitation workflow.
-- Existing users/projects remain solo (NULL orgId); no backfill.

ALTER TABLE `users`
  ADD COLUMN `orgRole` enum('org_admin','member') DEFAULT NULL,
  ADD CONSTRAINT `users_orgId_fk`
    FOREIGN KEY (`orgId`) REFERENCES `organizations` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `projects`
  ADD COLUMN `orgId` int DEFAULT NULL,
  ADD KEY `idx_projects_orgId` (`orgId`),
  ADD CONSTRAINT `projects_orgId_fk`
    FOREIGN KEY (`orgId`) REFERENCES `organizations` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `organizationInvitations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `organizationId` int NOT NULL,
  `invitedEmail` varchar(320) NOT NULL,
  `invitedUserId` int DEFAULT NULL,
  `tokenHash` varchar(128) NOT NULL,
  `invitedBy` int NOT NULL,
  `status` enum('pending','accepted','declined','expired') NOT NULL DEFAULT 'pending',
  `expiresAt` timestamp NOT NULL,
  `acceptedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `organizationInvitations_tokenHash_unique` (`tokenHash`),
  KEY `organizationInvitations_org_idx` (`organizationId`),
  KEY `organizationInvitations_email_idx` (`invitedEmail`),
  CONSTRAINT `organizationInvitations_org_fk`
    FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `organizationInvitations_invitedBy_fk`
    FOREIGN KEY (`invitedBy`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `organizationInvitations_invitedUser_fk`
    FOREIGN KEY (`invitedUserId`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

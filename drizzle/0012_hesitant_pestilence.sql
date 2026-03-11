CREATE TABLE `collaborationAuditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`action` enum('SHARED','UNSHARED','VIEWED','MODIFIED') NOT NULL,
	`sharedByUserId` int,
	`sharedWithUserId` int,
	`details` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`ipAddress` varchar(45),
	`userAgent` text,
	CONSTRAINT `collaborationAuditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectShares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`sharedByUserId` int NOT NULL,
	`sharedWithUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	CONSTRAINT `projectShares_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_active_share` UNIQUE(`projectId`,`sharedWithUserId`)
);

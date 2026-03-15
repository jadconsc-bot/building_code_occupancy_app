CREATE TABLE `customRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleCode` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` varchar(100) NOT NULL,
	`jurisdiction` varchar(100),
	`keywords` text,
	`creatorId` int NOT NULL,
	`creatorName` varchar(255) NOT NULL,
	`creatorCredentials` text,
	`authorizedBy` int,
	`authorizedAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customRules_id` PRIMARY KEY(`id`),
	CONSTRAINT `customRules_ruleCode_unique` UNIQUE(`ruleCode`)
);
--> statement-breakpoint
CREATE TABLE `ruleApplications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleId` int NOT NULL,
	`projectId` int,
	`userId` int NOT NULL,
	`appliedAt` timestamp NOT NULL DEFAULT (now()),
	`status` enum('active','inactive','archived') NOT NULL DEFAULT 'active',
	`isCompliant` int,
	`complianceNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ruleApplications_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_project_rule` UNIQUE(`ruleId`,`projectId`)
);
--> statement-breakpoint
CREATE TABLE `ruleAuditTrail` (
	`id` int AUTO_INCREMENT NOT NULL,
	`action` enum('CREATED','APPLIED','MODIFIED','DEACTIVATED','DELETED') NOT NULL,
	`ruleId` int,
	`ruleCode` varchar(100) NOT NULL,
	`ruleType` enum('library','custom') NOT NULL,
	`projectId` int,
	`userId` int NOT NULL,
	`userName` varchar(255) NOT NULL,
	`userCredentials` text,
	`details` json,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ruleAuditTrail_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rulesLibrary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleCode` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` varchar(100) NOT NULL,
	`jurisdiction` varchar(100) NOT NULL,
	`municipality` varchar(100),
	`codeEdition` varchar(50) NOT NULL,
	`nbcReference` varchar(255),
	`keywords` text,
	`applicableOccupancies` text,
	`applicableConstructionTypes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`isCustom` boolean NOT NULL DEFAULT false,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rulesLibrary_id` PRIMARY KEY(`id`),
	CONSTRAINT `rulesLibrary_ruleCode_unique` UNIQUE(`ruleCode`)
);

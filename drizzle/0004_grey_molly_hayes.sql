CREATE TABLE `auditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`snapshotId` varchar(100),
	`action` varchar(100) NOT NULL,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complianceSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`snapshotId` varchar(100) NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`rulesetId` varchar(100) NOT NULL,
	`mode` enum('strict','soft') NOT NULL DEFAULT 'soft',
	`inputs` text NOT NULL,
	`outputs` text NOT NULL,
	`ruleTrace` text NOT NULL,
	`complianceStatus` enum('compliant','non_compliant','conditional') NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `complianceSnapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `complianceSnapshots_snapshotId_unique` UNIQUE(`snapshotId`)
);
--> statement-breakpoint
CREATE TABLE `ruleChangelog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rulesetId` varchar(100) NOT NULL,
	`changeType` enum('added','modified','deprecated','removed') NOT NULL,
	`ruleId` varchar(100) NOT NULL,
	`clause` varchar(50) NOT NULL,
	`description` text NOT NULL,
	`reason` text,
	`approvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ruleChangelog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ruleTests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rulesetId` varchar(100) NOT NULL,
	`ruleId` varchar(100) NOT NULL,
	`testName` varchar(255) NOT NULL,
	`inputs` text NOT NULL,
	`expectedOutputs` text NOT NULL,
	`passed` int NOT NULL DEFAULT 0,
	`lastRunAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ruleTests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rulesets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rulesetId` varchar(100) NOT NULL,
	`code` varchar(50) NOT NULL,
	`edition` varchar(20) NOT NULL,
	`amendment` varchar(50),
	`version` varchar(20) NOT NULL,
	`effectiveDate` timestamp NOT NULL,
	`retiredDate` timestamp,
	`description` text,
	`rulesData` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rulesets_id` PRIMARY KEY(`id`),
	CONSTRAINT `rulesets_rulesetId_unique` UNIQUE(`rulesetId`)
);

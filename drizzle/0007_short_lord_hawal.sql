CREATE TABLE `calculationLogs` (
	`id` varchar(36) NOT NULL,
	`calculationResultId` varchar(36) NOT NULL,
	`calculatorType` varchar(50) NOT NULL,
	`stage` varchar(50) NOT NULL,
	`message` text NOT NULL,
	`level` enum('debug','info','warn','error') NOT NULL,
	`details` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calculationLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calculationVersions` (
	`id` varchar(36) NOT NULL,
	`calculationResultId` varchar(36) NOT NULL,
	`versionNumber` int NOT NULL,
	`parentVersionId` varchar(36),
	`inputData` text NOT NULL,
	`resultData` text NOT NULL,
	`changeReason` text,
	`changedBy` int NOT NULL,
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calculationVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`firmId` int,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`address` varchar(500),
	`city` varchar(100),
	`province` varchar(50),
	`postalCode` varchar(20),
	`companyName` varchar(255),
	`industry` varchar(100),
	`status` enum('active','inactive','archived') NOT NULL DEFAULT 'active',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','editor','reviewer','viewer') NOT NULL DEFAULT 'viewer',
	`permissions` text,
	`addedBy` int NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	`removedAt` timestamp,
	CONSTRAINT `projectMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requestLogs` (
	`id` varchar(36) NOT NULL,
	`userId` int,
	`method` varchar(10) NOT NULL,
	`path` varchar(500) NOT NULL,
	`statusCode` int NOT NULL,
	`duration` int NOT NULL,
	`ipAddress` varchar(45) NOT NULL,
	`userAgent` text,
	`errorMessage` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `requestLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shareLinkAccessLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shareLinkId` varchar(36) NOT NULL,
	`accessedAt` timestamp NOT NULL DEFAULT (now()),
	`ipAddress` varchar(45),
	`userAgent` text,
	`accessedBy` int,
	CONSTRAINT `shareLinkAccessLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shareLinks` (
	`id` varchar(36) NOT NULL,
	`projectId` int NOT NULL,
	`createdBy` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`accessLevel` enum('view_only','comment','download') NOT NULL DEFAULT 'view_only',
	`expiresAt` timestamp,
	`maxAccessCount` int,
	`accessCount` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shareLinks_id` PRIMARY KEY(`id`),
	CONSTRAINT `shareLinks_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `signatureLogs` (
	`id` varchar(36) NOT NULL,
	`calculationResultId` varchar(36) NOT NULL,
	`operation` varchar(50) NOT NULL,
	`status` enum('success','failure') NOT NULL,
	`keyId` varchar(100),
	`signatureAlgorithm` varchar(50),
	`details` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `signatureLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptionPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`monthlyPrice` decimal(10,2) NOT NULL,
	`yearlyPrice` decimal(10,2),
	`features` text NOT NULL,
	`maxProjects` int,
	`maxUsers` int,
	`maxClients` int,
	`canGenerateReports` boolean NOT NULL DEFAULT false,
	`canShareProjects` boolean NOT NULL DEFAULT false,
	`canCollaborate` boolean NOT NULL DEFAULT false,
	`supportLevel` varchar(50),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptionPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teamRoles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firmId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`permissions` text NOT NULL,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teamRoles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `usageMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`month` varchar(7) NOT NULL,
	`projectsCreated` int NOT NULL DEFAULT 0,
	`calculationsRun` int NOT NULL DEFAULT 0,
	`reportsGenerated` int NOT NULL DEFAULT 0,
	`projectsShared` int NOT NULL DEFAULT 0,
	`hoursEstimatedSaved` decimal(10,2) NOT NULL DEFAULT 0,
	`riskReductionScore` decimal(5,2) NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `usageMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planId` int NOT NULL,
	`status` enum('active','paused','cancelled','expired') NOT NULL DEFAULT 'active',
	`billingCycle` enum('monthly','yearly') NOT NULL DEFAULT 'monthly',
	`currentPeriodStart` timestamp NOT NULL,
	`currentPeriodEnd` timestamp NOT NULL,
	`cancelledAt` timestamp,
	`stripeSubscriptionId` varchar(255),
	`stripeCustomerId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userSubscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `userSubscriptions_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `verificationTokens` (
	`id` varchar(36) NOT NULL,
	`calculationResultId` varchar(36) NOT NULL,
	`token` varchar(64) NOT NULL,
	`isPublic` boolean NOT NULL DEFAULT false,
	`expiresAt` timestamp,
	`viewCount` int NOT NULL DEFAULT 0,
	`lastViewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `verificationTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `verificationTokens_token_unique` UNIQUE(`token`)
);

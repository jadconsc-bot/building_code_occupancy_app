CREATE TABLE `auditModificationHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`auditId` varchar(50) NOT NULL,
	`modifiedAt` timestamp DEFAULT (now()),
	`modifiedBy` int NOT NULL,
	`changeDescription` text,
	CONSTRAINT `auditModificationHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditSignatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`auditId` varchar(50) NOT NULL,
	`signedBy` int NOT NULL,
	`signatureImage` text,
	`signatureDate` timestamp DEFAULT (now()),
	`signatureType` varchar(20),
	`signatureValid` boolean DEFAULT true,
	CONSTRAINT `auditSignatures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complianceAuditLog` (
	`id` varchar(50) NOT NULL,
	`projectId` int NOT NULL,
	`projectName` varchar(255),
	`engineerId` int NOT NULL,
	`engineerName` varchar(100),
	`engineerLicense` varchar(50),
	`engineerEmail` varchar(255),
	`timestamp` timestamp DEFAULT (now()),
	`dateCompleted` timestamp,
	`codeVersion` varchar(20) NOT NULL DEFAULT 'NBC_2025',
	`jurisdiction` varchar(50) DEFAULT 'Canada',
	`rulesEvaluated` text NOT NULL,
	`projectData` text NOT NULL,
	`totalRulesEvaluated` int,
	`totalRulesPassed` int,
	`totalRulesFailed` int,
	`compliancePercentage` decimal(5,2),
	`overallStatus` varchar(20),
	`signatureImage` text,
	`signatureTimestamp` timestamp,
	`signatureHash` varchar(500),
	`isDefendable` boolean DEFAULT true,
	`hasAllRules` boolean DEFAULT true,
	`isComprehensive` boolean DEFAULT true,
	`assumptions` text,
	`limitations` text,
	`notes` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`status` varchar(20) DEFAULT 'COMPLETED',
	`isArchived` boolean DEFAULT false,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `complianceAuditLog_id` PRIMARY KEY(`id`)
);

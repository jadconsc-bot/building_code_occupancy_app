CREATE TABLE `complianceAuditTrail` (
	`id` int AUTO_INCREMENT NOT NULL,
	`analysisId` int NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`details` text NOT NULL,
	`userEmail` varchar(255) NOT NULL,
	`userFullName` varchar(255),
	`professionalLicenseNumber` varchar(100),
	`professionalAssociation` varchar(100),
	`jurisdiction` varchar(100),
	`ipAddress` varchar(45),
	`userAgent` text,
	`sessionId` varchar(255),
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `complianceAuditTrail_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complianceEvaluationResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`analysisId` int NOT NULL,
	`ruleId` int NOT NULL,
	`ruleVersion` int NOT NULL,
	`evaluationResult` enum('PASS','FAIL','CONDITIONAL','UNABLE_TO_EVALUATE') NOT NULL,
	`evaluationDetails` text,
	`evaluatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `complianceEvaluationResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `disclaimerAcknowledgments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`disclaimerVersion` varchar(20) NOT NULL,
	`disclaimerText` text NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`acknowledgedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `disclaimerAcknowledgments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drawingAnalyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`drawingUrl` text NOT NULL,
	`drawingHash` varchar(64) NOT NULL,
	`drawingSnapshotKey` varchar(500),
	`drawingSnapshotMimeType` varchar(50),
	`drawingSnapshotSize` int,
	`analysisType` enum('structural','fire-safety','connections','comprehensive'),
	`analysisStatus` enum('DRAFT','UNDER_REVIEW','VALID','REJECTED') NOT NULL DEFAULT 'DRAFT',
	`complianceScore` int,
	`complianceLevel` enum('approved','conditional','revision','rejected'),
	`structuralStatus` text,
	`fireSafetyStatus` text,
	`connectionStatus` text,
	`issues` text,
	`recommendations` text,
	`disclaimerAcknowledged` boolean NOT NULL DEFAULT false,
	`disclaimerAcknowledgedAt` timestamp,
	`disclaimerVersion` varchar(20) NOT NULL,
	`llmModelVersion` varchar(50),
	`ruleEngineVersion` varchar(20),
	`validatedAt` timestamp,
	`validatedByUserId` int,
	`validatedByLicenseNumber` varchar(100),
	`validatedByAssociation` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drawingAnalyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drawingDataExtractions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`analysisId` int NOT NULL,
	`extractedData` text NOT NULL,
	`extractionModel` varchar(50) NOT NULL,
	`extractionPromptVersion` varchar(20) NOT NULL,
	`extractionConfidence` decimal(3,2),
	`extractedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `drawingDataExtractions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nbcRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleId` varchar(50) NOT NULL,
	`section` varchar(20) NOT NULL,
	`clause` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`category` enum('structural','fire-safety','connections','materials','csa') NOT NULL,
	`jurisdiction` varchar(50),
	`ruleVersion` int NOT NULL DEFAULT 1,
	`isActive` boolean NOT NULL DEFAULT true,
	`requiredFields` text,
	`evaluationLogic` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdByUserId` int,
	CONSTRAINT `nbcRules_id` PRIMARY KEY(`id`),
	CONSTRAINT `nbcRules_ruleId_unique` UNIQUE(`ruleId`)
);

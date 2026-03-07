CREATE TABLE `auditModificationHistory` (
	`id` varchar(36) NOT NULL,
	`auditLogId` varchar(36) NOT NULL,
	`projectId` int NOT NULL,
	`modifiedBy` int NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` varchar(100) NOT NULL,
	`changeType` enum('created','updated','deleted','restored') NOT NULL,
	`fieldName` varchar(100),
	`previousValue` text,
	`newValue` text,
	`reason` text,
	`approvedBy` int,
	`approvalStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`ipAddress` varchar(45),
	`userAgent` text,
	`cryptographicHash` varchar(256),
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditModificationHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditSignatures` (
	`id` varchar(36) NOT NULL,
	`auditLogId` varchar(36) NOT NULL,
	`projectId` int NOT NULL,
	`signedBy` int NOT NULL,
	`signatureType` varchar(50) NOT NULL,
	`publicKey` text,
	`signature` text NOT NULL,
	`certificateChain` text,
	`signatureAlgorithm` varchar(50),
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`verifiedAt` timestamp,
	`verificationStatus` enum('pending','verified','failed') NOT NULL DEFAULT 'pending',
	`verificationDetails` text,
	CONSTRAINT `auditSignatures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complianceAuditLog` (
	`id` varchar(36) NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`snapshotId` varchar(100),
	`action` varchar(100) NOT NULL,
	`actionType` enum('view','create','modify','delete','export','sign','verify') NOT NULL,
	`details` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`cryptographicHash` varchar(256),
	`previousHash` varchar(256),
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `complianceAuditLog_id` PRIMARY KEY(`id`)
);

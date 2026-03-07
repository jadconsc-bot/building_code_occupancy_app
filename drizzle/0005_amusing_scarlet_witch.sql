CREATE TABLE `digitalSignatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`changeRequestId` int NOT NULL,
	`signedBy` int NOT NULL,
	`signatureType` varchar(50) NOT NULL,
	`publicKey` text,
	`signature` text NOT NULL,
	`certificateChain` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`verifiedAt` timestamp,
	`verificationStatus` enum('pending','verified','failed') NOT NULL DEFAULT 'pending',
	CONSTRAINT `digitalSignatures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ruleChangeAudit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`changeRequestId` int NOT NULL,
	`rulesetId` varchar(100) NOT NULL,
	`ruleId` varchar(100) NOT NULL,
	`action` varchar(50) NOT NULL,
	`actor` int NOT NULL,
	`actorRole` varchar(50) NOT NULL,
	`actorCredentials` text,
	`details` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`cryptographicHash` varchar(256),
	`previousHash` varchar(256),
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ruleChangeAudit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ruleChangeNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`changeRequestId` int NOT NULL,
	`recipientId` int NOT NULL,
	`notificationType` enum('change_requested','change_approved','change_rejected','change_implemented') NOT NULL,
	`read` int NOT NULL DEFAULT 0,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ruleChangeNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ruleChangeRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rulesetId` varchar(100) NOT NULL,
	`ruleId` varchar(100) NOT NULL,
	`requestedBy` int NOT NULL,
	`changeType` enum('create','update','delete','deprecate') NOT NULL,
	`currentValue` text,
	`proposedValue` text,
	`justification` text NOT NULL,
	`codeReference` varchar(255),
	`status` enum('pending','approved','rejected','implemented') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`approvalNotes` text,
	`digitalSignature` text,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`approvedAt` timestamp,
	`implementedAt` timestamp,
	CONSTRAINT `ruleChangeRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ruleEditorRoles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` enum('viewer','editor','reviewer','admin') NOT NULL DEFAULT 'viewer',
	`profession` varchar(100),
	`licenseNumber` varchar(100),
	`licenseProvince` varchar(50),
	`licenseExpiry` timestamp,
	`credentials` text,
	`verifiedAt` timestamp,
	`verifiedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ruleEditorRoles_id` PRIMARY KEY(`id`),
	CONSTRAINT `ruleEditorRoles_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `ruleEditorRoles_licenseNumber_unique` UNIQUE(`licenseNumber`)
);

CREATE TABLE `calculationAuditLog` (
	`id` varchar(36) NOT NULL,
	`calculationResultId` varchar(36) NOT NULL,
	`action` varchar(50) NOT NULL,
	`actor` int NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`details` text,
	`ipAddress` varchar(45),
	CONSTRAINT `calculationAuditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calculationCertificates` (
	`id` varchar(36) NOT NULL,
	`certificateName` varchar(255) NOT NULL,
	`publicKey` text NOT NULL,
	`privateKey` text NOT NULL,
	`issuer` varchar(255),
	`subject` varchar(255),
	`validFrom` timestamp,
	`validUntil` timestamp NOT NULL,
	`fingerprint` varchar(64),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calculationCertificates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calculationChallenges` (
	`id` varchar(36) NOT NULL,
	`calculationResultId` varchar(36) NOT NULL,
	`challengedBy` int NOT NULL,
	`reason` text NOT NULL,
	`details` text,
	`status` enum('open','investigating','resolved','dismissed') NOT NULL DEFAULT 'open',
	`resolution` text,
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calculationChallenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calculationResults` (
	`id` varchar(36) NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`calculatorType` varchar(50) NOT NULL,
	`rulesetVersion` varchar(50) NOT NULL,
	`inputData` text NOT NULL,
	`resultData` text NOT NULL,
	`calculationTrace` text,
	`cryptographicSignature` text NOT NULL,
	`certificateChain` text,
	`signatureVerified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`immutable` boolean NOT NULL DEFAULT true,
	CONSTRAINT `calculationResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calculationRulesets` (
	`id` varchar(36) NOT NULL,
	`code` varchar(50) NOT NULL,
	`version` varchar(50) NOT NULL,
	`effectiveDate` date NOT NULL,
	`retiredDate` date,
	`rulesJSON` text NOT NULL,
	`checksum` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`createdBy` int NOT NULL,
	`description` text,
	CONSTRAINT `calculationRulesets_id` PRIMARY KEY(`id`)
);

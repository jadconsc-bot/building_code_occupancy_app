CREATE TABLE `projectCalculatorResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`calculatorType` varchar(50) NOT NULL,
	`inputData` text NOT NULL,
	`resultData` text NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projectCalculatorResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectChecklistItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`phase` varchar(50) NOT NULL,
	`itemId` varchar(100) NOT NULL,
	`itemText` text NOT NULL,
	`isCompleted` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`notes` text,
	`photoUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projectChecklistItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` varchar(500),
	`occupancyCode` varchar(10) NOT NULL,
	`template` varchar(50),
	`notes` text,
	`status` enum('active','completed','archived') NOT NULL DEFAULT 'active',
	`overallProgress` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);

CREATE TABLE `feedbacks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(255),
	`email` varchar(320),
	`rating` int NOT NULL,
	`feedbackType` enum('bug','feature','improvement','other') NOT NULL,
	`category` varchar(50),
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`currentPage` varchar(255),
	`browserInfo` text,
	`resolved` int NOT NULL DEFAULT 0,
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feedbacks_id` PRIMARY KEY(`id`)
);

CREATE TABLE `ballroomReservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reservationDate` datetime NOT NULL,
	`startTime` varchar(10) NOT NULL,
	`endTime` varchar(10) NOT NULL,
	`userId` int NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ballroomReservations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatGroupMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`userId` int NOT NULL,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatGroupMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatGroups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`isPublic` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatGroups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`userId` int NOT NULL,
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `garageDraws` (
	`id` int AUTO_INCREMENT NOT NULL,
	`drawDate` datetime NOT NULL,
	`garageId` int NOT NULL,
	`userId` int NOT NULL,
	`result` enum('won','lost','skipped') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `garageDraws_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `garages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`garageNumber` varchar(50) NOT NULL,
	`type` enum('fixed','predetermined','sortable') NOT NULL,
	`assignedUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `garages_id` PRIMARY KEY(`id`),
	CONSTRAINT `garages_garageNumber_unique` UNIQUE(`garageNumber`)
);
--> statement-breakpoint
CREATE TABLE `kitchenUtensils` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`condition` enum('excellent','good','fair','poor') NOT NULL DEFAULT 'good',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kitchenUtensils_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `units` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitNumber` varchar(50) NOT NULL,
	`block` varchar(50) NOT NULL,
	`floor` int NOT NULL,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `units_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','sindico','subsindico','user') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `ballroomReservations` ADD CONSTRAINT `ballroomReservations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chatGroupMembers` ADD CONSTRAINT `chatGroupMembers_groupId_chatGroups_id_fk` FOREIGN KEY (`groupId`) REFERENCES `chatGroups`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chatGroupMembers` ADD CONSTRAINT `chatGroupMembers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chatMessages` ADD CONSTRAINT `chatMessages_groupId_chatGroups_id_fk` FOREIGN KEY (`groupId`) REFERENCES `chatGroups`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chatMessages` ADD CONSTRAINT `chatMessages_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `garageDraws` ADD CONSTRAINT `garageDraws_garageId_garages_id_fk` FOREIGN KEY (`garageId`) REFERENCES `garages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `garageDraws` ADD CONSTRAINT `garageDraws_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `garages` ADD CONSTRAINT `garages_assignedUserId_users_id_fk` FOREIGN KEY (`assignedUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `units` ADD CONSTRAINT `units_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
CREATE TABLE `aiPoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metaId` int NOT NULL,
	`date` date NOT NULL,
	`score` int NOT NULL,
	`rationale` text,
	`recommendations` text,
	`inputSnapshot` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aiPoints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `metas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`objetivoId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`weightAI` decimal(3,2) NOT NULL DEFAULT '0.40',
	`weightTrackables` decimal(3,2) NOT NULL DEFAULT '0.60',
	`conclusion` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `metas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `misiones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campoId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `misiones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metaId` int NOT NULL,
	`date` date NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `objetivos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`misionId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `objetivos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trackableValues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trackableId` int NOT NULL,
	`date` date NOT NULL,
	`value` decimal(10,2) NOT NULL,
	`durationMinutes` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trackableValues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trackeables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metaId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('binary','numeric') NOT NULL,
	`targetValue` decimal(10,2) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trackeables_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weeklyConclusions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metaId` int NOT NULL,
	`weekStart` date NOT NULL,
	`weekEnd` date NOT NULL,
	`conclusion` text NOT NULL,
	`summary` text,
	`patterns` text,
	`recommendations` text,
	`evidenceSnapshot` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weeklyConclusions_id` PRIMARY KEY(`id`)
);

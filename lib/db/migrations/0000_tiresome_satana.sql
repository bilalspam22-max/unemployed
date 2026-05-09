CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`password` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `application` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`companyId` text,
	`contactId` text,
	`sectorId` text,
	`cvUsedId` text,
	`jobTitle` text NOT NULL,
	`messageSent` text,
	`status` text DEFAULT 'to_prepare' NOT NULL,
	`sentDate` text,
	`nextAction` text,
	`feedbackReceived` text,
	`sentVia` text DEFAULT 'email',
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`contactId`) REFERENCES `contact`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`sectorId`) REFERENCES `sector`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`cvUsedId`) REFERENCES `cv`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `company` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`sectorId` text,
	`name` text NOT NULL,
	`location` text,
	`website` text,
	`hasRdOffice` integer DEFAULT false,
	`technologies` text DEFAULT '[]',
	`status` text DEFAULT 'to_contact' NOT NULL,
	`priorityScore` integer DEFAULT 3,
	`notes` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sectorId`) REFERENCES `sector`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `contact` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`companyId` text,
	`firstName` text NOT NULL,
	`lastName` text NOT NULL,
	`role` text,
	`email` text,
	`linkedinUrl` text,
	`contactType` text DEFAULT 'recruiter',
	`temperature` text DEFAULT 'cold',
	`lastExchangeDate` text,
	`lastExchangeSummary` text,
	`nextFollowupDate` text,
	`signalDetected` text,
	`humanNotes` text,
	`trustLevel` integer DEFAULT 3,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `cv` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`sectorId` text,
	`versionNumber` integer DEFAULT 1 NOT NULL,
	`lastUpdated` text,
	`mainKeywords` text DEFAULT '[]',
	`strengthsToHighlight` text DEFAULT '[]',
	`pdfUrl` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sectorId`) REFERENCES `sector`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `followup` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`contactId` text,
	`scheduledDate` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`messageTemplateUsed` text,
	`completedAt` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`contactId`) REFERENCES `contact`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sector` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#3D5BE3' NOT NULL,
	`priority` integer DEFAULT 2 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`token` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `training` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`sectorId` text,
	`name` text NOT NULL,
	`certificationAvailable` integer DEFAULT false,
	`provider` text,
	`price` real,
	`durationHours` real,
	`marketRecognition` text DEFAULT 'medium',
	`priority` integer DEFAULT 2,
	`status` text DEFAULT 'to_analyze' NOT NULL,
	`roiEstimated` text DEFAULT 'medium',
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sectorId`) REFERENCES `sector`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer DEFAULT false NOT NULL,
	`image` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()),
	`updatedAt` integer DEFAULT (unixepoch())
);

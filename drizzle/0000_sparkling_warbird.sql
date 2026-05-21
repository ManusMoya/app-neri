CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`whatsapp_link` text,
	`debt` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);

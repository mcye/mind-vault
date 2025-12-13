CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`avatar_url` text,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`role` text DEFAULT 'user',
	`plan` text DEFAULT 'free'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
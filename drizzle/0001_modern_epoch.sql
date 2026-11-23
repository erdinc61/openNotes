CREATE TABLE `task` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`is_recurring` integer DEFAULT false NOT NULL,
	`schedule_days` text DEFAULT '[]' NOT NULL,
	`completed_dates` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `upload` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`data` blob NOT NULL,
	`mime_type` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `card` ADD `is_archived` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `card` ADD `front_image` text;--> statement-breakpoint
ALTER TABLE `card` ADD `back_image` text;--> statement-breakpoint
ALTER TABLE `page` ADD `is_favorite` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `username` text;--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);
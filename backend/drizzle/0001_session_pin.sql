ALTER TABLE `users` ADD COLUMN `session_pin` text;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `session_pin_expires_at` text;

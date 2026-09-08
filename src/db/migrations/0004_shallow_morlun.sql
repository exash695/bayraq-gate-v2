ALTER TABLE "class_schedules" ADD COLUMN "section_name" varchar(100);--> statement-breakpoint
ALTER TABLE "class_schedules" ADD COLUMN "class_type" varchar(50) DEFAULT 'physical';--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "recipient_role" varchar(50);--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "data" jsonb;--> statement-breakpoint
ALTER TABLE "school_configs" ADD COLUMN "admin_phone" varchar(50);--> statement-breakpoint
ALTER TABLE "school_configs" ADD COLUMN "admin_whatsapp" varchar(50);--> statement-breakpoint
ALTER TABLE "school_configs" ADD COLUMN "community_lock_all" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "school_configs" ADD COLUMN "community_lock_grades" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "school_configs" ADD COLUMN "stories_lock" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "school_configs" ADD COLUMN "lounge_lock" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "reply_to_ticket_id" varchar(128);
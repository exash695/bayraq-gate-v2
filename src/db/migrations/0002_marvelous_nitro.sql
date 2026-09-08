CREATE TABLE "admin_outbox" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"school_id" varchar(128),
	"title" text,
	"message" text,
	"type" varchar(50),
	"target_role" varchar(50),
	"count" integer DEFAULT 0,
	"ref_ids" jsonb,
	"broadcast_id" varchar(128),
	"timestamp" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "school_configs" ADD COLUMN "installment_plan" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "is_banned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "can_post" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "can_comment" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "device_id" varchar(255);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "last_login" timestamp;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "discount_type" varchar(100);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "discount_rate" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "is_banned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "can_post" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "can_comment" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "device_id" varchar(255);--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "last_login" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_banned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "can_post" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "can_comment" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "device_id" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login" timestamp;
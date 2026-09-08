CREATE TABLE "community_stories" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"school_id" varchar(128),
	"user_id" varchar(128) NOT NULL,
	"user_name" text,
	"user_photo_url" text,
	"post_content" text,
	"post_media" text,
	"media_type" varchar(50),
	"post_media_group" jsonb DEFAULT '[]'::jsonb,
	"views" jsonb DEFAULT '[]'::jsonb,
	"timestamp" timestamp DEFAULT now(),
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "exam_papers" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"school_id" varchar(128),
	"teacher_id" varchar(128),
	"subject" text,
	"year" varchar(50),
	"role" varchar(50),
	"image_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "firestore_docs" (
	"path" varchar(255) PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "question_bank" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"school_id" varchar(128),
	"teacher_id" varchar(128),
	"teacher_name" varchar(128),
	"subject" varchar(100),
	"grade" varchar(50),
	"type" varchar(50),
	"question" text,
	"options" jsonb DEFAULT '[]'::jsonb,
	"correct_answer" text,
	"explanation" text,
	"difficulty" varchar(50),
	"points" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_live_notes" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"school_id" varchar(128),
	"live_title" text,
	"grade" varchar(50),
	"content" text,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "video_comments" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"lesson_id" varchar(128),
	"user_id" varchar(128) NOT NULL,
	"author_name" text,
	"text" text NOT NULL,
	"is_teacher" boolean DEFAULT false,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "user_id" SET DEFAULT 'system';--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "user_name" SET DEFAULT 'مستخدم النظام';--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "user_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "details" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "details" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "community_comments" ADD COLUMN "user_photo" text;--> statement-breakpoint
ALTER TABLE "community_posts" ADD COLUMN "user_photo" text;--> statement-breakpoint
ALTER TABLE "lounge_messages" ADD COLUMN "user_photo" text;--> statement-breakpoint
ALTER TABLE "school_configs" ADD COLUMN "tuition_fees_by_grade" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "school_configs" ADD COLUMN "active_finance_stage" varchar(100);--> statement-breakpoint
ALTER TABLE "school_configs" ADD COLUMN "finance_pin" varchar(20);--> statement-breakpoint
ALTER TABLE "school_configs" ADD COLUMN "payment_methods" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "user_name" varchar(255);--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "phone" varchar(50);--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "subject" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "description" text;
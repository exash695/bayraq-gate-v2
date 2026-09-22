CREATE TABLE "security_bans" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"type" varchar(50) NOT NULL,
	"value" varchar(255) NOT NULL,
	"reason" text NOT NULL,
	"failed_attempts" integer DEFAULT 0,
	"banned_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"status" varchar(50) DEFAULT 'active_ban',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "academy_pages" ADD COLUMN "subtitle" text;--> statement-breakpoint
ALTER TABLE "academy_pages" ADD COLUMN "page_order" bigint;--> statement-breakpoint
ALTER TABLE "academy_pages" ADD COLUMN "pages" jsonb;--> statement-breakpoint
ALTER TABLE "academy_pages" ADD COLUMN "structured_content" jsonb;--> statement-breakpoint
ALTER TABLE "academy_pages" ADD COLUMN "quiz" jsonb;--> statement-breakpoint
ALTER TABLE "academy_pages" ADD COLUMN "ministerial_questions" jsonb;--> statement-breakpoint
ALTER TABLE "academy_pages" ADD COLUMN "raw_text" text;--> statement-breakpoint
ALTER TABLE "academy_pages" ADD COLUMN "extracted_text" text;--> statement-breakpoint
ALTER TABLE "academy_pages" ADD COLUMN "data" jsonb;--> statement-breakpoint
ALTER TABLE "council_polls" ADD COLUMN "views" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "exam_papers" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "exam_papers" ADD COLUMN "grade" varchar(50);--> statement-breakpoint
ALTER TABLE "exam_papers" ADD COLUMN "target_grade" varchar(50);--> statement-breakpoint
ALTER TABLE "exam_papers" ADD COLUMN "target_sections" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "idea_bank" ADD COLUMN "views" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "payment_requests" ADD COLUMN "views" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "question_bank" ADD COLUMN "target_grade" varchar(50);--> statement-breakpoint
ALTER TABLE "question_bank" ADD COLUMN "category" varchar(50) DEFAULT 'ministerial';--> statement-breakpoint
ALTER TABLE "question_bank" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "question_bank" ADD COLUMN "target_sections" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "recorded_lessons" ADD COLUMN "subject" varchar(100);--> statement-breakpoint
ALTER TABLE "recorded_lessons" ADD COLUMN "duration" varchar(50);--> statement-breakpoint
ALTER TABLE "recorded_lessons" ADD COLUMN "section" varchar(100);--> statement-breakpoint
ALTER TABLE "recorded_lessons" ADD COLUMN "date" varchar(50);--> statement-breakpoint
ALTER TABLE "recorded_lessons" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "recorded_lessons" ADD COLUMN "views" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "recorded_lessons" ADD COLUMN "comment_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "school_files" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "school_files" ADD COLUMN "size" varchar(50);--> statement-breakpoint
ALTER TABLE "school_files" ADD COLUMN "downloads" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "school_files" ADD COLUMN "tag" varchar(100);--> statement-breakpoint
ALTER TABLE "school_files" ADD COLUMN "subject" varchar(100);--> statement-breakpoint
ALTER TABLE "school_files" ADD COLUMN "grade" varchar(50);--> statement-breakpoint
ALTER TABLE "school_files" ADD COLUMN "section" varchar(100);--> statement-breakpoint
ALTER TABLE "school_files" ADD COLUMN "allow_download" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN "views" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "teachers" ADD COLUMN "photo" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "photo" text;--> statement-breakpoint
ALTER TABLE "video_comments" ADD COLUMN "parent_id" varchar(128);--> statement-breakpoint
ALTER TABLE "video_comments" ADD COLUMN "is_edited" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "video_comments" ADD COLUMN "updated_at" timestamp DEFAULT now();
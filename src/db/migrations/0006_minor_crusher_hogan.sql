CREATE TABLE "bairaq_activities" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"student_id" varchar(128),
	"school_id" varchar(128),
	"media_url" text NOT NULL,
	"telegram_file_id" text,
	"telegram_message_id" integer,
	"telegram_chat_id" text,
	"media_type" varchar(50),
	"description" text,
	"author_name" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_pose_history" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"asset_id" varchar(128) NOT NULL,
	"file_name" text,
	"download_url" text NOT NULL,
	"asset_type" varchar(50),
	"file_size" integer DEFAULT 0,
	"uploaded_by" varchar(255),
	"status" varchar(50) DEFAULT 'active',
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_poses" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"public_url" text NOT NULL,
	"category" varchar(50) DEFAULT 'pose',
	"aliases" jsonb DEFAULT '[]'::jsonb,
	"updated_by" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"key" varchar(128) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"updated_by" varchar(255),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_device_tokens" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"token" text NOT NULL,
	"platform" varchar(50) DEFAULT 'android',
	"device_model" varchar(128),
	"school_id" varchar(128),
	"role" varchar(50) DEFAULT 'student',
	"last_active" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "school_configs" ADD COLUMN "telegram_bot_token" text;--> statement-breakpoint
ALTER TABLE "school_configs" ADD COLUMN "telegram_channels_mapping" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "disabled_modules" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "cover_url" text;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "type" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_token" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_token_expires" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "whatsapp_otp" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "whatsapp_otp_expires" timestamp;--> statement-breakpoint
ALTER TABLE "bairaq_activities" ADD CONSTRAINT "bairaq_activities_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bairaq_activities" ADD CONSTRAINT "bairaq_activities_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_student_id_idx" ON "bairaq_activities" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "activities_school_id_idx" ON "bairaq_activities" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "activities_created_at_idx" ON "bairaq_activities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tokens_user_id_idx" ON "user_device_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "academic_lists_school_id_idx" ON "academic_lists" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "pages_school_id_idx" ON "academy_pages" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "codes_school_id_idx" ON "activation_codes" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "outbox_school_id_idx" ON "admin_outbox" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "attendance_student_id_idx" ON "attendance_logs" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "attendance_school_id_idx" ON "attendance_logs" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "attendance_date_idx" ON "attendance_logs" USING btree ("date");--> statement-breakpoint
CREATE INDEX "audit_school_id_idx" ON "audit_logs" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "behavior_student_id_idx" ON "behavior_logs" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "behavior_school_id_idx" ON "behavior_logs" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "broadcasts_school_id_idx" ON "broadcasts" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "schedules_school_id_idx" ON "class_schedules" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "schedules_teacher_id_idx" ON "class_schedules" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "comments_post_id_idx" ON "community_comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "posts_school_id_idx" ON "community_posts" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "stories_school_id_idx" ON "community_stories" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "polls_school_id_idx" ON "council_polls" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "exams_school_id_idx" ON "exam_papers" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "idea_bank_school_id_idx" ON "idea_bank" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "lounge_school_id_idx" ON "lounge_messages" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "lounge_recipient_id_idx" ON "lounge_messages" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "notifications_school_id_idx" ON "notifications" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "notifications_recipient_id_idx" ON "notifications" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "payments_school_id_idx" ON "payment_requests" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "qbank_school_id_idx" ON "question_bank" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "lessons_school_id_idx" ON "recorded_lessons" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "announcements_school_id_idx" ON "school_announcements" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "files_school_id_idx" ON "school_files" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "live_notes_school_id_idx" ON "student_live_notes" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "live_notes_user_id_idx" ON "student_live_notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transactions_student_id_idx" ON "student_transactions" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "transactions_school_id_idx" ON "student_transactions" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "students_school_id_idx" ON "students" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "students_code_idx" ON "students" USING btree ("code");--> statement-breakpoint
CREATE INDEX "tickets_school_id_idx" ON "support_tickets" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "tickets_user_id_idx" ON "support_tickets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "teachers_school_id_idx" ON "teachers" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "drivers_school_id_idx" ON "transport_drivers" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "transport_fees_student_id_idx" ON "transport_fees" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "routes_school_id_idx" ON "transport_routes" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "transport_status_route_id_idx" ON "transport_students_status" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX "users_school_id_idx" ON "users" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "vcomments_lesson_id_idx" ON "video_comments" USING btree ("lesson_id");
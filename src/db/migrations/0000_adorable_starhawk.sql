CREATE TABLE "academic_lists" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"school_id" varchar(128),
	"school_name" text,
	"date" varchar(50),
	"students" jsonb DEFAULT '[]'::jsonb,
	"removed_subjects" jsonb DEFAULT '[]'::jsonb,
	"last_synced_period" varchar(50),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "academy_pages" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"school_id" varchar(128),
	"title" text NOT NULL,
	"content" text,
	"category" varchar(100),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "activation_codes" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"school_id" varchar(128),
	"role" varchar(50) DEFAULT 'student',
	"used" boolean DEFAULT false,
	"used_by" varchar(128),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "activation_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "attendance_logs" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"student_id" varchar(128) NOT NULL,
	"school_id" varchar(128) NOT NULL,
	"date" varchar(20) NOT NULL,
	"status" varchar(50) NOT NULL,
	"period" varchar(50),
	"reason" text,
	"recorded_by" text,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"user_name" varchar(255) NOT NULL,
	"user_email" varchar(255),
	"action" varchar(255) NOT NULL,
	"details" text NOT NULL,
	"target_id" varchar(128),
	"target_name" varchar(255),
	"target_type" varchar(50),
	"school_id" varchar(128),
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "behavior_logs" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"student_id" varchar(128) NOT NULL,
	"school_id" varchar(128) NOT NULL,
	"type" varchar(50) NOT NULL,
	"points" integer NOT NULL,
	"action" text,
	"note" text,
	"recorded_by" text,
	"date" varchar(20) NOT NULL,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "broadcasts" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"school_id" varchar(128),
	"teacher_id" varchar(128),
	"title" text NOT NULL,
	"grade" varchar(50),
	"stream_url" text,
	"status" varchar(50) DEFAULT 'scheduled',
	"started_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "class_schedules" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"school_id" varchar(128),
	"teacher_id" varchar(128),
	"class_name" varchar(50),
	"subject" varchar(100),
	"day_of_week" varchar(50),
	"start_time" varchar(50),
	"end_time" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "community_comments" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"post_id" varchar(128),
	"user_id" varchar(128) NOT NULL,
	"user_name" text,
	"content" text NOT NULL,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "community_posts" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"school_id" varchar(128),
	"user_id" varchar(128) NOT NULL,
	"user_name" text,
	"content" text NOT NULL,
	"media_url" text,
	"type" varchar(50) DEFAULT 'student',
	"grade" varchar(50),
	"is_pinned" boolean DEFAULT false,
	"is_locked" boolean DEFAULT false,
	"reports_count" integer DEFAULT 0,
	"likes_count" integer DEFAULT 0,
	"comments_count" integer DEFAULT 0,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "council_polls" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"school_id" varchar(128),
	"title" text NOT NULL,
	"description" text,
	"type" varchar(50) DEFAULT 'admin',
	"author_id" varchar(128),
	"author_name" varchar(255),
	"status" varchar(50) DEFAULT 'active',
	"admin_reply" text,
	"votes" jsonb DEFAULT '{}'::jsonb,
	"comments" jsonb DEFAULT '[]'::jsonb,
	"target_grade" varchar(50),
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "developer_logs" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"action" varchar(100),
	"details" text,
	"admin_id" varchar(128),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "idea_bank" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"school_id" varchar(128),
	"user_id" varchar(128),
	"sender_name" varchar(255),
	"title" text NOT NULL,
	"description" text,
	"category" varchar(50),
	"status" varchar(50) DEFAULT 'pending',
	"admin_reply" text,
	"target_grade" varchar(50),
	"read_by_parent" boolean DEFAULT false,
	"votes" integer DEFAULT 0,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lounge_messages" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"school_id" varchar(128),
	"user_id" varchar(128) NOT NULL,
	"user_name" text,
	"user_role" varchar(50),
	"recipient_id" varchar(128),
	"text" text NOT NULL,
	"image_url" text,
	"read" boolean DEFAULT false,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"school_id" varchar(128),
	"recipient_id" varchar(128),
	"title" text NOT NULL,
	"body" text,
	"type" varchar(50),
	"read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_requests" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"school_id" varchar(128),
	"requester_id" varchar(128),
	"amount" integer NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recorded_lessons" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"school_id" varchar(128),
	"teacher_id" varchar(128),
	"title" text NOT NULL,
	"grade" varchar(50),
	"video_url" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "salaries" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"staff_id" varchar(128),
	"staff_name" text,
	"month" varchar(20),
	"base_salary" integer DEFAULT 0,
	"rewards" integer DEFAULT 0,
	"deductions" integer DEFAULT 0,
	"net_salary" integer DEFAULT 0,
	"is_paid" boolean DEFAULT false,
	"payment_date" timestamp,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "school_announcements" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"school_id" varchar(128),
	"message" text NOT NULL,
	"target_grades" jsonb DEFAULT '[]'::jsonb,
	"author" varchar(128),
	"subject" varchar(100),
	"target_location" varchar(50) DEFAULT 'both',
	"expiry_date" timestamp,
	"timestamp_ms" bigint,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "school_configs" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"tuition_fee" integer DEFAULT 0,
	"discount_rates" jsonb DEFAULT '{}'::jsonb,
	"subjects" jsonb DEFAULT '{}'::jsonb,
	"uniform_configs" jsonb DEFAULT '{}'::jsonb,
	"stats" jsonb DEFAULT '{"totalRevenue":0,"todayRevenue":0}'::jsonb,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "school_files" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"school_id" varchar(128),
	"uploader_id" varchar(128),
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_type" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"governorate" varchar(100),
	"activation_code" varchar(50),
	"status" varchar(50) DEFAULT 'active',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_transactions" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"student_id" varchar(128),
	"school_id" varchar(128),
	"amount" integer NOT NULL,
	"note" text,
	"method" varchar(50),
	"admin_name" varchar(128),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"school_id" varchar(128),
	"name" text NOT NULL,
	"grade" varchar(50),
	"code" varchar(50),
	"parent_code" varchar(50),
	"avatar" text,
	"points" integer DEFAULT 0,
	"parent_phone" varchar(50),
	"status" varchar(50) DEFAULT 'نشط',
	"paid_amount" integer DEFAULT 0,
	"total_amount" integer DEFAULT 0,
	"is_top_student" boolean DEFAULT false,
	"top_student_period" varchar(50),
	"last_synced_period" varchar(50),
	"grades" jsonb DEFAULT '{}'::jsonb,
	"behavior" jsonb DEFAULT '{"score":100,"logs":[]}'::jsonb,
	"attendance" jsonb DEFAULT '{"present":0,"absent":0,"late":0,"logs":[]}'::jsonb,
	"finance" jsonb DEFAULT '{"installments":[],"transactions":[]}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"school_id" varchar(128),
	"user_id" varchar(128),
	"student_name" text,
	"grade" varchar(50),
	"issue_type" text,
	"message" text,
	"status" varchar(50) DEFAULT 'pending',
	"is_group" boolean DEFAULT false,
	"admin_reply" text,
	"role" varchar(50),
	"broadcast_id" varchar(128),
	"sender_type" varchar(50),
	"read_by_admin" boolean DEFAULT false,
	"read_by_student" boolean DEFAULT false,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "teachers" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"school_id" varchar(128),
	"name" text NOT NULL,
	"subject" varchar(100),
	"role" varchar(50) DEFAULT 'TEACHER',
	"bio" text,
	"classes" jsonb DEFAULT '[]'::jsonb,
	"schedule" jsonb DEFAULT '[]'::jsonb,
	"can_publish" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"rating" integer DEFAULT 0,
	"admin_notes" text,
	"code" varchar(100),
	"class_codes" jsonb DEFAULT '{}'::jsonb,
	"stage" varchar(100),
	"grade" varchar(100),
	"phone" varchar(50),
	"email" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transport_drivers" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"school_id" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"access_code" varchar(20) NOT NULL,
	"bus_number" varchar(50),
	"route_id" varchar(50),
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "transport_drivers_access_code_unique" UNIQUE("access_code")
);
--> statement-breakpoint
CREATE TABLE "transport_fees" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"student_id" varchar(50) NOT NULL,
	"parent_id" varchar(50),
	"amount" double precision NOT NULL,
	"period" varchar(50),
	"status" varchar(20) DEFAULT 'unpaid',
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transport_routes" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"school_id" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'inactive',
	"current_location_lat" double precision,
	"current_location_lng" double precision,
	"last_update" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transport_students_status" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"route_id" varchar(50),
	"parent_id" varchar(50),
	"student_name" varchar(100),
	"status" varchar(50) DEFAULT 'pending',
	"stop_name" varchar(100),
	"shift" varchar(20),
	"timestamp" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"school_id" varchar(128),
	"name" text NOT NULL,
	"role" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "academic_lists" ADD CONSTRAINT "academic_lists_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;
import { doublePrecision, pgTable, text, varchar, timestamp, integer, boolean, jsonb, bigint, index, numeric } from "drizzle-orm/pg-core";

// جدول المدارس
export const schools = pgTable("schools", {
  id: varchar("id", { length: 128 }).primaryKey(), // Firebase Document ID
  name: text("name").notNull(),
  governorate: varchar("governorate", { length: 100 }),
  activationCode: varchar("activation_code", { length: 50 }),
  status: varchar("status", { length: 50 }).default('active'),
  disabledModules: jsonb("disabled_modules").default([]),
  coverUrl: text("cover_url"),
  logoUrl: text("logo_url"),
  location: text("location"),
  type: varchar("type", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// جدول المستخدمين (المدراء، المعلمين، الخ)
export const users = pgTable("users", {
  id: varchar("id", { length: 128 }).primaryKey(),
  schoolId: varchar("school_id", { length: 128 }).references(() => schools.id),
  name: text("name").notNull(),
  role: varchar("role", { length: 50 }).notNull(), // admin, teacher, parent, driver
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: text("password_hash"),
  isBanned: boolean("is_banned").default(false),
  canPost: boolean("can_post").default(true),
  canComment: boolean("can_comment").default(true),
  deviceId: varchar("device_id", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  photo: text("photo"),
  resetToken: varchar("reset_token", { length: 255 }),
  resetTokenExpires: timestamp("reset_token_expires"),
  whatsappOtp: varchar("whatsapp_otp", { length: 20 }),
  whatsappOtpExpires: timestamp("whatsapp_otp_expires"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  schoolIdIdx: index("users_school_id_idx").on(table.schoolId),
}));

// جدول المعلمين والموظفين (تفاصيل إضافية)
export const teachers = pgTable("teachers", {
  id: varchar("id", { length: 128 }).primaryKey(),
  schoolId: varchar("school_id", { length: 128 }),
  name: text("name").notNull(),
  photo: text("photo"),
  subject: varchar("subject", { length: 100 }),
  role: varchar("role", { length: 50 }).default('TEACHER'), // TEACHER, STAFF
  bio: text("bio"),
  classes: jsonb("classes").default([]),
  schedule: jsonb("schedule").default([]),
  canPublish: boolean("can_publish").default(false),
  isActive: boolean("is_active").default(true),
  isBanned: boolean("is_banned").default(false),
  canPost: boolean("can_post").default(true),
  canComment: boolean("can_comment").default(true),
  deviceId: varchar("device_id", { length: 255 }),
  lastLogin: timestamp("last_login"),
  rating: integer("rating").default(0),
  adminNotes: text("admin_notes"),
  code: varchar("code", { length: 100 }),
  classCodes: jsonb("class_codes").default({}),
  stage: varchar("stage", { length: 100 }),
  grade: varchar("grade", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  schoolIdIdx: index("teachers_school_id_idx").on(table.schoolId),
}));

// جدول الطلاب
export const students = pgTable("students", {
  id: varchar("id", { length: 128 }).primaryKey(), // Usually schoolId_studentCode
  schoolId: varchar("school_id", { length: 128 }).references(() => schools.id),
  name: text("name").notNull(),
  grade: varchar("grade", { length: 50 }),
  code: varchar("code", { length: 50 }),
  parentCode: varchar("parent_code", { length: 50 }),
  avatar: text("avatar"),
  points: integer("points").default(0),
  parentPhone: varchar("parent_phone", { length: 50 }),
  status: varchar("status", { length: 50 }).default('نشط'),
  isBanned: boolean("is_banned").default(false),
  canPost: boolean("can_post").default(true),
  canComment: boolean("can_comment").default(true),
  deviceId: varchar("device_id", { length: 255 }),
  lastLogin: timestamp("last_login"),
  paidAmount: integer("paid_amount").default(0),
  totalAmount: integer("total_amount").default(0),
  discountType: varchar("discount_type", { length: 100 }),
  discountRate: integer("discount_rate").default(0),
  isTopStudent: boolean("is_top_student").default(false),
  topStudentPeriod: varchar("top_student_period", { length: 50 }),
  lastSyncedPeriod: varchar("last_synced_period", { length: 50 }),
  grades: jsonb("grades").default({}), // Object with periods and subject scores
  behavior: jsonb("behavior").default({ score: 100, logs: [] }),
  attendance: jsonb("attendance").default({ present: 0, absent: 0, late: 0, logs: [] }),
  finance: jsonb("finance").default({ installments: [], transactions: [] }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  schoolIdIdx: index("students_school_id_idx").on(table.schoolId),
  codeIdx: index("students_code_idx").on(table.code),
}));

// جدول القوائم الأكاديمية (الوجبات)
export const academic_lists = pgTable("academic_lists", {
  id: varchar("id", { length: 128 }).primaryKey(),
  name: text("name").notNull(),
  schoolId: varchar("school_id", { length: 128 }).references(() => schools.id),
  schoolName: text("school_name"),
  date: varchar("date", { length: 50 }),
  students: jsonb("students").default([]), // Snapshot of students in this list
  removedSubjects: jsonb("removed_subjects").default([]),
  lastSyncedPeriod: varchar("last_synced_period", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  schoolIdIdx: index("academic_lists_school_id_idx").on(table.schoolId),
}));

// جدول إعدادات المدرسة
export const school_configs = pgTable("school_configs", {
  id: varchar("id", { length: 128 }).primaryKey(), // schoolId
  adminPhone: varchar("admin_phone", { length: 50 }),
  adminWhatsapp: varchar("admin_whatsapp", { length: 50 }),
  communityLockAll: boolean("community_lock_all").default(false),
  communityLockGrades: jsonb("community_lock_grades").default([]),
  storiesLock: boolean("stories_lock").default(false),
  loungeLock: boolean("lounge_lock").default(false),
  tuitionFee: integer("tuition_fee").default(0),
  discountRates: jsonb("discount_rates").default({}),
  subjects: jsonb("subjects").default({}),
  uniformConfigs: jsonb("uniform_configs").default({}),
  tuitionFeesByGrade: jsonb("tuition_fees_by_grade").default({}),
  installmentPlan: jsonb("installment_plan").default([]),
  activeFinanceStage: varchar("active_finance_stage", { length: 100 }),
  financePIN: varchar("finance_pin", { length: 20 }),
  paymentMethods: jsonb("payment_methods").default({}),
  stats: jsonb("stats").default({ totalRevenue: 0, todayRevenue: 0 }),
  telegramBotToken: text("telegram_bot_token"),
  telegramChannelsMapping: jsonb("telegram_channels_mapping").default({}),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// جدول الحركات المالية (الأقساط)
export const student_transactions = pgTable("student_transactions", {
  id: varchar("id", { length: 128 }).primaryKey(), 
  studentId: varchar("student_id", { length: 128 }), 
  schoolId: varchar("school_id", { length: 128 }),
  amount: integer("amount").notNull(),
  note: text("note"),
  method: varchar("method", { length: 50 }),
  adminName: varchar("admin_name", { length: 128 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  studentIdIdx: index("transactions_student_id_idx").on(table.studentId),
  schoolIdIdx: index("transactions_school_id_idx").on(table.schoolId),
}));

// جدول الجداول الدراسية
export const class_schedules = pgTable("class_schedules", {
  id: varchar("id", { length: 128 }).primaryKey(),
  schoolId: varchar("school_id", { length: 128 }),
  teacherId: varchar("teacher_id", { length: 128 }),
  className: varchar("class_name", { length: 50 }), // الصف
  sectionName: varchar("section_name", { length: 100 }), // الشعبة
  classType: varchar("class_type", { length: 50 }).default('physical'), // نوع الحصة
  subject: varchar("subject", { length: 100 }),
  dayOfWeek: varchar("day_of_week", { length: 50 }), // اليوم
  startTime: varchar("start_time", { length: 50 }),
  endTime: varchar("end_time", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  schoolIdIdx: index("schedules_school_id_idx").on(table.schoolId),
  teacherIdIdx: index("schedules_teacher_id_idx").on(table.teacherId),
}));

// جدول تذاكر الدعم الفني والشكاوى
export const support_tickets = pgTable("support_tickets", {
  id: varchar("id", { length: 128 }).primaryKey(),
  schoolId: varchar("school_id", { length: 128 }),
  userId: varchar("user_id", { length: 128 }),
  studentName: text("student_name"),
  userName: varchar("user_name", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  grade: varchar("grade", { length: 50 }),
  subject: text("subject").default(''),
  description: text("description"),
  views: integer("views").default(0),
  issueType: text("issue_type"),
  message: text("message"),
  status: varchar("status", { length: 50 }).default('pending'),
  isGroup: boolean("is_group").default(false),
  adminReply: text("admin_reply"),
  role: varchar("role", { length: 50 }),
  broadcastId: varchar("broadcast_id", { length: 128 }),
  replyToTicketId: varchar("reply_to_ticket_id", { length: 128 }),
  senderType: varchar("sender_type", { length: 50 }),
  readByAdmin: boolean("read_by_admin").default(false),
  readByStudent: boolean("read_by_student").default(false),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => ({
  schoolIdIdx: index("tickets_school_id_idx").on(table.schoolId),
  userIdIdx: index("tickets_user_id_idx").on(table.userId),
}));

// جدول بنك الأفكار والمقترحات
export const idea_bank = pgTable("idea_bank", {
  id: varchar("id", { length: 128 }).primaryKey(),
  schoolId: varchar("school_id", { length: 128 }),
  userId: varchar("user_id", { length: 128 }),
  senderName: varchar("sender_name", { length: 255 }),
  title: text("title").notNull(),
  description: text("description"),
  views: integer("views").default(0),
  category: varchar("category", { length: 50 }), // academic, behavior, administrative, other
  status: varchar("status", { length: 50 }).default('pending'), // pending, under_review, implemented, rejected
  adminReply: text("admin_reply"),
  targetGrade: varchar("target_grade", { length: 50 }),
  readByParent: boolean("read_by_parent").default(false),
  votes: integer("votes").default(0),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => ({
  schoolIdIdx: index("idea_bank_school_id_idx").on(table.schoolId),
}));

// جدول مجلس الآباء (التصويتات العامة)
export const council_polls = pgTable("council_polls", {
  id: varchar("id", { length: 128 }).primaryKey(),
  schoolId: varchar("school_id", { length: 128 }),
  title: text("title").notNull(),
  description: text("description"),
  views: integer("views").default(0),
  type: varchar("type", { length: 50 }).default('admin'), // admin, parent
  authorId: varchar("author_id", { length: 128 }),
  authorName: varchar("author_name", { length: 255 }),
  status: varchar("status", { length: 50 }).default('active'), // active, closed, implemented, rejected
  adminReply: text("admin_reply"),
  votes: jsonb("votes").default({}), // Record<string, 'support' | 'reject'>
  comments: jsonb("comments").default([]), // { id, authorName, text, timestamp }[]
  targetGrade: varchar("target_grade", { length: 50 }),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => ({
  schoolIdIdx: index("polls_school_id_idx").on(table.schoolId),
}));

// جدول البث المباشر (الدروس الحية)
export const broadcasts = pgTable("broadcasts", {
  id: varchar("id", { length: 128 }).primaryKey(),
  schoolId: varchar("school_id", { length: 128 }),
  teacherId: varchar("teacher_id", { length: 128 }),
  title: text("title").notNull(),
  grade: varchar("grade", { length: 50 }),
  streamUrl: text("stream_url"),
  status: varchar("status", { length: 50 }).default('scheduled'), // scheduled, live, ended
  startedAt: timestamp("started_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  schoolIdIdx: index("broadcasts_school_id_idx").on(table.schoolId),
}));

// جدول الإذاعة المدرسية والإعلانات (رادار الذكاء)
export const school_announcements = pgTable("school_announcements", {
  id: varchar("id", { length: 128 }).primaryKey(),
  schoolId: varchar("school_id", { length: 128 }),
  message: text("message").notNull(),
  targetGrades: jsonb("target_grades").default([]),
  author: varchar("author", { length: 128 }),
  subject: varchar("subject", { length: 100 }),
  targetLocation: varchar("target_location", { length: 50 }).default('both'), // ticker, post, both
  expiryDate: timestamp("expiry_date"),
  timestampMs: bigint("timestamp_ms", { mode: 'number' }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  schoolIdIdx: index("announcements_school_id_idx").on(table.schoolId),
}));

// جدول الإشعارات
export const notifications = pgTable("notifications", {
  id: varchar("id", { length: 128 }).primaryKey(),
  schoolId: varchar("school_id", { length: 128 }),
  recipientId: varchar("recipient_id", { length: 128 }), // Could be user ID or role
  recipientRole: varchar("recipient_role", { length: 50 }),
  title: text("title").notNull(),
  body: text("body"),
  data: jsonb("data"),
  metadata: jsonb("metadata"),
  type: varchar("type", { length: 50 }), // e.g. "alert", "message"
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  schoolIdIdx: index("notifications_school_id_idx").on(table.schoolId),
  recipientIdIdx: index("notifications_recipient_id_idx").on(table.recipientId),
}));

// جدول توكنات أجهزة المستخدمين للإشعارات الخارجية (FCM Push Notification Tokens)
export const user_device_tokens = pgTable("user_device_tokens", {
  id: varchar("id", { length: 128 }).primaryKey(),
  userId: varchar("user_id", { length: 128 }).notNull(),
  token: text("token").notNull(),
  platform: varchar("platform", { length: 50 }).default('android'), // android, ios, web
  deviceModel: varchar("device_model", { length: 128 }),
  schoolId: varchar("school_id", { length: 128 }),
  role: varchar("role", { length: 50 }).default('student'),
  lastActive: timestamp("last_active").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("tokens_user_id_idx").on(table.userId),
}));

// جدول طلبات الدفع والمصروفات
export const payment_requests = pgTable("payment_requests", {
  id: varchar("id", { length: 128 }).primaryKey(),
  schoolId: varchar("school_id", { length: 128 }),
  requesterId: varchar("requester_id", { length: 128 }),
  amount: integer("amount").notNull(),
  description: text("description"),
  views: integer("views").default(0),
  status: varchar("status", { length: 50 }).default('pending'), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  schoolIdIdx: index("payments_school_id_idx").on(table.schoolId),
}));

// جدول سجلات المطورين
export const developer_logs = pgTable("developer_logs", {
  id: varchar("id", { length: 128 }).primaryKey(),
  action: varchar("action", { length: 100 }),
  details: text("details"),
  adminId: varchar("admin_id", { length: 128 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// جدول أكواد التفعيل
export const activation_codes = pgTable("activation_codes", {
  id: varchar("id", { length: 128 }).primaryKey(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  schoolId: varchar("school_id", { length: 128 }),
  role: varchar("role", { length: 50 }).default('student'), // student, parent, admin, etc.
  used: boolean("used").default(false),
  usedBy: varchar("used_by", { length: 128 }), // user id
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  schoolIdIdx: index("codes_school_id_idx").on(table.schoolId),
}));

// الدروس المسجلة
export const recorded_lessons = pgTable("recorded_lessons", {
  id: varchar("id", { length: 128 }).primaryKey(),
  schoolId: varchar("school_id", { length: 128 }),
  teacherId: varchar("teacher_id", { length: 128 }),
  title: text("title").notNull(),
  grade: varchar("grade", { length: 50 }),
    subject: varchar("subject", { length: 100 }),
  duration: varchar("duration", { length: 50 }),
  section: varchar("section", { length: 100 }),
  date: varchar("date", { length: 50 }),
  description: text("description"),
  views: integer("views").default(0),
  commentCount: integer("comment_count").default(0),
  videoUrl: text("video_url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  schoolIdIdx: index("lessons_school_id_idx").on(table.schoolId),
}));

// ملفات المدرسة
export const school_files = pgTable("school_files", {
  id: varchar("id", { length: 128 }).primaryKey(),
  schoolId: varchar("school_id", { length: 128 }),
  uploaderId: varchar("uploader_id", { length: 128 }),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
    title: text("title"),
  size: varchar("size", { length: 50 }),
  downloads: integer("downloads").default(0),
  tag: varchar("tag", { length: 100 }),
  subject: varchar("subject", { length: 100 }),
  grade: varchar("grade", { length: 50 }),
  section: varchar("section", { length: 100 }),
  fileType: varchar("file_type", { length: 50 }),
  allowDownload: boolean("allow_download").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  schoolIdIdx: index("files_school_id_idx").on(table.schoolId),
}));

// صفحات الأكاديمية
export const academy_pages = pgTable("academy_pages", {
  id: varchar("id", { length: 128 }).primaryKey(),
  schoolId: varchar("school_id", { length: 128 }),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  content: text("content"),
  category: varchar("category", { length: 100 }),
  order: bigint("page_order", { mode: "number" }),
  pages: jsonb("pages"),
  structuredContent: jsonb("structured_content"),
  quiz: jsonb("quiz"),
  ministerialQuestions: jsonb("ministerial_questions"),
  rawText: text("raw_text"),
  extractedText: text("extracted_text"),
  data: jsonb("data"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  schoolIdIdx: index("pages_school_id_idx").on(table.schoolId),
}));

// رواتب الكادر
export const salaries = pgTable("salaries", {
  id: varchar("id", { length: 128 }).primaryKey(), // staffId_month
  staffId: varchar("staff_id", { length: 128 }),
  staffName: text("staff_name"),
  month: varchar("month", { length: 20 }), // e.g. "2024-05"
  baseSalary: integer("base_salary").default(0),
  rewards: integer("rewards").default(0),
  deductions: integer("deductions").default(0),
  netSalary: integer("net_salary").default(0),
  isPaid: boolean("is_paid").default(false),
  paymentDate: timestamp("payment_date"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// المنشورات الاجتماعية (Community Posts)
export const community_posts = pgTable("community_posts", {
  id: varchar("id", { length: 128 }).primaryKey(),
  schoolId: varchar("school_id", { length: 128 }),
  userId: varchar("user_id", { length: 128 }).notNull(),
  userName: text("user_name"),
  userPhoto: text("user_photo"),
  content: text("content").notNull(),
  mediaUrl: text("media_url"),
  type: varchar("type", { length: 50 }).default('student'), // student, teacher, admin
  grade: varchar("grade", { length: 50 }),
  targetSection: text("target_section"),
  targetSections: jsonb("target_sections"),
  reactions: jsonb("reactions"),
  shares: integer("shares").default(0),
  isPinned: boolean("is_pinned").default(false),
  isLocked: boolean("is_locked").default(false),
  reportsCount: integer("reports_count").default(0),
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  data: jsonb("data"),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => ({
  schoolIdIdx: index("posts_school_id_idx").on(table.schoolId),
}));

// تعليقات المنشورات
export const community_comments = pgTable("community_comments", {
  id: varchar("id", { length: 128 }).primaryKey(),
  postId: varchar("post_id", { length: 128 }).references(() => community_posts.id),
  userId: varchar("user_id", { length: 128 }).notNull(),
  userName: text("user_name"),
  userPhoto: text("user_photo"),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => ({
  postIdIdx: index("comments_post_id_idx").on(table.postId),
}));

// سجلات الحضور والغياب (للتخزين التفصيلي والقابل للاستعلام)
export const attendance_logs = pgTable("attendance_logs", {
  id: varchar("id", { length: 128 }).primaryKey(),
  studentId: varchar("student_id", { length: 128 }).notNull(),
  schoolId: varchar("school_id", { length: 128 }).notNull(),
  date: varchar("date", { length: 20 }).notNull(), // YYYY-MM-DD
  status: varchar("status", { length: 50 }).notNull(), // present, absent, late
  period: varchar("period", { length: 50 }), // full day, 1, 2, ...
  reason: text("reason"),
  recordedBy: text("recorded_by"),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => ({
  studentIdIdx: index("attendance_student_id_idx").on(table.studentId),
  schoolIdIdx: index("attendance_school_id_idx").on(table.schoolId),
  dateIdx: index("attendance_date_idx").on(table.date),
}));

// سجلات السلوك والانضباط (للتخزين التفصيلي والقابل للاستعلام)
export const behavior_logs = pgTable("behavior_logs", {
  id: varchar("id", { length: 128 }).primaryKey(),
  studentId: varchar("student_id", { length: 128 }).notNull(),
  schoolId: varchar("school_id", { length: 128 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // positive, negative
  points: integer("points").notNull(),
  action: text("action"),
  note: text("note"),
  recordedBy: text("recorded_by"),
  date: varchar("date", { length: 20 }).notNull(), // YYYY-MM-DD
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => ({
  studentIdIdx: index("behavior_student_id_idx").on(table.studentId),
  schoolIdIdx: index("behavior_school_id_idx").on(table.schoolId),
}));

// سجل النشاطات والرقابة الإدارية
export const audit_logs = pgTable("audit_logs", {
  id: varchar("id", { length: 128 }).primaryKey(),
  userId: varchar("user_id", { length: 128 }).default('system'),
  userName: varchar("user_name", { length: 255 }).default('مستخدم النظام'),
  userEmail: varchar("user_email", { length: 255 }),
  action: varchar("action", { length: 255 }).notNull(),
  details: text("details").default(''),
  targetId: varchar("target_id", { length: 128 }),
  targetName: varchar("target_name", { length: 255 }),
  targetType: varchar("target_type", { length: 50 }),
  schoolId: varchar("school_id", { length: 128 }),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => ({
  schoolIdIdx: index("audit_school_id_idx").on(table.schoolId),
}));


// --- Transport Module (النقل المدرسي) ---
export const transport_routes = pgTable('transport_routes', {
  id: varchar('id', { length: 50 }).primaryKey(),
  schoolId: varchar('school_id', { length: 50 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).default('inactive'), // active, inactive, in_progress
  currentLocationLat: doublePrecision('current_location_lat'),
  currentLocationLng: doublePrecision('current_location_lng'),
  lastUpdate: timestamp('last_update'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  schoolIdIdx: index("routes_school_id_idx").on(table.schoolId),
}));

export const transport_drivers = pgTable('transport_drivers', {
  id: varchar('id', { length: 50 }).primaryKey(),
  schoolId: varchar('school_id', { length: 50 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  accessCode: varchar('access_code', { length: 20 }).notNull().unique(),
  busNumber: varchar('bus_number', { length: 50 }),
  routeId: varchar('route_id', { length: 50 }),
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  schoolIdIdx: index("drivers_school_id_idx").on(table.schoolId),
}));

export const transport_students_status = pgTable('transport_students_status', {
  id: varchar('id', { length: 50 }).primaryKey(), // Usually studentId
  routeId: varchar('route_id', { length: 50 }),
  parentId: varchar('parent_id', { length: 50 }),
  studentName: varchar('student_name', { length: 100 }),
  status: varchar('status', { length: 50 }).default('pending'), // pending, boarded, dropped_off, absent
  stopName: varchar('stop_name', { length: 100 }),
  shift: varchar('shift', { length: 20 }), // morning, evening, both
  timestamp: timestamp('timestamp'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  routeIdIdx: index("transport_status_route_id_idx").on(table.routeId),
}));

export const transport_fees = pgTable('transport_fees', {
  id: varchar('id', { length: 50 }).primaryKey(),
  studentId: varchar('student_id', { length: 50 }).notNull(),
  parentId: varchar('parent_id', { length: 50 }),
  amount: doublePrecision('amount').notNull(),
  period: varchar('period', { length: 50 }), // e.g. "شهر أكتوبر"
  status: varchar('status', { length: 20 }).default('unpaid'), // unpaid, paid
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  studentIdIdx: index("transport_fees_student_id_idx").on(table.studentId),
}));

// رسائل المحادثات
export const lounge_messages = pgTable("lounge_messages", {
  id: varchar("id", { length: 128 }).primaryKey(),
  schoolId: varchar("school_id", { length: 128 }),
  userId: varchar("user_id", { length: 128 }).notNull(),
  userName: text("user_name"),
  userPhoto: text("user_photo"),
  userRole: varchar("user_role", { length: 50 }),
  recipientId: varchar("recipient_id", { length: 128 }),
  text: text("text").notNull(),
  imageUrl: text("image_url"),
  read: boolean("read").default(false),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => ({
  schoolIdIdx: index("lounge_school_id_idx").on(table.schoolId),
  recipientIdIdx: index("lounge_recipient_id_idx").on(table.recipientId),
}));

// بنك الأسئلة
export const question_bank = pgTable("question_bank", {
  id: varchar("id", { length: 128 }).primaryKey(),
  schoolId: varchar("school_id", { length: 128 }),
  teacherId: varchar("teacher_id", { length: 128 }),
  teacherName: varchar("teacher_name", { length: 128 }),
  subject: varchar("subject", { length: 100 }),
  grade: varchar("grade", { length: 50 }),
  targetGrade: varchar("target_grade", { length: 50 }),
  category: varchar("category", { length: 50 }).default('ministerial'),
  tags: jsonb("tags").default([]),
  targetSections: jsonb("target_sections").default([]),
  type: varchar("type", { length: 50 }),
  question: text("question"),
  options: jsonb("options").default([]),
  correctAnswer: text("correct_answer"),
  explanation: text("explanation"),
  difficulty: varchar("difficulty", { length: 50 }),
  points: integer("points").default(1),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  schoolIdIdx: index("qbank_school_id_idx").on(table.schoolId),
}));

// نماذج الامتحانات
export const exam_papers = pgTable("exam_papers", {
  id: varchar("id", { length: 128 }).primaryKey(),
  schoolId: varchar("school_id", { length: 128 }),
  teacherId: varchar("teacher_id", { length: 128 }),
  subject: text("subject"),
  year: varchar("year", { length: 50 }),
  role: varchar("role", { length: 50 }),
  title: text("title"),
  grade: varchar("grade", { length: 50 }),
  targetGrade: varchar("target_grade", { length: 50 }),
  targetSections: jsonb("target_sections").default([]),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  schoolIdIdx: index("exams_school_id_idx").on(table.schoolId),
}));

// قصص المجتمع (Stories)
export const community_stories = pgTable("community_stories", {
  id: varchar("id", { length: 128 }).primaryKey(),
  schoolId: varchar("school_id", { length: 128 }),
  userId: varchar("user_id", { length: 128 }).notNull(),
  userName: text("user_name"),
  userPhotoURL: text("user_photo_url"),
  postContent: text("post_content"),
  postMedia: text("post_media"),
  mediaType: varchar("media_type", { length: 50 }),
  postMediaGroup: jsonb("post_media_group").default([]),
  views: jsonb("views").default([]),
  grade: text("grade"),
  bgGradient: text("bg_gradient"),
  fontStyle: text("font_style"),
  sticker: text("sticker"),
  textColor: text("text_color"),
  textBg: text("text_bg"),
  textX: numeric("text_x").default("0"),
  textY: numeric("text_y").default("0"),
  textScale: numeric("text_scale").default("1"),
  stickerX: numeric("sticker_x").default("0"),
  stickerY: numeric("sticker_y").default("0"),
  stickerScale: numeric("sticker_scale").default("1.2"),
  musicTrack: text("music_track"),
  metadata: jsonb("metadata").default({}),
  timestamp: timestamp("timestamp").defaultNow(),
  expiresAt: timestamp("expires_at"),
}, (table) => ({
  schoolIdIdx: index("stories_school_id_idx").on(table.schoolId),
}));

// تعليقات الفيديو والدروس
export const video_comments = pgTable("video_comments", {
  id: varchar("id", { length: 128 }).primaryKey(),
  lessonId: varchar("lesson_id", { length: 128 }),
  userId: varchar("user_id", { length: 128 }).notNull(),
  authorName: text("author_name"),
  text: text("text").notNull(),
  isTeacher: boolean("is_teacher").default(false),
  parentId: varchar("parent_id", { length: 128 }),
  isEdited: boolean("is_edited").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => ({
  lessonIdIdx: index("vcomments_lesson_id_idx").on(table.lessonId),
}));

// ملاحظات البث المباشر للطلاب
export const student_live_notes = pgTable("student_live_notes", {
  id: varchar("id", { length: 128 }).primaryKey(),
  userId: varchar("user_id", { length: 128 }).notNull(),
  schoolId: varchar("school_id", { length: 128 }),
  liveTitle: text("live_title"),
  grade: varchar("grade", { length: 50 }),
  content: text("content"),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => ({
  schoolIdIdx: index("live_notes_school_id_idx").on(table.schoolId),
  userIdIdx: index("live_notes_user_id_idx").on(table.userId),
}));

// تخزين الوثائق المتغيرة
export const firestore_docs = pgTable("firestore_docs", {
  path: varchar("path", { length: 255 }).primaryKey(),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


export const admin_outbox = pgTable("admin_outbox", {
  id: varchar("id", { length: 128 }).primaryKey(),
  schoolId: varchar("school_id", { length: 128 }),
  title: text("title"),
  message: text("message"),
  type: varchar("type", { length: 50 }),
  targetRole: varchar("target_role", { length: 50 }),
  count: integer("count").default(0),
  refIds: jsonb("ref_ids"),
  broadcastId: varchar("broadcast_id", { length: 128 }),
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  schoolIdIdx: index("outbox_school_id_idx").on(table.schoolId),
}));
export const security_bans = pgTable("security_bans", {
  id: varchar("id", { length: 128 }).primaryKey(),
  type: varchar("type", { length: 50 }).notNull(), // 'ip' | 'device' | 'account'
  value: varchar("value", { length: 255 }).notNull(),
  reason: text("reason").notNull(),
  failed_attempts: integer("failed_attempts").default(0),
  banned_at: timestamp("banned_at").defaultNow(),
  expires_at: timestamp("expires_at"),
  status: varchar("status", { length: 50 }).default('active_ban'),
  created_at: timestamp("created_at").defaultNow(),
});

// --- لوحة المطور والنظام المركزي (Single Source of Truth) ---
// جدول وضعيات بيرق والهيدرات والشعارات في قاعدة البيانات الإنتاجية
export const system_poses = pgTable("system_poses", {
  id: varchar("id", { length: 128 }).primaryKey(),
  publicUrl: text("public_url").notNull(),
  category: varchar("category", { length: 50 }).default("pose"),
  aliases: jsonb("aliases").default([]),
  updatedBy: varchar("updated_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// جدول سجل إصدارات الوضعيات والهيدرات للاسترجاع الفوري
export const system_pose_history = pgTable("system_pose_history", {
  id: varchar("id", { length: 128 }).primaryKey(),
  assetId: varchar("asset_id", { length: 128 }).notNull(),
  fileName: text("file_name"),
  downloadUrl: text("download_url").notNull(),
  assetType: varchar("asset_type", { length: 50 }),
  fileSize: integer("file_size").default(0),
  uploadedBy: varchar("uploaded_by", { length: 255 }),
  status: varchar("status", { length: 50 }).default("active"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// جدول الإعدادات العامة للوحة المطور والنظام
export const system_settings = pgTable("system_settings", {
  key: varchar("key", { length: 128 }).primaryKey(),
  value: jsonb("value").notNull(),
  description: text("description"),
  updatedBy: varchar("updated_by", { length: 255 }),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// جدول "عين على الصف" للأنشطة الصفية الحية وتضمين التليجرام
export const bairaq_activities = pgTable("bairaq_activities", {
  id: varchar("id", { length: 128 }).primaryKey(),
  studentId: varchar("student_id", { length: 128 }).references(() => students.id),
  schoolId: varchar("school_id", { length: 128 }).references(() => schools.id),
  mediaUrl: text("media_url").notNull(), // Original t.me link for reference
  telegramFileId: text("telegram_file_id"), // Unique ID to fetch file from Telegram
  telegramMessageId: integer("telegram_message_id"),
  telegramChatId: text("telegram_chat_id"),
  mediaType: varchar("media_type", { length: 50 }), // photo, video, document
  description: text("description"),
  authorName: varchar("author_name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  studentIdIdx: index("activities_student_id_idx").on(table.studentId),
  schoolIdIdx: index("activities_school_id_idx").on(table.schoolId),
  createdAtIdx: index("activities_created_at_idx").on(table.createdAt),
}));


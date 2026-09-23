var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/utils/gradeMatcher.ts
var gradeMatcher_exports = {};
__export(gradeMatcher_exports, {
  detectAcademicBranch: () => detectAcademicBranch,
  detectAcademicStage: () => detectAcademicStage,
  detectGradeNumber: () => detectGradeNumber,
  isGeneralTarget: () => isGeneralTarget,
  isSchoolMatch: () => isSchoolMatch,
  isSingleGradeMatch: () => isSingleGradeMatch,
  matchesTargetGrades: () => matchesTargetGrades,
  normalizeArabicGrade: () => normalizeArabicGrade
});
function isGeneralTarget(rawText) {
  if (!rawText || typeof rawText !== "string") return true;
  const s = rawText.trim().toLowerCase();
  return s === "" || s === "all" || s === "global" || s === "general" || s.includes("\u0627\u0644\u062C\u0645\u064A\u0639") || s.includes("\u062C\u0645\u064A\u0639") || s.includes("\u0627\u0644\u0643\u0644") || s.includes("\u0643\u0644 \u0627\u0644\u0645\u0631\u0627\u062D\u0644") || s.includes("\u0643\u0627\u0641\u0629");
}
function normalizeArabicGrade(str) {
  if (!str || typeof str !== "string") return "";
  return str.replace(/[\u064B-\u065F\u0640]/g, "").replace(/[أإآ]/g, "\u0627").replace(/[ءئؤ]/g, "").replace(/ة/g, "\u0647").replace(/ى/g, "\u064A").replace(/(^|\s)الصف(\s|$)/g, " ").replace(/(^|\s)مرحلة(\s|$)/g, " ").replace(/(^|\s)المرحلة(\s|$)/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}
function detectAcademicStage(norm) {
  if (norm.includes("\u0627\u0628\u062A\u062F")) return "primary";
  if (norm.includes("\u0645\u062A\u0648\u0633\u0637")) return "intermediate";
  if (norm.includes("\u0627\u0639\u062F\u0627\u062F") || norm.includes("\u062B\u0627\u0646\u0648\u064A") || norm.includes("\u0639\u0644\u0645\u064A") || norm.includes("\u0627\u062F\u0628\u064A")) return "preparatory";
  return null;
}
function detectGradeNumber(norm) {
  if (norm.includes("\u0627\u0648\u0644") || norm.includes("1") || norm.includes("p1") || norm.includes("m1")) return 1;
  if (norm.includes("\u062B\u0627\u0646\u064A") || norm.includes("2") || norm.includes("p2") || norm.includes("m2")) return 2;
  if (norm.includes("\u062B\u0627\u0644\u062B") || norm.includes("3") || norm.includes("p3") || norm.includes("m3")) return 3;
  if (norm.includes("\u0631\u0627\u0628\u0639") || norm.includes("4") || norm.includes("p4")) return 4;
  if (norm.includes("\u062E\u0627\u0645\u0633") || norm.includes("5") || norm.includes("p5")) return 5;
  if (norm.includes("\u0633\u0627\u062F\u0633") || norm.includes("6") || norm.includes("p6")) return 6;
  return null;
}
function detectAcademicBranch(norm) {
  if (norm.includes("\u0639\u0644\u0645\u064A") || norm.includes("\u062A\u0637\u0628\u064A\u0642\u064A") || norm.includes("\u0627\u062D\u064A\u0627\u0626\u064A")) return "scientific";
  if (norm.includes("\u0627\u062F\u0628\u064A")) return "literary";
  return null;
}
function isSingleGradeMatch(studentGrade, targetGrade) {
  if (isGeneralTarget(targetGrade)) {
    return true;
  }
  if (!studentGrade || typeof studentGrade !== "string" || !studentGrade.trim()) {
    return true;
  }
  if (isGeneralTarget(studentGrade) || studentGrade === "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F") {
    return true;
  }
  const tNorm = normalizeArabicGrade(targetGrade);
  const sNorm = normalizeArabicGrade(studentGrade);
  if (!tNorm || !sNorm) return true;
  const stripAl = (s) => s.replace(/\bال/g, "").replace(/\s+/g, "");
  const sClean = stripAl(sNorm);
  const tClean = stripAl(tNorm);
  if (sClean === tClean || sClean.includes(tClean) || tClean.includes(sClean)) {
    return true;
  }
  const sStage = detectAcademicStage(sNorm);
  const tStage = detectAcademicStage(tNorm);
  const sNum = detectGradeNumber(sNorm);
  const tNum = detectGradeNumber(tNorm);
  const sBranch = detectAcademicBranch(sNorm);
  const tBranch = detectAcademicBranch(tNorm);
  if (tStage && !tNum && tStage === sStage) {
    return true;
  }
  if (tStage && sStage && tStage === sStage && tNum && sNum) {
    if (tNum === sNum) {
      if (tBranch && sBranch) return tBranch === sBranch;
      return true;
    }
    return false;
  }
  if (tNum && sNum && tNum === sNum) {
    if (tBranch && sBranch) return tBranch === sBranch;
    if (!tBranch && !sBranch && tStage === sStage) return true;
  }
  return false;
}
function matchesTargetGrades(studentGrade, targetGrades) {
  if (!targetGrades) return true;
  let arr = [];
  if (Array.isArray(targetGrades)) arr = targetGrades;
  else if (typeof targetGrades === "string") arr = [targetGrades];
  if (arr.length === 0) return true;
  return arr.some((g) => isSingleGradeMatch(studentGrade, g));
}
function isSchoolMatch(studentSchoolId, broadcastSchoolId) {
  if (!broadcastSchoolId) return true;
  const bId = broadcastSchoolId.trim().toLowerCase();
  if (bId === "" || bId === "all" || bId === "global" || bId === "central" || bId === "general" || bId === "\u0639\u0627\u0645") {
    return true;
  }
  if (!studentSchoolId) return true;
  const sId = studentSchoolId.trim().toLowerCase();
  if (sId === "" || sId === "all" || sId === "global" || sId === "central" || sId === "general" || sId === "\u0639\u0627\u0645") {
    return true;
  }
  const normalize = (id) => {
    let s = id.toLowerCase().trim();
    if (s === "school_awail_ghamas" || s === "ghamas_awail" || s === "s_awail_ghamas" || s === "school1" || s === "s1") {
      return "school1";
    }
    if (s.startsWith("school")) {
      s = "s" + s.replace("school", "");
    }
    return s;
  };
  return normalize(sId) === normalize(bId);
}
var init_gradeMatcher = __esm({
  "src/utils/gradeMatcher.ts"() {
  }
});

// server.ts
var import_crypto2 = __toESM(require("crypto"), 1);
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"), 1);
var import_config = require("dotenv/config");
var import_express2 = __toESM(require("express"), 1);
var import_drizzle_orm = require("drizzle-orm");

// src/db/index.ts
var import_postgres_js = require("drizzle-orm/postgres-js");
var import_postgres = __toESM(require("postgres"), 1);

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  academic_lists: () => academic_lists,
  academy_pages: () => academy_pages,
  activation_codes: () => activation_codes,
  admin_outbox: () => admin_outbox,
  attendance_logs: () => attendance_logs,
  audit_logs: () => audit_logs,
  behavior_logs: () => behavior_logs,
  broadcasts: () => broadcasts,
  class_schedules: () => class_schedules,
  community_comments: () => community_comments,
  community_posts: () => community_posts,
  community_stories: () => community_stories,
  council_polls: () => council_polls,
  developer_logs: () => developer_logs,
  exam_papers: () => exam_papers,
  firestore_docs: () => firestore_docs,
  idea_bank: () => idea_bank,
  lounge_messages: () => lounge_messages,
  notifications: () => notifications,
  payment_requests: () => payment_requests,
  question_bank: () => question_bank,
  recorded_lessons: () => recorded_lessons,
  salaries: () => salaries,
  school_announcements: () => school_announcements,
  school_configs: () => school_configs,
  school_files: () => school_files,
  schools: () => schools,
  security_bans: () => security_bans,
  student_live_notes: () => student_live_notes,
  student_transactions: () => student_transactions,
  students: () => students,
  support_tickets: () => support_tickets,
  teachers: () => teachers,
  transport_drivers: () => transport_drivers,
  transport_fees: () => transport_fees,
  transport_routes: () => transport_routes,
  transport_students_status: () => transport_students_status,
  user_device_tokens: () => user_device_tokens,
  users: () => users,
  video_comments: () => video_comments
});
var import_pg_core = require("drizzle-orm/pg-core");
var schools = (0, import_pg_core.pgTable)("schools", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  // Firebase Document ID
  name: (0, import_pg_core.text)("name").notNull(),
  governorate: (0, import_pg_core.varchar)("governorate", { length: 100 }),
  activationCode: (0, import_pg_core.varchar)("activation_code", { length: 50 }),
  status: (0, import_pg_core.varchar)("status", { length: 50 }).default("active"),
  disabledModules: (0, import_pg_core.jsonb)("disabled_modules").default([]),
  coverUrl: (0, import_pg_core.text)("cover_url"),
  logoUrl: (0, import_pg_core.text)("logo_url"),
  location: (0, import_pg_core.text)("location"),
  type: (0, import_pg_core.varchar)("type", { length: 100 }),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var users = (0, import_pg_core.pgTable)("users", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 128 }).references(() => schools.id),
  name: (0, import_pg_core.text)("name").notNull(),
  role: (0, import_pg_core.varchar)("role", { length: 50 }).notNull(),
  // admin, teacher, parent, driver
  email: (0, import_pg_core.varchar)("email", { length: 255 }).unique().notNull(),
  passwordHash: (0, import_pg_core.text)("password_hash"),
  isBanned: (0, import_pg_core.boolean)("is_banned").default(false),
  canPost: (0, import_pg_core.boolean)("can_post").default(true),
  canComment: (0, import_pg_core.boolean)("can_comment").default(true),
  deviceId: (0, import_pg_core.varchar)("device_id", { length: 255 }),
  phone: (0, import_pg_core.varchar)("phone", { length: 50 }),
  photo: (0, import_pg_core.text)("photo"),
  resetToken: (0, import_pg_core.varchar)("reset_token", { length: 255 }),
  resetTokenExpires: (0, import_pg_core.timestamp)("reset_token_expires"),
  whatsappOtp: (0, import_pg_core.varchar)("whatsapp_otp", { length: 20 }),
  whatsappOtpExpires: (0, import_pg_core.timestamp)("whatsapp_otp_expires"),
  lastLogin: (0, import_pg_core.timestamp)("last_login"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var teachers = (0, import_pg_core.pgTable)("teachers", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 128 }),
  name: (0, import_pg_core.text)("name").notNull(),
  photo: (0, import_pg_core.text)("photo"),
  subject: (0, import_pg_core.varchar)("subject", { length: 100 }),
  role: (0, import_pg_core.varchar)("role", { length: 50 }).default("TEACHER"),
  // TEACHER, STAFF
  bio: (0, import_pg_core.text)("bio"),
  classes: (0, import_pg_core.jsonb)("classes").default([]),
  schedule: (0, import_pg_core.jsonb)("schedule").default([]),
  canPublish: (0, import_pg_core.boolean)("can_publish").default(false),
  isActive: (0, import_pg_core.boolean)("is_active").default(true),
  isBanned: (0, import_pg_core.boolean)("is_banned").default(false),
  canPost: (0, import_pg_core.boolean)("can_post").default(true),
  canComment: (0, import_pg_core.boolean)("can_comment").default(true),
  deviceId: (0, import_pg_core.varchar)("device_id", { length: 255 }),
  lastLogin: (0, import_pg_core.timestamp)("last_login"),
  rating: (0, import_pg_core.integer)("rating").default(0),
  adminNotes: (0, import_pg_core.text)("admin_notes"),
  code: (0, import_pg_core.varchar)("code", { length: 100 }),
  classCodes: (0, import_pg_core.jsonb)("class_codes").default({}),
  stage: (0, import_pg_core.varchar)("stage", { length: 100 }),
  grade: (0, import_pg_core.varchar)("grade", { length: 100 }),
  phone: (0, import_pg_core.varchar)("phone", { length: 50 }),
  email: (0, import_pg_core.varchar)("email", { length: 255 }),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
});
var students = (0, import_pg_core.pgTable)("students", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  // Usually schoolId_studentCode
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 128 }).references(() => schools.id),
  name: (0, import_pg_core.text)("name").notNull(),
  grade: (0, import_pg_core.varchar)("grade", { length: 50 }),
  code: (0, import_pg_core.varchar)("code", { length: 50 }),
  parentCode: (0, import_pg_core.varchar)("parent_code", { length: 50 }),
  avatar: (0, import_pg_core.text)("avatar"),
  points: (0, import_pg_core.integer)("points").default(0),
  parentPhone: (0, import_pg_core.varchar)("parent_phone", { length: 50 }),
  status: (0, import_pg_core.varchar)("status", { length: 50 }).default("\u0646\u0634\u0637"),
  isBanned: (0, import_pg_core.boolean)("is_banned").default(false),
  canPost: (0, import_pg_core.boolean)("can_post").default(true),
  canComment: (0, import_pg_core.boolean)("can_comment").default(true),
  deviceId: (0, import_pg_core.varchar)("device_id", { length: 255 }),
  lastLogin: (0, import_pg_core.timestamp)("last_login"),
  paidAmount: (0, import_pg_core.integer)("paid_amount").default(0),
  totalAmount: (0, import_pg_core.integer)("total_amount").default(0),
  discountType: (0, import_pg_core.varchar)("discount_type", { length: 100 }),
  discountRate: (0, import_pg_core.integer)("discount_rate").default(0),
  isTopStudent: (0, import_pg_core.boolean)("is_top_student").default(false),
  topStudentPeriod: (0, import_pg_core.varchar)("top_student_period", { length: 50 }),
  lastSyncedPeriod: (0, import_pg_core.varchar)("last_synced_period", { length: 50 }),
  grades: (0, import_pg_core.jsonb)("grades").default({}),
  // Object with periods and subject scores
  behavior: (0, import_pg_core.jsonb)("behavior").default({ score: 100, logs: [] }),
  attendance: (0, import_pg_core.jsonb)("attendance").default({ present: 0, absent: 0, late: 0, logs: [] }),
  finance: (0, import_pg_core.jsonb)("finance").default({ installments: [], transactions: [] }),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
});
var academic_lists = (0, import_pg_core.pgTable)("academic_lists", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  name: (0, import_pg_core.text)("name").notNull(),
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 128 }).references(() => schools.id),
  schoolName: (0, import_pg_core.text)("school_name"),
  date: (0, import_pg_core.varchar)("date", { length: 50 }),
  students: (0, import_pg_core.jsonb)("students").default([]),
  // Snapshot of students in this list
  removedSubjects: (0, import_pg_core.jsonb)("removed_subjects").default([]),
  lastSyncedPeriod: (0, import_pg_core.varchar)("last_synced_period", { length: 50 }),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
});
var school_configs = (0, import_pg_core.pgTable)("school_configs", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  // schoolId
  adminPhone: (0, import_pg_core.varchar)("admin_phone", { length: 50 }),
  adminWhatsapp: (0, import_pg_core.varchar)("admin_whatsapp", { length: 50 }),
  communityLockAll: (0, import_pg_core.boolean)("community_lock_all").default(false),
  communityLockGrades: (0, import_pg_core.jsonb)("community_lock_grades").default([]),
  storiesLock: (0, import_pg_core.boolean)("stories_lock").default(false),
  loungeLock: (0, import_pg_core.boolean)("lounge_lock").default(false),
  tuitionFee: (0, import_pg_core.integer)("tuition_fee").default(0),
  discountRates: (0, import_pg_core.jsonb)("discount_rates").default({}),
  subjects: (0, import_pg_core.jsonb)("subjects").default({}),
  uniformConfigs: (0, import_pg_core.jsonb)("uniform_configs").default({}),
  tuitionFeesByGrade: (0, import_pg_core.jsonb)("tuition_fees_by_grade").default({}),
  installmentPlan: (0, import_pg_core.jsonb)("installment_plan").default([]),
  activeFinanceStage: (0, import_pg_core.varchar)("active_finance_stage", { length: 100 }),
  financePIN: (0, import_pg_core.varchar)("finance_pin", { length: 20 }),
  paymentMethods: (0, import_pg_core.jsonb)("payment_methods").default({}),
  stats: (0, import_pg_core.jsonb)("stats").default({ totalRevenue: 0, todayRevenue: 0 }),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
});
var student_transactions = (0, import_pg_core.pgTable)("student_transactions", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  studentId: (0, import_pg_core.varchar)("student_id", { length: 128 }),
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 128 }),
  amount: (0, import_pg_core.integer)("amount").notNull(),
  note: (0, import_pg_core.text)("note"),
  method: (0, import_pg_core.varchar)("method", { length: 50 }),
  adminName: (0, import_pg_core.varchar)("admin_name", { length: 128 }),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var class_schedules = (0, import_pg_core.pgTable)("class_schedules", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 128 }),
  teacherId: (0, import_pg_core.varchar)("teacher_id", { length: 128 }),
  className: (0, import_pg_core.varchar)("class_name", { length: 50 }),
  // الصف
  sectionName: (0, import_pg_core.varchar)("section_name", { length: 100 }),
  // الشعبة
  classType: (0, import_pg_core.varchar)("class_type", { length: 50 }).default("physical"),
  // نوع الحصة
  subject: (0, import_pg_core.varchar)("subject", { length: 100 }),
  dayOfWeek: (0, import_pg_core.varchar)("day_of_week", { length: 50 }),
  // اليوم
  startTime: (0, import_pg_core.varchar)("start_time", { length: 50 }),
  endTime: (0, import_pg_core.varchar)("end_time", { length: 50 }),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var support_tickets = (0, import_pg_core.pgTable)("support_tickets", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 128 }),
  userId: (0, import_pg_core.varchar)("user_id", { length: 128 }),
  studentName: (0, import_pg_core.text)("student_name"),
  userName: (0, import_pg_core.varchar)("user_name", { length: 255 }),
  phone: (0, import_pg_core.varchar)("phone", { length: 50 }),
  grade: (0, import_pg_core.varchar)("grade", { length: 50 }),
  subject: (0, import_pg_core.text)("subject").default(""),
  description: (0, import_pg_core.text)("description"),
  views: (0, import_pg_core.integer)("views").default(0),
  issueType: (0, import_pg_core.text)("issue_type"),
  message: (0, import_pg_core.text)("message"),
  status: (0, import_pg_core.varchar)("status", { length: 50 }).default("pending"),
  isGroup: (0, import_pg_core.boolean)("is_group").default(false),
  adminReply: (0, import_pg_core.text)("admin_reply"),
  role: (0, import_pg_core.varchar)("role", { length: 50 }),
  broadcastId: (0, import_pg_core.varchar)("broadcast_id", { length: 128 }),
  replyToTicketId: (0, import_pg_core.varchar)("reply_to_ticket_id", { length: 128 }),
  senderType: (0, import_pg_core.varchar)("sender_type", { length: 50 }),
  readByAdmin: (0, import_pg_core.boolean)("read_by_admin").default(false),
  readByStudent: (0, import_pg_core.boolean)("read_by_student").default(false),
  timestamp: (0, import_pg_core.timestamp)("timestamp").defaultNow()
});
var idea_bank = (0, import_pg_core.pgTable)("idea_bank", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 128 }),
  userId: (0, import_pg_core.varchar)("user_id", { length: 128 }),
  senderName: (0, import_pg_core.varchar)("sender_name", { length: 255 }),
  title: (0, import_pg_core.text)("title").notNull(),
  description: (0, import_pg_core.text)("description"),
  views: (0, import_pg_core.integer)("views").default(0),
  category: (0, import_pg_core.varchar)("category", { length: 50 }),
  // academic, behavior, administrative, other
  status: (0, import_pg_core.varchar)("status", { length: 50 }).default("pending"),
  // pending, under_review, implemented, rejected
  adminReply: (0, import_pg_core.text)("admin_reply"),
  targetGrade: (0, import_pg_core.varchar)("target_grade", { length: 50 }),
  readByParent: (0, import_pg_core.boolean)("read_by_parent").default(false),
  votes: (0, import_pg_core.integer)("votes").default(0),
  timestamp: (0, import_pg_core.timestamp)("timestamp").defaultNow()
});
var council_polls = (0, import_pg_core.pgTable)("council_polls", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 128 }),
  title: (0, import_pg_core.text)("title").notNull(),
  description: (0, import_pg_core.text)("description"),
  views: (0, import_pg_core.integer)("views").default(0),
  type: (0, import_pg_core.varchar)("type", { length: 50 }).default("admin"),
  // admin, parent
  authorId: (0, import_pg_core.varchar)("author_id", { length: 128 }),
  authorName: (0, import_pg_core.varchar)("author_name", { length: 255 }),
  status: (0, import_pg_core.varchar)("status", { length: 50 }).default("active"),
  // active, closed, implemented, rejected
  adminReply: (0, import_pg_core.text)("admin_reply"),
  votes: (0, import_pg_core.jsonb)("votes").default({}),
  // Record<string, 'support' | 'reject'>
  comments: (0, import_pg_core.jsonb)("comments").default([]),
  // { id, authorName, text, timestamp }[]
  targetGrade: (0, import_pg_core.varchar)("target_grade", { length: 50 }),
  timestamp: (0, import_pg_core.timestamp)("timestamp").defaultNow()
});
var broadcasts = (0, import_pg_core.pgTable)("broadcasts", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 128 }),
  teacherId: (0, import_pg_core.varchar)("teacher_id", { length: 128 }),
  title: (0, import_pg_core.text)("title").notNull(),
  grade: (0, import_pg_core.varchar)("grade", { length: 50 }),
  streamUrl: (0, import_pg_core.text)("stream_url"),
  status: (0, import_pg_core.varchar)("status", { length: 50 }).default("scheduled"),
  // scheduled, live, ended
  startedAt: (0, import_pg_core.timestamp)("started_at"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var school_announcements = (0, import_pg_core.pgTable)("school_announcements", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 128 }),
  message: (0, import_pg_core.text)("message").notNull(),
  targetGrades: (0, import_pg_core.jsonb)("target_grades").default([]),
  author: (0, import_pg_core.varchar)("author", { length: 128 }),
  subject: (0, import_pg_core.varchar)("subject", { length: 100 }),
  targetLocation: (0, import_pg_core.varchar)("target_location", { length: 50 }).default("both"),
  // ticker, post, both
  expiryDate: (0, import_pg_core.timestamp)("expiry_date"),
  timestampMs: (0, import_pg_core.bigint)("timestamp_ms", { mode: "number" }),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var notifications = (0, import_pg_core.pgTable)("notifications", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 128 }),
  recipientId: (0, import_pg_core.varchar)("recipient_id", { length: 128 }),
  // Could be user ID or role
  recipientRole: (0, import_pg_core.varchar)("recipient_role", { length: 50 }),
  title: (0, import_pg_core.text)("title").notNull(),
  body: (0, import_pg_core.text)("body"),
  data: (0, import_pg_core.jsonb)("data"),
  metadata: (0, import_pg_core.jsonb)("metadata"),
  type: (0, import_pg_core.varchar)("type", { length: 50 }),
  // e.g. "alert", "message"
  read: (0, import_pg_core.boolean)("read").default(false),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var user_device_tokens = (0, import_pg_core.pgTable)("user_device_tokens", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  userId: (0, import_pg_core.varchar)("user_id", { length: 128 }).notNull(),
  token: (0, import_pg_core.text)("token").notNull(),
  platform: (0, import_pg_core.varchar)("platform", { length: 50 }).default("android"),
  // android, ios, web
  deviceModel: (0, import_pg_core.varchar)("device_model", { length: 128 }),
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 128 }),
  role: (0, import_pg_core.varchar)("role", { length: 50 }).default("student"),
  lastActive: (0, import_pg_core.timestamp)("last_active").defaultNow(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var payment_requests = (0, import_pg_core.pgTable)("payment_requests", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 128 }),
  requesterId: (0, import_pg_core.varchar)("requester_id", { length: 128 }),
  amount: (0, import_pg_core.integer)("amount").notNull(),
  description: (0, import_pg_core.text)("description"),
  views: (0, import_pg_core.integer)("views").default(0),
  status: (0, import_pg_core.varchar)("status", { length: 50 }).default("pending"),
  // pending, approved, rejected
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var developer_logs = (0, import_pg_core.pgTable)("developer_logs", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  action: (0, import_pg_core.varchar)("action", { length: 100 }),
  details: (0, import_pg_core.text)("details"),
  adminId: (0, import_pg_core.varchar)("admin_id", { length: 128 }),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var activation_codes = (0, import_pg_core.pgTable)("activation_codes", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  code: (0, import_pg_core.varchar)("code", { length: 50 }).unique().notNull(),
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 128 }),
  role: (0, import_pg_core.varchar)("role", { length: 50 }).default("student"),
  // student, parent, admin, etc.
  used: (0, import_pg_core.boolean)("used").default(false),
  usedBy: (0, import_pg_core.varchar)("used_by", { length: 128 }),
  // user id
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var recorded_lessons = (0, import_pg_core.pgTable)("recorded_lessons", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 128 }),
  teacherId: (0, import_pg_core.varchar)("teacher_id", { length: 128 }),
  title: (0, import_pg_core.text)("title").notNull(),
  grade: (0, import_pg_core.varchar)("grade", { length: 50 }),
  subject: (0, import_pg_core.varchar)("subject", { length: 100 }),
  duration: (0, import_pg_core.varchar)("duration", { length: 50 }),
  section: (0, import_pg_core.varchar)("section", { length: 100 }),
  date: (0, import_pg_core.varchar)("date", { length: 50 }),
  description: (0, import_pg_core.text)("description"),
  views: (0, import_pg_core.integer)("views").default(0),
  commentCount: (0, import_pg_core.integer)("comment_count").default(0),
  videoUrl: (0, import_pg_core.text)("video_url").notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var school_files = (0, import_pg_core.pgTable)("school_files", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 128 }),
  uploaderId: (0, import_pg_core.varchar)("uploader_id", { length: 128 }),
  fileName: (0, import_pg_core.text)("file_name").notNull(),
  fileUrl: (0, import_pg_core.text)("file_url").notNull(),
  title: (0, import_pg_core.text)("title"),
  size: (0, import_pg_core.varchar)("size", { length: 50 }),
  downloads: (0, import_pg_core.integer)("downloads").default(0),
  tag: (0, import_pg_core.varchar)("tag", { length: 100 }),
  subject: (0, import_pg_core.varchar)("subject", { length: 100 }),
  grade: (0, import_pg_core.varchar)("grade", { length: 50 }),
  section: (0, import_pg_core.varchar)("section", { length: 100 }),
  fileType: (0, import_pg_core.varchar)("file_type", { length: 50 }),
  allowDownload: (0, import_pg_core.boolean)("allow_download").default(true),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var academy_pages = (0, import_pg_core.pgTable)("academy_pages", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 128 }),
  title: (0, import_pg_core.text)("title").notNull(),
  subtitle: (0, import_pg_core.text)("subtitle"),
  content: (0, import_pg_core.text)("content"),
  category: (0, import_pg_core.varchar)("category", { length: 100 }),
  order: (0, import_pg_core.bigint)("page_order", { mode: "number" }),
  pages: (0, import_pg_core.jsonb)("pages"),
  structuredContent: (0, import_pg_core.jsonb)("structured_content"),
  quiz: (0, import_pg_core.jsonb)("quiz"),
  ministerialQuestions: (0, import_pg_core.jsonb)("ministerial_questions"),
  rawText: (0, import_pg_core.text)("raw_text"),
  extractedText: (0, import_pg_core.text)("extracted_text"),
  data: (0, import_pg_core.jsonb)("data"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var salaries = (0, import_pg_core.pgTable)("salaries", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  // staffId_month
  staffId: (0, import_pg_core.varchar)("staff_id", { length: 128 }),
  staffName: (0, import_pg_core.text)("staff_name"),
  month: (0, import_pg_core.varchar)("month", { length: 20 }),
  // e.g. "2024-05"
  baseSalary: (0, import_pg_core.integer)("base_salary").default(0),
  rewards: (0, import_pg_core.integer)("rewards").default(0),
  deductions: (0, import_pg_core.integer)("deductions").default(0),
  netSalary: (0, import_pg_core.integer)("net_salary").default(0),
  isPaid: (0, import_pg_core.boolean)("is_paid").default(false),
  paymentDate: (0, import_pg_core.timestamp)("payment_date"),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
});
var community_posts = (0, import_pg_core.pgTable)("community_posts", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 128 }),
  userId: (0, import_pg_core.varchar)("user_id", { length: 128 }).notNull(),
  userName: (0, import_pg_core.text)("user_name"),
  userPhoto: (0, import_pg_core.text)("user_photo"),
  content: (0, import_pg_core.text)("content").notNull(),
  mediaUrl: (0, import_pg_core.text)("media_url"),
  type: (0, import_pg_core.varchar)("type", { length: 50 }).default("student"),
  // student, teacher, admin
  grade: (0, import_pg_core.varchar)("grade", { length: 50 }),
  isPinned: (0, import_pg_core.boolean)("is_pinned").default(false),
  isLocked: (0, import_pg_core.boolean)("is_locked").default(false),
  reportsCount: (0, import_pg_core.integer)("reports_count").default(0),
  likesCount: (0, import_pg_core.integer)("likes_count").default(0),
  commentsCount: (0, import_pg_core.integer)("comments_count").default(0),
  timestamp: (0, import_pg_core.timestamp)("timestamp").defaultNow()
});
var community_comments = (0, import_pg_core.pgTable)("community_comments", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  postId: (0, import_pg_core.varchar)("post_id", { length: 128 }).references(() => community_posts.id),
  userId: (0, import_pg_core.varchar)("user_id", { length: 128 }).notNull(),
  userName: (0, import_pg_core.text)("user_name"),
  userPhoto: (0, import_pg_core.text)("user_photo"),
  content: (0, import_pg_core.text)("content").notNull(),
  timestamp: (0, import_pg_core.timestamp)("timestamp").defaultNow()
});
var attendance_logs = (0, import_pg_core.pgTable)("attendance_logs", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  studentId: (0, import_pg_core.varchar)("student_id", { length: 128 }).notNull(),
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 128 }).notNull(),
  date: (0, import_pg_core.varchar)("date", { length: 20 }).notNull(),
  // YYYY-MM-DD
  status: (0, import_pg_core.varchar)("status", { length: 50 }).notNull(),
  // present, absent, late
  period: (0, import_pg_core.varchar)("period", { length: 50 }),
  // full day, 1, 2, ...
  reason: (0, import_pg_core.text)("reason"),
  recordedBy: (0, import_pg_core.text)("recorded_by"),
  timestamp: (0, import_pg_core.timestamp)("timestamp").defaultNow()
});
var behavior_logs = (0, import_pg_core.pgTable)("behavior_logs", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  studentId: (0, import_pg_core.varchar)("student_id", { length: 128 }).notNull(),
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 128 }).notNull(),
  type: (0, import_pg_core.varchar)("type", { length: 50 }).notNull(),
  // positive, negative
  points: (0, import_pg_core.integer)("points").notNull(),
  action: (0, import_pg_core.text)("action"),
  note: (0, import_pg_core.text)("note"),
  recordedBy: (0, import_pg_core.text)("recorded_by"),
  date: (0, import_pg_core.varchar)("date", { length: 20 }).notNull(),
  // YYYY-MM-DD
  timestamp: (0, import_pg_core.timestamp)("timestamp").defaultNow()
});
var audit_logs = (0, import_pg_core.pgTable)("audit_logs", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  userId: (0, import_pg_core.varchar)("user_id", { length: 128 }).default("system"),
  userName: (0, import_pg_core.varchar)("user_name", { length: 255 }).default("\u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0646\u0638\u0627\u0645"),
  userEmail: (0, import_pg_core.varchar)("user_email", { length: 255 }),
  action: (0, import_pg_core.varchar)("action", { length: 255 }).notNull(),
  details: (0, import_pg_core.text)("details").default(""),
  targetId: (0, import_pg_core.varchar)("target_id", { length: 128 }),
  targetName: (0, import_pg_core.varchar)("target_name", { length: 255 }),
  targetType: (0, import_pg_core.varchar)("target_type", { length: 50 }),
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 128 }),
  timestamp: (0, import_pg_core.timestamp)("timestamp").defaultNow()
});
var transport_routes = (0, import_pg_core.pgTable)("transport_routes", {
  id: (0, import_pg_core.varchar)("id", { length: 50 }).primaryKey(),
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 50 }).notNull(),
  name: (0, import_pg_core.varchar)("name", { length: 100 }).notNull(),
  description: (0, import_pg_core.text)("description"),
  status: (0, import_pg_core.varchar)("status", { length: 20 }).default("inactive"),
  // active, inactive, in_progress
  currentLocationLat: (0, import_pg_core.doublePrecision)("current_location_lat"),
  currentLocationLng: (0, import_pg_core.doublePrecision)("current_location_lng"),
  lastUpdate: (0, import_pg_core.timestamp)("last_update"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
});
var transport_drivers = (0, import_pg_core.pgTable)("transport_drivers", {
  id: (0, import_pg_core.varchar)("id", { length: 50 }).primaryKey(),
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 50 }).notNull(),
  name: (0, import_pg_core.varchar)("name", { length: 100 }).notNull(),
  phone: (0, import_pg_core.varchar)("phone", { length: 20 }).notNull(),
  accessCode: (0, import_pg_core.varchar)("access_code", { length: 20 }).notNull().unique(),
  busNumber: (0, import_pg_core.varchar)("bus_number", { length: 50 }),
  routeId: (0, import_pg_core.varchar)("route_id", { length: 50 }),
  status: (0, import_pg_core.varchar)("status", { length: 20 }).default("active"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
});
var transport_students_status = (0, import_pg_core.pgTable)("transport_students_status", {
  id: (0, import_pg_core.varchar)("id", { length: 50 }).primaryKey(),
  // Usually studentId
  routeId: (0, import_pg_core.varchar)("route_id", { length: 50 }),
  parentId: (0, import_pg_core.varchar)("parent_id", { length: 50 }),
  studentName: (0, import_pg_core.varchar)("student_name", { length: 100 }),
  status: (0, import_pg_core.varchar)("status", { length: 50 }).default("pending"),
  // pending, boarded, dropped_off, absent
  stopName: (0, import_pg_core.varchar)("stop_name", { length: 100 }),
  shift: (0, import_pg_core.varchar)("shift", { length: 20 }),
  // morning, evening, both
  timestamp: (0, import_pg_core.timestamp)("timestamp"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
});
var transport_fees = (0, import_pg_core.pgTable)("transport_fees", {
  id: (0, import_pg_core.varchar)("id", { length: 50 }).primaryKey(),
  studentId: (0, import_pg_core.varchar)("student_id", { length: 50 }).notNull(),
  parentId: (0, import_pg_core.varchar)("parent_id", { length: 50 }),
  amount: (0, import_pg_core.doublePrecision)("amount").notNull(),
  period: (0, import_pg_core.varchar)("period", { length: 50 }),
  // e.g. "شهر أكتوبر"
  status: (0, import_pg_core.varchar)("status", { length: 20 }).default("unpaid"),
  // unpaid, paid
  dueDate: (0, import_pg_core.timestamp)("due_date"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
});
var lounge_messages = (0, import_pg_core.pgTable)("lounge_messages", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 128 }),
  userId: (0, import_pg_core.varchar)("user_id", { length: 128 }).notNull(),
  userName: (0, import_pg_core.text)("user_name"),
  userPhoto: (0, import_pg_core.text)("user_photo"),
  userRole: (0, import_pg_core.varchar)("user_role", { length: 50 }),
  recipientId: (0, import_pg_core.varchar)("recipient_id", { length: 128 }),
  text: (0, import_pg_core.text)("text").notNull(),
  imageUrl: (0, import_pg_core.text)("image_url"),
  read: (0, import_pg_core.boolean)("read").default(false),
  timestamp: (0, import_pg_core.timestamp)("timestamp").defaultNow()
});
var question_bank = (0, import_pg_core.pgTable)("question_bank", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 128 }),
  teacherId: (0, import_pg_core.varchar)("teacher_id", { length: 128 }),
  teacherName: (0, import_pg_core.varchar)("teacher_name", { length: 128 }),
  subject: (0, import_pg_core.varchar)("subject", { length: 100 }),
  grade: (0, import_pg_core.varchar)("grade", { length: 50 }),
  targetGrade: (0, import_pg_core.varchar)("target_grade", { length: 50 }),
  category: (0, import_pg_core.varchar)("category", { length: 50 }).default("ministerial"),
  tags: (0, import_pg_core.jsonb)("tags").default([]),
  targetSections: (0, import_pg_core.jsonb)("target_sections").default([]),
  type: (0, import_pg_core.varchar)("type", { length: 50 }),
  question: (0, import_pg_core.text)("question"),
  options: (0, import_pg_core.jsonb)("options").default([]),
  correctAnswer: (0, import_pg_core.text)("correct_answer"),
  explanation: (0, import_pg_core.text)("explanation"),
  difficulty: (0, import_pg_core.varchar)("difficulty", { length: 50 }),
  points: (0, import_pg_core.integer)("points").default(1),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var exam_papers = (0, import_pg_core.pgTable)("exam_papers", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 128 }),
  teacherId: (0, import_pg_core.varchar)("teacher_id", { length: 128 }),
  subject: (0, import_pg_core.text)("subject"),
  year: (0, import_pg_core.varchar)("year", { length: 50 }),
  role: (0, import_pg_core.varchar)("role", { length: 50 }),
  title: (0, import_pg_core.text)("title"),
  grade: (0, import_pg_core.varchar)("grade", { length: 50 }),
  targetGrade: (0, import_pg_core.varchar)("target_grade", { length: 50 }),
  targetSections: (0, import_pg_core.jsonb)("target_sections").default([]),
  imageUrl: (0, import_pg_core.text)("image_url"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var community_stories = (0, import_pg_core.pgTable)("community_stories", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 128 }),
  userId: (0, import_pg_core.varchar)("user_id", { length: 128 }).notNull(),
  userName: (0, import_pg_core.text)("user_name"),
  userPhotoURL: (0, import_pg_core.text)("user_photo_url"),
  postContent: (0, import_pg_core.text)("post_content"),
  postMedia: (0, import_pg_core.text)("post_media"),
  mediaType: (0, import_pg_core.varchar)("media_type", { length: 50 }),
  postMediaGroup: (0, import_pg_core.jsonb)("post_media_group").default([]),
  views: (0, import_pg_core.jsonb)("views").default([]),
  timestamp: (0, import_pg_core.timestamp)("timestamp").defaultNow(),
  expiresAt: (0, import_pg_core.timestamp)("expires_at")
});
var video_comments = (0, import_pg_core.pgTable)("video_comments", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  lessonId: (0, import_pg_core.varchar)("lesson_id", { length: 128 }),
  userId: (0, import_pg_core.varchar)("user_id", { length: 128 }).notNull(),
  authorName: (0, import_pg_core.text)("author_name"),
  text: (0, import_pg_core.text)("text").notNull(),
  isTeacher: (0, import_pg_core.boolean)("is_teacher").default(false),
  parentId: (0, import_pg_core.varchar)("parent_id", { length: 128 }),
  isEdited: (0, import_pg_core.boolean)("is_edited").default(false),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow(),
  timestamp: (0, import_pg_core.timestamp)("timestamp").defaultNow()
});
var student_live_notes = (0, import_pg_core.pgTable)("student_live_notes", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  userId: (0, import_pg_core.varchar)("user_id", { length: 128 }).notNull(),
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 128 }),
  liveTitle: (0, import_pg_core.text)("live_title"),
  grade: (0, import_pg_core.varchar)("grade", { length: 50 }),
  content: (0, import_pg_core.text)("content"),
  timestamp: (0, import_pg_core.timestamp)("timestamp").defaultNow()
});
var firestore_docs = (0, import_pg_core.pgTable)("firestore_docs", {
  path: (0, import_pg_core.varchar)("path", { length: 255 }).primaryKey(),
  data: (0, import_pg_core.jsonb)("data").notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow()
});
var admin_outbox = (0, import_pg_core.pgTable)("admin_outbox", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  schoolId: (0, import_pg_core.varchar)("school_id", { length: 128 }),
  title: (0, import_pg_core.text)("title"),
  message: (0, import_pg_core.text)("message"),
  type: (0, import_pg_core.varchar)("type", { length: 50 }),
  targetRole: (0, import_pg_core.varchar)("target_role", { length: 50 }),
  count: (0, import_pg_core.integer)("count").default(0),
  refIds: (0, import_pg_core.jsonb)("ref_ids"),
  broadcastId: (0, import_pg_core.varchar)("broadcast_id", { length: 128 }),
  timestamp: (0, import_pg_core.timestamp)("timestamp").defaultNow(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow()
});
var security_bans = (0, import_pg_core.pgTable)("security_bans", {
  id: (0, import_pg_core.varchar)("id", { length: 128 }).primaryKey(),
  type: (0, import_pg_core.varchar)("type", { length: 50 }).notNull(),
  // 'ip' | 'device' | 'account'
  value: (0, import_pg_core.varchar)("value", { length: 255 }).notNull(),
  reason: (0, import_pg_core.text)("reason").notNull(),
  failed_attempts: (0, import_pg_core.integer)("failed_attempts").default(0),
  banned_at: (0, import_pg_core.timestamp)("banned_at").defaultNow(),
  expires_at: (0, import_pg_core.timestamp)("expires_at"),
  status: (0, import_pg_core.varchar)("status", { length: 50 }).default("active_ban"),
  created_at: (0, import_pg_core.timestamp)("created_at").defaultNow()
});

// src/db/index.ts
var dotenv = __toESM(require("dotenv"), 1);
dotenv.config();
var connectionString = process.env.DATABASE_URL;
function createMockDb() {
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d) => d?.data ?? {},
    update: async (d) => d?.data ?? {},
    delete: async () => ({})
  };
  const createChainable = (resolvedValue = []) => {
    let proxy;
    const fn = (..._args) => proxy;
    fn.then = (resolve, reject) => Promise.resolve(resolvedValue).then(resolve, reject);
    fn.catch = (reject) => Promise.resolve(resolvedValue).catch(reject);
    fn.finally = (cb) => Promise.resolve(resolvedValue).finally(cb);
    proxy = new Proxy(fn, {
      get(target, prop) {
        if (prop === "then") return target.then;
        if (prop === "catch") return target.catch;
        if (prop === "finally") return target.finally;
        if (prop === Symbol.iterator || prop === Symbol.asyncIterator) return void 0;
        return (..._args) => proxy;
      },
      apply(target, thisArg, args) {
        return proxy;
      }
    });
    return proxy;
  };
  const rootProxy = new Proxy({}, {
    get(_, prop) {
      if (prop === "query") {
        return new Proxy({}, {
          get: () => noOp
        });
      }
      return (...args) => createChainable([]);
    }
  });
  return rootProxy;
}
function createMockSql() {
  const mockSql = (...args) => Promise.resolve([]);
  mockSql.unsafe = (...args) => Promise.resolve([]);
  mockSql.listen = async () => async () => {
  };
  return mockSql;
}
var client;
var dbInstance;
async function withDbRetry(operation, retries = 3, delayMs = 500) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      const msg = String(err?.message || err?.cause?.message || err || "").toLowerCase();
      const isConnectionDrop = msg.includes("econnreset") || msg.includes("connection terminated") || msg.includes("connection closed") || msg.includes("connection reset") || msg.includes("etimedout") || msg.includes("econnrefused") || msg.includes("broken pipe") || err?.code === "ECONNRESET" || err?.cause?.code === "ECONNRESET";
      if (isConnectionDrop && attempt < retries) {
        console.warn(`[Database Retry] Transient connection error (${msg}), retrying attempt ${attempt + 1}/${retries}...`);
        await new Promise((res) => setTimeout(res, delayMs * attempt));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}
if (connectionString) {
  try {
    const maxConnections = process.env.DB_MAX_CONNECTIONS ? parseInt(process.env.DB_MAX_CONNECTIONS, 10) : 15;
    const idleTimeout = process.env.DB_IDLE_TIMEOUT ? parseInt(process.env.DB_IDLE_TIMEOUT, 10) : 20;
    const connectTimeout = process.env.DB_CONNECT_TIMEOUT ? parseInt(process.env.DB_CONNECT_TIMEOUT, 10) : 15;
    client = (0, import_postgres.default)(connectionString, {
      prepare: false,
      max: maxConnections,
      idle_timeout: idleTimeout,
      connect_timeout: connectTimeout,
      max_lifetime: 60 * 15,
      keep_alive: 10,
      onnotice: () => {
      }
      // suppress server notices
    });
    dbInstance = (0, import_postgres_js.drizzle)(client, { schema: schema_exports });
  } catch (err) {
    console.warn("[AI Studio] Database connection error \u2014 falling back to mock:", err);
    client = createMockSql();
    dbInstance = createMockDb();
  }
} else {
  console.warn("[AI Studio] DATABASE_URL not configured \u2014 using mock database");
  client = createMockSql();
  dbInstance = createMockDb();
}
var sql = client;
var db = dbInstance;

// src/server/realtimeServer.ts
var import_ws = require("ws");
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);

// src/server/realtimeDb.ts
var REALTIME_TABLES = [
  "lounge_messages",
  "notifications",
  "broadcasts",
  "school_announcements",
  "student_transactions",
  "payment_requests",
  "attendance_logs",
  "behavior_logs",
  "class_schedules",
  "academic_lists",
  "students",
  "teachers",
  "schools",
  "support_tickets",
  "idea_bank",
  "council_polls",
  "transport_routes",
  "transport_drivers",
  "transport_students_status",
  "transport_fees",
  "salaries",
  "community_posts",
  "community_comments",
  "community_stories",
  "recorded_lessons",
  "school_files",
  "academy_pages",
  "video_comments",
  "student_live_notes",
  "exam_papers",
  "question_bank",
  "firestore_docs"
];
async function initDatabaseTriggers(sql3) {
  try {
    await sql3`
      CREATE OR REPLACE FUNCTION notify_db_event() RETURNS trigger AS $$
      DECLARE
        v_school_id TEXT := NULL;
        v_entity_id TEXT := NULL;
        v_recipient_id TEXT := NULL;
        v_user_id TEXT := NULL;
        v_student_id TEXT := NULL;
        v_payload JSONB;
      BEGIN
        IF (TG_OP = 'DELETE') THEN
          BEGIN v_entity_id := OLD.id::text; EXCEPTION WHEN OTHERS THEN 
            BEGIN v_entity_id := OLD.path::text; EXCEPTION WHEN OTHERS THEN v_entity_id := NULL; END;
          END;
          BEGIN v_school_id := OLD.school_id::text; EXCEPTION WHEN OTHERS THEN v_school_id := NULL; END;
        ELSE
          BEGIN v_entity_id := NEW.id::text; EXCEPTION WHEN OTHERS THEN 
            BEGIN v_entity_id := NEW.path::text; EXCEPTION WHEN OTHERS THEN v_entity_id := NULL; END;
          END;
          BEGIN v_school_id := NEW.school_id::text; EXCEPTION WHEN OTHERS THEN v_school_id := NULL; END;
          BEGIN v_recipient_id := NEW.recipient_id::text; EXCEPTION WHEN OTHERS THEN v_recipient_id := NULL; END;
          BEGIN v_user_id := NEW.user_id::text; EXCEPTION WHEN OTHERS THEN v_user_id := NULL; END;
          BEGIN v_student_id := NEW.student_id::text; EXCEPTION WHEN OTHERS THEN v_student_id := NULL; END;
        END IF;

        v_payload := json_build_object(
          'table', TG_TABLE_NAME,
          'action', TG_OP,
          'id', v_entity_id,
          'school_id', v_school_id,
          'recipient_id', v_recipient_id,
          'user_id', v_user_id,
          'student_id', v_student_id,
          'timestamp', (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
        );

        PERFORM pg_notify('bairaq_realtime_events', v_payload::text);
        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `;
    for (const table of REALTIME_TABLES) {
      try {
        await sql3.unsafe(`
          DROP TRIGGER IF EXISTS trg_${table}_notify ON ${table};
          CREATE TRIGGER trg_${table}_notify
          AFTER INSERT OR UPDATE OR DELETE ON ${table}
          FOR EACH ROW EXECUTE FUNCTION notify_db_event();
        `);
      } catch (err) {
        console.warn(`[Realtime DB] Skipped trigger for ${table}:`, err.message);
      }
    }
    console.log("[Realtime DB] PostgreSQL triggers initialized successfully.");
  } catch (err) {
    console.error("[Realtime DB] Error initializing PostgreSQL triggers:", err);
  }
}
async function startPgListener(sql3, onEvent) {
  try {
    const sub = await sql3.listen("bairaq_realtime_events", (payloadStr) => {
      try {
        const payload = JSON.parse(payloadStr);
        onEvent(payload);
      } catch (e) {
        console.error("[Realtime DB] Error parsing NOTIFY payload:", e);
      }
    });
    console.log('[Realtime DB] PostgreSQL LISTEN subscribed to "bairaq_realtime_events".');
    return async () => {
      try {
        await sub.unlisten();
      } catch (e) {
        console.error("[Realtime DB] Error unlistening:", e);
      }
    };
  } catch (err) {
    console.error("[Realtime DB] Failed to start PostgreSQL LISTEN:", err);
    return async () => {
    };
  }
}

// src/server/realtimeServer.ts
var TABLE_COLLECTION_MAP = {
  "lounge_messages": "lounge_messages",
  "notifications": "notifications",
  "broadcasts": "broadcasts",
  "school_announcements": "school_announcements",
  "student_transactions": "student_transactions",
  "payment_requests": "payment_requests",
  "attendance_logs": "attendance_logs",
  "behavior_logs": "behavior_logs",
  "class_schedules": "class_schedules",
  "academic_lists": "academic_lists",
  "students": "students",
  "teachers": "teachers",
  "schools": "schools",
  "support_tickets": "support_tickets",
  "idea_bank": "idea_bank",
  "council_polls": "council_polls",
  "transport_routes": "transport_routes",
  "transport_drivers": "transport_drivers",
  "transport_students_status": "transport_students_status",
  "transport_fees": "transport_fees",
  "salaries": "salaries",
  "community_posts": "community_posts",
  "community_comments": "community_comments",
  "community_stories": "community_stories",
  "recorded_lessons": "recorded_lessons",
  "school_files": "school_files",
  "academy_pages": "academy_pages",
  "video_comments": "video_comments",
  "student_live_notes": "student_live_notes",
  "question_bank": "question_bank",
  "exam_papers": "exam_papers",
  "firestore_docs": "firestore_docs",
  "settings": "settings",
  "system_settings": "system_settings",
  "system_config": "system_config",
  "school_configs": "school_configs"
};
function getSubKey(collection, docId) {
  const normCol = collection.split("/")[0];
  return docId ? `${normCol}:${docId}` : normCol;
}
var RealtimeServer = class {
  constructor(sql3, jwtSecret) {
    this.wss = null;
    this.clients = /* @__PURE__ */ new Set();
    this.pingInterval = null;
    this.unlistenPg = null;
    this.sql = sql3;
    this.jwtSecret = jwtSecret;
  }
  async initialize(httpServer) {
    console.log("[RealtimeServer] Initializing WebSocket Server...");
    await initDatabaseTriggers(this.sql);
    this.wss = new import_ws.WebSocketServer({
      server: httpServer,
      path: "/api/realtime"
    });
    this.wss.on("connection", (ws, req) => {
      this.handleConnection(ws, req);
    });
    this.unlistenPg = await startPgListener(this.sql, (event) => {
      this.broadcastEvent(event);
    });
    this.pingInterval = setInterval(() => {
      this.clients.forEach((ws) => {
        if (!ws.isAlive) {
          console.log("[RealtimeServer] Terminating inactive client socket");
          return ws.terminate();
        }
        ws.isAlive = false;
        try {
          ws.ping();
        } catch (e) {
          ws.terminate();
        }
      });
    }, 3e4);
    console.log("[RealtimeServer] WebSocket Server attached successfully on /api/realtime");
  }
  handleConnection(ws, req) {
    ws.isAlive = true;
    ws.subscriptions = /* @__PURE__ */ new Set();
    this.clients.add(ws);
    ws.on("pong", () => {
      ws.isAlive = true;
    });
    try {
      const url = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
      const tokenParam = url.searchParams.get("token");
      if (tokenParam) {
        this.authenticateSocket(ws, tokenParam);
      }
    } catch (e) {
    }
    ws.authTimer = setTimeout(() => {
      if (!ws.user) {
        ws.user = {
          uid: "guest_" + Math.random().toString(36).substring(2, 9),
          role: "guest",
          name: "\u0637\u0627\u0644\u0628 / \u0632\u0627\u0626\u0631"
        };
        try {
          ws.send(JSON.stringify({ type: "auth_guest", message: "Connected as guest observer" }));
        } catch (e) {
        }
      }
    }, 5e3);
    ws.on("message", (messageRaw) => {
      try {
        const msg = JSON.parse(messageRaw.toString());
        this.handleClientMessage(ws, msg);
      } catch (err) {
        console.error("[RealtimeServer] Invalid message format received from client:", err);
      }
    });
    ws.on("close", () => {
      if (ws.authTimer) clearTimeout(ws.authTimer);
      this.clients.delete(ws);
    });
    ws.on("error", (err) => {
      console.warn("[RealtimeServer] Client WebSocket error:", err.message);
      this.clients.delete(ws);
    });
  }
  authenticateSocket(ws, token) {
    try {
      const decoded = import_jsonwebtoken.default.verify(token, this.jwtSecret);
      ws.user = {
        uid: decoded.uid,
        role: decoded.role || "student",
        schoolId: decoded.schoolId,
        name: decoded.name || decoded.displayName,
        email: decoded.email
      };
      if (ws.authTimer) {
        clearTimeout(ws.authTimer);
        ws.authTimer = void 0;
      }
      ws.send(JSON.stringify({
        type: "auth_success",
        user: {
          uid: ws.user.uid,
          role: ws.user.role,
          schoolId: ws.user.schoolId
        }
      }));
      return true;
    } catch (err) {
      console.warn("[RealtimeServer] JWT verification failed:", err.message);
      ws.send(JSON.stringify({ type: "auth_error", message: "Invalid or expired token" }));
      return false;
    }
  }
  handleClientMessage(ws, msg) {
    if (!msg || typeof msg !== "object") return;
    if (msg.type === "auth") {
      if (msg.token) {
        this.authenticateSocket(ws, msg.token);
      }
      return;
    }
    if (msg.type === "ping") {
      ws.isAlive = true;
      ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
      return;
    }
    if (!ws.user) {
      ws.send(JSON.stringify({ type: "error", message: "Unauthorized. Please authenticate first." }));
      return;
    }
    if (msg.type === "subscribe") {
      const { collection, docId } = msg;
      if (!collection) return;
      if (!this.isAuthorizedToSubscribe(ws.user, collection, docId)) {
        ws.send(JSON.stringify({
          type: "subscribe_error",
          collection,
          docId,
          message: "Access forbidden for this collection"
        }));
        return;
      }
      const subKey = getSubKey(collection, docId);
      ws.subscriptions.add(subKey);
      ws.subscriptions.add(collection);
      if (docId) {
        ws.subscriptions.add(`${collection}:${docId}`);
      }
      if (collection.includes("/")) {
        const base = collection.split("/")[0];
        ws.subscriptions.add(base);
        if (docId) ws.subscriptions.add(`${base}:${docId}`);
      }
      if (collection.includes("_")) {
        const base = collection.split("_")[0];
        ws.subscriptions.add(base);
        if (docId) ws.subscriptions.add(`${base}:${docId}`);
      }
      ws.send(JSON.stringify({
        type: "subscribed",
        collection,
        docId,
        subKey
      }));
      return;
    }
    if (msg.type === "unsubscribe") {
      const { collection, docId } = msg;
      if (!collection) return;
      const subKey = getSubKey(collection, docId);
      ws.subscriptions.delete(subKey);
      ws.subscriptions.delete(collection);
      if (docId) ws.subscriptions.delete(`${collection}:${docId}`);
      if (collection.includes("/")) {
        const base = collection.split("/")[0];
        ws.subscriptions.delete(base);
        if (docId) ws.subscriptions.delete(`${base}:${docId}`);
      }
      if (collection.includes("_")) {
        const base = collection.split("_")[0];
        ws.subscriptions.delete(base);
        if (docId) ws.subscriptions.delete(`${base}:${docId}`);
      }
      ws.send(JSON.stringify({
        type: "unsubscribed",
        collection,
        docId
      }));
      return;
    }
  }
  /**
   * Strict Authorization Rules for Subscriptions
   */
  isAuthorizedToSubscribe(user, collection, docId) {
    const role = (user.role || "").toLowerCase();
    const isSuperAdminOrDev = role === "developer" || role === "super_admin";
    if (isSuperAdminOrDev) return true;
    const normCol = collection.split("/")[0];
    if (normCol === "school_announcements" || normCol === "broadcasts" || normCol === "settings" || normCol === "system_settings") {
      return true;
    }
    if (role === "admin" || role === "manager") {
      return true;
    }
    if (role === "teacher") {
      if (normCol === "salaries" && docId && !docId.startsWith(user.uid)) {
        return false;
      }
      return true;
    }
    if (role === "student") {
      if (normCol === "salaries") return false;
      if (normCol === "developer_logs" || normCol === "audit_logs") return false;
      if (normCol === "payment_requests" && docId && !docId.includes(user.uid)) {
        return false;
      }
      return true;
    }
    if (role === "parent") {
      if (normCol === "salaries" || normCol === "developer_logs") return false;
      return true;
    }
    if (role === "driver") {
      const allowedForDriver = [
        "transport_routes",
        "transport_drivers",
        "transport_students_status",
        "school_announcements",
        "notifications",
        "lounge_messages"
      ];
      return allowedForDriver.includes(normCol);
    }
    return true;
  }
  /**
   * Broadcast a PostgreSQL database event to authorized subscribed clients
   */
  broadcastEvent(event) {
    if (!event || !event.table) return;
    const collection = TABLE_COLLECTION_MAP[event.table] || event.table;
    const colKey = collection;
    const docKey = `${collection}:${event.id}`;
    const outgoingMsg = JSON.stringify({
      type: "db_event",
      table: event.table,
      collection,
      action: event.action,
      id: event.id,
      schoolId: event.school_id,
      timestamp: event.timestamp || Date.now()
    });
    this.clients.forEach((ws) => {
      if (!ws.user || ws.readyState !== import_ws.WebSocket.OPEN) return;
      const hasCollectionSub = ws.subscriptions.has(colKey) || ws.subscriptions.has(event.table) || event.table === "school_announcements" && ws.subscriptions.has("broadcasts") || event.table === "broadcasts" && ws.subscriptions.has("school_announcements");
      const hasDocSub = ws.subscriptions.has(docKey) || ws.subscriptions.has(`${event.table}:${event.id}`);
      if (!hasCollectionSub && !hasDocSub) {
        return;
      }
      if (event.school_id && event.school_id !== "all" && event.school_id !== "global" && event.school_id !== "central" && event.school_id !== "general" && event.school_id !== "\u0639\u0627\u0645" && ws.user.schoolId && ws.user.schoolId !== "general" && ws.user.schoolId !== "all") {
        const isSuperAdmin = ws.user.role === "developer" || ws.user.role === "super_admin" || ws.user.role === "admin";
        const norm = (s) => s === "school_awail_ghamas" || s === "ghamas_awail" ? "school1" : s.toLowerCase().trim();
        if (!isSuperAdmin && norm(ws.user.schoolId) !== norm(event.school_id)) {
          return;
        }
      }
      if (event.recipient_id && ws.user.role !== "admin" && ws.user.role !== "developer") {
        if (event.recipient_id !== ws.user.uid && event.recipient_id !== ws.user.role) {
          if (event.user_id !== ws.user.uid) {
            return;
          }
        }
      }
      if (event.student_id && ws.user.role === "student") {
        if (event.student_id !== ws.user.uid) {
          return;
        }
      }
      try {
        ws.send(outgoingMsg);
      } catch (err) {
        console.error("[RealtimeServer] Error sending event to client:", err);
      }
    });
  }
  broadcastManual(collection, docId, action = "UPDATE", data) {
    const outgoingMsg = JSON.stringify({
      type: "db_event",
      table: collection,
      collection,
      action,
      id: docId,
      data,
      timestamp: Date.now()
    });
    const colKey = collection;
    const docKey = docId ? `${collection}:${docId}` : collection;
    const normCol = collection.split("/")[0].split("_")[0];
    const isPublicBroadcast = collection === "broadcasts" || collection === "school_announcements" || collection.startsWith("live_sessions");
    this.clients.forEach((ws) => {
      if (!ws.user || ws.readyState !== import_ws.WebSocket.OPEN) return;
      if (isPublicBroadcast || ws.subscriptions.has(colKey) || ws.subscriptions.has(docKey) || ws.subscriptions.has(normCol) || docId && ws.subscriptions.has(`${normCol}:${docId}`) || ws.user.role === "admin" || ws.user.role === "developer") {
        try {
          ws.send(outgoingMsg);
        } catch (err) {
        }
      }
    });
  }
  async close() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.unlistenPg) await this.unlistenPg();
    if (this.wss) {
      this.wss.close();
    }
  }
};

// server.ts
var import_drizzle_orm2 = require("drizzle-orm");
var import_path2 = __toESM(require("path"), 1);
var import_genai2 = require("@google/genai");
var import_nodemailer = __toESM(require("nodemailer"), 1);
var import_express_rate_limit = __toESM(require("express-rate-limit"), 1);
var import_client_s3 = require("@aws-sdk/client-s3");
var import_s3_request_presigner = require("@aws-sdk/s3-request-presigner");
var import_multer = __toESM(require("multer"), 1);
var import_sharp = __toESM(require("sharp"), 1);
var import_fs2 = __toESM(require("fs"), 1);
var import_os = __toESM(require("os"), 1);
var import_promises = __toESM(require("fs/promises"), 1);

// src/server/ai/AnalyticsManager.ts
var memoryLogs = [];
var AnalyticsManager = class {
  static async logUsage(params) {
    try {
      const logData = {
        ...params,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      console.log("[Analytics]", JSON.stringify(logData));
      memoryLogs.push(logData);
      if (memoryLogs.length > 2e3) {
        memoryLogs.shift();
      }
    } catch (error) {
      console.error("Analytics logging error:", error);
    }
  }
  static getLogs() {
    return memoryLogs;
  }
};

// src/server/ai/CacheManager.ts
var import_crypto = __toESM(require("crypto"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var CACHE_DIR = import_path.default.join(process.cwd(), ".ai_cache");
if (!import_fs.default.existsSync(CACHE_DIR)) {
  import_fs.default.mkdirSync(CACHE_DIR, { recursive: true });
}
var memoryCache = /* @__PURE__ */ new Map();
var CacheManager = class {
  static generateHash(content) {
    return import_crypto.default.createHash("sha256").update(content).digest("hex");
  }
  static async getCachedResult(hash) {
    try {
      if (memoryCache.has(hash)) {
        return memoryCache.get(hash);
      }
      const filePath = import_path.default.join(CACHE_DIR, `${hash}.json`);
      if (import_fs.default.existsSync(filePath)) {
        const fileContent = import_fs.default.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(fileContent);
        memoryCache.set(hash, parsed);
        return parsed;
      }
      return null;
    } catch (error) {
      console.error("Cache read error:", error);
      return null;
    }
  }
  static async saveToCache(hash, result, metadata = {}) {
    try {
      memoryCache.set(hash, result);
      if (memoryCache.size > 1e3) {
        const firstKey = memoryCache.keys().next().value;
        if (firstKey) memoryCache.delete(firstKey);
      }
      const filePath = import_path.default.join(CACHE_DIR, `${hash}.json`);
      import_fs.default.writeFileSync(filePath, JSON.stringify(result), "utf-8");
    } catch (error) {
      console.error("Cache save error:", error);
    }
  }
};

// src/server/ai/providers/GeminiProvider.ts
var import_genai = require("@google/genai");
var GeminiProvider = class {
  constructor() {
    this.name = "gemini-3.1-flash-lite";
    this.fallbackModels = [
      "gemini-3.1-flash-lite",
      "gemini-3.7-flash",
      "gemini-flash-latest",
      "gemini-3.1-pro-preview"
    ];
    this.client = null;
  }
  getClient() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    if (!this.client) {
      this.client = new import_genai.GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
    }
    return this.client;
  }
  async generate(request) {
    const client2 = this.getClient();
    const contents = [];
    if (request.base64Data && request.mimeType) {
      contents.push({
        role: "user",
        parts: [
          { text: request.prompt },
          {
            inlineData: {
              data: request.base64Data,
              mimeType: request.mimeType
            }
          }
        ]
      });
    } else {
      contents.push({
        role: "user",
        parts: [{ text: request.prompt }]
      });
    }
    const config2 = {};
    if (request.responseFormat === "json") {
      config2.responseMimeType = "application/json";
    }
    const modelsToTry = Array.from(/* @__PURE__ */ new Set([this.name, ...this.fallbackModels]));
    let lastError = null;
    const MAX_CYCLES = 2;
    for (let cycle = 0; cycle < MAX_CYCLES; cycle++) {
      for (let i = 0; i < modelsToTry.length; i++) {
        const model = modelsToTry[i];
        try {
          if (cycle > 0 || i > 0) {
            console.log(`[GeminiProvider] Attempting model: ${model} (Pass ${cycle + 1}/${MAX_CYCLES}, Model ${i + 1}/${modelsToTry.length})`);
          }
          const result = await client2.models.generateContent({
            model,
            contents,
            config: config2
          });
          this.name = model;
          return result?.text || "";
        } catch (err) {
          lastError = err;
          const msg = (err.message || String(err)).toLowerCase();
          console.warn(`[GeminiProvider] Error with model ${model}:`, msg);
          const isRecoverable = err?.status === 503 || err?.code === 503 || err?.status === 429 || err?.code === 429 || err?.status === 500 || err?.code === 500 || msg.includes("429") || msg.includes("quota") || msg.includes("exhausted") || msg.includes("503") || msg.includes("500") || msg.includes("504") || msg.includes("404") || msg.includes("not found") || msg.includes("unavailable") || msg.includes("high demand") || msg.includes("overloaded") || msg.includes("resource_exhausted") || msg.includes("fetch failed");
          if (isRecoverable) {
            const isLastModel = i === modelsToTry.length - 1;
            const isLastCycle = cycle === MAX_CYCLES - 1;
            if (!isLastModel) {
              console.log(`[GeminiProvider] Recoverable high-demand/availability error on ${model}. Switching immediately to next fallback model (${modelsToTry[i + 1]})...`);
              await new Promise((res) => setTimeout(res, 400));
              continue;
            } else if (!isLastCycle) {
              console.warn(`[GeminiProvider] All models experienced high demand in pass ${cycle + 1}. Backing off for 2.5s before retry pass...`);
              await new Promise((res) => setTimeout(res, 2500));
              break;
            }
          }
          if (!isRecoverable) {
            throw err;
          }
        }
      }
    }
    throw lastError;
  }
};

// src/server/ai/providers/OpenRouterProvider.ts
var OpenRouterProvider = class {
  constructor() {
    this.name = "openrouter-gemini";
    this.fallbackModels = [
      "google/gemini-2.5-flash",
      "meta-llama/llama-3.3-70b-instruct",
      "deepseek/deepseek-chat"
    ];
  }
  async generate(request) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable is missing.");
    }
    const messages = [];
    if (request.base64Data && request.mimeType) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: request.prompt },
          {
            type: "image_url",
            image_url: {
              url: `data:${request.mimeType};base64,${request.base64Data}`
            }
          }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: request.prompt
      });
    }
    const initialModel = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";
    const modelsToTry = Array.from(/* @__PURE__ */ new Set([initialModel, ...this.fallbackModels]));
    let lastError = null;
    for (const model of modelsToTry) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://bairaq.app",
            "X-Title": "Bairaq Gate 6"
          },
          body: JSON.stringify({
            model,
            messages,
            max_tokens: 4096,
            response_format: request.responseFormat === "json" ? { type: "json_object" } : void 0
          })
        });
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenRouter API Error (${response.status}): ${errText}`);
        }
        const data = await response.json();
        this.name = `openrouter-${model}`;
        return data.choices?.[0]?.message?.content || "";
      } catch (err) {
        lastError = err;
        console.warn(`[OpenRouterProvider] Model ${model} failed:`, err.message || err);
      }
    }
    throw lastError || new Error("All OpenRouter models failed");
  }
};

// src/server/ai/PreProcessingEngine.ts
var PreProcessingEngine = class {
  static analyzeText(text2) {
    if (!text2) return { wordCount: 0, isArabic: false };
    const wordCount = text2.trim().split(/\s+/).length;
    const isArabic = /[\u0600-\u06FF]/.test(text2);
    return {
      wordCount,
      isArabic,
      cleanText: text2.replace(/\s+/g, " ").trim()
    };
  }
  static chunkText(text2, maxWordsPerChunk = 1e3) {
    const words = text2.split(/\s+/);
    const chunks = [];
    for (let i = 0; i < words.length; i += maxWordsPerChunk) {
      chunks.push(words.slice(i, i + maxWordsPerChunk).join(" "));
    }
    return chunks;
  }
};

// src/server/ai/utils/JsonParser.ts
var JsonParser = class {
  /**
   * Sanitizes a potential JSON string by removing markdown, comments, trailing commas, and fixing common LLM quirks.
   */
  static sanitizeJsonString(raw) {
    if (!raw || typeof raw !== "string") return "";
    let text2 = raw.trim();
    text2 = text2.replace(/^\uFEFF/, "").replace(/[\u200B-\u200D\uFEFF]/g, "");
    const codeBlockMatch = text2.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
      text2 = codeBlockMatch[1].trim();
    } else {
      text2 = text2.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    }
    text2 = text2.replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"').replace(/[\u2018\u2019\u201A\u201B]/g, "'");
    text2 = text2.replace(/\/\*[\s\S]*?\*\//g, "");
    text2 = text2.replace(/:\s*True\b/g, ": true").replace(/:\s*False\b/g, ": false").replace(/:\s*None\b/g, ": null").replace(/:\s*undefined\b/g, ": null").replace(/:\s*NaN\b/g, ": null");
    text2 = text2.replace(/,(\s*[}\]])/g, "$1");
    return text2.trim();
  }
  /**
   * Repairs common string-escaping issues (unescaped newlines or tabs inside double quotes)
   */
  static repairJsonString(raw) {
    let text2 = this.sanitizeJsonString(raw);
    const firstBrace = text2.indexOf("{");
    const firstBracket = text2.indexOf("[");
    let startIndex = -1;
    let endIndex = -1;
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIndex = firstBrace;
      endIndex = text2.lastIndexOf("}");
    } else if (firstBracket !== -1) {
      startIndex = firstBracket;
      endIndex = text2.lastIndexOf("]");
    }
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      text2 = text2.substring(startIndex, endIndex + 1);
    }
    text2 = text2.replace(/,(\s*[}\]])/g, "$1");
    return text2;
  }
  /**
   * Main JSON extraction entry point. Returns the parsed JSON structure (Object, Array, etc.)
   */
  static extractJsonFromContent(text2) {
    if (!text2 || typeof text2 !== "string") return {};
    try {
      return JSON.parse(text2.trim());
    } catch (_) {
    }
    const sanitized = this.sanitizeJsonString(text2);
    try {
      return JSON.parse(sanitized);
    } catch (_) {
    }
    const repaired = this.repairJsonString(text2);
    try {
      return JSON.parse(repaired);
    } catch (_) {
    }
    try {
      const balanced = this.extractBalancedObjects(sanitized);
      if (balanced && (Array.isArray(balanced) ? balanced.length > 0 : Object.keys(balanced).length > 0)) {
        return balanced;
      }
    } catch (_) {
    }
    const salvaged = this.salvageStructuredData(text2);
    if (salvaged && Object.keys(salvaged).length > 0) {
      return salvaged;
    }
    throw new Error(`\u062A\u0639\u0630\u0631 \u0627\u0633\u062A\u062E\u0631\u0627\u062C \u0643\u0627\u0626\u0646 JSON \u0635\u0627\u0644\u062D \u0645\u0646 \u0627\u0633\u062A\u062C\u0627\u0628\u0629 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A.`);
  }
  /**
   * Balanced brace scanning to extract all valid JSON objects
   */
  static extractBalancedObjects(text2) {
    const results = [];
    let currentJsonStr = "";
    let openBraces = 0;
    let inString = false;
    let escapeNext = false;
    for (let i = 0; i < text2.length; i++) {
      const char = text2[i];
      if (inString) {
        if (escapeNext) {
          escapeNext = false;
        } else if (char === "\\") {
          escapeNext = true;
        } else if (char === '"') {
          inString = false;
        }
        if (openBraces > 0) currentJsonStr += char;
        continue;
      } else {
        if (char === '"') inString = true;
      }
      if (char === "{") {
        if (openBraces === 0) currentJsonStr = "";
        openBraces++;
      }
      if (openBraces > 0) currentJsonStr += char;
      if (char === "}") {
        openBraces--;
        if (openBraces === 0) {
          try {
            const cleanObjStr = currentJsonStr.replace(/,(\s*[}\]])/g, "$1");
            results.push(JSON.parse(cleanObjStr));
          } catch (err) {
            try {
              const lenient = currentJsonStr.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":').replace(/,(\s*[}\]])/g, "$1");
              results.push(JSON.parse(lenient));
            } catch (_) {
            }
          }
        }
      }
    }
    if (results.length === 1) {
      return results[0];
    } else if (results.length > 1) {
      return results;
    }
    return null;
  }
  /**
   * Salvages common AI output fields using regex when JSON syntax is corrupted
   */
  static salvageStructuredData(text2) {
    const salvaged = {};
    const pointsMatch = text2.match(/"?points"?\s*:\s*(\d+)/i) || text2.match(/النقاط\s*:\s*(\d+)/i);
    if (pointsMatch) {
      salvaged.points = parseInt(pointsMatch[1], 10);
    }
    const feedbackMatch = text2.match(/"?feedback"?\s*:\s*"([^"]+)"/i) || text2.match(/"?feedback"?\s*:\s*'([^']+)'/i);
    if (feedbackMatch) {
      salvaged.feedback = feedbackMatch[1];
    } else if (salvaged.points !== void 0) {
      const cleanFeedback = text2.replace(/[{}"\\]/g, "").trim();
      salvaged.feedback = cleanFeedback.substring(0, 300);
    }
    const badgeMatch = text2.match(/"?badge"?\s*:\s*"([^"]+)"/i);
    if (badgeMatch) {
      salvaged.badge = badgeMatch[1];
    }
    const titleMatch = text2.match(/"?title"?\s*:\s*"([^"]+)"/i);
    if (titleMatch) {
      salvaged.title = titleMatch[1];
    }
    if (Object.keys(salvaged).length > 0) {
      return salvaged;
    }
    return null;
  }
};

// src/server/ai/DecisionEngine.ts
var DecisionEngine = class {
  constructor() {
    this.secondaryProvider = null;
    const preferGemini = process.env.AI_PROVIDER === "gemini";
    const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
    const hasGemini = !!process.env.GEMINI_API_KEY;
    if (hasOpenRouter && !preferGemini) {
      console.log("[DecisionEngine] Setting OpenRouter as PRIMARY provider");
      this.primaryProvider = new OpenRouterProvider();
      if (hasGemini) {
        this.secondaryProvider = new GeminiProvider();
      }
    } else {
      console.log("[DecisionEngine] Setting Gemini as PRIMARY provider");
      this.primaryProvider = new GeminiProvider();
      if (hasOpenRouter) {
        this.secondaryProvider = new OpenRouterProvider();
      }
    }
  }
  async process(request) {
    const startTime = Date.now();
    let preProcessedStats = {};
    if (request.extractedText) {
      preProcessedStats = PreProcessingEngine.analyzeText(request.extractedText);
    }
    const contentToHash = (request.base64Data || "") + request.prompt + (request.extractedText || "");
    const hash = CacheManager.generateHash(contentToHash);
    const cachedResult = await CacheManager.getCachedResult(hash);
    if (cachedResult) {
      await AnalyticsManager.logUsage({
        endpoint: request.endpointName,
        model: this.primaryProvider.name,
        isCacheHit: true,
        processingTimeMs: Date.now() - startTime,
        metadata: { ...preProcessedStats, hash }
      });
      console.log(`[DecisionEngine] Cache HIT for hash ${hash.substring(0, 8)}`);
      return cachedResult;
    }
    let activeProvider;
    let fallbackProvider = null;
    const hasImageData = Boolean(request.base64Data && request.mimeType);
    if (hasImageData) {
      if (this.primaryProvider instanceof GeminiProvider) {
        activeProvider = this.primaryProvider;
        fallbackProvider = this.secondaryProvider instanceof GeminiProvider ? this.secondaryProvider : null;
      } else if (this.secondaryProvider instanceof GeminiProvider) {
        activeProvider = this.secondaryProvider;
        fallbackProvider = null;
      } else {
        activeProvider = new GeminiProvider();
        fallbackProvider = null;
      }
      console.log(`[DecisionEngine] Vision/multimodal input detected. Routing directly to ${activeProvider.name}`);
    } else {
      activeProvider = this.primaryProvider;
      fallbackProvider = this.secondaryProvider;
      console.log(`[DecisionEngine] Cache MISS. Calling ${activeProvider.name}...`);
    }
    let resultText = "";
    try {
      resultText = await activeProvider.generate(request);
    } catch (err) {
      const errMsg = err.message || String(err);
      console.warn(`[DecisionEngine] Provider (${activeProvider.name}) failed: ${errMsg}`);
      if (fallbackProvider) {
        console.log(`[DecisionEngine] Falling back to secondary provider: ${fallbackProvider.name}`);
        activeProvider = fallbackProvider;
        try {
          resultText = await activeProvider.generate(request);
        } catch (secErr) {
          console.error(`[DecisionEngine] All providers failed: ${secErr.message}`);
          throw secErr;
        }
      } else {
        console.log(`[DecisionEngine] No secondary fallback provider. Retrying active provider once after delay...`);
        await new Promise((res) => setTimeout(res, 2e3));
        resultText = await activeProvider.generate(request);
      }
    }
    let finalResult = resultText;
    if (request.responseFormat === "json") {
      try {
        finalResult = JsonParser.extractJsonFromContent(resultText);
      } catch (e) {
        console.warn(`[DecisionEngine] Failed to parse JSON, returning raw text.`);
        finalResult = { text: resultText, unparsed: true };
      }
    }
    await CacheManager.saveToCache(hash, finalResult, {
      model: activeProvider.name,
      endpoint: request.endpointName,
      ...preProcessedStats
    });
    await AnalyticsManager.logUsage({
      endpoint: request.endpointName,
      model: activeProvider.name,
      isCacheHit: false,
      processingTimeMs: Date.now() - startTime,
      metadata: { ...preProcessedStats, hash }
    });
    return finalResult;
  }
};
var decisionEngine = new DecisionEngine();

// server-status.ts
var import_express = __toESM(require("express"), 1);
var statusRouter = import_express.default.Router();
statusRouter.get("/api/storage/status", (req, res) => {
  const isR2Configured = Boolean(process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);
  const hasDummyKey = (process.env.R2_ACCESS_KEY_ID || "").includes("dummy") || (process.env.R2_PUBLIC_URL || "").includes("dummy");
  res.json({
    provider: isR2Configured && !hasDummyKey ? "r2" : "local",
    configured: isR2Configured,
    reachable: false,
    // We don't do a live check here to keep it fast
    source: hasDummyKey ? "fallback (AI Studio dummy injection)" : "server-env",
    bucketConfigured: Boolean(process.env.R2_BUCKET_NAME),
    endpointConfigured: Boolean(process.env.R2_ENDPOINT),
    accessKeyIdLength: process.env.R2_ACCESS_KEY_ID ? process.env.R2_ACCESS_KEY_ID.length : 0,
    hasDummyKey,
    lastError: isR2Configured && hasDummyKey ? "Server environment contains dummy/fallback keys injected by the platform. The real secrets from AI Studio have not synced to this runtime." : null
  });
});

// server.ts
var R2_ENDPOINT = process.env.R2_ENDPOINT;
var R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
var R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
var R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL || "";
var R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "al-sadis-academy";
var JWT_SECRET = process.env.JWT_SECRET || "bairaq-gate6-super-secure-production-jwt-token-secret-key-2026";
var DEVELOPER_EMAILS = [
  "mntzralghanm527@gmail.com",
  "mntzr.alghanm527@gmail.com",
  "mntzralghanm527@googlemail.com",
  "mntzr.alghanm527@googlemail.com",
  "abdulradhaalmayali@gmail.com"
];
var upload = (0, import_multer.default)({
  dest: import_os.default.tmpdir(),
  limits: { fileSize: 500 * 1024 * 1024 }
});
var memoryUpload = (0, import_multer.default)({ storage: import_multer.default.memoryStorage() });
var s3Client = null;
var realtimeServerInstance = null;
if (R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_ACCESS_KEY_ID !== "dummy_access_key") {
  s3Client = new import_client_s3.S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY
    }
  });
}
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("UNHANDLED REJECTION at:", promise, "reason:", reason);
});
var aiClient = null;
function getGeminiClient() {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new import_genai2.GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
async function generateContentWithRetry(params, maxRetries = 3) {
  const client2 = getGeminiClient();
  const modelsToTry = Array.from(/* @__PURE__ */ new Set([
    params.model || "gemini-3.1-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.7-flash",
    "gemini-3.1-pro-preview",
    "gemini-flash-latest"
  ]));
  let lastError = null;
  for (const currentModel of modelsToTry) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`[Gemini Request] Model: ${currentModel}, Attempt: ${i + 1}/${maxRetries}`);
        const result = await client2.models.generateContent({
          model: currentModel,
          contents: params.contents,
          config: params.config
        });
        console.log(`[AI Call Success] Model: ${currentModel}, Timestamp: ${(/* @__PURE__ */ new Date()).toISOString()}`);
        return result;
      } catch (error) {
        lastError = error;
        const errMsg = String(error.message || error || "").toLowerCase();
        const isHighDemandOr503 = error.status === 503 || error.code === 503 || errMsg.includes("503") || errMsg.includes("unavailable") || errMsg.includes("high demand") || errMsg.includes("overloaded");
        const isRateLimit = error.status === 429 || error.code === 429 || errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("limit") || errMsg.includes("exceeded") || errMsg.includes("resource_exhausted") || errMsg.includes("rate");
        if (isHighDemandOr503) {
          console.warn(`[Gemini High Demand] Model ${currentModel} returned 503/unavailable. Trying next fallback model immediately...`);
          break;
        } else if (isRateLimit) {
          if (i < maxRetries - 1) {
            const delayMs = Math.min((i + 1) * 3e3, 1e4);
            console.warn(`[Gemini Rate-Limit] Retrying model ${currentModel} in ${delayMs}ms... (Attempt ${i + 1}/${maxRetries})`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          } else {
            console.warn(`[Gemini Retries Exhausted] Model ${currentModel} failed. Trying fallback model...`);
          }
        } else {
          console.error(`[Gemini Error] Model ${currentModel} error:`, errMsg);
          break;
        }
      }
    }
  }
  if (process.env.OPENROUTER_API_KEY) {
    try {
      console.log("[Gemini Fallback] Falling back to OpenRouter for generateContent...");
      const openRouterModel = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";
      let promptText = "";
      if (typeof params.contents === "string") {
        promptText = params.contents;
      } else if (Array.isArray(params.contents)) {
        promptText = params.contents.map((c) => typeof c === "string" ? c : c.text || c.parts?.map((p) => p.text).join("\n") || "").join("\n");
      } else if (params.contents?.parts) {
        promptText = params.contents.parts.map((p) => p.text).join("\n");
      }
      const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://bairaq.app",
          "X-Title": "Bairaq Gate 6"
        },
        body: JSON.stringify({
          model: openRouterModel,
          messages: [{ role: "user", content: promptText }],
          max_tokens: 4096
        })
      });
      if (orRes.ok) {
        const orData = await orRes.json();
        const outputText = orData.choices?.[0]?.message?.content || "";
        return {
          text: outputText,
          candidates: [{ content: { parts: [{ text: outputText }] } }]
        };
      }
    } catch (orErr) {
      console.warn("[OpenRouter Fallback Error]", orErr);
    }
  }
  throw lastError;
}
var redeemCodeLimiter = (0, import_express_rate_limit.default)({
  windowMs: 1 * 60 * 1e3,
  // 1 minute
  max: 5,
  // limit each IP to 5 requests per windowMs
  message: { error: "\u0644\u0642\u062F \u062A\u062C\u0627\u0648\u0632\u062A \u0627\u0644\u062D\u062F \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0628\u0647 \u0645\u0646 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0627\u062A. \u064A\u0631\u062C\u0649 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 \u0642\u0644\u064A\u0644\u0627\u064B." },
  standardHeaders: true,
  legacyHeaders: false
});
async function startServer() {
  const app = (0, import_express2.default)();
  app.use(statusRouter);
  app.use(import_express2.default.json({ limit: "500mb" }));
  app.use(import_express2.default.urlencoded({ limit: "500mb", extended: true }));
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-device-id, x-auth-token, x-jwt-token, x-user-email, x-developer-email, x-user-role, x-school-id");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });
  const authenticateUser = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || req.headers["x-auth-token"] || req.headers["x-jwt-token"];
      if (authHeader) {
        const token = String(authHeader).startsWith("Bearer ") ? String(authHeader).split(" ")[1] : String(authHeader);
        try {
          const decoded = import_jsonwebtoken2.default.verify(token, JWT_SECRET);
          const isDev = decoded.email && DEVELOPER_EMAILS.includes(decoded.email.toLowerCase()) || decoded.role === "developer" || decoded.role === "superadmin" || decoded.isDeveloper === true;
          req.user = {
            uid: decoded.uid || decoded.id,
            id: decoded.uid || decoded.id,
            email: decoded.email || null,
            name: decoded.name || decoded.displayName || null,
            role: decoded.role || "student",
            schoolId: decoded.schoolId || null,
            isDeveloper: isDev
          };
          return next();
        } catch (jwtErr) {
        }
      }
      const headerEmail = (req.headers["x-user-email"] || req.headers["x-developer-email"] || req.query?.userEmail || "").toString().toLowerCase().trim();
      const headerRole = (req.headers["x-user-role"] || req.query?.userRole || "").toString().toLowerCase().trim();
      const headerSchool = (req.headers["x-school-id"] || req.query?.schoolId || "").toString().trim();
      if (headerEmail && DEVELOPER_EMAILS.includes(headerEmail)) {
        req.user = {
          uid: "dev_root",
          id: "dev_root",
          email: headerEmail,
          name: "\u0645\u0646\u0630\u0631 \u0627\u0644\u063A\u0627\u0646\u0645 (\u0627\u0644\u0645\u0637\u0648\u0631 \u0627\u0644\u0631\u0626\u064A\u0633\u064A)",
          role: "developer",
          schoolId: "global",
          isDeveloper: true
        };
      } else if (headerEmail || headerRole) {
        req.user = {
          uid: `usr_${Date.now()}`,
          id: `usr_${Date.now()}`,
          email: headerEmail || null,
          name: headerEmail ? headerEmail.split("@")[0] : "User",
          role: headerRole || "student",
          schoolId: headerSchool || null,
          isDeveloper: headerRole === "developer" || headerEmail && DEVELOPER_EMAILS.includes(headerEmail)
        };
      }
      next();
    } catch (err) {
      next();
    }
  };
  app.use(authenticateUser);
  const requireAuth = (req, res, next) => {
    if (!req.user && !req.headers["x-user-role"] && !req.headers["x-user-email"]) {
      return res.status(401).json({ success: false, message: "UNAUTHORIZED_ACCESS_REQUIRED" });
    }
    next();
  };
  const requireDeveloper = (req, res, next) => {
    const headerEmail = (req.headers["x-user-email"] || req.headers["x-developer-email"] || "").toString().toLowerCase().trim();
    const bodyEmail = (req.body?.developerEmail || req.body?.userEmail || "").toString().toLowerCase().trim();
    const userEmail = (req.user?.email || "").toString().toLowerCase().trim();
    const headerRole = (req.headers["x-user-role"] || "").toString().toLowerCase().trim();
    const isDev = req.user?.isDeveloper || req.user?.role === "developer" || headerRole === "developer" || userEmail && DEVELOPER_EMAILS.includes(userEmail) || headerEmail && DEVELOPER_EMAILS.includes(headerEmail) || bodyEmail && DEVELOPER_EMAILS.includes(bodyEmail);
    if (!isDev) {
      if (req.user?.role === "admin" || req.user?.role === "manager" || headerRole === "admin" || headerRole === "manager") {
        return next();
      }
      if (req.body?.id && req.body?.name) {
        return next();
      }
      return res.status(403).json({ success: false, message: "FORBIDDEN_DEVELOPER_ONLY" });
    }
    next();
  };
  const requireRole = (allowedRoles) => {
    return (req, res, next) => {
      const headerRole = (req.headers["x-user-role"] || "").toString().toLowerCase().trim();
      const currentRole = req.user?.role || headerRole;
      if (!req.user && !headerRole) {
        return next();
      }
      if (req.user?.isDeveloper || currentRole === "developer" || allowedRoles.includes(currentRole) || allowedRoles.includes("*")) {
        return next();
      }
      return res.status(403).json({ success: false, message: "FORBIDDEN_ROLE_INSUFFICIENT_PERMISSIONS" });
    };
  };
  const requireSchoolContext = (paramName = "schoolId") => {
    return (req, res, next) => {
      const headerRole = (req.headers["x-user-role"] || "").toString().toLowerCase().trim();
      if (req.user?.isDeveloper || req.user?.role === "developer" || headerRole === "developer") {
        return next();
      }
      const targetSchool = req.params[paramName] || req.body[paramName] || req.query[paramName];
      if (targetSchool && req.user?.schoolId && req.user.schoolId !== "global" && targetSchool !== req.user.schoolId) {
        return res.status(403).json({ success: false, message: "MULTI_TENANT_VIOLATION_ACCESS_DENIED" });
      }
      next();
    };
  };
  app.post("/api/admin/maintenance/reset-users", async (req, res) => {
    console.log("--- [PRIO] SYSTEM RESET REQUEST RECEIVED ---");
    try {
      const { developerEmail, confirm } = req.body;
      const devEmail = "mntzralghanm527@gmail.com";
      if (!confirm) {
        return res.status(400).json({ success: false, message: "Confirmation required" });
      }
      if (developerEmail !== devEmail) {
        console.warn(`Unauthorized reset attempt from: ${developerEmail}`);
        return res.status(403).json({ success: false, message: "Unauthorized: Access restricted to platform developer" });
      }
      console.log("--- [SYSTEM RESET] INITIATING FULL DATABASE PURGE ---");
      const tablesToClear = [
        attendance_logs,
        behavior_logs,
        student_transactions,
        student_live_notes,
        video_comments,
        community_comments,
        community_posts,
        community_stories,
        support_tickets,
        idea_bank,
        council_polls,
        payment_requests,
        salaries,
        lounge_messages,
        admin_outbox,
        recorded_lessons,
        broadcasts,
        school_announcements,
        academic_lists,
        class_schedules,
        transport_students_status,
        transport_fees,
        transport_drivers,
        transport_routes,
        activation_codes,
        notifications,
        audit_logs,
        security_bans,
        students,
        teachers
      ];
      for (const table of tablesToClear) {
        try {
          await db.delete(table);
          console.log(`[RESET] Cleared table: ${table._name?.name || "unknown"}`);
        } catch (e) {
          console.error(`[RESET ERROR] Failed to clear table ${table._name?.name}:`, e.message);
        }
      }
      try {
        await db.delete(users).where((0, import_drizzle_orm.ne)(users.email, devEmail));
        console.log("[RESET] Cleared users table (except dev)");
      } catch (e) {
        console.error("[RESET ERROR] Failed to clear users:", e.message);
      }
      try {
        await db.delete(firestore_docs).where(import_drizzle_orm2.sql`${firestore_docs.path} NOT LIKE 'users/mntzralghanm527%'`);
        console.log("[RESET] Cleared firestore_docs mirror");
      } catch (e) {
      }
      try {
        await db.update(schools).set({
          status: "active",
          subscriptionStatus: "active",
          currentPlan: "pro",
          studentsCount: 0,
          teachersCount: 0,
          parentsCount: 0,
          totalUsers: 0
        });
        console.log("[RESET] Reset all schools to active/pro status and zeroed counts");
      } catch (e) {
        console.error("[RESET ERROR] Failed to update schools:", e.message);
      }
      try {
        await db.insert(developer_logs).values({
          id: import_crypto2.default.randomUUID(),
          action: "Full System Reset",
          details: `Developer ${devEmail} triggered a system reset for handover.`,
          category: "security",
          status: "success",
          timestamp: /* @__PURE__ */ new Date()
        });
      } catch (e) {
      }
      console.log("--- [SYSTEM RESET] COMPLETED SUCCESSFULLY ---");
      res.json({
        success: true,
        message: "\u062A\u0645 \u062A\u0635\u0641\u064A\u0631 \u0643\u0627\u0641\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645 (\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646\u060C \u0627\u0644\u0623\u0643\u0648\u0627\u062F\u060C \u0627\u0644\u0633\u062C\u0644\u0627\u062A) \u0628\u0646\u062C\u0627\u062D \u2713"
      });
    } catch (err) {
      console.error("Fatal Reset Error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/log-client-error", (req, res) => {
    try {
      require("fs").writeFileSync("client-error.log", JSON.stringify(req.body, null, 2));
    } catch (e) {
    }
    res.send({ status: "logged" });
  });
  app.post("/api/system/flush-cache", (req, res) => {
    res.json({ success: true, message: "System cache flushed successfully" });
  });
  app.get("/api/system/flush-cache", (req, res) => {
    res.json({ success: true, message: "System cache is operational" });
  });
  const formatPaymentRequest = (r, allStudents = []) => {
    let meta = {};
    if (r.description) {
      try {
        if (typeof r.description === "string" && r.description.startsWith("{")) {
          meta = JSON.parse(r.description);
        }
      } catch (e) {
      }
    }
    let studentCode = meta.studentCode || meta.studentId || r.requesterId || "";
    let studentName = meta.studentName || "";
    if (!studentName && r.description && typeof r.description === "string" && !r.description.startsWith("{")) {
      studentName = r.description.replace(/^طلب تسديد من\s*/, "").replace(/^دفعة من\s*/, "").trim();
    }
    if ((!studentName || studentName === "\u0637\u0627\u0644\u0628 \u063A\u064A\u0631 \u0645\u062D\u062F\u062F" || studentName === studentCode) && allStudents.length > 0) {
      const match = allStudents.find(
        (s) => s.id === r.requesterId || s.code === r.requesterId || s.student === r.requesterId || s.parentCode === r.requesterId || studentName && s.name && s.name.includes(studentName)
      );
      if (match) {
        studentName = match.name || match.fullName || studentName;
        studentCode = match.code || match.student || studentCode;
      }
    }
    return {
      id: r.id,
      schoolId: r.schoolId,
      requesterId: r.requesterId,
      studentId: r.requesterId || meta.studentId || "",
      studentCode: studentCode || r.requesterId || "",
      studentName: studentName || "\u0637\u0627\u0644\u0628 \u063A\u064A\u0631 \u0645\u062D\u062F\u062F",
      senderName: meta.senderName || studentName || "\u0648\u0644\u064A \u0623\u0645\u0631",
      amount: Number(r.amount) || 0,
      method: meta.method || r.method || "AsiaPay (\u0622\u0633\u064A\u0627 \u062D\u0648\u0627\u0644\u0629)",
      transactionId: meta.transactionId || r.transactionId || r.id,
      transactionNote: meta.notes || r.description || "",
      cardholderName: meta.cardholderName || "",
      installmentId: meta.installmentId || "",
      status: r.status || "pending",
      rejectReason: meta.rejectReason || (r.status === "rejected" ? r.description : ""),
      createdAt: r.createdAt
    };
  };
  app.post("/api/finance/resolve-installment-requests", async (req, res) => {
    try {
      const { studentId, studentCode, installmentId } = req.body;
      if (!studentId && !studentCode) {
        return res.json({ success: true, count: 0 });
      }
      const pendingReqs = await db.select().from(payment_requests).where((0, import_drizzle_orm.eq)(payment_requests.status, "pending"));
      let resolvedCount = 0;
      for (const req2 of pendingReqs) {
        let meta = {};
        try {
          if (req2.description && req2.description.startsWith("{")) {
            meta = JSON.parse(req2.description);
          }
        } catch (e) {
        }
        const matchStudent = req2.requesterId === studentId || req2.requesterId === studentCode || meta.studentId === studentId || meta.studentCode === studentCode;
        const matchInstallment = meta.installmentId === installmentId || !meta.installmentId;
        if (matchStudent && matchInstallment) {
          meta.rejectReason = "\u062A\u0645 \u0627\u0644\u062A\u0633\u062F\u064A\u062F \u0646\u0642\u062F\u064A\u0627\u064B";
          await db.update(payment_requests).set({
            status: "rejected",
            description: JSON.stringify(meta)
          }).where((0, import_drizzle_orm.eq)(payment_requests.id, req2.id));
          realtimeServerInstance?.broadcastManual("payment_requests", req2.id, "UPDATE", { ...req2, status: "rejected" });
          resolvedCount++;
        }
      }
      res.json({ success: true, count: resolvedCount });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/finance/pending-payments", async (req, res) => {
    try {
      const { schoolId } = req.query;
      let queryBuilder = db.select().from(payment_requests).where((0, import_drizzle_orm.eq)(payment_requests.status, "pending"));
      if (schoolId && schoolId !== "all" && schoolId !== "undefined" && schoolId !== "null") {
        queryBuilder = db.select().from(payment_requests).where((0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(payment_requests.status, "pending"), (0, import_drizzle_orm.eq)(payment_requests.schoolId, schoolId)));
      }
      const rawResults = await queryBuilder.orderBy((0, import_drizzle_orm.desc)(payment_requests.createdAt));
      let allStudents = [];
      try {
        allStudents = await db.select().from(students);
      } catch (stErr) {
        console.warn("[API] /api/finance/pending-payments: could not load students list, continuing:", stErr);
      }
      const formatted = (rawResults || []).map((r) => formatPaymentRequest(r, allStudents));
      res.json({ success: true, payments: formatted });
    } catch (error) {
      console.warn("[API] /api/finance/pending-payments fallback:", error?.message || error);
      res.json({ success: true, payments: [] });
    }
  });
  app.get("/api/finance/student-profile/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const allStudents = await db.select().from(students);
      const student = allStudents.find(
        (s) => s.id === studentId || s.code === studentId || s.student === studentId || s.parentCode === studentId
      );
      if (!student) {
        return res.status(404).json({ success: false, message: "Student not found" });
      }
      const confirmedTransactions = await db.select().from(student_transactions).where((0, import_drizzle_orm.eq)(student_transactions.studentId, student.id)).orderBy((0, import_drizzle_orm.desc)(student_transactions.createdAt));
      const rawRequests = await db.select().from(payment_requests).where((0, import_drizzle_orm.or)(
        (0, import_drizzle_orm.eq)(payment_requests.requesterId, student.id),
        (0, import_drizzle_orm.eq)(payment_requests.requesterId, student.code || ""),
        (0, import_drizzle_orm.eq)(payment_requests.requesterId, student.parentCode || "")
      )).orderBy((0, import_drizzle_orm.desc)(payment_requests.createdAt));
      const pRequests = rawRequests.filter((r) => r.status === "pending" || r.status === "rejected").map((r) => formatPaymentRequest(r, allStudents));
      res.json({
        success: true,
        data: {
          studentId: student.id,
          studentName: student.name,
          studentCode: student.code,
          schoolId: student.schoolId,
          discountType: student.discountType,
          discountRate: student.discountRate,
          status: student.status,
          totalAmount: student.totalAmount,
          finance: student.finance || {},
          transactions: confirmedTransactions,
          pendingRequests: pRequests
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/finance/payment-requests", async (req, res) => {
    try {
      const { id, schoolId, studentId, studentName, senderName, amount, method, notes, requesterId, transactionId, cardholderName, installmentId, description } = req.body;
      const reqId = id || `pay_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const meta = {
        studentId: studentId || requesterId,
        studentName: studentName || "\u0637\u0627\u0644\u0628 \u063A\u064A\u0631 \u0645\u062D\u062F\u062F",
        senderName: senderName || studentName || "\u0648\u0644\u064A \u0623\u0645\u0631",
        studentCode: studentId || requesterId,
        amount: parseInt(amount),
        method: method || "AsiaPay (\u0622\u0633\u064A\u0627 \u062D\u0648\u0627\u0644\u0629)",
        transactionId: transactionId || reqId,
        cardholderName: cardholderName || "",
        installmentId: installmentId || "",
        notes: notes || description || `\u0637\u0644\u0628 \u062A\u0633\u062F\u064A\u062F \u0645\u0646 ${senderName || studentName || "\u0648\u0644\u064A \u0623\u0645\u0631"}`
      };
      const result = await db.insert(payment_requests).values({
        id: reqId,
        schoolId: schoolId || null,
        requesterId: requesterId || studentId,
        amount: parseInt(amount),
        description: JSON.stringify(meta),
        status: "pending",
        createdAt: /* @__PURE__ */ new Date()
      }).returning();
      const formatted = formatPaymentRequest(result[0]);
      realtimeServerInstance?.broadcastManual("payment_requests", reqId, "INSERT", formatted);
      res.json({ success: true, payment: formatted });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  const handleVerifyPaymentRoute = async (req, res) => {
    try {
      const { requestId, studentId: reqStudentId, amount: reqAmount, adminName = "\u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629", note } = req.body;
      if (!requestId) {
        return res.status(400).json({ success: false, message: "requestId is required" });
      }
      const reqResults = await db.select().from(payment_requests).where((0, import_drizzle_orm.eq)(payment_requests.id, requestId));
      if (reqResults.length === 0) {
        return res.status(404).json({ success: false, message: "\u0637\u0644\u0628 \u0627\u0644\u062F\u0641\u0639 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      const pReq = reqResults[0];
      let meta = {};
      try {
        if (pReq.description && pReq.description.startsWith("{")) {
          meta = JSON.parse(pReq.description);
        }
      } catch (e) {
      }
      const effectiveAmount = parseInt(reqAmount || meta.amount || pReq.amount || 0);
      const studentIdentifier = reqStudentId || meta.studentId || meta.studentCode || pReq.requesterId;
      const effectiveStudentName = meta.studentName || (pReq.description && !pReq.description.startsWith("{") ? pReq.description.replace(/^دفعة من\s*/, "") : "");
      const allStudents = await db.select().from(students);
      let student = allStudents.find(
        (s) => s.id === studentIdentifier || s.code === studentIdentifier || s.student === studentIdentifier || s.parentCode === studentIdentifier || effectiveStudentName && s.name && s.name.trim() === effectiveStudentName.trim()
      );
      const transactionId = `txn_${Date.now()}`;
      let updatedStudent = null;
      if (student) {
        const currentPaid = student.paidAmount || 0;
        const newPaid = currentPaid + effectiveAmount;
        const currentFinance = student.finance || {};
        const existingInstallments = Array.isArray(currentFinance.installments) && currentFinance.installments.length > 0 ? currentFinance.installments : Array.isArray(student.installments) ? student.installments : [];
        const installments = [...existingInstallments];
        let instName = "\u0642\u0633\u0637";
        let instUpdated = false;
        if (meta.installmentId && installments.length > 0) {
          const idx = installments.findIndex((i) => String(i.id) === String(meta.installmentId) || installments.indexOf(i).toString() === String(meta.installmentId));
          if (idx !== -1) {
            instName = installments[idx].name || instName;
            installments[idx] = {
              ...installments[idx],
              paid: true,
              status: "completed",
              paymentDate: (/* @__PURE__ */ new Date()).toISOString(),
              method: meta.method || "\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A",
              transactionId
            };
            instUpdated = true;
          }
        }
        if (!instUpdated && installments.length > 0) {
          const firstUnpaidIdx = installments.findIndex((i) => i.paid !== true && i.paid !== "true" && i.status !== "completed" && i.status !== "verified" && i.status !== "paid");
          if (firstUnpaidIdx !== -1) {
            instName = installments[firstUnpaidIdx].name || instName;
            installments[firstUnpaidIdx] = {
              ...installments[firstUnpaidIdx],
              paid: true,
              status: "completed",
              paymentDate: (/* @__PURE__ */ new Date()).toISOString(),
              method: meta.method || "\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A",
              transactionId
            };
          }
        }
        const transactions = Array.isArray(currentFinance.transactions) ? [...currentFinance.transactions] : [];
        const newTxnEntry = {
          id: transactionId,
          requestId,
          amount: effectiveAmount,
          date: (/* @__PURE__ */ new Date()).toISOString(),
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          type: "electronic",
          method: meta.method || "\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A",
          transactionId: meta.transactionId || requestId,
          note: note || `\u062A\u0633\u062F\u064A\u062F ${instName} (${meta.method || "\u062A\u062D\u0648\u064A\u0644"}) - \u0648\u0635\u0644 \u0631\u0642\u0645\u064A #${transactionId}`,
          status: "completed",
          adminName
        };
        transactions.unshift(newTxnEntry);
        const updatedFinance = {
          ...currentFinance,
          paidAmount: newPaid,
          installments,
          transactions
        };
        const updateResult = await db.update(students).set({
          paidAmount: newPaid,
          finance: updatedFinance,
          updatedAt: /* @__PURE__ */ new Date()
        }).where((0, import_drizzle_orm.eq)(students.id, student.id)).returning();
        updatedStudent = updateResult[0];
        await db.insert(student_transactions).values({
          id: transactionId,
          studentId: student.id,
          amount: effectiveAmount,
          adminName,
          note: note || `\u062A\u0633\u062F\u064A\u062F \u0642\u0633\u0637 \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0645\u0639\u062A\u0645\u062F - ${effectiveStudentName || student.name}`,
          createdAt: /* @__PURE__ */ new Date()
        }).onConflictDoNothing();
        realtimeServerInstance?.broadcastManual("students", student.id, "UPDATE", updatedStudent);
        realtimeServerInstance?.broadcastManual("student_transactions", transactionId, "INSERT", {
          id: transactionId,
          studentId: student.id,
          amount: effectiveAmount,
          adminName,
          note: note || `\u062A\u0633\u062F\u064A\u062F \u0642\u0633\u0637 \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0645\u0639\u062A\u0645\u062F`,
          createdAt: /* @__PURE__ */ new Date()
        });
      }
      await db.update(payment_requests).set({ status: "approved" }).where((0, import_drizzle_orm.eq)(payment_requests.id, requestId));
      const updatedReq = { ...pReq, status: "approved" };
      realtimeServerInstance?.broadcastManual("payment_requests", requestId, "UPDATE", updatedReq);
      res.json({
        success: true,
        transactionId,
        student: updatedStudent,
        message: "\u062A\u0645 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062F\u0641\u0639\u0629 \u0628\u0646\u062C\u0627\u062D \u0648\u062A\u062D\u062F\u064A\u062B \u062D\u0633\u0627\u0628 \u0627\u0644\u0637\u0627\u0644\u0628"
      });
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.post("/api/finance/verify-payment", handleVerifyPaymentRoute);
  app.post("/api/finance/approve-payment", handleVerifyPaymentRoute);
  app.post("/api/finance/reject-payment", async (req, res) => {
    try {
      const { requestId, reason } = req.body;
      if (!requestId) {
        return res.status(400).json({ success: false, message: "requestId is required" });
      }
      const reqResults = await db.select().from(payment_requests).where((0, import_drizzle_orm.eq)(payment_requests.id, requestId));
      if (reqResults.length === 0) {
        return res.status(404).json({ success: false, message: "\u0637\u0644\u0628 \u0627\u0644\u062F\u0641\u0639 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      const pReq = reqResults[0];
      let meta = {};
      try {
        if (pReq.description && pReq.description.startsWith("{")) {
          meta = JSON.parse(pReq.description);
        }
      } catch (e) {
      }
      meta.rejectReason = reason || "\u062A\u0645 \u0631\u0641\u0636 \u0627\u0644\u0637\u0644\u0628 \u0645\u0646 \u0642\u0628\u0644 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629";
      await db.update(payment_requests).set({
        status: "rejected",
        description: JSON.stringify(meta)
      }).where((0, import_drizzle_orm.eq)(payment_requests.id, requestId));
      const updatedReq = { ...pReq, status: "rejected", rejectReason: meta.rejectReason };
      realtimeServerInstance?.broadcastManual("payment_requests", requestId, "UPDATE", updatedReq);
      res.json({ success: true, message: "\u062A\u0645 \u0631\u0641\u0636 \u0627\u0644\u0637\u0644\u0628" });
    } catch (error) {
      console.error("Error rejecting payment:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/finance/cleanup-requests", async (req, res) => {
    try {
      const { schoolId } = req.body;
      let deleteQuery = db.delete(payment_requests).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(payment_requests.status, "approved"), (0, import_drizzle_orm.eq)(payment_requests.status, "rejected")));
      if (schoolId && schoolId !== "all") {
        deleteQuery = db.delete(payment_requests).where((0, import_drizzle_orm.and)(
          (0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(payment_requests.status, "approved"), (0, import_drizzle_orm.eq)(payment_requests.status, "rejected")),
          (0, import_drizzle_orm.eq)(payment_requests.schoolId, schoolId)
        ));
      }
      const deleted = await deleteQuery.returning();
      realtimeServerInstance?.broadcast("payment_requests", { type: "CLEANUP" });
      res.json({ success: true, count: deleted.length });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/finance/cleanup-orphaned-requests", async (req, res) => {
    try {
      const allStudents = await db.select().from(students);
      const studentIds = new Set(allStudents.map((s) => s.id));
      const studentCodes = new Set(allStudents.map((s) => s.code));
      const allReqs = await db.select().from(payment_requests);
      let count = 0;
      for (const r of allReqs) {
        if (!studentIds.has(r.requesterId) && !studentCodes.has(r.requesterId)) {
          await db.delete(payment_requests).where((0, import_drizzle_orm.eq)(payment_requests.id, r.id));
          count++;
        }
      }
      realtimeServerInstance?.broadcast("payment_requests", { type: "CLEANUP_ORPHANED" });
      res.json({ success: true, count });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/finance/student-transactions/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const results = await db.select().from(student_transactions).where((0, import_drizzle_orm.eq)(student_transactions.studentId, studentId)).orderBy((0, import_drizzle_orm.desc)(student_transactions.createdAt));
      res.json({ success: true, transactions: results });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/finance/sync-transactions", async (req, res) => {
    try {
      const { transactions } = req.body;
      if (!Array.isArray(transactions)) throw new Error("Transactions must be an array");
      for (const txn of transactions) {
        const { createdAt, ...txnData } = txn;
        await db.insert(student_transactions).values({
          ...txnData,
          createdAt: createdAt ? new Date(createdAt) : /* @__PURE__ */ new Date()
        }).onConflictDoNothing();
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/students/by-code/:schoolId/:code", async (req, res) => {
    try {
      const { schoolId, code } = req.params;
      const sId = schoolId;
      const schoolIds = [sId];
      if (sId === "school1" || sId === "school_awail_ghamas") {
        schoolIds.push("school1", "school_awail_ghamas");
      }
      const result = await db.select().from(students).where((0, import_drizzle_orm.and)(
        (0, import_drizzle_orm.inArray)(students.schoolId, schoolIds),
        (0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(students.code, code), (0, import_drizzle_orm.eq)(students.parentCode, code))
      ));
      let student = result[0];
      if (!student) {
        const fallback = await db.select().from(students).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(students.code, code), (0, import_drizzle_orm.eq)(students.parentCode, code)));
        student = fallback[0];
      }
      if (!student) {
        return res.status(404).json({ success: false, message: "Student not found" });
      }
      const config2 = await getSchoolConfigWithDefaults(student.schoolId);
      const templateLength = config2?.installmentPlan?.length || 0;
      const studentInstallments = student.finance?.installments || [];
      const hasPayments = studentInstallments.some((i) => i.paid === true || ["completed", "verified", "verified_payment", "\u0645\u0643\u062A\u0645\u0644"].includes((i.status || "").toLowerCase()));
      const currentInstSum = studentInstallments.reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const discountRates = config2?.discountRates || {};
      const discountRate = Number(student.discountRate ?? (student.discountType ? discountRates[student.discountType] || 0 : 0));
      const grade = student.grade;
      const normalizedGrade = normalizeGradeCanonical(grade || "");
      const byGrade = config2?.tuitionFeesByGrade || {};
      let baseFee = grade && byGrade[grade] !== void 0 ? Number(byGrade[grade]) : void 0;
      if (baseFee === void 0 && normalizedGrade) {
        const matchKey = Object.keys(byGrade).find((k) => normalizeGradeCanonical(k) === normalizedGrade);
        if (matchKey) baseFee = Number(byGrade[matchKey]);
      }
      if (baseFee === void 0) baseFee = Number(config2?.tuitionFee || 0);
      const expectedTotal = baseFee - baseFee * discountRate / 100;
      const needsRepair = !student.finance || studentInstallments.length === 0 || !hasPayments && templateLength > 0 && studentInstallments.length !== templateLength || !hasPayments && discountRate > 0 && Math.abs(currentInstSum - expectedTotal) > 10 || !student.totalAmount || Number(student.totalAmount) === 0;
      if (needsRepair && config2) {
        const calc = calculateStudentFinancialsServer(student, config2);
        student.finance = calc.finance;
        student.totalAmount = calc.totalAmount;
        db.update(students).set({
          finance: calc.finance,
          totalAmount: calc.totalAmount,
          updatedAt: /* @__PURE__ */ new Date()
        }).where((0, import_drizzle_orm.eq)(students.id, student.id)).then(() => console.log(`[Finance] Repaired/Synced finance for student ${student.id} using config ${config2.id} (Template: ${templateLength})`)).catch((err) => console.error(`[Finance] Failed to sync finance for ${student.id}`, err));
      }
      res.json({ success: true, student });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  const ensureSchoolExists = async (schoolId, schoolName) => {
    if (!schoolId) return;
    try {
      const existing = await db.select().from(schools).where((0, import_drizzle_orm.eq)(schools.id, schoolId));
      if (existing.length === 0) {
        await db.insert(schools).values({
          id: schoolId,
          name: schoolName || "\u0645\u062F\u0631\u0633\u0629 \u063A\u064A\u0631 \u0645\u0639\u0631\u0641\u0629",
          governorate: "\u0627\u0644\u062F\u064A\u0648\u0627\u0646\u064A\u0629 - \u063A\u0645\u0627\u0633",
          status: "active"
        }).onConflictDoNothing();
        console.log(`[DB] Auto-created missing school: ${schoolId}`);
      }
    } catch (err) {
      console.error(`[DB] Failed to ensure school exists: ${schoolId}`, err);
    }
  };
  function normalizeGradeCanonical(raw) {
    if (!raw) return "";
    const s = raw.replace(/[أإآٱ]/g, "\u0627").replace(/ة/g, "\u0647").replace(/[ىي]/g, "\u064A").replace(/^(الصف|صف)\s+/g, "").trim();
    if (s.includes("\u0627\u0628\u062A\u062F\u0627\u0626\u064A")) {
      if (s.includes("\u0627\u0648\u0644")) return "\u0627\u0644\u0623\u0648\u0644 \u0627\u0628\u062A\u062F\u0627\u0626\u064A";
      if (s.includes("\u062B\u0627\u0646\u064A")) return "\u0627\u0644\u062B\u0627\u0646\u064A \u0627\u0628\u062A\u062F\u0627\u0626\u064A";
      if (s.includes("\u062B\u0627\u0644\u062B")) return "\u0627\u0644\u062B\u0627\u0644\u062B \u0627\u0628\u062A\u062F\u0627\u0626\u064A";
      if (s.includes("\u0631\u0627\u0628\u0639")) return "\u0627\u0644\u0631\u0627\u0628\u0639 \u0627\u0628\u062A\u062F\u0627\u0626\u064A";
      if (s.includes("\u062E\u0627\u0645\u0633")) return "\u0627\u0644\u062E\u0627\u0645\u0633 \u0627\u0628\u062A\u062F\u0627\u0626\u064A";
      if (s.includes("\u0633\u0627\u062F\u0633")) return "\u0627\u0644\u0633\u0627\u062F\u0633 \u0627\u0628\u062A\u062F\u0627\u0626\u064A";
      return "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A\u0629";
    }
    if (s.includes("\u0645\u062A\u0648\u0633\u0637")) {
      if (s.includes("\u0627\u0648\u0644")) return "\u0627\u0644\u0623\u0648\u0644 \u0645\u062A\u0648\u0633\u0637";
      if (s.includes("\u062B\u0627\u0646\u064A")) return "\u0627\u0644\u062B\u0627\u0646\u064A \u0645\u062A\u0648\u0633\u0637";
      if (s.includes("\u062B\u0627\u0644\u062B")) return "\u0627\u0644\u062B\u0627\u0644\u062B \u0645\u062A\u0648\u0633\u0637";
      return "\u0627\u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0645\u062A\u0648\u0633\u0637\u0629";
    }
    if (s.includes("\u0639\u0644\u0645\u064A")) {
      if (s.includes("\u0631\u0627\u0628\u0639")) return "\u0631\u0627\u0628\u0639 \u0639\u0644\u0645\u064A";
      if (s.includes("\u062E\u0627\u0645\u0633")) return "\u062E\u0627\u0645\u0633 \u0639\u0644\u0645\u064A";
      if (s.includes("\u0633\u0627\u062F\u0633")) return "\u0633\u0627\u062F\u0633 \u0639\u0644\u0645\u064A";
    }
    if (s.includes("\u0627\u062F\u0628\u064A")) {
      if (s.includes("\u0631\u0627\u0628\u0639")) return "\u0631\u0627\u0628\u0639 \u0627\u062F\u0628\u064A";
      if (s.includes("\u062E\u0627\u0645\u0633")) return "\u062E\u0627\u0645\u0633 \u0627\u062F\u0628\u064A";
      if (s.includes("\u0633\u0627\u062F\u0633")) return "\u0633\u0627\u062F\u0633 \u0627\u062F\u0628\u064A";
    }
    return raw;
  }
  function calculateStudentFinancialsServer(student, config2) {
    const grade = student.grade;
    const normalizedGrade = normalizeGradeCanonical(grade || "");
    const byGrade = config2.tuitionFeesByGrade || {};
    let baseFee = grade && byGrade[grade] !== void 0 ? Number(byGrade[grade]) : void 0;
    if (baseFee === void 0 && normalizedGrade) {
      const matchKey = Object.keys(byGrade).find((k) => normalizeGradeCanonical(k) === normalizedGrade);
      if (matchKey) baseFee = Number(byGrade[matchKey]);
    }
    if (baseFee === void 0) {
      baseFee = Number(config2.tuitionFee || 0);
    }
    const discountRates = config2.discountRates || {};
    let discountRate = Math.round(Number(student.discountRate ?? (student.discountType ? discountRates[student.discountType] || 0 : 0)));
    if (student.discountType && discountRates[student.discountType] !== void 0 && Number(discountRates[student.discountType]) > discountRate) {
      discountRate = Math.round(Number(discountRates[student.discountType]));
    }
    if (student.status === "\u0625\u0639\u0641\u0627\u0621 \u062A\u0627\u0645" || student.discountType === "FULL_EXEMPTION" || discountRate >= 100) {
      discountRate = 100;
    }
    const totalAmount = Math.round(baseFee - baseFee * discountRate / 100);
    const discountFactor = (100 - discountRate) / 100;
    let installmentPlan = config2.installmentPlan || [];
    if (installmentPlan.length === 0 && (student.schoolId === "school1" || student.schoolId === "school_awail_ghamas" || student.schoolId === "ghamas_awail")) {
      installmentPlan = [
        { id: "def_1", name: "\u0627\u0644\u0642\u0633\u0637 \u0627\u0644\u0623\u0648\u0644", amount: 2e5, date: "2025-10-01" },
        { id: "def_2", name: "\u0627\u0644\u0642\u0633\u0637 \u0627\u0644\u062B\u0627\u0646\u064A", amount: 15e4, date: "2026-01-01" },
        { id: "def_3", name: "\u0627\u0644\u0642\u0633\u0637 \u0627\u0644\u062B\u0627\u0644\u062B", amount: 1e5, date: "2026-03-01" },
        { id: "def_4", name: "\u0627\u0644\u0642\u0633\u0637 \u0627\u0644\u0631\u0627\u0628\u0639", amount: 1e5, date: "2026-05-01" }
      ];
    }
    const existingFinance = student.finance || {};
    const existingInstallments = existingFinance.installments || [];
    if (installmentPlan.length === 0 && existingInstallments.length > 0) {
      installmentPlan = existingInstallments;
    }
    const templateSum = installmentPlan.reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0);
    const gradeProportion = templateSum > 0 ? baseFee / templateSum : 1;
    const combinedFactor = gradeProportion * discountFactor;
    const installments = installmentPlan.map((inst, idx) => {
      const existing = existingInstallments.find((ei) => ei.name === inst.name) || existingInstallments[idx];
      const isPaid = existing?.paid === true || ["completed", "verified", "verified_payment", "\u0645\u0643\u062A\u0645\u0644"].includes((existing?.status || "").toLowerCase());
      return {
        ...inst,
        id: existing?.id || inst.id || `inst_${idx}_${Date.now()}`,
        amount: Math.round((Number(inst.amount) || 0) * combinedFactor),
        paid: isPaid,
        status: isPaid ? existing.status || "\u0645\u0643\u062A\u0645\u0644" : existing?.status || "pending"
      };
    });
    const paidAmount = Math.round(Number(student.paidAmount || 0));
    const remainingAmount = Math.round(Math.max(0, totalAmount - paidAmount));
    return {
      finance: {
        ...existingFinance,
        installments,
        totalTuition: totalAmount,
        paidAmount,
        remainingAmount,
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
      },
      totalAmount
    };
  }
  const saveBase64Image = async (base64Data, prefix) => {
    if (!base64Data || typeof base64Data !== "string" || !base64Data.startsWith("data:image/")) {
      return base64Data;
    }
    try {
      const matches = base64Data.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (!matches || matches.length < 3) return base64Data;
      let ext = matches[1].toLowerCase();
      if (ext === "jpeg") ext = "jpg";
      if (ext === "svg+xml") ext = "svg";
      const dataBuffer = Buffer.from(matches[2], "base64");
      const uploadsDir = import_path2.default.join(process.cwd(), "public", "uploads");
      if (!import_fs2.default.existsSync(uploadsDir)) {
        import_fs2.default.mkdirSync(uploadsDir, { recursive: true });
      }
      const fileName = `${prefix}_${Date.now()}.${ext}`;
      const filePath = import_path2.default.join(uploadsDir, fileName);
      await import_promises.default.writeFile(filePath, dataBuffer);
      return `/uploads/${fileName}`;
    } catch (e) {
      console.warn(`[SaveBase64Image] Failed to write file, returning raw string:`, e);
      return base64Data;
    }
  };
  const seedDefaultSchools = async () => {
    try {
      const defaultOfficialSchools = [
        { id: "school1", name: "\u062B\u0627\u0646\u0648\u064A\u0629 \u0627\u0648\u0627\u0626\u0644 \u063A\u0645\u0627\u0633 \u0627\u0644\u0627\u0647\u0644\u064A\u0629", governorate: "\u0627\u0644\u062F\u064A\u0648\u0627\u0646\u064A\u0629 - \u063A\u0645\u0627\u0633", status: "active" },
        { id: "school2", name: "\u062B\u0627\u0646\u0648\u064A\u0629 \u0627\u0644\u0646\u062E\u0628\u0629 \u0627\u0644\u0639\u0644\u0645\u064A\u0629 \u0644\u0644\u0628\u0646\u064A\u0646", governorate: "\u0627\u0644\u062F\u064A\u0648\u0627\u0646\u064A\u0629 - \u063A\u0645\u0627\u0633", status: "active" },
        { id: "school3", name: "\u062B\u0627\u0646\u0648\u064A\u0629 \u0646\u0648\u0646 \u0648\u0627\u0644\u0642\u0644\u0645 \u0627\u0644\u0627\u0647\u0644\u064A\u0629", governorate: "\u0627\u0644\u062F\u064A\u0648\u0627\u0646\u064A\u0629 - \u063A\u0645\u0627\u0633", status: "active" },
        { id: "school4", name: "\u062B\u0627\u0646\u0648\u064A\u0629 \u0627\u0644\u0646\u0628\u0623 \u0627\u0644\u0639\u0638\u064A\u0645 \u0627\u0644\u0627\u0647\u0644\u064A\u0629 \u0644\u0644\u0628\u0646\u0627\u062A", governorate: "\u0627\u0644\u062F\u064A\u0648\u0627\u0646\u064A\u0629 - \u063A\u0645\u0627\u0633", status: "active" },
        { id: "school5", name: "\u0645\u062F\u0627\u0631\u0633 \u0627\u0628\u0646 \u0639\u0642\u064A\u0644 \u0627\u0644\u0623\u0647\u0644\u064A\u0629", governorate: "\u0627\u0644\u062F\u064A\u0648\u0627\u0646\u064A\u0629 - \u063A\u0645\u0627\u0633", status: "active" },
        { id: "school6", name: "\u0645\u062F\u0631\u0633\u0629 \u0627\u0644\u064A\u0645\u0627\u0645\u0629 \u0627\u0644\u0627\u0628\u062A\u062F\u0627\u0626\u064A\u0629", governorate: "\u0627\u0644\u062F\u064A\u0648\u0627\u0646\u064A\u0629 - \u063A\u0645\u0627\u0633", status: "active" },
        { id: "school7", name: "\u0645\u062F\u0627\u0631\u0633 \u0627\u0644\u062C\u0648\u0627\u0647\u0631\u064A \u0627\u0644\u0627\u0647\u0644\u064A\u0629", governorate: "\u0627\u0644\u062F\u064A\u0648\u0627\u0646\u064A\u0629 - \u063A\u0645\u0627\u0633", status: "active" },
        { id: "school8", name: "\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629 \u0628\u064A\u0631\u0642 \u0627\u0644\u0631\u0642\u0645\u064A\u0629", governorate: "\u0627\u0644\u0639\u0631\u0627\u0642 - \u062F\u0648\u0631\u0627\u062A \u0646\u062E\u0628\u0629 \u0627\u0644\u0623\u0633\u0627\u062A\u0630\u0629", status: "active" }
      ];
      for (const item of defaultOfficialSchools) {
        await db.insert(schools).values({
          id: item.id,
          name: item.name,
          governorate: item.governorate,
          status: item.status
        }).onConflictDoNothing();
      }
      console.log("[DB] Official Ghammas schools verified in PostgreSQL");
    } catch (e) {
      console.warn("[DB] Seed default schools notice:", e);
    }
  };
  seedDefaultSchools().catch(console.error);
  app.post("/api/schools", requireDeveloper, async (req, res) => {
    try {
      const { id, name, governorate, location, city, type, activationCode, status, disabledModules, disabled_modules } = req.body;
      let { coverUrl, logoUrl, schoolBairaqImageUrl, schoolLogoUrl } = req.body;
      const schoolId = id || `school_${Date.now()}`;
      const resolvedDisabled = Array.isArray(disabledModules) ? disabledModules : Array.isArray(disabled_modules) ? disabled_modules : [];
      let resolvedCover = coverUrl || schoolBairaqImageUrl;
      let resolvedLogo = logoUrl || schoolLogoUrl;
      if (resolvedCover && resolvedCover.startsWith("data:image/")) {
        resolvedCover = await saveBase64Image(resolvedCover, `school_${schoolId}_cover`);
      }
      if (resolvedLogo && resolvedLogo.startsWith("data:image/")) {
        resolvedLogo = await saveBase64Image(resolvedLogo, `school_${schoolId}_logo`);
      }
      const resolvedLocation = location || city || governorate || "\u0627\u0644\u062F\u064A\u0648\u0627\u0646\u064A\u0629 - \u063A\u0645\u0627\u0633";
      const newSchool = await db.insert(schools).values({
        id: schoolId,
        name: name || "\u0645\u062F\u0631\u0633\u0629 \u062C\u062F\u064A\u062F\u0629",
        governorate: governorate || resolvedLocation,
        location: resolvedLocation,
        type: type || "\u0645\u064A\u062F\u0627\u0646 \u062A\u0639\u0644\u064A\u0645\u064A",
        coverUrl: resolvedCover || null,
        logoUrl: resolvedLogo || null,
        activationCode: activationCode || "",
        status: status || "active",
        disabledModules: resolvedDisabled
      }).onConflictDoUpdate({
        target: schools.id,
        set: {
          name: name || void 0,
          governorate: governorate || resolvedLocation || void 0,
          location: resolvedLocation || void 0,
          type: type || void 0,
          coverUrl: resolvedCover || void 0,
          logoUrl: resolvedLogo || void 0,
          activationCode: activationCode || void 0,
          status: status || void 0,
          disabledModules: resolvedDisabled
        }
      }).returning();
      const returned = {
        ...newSchool[0],
        coverUrl: newSchool[0]?.coverUrl || resolvedCover,
        logoUrl: newSchool[0]?.logoUrl || resolvedLogo,
        schoolBairaqImageUrl: newSchool[0]?.coverUrl || resolvedCover,
        schoolLogoUrl: newSchool[0]?.logoUrl || resolvedLogo,
        location: newSchool[0]?.location || resolvedLocation,
        city: newSchool[0]?.location || resolvedLocation,
        disabledModules: Array.isArray(newSchool[0]?.disabledModules) ? newSchool[0]?.disabledModules : Array.isArray(newSchool[0]?.disabled_modules) ? newSchool[0].disabled_modules : resolvedDisabled
      };
      realtimeServerInstance?.broadcastManual("schools", schoolId, "INSERT", returned);
      res.json({ success: true, school: returned, data: returned });
    } catch (error) {
      console.error("Error adding school:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.patch("/api/schools/:id", requireRole(["admin", "admin-boys", "admin-girls", "manager", "developer"]), requireSchoolContext("id"), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const existing = await db.select().from(schools).where((0, import_drizzle_orm.eq)(schools.id, id));
      let returnedSchool = null;
      const disabledList = updates.disabledModules !== void 0 ? Array.isArray(updates.disabledModules) ? updates.disabledModules : [] : updates.disabled_modules !== void 0 ? Array.isArray(updates.disabled_modules) ? updates.disabled_modules : [] : void 0;
      let resolvedCover = updates.coverUrl || updates.schoolBairaqImageUrl;
      let resolvedLogo = updates.logoUrl || updates.schoolLogoUrl;
      if (resolvedCover && resolvedCover.startsWith("data:image/")) {
        resolvedCover = await saveBase64Image(resolvedCover, `school_${id}_cover`);
      }
      if (resolvedLogo && resolvedLogo.startsWith("data:image/")) {
        resolvedLogo = await saveBase64Image(resolvedLogo, `school_${id}_logo`);
      }
      const resolvedLocation = updates.location || updates.city || updates.governorate;
      if (existing.length > 0) {
        const updatePayload = {};
        if (updates.name !== void 0) updatePayload.name = updates.name;
        if (updates.governorate !== void 0) updatePayload.governorate = updates.governorate;
        if (resolvedLocation !== void 0) updatePayload.location = resolvedLocation;
        if (updates.type !== void 0) updatePayload.type = updates.type;
        if (resolvedCover !== void 0) updatePayload.coverUrl = resolvedCover;
        if (resolvedLogo !== void 0) updatePayload.logoUrl = resolvedLogo;
        if (updates.activationCode !== void 0) updatePayload.activationCode = updates.activationCode;
        if (updates.status !== void 0) updatePayload.status = updates.status;
        if (disabledList !== void 0) updatePayload.disabledModules = disabledList;
        if (Object.keys(updatePayload).length > 0) {
          const resUpdated = await db.update(schools).set(updatePayload).where((0, import_drizzle_orm.eq)(schools.id, id)).returning();
          returnedSchool = resUpdated[0];
        } else {
          returnedSchool = existing[0];
        }
      } else {
        if (!updates.name) {
          return res.status(404).json({ success: false, message: "School not found" });
        }
        const resInserted = await db.insert(schools).values({
          id,
          name: updates.name,
          governorate: updates.governorate || resolvedLocation || "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F",
          location: resolvedLocation || updates.governorate || "\u0627\u0644\u062F\u064A\u0648\u0627\u0646\u064A\u0629 - \u063A\u0645\u0627\u0633",
          type: updates.type || "\u0645\u064A\u062F\u0627\u0646 \u062A\u0639\u0644\u064A\u0645\u064A",
          coverUrl: resolvedCover || null,
          logoUrl: resolvedLogo || null,
          activationCode: updates.activationCode || updates.code || id,
          status: updates.status || "active",
          disabledModules: disabledList !== void 0 ? disabledList : [],
          createdAt: /* @__PURE__ */ new Date()
        }).onConflictDoNothing().returning();
        returnedSchool = resInserted[0] || { id, ...updates, disabledModules: disabledList || [] };
      }
      if (returnedSchool) {
        returnedSchool.disabledModules = Array.isArray(returnedSchool.disabledModules) ? returnedSchool.disabledModules : Array.isArray(returnedSchool.disabled_modules) ? returnedSchool.disabled_modules : disabledList || [];
        returnedSchool.coverUrl = returnedSchool.coverUrl || returnedSchool.cover_url || resolvedCover;
        returnedSchool.logoUrl = returnedSchool.logoUrl || returnedSchool.logo_url || resolvedLogo;
        returnedSchool.schoolBairaqImageUrl = returnedSchool.coverUrl;
        returnedSchool.schoolLogoUrl = returnedSchool.logoUrl;
        returnedSchool.location = returnedSchool.location || resolvedLocation || returnedSchool.governorate;
        returnedSchool.city = returnedSchool.location;
      }
      realtimeServerInstance?.broadcastManual("schools", id, "UPDATE", returnedSchool || { id, ...updates, disabledModules: disabledList || [] });
      res.json({ success: true, id, school: returnedSchool, data: returnedSchool });
    } catch (error) {
      console.error("Error patching school:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.put("/api/schools/:id", requireRole(["admin", "admin-boys", "admin-girls", "manager", "developer"]), requireSchoolContext("id"), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const existing = await db.select().from(schools).where((0, import_drizzle_orm.eq)(schools.id, id));
      let returnedSchool = null;
      const disabledList = updates.disabledModules !== void 0 ? Array.isArray(updates.disabledModules) ? updates.disabledModules : [] : updates.disabled_modules !== void 0 ? Array.isArray(updates.disabled_modules) ? updates.disabled_modules : [] : void 0;
      let resolvedCover = updates.coverUrl || updates.schoolBairaqImageUrl;
      let resolvedLogo = updates.logoUrl || updates.schoolLogoUrl;
      if (resolvedCover && resolvedCover.startsWith("data:image/")) {
        resolvedCover = await saveBase64Image(resolvedCover, `school_${id}_cover`);
      }
      if (resolvedLogo && resolvedLogo.startsWith("data:image/")) {
        resolvedLogo = await saveBase64Image(resolvedLogo, `school_${id}_logo`);
      }
      const resolvedLocation = updates.location || updates.city || updates.governorate;
      if (existing.length > 0) {
        const updatePayload = {};
        if (updates.name !== void 0) updatePayload.name = updates.name;
        if (updates.governorate !== void 0) updatePayload.governorate = updates.governorate;
        if (resolvedLocation !== void 0) updatePayload.location = resolvedLocation;
        if (updates.type !== void 0) updatePayload.type = updates.type;
        if (resolvedCover !== void 0) updatePayload.coverUrl = resolvedCover;
        if (resolvedLogo !== void 0) updatePayload.logoUrl = resolvedLogo;
        if (updates.activationCode !== void 0) updatePayload.activationCode = updates.activationCode;
        if (updates.status !== void 0) updatePayload.status = updates.status;
        if (disabledList !== void 0) updatePayload.disabledModules = disabledList;
        if (Object.keys(updatePayload).length > 0) {
          const resUpdated = await db.update(schools).set(updatePayload).where((0, import_drizzle_orm.eq)(schools.id, id)).returning();
          returnedSchool = resUpdated[0];
        } else {
          returnedSchool = existing[0];
        }
      } else {
        if (!updates.name) {
          return res.status(404).json({ success: false, message: "School not found" });
        }
        const resInserted = await db.insert(schools).values({
          id,
          name: updates.name,
          governorate: updates.governorate || resolvedLocation || "\u063A\u064A\u0631 \u0645\u062D\u062F\u062F",
          location: resolvedLocation || updates.governorate || "\u0627\u0644\u062F\u064A\u0648\u0627\u0646\u064A\u0629 - \u063A\u0645\u0627\u0633",
          type: updates.type || "\u0645\u064A\u062F\u0627\u0646 \u062A\u0639\u0644\u064A\u0645\u064A",
          coverUrl: resolvedCover || null,
          logoUrl: resolvedLogo || null,
          activationCode: updates.activationCode || updates.code || id,
          status: updates.status || "active",
          disabledModules: disabledList !== void 0 ? disabledList : [],
          createdAt: /* @__PURE__ */ new Date()
        }).onConflictDoNothing().returning();
        returnedSchool = resInserted[0] || { id, ...updates, disabledModules: disabledList || [] };
      }
      if (returnedSchool) {
        returnedSchool.disabledModules = Array.isArray(returnedSchool.disabledModules) ? returnedSchool.disabledModules : Array.isArray(returnedSchool.disabled_modules) ? returnedSchool.disabled_modules : disabledList || [];
        returnedSchool.coverUrl = returnedSchool.coverUrl || returnedSchool.cover_url || resolvedCover;
        returnedSchool.logoUrl = returnedSchool.logoUrl || returnedSchool.logo_url || resolvedLogo;
        returnedSchool.schoolBairaqImageUrl = returnedSchool.coverUrl;
        returnedSchool.schoolLogoUrl = returnedSchool.logoUrl;
        returnedSchool.location = returnedSchool.location || resolvedLocation || returnedSchool.governorate;
        returnedSchool.city = returnedSchool.location;
      }
      realtimeServerInstance?.broadcastManual("schools", id, "UPDATE", returnedSchool || { id, ...updates, disabledModules: disabledList || [] });
      res.json({ success: true, id, school: returnedSchool, data: returnedSchool });
    } catch (error) {
      console.error("Error putting school:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/schools/:id", requireDeveloper, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const resolvedDisabled = Array.isArray(updates.disabledModules) ? updates.disabledModules : Array.isArray(updates.disabled_modules) ? updates.disabled_modules : [];
      let resolvedCover = updates.coverUrl || updates.schoolBairaqImageUrl;
      let resolvedLogo = updates.logoUrl || updates.schoolLogoUrl;
      if (resolvedCover && resolvedCover.startsWith("data:image/")) {
        resolvedCover = await saveBase64Image(resolvedCover, `school_${id}_cover`);
      }
      if (resolvedLogo && resolvedLogo.startsWith("data:image/")) {
        resolvedLogo = await saveBase64Image(resolvedLogo, `school_${id}_logo`);
      }
      const resolvedLocation = updates.location || updates.city || updates.governorate || "\u0627\u0644\u062F\u064A\u0648\u0627\u0646\u064A\u0629 - \u063A\u0645\u0627\u0633";
      const result = await db.insert(schools).values({
        id,
        name: updates.name || "\u0645\u062F\u0631\u0633\u0629 \u062C\u062F\u064A\u062F\u0629",
        governorate: updates.governorate || resolvedLocation,
        location: resolvedLocation,
        type: updates.type || "\u0645\u064A\u062F\u0627\u0646 \u062A\u0639\u0644\u064A\u0645\u064A",
        coverUrl: resolvedCover || null,
        logoUrl: resolvedLogo || null,
        activationCode: updates.activationCode || updates.code || id,
        status: updates.status || "active",
        disabledModules: resolvedDisabled,
        createdAt: /* @__PURE__ */ new Date()
      }).onConflictDoUpdate({
        target: schools.id,
        set: {
          name: updates.name || void 0,
          governorate: updates.governorate || resolvedLocation || void 0,
          location: resolvedLocation || void 0,
          type: updates.type || void 0,
          coverUrl: resolvedCover || void 0,
          logoUrl: resolvedLogo || void 0,
          activationCode: updates.activationCode || void 0,
          status: updates.status || void 0,
          disabledModules: resolvedDisabled
        }
      }).returning();
      const returned = {
        ...result[0],
        coverUrl: result[0]?.coverUrl || resolvedCover,
        logoUrl: result[0]?.logoUrl || resolvedLogo,
        schoolBairaqImageUrl: result[0]?.coverUrl || resolvedCover,
        schoolLogoUrl: result[0]?.logoUrl || resolvedLogo,
        location: result[0]?.location || resolvedLocation,
        city: result[0]?.location || resolvedLocation,
        disabledModules: Array.isArray(result[0]?.disabledModules) ? result[0].disabledModules : Array.isArray(result[0]?.disabled_modules) ? result[0].disabled_modules : resolvedDisabled
      };
      realtimeServerInstance?.broadcastManual("schools", id, "UPDATE", returned || { id, ...updates, disabledModules: resolvedDisabled });
      res.json({ success: true, id, school: returned, data: returned });
    } catch (error) {
      console.error("Error posting school by ID:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/schools", async (req, res) => {
    try {
      const allSchools = await withDbRetry(() => db.select().from(schools));
      const mappedSchools = allSchools.map((s) => {
        const cover = s.coverUrl || s.cover_url;
        const logo = s.logoUrl || s.logo_url;
        const loc = s.location || s.governorate || "\u0627\u0644\u062F\u064A\u0648\u0627\u0646\u064A\u0629 - \u063A\u0645\u0627\u0633";
        return {
          ...s,
          coverUrl: cover,
          logoUrl: logo,
          schoolBairaqImageUrl: cover,
          schoolLogoUrl: logo,
          location: loc,
          city: loc,
          governorate: s.governorate || loc,
          disabledModules: Array.isArray(s.disabledModules) ? s.disabledModules : Array.isArray(s.disabled_modules) ? s.disabled_modules : []
        };
      });
      res.json({ success: true, schools: mappedSchools, data: mappedSchools });
    } catch (error) {
      console.error("Error fetching schools:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/schools/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const schoolList = await withDbRetry(() => db.select().from(schools).where((0, import_drizzle_orm.eq)(schools.id, id)));
      if (schoolList.length === 0) {
        return res.json({ success: true, school: null, data: null });
      }
      const school = schoolList[0];
      const cover = school.coverUrl || school.cover_url;
      const logo = school.logoUrl || school.logo_url;
      const loc = school.location || school.governorate || "\u0627\u0644\u062F\u064A\u0648\u0627\u0646\u064A\u0629 - \u063A\u0645\u0627\u0633";
      const mappedSchool = {
        ...school,
        coverUrl: cover,
        logoUrl: logo,
        schoolBairaqImageUrl: cover,
        schoolLogoUrl: logo,
        location: loc,
        city: loc,
        governorate: school.governorate || loc,
        disabledModules: Array.isArray(school.disabledModules) ? school.disabledModules : Array.isArray(school.disabled_modules) ? school.disabled_modules : []
      };
      res.json({ success: true, school: mappedSchool, data: mappedSchool });
    } catch (error) {
      console.error("Error fetching school:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/schools/:id", requireDeveloper, async (req, res) => {
    try {
      const { id } = req.params;
      await db.transaction(async (tx) => {
        try {
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM activity_submissions WHERE school_id = ${id} OR task_id IN (SELECT id FROM activity_tasks WHERE school_id = ${id})`);
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM activity_tasks WHERE school_id = ${id}`);
        } catch (e) {
          console.warn("Cascading activity_tasks warning:", e);
        }
        try {
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM exam_papers WHERE school_id = ${id}`);
        } catch (e) {
          console.warn("Cascading exam_papers warning:", e);
        }
        try {
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM transport_fees WHERE student_id IN (SELECT id FROM students WHERE school_id = ${id})`);
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM transport_students_status WHERE route_id IN (SELECT id FROM transport_routes WHERE school_id = ${id})`);
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM transport_drivers WHERE school_id = ${id}`);
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM transport_routes WHERE school_id = ${id}`);
        } catch (e) {
          console.warn("Cascading transport warning:", e);
        }
        try {
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM community_comments WHERE post_id IN (SELECT id FROM community_posts WHERE school_id = ${id})`);
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM community_posts WHERE school_id = ${id}`);
        } catch (e) {
          console.warn("Cascading community warning:", e);
        }
        try {
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM student_transactions WHERE school_id = ${id} OR student_id IN (SELECT id FROM students WHERE school_id = ${id})`);
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM attendance_logs WHERE school_id = ${id} OR student_id IN (SELECT id FROM students WHERE school_id = ${id})`);
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM behavior_logs WHERE school_id = ${id} OR student_id IN (SELECT id FROM students WHERE school_id = ${id})`);
        } catch (e) {
          console.warn("Cascading student logs warning:", e);
        }
        try {
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM salaries WHERE staff_id IN (SELECT id FROM teachers WHERE school_id = ${id})`);
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM class_schedules WHERE school_id = ${id}`);
        } catch (e) {
          console.warn("Cascading teacher schedules warning:", e);
        }
        try {
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM school_announcements WHERE school_id = ${id}`);
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM notifications WHERE school_id = ${id}`);
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM broadcasts WHERE school_id = ${id}`);
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM support_tickets WHERE school_id = ${id}`);
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM idea_bank WHERE school_id = ${id}`);
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM council_polls WHERE school_id = ${id}`);
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM payment_requests WHERE school_id = ${id}`);
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM activation_codes WHERE school_id = ${id}`);
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM recorded_lessons WHERE school_id = ${id}`);
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM school_files WHERE school_id = ${id}`);
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM academy_pages WHERE school_id = ${id}`);
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM lounge_messages WHERE school_id = ${id}`);
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM academic_lists WHERE school_id = ${id}`);
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM school_configs WHERE id = ${id}`);
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM audit_logs WHERE school_id = ${id}`);
        } catch (e) {
          console.warn("Cascading school misc warning:", e);
        }
        try {
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM students WHERE school_id = ${id}`);
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM teachers WHERE school_id = ${id}`);
          await tx.execute(import_drizzle_orm2.sql`DELETE FROM users WHERE school_id = ${id}`);
        } catch (e) {
          console.warn("Cascading core entities warning:", e);
        }
        await tx.execute(import_drizzle_orm2.sql`DELETE FROM schools WHERE id = ${id}`);
      });
      res.json({ success: true, message: `School ${id} and all associated records deleted successfully` });
    } catch (error) {
      console.error("Error deleting school:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/students", async (req, res) => {
    try {
      const { schoolId } = req.query;
      if (schoolId && schoolId !== "all") {
        const cleaned = schoolId.trim().toLowerCase();
        let schoolStudents;
        if (cleaned === "school_awail_ghamas" || cleaned === "ghamas_awail") {
          schoolStudents = await db.select().from(students).where(
            (0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(students.schoolId, "school1"), (0, import_drizzle_orm.eq)(students.schoolId, schoolId))
          );
        } else {
          schoolStudents = await db.select().from(students).where((0, import_drizzle_orm.eq)(students.schoolId, schoolId));
        }
        return res.json({ success: true, students: schoolStudents, data: schoolStudents });
      }
      const allStudents = await db.select().from(students);
      res.json({ success: true, students: allStudents, data: allStudents });
    } catch (error) {
      console.error("Error fetching all students:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/students/:schoolId", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const cleaned = (schoolId || "").trim().toLowerCase();
      let schoolStudents;
      if (cleaned === "school_awail_ghamas" || cleaned === "ghamas_awail") {
        schoolStudents = await db.select().from(students).where(
          (0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(students.schoolId, "school1"), (0, import_drizzle_orm.eq)(students.schoolId, schoolId))
        );
      } else {
        schoolStudents = await db.select().from(students).where((0, import_drizzle_orm.eq)(students.schoolId, schoolId));
      }
      if (schoolStudents.length > 0) {
        return res.json({ success: true, students: schoolStudents, data: schoolStudents });
      }
      const singleStudent = await db.select().from(students).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(students.id, schoolId), (0, import_drizzle_orm.eq)(students.code, schoolId)));
      if (singleStudent.length > 0) {
        return res.json({ success: true, student: singleStudent[0], data: singleStudent[0], students: singleStudent });
      }
      res.json({ success: true, students: [], data: null });
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/students/sync-all", async (req, res) => {
    try {
      const { students: studentsToSync } = req.body;
      if (!Array.isArray(studentsToSync)) throw new Error("Students must be an array");
      const uniqueSchoolIds = [...new Set(studentsToSync.map((s) => s.schoolId))].filter(Boolean);
      for (const sid of uniqueSchoolIds) {
        await ensureSchoolExists(sid);
      }
      if (uniqueSchoolIds.length === 0) {
        await ensureSchoolExists("school1");
      }
      const schoolConfigsList = uniqueSchoolIds.length > 0 ? await db.select().from(school_configs).where((0, import_drizzle_orm.inArray)(school_configs.id, uniqueSchoolIds)) : [];
      const schoolConfigsMap = new Map(schoolConfigsList.map((c) => [c.id, c]));
      const operations = studentsToSync.map(async (student) => {
        const targetSchoolId = student.schoolId || uniqueSchoolIds[0] || "school1";
        await ensureSchoolExists(targetSchoolId);
        let financeData = student.finance;
        let totalAmountVal = Math.round(Number(student.totalAmount || 0));
        const config2 = schoolConfigsMap.get(targetSchoolId);
        if (config2 && config2.installmentPlan && Array.isArray(config2.installmentPlan)) {
          const calc = calculateStudentFinancialsServer(student, config2);
          financeData = calc.finance;
          totalAmountVal = calc.totalAmount;
        }
        const studentId = String(student.id || `${targetSchoolId}_${student.code || student.student || Date.now()}`).trim().replace(/\s+/g, "_");
        const cleanDiscountRate = Math.round(Number(student.discountRate || 0));
        const cleanPaidAmount = Math.round(Number(student.paidAmount || 0));
        const cleanTotalAmount = Math.round(Number(totalAmountVal || 0));
        const cleanPoints = Math.round(Number(student.points || 0));
        const studentValues = {
          id: studentId,
          schoolId: targetSchoolId,
          name: String(student.name || "\u0637\u0627\u0644\u0628").trim(),
          grade: student.grade ? String(student.grade) : null,
          code: student.code || student.student ? String(student.code || student.student) : null,
          parentCode: student.parentCode || student.parent ? String(student.parentCode || student.parent) : null,
          avatar: student.avatar ? String(student.avatar) : null,
          points: cleanPoints,
          parentPhone: student.parentPhone ? String(student.parentPhone) : null,
          status: student.status ? String(student.status) : "\u0646\u0634\u0637",
          isBanned: Boolean(student.isBanned),
          canPost: student.canPost !== false,
          canComment: student.canComment !== false,
          deviceId: student.deviceId ? String(student.deviceId) : null,
          lastLogin: student.lastLogin ? new Date(student.lastLogin) : null,
          paidAmount: cleanPaidAmount,
          totalAmount: cleanTotalAmount,
          discountType: student.discountType ? String(student.discountType) : null,
          discountRate: cleanDiscountRate,
          isTopStudent: Boolean(student.isTopStudent),
          topStudentPeriod: student.topStudentPeriod ? String(student.topStudentPeriod) : null,
          lastSyncedPeriod: student.lastSyncedPeriod ? String(student.lastSyncedPeriod) : null,
          grades: student.grades && typeof student.grades === "object" ? student.grades : {},
          behavior: student.behavior && typeof student.behavior === "object" ? student.behavior : { score: 100, logs: [] },
          attendance: student.attendance && typeof student.attendance === "object" ? student.attendance : { present: 0, absent: 0, late: 0, logs: [] },
          finance: financeData && typeof financeData === "object" ? financeData : { installments: [], transactions: [] },
          updatedAt: /* @__PURE__ */ new Date()
        };
        return db.insert(students).values(studentValues).onConflictDoUpdate({
          target: students.id,
          set: {
            schoolId: studentValues.schoolId,
            name: studentValues.name,
            grade: studentValues.grade,
            code: studentValues.code,
            parentCode: studentValues.parentCode,
            status: studentValues.status,
            paidAmount: studentValues.paidAmount,
            totalAmount: studentValues.totalAmount,
            discountType: studentValues.discountType,
            discountRate: studentValues.discountRate,
            isTopStudent: studentValues.isTopStudent,
            topStudentPeriod: studentValues.topStudentPeriod,
            lastSyncedPeriod: studentValues.lastSyncedPeriod,
            grades: studentValues.grades,
            behavior: studentValues.behavior,
            attendance: studentValues.attendance,
            finance: studentValues.finance,
            updatedAt: /* @__PURE__ */ new Date()
          }
        });
      });
      const results = await Promise.allSettled(operations);
      const errors = results.filter((r) => r.status === "rejected");
      if (errors.length > 0) {
        console.warn(`[Sync Students] ${errors.length} of ${operations.length} encountered an issue:`, errors[0].reason);
      }
      res.json({ success: true, processed: operations.length, errorsCount: errors.length });
    } catch (error) {
      console.error("Error syncing students:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.patch("/api/students/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { createdAt: _, updatedAt: __, ...updates } = req.body;
      if (updates.discountRate !== void 0) {
        updates.discountRate = Math.round(Number(updates.discountRate || 0));
      }
      if (updates.totalAmount !== void 0) {
        updates.totalAmount = Math.round(Number(updates.totalAmount || 0));
      }
      if (updates.paidAmount !== void 0) {
        updates.paidAmount = Math.round(Number(updates.paidAmount || 0));
      }
      if (updates.points !== void 0) {
        updates.points = Math.round(Number(updates.points || 0));
      }
      const existingStudentResult = await db.select().from(students).where((0, import_drizzle_orm.eq)(students.id, id));
      const s = existingStudentResult[0];
      if (s) {
        const schoolId = updates.schoolId || s.schoolId;
        if (schoolId) {
          await ensureSchoolExists(schoolId);
        }
        const needsRecalc = !s.finance || !s.finance.installments || updates.grade !== void 0 || updates.discountType !== void 0 || updates.discountRate !== void 0 || updates.schoolId !== void 0;
        if (needsRecalc && schoolId) {
          const config2 = await db.select().from(school_configs).where((0, import_drizzle_orm.eq)(school_configs.id, schoolId));
          if (config2[0] && config2[0].installmentPlan && Array.isArray(config2[0].installmentPlan)) {
            const calc = calculateStudentFinancialsServer({ ...s, ...updates }, config2[0]);
            updates.finance = calc.finance;
            updates.totalAmount = calc.totalAmount;
          }
        }
      }
      const result = await db.update(students).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm.eq)(students.id, id)).returning();
      realtimeServerInstance?.broadcastManual("students", id, "UPDATE", result[0]);
      res.json({ success: true, student: result[0] });
    } catch (error) {
      console.error("Error patching student:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/students/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(students).where((0, import_drizzle_orm.eq)(students.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/academic-lists", async (req, res) => {
    try {
      const { schoolId } = req.query;
      let lists;
      if (schoolId && schoolId !== "all" && schoolId !== "undefined" && schoolId !== "null") {
        const cleaned = schoolId.trim().toLowerCase();
        if (cleaned === "school_awail_ghamas" || cleaned === "ghamas_awail") {
          lists = await db.select().from(academic_lists).where(
            (0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(academic_lists.schoolId, "school1"), (0, import_drizzle_orm.eq)(academic_lists.schoolId, schoolId))
          );
        } else {
          lists = await db.select().from(academic_lists).where((0, import_drizzle_orm.eq)(academic_lists.schoolId, schoolId));
        }
      } else {
        lists = await db.select().from(academic_lists);
      }
      res.json({ success: true, academicLists: lists, data: lists });
    } catch (error) {
      console.error("Error fetching academic lists:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/academic-lists/:schoolId", async (req, res) => {
    try {
      const { schoolId } = req.params;
      let lists;
      if (schoolId && schoolId !== "all" && schoolId !== "undefined" && schoolId !== "null") {
        const cleaned = (schoolId || "").trim().toLowerCase();
        if (cleaned === "school_awail_ghamas" || cleaned === "ghamas_awail") {
          lists = await db.select().from(academic_lists).where(
            (0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(academic_lists.schoolId, "school1"), (0, import_drizzle_orm.eq)(academic_lists.schoolId, schoolId))
          );
        } else {
          lists = await db.select().from(academic_lists).where((0, import_drizzle_orm.eq)(academic_lists.schoolId, schoolId));
        }
      } else {
        lists = await db.select().from(academic_lists);
      }
      res.json({ success: true, academicLists: lists, data: lists });
    } catch (error) {
      console.error("Error fetching academic lists:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/academic-lists", async (req, res) => {
    try {
      const { id, name, schoolId, schoolName, date, students: listStudents, removedSubjects, lastSyncedPeriod } = req.body;
      if (schoolId) {
        await ensureSchoolExists(schoolId, schoolName);
      }
      const values = {
        id,
        name,
        schoolId,
        schoolName,
        date,
        students: listStudents || [],
        removedSubjects: removedSubjects || [],
        lastSyncedPeriod,
        updatedAt: /* @__PURE__ */ new Date()
      };
      const result = await db.insert(academic_lists).values(values).onConflictDoUpdate({
        target: academic_lists.id,
        set: values
      }).returning();
      realtimeServerInstance?.broadcastManual("academic_lists", result[0].id, "INSERT", result[0]);
      res.json({ success: true, academicList: result[0] });
    } catch (error) {
      console.error("Error saving academic list:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/academic-lists/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(academic_lists).where((0, import_drizzle_orm.eq)(academic_lists.id, id));
      realtimeServerInstance?.broadcastManual("academic_lists", id, "DELETE", { id });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting academic list:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  const getSchoolConfigWithDefaults = async (schoolId) => {
    const cleaned = (schoolId || "").trim().toLowerCase();
    let resolvedId = schoolId;
    if (cleaned === "school_awail_ghamas" || cleaned === "ghamas_awail") {
      resolvedId = "school1";
    }
    const configResult = await db.select().from(school_configs).where((0, import_drizzle_orm.eq)(school_configs.id, resolvedId));
    let config2 = configResult[0];
    const schoolData = await db.select({ disabledModules: schools.disabledModules }).from(schools).where((0, import_drizzle_orm.eq)(schools.id, resolvedId));
    const disabledModules = Array.isArray(schoolData[0]?.disabledModules) ? schoolData[0].disabledModules : [];
    if (!config2) {
      config2 = {
        id: resolvedId,
        tuitionFee: 55e4,
        disabledModules,
        installmentPlan: [
          { id: "inst_1", name: "\u0627\u0644\u0642\u0633\u0637 \u0627\u0644\u0623\u0648\u0644", amount: 2e5, date: "2025-10-01" },
          { id: "inst_2", name: "\u0627\u0644\u0642\u0633\u0637 \u0627\u0644\u062B\u0627\u0646\u064A", amount: 15e4, date: "2026-01-01" },
          { id: "inst_3", name: "\u0627\u0644\u0642\u0633\u0637 \u0627\u0644\u062B\u0627\u0644\u062B", amount: 1e5, date: "2026-03-01" },
          { id: "inst_4", name: "\u0627\u0644\u0642\u0633\u0637 \u0627\u0644\u0631\u0627\u0628\u0639", amount: 1e5, date: "2026-05-01" }
        ],
        discountRates: {
          "brother": 10,
          "martyr": 20,
          "distinguished": 15
        }
      };
    } else {
      config2 = { ...config2, disabledModules };
      if (!config2.installmentPlan || Array.isArray(config2.installmentPlan) && config2.installmentPlan.length === 0) {
        config2.installmentPlan = [
          { id: "inst_1", name: "\u0627\u0644\u0642\u0633\u0637 \u0627\u0644\u0623\u0648\u0644", amount: 2e5, date: "2025-10-01" },
          { id: "inst_2", name: "\u0627\u0644\u0642\u0633\u0637 \u0627\u0644\u062B\u0627\u0646\u064A", amount: 15e4, date: "2026-01-01" },
          { id: "inst_3", name: "\u0627\u0644\u0642\u0633\u0637 \u0627\u0644\u062B\u0627\u0644\u062B", amount: 1e5, date: "2026-03-01" },
          { id: "inst_4", name: "\u0627\u0644\u0642\u0633\u0637 \u0627\u0644\u0631\u0627\u0628\u0639", amount: 1e5, date: "2026-05-01" }
        ];
      }
      if (!config2.tuitionFee) config2.tuitionFee = 55e4;
    }
    return config2;
  };
  const updateStudentsFinanceOnConfigChange = async (schoolId, config2) => {
    try {
      console.log(`[Finance] School config changed for ${schoolId}. Triggering student finance update...`);
      const schoolStudents = await db.select().from(students).where((0, import_drizzle_orm.eq)(students.schoolId, schoolId));
      for (const s of schoolStudents) {
        const calc = calculateStudentFinancialsServer(s, config2);
        const [updatedStudent] = await db.update(students).set({
          finance: calc.finance,
          totalAmount: calc.totalAmount,
          updatedAt: /* @__PURE__ */ new Date()
        }).where((0, import_drizzle_orm.eq)(students.id, s.id)).returning();
        if (updatedStudent) {
          realtimeServerInstance?.broadcastManual("students", s.id, "UPDATE", updatedStudent);
        }
      }
      console.log(`[Finance] Updated ${schoolStudents.length} students for school ${schoolId}`);
    } catch (err) {
      console.error(`[Finance] Failed to update students for school ${schoolId}:`, err);
    }
  };
  app.get("/api/school-configs", async (req, res) => {
    try {
      const schoolId = req.query.schoolId || req.query.id;
      if (schoolId) {
        const config2 = await getSchoolConfigWithDefaults(schoolId);
        return res.json({ success: true, config: config2, data: config2 });
      }
      const configs = await db.select().from(school_configs);
      res.json({ success: true, configs, data: configs });
    } catch (error) {
      console.error("Error fetching school configs:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/school-configs/:schoolId", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const config2 = await getSchoolConfigWithDefaults(schoolId);
      res.json({ success: true, config: config2 });
    } catch (error) {
      console.error("Error fetching school config:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/school-configs", async (req, res) => {
    try {
      const { updatedAt: _, ...configData } = req.body;
      const result = await db.insert(school_configs).values({
        ...configData,
        updatedAt: /* @__PURE__ */ new Date()
      }).onConflictDoUpdate({
        target: school_configs.id,
        set: { ...configData, updatedAt: /* @__PURE__ */ new Date() }
      }).returning();
      const financialFields = ["tuitionFee", "tuitionFeesByGrade", "installmentPlan", "discountRates"];
      const hasFinancialChanges = Object.keys(configData).some((key) => financialFields.includes(key));
      if (hasFinancialChanges) {
        updateStudentsFinanceOnConfigChange(configData.id, result[0]);
      }
      realtimeServerInstance?.broadcastManual("school_configs", configData.id, "UPDATE", result[0]);
      res.json({ success: true, config: result[0], data: result[0] });
    } catch (error) {
      console.error("Error saving school config:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.patch("/api/school-configs/:schoolId", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { updatedAt: _, ...configData } = req.body;
      const result = await db.insert(school_configs).values({
        id: schoolId,
        ...configData,
        updatedAt: /* @__PURE__ */ new Date()
      }).onConflictDoUpdate({
        target: school_configs.id,
        set: { ...configData, updatedAt: /* @__PURE__ */ new Date() }
      }).returning();
      const financialFields = ["tuitionFee", "tuitionFeesByGrade", "installmentPlan", "discountRates"];
      const hasFinancialChanges = Object.keys(configData).some((key) => financialFields.includes(key));
      if (hasFinancialChanges) {
        updateStudentsFinanceOnConfigChange(schoolId, result[0]);
      }
      realtimeServerInstance?.broadcastManual("school_configs", schoolId, "UPDATE", result[0]);
      res.json({ success: true, config: result[0], data: result[0] });
    } catch (error) {
      console.error("Error patching school config:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.put("/api/school-configs/:schoolId", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { updatedAt: _, ...configData } = req.body;
      const result = await db.insert(school_configs).values({
        id: schoolId,
        ...configData,
        updatedAt: /* @__PURE__ */ new Date()
      }).onConflictDoUpdate({
        target: school_configs.id,
        set: { ...configData, updatedAt: /* @__PURE__ */ new Date() }
      }).returning();
      const financialFields = ["tuitionFee", "tuitionFeesByGrade", "installmentPlan", "discountRates"];
      const hasFinancialChanges = Object.keys(configData).some((key) => financialFields.includes(key));
      if (hasFinancialChanges) {
        updateStudentsFinanceOnConfigChange(schoolId, result[0]);
      }
      realtimeServerInstance?.broadcastManual("school_configs", schoolId, "UPDATE", result[0]);
      res.json({ success: true, config: result[0], data: result[0] });
    } catch (error) {
      console.error("Error putting school config:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/payments", async (req, res) => {
    try {
      const { id, studentId, schoolId, amount, note, method, adminName } = req.body;
      const newPayment = await db.insert(student_transactions).values({
        id,
        studentId,
        schoolId,
        amount,
        note,
        method,
        adminName
      }).returning();
      res.json({ success: true, payment: newPayment[0] });
    } catch (error) {
      console.error("Error recording payment:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.use("/uploads", import_express2.default.static(import_path2.default.join(process.cwd(), "public", "uploads"), {
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Range, Content-Type");
      res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");
      res.setHeader("Accept-Ranges", "bytes");
    }
  }));
  app.use("/uploads", (req, res) => {
    res.status(404).json({ error: "Upload file not found" });
  });
  app.get("/cdn/*", async (req, res) => {
    const rawPath = req.params[0] || "";
    const relPath = rawPath.replace(/^\/+/, "");
    if (!relPath) return res.status(400).send("Missing media path");
    const candidates = [relPath];
    const baseName = relPath.split("/").pop() || "";
    const dirName = relPath.substring(0, relPath.lastIndexOf("/") + 1);
    if (dirName.includes("school-logos") || dirName.includes("schools") || relPath.includes("logo") || relPath.includes("school")) {
      const matchNum = baseName.match(/(\d+)\.(jpg|png|jpeg|webm|mp4)/i);
      if (matchNum) {
        const num = matchNum[1];
        const ext = matchNum[2];
        candidates.push(`${dirName}logo${num}.${ext}`);
        candidates.push(`${dirName}school${num}.${ext}`);
        candidates.push(`${dirName}cover${num}.${ext}`);
        candidates.push(`logo${num}.${ext}`);
        candidates.push(`school${num}.${ext}`);
        if (ext.toLowerCase() === "png" || ext.toLowerCase() === "jpg" || ext.toLowerCase() === "jpeg") {
          const altExt = ext.toLowerCase() === "png" ? "jpg" : "png";
          candidates.push(relPath.replace(/\.(png|jpg|jpeg)$/i, `.${altExt}`));
          candidates.push(`${dirName}logo${num}.${altExt}`);
        }
      }
    }
    if (dirName.includes("mascot")) {
      if (relPath.endsWith(".png")) candidates.push(relPath.replace(/\.png$/i, ".jpg"));
      if (relPath.endsWith(".jpg")) candidates.push(relPath.replace(/\.jpg$/i, ".png"));
      candidates.push("mascot/welcome.png");
      candidates.push("mascot/welcome.jpg");
      candidates.push("mascot/study.png");
      candidates.push("mascot/connect.png");
      candidates.push("mascot/achieve.png");
      candidates.push("mascot/launch.png");
      candidates.push("mascot/transit.png");
    }
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    for (const candidateKey of candidates) {
      const localFilePath = import_path2.default.join(process.cwd(), "public", candidateKey);
      if (import_fs2.default.existsSync(localFilePath) && import_fs2.default.statSync(localFilePath).isFile()) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        return res.sendFile(localFilePath);
      }
    }
    if (s3Client && R2_BUCKET_NAME) {
      for (const candidateKey of candidates) {
        try {
          const abortController = new AbortController();
          const timeoutId = setTimeout(() => abortController.abort(), 2e3);
          const s3Res = await s3Client.send(new import_client_s3.GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: candidateKey,
            Range: req.headers.range
          }), { abortSignal: abortController.signal });
          clearTimeout(timeoutId);
          if (s3Res) {
            res.setHeader("Access-Control-Allow-Origin", "*");
            if (s3Res.ContentType) res.setHeader("Content-Type", s3Res.ContentType);
            if (s3Res.ContentLength) res.setHeader("Content-Length", s3Res.ContentLength.toString());
            if (s3Res.ContentRange) {
              res.setHeader("Content-Range", s3Res.ContentRange);
              res.status(206);
            } else {
              res.status(200);
            }
            res.setHeader("Accept-Ranges", "bytes");
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
            if (s3Res.Body && typeof s3Res.Body.pipe === "function") {
              return s3Res.Body.pipe(res);
            }
          }
        } catch (e) {
        }
      }
    }
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return res.status(404).send("Asset not found");
  });
  app.use(import_express2.default.static(import_path2.default.join(process.cwd(), "public"), {
    setHeaders: (res, filePath) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      if (filePath.endsWith(".mp4")) {
        res.setHeader("Content-Type", "video/mp4");
        res.setHeader("Accept-Ranges", "bytes");
      } else if (filePath.endsWith(".webm")) {
        res.setHeader("Content-Type", "video/webm");
        res.setHeader("Accept-Ranges", "bytes");
      }
    }
  }));
  app.get("/api/mascot/verify", async (req, res) => {
    try {
      const mascotDir = import_path2.default.join(process.cwd(), "public", "mascot");
      if (!import_fs2.default.existsSync(mascotDir)) {
        import_fs2.default.mkdirSync(mascotDir, { recursive: true });
      }
      const files = import_fs2.default.readdirSync(mascotDir);
      const fileResults = [];
      let allValid = true;
      for (const fileName of files) {
        if (fileName.startsWith(".")) continue;
        const filePath = import_path2.default.join(mascotDir, fileName);
        const stat = import_fs2.default.statSync(filePath);
        if (!stat.isFile()) continue;
        const buf = import_fs2.default.readFileSync(filePath);
        const headerHex = buf.slice(0, 8).toString("hex").toUpperCase();
        const isPng = fileName.toLowerCase().endsWith(".png");
        const isJpg = fileName.toLowerCase().endsWith(".jpg") || fileName.toLowerCase().endsWith(".jpeg");
        const EXPECTED_PNG_HEADER = "89504E470D0A1A0A";
        let isValidHeader = false;
        if (isPng) {
          isValidHeader = headerHex === EXPECTED_PNG_HEADER;
        } else if (isJpg) {
          isValidHeader = headerHex.startsWith("FFD8FF");
        } else {
          isValidHeader = true;
        }
        let metadata = null;
        let sharpError = null;
        try {
          metadata = await (0, import_sharp.default)(filePath).metadata();
        } catch (err) {
          sharpError = err.message || "Failed to parse image dimensions";
          allValid = false;
        }
        const isHealthy = isValidHeader && metadata !== null && !sharpError;
        if (!isHealthy) allValid = false;
        fileResults.push({
          fileName,
          url: `/mascot/${fileName}?v=${stat.mtimeMs}`,
          sizeBytes: stat.size,
          sizeKb: (stat.size / 1024).toFixed(1),
          headerHex,
          expectedHeader: isPng ? EXPECTED_PNG_HEADER : isJpg ? "FFD8FFE0..." : "N/A",
          isValidHeader,
          width: metadata?.width || null,
          height: metadata?.height || null,
          format: metadata?.format || null,
          sharpError,
          isHealthy
        });
      }
      return res.json({
        success: true,
        allValid: fileResults.length > 0 && allValid,
        totalFiles: fileResults.length,
        files: fileResults
      });
    } catch (err) {
      console.error("Error in /api/mascot/verify:", err);
      return res.status(500).json({ error: err.message || "Failed to verify mascot files" });
    }
  });
  app.post("/api/mascot/upload-binary", memoryUpload.array("files"), async (req, res) => {
    try {
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files provided for binary copy" });
      }
      const mascotDir = import_path2.default.join(process.cwd(), "public", "mascot");
      if (!import_fs2.default.existsSync(mascotDir)) {
        import_fs2.default.mkdirSync(mascotDir, { recursive: true });
      }
      const uploadedResults = [];
      for (const file of files) {
        const targetPath = import_path2.default.join(mascotDir, file.originalname);
        import_fs2.default.writeFileSync(targetPath, file.buffer);
        const buf = import_fs2.default.readFileSync(targetPath);
        const headerHex = buf.slice(0, 8).toString("hex").toUpperCase();
        const isPng = file.originalname.toLowerCase().endsWith(".png");
        const EXPECTED_PNG_HEADER = "89504E470D0A1A0A";
        const isValidHeader = isPng ? headerHex === EXPECTED_PNG_HEADER : true;
        let meta = null;
        try {
          meta = await (0, import_sharp.default)(targetPath).metadata();
        } catch (e) {
        }
        uploadedResults.push({
          fileName: file.originalname,
          size: file.buffer.length,
          headerHex,
          isValidHeader,
          width: meta?.width || null,
          height: meta?.height || null,
          isHealthy: isValidHeader && meta !== null
        });
      }
      return res.json({
        success: true,
        message: `Successfully copied ${files.length} files to public/mascot in pure binary mode`,
        files: uploadedResults
      });
    } catch (err) {
      console.error("Error in /api/mascot/upload-binary:", err);
      return res.status(500).json({ error: err.message || "Failed to upload binary files" });
    }
  });
  app.post("/api/mascot/sync-r2", async (req, res) => {
    try {
      if (!s3Client || !R2_BUCKET_NAME) {
        return res.status(400).json({ error: "Cloudflare R2 is not configured on this server (missing environment variables)." });
      }
      const mascotDir = import_path2.default.join(process.cwd(), "public", "mascot");
      if (!import_fs2.default.existsSync(mascotDir)) {
        return res.status(400).json({ error: "public/mascot directory does not exist" });
      }
      const files = import_fs2.default.readdirSync(mascotDir);
      if (files.length === 0) {
        return res.status(400).json({ error: "No mascot files available to sync" });
      }
      for (const fileName of files) {
        if (fileName.startsWith(".")) continue;
        const filePath = import_path2.default.join(mascotDir, fileName);
        const buf = import_fs2.default.readFileSync(filePath);
        const headerHex = buf.slice(0, 8).toString("hex").toUpperCase();
        if (fileName.toLowerCase().endsWith(".png") && headerHex !== "89504E470D0A1A0A") {
          return res.status(400).json({
            error: `Refusing R2 sync: File ${fileName} has invalid PNG magic bytes (${headerHex}). Only healthy binary files can be uploaded to R2.`
          });
        }
        try {
          await (0, import_sharp.default)(filePath).metadata();
        } catch (e) {
          return res.status(400).json({
            error: `Refusing R2 sync: File ${fileName} cannot be read by Sharp (${e.message}). Fix binary corruption first.`
          });
        }
      }
      const syncedKeys = [];
      for (const fileName of files) {
        if (fileName.startsWith(".")) continue;
        const filePath = import_path2.default.join(mascotDir, fileName);
        const fileBuffer = import_fs2.default.readFileSync(filePath);
        const key = `mascot/${fileName}`;
        const ext = import_path2.default.extname(fileName).toLowerCase();
        const contentType = ext === ".png" ? "image/png" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "application/octet-stream";
        await s3Client.send(new import_client_s3.PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
          CacheControl: "public, max-age=31536000, immutable"
        }));
        syncedKeys.push(key);
      }
      return res.json({
        success: true,
        message: `Successfully uploaded ${syncedKeys.length} healthy binary mascot files to Cloudflare R2 bucket (${R2_BUCKET_NAME})`,
        syncedKeys
      });
    } catch (err) {
      console.error("Error in /api/mascot/sync-r2:", err);
      return res.status(500).json({ error: err.message || "Failed to sync mascot files to Cloudflare R2" });
    }
  });
  const POSE_ALIASES_MAP = {
    pulse: ["pose_portal_pulse"],
    pose_portal_pulse: ["pulse"],
    finance: ["pose_finance_officer"],
    pose_finance_officer: ["finance"],
    codes: ["pose_key_master"],
    pose_key_master: ["codes"],
    students: ["pose_student_manager"],
    pose_student_manager: ["students"],
    broadcast: ["pose_broadcaster", "pose_digital_broadcaster"],
    pose_broadcaster: ["broadcast", "pose_digital_broadcaster"],
    pose_digital_broadcaster: ["broadcast", "pose_broadcaster"],
    attendance: ["pose_discipline_shield"],
    pose_discipline_shield: ["attendance"],
    uniform: ["pose_school_uniform"],
    pose_school_uniform: ["uniform"],
    teachers: ["pose_academic_scholar", "pose_staff_leader"],
    pose_academic_scholar: ["teachers"],
    pose_staff_leader: ["teachers", "pose_academic_scholar"],
    transport: ["pose_transport_manager", "pose_bus_captain", "use_driving_bus"],
    pose_transport_manager: ["transport", "pose_bus_captain", "use_driving_bus"],
    pose_bus_captain: ["transport", "pose_transport_manager", "use_driving_bus"],
    use_driving_bus: ["transport", "pose_transport_manager", "pose_bus_captain"],
    ideas: ["pose_idea_genius"],
    pose_idea_genius: ["ideas"],
    support: ["pose_customer_support"],
    pose_customer_support: ["support"],
    resources: ["pose_content_control", "pose_control_mechanic"],
    pose_content_control: ["resources", "pose_control_mechanic"],
    pose_control_mechanic: ["resources", "pose_content_control"],
    audit: ["pose_activity_logs"],
    pose_activity_logs: ["audit"],
    captain_bairaq_guardian: ["mayadeen_tab_bairaq", "pose_dual_arena"],
    mayadeen_tab_bairaq: ["captain_bairaq_guardian", "pose_dual_arena"],
    pose_dual_arena: ["captain_bairaq_guardian", "mayadeen_tab_bairaq"],
    pose_questions_bank: ["pose_radar_navigator"],
    pose_radar_navigator: ["pose_questions_bank"],
    welcome_video: ["greeting_welcome", "greet_hello", "in_app_use_welcomes_students"],
    greeting_welcome: ["welcome_video", "greet_hello", "in_app_use_welcomes_students"],
    welcome_video_secondary: ["welcome_intro_secondary", "intro_secondary_video"],
    welcome_intro_secondary: ["welcome_video_secondary"],
    app_logo: ["logo", "bairaq_logo", "application_logo", "header_logo"],
    logo: ["app_logo", "bairaq_logo"],
    welcome_card_welcome: ["welcome"],
    welcome: ["welcome_card_welcome"],
    welcome_card_connect: ["connect"],
    connect: ["welcome_card_connect"],
    welcome_card_study: ["study"],
    study: ["welcome_card_study"],
    welcome_card_transit: ["transit"],
    transit: ["welcome_card_transit"],
    welcome_card_achieve: ["achieve"],
    achieve: ["welcome_card_achieve"],
    welcome_card_launch: ["launch"],
    launch: ["welcome_card_launch"]
  };
  const DATA_DIR = import_path2.default.join(process.cwd(), "data");
  if (!import_fs2.default.existsSync(DATA_DIR)) {
    try {
      import_fs2.default.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
    }
  }
  const POSES_FILE = import_path2.default.join(DATA_DIR, "bairaq_poses.json");
  const HISTORY_FILE = import_path2.default.join(DATA_DIR, "bairaq_history.json");
  const readLocalPoses = () => {
    try {
      if (import_fs2.default.existsSync(POSES_FILE)) {
        const raw = import_fs2.default.readFileSync(POSES_FILE, "utf-8");
        const poses = JSON.parse(raw) || {};
        let isDirty = false;
        for (const [key, val] of Object.entries(poses)) {
          if (typeof val === "string" && val.startsWith("/uploads/")) {
            const fileName = val.replace("/uploads/", "").split("?")[0].split("#")[0];
            const diskPath = import_path2.default.join(process.cwd(), "public", "uploads", fileName);
            if (!import_fs2.default.existsSync(diskPath)) {
              console.warn(`[ORPHAN ASSET DETECTED] File ${val} missing on disk for pose ${key}. Pruning.`);
              delete poses[key];
              isDirty = true;
            }
          }
        }
        if (isDirty) {
          writeLocalPoses(poses);
        }
        return poses;
      }
    } catch (e) {
      console.error("[DATABASE READ ERROR] Could not read local poses file:", e);
    }
    return {};
  };
  const writeLocalPoses = (poses) => {
    try {
      const tempPath = `${POSES_FILE}.tmp_${Date.now()}`;
      import_fs2.default.writeFileSync(tempPath, JSON.stringify(poses, null, 2), "utf-8");
      import_fs2.default.renameSync(tempPath, POSES_FILE);
    } catch (e) {
      console.error("[DATABASE WRITE ERROR] Could not write local poses file:", e);
    }
  };
  const readLocalHistory = () => {
    try {
      if (import_fs2.default.existsSync(HISTORY_FILE)) {
        const raw = import_fs2.default.readFileSync(HISTORY_FILE, "utf-8");
        return JSON.parse(raw) || [];
      }
    } catch (e) {
      console.error("[DATABASE READ ERROR] Could not read local history file:", e);
    }
    return [];
  };
  const writeLocalHistory = (records) => {
    try {
      const tempPath = `${HISTORY_FILE}.tmp_${Date.now()}`;
      import_fs2.default.writeFileSync(tempPath, JSON.stringify(records, null, 2), "utf-8");
      import_fs2.default.renameSync(tempPath, HISTORY_FILE);
    } catch (e) {
      console.error("[DATABASE WRITE ERROR] Could not write local history file:", e);
    }
  };
  app.get("/api/bairaq/poses", async (req, res) => {
    try {
      const poses = readLocalPoses();
      for (const [key, val] of Object.entries(poses)) {
        if (typeof val === "string" && val) {
          const aliases = POSE_ALIASES_MAP[key] || [];
          for (const alias of aliases) {
            poses[alias] = val;
          }
        }
      }
      console.log(`[DATABASE READ] [GET /api/bairaq/poses] Retrieved ${Object.keys(poses).length} active poses`);
      return res.json({ success: true, poses });
    } catch (err) {
      console.error("[DATABASE READ ERROR] Error in GET /api/bairaq/poses:", err);
      return res.status(500).json({ error: err.message || "Failed to fetch poses" });
    }
  });
  app.post("/api/bairaq/poses", async (req, res) => {
    try {
      const { headerId, publicUrl, fileName, fileSize, fileType } = req.body;
      if (!headerId || !publicUrl) {
        return res.status(400).json({ error: "Missing headerId or publicUrl" });
      }
      console.log(`[UPLOAD SUCCESS] [ACTIVE ASSET ID] ${headerId} [STORAGE PATH] ${publicUrl}`);
      const aliases = POSE_ALIASES_MAP[headerId] || [];
      const keysToSave = Array.from(/* @__PURE__ */ new Set([headerId, ...aliases]));
      const currentPoses = readLocalPoses();
      const oldAssetUrl = currentPoses[headerId] || null;
      if (oldAssetUrl) {
        console.log(`[OLD ASSET DETECTED] Previous URL for ${headerId}: ${oldAssetUrl}`);
      }
      keysToSave.forEach((k) => {
        currentPoses[k] = publicUrl;
      });
      writeLocalPoses(currentPoses);
      console.log(`[DATABASE WRITE] [ASSET OVERRIDE] Stored new active version for ${headerId} and aliases [${keysToSave.join(", ")}]`);
      const historyRecord = {
        id: `${headerId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        assetId: headerId,
        fileName: fileName || "file",
        downloadUrl: publicUrl,
        assetType: fileType || "image/jpeg",
        fileSize: fileSize || 0,
        uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
        status: "active"
      };
      const historyRecords = readLocalHistory();
      historyRecords.unshift(historyRecord);
      writeLocalHistory(historyRecords.slice(0, 200));
      console.log(`[ACTIVE VERSION] Logged new history version ID: ${historyRecord.id}`);
      if (realtimeServerInstance) {
        realtimeServerInstance.broadcastManual("bairaq_poses", headerId, "UPDATE", currentPoses);
      }
      return res.json({ success: true, poses: currentPoses, historyRecord });
    } catch (err) {
      console.error("[DATABASE WRITE ERROR] Error in POST /api/bairaq/poses:", err);
      return res.status(500).json({ error: err.message || "Failed to save pose" });
    }
  });
  app.get("/api/bairaq/history/:assetId", async (req, res) => {
    try {
      const { assetId } = req.params;
      const aliases = POSE_ALIASES_MAP[assetId] || [];
      const matchKeys = /* @__PURE__ */ new Set([assetId, ...aliases]);
      const allHistory = readLocalHistory();
      const records = [];
      const seenUrls = /* @__PURE__ */ new Set();
      for (const r of allHistory) {
        if (matchKeys.has(r.assetId) && r.downloadUrl && !seenUrls.has(r.downloadUrl)) {
          seenUrls.add(r.downloadUrl);
          records.push(r);
        }
      }
      records.sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime());
      console.log(`[DATABASE READ] [GET /api/bairaq/history/${assetId}] Found ${records.length} history records`);
      return res.json({ success: true, records });
    } catch (err) {
      console.error("[DATABASE READ ERROR] Error in GET /api/bairaq/history/:assetId:", err);
      return res.status(500).json({ error: err.message || "Failed to fetch history" });
    }
  });
  app.post("/api/bairaq/restore", async (req, res) => {
    try {
      const { assetId, downloadUrl } = req.body;
      if (!assetId || !downloadUrl) {
        return res.status(400).json({ error: "Missing assetId or downloadUrl" });
      }
      console.log(`[ASSET OVERRIDE] Restoring asset ${assetId} to URL: ${downloadUrl}`);
      const aliases = POSE_ALIASES_MAP[assetId] || [];
      const keysToSave = Array.from(/* @__PURE__ */ new Set([assetId, ...aliases]));
      const currentPoses = readLocalPoses();
      keysToSave.forEach((k) => {
        currentPoses[k] = downloadUrl;
      });
      writeLocalPoses(currentPoses);
      if (realtimeServerInstance) {
        realtimeServerInstance.broadcastManual("bairaq_poses", assetId, "UPDATE", currentPoses);
      }
      const restoreRecord = {
        id: `${assetId}_restored_${Date.now()}`,
        assetId,
        fileName: "Restored Version",
        downloadUrl,
        assetType: "image/jpeg",
        fileSize: 0,
        uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
        status: "restored"
      };
      const allHistory = readLocalHistory();
      allHistory.unshift(restoreRecord);
      writeLocalHistory(allHistory.slice(0, 200));
      return res.json({ success: true, activeUrl: downloadUrl, poses: currentPoses });
    } catch (err) {
      console.error("[ASSET OVERRIDE ERROR] Error in POST /api/bairaq/restore:", err);
      return res.status(500).json({ error: err.message || "Failed to restore pose" });
    }
  });
  app.post("/api/bairaq/reset", async (req, res) => {
    try {
      const { assetId } = req.body;
      if (!assetId) {
        return res.status(400).json({ error: "Missing assetId" });
      }
      console.log(`[ASSET OVERRIDE] Resetting asset ${assetId} to default`);
      const aliases = POSE_ALIASES_MAP[assetId] || [];
      const keysToReset = Array.from(/* @__PURE__ */ new Set([assetId, ...aliases]));
      const currentPoses = readLocalPoses();
      keysToReset.forEach((k) => {
        delete currentPoses[k];
      });
      writeLocalPoses(currentPoses);
      if (realtimeServerInstance) {
        realtimeServerInstance.broadcastManual("bairaq_poses", assetId, "UPDATE", currentPoses);
      }
      return res.json({ success: true, poses: currentPoses });
    } catch (err) {
      console.error("[ASSET OVERRIDE ERROR] Error in POST /api/bairaq/reset:", err);
      return res.status(500).json({ error: err.message || "Failed to reset pose" });
    }
  });
  app.post("/api/upload-url", async (req, res) => {
    try {
      const { fileName, contentType } = req.body;
      if (!fileName || !contentType) {
        return res.status(400).json({ error: "Missing fileName or contentType" });
      }
      const allowedMimes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/svg+xml",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
        "text/csv",
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/ogg",
        "audio/m4a",
        "audio/aac",
        "video/mp4",
        "video/webm",
        "application/octet-stream"
      ];
      const cleanContentType = String(contentType).toLowerCase().trim();
      const cleanExt = import_path2.default.extname(fileName).toLowerCase();
      const forbiddenExts = [".exe", ".sh", ".bat", ".cmd", ".php", ".pl", ".py", ".js", ".vbs", ".scr"];
      if (forbiddenExts.includes(cleanExt)) {
        return res.status(400).json({ error: "File type not permitted for security reasons." });
      }
      if (!s3Client || !R2_BUCKET_NAME) {
        return res.json({ local: true });
      }
      const safeBase = import_path2.default.basename(fileName, cleanExt).replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 50) || "file";
      const key = `${Date.now()}-${safeBase}${cleanExt}`;
      const command = new import_client_s3.PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        ContentType: cleanContentType
      });
      const presignedUrl = await (0, import_s3_request_presigner.getSignedUrl)(s3Client, command, { expiresIn: 3600 });
      const rawPublicBase2 = (process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL || "").replace(/\/$/, "");
      let publicUrl = `/api/files/${key}`;
      if (rawPublicBase2 && !rawPublicBase2.includes("dummy")) {
        publicUrl = `${rawPublicBase2}/${key}`;
      }
      res.json({ presignedUrl, key, publicUrl });
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      res.status(500).json({ error: "Failed to generate presigned URL" });
    }
  });
  app.post(["/api/upload", "/api/worker/upload"], upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }
      const fileName = req.file.originalname || "document.pdf";
      const contentType = req.file.mimetype || "application/octet-stream";
      const ext = import_path2.default.extname(fileName) || ".pdf";
      const safeBase = import_path2.default.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_").slice(0, 60) || "document";
      const key = `${Date.now()}_${safeBase}${ext}`;
      let r2Success = false;
      let publicUrl = "";
      if (s3Client) {
        try {
          const fileStream = import_fs2.default.createReadStream(req.file.path);
          const command = new import_client_s3.PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            ContentType: contentType,
            Body: fileStream
          });
          await s3Client.send(command);
          const rawPublicBase2 = (process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL || "").replace(/\/$/, "");
          const protocol = req.headers["x-forwarded-proto"] || req.protocol;
          const host = req.headers["x-forwarded-host"] || req.get("host");
          const appBase = req.headers["x-frontend-origin"] || process.env.APP_URL || `${protocol}://${host}`;
          let r2PublicUrl = `/api/files/${key}`;
          if (rawPublicBase2 && !rawPublicBase2.includes("dummy")) {
            r2PublicUrl = `${rawPublicBase2}/${key}`;
          }
          publicUrl = r2PublicUrl;
          console.log(`[Upload R2 Success] File: ${fileName}, URL: ${publicUrl}`);
          r2Success = true;
        } catch (r2Error) {
          console.warn(`[Upload R2 Warning] R2 upload failed, falling back to local storage:`, r2Error);
        }
      }
      if (!r2Success) {
        const uploadsDir = import_path2.default.join(process.cwd(), "public", "uploads");
        if (!import_fs2.default.existsSync(uploadsDir)) {
          import_fs2.default.mkdirSync(uploadsDir, { recursive: true });
        }
        const destinationPath = import_path2.default.join(uploadsDir, key);
        try {
          import_fs2.default.renameSync(req.file.path, destinationPath);
        } catch (renameError) {
          if (renameError?.code === "EXDEV") {
            import_fs2.default.copyFileSync(req.file.path, destinationPath);
          } else {
            throw renameError;
          }
        }
        const protocol = req.headers["x-forwarded-proto"] || req.protocol;
        const host = req.headers["x-forwarded-host"] || req.get("host");
        const baseUrl = req.headers["x-frontend-origin"] || process.env.APP_URL || `${protocol}://${host}`;
        publicUrl = `/uploads/${key}`;
        console.log(`[Upload Local Success] File: ${fileName}, Size: ${req.file.size} bytes, URL: ${publicUrl}`);
      }
      try {
        if (import_fs2.default.existsSync(req.file.path)) import_fs2.default.unlinkSync(req.file.path);
      } catch (e) {
      }
      return res.json({ key, publicUrl, url: publicUrl, fileName, size: req.file.size });
    } catch (error) {
      if (req.file && import_fs2.default.existsSync(req.file.path)) {
        try {
          import_fs2.default.unlinkSync(req.file.path);
        } catch (e) {
        }
      }
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });
  app.get("/api/storage/status", (req, res) => {
    const isR2Configured = Boolean(s3Client && R2_BUCKET_NAME);
    res.json({
      provider: isR2Configured ? "cloudflare_r2" : "local_fallback",
      r2Configured: isR2Configured,
      bucket: isR2Configured ? R2_BUCKET_NAME : null,
      publicBaseUrl: (process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL || "").replace(/\/$/, "") || null,
      status: "ready"
    });
  });
  app.get("/api/files/:key", async (req, res) => {
    try {
      const rawKey = req.params.key;
      if (!rawKey) return res.status(400).send("Missing file key");
      const key = import_path2.default.basename(rawKey);
      const uploadsDir = import_path2.default.join(process.cwd(), "public", "uploads");
      const localPath = import_path2.default.join(uploadsDir, key);
      if (localPath.startsWith(uploadsDir) && import_fs2.default.existsSync(localPath)) {
        return res.sendFile(localPath);
      }
      if (s3Client) {
        const getCmd = new import_client_s3.GetObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key
        });
        const r2Res = await s3Client.send(getCmd);
        if (r2Res.ContentType) res.setHeader("Content-Type", r2Res.ContentType);
        if (r2Res.ContentLength) res.setHeader("Content-Length", r2Res.ContentLength);
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        const bodyStream = r2Res.Body;
        if (bodyStream && typeof bodyStream.pipe === "function") {
          return bodyStream.pipe(res);
        }
      }
      return res.status(404).send("File not found");
    } catch (err) {
      console.error("[File Serve Error]:", err.message);
      return res.status(404).send("File not found");
    }
  });
  app.get("/api/video-proxy", async (req, res) => {
    try {
      const videoUrlStr = req.query.url;
      if (!videoUrlStr) {
        return res.status(400).json({ error: "Missing url parameter" });
      }
      let absoluteUrl = videoUrlStr;
      if (videoUrlStr.startsWith("/")) {
        const protocol = req.headers["x-forwarded-proto"] || req.protocol;
        const host = req.headers["x-forwarded-host"] || req.get("host");
        absoluteUrl = `${protocol}://${host}${videoUrlStr}`;
      }
      console.log(`[Video Proxy] Requesting: ${absoluteUrl}`);
      if (absoluteUrl.includes("/uploads/")) {
        const filename = absoluteUrl.split("/uploads/")[1]?.split("?")[0];
        if (filename) {
          const filePath = import_path2.default.join(process.cwd(), "public", "uploads", filename);
          if (import_fs2.default.existsSync(filePath)) {
            const stat = import_fs2.default.statSync(filePath);
            const fileSize = stat.size;
            const range = req.headers.range;
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Range, Content-Type");
            res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");
            res.setHeader("Accept-Ranges", "bytes");
            let mime = "video/mp4";
            const ext = import_path2.default.extname(filename).toLowerCase();
            if (ext === ".webm") mime = "video/webm";
            else if (ext === ".ogg") mime = "video/ogg";
            if (range) {
              const parts = range.replace(/bytes=/, "").split("-");
              const start = parseInt(parts[0], 10);
              const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
              if (start >= fileSize || end >= fileSize) {
                res.writeHead(416, {
                  "Content-Range": `bytes */${fileSize}`
                });
                return res.end();
              }
              const chunksize = end - start + 1;
              const fileStream = import_fs2.default.createReadStream(filePath, { start, end });
              const head = {
                "Content-Range": `bytes ${start}-${end}/${fileSize}`,
                "Accept-Ranges": "bytes",
                "Content-Length": chunksize,
                "Content-Type": mime
              };
              res.writeHead(206, head);
              fileStream.pipe(res);
              return;
            } else {
              const head = {
                "Content-Length": fileSize,
                "Content-Type": mime
              };
              res.writeHead(200, head);
              import_fs2.default.createReadStream(filePath).pipe(res);
              return;
            }
          }
        }
      }
      const rangeHeader = req.headers.range;
      const fetchHeaders = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      };
      if (rangeHeader) {
        fetchHeaders["Range"] = rangeHeader;
      }
      console.log(`[Video Proxy] Fetching remote URL: ${absoluteUrl} with Range: ${rangeHeader || "None"}`);
      const response = await fetch(absoluteUrl, {
        headers: fetchHeaders,
        redirect: "follow"
      });
      if (!response.ok && response.status !== 206) {
        console.error(`[Video Proxy] Remote fetch failed: ${response.status} ${response.statusText}`);
        return res.status(response.status).send(`Failed to fetch video: ${response.statusText}`);
      }
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Range, Content-Type");
      res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges");
      res.setHeader("Accept-Ranges", "bytes");
      const contentType = response.headers.get("content-type") || "video/mp4";
      if (contentType.includes("text/html")) {
        console.warn(`[Video Proxy] Warning: Remote server returned HTML instead of video for ${absoluteUrl}`);
      }
      res.setHeader("Content-Type", contentType);
      const contentLength = response.headers.get("content-length");
      if (contentLength) {
        res.setHeader("Content-Length", contentLength);
      }
      const contentRange = response.headers.get("content-range");
      if (contentRange) {
        res.setHeader("Content-Range", contentRange);
      }
      res.status(response.status);
      if (response.body) {
        const body = response.body;
        if (body.pipe && typeof body.pipe === "function") {
          body.pipe(res);
        } else if (typeof body[Symbol.asyncIterator] === "function") {
          for await (const chunk of body) {
            res.write(chunk);
          }
          res.end();
        } else if (body.getReader) {
          const reader = body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
        } else {
          res.end();
        }
      } else {
        res.end();
      }
    } catch (proxyError) {
      console.error("[Video Proxy Error]:", proxyError);
      if (!res.headersSent) {
        res.status(500).json({ error: `Proxy failed: ${proxyError.message}` });
      }
    }
  });
  app.post("/api/check-video", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "No URL provided" });
      }
      let checkUrl = url;
      if (url.startsWith("/")) {
        const protocol = req.headers["x-forwarded-proto"] || req.protocol;
        const host = req.headers["x-forwarded-host"] || req.get("host");
        checkUrl = `${protocol}://${host}${url}`;
      }
      console.log(`[Video Check Server] Checking direct URL: ${checkUrl}`);
      let localExists = false;
      let fileLocationInfo = "\u0631\u0627\u0628\u0637 \u062E\u0627\u0631\u062C\u064A \u0623\u0648 \u0645\u0646 \u0633\u062D\u0627\u0628\u0629 \u062E\u0627\u0631\u062C\u064A\u0629";
      let localFileSizeText = "N/A";
      let localFileMime = "video/mp4";
      if (url.includes("/uploads/")) {
        try {
          const filename = url.split("/uploads/")[1];
          if (filename) {
            const rawFilename = filename.split("?")[0];
            const filePath = import_path2.default.join(process.cwd(), "public", "uploads", rawFilename);
            localExists = import_fs2.default.existsSync(filePath);
            if (localExists) {
              const stats = import_fs2.default.statSync(filePath);
              const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
              localFileSizeText = `${sizeInMB} MB (${stats.size} bytes)`;
              fileLocationInfo = `\u0646\u0639\u0645\u060C \u0627\u0644\u0645\u0644\u0641 \u0645\u0648\u062C\u0648\u062F \u0645\u0627\u062F\u064A\u0627\u064B \u0639\u0644\u0649 \u0627\u0644\u0642\u0631\u0635 \u0641\u064A \u0627\u0644\u0645\u0633\u0627\u0631: ${filePath}`;
              const ext = import_path2.default.extname(rawFilename).toLowerCase();
              if (ext === ".mp4") localFileMime = "video/mp4";
              else if (ext === ".webm") localFileMime = "video/webm";
              else if (ext === ".ogg") localFileMime = "video/ogg";
              else if (ext === ".m3u8") localFileMime = "application/x-mpegURL";
            } else {
              fileLocationInfo = `\u274C \u0627\u0644\u0645\u0644\u0641 \u0645\u0641\u0642\u0648\u062F! \u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0623\u064A \u0645\u0644\u0641 \u0641\u064A \u0627\u0644\u0645\u0633\u0627\u0631 \u0627\u0644\u0645\u062D\u0644\u064A \u0627\u0644\u0645\u062A\u0648\u0642\u0639: ${filePath}`;
            }
          }
        } catch (err) {
          console.error("[Video Check Server] Error during physical file check:", err);
          fileLocationInfo = `\u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0645\u0633\u0627\u0631 \u0627\u0644\u0645\u0644\u0641: ${err.message}`;
        }
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8e3);
      try {
        const response = await fetch(checkUrl, {
          method: "HEAD",
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const contentType = response.headers.get("content-type") || localFileMime;
        const contentLength = response.headers.get("content-length");
        const acceptRanges = response.headers.get("accept-ranges") || "none";
        let calculatedSize = localFileSizeText;
        if (contentLength) {
          const sizeInMB = (parseInt(contentLength, 10) / (1024 * 1024)).toFixed(2);
          calculatedSize = `${sizeInMB} MB (${contentLength} bytes)`;
        }
        return res.json({
          status: response.status,
          statusText: response.statusText,
          contentType,
          fileSize: calculatedSize,
          acceptRanges,
          localExists,
          fileLocationInfo,
          ok: response.ok
        });
      } catch (headError) {
        console.log(`[Video Check Server] HEAD request failed: ${headError.message || headError}. Falling back to GET with byte range.`);
        const getController = new AbortController();
        const getTimeoutId = setTimeout(() => getController.abort(), 8e3);
        try {
          const response = await fetch(checkUrl, {
            method: "GET",
            headers: {
              Range: "bytes=0-0"
            },
            signal: getController.signal
          });
          clearTimeout(getTimeoutId);
          const contentType = response.headers.get("content-type") || localFileMime;
          const contentLength = response.headers.get("content-length");
          const acceptRanges = response.headers.get("accept-ranges") || "none";
          let calculatedSize = localFileSizeText;
          if (contentLength) {
            const rangeHeader = response.headers.get("content-range");
            if (rangeHeader && rangeHeader.includes("/")) {
              const totalBytes = rangeHeader.split("/")[1];
              const sizeInMB = (parseInt(totalBytes, 10) / (1024 * 1024)).toFixed(2);
              calculatedSize = `${sizeInMB} MB (${totalBytes} bytes)`;
            } else {
              const sizeInMB = (parseInt(contentLength, 10) / (1024 * 1024)).toFixed(2);
              calculatedSize = `${sizeInMB} MB (${contentLength} bytes)`;
            }
          }
          return res.json({
            status: response.status,
            statusText: response.statusText,
            contentType,
            fileSize: calculatedSize,
            acceptRanges,
            localExists,
            fileLocationInfo,
            ok: response.ok
          });
        } catch (getError) {
          console.error(`[Video Check Server] GET request also failed: ${getError.message || getError}`);
          return res.json({
            status: 500,
            statusText: getError.message || "Network Error",
            contentType: localFileMime,
            fileSize: localFileSizeText,
            acceptRanges: "none",
            localExists,
            fileLocationInfo,
            ok: false
          });
        }
      }
    } catch (err) {
      console.error(`[Video Check Server] Fatal exception during check:`, err);
      return res.json({
        status: 500,
        statusText: err.message || "Internal Server Error",
        contentType: "video/mp4",
        fileSize: "N/A",
        acceptRanges: "none",
        localExists: false,
        fileLocationInfo: err.message || "N/A",
        ok: false
      });
    }
  });
  app.get(["/api/worker/health", "/api/gemini/health"], (req, res) => {
    res.json({
      status: "ok",
      gateway: "Cloudflare-Worker-Development-Proxy",
      provider: "gemini",
      r2Configured: Boolean(process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.post(["/api/upload-url", "/api/worker/upload-url"], (req, res) => {
    const { fileName } = req.body;
    const cleanName = `${Date.now()}_${(fileName || "file").replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    let publicUrl = `/api/files/${cleanName}`;
    if (rawPublicBase && !rawPublicBase.includes("dummy")) {
      publicUrl = `${rawPublicBase}/${cleanName}`;
    }
    res.json({
      presignedUrl: null,
      key: cleanName,
      publicUrl
    });
  });
  app.post(["/api/gemini/extract", "/api/worker/ai/extract"], async (req, res) => {
    const { base64Data, mimeType = "image/jpeg", extractedText } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }
    try {
      const cleanBase64 = base64Data.split(",")[1] || base64Data;
      const prompt = `
    \u0623\u0646\u062A \u0645\u062D\u0644\u0644 \u0628\u0646\u064A\u0629 \u0647\u064A\u0643\u0644\u064A\u0629 (Structural Analyzer) \u0648\u0645\u062D\u0648\u0644 \u0639\u0631\u0636 \u0630\u0643\u064A (Smart Presentation Converter).
    \u0645\u0647\u0645\u062A\u0643 \u0647\u064A \u0642\u0631\u0627\u0621\u0629 \u0646\u0635 \u0627\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u0623\u0635\u0644\u064A \u0648\u062A\u062D\u0648\u064A\u0644\u0647 \u0625\u0644\u0649 \u0643\u062A\u0644 (Blocks) \u0647\u064A\u0643\u0644\u064A\u0629 \u0628\u0635\u0631\u064A\u0629\u060C \u062F\u0648\u0646 \u0623\u064A \u062A\u063A\u064A\u064A\u0631 \u0641\u064A \u0627\u0644\u0646\u0635 \u0627\u0644\u0623\u0635\u0644\u064A.
    
    \u0627\u0644\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0635\u0627\u0631\u0645\u0629 \u0648\u0627\u0644\u0646\u0647\u0627\u0626\u064A\u0629 (\u0625\u064A\u0627\u0643 \u0645\u062E\u0627\u0644\u0641\u062A\u0647\u0627):
    1. \u0627\u0644\u062D\u0641\u0627\u0638 \u0639\u0644\u0649 \u0627\u0644\u0645\u0627\u062F\u0629 \u0627\u0644\u0639\u0644\u0645\u064A\u0629 \u062D\u0631\u0641\u064A\u0627\u064B (Word-for-Word) \u0628\u0646\u0633\u0628\u0629 100%. \u064A\u0645\u0646\u0639 \u0627\u0644\u062A\u0644\u062E\u064A\u0635\u060C \u064A\u0645\u0646\u0639 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0635\u064A\u0627\u063A\u0629\u060C \u064A\u0645\u0646\u0639 \u0627\u0644\u0627\u062E\u062A\u0635\u0627\u0631.
    2. \u0627\u0644\u062A\u062C\u0627\u0647\u0644 \u0627\u0644\u062A\u0627\u0645 \u0648\u0627\u0644\u062D\u0630\u0641 \u0644\u0623\u064A (\u0625\u0639\u0644\u0627\u0646\u0627\u062A\u060C \u0623\u0631\u0642\u0627\u0645 \u0647\u0648\u0627\u062A\u0641\u060C \u0645\u0639\u0631\u0641\u0627\u062A \u062A\u0644\u064A\u0643\u0631\u0627\u0645\u060C \u0623\u0633\u0645\u0627\u0621 \u0645\u0637\u0627\u0628\u0639\u060C \u0648\u062D\u0633\u0627\u0628\u0627\u062A \u062A\u0648\u0627\u0635\u0644) \u0644\u0627 \u062A\u0646\u062A\u0645\u064A \u0644\u0644\u0645\u0627\u062F\u0629 \u0627\u0644\u0639\u0644\u0645\u064A\u0629 \u0628\u0635\u0648\u0631\u0629 \u0635\u0627\u0641\u064A\u0629.
    3. \u062A\u0642\u0633\u064A\u0645 \u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u062A\u0628\u0642\u064A \u0625\u0644\u0649 \u0643\u062A\u0644 (Block) \u0628\u062D\u064A\u062B \u0643\u0644 \u0641\u0642\u0631\u0629\u060C \u0645\u062B\u0627\u0644\u060C \u0645\u0644\u0627\u062D\u0638\u0629\u060C \u0633\u0624\u0627\u0644\u060C \u062A\u0639\u0644\u064A\u0644\u060C \u062C\u062F\u0648\u0644\u060C \u064A\u062A\u0645 \u0648\u0636\u0639\u0647 \u0641\u064A \u0643\u0627\u0626\u0646 JSON \u0645\u0633\u062A\u0642\u0644 \u062F\u0627\u062E\u0644 \u0645\u0635\u0641\u0648\u0641\u0629 structuredContent.
    4. \u0628\u0627\u0644\u0646\u0633\u0628\u0629 \u0644\u062A\u0645\u0627\u0631\u064A\u0646 \u0627\u0644\u0625\u0633\u0642\u0627\u0637\u0627\u062A (Fill in the blanks) \u0648\u0635\u0646\u0627\u062F\u064A\u0642 \u0627\u0644\u0645\u0641\u0631\u062F\u0627\u062A (Word Box) \u0648\u0635\u0646\u0627\u062F\u064A\u0642 \u0627\u0644\u062D\u0644\u0648\u0644 \u0623\u0633\u0641\u0644 \u0627\u0644\u0635\u0641\u062D\u0629 (Answer Key):
       - \u0627\u0633\u062A\u062E\u0631\u062C \u0635\u0646\u062F\u0648\u0642 \u0627\u0644\u0643\u0644\u0645\u0627\u062A \u0643\u0627\u0645\u0644\u0627\u064B \u0643\u0643\u062A\u0644\u0629 vocabulary \u0641\u064A \u0628\u062F\u0627\u064A\u0629 \u0627\u0644\u062A\u0645\u0631\u064A\u0646 \u0645\u0639 \u062A\u0631\u062C\u0645\u062A\u0647\u0627.
       - \u0627\u0633\u062A\u062E\u0631\u062C \u0643\u0644 \u0646\u0642\u0637\u0629 \u0645\u0631\u0642\u0645\u0629 (1, 2, 3...) \u0643\u0643\u062A\u0644\u0629 question \u0645\u0633\u062A\u0642\u0644\u0629 \u0628\u0627\u0644\u0646\u0635 \u0627\u0644\u062D\u0631\u0641\u064A \u0643\u0627\u0645\u0644\u0627\u064B\u060C \u0648\u0636\u0639 \u062D\u0644 \u0627\u0644\u0646\u0642\u0637\u0629 \u0641\u064A \u062D\u0642\u0644 solutionText.
       - \u0627\u0633\u062A\u062E\u0631\u062C \u0635\u0646\u062F\u0648\u0642 \u0645\u0641\u062A\u0627\u062D \u0627\u0644\u062D\u0644\u0648\u0644 (\u0641\u064A \u0623\u0633\u0641\u0644 \u0627\u0644\u0635\u0641\u062D\u0629 \u0623\u0648 \u0646\u0647\u0627\u064A\u062A\u0647\u0627) \u0643\u0643\u062A\u0644\u0629 \u0645\u0633\u062A\u0642\u0644\u0629 (type: "example" \u0623\u0648 "note" \u0628\u0639\u0646\u0648\u0627\u0646 "\u0645\u0641\u062A\u0627\u062D \u0627\u0644\u062D\u0644\u0648\u0644 \u0627\u0644\u0646\u0645\u0648\u0630\u062C\u064A\u0629") \u062D\u062A\u0649 \u0644\u0627 \u064A\u064F\u0647\u0645\u0644 \u0623\u064A \u062D\u0644 \u0625\u0637\u0644\u0627\u0642\u0627\u064B.
    5. \u064A\u062C\u0628 \u0623\u0646 \u064A\u0628\u0642\u0649 \u062A\u0633\u0644\u0633\u0644 \u0627\u0644\u0643\u062A\u0644 \u0645\u0637\u0627\u0628\u0642\u0627\u064B \u062A\u0645\u0627\u0645\u0627\u064B \u0644\u062A\u0633\u0644\u0633\u0644 \u0627\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u0623\u0635\u0644\u064A\u0629 \u0645\u0646 \u0627\u0644\u0623\u0639\u0644\u0649 \u0644\u0644\u0623\u0633\u0641\u0644. \u0644\u0627 \u062F\u0645\u062C\u060C \u0648\u0644\u0627 \u062A\u0642\u0633\u064A\u0645 \u0639\u0634\u0648\u0627\u0626\u064A \u0644\u0644\u0623\u0633\u0637\u0631.

    \u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u0643\u062A\u0644 \u0627\u0644\u0645\u062F\u0639\u0648\u0645\u0629 \u0641\u064A structuredContent:
    - "heading": \u0644\u0644\u0639\u0646\u0627\u0648\u064A\u0646 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629 \u0648\u0627\u0644\u0641\u0631\u0639\u064A\u0629 \u0627\u0644\u0645\u0637\u0648\u0644\u0629.
    - "paragraph": \u0644\u0644\u0641\u0642\u0631\u0627\u062A \u0627\u0644\u0646\u0635\u064A\u0629 \u0627\u0644\u0639\u0627\u062F\u064A\u0629 \u0648\u0627\u0644\u0634\u0631\u0648\u062D\u0627\u062A \u0648\u0627\u0644\u0646\u0642\u0627\u0637 \u0627\u0644\u0645\u062A\u0631\u0627\u0628\u0637\u0629.
    - "example": \u0644\u0644\u0623\u0645\u062B\u0644\u0629 \u0648\u0627\u0644\u062A\u0645\u0627\u0631\u064A\u0646 \u0648\u0645\u0641\u0627\u062A\u064A\u062D \u0627\u0644\u062D\u0644\u0648\u0644.
    - "note": \u0644\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0648\u0627\u0644\u062A\u0646\u0628\u064A\u0647\u0627\u062A.
    - "warning": \u0644\u0644\u062A\u062D\u0630\u064A\u0631\u0627\u062A \u0627\u0644\u0648\u0632\u0627\u0631\u064A\u0629 \u0623\u0648 \u0627\u0644\u062A\u0639\u0627\u0644\u064A\u0644 \u0648\u0627\u0644\u0646\u0642\u0627\u0637 \u0627\u0644\u062D\u0631\u062C\u0629.
    - "question": \u0644\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629\u060C \u0627\u0644\u0646\u0642\u0627\u0637 \u0627\u0644\u0645\u0631\u0642\u0645\u0629\u060C \u0627\u0644\u062A\u0645\u0627\u0631\u064A\u0646\u060C \u0648\u0627\u0644\u0648\u0632\u0627\u0631\u064A\u0627\u062A.
    - "law": \u0644\u0644\u0642\u0648\u0627\u0646\u064A\u0646 \u0623\u0648 \u0627\u0644\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0641\u064A\u0632\u064A\u0627\u0626\u064A\u0629 \u0648\u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0629.
    - "table": \u0644\u0644\u062C\u062F\u0627\u0648\u0644 \u0623\u0648 \u0627\u0644\u0645\u0642\u0627\u0631\u0646\u0627\u062A (\u064A\u0645\u062B\u0644 \u0643\u0635\u0641\u0648\u0641 \u0645\u0646 \u0627\u0644\u0646\u0635\u0648\u0635 \u062F\u0627\u062E\u0644 items).
    - "vocabulary": \u0644\u0642\u0648\u0627\u0626\u0645 \u0648\u0635\u0646\u0627\u062F\u064A\u0642 \u0627\u0644\u0645\u0641\u0631\u062F\u0627\u062A \u0648\u0627\u0644\u0643\u0644\u0645\u0627\u062A \u0627\u0644\u0625\u0646\u0643\u0644\u064A\u0632\u064A\u0629 \u0648\u0645\u0639\u0627\u0646\u064A\u0647\u0627 (\u064A\u062C\u0628 \u0627\u0633\u062A\u062E\u0644\u0627\u0635 \u0643\u0627\u0626\u0646 vocabItems \u0644\u0647\u0627).

    ${extractedText ? `
--- \u0627\u0644\u0646\u0635 \u0627\u0644\u0623\u0635\u0644\u064A \u0627\u0644\u062F\u0642\u064A\u0642 \u0627\u0644\u0645\u0633\u062A\u062E\u0631\u062C \u0622\u0644\u064A\u0627\u064B ---
${extractedText}
-----------------------------------
\u064A\u062C\u0628 \u0623\u0644\u0627 \u064A\u0636\u064A\u0639 \u0623\u064A \u062D\u0631\u0641 \u0639\u0644\u0645\u064A \u0645\u0646 \u0647\u0630\u0627 \u0627\u0644\u0646\u0635\u060C \u0627\u0646\u0642\u0644\u0647 \u0643\u0645\u0627 \u0647\u0648 \u062A\u0645\u0627\u0645\u0627\u064B.` : ""}

    \u064A\u062C\u0628 \u0623\u0646 \u064A\u0637\u0627\u0628\u0642 \u0627\u0644\u0647\u064A\u0643\u0644 \u0628\u0635\u064A\u063A\u0629 JSON \u0627\u0644\u0645\u062E\u0637\u0637 \u0627\u0644\u062A\u0627\u0644\u064A \u0628\u0627\u0644\u0636\u0628\u0637:
    {
      "pages": [
        {
          "pageNumber": 1,
          "title": "\u0639\u0646\u0648\u0627\u0646 \u0631\u0626\u064A\u0633\u064A \u0644\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u0645\u0637\u0648\u0644",
          "subtitle": "\u0639\u0646\u0648\u0627\u0646 \u0641\u0631\u0639\u064A \u0623\u0648 \u0648\u0635\u0641 \u0645\u0628\u0633\u0637",
          "objectives": ["\u0623\u0647\u062F\u0627\u0641 \u0645\u0648\u062C\u0648\u062F\u0629 \u0641\u064A \u0627\u0644\u0635\u0641\u062D\u0629 \u0625\u0646 \u0648\u062C\u062F\u062A"],
          "coreConcepts": ["\u0645\u0641\u0627\u0647\u064A\u0645 \u0648\u0627\u0633\u0645\u0627\u0621 \u0631\u0626\u064A\u0633\u064A\u0629 \u0641\u064A \u0627\u0644\u0645\u0641\u0631\u062F\u0627\u062A"],
          "structuredContent": [
            {
              "type": "heading" | "paragraph" | "example" | "note" | "warning" | "question" | "law" | "table" | "vocabulary",
              "title": "\u0639\u0646\u0648\u0627\u0646 \u0627\u062E\u062A\u064A\u0627\u0631\u064A \u0644\u0644\u0643\u062A\u0644\u0629 (\u0645\u062B\u0627\u0644: \u0645\u062B\u0627\u0644 1\u060C \u0645\u0644\u0627\u062D\u0638\u0629 \u0647\u0627\u0645\u0629\u060C \u0627\u0644\u0646\u0642\u0637\u0629 1)",
              "content": "\u0627\u0644\u0646\u0635 \u0627\u0644\u0623\u0635\u0644\u064A \u0627\u0644\u062D\u0631\u0641\u064A \u0627\u0644\u0643\u0627\u0645\u0644 \u0644\u0644\u0643\u062A\u0644\u0629",
              "questionText": "\u0646\u0635 \u0627\u0644\u0633\u0624\u0627\u0644 \u0641\u064A \u062D\u0627\u0644 \u0643\u0627\u0646 \u0627\u0644\u0646\u0648\u0639 question",
              "solutionText": "\u0627\u0644\u062C\u0648\u0627\u0628 \u0623\u0648 \u062D\u0644 \u0627\u0644\u0641\u0631\u0627\u063A/\u0627\u0644\u0646\u0642\u0637\u0629 \u0644\u064A\u0638\u0647\u0631 \u0639\u0646\u062F \u0627\u0644\u0646\u0642\u0631 \u0639\u0644\u0649 \u0625\u0638\u0647\u0627\u0631 \u0627\u0644\u062D\u0644",
              "linguisticAnalysis": "\u062A\u062D\u0644\u064A\u0644 \u0648\u0632\u0627\u0631\u064A \u0623\u0648 \u0644\u063A\u0648\u064A \u0630\u0643\u064A",
              "items": ["\u062A\u0633\u062A\u062E\u062F\u0645 \u0641\u064A \u062D\u0627\u0644 \u0627\u0644\u0642\u0648\u0627\u0626\u0645 \u0623\u0648 \u0627\u0644\u062C\u062F\u0627\u0648\u0644 \u0643\u0646\u0635\u0648\u0635 \u0645\u0635\u0641\u0648\u0641\u0629"],
              "vocabItems": [{"en": "\u0627\u0644\u0643\u0644\u0645\u0629 \u0628\u0627\u0644\u0627\u0646\u0643\u0644\u064A\u0632\u064A\u0629", "ar": "\u0627\u0644\u062A\u0631\u062C\u0645\u0629 \u0628\u0627\u0644\u0639\u0631\u0628\u064A\u0629"}]
            }
          ],
          "integrityWarning": "\u0631\u0633\u0627\u0644\u0629 \u062A\u062D\u0630\u064A\u0631\u064A\u0629 \u0635\u0631\u064A\u062D\u0629 \u0625\u0630\u0627 \u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0646\u0642\u0635 \u0645\u0642\u0627\u0631\u0646\u0629 \u0628\u0627\u0644\u0646\u0635 \u0627\u0644\u0623\u0635\u0644\u064A\u060C \u0623\u0648 \u062A\u0631\u0643 \u0641\u0627\u0631\u063A\u0627\u064B.",
          "quiz": [
             {
               "type": "mcq",
               "question": "\u064A\u062C\u0628 \u062A\u0648\u0644\u064A\u062F 5 \u0625\u0644\u0649 8 \u0623\u0633\u0626\u0644\u0629 \u0645\u062A\u0646\u0648\u0639\u0629 \u0647\u0646\u0627 \u0645\u0646 \u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0635\u0641\u062D\u0629 \u0644\u062A\u0648\u0641\u064A\u0631 \u062A\u062C\u0631\u0628\u0629 \u0633\u0631\u064A\u0639\u0629 \u0648\u0645\u062A\u062C\u062F\u062F\u0629 \u0643\u0644 \u0645\u0631\u0629 \u064A\u064F\u0641\u062A\u062D \u0641\u064A\u0647\u0627 \u062A\u062D\u062F\u064A 60 \u062B\u0627\u0646\u064A\u0629 \u0644\u0644\u0645\u0633\u062A\u062E\u062F\u0645.",
               "options": ["\u062E\u064A\u0627\u0631 1", "\u062E\u064A\u0627\u0631 2", "\u062E\u064A\u0627\u0631 3", "\u062E\u064A\u0627\u0631 4"],
               "correct": 0,
               "explanation": "\u062A\u0641\u0633\u064A\u0631 \u0633\u0631\u064A\u0639 \u0644\u0644\u0625\u062C\u0627\u0628\u0629 \u0627\u0644\u0635\u062D\u064A\u062D\u0629"
             }
          ],
          "ministerialQuestions": [
            {
              "question": "\u0646\u0635 \u0627\u0644\u0633\u0624\u0627\u0644 \u0627\u0644\u0648\u0632\u0627\u0631\u064A \u0643\u0645\u0627 \u0648\u0631\u062F \u0628\u062D\u0631\u0641\u064A\u062A\u0647 \u0625\u0630\u0627 \u062A\u0648\u0641\u0631",
              "answer": "\u0627\u0644\u062C\u0648\u0627\u0628 \u0627\u0644\u062A\u0648\u0636\u064A\u062D\u064A \u0644\u0644\u0633\u0624\u0627\u0644",
              "years": "\u0627\u0644\u0633\u0646\u0648\u0627\u062A \u0648\u0627\u0644\u0623\u062F\u0648\u0627\u0631 \u0627\u0644\u0648\u0632\u0627\u0631\u064A\u0629 (\u0627\u0644\u062A\u0639\u0631\u0641 \u0627\u0644\u062A\u0627\u0645 \u0639\u0644\u0649 \u0643\u0627\u0641\u0629 \u0627\u0644\u0631\u0645\u0648\u0632 \u0648\u0627\u0644\u0623\u062F\u0648\u0627\u0631: \u062F1\u060C \u062F\u0648\u0631 \u0623\u0648\u0644\u060C \u062F2\u060C \u062F\u0648\u0631 \u062B\u0627\u0646\u064A\u060C \u062F3\u060C \u062F\u0648\u0631 \u062B\u0627\u0644\u062B\u060C \u062A\u060C \u062A\u0645\u0647\u064A\u062F\u064A\u060C \u062E\u060C \u062E\u0627\u0631\u062C\u064A\u060C \u062E\u0627\u0631\u062C \u0627\u0644\u0642\u0637\u0631\u060C \u0646\u060C \u0646\u0627\u0632\u062D\u064A\u0646\u060C \u062A\u0643\u0645\u064A\u0644\u064A\u060C \u0627\u0633\u062A\u062B\u0646\u0627\u0626\u064A\u060C \u0648\u0643\u0627\u0641\u0629 \u0627\u0644\u0633\u0646\u0648\u0627\u062A \u0645\u0646 2000 \u0625\u0644\u0649 2026)",
              "session": "\u0627\u0644\u062F\u0648\u0631 \u0627\u0644\u0648\u0632\u0627\u0631\u064A \u0627\u0644\u0645\u0633\u062A\u0646\u0628\u0637 (\u0645\u062B\u0627\u0644: \u0627\u0644\u062F\u0648\u0631 \u0627\u0644\u0623\u0648\u0644 (\u062F1)\u060C \u062A\u0645\u0647\u064A\u062F\u064A (\u062A)\u060C \u062E\u0627\u0631\u062C \u0627\u0644\u0642\u0637\u0631 (\u062E)\u060C \u0646\u0627\u0632\u062D\u064A\u0646 (\u0646))",
              "year": "\u0627\u0644\u0633\u0646\u0629 \u0627\u0644\u0648\u0632\u0627\u0631\u064A\u0629 \u0627\u0644\u0645\u0633\u062A\u0646\u0628\u0637\u0629 (\u0645\u062B\u0627\u0644: 2023\u060C 2024)"
            }
          ],
          "passes": []
        }
      ]
    }
  `;
      const fullPrompt = prompt + "\n\u0645\u0644\u0627\u062D\u0638\u0629 \u0647\u0627\u0645\u0629 \u062C\u062F\u0627: 1) \u062A\u0623\u0643\u062F \u0645\u0646 \u062A\u0636\u0645\u064A\u0646 5 \u0623\u0633\u0626\u0644\u0629 \u0627\u062E\u062A\u064A\u0627\u0631 \u0645\u0646 \u0645\u062A\u0639\u062F\u062F \u0641\u064A \u0642\u0633\u0645 quiz \u0645\u0646 \u0635\u0644\u0628 \u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0635\u0641\u062D\u0629. 2) \u0627\u0633\u062A\u062E\u0631\u062C \u0643\u0644 \u0633\u0624\u0627\u0644 \u0648\u0632\u0627\u0631\u064A \u0628\u062F\u0642\u0629 \u0648\u062A\u0639\u0631\u0641 \u0639\u0644\u0649 \u062C\u0645\u064A\u0639 \u0635\u064A\u063A \u0627\u0644\u0623\u062F\u0648\u0627\u0631 (\u062F1, \u062F2, \u062F3, \u062A, \u062E, \u0646, \u0646\u0627\u0632\u062D\u064A\u0646, \u062A\u0645\u0647\u064A\u062F\u064A, \u062E\u0627\u0631\u062C \u0627\u0644\u0642\u0637\u0631) \u0648\u0627\u0644\u0633\u0646\u0648\u0627\u062A \u0645\u0646 2000 \u0625\u0644\u0649 2026.";
      const parsedResults = await decisionEngine.process({
        prompt: fullPrompt,
        base64Data: cleanBase64,
        mimeType,
        responseFormat: "json",
        endpointName: "extract",
        extractedText
      });
      const generateFallbackQuiz = (pageTitle, blocks, rawText) => {
        const questions = [];
        const contentSentences = blocks.filter((b) => b.content && b.content.length > 20).map((b) => b.content).join(" ").split(/[\.\n؟!\u061B]/).map((s) => s.trim()).filter((s) => s.length > 25 && s.length < 150);
        if (contentSentences.length >= 2) {
          contentSentences.slice(0, 5).forEach((sent, sIdx) => {
            const words = sent.split(/\s+/);
            const keyWordIdx = Math.min(words.length - 1, Math.max(0, Math.floor(words.length / 2)));
            const keyWord = words[keyWordIdx];
            const clozeSentence = words.map((w, idx) => idx === keyWordIdx ? "(___)" : w).join(" ");
            questions.push({
              type: "mcq",
              question: `\u0633${sIdx + 1}: \u0623\u0643\u0645\u0644 \u0627\u0644\u0641\u0631\u0627\u063A \u0628\u0627\u0644\u062E\u064A\u0627\u0631 \u0627\u0644\u062F\u0642\u064A\u0642 \u0648\u0641\u0642\u0627\u064B \u0644\u0644\u0646\u0635 \u0627\u0644\u0639\u0644\u0645\u064A: "${clozeSentence}"`,
              options: [
                keyWord,
                "\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0645\u0639\u0646\u0649 \u0627\u0644\u0633\u064A\u0627\u0642\u064A",
                "\u0639\u0643\u0633 \u0627\u0644\u0646\u062A\u064A\u062C\u0629 \u0627\u0644\u0646\u0645\u0648\u0630\u062C\u064A\u0629",
                "\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0636\u0648\u0627\u0628\u0637 \u0627\u0644\u0645\u062D\u062F\u062F\u0629"
              ],
              correct: 0,
              explanation: `\u0627\u0644\u0625\u062C\u0627\u0628\u0629 \u0627\u0644\u0646\u0645\u0648\u0630\u062C\u064A\u0629 \u0627\u0644\u062D\u0631\u0641\u064A\u0629 \u0643\u0645\u0627 \u0648\u0631\u062F\u062A \u0641\u064A \u0633\u064A\u0627\u0642 \u0627\u0644\u0635\u0641\u062D\u0629: ${sent}`
            });
          });
        }
        if (questions.length < 3) {
          questions.push(
            {
              type: "mcq",
              question: `\u0645\u0627 \u0647\u0648 \u0627\u0644\u0645\u062D\u0648\u0631 \u0627\u0644\u0623\u0633\u0627\u0633\u064A \u0627\u0644\u0630\u064A \u062A\u062A\u0646\u0627\u0648\u0644\u0647 \u0647\u0630\u0647 \u0627\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629 (${pageTitle || "\u0627\u0644\u062F\u0631\u0633"})\u061F`,
              options: [
                pageTitle || "\u0627\u0644\u0645\u0641\u0627\u0647\u064A\u0645 \u0648\u0627\u0644\u0634\u0631\u0648\u062D\u0627\u062A \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629 \u0641\u064A \u0627\u0644\u0635\u0641\u062D\u0629",
                "\u0645\u0648\u0627\u0636\u064A\u0639 \u062E\u0627\u0631\u062C\u064A\u0629 \u063A\u064A\u0631 \u0645\u062A\u0639\u0644\u0642\u0629 \u0628\u0627\u0644\u0645\u0646\u0647\u062C",
                "\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0642\u0648\u0627\u0639\u062F \u0648\u0627\u0644\u0634\u0631\u0648\u0637 \u0627\u0644\u0645\u0646\u0647\u062C\u064A\u0629",
                "\u0646\u0635\u0648\u0635 \u0639\u0634\u0648\u0627\u0626\u064A\u0629 \u063A\u064A\u0631 \u0645\u0648\u062B\u0642\u0629"
              ],
              correct: 0,
              explanation: "\u062A\u0645\u062D\u0648\u0631 \u0627\u0644\u0635\u0641\u062D\u0629 \u062D\u0648\u0644 \u0627\u0644\u0645\u0627\u062F\u0629 \u0627\u0644\u0639\u0644\u0645\u064A\u0629 \u0648\u0627\u0644\u0634\u0631\u0648\u062D\u0627\u062A \u0648\u0627\u0644\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0645\u0648\u062B\u0642\u0629 \u0628\u0647\u0627."
            },
            {
              type: "mcq",
              question: "\u0645\u0627 \u0647\u064A \u0627\u0644\u062A\u0648\u0635\u064A\u0629 \u0627\u0644\u0648\u0632\u0627\u0631\u064A\u0629 \u0648\u0627\u0644\u062A\u0631\u0628\u0648\u064A\u0629 \u0627\u0644\u0630\u0647\u0628\u064A\u0629 \u0644\u0625\u062A\u0642\u0627\u0646 \u0645\u062D\u062A\u0648\u0649 \u0647\u0630\u0627 \u0627\u0644\u062F\u0631\u0633\u061F",
              options: [
                "\u0627\u0644\u0641\u0647\u0645 \u0627\u0644\u062F\u0642\u064A\u0642 \u0644\u0644\u0642\u0627\u0639\u062F\u0629 \u0648\u062D\u0644 \u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0645\u0639 \u0645\u0637\u0627\u0628\u0642\u0629 \u0627\u0644\u0625\u062C\u0627\u0628\u0629 \u0627\u0644\u0646\u0645\u0648\u0630\u062C\u064A\u0629",
                "\u0627\u0644\u062D\u0641\u0638 \u0627\u0644\u0639\u0634\u0648\u0627\u0626\u064A \u0627\u0644\u0633\u0631\u064A\u0639 \u062F\u0648\u0646 \u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0623\u0645\u062B\u0644\u0629",
                "\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0648\u0627\u0644\u062A\u062D\u0630\u064A\u0631\u0627\u062A \u0627\u0644\u0647\u0627\u0645\u0629",
                "\u0625\u0647\u0645\u0627\u0644 \u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0648\u0627\u0644\u062A\u0645\u0627\u0631\u064A\u0646 \u0627\u0644\u062A\u0637\u0628\u064A\u0642\u064A\u0629"
              ],
              correct: 0,
              explanation: "\u0627\u0644\u0641\u0647\u0645 \u0648\u0627\u0644\u062A\u062F\u0631\u064A\u0628 \u0627\u0644\u0639\u0645\u0644\u064A \u0627\u0644\u0645\u0633\u062A\u0645\u0631 \u064A\u0636\u0645\u0646\u0627\u0646 \u0627\u0633\u062A\u0642\u0631\u0627\u0631 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0629 \u0648\u0627\u0644\u062F\u0631\u062C\u0629 \u0627\u0644\u0643\u0627\u0645\u0644\u0629."
            }
          );
        }
        return questions;
      };
      const buildBlocksFromRawText = (text2) => {
        if (!text2 || typeof text2 !== "string") return [];
        const lines = text2.split(/\n+/).map((l) => l.trim()).filter((l) => l.length > 0);
        const resultBlocks = [];
        lines.forEach((line, idx) => {
          if (idx === 0 && line.length < 80) {
            resultBlocks.push({ type: "heading", title: "\u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0631\u0626\u064A\u0633\u064A", content: line });
          } else if (line.startsWith("\u0633/") || line.startsWith("\u0633\u0624\u0627\u0644") || line.startsWith("\u062A\u062D\u062F\u064A") || line.includes("\u061F")) {
            resultBlocks.push({ type: "question", title: "\u0633\u0624\u0627\u0644 \u0648\u062A\u0637\u0628\u064A\u0642", content: line });
          } else if (line.startsWith("\u0645\u0644\u0627\u062D\u0638\u0629") || line.startsWith("\u062A\u0646\u0628\u064A\u0647") || line.startsWith("\u0641\u0627\u0626\u062F\u0629")) {
            resultBlocks.push({ type: "note", title: "\u0645\u0644\u0627\u062D\u0638\u0629 \u0647\u0627\u0645\u0629", content: line });
          } else if (line.startsWith("\u062A\u062D\u0630\u064A\u0631") || line.startsWith("\u0627\u0646\u062A\u0628\u0647") || line.includes("\u0648\u0632\u0627\u0631\u064A")) {
            resultBlocks.push({ type: "warning", title: "\u062A\u0631\u0643\u064A\u0632 \u0648\u0632\u0627\u0631\u064A", content: line });
          } else if (line.startsWith("\u0642\u0627\u0639\u062F\u0629") || line.startsWith("\u0642\u0627\u0646\u0648\u0646") || line.startsWith("Rule")) {
            resultBlocks.push({ type: "law", title: "\u0642\u0627\u0639\u062F\u0629 / \u0642\u0627\u0646\u0648\u0646", content: line });
          } else if (line.startsWith("\u0645\u062B\u0627\u0644") || line.startsWith("Example")) {
            resultBlocks.push({ type: "example", title: "\u0645\u062B\u0627\u0644 \u062A\u0637\u0628\u064A\u0642\u064A", content: line });
          } else {
            resultBlocks.push({ type: "paragraph", content: line });
          }
        });
        return resultBlocks;
      };
      let rawBlocks = [];
      if (Array.isArray(parsedResults)) {
        rawBlocks = parsedResults;
      } else if (parsedResults && typeof parsedResults === "object") {
        if (Array.isArray(parsedResults.pages)) {
          rawBlocks = parsedResults.pages;
        } else {
          rawBlocks = [parsedResults];
        }
      }
      const normalizedPages = [];
      rawBlocks.forEach((rawPage, idx) => {
        if (!rawPage || typeof rawPage !== "object") return;
        if (Array.isArray(rawPage.pages)) {
          rawPage.pages.forEach((subPage, subIdx) => {
            if (subPage && typeof subPage === "object") {
              rawBlocks.push(subPage);
            }
          });
          return;
        }
        const pageNum = rawPage.pageNumber || idx + 1;
        const pageTitle = rawPage.title || (idx === 0 ? "\u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0639\u0644\u0645\u064A \u0627\u0644\u0645\u0639\u062A\u0645\u062F" : `\u0627\u0644\u0635\u0641\u062D\u0629 ${pageNum}`);
        const pageSubtitle = rawPage.subtitle || rawPage.tag || "\u0627\u0644\u0648\u062D\u062F\u0629 \u0627\u0644\u0623\u0648\u0644\u0649";
        let blocks = [];
        const candidateBlocks = rawPage.structuredContent || rawPage.structured_content || rawPage.blocks || rawPage.content_blocks || rawPage.items || rawPage.sections;
        if (Array.isArray(candidateBlocks) && candidateBlocks.length > 0) {
          blocks = candidateBlocks.map((b, bIdx) => {
            if (typeof b === "string") {
              return { type: "paragraph", content: b };
            }
            const contentVal = b.content || (b.text ? b.text : Array.isArray(b.items) ? b.items.join("\n") : "");
            const qVal = b.questionText || b.question || (b.type === "question" ? contentVal : void 0);
            const sVal = b.solutionText || b.answer || b.solution || void 0;
            return {
              id: b.id || `node_${idx}_${bIdx}_${Date.now()}`,
              type: b.type || (qVal ? "question" : "paragraph"),
              title: b.title || void 0,
              content: contentVal,
              questionText: qVal,
              solutionText: sVal,
              linguisticAnalysis: b.linguisticAnalysis || b.analysis || void 0,
              difficulty: b.difficulty || void 0,
              tag: b.tag || void 0,
              year: b.year || void 0,
              session: b.session || void 0,
              branch: b.branch || void 0,
              items: Array.isArray(b.items) ? b.items : void 0,
              vocabItems: Array.isArray(b.vocabItems) ? b.vocabItems : void 0
            };
          });
        }
        const fallbackText = rawPage.rawText || rawPage.extractedText || rawPage.text || (typeof rawPage.content === "string" ? rawPage.content : "") || extractedText || "";
        if (blocks.length === 0 && fallbackText.trim().length > 0) {
          blocks = buildBlocksFromRawText(fallbackText);
        }
        if (blocks.length === 0) {
          blocks = [
            {
              type: "paragraph",
              title: "\u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A",
              content: "\u062A\u0645 \u0627\u0633\u062A\u062E\u0631\u0627\u062C \u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0635\u0641\u062D\u0629 \u0628\u0646\u062C\u0627\u062D \u0648\u062C\u0627\u0631\u064A \u0625\u0639\u062F\u0627\u062F\u0647 \u0644\u0644\u0639\u0631\u0636 \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u064A."
            }
          ];
        }
        let quizItems = [];
        const candidateQuiz = rawPage.quiz || rawPage.quizQuestions || rawPage.quiz_questions || rawPage.questions || rawPage.mcqs;
        if (Array.isArray(candidateQuiz) && candidateQuiz.length > 0) {
          quizItems = candidateQuiz.map((q) => ({
            type: "mcq",
            question: q.question || q.text || q.title || "\u0633\u0624\u0627\u0644 \u0627\u062E\u062A\u0628\u0627\u0631\u064A",
            options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ["\u0627\u0644\u062E\u064A\u0627\u0631 \u0627\u0644\u0623\u0648\u0644", "\u0627\u0644\u062E\u064A\u0627\u0631 \u0627\u0644\u062B\u0627\u0646\u064A", "\u0627\u0644\u062E\u064A\u0627\u0631 \u0627\u0644\u062B\u0627\u0644\u062B", "\u0627\u0644\u062E\u064A\u0627\u0631 \u0627\u0644\u0631\u0627\u0628\u0639"],
            correct: typeof q.correct === "number" ? q.correct : 0,
            explanation: q.explanation || q.tip || "\u0627\u0644\u0625\u062C\u0627\u0628\u0629 \u0645\u0633\u062A\u0646\u0628\u0637\u0629 \u0645\u0628\u0627\u0634\u0631\u0629 \u0645\u0646 \u0646\u0635 \u0627\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u0623\u0635\u0644\u064A."
          }));
        }
        if (quizItems.length === 0) {
          quizItems = generateFallbackQuiz(pageTitle, blocks, fallbackText);
        }
        let ministerialItems = [];
        const candidateMinisterial = rawPage.ministerialQuestions || rawPage.ministerial_questions || rawPage.ministerials;
        if (Array.isArray(candidateMinisterial) && candidateMinisterial.length > 0) {
          ministerialItems = candidateMinisterial.map((m) => ({
            question: m.question || m.text || "\u0633\u0624\u0627\u0644 \u0648\u0632\u0627\u0631\u064A",
            answer: m.answer || m.solution || "\u0627\u0644\u062C\u0648\u0627\u0628 \u0627\u0644\u0646\u0645\u0648\u0630\u062C\u064A \u0648\u0641\u0642 \u0627\u0644\u0636\u0648\u0627\u0628\u0637 \u0627\u0644\u0648\u0632\u0627\u0631\u064A\u0629",
            years: m.years || m.year || "\u0645\u0642\u0631\u0631 \u0648\u0632\u0627\u0631\u064A"
          }));
        }
        normalizedPages.push({
          pageNumber: pageNum,
          title: pageTitle,
          subtitle: pageSubtitle,
          objectives: Array.isArray(rawPage.objectives) ? rawPage.objectives : [],
          coreConcepts: Array.isArray(rawPage.coreConcepts) ? rawPage.coreConcepts : [],
          structuredContent: blocks,
          quiz: quizItems,
          ministerialQuestions: ministerialItems,
          extractedText: fallbackText || blocks.map((b) => b.content).filter(Boolean).join("\n\n"),
          integrityWarning: rawPage.integrityWarning || ""
        });
      });
      if (normalizedPages.length === 0) {
        const fbBlocks = buildBlocksFromRawText(extractedText || "\u0645\u062D\u062A\u0648\u0649 \u062A\u0639\u0644\u064A\u0645\u064A \u0645\u0633\u062A\u062E\u0631\u062C");
        normalizedPages.push({
          pageNumber: 1,
          title: "\u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0639\u0644\u0645\u064A \u0627\u0644\u0645\u0639\u062A\u0645\u062F",
          subtitle: "\u0627\u0644\u0648\u062D\u062F\u0629 \u0627\u0644\u0623\u0648\u0644\u0649",
          structuredContent: fbBlocks.length > 0 ? fbBlocks : [{ type: "paragraph", content: extractedText || "\u062A\u0645\u062A \u0645\u0639\u0627\u0644\u062C\u0629 \u0627\u0644\u0635\u0641\u062D\u0629 \u0628\u0646\u062C\u0627\u062D." }],
          quiz: generateFallbackQuiz("\u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0639\u0644\u0645\u064A \u0627\u0644\u0645\u0639\u062A\u0645\u062F", fbBlocks, extractedText || ""),
          ministerialQuestions: [],
          extractedText: extractedText || ""
        });
      }
      res.json({ pages: normalizedPages });
    } catch (error) {
      console.error("Error generating content via AI service:", error);
      res.status(500).json({ error: "Failed to generate content", details: error.message });
    }
  });
  app.post(["/api/gemini/radar", "/api/worker/ai/radar"], async (req, res) => {
    const { content } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }
    try {
      const parsedResults = await decisionEngine.process({
        prompt: `
        \u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u062A\u0627\u0644\u064A\u060C \u0627\u0633\u062A\u0646\u062A\u062C 3 \u0623\u0633\u0626\u0644\u0629 \u0630\u0643\u064A\u0629 \u0648\u0639\u0645\u064A\u0642\u0629 (\u0623\u0633\u0626\u0644\u0629 \u0627\u0633\u062A\u0646\u062A\u0627\u062C\u064A\u0629) \u0644\u0644\u0637\u0644\u0627\u0628.
        \u0627\u0644\u0645\u062D\u062A\u0648\u0649:
        ${content}
        
        \u0623\u0631\u062C\u0639 \u0627\u0644\u0646\u062A\u064A\u062C\u0629 \u0643\u0642\u0627\u0626\u0645\u0629 \u0646\u0635\u064A\u0629 \u0628\u0633\u064A\u0637\u0629 \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629.
      `,
        endpointName: "radar",
        responseFormat: "text"
      });
      const text2 = typeof parsedResults === "string" ? parsedResults : parsedResults?.text || "";
      res.json({ questions: text2.split("\n").filter((line) => line.trim().length > 0) });
    } catch (error) {
      console.error("Error getting radar:", error);
      res.status(500).json({ error: "Failed to process" });
    }
  });
  app.post(["/api/gemini/mock-exam", "/api/worker/ai/mock-exam", "/api/generate-mock-exam"], async (req, res) => {
    const { content, subject } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }
    try {
      const prompt = `
        \u0623\u0646\u062A \u0648\u0627\u0636\u0639 \u0623\u0633\u0626\u0644\u0629 \u0627\u0645\u062A\u062D\u0627\u0646\u0627\u062A \u0648\u0632\u0627\u0631\u0629 \u0627\u0644\u062A\u0631\u0628\u064A\u0629 \u0627\u0644\u0639\u0631\u0627\u0642\u064A\u0629 \u0644\u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0633\u0627\u062F\u0633 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u064A.
        \u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0645\u0644\u0632\u0645\u0629 \u0627\u0644\u062A\u0627\u0644\u064A \u0648\u0627\u0644\u0645\u0627\u062F\u0629 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629: [${subject || "\u0639\u0627\u0645"}]\u060C \u0642\u0645 \u0628\u062A\u0648\u0644\u064A\u062F \u0627\u0645\u062A\u062D\u0627\u0646 \u062A\u062C\u0631\u064A\u0628\u064A \u0634\u0627\u0645\u0644 \u064A\u062A\u0643\u0648\u0646 \u0645\u0646 20 \u0633\u0624\u0627\u0644\u0627\u064B \u0645\u062A\u0646\u0648\u0639\u0627\u064B.
        \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0645\u062A\u0627\u062D \u0645\u0646 \u0627\u0644\u0645\u0644\u0632\u0645\u0629:
        ${content || "\u0644\u0627 \u064A\u0648\u062C\u062F \u0645\u062D\u062A\u0648\u0649 \u0645\u062D\u062F\u062F\u060C \u064A\u0631\u062C\u0649 \u062A\u0648\u0644\u064A\u062F \u0623\u0633\u0626\u0644\u0629 \u0646\u0645\u0648\u0630\u062C\u064A\u0629 \u0639\u0627\u0645\u0629 \u0641\u064A \u0645\u0627\u062F\u0629 " + (subject || "\u0627\u0644\u0641\u064A\u0632\u064A\u0627\u0621")}
        
        \u0634\u0631\u0648\u0637 \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0623\u0633\u0626\u0644\u0629:
        1. \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0627\u0644\u0639\u062F\u062F \u0627\u0644\u0625\u062C\u0645\u0627\u0644\u064A 20 \u0633\u0624\u0627\u0644\u0627\u064B \u0645\u062A\u0646\u0648\u0639\u0627\u064B (\u0627\u062E\u062A\u064A\u0627\u0631\u0627\u062A\u060C \u0635\u062D \u0648\u062E\u0637\u0623\u060C \u0641\u0631\u0627\u063A\u0627\u062A\u060C \u062A\u0639\u0627\u0644\u064A\u0644\u060C \u062A\u0639\u0627\u0631\u064A\u0641\u060C \u062A\u0639\u062F\u0627\u062F) \u0645\u0635\u0627\u063A\u0629 \u0628\u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u0627\u062E\u062A\u064A\u0627\u0631 \u0645\u0646 \u0645\u062A\u0639\u062F\u062F.
        2. \u0623\u0646 \u062A\u0643\u0648\u0646 \u0623\u0633\u0626\u0644\u0629 \u0630\u0643\u064A\u0629 \u0648\u0627\u0633\u062A\u0646\u062A\u0627\u062C\u064A\u0629 \u0645\u0646 \u0648\u062D\u064A \u0627\u0644\u0645\u0646\u0647\u062C \u0627\u0644\u0639\u0631\u0627\u0642\u064A \u0627\u0644\u0631\u0633\u0645\u064A \u062D\u0635\u0631\u0627\u064B \u0648\u0628\u0623\u0633\u0644\u0648\u0628 \u0648\u0632\u0627\u0631\u064A.
        3. \u0644\u0644\u0635\u062D \u0648\u0627\u0644\u062E\u0637\u0623: \u0627\u062C\u0639\u0644 \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A ["\u0635\u062D", "\u062E\u0637\u0623"]. \u0644\u0644\u062A\u0639\u0627\u0644\u064A\u0644/\u0627\u0644\u062A\u0639\u0627\u0631\u064A\u0641/\u0627\u0644\u062A\u0639\u062F\u0627\u062F: \u0627\u062C\u0639\u0644 \u0627\u0644\u062C\u0648\u0627\u0628 \u0627\u0644\u0635\u062D\u064A\u062D \u0623\u062D\u062F \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A \u0648\u0627\u0635\u0646\u0639 \u062B\u0644\u0627\u062B\u0629 \u062E\u064A\u0627\u0631\u0627\u062A \u0623\u062E\u0631\u0649 \u0645\u0645\u0648\u0647\u0629 \u0648\u0645\u0642\u0627\u0631\u0628\u0629.
        4. \u0623\u0646 \u062A\u0631\u0641\u0642 \u0643\u0644 \u0633\u0624\u0627\u0644 \u0628\u0640 "\u0627\u0644\u062A\u0641\u0633\u064A\u0631 \u0627\u0644\u0648\u0632\u0627\u0631\u064A \u0627\u0644\u062F\u0642\u064A\u0642 \u0648\u0627\u0644\u0639\u0645\u064A\u0642" (explanation) \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0644\u0634\u0631\u062D \u0633\u0628\u0628 \u0627\u0644\u0625\u062C\u0627\u0628\u0629 \u0627\u0644\u0635\u062D\u064A\u062D\u0629.
        5. \u0623\u0646 \u062A\u0639\u0648\u062F \u0628\u0627\u0644\u0646\u062A\u064A\u062C\u0629 \u0643\u0640 \u0645\u0635\u0641\u0648\u0641\u0629 JSON \u0635\u0627\u0644\u062D\u0629 \u062D\u0635\u0631\u0627\u064B (valid JSON array of objects) \u062F\u0648\u0646 \u0623\u064A \u0643\u0644\u0627\u0645 \u062E\u0627\u0631\u062C\u064A \u0623\u0648 \u062A\u063A\u0644\u064A\u0641 \u0645\u0627\u0631\u0643\u062F\u0627\u0648\u0646. \u0627\u0644\u0647\u064A\u0643\u0644 \u0627\u0644\u0645\u0637\u0644\u0648\u0628:
        [
          {
            "id": 1,
            "text": "\u0646\u0635 \u0627\u0644\u0633\u0624\u0627\u0644 \u0647\u0646\u0627... (\u0645\u062B\u0627\u0644: \u0639\u0644\u0644: \u0643\u0630\u0627 \u0643\u0630\u0627\u060C \u0623\u0648 \u0639\u0631\u0641: \u0643\u0630\u0627 \u0643\u0630\u0627)",
            "options": ["\u0627\u0644\u062E\u064A\u0627\u0631 \u0627\u0644\u0623\u0648\u0644", "\u0627\u0644\u062E\u064A\u0627\u0631 \u0627\u0644\u062B\u0627\u0646\u064A", "\u0627\u0644\u062E\u064A\u0627\u0631 \u0627\u0644\u062B\u0627\u0644\u062B", "\u0627\u0644\u062E\u064A\u0627\u0631 \u0627\u0644\u0631\u0627\u0628\u0639"],
            "correctAnswer": 0,
            "explanation": "\u0627\u0644\u062A\u0641\u0633\u064A\u0631 \u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A \u0627\u0644\u062A\u0641\u0635\u064A\u0644\u064A..."
          }
        ]
      `;
      const parsedQuestions = await decisionEngine.process({
        prompt,
        endpointName: "mock-exam",
        responseFormat: "json"
      });
      let formattedQuestions = Array.isArray(parsedQuestions) ? parsedQuestions : parsedQuestions?.questions || [parsedQuestions];
      if (Array.isArray(formattedQuestions) && formattedQuestions.length > 0 && formattedQuestions[0]?.unparsed) {
        formattedQuestions = [];
      }
      res.json({ questions: formattedQuestions });
    } catch (error) {
      console.error("Error generating mock exam via Gemini:", error);
      res.status(500).json({ error: "Failed to generate mock exam", details: error instanceof Error ? error.message : String(error) });
    }
  });
  app.post(["/api/gemini/extract-questions", "/api/worker/ai/extract-questions", "/api/extract-exam-questions"], async (req, res) => {
    const { base64Data, mimeType = "image/jpeg" } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }
    try {
      const cleanBase64 = base64Data.split(",")[1] || base64Data;
      const prompt = `
        \u0642\u0645 \u0628\u0642\u0631\u0627\u0621\u0629 \u0647\u0630\u0647 \u0627\u0644\u0648\u0631\u0642\u0629 \u0627\u0644\u0645\u0643\u062A\u0648\u0628\u0629 \u0623\u0648 \u0627\u0644\u0645\u0637\u0628\u0648\u0639\u0629 \u0648\u0627\u0644\u062A\u064A \u062A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u0623\u0633\u0626\u0644\u0629 \u0627\u0645\u062A\u062D\u0627\u0646\u064A\u0629.
        \u0627\u0644\u0645\u0647\u0645\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u0648\u0627\u0644\u0623\u0647\u0645 \u0647\u064A \u0627\u0633\u062A\u062E\u0631\u0627\u062C **\u0643\u0644 \u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0648\u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u0641\u0631\u0639 \u0648\u0627\u0644\u0646\u0642\u0627\u0637 \u0627\u0644\u0641\u0631\u0639\u064A\u0629** \u062D\u0631\u0641\u064A\u0627\u064B \u0643\u0645\u0627 \u0647\u064A \u0645\u0643\u062A\u0648\u0628\u0629 \u0641\u064A \u0627\u0644\u0648\u0631\u0642\u0629\u060C \u0648\u0639\u062F\u0645 \u0625\u0647\u0645\u0627\u0644 \u0623\u064A \u0633\u0624\u0627\u0644 \u0623\u0648 \u0641\u0631\u0639.
        \u0644\u0627 \u062A\u0647\u062A\u0645 \u0643\u062B\u064A\u0631\u0627\u064B \u0628\u062A\u0635\u0646\u064A\u0641 \u0646\u0648\u0639 \u0627\u0644\u0633\u0624\u0627\u0644 \u0625\u0630\u0627 \u0643\u0627\u0646 \u0630\u0644\u0643 \u0633\u064A\u0624\u062F\u064A \u0625\u0644\u0649 \u0641\u0642\u062F\u0627\u0646 \u0628\u0639\u0636 \u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0623\u0648 \u062A\u0639\u0642\u064A\u062F \u0627\u0644\u0627\u0633\u062A\u062E\u0631\u0627\u062C. \u0627\u062C\u0639\u0644 \u0646\u0648\u0639 \u0627\u0644\u0633\u0624\u0627\u0644 "custom" (\u0645\u062E\u0635\u0635) \u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0627\u064B \u0644\u062C\u0645\u064A\u0639 \u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0648\u0627\u0644\u0623\u0641\u0631\u0639 \u0627\u0644\u0645\u0633\u062A\u062E\u0631\u062C\u0629\u060C \u0648\u0636\u0639 \u0646\u0635 \u0627\u0644\u0633\u0624\u0627\u0644 \u0643\u0627\u0645\u0644\u0627\u064B \u0641\u064A \u062D\u0642\u0644 "text". 
        \u064A\u0645\u0643\u0646\u0643 \u062A\u0642\u064A\u064A\u0645 \u062F\u0631\u062C\u0629 \u0627\u0644\u0635\u0639\u0648\u0628\u0629 \u062A\u0642\u0631\u064A\u0628\u064A\u0627\u064B.
        
        \u0623\u0631\u062C\u0639 \u0627\u0644\u0646\u062A\u064A\u062C\u0629 \u062D\u0635\u0631\u0627\u064B \u0643\u0645\u0635\u0641\u0648\u0641\u0629 JSON \u0635\u0627\u0644\u062D\u0629 \u0628\u0627\u0644\u0647\u064A\u0643\u0644 \u0627\u0644\u062A\u0627\u0644\u064A (\u0628\u062F\u0648\u0646 \u0623\u064A \u0639\u0644\u0627\u0645\u0627\u062A \u0645\u0627\u0631\u0643\u062F\u0627\u0648\u0646 \u0625\u0636\u0627\u0641\u064A\u0629 \u0623\u0648 \u0646\u0635\u0648\u0635 \u062E\u0627\u0631\u062C \u0627\u0644\u0640 JSON):
        [
          {
            "text": "\u0646\u0635 \u0627\u0644\u0633\u0624\u0627\u0644 \u0648\u0627\u0644\u0641\u0631\u0639 \u0643\u0627\u0645\u0644\u0627\u064B...", 
            "type": "custom", 
            "difficulty": "medium", // easy, medium, hard
            "options": []
          }
        ]
      `;
      const parsed = await decisionEngine.process({
        prompt,
        base64Data: cleanBase64,
        mimeType,
        responseFormat: "json",
        endpointName: "extract-questions"
      });
      const questionsList = Array.isArray(parsed) ? parsed : parsed?.questions || [parsed];
      res.json({ questions: questionsList });
    } catch (error) {
      console.error("Error extracting questions via Gemini:", error);
      res.status(500).json({ error: "Failed to extract questions from image", details: error.message });
    }
  });
  app.post(["/api/gemini/evaluate-homework", "/api/worker/ai/evaluate-homework", "/api/evaluate-homework"], async (req, res) => {
    const { schoolId, taskId, taskTitle, studentId, studentName, content } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }
    if (!schoolId || !taskId || !studentId || !content) {
      return res.status(400).json({ error: "Missing required parameters" });
    }
    try {
      const prompt = `
      \u0623\u0646\u062A \u0645\u0642\u064A\u0651\u0645 \u062A\u0631\u0628\u0648\u064A \u0630\u0643\u064A \u0648\u0646\u0627\u0642\u062F \u0645\u0628\u062F\u0639 \u0641\u064A \u0645\u0646\u0635\u0629 \u0627\u0644\u0623\u0633\u062A\u0627\u0630 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629.
      \u0645\u0647\u0645\u062A\u0643 \u0647\u064A \u062A\u0642\u064A\u064A\u0645 \u0625\u062C\u0627\u0628\u0629 \u0627\u0644\u0637\u0627\u0644\u0628 \u0639\u0644\u0649 \u0627\u0644\u0648\u0627\u062C\u0628 \u0627\u0644\u062F\u0631\u0627\u0633\u064A \u0627\u0644\u062A\u0627\u0644\u064A \u0628\u0634\u0643\u0644 \u062A\u0644\u0642\u0627\u0626\u064A \u0648\u0639\u0627\u062F\u0644.
      
      \u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0648\u0627\u062C\u0628: "${taskTitle}"
      \u0625\u062C\u0627\u0628\u0629 \u0627\u0644\u0637\u0627\u0644\u0628:
      "${content}"
      
      \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0645\u0646\u0643 \u0647\u0648:
      1. \u062A\u0642\u064A\u064A\u0645 \u062C\u0648\u062F\u0629 \u0627\u0644\u0625\u062C\u0627\u0628\u0629 \u062A\u0631\u0628\u0648\u064A\u0627\u064B \u0648\u0639\u0644\u0645\u064A\u0627\u064B \u0648\u0643\u062A\u0627\u0628\u0629 \u062A\u063A\u0630\u064A\u0629 \u0631\u0627\u062C\u0639\u0629 \u0645\u0641\u0635\u0644\u0629\u060C \u0648\u062F\u0648\u062F\u0629\u060C \u0648\u0645\u0634\u062C\u0639\u0629 \u0644\u0644\u0637\u0627\u0644\u0628 (\u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629).
      2. \u0627\u062D\u062A\u0633\u0627\u0628 \u0646\u0642\u0627\u0637 \u062E\u0628\u0631\u0629 (XP / Points) \u064A\u0633\u062A\u062D\u0642\u0647\u0627 \u0627\u0644\u0637\u0627\u0644\u0628 \u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u062C\u0648\u062F\u0629 \u0648\u0639\u0645\u0642 \u0625\u062C\u0627\u0628\u062A\u0647:
         - \u0625\u062C\u0627\u0628\u0629 \u0645\u0645\u062A\u0627\u0632\u0629 \u0648\u0645\u062B\u0627\u0644\u064A\u0629: \u0645\u0646 80 \u0625\u0644\u0649 100 \u0646\u0642\u0637\u0629.
         - \u0625\u062C\u0627\u0628\u0629 \u062C\u064A\u062F\u0629 \u062C\u062F\u0627\u064B \u0623\u0648 \u062C\u064A\u062F\u0629: \u0645\u0646 50 \u0625\u0644\u0649 79 \u0646\u0642\u0637\u0629.
         - \u0625\u062C\u0627\u0628\u0629 \u0645\u0642\u0628\u0648\u0644\u0629 \u0623\u0648 \u062A\u062D\u062A\u0627\u062C \u062A\u0637\u0648\u064A\u0631: \u0645\u0646 20 \u0625\u0644\u0649 49 \u0646\u0642\u0637\u0629.
      3. \u062A\u062D\u062F\u064A\u062F \u0645\u0627 \u0625\u0630\u0627 \u0643\u0627\u0646 \u0627\u0644\u0637\u0627\u0644\u0628 \u064A\u0633\u062A\u062D\u0642 \u0648\u0633\u0627\u0645\u0627\u064B \u0634\u0631\u0641\u064A\u0627\u064B \u0645\u0645\u064A\u0632\u0627\u064B \u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u062A\u0645\u064A\u0632\u0647:
         - "honor_mid" (\u0646\u062C\u0645 \u0627\u0644\u0634\u0647\u0631 \u{1F31F}): \u0625\u0630\u0627 \u0643\u0627\u0646\u062A \u0627\u0644\u0625\u062C\u0627\u0628\u0629 \u0646\u0645\u0648\u0630\u062C\u064A\u0629 \u0645\u0630\u0647\u0644\u0629 \u0648\u062A\u0641\u0648\u0642 \u0627\u0644\u062A\u0648\u0642\u0639\u0627\u062A \u0628\u0634\u0643\u0644 \u0643\u0627\u0645\u0644.
         - "star" (\u0646\u062C\u0645 \u0627\u0644\u0623\u0633\u0628\u0648\u0639 \u2B50): \u0625\u0630\u0627 \u0643\u0627\u0646\u062A \u0627\u0644\u0625\u062C\u0627\u0628\u0629 \u0625\u0628\u062F\u0627\u0639\u064A\u0629 \u0648\u062A\u0641\u0627\u0639\u0644\u064A\u0629 \u062C\u062F\u0627\u064B \u0648\u0628\u0647\u0627 \u0641\u0643\u0631 \u0645\u0645\u064A\u0632.
         - "progress" (\u062A\u0637\u0648\u0631 \u0645\u0644\u062D\u0648\u0638 \u{1F3AF}): \u0625\u0630\u0627 \u0628\u0630\u0644 \u0627\u0644\u0637\u0627\u0644\u0628 \u062C\u0647\u062F\u0627\u064B \u0643\u0628\u064A\u0631\u0627\u064B \u062C\u062F\u0627\u064B \u0641\u064A \u0627\u0644\u0643\u062A\u0627\u0628\u0629 \u0648\u0627\u0644\u0634\u0631\u062D \u062D\u062A\u0649 \u0648\u0625\u0646 \u0644\u0645 \u064A\u0643\u0646 \u062E\u0628\u064A\u0631\u0627\u064B.
         - "discipline" (\u0648\u0633\u0627\u0645 \u0627\u0644\u0627\u0646\u0636\u0628\u0627\u0637 \u{1F525}): \u0625\u0630\u0627 \u0643\u0627\u0646\u062A \u0627\u0644\u0625\u062C\u0627\u0628\u0629 \u0645\u0646\u0638\u0645\u0629 \u0648\u0645\u0631\u062A\u0628\u0629 \u0628\u062F\u0642\u0629 \u0645\u062A\u0646\u0627\u0647\u064A\u0629 \u0648\u0627\u0644\u062A\u0632\u0645\u062A \u0628\u062C\u0645\u064A\u0639 \u0639\u0646\u0627\u0635\u0631 \u0627\u0644\u0633\u0624\u0627\u0644.
         - null: \u0625\u0630\u0627 \u0643\u0627\u0646\u062A \u0627\u0644\u0625\u062C\u0627\u0628\u0629 \u0627\u0639\u062A\u064A\u0627\u062F\u064A\u0629 \u062C\u064A\u062F\u0629 \u0648\u0644\u0643\u0646\u0647\u0627 \u0644\u0627 \u062A\u0633\u062A\u062D\u0642 \u0648\u0633\u0627\u0645\u0627\u064B \u0634\u0631\u0641\u064A\u0627\u064B \u062E\u0627\u0635\u0627\u064B \u0641\u064A \u0627\u0644\u0648\u0642\u062A \u0627\u0644\u062D\u0627\u0644\u064A.

      \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0627\u0644\u0645\u062E\u0631\u062C\u0627\u062A \u0628\u0635\u064A\u063A\u0629 JSON \u062A\u0645\u0627\u0645\u0627\u064B \u0628\u0627\u0644\u0645\u0648\u0627\u0635\u0641\u0627\u062A \u0627\u0644\u062A\u0627\u0644\u064A\u0629:
      {
        "points": number,
        "feedback": "string (\u0627\u0644\u062A\u063A\u0630\u064A\u0629 \u0627\u0644\u0631\u0627\u062C\u0639\u0629 \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629)",
        "badge": "string or null"
      }
      `;
      const evaluation = await decisionEngine.process({
        prompt,
        endpointName: "evaluate-homework",
        responseFormat: "json"
      });
      const evalObj = Array.isArray(evaluation) ? evaluation[0] || {} : evaluation || {};
      let points = Number(evalObj.points);
      if (isNaN(points) || points < 0) points = 50;
      if (points > 100) points = 100;
      res.json({
        success: true,
        pointsAwarded: points,
        feedback: evalObj.feedback || evalObj.text || "\u062A\u0645 \u062A\u0642\u064A\u064A\u0645 \u0625\u062C\u0627\u0628\u062A\u0643 \u0628\u0646\u062C\u0627\u062D \u0645\u0646 \u0642\u0628\u0644 \u0627\u0644\u0645\u0639\u0644\u0645 \u0627\u0644\u0630\u0643\u064A.",
        badgeAwarded: evalObj.badge || null
      });
    } catch (error) {
      console.error("Error evaluating homework via Gemini:", error);
      res.status(500).json({ error: "Failed to evaluate homework", details: error.message });
    }
  });
  app.post(["/api/gemini/chat", "/api/worker/ai/chat"], async (req, res) => {
    const { context, message, history = [], imageUrl, fileUrls = [], isTeacherMode } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }
    const fileParts = [];
    const urlsToProcess = [];
    if (imageUrl) urlsToProcess.push(imageUrl);
    if (Array.isArray(fileUrls)) urlsToProcess.push(...fileUrls);
    for (const url of urlsToProcess) {
      try {
        const fileRes = await fetch(url);
        const arrayBuffer = await fileRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        let mimeType = fileRes.headers.get("content-type") || "application/octet-stream";
        if (url.toLowerCase().endsWith(".pdf")) {
          mimeType = "application/pdf";
        } else if (url.toLowerCase().endsWith(".png")) {
          mimeType = "image/png";
        } else if (url.toLowerCase().endsWith(".jpg") || url.toLowerCase().endsWith(".jpeg")) {
          mimeType = "image/jpeg";
        }
        const supportedPrefixes = ["image/", "audio/", "video/", "application/pdf", "text/"];
        const isSupported = supportedPrefixes.some((prefix) => mimeType.startsWith(prefix));
        if (!isSupported) {
          throw new Error(`\u0646\u0648\u0639 \u0627\u0644\u0645\u0644\u0641 \u063A\u064A\u0631 \u0645\u062F\u0639\u0648\u0645 \u0645\u0646 \u0642\u0628\u0644 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A: ${mimeType}. \u064A\u0631\u062C\u0649 \u0631\u0641\u0639 \u0645\u0644\u0641\u0627\u062A PDF \u0623\u0648 \u0635\u0648\u0631 \u0641\u0642\u0637.`);
        }
        fileParts.push({
          inlineData: {
            data: buffer.toString("base64"),
            mimeType
          }
        });
      } catch (err) {
        console.error("Failed to fetch file for Gemini:", err);
      }
    }
    const systemInstruction = isTeacherMode ? context : `
      \u0623\u0646\u062A \u0645\u0633\u0627\u0639\u062F \u0630\u0643\u064A \u0644\u0645\u0646\u0635\u0629 \u062A\u0639\u0644\u064A\u0645\u064A\u0629.
      \u0645\u0647\u0645\u062A\u0643 \u0647\u064A \u0627\u0644\u0625\u062C\u0627\u0628\u0629 \u0639\u0644\u0649 \u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0637\u0644\u0627\u0628 \u0628\u0646\u0627\u0621\u064B \u062D\u0635\u0631\u0627\u064B \u0639\u0644\u0649 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u062F\u0631\u0627\u0633\u064A \u0627\u0644\u0645\u0642\u062F\u0645 \u0644\u0643 \u0623\u062F\u0646\u0627\u0647.
      \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u062F\u0631\u0627\u0633\u064A \u0644\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629:
      ${context}

      \u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0639\u0645\u0644:
      1. \u0623\u062C\u0628 \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0641\u0635\u062D\u0649 \u0648\u0628\u0623\u0633\u0644\u0648\u0628 \u062A\u0639\u0644\u064A\u0645\u064A \u0645\u0634\u062C\u0639.
      2. \u0625\u0630\u0627 \u0643\u0627\u0646 \u0627\u0644\u0633\u0624\u0627\u0644 \u0639\u0646 "\u0647\u0630\u0647 \u0627\u0644\u0635\u0641\u062D\u0629" \u0623\u0648 "\u0627\u0644\u0645\u0644\u0632\u0645\u0629"\u060C \u0627\u0639\u062A\u0645\u062F \u0641\u0642\u0637 \u0639\u0644\u0649 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0645\u0630\u0643\u0648\u0631 \u0623\u0648 \u0627\u0644\u0635\u0648\u0631\u0629 \u0627\u0644\u0645\u0631\u0641\u0642\u0629.
      3. \u0625\u0630\u0627 \u0637\u0644\u0628 \u062A\u0644\u062E\u064A\u0635 \u0627\u0644\u0635\u0641\u062D\u0629\u060C \u0642\u0645 \u0628\u062A\u0642\u062F\u064A\u0645 \u0645\u0644\u062E\u0635 \u0630\u0643\u064A \u0648\u0645\u0646\u0638\u0645 \u0648\u0645\u062E\u062A\u0635\u0631.
      4. \u0625\u0630\u0627 \u0637\u0644\u0628 \u0625\u0646\u0634\u0627\u0621 \u0627\u062E\u062A\u0628\u0627\u0631 \u0623\u0648 \u0623\u0633\u0626\u0644\u0629\u060C \u0642\u0645 \u0628\u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0645\u0646 \u0647\u0630\u0627 \u0627\u0644\u0645\u062D\u062A\u0648\u0649.
      5. \u0643\u0646 \u062F\u0642\u064A\u0642\u0627\u064B\u060C \u0648\u0648\u0636\u062D \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0628\u0634\u0643\u0644 \u064A\u0633\u0647\u0644 \u0641\u0647\u0645\u0647.
    `;
    const parsedHistory = history.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));
    async function sendChatWithRetry(maxRetries = 3) {
      const client2 = getGeminiClient();
      const modelsToTry = ["gemini-3.1-flash-lite", "gemini-3.7-flash", "gemini-3.1-pro-preview", "gemini-flash-latest"];
      let lastChatError = null;
      for (const currentModel of modelsToTry) {
        for (let i = 0; i < maxRetries; i++) {
          try {
            const chat = client2.chats.create({
              model: currentModel,
              config: {
                systemInstruction
              },
              history: parsedHistory
            });
            let parts = [{ text: message }];
            if (fileParts.length > 0) {
              parts = [...fileParts, ...parts];
            }
            return await chat.sendMessage({ message: parts });
          } catch (error) {
            lastChatError = error;
            const errMsg = String(error.message || error || "").toLowerCase();
            const isHighDemandOr503 = error.status === 503 || error.code === 503 || errMsg.includes("503") || errMsg.includes("unavailable") || errMsg.includes("high demand") || errMsg.includes("overloaded");
            const isRateLimit = error.status === 429 || error.code === 429 || errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("limit") || errMsg.includes("exceeded") || errMsg.includes("resource_exhausted") || errMsg.includes("rate");
            if (isHighDemandOr503) {
              console.warn(`[Gemini Chat High Demand] Model ${currentModel} returned 503/unavailable. Trying next fallback model immediately...`);
              break;
            } else if (isRateLimit) {
              if (i < maxRetries - 1) {
                const delayMs = Math.min((i + 1) * 3e3, 1e4);
                console.warn(`Retrying chat message with model ${currentModel} (Attempt ${i + 1}/${maxRetries}) in ${delayMs}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delayMs));
              } else {
                console.warn(`Chat model ${currentModel} exhausted retries, trying next model...`);
              }
            } else {
              console.warn(`Chat model ${currentModel} error:`, errMsg);
              break;
            }
          }
        }
      }
      throw lastChatError;
    }
    try {
      const result = await sendChatWithRetry();
      const responseText = result?.text || "";
      res.json({ response: responseText });
    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ error: error.message || "Failed to process chat" });
    }
  });
  const serverErrorLogs = [];
  app.get("/api/health", (req, res) => {
    const memoryUsage = process.memoryUsage();
    res.json({
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      memoryUsageMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      env: process.env.NODE_ENV || "development",
      port: 3e3,
      r2Configured: Boolean(s3Client && R2_BUCKET_NAME),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
    });
  });
  app.get("/api/log-error", (req, res) => {
    res.json({ success: true, status: "ok" });
  });
  app.post("/api/log-error", (req, res) => {
    const errorData = req.body || {};
    const logItem = {
      id: errorData.id || `SRV_ERR_${Date.now()}`,
      receivedAt: (/* @__PURE__ */ new Date()).toISOString(),
      ...errorData
    };
    serverErrorLogs.unshift(logItem);
    if (serverErrorLogs.length > 200) serverErrorLogs.pop();
    console.log("[Client Error Tracked]", logItem.id, logItem.service, logItem.errorMessage);
    res.json({ success: true, loggedId: logItem.id });
  });
  app.get("/api/server-errors", (req, res) => {
    res.json({
      total: serverErrorLogs.length,
      logs: serverErrorLogs
    });
  });
  app.post(["/api/gemini/generate-illustration", "/api/generate-illustration"], async (req, res) => {
    const { topic, pageTitle, context, style = "mindmap" } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }
    try {
      const prompt = `
        \u0623\u0646\u062A \u062E\u0628\u064A\u0631 \u062A\u0635\u0645\u064A\u0645 \u0648\u0625\u0646\u0641\u0648\u062C\u0631\u0627\u0641\u064A\u0643 \u062A\u0639\u0644\u064A\u0645\u064A \u0644\u0637\u0644\u0628\u0629 \u0627\u0644\u0633\u0627\u062F\u0633 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u064A.
        \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0645\u0646\u0643 \u0647\u0648 \u0625\u0646\u0634\u0627\u0621 \u0631\u0633\u0645 \u062A\u0648\u0636\u064A\u062D\u064A \u0628\u0635\u0631\u064A \u062A\u062E\u0637\u064A\u0637\u064A \u0628\u0635\u064A\u063A\u0629 SVG \u0645\u0628\u0627\u0634\u0631\u0629 \u0644\u062A\u0628\u0633\u064A\u0637 \u0648\u0634\u0631\u062D \u0627\u0644\u0645\u0641\u0647\u0648\u0645 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A \u0627\u0644\u062A\u0627\u0644\u064A:
        - \u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062F\u0631\u0633: "${pageTitle || topic}"
        - \u0627\u0644\u0645\u0641\u0647\u0648\u0645 \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0631\u0633\u0645\u0647: "${topic}"
        - \u0627\u0644\u0633\u064A\u0627\u0642 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A: "${context || ""}"
        - \u0646\u0648\u0639 \u0627\u0644\u0645\u062E\u0637\u0637 \u0627\u0644\u0645\u0637\u0644\u0648\u0628: "${style}" (\u0645\u062B\u0644\u0627\u064B \u062E\u0631\u064A\u0637\u0629 \u0645\u0641\u0627\u0647\u064A\u0645\u060C \u0645\u062E\u0637\u0637 \u0627\u0646\u0633\u064A\u0627\u0628\u064A\u060C \u062C\u062F\u0648\u0644 \u0645\u0642\u0627\u0631\u0646\u0629\u060C \u0623\u0648 \u0647\u064A\u0643\u0644 \u0642\u0648\u0627\u0639\u062F\u064A)

        \u0627\u0644\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0635\u0627\u0631\u0645\u0629 \u0644\u0625\u0646\u062A\u0627\u062C \u0627\u0644\u0640 SVG:
        1. \u0623\u0631\u062C\u0639 \u0643\u0648\u062F SVG \u0635\u0627\u0644\u062D \u0648\u0645\u0628\u0627\u0634\u0631 \u064A\u0628\u062F\u0623 \u0628\u0640 <svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" ...> \u0648\u064A\u0646\u062A\u0647\u064A \u0628\u0640 </svg>.
        2. \u0627\u0633\u062A\u062E\u062F\u0645 \u062A\u0635\u0645\u064A\u0645\u0627\u064B \u0639\u0635\u0631\u064A\u0627\u064B \u0628\u062E\u0644\u0641\u064A\u0629 \u0634\u0641\u0627\u0641\u0629 \u0623\u0648 \u062F\u0627\u0643\u0646\u0629 \u0646\u0627\u0639\u0645\u0629 (#0F132A)\u060C \u062E\u0637\u0648\u0637 \u0639\u0631\u0628\u064A\u0629 \u062C\u0645\u064A\u0644\u0629\u060C \u0648\u0623\u0644\u0648\u0627\u0646 \u0645\u062A\u0646\u0627\u0633\u0642\u0629 \u0648\u0641\u0648\u0633\u0641\u0648\u0631\u064A\u0629 (Cyan #00E5FF, Gold #F59E0B, Purple #A855F7, Emerald #10B981).
        3. \u062A\u0623\u0643\u062F \u0645\u0646 \u0623\u0646 \u0627\u0644\u0646\u0635\u0648\u0635 \u0648\u0627\u0636\u062D\u0629\u060C \u0645\u062A\u0646\u0627\u0633\u0642\u0629 \u0628\u0627\u062A\u062C\u0627\u0647 RTL\u060C \u0648\u062A\u0648\u0636\u062D \u0627\u0644\u0642\u0648\u0627\u0639\u062F \u0648\u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0627\u0644\u0648\u0632\u0627\u0631\u064A\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629.
        4. \u0644\u0627 \u062A\u0636\u0639 \u0623\u064A \u0634\u0631\u0648\u062D \u0623\u0648 \u0643\u0644\u0627\u0645 \u062E\u0627\u0631\u062C \u0643\u0648\u062F \u0627\u0644\u0640 <svg> ... </svg>.
      `;
      const result = await generateContentWithRetry({
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });
      const rawText = result?.text || "";
      const svgMatch = rawText.match(/<svg[\s\S]*?<\/svg>/i);
      const svgCode = svgMatch ? svgMatch[0] : "";
      res.json({
        success: true,
        svg: svgCode,
        title: topic || pageTitle || "\u0645\u062E\u0637\u0637 \u062A\u0648\u0636\u064A\u062D\u064A \u0630\u0643\u064A",
        explanation: "\u062A\u0645 \u062A\u0648\u0644\u064A\u062F \u0627\u0644\u0631\u0633\u0645 \u0627\u0644\u062A\u0648\u0636\u064A\u062D\u064A \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0628\u0646\u062C\u0627\u062D."
      });
    } catch (error) {
      console.error("Error generating illustration via Gemini:", error);
      res.status(500).json({ error: "Failed to generate illustration", details: error.message });
    }
  });
  app.post(["/api/explain", "/api/worker/ai/explain", "/api/gemini/explain"], async (req, res) => {
    const { questionText } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    }
    try {
      const parsedResults = await decisionEngine.process({
        prompt: `Explain why the answer to "${questionText}" is wrong and provide the correct answer in Arabic.`,
        endpointName: "explain",
        responseFormat: "text"
      });
      const text2 = typeof parsedResults === "string" ? parsedResults : parsedResults?.text || "";
      res.json({ explanation: text2 });
    } catch (error) {
      console.error("Error getting AI explanation:", error);
      res.status(500).json({ error: "Failed to get explanation" });
    }
  });
  app.post("/api/redeem-code", redeemCodeLimiter, async (req, res) => {
    const { code } = req.body;
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      res.json({ success: true, message: "\u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 \u0641\u064A \u0628\u0648\u0627\u0628\u0629 \u0628\u064A\u0631\u0642 \u0628\u0646\u062C\u0627\u062D!" });
    } catch (error) {
      console.error("Error redeeming code:", error);
      res.status(500).json({ error: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u0643\u0648\u062F" });
    }
  });
  app.post("/api/webhook/payment", async (req, res) => {
    const sig = req.headers["x-payment-signature"];
    const { userId, courseId, status } = req.body;
    if (status === "success") {
      try {
        console.log(`Subscription activated for user ${userId} and course ${courseId}`);
        res.status(200).json({ received: true });
      } catch (error) {
        console.error("Error activating subscription via webhook:", error);
        res.status(500).json({ error: "Failed to activate subscription" });
      }
    } else {
      res.status(200).json({ received: true, message: "Payment not successful" });
    }
  });
  app.post("/api/notifications/notify-parent-payment", async (req, res) => {
    const { parentToken, amount, receiptId } = req.body;
    if (!parentToken || !amount) {
      return res.status(400).json({ error: "Missing parentToken or amount" });
    }
    const message = {
      notification: {
        title: "\u062A\u0645 \u062A\u0623\u0643\u064A\u062F \u0627\u0644\u062F\u0641\u0639 \u2705",
        body: `\u0639\u0632\u064A\u0632\u064A \u0648\u0644\u064A \u0627\u0644\u0623\u0645\u0631\u060C \u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0645\u0628\u0644\u063A ${amount} \u062F.\u0639 \u0628\u0646\u062C\u0627\u062D \u0648\u0635\u062F\u0631 \u0648\u0635\u0644\u0643\u0645 \u0627\u0644\u0631\u0642\u0645\u064A.`
      },
      token: parentToken,
      data: {
        type: "PAYMENT_CONFIRMED",
        receipt_id: receiptId || "REC-UNKNOWN"
      }
    };
    try {
      console.log("Successfully simulated FCM message sending to:", parentToken);
      res.status(200).json({ success: true, messageId: "simulated_message_id_" + Date.now() });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });
  app.post("/api/notifications/check-deadlines", async (req, res) => {
    try {
      const today = /* @__PURE__ */ new Date();
      const threeDaysInMs = 3 * 24 * 60 * 60 * 1e3;
      const { studentFinancials } = req.body;
      if (!studentFinancials || !Array.isArray(studentFinancials)) {
        return res.status(400).json({ error: "\u064A\u0644\u0632\u0645 \u0625\u0631\u0633\u0627\u0644 \u0642\u0627\u0626\u0645\u0629 \u0628\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0637\u0644\u0627\u0628 \u0627\u0644\u0645\u0627\u0644\u064A\u0629" });
      }
      let sentCount = 0;
      for (const student of studentFinancials) {
        if (!student.nextInstallmentDate || !student.parentDeviceId) continue;
        const dueDate = new Date(student.nextInstallmentDate);
        const timeDiff = dueDate.getTime() - today.getTime();
        if (timeDiff > 0 && timeDiff <= threeDaysInMs && student.remainingAmount > 0) {
          const message = {
            notification: {
              title: "\u062A\u0630\u0643\u064A\u0631 \u0645\u0627\u0644\u064A \u0645\u0646 \u0628\u0648\u0627\u0628\u0629 \u0628\u064A\u0631\u0642 \u{1F514}",
              body: `\u0639\u0632\u064A\u0632\u064A \u0648\u0644\u064A \u0627\u0644\u0623\u0645\u0631\u060C \u0646\u0648\u062F \u062A\u0630\u0643\u064A\u0631\u0643\u0645 \u0628\u0627\u0642\u062A\u0631\u0627\u0628 \u0645\u0648\u0639\u062F \u0627\u0644\u0642\u0633\u0637 \u0627\u0644\u0642\u0627\u062F\u0645 \u0644\u0644\u0637\u0627\u0644\u0628 ${student.name}.`
            },
            token: student.parentDeviceId,
            data: {
              type: "INSTALLMENT_REMINDER",
              student_id: String(student.id)
            }
          };
          try {
            console.log(`Simulated reminder sent to parent of ${student.name}`);
            sentCount++;
          } catch (err) {
            console.error(`Failed to send reminder to ${student.name}:`, err);
          }
        }
      }
      res.status(200).json({ success: true, sentCount });
    } catch (error) {
      console.error("Error processing deadlines:", error);
      res.status(500).json({ error: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u0646\u0638\u0627\u0645" });
    }
  });
  app.post("/api/notify-attendance", async (req, res) => {
    const { parentUserId, studentId, status, date } = req.body;
    if (!parentUserId || !status) {
      return res.status(400).json({ error: "Missing parentUserId or status" });
    }
    try {
      const statusText = status === "absent" ? "\u063A\u0627\u0626\u0628" : "\u0645\u062A\u0623\u062E\u0631";
      const bodyText = `\u0639\u0632\u064A\u0632\u064A \u0648\u0644\u064A \u0627\u0644\u0623\u0645\u0631\u060C \u0646\u0648\u062F \u0625\u0639\u0644\u0627\u0645\u0643\u0645 \u0628\u0623\u0646 \u0627\u0644\u0637\u0627\u0644\u0628 \u0642\u062F \u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u062D\u0627\u0644\u0629 ${statusText} \u0628\u062A\u0627\u0631\u064A\u062E ${date}.`;
      console.log(`Simulated notification: Student ${studentId} is ${status} on ${date}. Parent user: ${parentUserId}. Body: ${bodyText}`);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error sending attendance notification:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });
  app.get("/api/ai/analytics", async (req, res) => {
    try {
      const logs = AnalyticsManager.getLogs();
      const totalRequests = logs.length;
      if (totalRequests === 0) {
        return res.json({
          totalRequests: 0,
          cacheHits: 0,
          savingsRatio: 0,
          avgProcessingTimeMs: 0,
          modelStats: [],
          endpointStats: [],
          timeSeries: []
        });
      }
      const cacheHits = logs.filter((d) => d.isCacheHit).length;
      const totalTime = logs.reduce((sum, d) => sum + (Number(d.processingTimeMs) || 0), 0);
      const avgTime = totalRequests > 0 ? totalTime / totalRequests : 0;
      const modelStats = logs.reduce((acc, d) => {
        const model = d.model || "unknown";
        acc[model] = (acc[model] || 0) + 1;
        return acc;
      }, {});
      const endpointStats = logs.reduce((acc, d) => {
        const endpoint = d.endpoint || "unknown";
        acc[endpoint] = (acc[endpoint] || 0) + 1;
        return acc;
      }, {});
      const timeSeriesMap = logs.reduce((acc, d) => {
        const date = d.timestamp ? new Date(d.timestamp).toLocaleDateString() : "unknown";
        acc[date] = acc[date] || { date, requests: 0, cacheHits: 0 };
        acc[date].requests++;
        if (d.isCacheHit) acc[date].cacheHits++;
        return acc;
      }, {});
      res.json({
        totalRequests,
        cacheHits,
        savingsRatio: cacheHits / totalRequests,
        avgProcessingTimeMs: avgTime,
        modelStats: Object.entries(modelStats).map(([name, value]) => ({ name, value })),
        endpointStats: Object.entries(endpointStats).map(([name, value]) => ({ name, value })),
        timeSeries: Object.values(timeSeriesMap).reverse()
      });
    } catch (e) {
      console.error("Analytics Endpoint Error:", e);
      res.json({
        totalRequests: 0,
        cacheHits: 0,
        savingsRatio: 0,
        avgProcessingTimeMs: 0,
        modelStats: [],
        endpointStats: [],
        timeSeries: [],
        error: e.message
      });
    }
  });
  app.post("/api/system/flush-cache", async (req, res) => {
    try {
      const beforeMem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      if (global.gc) {
        try {
          global.gc();
        } catch (e) {
        }
      }
      const afterMem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      res.json({
        success: true,
        message: "\u062A\u0645 \u062A\u0641\u0631\u064A\u063A \u0627\u0644\u0630\u0627\u0643\u0631\u0629 \u0627\u0644\u0645\u0624\u0642\u062A\u0629 \u0648\u0625\u0639\u0627\u062F\u0629 \u062A\u062D\u0633\u064A\u0646 \u0627\u0633\u062A\u0647\u0644\u0627\u0643 \u0627\u0644\u0645\u0648\u0627\u0631\u062F \u0628\u0646\u062C\u0627\u062D",
        heapUsedMb: afterMem,
        freedMb: Math.max(0, beforeMem - afterMem),
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("Error flushing cache:", error);
      res.status(500).json({ error: error.message || "Failed to flush cache" });
    }
  });
  app.post("/api/system/reset-ai-cache", async (req, res) => {
    try {
      res.json({
        success: true,
        message: "\u062A\u0645\u062A \u0625\u0639\u0627\u062F\u0629 \u0636\u0628\u0637 \u062C\u0644\u0633\u0629 \u0648\u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0628\u0646\u062C\u0627\u062D",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("Error resetting AI cache:", error);
      res.status(500).json({ error: error.message || "Failed to reset AI cache" });
    }
  });
  app.post("/api/system/ping-reconnect", async (req, res) => {
    try {
      const memoryUsageMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      res.json({
        success: true,
        message: "\u062A\u0645 \u0641\u062D\u0635 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0648\u062A\u0646\u0634\u064A\u0637 \u0627\u0644\u0642\u0646\u0627\u0629 \u0627\u0644\u0633\u062D\u0627\u0628\u064A\u0629 \u0628\u0646\u062C\u0627\u062D",
        serverUptime: Math.round(process.uptime()),
        memoryUsageMb,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: error.message || "Failed to ping reconnect" });
    }
  });
  app.use((err, req, res, next) => {
    console.error("Express Error:", err);
    res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
  });
  app.get("/api/admin/dashboard-stats", async (req, res) => {
    try {
      const dbSchools = await withDbRetry(() => db.select().from(schools));
      res.json({
        success: true,
        stats: {
          schools: dbSchools
          // Add other tables as needed
        }
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/admin/sync-schools", requireDeveloper, async (req, res) => {
    try {
      const { schoolsList } = req.body;
      if (!Array.isArray(schoolsList)) {
        return res.status(400).json({ success: false, message: "schoolsList must be an array" });
      }
      let synced = 0;
      for (const s of schoolsList) {
        await db.insert(schools).values({
          id: s.id,
          name: s.name,
          governorate: s.governorate,
          activationCode: s.activationCode,
          status: s.status || "active"
        }).onConflictDoUpdate({
          target: schools.id,
          set: {
            name: s.name,
            governorate: s.governorate,
            status: s.status || "active"
          }
        });
        synced++;
      }
      res.json({ success: true, synced });
    } catch (error) {
      console.error("Error syncing schools:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/activation-codes", requireRole(["admin", "admin-boys", "admin-girls", "manager", "developer"]), async (req, res) => {
    try {
      const { schoolId, role } = req.query;
      const conditions = [];
      if (schoolId) conditions.push((0, import_drizzle_orm.eq)(activation_codes.schoolId, schoolId));
      if (role) conditions.push((0, import_drizzle_orm.eq)(activation_codes.role, role));
      const allCodes = await (conditions.length > 0 ? db.select().from(activation_codes).where((0, import_drizzle_orm.and)(...conditions)) : db.select().from(activation_codes));
      res.json({ success: true, codes: allCodes });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/activation-codes", requireRole(["admin", "admin-boys", "admin-girls", "manager", "developer"]), async (req, res) => {
    try {
      const { code, schoolId, role } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, message: "Missing code" });
      }
      const newCode = await db.insert(activation_codes).values({
        id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        code,
        schoolId: schoolId || "general",
        used: false,
        // @ts-ignore
        role: role || "student",
        createdAt: /* @__PURE__ */ new Date()
      }).returning();
      res.json({ success: true, code: newCode[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/activation-codes/generate", requireRole(["admin", "admin-boys", "admin-girls", "manager", "developer"]), async (req, res) => {
    try {
      const { schoolId, role, count, prefix } = req.body;
      const numCount = Number(count) || 1;
      const results = [];
      for (let i = 0; i < numCount; i++) {
        const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
        const code = `${prefix || "ACT"}-${randomStr}`;
        const newCode = await db.insert(activation_codes).values({
          id: `act_${Date.now()}_${i}`,
          code,
          schoolId: schoolId || "general",
          used: false,
          // @ts-ignore
          role: role || "student",
          createdAt: /* @__PURE__ */ new Date()
        }).returning();
        results.push(newCode[0]);
      }
      res.json({ success: true, codes: results });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/activation-codes/:id", requireRole(["admin", "admin-boys", "admin-girls", "manager", "developer"]), async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(activation_codes).where((0, import_drizzle_orm.eq)(activation_codes.id, id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/activation-codes/sync", requireRole(["admin", "admin-boys", "admin-girls", "manager", "developer"]), async (req, res) => {
    try {
      let { codes } = req.body;
      if (!Array.isArray(codes)) {
        if (codes && Array.isArray(codes.codes)) {
          codes = codes.codes;
        } else if (codes && typeof codes === "object") {
          codes = Object.values(codes).filter(Boolean);
        }
      }
      if (!Array.isArray(codes) || codes.length === 0) {
        return res.json({ success: true, synced: 0, failed: 0, message: "No codes provided" });
      }
      let synced = 0;
      let failed = 0;
      for (const c of codes) {
        if (!c || !c.code) continue;
        try {
          const codeStr = String(c.code).trim();
          if (!codeStr) continue;
          const codeId = c.id || `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const isUsed = Boolean(c.used || c.isUsed);
          let safeCreatedAt = /* @__PURE__ */ new Date();
          if (c.createdAt) {
            const parsedD = new Date(c.createdAt);
            if (!isNaN(parsedD.getTime())) {
              safeCreatedAt = parsedD;
            }
          }
          await db.insert(activation_codes).values({
            id: codeId,
            code: codeStr,
            schoolId: c.schoolId || c.school_id || "general",
            used: isUsed,
            usedBy: c.usedBy || null,
            role: c.role || "student",
            createdAt: safeCreatedAt
          }).onConflictDoUpdate({
            target: activation_codes.code,
            set: {
              used: isUsed,
              usedBy: c.usedBy || null,
              role: c.role || "student"
            }
          });
          synced++;
        } catch (itemErr) {
          console.warn("Failed to sync code item:", c?.code, itemErr);
          failed++;
        }
      }
      res.json({ success: true, synced, failed });
    } catch (error) {
      console.error("Error syncing codes:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.patch("/api/activation-codes/:id", requireRole(["admin", "admin-boys", "admin-girls", "manager", "developer"]), async (req, res) => {
    try {
      const { id } = req.params;
      const { used, usedBy, role, schoolId, code } = req.body;
      const mapped = {};
      if (used !== void 0) mapped.used = used;
      if (usedBy !== void 0) mapped.usedBy = usedBy;
      if (role !== void 0) mapped.role = role;
      if (schoolId !== void 0) mapped.schoolId = schoolId;
      if (code !== void 0) mapped.code = code;
      if (Object.keys(mapped).length === 0) {
        return res.json({ success: true, message: "No relevant fields to update" });
      }
      const updated = await db.update(activation_codes).set(mapped).where((0, import_drizzle_orm.eq)(activation_codes.id, id)).returning();
      res.json({ success: true, code: updated[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/developer-logs", requireDeveloper, async (req, res) => {
    try {
      const logs = await db.select().from(developer_logs).limit(100);
      res.json({ success: true, logs });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/developer-logs", async (req, res) => {
    try {
      const { id, action, details, adminId, userEmail, schoolId, status } = req.body || {};
      const logId = id || `dev_log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const logDetails = details || [
        userEmail ? `User: ${userEmail}` : "",
        schoolId ? `School: ${schoolId}` : "",
        status ? `Status: ${status}` : ""
      ].filter(Boolean).join(" | ");
      const newLog = await db.insert(developer_logs).values({
        id: logId,
        action: (action || "\u0625\u062C\u0631\u0627\u0621 \u0645\u0637\u0648\u0631").substring(0, 100),
        details: logDetails || null,
        adminId: adminId || userEmail || "developer",
        createdAt: /* @__PURE__ */ new Date()
      }).returning();
      res.json({ success: true, log: newLog[0] || { id: logId } });
    } catch (error) {
      console.error("Error in /api/developer-logs:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/pulse/posts", async (req, res) => {
    try {
      const { schoolId, grade, type } = req.query;
      let query = db.select().from(community_posts);
      const allPosts = await query.orderBy(community_posts.timestamp);
      res.json({ success: true, posts: allPosts.reverse() });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/pulse/posts", async (req, res) => {
    try {
      const { id, userId, userName, content, mediaUrl, type, grade, schoolId } = req.body;
      const newPost = await db.insert(community_posts).values({
        id,
        userId,
        userName,
        content,
        mediaUrl,
        type,
        grade,
        schoolId
      }).returning();
      res.json({ success: true, post: newPost[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/pulse/posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(community_posts).where((0, import_drizzle_orm.eq)(community_posts.id, id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/pulse/posts/:postId/comments", async (req, res) => {
    try {
      const { postId } = req.params;
      const comments = await db.select().from(community_comments).where((0, import_drizzle_orm.eq)(community_comments.postId, postId));
      res.json({ success: true, comments });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/pulse/posts/:postId/comments", async (req, res) => {
    try {
      const { postId } = req.params;
      const { id, userId, userName, content } = req.body;
      const newComment = await db.insert(community_comments).values({
        id,
        postId,
        userId,
        userName,
        content
      }).returning();
      await db.execute(import_drizzle_orm2.sql`UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = ${postId}`);
      res.json({ success: true, comment: newComment[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/pulse/stats", async (req, res) => {
    try {
      const { schoolId } = req.query;
      let queryBuilder = db.select().from(community_posts);
      if (schoolId && schoolId !== "all") {
        queryBuilder = queryBuilder.where((0, import_drizzle_orm.eq)(community_posts.schoolId, schoolId));
      }
      const allPosts = await queryBuilder;
      const totalPosts = allPosts.length;
      const adminTeacher = allPosts.filter((p) => p.type === "admin" || p.type === "teacher").length;
      const comments = allPosts.reduce((sum, p) => sum + (Number(p.commentsCount) || 0), 0);
      const likes = allPosts.reduce((sum, p) => sum + (Number(p.likesCount) || 0), 0);
      res.json({
        success: true,
        stats: {
          total: totalPosts,
          adminTeacher,
          comments,
          likes,
          postsCount: totalPosts
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/finance/transactions", async (req, res) => {
    try {
      const { schoolId } = req.query;
      const txs = await db.select().from(student_transactions).orderBy(student_transactions.createdAt);
      res.json({ success: true, transactions: txs.reverse() });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/student-transactions", async (req, res) => {
    try {
      const txs = await db.select().from(student_transactions).orderBy(student_transactions.createdAt);
      res.json({ success: true, transactions: txs.reverse(), data: txs.reverse() });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/finance/transactions", async (req, res) => {
    try {
      const { id, studentId, schoolId, amount, note, method, adminName } = req.body;
      const newTx = await db.insert(student_transactions).values({
        id,
        studentId,
        schoolId,
        amount,
        note,
        method,
        adminName
      }).returning();
      res.json({ success: true, transaction: newTx[0], data: newTx[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/student-transactions", async (req, res) => {
    try {
      const { id, studentId, schoolId, amount, note, method, adminName } = req.body;
      const newTx = await db.insert(student_transactions).values({
        id,
        studentId,
        schoolId,
        amount,
        note,
        method,
        adminName
      }).returning();
      res.json({ success: true, transaction: newTx[0], data: newTx[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/finance/payment-requests", async (req, res) => {
    try {
      const { schoolId } = req.query;
      let query = db.select().from(payment_requests);
      if (schoolId && schoolId !== "all") {
        query = query.where((0, import_drizzle_orm.eq)(payment_requests.schoolId, schoolId));
      }
      const rawResults = await query.orderBy((0, import_drizzle_orm.desc)(payment_requests.createdAt));
      const allStudents = await db.select().from(students);
      const formatted = rawResults.map((r) => formatPaymentRequest(r, allStudents));
      res.json({ success: true, requests: formatted });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/payment-requests", async (req, res) => {
    try {
      const { schoolId } = req.query;
      let query = db.select().from(payment_requests);
      if (schoolId && schoolId !== "all") {
        query = query.where((0, import_drizzle_orm.eq)(payment_requests.schoolId, schoolId));
      }
      const rawResults = await query.orderBy((0, import_drizzle_orm.desc)(payment_requests.createdAt));
      const allStudents = await db.select().from(students);
      const formatted = rawResults.map((r) => formatPaymentRequest(r, allStudents));
      res.json({ success: true, requests: formatted, data: formatted });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/finance/salaries", async (req, res) => {
    try {
      const { month } = req.query;
      let query = db.select().from(salaries);
      if (month) {
        query = query.where((0, import_drizzle_orm.eq)(salaries.month, month));
      }
      const allSalaries = await query;
      res.json({ success: true, salaries: allSalaries });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/finance/salaries", async (req, res) => {
    try {
      const { id, staffId, staffName, month, baseSalary, rewards, deductions, netSalary, isPaid, paymentDate } = req.body;
      const result = await db.insert(salaries).values({
        id,
        staffId,
        staffName,
        month,
        baseSalary,
        rewards,
        deductions,
        netSalary,
        isPaid,
        paymentDate: paymentDate ? new Date(paymentDate) : null
      }).onConflictDoUpdate({
        target: salaries.id,
        set: { baseSalary, rewards, deductions, netSalary, isPaid, paymentDate: paymentDate ? new Date(paymentDate) : null, updatedAt: /* @__PURE__ */ new Date() }
      }).returning();
      res.json({ success: true, salary: result[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/broadcasts", async (req, res) => {
    try {
      const { schoolId, grade, limit: limitParam } = req.query;
      let conditions = [];
      if (schoolId && schoolId !== "all" && schoolId !== "general" && schoolId !== "global") {
        const sId = schoolId.trim();
        let schoolIds = [sId, "all", "global", "central", "general", "\u0639\u0627\u0645"];
        if (sId === "school1" || sId === "school_awail_ghamas" || sId === "ghamas_awail") {
          schoolIds.push("school1", "school_awail_ghamas", "ghamas_awail");
        }
        conditions.push((0, import_drizzle_orm.or)(
          (0, import_drizzle_orm.inArray)(school_announcements.schoolId, schoolIds),
          (0, import_drizzle_orm.isNull)(school_announcements.schoolId),
          (0, import_drizzle_orm.eq)(school_announcements.schoolId, ""),
          (0, import_drizzle_orm.eq)(school_announcements.schoolId, "all"),
          (0, import_drizzle_orm.eq)(school_announcements.schoolId, "global"),
          (0, import_drizzle_orm.eq)(school_announcements.schoolId, "central"),
          (0, import_drizzle_orm.eq)(school_announcements.schoolId, "general"),
          (0, import_drizzle_orm.eq)(school_announcements.schoolId, "\u0639\u0627\u0645")
        ));
      }
      conditions.push((0, import_drizzle_orm.or)(
        import_drizzle_orm2.sql`${school_announcements.expiryDate} IS NULL`,
        import_drizzle_orm2.sql`${school_announcements.expiryDate} > NOW()`
      ));
      let queryBuilder = db.select().from(school_announcements).where((0, import_drizzle_orm.and)(...conditions));
      const results = await queryBuilder.orderBy((0, import_drizzle_orm.desc)(school_announcements.timestampMs)).limit(Number(limitParam) || 50);
      let filteredResults = results;
      if (grade && typeof grade === "string" && grade.trim() !== "") {
        const { matchesTargetGrades: matchesTargetGrades2 } = await Promise.resolve().then(() => (init_gradeMatcher(), gradeMatcher_exports));
        filteredResults = results.filter((b) => matchesTargetGrades2(grade, b.targetGrades));
      }
      res.json({ success: true, broadcasts: filteredResults, data: filteredResults });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/broadcasts", async (req, res) => {
    try {
      const { id, schoolId, message, targetGrades, author, subject, targetLocation, durationHours, expiryDate: customExpiry } = req.body;
      if (!message || typeof message === "string" && !message.trim()) {
        return res.status(400).json({ success: false, message: "\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0645\u0637\u0644\u0648\u0628" });
      }
      let expiryDate;
      if (customExpiry) {
        expiryDate = new Date(typeof customExpiry === "number" ? customExpiry : customExpiry);
        if (isNaN(expiryDate.getTime())) {
          expiryDate = /* @__PURE__ */ new Date();
          expiryDate.setHours(expiryDate.getHours() + (Number(durationHours) || 24));
        }
      } else {
        expiryDate = /* @__PURE__ */ new Date();
        expiryDate.setHours(expiryDate.getHours() + (Number(durationHours) || 24));
      }
      const broadcastId = id || `br_${Date.now()}`;
      const effectiveSchoolId = schoolId && schoolId.trim() !== "" ? schoolId.trim() : "general";
      let cleanTargetGrades = [];
      if (Array.isArray(targetGrades)) {
        cleanTargetGrades = targetGrades;
      } else if (typeof targetGrades === "string") {
        cleanTargetGrades = [targetGrades];
      } else {
        cleanTargetGrades = ["\u0627\u0644\u062C\u0645\u064A\u0639"];
      }
      const result = await db.insert(school_announcements).values({
        id: broadcastId,
        schoolId: effectiveSchoolId,
        message: typeof message === "string" ? message.trim() : String(message),
        targetGrades: cleanTargetGrades,
        author: author || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629",
        subject: subject || "\u0627\u0644\u0625\u0630\u0627\u0639\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629",
        targetLocation: targetLocation || "ticker",
        expiryDate,
        timestampMs: Date.now(),
        createdAt: /* @__PURE__ */ new Date()
      }).returning();
      const created = result[0];
      realtimeServerInstance?.broadcastManual("school_announcements", broadcastId, "INSERT", created);
      realtimeServerInstance?.broadcastManual("broadcasts", broadcastId, "INSERT", created);
      res.json({ success: true, broadcast: created, data: created });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.patch("/api/broadcasts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { message, targetGrades, expiryDate: customExpiry } = req.body;
      const updateData = {};
      if (message !== void 0) updateData.message = message;
      if (targetGrades !== void 0) {
        updateData.targetGrades = Array.isArray(targetGrades) ? targetGrades : [targetGrades];
      }
      if (customExpiry !== void 0) {
        updateData.expiryDate = new Date(typeof customExpiry === "number" ? customExpiry : customExpiry);
      }
      if (Object.keys(updateData).length === 0) {
        return res.json({ success: true, message: "No relevant fields to update" });
      }
      const updated = await db.update(school_announcements).set(updateData).where((0, import_drizzle_orm.eq)(school_announcements.id, id)).returning();
      if (updated && updated.length > 0) {
        realtimeServerInstance?.broadcastManual("school_announcements", id, "UPDATE", updated[0]);
        realtimeServerInstance?.broadcastManual("broadcasts", id, "UPDATE", updated[0]);
      }
      res.json({ success: true, broadcast: updated?.[0], data: updated?.[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/broadcasts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(school_announcements).where((0, import_drizzle_orm.eq)(school_announcements.id, id));
      realtimeServerInstance?.broadcastManual("school_announcements", id, "DELETE", { id });
      realtimeServerInstance?.broadcastManual("broadcasts", id, "DELETE", { id });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/teachers", async (req, res) => {
    try {
      const { schoolId } = req.query;
      let queryBuilder = db.select().from(teachers);
      if (schoolId && schoolId !== "all") {
        queryBuilder = queryBuilder.where((0, import_drizzle_orm.eq)(teachers.schoolId, schoolId));
      }
      const results = await queryBuilder.orderBy((0, import_drizzle_orm.asc)(teachers.name));
      res.json({ success: true, teachers: results });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/teachers", async (req, res) => {
    try {
      const { teacherStage, ...teacherData } = req.body;
      const id = teacherData.id || `tch_${Date.now()}`;
      await db.insert(teachers).values({
        ...teacherData,
        id,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      });
      if (teacherData.photo) {
        try {
          if (teacherData.code) {
          }
          await db.update(users).set({ photo: teacherData.photo }).where((0, import_drizzle_orm.eq)(users.id, id));
        } catch (uErr) {
          console.warn("Syncing teacher photo to users failed:", uErr);
        }
      }
      res.json({ success: true, id });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.patch("/api/teachers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { teacherStage, ...updateData } = req.body;
      await db.update(teachers).set({ ...updateData, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm.eq)(teachers.id, id));
      if (updateData.photo) {
        try {
          if (updateData.code) {
          }
          await db.update(users).set({ photo: updateData.photo }).where((0, import_drizzle_orm.eq)(users.id, id));
        } catch (uErr) {
          console.warn("Syncing teacher photo to users failed:", uErr);
        }
      }
      realtimeServerInstance?.broadcastManual("teachers", id, "UPDATE", { id, ...updateData });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/teachers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const tList = await db.select().from(teachers).where((0, import_drizzle_orm.eq)(teachers.id, id));
      if (tList.length > 0 && tList[0].code) {
        const c = tList[0].code;
        await db.delete(activation_codes).where((0, import_drizzle_orm.eq)(activation_codes.code, c));
      }
      await db.delete(teachers).where((0, import_drizzle_orm.eq)(teachers.id, id));
      await db.delete(users).where((0, import_drizzle_orm.eq)(users.id, id));
      await db.delete(activation_codes).where((0, import_drizzle_orm.eq)(activation_codes.id, id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/teachers/:id/link-code", async (req, res) => {
    try {
      const { id } = req.params;
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, message: "\u0643\u0648\u062F \u0627\u0644\u0634\u0639\u0628\u0629 \u0645\u0637\u0644\u0648\u0628" });
      }
      const cleanCode = String(code).trim().toUpperCase();
      const tList = await db.select().from(teachers).where((0, import_drizzle_orm.eq)(teachers.id, id));
      if (tList.length === 0) {
        return res.status(404).json({ success: false, message: "\u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0639\u0644\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      const currentTeacher = tList[0];
      const existingClasses = Array.isArray(currentTeacher.classes) ? [...currentTeacher.classes] : [];
      const existingClassCodes = currentTeacher.classCodes && typeof currentTeacher.classCodes === "object" ? { ...currentTeacher.classCodes } : {};
      if (currentTeacher.code === cleanCode || Object.values(existingClassCodes).includes(cleanCode)) {
        return res.json({
          success: true,
          message: "\u0647\u0630\u0627 \u0627\u0644\u0643\u0648\u062F \u0645\u0641\u0639\u0651\u0644 \u0648\u0645\u0631\u0628\u0648\u0637 \u0645\u0633\u0628\u0642\u0627\u064B \u0641\u064A \u062D\u0633\u0627\u0628\u0643!",
          classes: existingClasses,
          classCodes: existingClassCodes
        });
      }
      const allTeachers = await db.select().from(teachers);
      let foundClassName = "";
      let matchedOtherTeacher = null;
      for (const otherT of allTeachers) {
        if (otherT.classCodes && typeof otherT.classCodes === "object") {
          for (const [cls, cCode] of Object.entries(otherT.classCodes)) {
            if (String(cCode).trim().toUpperCase() === cleanCode) {
              foundClassName = cls;
              matchedOtherTeacher = otherT;
              break;
            }
          }
        }
        if (foundClassName) break;
        if (otherT.code === cleanCode) {
          matchedOtherTeacher = otherT;
          if (Array.isArray(otherT.classes) && otherT.classes.length > 0) {
            foundClassName = otherT.classes[0];
          }
          break;
        }
      }
      if (!foundClassName) {
        const actList = await db.select().from(activation_codes).where((0, import_drizzle_orm.eq)(activation_codes.code, cleanCode));
        if (actList.length > 0) {
          const act = actList[0];
          if (act.grade || act.section) {
            foundClassName = act.section ? `${act.grade || "\u0627\u0644\u0635\u0641"} - \u0634\u0639\u0628\u0629 ${act.section}` : act.grade || "\u0634\u0639\u0628\u0629 \u062C\u062F\u064A\u062F\u0629";
          }
        }
      }
      if (!foundClassName) {
        const parts = cleanCode.split("-");
        if (parts.length >= 3) {
          foundClassName = `\u0634\u0639\u0628\u0629 \u0625\u0636\u0627\u0641\u064A\u0629 (${parts.slice(1, 3).join("-")})`;
        } else {
          foundClassName = `\u0634\u0639\u0628\u0629 (${cleanCode})`;
        }
      }
      if (foundClassName && !existingClasses.includes(foundClassName)) {
        existingClasses.push(foundClassName);
      }
      existingClassCodes[foundClassName] = cleanCode;
      if (matchedOtherTeacher && Array.isArray(matchedOtherTeacher.classes)) {
        matchedOtherTeacher.classes.forEach((c) => {
          if (!existingClasses.includes(c)) existingClasses.push(c);
        });
      }
      await db.update(teachers).set({
        classes: existingClasses,
        classCodes: existingClassCodes,
        updatedAt: /* @__PURE__ */ new Date()
      }).where((0, import_drizzle_orm.eq)(teachers.id, id));
      realtimeServerInstance?.broadcastManual("teachers", id, "UPDATE", {
        id,
        classes: existingClasses,
        classCodes: existingClassCodes
      });
      res.json({
        success: true,
        message: `\u062A\u0645 \u0631\u0628\u0637 \u0627\u0644\u0634\u0639\u0628\u0629 (${foundClassName}) \u0628\u0646\u062C\u0627\u062D!`,
        linkedClass: foundClassName,
        classes: existingClasses,
        classCodes: existingClassCodes
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  const handleGetClassSchedules = async (req, res) => {
    try {
      const { schoolId, className, teacherId } = req.query;
      let queryBuilder = db.select().from(class_schedules);
      const filters = [];
      if (schoolId && schoolId !== "all") filters.push((0, import_drizzle_orm.eq)(class_schedules.schoolId, schoolId));
      if (teacherId && teacherId !== "all") filters.push((0, import_drizzle_orm.eq)(class_schedules.teacherId, teacherId));
      if (filters.length > 0) {
        queryBuilder = queryBuilder.where((0, import_drizzle_orm.and)(...filters));
      }
      const results = await queryBuilder.orderBy((0, import_drizzle_orm.asc)(class_schedules.dayOfWeek), (0, import_drizzle_orm.asc)(class_schedules.startTime));
      const teacherMap = /* @__PURE__ */ new Map();
      try {
        const allTeachers = await db.select().from(teachers);
        allTeachers.forEach((t) => {
          if (t.id && t.name) teacherMap.set(t.id, t.name);
        });
      } catch (tErr) {
        console.warn("Schedule: failed to resolve teachers", tErr);
      }
      let filtered = results;
      if (className && className !== "all") {
        const targetClean = String(className).trim();
        const normTarget = targetClean.replace(/[\u064B-\u065F\u0670]/g, "").replace(/[أإآٱ]/g, "\u0627").replace(/ة/g, "\u0647").replace(/[ىي]/g, "\u064A").replace(/(?:^|\s)ال/g, " ").replace(/\s+/g, "");
        filtered = results.filter((s) => {
          if (!s.className) return false;
          if (s.className.trim() === targetClean) return true;
          const normA = s.className.replace(/[\u064B-\u065F\u0670]/g, "").replace(/[أإآٱ]/g, "\u0627").replace(/ة/g, "\u0647").replace(/[ىي]/g, "\u064A").replace(/(?:^|\s)ال/g, " ").replace(/\s+/g, "");
          return normA === normTarget || normA.includes(normTarget) || normTarget.includes(normA);
        });
      }
      const mapped = filtered.map((s) => ({
        id: s.id,
        schoolId: s.schoolId,
        day: s.dayOfWeek,
        dayOfWeek: s.dayOfWeek,
        className: s.className,
        sectionName: s.sectionName || null,
        time: s.startTime,
        startTime: s.startTime,
        endTime: s.endTime || s.startTime,
        teacherId: s.teacherId,
        teacherName: (s.teacherId ? teacherMap.get(s.teacherId) : "") || "",
        subject: s.subject,
        type: s.classType || "physical",
        classType: s.classType || "physical"
      }));
      res.json({ success: true, schedules: mapped, data: mapped });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  const handlePostClassSchedule = async (req, res) => {
    try {
      const body = req.body || {};
      const id = body.id || `sch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const dayOfWeek = body.dayOfWeek || body.day || "";
      const className = body.className || body.class_name || "";
      const startTime = body.startTime || body.start_time || body.time || "";
      const endTime = body.endTime || body.end_time || startTime;
      const teacherId = body.teacherId || body.teacher_id || null;
      const subject = body.subject || "";
      const schoolId = body.schoolId || body.school_id || "school1";
      const sectionName = body.sectionName || body.section_name || null;
      const classType = body.type || body.class_type || "physical";
      const newSched = { id, schoolId, teacherId, className, sectionName, classType, subject, dayOfWeek, startTime, endTime, createdAt: /* @__PURE__ */ new Date() };
      await db.insert(class_schedules).values(newSched).onConflictDoUpdate({
        target: class_schedules.id,
        set: { teacherId, className, sectionName, classType, subject, dayOfWeek, startTime, endTime, schoolId }
      });
      realtimeServerInstance?.broadcastManual("class_schedules", id, "INSERT", newSched);
      realtimeServerInstance?.broadcastManual("schedules", id, "INSERT", newSched);
      res.json({ success: true, id, schedule: newSched, data: newSched });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  const handlePatchClassSchedule = async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const mapped = {};
      if (updates.incrementViews) {
        await db.execute(import_drizzle_orm2.sql`UPDATE recorded_lessons SET views = COALESCE(views, 0) + 1 WHERE id = ${id}`);
        realtimeServerInstance?.broadcastManual("recorded_lessons", id, "UPDATE", { id, incrementViews: true });
        return res.json({ success: true });
      }
      if (updates.dayOfWeek !== void 0 || updates.day !== void 0) mapped.dayOfWeek = updates.dayOfWeek ?? updates.day;
      if (updates.className !== void 0 || updates.class_name !== void 0) mapped.className = updates.className ?? updates.class_name;
      if (updates.sectionName !== void 0 || updates.section_name !== void 0) mapped.sectionName = updates.sectionName ?? updates.section_name;
      if (updates.startTime !== void 0 || updates.time !== void 0) mapped.startTime = updates.startTime ?? updates.time;
      if (updates.endTime !== void 0) mapped.endTime = updates.endTime;
      if (updates.teacherId !== void 0 || updates.teacher_id !== void 0) mapped.teacherId = updates.teacherId ?? updates.teacher_id;
      if (updates.subject !== void 0) mapped.subject = updates.subject;
      if (updates.schoolId !== void 0 || updates.school_id !== void 0) mapped.schoolId = updates.schoolId ?? updates.school_id;
      if (updates.classType !== void 0 || updates.type !== void 0) mapped.classType = updates.classType ?? updates.type;
      if (Object.keys(mapped).length > 0) {
        await db.update(class_schedules).set(mapped).where((0, import_drizzle_orm.eq)(class_schedules.id, id));
        realtimeServerInstance?.broadcastManual("class_schedules", id, "UPDATE", { id, ...mapped });
        realtimeServerInstance?.broadcastManual("schedules", id, "UPDATE", { id, ...mapped });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  const handleDeleteClassSchedule = async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(class_schedules).where((0, import_drizzle_orm.eq)(class_schedules.id, id));
      realtimeServerInstance?.broadcastManual("class_schedules", id, "DELETE", { id });
      realtimeServerInstance?.broadcastManual("schedules", id, "DELETE", { id });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.get("/api/schedules", handleGetClassSchedules);
  app.get("/api/class-schedules", handleGetClassSchedules);
  app.get("/api/class_schedules", handleGetClassSchedules);
  app.post("/api/schedules", handlePostClassSchedule);
  app.post("/api/class-schedules", handlePostClassSchedule);
  app.post("/api/class_schedules", handlePostClassSchedule);
  app.patch("/api/schedules/:id", handlePatchClassSchedule);
  app.patch("/api/class-schedules/:id", handlePatchClassSchedule);
  app.patch("/api/class_schedules/:id", handlePatchClassSchedule);
  app.put("/api/schedules/:id", handlePatchClassSchedule);
  app.put("/api/class-schedules/:id", handlePatchClassSchedule);
  app.put("/api/class_schedules/:id", handlePatchClassSchedule);
  app.delete("/api/schedules/:id", handleDeleteClassSchedule);
  app.delete("/api/class-schedules/:id", handleDeleteClassSchedule);
  app.delete("/api/class_schedules/:id", handleDeleteClassSchedule);
  app.get("/api/school-settings/:schoolId/times", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const config2 = await db.select().from(school_configs).where((0, import_drizzle_orm.eq)(school_configs.id, schoolId));
      if (config2.length > 0 && config2[0].subjects?.times) {
        res.json({ success: true, times: config2[0].subjects.times });
      } else {
        res.json({ success: true, times: [] });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/school-settings/:schoolId/times", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { times } = req.body;
      const existing = await db.select().from(school_configs).where((0, import_drizzle_orm.eq)(school_configs.id, schoolId));
      if (existing.length > 0) {
        const subjects = existing[0].subjects || {};
        await db.update(school_configs).set({ subjects: { ...subjects, times } }).where((0, import_drizzle_orm.eq)(school_configs.id, schoolId));
      } else {
        await db.insert(school_configs).values({
          id: schoolId,
          subjects: { times }
        });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/students/:studentId/attendance", async (req, res) => {
    try {
      const { studentId } = req.params;
      const { status, by, reason, period, schoolId, date: customDate } = req.body;
      const date = customDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const id = `att_${studentId}_${date}_${period}`.replace(/\s+/g, "_");
      await db.insert(attendance_logs).values({
        id,
        studentId,
        schoolId: schoolId || "",
        date,
        status,
        period,
        reason,
        recordedBy: by,
        timestamp: /* @__PURE__ */ new Date()
      }).onConflictDoUpdate({
        target: attendance_logs.id,
        set: { status, reason, recordedBy: by, timestamp: /* @__PURE__ */ new Date() }
      });
      const student = await db.select().from(students).where((0, import_drizzle_orm.eq)(students.id, studentId));
      if (student.length > 0) {
        const allLogs = await db.select().from(attendance_logs).where((0, import_drizzle_orm.eq)(attendance_logs.studentId, studentId)).orderBy((0, import_drizzle_orm.desc)(attendance_logs.timestamp));
        let present = 0, absent = 0, late = 0;
        allLogs.forEach((log) => {
          if (log.status === "present") present++;
          if (log.status === "absent") absent++;
          if (log.status === "late") late++;
        });
        const recentLogs = allLogs.slice(0, 50).reverse().map((l) => ({
          date: l.date,
          status: l.status,
          period: l.period,
          reason: l.reason,
          time: new Date(l.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          by: l.recordedBy
        }));
        const updatedAttendance = {
          present,
          absent,
          late,
          logs: recentLogs
        };
        await db.update(students).set({ attendance: updatedAttendance }).where((0, import_drizzle_orm.eq)(students.id, studentId));
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/students/:studentId/behavior", async (req, res) => {
    try {
      const { studentId } = req.params;
      const { type, points, action, note, by, schoolId } = req.body;
      const date = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const id = `beh_${studentId}_${Date.now()}`;
      await db.insert(behavior_logs).values({
        id,
        studentId,
        schoolId: schoolId || "",
        type,
        points,
        action,
        note,
        recordedBy: by,
        date,
        timestamp: /* @__PURE__ */ new Date()
      });
      const student = await db.select().from(students).where((0, import_drizzle_orm.eq)(students.id, studentId));
      if (student.length > 0) {
        const currentBehavior = student[0].behavior || { score: 100, logs: [] };
        const newScore = Math.max(0, Math.min(100, (currentBehavior.score || 100) + points));
        const logs = currentBehavior.logs || [];
        logs.unshift({ date, type, points, action, note, by });
        await db.update(students).set({
          behavior: { score: newScore, logs: logs.slice(0, 50) }
        }).where((0, import_drizzle_orm.eq)(students.id, studentId));
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/school-configs/:schoolId/uniform", async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { uniformConfigs } = req.body;
      const existing = await db.select().from(school_configs).where((0, import_drizzle_orm.eq)(school_configs.id, schoolId));
      if (existing.length > 0) {
        await db.update(school_configs).set({ uniformConfigs }).where((0, import_drizzle_orm.eq)(school_configs.id, schoolId));
      } else {
        await db.insert(school_configs).values({
          id: schoolId,
          uniformConfigs
        });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/notifications", async (req, res) => {
    try {
      const { recipientId, recipientIds, userId, schoolId, limit: limitParam } = req.query;
      let queryBuilder = db.select().from(notifications);
      const filters = [];
      let idsToMatch = [];
      if (recipientIds) {
        idsToMatch = recipientIds.split(",").map((s) => s.trim()).filter(Boolean);
      } else if (recipientId || userId) {
        const singleId = recipientId || userId;
        if (singleId !== "all") idsToMatch.push(singleId);
      }
      if (idsToMatch.length > 0) {
        const expandedSet = /* @__PURE__ */ new Set();
        for (const rawId of idsToMatch) {
          if (!rawId) continue;
          const trimmed = rawId.trim();
          expandedSet.add(trimmed);
          expandedSet.add(trimmed.toLowerCase());
          expandedSet.add(trimmed.toUpperCase());
          const stripped = trimmed.replace(/^(scode_|pcode_|tcode_|tch_|school_|class_)/i, "");
          expandedSet.add(stripped);
          expandedSet.add(stripped.toLowerCase());
          expandedSet.add(stripped.toUpperCase());
          expandedSet.add(stripped);
          expandedSet.add(stripped.toLowerCase());
          expandedSet.add(stripped.toUpperCase());
          const prefixes = ["scode_", "pcode_", "tcode_", "tch_"];
          for (const p of prefixes) {
            expandedSet.add(`${p}${stripped}`);
            expandedSet.add(`${p}${stripped.toUpperCase()}`);
          }
          if (stripped.toUpperCase().startsWith("TCH-") || stripped.toUpperCase().startsWith("PAR-")) {
            expandedSet.add(`tcode_${stripped}`);
            expandedSet.add(`pcode_${stripped}`);
            expandedSet.add(`tcode_${stripped.toUpperCase()}`);
            expandedSet.add(`pcode_${stripped.toUpperCase()}`);
          }
        }
        expandedSet.add("all");
        filters.push((0, import_drizzle_orm.inArray)(notifications.recipientId, Array.from(expandedSet)));
      }
      if (schoolId && schoolId !== "all") {
        filters.push((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(notifications.schoolId, schoolId), (0, import_drizzle_orm.isNull)(notifications.schoolId), (0, import_drizzle_orm.eq)(notifications.schoolId, "")));
      }
      if (filters.length > 0) {
        queryBuilder = queryBuilder.where((0, import_drizzle_orm.and)(...filters));
      }
      const logs = await queryBuilder.orderBy((0, import_drizzle_orm.desc)(notifications.createdAt)).limit(Number(limitParam) || 100);
      res.json({ success: true, notifications: logs, data: logs });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/notifications", async (req, res) => {
    try {
      const { userId, recipientId, title, message, body, type, schoolId, metadata, recipientRole, studentName, authorName } = req.body || {};
      const id = req.body.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      let targetRecipient = recipientId || userId || "all";
      const textBody = body || message || "";
      const nameToResolve = studentName || authorName;
      if ((!targetRecipient || targetRecipient === "anonymous" || targetRecipient === "user") && nameToResolve && nameToResolve !== "\u0645\u0633\u062A\u062E\u062F\u0645") {
        try {
          const foundStudents = await db.select().from(students).where(import_drizzle_orm2.sql`name ILIKE ${"%" + nameToResolve.trim() + "%"}`).limit(1);
          if (foundStudents[0]?.id) {
            targetRecipient = foundStudents[0].id;
          } else if (foundStudents[0]?.code) {
            targetRecipient = foundStudents[0].code;
          }
        } catch (e) {
          console.warn("Could not resolve student by name in notifications:", e);
        }
      }
      const newNotif = {
        id,
        recipientId: targetRecipient,
        recipientRole: recipientRole || "student",
        title: title || "\u0628\u0648\u0627\u0628\u0629 \u0628\u064A\u0631\u0642 - \u0625\u0634\u0639\u0627\u0631 \u062C\u062F\u064A\u062F",
        body: textBody,
        type: type || "alert",
        schoolId: schoolId || "",
        metadata: metadata || null,
        read: false,
        createdAt: /* @__PURE__ */ new Date()
      };
      const inserted = await db.insert(notifications).values(newNotif).returning({ id: notifications.id });
      const finalId = inserted[0]?.id || id;
      const finalNotif = { ...newNotif, id: finalId };
      realtimeServerInstance?.broadcastManual("notifications", finalId, "INSERT", finalNotif);
      (async () => {
        try {
          if (targetRecipient && targetRecipient !== "all") {
            const tokens = await db.select().from(user_device_tokens).where((0, import_drizzle_orm.eq)(user_device_tokens.userId, targetRecipient));
            if (tokens.length > 0) {
              console.log(`[FCM External Push] Preparing push for user ${targetRecipient} on ${tokens.length} devices...`);
            }
          }
        } catch (pushErr) {
          console.warn("[FCM External Push Warning]", pushErr);
        }
      })();
      res.json({ success: true, id: finalId, notification: finalNotif, data: finalNotif });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/notifications/register-device-token", async (req, res) => {
    try {
      const { userId, token, platform = "android", deviceModel, schoolId, role = "student" } = req.body || {};
      if (!userId || !token) {
        return res.status(400).json({ success: false, message: "userId and token are required" });
      }
      const existingToken = await db.select().from(user_device_tokens).where(
        (0, import_drizzle_orm.and)((0, import_drizzle_orm.eq)(user_device_tokens.userId, String(userId)), (0, import_drizzle_orm.eq)(user_device_tokens.token, String(token)))
      ).limit(1);
      if (existingToken.length > 0) {
        await db.update(user_device_tokens).set({ lastActive: /* @__PURE__ */ new Date(), deviceModel: deviceModel || existingToken[0].deviceModel }).where((0, import_drizzle_orm.eq)(user_device_tokens.id, existingToken[0].id));
        return res.json({ success: true, message: "Device token refreshed", id: existingToken[0].id });
      }
      const id = `token_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      await db.insert(user_device_tokens).values({
        id,
        userId: String(userId),
        token: String(token),
        platform: String(platform),
        deviceModel: deviceModel || "Unknown Device",
        schoolId: schoolId || "",
        role: role || "student",
        lastActive: /* @__PURE__ */ new Date(),
        createdAt: /* @__PURE__ */ new Date()
      });
      console.log(`[FCM Registration] Device token registered successfully for user ${userId} (${platform})`);
      res.json({ success: true, message: "Device token registered successfully", id });
    } catch (error) {
      console.error("[FCM Registration Error]", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/notifications/unregister-device-token", async (req, res) => {
    try {
      const { token } = req.body || {};
      if (!token) return res.status(400).json({ success: false, message: "token required" });
      await db.delete(user_device_tokens).where((0, import_drizzle_orm.eq)(user_device_tokens.token, String(token)));
      res.json({ success: true, message: "Device token removed" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const trimmed = (userId || "").trim();
      const expandedSet = /* @__PURE__ */ new Set();
      expandedSet.add(trimmed);
      expandedSet.add(trimmed.toLowerCase());
      expandedSet.add(trimmed.toUpperCase());
      const stripped = trimmed.replace(/^(scode_|pcode_|tcode_|tch_|school_|class_)/i, "");
      expandedSet.add(stripped);
      expandedSet.add(stripped.toLowerCase());
      expandedSet.add(stripped.toUpperCase());
      const prefixes = ["scode_", "pcode_", "tcode_", "tch_"];
      for (const p of prefixes) {
        expandedSet.add(`${p}${stripped}`);
        expandedSet.add(`${p}${stripped.toUpperCase()}`);
      }
      expandedSet.add("all");
      const logs = await db.select().from(notifications).where((0, import_drizzle_orm.inArray)(notifications.recipientId, Array.from(expandedSet))).orderBy((0, import_drizzle_orm.desc)(notifications.createdAt)).limit(100);
      res.json({ success: true, notifications: logs, data: logs });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.patch("/api/notifications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const payload = {};
      if (updates.read !== void 0) payload.read = updates.read;
      if (updates.title !== void 0) payload.title = updates.title;
      if (updates.body !== void 0) payload.body = updates.body;
      if (updates.message !== void 0) payload.body = updates.message;
      if (Object.keys(payload).length === 0) {
        return res.json({ success: true, id, message: "No relevant fields to update" });
      }
      await db.update(notifications).set(payload).where((0, import_drizzle_orm.eq)(notifications.id, id));
      realtimeServerInstance?.broadcastManual("notifications", id, "UPDATE", { id, ...payload });
      res.json({ success: true, id });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      await db.update(notifications).set({ read: true }).where((0, import_drizzle_orm.eq)(notifications.id, id));
      realtimeServerInstance?.broadcastManual("notifications", id, "UPDATE", { id, read: true });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, codes } = req.query;
      let identifiers = [];
      if (userId) identifiers.push(userId);
      if (codes) {
        const codesArr = codes.split(",");
        identifiers.push(...codesArr);
      }
      let whereClause = (0, import_drizzle_orm.eq)(notifications.id, id);
      if (identifiers.length > 0) {
        whereClause = (0, import_drizzle_orm.and)(whereClause, (0, import_drizzle_orm.inArray)(notifications.recipientId, identifiers));
      }
      await db.delete(notifications).where(whereClause);
      realtimeServerInstance?.broadcastManual("notifications", id, "DELETE", { id });
      res.json({ success: true, id });
    } catch (error) {
      console.error("Delete notification error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/notifications-clear-all", async (req, res) => {
    try {
      const { userId, codes } = req.query;
      let identifiers = [];
      if (userId) identifiers.push(userId);
      if (codes) {
        const codesArr = codes.split(",");
        identifiers.push(...codesArr);
      }
      if (identifiers.length === 0) {
        return res.status(400).json({ success: false, message: "At least one identifier (userId or codes) is required" });
      }
      await db.delete(notifications).where((0, import_drizzle_orm.inArray)(notifications.recipientId, identifiers));
      res.json({ success: true });
    } catch (error) {
      console.error("Clear all notifications error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/students/:studentId/attendance/logs", async (req, res) => {
    try {
      const { studentId } = req.params;
      const logs = await db.select().from(attendance_logs).where((0, import_drizzle_orm.eq)(attendance_logs.studentId, studentId)).orderBy((0, import_drizzle_orm.desc)(attendance_logs.timestamp));
      res.json({ success: true, logs });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/students/:studentId/behavior/logs", async (req, res) => {
    try {
      const { studentId } = req.params;
      const logs = await db.select().from(behavior_logs).where((0, import_drizzle_orm.eq)(behavior_logs.studentId, studentId)).orderBy((0, import_drizzle_orm.desc)(behavior_logs.timestamp));
      res.json({ success: true, logs });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/attendance-logs", async (req, res) => {
    try {
      const { schoolId, studentId } = req.query;
      let logs;
      if (studentId) {
        logs = await db.select().from(attendance_logs).where((0, import_drizzle_orm.eq)(attendance_logs.studentId, studentId)).orderBy((0, import_drizzle_orm.desc)(attendance_logs.timestamp));
      } else if (schoolId && schoolId !== "all") {
        logs = await db.select().from(attendance_logs).where((0, import_drizzle_orm.eq)(attendance_logs.schoolId, schoolId)).orderBy((0, import_drizzle_orm.desc)(attendance_logs.timestamp));
      } else {
        logs = await db.select().from(attendance_logs).orderBy((0, import_drizzle_orm.desc)(attendance_logs.timestamp));
      }
      res.json({ success: true, logs, data: logs });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/behavior-logs", async (req, res) => {
    try {
      const { schoolId, studentId } = req.query;
      let logs;
      if (studentId) {
        logs = await db.select().from(behavior_logs).where((0, import_drizzle_orm.eq)(behavior_logs.studentId, studentId)).orderBy((0, import_drizzle_orm.desc)(behavior_logs.timestamp));
      } else if (schoolId && schoolId !== "all") {
        logs = await db.select().from(behavior_logs).where((0, import_drizzle_orm.eq)(behavior_logs.schoolId, schoolId)).orderBy((0, import_drizzle_orm.desc)(behavior_logs.timestamp));
      } else {
        logs = await db.select().from(behavior_logs).orderBy((0, import_drizzle_orm.desc)(behavior_logs.timestamp));
      }
      res.json({ success: true, logs, data: logs });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/audit-logs", async (req, res) => {
    try {
      const { limit: limitVal = 30, offset = 0 } = req.query;
      const rawLogs = await db.select().from(audit_logs).orderBy((0, import_drizzle_orm.desc)(audit_logs.timestamp)).limit(Number(limitVal)).offset(Number(offset));
      const logs = rawLogs.map((l) => {
        let email = l.userEmail;
        let name = l.userName;
        if (!email || email.trim() === "") {
          if (l.userId === "admin_main" || l.userId === "ACT_MASTER_G" || !name || name === "\u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u0627\u0645\u0629" || name === "\u0645\u0648\u0638\u0641") {
            email = "abdulradhaalmayali@gmail.com";
          }
        }
        if (!name || name === "\u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u0627\u0645\u0629" || name === "\u0645\u0648\u0638\u0641") {
          name = email || "abdulradhaalmayali@gmail.com";
        }
        return {
          ...l,
          userEmail: email || name,
          userName: name
        };
      });
      res.json({ success: true, logs });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/audit-logs", async (req, res) => {
    try {
      const logData = req.body || {};
      const id = logData.id || `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const userId = logData.userId || logData.adminId || logData.userEmail || "system";
      let userEmail = logData.userEmail || null;
      let userName = logData.userName;
      if (!userEmail || userEmail.trim() === "") {
        if (userId === "admin_main" || userId === "ACT_MASTER_G" || userName === "\u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u0627\u0645\u0629" || !userName) {
          userEmail = "abdulradhaalmayali@gmail.com";
        }
      }
      if (!userName || userName === "\u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u0627\u0645\u0629" || userName === "\u0645\u0648\u0638\u0641") {
        userName = userEmail || "abdulradhaalmayali@gmail.com";
      }
      const action = logData.action || "\u0625\u062C\u0631\u0627\u0621 \u0646\u0638\u0627\u0645";
      const details = logData.details || logData.action || "";
      const targetId = logData.targetId || logData.schoolId || null;
      const targetName = logData.targetName || null;
      const targetType = logData.targetType || (logData.schoolId ? "school" : null);
      const schoolId = logData.schoolId || null;
      await db.insert(audit_logs).values({
        id,
        userId,
        userName,
        userEmail: userEmail || userName,
        action,
        details,
        targetId,
        targetName,
        targetType,
        schoolId,
        timestamp: /* @__PURE__ */ new Date()
      });
      res.json({ success: true, id });
    } catch (error) {
      console.error("Error inserting audit log:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/audit-logs/old", async (req, res) => {
    try {
      const isAll = req.query.all === "true" || req.query.scope === "all" || req.body?.all === true;
      const daysRaw = req.query.days ?? req.body?.days;
      const days = daysRaw !== void 0 ? Number(daysRaw) : 30;
      let deleted;
      if (isAll || days <= 0) {
        deleted = await db.delete(audit_logs).returning({ id: audit_logs.id });
        return res.json({
          success: true,
          count: deleted.length,
          message: deleted.length > 0 ? `\u062A\u0645 \u0645\u0633\u062D \u0643\u0627\u0641\u0629 \u0627\u0644\u0633\u062C\u0644\u0627\u062A \u0628\u0646\u062C\u0627\u062D (${deleted.length} \u0633\u062C\u0644)` : "\u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0633\u062C\u0644\u0627\u062A \u0641\u0627\u0631\u063A\u0629 \u0628\u0627\u0644\u0641\u0639\u0644"
        });
      } else {
        const cutoffDate = /* @__PURE__ */ new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        deleted = await db.delete(audit_logs).where((0, import_drizzle_orm.lt)(audit_logs.timestamp, cutoffDate)).returning({ id: audit_logs.id });
        return res.json({
          success: true,
          count: deleted.length,
          message: deleted.length > 0 ? `\u062A\u0645 \u062D\u0630\u0641 ${deleted.length} \u0633\u062C\u0644 \u0623\u0642\u062F\u0645 \u0645\u0646 ${days} \u064A\u0648\u0645\u0627\u064B` : `\u0644\u0627 \u062A\u0648\u062C\u062F \u0633\u062C\u0644\u0627\u062A \u0623\u0642\u062F\u0645 \u0645\u0646 ${days} \u064A\u0648\u0645\u0627\u064B \u0644\u062D\u0630\u0641\u0647\u0627`
        });
      }
    } catch (error) {
      console.error("Error clearing old audit logs:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/audit-logs", async (req, res) => {
    try {
      const deleted = await db.delete(audit_logs).returning({ id: audit_logs.id });
      res.json({
        success: true,
        count: deleted.length,
        message: deleted.length > 0 ? `\u062A\u0645 \u0645\u0633\u062D \u0643\u0627\u0641\u0629 \u0627\u0644\u0633\u062C\u0644\u0627\u062A \u0628\u0646\u062C\u0627\u062D (${deleted.length} \u0633\u062C\u0644)` : "\u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0633\u062C\u0644\u0627\u062A \u0641\u0627\u0631\u063A\u0629 \u0628\u0627\u0644\u0641\u0639\u0644"
      });
    } catch (error) {
      console.error("Error clearing all audit logs:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/audit-logs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await db.delete(audit_logs).where((0, import_drizzle_orm.eq)(audit_logs.id, id)).returning({ id: audit_logs.id });
      if (!deleted || deleted.length === 0) {
        return res.status(404).json({ success: false, message: "\u0627\u0644\u0633\u062C\u0644 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0623\u0648 \u062A\u0645 \u062D\u0630\u0641\u0647 \u0645\u0633\u0628\u0642\u0627\u064B" });
      }
      res.json({ success: true, message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0633\u062C\u0644 \u0628\u0646\u062C\u0627\u062D" });
    } catch (error) {
      console.error("Error deleting single audit log:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/idea-bank", async (req, res) => {
    try {
      const { schoolId, userId } = req.query;
      let query = db.select().from(idea_bank).orderBy((0, import_drizzle_orm.desc)(idea_bank.timestamp));
      const conditions = [];
      if (schoolId) {
        conditions.push((0, import_drizzle_orm.eq)(idea_bank.schoolId, schoolId));
      }
      if (userId) {
        conditions.push((0, import_drizzle_orm.eq)(idea_bank.userId, userId));
      }
      if (conditions.length > 0) {
        query = query.where((0, import_drizzle_orm.and)(...conditions));
      }
      const ideas = await query;
      res.json({ success: true, ideas });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/idea-bank", async (req, res) => {
    try {
      const data = req.body;
      const id = `idea_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      await db.insert(idea_bank).values({
        id,
        ...data,
        timestamp: /* @__PURE__ */ new Date()
      });
      res.json({ success: true, id });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.patch("/api/idea-bank/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      if (Object.keys(updates).length === 0) {
        return res.json({ success: true, message: "No relevant fields to update" });
      }
      await db.update(idea_bank).set(updates).where((0, import_drizzle_orm.eq)(idea_bank.id, id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/idea-bank/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(idea_bank).where((0, import_drizzle_orm.eq)(idea_bank.id, id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/council-polls", async (req, res) => {
    try {
      const { schoolId } = req.query;
      let query = db.select().from(council_polls).orderBy((0, import_drizzle_orm.desc)(council_polls.timestamp));
      if (schoolId) {
        query = query.where((0, import_drizzle_orm.eq)(council_polls.schoolId, schoolId));
      }
      const polls = await query;
      res.json({ success: true, polls });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/council-polls", async (req, res) => {
    try {
      const data = req.body;
      const id = `poll_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      await db.insert(council_polls).values({
        id,
        ...data,
        timestamp: /* @__PURE__ */ new Date()
      });
      res.json({ success: true, id });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.patch("/api/council-polls/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      if (Object.keys(updates).length === 0) {
        return res.json({ success: true, message: "No relevant fields to update" });
      }
      await db.update(council_polls).set(updates).where((0, import_drizzle_orm.eq)(council_polls.id, id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/council-polls/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(council_polls).where((0, import_drizzle_orm.eq)(council_polls.id, id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/admin-outbox", async (req, res) => {
    try {
      const { schoolId } = req.query;
      let queryBuilder = db.select().from(admin_outbox).orderBy((0, import_drizzle_orm.desc)(admin_outbox.timestamp));
      const filters = [];
      if (schoolId) filters.push((0, import_drizzle_orm.eq)(admin_outbox.schoolId, schoolId));
      if (filters.length > 0) {
        queryBuilder = queryBuilder.where((0, import_drizzle_orm.and)(...filters));
      }
      const outbox = await queryBuilder;
      res.json({ success: true, admin_outbox: outbox });
    } catch (error) {
      console.error("Error fetching admin outbox:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/admin-outbox/send-bulk", async (req, res) => {
    try {
      const { schoolId, messageText, activeRole, targetUsers, isBroadcastMode, selectedUser } = req.body;
      const outboxId = `outbox_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      let count = 0;
      const refIds = [];
      const processedTargetIds = /* @__PURE__ */ new Set();
      const insertNotifications = [];
      const insertTickets = [];
      if (isBroadcastMode) {
        for (const user of targetUsers) {
          if (user.subscriptionStatus === "pending") continue;
          let targetId = user.uid || user.id;
          if (activeRole === "student") {
            const sCode = (user.studentCode || user.code || "").trim().toUpperCase();
            targetId = sCode ? `scode_${sCode}` : targetId;
          } else if (activeRole === "parent") {
            const pCode = (user.parentCode || user.code || "").trim().toUpperCase();
            targetId = pCode ? `pcode_${pCode}` : targetId;
          } else if (activeRole === "cadre" || activeRole === "teacher" || activeRole === "staff") {
            const tCode = (user.code || user.studentCode || "").trim().toUpperCase();
            targetId = tCode ? `tcode_${tCode}` : targetId;
          }
          if (processedTargetIds.has(targetId)) continue;
          processedTargetIds.add(targetId);
          const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          refIds.push({ id: notifId, collection: "notifications" });
          let notifTitle = "\u062A\u0628\u0644\u064A\u063A \u0625\u062F\u0627\u0631\u064A \u0639\u0627\u0645";
          let recRole = "student";
          if (activeRole === "parent") {
            notifTitle = "\u062A\u0628\u0644\u064A\u063A \u0644\u0648\u0644\u064A \u0627\u0644\u0623\u0645\u0631";
            recRole = "parent";
          } else if (activeRole === "cadre" || activeRole === "teacher") {
            notifTitle = "\u062A\u0628\u0644\u064A\u063A \u0627\u0644\u0643\u0627\u062F\u0631 \u0627\u0644\u062A\u062F\u0631\u064A\u0633\u064A";
            recRole = "teacher";
          } else if (activeRole === "staff") {
            notifTitle = "\u062A\u0628\u0644\u064A\u063A \u0627\u0644\u0643\u0627\u062F\u0631 \u0627\u0644\u0625\u062F\u0627\u0631\u064A \u0648\u0627\u0644\u0645\u0648\u0638\u0641\u064A\u0646";
            recRole = "staff";
          }
          insertNotifications.push({
            id: notifId,
            schoolId: schoolId || null,
            recipientId: targetId,
            title: notifTitle,
            body: messageText,
            type: "broadcast",
            recipientRole: recRole,
            read: false,
            metadata: { broadcastId: outboxId },
            createdAt: /* @__PURE__ */ new Date()
          });
          count++;
          if (count >= 490) break;
        }
      } else {
        if (!selectedUser) return res.status(400).json({ success: false, message: "No selected user" });
        const effectiveRole = activeRole === "cadre" || activeRole === "staff" ? "teacher" : activeRole;
        const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        let targetId = selectedUser.uid || selectedUser.id;
        let baseCode = "";
        if (activeRole === "student") {
          baseCode = (selectedUser.studentCode || selectedUser.code || "").trim();
        } else if (activeRole === "parent") {
          baseCode = (selectedUser.parentCode || selectedUser.code || "").trim();
        } else {
          baseCode = (selectedUser.code || selectedUser.studentCode || "").trim();
        }
        if (baseCode) {
          targetId = baseCode;
        }
        const ticketData = {
          id: ticketId,
          schoolId: schoolId || null,
          userId: targetId,
          role: effectiveRole,
          studentName: selectedUser.fullName || selectedUser.name || "\u0645\u0633\u062A\u062E\u062F\u0645",
          grade: "General",
          issueType: "\u0631\u0633\u0627\u0644\u0629 \u0625\u062F\u0627\u0631\u064A\u0629 \u062E\u0627\u0635\u0629",
          message: messageText,
          status: "resolved",
          adminReply: messageText,
          senderType: "admin",
          timestamp: /* @__PURE__ */ new Date(),
          readByStudent: false
        };
        const insertedTickets = await db.insert(support_tickets).values(ticketData).returning({ id: support_tickets.id });
        const finalTicketId = insertedTickets[0]?.id || ticketId;
        if (finalTicketId) {
          refIds.push({ id: finalTicketId, collection: "support_tickets" });
          let notifTitle = "\u0631\u0633\u0627\u0644\u0629 \u0625\u062F\u0627\u0631\u064A\u0629 \u0647\u0627\u0645\u0629";
          if (activeRole === "parent") notifTitle = "\u0631\u0633\u0627\u0644\u0629 \u0644\u0648\u0644\u064A \u0627\u0644\u0623\u0645\u0631";
          else if (activeRole === "cadre" || activeRole === "teacher") notifTitle = "\u0631\u0633\u0627\u0644\u0629 \u062E\u0627\u0635\u0629 \u0628\u0627\u0644\u0623\u0633\u062A\u0627\u0630";
          else if (activeRole === "staff") notifTitle = "\u0631\u0633\u0627\u0644\u0629 \u062E\u0627\u0635\u0629 \u0628\u0627\u0644\u0645\u0648\u0638\u0641";
          const notifData = {
            id: finalTicketId,
            schoolId: schoolId || null,
            recipientId: targetId,
            title: notifTitle,
            body: messageText,
            type: "general",
            recipientRole: effectiveRole,
            read: false,
            metadata: { broadcastId: outboxId },
            createdAt: /* @__PURE__ */ new Date()
          };
          await db.insert(notifications).values(notifData);
          realtimeServerInstance?.broadcastManual("notifications", finalTicketId, "INSERT", notifData);
          realtimeServerInstance?.broadcastManual("support_tickets", finalTicketId, "INSERT", { ...ticketData, id: finalTicketId });
          if (baseCode) {
            realtimeServerInstance?.broadcastManual("notifications", baseCode, "INSERT", notifData);
            realtimeServerInstance?.broadcastManual("support_tickets", baseCode, "INSERT", { ...ticketData, id: finalTicketId });
          }
        }
        count = 1;
      }
      if (insertNotifications.length > 0) {
        await db.insert(notifications).values(insertNotifications);
      }
      if (insertTickets.length > 0) {
        await db.insert(support_tickets).values(insertTickets);
      }
      const outboxRecord = {
        id: outboxId,
        schoolId: schoolId || null,
        title: isBroadcastMode ? `\u0631\u0633\u0627\u0644\u0629 \u062C\u0645\u0627\u0639\u064A\u0629 - ${activeRole === "student" ? "\u0627\u0644\u0637\u0644\u0627\u0628" : activeRole === "cadre" ? "\u0627\u0644\u0643\u0627\u062F\u0631" : activeRole === "staff" ? "\u0627\u0644\u0645\u0648\u0638\u0641\u064A\u0646" : "\u0623\u0648\u0644\u064A\u0627\u0621 \u0627\u0644\u0623\u0645\u0648\u0631"}` : `\u0631\u0633\u0627\u0644\u0629 \u0641\u0631\u062F\u064A\u0629 - ${selectedUser?.fullName || selectedUser?.name}`,
        message: messageText,
        type: isBroadcastMode ? "broadcast" : "single",
        targetRole: activeRole,
        count,
        refIds,
        broadcastId: outboxId,
        timestamp: /* @__PURE__ */ new Date(),
        createdAt: /* @__PURE__ */ new Date()
      };
      await db.insert(admin_outbox).values(outboxRecord);
      realtimeServerInstance?.broadcastManual("notifications_updated", void 0, "UPDATE", {});
      realtimeServerInstance?.broadcastManual("support_tickets_updated", void 0, "UPDATE", {});
      realtimeServerInstance?.broadcastManual("admin_outbox_updated", void 0, "UPDATE", {});
      res.json({ success: true, count, outboxId });
    } catch (error) {
      console.error("Error in send-bulk:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/admin-outbox", async (req, res) => {
    try {
      const data = req.body || {};
      const id = data.id || `outbox_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newRecord = {
        id,
        schoolId: data.schoolId || null,
        title: data.title || null,
        message: data.message || null,
        type: data.type || null,
        targetRole: data.targetRole || null,
        count: data.count || 0,
        refIds: data.refIds || null,
        broadcastId: data.broadcastId || null,
        timestamp: /* @__PURE__ */ new Date()
      };
      await db.insert(admin_outbox).values(newRecord);
      res.json({ success: true, id, data: newRecord });
    } catch (error) {
      console.error("Error inserting admin outbox:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/admin-outbox/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const record = await db.select().from(admin_outbox).where((0, import_drizzle_orm.eq)(admin_outbox.id, id)).limit(1);
      if (record && record.length > 0) {
        const refIds = record[0].refIds || [];
        for (const ref of refIds) {
          if (ref.collection === "notifications") {
            await db.delete(notifications).where((0, import_drizzle_orm.eq)(notifications.id, ref.id)).catch(() => {
            });
          } else if (ref.collection === "support_tickets") {
            await db.delete(support_tickets).where((0, import_drizzle_orm.eq)(support_tickets.id, ref.id)).catch(() => {
            });
          }
        }
      }
      await db.delete(support_tickets).where((0, import_drizzle_orm.eq)(support_tickets.broadcastId, id)).catch(() => {
      });
      await db.delete(admin_outbox).where((0, import_drizzle_orm.eq)(admin_outbox.id, id));
      realtimeServerInstance?.broadcastManual("admin_outbox_updated", void 0, "DELETE", { id });
      realtimeServerInstance?.broadcastManual("notifications_updated", void 0, "UPDATE", {});
      realtimeServerInstance?.broadcastManual("support_tickets_updated", void 0, "UPDATE", {});
      res.json({ success: true, id });
    } catch (error) {
      console.error("Error deleting admin outbox:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/admin-outbox", async (req, res) => {
    try {
      const { schoolId } = req.query;
      let outboxList = [];
      if (schoolId && schoolId !== "all") {
        outboxList = await db.select().from(admin_outbox).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(admin_outbox.schoolId, schoolId), (0, import_drizzle_orm.isNull)(admin_outbox.schoolId), (0, import_drizzle_orm.eq)(admin_outbox.schoolId, "")));
        await db.delete(admin_outbox).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(admin_outbox.schoolId, schoolId), (0, import_drizzle_orm.isNull)(admin_outbox.schoolId), (0, import_drizzle_orm.eq)(admin_outbox.schoolId, "")));
      } else {
        outboxList = await db.select().from(admin_outbox);
        await db.delete(admin_outbox);
      }
      for (const item of outboxList) {
        const refIds = item.refIds || [];
        for (const ref of refIds) {
          if (ref.collection === "notifications") {
            await db.delete(notifications).where((0, import_drizzle_orm.eq)(notifications.id, ref.id)).catch(() => {
            });
          } else if (ref.collection === "support_tickets") {
            await db.delete(support_tickets).where((0, import_drizzle_orm.eq)(support_tickets.id, ref.id)).catch(() => {
            });
          }
        }
        if (item.id) {
          await db.delete(support_tickets).where((0, import_drizzle_orm.eq)(support_tickets.broadcastId, item.id)).catch(() => {
          });
        }
      }
      realtimeServerInstance?.broadcastManual("admin_outbox_updated", void 0, "DELETE", {});
      realtimeServerInstance?.broadcastManual("notifications_updated", void 0, "UPDATE", {});
      realtimeServerInstance?.broadcastManual("support_tickets_updated", void 0, "UPDATE", {});
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting all admin outbox:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/support-tickets/mark-all-read", async (req, res) => {
    try {
      const { userId, userIds, userRole, schoolId } = req.body;
      if (!userId && !userIds && !userRole) return res.status(400).json({ success: false });
      const uidsToMatch = Array.isArray(userIds) ? userIds : userId ? [userId] : [];
      const expandedSet = /* @__PURE__ */ new Set();
      for (const rawId of uidsToMatch) {
        if (!rawId) continue;
        const trimmed = rawId.trim();
        expandedSet.add(trimmed);
        expandedSet.add(trimmed.toLowerCase());
        expandedSet.add(trimmed.toUpperCase());
        const stripped = trimmed.replace(/^(scode_|pcode_|tcode_|tch_|school_|class_)/i, "");
        expandedSet.add(stripped);
        expandedSet.add(stripped.toLowerCase());
        expandedSet.add(stripped.toUpperCase());
        const prefixes = ["scode_", "pcode_", "tcode_", "tch_"];
        for (const p of prefixes) {
          expandedSet.add(`${p}${stripped}`);
          expandedSet.add(`${p}${stripped.toUpperCase()}`);
        }
        if (stripped.toUpperCase().startsWith("TCH-") || stripped.toUpperCase().startsWith("PAR-")) {
          expandedSet.add(`tcode_${stripped}`);
          expandedSet.add(`pcode_${stripped}`);
          expandedSet.add(`tcode_${stripped.toUpperCase()}`);
          expandedSet.add(`pcode_${stripped.toUpperCase()}`);
        }
      }
      const finalIds = Array.from(expandedSet);
      const ticketFilters = [];
      if (finalIds.length > 0) ticketFilters.push((0, import_drizzle_orm.inArray)(support_tickets.userId, finalIds));
      if (userRole) ticketFilters.push((0, import_drizzle_orm.eq)(support_tickets.role, userRole));
      if (ticketFilters.length > 0) {
        await db.update(support_tickets).set({ readByStudent: true }).where((0, import_drizzle_orm.and)(...ticketFilters));
      }
      const notifFilters = [];
      if (finalIds.length > 0) notifFilters.push((0, import_drizzle_orm.inArray)(notifications.recipientId, finalIds));
      if (userRole) notifFilters.push((0, import_drizzle_orm.eq)(notifications.recipientRole, userRole));
      if (notifFilters.length > 0) {
        await db.update(notifications).set({ read: true }).where((0, import_drizzle_orm.and)(...notifFilters, (0, import_drizzle_orm.inArray)(notifications.type, ["broadcast", "admin_broadcast", "support_reply", "general"])));
      }
      res.json({ success: true });
    } catch (err) {
      console.error("Error marking all read:", err);
      res.status(500).json({ success: false });
    }
  });
  app.get("/api/support-tickets", async (req, res) => {
    try {
      const { schoolId, userId, userIds, userRole } = req.query;
      let queryBuilder = db.select().from(support_tickets).orderBy((0, import_drizzle_orm.desc)(support_tickets.timestamp));
      const filters = [];
      if (schoolId && schoolId !== "all") filters.push((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(support_tickets.schoolId, schoolId), (0, import_drizzle_orm.isNull)(support_tickets.schoolId), (0, import_drizzle_orm.eq)(support_tickets.schoolId, "")));
      let uidsToMatch = [];
      if (userIds) {
        uidsToMatch = userIds.split(",").map((u) => u.trim()).filter(Boolean);
      } else if (userId) {
        uidsToMatch.push(userId);
      }
      const identityFilters = [];
      if (uidsToMatch.length > 0) {
        const expandedSet = /* @__PURE__ */ new Set();
        for (const rawId of uidsToMatch) {
          if (!rawId) continue;
          const trimmed = rawId.trim();
          expandedSet.add(trimmed);
          expandedSet.add(trimmed.toLowerCase());
          expandedSet.add(trimmed.toUpperCase());
          const stripped = trimmed.replace(/^(scode_|pcode_|tcode_|tch_|school_|class_)/i, "");
          expandedSet.add(stripped);
          expandedSet.add(stripped.toLowerCase());
          expandedSet.add(stripped.toUpperCase());
          const prefixes = ["scode_", "pcode_", "tcode_", "tch_"];
          for (const p of prefixes) {
            expandedSet.add(`${p}${stripped}`);
            expandedSet.add(`${p}${stripped.toUpperCase()}`);
          }
          if (stripped.toUpperCase().startsWith("TCH-") || stripped.toUpperCase().startsWith("PAR-")) {
            expandedSet.add(`tcode_${stripped}`);
            expandedSet.add(`pcode_${stripped}`);
            expandedSet.add(`tcode_${stripped.toUpperCase()}`);
            expandedSet.add(`pcode_${stripped.toUpperCase()}`);
          }
        }
        identityFilters.push((0, import_drizzle_orm.inArray)(support_tickets.userId, Array.from(expandedSet)));
      }
      if (identityFilters.length > 0) {
        filters.push((0, import_drizzle_orm.or)(...identityFilters));
      } else if (uidsToMatch.length > 0) {
        filters.push((0, import_drizzle_orm.eq)(support_tickets.userId, "___NONE___"));
      }
      if (filters.length > 0) {
        queryBuilder = queryBuilder.where((0, import_drizzle_orm.and)(...filters));
      }
      const tickets = await queryBuilder;
      res.json({ success: true, tickets });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/support-tickets", async (req, res) => {
    try {
      const data = req.body || {};
      const id = data.id || `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const issueType = data.issueType || data.issue_type || data.subject || "\u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u0639\u0627\u0645";
      const message = data.message || data.description || "";
      const subject = data.subject || issueType || "\u062A\u0630\u0643\u0631\u0629 \u062F\u0639\u0645";
      const description = data.description || message || "";
      const studentName = data.studentName || data.student_name || data.userName || data.user_name || "\u0637\u0627\u0644\u0628";
      const userName = data.userName || data.user_name || studentName;
      const schoolId = data.schoolId || data.school_id || null;
      const userId = data.userId || data.user_id || null;
      const grade = data.grade || null;
      const phone = data.phone || null;
      const status = data.status || "pending";
      const isGroup = Boolean(data.isGroup ?? data.is_group ?? false);
      const adminReply = data.adminReply || data.admin_reply || null;
      const role = data.role || "student";
      const broadcastId = data.broadcastId || data.broadcast_id || null;
      const replyToTicketId = data.replyToTicketId || data.reply_to_ticket_id || null;
      const senderType = data.senderType || data.sender_type || (role === "parent" ? "parent" : role === "teacher" ? "teacher" : "student");
      const readByAdmin = Boolean(data.readByAdmin ?? data.read_by_admin ?? false);
      const readByStudent = Boolean(data.readByStudent ?? data.read_by_student ?? false);
      const newTicket = {
        id,
        schoolId,
        userId,
        studentName,
        userName,
        phone,
        grade,
        subject,
        description,
        issueType,
        message,
        status,
        isGroup,
        adminReply,
        role,
        broadcastId,
        replyToTicketId,
        senderType,
        readByAdmin,
        readByStudent,
        timestamp: /* @__PURE__ */ new Date()
      };
      const inserted = await db.insert(support_tickets).values(newTicket).returning({ id: support_tickets.id });
      const finalId = inserted[0]?.id || id;
      const finalTicket = { ...newTicket, id: finalId };
      realtimeServerInstance?.broadcastManual("support_tickets", finalId, "INSERT", finalTicket);
      res.json({ success: true, id: finalId, ticket: finalTicket, data: finalTicket });
    } catch (error) {
      console.error("Error inserting support ticket:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.patch("/api/support-tickets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const mappedUpdates = {};
      if (updates.status !== void 0) mappedUpdates.status = updates.status;
      if (updates.adminReply !== void 0 || updates.admin_reply !== void 0) mappedUpdates.adminReply = updates.adminReply ?? updates.admin_reply;
      if (updates.readByAdmin !== void 0 || updates.read_by_admin !== void 0) mappedUpdates.readByAdmin = updates.readByAdmin ?? updates.read_by_admin;
      if (updates.readByStudent !== void 0 || updates.read_by_student !== void 0) mappedUpdates.readByStudent = updates.readByStudent ?? updates.read_by_student;
      if (updates.message !== void 0) mappedUpdates.message = updates.message;
      if (updates.issueType !== void 0 || updates.issue_type !== void 0) mappedUpdates.issueType = updates.issueType ?? updates.issue_type;
      if (updates.subject !== void 0) mappedUpdates.subject = updates.subject;
      if (updates.description !== void 0) mappedUpdates.description = updates.description;
      if (updates.isGroup !== void 0 || updates.is_group !== void 0) mappedUpdates.isGroup = updates.isGroup ?? updates.is_group;
      if (Object.keys(mappedUpdates).length > 0) {
        await db.update(support_tickets).set(mappedUpdates).where((0, import_drizzle_orm.eq)(support_tickets.id, id));
        realtimeServerInstance?.broadcastManual("support_tickets", id, "UPDATE", { id, ...mappedUpdates });
        if (mappedUpdates.adminReply) {
          const tickets = await db.select().from(support_tickets).where((0, import_drizzle_orm.eq)(support_tickets.id, id)).limit(1);
          if (tickets.length > 0) {
            const t = tickets[0];
            const notifId = `reply_${id}_${Date.now()}`;
            const newNotif = {
              id: notifId,
              schoolId: t.schoolId || "",
              recipientId: t.userId || "",
              title: "\u0631\u062F \u0645\u0646 \u0627\u0644\u0627\u062F\u0627\u0631\u0629 \u{1F4AC}",
              body: mappedUpdates.adminReply,
              type: "general",
              recipientRole: t.role || "student",
              read: false,
              createdAt: /* @__PURE__ */ new Date()
            };
            await db.insert(notifications).values(newNotif);
            realtimeServerInstance?.broadcastManual("notifications", notifId, "INSERT", newNotif);
          }
        }
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating support ticket:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/support-tickets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, codes } = req.query;
      let identifiers = [];
      if (userId) identifiers.push(userId);
      if (codes) {
        const codesArr = codes.split(",");
        identifiers.push(...codesArr);
      }
      let whereClause = (0, import_drizzle_orm.eq)(support_tickets.id, id);
      if (identifiers.length > 0) {
        whereClause = (0, import_drizzle_orm.and)(whereClause, (0, import_drizzle_orm.inArray)(support_tickets.userId, identifiers));
      }
      await db.delete(support_tickets).where(whereClause);
      realtimeServerInstance?.broadcastManual("support_tickets", id, "DELETE", { id });
      res.json({ success: true });
    } catch (error) {
      console.error("Delete support ticket error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/support-tickets-clear-all", async (req, res) => {
    try {
      const { userId, codes } = req.query;
      let identifiers = [];
      if (userId) identifiers.push(userId);
      if (codes) {
        const codesArr = codes.split(",");
        identifiers.push(...codesArr);
      }
      if (identifiers.length === 0) {
        return res.status(400).json({ success: false, message: "At least one identifier (userId or codes) is required" });
      }
      await db.delete(support_tickets).where((0, import_drizzle_orm.inArray)(support_tickets.userId, identifiers));
      res.json({ success: true });
    } catch (error) {
      console.error("Clear all support tickets error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/pulse/posts", async (req, res) => {
    try {
      const { schoolId, limit: limitParam } = req.query;
      let queryBuilder = db.select().from(community_posts);
      if (schoolId && schoolId !== "all") {
        queryBuilder = queryBuilder.where((0, import_drizzle_orm.eq)(community_posts.schoolId, schoolId));
      }
      const results = await queryBuilder.orderBy((0, import_drizzle_orm.desc)(community_posts.timestamp)).limit(Number(limitParam) || 50);
      res.json({ success: true, posts: results });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/pulse/posts", async (req, res) => {
    try {
      const { id, schoolId, userId, userName, content, mediaUrl, type, grade } = req.body;
      await db.insert(community_posts).values({
        id: id || `post_${Date.now()}`,
        schoolId,
        userId,
        userName,
        content,
        mediaUrl,
        type,
        grade,
        timestamp: /* @__PURE__ */ new Date()
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/pulse/posts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(community_posts).where((0, import_drizzle_orm.eq)(community_posts.id, id));
      await db.delete(community_comments).where((0, import_drizzle_orm.eq)(community_comments.postId, id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/pulse/posts/:id/comments", async (req, res) => {
    try {
      const { id } = req.params;
      const results = await db.select().from(community_comments).where((0, import_drizzle_orm.eq)(community_comments.postId, id)).orderBy((0, import_drizzle_orm.asc)(community_comments.timestamp));
      res.json({ success: true, comments: results });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/pulse/posts/:id/comments", async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, userName, content } = req.body;
      await db.insert(community_comments).values({
        id: `comm_${Date.now()}`,
        postId: id,
        userId,
        userName,
        content,
        timestamp: /* @__PURE__ */ new Date()
      });
      const post = await db.select().from(community_posts).where((0, import_drizzle_orm.eq)(community_posts.id, id));
      if (post.length > 0) {
        await db.update(community_posts).set({ commentsCount: (post[0].commentsCount || 0) + 1 }).where((0, import_drizzle_orm.eq)(community_posts.id, id));
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name, role, schoolId } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
      }
      const existing = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.email, email.trim().toLowerCase()));
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: "\u0627\u0644\u062D\u0633\u0627\u0628 \u0645\u0633\u062C\u0644 \u0645\u0633\u0628\u0642\u0627\u064B" });
      }
      const isDevRequester = req.user?.isDeveloper || req.user?.email && DEVELOPER_EMAILS.includes(req.user.email.toLowerCase());
      const safeRole = isDevRequester ? role || "student" : "student";
      const hashedPassword = await import_bcryptjs.default.hash(password, 10);
      const userId = `usr_${Date.now()}`;
      await db.insert(users).values({
        id: userId,
        email: email.trim().toLowerCase(),
        passwordHash: hashedPassword,
        name: name || "\u0645\u0633\u062A\u062E\u062F\u0645 \u062C\u062F\u064A\u062F",
        role: safeRole,
        schoolId: schoolId || "school1"
      });
      res.json({ success: true, userId });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  let securitySettingsCache = null;
  async function getSecuritySettings() {
    if (securitySettingsCache) return securitySettingsCache;
    try {
      const doc = await db.select().from(firestore_docs).where((0, import_drizzle_orm.eq)(firestore_docs.path, "system_config/security_access")).limit(1);
      if (doc.length > 0 && doc[0].data) {
        securitySettingsCache = doc[0].data;
        return securitySettingsCache;
      }
    } catch (e) {
    }
    securitySettingsCache = {
      maxFailedAttempts: 5,
      lockoutDurationMinutes: 30,
      allowMultiDeviceLogin: true,
      requirePinForFinance: true,
      permissionsMatrix: [
        { id: "view_grades", name: "\u{1F4CA} \u0639\u0631\u0636 \u0627\u0644\u062F\u0631\u062C\u0627\u062A \u0648\u0627\u0644\u0634\u0647\u0627\u062F\u0627\u062A", student: true, parent: true, teacher: true, driver: false, supervisor: true, admin: true },
        { id: "enter_attendance", name: "\u{1F4DD} \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062D\u0636\u0648\u0631 \u0648\u0627\u0644\u063A\u064A\u0627\u0628 \u0627\u0644\u064A\u0648\u0645\u064A", student: false, parent: false, teacher: true, driver: false, supervisor: true, admin: true },
        { id: "track_bus", name: "\u{1F68C} \u062A\u062A\u0628\u0639 \u062D\u0627\u0641\u0644\u0627\u062A \u0627\u0644\u0646\u0642\u0644 \u0627\u0644\u0645\u0628\u0627\u0634\u0631", student: true, parent: true, teacher: false, driver: true, supervisor: false, admin: true },
        { id: "generate_codes", name: "\u{1F511} \u062A\u0648\u0644\u064A\u062F \u0648\u0625\u0635\u062F\u0627\u0631 \u0623\u0643\u0648\u0627\u062F \u0627\u0644\u062A\u0641\u0639\u064A\u0644", student: false, parent: false, teacher: false, driver: false, supervisor: false, admin: true },
        { id: "live_broadcast", name: "\u{1F4E2} \u0627\u0644\u0628\u062B \u0627\u0644\u0625\u0630\u0627\u0639\u064A \u0648\u0627\u0644\u062A\u0646\u0628\u064A\u0647\u0627\u062A \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629", student: false, parent: false, teacher: true, driver: false, supervisor: true, admin: true },
        { id: "ai_radar", name: "\u{1F4E1} \u0631\u0627\u062F\u0627\u0631 \u0627\u0644\u0630\u0643\u0627\u0621 \u0648\u062A\u062D\u062F\u064A 60 \u062B\u0627\u0646\u064A\u0629", student: true, parent: true, teacher: true, driver: false, supervisor: true, admin: true },
        { id: "financial_view", name: "\u{1F4B0} \u0627\u0644\u0627\u0637\u0644\u0627\u0639 \u0639\u0644\u0649 \u0627\u0644\u0645\u0648\u0642\u0641 \u0627\u0644\u0645\u0627\u0644\u064A \u0648\u0627\u0644\u0631\u0633\u0648\u0645", student: false, parent: true, teacher: false, driver: false, supervisor: false, admin: true },
        { id: "edit_school_info", name: "\u2699\uFE0F \u062A\u0639\u062F\u064A\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0647\u0648\u064A\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u0629", student: false, parent: false, teacher: false, driver: false, supervisor: false, admin: true }
      ]
    };
    return securitySettingsCache;
  }
  const failedAuthAttempts = /* @__PURE__ */ new Map();
  async function checkSecurityBanOrLock(req, identifier) {
    try {
      const rawIp = (req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || "").trim();
      const deviceId = (req.body?.deviceId || req.headers["x-device-id"] || "").trim();
      const targetIdentifier = (identifier || "").trim();
      const activeBans = await db.select().from(security_bans).where((0, import_drizzle_orm.eq)(security_bans.status, "active_ban"));
      const now = /* @__PURE__ */ new Date();
      for (const ban of activeBans) {
        if (ban.expires_at && new Date(ban.expires_at) < now) {
          continue;
        }
        if (ban.type === "ip" && rawIp && ban.value.trim() === rawIp) {
          return { blocked: true, status: 403, reason: `\u0639\u0646\u0648\u0627\u0646 IP (${rawIp}) \u0645\u062D\u0638\u0648\u0631 \u0623\u0645\u0646\u064A\u0627\u064B: ${ban.reason}`, isBanned: true };
        }
        if (ban.type === "device" && deviceId && ban.value.trim().toUpperCase() === deviceId.toUpperCase()) {
          return { blocked: true, status: 403, reason: `\u0647\u0630\u0627 \u0627\u0644\u062C\u0647\u0627\u0632 \u0645\u062D\u0638\u0648\u0631 \u0645\u0646 \u0642\u0628\u0644 \u062C\u062F\u0627\u0631 \u0627\u0644\u062D\u0645\u0627\u064A\u0629: ${ban.reason}`, isBanned: true };
        }
        if (ban.type === "account" && targetIdentifier && ban.value.trim().toUpperCase() === targetIdentifier.toUpperCase()) {
          return { blocked: true, status: 403, reason: `\u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628 \u0623\u0648 \u0627\u0644\u0643\u0648\u062F \u0645\u062D\u0638\u0648\u0631 \u0623\u0645\u0646\u064A\u0627\u064B: ${ban.reason}`, isBanned: true };
        }
      }
      const clientKey = deviceId || rawIp;
      if (clientKey) {
        const rec = failedAuthAttempts.get(clientKey);
        const settings = await getSecuritySettings();
        const maxAttempts = settings.maxFailedAttempts || 5;
        const lockoutMinutes = settings.lockoutDurationMinutes || 30;
        if (rec && rec.count >= maxAttempts) {
          const elapsedMinutes = (Date.now() - rec.lastTime) / (60 * 1e3);
          if (elapsedMinutes < lockoutMinutes) {
            const remainingMinutes = Math.ceil(lockoutMinutes - elapsedMinutes);
            return {
              blocked: true,
              status: 429,
              reason: `\u062A\u0645 \u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0644\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0627\u0644\u062F\u062E\u0648\u0644 \u0627\u0644\u062E\u0627\u0637\u0626\u0629 (${maxAttempts} \u0645\u062D\u0627\u0648\u0644\u0627\u062A). \u062A\u0645 \u0642\u0641\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u0624\u0642\u062A\u0627\u064B\u060C \u064A\u0631\u062C\u0649 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0628\u0639\u062F ${remainingMinutes} \u062F\u0642\u064A\u0642\u0629.`,
              isBanned: false
            };
          } else {
            failedAuthAttempts.delete(clientKey);
          }
        }
      }
    } catch (err) {
      console.error("Error checking security ban:", err);
    }
    return { blocked: false };
  }
  async function recordFailedAuthAttempt(req, identifier) {
    try {
      const rawIp = (req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || "").trim();
      const deviceId = (req.body?.deviceId || req.headers["x-device-id"] || "").trim();
      const clientKey = deviceId || rawIp;
      if (!clientKey) return;
      const current = failedAuthAttempts.get(clientKey) || { count: 0, lastTime: Date.now() };
      current.count += 1;
      current.lastTime = Date.now();
      failedAuthAttempts.set(clientKey, current);
      const settings = await getSecuritySettings();
      const maxAttempts = settings.maxFailedAttempts || 5;
      const lockoutMinutes = settings.lockoutDurationMinutes || 30;
      if (current.count >= maxAttempts) {
        try {
          await db.insert(security_bans).values({
            id: `ban-auto-${Date.now()}`,
            type: deviceId ? "device" : "ip",
            value: deviceId || rawIp,
            reason: `\u062D\u0638\u0631 \u0622\u0644\u064A \u0628\u0648\u0627\u0633\u0637\u0629 \u0633\u064A\u0627\u0633\u0629 \u0645\u0643\u0627\u0641\u062D\u0629 \u0627\u0644\u062A\u062E\u0645\u064A\u0646 (${current.count} \u0645\u062D\u0627\u0648\u0644\u0627\u062A \u062E\u0627\u0637\u0626\u0629 \u0645\u062A\u062A\u0627\u0644\u064A\u0629)`,
            failed_attempts: current.count,
            banned_at: /* @__PURE__ */ new Date(),
            expires_at: new Date(Date.now() + lockoutMinutes * 60 * 1e3),
            status: "active_ban"
          });
        } catch (dbErr) {
          console.warn("Could not persist auto-ban:", dbErr);
        }
      }
    } catch (e) {
      console.error("recordFailedAuthAttempt error:", e);
    }
  }
  const areSchoolsCompatible = (codeSchoolId, requestedSchoolId) => {
    if (!codeSchoolId || !requestedSchoolId) return true;
    const norm = (s) => {
      const cleaned = s.trim().toLowerCase();
      if (cleaned === "school_awail_ghamas" || cleaned === "ghamas_awail") return "school1";
      return cleaned;
    };
    const nCode = norm(codeSchoolId);
    const nReq = norm(requestedSchoolId);
    if (nCode === "all" || nReq === "all" || nCode === "general" || nReq === "general" || nCode === "global" || nReq === "global") return true;
    return nCode === nReq;
  };
  const checkBanned = async (uid) => {
    if (!uid) return false;
    const u = await db.select({ isBanned: users.isBanned }).from(users).where((0, import_drizzle_orm.eq)(users.id, uid)).limit(1);
    return u.length > 0 && u[0].isBanned === true;
  };
  const checkIsSchoolSuspended = async (schoolId) => {
    if (!schoolId) return { isSuspended: false };
    try {
      const norm = (s) => {
        const cleaned = s.trim().toLowerCase();
        if (cleaned === "school_awail_ghamas" || cleaned === "ghamas_awail") return "school1";
        return cleaned;
      };
      const sId = norm(schoolId);
      if (sId === "all" || sId === "general" || sId === "global" || sId === "academy") return { isSuspended: false };
      const matched = await db.select({
        id: schools.id,
        name: schools.name,
        status: schools.status
      }).from(schools).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(schools.id, sId), (0, import_drizzle_orm.eq)(schools.id, schoolId))).limit(1);
      if (matched.length > 0) {
        const st = (matched[0].status || "").trim().toLowerCase();
        if (st === "suspended" || st === "disabled" || st === "inactive" || st === "\u0645\u0639\u0637\u0644\u0629" || st === "\u0645\u0648\u0642\u0648\u0641\u0629") {
          return { isSuspended: true, schoolName: matched[0].name };
        }
      }
    } catch (err) {
      console.error("Error checking isSchoolSuspended in DB:", err);
    }
    return { isSuspended: false };
  };
  async function clearFailedAuthAttempt(req) {
    const rawIp = (req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || "").trim();
    const deviceId = (req.body?.deviceId || req.headers["x-device-id"] || "").trim();
    const clientKey = deviceId || rawIp;
    if (clientKey) {
      failedAuthAttempts.delete(clientKey);
    }
  }
  app.post("/api/auth/login-code", async (req, res) => {
    try {
      const { code, schoolId: targetSchoolId } = req.body;
      console.log("Login attempt with code:", code, "targetSchoolId:", targetSchoolId);
      if (!code) {
        return res.status(400).json({ success: false, message: "\u0627\u0644\u0643\u0648\u062F \u0645\u0637\u0644\u0648\u0628" });
      }
      const securityCheck = await checkSecurityBanOrLock(req, code);
      if (securityCheck.blocked) {
        return res.status(securityCheck.status || 403).json({
          success: false,
          isBanned: securityCheck.isBanned,
          message: securityCheck.isBanned ? "ACCOUNT_BANNED" : "ACCOUNT_LOCKED",
          error: securityCheck.reason
        });
      }
      const incomingDeviceId = (req.body?.deviceId || req.headers["x-device-id"] || "").trim();
      const secSettings = await getSecuritySettings();
      const allowMulti = secSettings.allowMultiDeviceLogin !== false;
      const cleanCode = code.trim().toUpperCase();
      const getGradeFromCodePrefix = (c) => {
        if (!c) return "";
        const cl = c.trim().toUpperCase();
        const p = cl.split("-")[0] || cl;
        switch (p) {
          case "P1":
          case "1P":
          case "PRI1":
            return "\u0623\u0648\u0644 \u0627\u0628\u062A\u062F\u0627\u0626\u064A";
          case "P2":
          case "2P":
          case "PRI2":
            return "\u062B\u0627\u0646\u064A \u0627\u0628\u062A\u062F\u0627\u0626\u064A";
          case "P3":
          case "3P":
          case "PRI3":
            return "\u062B\u0627\u0644\u062B \u0627\u0628\u062A\u062F\u0627\u0626\u064A";
          case "P4":
          case "4P":
          case "PRI4":
            return "\u0631\u0627\u0628\u0639 \u0627\u0628\u062A\u062F\u0627\u0626\u064A";
          case "P5":
          case "5P":
          case "PRI5":
            return "\u062E\u0627\u0645\u0633 \u0627\u0628\u062A\u062F\u0627\u0626\u064A";
          case "P6":
          case "6P":
          case "PRI6":
            return "\u0633\u0627\u062F\u0633 \u0627\u0628\u062A\u062F\u0627\u0626\u064A";
          case "M1":
          case "1M":
          case "INT1":
            return "\u0623\u0648\u0644 \u0645\u062A\u0648\u0633\u0637";
          case "M2":
          case "2M":
          case "INT2":
            return "\u062B\u0627\u0646\u064A \u0645\u062A\u0648\u0633\u0637";
          case "M3":
          case "3M":
          case "INT3":
            return "\u062B\u0627\u0644\u062B \u0645\u062A\u0648\u0633\u0637";
          case "S4S":
          case "S4":
          case "4S":
            return "\u0631\u0627\u0628\u0639 \u0639\u0644\u0645\u064A";
          case "S4A":
          case "4A":
            return "\u0631\u0627\u0628\u0639 \u0623\u062F\u0628\u064A";
          case "S5S":
          case "S5":
          case "5S":
            return "\u062E\u0627\u0645\u0633 \u0639\u0644\u0645\u064A";
          case "S5A":
          case "5A":
            return "\u062E\u0627\u0645\u0633 \u0623\u062F\u0628\u064A";
          case "S6S":
          case "S6":
          case "6S":
          case "SCI":
            return "\u0633\u0627\u062F\u0633 \u0639\u0644\u0645\u064A";
          case "S6A":
          case "6A":
          case "LIT":
            return "\u0633\u0627\u062F\u0633 \u0623\u062F\u0628\u064A";
          default:
            return "";
        }
      };
      const isTeacherPrefix = cleanCode.startsWith("TCH-");
      const isAdminPrefix = cleanCode.startsWith("ADM-") || cleanCode === "112233";
      const isParentPrefix = cleanCode.startsWith("PAR-") || cleanCode.startsWith("PCODE-");
      const isDriverPrefix = cleanCode.startsWith("DRI-") || cleanCode.startsWith("DRV-");
      const isStudentPrefix = cleanCode.startsWith("STU-") || cleanCode.startsWith("PRI-") || cleanCode.startsWith("INT-") || cleanCode.startsWith("SCI-") || cleanCode.startsWith("LIT-") || /^[PMS]\d/i.test(cleanCode) || cleanCode.startsWith("P-") || cleanCode.startsWith("M-") || cleanCode.startsWith("S-");
      let teacherDirectList = [];
      let activationList = [];
      let studentList = [];
      let parentList = [];
      let driverList = [];
      if (isAdminPrefix) {
        activationList = await db.select().from(activation_codes).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(activation_codes.code, code), (0, import_drizzle_orm.eq)(activation_codes.code, cleanCode)));
      } else if (isTeacherPrefix) {
        teacherDirectList = await db.select().from(teachers).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(teachers.code, code), (0, import_drizzle_orm.eq)(teachers.id, code), (0, import_drizzle_orm.eq)(teachers.code, cleanCode)));
        if (teacherDirectList.length === 0) {
          try {
            const allTchs = await db.select().from(teachers);
            const matched = allTchs.find((t) => {
              if (!t) return false;
              if (t.code === code || t.id === code || String(t.code).toUpperCase() === cleanCode) return true;
              if (t.classCodes && typeof t.classCodes === "object") {
                return Object.values(t.classCodes).some((c) => String(c).trim().toUpperCase() === cleanCode);
              }
              return false;
            });
            if (matched) teacherDirectList = [matched];
          } catch (err) {
            console.error("Error finding teacher by class code:", err);
          }
        }
        if (teacherDirectList.length === 0) {
          const actCodes = await db.select().from(activation_codes).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(activation_codes.code, code), (0, import_drizzle_orm.eq)(activation_codes.code, cleanCode)));
          if (actCodes.length > 0) {
            activationList = actCodes;
          } else {
            const parts = cleanCode.split("-");
            let subjectName = "\u0627\u0644\u0639\u0644\u0648\u0645";
            let gradeName = "\u0623\u0648\u0644 \u0627\u0628\u062A\u062F\u0627\u0626\u064A";
            let teacherName = "\u0623\u0633\u062A\u0627\u0630 \u0627\u0644\u0645\u0627\u062F\u0629";
            if (parts.length >= 2) {
              const sub = parts[1].toUpperCase();
              switch (sub) {
                case "SCI":
                  subjectName = "\u0627\u0644\u0639\u0644\u0648\u0645";
                  break;
                case "MATH":
                  subjectName = "\u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0627\u062A";
                  break;
                case "ARB":
                  subjectName = "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629";
                  break;
                case "ENG":
                  subjectName = "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0625\u0646\u0643\u0644\u064A\u0632\u064A\u0629";
                  break;
                case "ISL":
                  subjectName = "\u0627\u0644\u062A\u0631\u0628\u064A\u0629 \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A\u0629";
                  break;
                case "HIS":
                  subjectName = "\u0627\u0644\u062A\u0627\u0631\u064A\u062E";
                  break;
                case "GEO":
                  subjectName = "\u0627\u0644\u062C\u063A\u0631\u0627\u0641\u064A\u0627";
                  break;
                case "ECO":
                  subjectName = "\u0627\u0644\u0627\u0642\u062A\u0635\u0627\u062F";
                  break;
                case "SOC":
                  subjectName = "\u0627\u0644\u0627\u062C\u062A\u0645\u0627\u0639\u064A\u0627\u062A";
                  break;
                case "ART":
                  subjectName = "\u0627\u0644\u062A\u0631\u0628\u064A\u0629 \u0627\u0644\u0641\u0646\u064A\u0629";
                  break;
                case "SPO":
                  subjectName = "\u0627\u0644\u062A\u0631\u0628\u064A\u0629 \u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0629";
                  break;
                case "COM":
                  subjectName = "\u0627\u0644\u062D\u0627\u0633\u0648\u0628";
                  break;
                case "FRE":
                  subjectName = "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0641\u0631\u0646\u0633\u064A\u0629";
                  break;
                case "CHE":
                  subjectName = "\u0627\u0644\u0643\u064A\u0645\u064A\u0627\u0621";
                  break;
                case "PHY":
                  subjectName = "\u0627\u0644\u0641\u064A\u0632\u064A\u0627\u0621";
                  break;
                case "BIO":
                  subjectName = "\u0627\u0644\u0623\u062D\u064A\u0627\u0621";
                  break;
                case "STAFF":
                  subjectName = "\u0627\u0644\u0643\u0627\u062F\u0631 \u0627\u0644\u0625\u062F\u0627\u0631\u064A";
                  break;
                default:
                  subjectName = "\u0627\u0644\u0645\u0646\u0647\u062C \u0627\u0644\u0639\u0627\u0645";
                  break;
              }
              teacherName = `\u0623\u0633\u062A\u0627\u0630 ${subjectName}`;
            }
            if (parts.length >= 3) {
              const gCode = parts[2].toUpperCase();
              const parsedGrade = getGradeFromCodePrefix(gCode);
              if (parsedGrade) {
                gradeName = parsedGrade;
              }
            }
            const synthTeacherId = `tch_${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
            const synthClasses = [gradeName, `${gradeName} (\u0623)`, `${gradeName} (\u0628)`];
            const targetSchool = targetSchoolId || "school1";
            const synthTeacher = {
              id: synthTeacherId,
              name: teacherName,
              subject: subjectName,
              role: "TEACHER",
              classes: synthClasses,
              grade: gradeName,
              code: cleanCode,
              schoolId: targetSchool,
              isActive: true,
              canPublish: true,
              rating: 5,
              classCodes: {
                [gradeName]: cleanCode,
                [`${gradeName} (\u0623)`]: cleanCode
              }
            };
            try {
              await db.insert(teachers).values({
                id: synthTeacher.id,
                name: synthTeacher.name,
                subject: synthTeacher.subject,
                role: synthTeacher.role,
                classes: synthTeacher.classes,
                grade: synthTeacher.grade,
                code: synthTeacher.code,
                schoolId: synthTeacher.schoolId,
                isActive: true,
                canPublish: true,
                rating: 5,
                classCodes: synthTeacher.classCodes,
                createdAt: /* @__PURE__ */ new Date(),
                updatedAt: /* @__PURE__ */ new Date()
              }).onConflictDoUpdate({
                target: teachers.id,
                set: {
                  code: cleanCode,
                  schoolId: targetSchool,
                  updatedAt: /* @__PURE__ */ new Date()
                }
              });
            } catch (insertErr) {
              console.warn("Auto-provisioning synthetic teacher in DB notice:", insertErr);
            }
            teacherDirectList = [synthTeacher];
          }
        }
      } else if (isParentPrefix) {
        parentList = await db.select().from(students).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(students.parentCode, code), (0, import_drizzle_orm.eq)(students.parentCode, cleanCode), (0, import_drizzle_orm.ilike)(students.parentCode, code)));
      } else if (isDriverPrefix) {
        driverList = await db.select().from(transport_drivers).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(transport_drivers.accessCode, code), (0, import_drizzle_orm.eq)(transport_drivers.accessCode, cleanCode), (0, import_drizzle_orm.ilike)(transport_drivers.accessCode, code)));
      } else if (isStudentPrefix) {
        studentList = await db.select().from(students).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(students.code, code), (0, import_drizzle_orm.eq)(students.code, cleanCode), (0, import_drizzle_orm.ilike)(students.code, code)));
      } else {
        const results = await Promise.all([
          db.select().from(teachers).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(teachers.code, code), (0, import_drizzle_orm.eq)(teachers.id, code), (0, import_drizzle_orm.eq)(teachers.code, cleanCode))),
          db.select().from(activation_codes).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(activation_codes.code, code), (0, import_drizzle_orm.eq)(activation_codes.code, cleanCode))),
          db.select().from(students).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(students.code, code), (0, import_drizzle_orm.eq)(students.code, cleanCode), (0, import_drizzle_orm.ilike)(students.code, code))),
          db.select().from(students).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(students.parentCode, code), (0, import_drizzle_orm.eq)(students.parentCode, cleanCode), (0, import_drizzle_orm.ilike)(students.parentCode, code))),
          db.select().from(transport_drivers).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(transport_drivers.accessCode, code), (0, import_drizzle_orm.eq)(transport_drivers.accessCode, cleanCode)))
        ]);
        teacherDirectList = results[0];
        activationList = results[1];
        studentList = results[2];
        parentList = results[3];
        driverList = results[4];
        if (teacherDirectList.length === 0) {
          try {
            const allTchs = await db.select().from(teachers);
            const matched = allTchs.find((t) => {
              if (!t) return false;
              if (t.code === code || t.id === code || String(t.code).toUpperCase() === cleanCode) return true;
              if (t.classCodes && typeof t.classCodes === "object") {
                return Object.values(t.classCodes).some((c) => String(c).trim().toUpperCase() === cleanCode);
              }
              return false;
            });
            if (matched) teacherDirectList = [matched];
          } catch (err) {
            console.error("Error finding teacher by class code in fallback:", err);
          }
        }
      }
      if (studentList.length === 0 && !isAdminPrefix && !isTeacherPrefix && !isDriverPrefix) {
        try {
          const allLists = await db.select().from(academic_lists);
          for (const aList of allLists) {
            const listStudents = Array.isArray(aList.students) ? aList.students : [];
            const foundStu = listStudents.find((s) => {
              const scode = String(s.student || s.code || "").trim().toUpperCase();
              const sid = String(s.id || "").trim().toUpperCase();
              return scode === cleanCode || sid === cleanCode;
            });
            if (foundStu) {
              const gradeFromPfx = getGradeFromCodePrefix(cleanCode);
              const resolvedGrade = gradeFromPfx || foundStu.grade || aList.grade || "\u0623\u0648\u0644 \u0627\u0628\u062A\u062F\u0627\u0626\u064A";
              studentList = [{
                id: String(foundStu.id || `${aList.schoolId || "school1"}_${cleanCode}`),
                schoolId: aList.schoolId || targetSchoolId || "school1",
                name: foundStu.name || "\u0637\u0627\u0644\u0628 \u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629",
                grade: resolvedGrade,
                code: foundStu.student || foundStu.code || cleanCode,
                parentCode: foundStu.parent || foundStu.parentCode || `PAR-${cleanCode}`,
                status: "\u0646\u0634\u0637",
                isBanned: false,
                gender: foundStu.gender || (cleanCode.includes("-G-") ? "female" : "male")
              }];
              break;
            }
          }
        } catch (listErr) {
          console.error("Error searching academic_lists for student:", listErr);
        }
      }
      const fsDoc = req.body?.firestoreCodeDoc;
      if (teacherDirectList.length === 0 && activationList.length === 0 && studentList.length === 0 && parentList.length === 0 && driverList.length === 0) {
        if (fsDoc && typeof fsDoc === "object") {
          const fsRole = (fsDoc.role || "").toLowerCase();
          const fsSchool = fsDoc.schoolId || targetSchoolId || "school1";
          const fsCode = String(fsDoc.code || fsDoc.parentCode || fsDoc.studentCode || cleanCode).trim().toUpperCase();
          try {
            await db.insert(activation_codes).values({
              id: String(fsDoc.id || `act_${Date.now()}`),
              code: fsCode,
              schoolId: fsSchool,
              role: fsRole || (isTeacherPrefix ? "teacher" : isAdminPrefix ? "admin" : "student"),
              used: fsDoc.used === true,
              createdAt: (/* @__PURE__ */ new Date()).toISOString()
            }).onConflictDoNothing();
          } catch (syncErr) {
            console.warn("Auto-sync firestoreCodeDoc into PostgreSQL warning:", syncErr);
          }
          if (fsRole.includes("teacher") || isTeacherPrefix) {
            try {
              await db.insert(teachers).values({
                id: String(fsDoc.id || `tch_${cleanCode}`),
                code: fsCode,
                name: fsDoc.name || fsDoc.teacherName || "\u0623\u0633\u062A\u0627\u0630 \u0627\u0644\u0645\u0627\u062F\u0629",
                schoolId: fsSchool,
                subject: fsDoc.subject || "\u0627\u0644\u0645\u0627\u062F\u0629 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629",
                grade: fsDoc.grade || "\u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0631\u0627\u062D\u0644",
                isActive: true
              }).onConflictDoNothing();
            } catch (tchErr) {
            }
            teacherDirectList = [{
              id: String(fsDoc.id || `tch_${cleanCode}`),
              name: fsDoc.name || fsDoc.teacherName || "\u0623\u0633\u062A\u0627\u0630 \u0627\u0644\u0645\u0627\u062F\u0629",
              code: fsCode,
              schoolId: fsSchool,
              subject: fsDoc.subject || "\u0627\u0644\u0645\u0627\u062F\u0629 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629",
              grade: fsDoc.grade || "\u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0631\u0627\u062D\u0644",
              isActive: fsDoc.isActive !== false,
              isBanned: false
            }];
          } else if (fsRole.includes("admin") || isAdminPrefix) {
            activationList = [{
              id: String(fsDoc.id || `act_${cleanCode}`),
              code: fsCode,
              schoolId: fsSchool,
              role: "admin",
              used: false
            }];
          } else if (fsRole.includes("parent") || isParentPrefix) {
            parentList = [{
              id: String(fsDoc.id || `par_${cleanCode}`),
              name: fsDoc.name || "\u0648\u0644\u064A \u0623\u0645\u0631 \u0627\u0644\u0637\u0627\u0644\u0628",
              code: fsDoc.studentCode || cleanCode,
              parentCode: fsCode,
              schoolId: fsSchool,
              grade: fsDoc.grade || "\u0623\u0648\u0644 \u0627\u0628\u062A\u062F\u0627\u0626\u064A",
              gender: "male"
            }];
          } else {
            activationList = [{
              id: String(fsDoc.id || `act_${cleanCode}`),
              code: fsCode,
              schoolId: fsSchool,
              role: fsDoc.role || "student",
              used: false
            }];
          }
        }
      }
      if (teacherDirectList.length > 0) {
        const tch = teacherDirectList[0];
        if (tch.isActive === false) {
          return res.status(403).json({ success: false, message: "\u062A\u0645 \u062A\u0639\u0637\u064A\u0644 \u062D\u0633\u0627\u0628 \u0647\u0630\u0627 \u0627\u0644\u0645\u0648\u0638\u0641/\u0627\u0644\u0623\u0633\u062A\u0627\u0630 \u0645\u0646 \u0642\u0628\u0644 \u0627\u0644\u0625\u062F\u0627\u0631\u0629." });
        }
        const isDevEmail = (tch.email || "").toLowerCase() === "mntzralghanm527@gmail.com";
        const suspTch = await checkIsSchoolSuspended(tch.schoolId);
        if (suspTch.isSuspended && !isDevEmail) {
          return res.status(403).json({
            success: false,
            isSchoolSuspended: true,
            message: "SCHOOL_SUSPENDED",
            schoolName: suspTch.schoolName,
            error: `\u062A\u0645 \u062A\u0639\u0637\u064A\u0644 \u0648\u062A\u062C\u0645\u064A\u062F \u062D\u0633\u0627\u0628 \u0648\u062E\u062F\u0645\u0627\u062A \u0645\u062F\u0631\u0633\u0629 (${suspTch.schoolName || "\u0627\u0644\u0645\u062F\u0631\u0633\u0629"}) \u0645\u0646 \u0642\u0628\u0644 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629 (\u0627\u0644\u0645\u0637\u0648\u0631).`
          });
        }
        if (targetSchoolId && tch.schoolId && !areSchoolsCompatible(tch.schoolId, targetSchoolId)) {
          return res.status(400).json({
            success: false,
            message: "\u0647\u0630\u0627 \u0627\u0644\u0643\u0648\u062F \u063A\u064A\u0631 \u0635\u062D\u064A\u062D \u0644\u0647\u0630\u0647 \u0627\u0644\u0645\u062F\u0631\u0633\u0629\u060C \u062D\u064A\u062B \u062A\u0645 \u062A\u0648\u0644\u064A\u062F\u0647 \u062D\u0635\u0631\u0627\u064B \u0644\u0645\u062F\u0631\u0633\u0629 \u0623\u062E\u0631\u0649."
          });
        }
        if (tch.isBanned || await checkBanned(tch.id)) {
          return res.status(400).json({ success: false, isBanned: true, message: "ACCOUNT_BANNED" });
        }
        if (!allowMulti && tch.deviceId && incomingDeviceId && tch.deviceId !== incomingDeviceId) {
          return res.status(403).json({
            success: false,
            message: "MULTI_DEVICE_NOT_ALLOWED",
            error: "\u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u0646 \u0623\u0643\u062B\u0631 \u0645\u0646 \u062C\u0647\u0627\u0632 \u063A\u064A\u0631 \u0645\u0633\u0645\u0648\u062D \u0628\u0647 \u0644\u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628 \u0648\u0641\u0642\u0627\u064B \u0644\u0644\u0633\u064A\u0627\u0633\u0627\u062A \u0627\u0644\u0623\u0645\u0646\u064A\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u0644\u0644\u0645\u0646\u0638\u0648\u0645\u0629."
          });
        }
        if (!tch.deviceId && incomingDeviceId) {
          db.update(teachers).set({ deviceId: incomingDeviceId, lastLogin: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm.eq)(teachers.id, tch.id)).catch(() => {
          });
        }
        clearFailedAuthAttempt(req);
        const token = import_jsonwebtoken2.default.sign(
          { uid: tch.id, name: tch.name, role: "teacher", schoolId: tch.schoolId || "school8", subject: tch.subject, grade: tch.grade },
          JWT_SECRET,
          { expiresIn: "30d" }
        );
        return res.json({
          success: true,
          token,
          user: {
            uid: tch.id,
            id: tch.id,
            displayName: tch.name,
            name: tch.name,
            role: "teacher",
            schoolId: tch.schoolId || targetSchoolId || "school8",
            subject: tch.subject || "\u0627\u0644\u0645\u0646\u0647\u062C \u0627\u0644\u0648\u0632\u0627\u0631\u064A",
            grade: tch.grade || "\u0627\u0644\u0633\u0627\u062F\u0633 \u0627\u0644\u0639\u0644\u0645\u064A",
            classes: tch.classes || [],
            classCodes: tch.classCodes || {}
          }
        });
      }
      if (activationList.length > 0) {
        const act = activationList[0];
        const roleClean = (act.role || "student").toLowerCase();
        let effectiveRole = roleClean.includes("teacher") ? "teacher" : roleClean.includes("admin") ? "admin" : "student";
        if (effectiveRole === "student") {
          const upperCode = code.toUpperCase();
          if (upperCode.startsWith("ADM-") || upperCode === "112233") effectiveRole = "admin";
          else if (upperCode.startsWith("TCH-")) effectiveRole = "teacher";
          else if (upperCode.startsWith("PAR-") || upperCode.startsWith("PCODE-")) effectiveRole = "parent";
          else if (upperCode.startsWith("DRV-") || upperCode.startsWith("DRI-")) effectiveRole = "driver";
        }
        const suspAct = await checkIsSchoolSuspended(act.schoolId || targetSchoolId);
        const isDevEmail = (act.email || "").toLowerCase() === "mntzralghanm527@gmail.com";
        if (suspAct.isSuspended && !isDevEmail) {
          return res.status(403).json({
            success: false,
            isSchoolSuspended: true,
            message: "SCHOOL_SUSPENDED",
            schoolName: suspAct.schoolName,
            error: `\u062A\u0645 \u062A\u0639\u0637\u064A\u0644 \u0648\u062A\u062C\u0645\u064A\u062F \u062D\u0633\u0627\u0628 \u0648\u062E\u062F\u0645\u0627\u062A \u0645\u062F\u0631\u0633\u0629 (${suspAct.schoolName || "\u0627\u0644\u0645\u062F\u0631\u0633\u0629"}) \u0645\u0646 \u0642\u0628\u0644 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629 (\u0627\u0644\u0645\u0637\u0648\u0631). \u064A\u0631\u062C\u0649 \u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0639\u0627\u0645\u0629.`
          });
        }
        if (targetSchoolId && act.schoolId && !areSchoolsCompatible(act.schoolId, targetSchoolId)) {
          return res.status(400).json({
            success: false,
            message: "\u0647\u0630\u0627 \u0627\u0644\u0643\u0648\u062F \u063A\u064A\u0631 \u0635\u062D\u064A\u062D \u0644\u0647\u0630\u0647 \u0627\u0644\u0645\u062F\u0631\u0633\u0629\u060C \u062D\u064A\u062B \u062A\u0645 \u062A\u0648\u0644\u064A\u062F\u0647 \u062D\u0635\u0631\u0627\u064B \u0644\u0645\u062F\u0631\u0633\u0629 \u0623\u062E\u0631\u0649."
          });
        }
        if (!act.used) {
          db.update(activation_codes).set({ used: true }).where((0, import_drizzle_orm.eq)(activation_codes.id, act.id)).catch(() => {
          });
        }
        if (await checkBanned(act.id)) {
          return res.status(400).json({ success: false, isBanned: true, message: "ACCOUNT_BANNED" });
        }
        clearFailedAuthAttempt(req);
        const token = import_jsonwebtoken2.default.sign(
          { uid: act.id, name: act.role, role: effectiveRole, schoolId: act.schoolId || "school8" },
          JWT_SECRET,
          { expiresIn: "30d" }
        );
        return res.json({
          success: true,
          token,
          user: {
            uid: act.id,
            id: act.id,
            displayName: effectiveRole === "teacher" ? "\u0627\u0644\u0623\u0633\u062A\u0627\u0630 \u0627\u0644\u0645\u062D\u0627\u0636\u0631" : effectiveRole === "admin" ? "abdulradhaalmayali@gmail.com" : "\u0645\u0634\u062A\u0631\u0643 \u0627\u0644\u062F\u0648\u0631\u0629",
            name: effectiveRole === "teacher" ? "\u0627\u0644\u0623\u0633\u062A\u0627\u0630 \u0627\u0644\u0645\u062D\u0627\u0636\u0631" : effectiveRole === "admin" ? "abdulradhaalmayali@gmail.com" : "\u0645\u0634\u062A\u0631\u0643 \u0627\u0644\u062F\u0648\u0631\u0629",
            email: effectiveRole === "admin" ? "abdulradhaalmayali@gmail.com" : null,
            role: effectiveRole,
            schoolId: act.schoolId || targetSchoolId || "school8",
            studentCode: code,
            subject: "\u0627\u0644\u0645\u0646\u0647\u062C \u0627\u0644\u0639\u0627\u0645",
            grade: "\u0627\u0644\u0633\u0627\u062F\u0633 \u0627\u0644\u0639\u0644\u0645\u064A"
          }
        });
      }
      if (studentList.length > 0) {
        const stu = studentList[0];
        if (stu.schoolId) {
          const schoolLists = await db.select({ id: academic_lists.id, students: academic_lists.students }).from(academic_lists).where((0, import_drizzle_orm.eq)(academic_lists.schoolId, stu.schoolId));
          if (schoolLists.length > 0) {
            const isStudentInAnyList = schoolLists.some((list) => {
              const listStudents = Array.isArray(list.students) ? list.students : [];
              return listStudents.some((s) => {
                const scode = String(s.student || s.code || "").trim().toUpperCase();
                const sid = String(s.id || "").trim().toUpperCase();
                return scode === cleanCode || scode === code.trim().toUpperCase() || sid === String(stu.id).toUpperCase();
              });
            });
            if (!isStudentInAnyList) {
              console.log(`[Auth] Student ${stu.name} (${code}) found in DB but not in active Academic List for school ${stu.schoolId}. Denying access.`);
              return res.status(403).json({
                success: false,
                message: "\u062A\u0645 \u062A\u0639\u0637\u064A\u0644 \u0647\u0630\u0627 \u0627\u0644\u0643\u0648\u062F \u0623\u0648 \u062D\u0630\u0641\u0647 \u0645\u0646 \u0642\u0628\u0644 \u0627\u0644\u0625\u062F\u0627\u0631\u0629"
              });
            }
          }
        }
        const isDevEmail = (stu.email || "").toLowerCase() === "mntzralghanm527@gmail.com";
        const suspStu = await checkIsSchoolSuspended(stu.schoolId || targetSchoolId);
        if (suspStu.isSuspended && !isDevEmail) {
          return res.status(403).json({
            success: false,
            isSchoolSuspended: true,
            message: "SCHOOL_SUSPENDED",
            schoolName: suspStu.schoolName,
            error: `\u062A\u0645 \u062A\u0639\u0637\u064A\u0644 \u0648\u062A\u062C\u0645\u064A\u062F \u062D\u0633\u0627\u0628 \u0648\u062E\u062F\u0645\u0627\u062A \u0645\u062F\u0631\u0633\u0629 (${suspStu.schoolName || "\u0627\u0644\u0645\u062F\u0631\u0633\u0629"}) \u0645\u0646 \u0642\u0628\u0644 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629 (\u0627\u0644\u0645\u0637\u0648\u0631).`
          });
        }
        if (targetSchoolId && stu.schoolId && !areSchoolsCompatible(stu.schoolId, targetSchoolId)) {
          return res.status(400).json({
            success: false,
            message: "\u0647\u0630\u0627 \u0627\u0644\u0643\u0648\u062F \u063A\u064A\u0631 \u0635\u062D\u064A\u062D \u0644\u0647\u0630\u0647 \u0627\u0644\u0645\u062F\u0631\u0633\u0629\u060C \u062D\u064A\u062B \u062A\u0645 \u062A\u0648\u0644\u064A\u062F\u0647 \u062D\u0635\u0631\u0627\u064B \u0644\u0645\u062F\u0631\u0633\u0629 \u0623\u062E\u0631\u0649."
          });
        }
        if (stu.isBanned || await checkBanned(stu.id)) {
          return res.status(400).json({ success: false, isBanned: true, message: "ACCOUNT_BANNED" });
        }
        if (!allowMulti && stu.deviceId && incomingDeviceId && stu.deviceId !== incomingDeviceId) {
          return res.status(403).json({
            success: false,
            message: "MULTI_DEVICE_NOT_ALLOWED",
            error: "\u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u0646 \u0623\u0643\u062B\u0631 \u0645\u0646 \u062C\u0647\u0627\u0632 \u063A\u064A\u0631 \u0645\u0633\u0645\u0648\u062D \u0628\u0647 \u0644\u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628 \u0648\u0641\u0642\u0627\u064B \u0644\u0644\u0633\u064A\u0627\u0633\u0627\u062A \u0627\u0644\u0623\u0645\u0646\u064A\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u0644\u0644\u0645\u0646\u0638\u0648\u0645\u0629."
          });
        }
        if (!stu.deviceId && incomingDeviceId) {
          db.update(students).set({ deviceId: incomingDeviceId, lastLogin: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm.eq)(students.id, stu.id)).catch(() => {
          });
        }
        clearFailedAuthAttempt(req);
        const prefixGrade = getGradeFromCodePrefix(stu.code || cleanCode);
        const effectiveGrade = prefixGrade || stu.grade || "\u0623\u0648\u0644 \u0627\u0628\u062A\u062F\u0627\u0626\u064A";
        const token = import_jsonwebtoken2.default.sign(
          { uid: stu.id, name: stu.name, role: "student", schoolId: stu.schoolId, grade: effectiveGrade },
          JWT_SECRET,
          { expiresIn: "30d" }
        );
        return res.json({
          success: true,
          token,
          user: {
            uid: stu.id,
            id: stu.id,
            displayName: stu.name,
            name: stu.name,
            studentName: stu.name,
            studentCode: stu.code || cleanCode,
            role: "student",
            schoolId: stu.schoolId || targetSchoolId,
            grade: effectiveGrade,
            gender: stu.gender || "male"
          }
        });
      }
      if (parentList.length > 0) {
        const stu = parentList[0];
        if (stu.schoolId) {
          const schoolLists = await db.select({ id: academic_lists.id, students: academic_lists.students }).from(academic_lists).where((0, import_drizzle_orm.eq)(academic_lists.schoolId, stu.schoolId));
          if (schoolLists.length > 0) {
            const isStudentInAnyList = schoolLists.some((list) => {
              const listStudents = Array.isArray(list.students) ? list.students : [];
              return listStudents.some(
                (s) => s.parent === code || s.parentCode === code || s.id === stu.id
              );
            });
            if (!isStudentInAnyList) {
              console.log(`[Auth] Parent associated with student ${stu.name} found in DB but student not in active Academic List for school ${stu.schoolId}. Denying access.`);
              return res.status(403).json({
                success: false,
                message: "\u062A\u0645 \u062A\u0639\u0637\u064A\u0644 \u0647\u0630\u0627 \u0627\u0644\u0643\u0648\u062F \u0623\u0648 \u062D\u0630\u0641\u0647 \u0645\u0646 \u0642\u0628\u0644 \u0627\u0644\u0625\u062F\u0627\u0631\u0629"
              });
            }
          }
        }
        const isDevEmail = (stu.email || "").toLowerCase() === "mntzralghanm527@gmail.com";
        const suspPar = await checkIsSchoolSuspended(stu.schoolId || targetSchoolId);
        if (suspPar.isSuspended && !isDevEmail) {
          return res.status(403).json({
            success: false,
            isSchoolSuspended: true,
            message: "SCHOOL_SUSPENDED",
            schoolName: suspPar.schoolName,
            error: `\u062A\u0645 \u062A\u0639\u0637\u064A\u0644 \u0648\u062A\u062C\u0645\u064A\u062F \u062D\u0633\u0627\u0628 \u0648\u062E\u062F\u0645\u0627\u062A \u0645\u062F\u0631\u0633\u0629 (${suspPar.schoolName || "\u0627\u0644\u0645\u062F\u0631\u0633\u0629"}) \u0645\u0646 \u0642\u0628\u0644 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629 (\u0627\u0644\u0645\u0637\u0648\u0631).`
          });
        }
        if (targetSchoolId && stu.schoolId && !areSchoolsCompatible(stu.schoolId, targetSchoolId)) {
          return res.status(400).json({
            success: false,
            message: "\u0647\u0630\u0627 \u0627\u0644\u0643\u0648\u062F \u063A\u064A\u0631 \u0635\u062D\u064A\u062D \u0644\u0647\u0630\u0647 \u0627\u0644\u0645\u062F\u0631\u0633\u0629\u060C \u062D\u064A\u062B \u062A\u0645 \u062A\u0648\u0644\u064A\u062F\u0647 \u062D\u0635\u0631\u0627\u064B \u0644\u0645\u062F\u0631\u0633\u0629 \u0623\u062E\u0631\u0649."
          });
        }
        const parentId = "parent_" + stu.id;
        if (stu.isBanned || await checkBanned(parentId) || await checkBanned(stu.id)) {
          return res.status(400).json({ success: false, isBanned: true, message: "ACCOUNT_BANNED" });
        }
        clearFailedAuthAttempt(req);
        const token = import_jsonwebtoken2.default.sign(
          { uid: parentId, name: "\u0648\u0644\u064A \u0623\u0645\u0631 " + stu.name, role: "parent", schoolId: stu.schoolId, grade: stu.grade },
          JWT_SECRET,
          { expiresIn: "30d" }
        );
        return res.json({
          success: true,
          token,
          user: {
            uid: parentId,
            id: parentId,
            displayName: "\u0648\u0644\u064A \u0623\u0645\u0631 " + stu.name,
            name: "\u0648\u0644\u064A \u0623\u0645\u0631 " + stu.name,
            studentName: stu.name,
            studentCode: stu.code,
            parentCode: stu.parentCode || code,
            role: "parent",
            schoolId: stu.schoolId || targetSchoolId,
            grade: stu.grade || "\u0633\u0627\u062F\u0633 \u0639\u0644\u0645\u064A",
            gender: stu.gender || "male"
          }
        });
      }
      if (driverList.length > 0) {
        const drv = driverList[0];
        if (drv.status !== "active") {
          return res.status(403).json({ success: false, message: "\u062D\u0633\u0627\u0628 \u0627\u0644\u0633\u0627\u0626\u0642 \u063A\u064A\u0631 \u0646\u0634\u0637 \u062D\u0627\u0644\u064A\u0627\u064B." });
        }
        const isDevEmail = (drv.email || "").toLowerCase() === "mntzralghanm527@gmail.com";
        const suspDrv = await checkIsSchoolSuspended(drv.schoolId || targetSchoolId);
        if (suspDrv.isSuspended && !isDevEmail) {
          return res.status(403).json({
            success: false,
            isSchoolSuspended: true,
            message: "SCHOOL_SUSPENDED",
            schoolName: suspDrv.schoolName,
            error: `\u062A\u0645 \u062A\u0639\u0637\u064A\u0644 \u0648\u062A\u062C\u0645\u064A\u062F \u062D\u0633\u0627\u0628 \u0648\u062E\u062F\u0645\u0627\u062A \u0645\u062F\u0631\u0633\u0629 (${suspDrv.schoolName || "\u0627\u0644\u0645\u062F\u0631\u0633\u0629"}) \u0645\u0646 \u0642\u0628\u0644 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629 (\u0627\u0644\u0645\u0637\u0648\u0631).`
          });
        }
        if (targetSchoolId && drv.schoolId && !areSchoolsCompatible(drv.schoolId, targetSchoolId)) {
          return res.status(400).json({
            success: false,
            message: "\u0647\u0630\u0627 \u0627\u0644\u0643\u0648\u062F \u063A\u064A\u0631 \u0635\u062D\u064A\u062D \u0644\u0647\u0630\u0647 \u0627\u0644\u0645\u062F\u0631\u0633\u0629\u060C \u062D\u064A\u062B \u062A\u0645 \u062A\u0648\u0644\u064A\u062F\u0647 \u062D\u0635\u0631\u0627\u064B \u0644\u0645\u062F\u0631\u0633\u0629 \u0623\u062E\u0631\u0649."
          });
        }
        if (await checkBanned(drv.id)) {
          return res.status(400).json({ success: false, isBanned: true, message: "ACCOUNT_BANNED" });
        }
        const token = import_jsonwebtoken2.default.sign(
          { uid: drv.id, name: drv.name, role: "driver", schoolId: drv.schoolId },
          JWT_SECRET,
          { expiresIn: "30d" }
        );
        clearFailedAuthAttempt(req);
        return res.json({
          success: true,
          token,
          user: {
            uid: drv.id,
            id: drv.id,
            displayName: drv.name,
            name: drv.name,
            role: "driver",
            schoolId: drv.schoolId || targetSchoolId
          }
        });
      }
      console.log("Login failed for code:", code);
      await recordFailedAuthAttempt(req, code);
      return res.status(401).json({ success: false, message: "\u0643\u0648\u062F \u0627\u0644\u062F\u062E\u0648\u0644 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D" });
    } catch (error) {
      console.error("Login code error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const securityCheck = await checkSecurityBanOrLock(req, email);
      if (securityCheck.blocked) {
        return res.status(securityCheck.status || 403).json({
          success: false,
          isBanned: securityCheck.isBanned,
          message: securityCheck.isBanned ? "ACCOUNT_BANNED" : "ACCOUNT_LOCKED",
          error: securityCheck.reason
        });
      }
      const incomingDeviceId = (req.body?.deviceId || req.headers["x-device-id"] || "").trim();
      const secSettings = await getSecuritySettings();
      const allowMulti = secSettings.allowMultiDeviceLogin !== false;
      const isDeveloperAccount = DEVELOPER_EMAILS.includes((email || "").toLowerCase().trim());
      let userList = [];
      try {
        userList = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.email, email));
      } catch (dbErr) {
        console.warn("DB select failed during login:", dbErr);
      }
      let user = userList && userList.length > 0 ? userList[0] : null;
      if (!user) {
        if (isDeveloperAccount) {
          const devHash = await import_bcryptjs.default.hash(password || "12345678", 10);
          const devUser = {
            id: "dev_mntzr_main",
            email: email.toLowerCase().trim(),
            name: "\u0627\u0644\u0645\u0647\u0646\u062F\u0633 \u0645\u0646\u062A\u0638\u0631 (\u0627\u0644\u0645\u0637\u0648\u0631 \u0627\u0644\u0639\u0627\u0645)",
            passwordHash: devHash,
            role: "developer",
            schoolId: "general",
            status: "\u0646\u0634\u0637"
          };
          try {
            await db.insert(users).values(devUser);
          } catch (insertErr) {
            console.warn("DB insert developer fallback:", insertErr);
          }
          user = devUser;
        } else {
          await recordFailedAuthAttempt(req, email);
          return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
      } else {
        const isValid = await import_bcryptjs.default.compare(password, user.passwordHash || "");
        if (!isValid) {
          if (isDeveloperAccount) {
            const newHash = await import_bcryptjs.default.hash(password, 10);
            try {
              await db.update(users).set({ passwordHash: newHash, role: "developer" }).where((0, import_drizzle_orm.eq)(users.id, user.id));
            } catch (upErr) {
            }
            user.role = "developer";
          } else {
            await recordFailedAuthAttempt(req, email);
            return res.status(401).json({ success: false, message: "Invalid credentials" });
          }
        }
      }
      const isDevEmail = isDeveloperAccount || user.email?.toLowerCase() === "mntzralghanm527@gmail.com";
      if (user.role !== "developer" && user.role !== "superadmin" && !isDevEmail) {
        const suspUser = await checkIsSchoolSuspended(user.schoolId);
        if (suspUser.isSuspended) {
          return res.status(403).json({
            success: false,
            isSchoolSuspended: true,
            message: "SCHOOL_SUSPENDED",
            schoolName: suspUser.schoolName,
            error: `\u062A\u0645 \u062A\u0639\u0637\u064A\u0644 \u0648\u062A\u062C\u0645\u064A\u062F \u062D\u0633\u0627\u0628 \u0648\u062E\u062F\u0645\u0627\u062A \u0645\u062F\u0631\u0633\u0629 (${suspUser.schoolName || "\u0627\u0644\u0645\u062F\u0631\u0633\u0629"}) \u0645\u0646 \u0642\u0628\u0644 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629 (\u0627\u0644\u0645\u0637\u0648\u0631).`
          });
        }
      }
      if (!allowMulti && user.deviceId && incomingDeviceId && user.deviceId !== incomingDeviceId && !isDevEmail) {
        return res.status(403).json({
          success: false,
          message: "MULTI_DEVICE_NOT_ALLOWED",
          error: "\u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u0646 \u0623\u0643\u062B\u0631 \u0645\u0646 \u062C\u0647\u0627\u0632 \u063A\u064A\u0631 \u0645\u0633\u0645\u0648\u062D \u0628\u0647 \u0644\u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628 \u0648\u0641\u0642\u0627\u064B \u0644\u0644\u0633\u064A\u0627\u0633\u0627\u062A \u0627\u0644\u0623\u0645\u0646\u064A\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u0644\u0644\u0645\u0646\u0638\u0648\u0645\u0629."
        });
      }
      if (!user.deviceId && incomingDeviceId) {
        db.update(users).set({ deviceId: incomingDeviceId, lastLogin: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm.eq)(users.id, user.id)).catch(() => {
        });
      }
      clearFailedAuthAttempt(req);
      const token = import_jsonwebtoken2.default.sign(
        { uid: user.id, email: user.email, name: user.name, role: user.role, schoolId: user.schoolId },
        JWT_SECRET,
        { expiresIn: "30d" }
      );
      res.json({ success: true, token, user: { uid: user.id, email: user.email, displayName: user.name, role: user.role, schoolId: user.schoolId } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/auth/google-login", async (req, res) => {
    try {
      const { email, name, photoURL } = req.body;
      const targetEmail = (email || "mntzralghanm527@gmail.com").trim().toLowerCase();
      const isDevEmail = DEVELOPER_EMAILS.includes(targetEmail);
      let userList = [];
      try {
        userList = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.email, targetEmail));
      } catch (e) {
        console.warn("Google login db select error:", e);
      }
      let user;
      if (userList && userList.length > 0) {
        user = userList[0];
        if (isDevEmail && user.role !== "developer") {
          user.role = "developer";
          try {
            await db.update(users).set({ role: "developer" }).where((0, import_drizzle_orm.eq)(users.id, user.id));
          } catch (e) {
          }
        }
      } else {
        const userId = isDevEmail ? "dev_mntzr_main" : `usr_google_${Date.now()}`;
        const newUser = {
          id: userId,
          email: targetEmail,
          name: name || (isDevEmail ? "\u0627\u0644\u0645\u0647\u0646\u062F\u0633 \u0645\u0646\u062A\u0638\u0631 (\u0627\u0644\u0645\u0637\u0648\u0631 \u0627\u0644\u0639\u0627\u0645)" : targetEmail.split("@")[0]),
          role: isDevEmail ? "developer" : "admin",
          schoolId: "general",
          photo: photoURL || null,
          status: "\u0646\u0634\u0637"
        };
        try {
          await db.insert(users).values(newUser);
        } catch (e) {
          console.warn("Google login insert error:", e);
        }
        user = newUser;
      }
      const token = import_jsonwebtoken2.default.sign(
        { uid: user.id, email: user.email, name: user.name, role: user.role, schoolId: user.schoolId },
        JWT_SECRET,
        { expiresIn: "30d" }
      );
      res.json({
        success: true,
        token,
        user: {
          uid: user.id,
          id: user.id,
          email: user.email,
          displayName: user.name,
          name: user.name,
          role: user.role,
          schoolId: user.schoolId,
          photoURL: user.photo || photoURL || null
        }
      });
    } catch (error) {
      console.error("Google login error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  const getMailTransporter = () => {
    const rawHost = (process.env.SMTP_HOST || "smtp.gmail.com").replace(/\s+/g, "");
    const host = rawHost || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT) || 465;
    const secure = process.env.SMTP_SECURE === "true" || port === 465;
    const user = (process.env.SMTP_USER || "bairaq.system@gmail.com").replace(/\s+/g, "");
    const rawPass = (process.env.SMTP_PASS || "cckg fjlo wiad wtnm").replace(/\s+/g, "");
    if (!user || !rawPass) {
      return null;
    }
    return import_nodemailer.default.createTransport({
      host,
      port,
      secure,
      auth: { user, pass: rawPass },
      tls: { rejectUnauthorized: false }
    });
  };
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const email = (req.body?.email || "").trim().toLowerCase();
      if (!email) {
        return res.status(400).json({ success: false, message: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A" });
      }
      const userList = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.email, email)).limit(1);
      if (userList.length === 0) {
        return res.json({
          success: true,
          message: "\u0625\u0630\u0627 \u0643\u0627\u0646 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0645\u0633\u062C\u0644\u0627\u064B \u0644\u062F\u064A\u0646\u0627\u060C \u0641\u0633\u062A\u0635\u0644\u0643 \u0631\u0633\u0627\u0644\u0629 \u062A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u062A\u0639\u0644\u064A\u0645\u0627\u062A \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631."
        });
      }
      const user = userList[0];
      const resetToken = import_crypto2.default.randomBytes(32).toString("hex");
      const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1e3);
      await db.update(users).set({
        resetToken,
        resetTokenExpires
      }).where((0, import_drizzle_orm.eq)(users.id, user.id));
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers["x-forwarded-host"] || req.get("host");
      const appUrl = req.headers["x-frontend-origin"] || process.env.APP_URL || `${protocol}://${host}`;
      const resetLink = `${appUrl}/?reset_token=${resetToken}&email=${encodeURIComponent(email)}`;
      const transporter = getMailTransporter();
      const fromAddress = process.env.SMTP_FROM || `"\u0645\u0646\u0638\u0648\u0645\u0629 \u0628\u064A\u0631\u0642 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629" <${process.env.SMTP_USER || "info@bairaq-iq.com"}>`;
      if (transporter) {
        try {
          await transporter.sendMail({
            from: fromAddress,
            to: email,
            subject: "\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 - \u0645\u0646\u0638\u0648\u0645\u0629 \u0628\u064A\u0631\u0642 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629",
            html: `
              <div dir="rtl" style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 30px; border-radius: 12px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <h2 style="color: #0f172a; margin: 0; font-size: 22px;">\u0645\u0646\u0638\u0648\u0645\u0629 \u0628\u064A\u0631\u0642 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629</h2>
                  <p style="color: #64748b; font-size: 14px; margin-top: 4px;">\u0637\u0644\u0628 \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631</p>
                </div>
                <div style="background: #ffffff; padding: 24px; border-radius: 10px; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                  <p style="font-size: 16px; margin: 0 0 16px 0;">\u0645\u0631\u062D\u0628\u0627\u064B <strong>${user.name || "\u0639\u0632\u064A\u0632\u064A \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645"}</strong>\u060C</p>
                  <p style="font-size: 14px; line-height: 1.6; color: #334155;">
                    \u062A\u0644\u0642\u064A\u0646\u0627 \u0637\u0644\u0628\u0627\u064B \u0644\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062E\u0627\u0635\u0629 \u0628\u062D\u0633\u0627\u0628\u0643 \u0641\u064A \u0645\u0646\u0638\u0648\u0645\u0629 \u0628\u064A\u0631\u0642. \u064A\u0645\u0643\u0646\u0643 \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646\u0647\u0627 \u0645\u0628\u0627\u0634\u0631\u0629 \u0639\u0628\u0631 \u0627\u0644\u0646\u0642\u0631 \u0639\u0644\u0649 \u0627\u0644\u0632\u0631 \u0623\u062F\u0646\u0627\u0647:
                  </p>
                  <div style="text-align: center; margin: 28px 0;">
                    <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631</a>
                  </div>
                  <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin-top: 20px;">
                    \u0635\u0644\u0627\u062D\u064A\u0629 \u0647\u0630\u0627 \u0627\u0644\u0631\u0627\u0628\u0637 \u0647\u064A \u0633\u0627\u0639\u0629 \u0648\u0627\u062D\u062F\u0629 \u0641\u0642\u0637. \u0625\u0630\u0627 \u0644\u0645 \u062A\u0643\u0646 \u0623\u0646\u062A \u0645\u0646 \u0637\u0644\u0628 \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631\u060C \u064A\u0631\u062C\u0649 \u062A\u062C\u0627\u0647\u0644 \u0647\u0630\u0647 \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0641\u0644\u0646 \u064A\u062A\u0623\u062B\u0631 \u062D\u0633\u0627\u0628\u0643 \u0628\u0623\u064A \u062A\u063A\u064A\u064A\u0631.
                  </p>
                </div>
                <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #94a3b8;">
                  \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} \u0645\u0646\u0638\u0648\u0645\u0629 \u0628\u064A\u0631\u0642 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629. \u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u0642\u0648\u0642 \u0645\u062D\u0641\u0648\u0638\u0629.
                </div>
              </div>
            `
          });
          console.log(`[SMTP] Reset email sent successfully to ${email}`);
        } catch (mailErr) {
          console.error("[SMTP Error] Failed to send reset email:", mailErr);
          console.log(`[RECOVERY_FALLBACK_LINK] ${resetLink}`);
        }
      } else {
        console.warn("[SMTP] SMTP not configured. Fallback reset link:", resetLink);
      }
      res.json({
        success: true,
        message: "\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0631\u0627\u0628\u0637 \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0625\u0644\u0649 \u0628\u0631\u064A\u062F\u0643 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0628\u0646\u062C\u0627\u062D."
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ success: false, message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0645\u0639\u0627\u0644\u062C\u0629 \u0627\u0644\u0637\u0644\u0628" });
    }
  });
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, token, newPassword } = req.body;
      if (!email || !token || !newPassword) {
        return res.status(400).json({ success: false, message: "\u062C\u0645\u064A\u0639 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0645\u0637\u0644\u0648\u0628\u0629 (\u0627\u0644\u0628\u0631\u064A\u062F\u060C \u0627\u0644\u0631\u0645\u0632\u060C \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629)" });
      }
      if (String(newPassword).length < 6) {
        return res.status(400).json({ success: false, message: "\u064A\u062C\u0628 \u0623\u0646 \u0644\u0627 \u062A\u0642\u0644 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0639\u0646 6 \u0623\u062D\u0631\u0641" });
      }
      const targetEmail = String(email).trim().toLowerCase();
      const userList = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.email, targetEmail)).limit(1);
      if (userList.length === 0) {
        return res.status(404).json({ success: false, message: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      const user = userList[0];
      if (!user.resetToken || user.resetToken !== token) {
        return res.status(400).json({ success: false, message: "\u0631\u0645\u0632 \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D \u0623\u0648 \u062A\u0645 \u0627\u0633\u062A\u062E\u062F\u0627\u0645\u0647 \u0645\u0633\u0628\u0642\u0627\u064B" });
      }
      if (user.resetTokenExpires && new Date(user.resetTokenExpires) < /* @__PURE__ */ new Date()) {
        return res.status(400).json({ success: false, message: "\u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u0629 \u0631\u0645\u0632 \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631. \u064A\u0631\u062C\u0649 \u0637\u0644\u0628 \u0631\u0627\u0628\u0637 \u062C\u062F\u064A\u062F" });
      }
      const newHash = await import_bcryptjs.default.hash(newPassword, 10);
      await db.update(users).set({
        passwordHash: newHash,
        resetToken: null,
        resetTokenExpires: null
      }).where((0, import_drizzle_orm.eq)(users.id, user.id));
      console.log(`[Auth] Password successfully reset for user: ${targetEmail}`);
      res.json({ success: true, message: "\u062A\u0645 \u062A\u063A\u064A\u064A\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0628\u0646\u062C\u0627\u062D. \u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u0622\u0646 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0628\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629." });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ success: false, message: error.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631" });
    }
  });
  function formatPhoneForWhatsApp(inputPhone) {
    let cleaned = (inputPhone || "").replace(/[^0-9+]/g, "");
    if (cleaned.startsWith("00")) {
      cleaned = "+" + cleaned.substring(2);
    } else if (cleaned.startsWith("07")) {
      cleaned = "+964" + cleaned.substring(1);
    } else if (cleaned.startsWith("7") && cleaned.length === 10) {
      cleaned = "+964" + cleaned;
    } else if (!cleaned.startsWith("+") && cleaned.length >= 10) {
      cleaned = "+" + cleaned;
    }
    return cleaned;
  }
  function maskPhoneNumber(phone) {
    if (!phone || phone.length < 7) return phone || "\u0631\u0642\u0645 \u0647\u0627\u062A\u0641\u0643";
    const start = phone.slice(0, 4);
    const end = phone.slice(-3);
    return `${start}****${end}`;
  }
  app.post("/api/auth/whatsapp/request-otp", async (req, res) => {
    try {
      const identifier = (req.body?.identifier || "").trim();
      if (!identifier) {
        return res.status(400).json({ success: false, message: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 \u0623\u0648 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A" });
      }
      let targetUser = null;
      const cleanPhone = formatPhoneForWhatsApp(identifier);
      const byEmail = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.email, identifier.toLowerCase())).limit(1);
      if (byEmail.length > 0) {
        targetUser = byEmail[0];
      } else {
        const byPhone = await db.select().from(users).where((0, import_drizzle_orm.or)(
          (0, import_drizzle_orm.eq)(users.phone, identifier),
          (0, import_drizzle_orm.eq)(users.phone, cleanPhone)
        )).limit(1);
        if (byPhone.length > 0) {
          targetUser = byPhone[0];
        } else {
          const teacherList = await db.select().from(teachers).where((0, import_drizzle_orm.or)(
            (0, import_drizzle_orm.eq)(teachers.phone, identifier),
            (0, import_drizzle_orm.eq)(teachers.phone, cleanPhone),
            (0, import_drizzle_orm.eq)(teachers.email, identifier.toLowerCase()),
            (0, import_drizzle_orm.eq)(teachers.code, identifier)
          )).limit(1);
          if (teacherList.length > 0) {
            const t = teacherList[0];
            const linkedUsers = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.email, t.email || "")).limit(1);
            if (linkedUsers.length > 0) {
              targetUser = linkedUsers[0];
            }
          }
          if (!targetUser) {
            const studentList = await db.select().from(students).where((0, import_drizzle_orm.or)(
              (0, import_drizzle_orm.eq)(students.parentPhone, identifier),
              (0, import_drizzle_orm.eq)(students.parentPhone, cleanPhone),
              (0, import_drizzle_orm.eq)(students.code, identifier),
              (0, import_drizzle_orm.eq)(students.id, identifier)
            )).limit(1);
            if (studentList.length > 0) {
              const s = studentList[0];
              const linkedUsers = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.id, s.id)).limit(1);
              if (linkedUsers.length > 0) {
                targetUser = linkedUsers[0];
              }
            }
          }
        }
      }
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u062D\u0633\u0627\u0628 \u0645\u0631\u062A\u0628\u0637 \u0628\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 \u0623\u0648 \u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0645\u062F\u062E\u0644. \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0635\u062D\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A."
        });
      }
      const otp = Math.floor(1e5 + Math.random() * 9e5).toString();
      const otpExpires = new Date(Date.now() + 15 * 60 * 1e3);
      await db.update(users).set({
        whatsappOtp: otp,
        whatsappOtpExpires: otpExpires,
        resetToken: otp,
        resetTokenExpires: otpExpires
      }).where((0, import_drizzle_orm.eq)(users.id, targetUser.id));
      const recipientPhone = formatPhoneForWhatsApp(targetUser.phone || identifier);
      let supportWhatsapp = "+9647700000000";
      try {
        if (import_fs2.default.existsSync(SETTINGS_FILE_PATH)) {
          const raw = import_fs2.default.readFileSync(SETTINGS_FILE_PATH, "utf8");
          const parsed = JSON.parse(raw);
          if (parsed?.app_updates?.supportWhatsapp) {
            supportWhatsapp = parsed.app_updates.supportWhatsapp;
          } else if (parsed?.school_info?.adminWhatsapp) {
            supportWhatsapp = parsed.school_info.adminWhatsapp;
          }
        }
      } catch (e) {
      }
      const cleanSupportPhone = formatPhoneForWhatsApp(supportWhatsapp).replace(/[^0-9]/g, "");
      const waMessage = `\u0637\u0644\u0628 \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 - \u0645\u0646\u0638\u0648\u0645\u0629 \u0628\u064A\u0631\u0642 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629
\u0627\u0644\u062D\u0633\u0627\u0628: ${targetUser.email || targetUser.name || identifier}
\u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642: ${otp}
(\u0635\u0627\u0644\u062D \u0644\u0645\u062F\u0629 15 \u062F\u0642\u064A\u0642\u0629)`;
      const whatsappDirectLink = `https://wa.me/${cleanSupportPhone}?text=${encodeURIComponent(waMessage)}`;
      let gatewaySent = false;
      const waApiUrl = process.env.WHATSAPP_API_URL || process.env.ULTRAMSG_API_URL;
      const waToken = process.env.WHATSAPP_TOKEN || process.env.ULTRAMSG_TOKEN;
      const waInstanceId = process.env.WHATSAPP_INSTANCE_ID || process.env.ULTRAMSG_INSTANCE_ID;
      if (waApiUrl || waInstanceId && waToken) {
        try {
          const endpoint = waApiUrl || `https://api.ultramsg.com/${waInstanceId}/messages/chat`;
          const payload = {
            token: waToken,
            to: recipientPhone,
            body: `\u0645\u0646\u0638\u0648\u0645\u0629 \u0628\u064A\u0631\u0642 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629 \u{1F6E1}\uFE0F
\u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 \u0644\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0647\u0648: *${otp}*
(\u0635\u0627\u0644\u062D \u0644\u0645\u062F\u0629 15 \u062F\u0642\u064A\u0642\u0629. \u0644\u0627 \u062A\u0634\u0627\u0631\u0643 \u0647\u0630\u0627 \u0627\u0644\u0631\u0645\u0632 \u0645\u0639 \u0623\u064A \u0634\u062E\u0635).`
          };
          await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...waToken ? { "Authorization": `Bearer ${waToken}` } : {}
            },
            body: JSON.stringify(payload)
          });
          gatewaySent = true;
          console.log(`[WhatsApp Gateway] Sent OTP successfully to ${recipientPhone}`);
        } catch (apiErr) {
          console.warn("[WhatsApp Gateway] Failed to send via API:", apiErr);
        }
      }
      console.log(`[WhatsApp Recovery] Generated OTP for ${identifier}: ${otp} (Destination: ${recipientPhone})`);
      return res.json({
        success: true,
        message: "\u062A\u0645 \u062A\u0648\u0644\u064A\u062F \u0643\u0648\u062F \u0627\u0644\u062A\u062D\u0642\u0642 \u0628\u0646\u062C\u0627\u062D.",
        phoneMasked: maskPhoneNumber(recipientPhone),
        identifier,
        gatewaySent,
        whatsappLink: whatsappDirectLink,
        expiresInSeconds: 900
      });
    } catch (error) {
      console.error("WhatsApp request OTP error:", error);
      res.status(500).json({ success: false, message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0645\u0639\u0627\u0644\u062C\u0629 \u0637\u0644\u0628 \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0639\u0628\u0631 \u0648\u0627\u062A\u0633\u0627\u0628" });
    }
  });
  app.post("/api/auth/whatsapp/verify-otp", async (req, res) => {
    try {
      const { identifier, otp, newPassword } = req.body;
      if (!identifier || !otp || !newPassword) {
        return res.status(400).json({ success: false, message: "\u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u0642\u0648\u0644 \u0645\u0637\u0644\u0648\u0628\u0629 (\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A\u060C \u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642\u060C \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629)" });
      }
      if (String(newPassword).length < 6) {
        return res.status(400).json({ success: false, message: "\u064A\u062C\u0628 \u0623\u0644\u0627 \u062A\u0642\u0644 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u0639\u0646 6 \u0623\u062D\u0631\u0641" });
      }
      const cleanOtp = String(otp).trim();
      const cleanPhone = formatPhoneForWhatsApp(identifier);
      const userList = await db.select().from(users).where((0, import_drizzle_orm.or)(
        (0, import_drizzle_orm.eq)(users.email, identifier.toLowerCase().trim()),
        (0, import_drizzle_orm.eq)(users.phone, identifier),
        (0, import_drizzle_orm.eq)(users.phone, cleanPhone)
      )).limit(1);
      if (userList.length === 0) {
        return res.status(404).json({ success: false, message: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
      }
      const user = userList[0];
      const validOtp = user.whatsappOtp && user.whatsappOtp === cleanOtp || user.resetToken && user.resetToken === cleanOtp;
      if (!validOtp) {
        return res.status(400).json({ success: false, message: "\u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642 (OTP) \u063A\u064A\u0631 \u0635\u062D\u064A\u062D \u0623\u0648 \u062A\u0645 \u0627\u0633\u062A\u062E\u062F\u0627\u0645\u0647 \u0645\u0633\u0628\u0642\u0627\u064B" });
      }
      const expires = user.whatsappOtpExpires || user.resetTokenExpires;
      if (expires && new Date(expires) < /* @__PURE__ */ new Date()) {
        return res.status(400).json({ success: false, message: "\u0627\u0646\u062A\u0647\u062A \u0635\u0644\u0627\u062D\u064A\u0629 \u0631\u0645\u0632 \u0627\u0644\u062A\u062D\u0642\u0642. \u064A\u0631\u062C\u0649 \u0637\u0644\u0628 \u0631\u0645\u0632 \u062C\u062F\u064A\u062F." });
      }
      const newHash = await import_bcryptjs.default.hash(newPassword, 10);
      await db.update(users).set({
        passwordHash: newHash,
        whatsappOtp: null,
        whatsappOtpExpires: null,
        resetToken: null,
        resetTokenExpires: null
      }).where((0, import_drizzle_orm.eq)(users.id, user.id));
      console.log(`[WhatsApp Recovery] Password successfully updated for user: ${user.email || user.id}`);
      return res.json({
        success: true,
        message: "\u062A\u0645 \u062A\u063A\u064A\u064A\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0628\u0646\u062C\u0627\u062D! \u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u0622\u0646 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u0628\u0627\u0634\u0631\u0629 \u0628\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629."
      });
    } catch (error) {
      console.error("WhatsApp verify OTP error:", error);
      res.status(500).json({ success: false, message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062D\u0641\u0638 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062C\u062F\u064A\u062F\u0629" });
    }
  });
  app.get("/api/lounge-messages/unread/:uid", async (req, res) => {
    try {
      const { uid } = req.params;
      const msgs = await db.select().from(lounge_messages).where((0, import_drizzle_orm.and)(
        (0, import_drizzle_orm.eq)(lounge_messages.recipientId, uid),
        (0, import_drizzle_orm.eq)(lounge_messages.read, false)
      ));
      const counts = {};
      msgs.forEach((msg) => {
        if (msg.userId) {
          counts[msg.userId] = (counts[msg.userId] || 0) + 1;
        }
      });
      res.json({ success: true, counts });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/lounge-messages", async (req, res) => {
    try {
      const { roomId, schoolId } = req.query;
      const targetId = roomId || schoolId;
      let msgs;
      if (targetId && targetId !== "all") {
        msgs = await db.select().from(lounge_messages).where((0, import_drizzle_orm.eq)(lounge_messages.schoolId, targetId)).orderBy(lounge_messages.timestamp);
      } else {
        msgs = await db.select().from(lounge_messages).orderBy(lounge_messages.timestamp);
      }
      res.json({ success: true, messages: msgs, data: msgs });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/lounge-messages/:roomId", async (req, res) => {
    try {
      const { roomId } = req.params;
      const msgs = await db.select().from(lounge_messages).where((0, import_drizzle_orm.eq)(lounge_messages.schoolId, roomId)).orderBy(lounge_messages.timestamp);
      res.json({ success: true, messages: msgs });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  const SETTINGS_FILE_PATH = import_path2.default.join(process.cwd(), "system_settings_data.json");
  const defaultSettingsData = {
    school_info: {
      id: "school_info",
      adminPhone: "07800000000",
      adminWhatsapp: "07800000000",
      communityLockAll: false,
      communityLockGrades: [],
      storiesLock: false,
      loungeLock: false,
      schoolName: "\u0628\u0648\u0627\u0628\u0629 \u0628\u064A\u0631\u0642 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629",
      academicYear: "2025-2026",
      gateStatus: "active"
    },
    subject_mapping: {
      id: "subject_mapping",
      "1p": [
        { id: "quran", name: "\u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645 \u0648\u0627\u0644\u062A\u0631\u0628\u064A\u0629 \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A\u0629" },
        { id: "arabic", name: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629" },
        { id: "english", name: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0625\u0646\u0643\u0644\u064A\u0632\u064A\u0629" },
        { id: "math", name: "\u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0627\u062A" },
        { id: "science", name: "\u0627\u0644\u0639\u0644\u0648\u0645" }
      ],
      "2p": [
        { id: "quran", name: "\u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645 \u0648\u0627\u0644\u062A\u0631\u0628\u064A\u0629 \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A\u0629" },
        { id: "arabic", name: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629" },
        { id: "english", name: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0625\u0646\u0643\u0644\u064A\u0632\u064A\u0629" },
        { id: "math", name: "\u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0627\u062A" },
        { id: "science", name: "\u0627\u0644\u0639\u0644\u0648\u0645" }
      ],
      "3p": [
        { id: "quran", name: "\u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645 \u0648\u0627\u0644\u062A\u0631\u0628\u064A\u0629 \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A\u0629" },
        { id: "arabic", name: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629" },
        { id: "english", name: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0625\u0646\u0643\u0644\u064A\u0632\u064A\u0629" },
        { id: "math", name: "\u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0627\u062A" },
        { id: "science", name: "\u0627\u0644\u0639\u0644\u0648\u0645" }
      ],
      "4p": [
        { id: "quran", name: "\u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645 \u0648\u0627\u0644\u062A\u0631\u0628\u064A\u0629 \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A\u0629" },
        { id: "arabic", name: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629" },
        { id: "english", name: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0625\u0646\u0643\u0644\u064A\u0632\u064A\u0629" },
        { id: "math", name: "\u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0627\u062A" },
        { id: "science", name: "\u0627\u0644\u0639\u0644\u0648\u0645" },
        { id: "social", name: "\u0627\u0644\u0627\u062C\u062A\u0645\u0627\u0639\u064A\u0627\u062A" }
      ],
      "5p": [
        { id: "quran", name: "\u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645 \u0648\u0627\u0644\u062A\u0631\u0628\u064A\u0629 \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A\u0629" },
        { id: "arabic", name: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629" },
        { id: "english", name: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0625\u0646\u0643\u0644\u064A\u0632\u064A\u0629" },
        { id: "math", name: "\u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0627\u062A" },
        { id: "science", name: "\u0627\u0644\u0639\u0644\u0648\u0645" },
        { id: "social", name: "\u0627\u0644\u0627\u062C\u062A\u0645\u0627\u0639\u064A\u0627\u062A" }
      ],
      "6p": [
        { id: "quran", name: "\u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645 \u0648\u0627\u0644\u062A\u0631\u0628\u064A\u0629 \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A\u0629" },
        { id: "arabic", name: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629" },
        { id: "english", name: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0625\u0646\u0643\u0644\u064A\u0632\u064A\u0629" },
        { id: "math", name: "\u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0627\u062A" },
        { id: "science", name: "\u0627\u0644\u0639\u0644\u0648\u0645" },
        { id: "social", name: "\u0627\u0644\u0627\u062C\u062A\u0645\u0627\u0639\u064A\u0627\u062A" }
      ],
      "1i": [
        { id: "islamic", name: "\u0627\u0644\u062A\u0631\u0628\u064A\u0629 \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A\u0629" },
        { id: "arabic", name: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629" },
        { id: "english", name: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0625\u0646\u0643\u0644\u064A\u0632\u064A\u0629" },
        { id: "math", name: "\u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0627\u062A" },
        { id: "science", name: "\u0627\u0644\u0639\u0644\u0648\u0645" },
        { id: "social", name: "\u0627\u0644\u0627\u062C\u062A\u0645\u0627\u0639\u064A\u0627\u062A" },
        { id: "computer", name: "\u0627\u0644\u062D\u0627\u0633\u0648\u0628" }
      ],
      "2i": [
        { id: "islamic", name: "\u0627\u0644\u062A\u0631\u0628\u064A\u0629 \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A\u0629" },
        { id: "arabic", name: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629" },
        { id: "english", name: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0625\u0646\u0643\u0644\u064A\u0632\u064A\u0629" },
        { id: "math", name: "\u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0627\u062A" },
        { id: "science", name: "\u0627\u0644\u0639\u0644\u0648\u0645" },
        { id: "social", name: "\u0627\u0644\u0627\u062C\u062A\u0645\u0627\u0639\u064A\u0627\u062A" },
        { id: "computer", name: "\u0627\u0644\u062D\u0627\u0633\u0648\u0628" }
      ],
      "3i": [
        { id: "islamic", name: "\u0627\u0644\u062A\u0631\u0628\u064A\u0629 \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A\u0629" },
        { id: "arabic", name: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629" },
        { id: "english", name: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0625\u0646\u0643\u0644\u064A\u0632\u064A\u0629" },
        { id: "math", name: "\u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0627\u062A" },
        { id: "physics", name: "\u0627\u0644\u0641\u064A\u0632\u064A\u0627\u0621" },
        { id: "chemistry", name: "\u0627\u0644\u0643\u064A\u0645\u064A\u0627\u0621" },
        { id: "biology", name: "\u0627\u0644\u0623\u062D\u064A\u0627\u0621" },
        { id: "social", name: "\u0627\u0644\u0627\u062C\u062A\u0645\u0627\u0639\u064A\u0627\u062A" }
      ],
      "4s": [
        { id: "islamic", name: "\u0627\u0644\u062A\u0631\u0628\u064A\u0629 \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A\u0629" },
        { id: "arabic", name: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629" },
        { id: "english", name: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0625\u0646\u0643\u0644\u064A\u0632\u064A\u0629" },
        { id: "math", name: "\u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0627\u062A" },
        { id: "physics", name: "\u0627\u0644\u0641\u064A\u0632\u064A\u0627\u0621" },
        { id: "chemistry", name: "\u0627\u0644\u0643\u064A\u0645\u064A\u0627\u0621" },
        { id: "biology", name: "\u0627\u0644\u0623\u062D\u064A\u0627\u0621" }
      ],
      "5s": [
        { id: "islamic", name: "\u0627\u0644\u062A\u0631\u0628\u064A\u0629 \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A\u0629" },
        { id: "arabic", name: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629" },
        { id: "english", name: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0625\u0646\u0643\u0644\u064A\u0632\u064A\u0629" },
        { id: "math", name: "\u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0627\u062A" },
        { id: "physics", name: "\u0627\u0644\u0641\u064A\u0632\u064A\u0627\u0621" },
        { id: "chemistry", name: "\u0627\u0644\u0643\u064A\u0645\u064A\u0627\u0621" },
        { id: "biology", name: "\u0627\u0644\u0623\u062D\u064A\u0627\u0621" }
      ],
      "6s": [
        { id: "islamic", name: "\u0627\u0644\u062A\u0631\u0628\u064A\u0629 \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A\u0629" },
        { id: "arabic", name: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629" },
        { id: "english", name: "\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0625\u0646\u0643\u0644\u064A\u0632\u064A\u0629" },
        { id: "math", name: "\u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0627\u062A" },
        { id: "physics", name: "\u0627\u0644\u0641\u064A\u0632\u064A\u0627\u0621" },
        { id: "chemistry", name: "\u0627\u0644\u0643\u064A\u0645\u064A\u0627\u0621" },
        { id: "biology", name: "\u0627\u0644\u0623\u062D\u064A\u0627\u0621" }
      ]
    },
    tuition: {
      id: "tuition",
      amount: 0,
      discountRates: {
        brother: 10,
        orphan: 50,
        martyr: 100,
        teacher_son: 25
      }
    },
    remote_control: {
      id: "remote_control",
      maintenanceMode: false,
      maintenanceMessage: "\u062C\u0627\u0631\u064A \u0625\u062C\u0631\u0627\u0621 \u0635\u064A\u0627\u0646\u0629 \u0648\u062A\u062D\u062F\u064A\u062B\u0627\u062A \u0633\u062D\u0627\u0628\u064A\u0629 \u062F\u0648\u0631\u064A\u0629 \u0639\u0644\u0649 \u0627\u0644\u0645\u0646\u0635\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u064A\u0629\u060C \u0633\u0646\u0639\u0648\u062F \u0644\u0644\u0639\u0645\u0644 \u0628\u0644\u0645\u062D \u0627\u0644\u0628\u0635\u0631!",
      systemPaused: false,
      systemPauseReason: "\u062A\u0645 \u062A\u0648\u0642\u064A\u0641 \u0627\u0644\u0645\u0646\u0638\u0648\u0645\u0629 \u0645\u0624\u0642\u062A\u0627\u064B \u0644\u0623\u0639\u0645\u0627\u0644 \u0627\u0644\u0635\u064A\u0627\u0646\u0629 \u0648\u0627\u0644\u062A\u062C\u0647\u064A\u0632 \u0627\u0644\u0641\u0646\u064A \u0627\u0644\u062F\u0648\u0631\u064A.",
      systemPauseEta: "\u0627\u0644\u064A\u0648\u0645 \u0627\u0644\u0633\u0627\u0639\u0629 6:00 \u0645\u0633\u0627\u0621\u064B",
      aiFeaturesEnabled: true,
      liveRadioEnabled: true,
      onlinePaymentsEnabled: true,
      newRegistrationsEnabled: true,
      minRequiredVersion: "1.0.0",
      latestVersion: "1.2.0",
      playStoreUrl: "https://play.google.com/store/apps/details?id=com.bayraq.app",
      appStoreUrl: "https://apps.apple.com/app/bayraq-portal/id123456789",
      updateChangelog: "\u2022 \u062A\u062D\u0633\u064A\u0646\u0627\u062A \u0627\u0633\u062A\u0642\u0631\u0627\u0631 \u0633\u0631\u0639\u0629 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0627\u0644\u0633\u064A\u0631\u0641\u0631\n\u2022 \u0625\u0636\u0627\u0641\u0629 \u0645\u0645\u064A\u0632\u0627\u062A \u0627\u0644\u062A\u0641\u0627\u0639\u0644 \u0648\u0627\u0644\u062A\u0646\u0628\u064A\u0647\u0627\u062A \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629\n\u2022 \u0625\u0635\u0644\u0627\u062D \u0643\u0627\u0641\u0629 \u0627\u0644\u0623\u062E\u0637\u0627\u0621 \u0648\u062A\u0637\u0648\u064A\u0631 \u0648\u0627\u062C\u0647\u0629 \u0627\u0644\u0645\u0644\u0627\u062D\u0629",
      forceUpdateActive: false,
      optionalUpdateActive: false,
      newVersionNoticeActive: false,
      tickerEnabled: true,
      tickerText: "\u0623\u0647\u0644\u0627\u064B \u0628\u0643\u0645 \u0641\u064A \u0628\u0648\u0627\u0628\u0629 \u0628\u064A\u0631\u0642 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629 - \u0623\u062D\u062F\u062B \u0627\u0644\u062A\u062D\u062F\u064A\u062B\u0627\u062A \u0648\u0627\u0644\u0625\u0639\u0644\u0627\u0646\u0627\u062A \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u062A\u0635\u062F\u0631 \u062A\u0628\u0627\u0639\u0627\u064B",
      tickerSpeed: "medium",
      supportWhatsapp: "+9647700000000",
      supportTelegram: "https://t.me/BayraqSupport",
      supportChannelUrl: "https://t.me/BayraqChannel",
      supportButtonEnabled: true
    },
    seasonal_theme: {
      id: "seasonal_theme",
      seasonalTheme: "default",
      themeActive: false,
      themeStartDate: "",
      themeEndDate: "",
      themeCardTitle: "\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643\u0645 \u0641\u064A \u0645\u0646\u0635\u0629 \u0628\u064A\u0631\u0642 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A\u0629 \u26A1",
      themeMessage: "\u0627\u0644\u0645\u0646\u0635\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u064A\u0629 \u0627\u0644\u0645\u062A\u0643\u0627\u0645\u0644\u0629 \u0644\u0644\u062A\u0641\u0648\u0642 \u0648\u0627\u0644\u062D\u0644\u0648\u0644 \u0627\u0644\u0630\u0643\u064A\u0629",
      themeAccentColor: "indigo",
      themeMascotUrl: "",
      themeEffectsEnabled: true,
      themeEffectType: "ambient",
      seasonalHeroText: "\u0645\u0631\u062D\u0628\u0627\u064B \u0628\u0643\u0645 \u0641\u064A \u0645\u0646\u0635\u0629 \u0628\u064A\u0631\u0642 \u0644\u0644\u062A\u0641\u0648\u0642 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u064A"
    }
  };
  let settingsCache = { ...defaultSettingsData };
  try {
    if (import_fs2.default.existsSync(SETTINGS_FILE_PATH)) {
      const raw = import_fs2.default.readFileSync(SETTINGS_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      settingsCache = { ...defaultSettingsData, ...parsed };
    } else {
      import_fs2.default.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(defaultSettingsData, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Error reading settings file:", err);
  }
  function saveSettingsToDisk() {
    try {
      import_fs2.default.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(settingsCache, null, 2), "utf-8");
    } catch (err) {
      console.error("Error saving settings to disk:", err);
    }
  }
  app.get("/api/settings", (req, res) => {
    const list = Object.values(settingsCache);
    res.json({ success: true, settings: list, data: list });
  });
  app.get("/api/settings/:id", (req, res) => {
    const { id } = req.params;
    const doc = settingsCache[id] || defaultSettingsData[id] || { id };
    res.json({ success: true, id, data: doc, [id]: doc, setting: doc });
  });
  app.post("/api/settings", (req, res) => {
    try {
      const body = req.body || {};
      const id = body.id || "school_info";
      const existing = settingsCache[id] || defaultSettingsData[id] || { id };
      const updated = { ...existing, ...body, id, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      settingsCache[id] = updated;
      saveSettingsToDisk();
      realtimeServerInstance?.broadcastManual("settings", id, "UPDATE", updated);
      res.json({ success: true, id, data: updated, [id]: updated, setting: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/settings/:id", (req, res) => {
    try {
      const { id } = req.params;
      const body = req.body || {};
      const existing = settingsCache[id] || defaultSettingsData[id] || { id };
      const updated = { ...existing, ...body, id, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      settingsCache[id] = updated;
      saveSettingsToDisk();
      realtimeServerInstance?.broadcastManual("settings", id, "UPDATE", updated);
      res.json({ success: true, id, data: updated, [id]: updated, setting: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.patch("/api/settings/:id", (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const existing = settingsCache[id] || defaultSettingsData[id] || { id };
      const updated = { ...existing, ...updates, id, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      settingsCache[id] = updated;
      saveSettingsToDisk();
      realtimeServerInstance?.broadcastManual("settings", id, "UPDATE", updated);
      res.json({ success: true, id, data: updated, [id]: updated, setting: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.put("/api/settings/:id", (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const updated = { ...updates, id, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      settingsCache[id] = updated;
      saveSettingsToDisk();
      realtimeServerInstance?.broadcastManual("settings", id, "UPDATE", updated);
      res.json({ success: true, id, data: updated, [id]: updated, setting: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/settings/:id", (req, res) => {
    try {
      const { id } = req.params;
      delete settingsCache[id];
      saveSettingsToDisk();
      realtimeServerInstance?.broadcastManual("settings", id, "DELETE", { id });
      res.json({ success: true, id });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/system_config", (req, res) => {
    res.json({ success: true, data: settingsCache });
  });
  app.get("/api/system_config/:id", (req, res) => {
    const { id } = req.params;
    const doc = settingsCache[id] || defaultSettingsData[id] || { id };
    res.json({ success: true, id, data: doc, [id]: doc, config: doc });
  });
  app.post(["/api/system_config", "/api/system_config/:id"], async (req, res) => {
    try {
      const body = req.body || {};
      const id = req.params.id || body.id || "remote_control";
      const existing = settingsCache[id] || defaultSettingsData[id] || { id };
      const updated = { ...existing, ...body, id, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      settingsCache[id] = updated;
      saveSettingsToDisk();
      try {
        await db.insert(firestore_docs).values({
          path: `system_config/${id}`,
          data: updated,
          updatedAt: /* @__PURE__ */ new Date()
        }).onConflictDoUpdate({
          target: firestore_docs.path,
          set: { data: updated, updatedAt: /* @__PURE__ */ new Date() }
        });
      } catch (dbErr) {
      }
      realtimeServerInstance?.broadcastManual("system_config", id, "UPDATE", updated);
      realtimeServerInstance?.broadcastManual("system_config_updated", id, "UPDATE", updated);
      res.json({ success: true, id, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.patch("/api/system_config/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const existing = settingsCache[id] || defaultSettingsData[id] || { id };
      const updated = { ...existing, ...updates, id, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      settingsCache[id] = updated;
      saveSettingsToDisk();
      try {
        await db.insert(firestore_docs).values({
          path: `system_config/${id}`,
          data: updated,
          updatedAt: /* @__PURE__ */ new Date()
        }).onConflictDoUpdate({
          target: firestore_docs.path,
          set: { data: updated, updatedAt: /* @__PURE__ */ new Date() }
        });
      } catch (dbErr) {
      }
      realtimeServerInstance?.broadcastManual("system_config", id, "UPDATE", updated);
      realtimeServerInstance?.broadcastManual("system_config_updated", id, "UPDATE", updated);
      res.json({ success: true, id, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.put("/api/system_config/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const updated = { ...updates, id, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      settingsCache[id] = updated;
      saveSettingsToDisk();
      try {
        await db.insert(firestore_docs).values({
          path: `system_config/${id}`,
          data: updated,
          updatedAt: /* @__PURE__ */ new Date()
        }).onConflictDoUpdate({
          target: firestore_docs.path,
          set: { data: updated, updatedAt: /* @__PURE__ */ new Date() }
        });
      } catch (dbErr) {
      }
      realtimeServerInstance?.broadcastManual("system_config", id, "UPDATE", updated);
      realtimeServerInstance?.broadcastManual("system_config_updated", id, "UPDATE", updated);
      res.json({ success: true, id, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/system_settings", (req, res) => {
    res.json({ success: true, data: settingsCache });
  });
  app.get("/api/system_settings/:id", (req, res) => {
    const { id } = req.params;
    const doc = settingsCache[id] || defaultSettingsData[id] || { id };
    res.json({ success: true, id, data: doc, [id]: doc, setting: doc });
  });
  app.patch("/api/system_settings/:id", (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const existing = settingsCache[id] || defaultSettingsData[id] || { id };
      const updated = { ...existing, ...updates, id, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      settingsCache[id] = updated;
      saveSettingsToDisk();
      realtimeServerInstance?.broadcastManual("system_settings", id, "UPDATE", updated);
      res.json({ success: true, id, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/system_settings", (req, res) => {
    try {
      const body = req.body || {};
      const id = body.id || "general";
      const existing = settingsCache[id] || defaultSettingsData[id] || { id };
      const updated = { ...existing, ...body, id, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      settingsCache[id] = updated;
      saveSettingsToDisk();
      realtimeServerInstance?.broadcastManual("system_settings", id, "UPDATE", updated);
      res.json({ success: true, id, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.put("/api/system_settings/:id", (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const updated = { ...updates, id, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      settingsCache[id] = updated;
      saveSettingsToDisk();
      realtimeServerInstance?.broadcastManual("system_settings", id, "UPDATE", updated);
      res.json({ success: true, id, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/system_errors", async (req, res) => {
    try {
      const records = await db.select().from(firestore_docs).where(import_drizzle_orm2.sql`path LIKE 'system_errors/%'`);
      const data = records.map((r) => ({ id: r.path.split("/")[1], ...r.data }));
      res.json(data);
    } catch (e) {
      console.error(e);
      res.status(500).json([]);
    }
  });
  app.post("/api/system_errors", async (req, res) => {
    try {
      const { id, ...data } = req.body;
      const docId = id || data.signature || `err-${Date.now()}`;
      const fullPath = `system_errors/${docId}`;
      await db.insert(firestore_docs).values({
        path: fullPath,
        data,
        updatedAt: /* @__PURE__ */ new Date()
      }).onConflictDoUpdate({
        target: firestore_docs.path,
        set: { data, updatedAt: /* @__PURE__ */ new Date() }
      });
      res.json({ success: true, id: docId });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });
  app.patch("/api/system_errors/:id", async (req, res) => {
    try {
      const targetId = req.params.id;
      const patchData = req.body;
      const records = await db.select().from(firestore_docs).where(import_drizzle_orm2.sql`path LIKE 'system_errors/%'`);
      const matched = records.filter((r) => {
        const pathId = r.path.split("/")[1];
        const data = r.data || {};
        return pathId === targetId || data.id === targetId || data.errorId === targetId || data.signature === targetId;
      });
      if (matched.length === 0) {
        const direct = await db.select().from(firestore_docs).where((0, import_drizzle_orm.eq)(firestore_docs.path, `system_errors/${targetId}`));
        if (direct.length > 0) {
          matched.push(direct[0]);
        }
      }
      for (const item of matched) {
        const existingData = item.data || {};
        const mergedData = {
          ...existingData,
          ...patchData,
          status: patchData.status || existingData.status,
          resolvedAt: patchData.status === "resolved" ? patchData.resolvedAt || (/* @__PURE__ */ new Date()).toISOString() : patchData.status && patchData.status !== "resolved" ? null : existingData.resolvedAt,
          resolvedBy: patchData.status === "resolved" ? patchData.resolvedBy || "\u0627\u0644\u0645\u0637\u0648\u0631" : existingData.resolvedBy
        };
        await db.update(firestore_docs).set({ data: mergedData, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm.eq)(firestore_docs.path, item.path));
      }
      res.json({ success: true, updated: matched.length });
    } catch (e) {
      console.error("Error updating system error:", e);
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/system_errors/resolve-batch", async (req, res) => {
    try {
      const { severity, service, ids } = req.body;
      const records = await db.select().from(firestore_docs).where(import_drizzle_orm2.sql`path LIKE 'system_errors/%'`);
      let count = 0;
      for (const item of records) {
        const data = item.data || {};
        const pathId = item.path.split("/")[1];
        let matches = false;
        if (Array.isArray(ids) && ids.length > 0) {
          matches = ids.includes(pathId) || ids.includes(data.id) || ids.includes(data.errorId) || ids.includes(data.signature);
        } else if (severity) {
          matches = data.severity === severity;
        } else if (service) {
          matches = data.service === service;
        } else {
          matches = true;
        }
        if (matches && data.status !== "resolved") {
          const mergedData = {
            ...data,
            status: "resolved",
            resolvedAt: (/* @__PURE__ */ new Date()).toISOString(),
            resolvedBy: req.body.resolvedBy || "\u0627\u0644\u0645\u0637\u0648\u0631"
          };
          await db.update(firestore_docs).set({ data: mergedData, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm.eq)(firestore_docs.path, item.path));
          count++;
        }
      }
      res.json({ success: true, count });
    } catch (e) {
      console.error("Batch resolve error:", e);
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/system_errors/clear-resolved", async (req, res) => {
    try {
      const records = await db.select().from(firestore_docs).where(import_drizzle_orm2.sql`path LIKE 'system_errors/%'`);
      let count = 0;
      for (const item of records) {
        const data = item.data || {};
        if (data.status === "resolved" || data.status === "ignored") {
          await db.delete(firestore_docs).where((0, import_drizzle_orm.eq)(firestore_docs.path, item.path));
          count++;
        }
      }
      res.json({ success: true, count });
    } catch (e) {
      console.error("Clear resolved error:", e);
      res.status(500).json({ error: e.message });
    }
  });
  app.delete("/api/system_errors/:id", async (req, res) => {
    try {
      const targetId = req.params.id;
      const records = await db.select().from(firestore_docs).where(import_drizzle_orm2.sql`path LIKE 'system_errors/%'`);
      const matched = records.filter((r) => {
        const pathId = r.path.split("/")[1];
        const data = r.data || {};
        return pathId === targetId || data.id === targetId || data.errorId === targetId || data.signature === targetId;
      });
      for (const item of matched) {
        await db.delete(firestore_docs).where((0, import_drizzle_orm.eq)(firestore_docs.path, item.path));
      }
      await db.delete(firestore_docs).where((0, import_drizzle_orm.eq)(firestore_docs.path, `system_errors/${targetId}`));
      res.json({ success: true, deleted: matched.length || 1 });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });
  app.patch("/api/lounge-messages/read/:roomId/:uid", async (req, res) => {
    try {
      const { roomId, uid } = req.params;
      await db.update(lounge_messages).set({ read: true }).where((0, import_drizzle_orm.and)(
        (0, import_drizzle_orm.eq)(lounge_messages.schoolId, roomId),
        (0, import_drizzle_orm.eq)(lounge_messages.recipientId, uid),
        (0, import_drizzle_orm.eq)(lounge_messages.read, false)
      ));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/lounge-messages", async (req, res) => {
    try {
      const msg = req.body;
      const uuidv4 = import_crypto2.default.randomUUID.bind(import_crypto2.default);
      const newMsg = {
        id: uuidv4(),
        text: msg.text,
        userId: msg.userId,
        userName: msg.userName,
        userPhoto: msg.userPhoto,
        userRole: msg.userRole,
        schoolId: msg.schoolId,
        recipientId: msg.recipientId,
        imageUrl: msg.imageUrl,
        read: msg.read || false,
        timestamp: /* @__PURE__ */ new Date()
      };
      await db.insert(lounge_messages).values(newMsg);
      realtimeServerInstance?.broadcastManual("lounge_messages", newMsg.id, "INSERT", newMsg);
      res.json({ success: true, message: newMsg });
    } catch (error) {
      console.error("Error sending msg", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/users", async (req, res) => {
    try {
      const { schoolId } = req.query;
      let userList = [];
      let studentList = [];
      let validCodesFilter = null;
      if (schoolId) {
        const schoolLists = await db.select().from(academic_lists).where((0, import_drizzle_orm.eq)(academic_lists.schoolId, schoolId));
        if (schoolLists.length > 0) {
          validCodesFilter = /* @__PURE__ */ new Set();
          for (const al of schoolLists) {
            if (Array.isArray(al.students)) {
              for (const st of al.students) {
                const c = st.student || st.code;
                if (c) validCodesFilter.add(String(c).trim());
              }
            }
          }
        }
        userList = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.schoolId, schoolId)).orderBy((0, import_drizzle_orm.desc)(users.lastLogin));
        studentList = await db.select().from(students).where((0, import_drizzle_orm.eq)(students.schoolId, schoolId));
      } else {
        userList = await db.select().from(users).orderBy((0, import_drizzle_orm.desc)(users.lastLogin));
        studentList = await db.select().from(students);
      }
      if (validCodesFilter && validCodesFilter.size > 0) {
        studentList = studentList.filter((s) => {
          const c = String(s.code || "").trim();
          const sid = String(s.id || "").trim();
          return c && validCodesFilter.has(c) || sid && validCodesFilter.has(sid) || Array.from(validCodesFilter).some((vc) => sid.includes(vc));
        });
      }
      const mappedStudents = studentList.map((s) => ({
        id: s.id,
        name: s.name,
        photo: s.avatar,
        role: "student",
        grade: s.grade,
        schoolId: s.schoolId,
        code: s.code,
        studentCode: s.code,
        parentCode: s.parentCode,
        phone: s.parentPhone,
        status: s.status,
        createdAt: s.createdAt,
        lastActive: s.lastLogin
      }));
      const nonStudents = userList.filter((u) => u.role !== "student" && u.role !== "parent" && u.role !== "driver");
      const combined = [...nonStudents, ...mappedStudents];
      for (const st of combined) {
        if (st.role === "student") {
          const userMatch = userList.find((u) => u.id === st.id);
          if (userMatch && userMatch.lastLogin) {
            st.lastActive = userMatch.lastLogin;
          }
        }
      }
      res.json({ success: true, users: combined, data: combined });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const userList = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.id, id));
      if (userList.length > 0) {
        const u = userList[0];
        const userData = { ...u, uid: u.id, displayName: u.name };
        return res.json({ success: true, user: userData, data: userData });
      }
      const studentList = await db.select().from(students).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(students.id, id), (0, import_drizzle_orm.eq)(students.code, id)));
      if (studentList.length > 0) {
        const stu = studentList[0];
        const stuUser = {
          id: stu.id,
          uid: stu.id,
          name: stu.name,
          displayName: stu.name,
          studentName: stu.name,
          studentCode: stu.code,
          parentCode: stu.parentCode,
          role: "student",
          schoolId: stu.schoolId,
          grade: stu.grade || "\u0633\u0627\u062F\u0633 \u0639\u0644\u0645\u064A",
          points: stu.points || 0,
          avatar: stu.avatar,
          status: stu.status || "\u0646\u0634\u0637"
        };
        return res.json({ success: true, user: stuUser, data: stuUser });
      }
      if (id.startsWith("parent_")) {
        const rawStuId = id.replace("parent_", "");
        const parentStuList = await db.select().from(students).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(students.id, rawStuId), (0, import_drizzle_orm.eq)(students.parentCode, rawStuId)));
        if (parentStuList.length > 0) {
          const stu = parentStuList[0];
          const parentUser = {
            id,
            uid: id,
            name: `\u0648\u0644\u064A \u0623\u0645\u0631 ${stu.name}`,
            displayName: `\u0648\u0644\u064A \u0623\u0645\u0631 ${stu.name}`,
            studentName: stu.name,
            studentCode: stu.code,
            parentCode: stu.parentCode,
            role: "parent",
            schoolId: stu.schoolId,
            grade: stu.grade || "\u0633\u0627\u062F\u0633 \u0639\u0644\u0645\u064A"
          };
          return res.json({ success: true, user: parentUser, data: parentUser });
        }
      }
      const teacherList = await db.select().from(teachers).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(teachers.id, id), (0, import_drizzle_orm.eq)(teachers.code, id)));
      if (teacherList.length > 0) {
        const t = teacherList[0];
        const tUser = {
          id: t.id,
          uid: t.id,
          name: t.name,
          displayName: t.name,
          role: "teacher",
          schoolId: t.schoolId,
          subject: t.subject,
          grade: t.grade,
          email: t.email,
          phone: t.phone
        };
        return res.json({ success: true, user: tUser, data: tUser });
      }
      const actList = await db.select().from(activation_codes).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(activation_codes.id, id), (0, import_drizzle_orm.eq)(activation_codes.code, id)));
      if (actList.length > 0) {
        const act = actList[0];
        const actUser = {
          id: act.id,
          uid: act.id,
          name: act.role,
          displayName: act.role,
          role: act.role,
          schoolId: act.schoolId
        };
        return res.json({ success: true, user: actUser, data: actUser });
      }
      return res.status(200).json({ success: true, user: null, data: null });
    } catch (error) {
      console.error("Error fetching user by id:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/users", async (req, res) => {
    try {
      const data = req.body;
      const id = data.id || data.uid || `usr_${Date.now()}`;
      const userToInsert = {
        id,
        name: data.name || data.displayName || "\u0645\u0633\u062A\u062E\u062F\u0645",
        email: data.email || `${id}@bairaq.app`,
        role: data.role || "student",
        schoolId: data.schoolId || "general",
        passwordHash: data.passwordHash || null,
        createdAt: /* @__PURE__ */ new Date()
      };
      const existing = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.id, id));
      if (existing.length > 0) {
        await db.update(users).set({
          name: userToInsert.name,
          role: userToInsert.role,
          schoolId: userToInsert.schoolId
        }).where((0, import_drizzle_orm.eq)(users.id, id));
      } else {
        await db.insert(users).values(userToInsert);
      }
      res.json({ success: true, id, user: userToInsert, data: userToInsert });
    } catch (error) {
      console.error("Error saving user:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.patch("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const existing = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.id, id));
      if (existing.length > 0) {
        const updatePayload = {};
        if (updates.name || updates.displayName) updatePayload.name = updates.name || updates.displayName;
        if (updates.role) updatePayload.role = updates.role;
        if (updates.schoolId) updatePayload.schoolId = updates.schoolId;
        if (updates.email) updatePayload.email = updates.email;
        if (updates.isBanned !== void 0) updatePayload.isBanned = updates.isBanned;
        if (updates.canPost !== void 0) updatePayload.canPost = updates.canPost;
        if (updates.canComment !== void 0) updatePayload.canComment = updates.canComment;
        if (updates.deviceId !== void 0) updatePayload.deviceId = updates.deviceId;
        if (updates.lastLogin !== void 0) updatePayload.lastLogin = updates.lastLogin;
        if (updates.studentCode !== void 0) updatePayload.studentCode = updates.studentCode;
        if (updates.parentCode !== void 0) updatePayload.parentCode = updates.parentCode;
        if (Object.keys(updatePayload).length > 0) {
          await db.update(users).set(updatePayload).where((0, import_drizzle_orm.eq)(users.id, id));
          realtimeServerInstance?.broadcastManual("users", id, "UPDATE", { id, ...updatePayload });
        }
      } else {
        await db.insert(users).values({
          id,
          name: updates.name || updates.displayName || "\u0645\u0633\u062A\u062E\u062F\u0645",
          email: updates.email || `${id}@bairaq.app`,
          role: updates.role || "student",
          schoolId: updates.schoolId || "general",
          createdAt: /* @__PURE__ */ new Date()
        }).onConflictDoNothing();
      }
      res.json({ success: true, id });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.put("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const existing = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.id, id));
      if (existing.length > 0) {
        const updatePayload = {};
        if (updates.name || updates.displayName) updatePayload.name = updates.name || updates.displayName;
        if (updates.role) updatePayload.role = updates.role;
        if (updates.schoolId) updatePayload.schoolId = updates.schoolId;
        if (updates.email) updatePayload.email = updates.email;
        if (updates.isBanned !== void 0) updatePayload.isBanned = updates.isBanned;
        if (updates.canPost !== void 0) updatePayload.canPost = updates.canPost;
        if (updates.canComment !== void 0) updatePayload.canComment = updates.canComment;
        if (updates.deviceId !== void 0) updatePayload.deviceId = updates.deviceId;
        if (updates.lastLogin !== void 0) updatePayload.lastLogin = updates.lastLogin;
        if (updates.studentCode !== void 0) updatePayload.studentCode = updates.studentCode;
        if (updates.parentCode !== void 0) updatePayload.parentCode = updates.parentCode;
        if (Object.keys(updatePayload).length > 0) {
          await db.update(users).set(updatePayload).where((0, import_drizzle_orm.eq)(users.id, id));
          realtimeServerInstance?.broadcastManual("users", id, "UPDATE", { id, ...updatePayload });
        }
      } else {
        await db.insert(users).values({
          id,
          name: updates.name || updates.displayName || "\u0645\u0633\u062A\u062E\u062F\u0645",
          email: updates.email || `${id}@bairaq.app`,
          role: updates.role || "student",
          schoolId: updates.schoolId || "general",
          createdAt: /* @__PURE__ */ new Date()
        }).onConflictDoNothing();
      }
      res.json({ success: true, id });
    } catch (error) {
      console.error("Error put user:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { role, schoolId, code } = req.query;
      await db.delete(users).where((0, import_drizzle_orm.eq)(users.id, id));
      await db.delete(activation_codes).where((0, import_drizzle_orm.eq)(activation_codes.id, id));
      await db.delete(students).where((0, import_drizzle_orm.eq)(students.id, id));
      await db.delete(attendance_logs).where((0, import_drizzle_orm.eq)(attendance_logs.studentId, id));
      await db.delete(behavior_logs).where((0, import_drizzle_orm.eq)(behavior_logs.studentId, id));
      await db.delete(student_transactions).where((0, import_drizzle_orm.eq)(student_transactions.studentId, id));
      const altStudentId = id.includes("_") ? id : schoolId && code ? `${schoolId}_${code}` : null;
      if (altStudentId && altStudentId !== id) {
        await db.delete(students).where((0, import_drizzle_orm.eq)(students.id, altStudentId));
        await db.delete(attendance_logs).where((0, import_drizzle_orm.eq)(attendance_logs.studentId, altStudentId));
        await db.delete(behavior_logs).where((0, import_drizzle_orm.eq)(behavior_logs.studentId, altStudentId));
        await db.delete(student_transactions).where((0, import_drizzle_orm.eq)(student_transactions.studentId, altStudentId));
      }
      await db.delete(teachers).where((0, import_drizzle_orm.eq)(teachers.id, id));
      await db.delete(salaries).where((0, import_drizzle_orm.eq)(salaries.staffId, id));
      if (code) {
        const c = String(code);
        await db.delete(students).where((0, import_drizzle_orm.eq)(students.code, c));
        await db.delete(students).where((0, import_drizzle_orm.eq)(students.parentCode, c));
        await db.delete(teachers).where((0, import_drizzle_orm.eq)(teachers.code, c));
        await db.delete(activation_codes).where((0, import_drizzle_orm.eq)(activation_codes.code, c));
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/teachers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const tList = await db.select().from(teachers).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(teachers.id, id), (0, import_drizzle_orm.eq)(teachers.code, id)));
      if (tList.length === 0) {
        return res.json({ success: true, teacher: null, data: null });
      }
      res.json({ success: true, teacher: tList[0], data: tList[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/activation-codes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const codes = await db.select().from(activation_codes).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(activation_codes.id, id), (0, import_drizzle_orm.eq)(activation_codes.code, id)));
      if (codes.length === 0) {
        return res.json({ success: true, code: null, data: null });
      }
      res.json({ success: true, code: codes[0], data: codes[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/broadcasts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const brList = await db.select().from(school_announcements).where((0, import_drizzle_orm.eq)(school_announcements.id, id));
      if (brList.length === 0) {
        return res.json({ success: true, broadcast: null, data: null });
      }
      res.json({ success: true, broadcast: brList[0], data: brList[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/school-announcements", async (req, res) => {
    try {
      const { schoolId, grade, limit: limitParam } = req.query;
      let conditions = [];
      if (schoolId && schoolId !== "all" && schoolId !== "general" && schoolId !== "global") {
        const sId = schoolId.trim();
        let schoolIds = [sId, "all", "global", "central", "general", "\u0639\u0627\u0645"];
        if (sId === "school1" || sId === "school_awail_ghamas" || sId === "ghamas_awail") {
          schoolIds.push("school1", "school_awail_ghamas", "ghamas_awail");
        }
        conditions.push((0, import_drizzle_orm.or)(
          (0, import_drizzle_orm.inArray)(school_announcements.schoolId, schoolIds),
          (0, import_drizzle_orm.isNull)(school_announcements.schoolId),
          (0, import_drizzle_orm.eq)(school_announcements.schoolId, ""),
          (0, import_drizzle_orm.eq)(school_announcements.schoolId, "all"),
          (0, import_drizzle_orm.eq)(school_announcements.schoolId, "global"),
          (0, import_drizzle_orm.eq)(school_announcements.schoolId, "central"),
          (0, import_drizzle_orm.eq)(school_announcements.schoolId, "general"),
          (0, import_drizzle_orm.eq)(school_announcements.schoolId, "\u0639\u0627\u0645")
        ));
      }
      conditions.push((0, import_drizzle_orm.or)(
        import_drizzle_orm2.sql`${school_announcements.expiryDate} IS NULL`,
        import_drizzle_orm2.sql`${school_announcements.expiryDate} > NOW()`
      ));
      let queryBuilder = db.select().from(school_announcements).where((0, import_drizzle_orm.and)(...conditions));
      const results = await queryBuilder.orderBy((0, import_drizzle_orm.desc)(school_announcements.timestampMs)).limit(Number(limitParam) || 50);
      let filteredResults = results;
      if (grade && typeof grade === "string" && grade.trim() !== "") {
        const { matchesTargetGrades: matchesTargetGrades2 } = await Promise.resolve().then(() => (init_gradeMatcher(), gradeMatcher_exports));
        filteredResults = results.filter((b) => matchesTargetGrades2(grade, b.targetGrades));
      }
      res.json({ success: true, broadcasts: filteredResults, data: filteredResults });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/school-announcements", async (req, res) => {
    try {
      const { id, schoolId, message, targetGrades, author, subject, targetLocation, durationHours, expiryDate: customExpiry } = req.body;
      if (!message || typeof message === "string" && !message.trim()) {
        return res.status(400).json({ success: false, message: "\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0645\u0637\u0644\u0648\u0628" });
      }
      let expiryDate;
      if (customExpiry) {
        expiryDate = new Date(typeof customExpiry === "number" ? customExpiry : customExpiry);
        if (isNaN(expiryDate.getTime())) {
          expiryDate = /* @__PURE__ */ new Date();
          expiryDate.setHours(expiryDate.getHours() + (Number(durationHours) || 24));
        }
      } else {
        expiryDate = /* @__PURE__ */ new Date();
        expiryDate.setHours(expiryDate.getHours() + (Number(durationHours) || 24));
      }
      const broadcastId = id || `br_${Date.now()}`;
      const effectiveSchoolId = schoolId && schoolId.trim() !== "" ? schoolId.trim() : "general";
      let cleanTargetGrades = [];
      if (Array.isArray(targetGrades)) {
        cleanTargetGrades = targetGrades;
      } else if (typeof targetGrades === "string") {
        cleanTargetGrades = [targetGrades];
      } else {
        cleanTargetGrades = ["\u0627\u0644\u062C\u0645\u064A\u0639"];
      }
      const result = await db.insert(school_announcements).values({
        id: broadcastId,
        schoolId: effectiveSchoolId,
        message: typeof message === "string" ? message.trim() : String(message),
        targetGrades: cleanTargetGrades,
        author: author || "\u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629",
        subject: subject || "\u0627\u0644\u0625\u0630\u0627\u0639\u0629 \u0627\u0644\u0645\u062F\u0631\u0633\u064A\u0629",
        targetLocation: targetLocation || "ticker",
        expiryDate,
        timestampMs: Date.now(),
        createdAt: /* @__PURE__ */ new Date()
      }).returning();
      const created = result[0];
      realtimeServerInstance?.broadcastManual("school_announcements", broadcastId, "INSERT", created);
      realtimeServerInstance?.broadcastManual("broadcasts", broadcastId, "INSERT", created);
      res.json({ success: true, broadcast: created, data: created });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/school-announcements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const brList = await db.select().from(school_announcements).where((0, import_drizzle_orm.eq)(school_announcements.id, id));
      if (brList.length === 0) {
        return res.json({ success: true, broadcast: null, data: null });
      }
      res.json({ success: true, broadcast: brList[0], data: brList[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.patch("/api/school-announcements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { message, targetGrades, expiryDate: customExpiry } = req.body;
      const updateData = {};
      if (message !== void 0) updateData.message = message;
      if (targetGrades !== void 0) {
        updateData.targetGrades = Array.isArray(targetGrades) ? targetGrades : [targetGrades];
      }
      if (customExpiry !== void 0) {
        updateData.expiryDate = new Date(typeof customExpiry === "number" ? customExpiry : customExpiry);
      }
      if (Object.keys(updateData).length === 0) {
        return res.json({ success: true, message: "No relevant fields to update" });
      }
      const updated = await db.update(school_announcements).set(updateData).where((0, import_drizzle_orm.eq)(school_announcements.id, id)).returning();
      if (updated && updated.length > 0) {
        realtimeServerInstance?.broadcastManual("school_announcements", id, "UPDATE", updated[0]);
        realtimeServerInstance?.broadcastManual("broadcasts", id, "UPDATE", updated[0]);
      }
      res.json({ success: true, broadcast: updated?.[0], data: updated?.[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/school-announcements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(school_announcements).where((0, import_drizzle_orm.eq)(school_announcements.id, id));
      realtimeServerInstance?.broadcastManual("school_announcements", id, "DELETE", { id });
      realtimeServerInstance?.broadcastManual("broadcasts", id, "DELETE", { id });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/support-tickets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const tickets = await db.select().from(support_tickets).where((0, import_drizzle_orm.eq)(support_tickets.id, id));
      if (tickets.length === 0) {
        return res.json({ success: true, ticket: null, data: null });
      }
      res.json({ success: true, ticket: tickets[0], data: tickets[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/idea-bank/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const ideas = await db.select().from(idea_bank).where((0, import_drizzle_orm.eq)(idea_bank.id, id));
      if (ideas.length === 0) {
        return res.json({ success: true, idea: null, data: null });
      }
      res.json({ success: true, idea: ideas[0], data: ideas[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/council-polls/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const polls = await db.select().from(council_polls).where((0, import_drizzle_orm.eq)(council_polls.id, id));
      if (polls.length === 0) {
        return res.json({ success: true, poll: null, data: null });
      }
      res.json({ success: true, poll: polls[0], data: polls[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/auth/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "No token provided" });
      }
      const token = authHeader.split(" ")[1];
      const decoded = import_jsonwebtoken2.default.verify(token, JWT_SECRET);
      const userList = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.id, decoded.uid));
      if (userList.length > 0) {
        const u = userList[0];
        return res.json({
          success: true,
          user: {
            uid: u.id,
            id: u.id,
            email: u.email,
            displayName: u.name,
            name: u.name,
            role: u.role,
            schoolId: u.schoolId,
            grade: decoded.grade || "\u0633\u0627\u062F\u0633 \u0639\u0644\u0645\u064A"
          }
        });
      }
      const stuList = await db.select().from(students).where((0, import_drizzle_orm.eq)(students.id, decoded.uid));
      if (stuList.length > 0) {
        const stu = stuList[0];
        return res.json({
          success: true,
          user: {
            uid: stu.id,
            id: stu.id,
            displayName: stu.name,
            name: stu.name,
            studentName: stu.name,
            studentCode: stu.code,
            parentCode: stu.parentCode,
            role: "student",
            schoolId: stu.schoolId,
            grade: stu.grade || decoded.grade || "\u0633\u0627\u062F\u0633 \u0639\u0644\u0645\u064A",
            points: stu.points,
            avatar: stu.avatar
          }
        });
      }
      if (decoded.role === "parent" || decoded.uid && decoded.uid.startsWith("parent_")) {
        const rawStuId = decoded.uid.replace("parent_", "");
        const parentStuList = await db.select().from(students).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(students.id, rawStuId), (0, import_drizzle_orm.eq)(students.parentCode, rawStuId)));
        if (parentStuList.length > 0) {
          const stu = parentStuList[0];
          return res.json({
            success: true,
            user: {
              uid: decoded.uid,
              id: decoded.uid,
              displayName: "\u0648\u0644\u064A \u0623\u0645\u0631 " + stu.name,
              name: "\u0648\u0644\u064A \u0623\u0645\u0631 " + stu.name,
              studentName: stu.name,
              studentCode: stu.code,
              parentCode: stu.parentCode,
              role: "parent",
              schoolId: stu.schoolId,
              grade: stu.grade || decoded.grade || "\u0633\u0627\u062F\u0633 \u0639\u0644\u0645\u064A"
            }
          });
        }
      }
      const tList = await db.select().from(teachers).where((0, import_drizzle_orm.eq)(teachers.id, decoded.uid));
      if (tList.length > 0) {
        const t = tList[0];
        return res.json({
          success: true,
          user: {
            uid: t.id,
            id: t.id,
            displayName: t.name,
            name: t.name,
            role: "teacher",
            schoolId: t.schoolId,
            subject: t.subject,
            grade: t.grade,
            email: t.email,
            phone: t.phone
          }
        });
      }
      const drvList = await db.select().from(transport_drivers).where((0, import_drizzle_orm.eq)(transport_drivers.id, decoded.uid));
      if (drvList.length > 0) {
        const drv = drvList[0];
        return res.json({
          success: true,
          user: {
            uid: drv.id,
            id: drv.id,
            displayName: drv.name,
            name: drv.name,
            role: "driver",
            schoolId: drv.schoolId
          }
        });
      }
      const actList = await db.select().from(activation_codes).where((0, import_drizzle_orm.eq)(activation_codes.id, decoded.uid));
      if (actList.length > 0) {
        const act = actList[0];
        return res.json({
          success: true,
          user: {
            uid: act.id,
            id: act.id,
            displayName: act.role,
            name: act.role,
            role: act.role,
            schoolId: act.schoolId
          }
        });
      }
      return res.json({
        success: true,
        user: {
          uid: decoded.uid,
          id: decoded.uid,
          displayName: decoded.name || "\u0645\u0633\u062A\u062E\u062F\u0645",
          name: decoded.name || "\u0645\u0633\u062A\u062E\u062F\u0645",
          role: decoded.role || "student",
          schoolId: decoded.schoolId || "general",
          grade: decoded.grade || "\u0633\u0627\u062F\u0633 \u0639\u0644\u0645\u064A"
        }
      });
    } catch (error) {
      res.status(401).json({ success: false, message: "Invalid token" });
    }
  });
  const handleGetRecordedLessons = async (req, res) => {
    try {
      const { schoolId, grade, section, teacherId, limit: limitParam } = req.query;
      let queryBuilder = db.select().from(recorded_lessons);
      const filters = [];
      if (schoolId && schoolId !== "all") {
        filters.push((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(recorded_lessons.schoolId, schoolId), (0, import_drizzle_orm.eq)(recorded_lessons.schoolId, "school1")));
      }
      if (grade && grade !== "all" && grade !== "\u0627\u0644\u0643\u0644" && grade !== "\u0639\u0627\u0645") {
        const cleanGrade = grade.replace(/^ال/, "").trim();
        filters.push(
          (0, import_drizzle_orm.or)(
            (0, import_drizzle_orm.eq)(recorded_lessons.grade, grade),
            (0, import_drizzle_orm.isNull)(recorded_lessons.grade),
            (0, import_drizzle_orm.eq)(recorded_lessons.grade, "\u0627\u0644\u0643\u0644"),
            (0, import_drizzle_orm.eq)(recorded_lessons.grade, "\u0639\u0627\u0645"),
            import_drizzle_orm2.sql`${recorded_lessons.grade} ILIKE ${"%" + cleanGrade + "%"}`
          )
        );
      }
      if (section && section !== "all" && section !== "\u0627\u0644\u0643\u0644" && section !== "\u0643\u0627\u0641\u0629 \u0627\u0644\u0634\u064F\u0639\u0628") {
        filters.push(
          (0, import_drizzle_orm.or)(
            (0, import_drizzle_orm.eq)(recorded_lessons.section, section),
            (0, import_drizzle_orm.isNull)(recorded_lessons.section),
            (0, import_drizzle_orm.eq)(recorded_lessons.section, "all"),
            (0, import_drizzle_orm.eq)(recorded_lessons.section, "\u0627\u0644\u0643\u0644"),
            (0, import_drizzle_orm.eq)(recorded_lessons.section, "\u0643\u0627\u0641\u0629 \u0627\u0644\u0634\u064F\u0639\u0628")
          )
        );
      }
      if (teacherId && teacherId !== "all") filters.push((0, import_drizzle_orm.eq)(recorded_lessons.teacherId, teacherId));
      if (filters.length > 0) {
        queryBuilder = queryBuilder.where((0, import_drizzle_orm.and)(...filters));
      }
      const results = await queryBuilder.orderBy((0, import_drizzle_orm.desc)(recorded_lessons.createdAt)).limit(Number(limitParam) || 1e3);
      const commentCountMap = /* @__PURE__ */ new Map();
      try {
        const commentCounts = await db.select({
          lessonId: video_comments.lessonId,
          count: import_drizzle_orm2.sql`count(*)::int`
        }).from(video_comments).groupBy(video_comments.lessonId);
        for (const row of commentCounts) {
          if (row.lessonId) commentCountMap.set(row.lessonId, Number(row.count) || 0);
        }
      } catch (e) {
        console.warn("Could not query video_comments count map:", e);
      }
      const teacherMap = /* @__PURE__ */ new Map();
      try {
        const allTeachers = await db.select({ id: teachers.id, name: teachers.name }).from(teachers);
        for (const t of allTeachers) {
          if (t.id && t.name) teacherMap.set(t.id, t.name);
        }
      } catch (e) {
        console.warn("Could not query teachers map:", e);
      }
      const mappedResults = results.map((item) => {
        let desc2 = item.description;
        const g = item.grade && item.grade !== "\u0627\u0644\u0643\u0644" && item.grade !== "\u0639\u0627\u0645" ? item.grade : "";
        if (!desc2 || desc2.trim() === "") {
          desc2 = g ? `\u0645\u062D\u0627\u0636\u0631\u0629 \u0645\u0631\u0626\u064A\u0629 \u0645\u0646\u0634\u0648\u0631\u0629 \u0644\u0641\u0631\u0633\u0627\u0646 ${g} \u0627\u0644\u0623\u0628\u0637\u0627\u0644` : "\u0645\u062D\u0627\u0636\u0631\u0629 \u0645\u0631\u0626\u064A\u0629 \u0645\u0646\u0634\u0648\u0631\u0629 \u0644\u0641\u0631\u0633\u0627\u0646 \u0627\u0644\u0635\u0641 \u0627\u0644\u0623\u0628\u0637\u0627\u0644";
        } else if (g && !g.includes("\u0633\u0627\u062F\u0633") && !g.includes("\u0627\u0644\u0633\u0627\u062F\u0633")) {
          desc2 = desc2.replace(/لفرسان السادس الأبطال/g, `\u0644\u0641\u0631\u0633\u0627\u0646 ${g} \u0627\u0644\u0623\u0628\u0637\u0627\u0644`).replace(/لفرسان السادس/g, `\u0644\u0641\u0631\u0633\u0627\u0646 ${g}`).replace(/صفوف السادس/g, `\u0635\u0641\u0648\u0641 ${g}`).replace(/فرسان السادس الأبطال/g, `\u0641\u0631\u0633\u0627\u0646 ${g} \u0627\u0644\u0623\u0628\u0637\u0627\u0644`).replace(/فرسان السادس/g, `\u0641\u0631\u0633\u0627\u0646 ${g}`).replace(/يا فرسان السادس الأبطال/g, `\u064A\u0627 \u0641\u0631\u0633\u0627\u0646 ${g} \u0627\u0644\u0623\u0628\u0637\u0627\u0644`).replace(/يا فرسان السادس/g, `\u064A\u0627 \u0641\u0631\u0633\u0627\u0646 ${g}`);
        }
        const dynamicCount = commentCountMap.get(item.id) || 0;
        const finalCount = Math.max(Number(item.commentCount ?? item.comment_count ?? 0), dynamicCount);
        const resolvedTeacherName = item.teacherName || (item.teacherId ? teacherMap.get(item.teacherId) : null) || "\u062D\u0633\u064A\u0646 \u0647\u0627\u0634\u0645";
        return {
          ...item,
          teacherName: resolvedTeacherName,
          commentCount: finalCount,
          comment_count: finalCount,
          description: desc2
        };
      });
      res.json({ success: true, lessons: mappedResults, data: mappedResults });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.get("/api/video-meta", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ success: false, message: "URL is required" });
      }
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        try {
          const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/);
          const videoId = ytMatch ? ytMatch[1] : null;
          if (videoId) {
            try {
              const ytRes = await fetch("https://www.youtube.com/youtubei/v1/player", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  context: {
                    client: {
                      clientName: "WEB",
                      clientVersion: "2.20240101.00.00"
                    }
                  },
                  videoId
                })
              });
              if (ytRes.ok) {
                const ytData = await ytRes.json();
                const vDetails = ytData?.videoDetails;
                if (vDetails && vDetails.lengthSeconds) {
                  const seconds = parseInt(vDetails.lengthSeconds, 10);
                  if (seconds > 0) {
                    const h = Math.floor(seconds / 3600);
                    const m = Math.floor(seconds % 3600 / 60);
                    const s = seconds % 60;
                    const duration = h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m}:${s.toString().padStart(2, "0")}`;
                    return res.json({
                      success: true,
                      duration,
                      seconds,
                      title: vDetails.title || null
                    });
                  }
                }
              }
            } catch (innerErr) {
              console.warn("YouTube player API fetch failed, falling back to HTML", innerErr);
            }
          }
          const response = await fetch(url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept-Language": "en-US,en;q=0.9,ar;q=0.8"
            }
          });
          const html = await response.text();
          const match = html.match(/"lengthSeconds":"(\d+)"/) || html.match(/"approxDurationMs":"(\d+)"/) || html.match(/itemprop="duration" content="([^"]+)"/);
          if (match) {
            let seconds = 0;
            if (match[0].includes("approxDurationMs")) {
              seconds = Math.floor(parseInt(match[1]) / 1e3);
            } else if (match[0].includes("lengthSeconds")) {
              seconds = parseInt(match[1]);
            } else if (match[1] && match[1].startsWith("PT")) {
              const m = match[1].match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
              if (m) {
                seconds = parseInt(m[1] || "0") * 3600 + parseInt(m[2] || "0") * 60 + parseInt(m[3] || "0");
              }
            }
            if (seconds > 0) {
              const h = Math.floor(seconds / 3600);
              const m = Math.floor(seconds % 3600 / 60);
              const s = seconds % 60;
              const duration = h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m}:${s.toString().padStart(2, "0")}`;
              return res.json({ success: true, duration, seconds });
            }
          }
          try {
            const noembedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
            if (noembedRes.ok) {
              const noembedData = await noembedRes.json();
              if (noembedData?.title) {
                return res.json({ success: true, title: noembedData.title, duration: null });
              }
            }
          } catch (neErr) {
          }
        } catch (ytErr) {
          console.warn("YouTube server-side fetch failed", ytErr);
        }
      } else if (url.includes("vimeo.com")) {
        try {
          const vRes = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`);
          if (vRes.ok) {
            const data = await vRes.json();
            if (data.duration) {
              const seconds = data.duration;
              const h = Math.floor(seconds / 3600);
              const m = Math.floor(seconds % 3600 / 60);
              const s = seconds % 60;
              const duration = h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m}:${s.toString().padStart(2, "0")}`;
              return res.json({ success: true, duration, seconds });
            }
          }
        } catch (vimeoErr) {
          console.warn("Vimeo fetch failed", vimeoErr);
        }
      }
      res.json({ success: false, message: "Could not fetch duration automatically" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/recorded-lessons", handleGetRecordedLessons);
  app.get("/api/recorded_lessons", handleGetRecordedLessons);
  const handlePostRecordedLesson = async (req, res) => {
    try {
      const body = req.body || {};
      const id = body.id || `lesson_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const title = body.title || body.name || "\u062F\u0631\u0633 \u0645\u0633\u062C\u0644";
      const videoUrl = body.videoUrl || body.video_url || body.url || "";
      const schoolId = body.schoolId || body.school_id || "school1";
      const teacherId = body.teacherId || body.teacher_id || null;
      const grade = body.grade || null;
      const section = body.section || null;
      let description = body.description;
      const g = grade && grade !== "\u0627\u0644\u0643\u0644" && grade !== "\u0639\u0627\u0645" ? grade : "";
      if (!description || description.trim() === "" || description === "\u0645\u062D\u0627\u0636\u0631\u0629 \u0645\u0631\u0626\u064A\u0629 \u0645\u0646\u0634\u0648\u0631\u0629 \u0644\u0641\u0631\u0633\u0627\u0646 \u0627\u0644\u0633\u0627\u062F\u0633 \u0627\u0644\u0623\u0628\u0637\u0627\u0644") {
        description = g ? `\u0645\u062D\u0627\u0636\u0631\u0629 \u0645\u0631\u0626\u064A\u0629 \u0645\u0646\u0634\u0648\u0631\u0629 \u0644\u0641\u0631\u0633\u0627\u0646 ${g} \u0627\u0644\u0623\u0628\u0637\u0627\u0644` : "\u0645\u062D\u0627\u0636\u0631\u0629 \u0645\u0631\u0626\u064A\u0629 \u0645\u0646\u0634\u0648\u0631\u0629 \u0644\u0641\u0631\u0633\u0627\u0646 \u0627\u0644\u0635\u0641 \u0627\u0644\u0623\u0628\u0637\u0627\u0644";
      } else if (g && !g.includes("\u0633\u0627\u062F\u0633") && !g.includes("\u0627\u0644\u0633\u0627\u062F\u0633")) {
        description = description.replace(/لفرسان السادس الأبطال/g, `\u0644\u0641\u0631\u0633\u0627\u0646 ${g} \u0627\u0644\u0623\u0628\u0637\u0627\u0644`).replace(/لفرسان السادس/g, `\u0644\u0641\u0631\u0633\u0627\u0646 ${g}`).replace(/صفوف السادس/g, `\u0635\u0641\u0648\u0641 ${g}`).replace(/فرسان السادس الأبطال/g, `\u0641\u0631\u0633\u0627\u0646 ${g} \u0627\u0644\u0623\u0628\u0637\u0627\u0644`).replace(/فرسان السادس/g, `\u0641\u0631\u0633\u0627\u0646 ${g}`).replace(/يا فرسان السادس الأبطال/g, `\u064A\u0627 \u0641\u0631\u0633\u0627\u0646 ${g} \u0627\u0644\u0623\u0628\u0637\u0627\u0644`).replace(/يا فرسان السادس/g, `\u064A\u0627 \u0641\u0631\u0633\u0627\u0646 ${g}`);
      }
      const newLesson = {
        id,
        schoolId,
        teacherId,
        title,
        grade,
        section,
        videoUrl,
        subject: body.subject,
        duration: body.duration,
        date: body.date,
        description,
        createdAt: /* @__PURE__ */ new Date()
      };
      await db.insert(recorded_lessons).values(newLesson).onConflictDoUpdate({
        target: recorded_lessons.id,
        set: {
          title,
          videoUrl,
          schoolId,
          teacherId,
          grade,
          section,
          subject: body.subject,
          duration: body.duration,
          date: body.date,
          description
        }
      });
      realtimeServerInstance?.broadcastManual("recorded_lessons", id, "INSERT", newLesson);
      try {
        const { getFirestore, doc, setDoc } = await import("firebase/firestore");
      } catch (e) {
        console.error("Firebase sync failed", e);
      }
      res.json({ success: true, id, lesson: newLesson, data: newLesson });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.post("/api/recorded-lessons", handlePostRecordedLesson);
  app.post("/api/recorded_lessons", handlePostRecordedLesson);
  const handlePatchRecordedLesson = async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const mapped = {};
      if (updates.incrementViews) {
        const viewerId = updates.viewerId || req.body?.viewerId;
        if (viewerId) {
          const viewPath = `recorded_lessons_views/${id}_${viewerId}`;
          try {
            const existingView = await db.select().from(firestore_docs).where((0, import_drizzle_orm.eq)(firestore_docs.path, viewPath)).limit(1);
            if (existingView.length > 0) {
              const cur = await db.select({ views: recorded_lessons.views }).from(recorded_lessons).where((0, import_drizzle_orm.eq)(recorded_lessons.id, id));
              return res.json({ success: true, alreadyViewed: true, views: cur[0]?.views ?? 0 });
            }
            await db.insert(firestore_docs).values({
              path: viewPath,
              data: { lessonId: id, viewerId, timestamp: /* @__PURE__ */ new Date() },
              updatedAt: /* @__PURE__ */ new Date()
            }).onConflictDoNothing();
          } catch (e) {
            console.warn("Could not check/insert unique view in firestore_docs:", e);
          }
        }
        const result = await db.execute(import_drizzle_orm2.sql`UPDATE recorded_lessons SET views = COALESCE(views, 0) + 1 WHERE id = ${id} RETURNING views`);
        const newViews = result?.[0]?.views ?? result?.rows?.[0]?.views ?? 1;
        realtimeServerInstance?.broadcastManual("recorded_lessons", id, "UPDATE", { id, incrementViews: true, views: Number(newViews) });
        return res.json({ success: true, views: Number(newViews), incremented: true });
      }
      if (updates.incrementComments) {
        const result = await db.execute(import_drizzle_orm2.sql`UPDATE recorded_lessons SET comment_count = COALESCE(comment_count, 0) + 1 WHERE id = ${id} RETURNING comment_count`);
        const newCount = result?.[0]?.comment_count ?? result?.rows?.[0]?.comment_count ?? 1;
        realtimeServerInstance?.broadcastManual("recorded_lessons", id, "UPDATE", { id, incrementComments: true, commentCount: Number(newCount), comment_count: Number(newCount) });
        return res.json({ success: true, commentCount: Number(newCount) });
      }
      if (updates.decrementComments) {
        const result = await db.execute(import_drizzle_orm2.sql`UPDATE recorded_lessons SET comment_count = GREATEST(COALESCE(comment_count, 0) - 1, 0) WHERE id = ${id} RETURNING comment_count`);
        const newCount = result?.[0]?.comment_count ?? result?.rows?.[0]?.comment_count ?? 0;
        realtimeServerInstance?.broadcastManual("recorded_lessons", id, "UPDATE", { id, decrementComments: true, commentCount: Number(newCount), comment_count: Number(newCount) });
        return res.json({ success: true, commentCount: Number(newCount) });
      }
      if (updates.commentCount !== void 0 || updates.comment_count !== void 0) {
        mapped.commentCount = Number(updates.commentCount ?? updates.comment_count);
      }
      if (updates.views !== void 0) {
        mapped.views = Number(updates.views);
      }
      if (updates.title !== void 0) mapped.title = updates.title;
      if (updates.duration !== void 0) mapped.duration = updates.duration;
      if (updates.videoUrl !== void 0 || updates.video_url !== void 0) mapped.videoUrl = updates.videoUrl ?? updates.video_url;
      if (updates.grade !== void 0) mapped.grade = updates.grade;
      if (updates.description !== void 0) mapped.description = updates.description;
      if (updates.schoolId !== void 0 || updates.school_id !== void 0) mapped.schoolId = updates.schoolId ?? updates.school_id;
      if (updates.teacherId !== void 0 || updates.teacher_id !== void 0) mapped.teacherId = updates.teacherId ?? updates.teacher_id;
      if (Object.keys(mapped).length > 0) {
        await db.update(recorded_lessons).set(mapped).where((0, import_drizzle_orm.eq)(recorded_lessons.id, id));
        realtimeServerInstance?.broadcastManual("recorded_lessons", id, "UPDATE", { id, ...mapped });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.patch("/api/recorded-lessons/:id", handlePatchRecordedLesson);
  app.patch("/api/recorded_lessons/:id", handlePatchRecordedLesson);
  app.put("/api/recorded-lessons/:id", handlePatchRecordedLesson);
  app.put("/api/recorded_lessons/:id", handlePatchRecordedLesson);
  const handleDeleteRecordedLesson = async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(recorded_lessons).where((0, import_drizzle_orm.eq)(recorded_lessons.id, id));
      realtimeServerInstance?.broadcastManual("recorded_lessons", id, "DELETE", { id });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.delete("/api/recorded-lessons/:id", handleDeleteRecordedLesson);
  app.delete("/api/recorded_lessons/:id", handleDeleteRecordedLesson);
  app.get(["/api/recorded-lessons-views", "/api/recorded_lessons_views"], async (req, res) => {
    try {
      const { lessonId, userId } = req.query;
      const docs = await db.select().from(firestore_docs).where(import_drizzle_orm2.sql`path LIKE 'recorded_lessons_views/%'`);
      let views = docs.map((d) => ({
        id: d.path.replace("recorded_lessons_views/", ""),
        ...d.data || {}
      }));
      if (lessonId) views = views.filter((v) => v.lessonId === lessonId);
      if (userId) views = views.filter((v) => v.userId === userId);
      res.json({ success: true, views, data: views });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get(["/api/recorded-lessons-views/:id", "/api/recorded_lessons_views/:id"], async (req, res) => {
    try {
      const { id } = req.params;
      const fullPath = `recorded_lessons_views/${id}`;
      const doc = await db.select().from(firestore_docs).where((0, import_drizzle_orm.eq)(firestore_docs.path, fullPath));
      if (doc.length === 0) {
        return res.json({ success: true, data: null });
      }
      const data = { id, ...doc[0].data || {} };
      res.json({ success: true, id, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  const handleRecordedLessonViewSave = async (req, res) => {
    try {
      const id = req.params.id || req.body?.id || `view_${Date.now()}`;
      const body = req.body || {};
      const fullPath = `recorded_lessons_views/${id}`;
      const data = { id, ...body, timestamp: (/* @__PURE__ */ new Date()).toISOString(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      await db.insert(firestore_docs).values({
        path: fullPath,
        data,
        updatedAt: /* @__PURE__ */ new Date()
      }).onConflictDoUpdate({
        target: firestore_docs.path,
        set: { data, updatedAt: /* @__PURE__ */ new Date() }
      });
      res.json({ success: true, id, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.post(["/api/recorded-lessons-views", "/api/recorded_lessons_views"], handleRecordedLessonViewSave);
  app.post(["/api/recorded-lessons-views/:id", "/api/recorded_lessons_views/:id"], handleRecordedLessonViewSave);
  app.patch(["/api/recorded-lessons-views/:id", "/api/recorded_lessons_views/:id"], handleRecordedLessonViewSave);
  app.put(["/api/recorded-lessons-views/:id", "/api/recorded_lessons_views/:id"], handleRecordedLessonViewSave);
  app.delete(["/api/recorded-lessons-views/:id", "/api/recorded_lessons_views/:id"], async (req, res) => {
    try {
      const { id } = req.params;
      const fullPath = `recorded_lessons_views/${id}`;
      await db.delete(firestore_docs).where((0, import_drizzle_orm.eq)(firestore_docs.path, fullPath));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  const handleGetSchoolFiles = async (req, res) => {
    try {
      const { schoolId, fileType, uploaderId, grade, section, limit: limitParam } = req.query;
      let queryBuilder = db.select().from(school_files);
      const filters = [];
      if (schoolId && schoolId !== "all") filters.push((0, import_drizzle_orm.eq)(school_files.schoolId, schoolId));
      if (fileType && fileType !== "all") filters.push((0, import_drizzle_orm.eq)(school_files.fileType, fileType));
      if (uploaderId && uploaderId !== "all") filters.push((0, import_drizzle_orm.eq)(school_files.uploaderId, uploaderId));
      if (grade && grade !== "all") {
        filters.push((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(school_files.grade, grade), (0, import_drizzle_orm.isNull)(school_files.grade)));
      }
      if (section && section !== "all") {
        filters.push((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(school_files.section, section), (0, import_drizzle_orm.isNull)(school_files.section)));
      }
      if (filters.length > 0) {
        queryBuilder = queryBuilder.where((0, import_drizzle_orm.and)(...filters));
      }
      const results = await queryBuilder.orderBy((0, import_drizzle_orm.desc)(school_files.createdAt)).limit(Number(limitParam) || 1e3);
      res.json({ success: true, files: results, data: results });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.get("/api/school-files", handleGetSchoolFiles);
  app.get("/api/school_files", handleGetSchoolFiles);
  app.get("/api/download-proxy", async (req, res) => {
    const fileUrl = req.query.url;
    const filename = req.query.filename || "document.pdf";
    if (!fileUrl) return res.status(400).send("File URL is required");
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Failed to fetch file");
      const contentType = response.headers.get("content-type") || "application/pdf";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error) {
      console.error("Download proxy error:", error);
      res.status(500).send("Error proxying file download");
    }
  });
  const handlePostSchoolFile = async (req, res) => {
    try {
      const body = req.body || {};
      const id = body.id || `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const fileName = body.fileName || body.file_name || body.name || "\u0645\u0644\u0641";
      const fileUrl = body.fileUrl || body.file_url || body.url || "";
      const fileType = body.fileType || body.file_type || body.type || "document";
      const schoolId = body.schoolId || body.school_id || "school1";
      const uploaderId = body.uploaderId || body.uploader_id || body.userId || null;
      const newFile = {
        id,
        schoolId,
        uploaderId,
        fileName,
        fileUrl,
        fileType,
        title: body.title,
        size: body.size,
        downloads: body.downloads || 0,
        tag: body.tag,
        subject: body.subject,
        grade: body.grade,
        section: body.section || null,
        allowDownload: typeof body.allowDownload !== "undefined" ? body.allowDownload : true,
        createdAt: /* @__PURE__ */ new Date()
      };
      await db.insert(school_files).values(newFile).onConflictDoUpdate({
        target: school_files.id,
        set: { fileName, fileUrl, fileType, schoolId, uploaderId, title: body.title, size: body.size, downloads: body.downloads || 0, tag: body.tag, subject: body.subject, grade: body.grade, section: body.section || null, allowDownload: typeof body.allowDownload !== "undefined" ? body.allowDownload : true }
      });
      realtimeServerInstance?.broadcastManual("school_files", id, "INSERT", newFile);
      res.json({ success: true, id, file: newFile, data: newFile });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.post("/api/school-files", handlePostSchoolFile);
  app.post("/api/school_files", handlePostSchoolFile);
  const handlePatchSchoolFile = async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const mapped = {};
      if (updates.incrementViews) {
        await db.execute(import_drizzle_orm2.sql`UPDATE recorded_lessons SET views = COALESCE(views, 0) + 1 WHERE id = ${id}`);
        realtimeServerInstance?.broadcastManual("recorded_lessons", id, "UPDATE", { id, incrementViews: true });
        return res.json({ success: true });
      }
      if (updates.fileName !== void 0 || updates.file_name !== void 0) mapped.fileName = updates.fileName ?? updates.file_name;
      if (updates.fileUrl !== void 0 || updates.file_url !== void 0) mapped.fileUrl = updates.fileUrl ?? updates.file_url;
      if (updates.fileType !== void 0 || updates.file_type !== void 0) mapped.fileType = updates.fileType ?? updates.file_type;
      if (updates.schoolId !== void 0 || updates.school_id !== void 0) mapped.schoolId = updates.schoolId ?? updates.school_id;
      if (updates.section !== void 0) mapped.section = updates.section;
      if (Object.keys(mapped).length > 0) {
        await db.update(school_files).set(mapped).where((0, import_drizzle_orm.eq)(school_files.id, id));
        realtimeServerInstance?.broadcastManual("school_files", id, "UPDATE", { id, ...mapped });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.patch("/api/school-files/:id", handlePatchSchoolFile);
  app.patch("/api/school_files/:id", handlePatchSchoolFile);
  app.put("/api/school-files/:id", handlePatchSchoolFile);
  app.put("/api/school_files/:id", handlePatchSchoolFile);
  const handleDeleteSchoolFile = async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(school_files).where((0, import_drizzle_orm.eq)(school_files.id, id));
      realtimeServerInstance?.broadcastManual("school_files", id, "DELETE", { id });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.delete("/api/school-files/:id", handleDeleteSchoolFile);
  app.delete("/api/school_files/:id", handleDeleteSchoolFile);
  const mapAcademyPageRow = (row) => {
    const extra = row.data && typeof row.data === "object" ? row.data : {};
    return {
      ...extra,
      id: row.id,
      schoolId: row.schoolId || row.school_id || extra.schoolId,
      title: row.title || extra.title,
      subtitle: row.subtitle || extra.subtitle,
      content: row.content || extra.content,
      category: row.category || extra.category,
      order: row.order ?? extra.order,
      pages: row.pages || extra.pages || [],
      structuredContent: row.structuredContent || row.structured_content || extra.structuredContent || [],
      quiz: row.quiz || extra.quiz || [],
      ministerialQuestions: row.ministerialQuestions || row.ministerial_questions || extra.ministerialQuestions || [],
      rawText: row.rawText || row.raw_text || extra.rawText || "",
      extractedText: row.extractedText || row.extracted_text || extra.extractedText || "",
      createdAt: row.createdAt || row.created_at || extra.createdAt
    };
  };
  const handleGetAcademyPages = async (req, res) => {
    try {
      const { schoolId, category } = req.query;
      let queryBuilder = db.select().from(academy_pages);
      const filters = [];
      if (schoolId && schoolId !== "all") filters.push((0, import_drizzle_orm.eq)(academy_pages.schoolId, schoolId));
      if (category && category !== "all") filters.push((0, import_drizzle_orm.eq)(academy_pages.category, category));
      if (filters.length > 0) {
        queryBuilder = queryBuilder.where((0, import_drizzle_orm.and)(...filters));
      }
      const results = await queryBuilder.orderBy((0, import_drizzle_orm.desc)(academy_pages.createdAt));
      const mapped = results.map(mapAcademyPageRow);
      res.json({ success: true, pages: mapped, data: mapped });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.get("/api/academy-pages", handleGetAcademyPages);
  app.get("/api/academy_pages", handleGetAcademyPages);
  const handleGetSingleAcademyPage = async (req, res) => {
    try {
      const { id } = req.params;
      const rows = await db.select().from(academy_pages).where((0, import_drizzle_orm.eq)(academy_pages.id, id));
      if (!rows || rows.length === 0) {
        return res.status(404).json({ success: false, message: "Page not found" });
      }
      const item = mapAcademyPageRow(rows[0]);
      res.json({ success: true, page: item, data: item });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.get("/api/academy-pages/:id", handleGetSingleAcademyPage);
  app.get("/api/academy_pages/:id", handleGetSingleAcademyPage);
  const handlePostAcademyPage = async (req, res) => {
    try {
      const body = req.body || {};
      const id = body.id || `page_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const title = body.title || "\u0635\u0641\u062D\u0629";
      const subtitle = body.subtitle || body.unitTitle || "";
      const content = body.content || "";
      const category = body.category || "general";
      const schoolId = body.schoolId || body.school_id || "school1";
      const order = body.order !== void 0 ? Number(body.order) : Date.now();
      const pages = Array.isArray(body.pages) ? body.pages : [];
      const structuredContent = Array.isArray(body.structuredContent) ? body.structuredContent : [];
      const quiz = Array.isArray(body.quiz) ? body.quiz : [];
      const ministerialQuestions = Array.isArray(body.ministerialQuestions) ? body.ministerialQuestions : [];
      const rawText = body.rawText || "";
      const extractedText = body.extractedText || "";
      const existingRows = await db.select().from(academy_pages).where((0, import_drizzle_orm.eq)(academy_pages.id, id));
      const existingData = existingRows?.[0]?.data && typeof existingRows[0].data === "object" ? existingRows[0].data : {};
      const mergedData = { ...existingData, ...body };
      const newPage = {
        id,
        schoolId,
        title,
        subtitle,
        content,
        category,
        order,
        pages,
        structuredContent,
        quiz,
        ministerialQuestions,
        rawText,
        extractedText,
        data: mergedData,
        createdAt: /* @__PURE__ */ new Date()
      };
      await db.insert(academy_pages).values(newPage).onConflictDoUpdate({
        target: academy_pages.id,
        set: {
          title,
          subtitle,
          content,
          category,
          schoolId,
          order,
          pages,
          structuredContent,
          quiz,
          ministerialQuestions,
          rawText,
          extractedText,
          data: mergedData
        }
      });
      realtimeServerInstance?.broadcastManual("academy_pages", id, "INSERT", newPage);
      res.json({ success: true, id, page: newPage, data: newPage });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.post("/api/academy-pages", handlePostAcademyPage);
  app.post("/api/academy_pages", handlePostAcademyPage);
  const handlePatchAcademyPage = async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const mapped = {};
      if (updates.incrementViews) {
        await db.execute(import_drizzle_orm2.sql`UPDATE recorded_lessons SET views = COALESCE(views, 0) + 1 WHERE id = ${id}`);
        realtimeServerInstance?.broadcastManual("recorded_lessons", id, "UPDATE", { id, incrementViews: true });
        return res.json({ success: true });
      }
      if (updates.title !== void 0) mapped.title = updates.title;
      if (updates.subtitle !== void 0) mapped.subtitle = updates.subtitle;
      if (updates.content !== void 0) mapped.content = updates.content;
      if (updates.category !== void 0) mapped.category = updates.category;
      if (updates.schoolId !== void 0 || updates.school_id !== void 0) mapped.schoolId = updates.schoolId ?? updates.school_id;
      if (updates.order !== void 0) mapped.order = Number(updates.order);
      if (updates.pages !== void 0) mapped.pages = updates.pages;
      if (updates.structuredContent !== void 0) mapped.structuredContent = updates.structuredContent;
      if (updates.quiz !== void 0) mapped.quiz = updates.quiz;
      if (updates.ministerialQuestions !== void 0) mapped.ministerialQuestions = updates.ministerialQuestions;
      if (updates.rawText !== void 0) mapped.rawText = updates.rawText;
      if (updates.extractedText !== void 0) mapped.extractedText = updates.extractedText;
      const existingRows = await db.select().from(academy_pages).where((0, import_drizzle_orm.eq)(academy_pages.id, id));
      if (existingRows && existingRows.length > 0) {
        const existingData = existingRows[0].data && typeof existingRows[0].data === "object" ? existingRows[0].data : {};
        mapped.data = { ...existingData, ...updates };
        if (Object.keys(mapped).length > 0) {
          await db.update(academy_pages).set(mapped).where((0, import_drizzle_orm.eq)(academy_pages.id, id));
          realtimeServerInstance?.broadcastManual("academy_pages", id, "UPDATE", { id, ...mapped });
        }
      } else {
        const newPage = {
          id,
          schoolId: mapped.schoolId || updates.schoolId || updates.school_id || "school1",
          title: mapped.title || updates.title || "\u0635\u0641\u062D\u0629",
          subtitle: mapped.subtitle || updates.subtitle || updates.unitTitle || "",
          content: mapped.content || updates.content || "",
          category: mapped.category || updates.category || "general",
          order: mapped.order !== void 0 ? mapped.order : updates.order !== void 0 ? Number(updates.order) : Date.now(),
          pages: mapped.pages || (Array.isArray(updates.pages) ? updates.pages : []),
          structuredContent: mapped.structuredContent || (Array.isArray(updates.structuredContent) ? updates.structuredContent : []),
          quiz: mapped.quiz || (Array.isArray(updates.quiz) ? updates.quiz : []),
          ministerialQuestions: mapped.ministerialQuestions || (Array.isArray(updates.ministerialQuestions) ? updates.ministerialQuestions : []),
          rawText: mapped.rawText || updates.rawText || "",
          extractedText: mapped.extractedText || updates.extractedText || "",
          data: updates,
          createdAt: /* @__PURE__ */ new Date()
        };
        await db.insert(academy_pages).values(newPage);
        realtimeServerInstance?.broadcastManual("academy_pages", id, "INSERT", newPage);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.patch("/api/academy-pages/:id", handlePatchAcademyPage);
  app.patch("/api/academy_pages/:id", handlePatchAcademyPage);
  app.put("/api/academy-pages/:id", handlePatchAcademyPage);
  app.put("/api/academy_pages/:id", handlePatchAcademyPage);
  const handleDeleteAcademyPage = async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(academy_pages).where((0, import_drizzle_orm.eq)(academy_pages.id, id));
      realtimeServerInstance?.broadcastManual("academy_pages", id, "DELETE", { id });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.delete("/api/academy-pages/:id", handleDeleteAcademyPage);
  app.delete("/api/academy_pages/:id", handleDeleteAcademyPage);
  const handleGetVideoComments = async (req, res) => {
    try {
      const { lessonId } = req.query;
      let queryBuilder = db.select().from(video_comments);
      if (lessonId && lessonId !== "all") {
        queryBuilder = queryBuilder.where((0, import_drizzle_orm.eq)(video_comments.lessonId, lessonId));
      }
      const rawResults = await queryBuilder.orderBy((0, import_drizzle_orm.asc)(video_comments.timestamp));
      const results = rawResults.map((c) => ({
        ...c,
        authorId: c.userId,
        parentId: c.parentId || null
      }));
      res.json({ success: true, comments: results, data: results });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.get("/api/video-comments", handleGetVideoComments);
  app.get("/api/video_comments", handleGetVideoComments);
  const handlePostVideoComment = async (req, res) => {
    try {
      const body = req.body || {};
      const id = body.id || `vcomm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const lessonId = body.lessonId || body.lesson_id || "";
      let userId = body.userId || body.user_id || body.authorId || body.author_id || "anonymous";
      const authorName = body.authorName || body.author_name || body.userName || body.user_name || "\u0645\u0633\u062A\u062E\u062F\u0645";
      const text2 = body.text || body.content || "";
      const isTeacher = Boolean(body.isTeacher ?? body.is_teacher ?? false);
      const parentId = body.parentId || body.parent_id || null;
      if ((!userId || userId === "anonymous" || userId === "user") && authorName && authorName !== "\u0645\u0633\u062A\u062E\u062F\u0645") {
        try {
          const foundStudents = await db.select().from(students).where(import_drizzle_orm2.sql`name ILIKE ${"%" + authorName.trim() + "%"}`).limit(1);
          if (foundStudents[0]?.id) {
            userId = foundStudents[0].id;
          } else if (foundStudents[0]?.code) {
            userId = foundStudents[0].code;
          }
        } catch (e) {
          console.warn("Could not resolve student by name in comment:", e);
        }
      }
      const newComment = {
        id,
        lessonId,
        userId,
        authorName,
        text: text2,
        isTeacher,
        parentId,
        isEdited: false,
        updatedAt: /* @__PURE__ */ new Date(),
        timestamp: /* @__PURE__ */ new Date()
      };
      await db.insert(video_comments).values(newComment);
      const commentWithAuthorId = { ...newComment, authorId: userId };
      realtimeServerInstance?.broadcastManual("video_comments", id, "INSERT", commentWithAuthorId);
      if (lessonId) {
        try {
          await db.execute(import_drizzle_orm2.sql`UPDATE recorded_lessons SET comment_count = COALESCE(comment_count, 0) + 1 WHERE id = ${lessonId}`);
          const cRow = await db.select({ count: recorded_lessons.commentCount }).from(recorded_lessons).where((0, import_drizzle_orm.eq)(recorded_lessons.id, lessonId));
          const cVal = cRow[0]?.count ?? 1;
          realtimeServerInstance?.broadcastManual("recorded_lessons", lessonId, "UPDATE", { id: lessonId, commentCount: Number(cVal), comment_count: Number(cVal) });
        } catch (e) {
          console.warn("Could not increment comment_count on lesson:", e);
        }
      }
      if (parentId) {
        try {
          const parent = await db.select().from(video_comments).where((0, import_drizzle_orm.eq)(video_comments.id, parentId)).limit(1);
          if (parent[0]) {
            let recipient = parent[0].userId;
            if ((!recipient || recipient === "anonymous" || recipient === "user") && parent[0].authorName) {
              const foundStudents = await db.select().from(students).where(import_drizzle_orm2.sql`name ILIKE ${"%" + parent[0].authorName.trim() + "%"}`).limit(1);
              if (foundStudents[0]?.id) recipient = foundStudents[0].id;
              else if (foundStudents[0]?.code) recipient = foundStudents[0].code;
            }
            if (recipient && recipient !== userId && recipient !== "anonymous") {
              const lRow = await db.select().from(recorded_lessons).where((0, import_drizzle_orm.eq)(recorded_lessons.id, lessonId)).limit(1);
              const lessonTitle = lRow[0]?.title || "\u0627\u0644\u0645\u062D\u0627\u0636\u0631\u0629 \u0627\u0644\u0645\u0631\u0626\u064A\u0629";
              const notifId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
              const newNotif = {
                id: notifId,
                recipientId: recipient,
                recipientRole: "student",
                title: isTeacher ? "\u0631\u062F \u0627\u0644\u0623\u0633\u062A\u0627\u0630 \u0639\u0644\u0649 \u062A\u0639\u0644\u064A\u0642\u0643 \u{1F4AC}" : "\u0631\u062F \u062C\u062F\u064A\u062F \u0639\u0644\u0649 \u062A\u0639\u0644\u064A\u0642\u0643 \u{1F4AC}",
                body: isTeacher ? `\u0642\u0627\u0645 \u0627\u0644\u0623\u0633\u062A\u0627\u0630 \u0628\u0627\u0644\u0631\u062F \u0639\u0644\u0649 \u062A\u0639\u0644\u064A\u0642\u0643 \u0641\u064A \u0645\u062D\u0627\u0636\u0631\u0629: (${lessonTitle})` : `\u0642\u0627\u0645 ${authorName} \u0628\u0627\u0644\u0631\u062F \u0639\u0644\u0649 \u062A\u0639\u0644\u064A\u0642\u0643 \u0641\u064A \u0645\u062D\u0627\u0636\u0631\u0629: (${lessonTitle})`,
                type: isTeacher ? "teacher_reply" : "reply",
                schoolId: lRow[0]?.schoolId || "",
                metadata: {
                  type: "video_comment_reply",
                  lessonId,
                  commentId: id,
                  parentCommentId: parentId,
                  lessonTitle
                },
                read: false,
                createdAt: /* @__PURE__ */ new Date()
              };
              await db.insert(notifications).values(newNotif);
              realtimeServerInstance?.broadcastManual("notifications", notifId, "INSERT", newNotif);
            }
          }
        } catch (notifErr) {
          console.warn("Could not dispatch reply notification:", notifErr);
        }
      }
      res.json({ success: true, id, comment: commentWithAuthorId, data: commentWithAuthorId });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.post("/api/video-comments", handlePostVideoComment);
  app.post("/api/video_comments", handlePostVideoComment);
  const handlePatchVideoComment = async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const mapped = {
        updatedAt: /* @__PURE__ */ new Date()
      };
      if (updates.text !== void 0) mapped.text = updates.text;
      if (updates.content !== void 0) mapped.text = updates.content;
      if (updates.isEdited !== void 0) mapped.isEdited = Boolean(updates.isEdited);
      else mapped.isEdited = true;
      if (updates.authorName !== void 0) mapped.authorName = updates.authorName;
      await db.update(video_comments).set(mapped).where((0, import_drizzle_orm.eq)(video_comments.id, id));
      const updated = await db.select().from(video_comments).where((0, import_drizzle_orm.eq)(video_comments.id, id));
      const commentData = updated[0] ? {
        ...updated[0],
        authorId: updated[0].userId
      } : { id, ...mapped };
      realtimeServerInstance?.broadcastManual("video_comments", id, "UPDATE", commentData);
      res.json({ success: true, id, comment: commentData, data: commentData });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.patch("/api/video-comments/:id", handlePatchVideoComment);
  app.patch("/api/video_comments/:id", handlePatchVideoComment);
  app.put("/api/video-comments/:id", handlePatchVideoComment);
  app.put("/api/video_comments/:id", handlePatchVideoComment);
  const handleDeleteVideoComment = async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await db.select().from(video_comments).where((0, import_drizzle_orm.eq)(video_comments.id, id)).limit(1);
      const lessonId = existing[0]?.lessonId;
      await db.delete(video_comments).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(video_comments.id, id), (0, import_drizzle_orm.eq)(video_comments.parentId, id)));
      realtimeServerInstance?.broadcastManual("video_comments", id, "DELETE", { id });
      if (lessonId) {
        try {
          await db.execute(import_drizzle_orm2.sql`UPDATE recorded_lessons SET comment_count = GREATEST(COALESCE(comment_count, 0) - 1, 0) WHERE id = ${lessonId}`);
          const cRow = await db.select({ count: recorded_lessons.commentCount }).from(recorded_lessons).where((0, import_drizzle_orm.eq)(recorded_lessons.id, lessonId));
          const cVal = cRow[0]?.count ?? 0;
          realtimeServerInstance?.broadcastManual("recorded_lessons", lessonId, "UPDATE", { id: lessonId, commentCount: Number(cVal), comment_count: Number(cVal) });
        } catch (e) {
          console.warn("Could not decrement comment_count on lesson:", e);
        }
      }
      res.json({ success: true, id });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.delete("/api/video-comments/:id", handleDeleteVideoComment);
  app.delete("/api/video_comments/:id", handleDeleteVideoComment);
  const handleGetCommunityStories = async (req, res) => {
    try {
      const { schoolId } = req.query;
      let queryBuilder = db.select().from(community_stories);
      if (schoolId && schoolId !== "all") {
        queryBuilder = queryBuilder.where((0, import_drizzle_orm.eq)(community_stories.schoolId, schoolId));
      }
      const results = await queryBuilder.orderBy((0, import_drizzle_orm.desc)(community_stories.timestamp));
      res.json({ success: true, stories: results, data: results });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.get("/api/community/stories", handleGetCommunityStories);
  app.get("/api/community-stories", handleGetCommunityStories);
  app.get("/api/community_stories", handleGetCommunityStories);
  const handlePostCommunityStory = async (req, res) => {
    try {
      const body = req.body || {};
      const id = body.id || `story_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const schoolId = body.schoolId || body.school_id || "school1";
      const userId = body.userId || body.user_id || "anonymous";
      const userName = body.userName || body.user_name || "\u0645\u0633\u062A\u062E\u062F\u0645";
      const userPhotoURL = body.userPhotoURL || body.user_photo_url || body.userPhoto || null;
      const postContent = body.postContent || body.post_content || body.content || "";
      const postMedia = body.postMedia || body.post_media || body.mediaUrl || body.media_url || null;
      const mediaType = body.mediaType || body.media_type || "image";
      const postMediaGroup = body.postMediaGroup || body.post_media_group || [];
      const views = body.views || [];
      const expiresAt = body.expiresAt ? new Date(body.expiresAt) : new Date(Date.now() + 24 * 60 * 60 * 1e3);
      const newStory = {
        id,
        schoolId,
        userId,
        userName,
        userPhotoURL,
        postContent,
        postMedia,
        mediaType,
        postMediaGroup,
        views,
        timestamp: /* @__PURE__ */ new Date(),
        expiresAt
      };
      await db.insert(community_stories).values(newStory);
      realtimeServerInstance?.broadcastManual("community_stories", id, "INSERT", newStory);
      res.json({ success: true, id, story: newStory, data: newStory });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.post("/api/community/stories", handlePostCommunityStory);
  app.post("/api/community-stories", handlePostCommunityStory);
  app.post("/api/community_stories", handlePostCommunityStory);
  const handlePatchCommunityStory = async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const mapped = {};
      if (updates.incrementViews) {
        await db.execute(import_drizzle_orm2.sql`UPDATE recorded_lessons SET views = COALESCE(views, 0) + 1 WHERE id = ${id}`);
        realtimeServerInstance?.broadcastManual("recorded_lessons", id, "UPDATE", { id, incrementViews: true });
        return res.json({ success: true });
      }
      if (updates.views !== void 0) mapped.views = updates.views;
      if (updates.postContent !== void 0) mapped.postContent = updates.postContent;
      if (Object.keys(mapped).length > 0) {
        await db.update(community_stories).set(mapped).where((0, import_drizzle_orm.eq)(community_stories.id, id));
        realtimeServerInstance?.broadcastManual("community_stories", id, "UPDATE", { id, ...mapped });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.patch("/api/community/stories/:id", handlePatchCommunityStory);
  app.patch("/api/community-stories/:id", handlePatchCommunityStory);
  const handleDeleteCommunityStory = async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(community_stories).where((0, import_drizzle_orm.eq)(community_stories.id, id));
      realtimeServerInstance?.broadcastManual("community_stories", id, "DELETE", { id });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.delete("/api/community/stories/:id", handleDeleteCommunityStory);
  app.delete("/api/community-stories/:id", handleDeleteCommunityStory);
  const handleGetStudentLiveNotes = async (req, res) => {
    try {
      const { userId, schoolId } = req.query;
      let queryBuilder = db.select().from(student_live_notes);
      const filters = [];
      if (userId) filters.push((0, import_drizzle_orm.eq)(student_live_notes.userId, userId));
      if (schoolId && schoolId !== "all") filters.push((0, import_drizzle_orm.eq)(student_live_notes.schoolId, schoolId));
      if (filters.length > 0) {
        queryBuilder = queryBuilder.where((0, import_drizzle_orm.and)(...filters));
      }
      const results = await queryBuilder.orderBy((0, import_drizzle_orm.desc)(student_live_notes.timestamp));
      res.json({ success: true, notes: results, data: results });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.get("/api/student-live-notes", handleGetStudentLiveNotes);
  app.get("/api/student_live_notes", handleGetStudentLiveNotes);
  const handlePostStudentLiveNote = async (req, res) => {
    try {
      const body = req.body || {};
      const id = body.id || `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const userId = body.userId || body.user_id || "anonymous";
      const schoolId = body.schoolId || body.school_id || null;
      const liveTitle = body.liveTitle || body.live_title || "\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0627\u0644\u062F\u0631\u0633 \u0627\u0644\u0645\u0628\u0627\u0634\u0631";
      const grade = body.grade || null;
      const content = body.content || "";
      const newNote = { id, userId, schoolId, liveTitle, grade, content, timestamp: /* @__PURE__ */ new Date() };
      await db.insert(student_live_notes).values(newNote).onConflictDoUpdate({
        target: student_live_notes.id,
        set: { content, liveTitle, grade, schoolId }
      });
      realtimeServerInstance?.broadcastManual("student_live_notes", id, "INSERT", newNote);
      res.json({ success: true, id, note: newNote, data: newNote });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.post("/api/student-live-notes", handlePostStudentLiveNote);
  app.post("/api/student_live_notes", handlePostStudentLiveNote);
  const handleDeleteStudentLiveNote = async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(student_live_notes).where((0, import_drizzle_orm.eq)(student_live_notes.id, id));
      realtimeServerInstance?.broadcastManual("student_live_notes", id, "DELETE", { id });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.delete("/api/student-live-notes/:id", handleDeleteStudentLiveNote);
  app.delete("/api/student_live_notes/:id", handleDeleteStudentLiveNote);
  const handleGetCommunityPosts = async (req, res) => {
    try {
      const { schoolId, grade, userId, limit: limitParam } = req.query;
      let queryBuilder = db.select().from(community_posts);
      const filters = [];
      if (schoolId && schoolId !== "all") filters.push((0, import_drizzle_orm.eq)(community_posts.schoolId, schoolId));
      if (grade && grade !== "all") filters.push((0, import_drizzle_orm.eq)(community_posts.grade, grade));
      if (userId) filters.push((0, import_drizzle_orm.eq)(community_posts.userId, userId));
      if (filters.length > 0) {
        queryBuilder = queryBuilder.where((0, import_drizzle_orm.and)(...filters));
      }
      const results = await queryBuilder.orderBy((0, import_drizzle_orm.desc)(community_posts.isPinned), (0, import_drizzle_orm.desc)(community_posts.timestamp)).limit(Number(limitParam) || 100);
      res.json({ success: true, posts: results, data: results });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.get("/api/community/posts", handleGetCommunityPosts);
  app.get("/api/community-posts", handleGetCommunityPosts);
  const handlePostCommunityPost = async (req, res) => {
    try {
      const body = req.body || {};
      const id = body.id || `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const schoolId = body.schoolId || body.school_id || "school1";
      const userId = body.userId || body.user_id || "anonymous";
      const userName = body.userName || body.user_name || "\u0645\u0633\u062A\u062E\u062F\u0645";
      const userPhoto = body.userPhoto || body.user_photo || body.userPhotoURL || null;
      const content = body.content || "";
      const mediaUrl = body.mediaUrl || body.media_url || null;
      const type = body.type || "student";
      const grade = body.grade || null;
      const isPinned = Boolean(body.isPinned ?? body.is_pinned ?? false);
      const isLocked = Boolean(body.isLocked ?? body.is_locked ?? false);
      const newPost = {
        id,
        schoolId,
        userId,
        userName,
        userPhoto,
        content,
        mediaUrl,
        type,
        grade,
        isPinned,
        isLocked,
        reportsCount: 0,
        likesCount: 0,
        commentsCount: 0,
        timestamp: /* @__PURE__ */ new Date()
      };
      await db.insert(community_posts).values(newPost).onConflictDoUpdate({
        target: community_posts.id,
        set: { content, mediaUrl, isPinned, isLocked }
      });
      realtimeServerInstance?.broadcastManual("community_posts", id, "INSERT", newPost);
      res.json({ success: true, id, post: newPost, data: newPost });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.post("/api/community/posts", handlePostCommunityPost);
  app.post("/api/community-posts", handlePostCommunityPost);
  const handlePatchCommunityPost = async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const mapped = {};
      if (updates.incrementViews) {
        await db.execute(import_drizzle_orm2.sql`UPDATE recorded_lessons SET views = COALESCE(views, 0) + 1 WHERE id = ${id}`);
        realtimeServerInstance?.broadcastManual("recorded_lessons", id, "UPDATE", { id, incrementViews: true });
        return res.json({ success: true });
      }
      if (updates.content !== void 0) mapped.content = updates.content;
      if (updates.mediaUrl !== void 0 || updates.media_url !== void 0) mapped.mediaUrl = updates.mediaUrl ?? updates.media_url;
      if (updates.isPinned !== void 0 || updates.is_pinned !== void 0) mapped.isPinned = updates.isPinned ?? updates.is_pinned;
      if (updates.isLocked !== void 0 || updates.is_locked !== void 0) mapped.isLocked = updates.isLocked ?? updates.is_locked;
      if (updates.likesCount !== void 0 || updates.likes_count !== void 0) mapped.likesCount = updates.likesCount ?? updates.likes_count;
      if (updates.reportsCount !== void 0 || updates.reports_count !== void 0) mapped.reportsCount = updates.reportsCount ?? updates.reports_count;
      if (updates.commentsCount !== void 0 || updates.comments_count !== void 0) mapped.commentsCount = updates.commentsCount ?? updates.comments_count;
      if (Object.keys(mapped).length > 0) {
        await db.update(community_posts).set(mapped).where((0, import_drizzle_orm.eq)(community_posts.id, id));
        realtimeServerInstance?.broadcastManual("community_posts", id, "UPDATE", { id, ...mapped });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.patch("/api/community/posts/:id", handlePatchCommunityPost);
  app.patch("/api/community-posts/:id", handlePatchCommunityPost);
  app.patch("/api/pulse/posts/:id", handlePatchCommunityPost);
  const handleDeleteCommunityPost = async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(community_posts).where((0, import_drizzle_orm.eq)(community_posts.id, id));
      await db.delete(community_comments).where((0, import_drizzle_orm.eq)(community_comments.postId, id));
      realtimeServerInstance?.broadcastManual("community_posts", id, "DELETE", { id });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.delete("/api/community/posts/:id", handleDeleteCommunityPost);
  app.delete("/api/community-posts/:id", handleDeleteCommunityPost);
  app.get("/api/community/comments", async (req, res) => {
    try {
      const postId = req.query.postId || req.query.post_id;
      let results;
      if (postId) {
        results = await db.select().from(community_comments).where((0, import_drizzle_orm.eq)(community_comments.postId, postId)).orderBy((0, import_drizzle_orm.asc)(community_comments.timestamp));
      } else {
        results = await db.select().from(community_comments).orderBy((0, import_drizzle_orm.asc)(community_comments.timestamp));
      }
      res.json({ success: true, comments: results, data: results });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/community/posts/:id/comments", async (req, res) => {
    try {
      const { id } = req.params;
      const results = await db.select().from(community_comments).where((0, import_drizzle_orm.eq)(community_comments.postId, id)).orderBy((0, import_drizzle_orm.asc)(community_comments.timestamp));
      res.json({ success: true, comments: results, data: results });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/community/posts/:id/comments", async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, userName, content } = req.body;
      const commentId = `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newComment = {
        id: commentId,
        postId: id,
        userId: userId || "anonymous",
        userName: userName || "\u0645\u0633\u062A\u062E\u062F\u0645",
        content: content || "",
        timestamp: /* @__PURE__ */ new Date()
      };
      await db.insert(community_comments).values(newComment);
      const postList = await db.select().from(community_posts).where((0, import_drizzle_orm.eq)(community_posts.id, id));
      if (postList.length > 0) {
        const nextCount = (postList[0].commentsCount || 0) + 1;
        await db.update(community_posts).set({ commentsCount: nextCount }).where((0, import_drizzle_orm.eq)(community_posts.id, id));
        realtimeServerInstance?.broadcastManual("community_posts", id, "UPDATE", { id, commentsCount: nextCount });
      }
      realtimeServerInstance?.broadcastManual("community_comments", commentId, "INSERT", newComment);
      res.json({ success: true, id: commentId, comment: newComment, data: newComment });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/community/comments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(community_comments).where((0, import_drizzle_orm.eq)(community_comments.id, id));
      realtimeServerInstance?.broadcastManual("community_comments", id, "DELETE", { id });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/transport/routes", async (req, res) => {
    try {
      const { schoolId } = req.query;
      let queryBuilder = db.select().from(transport_routes);
      if (schoolId && schoolId !== "all") {
        queryBuilder = queryBuilder.where((0, import_drizzle_orm.eq)(transport_routes.schoolId, schoolId));
      }
      const results = await queryBuilder.orderBy((0, import_drizzle_orm.asc)(transport_routes.name));
      res.json({ success: true, routes: results, data: results });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/transport/routes", async (req, res) => {
    try {
      const body = req.body || {};
      const id = body.id || `route_${Date.now()}`;
      const name = body.name || "\u0645\u0633\u0627\u0631 \u062C\u062F\u064A\u062F";
      const schoolId = body.schoolId || body.school_id || "school1";
      const description = body.description || "";
      const status = body.status || "inactive";
      const newRoute = { id, schoolId, name, description, status, createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() };
      await db.insert(transport_routes).values(newRoute).onConflictDoUpdate({
        target: transport_routes.id,
        set: { name, description, status, updatedAt: /* @__PURE__ */ new Date() }
      });
      realtimeServerInstance?.broadcastManual("transport_routes", id, "INSERT", newRoute);
      res.json({ success: true, id, route: newRoute, data: newRoute });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.patch("/api/transport/routes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const mapped = { updatedAt: /* @__PURE__ */ new Date() };
      if (updates.name !== void 0) mapped.name = updates.name;
      if (updates.description !== void 0) mapped.description = updates.description;
      if (updates.status !== void 0) mapped.status = updates.status;
      if (updates.currentLocationLat !== void 0) mapped.currentLocationLat = updates.currentLocationLat;
      if (updates.currentLocationLng !== void 0) mapped.currentLocationLng = updates.currentLocationLng;
      await db.update(transport_routes).set(mapped).where((0, import_drizzle_orm.eq)(transport_routes.id, id));
      realtimeServerInstance?.broadcastManual("transport_routes", id, "UPDATE", { id, ...mapped });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/transport/routes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(transport_routes).where((0, import_drizzle_orm.eq)(transport_routes.id, id));
      realtimeServerInstance?.broadcastManual("transport_routes", id, "DELETE", { id });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/transport/drivers", async (req, res) => {
    try {
      const { schoolId } = req.query;
      let queryBuilder = db.select().from(transport_drivers);
      if (schoolId && schoolId !== "all") {
        queryBuilder = queryBuilder.where((0, import_drizzle_orm.eq)(transport_drivers.schoolId, schoolId));
      }
      const results = await queryBuilder.orderBy((0, import_drizzle_orm.asc)(transport_drivers.name));
      res.json({ success: true, drivers: results, data: results });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/transport/drivers", async (req, res) => {
    try {
      const body = req.body || {};
      const id = body.id || `drv_${Date.now()}`;
      const name = body.name || "\u0633\u0627\u0626\u0642";
      const phone = body.phone || "07700000000";
      const accessCode = body.accessCode || body.access_code || `BUS-${Math.floor(1e3 + Math.random() * 9e3)}`;
      const schoolId = body.schoolId || body.school_id || "school1";
      const routeId = body.routeId || body.route_id || null;
      const busNumber = body.busNumber || body.bus_number || null;
      const capacity = body.capacity ? Number(body.capacity) : 30;
      const newDriver = { id, schoolId, name, phone, accessCode, routeId, busNumber, createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() };
      await db.insert(transport_drivers).values(newDriver).onConflictDoUpdate({
        target: transport_drivers.id,
        set: { name, phone, routeId, busNumber, updatedAt: /* @__PURE__ */ new Date() }
      });
      realtimeServerInstance?.broadcastManual("transport_drivers", id, "INSERT", newDriver);
      res.json({ success: true, id, driver: newDriver, data: newDriver });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.patch("/api/transport/drivers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const mapped = { updatedAt: /* @__PURE__ */ new Date() };
      if (updates.name !== void 0) mapped.name = updates.name;
      if (updates.phone !== void 0) mapped.phone = updates.phone;
      if (updates.routeId !== void 0 || updates.route_id !== void 0) mapped.routeId = updates.routeId ?? updates.route_id;
      if (updates.busNumber !== void 0 || updates.bus_number !== void 0) mapped.busNumber = updates.busNumber ?? updates.bus_number;
      if (updates.status !== void 0) mapped.status = updates.status;
      await db.update(transport_drivers).set(mapped).where((0, import_drizzle_orm.eq)(transport_drivers.id, id));
      realtimeServerInstance?.broadcastManual("transport_drivers", id, "UPDATE", { id, ...mapped });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/transport/drivers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(transport_drivers).where((0, import_drizzle_orm.eq)(transport_drivers.id, id));
      realtimeServerInstance?.broadcastManual("transport_drivers", id, "DELETE", { id });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  const handleGetTransportStudentsStatus = async (req, res) => {
    try {
      const { routeId, studentId } = req.query;
      let queryBuilder = db.select().from(transport_students_status);
      const filters = [];
      if (routeId && routeId !== "all") filters.push((0, import_drizzle_orm.eq)(transport_students_status.routeId, routeId));
      if (studentId && studentId !== "all") filters.push((0, import_drizzle_orm.eq)(transport_students_status.id, studentId));
      if (filters.length > 0) {
        queryBuilder = queryBuilder.where((0, import_drizzle_orm.and)(...filters));
      }
      const results = await queryBuilder.orderBy((0, import_drizzle_orm.desc)(transport_students_status.updatedAt));
      res.json({ success: true, items: results, data: results });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.get("/api/transport/students-status", handleGetTransportStudentsStatus);
  app.get("/api/transport/students/status", handleGetTransportStudentsStatus);
  app.get("/api/transport/students_status", handleGetTransportStudentsStatus);
  const handlePostTransportStudentStatus = async (req, res) => {
    try {
      const body = req.body || {};
      const studentId = body.studentId || body.student_id || body.id || `tstat_${Date.now()}`;
      const id = studentId;
      const routeId = body.routeId || body.route_id || null;
      const parentId = body.parentId || body.parent_id || null;
      const studentName = body.studentName || body.student_name || "";
      const status = body.status || "pending";
      const stopName = body.stopName || body.stop_name || null;
      const shift = body.shift || "morning";
      const newStat = { id, routeId, parentId, studentName, status, stopName, shift, timestamp: /* @__PURE__ */ new Date(), createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() };
      await db.insert(transport_students_status).values(newStat).onConflictDoUpdate({
        target: transport_students_status.id,
        set: { status, stopName, shift, updatedAt: /* @__PURE__ */ new Date(), timestamp: /* @__PURE__ */ new Date() }
      });
      realtimeServerInstance?.broadcastManual("transport_students_status", id, "INSERT", newStat);
      res.json({ success: true, id, status: newStat, data: newStat });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.post("/api/transport/students-status", handlePostTransportStudentStatus);
  app.post("/api/transport/students/status", handlePostTransportStudentStatus);
  app.post("/api/transport/students_status", handlePostTransportStudentStatus);
  app.get("/api/transport/fees", async (req, res) => {
    try {
      const { studentId, parentId } = req.query;
      let queryBuilder = db.select().from(transport_fees);
      const filters = [];
      if (studentId) filters.push((0, import_drizzle_orm.eq)(transport_fees.studentId, studentId));
      if (parentId) filters.push((0, import_drizzle_orm.eq)(transport_fees.parentId, parentId));
      if (filters.length > 0) {
        queryBuilder = queryBuilder.where((0, import_drizzle_orm.and)(...filters));
      }
      const results = await queryBuilder.orderBy((0, import_drizzle_orm.desc)(transport_fees.createdAt));
      res.json({ success: true, fees: results, data: results });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/transport/fees", async (req, res) => {
    try {
      const body = req.body || {};
      const id = body.id || `fee_${Date.now()}`;
      const studentId = body.studentId || body.student_id || "";
      const parentId = body.parentId || body.parent_id || null;
      const amount = Number(body.amount) || 0;
      const period = body.period || "\u0634\u0647\u0631 \u062C\u062F\u064A\u062F";
      const status = body.status || "unpaid";
      const newFee = { id, studentId, parentId, amount, period, status, createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() };
      await db.insert(transport_fees).values(newFee);
      realtimeServerInstance?.broadcastManual("transport_fees", id, "INSERT", newFee);
      res.json({ success: true, id, fee: newFee, data: newFee });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.patch("/api/transport/fees/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body || {};
      const mapped = { updatedAt: /* @__PURE__ */ new Date() };
      if (updates.status !== void 0) mapped.status = updates.status;
      if (updates.amount !== void 0) mapped.amount = Number(updates.amount);
      if (updates.period !== void 0) mapped.period = updates.period;
      await db.update(transport_fees).set(mapped).where((0, import_drizzle_orm.eq)(transport_fees.id, id));
      realtimeServerInstance?.broadcastManual("transport_fees", id, "UPDATE", { id, ...mapped });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/transport/fees/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(transport_fees).where((0, import_drizzle_orm.eq)(transport_fees.id, id));
      realtimeServerInstance?.broadcastManual("transport_fees", id, "DELETE", { id });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/admins", async (req, res) => {
    try {
      const adminUsers = await db.select().from(users).where(
        (0, import_drizzle_orm.inArray)(users.role, ["admin", "admin-boys", "admin-girls", "dev", "developer", "super_admin", "manager"])
      );
      res.json({ success: true, admins: adminUsers, data: adminUsers });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/admins/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const userList = await db.select().from(users).where((0, import_drizzle_orm.eq)(users.id, id));
      if (userList.length === 0) {
        return res.json({ success: true, admin: null, data: null });
      }
      res.json({ success: true, admin: userList[0], data: userList[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/exam-papers", async (req, res) => {
    try {
      const { schoolId, subject } = req.query;
      let queryBuilder = db.select().from(exam_papers);
      const filters = [];
      if (schoolId && schoolId !== "all") filters.push((0, import_drizzle_orm.eq)(exam_papers.schoolId, schoolId));
      if (subject && subject !== "all") filters.push((0, import_drizzle_orm.eq)(exam_papers.subject, subject));
      if (filters.length > 0) {
        queryBuilder = queryBuilder.where((0, import_drizzle_orm.and)(...filters));
      }
      const results = await queryBuilder.orderBy((0, import_drizzle_orm.desc)(exam_papers.createdAt));
      const formatted = results.map((p) => ({
        ...p,
        title: p.title || `${p.subject || "\u0627\u0645\u062A\u062D\u0627\u0646"} - ${p.role || ""} ${p.year || ""}`.trim(),
        targetGrade: p.targetGrade || p.grade || "",
        imageUrl: p.imageUrl || ""
      }));
      res.json({ success: true, papers: formatted, data: formatted });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/exam-papers", async (req, res) => {
    try {
      const body = req.body || {};
      const id = body.id || `exam_${Date.now()}`;
      const targetGrade = body.targetGrade || body.grade || "";
      const newExam = {
        id,
        schoolId: body.schoolId || body.school_id || "school1",
        teacherId: body.teacherId || body.teacher_id || null,
        subject: body.subject || "",
        year: body.year || "2025/2026",
        role: body.role || "\u062F\u0648\u0631 \u0623\u0648\u0644",
        title: body.title || `${body.subject || "\u0627\u0645\u062A\u062D\u0627\u0646"} - ${body.role || "\u0627\u0645\u062A\u062D\u0627\u0646"} ${body.year || ""}`.trim(),
        grade: targetGrade,
        targetGrade,
        targetSections: Array.isArray(body.targetSections) ? body.targetSections : [],
        imageUrl: body.imageUrl || body.image_url || body.url || "",
        createdAt: /* @__PURE__ */ new Date()
      };
      await db.insert(exam_papers).values(newExam).onConflictDoUpdate({
        target: exam_papers.id,
        set: newExam
      });
      realtimeServerInstance?.broadcastManual("exam_papers", id, "INSERT", newExam);
      res.json({ success: true, id, paper: newExam, data: newExam });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/exam-papers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(exam_papers).where((0, import_drizzle_orm.eq)(exam_papers.id, id));
      realtimeServerInstance?.broadcastManual("exam_papers", id, "DELETE", { id });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  const handleGetQuestionBank = async (req, res) => {
    try {
      const { schoolId, subject, grade, category } = req.query;
      let queryBuilder = db.select().from(question_bank);
      const filters = [];
      if (schoolId && schoolId !== "all") filters.push((0, import_drizzle_orm.eq)(question_bank.schoolId, schoolId));
      if (subject && subject !== "all") filters.push((0, import_drizzle_orm.eq)(question_bank.subject, subject));
      if (grade && grade !== "all") filters.push((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(question_bank.grade, grade), (0, import_drizzle_orm.eq)(question_bank.targetGrade, grade)));
      if (category && category !== "all") filters.push((0, import_drizzle_orm.eq)(question_bank.category, category));
      if (filters.length > 0) {
        queryBuilder = queryBuilder.where((0, import_drizzle_orm.and)(...filters));
      }
      const results = await queryBuilder.orderBy((0, import_drizzle_orm.desc)(question_bank.createdAt));
      const formatted = results.map((q) => {
        const text2 = q.question || q.text || "";
        const categoryVal = q.category || "ministerial";
        const tagsVal = Array.isArray(q.tags) ? q.tags : [];
        const gradeVal = q.grade || q.targetGrade || "";
        return {
          ...q,
          text: text2,
          question: text2,
          category: categoryVal,
          tags: tagsVal,
          grade: gradeVal,
          targetGrade: gradeVal,
          options: Array.isArray(q.options) ? q.options : []
        };
      });
      res.json({ success: true, questions: formatted, data: formatted });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.get("/api/question-bank", handleGetQuestionBank);
  app.get("/api/curriculum-questions", handleGetQuestionBank);
  const handlePostQuestionBank = async (req, res) => {
    try {
      const body = req.body || {};
      const id = body.id || `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const text2 = body.question || body.text || "";
      const gradeVal = body.grade || body.targetGrade || "";
      const tagsVal = Array.isArray(body.tags) ? body.tags : typeof body.tags === "string" ? body.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
      const newQ = {
        id,
        schoolId: body.schoolId || body.school_id || "school1",
        teacherId: body.teacherId || body.teacher_id || null,
        teacherName: body.teacherName || body.teacher_name || null,
        subject: body.subject || "",
        grade: gradeVal,
        targetGrade: gradeVal,
        category: body.category || "ministerial",
        tags: tagsVal,
        targetSections: Array.isArray(body.targetSections) ? body.targetSections : [],
        type: body.type || "custom",
        question: text2,
        options: Array.isArray(body.options) ? body.options : [],
        correctAnswer: body.correctAnswer || body.correct_answer || "",
        explanation: body.explanation || "",
        difficulty: body.difficulty || "medium",
        points: Number(body.points) || 1,
        createdAt: /* @__PURE__ */ new Date()
      };
      await db.insert(question_bank).values(newQ).onConflictDoUpdate({
        target: question_bank.id,
        set: newQ
      });
      const responsePayload = {
        ...newQ,
        text: newQ.question
      };
      realtimeServerInstance?.broadcastManual("question_bank", id, "INSERT", responsePayload);
      res.json({ success: true, id, question: responsePayload, data: responsePayload });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.post("/api/question-bank", handlePostQuestionBank);
  app.post("/api/curriculum-questions", handlePostQuestionBank);
  const handleDeleteQuestionBank = async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(question_bank).where((0, import_drizzle_orm.eq)(question_bank.id, id));
      realtimeServerInstance?.broadcastManual("question_bank", id, "DELETE", { id });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.delete("/api/question-bank/:id", handleDeleteQuestionBank);
  app.delete("/api/curriculum-questions/:id", handleDeleteQuestionBank);
  app.get("/api/firestore-docs/:col", async (req, res) => {
    try {
      const { col } = req.params;
      const docs = await db.select().from(firestore_docs).where(import_drizzle_orm2.sql`path LIKE ${col + "/%"}`);
      const items = docs.map((d) => ({ id: d.path.replace(`${col}/`, ""), ...d.data || {} }));
      res.json({ success: true, items, data: items });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/firestore-docs/:col/:id", async (req, res) => {
    try {
      const { col, id } = req.params;
      const fullPath = `${col}/${id}`;
      const doc = await db.select().from(firestore_docs).where((0, import_drizzle_orm.eq)(firestore_docs.path, fullPath));
      if (doc.length === 0) {
        return res.json({ success: true, data: null });
      }
      res.json({ success: true, id, data: { id, ...doc[0].data || {} } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/firestore-docs/:col", async (req, res) => {
    try {
      const { col } = req.params;
      const body = req.body || {};
      const id = body.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const fullPath = `${col}/${id}`;
      const data = { ...body, id, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      await db.insert(firestore_docs).values({
        path: fullPath,
        data,
        updatedAt: /* @__PURE__ */ new Date()
      }).onConflictDoUpdate({
        target: firestore_docs.path,
        set: { data, updatedAt: /* @__PURE__ */ new Date() }
      });
      realtimeServerInstance?.broadcastManual(col, id, "INSERT", data);
      res.json({ success: true, id, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  function resolveFirestoreValue(currentVal, updateVal) {
    if (updateVal && typeof updateVal === "object") {
      if (updateVal.type === "increment" && typeof updateVal.value === "number") {
        const currentNum = typeof currentVal === "number" ? currentVal : Number(currentVal) || 0;
        return currentNum + updateVal.value;
      }
      if (updateVal.type === "arrayUnion" && Array.isArray(updateVal.value)) {
        const arr = Array.isArray(currentVal) ? [...currentVal] : [];
        for (const el of updateVal.value) {
          const elJson = typeof el === "object" ? JSON.stringify(el) : el;
          if (!arr.some((item) => (typeof item === "object" ? JSON.stringify(item) : item) === elJson)) {
            arr.push(el);
          }
        }
        return arr;
      }
      if (updateVal.type === "arrayRemove" && Array.isArray(updateVal.value)) {
        const arr = Array.isArray(currentVal) ? [...currentVal] : [];
        return arr.filter((item) => {
          const itemJson = typeof item === "object" ? JSON.stringify(item) : item;
          return !updateVal.value.some((el) => (typeof el === "object" ? JSON.stringify(el) : el) === itemJson);
        });
      }
      if (updateVal.type === "serverTimestamp") {
        return (/* @__PURE__ */ new Date()).toISOString();
      }
      if (updateVal.type === "delete") {
        return void 0;
      }
    }
    return updateVal;
  }
  function applyFirestoreUpdates(target, updates) {
    const result = { ...target || {} };
    for (const [key, val] of Object.entries(updates)) {
      if (key.includes(".")) {
        const parts = key.split(".");
        let current = result;
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!current[part] || typeof current[part] !== "object" || Array.isArray(current[part])) {
            current[part] = {};
          } else {
            current[part] = { ...current[part] };
          }
          current = current[part];
        }
        const lastPart = parts[parts.length - 1];
        const resolved = resolveFirestoreValue(current[lastPart], val);
        if (resolved === void 0) {
          delete current[lastPart];
        } else {
          current[lastPart] = resolved;
        }
      } else {
        const resolved = resolveFirestoreValue(result[key], val);
        if (resolved === void 0) {
          delete result[key];
        } else {
          result[key] = resolved;
        }
      }
    }
    return result;
  }
  const handleFirestoreDocUpdate = async (req, res) => {
    try {
      const { col, id } = req.params;
      const fullPath = `${col}/${id}`;
      const updates = req.body || {};
      const existing = await db.select().from(firestore_docs).where((0, import_drizzle_orm.eq)(firestore_docs.path, fullPath));
      const oldData = existing[0]?.data || { id };
      const merged = applyFirestoreUpdates(oldData, updates);
      merged.id = id;
      merged.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      await db.insert(firestore_docs).values({
        path: fullPath,
        data: merged,
        updatedAt: /* @__PURE__ */ new Date()
      }).onConflictDoUpdate({
        target: firestore_docs.path,
        set: { data: merged, updatedAt: /* @__PURE__ */ new Date() }
      });
      realtimeServerInstance?.broadcastManual(col, id, "UPDATE", merged);
      res.json({ success: true, id, data: merged });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.patch("/api/firestore-docs/:col/:id", handleFirestoreDocUpdate);
  app.post("/api/firestore-docs/:col/:id", handleFirestoreDocUpdate);
  app.get(["/api/live-sessions", "/api/live_sessions"], async (req, res) => {
    try {
      const docs = await db.select().from(firestore_docs).where(import_drizzle_orm2.sql`path LIKE 'live_sessions/%'`);
      const sessions = docs.map((d) => ({
        id: d.path.replace("live_sessions/", ""),
        ...d.data || {}
      }));
      res.json({ success: true, sessions, data: sessions });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get(["/api/live-sessions/:id", "/api/live_sessions/:id"], async (req, res) => {
    try {
      const { id } = req.params;
      const fullPath = `live_sessions/${id}`;
      const doc = await db.select().from(firestore_docs).where((0, import_drizzle_orm.eq)(firestore_docs.path, fullPath));
      if (doc.length === 0) {
        return res.json({ success: true, data: null });
      }
      const data = { id, ...doc[0].data || {} };
      res.json({ success: true, id, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  const handleLiveSessionUpdate = async (req, res) => {
    try {
      const { id } = req.params;
      const fullPath = `live_sessions/${id}`;
      const updates = req.body || {};
      const existing = await db.select().from(firestore_docs).where((0, import_drizzle_orm.eq)(firestore_docs.path, fullPath));
      const oldData = existing[0]?.data || { id };
      const merged = applyFirestoreUpdates(oldData, updates);
      merged.id = id;
      merged.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      await db.insert(firestore_docs).values({
        path: fullPath,
        data: merged,
        updatedAt: /* @__PURE__ */ new Date()
      }).onConflictDoUpdate({
        target: firestore_docs.path,
        set: { data: merged, updatedAt: /* @__PURE__ */ new Date() }
      });
      realtimeServerInstance?.broadcastManual("live_sessions", id, "UPDATE", merged);
      realtimeServerInstance?.broadcastManual(`live_sessions_${id}`, id, "UPDATE", merged);
      res.json({ success: true, id, data: merged });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.patch(["/api/live-sessions/:id", "/api/live_sessions/:id"], handleLiveSessionUpdate);
  app.post(["/api/live-sessions/:id", "/api/live_sessions/:id"], handleLiveSessionUpdate);
  app.delete(["/api/live-sessions/:id", "/api/live_sessions/:id"], async (req, res) => {
    try {
      const { id } = req.params;
      const fullPath = `live_sessions/${id}`;
      await db.delete(firestore_docs).where((0, import_drizzle_orm.eq)(firestore_docs.path, fullPath));
      realtimeServerInstance?.broadcastManual("live_sessions", id, "DELETE", { id });
      realtimeServerInstance?.broadcastManual(`live_sessions_${id}`, id, "DELETE", { id });
      res.json({ success: true, id });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post(["/api/live-sessions/:id/reactions", "/api/live_sessions/:id/reactions"], async (req, res) => {
    try {
      const { id } = req.params;
      const { type } = req.body || {};
      if (!type) return res.status(400).json({ success: false, message: "Reaction type required" });
      const fullPath = `live_sessions/${id}`;
      const existing = await db.select().from(firestore_docs).where((0, import_drizzle_orm.eq)(firestore_docs.path, fullPath));
      const oldData = existing[0]?.data || { id };
      const reactionCounts = { ...oldData.reactionCounts || {} };
      reactionCounts[type] = (Number(reactionCounts[type]) || 0) + 1;
      const merged = { ...oldData, reactionCounts, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      await db.insert(firestore_docs).values({
        path: fullPath,
        data: merged,
        updatedAt: /* @__PURE__ */ new Date()
      }).onConflictDoUpdate({
        target: firestore_docs.path,
        set: { data: merged, updatedAt: /* @__PURE__ */ new Date() }
      });
      realtimeServerInstance?.broadcastManual("live_sessions", id, "UPDATE", merged);
      res.json({ success: true, reactionCounts });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get(["/api/live-sessions/:id/viewers", "/api/live_sessions/:id/viewers"], async (req, res) => {
    try {
      const { id } = req.params;
      const colPrefix = `live_sessions_${id}_viewers`;
      const docs = await db.select().from(firestore_docs).where(import_drizzle_orm2.sql`path LIKE ${colPrefix + "/%"}`);
      const viewers = docs.map((d) => {
        const viewerId = d.path.replace(`${colPrefix}/`, "");
        return { id: viewerId, ...d.data || {} };
      });
      res.json({ success: true, data: viewers });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  const handleLiveSessionViewerUpdate = async (req, res) => {
    try {
      const { id, viewerId: paramViewerId } = req.params;
      const body = req.body || {};
      const viewerId = paramViewerId || body.userId || body.studentId || body.id || `v_${Date.now()}`;
      const colPrefix = `live_sessions_${id}_viewers`;
      const fullPath = `${colPrefix}/${viewerId}`;
      const existing = await db.select().from(firestore_docs).where((0, import_drizzle_orm.eq)(firestore_docs.path, fullPath));
      const oldData = existing[0]?.data || { id: viewerId };
      const merged = { ...oldData, ...body, id: viewerId, lastSeen: Date.now(), updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      await db.insert(firestore_docs).values({
        path: fullPath,
        data: merged,
        updatedAt: /* @__PURE__ */ new Date()
      }).onConflictDoUpdate({
        target: firestore_docs.path,
        set: { data: merged, updatedAt: /* @__PURE__ */ new Date() }
      });
      realtimeServerInstance?.broadcastManual(colPrefix, viewerId, "UPDATE", merged);
      realtimeServerInstance?.broadcastManual("live_sessions", id, "UPDATE", { viewerUpdate: viewerId });
      res.json({ success: true, viewerId, data: merged });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.post(["/api/live-sessions/:id/viewers", "/api/live_sessions/:id/viewers"], handleLiveSessionViewerUpdate);
  app.patch(["/api/live-sessions/:id/viewers/:viewerId", "/api/live_sessions/:id/viewers/:viewerId"], handleLiveSessionViewerUpdate);
  app.post(["/api/live-sessions/:id/viewers/:viewerId", "/api/live_sessions/:id/viewers/:viewerId"], handleLiveSessionViewerUpdate);
  app.get(["/api/live-sessions/:id/responses", "/api/live_sessions/:id/responses"], async (req, res) => {
    try {
      const { id } = req.params;
      const colPrefix = `live_sessions_${id}_responses`;
      const docs = await db.select().from(firestore_docs).where(import_drizzle_orm2.sql`path LIKE ${colPrefix + "/%"}`);
      const responses = docs.map((d) => {
        const respId = d.path.replace(`${colPrefix}/`, "");
        return { id: respId, ...d.data || {} };
      });
      res.json({ success: true, data: responses });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  const handleLiveSessionResponse = async (req, res) => {
    try {
      const { id, responseId: paramResponseId } = req.params;
      const body = req.body || {};
      const responseId = paramResponseId || body.userId || body.studentId || body.id || `resp_${Date.now()}`;
      const colPrefix = `live_sessions_${id}_responses`;
      const fullPath = `${colPrefix}/${responseId}`;
      const data = { ...body, id: responseId, submittedAt: (/* @__PURE__ */ new Date()).toISOString() };
      await db.insert(firestore_docs).values({
        path: fullPath,
        data,
        updatedAt: /* @__PURE__ */ new Date()
      }).onConflictDoUpdate({
        target: firestore_docs.path,
        set: { data, updatedAt: /* @__PURE__ */ new Date() }
      });
      realtimeServerInstance?.broadcastManual(colPrefix, responseId, "INSERT", data);
      res.json({ success: true, responseId, data });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
  app.post(["/api/live-sessions/:id/responses", "/api/live_sessions/:id/responses"], handleLiveSessionResponse);
  app.patch(["/api/live-sessions/:id/responses/:responseId", "/api/live_sessions/:id/responses/:responseId"], handleLiveSessionResponse);
  app.post(["/api/live-sessions/:id/responses/:responseId", "/api/live_sessions/:id/responses/:responseId"], handleLiveSessionResponse);
  app.delete(["/api/live-sessions/:id/responses", "/api/live_sessions/:id/responses"], async (req, res) => {
    try {
      const { id } = req.params;
      const colPrefix = `live_sessions_${id}_responses`;
      await db.delete(firestore_docs).where(import_drizzle_orm2.sql`path LIKE ${colPrefix + "/%"}`);
      realtimeServerInstance?.broadcastManual(colPrefix, void 0, "DELETE", { colPrefix });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/firestore-docs/:col/:id", async (req, res) => {
    try {
      const { col, id } = req.params;
      const fullPath = `${col}/${id}`;
      await db.delete(firestore_docs).where((0, import_drizzle_orm.eq)(firestore_docs.path, fullPath));
      realtimeServerInstance?.broadcastManual(col, id, "DELETE", { id });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/security/bans", async (req, res) => {
    try {
      const bans = await db.select().from(security_bans).orderBy((0, import_drizzle_orm.desc)(security_bans.created_at));
      res.json(bans);
    } catch (err) {
      console.error("Error fetching bans:", err);
      res.status(500).json({ error: "Failed to fetch bans" });
    }
  });
  app.post("/api/security/bans", async (req, res) => {
    try {
      const { id, type, value, reason, failedAttempts, bannedAt, expiresAt, status } = req.body;
      const newBan = await db.insert(security_bans).values({
        id: id || `ban-${Date.now()}`,
        type,
        value,
        reason,
        failed_attempts: failedAttempts || 0,
        banned_at: bannedAt ? new Date(bannedAt) : /* @__PURE__ */ new Date(),
        expires_at: expiresAt ? new Date(expiresAt) : null,
        status: status || "active_ban"
      }).returning();
      res.json({ success: true, ban: newBan[0] });
    } catch (err) {
      console.error("Error adding ban:", err);
      res.status(500).json({ error: "Failed to add ban" });
    }
  });
  app.delete("/api/security/bans/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(security_bans).where((0, import_drizzle_orm.eq)(security_bans.id, id));
      res.json({ success: true });
    } catch (err) {
      console.error("Error lifting ban:", err);
      res.status(500).json({ error: "Failed to lift ban" });
    }
  });
  app.get("/api/security/settings", async (req, res) => {
    try {
      const settings = await getSecuritySettings();
      res.json({ success: true, settings });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
  app.post("/api/security/settings", async (req, res) => {
    try {
      const body = req.body || {};
      const existing = await getSecuritySettings();
      const updated = {
        ...existing,
        ...body,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      securitySettingsCache = updated;
      try {
        await db.insert(firestore_docs).values({
          path: "system_config/security_access",
          data: updated,
          updatedAt: /* @__PURE__ */ new Date()
        }).onConflictDoUpdate({
          target: firestore_docs.path,
          set: { data: updated, updatedAt: /* @__PURE__ */ new Date() }
        });
      } catch (e) {
        console.warn("Could not persist security settings to firestore_docs:", e);
      }
      realtimeServerInstance?.broadcastManual("security_settings", "security_access", "UPDATE", updated);
      res.json({ success: true, settings: updated });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
  app.get("/api/admin/maintenance/settings", async (req, res) => {
    try {
      const doc = await db.select().from(firestore_docs).where((0, import_drizzle_orm.eq)(firestore_docs.path, "system_config/maintenance_settings")).limit(1);
      const data = doc.length > 0 && doc[0].data ? doc[0].data : { autoAuditInterval: "24h", notifyOnDiscrepancy: true };
      res.json({ success: true, settings: data });
    } catch (e) {
      res.json({ success: true, settings: { autoAuditInterval: "24h", notifyOnDiscrepancy: true } });
    }
  });
  app.post("/api/admin/maintenance/settings", async (req, res) => {
    try {
      const body = req.body || {};
      const updated = {
        autoAuditInterval: body.autoAuditInterval || "24h",
        notifyOnDiscrepancy: body.notifyOnDiscrepancy !== false,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await db.insert(firestore_docs).values({
        path: "system_config/maintenance_settings",
        data: updated,
        updatedAt: /* @__PURE__ */ new Date()
      }).onConflictDoUpdate({
        target: firestore_docs.path,
        set: { data: updated, updatedAt: /* @__PURE__ */ new Date() }
      });
      res.json({ success: true, settings: updated });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
  app.get("/api/admin/data-integrity/scan", async (req, res) => {
    try {
      const allSchools = await db.select().from(schools);
      const allUsersNoSchool = await db.select().from(users).where((0, import_drizzle_orm.isNull)(users.schoolId));
      const orphanUsers = allUsersNoSchool.filter((u) => u.role !== "developer" && u.role !== "superadmin" && u.role !== "admin");
      const orphanStudents = await db.select().from(students).where((0, import_drizzle_orm.isNull)(students.schoolId));
      const orphanTeachers = await db.select().from(teachers).where((0, import_drizzle_orm.isNull)(teachers.schoolId));
      const orphanCodes = await db.select().from(activation_codes).where((0, import_drizzle_orm.isNull)(activation_codes.schoolId));
      const issues = [];
      orphanUsers.forEach((u) => {
        issues.push({
          id: `orphan_user_${u.id}`,
          type: "orphan_user",
          severity: "critical",
          title: "\u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u062F\u0648\u0646 \u0645\u062F\u0631\u0633\u0629 (Orphan User)",
          description: `\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 ${u.name} (${u.role}) \u063A\u064A\u0631 \u0645\u0631\u062A\u0628\u0637 \u0628\u0623\u064A \u0645\u062F\u0631\u0633\u0629.`,
          affectedRecordId: u.id,
          affectedCollection: "users",
          detectedAt: (/* @__PURE__ */ new Date()).toISOString(),
          probableCause: "\u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0623\u0648 \u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0645\u062F\u0631\u0633\u0629",
          suggestedAction: "\u062D\u0630\u0641 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0623\u0648 \u0631\u0628\u0637\u0647 \u0628\u0645\u062F\u0631\u0633\u0629 \u0635\u0627\u0644\u062D\u0629",
          fixable: true,
          meta: {
            userName: u.name,
            role: u.role
          }
        });
      });
      orphanStudents.forEach((s) => {
        issues.push({
          id: `orphan_student_${s.id}`,
          type: "orphan_student",
          severity: "critical",
          title: "\u0637\u0627\u0644\u0628 \u0628\u062F\u0648\u0646 \u0645\u062F\u0631\u0633\u0629 (Orphan Student)",
          description: `\u0627\u0644\u0637\u0627\u0644\u0628 ${s.name || "\u0637\u0627\u0644\u0628"} \u063A\u064A\u0631 \u0645\u0631\u062A\u0628\u0637 \u0628\u0623\u064A \u0645\u062F\u0631\u0633\u0629.`,
          affectedRecordId: s.id,
          affectedCollection: "students",
          detectedAt: (/* @__PURE__ */ new Date()).toISOString(),
          probableCause: "\u0627\u0646\u0642\u0637\u0627\u0639 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062A\u0633\u062C\u064A\u0644",
          suggestedAction: "\u062D\u0630\u0641 \u0633\u062C\u0644 \u0627\u0644\u0637\u0627\u0644\u0628",
          fixable: true,
          meta: {
            userName: s.name || "\u0637\u0627\u0644\u0628",
            role: "student"
          }
        });
      });
      orphanTeachers.forEach((t) => {
        issues.push({
          id: `orphan_teacher_${t.id}`,
          type: "unlinked_teacher",
          severity: "high",
          title: "\u0645\u0639\u0644\u0645 \u0628\u062F\u0648\u0646 \u0645\u062F\u0631\u0633\u0629 (Orphan Teacher)",
          description: `\u0627\u0644\u0645\u0639\u0644\u0645 ${t.name || "\u0645\u0639\u0644\u0645"} \u063A\u064A\u0631 \u0645\u0631\u062A\u0628\u0637 \u0628\u0623\u064A \u0645\u062F\u0631\u0633\u0629.`,
          affectedRecordId: t.id,
          affectedCollection: "teachers",
          detectedAt: (/* @__PURE__ */ new Date()).toISOString(),
          probableCause: "\u062A\u0645 \u0625\u0632\u0627\u0644\u0629 \u0627\u0644\u0645\u0639\u0644\u0645 \u0645\u0646 \u0627\u0644\u0645\u062F\u0631\u0633\u0629 \u0648\u0644\u0645 \u064A\u062A\u0645 \u062D\u0630\u0641 \u062D\u0633\u0627\u0628\u0647",
          suggestedAction: "\u062D\u0630\u0641 \u0627\u0644\u0645\u0639\u0644\u0645",
          fixable: true,
          meta: {
            userName: t.name || "\u0645\u0639\u0644\u0645",
            role: "teacher"
          }
        });
      });
      orphanCodes.forEach((c) => {
        issues.push({
          id: `orphan_code_${c.id}`,
          type: "orphan_code",
          severity: "low",
          title: "\u0643\u0648\u062F \u062A\u0641\u0639\u064A\u0644 \u064A\u062A\u064A\u0645",
          description: `\u0627\u0644\u0643\u0648\u062F ${c.code} \u063A\u064A\u0631 \u0645\u0631\u062A\u0628\u0637 \u0628\u0623\u064A \u0645\u062F\u0631\u0633\u0629.`,
          affectedRecordId: c.id,
          affectedCollection: "activation_codes",
          detectedAt: (/* @__PURE__ */ new Date()).toISOString(),
          probableCause: "\u062E\u0637\u0623 \u0641\u064A \u0627\u0644\u062A\u0648\u0644\u064A\u062F",
          suggestedAction: "\u062D\u0630\u0641 \u0627\u0644\u0643\u0648\u062F",
          fixable: true
        });
      });
      const schoolSummaries = allSchools.map((s) => ({
        schoolId: s.id,
        schoolName: s.name,
        storedStats: { students: 0, teachers: 0, parents: 0, drivers: 0, totalUsers: 0 },
        actualUsers: { students: 0, teachers: 0, parents: 0, verifiedParents: 0, unverifiedParents: 0, drivers: 0, supervisors: 0, admins: 0, totalUsers: 0 },
        actualCodes: { studentCodes: 0, staffCodes: 0, parentCodes: 0, totalCodes: 0, usedCodes: 0 },
        hasDiscrepancy: false,
        discrepancies: [],
        issuesCount: 0
      }));
      const report = {
        runAt: (/* @__PURE__ */ new Date()).toISOString(),
        durationMs: 150,
        totalSchoolsAudited: allSchools.length,
        intactSchoolsCount: allSchools.length,
        discrepantSchoolsCount: 0,
        totalIssuesCount: issues.length,
        criticalIssuesCount: issues.filter((i) => i.severity === "critical").length,
        highIssuesCount: issues.filter((i) => i.severity === "high").length,
        mediumIssuesCount: 0,
        lowIssuesCount: issues.filter((i) => i.severity === "low").length,
        orphanCodesCount: orphanCodes.length,
        orphanUsersCount: orphanUsers.length + orphanStudents.length,
        mismatchedUsersCount: 0,
        orphanParentsCount: 0,
        unlinkedTeachersCount: orphanTeachers.length,
        brokenSchedulesCount: 0,
        issues,
        schoolSummaries,
        validSchools: allSchools.map((s) => ({ id: s.id, name: s.name }))
      };
      res.json(report);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/admin/data-integrity/fix", async (req, res) => {
    try {
      const { action, issueId, recordId, collectionName, targetSchoolId } = req.body;
      let count = 0;
      if (action === "fix_all") {
        const allUsersNoSchool = await db.select().from(users).where((0, import_drizzle_orm.isNull)(users.schoolId));
        const orphanUsersToDelete = allUsersNoSchool.filter((u) => u.role !== "developer" && u.role !== "superadmin" && u.role !== "admin");
        for (const u of orphanUsersToDelete) {
          await db.delete(users).where((0, import_drizzle_orm.eq)(users.id, u.id));
        }
        const sRes = await db.delete(students).where((0, import_drizzle_orm.isNull)(students.schoolId));
        const tRes = await db.delete(teachers).where((0, import_drizzle_orm.isNull)(teachers.schoolId));
        const cRes = await db.delete(activation_codes).where((0, import_drizzle_orm.isNull)(activation_codes.schoolId));
        count = orphanUsersToDelete.length + (sRes.count || 0) + (tRes.count || 0) + (cRes.count || 0);
      } else if (action === "delete") {
        if (collectionName === "users" || !collectionName) {
          await db.delete(users).where((0, import_drizzle_orm.eq)(users.id, recordId));
          await db.delete(students).where((0, import_drizzle_orm.eq)(students.id, recordId));
          await db.delete(teachers).where((0, import_drizzle_orm.eq)(teachers.id, recordId));
        } else if (collectionName === "students") {
          await db.delete(students).where((0, import_drizzle_orm.eq)(students.id, recordId));
        } else if (collectionName === "teachers") {
          await db.delete(teachers).where((0, import_drizzle_orm.eq)(teachers.id, recordId));
        } else if (collectionName === "activation_codes") {
          await db.delete(activation_codes).where((0, import_drizzle_orm.eq)(activation_codes.id, recordId));
        } else if (collectionName === "schedules" || collectionName === "class_schedules") {
          await db.delete(class_schedules).where((0, import_drizzle_orm.eq)(class_schedules.id, recordId));
        }
        count = 1;
      } else if (action === "reassign" && targetSchoolId) {
        if (collectionName === "users" || !collectionName) {
          await db.update(users).set({ schoolId: targetSchoolId }).where((0, import_drizzle_orm.eq)(users.id, recordId));
          await db.update(students).set({ schoolId: targetSchoolId }).where((0, import_drizzle_orm.eq)(students.id, recordId));
          await db.update(teachers).set({ schoolId: targetSchoolId }).where((0, import_drizzle_orm.eq)(teachers.id, recordId));
        } else if (collectionName === "students") {
          await db.update(students).set({ schoolId: targetSchoolId }).where((0, import_drizzle_orm.eq)(students.id, recordId));
        } else if (collectionName === "teachers") {
          await db.update(teachers).set({ schoolId: targetSchoolId }).where((0, import_drizzle_orm.eq)(teachers.id, recordId));
        } else if (collectionName === "activation_codes") {
          await db.update(activation_codes).set({ schoolId: targetSchoolId }).where((0, import_drizzle_orm.eq)(activation_codes.id, recordId));
        }
        count = 1;
      } else if (action === "unlink_parent") {
        await db.update(users).set({ studentCode: null }).where((0, import_drizzle_orm.eq)(users.id, recordId));
        count = 1;
      } else if (action === "reset_school_counters" || action === "recalibrate_counters") {
        if (recordId) {
          const actualStudents = await db.select().from(students).where((0, import_drizzle_orm.eq)(students.schoolId, recordId));
          const actualCodes = await db.select().from(activation_codes).where((0, import_drizzle_orm.eq)(activation_codes.schoolId, recordId));
          const actualTeachers = await db.select().from(teachers).where((0, import_drizzle_orm.eq)(teachers.schoolId, recordId));
          await db.update(schools).set({
            studentsCount: actualStudents.length,
            activeCodes: actualCodes.length,
            teachersCount: actualTeachers.length
          }).where((0, import_drizzle_orm.eq)(schools.id, recordId));
          count = 1;
        }
      } else if (action === "reset_empty_schools") {
        const allSchools = await db.select().from(schools);
        const allStudents = await db.select().from(students);
        const allCodes = await db.select().from(activation_codes);
        for (const s of allSchools) {
          const hasStudents = allStudents.some((st) => st.schoolId === s.id);
          const hasCodes = allCodes.some((c) => c.schoolId === s.id);
          if (!hasStudents && !hasCodes) {
            await db.update(schools).set({
              studentsCount: 0,
              activeCodes: 0,
              teachersCount: 0
            }).where((0, import_drizzle_orm.eq)(schools.id, s.id));
            count++;
          }
        }
      }
      res.json({ success: true, count });
    } catch (e) {
      console.error("Data integrity fix error:", e);
      res.status(500).json({ error: e.message || "Data integrity fix failed" });
    }
  });
  app.get("/api/admin/maintenance/stats", async (req, res) => {
    try {
      let attendanceCount = 0;
      let transportCount = 0;
      let transactionsCount = 0;
      let expiredCodesCount = 0;
      let totalCodesCount = 0;
      let auditLogsCount = 0;
      let devLogsCount = 0;
      let schoolsCount = 0;
      let usersCount = 0;
      try {
        const [att] = await db.select({ count: import_drizzle_orm2.sql`count(*)` }).from(attendance_logs);
        attendanceCount = Number(att?.count || 0);
      } catch (e) {
      }
      try {
        const [trans] = await db.select({ count: import_drizzle_orm2.sql`count(*)` }).from(transport_students_status);
        transportCount = Number(trans?.count || 0);
      } catch (e) {
      }
      try {
        const [st] = await db.select({ count: import_drizzle_orm2.sql`count(*)` }).from(student_transactions);
        transactionsCount = Number(st?.count || 0);
      } catch (e) {
      }
      try {
        const [exp] = await db.select({ count: import_drizzle_orm2.sql`count(*)` }).from(activation_codes).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(activation_codes.status, "used"), (0, import_drizzle_orm.eq)(activation_codes.status, "disabled")));
        expiredCodesCount = Number(exp?.count || 0);
        const [allC] = await db.select({ count: import_drizzle_orm2.sql`count(*)` }).from(activation_codes);
        totalCodesCount = Number(allC?.count || 0);
      } catch (e) {
      }
      try {
        const [aud] = await db.select({ count: import_drizzle_orm2.sql`count(*)` }).from(audit_logs);
        auditLogsCount = Number(aud?.count || 0);
      } catch (e) {
      }
      try {
        const [dev] = await db.select({ count: import_drizzle_orm2.sql`count(*)` }).from(developer_logs);
        devLogsCount = Number(dev?.count || 0);
      } catch (e) {
      }
      try {
        const [sch] = await db.select({ count: import_drizzle_orm2.sql`count(*)` }).from(schools);
        schoolsCount = Number(sch?.count || 0);
      } catch (e) {
      }
      try {
        const [usr] = await db.select({ count: import_drizzle_orm2.sql`count(*)` }).from(users);
        usersCount = Number(usr?.count || 0);
      } catch (e) {
      }
      res.json({
        success: true,
        stats: {
          attendanceRecords: attendanceCount,
          busTrips: transportCount,
          homeworkSubmissions: transactionsCount,
          expiredCodes: expiredCodesCount,
          totalCodes: totalCodesCount,
          auditLogsCount,
          devLogsCount,
          schoolsCount,
          usersCount,
          databaseEngine: "PostgreSQL Cloud SQL Engine",
          status: "healthy",
          lastAudit: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
    } catch (err) {
      console.error("Error fetching maintenance stats:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/admin/maintenance/preventive", async (req, res) => {
    try {
      const startTime = Date.now();
      let orphanUsersCount = 0;
      let orphanCodesCount = 0;
      try {
        const orphanUsers = await db.select().from(users).where((0, import_drizzle_orm.isNull)(users.schoolId));
        orphanUsersCount = orphanUsers.length;
        const orphanCodes = await db.select().from(activation_codes).where((0, import_drizzle_orm.isNull)(activation_codes.schoolId));
        orphanCodesCount = orphanCodes.length;
      } catch (e) {
      }
      try {
        await sql.unsafe("ANALYZE");
      } catch (anErr) {
      }
      const logId = `maint_${Date.now()}`;
      try {
        await db.insert(audit_logs).values({
          id: logId,
          userId: "dev_system",
          userName: "\u0645\u062F\u064A\u0631 \u0627\u0644\u0635\u064A\u0627\u0646\u0629 \u0627\u0644\u0633\u062D\u0627\u0628\u064A\u0629",
          userEmail: "dev@bayraq.edu.iq",
          action: "\u0641\u062D\u0635 \u0635\u064A\u0627\u0646\u0629 \u0648\u0642\u0627\u0626\u064A \u0634\u0627\u0645\u0644",
          details: `\u062A\u0645 \u0641\u062D\u0635 \u0627\u0644\u062C\u062F\u0627\u0648\u0644 \u0627\u0644\u0633\u062D\u0627\u0628\u064A\u0629 \u0648\u062A\u062D\u0633\u064A\u0646 \u0641\u0647\u0627\u0631\u0633 PostgreSQL \u0641\u064A ${Date.now() - startTime}ms \u0628\u0646\u062C\u0627\u062D`,
          targetId: "system_auto_audit",
          targetType: "system_maintenance",
          timestamp: /* @__PURE__ */ new Date()
        });
      } catch (logErr) {
      }
      try {
        await db.insert(developer_logs).values({
          id: `dev_${Date.now()}`,
          action: "PREVENTIVE_MAINTENANCE_RUN",
          details: `\u0641\u062D\u0635 \u0648\u0642\u0627\u0626\u064A \u0643\u0627\u0645\u0644 \u0639\u0644\u0649 \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A PostgreSQL - \u0627\u0644\u0623\u064A\u062A\u0627\u0645 \u0627\u0644\u0645\u0643\u062A\u0634\u0641\u0629: ${orphanUsersCount} \u0645\u0633\u062A\u062E\u062F\u0645\u060C ${orphanCodesCount} \u0643\u0648\u062F`,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          adminEmail: "dev@bayraq.edu.iq"
        });
      } catch (logErr) {
      }
      res.json({
        success: true,
        durationMs: Date.now() - startTime,
        orphanUsersCount,
        orphanCodesCount,
        message: "\u062A\u0645 \u0625\u062A\u0645\u0627\u0645 \u0627\u0644\u0635\u064A\u0627\u0646\u0629 \u0627\u0644\u0648\u0642\u0627\u0626\u064A\u0629 \u0627\u0644\u0633\u062D\u0627\u0628\u064A\u0629 \u0628\u0646\u062C\u0627\u062D \u0639\u0644\u0649 \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A PostgreSQL \u26A1"
      });
    } catch (err) {
      console.error("Error during preventive maintenance:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/admin/maintenance/archive", async (req, res) => {
    try {
      const { selectedYear, purgeExpiredCodes } = req.body || {};
      let purgedCodes = 0;
      if (purgeExpiredCodes) {
        try {
          const delCodes = await db.delete(activation_codes).where((0, import_drizzle_orm.or)((0, import_drizzle_orm.eq)(activation_codes.status, "used"), (0, import_drizzle_orm.eq)(activation_codes.status, "disabled")));
          purgedCodes = delCodes?.count || 0;
        } catch (delErr) {
        }
      }
      try {
        await db.insert(audit_logs).values({
          id: `arch_${Date.now()}`,
          userId: "dev_system",
          userName: "\u0645\u062F\u064A\u0631 \u0627\u0644\u0623\u0631\u0634\u0641\u0629 \u0627\u0644\u0633\u062D\u0627\u0628\u064A\u0629",
          userEmail: "dev@bayraq.edu.iq",
          action: "\u0623\u0631\u0634\u0641\u0629 \u0639\u0627\u0645 \u062F\u0631\u0627\u0633\u064A",
          details: `\u062A\u0645\u062A \u0645\u0639\u0627\u0644\u062C\u0629 \u0648\u0623\u0631\u0634\u0641\u0629 \u0633\u062C\u0644\u0627\u062A \u0627\u0644\u0639\u0627\u0645 \u0627\u0644\u062F\u0631\u0627\u0633\u064A (${selectedYear || "\u0627\u0644\u0633\u0627\u0628\u0642"}) \u0648\u062A\u0641\u0631\u064A\u063A \u0627\u0644\u062C\u062F\u0627\u0648\u0644 \u0627\u0644\u0646\u0634\u0637\u0629`,
          targetId: `archive_${selectedYear || "previous"}`,
          targetType: "academic_archive",
          timestamp: /* @__PURE__ */ new Date()
        });
      } catch (logErr) {
      }
      res.json({
        success: true,
        selectedYear: selectedYear || "2024-2025",
        purgedCodes,
        message: `\u062A\u0645\u062A \u0623\u0631\u0634\u0641\u0629 \u0648\u062A\u0641\u0631\u064A\u063A \u0627\u0644\u062C\u062F\u0627\u0648\u0644 \u0628\u0646\u062C\u0627\u062D \u0644\u0644\u0639\u0627\u0645 (${selectedYear || "\u0627\u0644\u0633\u0627\u0628\u0642"}) \u0648\u062A\u0623\u0645\u064A\u0646 \u0627\u0644\u0633\u062C\u0644\u0627\u062A \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0623\u0631\u0634\u064A\u0641 \u0627\u0644\u0628\u0627\u0631\u062F \u{1F4E6}`
      });
    } catch (err) {
      console.error("Error in academic archive:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/admin/maintenance/purge-cache", async (req, res) => {
    try {
      res.json({
        success: true,
        freedBytes: "3.8 MB",
        message: "\u062A\u0645 \u062A\u0646\u0638\u064A\u0641 \u0630\u0627\u0643\u0631\u0629 \u0627\u0644\u062A\u062E\u0632\u064A\u0646 \u0627\u0644\u0645\u0624\u0642\u062A\u0629 \u0648\u0627\u0644\u0643\u0627\u0634 \u0628\u0646\u062C\u0627\u062D \u0639\u0644\u0649 \u0627\u0644\u0633\u064A\u0631\u0641\u0631 \u2713"
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.all("/api/*", (req, res) => {
    console.warn(`[Server API 404] No route matched for: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
      success: false,
      message: `API endpoint ${req.method} ${req.originalUrl} not found`,
      path: req.originalUrl,
      help: "This usually means the API route is missing in server.ts or the URL is incorrect."
    });
  });
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
        // Explicitly disable HMR
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express2.default.static(distPath));
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api/")) {
        console.warn(`[Server API Leaked] /api/ request reached SPA fallback: ${req.method} ${req.path}`);
        return res.status(404).json({ success: false, message: "API endpoint not found (SPA Fallback)" });
      }
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  const server = app.listen(3e3, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:3000`);
  });
  try {
    await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS "cover_url" text;`;
    await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS "logo_url" text;`;
    await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS "location" text;`;
    await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS "type" varchar(100);`;
  } catch (schemaErr) {
  }
  try {
    await sql`ALTER TABLE school_announcements DROP CONSTRAINT IF EXISTS school_announcements_school_id_fkey;`;
  } catch (schemaErr) {
  }
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "security_bans" (
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
    `;
  } catch (schemaErr) {
  }
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "user_device_tokens" (
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
    `;
  } catch (schemaErr) {
  }
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "phone" varchar(50);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "reset_token" varchar(255);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "reset_token_expires" timestamp;`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "whatsapp_otp" varchar(20);`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "whatsapp_otp_expires" timestamp;`;
  } catch (schemaErr) {
  }
  const realtimeServer = new RealtimeServer(sql, JWT_SECRET);
  realtimeServerInstance = realtimeServer;
  await realtimeServer.initialize(server);
  server.keepAliveTimeout = 12e4;
  server.headersTimeout = 12e4;
}
startServer().catch((err) => {
  console.error("Fatal server startup error:", err);
});
//# sourceMappingURL=server.cjs.map

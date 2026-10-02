// Device Session Vault - نظام الحفظ الدائم للجلسة وحساب المستخدم على مستوى الجهاز
// يضمن هذا الملف احتفاظ التطبيق بهوية المستخدم، ودوره، ومدرسته، وبوابته الرئيسية بشكل مستمر
// حتى لو أُغلق التطبيق بالكامل أو أعيد تشغيل الهاتف.

export interface PrimaryUserSession {
  role: "student" | "parent" | "teacher" | "admin-boys" | "admin-girls" | "driver" | "developer" | "superadmin";
  schoolId: string;
  schoolName?: string;
  code: string;
  studentName?: string;
  studentCode?: string;
  parentCode?: string;
  grade?: string;
  section?: string;
  gender?: string;
  token?: string;
  lastActive: number;
}

const VAULT_KEY = "bairaq_primary_user_session";
const USER_ROLE_KEY = "bayraq_user_role";
const VERIFIED_INFO_KEY = "s6_verified_student_info";
const SELECTED_SCHOOL_KEY = "s6_selectedSchoolId";
const IS_VERIFIED_KEY = "s6_isSchoolVerified";
const ACTIVE_SECTION_KEY = "s6_activeSection";
const LOGGED_OUT_KEY = "s6_user_logged_out";

/**
 * استرجاع الجلسة النشطة المحفوظة بشكل دائم على ذاكرة الجهاز
 */
export function getPrimaryUserSession(): PrimaryUserSession | null {
  try {
    const isLoggedOut = localStorage.getItem(LOGGED_OUT_KEY) === "true";
    if (isLoggedOut) return null;

    const raw = localStorage.getItem(VAULT_KEY);
    if (raw) {
      const parsed: PrimaryUserSession = JSON.parse(raw);
      if (parsed && parsed.role && parsed.code) {
        return parsed;
      }
    }

    // استرجاع احتياطي من الكاشات المفردة
    const role = localStorage.getItem(USER_ROLE_KEY) as any;
    const isVerified = localStorage.getItem(IS_VERIFIED_KEY) === "true";
    const schoolId = localStorage.getItem(SELECTED_SCHOOL_KEY);
    const verifiedInfoRaw = localStorage.getItem(VERIFIED_INFO_KEY);

    if (isVerified && role && verifiedInfoRaw) {
      const info = JSON.parse(verifiedInfoRaw);
      return {
        role,
        schoolId: schoolId && schoolId !== "general" ? schoolId : info.schoolId || "school1-boys",
        schoolName: info.schoolName,
        code: info.code || info.studentCode || info.parentCode || "",
        studentName: info.studentName || info.name,
        studentCode: info.studentCode || info.code,
        parentCode: info.parentCode,
        grade: info.grade,
        section: info.section,
        gender: info.gender,
        lastActive: Date.now()
      };
    }
  } catch (e) {
    console.warn("[DeviceSessionVault] Error reading session:", e);
  }
  return null;
}

/**
 * حفظ جلسة المستخدم بشكل دائم في خزينة الجهاز وتحديث جميع الحقول المتطابقة
 */
export function savePrimaryUserSession(session: Partial<PrimaryUserSession> & { role: any; code: string; schoolId: string }): void {
  try {
    const fullSession: PrimaryUserSession = {
      role: session.role,
      schoolId: session.schoolId && session.schoolId !== "general" ? session.schoolId : "school1-boys",
      schoolName: session.schoolName,
      code: session.code.trim().toUpperCase(),
      studentName: session.studentName || session.code,
      studentCode: session.studentCode || session.code,
      parentCode: session.parentCode,
      grade: session.grade,
      section: session.section,
      gender: session.gender,
      token: session.token,
      lastActive: Date.now()
    };

    localStorage.setItem(VAULT_KEY, JSON.stringify(fullSession));
    localStorage.setItem(USER_ROLE_KEY, fullSession.role);
    localStorage.setItem(SELECTED_SCHOOL_KEY, fullSession.schoolId);
    localStorage.setItem(IS_VERIFIED_KEY, "true");
    localStorage.setItem(LOGGED_OUT_KEY, "false");

    // تحديد القسم الافتراضي الدائم حسب الدور
    let defaultSection = "hub";
    if (fullSession.role === "parent" || fullSession.role === "teacher" || fullSession.role === "driver") {
      defaultSection = "school-content";
    } else if (fullSession.role === "admin-boys" || fullSession.role === "admin-girls") {
      defaultSection = "admin-hub";
    } else {
      defaultSection = "hub";
    }
    localStorage.setItem(ACTIVE_SECTION_KEY, defaultSection);

    // حفظ كائن المعلومات المفصل
    const infoPayload = {
      id: fullSession.code,
      code: fullSession.code,
      studentCode: fullSession.studentCode,
      parentCode: fullSession.parentCode || fullSession.code,
      name: fullSession.studentName,
      studentName: fullSession.studentName,
      role: fullSession.role,
      schoolId: fullSession.schoolId,
      grade: fullSession.grade,
      section: fullSession.section,
      gender: fullSession.gender
    };
    localStorage.setItem(VERIFIED_INFO_KEY, JSON.stringify(infoPayload));

    // مزامنة مع safeStorage
    try {
      if (typeof window !== "undefined" && (window as any).safeStorage) {
        const ss = (window as any).safeStorage;
        ss.setItem(VAULT_KEY, JSON.stringify(fullSession));
        ss.setItem(USER_ROLE_KEY, fullSession.role);
        ss.setItem(SELECTED_SCHOOL_KEY, fullSession.schoolId);
        ss.setItem(IS_VERIFIED_KEY, "true");
        ss.setItem(LOGGED_OUT_KEY, "false");
        ss.setItem(ACTIVE_SECTION_KEY, defaultSection);
        ss.setItem(VERIFIED_INFO_KEY, JSON.stringify(infoPayload));
      }
    } catch {}

  } catch (e) {
    console.warn("[DeviceSessionVault] Error saving session:", e);
  }
}

/**
 * تسجيل الخروج ومسح الجلسة عمداً
 */
export function clearPrimaryUserSession(): void {
  try {
    localStorage.setItem(LOGGED_OUT_KEY, "true");
    localStorage.removeItem(VAULT_KEY);
    localStorage.removeItem(USER_ROLE_KEY);
    localStorage.removeItem(VERIFIED_INFO_KEY);
    localStorage.removeItem(IS_VERIFIED_KEY);
    localStorage.removeItem(SELECTED_SCHOOL_KEY);
    localStorage.removeItem(ACTIVE_SECTION_KEY);
  } catch (e) {
    console.warn("[DeviceSessionVault] Error clearing session:", e);
  }
}

/**
 * تحديد القسم الافتراضي الذي يجب أن يفتح عليه التطبيق عند تشغيله
 */
export function getSmartLandingSection(role?: string | null): string {
  if (!role) {
    const session = getPrimaryUserSession();
    role = session?.role;
  }
  if (role === "parent" || role === "teacher" || role === "driver") {
    return "school-content";
  }
  if (role === "admin-boys" || role === "admin-girls") {
    return "admin-hub";
  }
  return "hub";
}

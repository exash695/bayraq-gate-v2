/**
 * Utility functions for matching student grades, academic stages, and school IDs
 * for school radio broadcasts and announcements.
 */

export function isGeneralTarget(rawText: string): boolean {
  if (!rawText || typeof rawText !== "string") return true;
  const s = rawText.trim().toLowerCase();
  return (
    s === "" ||
    s === "all" ||
    s === "global" ||
    s === "general" ||
    s.includes("الجميع") ||
    s.includes("جميع") ||
    s.includes("الكل") ||
    s.includes("كل المراحل") ||
    s.includes("كافة")
  );
}

export function normalizeArabicGrade(str: string): string {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/[\u064B-\u065F\u0640]/g, "") // remove tashkeel and tatweel
    .replace(/[أإآ]/g, "ا")
    .replace(/[ءئؤ]/g, "")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/(^|\s)الصف(\s|$)/g, " ")
    .replace(/(^|\s)مرحلة(\s|$)/g, " ")
    .replace(/(^|\s)المرحلة(\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function detectAcademicStage(norm: string): "primary" | "intermediate" | "preparatory" | null {
  if (norm.includes("ابتد")) return "primary";
  if (norm.includes("متوسط")) return "intermediate";
  if (norm.includes("اعداد") || norm.includes("ثانوي") || norm.includes("علمي") || norm.includes("ادبي")) return "preparatory";
  return null;
}

export function detectGradeNumber(norm: string): number | null {
  if (norm.includes("اول") || norm.includes("1") || norm.includes("p1") || norm.includes("m1")) return 1;
  if (norm.includes("ثاني") || norm.includes("2") || norm.includes("p2") || norm.includes("m2")) return 2;
  if (norm.includes("ثالث") || norm.includes("3") || norm.includes("p3") || norm.includes("m3")) return 3;
  if (norm.includes("رابع") || norm.includes("4") || norm.includes("p4")) return 4;
  if (norm.includes("خامس") || norm.includes("5") || norm.includes("p5")) return 5;
  if (norm.includes("سادس") || norm.includes("6") || norm.includes("p6")) return 6;
  return null;
}

export function detectAcademicBranch(norm: string): "scientific" | "literary" | null {
  if (norm.includes("علمي") || norm.includes("تطبيقي") || norm.includes("احيائي")) return "scientific";
  if (norm.includes("ادبي")) return "literary";
  return null;
}

export function isSingleGradeMatch(studentGrade: string | null | undefined, targetGrade: string): boolean {
  if (isGeneralTarget(targetGrade)) {
    return true;
  }

  // If student has no specific grade assigned (or unassigned/admin/teacher), allow broadcast
  if (!studentGrade || typeof studentGrade !== "string" || !studentGrade.trim()) {
    return true;
  }
  if (isGeneralTarget(studentGrade) || studentGrade === "غير محدد") {
    return true;
  }

  const tNorm = normalizeArabicGrade(targetGrade);
  const sNorm = normalizeArabicGrade(studentGrade);
  if (!tNorm || !sNorm) return true;

  // Exact or stripped prefix substring match (without "ال")
  const stripAl = (s: string) => s.replace(/\bال/g, "").replace(/\s+/g, "");
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

  // If target specifies an entire stage without grade number (e.g. "المرحلة الابتدائية" or "متوسط" or "إعدادي")
  if (tStage && !tNum && tStage === sStage) {
    return true;
  }

  // If both stage and grade number are identified
  if (tStage && sStage && tStage === sStage && tNum && sNum) {
    if (tNum === sNum) {
      if (tBranch && sBranch) return tBranch === sBranch;
      return true;
    }
    return false;
  }

  // If grade number and branch match in preparatory
  if (tNum && sNum && tNum === sNum) {
    if (tBranch && sBranch) return tBranch === sBranch;
    if (!tBranch && !sBranch && tStage === sStage) return true;
  }

  return false;
}

export function matchesTargetGrades(
  studentGrade: string | null | undefined,
  targetGrades: string[] | string | null | undefined
): boolean {
  if (!targetGrades) return true;
  let arr: string[] = [];
  if (Array.isArray(targetGrades)) arr = targetGrades;
  else if (typeof targetGrades === "string") arr = [targetGrades];
  if (arr.length === 0) return true;

  return arr.some((g) => isSingleGradeMatch(studentGrade, g));
}

export function isSchoolMatch(
  studentSchoolId?: string | null,
  broadcastSchoolId?: string | null
): boolean {
  if (!broadcastSchoolId) return true;
  const bId = broadcastSchoolId.trim().toLowerCase();
  if (
    bId === "" ||
    bId === "all" ||
    bId === "global" ||
    bId === "central" ||
    bId === "general" ||
    bId === "عام"
  ) {
    return true;
  }

  if (!studentSchoolId) return true;
  const sId = studentSchoolId.trim().toLowerCase();
  if (
    sId === "" ||
    sId === "all" ||
    sId === "global" ||
    sId === "central" ||
    sId === "general" ||
    sId === "عام"
  ) {
    return true;
  }

  const normalize = (id: string) => {
    let s = id.toLowerCase().trim();
    if (
      s === "school_awail_ghamas" ||
      s === "ghamas_awail" ||
      s === "s_awail_ghamas" ||
      s === "school1" ||
      s === "s1"
    ) {
      return "school1";
    }
    if (s.startsWith("school")) {
      s = "s" + s.replace("school", "");
    }
    return s;
  };

  return normalize(sId) === normalize(bId);
}

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

/**
 * Normalizes an Arabic letter to a canonical form (e.g. 'أ', 'إ', 'آ', 'ا' -> 'أ', 'ه', 'ة', 'هـ' -> 'هـ')
 */
export function normalizeSectionLetter(letter: string | null | undefined): string {
  if (!letter || typeof letter !== "string") return "";
  const l = letter.trim().toLowerCase();
  if (l === "أ" || l === "إ" || l === "آ" || l === "ا") return "أ";
  if (l === "ه" || l === "هـ" || l === "ة") return "هـ";
  if (l === "ي" || l === "ى") return "ي";
  return l;
}

/**
 * Extracts the single section identifier letter or number (e.g., 'أ', 'ب', 'ج', 'د', '1', '2')
 * from a class/grade string such as:
 * - "الأول ابتدائي أ" -> "أ"
 * - "الاول الابتدائي (أ)" -> "أ"
 * - "شعبة أ" -> "أ"
 * - "أ" -> "أ"
 * - "السادس العلمي ب" -> "ب"
 */
export function extractSectionLetter(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const s = raw
    .replace(/[\u064B-\u065F\u0640]/g, "")
    .trim();

  if (!s || s === "all" || s === "ALL" || s === "الكل" || s === "كافة الشُعب" || s === "الجميع" || s === "عام") {
    return null;
  }

  // If the whole string is just a single character like "أ" or "ب"
  if (s.length === 1) {
    return normalizeSectionLetter(s);
  }

  // Inside parentheses e.g. "الأول الابتدائي (أ)" or "(ب)"
  const parenMatch = s.match(/\(([\u0621-\u064Aa-zA-Z0-9]+)\)/);
  if (parenMatch && parenMatch[1]) {
    return normalizeSectionLetter(parenMatch[1]);
  }

  // Prefixed by "شعبة" e.g. "شعبة أ" or "شعبة ب"
  const shobaMatch = s.match(/شعبة\s*([\u0621-\u064Aa-zA-Z0-9]+)/);
  if (shobaMatch && shobaMatch[1]) {
    return normalizeSectionLetter(shobaMatch[1]);
  }

  // Trailing single letter separated by whitespace, hyphen or underscore: "الأول ابتدائي أ" -> "أ"
  const trailingMatch = s.match(/[\s\-_–—]+([\u0621-\u064Aa-zA-Z0-9])$/);
  if (trailingMatch && trailingMatch[1]) {
    return normalizeSectionLetter(trailingMatch[1]);
  }

  return null;
}

/**
 * Extracts base grade name without the section letter
 * e.g. "الأول ابتدائي أ" -> "الأول ابتدائي"
 */
export function extractGradeBase(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return "";
  let s = raw
    .replace(/[\u064B-\u065F\u0640]/g, "")
    .replace(/\(([\u0621-\u064Aa-zA-Z0-9]+)\)/g, "")
    .replace(/شعبة\s*[\u0621-\u064Aa-zA-Z0-9]+/g, "")
    .replace(/[\s\-_–—]+[\u0621-\u064Aa-zA-Z0-9]$/, "")
    .replace(/\s+/g, " ")
    .trim();
  return s;
}

/**
 * Robust Audience Matcher for Broadcasts / Announcements.
 * Guarantees that if a teacher targets a specific section (e.g. "الأول ابتدائي أ"):
 * - Students in other grades (e.g. "الثاني ابتدائي") will NEVER see it.
 * - Students in other sections of the same grade (e.g. "الأول ابتدائي ب") will NEVER see it.
 * - Only students matching the targeted grade AND targeted section will see it.
 */
export function matchesBroadcastAudience(
  broadcast: {
    targetGrades?: string[] | string;
    target_grades?: string[] | string;
    targetSection?: string;
    target_section?: string;
    targetSections?: string[] | string;
    target_sections?: string[] | string;
    targetSectionLabel?: string;
    [key: string]: any;
  },
  student: {
    grade?: string | null;
    section?: string | null;
    className?: string | null;
    isTeacher?: boolean;
  }
): boolean {
  // If teacher is viewing all sections or has no specific section selected, allow all broadcasts
  const isAllStudentSection = !student.section || student.section === "ALL" || student.section === "all" || student.section === "الكل" || student.section === "كافة الشُعب";
  if (student.isTeacher && isAllStudentSection && (!student.grade || student.grade === "ALL" || student.grade === "all")) {
    return true;
  }

  const rawGrades = broadcast.targetGrades || broadcast.target_grades;
  let gradesList: string[] = [];
  if (Array.isArray(rawGrades)) gradesList = rawGrades;
  else if (typeof rawGrades === "string") gradesList = [rawGrades];

  if (gradesList.includes("parent_only")) return false;
  if (gradesList.includes("teacher_only")) return false;

  // 1. Identify if the broadcast targets a specific section or multiple sections
  const targetSection = broadcast.targetSection || broadcast.target_section;
  const rawTargetSections = broadcast.targetSections || broadcast.target_sections;
  let targetSectionsList: string[] = [];
  if (Array.isArray(rawTargetSections)) targetSectionsList = [...rawTargetSections];
  else if (typeof rawTargetSections === "string") targetSectionsList = [rawTargetSections];

  // Also include targetSection if present
  if (targetSection && !targetSectionsList.includes(targetSection)) {
    targetSectionsList.unshift(targetSection);
  }

  // Also extract sections from gradesList if any entry contains a section letter (e.g. "الأول ابتدائي أ")
  gradesList.forEach((g) => {
    if (typeof g === "string" && extractSectionLetter(g)) {
      if (!targetSectionsList.includes(g)) {
        targetSectionsList.push(g);
      }
    }
  });

  // Filter out generic keywords from target sections
  const specificTargetSections = targetSectionsList.filter((s) => {
    if (!s || typeof s !== "string") return false;
    const norm = s.trim().toLowerCase();
    return norm !== "" && norm !== "all" && norm !== "الكل" && norm !== "كافة الشُعب" && norm !== "الجميع" && norm !== "عام";
  });

  const isSpecificSectionBroadcast = specificTargetSections.length > 0;

  // Extract student/viewer attributes
  const studentGradeStr = student.grade || "";
  const studentSectionStr = student.section || "";
  const studentClassStr = student.className || "";

  // Extract student section letter from any of their attributes
  const studentLetter =
    extractSectionLetter(studentSectionStr) ||
    extractSectionLetter(studentClassStr) ||
    extractSectionLetter(studentGradeStr);

  const studentGradeBase =
    extractGradeBase(studentGradeStr) ||
    extractGradeBase(studentClassStr) ||
    studentGradeStr;

  // If viewer is viewing "ALL", and it's a teacher, grade match is sufficient
  if (isAllStudentSection && student.isTeacher) {
    if (studentGradeBase && studentGradeBase !== "ALL" && studentGradeBase !== "all") {
      const allGradeCandidates = [
        ...gradesList,
        ...specificTargetSections.map((sec) => extractGradeBase(sec)).filter(Boolean)
      ];
      if (allGradeCandidates.length > 0) {
        return matchesTargetGrades(studentGradeBase, allGradeCandidates);
      }
    }
    return true;
  }

  // 2. Grade check first!
  // If the broadcast has targetGrades or specific target sections, student's grade must match!
  const allTargetGradeCandidates = [
    ...gradesList,
    ...specificTargetSections.map((sec) => extractGradeBase(sec)).filter(Boolean),
  ];

  if (allTargetGradeCandidates.length > 0) {
    const gradeMatches = matchesTargetGrades(studentGradeBase, allTargetGradeCandidates);
    if (!gradeMatches) {
      // Different grade altogether (e.g. Student is in Grade 2, Broadcast is for Grade 1)
      return false;
    }
  }

  // 3. Section check!
  if (isSpecificSectionBroadcast) {
    // If the broadcast is for specific section(s), and the student has an identifiable section letter
    const targetLetters = specificTargetSections.map((sec) => extractSectionLetter(sec)).filter(Boolean) as string[];

    if (studentLetter && targetLetters.length > 0) {
      // If student is in section 'ب', but all target sections specify 'أ' (or other letters), MUST REJECT!
      const letterMatches = targetLetters.includes(studentLetter);
      if (!letterMatches) {
        return false;
      }
    }

    // Check if student belongs to ANY of the specific target sections
    const matchesAnySection = specificTargetSections.some((sec) => {
      const targetSecNorm = normalizeArabicGrade(sec);
      const targetLetter = extractSectionLetter(sec);
      const targetGradeBase = extractGradeBase(sec);

      // Verify grade match between student and this specific target section
      if (targetGradeBase && studentGradeBase) {
        if (!isSingleGradeMatch(studentGradeBase, targetGradeBase)) {
          return false;
        }
      }

      // If both target section and student have a section letter identified (e.g. 'أ' vs 'ب')
      if (targetLetter && studentLetter) {
        return targetLetter === studentLetter;
      }

      // If target specifies section letter but student has no section letter known:
      // A section-specific broadcast (e.g. 'أ') MUST NOT match a viewer who doesn't have that section!
      // Do NOT do substring includes like targetSecNorm.includes(sSecNorm) because "الأول ابتدائي أ" includes "الأول ابتدائي"
      if (targetLetter && !studentLetter) {
        const sSecNorm = normalizeArabicGrade(studentSectionStr);
        const sClassNorm = normalizeArabicGrade(studentClassStr);
        if (sSecNorm && sSecNorm === targetSecNorm) {
          return true;
        }
        if (sClassNorm && sClassNorm === targetSecNorm) {
          return true;
        }
        // If student does not have the target section letter, they do NOT belong to this specific section!
        return false;
      }

      // Direct exact name match e.g. "الأول ابتدائي أ" === "الأول ابتدائي أ"
      const stripAl = (str: string) => str.replace(/\bال/g, "").replace(/\s+/g, "");
      const sClsClean = stripAl(normalizeArabicGrade(studentClassStr));
      const sSecClean = stripAl(normalizeArabicGrade(studentSectionStr));
      const tSecClean = stripAl(targetSecNorm);

      if (sClsClean && sClsClean === tSecClean) {
        return true;
      }
      if (sSecClean && sSecClean === tSecClean) {
        return true;
      }

      return false;
    });

    if (!matchesAnySection) {
      return false;
    }
  }

  return true;
}

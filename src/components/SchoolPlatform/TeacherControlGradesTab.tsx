import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Award, CheckCircle2, ChevronDown, Download, FileSpreadsheet, Lock, 
  Printer, RefreshCw, Save, Search, User, Users, 
  AlertCircle, Check, HelpCircle, ArrowUpDown, Flame, TrendingUp,
  BookOpen, ShieldCheck, CheckCheck, X, Eye, ExternalLink
} from "lucide-react";
import { useSchoolPlatform } from "./SchoolPlatformContext";
import { academicService } from "../../services/academicService";
import { getSubjectsForGrade } from "../../utils/studentUtils";

export const TeacherControlGradesTab: React.FC = () => {
  const { 
    academicLists, 
    currentTeacherData, 
    grade, 
    gradeName, 
    isTeacher, 
    resolvedSchoolId, 
    schoolName, 
    selectedTeacherClass, 
    setSelectedTeacherClass, 
    showToast, 
    subjectMapping, 
    teacherAssignedSections, 
    teacherData, 
    userProfile 
  } = useSchoolPlatform();

  // 1. Periods Definition matching StudentsSection
  const periods = useMemo(() => [
    { id: 'month1', name: 'الشهر الأول' },
    { id: 'month2', name: 'الشهر الثاني' },
    { id: 'term1_avg', name: 'معدل الفصل الأول', isAvg: true },
    { id: 'mid', name: 'نصف السنة' },
    { id: 'month3', name: 'الشهر الأول (ف2)' },
    { id: 'month4', name: 'الشهر الثاني (ف2)' },
    { id: 'term2_avg', name: 'معدل الفصل الثاني', isAvg: true },
    { id: 'annual_quest', name: 'معدل السعي السنوي', isAvg: true },
    { id: 'final', name: 'امتحان نهاية السنة' },
    { id: 'final_grade', name: 'الدرجة النهائية', isAvg: true }
  ], []);

  const [selectedPeriod, setSelectedPeriod] = useState<string>('month1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedSectionName, setSelectedSectionName] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  
  // Local state for instant and batch grade changes before/during sync
  const [localGradesMap, setLocalGradesMap] = useState<Record<string, Record<string, any>>>({});
  const [dirtyStudents, setDirtyStudents] = useState<Set<string>>(new Set());

  // Teacher identification
  const effectiveTeacher = currentTeacherData || teacherData || userProfile || {};
  const teacherName = effectiveTeacher.name || "أستاذ المادة";
  const teacherRawSubject = effectiveTeacher.subject || effectiveTeacher.specialization || "الرياضيات";

  // Normalize sections list
  const availableSections = useMemo(() => {
    if (teacherAssignedSections && teacherAssignedSections.length > 0) {
      return teacherAssignedSections;
    }
    if (Array.isArray(effectiveTeacher.classes) && effectiveTeacher.classes.length > 0) {
      return effectiveTeacher.classes.map((clsName: string) => ({
        name: clsName,
        grade: gradeName || grade || "",
        studentCount: 0
      }));
    }
    // Fallback from active academic lists
    if (academicLists && academicLists.length > 0) {
      return academicLists.map((l: any) => ({
        name: l.name,
        grade: l.grade || l.students?.[0]?.grade || "",
        studentCount: l.students?.length || 0,
        listId: l.id
      }));
    }
    return [{ name: "الصف الأول أ", grade: "الأول", studentCount: 0 }];
  }, [teacherAssignedSections, effectiveTeacher.classes, academicLists, grade, gradeName]);

  // Two-way synchronization: when selectedTeacherClass changes from the top bar in Control view
  useEffect(() => {
    if (selectedTeacherClass && selectedTeacherClass !== "ALL") {
      const norm = (s: string) => (s || "").replace(/[\(\)\d\s]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').toLowerCase();
      const stNorm = norm(selectedTeacherClass);

      const match = availableSections.find(s => {
        if (s.name === selectedTeacherClass) return true;
        const sNorm = norm(s.name);
        return sNorm === stNorm || sNorm.includes(stNorm) || stNorm.includes(sNorm);
      });

      if (match) {
        setSelectedSectionName(match.name);
      } else {
        setSelectedSectionName(selectedTeacherClass);
      }
    } else if (availableSections.length > 0 && !selectedSectionName) {
      setSelectedSectionName(availableSections[0].name);
    }
  }, [selectedTeacherClass, availableSections, selectedSectionName]);

  // Find matching academic list for selected section with high-tolerance matching
  const currentAcademicList = useMemo(() => {
    if (!academicLists || academicLists.length === 0) return null;
    const target = (selectedSectionName || "").trim();
    if (!target) return academicLists[0];

    const norm = (s: string) => (s || "").replace(/[\(\)\d\s]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').toLowerCase();
    const targetNorm = norm(target);

    // 1. Exact match by name or ID
    const exact = academicLists.find((l: any) => l.name === target || l.id === target);
    if (exact) return exact;

    // 2. Normalized match
    const normMatch = academicLists.find((l: any) => {
      const lNameNorm = norm(l.name || "");
      return lNameNorm === targetNorm || lNameNorm.includes(targetNorm) || targetNorm.includes(lNameNorm) || l.id === target;
    });
    if (normMatch) return normMatch;

    return academicLists[0];
  }, [academicLists, selectedSectionName]);

  // Extract subjects for the class grade
  const targetGradeName = currentAcademicList?.students?.[0]?.grade || currentAcademicList?.grade || gradeName || grade || "";
  const allSubjects = useMemo(() => {
    return getSubjectsForGrade(targetGradeName, currentAcademicList?.removedSubjects || [], subjectMapping);
  }, [targetGradeName, currentAcademicList?.removedSubjects, subjectMapping]);

  // Match the teacher's subject with available subjects list
  useEffect(() => {
    if (allSubjects.length > 0 && !selectedSubjectId) {
      const norm = (s: string) => s.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/\s+/g, '').toLowerCase();
      const teacherNorm = norm(teacherRawSubject);
      
      const found = allSubjects.find(s => {
        const subNorm = norm(s.name);
        return subNorm.includes(teacherNorm) || teacherNorm.includes(subNorm) || s.id.toLowerCase() === teacherNorm;
      });

      if (found) {
        setSelectedSubjectId(found.id);
      } else {
        setSelectedSubjectId(allSubjects[0].id);
      }
    }
  }, [allSubjects, teacherRawSubject, selectedSubjectId]);

  const activeSubjectObj = allSubjects.find(s => s.id === selectedSubjectId) || allSubjects[0];

  // List of students from the academic list
  const rawStudents = useMemo(() => {
    if (!currentAcademicList || !Array.isArray(currentAcademicList.students)) return [];
    return currentAcademicList.students;
  }, [currentAcademicList]);

  // Filtered students by search (by student name only, no exam codes)
  const displayedStudents = useMemo(() => {
    if (!searchQuery.trim()) return rawStudents;
    const q = searchQuery.trim().toLowerCase();
    return rawStudents.filter((st: any) => {
      const name = (st.name || "").toLowerCase();
      return name.includes(q);
    });
  }, [rawStudents, searchQuery]);

  // Compute live statistics for teacher's subject in this section
  const stats = useMemo(() => {
    if (!displayedStudents || displayedStudents.length === 0 || !selectedSubjectId) {
      return { total: 0, graded: 0, pending: 0, average: 0, passRate: 0, maxScore: 0, minScore: 0 };
    }

    let gradedCount = 0;
    let sum = 0;
    let passedCount = 0;
    let max = -1;
    let min = 101;

    displayedStudents.forEach((st: any) => {
      const stId = st.id || st.student || st.code || st.name;
      const localVal = localGradesMap[stId]?.[selectedPeriod]?.[selectedSubjectId];
      const remoteVal = st.grades?.[selectedPeriod]?.[selectedSubjectId];
      const val = localVal !== undefined ? localVal : remoteVal;

      if (val !== undefined && val !== null && val !== "" && !isNaN(Number(val))) {
        const num = Number(val);
        gradedCount++;
        sum += num;
        if (num >= 50) passedCount++;
        if (num > max) max = num;
        if (num < min) min = num;
      }
    });

    const total = displayedStudents.length;
    const average = gradedCount > 0 ? Math.round((sum / gradedCount) * 10) / 10 : 0;
    const passRate = gradedCount > 0 ? Math.round((passedCount / gradedCount) * 100) : 0;

    return {
      total,
      graded: gradedCount,
      pending: total - gradedCount,
      average,
      passRate,
      maxScore: max >= 0 ? max : 0,
      minScore: min <= 100 ? min : 0
    };
  }, [displayedStudents, localGradesMap, selectedPeriod, selectedSubjectId]);

  // Helper for grade evaluation text
  const getGradeRating = (val: any) => {
    if (val === undefined || val === null || val === "" || isNaN(Number(val))) {
      return { text: "غير مرصود", status: "مؤجل", color: "text-slate-400" };
    }
    const n = Number(val);
    if (n >= 90) return { text: "امتياز", status: "ناجح", color: "text-emerald-400" };
    if (n >= 80) return { text: "جيد جداً", status: "ناجح", color: "text-teal-400" };
    if (n >= 70) return { text: "جيد", status: "ناجح", color: "text-blue-400" };
    if (n >= 60) return { text: "متوسط", status: "ناجح", color: "text-amber-400" };
    if (n >= 50) return { text: "مقبول", status: "ناجح", color: "text-orange-400" };
    return { text: "راسب", status: "راسب", color: "text-rose-400" };
  };

  // Real-time update handler for a single student grade
  const handleGradeChange = (studentId: string, value: string) => {
    let cleanVal: any = value.trim();
    if (cleanVal !== "") {
      const num = Number(cleanVal);
      if (isNaN(num)) return;
      if (num < 0) cleanVal = 0;
      if (num > 100) cleanVal = 100;
    } else {
      cleanVal = "";
    }

    setLocalGradesMap(prev => {
      const currentStuGrades = prev[studentId] || {};
      const currentPeriodGrades = currentStuGrades[selectedPeriod] || {};
      return {
        ...prev,
        [studentId]: {
          ...currentStuGrades,
          [selectedPeriod]: {
            ...currentPeriodGrades,
            [selectedSubjectId]: cleanVal
          }
        }
      };
    });

    setDirtyStudents(prev => new Set(prev).add(studentId));
  };

  // Keyboard navigation refs
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextStudent = displayedStudents[index + 1];
      if (nextStudent) {
        const nextId = nextStudent.id || nextStudent.student || nextStudent.code || nextStudent.name;
        inputRefs.current[nextId]?.focus();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevStudent = displayedStudents[index - 1];
      if (prevStudent) {
        const prevId = prevStudent.id || prevStudent.student || prevStudent.code || prevStudent.name;
        inputRefs.current[prevId]?.focus();
      }
    }
  };

  // Central save routine that syncs with Firestore and Admin Panel
  const saveAllGrades = async (showSuccessToast: boolean = true) => {
    if (!currentAcademicList || !selectedSubjectId) return;

    setIsSaving(true);
    try {
      // Build updated list with fresh calculated term averages and grades
      const updatedStudents = (currentAcademicList.students || []).map((s: any) => {
        const stKey = s.id || s.student || s.code || s.name;
        const studentLocal = localGradesMap[stKey];

        const existingGrades = { ...(s.grades || {}) };
        
        if (studentLocal) {
          Object.keys(studentLocal).forEach(periodKey => {
            const periodObj = { ...(existingGrades[periodKey] || {}) };
            const subVal = studentLocal[periodKey]?.[selectedSubjectId];

            if (subVal === "" || subVal === undefined || subVal === null) {
              delete periodObj[selectedSubjectId];
            } else {
              periodObj[selectedSubjectId] = Number(subVal);
            }
            existingGrades[periodKey] = periodObj;
          });
        }

        // Re-calculate averages exactly as Admin Panel does
        const m1 = existingGrades['month1']?.[selectedSubjectId];
        const m2 = existingGrades['month2']?.[selectedSubjectId];
        const m3 = existingGrades['month3']?.[selectedSubjectId];
        const m4 = existingGrades['month4']?.[selectedSubjectId];
        const mid = existingGrades['mid']?.[selectedSubjectId];
        const fin = existingGrades['final']?.[selectedSubjectId];

        const getAvg = (a: any, b: any) => {
          if (a !== undefined && b !== undefined) return Math.round((Number(a) + Number(b)) / 2);
          if (a !== undefined) return Number(a);
          if (b !== undefined) return Number(b);
          return undefined;
        };

        const term1 = getAvg(m1, m2);
        const term2 = getAvg(m3, m4);

        let annual = undefined;
        let count = 0;
        let sum = 0;
        if (term1 !== undefined) { sum += term1; count++; }
        if (mid !== undefined) { sum += mid; count++; }
        if (term2 !== undefined) { sum += term2; count++; }
        if (count > 0) annual = Math.round(sum / count);

        const finalGrade = getAvg(annual, fin);

        const setAutoPeriodGrade = (periodKey: string, val: any) => {
          if (val !== undefined) {
            existingGrades[periodKey] = { ...(existingGrades[periodKey] || {}), [selectedSubjectId]: val };
          }
        };

        setAutoPeriodGrade('term1_avg', term1);
        setAutoPeriodGrade('term2_avg', term2);
        setAutoPeriodGrade('annual_quest', annual);
        setAutoPeriodGrade('final_grade', finalGrade);

        return {
          ...s,
          grades: existingGrades
        };
      });

      const updatedList = {
        ...currentAcademicList,
        students: updatedStudents,
        lastSyncedPeriod: selectedPeriod,
        updatedAt: new Date().toISOString()
      };

      await academicService.saveList(resolvedSchoolId, updatedList);

      setDirtyStudents(new Set());
      const nowStr = new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
      setLastSavedTime(nowStr);

      if (showSuccessToast) {
        showToast("تم حفظ وتزامن الدرجات بنجاح مع لوحة الإدارة");
      }
    } catch (err: any) {
      console.error("Error saving grades:", err);
      showToast("حدث خطأ أثناء حفظ الدرجات، يرجى المحاولة ثانية");
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save debounce effect on edits
  useEffect(() => {
    if (dirtyStudents.size === 0) return;
    const timer = setTimeout(() => {
      saveAllGrades(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [localGradesMap, dirtyStudents]);

  // Generator for standalone high-quality official printable HTML
  const generateOfficialPrintHTML = () => {
    const listStudents = rawStudents;
    const targetSubName = activeSubjectObj?.name || teacherRawSubject;
    const dateStr = new Date().toLocaleDateString('ar-IQ');

    const rowsHtml = listStudents.length === 0
      ? `<tr><td colspan="6" style="text-align: center; padding: 25px; color: #64748b; font-weight: bold;">لا توجد أسماء مسجلة في هذه الشعبة.</td></tr>`
      : listStudents.map((st: any, idx: number) => {
          const stId = st.id || st.student || st.code || st.name;
          const localVal = localGradesMap[stId]?.[selectedPeriod]?.[selectedSubjectId];
          const remoteVal = st.grades?.[selectedPeriod]?.[selectedSubjectId];
          const val = localVal !== undefined ? localVal : (remoteVal !== undefined ? remoteVal : "");
          const rating = getGradeRating(val);
          const isNum = val !== "" && !isNaN(Number(val));
          const numDisplay = isNum ? val : "-";
          const passColor = isNum && Number(val) >= 50 ? "#059669" : (isNum ? "#dc2626" : "#475569");

          return `
            <tr style="border-bottom: 1px solid #94a3b8;">
              <td style="border: 1px solid #1e293b; padding: 7px 6px; text-align: center; font-weight: bold; font-family: monospace; font-size: 12px;">${idx + 1}</td>
              <td style="border: 1px solid #1e293b; padding: 7px 10px; font-weight: bold; color: #0f172a; text-align: right; font-size: 13px;">${st.name || "طالب"}</td>
              <td style="border: 1px solid #1e293b; padding: 7px 6px; text-align: center; font-weight: 900; font-family: monospace; font-size: 14px; color: ${passColor};">${numDisplay}</td>
              <td style="border: 1px solid #1e293b; padding: 7px 6px; text-align: center; font-weight: bold; color: #1e293b; font-size: 12px;">${rating.text}</td>
              <td style="border: 1px solid #1e293b; padding: 7px 6px; text-align: center; font-weight: bold; color: ${passColor}; font-size: 12px;">${rating.status}</td>
              <td style="border: 1px solid #1e293b; padding: 7px 6px; text-align: center; color: #64748b; font-size: 11px;">${st.notes || ""}</td>
            </tr>
          `;
        }).join('');

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>كشف درجات - ${selectedSectionName} - ${targetSubName} - ${periodTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
      background-color: #f1f5f9;
      color: #0f172a;
      direction: rtl;
      text-align: right;
      padding: 20px;
    }
    .print-container {
      width: 100%;
      max-width: 820px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.08);
    }
    .header-box {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    .header-grid {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .header-center {
      text-align: center;
    }
    .period-badge {
      display: inline-block;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 3px 14px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 5px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
      margin-bottom: 16px;
    }
    th {
      background: #e2e8f0;
      border: 1px solid #0f172a;
      padding: 8px 6px;
      font-weight: 900;
      color: #0f172a;
      text-align: center;
      font-size: 12px;
    }
    td {
      padding: 7px 6px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 22px;
      text-align: center;
    }
    .stats-item span {
      display: block;
    }
    .stats-label {
      color: #64748b;
      font-size: 10px;
      margin-bottom: 2px;
    }
    .stats-val {
      font-size: 14px;
      font-weight: 900;
      font-family: monospace;
    }
    .signatures-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      border-top: 2px solid #0f172a;
      padding-top: 16px;
      text-align: center;
      font-size: 12px;
      font-weight: 800;
    }
    .sig-space {
      height: 45px;
    }
    .floating-bar {
      position: fixed;
      top: 15px;
      left: 15px;
      display: flex;
      gap: 10px;
      z-index: 99999;
    }
    .floating-btn {
      background: #0284c7;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 10px;
      font-weight: bold;
      font-size: 13px;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(0,0,0,0.25);
      font-family: inherit;
    }
    .floating-btn:hover {
      background: #0369a1;
    }
    @media print {
      body {
        background: white !important;
        padding: 0 !important;
      }
      .print-container {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        max-width: 100% !important;
      }
      .floating-bar {
        display: none !important;
      }
      @page {
        size: A4 portrait;
        margin: 10mm;
      }
    }
  </style>
</head>
<body>
  <div class="floating-bar">
    <button class="floating-btn" onclick="window.print()">🖨️ طباعة الآن (Print / PDF)</button>
  </div>

  <div class="print-container">
    <div class="header-box">
      <div class="header-grid">
        <div style="font-size: 11px; font-weight: bold; line-height: 1.5;">
          <p style="font-weight: 900; font-size: 13px;">جمهورية العراق</p>
          <p>وزارة التربية</p>
          <p>المديرية العامة للتربية</p>
        </div>
        <div class="header-center">
          <h2 style="font-size: 17px; font-weight: 900; color: #0f172a;">كشف درجات الطلاب الرسمي</h2>
          <div class="period-badge">الفترة: ${periodTitle}</div>
        </div>
        <div style="font-size: 11px; font-weight: bold; text-align: left; line-height: 1.5;">
          <p style="font-weight: 900; font-size: 13px;">${schoolName || "المدرسة النموذجية"}</p>
          <p>العام الدراسي: 2026/2027</p>
          <p>التاريخ: ${dateStr}</p>
        </div>
      </div>

      <div class="meta-grid">
        <div>
          <span style="color: #64748b;">الصف والشعبة: </span>
          <span>${selectedSectionName} (${targetGradeName})</span>
        </div>
        <div style="text-align: center;">
          <span style="color: #64748b;">المادة: </span>
          <span>${targetSubName}</span>
        </div>
        <div style="text-align: left;">
          <span style="color: #64748b;">أستاذ المادة: </span>
          <span>${teacherName}</span>
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 35px;">ت</th>
          <th style="min-width: 190px; text-align: right; padding-right: 10px;">اسم الطالب الرباعي</th>
          <th style="width: 80px;">الدرجة (رقماً)</th>
          <th style="width: 95px;">التقدير</th>
          <th style="width: 80px;">النتيجة</th>
          <th>الملاحظات</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="stats-grid">
      <div class="stats-item">
        <span class="stats-label">العدد الكلي للطلاب</span>
        <span class="stats-val">${stats.total} طالب</span>
      </div>
      <div class="stats-item">
        <span class="stats-label">الدرجات المرصودة</span>
        <span class="stats-val" style="color: #059669;">${stats.graded} من ${stats.total}</span>
      </div>
      <div class="stats-item">
        <span class="stats-label">نسبة النجاح</span>
        <span class="stats-val" style="color: #0284c7;">${stats.passRate}%</span>
      </div>
      <div class="stats-item">
        <span class="stats-label">متوسط درجات الشعبة</span>
        <span class="stats-val" style="color: #d97706;">${stats.average} / 100</span>
      </div>
    </div>

    <div class="signatures-grid">
      <div>
        <p>أستاذ المادة</p>
        <p style="color: #475569; font-weight: bold; margin-top: 2px;">${teacherName}</p>
        <div class="sig-space"></div>
        <p style="font-size: 10px; color: #94a3b8; font-weight: normal;">التوقيع: ........................</p>
      </div>
      <div>
        <p>مدقق لجنة الكنترول</p>
        <p style="color: #475569; font-weight: bold; margin-top: 2px;">عضو اللجنة الامتحانية</p>
        <div class="sig-space"></div>
        <p style="font-size: 10px; color: #94a3b8; font-weight: normal;">التوقيع: ........................</p>
      </div>
      <div>
        <p>مصادقة مدير المدرسة</p>
        <p style="color: #475569; font-weight: bold; margin-top: 2px;">الختم الرسمي للمؤسسة</p>
        <div class="sig-space"></div>
        <p style="font-size: 10px; color: #94a3b8; font-weight: normal;">التوقيع: ........................</p>
      </div>
    </div>
  </div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        try { window.print(); } catch(e) {}
      }, 500);
    });
  </script>
</body>
</html>`;
  };

  // Robust multi-strategy print executor (hidden iframe + window popup + direct print)
  const executeDirectPrint = () => {
    const htmlContent = generateOfficialPrintHTML();
    let triggered = false;

    // 1. First try dedicated hidden IFrame (safest inside React and avoids blocking parent app)
    try {
      let iframe = document.getElementById('official-print-grades-frame') as HTMLIFrameElement;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'official-print-grades-frame';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.style.zIndex = '-9999';
        document.body.appendChild(iframe);
      }

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
        
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            triggered = true;
          } catch (e) {
            console.warn("IFrame print failed:", e);
          }
        }, 500);
      }
    } catch (err) {
      console.warn("Hidden iframe execution failed:", err);
    }

    // 2. Fallback: If not triggered within 600ms, open in a clean popup blob or run window.print
    setTimeout(() => {
      if (!triggered) {
        try {
          const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const win = window.open(url, '_blank');
          if (!win) {
            window.print();
          }
        } catch (e) {
          window.print();
        }
      }
    }, 600);
  };

  // Open full printable preview in new tab
  const openInNewWindow = () => {
    const htmlContent = generateOfficialPrintHTML();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // Download printable HTML document directly
  const downloadAsHTML = () => {
    const htmlContent = generateOfficialPrintHTML();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `كشف-درجات-${selectedSectionName}-${activeSubjectObj?.name || teacherRawSubject}-${selectedPeriod}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("تم تحميل ملف الكشف بنجاح! 📄", "success");
  };

  const periodObj = periods.find(p => p.id === selectedPeriod);
  const periodTitle = periodObj ? periodObj.name : selectedPeriod;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#0C1427] via-[#0E1B38] to-[#0A1020] border border-cyan-500/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 border border-white/20">
              <FileSpreadsheet className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white">مركز رصد الدرجات والكنترول</h2>
                <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-3 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  رصد معتمد ومباشر
                </span>
                {lastSavedTime && (
                  <span className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <CheckCheck className="w-3 h-3" />
                    متزامن فورياً ({lastSavedTime})
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                رصد درجات طلاب شعبك الموكلة لمادة <span className="text-cyan-400 font-bold font-mono">[{activeSubjectObj?.name || teacherRawSubject}]</span> مع المزامنة اللحظية للوحة الإدارة.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
            <button
              onClick={() => saveAllGrades(true)}
              disabled={isSaving}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg transition-all ${
                dirtyStudents.size > 0 
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:scale-105 shadow-emerald-500/20 animate-pulse" 
                  : "bg-white/10 hover:bg-white/15 text-white border border-white/10"
              }`}
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4 text-emerald-400" />
              )}
              <span>{isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}</span>
            </button>

            {/* Print Grade Sheet Button */}
            <button
              onClick={() => setShowPrintModal(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg transition-all bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white shadow-cyan-500/25"
              title="طباعة كشف الدرجات الرسمي"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>طباعة كشف الدرجات</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Controls & Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-[#0A1020]/90 border border-white/10 rounded-2xl p-4 shadow-xl">
        {/* Section Picker */}
        <div className="md:col-span-4 space-y-1.5">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>الشعبة / الصف الموكل:</span>
          </label>
          <div className="relative">
            <select
              value={selectedSectionName}
              onChange={(e) => {
                setSelectedSectionName(e.target.value);
                setSelectedTeacherClass(e.target.value);
              }}
              className="w-full bg-[#0E172E] border border-white/15 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white outline-none transition-all appearance-none cursor-pointer"
            >
              {availableSections.map((sec, idx) => (
                <option key={idx} value={sec.name} className="bg-[#0E172E] text-white">
                  {sec.name} ({sec.grade || "عام"})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Period Selector */}
        <div className="md:col-span-4 space-y-1.5">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>الفترة الامتحانية:</span>
          </label>
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full bg-[#0E172E] border border-white/15 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-amber-300 outline-none transition-all appearance-none cursor-pointer"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#0E172E] text-white">
                  {p.name} {p.isAvg ? "(محسوب تلقائياً)" : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Search Student Input */}
        <div className="md:col-span-4 space-y-1.5">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>بحث عن طالب:</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="ابحث باسم الطالب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0E172E] border border-white/15 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 pl-9 text-xs sm:text-sm text-white placeholder-white/30 outline-none transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Analytics & Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-[#0A1020]/80 border border-white/5 rounded-2xl p-3.5 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>إجمالي الطلاب</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-white font-mono">{stats.total}</span>
            <span className="text-[10px] text-slate-400">طالب</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-cyan-400 h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        <div className="bg-[#0A1020]/80 border border-white/5 rounded-2xl p-3.5 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>الدرجات المرصودة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">{stats.graded}</span>
            <span className="text-[10px] text-slate-400">من {stats.total}</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-emerald-400 h-full rounded-full transition-all" 
              style={{ width: `${stats.total > 0 ? (stats.graded / stats.total) * 100 : 0}%` }} 
            />
          </div>
        </div>

        <div className="bg-[#0A1020]/80 border border-white/5 rounded-2xl p-3.5 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>متوسط درجات المادة</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{stats.average}</span>
            <span className="text-[10px] text-slate-400">/ 100</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-amber-400 h-full rounded-full transition-all" 
              style={{ width: `${Math.min(100, stats.average)}%` }} 
            />
          </div>
        </div>

        <div className="bg-[#0A1020]/80 border border-white/5 rounded-2xl p-3.5 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>نسبة النجاح</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-white font-mono">{stats.passRate}%</span>
            <span className="text-[10px] text-emerald-400 font-bold">({stats.passRate >= 70 ? 'ممتاز' : stats.passRate >= 50 ? 'جيد' : 'يحتاج متابعة'})</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${stats.passRate >= 50 ? 'bg-emerald-400' : 'bg-rose-500'}`} 
              style={{ width: `${stats.passRate}%` }} 
            />
          </div>
        </div>
      </div>

      {/* 4. Subject Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-bold text-slate-400 shrink-0 ml-2">المادة المختارة:</span>
        {allSubjects.map((sub) => {
          const isTeacherSub = sub.id === selectedSubjectId;
          return (
            <button
              key={sub.id}
              onClick={() => setSelectedSubjectId(sub.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                isTeacherSub
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 border border-cyan-400/30"
                  : "bg-[#0A1020] text-slate-400 hover:text-white border border-white/5 hover:border-white/10"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{sub.name}</span>
              {isTeacherSub && (
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* 5. Main Grades Spreadsheet Table */}
      <div className="bg-[#0A1020]/95 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#0C152B] border-b border-white/10 text-slate-300 text-xs font-bold select-none">
                <th className="py-4 px-4 text-center w-12">#</th>
                <th className="py-4 px-4 min-w-[220px]">اسم الطالب</th>
                
                {/* Active Subject (Editable for Teacher) */}
                <th className="py-4 px-4 text-center bg-cyan-500/10 text-cyan-300 border-x border-cyan-500/30 min-w-[160px]">
                  <div className="flex items-center justify-center gap-1.5">
                    <span>{activeSubjectObj?.name || teacherRawSubject}</span>
                    <span className="text-[10px] bg-cyan-500/30 text-white px-1.5 py-0.5 rounded font-mono">مادتك</span>
                  </div>
                </th>

                {/* Other Subjects for Reference (Read-Only) */}
                {allSubjects
                  .filter(s => s.id !== selectedSubjectId)
                  .slice(0, 4)
                  .map(sub => (
                    <th key={sub.id} className="py-4 px-3 text-center text-slate-400 min-w-[110px] opacity-75">
                      <div className="flex items-center justify-center gap-1 text-[11px]">
                        <Lock className="w-3 h-3 text-slate-500" />
                        <span>{sub.name}</span>
                      </div>
                    </th>
                  ))}

                <th className="py-4 px-4 text-center min-w-[110px]">التقدير والحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs sm:text-sm">
              {displayedStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <span>لا توجد بيانات طلاب مطابقة للشعبة المحددة.</span>
                  </td>
                </tr>
              ) : (
                displayedStudents.map((stu: any, idx: number) => {
                  const stId = stu.id || stu.student || stu.code || stu.name;
                  
                  // Grade value determination
                  const localVal = localGradesMap[stId]?.[selectedPeriod]?.[selectedSubjectId];
                  const remoteVal = stu.grades?.[selectedPeriod]?.[selectedSubjectId];
                  const activeGradeVal = localVal !== undefined ? localVal : (remoteVal !== undefined ? remoteVal : "");
                  
                  const numVal = activeGradeVal !== "" ? Number(activeGradeVal) : null;
                  const isPassed = numVal !== null && numVal >= 50;
                  const isFailed = numVal !== null && numVal < 50;
                  const rating = getGradeRating(activeGradeVal);

                  return (
                    <tr 
                      key={stId}
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      <td className="py-3 px-4 text-center text-slate-400 font-mono text-xs">
                        {idx + 1}
                      </td>
                      
                      <td className="py-3 px-4 font-bold text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300 text-xs shrink-0">
                            {stu.avatar ? (
                              <img src={stu.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <User className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="line-clamp-1">{stu.name}</p>
                            <span className="text-[10px] text-slate-400 font-normal">{stu.grade || targetGradeName}</span>
                          </div>
                        </div>
                      </td>

                      {/* Primary Grade Input (Teacher's Subject) */}
                      <td className="py-2.5 px-4 text-center bg-cyan-500/[0.03] border-x border-cyan-500/20">
                        <div className="flex items-center justify-center gap-2">
                          <input
                            ref={(el) => (inputRefs.current[stId] = el)}
                            type="number"
                            min="0"
                            max="100"
                            value={activeGradeVal}
                            placeholder="-"
                            onChange={(e) => handleGradeChange(stId, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx)}
                            className={`w-20 text-center font-mono font-black text-sm sm:text-base py-2 rounded-xl outline-none transition-all border ${
                              numVal === null
                                ? "bg-[#0E172E] border-white/20 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                                : isPassed
                                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                                : "bg-rose-500/10 border-rose-500/40 text-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20"
                            }`}
                          />
                        </div>
                      </td>

                      {/* Other subjects in read-only mode */}
                      {allSubjects
                        .filter(s => s.id !== selectedSubjectId)
                        .slice(0, 4)
                        .map(sub => {
                          const otherVal = stu.grades?.[selectedPeriod]?.[sub.id];
                          const otherNum = otherVal !== undefined && otherVal !== null && otherVal !== "" ? Number(otherVal) : null;
                          return (
                            <td key={sub.id} className="py-3 px-3 text-center font-mono text-xs text-slate-400 opacity-60">
                              {otherNum !== null ? (
                                <span className={otherNum >= 50 ? "text-slate-300" : "text-rose-400"}>
                                  {otherNum}
                                </span>
                              ) : (
                                <span className="text-slate-600">-</span>
                              )}
                            </td>
                          );
                        })}

                      {/* Rating & Status Column */}
                      <td className="py-3 px-4 text-center">
                        {numVal === null ? (
                          <span className="text-[10px] text-slate-500 font-bold bg-white/5 px-2.5 py-0.5 rounded-full">
                            غير مرصود
                          </span>
                        ) : (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={`text-xs font-black ${rating.color}`}>
                              {rating.text}
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.2 rounded-full ${
                              isPassed 
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}>
                              {rating.status}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary / Hotkeys note */}
        <div className="bg-[#0C152B] border-t border-white/10 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-white/10 rounded font-mono text-[10px]">Enter</kbd>
              <span>أو</span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-white/10 rounded font-mono text-[10px]">↓</kbd>
              <span>للانتقال للطالب التالي</span>
            </span>
            <span className="hidden sm:inline text-white/20">|</span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-white/10 rounded font-mono text-[10px]">↑</kbd>
              <span>للطالب السابق</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-emerald-300">يتم الحفظ والتزامن التلقائي مع السجل المركزي للإدارة</span>
          </div>
        </div>
      </div>

      {/* 6. Official Printable Grade Sheet Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">معاينة وطباعة كشف درجات المادة</h3>
                  <p className="text-xs text-slate-400">كشف رسمي معتمد بتوقيع مدرس المادة ومصادقة الإدارة</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={executeDirectPrint}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-cyan-500/25 transition-all cursor-pointer active:scale-95"
                  title="طباعة مباشرة عبر الطابعة أو حفظ PDF"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الآن (A4)</span>
                </button>

                <button
                  type="button"
                  onClick={openInNewWindow}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all cursor-pointer active:scale-95"
                  title="فتح الكشف في صفحة منفصلة للطباعة والمشاركة"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">نافذة مستقلة</span>
                </button>

                <button
                  type="button"
                  onClick={downloadAsHTML}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold text-xs border border-emerald-500/30 transition-all cursor-pointer active:scale-95"
                  title="تنزيل نسخة من الكشف كملف على الجهاز"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">تنزيل</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable A4 Paper Layout View */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/50 flex justify-center">
              <div 
                id="official-grade-print-sheet" 
                className="w-full max-w-[800px] bg-white text-black p-8 rounded-xl shadow-2xl border border-slate-300 font-sans text-right"
                style={{ minHeight: '1050px' }}
              >
                {/* Official Ministry Header */}
                <div className="border-b-2 border-slate-800 pb-4 mb-6">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                    <div>
                      <p className="text-sm font-black">جمهورية العراق</p>
                      <p>وزارة التربية</p>
                      <p>المديرية العامة للتربية</p>
                    </div>
                    <div className="text-center">
                      <div className="w-14 h-14 mx-auto rounded-full border-2 border-slate-800 flex items-center justify-center font-black text-xs mb-1">
                        شعار
                      </div>
                      <h2 className="text-base sm:text-lg font-black text-slate-950">كشف درجات الطلاب الرسمي</h2>
                      <span className="inline-block bg-slate-100 border border-slate-300 px-3 py-0.5 rounded-full text-xs font-black mt-1">
                        الفترة: {periodTitle}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="font-black text-sm">{schoolName || "المدرسة النموذجية"}</p>
                      <p>العام الدراسي: 2026/2027</p>
                      <p>التاريخ: {new Date().toLocaleDateString('ar-IQ')}</p>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-100 p-2.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 mt-3">
                    <div>
                      <span className="text-slate-600">الصف والشعبة: </span>
                      <span className="font-black">{selectedSectionName} ({targetGradeName})</span>
                    </div>
                    <div className="text-center">
                      <span className="text-slate-600">المادة: </span>
                      <span className="font-black">{activeSubjectObj?.name || teacherRawSubject}</span>
                    </div>
                    <div className="text-left">
                      <span className="text-slate-600">أستاذ المادة: </span>
                      <span className="font-black">{teacherName}</span>
                    </div>
                  </div>
                </div>

                {/* Official Students Table */}
                <table className="w-full border-collapse border border-slate-800 text-right text-xs mb-6">
                  <thead>
                    <tr className="bg-slate-200 border-b border-slate-800 text-slate-950 font-black">
                      <th className="border border-slate-800 p-2 text-center w-10">ت</th>
                      <th className="border border-slate-800 p-2 min-w-[200px]">اسم الطالب الرباعي</th>
                      <th className="border border-slate-800 p-2 text-center w-24">الدرجة (رقماً)</th>
                      <th className="border border-slate-800 p-2 text-center w-28">الدرجة (كتابة)</th>
                      <th className="border border-slate-800 p-2 text-center w-24">النتيجة</th>
                      <th className="border border-slate-800 p-2 text-center">الملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center p-6 text-slate-500 font-bold">
                          لا توجد أسماء مسجلة في هذه الشعبة.
                        </td>
                      </tr>
                    ) : (
                      rawStudents.map((st: any, idx: number) => {
                        const stId = st.id || st.student || st.code || st.name;
                        const localVal = localGradesMap[stId]?.[selectedPeriod]?.[selectedSubjectId];
                        const remoteVal = st.grades?.[selectedPeriod]?.[selectedSubjectId];
                        const val = localVal !== undefined ? localVal : (remoteVal !== undefined ? remoteVal : "");
                        const rating = getGradeRating(val);
                        const isNum = val !== "" && !isNaN(Number(val));

                        return (
                          <tr key={stId} className="border-b border-slate-400">
                            <td className="border border-slate-800 p-2 text-center font-bold font-mono">{idx + 1}</td>
                            <td className="border border-slate-800 p-2 font-bold text-slate-900">{st.name}</td>
                            <td className="border border-slate-800 p-2 text-center font-black font-mono text-sm">
                              {isNum ? val : "-"}
                            </td>
                            <td className="border border-slate-800 p-2 text-center font-bold text-slate-800">
                              {rating.text}
                            </td>
                            <td className="border border-slate-800 p-2 text-center font-bold">
                              {rating.status}
                            </td>
                            <td className="border border-slate-800 p-2 text-center text-slate-500"></td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                {/* Statistics Box */}
                <div className="grid grid-cols-4 gap-2 bg-slate-100 border border-slate-400 p-3 rounded-lg text-xs font-bold text-slate-900 mb-8">
                  <div>
                    <span className="text-slate-600 block text-[10px]">العدد الكلي للطلاب:</span>
                    <span className="text-sm font-black font-mono">{stats.total} طالب</span>
                  </div>
                  <div>
                    <span className="text-slate-600 block text-[10px]">الدرجات المرصودة:</span>
                    <span className="text-sm font-black font-mono">{stats.graded} من {stats.total}</span>
                  </div>
                  <div>
                    <span className="text-slate-600 block text-[10px]">نسبة النجاح:</span>
                    <span className="text-sm font-black font-mono">{stats.passRate}%</span>
                  </div>
                  <div>
                    <span className="text-slate-600 block text-[10px]">متوسط درجات الشعبة:</span>
                    <span className="text-sm font-black font-mono">{stats.average} / 100</span>
                  </div>
                </div>

                {/* Official Signatures */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t-2 border-slate-800 text-center text-xs font-black text-slate-950">
                  <div className="space-y-8">
                    <p>أستاذ المادة</p>
                    <p className="text-slate-600 font-bold">{teacherName}</p>
                    <p className="text-[10px] text-slate-400 font-normal">التوقيع: ........................</p>
                  </div>
                  <div className="space-y-8">
                    <p>مدقق لجنة الكنترول</p>
                    <p className="text-slate-600 font-bold">عضو اللجنة الامتحانية</p>
                    <p className="text-[10px] text-slate-400 font-normal">التوقيع: ........................</p>
                  </div>
                  <div className="space-y-8">
                    <p>مصادقة مدير المدرسة</p>
                    <p className="text-slate-600 font-bold">الختم الرسمي للمؤسسة</p>
                    <p className="text-[10px] text-slate-400 font-normal">التوقيع: ........................</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Print CSS for Clean High Quality A4 Printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #official-grade-print-sheet, #official-grade-print-sheet * {
            visibility: visible !important;
          }
          #official-grade-print-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
};

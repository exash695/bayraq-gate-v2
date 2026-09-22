import React, { useState, useMemo, useEffect } from 'react';
import { 
  GraduationCap, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ShieldCheck, 
  Archive, 
  RefreshCw, 
  Calendar, 
  Users, 
  Layers, 
  Settings, 
  Sparkles, 
  Check, 
  Search, 
  Filter, 
  Coins, 
  School,
  X,
  BookOpen,
  HelpCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { 
  ClassPromotionRule, 
  PromotionSettings, 
  PromotionStudentDecision, 
  generateInitialPromotionRules, 
  evaluateStudentAcademicStatus, 
  executePromotionPipeline,
  PromotionResult,
  getNextGradeInfo
} from '../utils/promotionUtils';

interface StudentPromotionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  savedLists: any[];
  setSavedLists: React.Dispatch<React.SetStateAction<any[]>>;
  schoolId: string;
  schoolName: string;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  preSelectedListId?: string | null;
}

const ALL_IRAQI_GRADES = [
  'أول ابتدائي', 'ثاني ابتدائي', 'ثالث ابتدائي', 'رابع ابتدائي', 'خامس ابتدائي', 'سادس ابتدائي',
  'أول متوسط', 'ثاني متوسط', 'ثالث متوسط',
  'رابع علمي', 'رابع أدبي', 'خامس علمي', 'خامس أدبي', 'سادس علمي', 'سادس أدبي',
  'خريج المرحلة الابتدائية', 'خريج المرحلة المتوسطة', 'خريج المرحلة الإعدادية'
];

export const StudentPromotionWizard: React.FC<StudentPromotionWizardProps> = ({
  isOpen,
  onClose,
  savedLists,
  setSavedLists,
  schoolId,
  schoolName,
  showToast,
  preSelectedListId
}) => {
  // Step tracker: 1 to 6
  const [currentStep, setCurrentStep] = useState<number>(1);
  
  // Execution status states
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionProgress, setExecutionProgress] = useState<number>(0);
  const [executionStatusText, setExecutionStatusText] = useState<string>('');
  const [executionResult, setExecutionResult] = useState<PromotionResult | null>(null);

  // Settings State
  const currentYear = new Date().getFullYear();
  const [settings, setSettings] = useState<PromotionSettings>({
    previousAcademicYear: `${currentYear - 1}-${currentYear}`,
    newAcademicYear: `${currentYear}-${currentYear + 1}`,
    createArchiveSnapshot: true,
    resetFinances: true,
    carryOverDebts: false,
    keepDiscounts: true,
    resetGrades: true,
    updateStudentCodes: true,
    handleConditionals: 'retain'
  });

  // Class rules state
  const [classRules, setClassRules] = useState<ClassPromotionRule[]>([]);
  
  // Individual Student Decisions state: key is `${sourceListId}_${studentCode}`
  const [studentDecisions, setStudentDecisions] = useState<Record<string, PromotionStudentDecision>>({});
  
  // Filtering & Search in Step 2 & Step 4
  const [classFilterGrade, setClassFilterGrade] = useState<string>('all');
  const [studentFilterGrade, setStudentFilterGrade] = useState<string>('all');
  const [studentFilterStatus, setStudentFilterStatus] = useState<'all' | 'passed' | 'conditional' | 'failed'>('passed');
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');

  // Initialize promotion rules whenever modal opens
  useEffect(() => {
    if (isOpen && savedLists.length > 0) {
      // Filter out already archived lists thoroughly
      const isArchived = (l: any) => Boolean(
        l.isArchive || 
        l.isArchived || 
        (typeof l.name === 'string' && l.name.startsWith('[أرشيف')) || 
        l.archiveYear
      );
      const activeLists = savedLists.filter(l => !isArchived(l));
      const initialRules = generateInitialPromotionRules(activeLists);

      // If preSelectedListId is given, enable only that one, else enable all
      if (preSelectedListId) {
        initialRules.forEach(r => {
          r.enabled = r.sourceListId === preSelectedListId;
        });
      }

      setClassRules(initialRules);
      setCurrentStep(1);
      setExecutionResult(null);
      setExecutionProgress(0);
      setExecutionStatusText('');
      setStudentFilterStatus('passed');
      setClassFilterGrade('all');
      setStudentFilterGrade(preSelectedListId || 'all');
      setStudentSearchQuery('');

      // Precompute default decisions for all students
      const decisions: Record<string, PromotionStudentDecision> = {};
      activeLists.forEach(list => {
        const matchingRule = initialRules.find(r => r.sourceListId === list.id);
        const isGraduation = matchingRule?.isGraduation || false;

        (list.students || []).forEach((stu: any) => {
          const code = stu.student || stu.code;
          const key = `${list.id}_${code}`;
          const evalRes = evaluateStudentAcademicStatus(stu);

          if (evalRes.status === 'passed') {
            decisions[key] = isGraduation ? 'graduate' : 'promote';
          } else {
            // Conditional and Failed students (including those with 0 grades) are retained by default
            decisions[key] = 'retain';
          }
        });
      });
      setStudentDecisions(decisions);
    }
  }, [isOpen, savedLists, preSelectedListId]);

  // Calculation helpers
  const enabledRules = useMemo(() => classRules.filter(r => r.enabled), [classRules]);

  const availableGrades = useMemo(() => {
    const set = new Set<string>();
    classRules.forEach(r => {
      if (r.sourceGrade) set.add(r.sourceGrade);
    });
    return Array.from(set);
  }, [classRules]);

  const filteredClassRules = useMemo(() => {
    if (classFilterGrade === 'all') return classRules;
    return classRules.filter(r => r.sourceGrade === classFilterGrade);
  }, [classRules, classFilterGrade]);

  const studentStatusCounts = useMemo(() => {
    let passed = 0;
    let conditional = 0;
    let failed = 0;
    let total = 0;

    enabledRules.forEach(rule => {
      // If a specific class is selected in the dropdown, calculate stats strictly for this targeted class!
      if (studentFilterGrade !== 'all' && rule.sourceListId !== studentFilterGrade) return;

      rule.students.forEach(stu => {
        total++;
        const evalRes = evaluateStudentAcademicStatus(stu);
        if (evalRes.status === 'conditional') {
          conditional++;
        } else if (evalRes.status === 'failed') {
          failed++;
        } else {
          passed++;
        }
      });
    });

    return { passed, conditional, failed, total };
  }, [enabledRules, studentFilterGrade]);

  const selectedStudentsStats = useMemo(() => {
    let total = 0;
    let willPromote = 0;
    let willRetain = 0;
    let willGraduate = 0;
    let willExclude = 0;

    enabledRules.forEach(rule => {
      rule.students.forEach(stu => {
        total++;
        const code = stu.student || stu.code;
        const key = `${rule.sourceListId}_${code}`;
        const decision = studentDecisions[key] || (rule.isGraduation ? 'graduate' : 'promote');
        if (decision === 'promote') willPromote++;
        else if (decision === 'retain') willRetain++;
        else if (decision === 'graduate') willGraduate++;
        else if (decision === 'exclude') willExclude++;
      });
    });

    return { total, willPromote, willRetain, willGraduate, willExclude };
  }, [enabledRules, studentDecisions]);

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------
  const handleToggleRule = (listId: string) => {
    setClassRules(prev => prev.map(r => r.sourceListId === listId ? { ...r, enabled: !r.enabled } : r));
  };

  const handleSelectAllRules = (selectAll: boolean) => {
    setClassRules(prev => prev.map(r => {
      if (classFilterGrade !== 'all' && r.sourceGrade !== classFilterGrade) {
        return r;
      }
      return { ...r, enabled: selectAll };
    }));
  };

  const handleTargetGradeChange = (listId: string, newTargetGrade: string) => {
    setClassRules(prev => prev.map(r => {
      if (r.sourceListId !== listId) return r;
      const isGrad = newTargetGrade.includes('خريج') || newTargetGrade.includes('تخرج');
      return {
        ...r,
        targetGrade: newTargetGrade,
        isGraduation: isGrad
      };
    }));
  };

  const handleTargetNameChange = (listId: string, newTargetName: string) => {
    setClassRules(prev => prev.map(r => r.sourceListId === listId ? { ...r, targetClassName: newTargetName } : r));
  };

  const handleStudentDecisionChange = (sourceListId: string, studentCode: string, decision: PromotionStudentDecision) => {
    const key = `${sourceListId}_${studentCode}`;
    setStudentDecisions(prev => ({ ...prev, [key]: decision }));
  };

  const handleBulkSetDecisionsForStatus = (status: 'passed' | 'conditional' | 'failed', decision: PromotionStudentDecision) => {
    setStudentDecisions(prev => {
      const next = { ...prev };
      enabledRules.forEach(rule => {
        if (studentFilterGrade !== 'all' && rule.sourceListId !== studentFilterGrade) return;
        rule.students.forEach(stu => {
          const evalRes = evaluateStudentAcademicStatus(stu);
          if (evalRes.status === status) {
            const code = stu.student || stu.code;
            const key = `${rule.sourceListId}_${code}`;
            next[key] = decision;
          }
        });
      });
      return next;
    });
  };

  // Execution Trigger
  const handleExecutePromotion = async () => {
    setIsExecuting(true);
    setExecutionProgress(5);
    setExecutionStatusText('بدء التحضير لعملية الترحيل السنوي...');

    try {
      const result = await executePromotionPipeline({
        schoolId,
        schoolName,
        allCurrentLists: savedLists,
        classRules,
        studentDecisions,
        settings,
        onProgress: (prog, text) => {
          setExecutionProgress(prog);
          setExecutionStatusText(text);
        }
      });

      setExecutionResult(result);
      // Refresh local saved lists with newly created lists safely (deduplicated)
      setSavedLists(prev => {
        const map = new Map<string, any>();
        prev.forEach((l: any) => { if (l?.id) map.set(l.id, l); });
        (result.promotedLists || []).forEach((l: any) => { if (l?.id) map.set(l.id, l); });
        return Array.from(map.values());
      });
      showToast('🎉 تم إنجاز الترحيل السنوي وأرشفة العام السابق بنجاح تام!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'فشلت عملية الترحيل', 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  // Render Step Content
  return (
    <div 
      dir="rtl"
      className="fixed inset-0 z-[9999] w-screen h-[100dvh] bg-[#0b1120] text-white flex flex-col overflow-hidden select-none animate-in fade-in duration-200"
    >
      {/* Top Header - Edge to Edge & Fixed */}
      <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-3.5 border-b border-white/10 bg-gradient-to-r from-blue-950/90 via-[#0c1326] to-purple-950/90 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30 text-white shrink-0">
            <GraduationCap size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">معالج الترحيل السنوي للعام الدراسي الجديد</h3>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-black">
                نظام الأرشفة الذكي 🛡️
              </span>
            </div>
            <p className="text-white/60 text-xs hidden sm:block mt-0.5">
              ترقية صفوف الطلاب الناجحين، فرز المعيدين، وأرشفة العام السابق بأمان متكامل
            </p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          disabled={isExecuting}
          className="p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all disabled:opacity-30 cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      {/* Stepper Progress Bar - Locked & Fixed at the top (Does not scroll) */}
      {!executionResult && (
        <div className="shrink-0 sticky top-0 z-30 px-3 sm:px-6 py-2.5 bg-[#0a0f1d] border-b border-white/10 shadow-md">
          <div className="flex items-center justify-between overflow-x-auto gap-2 py-0.5 custom-scrollbar">
            {[
              { step: 1, title: 'التهيئة والأرشفة', icon: Calendar },
              { step: 2, title: 'اختيار الشعب', icon: Layers },
              { step: 3, title: 'خريطة الترقية', icon: RefreshCw },
              { step: 4, title: 'فرز الناجحين', icon: Users },
              { step: 5, title: 'السياسة المالية', icon: Settings },
              { step: 6, title: 'المراجعة والتنفيذ', icon: CheckCircle2 }
            ].map((item) => {
              const Icon = item.icon;
              const isPassed = currentStep > item.step;
              const isCurrent = currentStep === item.step;
              return (
                <button
                  key={item.step}
                  onClick={() => !isExecuting && currentStep > item.step && setCurrentStep(item.step)}
                  disabled={isExecuting || item.step > currentStep}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all text-xs font-bold shrink-0 ${
                    isCurrent 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/50' 
                      : isPassed 
                      ? 'bg-white/10 text-emerald-400 hover:bg-white/15 cursor-pointer' 
                      : 'bg-white/[0.02] text-white/30 cursor-not-allowed'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    isCurrent ? 'bg-white text-blue-900 font-black' : isPassed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5'
                  }`}>
                    {isPassed ? '✓' : item.step}
                  </div>
                  <span className="whitespace-nowrap">{item.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-6 custom-scrollbar bg-[#080d19]">
          
          {/* ============================================================== */}
          {/* EXECUTION RESULT VIEW */}
          {/* ============================================================== */}
          {executionResult && (
            <div className="py-8 px-4 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.3)] animate-bounce">
                <GraduationCap size={52} />
              </div>
              
              <div className="max-w-xl">
                <h3 className="text-3xl font-black text-white">مبارك! اكتمل الترحيل السنوي بنجاح</h3>
                <p className="text-white/60 text-sm mt-2">
                  تم حفظ كافة بيانات العام المنصرم في الأرشيف الرقمي، ونقل الطلاب الناجحين إلى صفوفهم الجديدة، وتهيئة سجل الدرجات والتحصيلات للعام الدراسي الجديد {settings.newAcademicYear}.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-3xl">
                <div className="bg-[#131d36] border border-emerald-500/30 rounded-2xl p-4 flex flex-col items-center">
                  <span className="text-emerald-400 font-black text-3xl">{executionResult.promotedCount}</span>
                  <span className="text-white/70 text-xs font-bold mt-1">طالب تم ترحيلهم 🚀</span>
                </div>
                <div className="bg-[#131d36] border border-amber-500/30 rounded-2xl p-4 flex flex-col items-center">
                  <span className="text-amber-400 font-black text-3xl">{executionResult.retainedCount}</span>
                  <span className="text-white/70 text-xs font-bold mt-1">طالب معيد في صفه 🔁</span>
                </div>
                <div className="bg-[#131d36] border border-purple-500/30 rounded-2xl p-4 flex flex-col items-center">
                  <span className="text-purple-400 font-black text-3xl">{executionResult.graduatedCount}</span>
                  <span className="text-white/70 text-xs font-bold mt-1">خريج في سجل الشرف 🎓</span>
                </div>
                <div className="bg-[#131d36] border border-blue-500/30 rounded-2xl p-4 flex flex-col items-center">
                  <span className="text-blue-400 font-black text-3xl">{executionResult.newListsCount}</span>
                  <span className="text-white/70 text-xs font-bold mt-1">شعب جديدة نشطة 📚</span>
                </div>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-right max-w-2xl w-full flex items-start gap-3">
                <ShieldCheck className="text-emerald-400 shrink-0 mt-0.5" size={20} />
                <div>
                  <h5 className="text-emerald-300 font-black text-sm">نسخة الأرشيف المجمدة محفوظة بأمان 🛡️</h5>
                  <p className="text-white/60 text-xs mt-0.5 leading-relaxed">
                    تم إنشاء {executionResult.archivedListsCount} قائمة مؤرشفة تحتوي على كافة الدرجات القديمة وسجلات الرسوم. يمكنك معاينتها أو طباعة الشهادات منها في أي وقت من خلال قسم (الأرشيف الرقمي).
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base shadow-xl shadow-emerald-900/40 hover:scale-105 transition-all"
              >
                إغلاق والعودة إلى قائمة الشعب والطلاب
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 1: تهيئة الأعوام والأرشفة */}
          {/* ============================================================== */}
          {!executionResult && currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in-50 duration-300">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
                <Calendar className="text-blue-400 shrink-0 mt-0.5" size={22} />
                <div>
                  <h4 className="text-blue-300 font-black text-sm">تحديد الإطار الزمني للعام الدراسي</h4>
                  <p className="text-white/60 text-xs mt-1 leading-relaxed">
                    يبدأ الترحيل بتحديد العام الدراسي المنصرم المراد أرشفته، والعام الدراسي الجديد الذي ستتولد فيه الشعب والصفوف للطلاب.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#111a33] border border-white/10 rounded-2xl p-4 space-y-2">
                  <label className="text-white/70 text-xs font-bold block">العام الدراسي المنصرم (الحالي)</label>
                  <input
                    type="text"
                    value={settings.previousAcademicYear}
                    onChange={e => setSettings(prev => ({ ...prev, previousAcademicYear: e.target.value }))}
                    placeholder="مثال: 2024-2025"
                    className="w-full bg-[#0a0f1d] border border-white/15 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:border-blue-500 outline-none"
                  />
                  <p className="text-white/40 text-[11px]">سيتم وسم النسخ المؤرشفة بهذا العام لسهولة الرجوع إليها لاحقاً.</p>
                </div>

                <div className="bg-[#111a33] border border-white/10 rounded-2xl p-4 space-y-2">
                  <label className="text-white/70 text-xs font-bold block">العام الدراسي الجديد (المستهدف)</label>
                  <input
                    type="text"
                    value={settings.newAcademicYear}
                    onChange={e => setSettings(prev => ({ ...prev, newAcademicYear: e.target.value }))}
                    placeholder="مثال: 2025-2026"
                    className="w-full bg-[#0a0f1d] border border-emerald-500/40 rounded-xl px-4 py-2.5 text-emerald-300 font-bold text-sm focus:border-emerald-400 outline-none"
                  />
                  <p className="text-white/40 text-[11px]">ستحمل الشعب والقوائم الجديدة وسم هذا العام الدراسي.</p>
                </div>
              </div>

              {/* Safety Snapshot Feature */}
              <div className="bg-gradient-to-r from-emerald-950/40 to-teal-950/20 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <h4 className="text-emerald-300 font-black text-sm">ميزة الأرشفة والتجميد التلقائي (موصى بها بشدة)</h4>
                      <p className="text-white/60 text-xs">
                        تضمن عدم ضياع أي سجل للدرجات، بطاقات الدرجات، أو الدفعات المالية السابقة
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.createArchiveSnapshot} 
                      onChange={e => setSettings(prev => ({ ...prev, createArchiveSnapshot: e.target.checked }))}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
                
                <div className="bg-black/30 rounded-xl p-3.5 text-xs text-white/70 space-y-1 leading-relaxed">
                  <p className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400" />
                    يتم أخذ نسخة كاملة ومستقلة لجميع الشعب الحالية مع الاحتفاظ بجميع درجات الفصول والامتحانات.
                  </p>
                  <p className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400" />
                    يمكن استعراض وطباعة بطاقات الدرجات للعام الماضي في أي وقت عبر قسم (الأرشيف الرقمي).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 2: اختيار الشعب المراد ترحيلها */}
          {/* ============================================================== */}
          {!executionResult && currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in-50 duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#111a33] p-4 rounded-2xl border border-white/10">
                <div>
                  <h4 className="text-white font-black text-sm">حدد الشعب والصفوف التي ترغب بترحيل طلابها</h4>
                  <p className="text-white/50 text-xs">
                    المحدد حالياً: <span className="text-blue-400 font-bold">{enabledRules.length}</span> من أصل {classRules.length} شعبة ({selectedStudentsStats.total} طالب)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSelectAllRules(true)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all cursor-pointer"
                  >
                    {classFilterGrade === 'all' ? 'تحديد الكل' : `تحديد شعب ${classFilterGrade}`}
                  </button>
                  <button
                    onClick={() => handleSelectAllRules(false)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 text-xs font-bold transition-all cursor-pointer"
                  >
                    إلغاء التحديد
                  </button>
                </div>
              </div>

              {/* Grade Filter Bar */}
              {availableGrades.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                  <span className="text-white/50 text-xs font-bold ml-1 shrink-0 flex items-center gap-1">
                    <Filter size={13} />
                    تصفية حسب الصف:
                  </span>
                  <button
                    onClick={() => setClassFilterGrade('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                      classFilterGrade === 'all'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    كافة الصفوف ({classRules.length})
                  </button>
                  {availableGrades.map(grade => {
                    const count = classRules.filter(r => r.sourceGrade === grade).length;
                    const isSelected = classFilterGrade === grade;
                    return (
                      <button
                        key={grade}
                        onClick={() => setClassFilterGrade(grade)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        {grade} ({count})
                      </button>
                    );
                  })}
                </div>
              )}

              {filteredClassRules.length === 0 ? (
                <div className="p-8 text-center text-white/40 bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
                  لا توجد شعب مطابقة لهذا الصف
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredClassRules.map(rule => {
                    const sampleGrade = rule.sourceGrade;
                    return (
                      <div
                        key={rule.sourceListId}
                        onClick={() => handleToggleRule(rule.sourceListId)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          rule.enabled 
                            ? 'bg-[#152142] border-blue-500/50 shadow-lg shadow-blue-900/20' 
                            : 'bg-[#0e1529] border-white/5 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                            rule.enabled ? 'bg-blue-600 border-blue-500 text-white' : 'border-white/20'
                          }`}>
                            {rule.enabled && <Check size={14} />}
                          </div>
                          <div>
                            <h5 className="text-white font-bold text-sm">{rule.sourceClassName}</h5>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-white/40 text-xs">{sampleGrade || 'صف غير محدد'}</span>
                              <span className="w-1 h-1 rounded-full bg-white/20"></span>
                              <span className="text-blue-300 text-xs font-bold">{rule.studentCount} طالب</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-left">
                          {rule.isGraduation ? (
                            <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                              مرحلة تخرج 🎓
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-bold">
                              ترقية للصف الأعلى ↗
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 3: خريطة الترقية وتسمية الصفوف الجديدة */}
          {/* ============================================================== */}
          {!executionResult && currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in-50 duration-300">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 flex items-start gap-3">
                <RefreshCw className="text-purple-400 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="text-purple-300 font-black text-sm">تخصيص خريطة الانتقال للصفوف التالية وتسميات الشعب</h4>
                  <p className="text-white/60 text-xs mt-0.5">
                    يقوم النظام باقتراح الصف التالي والاسم الجديد تلقائياً مع الحفاظ على الشعبة (أ، ب...). يمكنك تعديل أي صف أو تسمية كما تراه الإدارة مناسباً.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {enabledRules.map(rule => (
                  <div 
                    key={rule.sourceListId}
                    className="bg-[#111a33] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="md:w-1/3">
                      <div className="flex items-center gap-2">
                        <span className="text-white/40 text-xs">الشعبة الحالية:</span>
                        <h5 className="text-white font-black text-sm">{rule.sourceClassName}</h5>
                      </div>
                      <div className="text-white/50 text-xs mt-0.5">
                        {rule.sourceGrade} ({rule.studentCount} طالب)
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-blue-400 font-bold text-xs self-center">
                      <span>تنتقل إلى</span>
                      <ArrowLeft size={16} />
                    </div>

                    <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-white/50 text-[10px] font-bold block mb-1">الصف المستهدف للعام الجديد</label>
                        <select
                          value={rule.targetGrade}
                          onChange={e => handleTargetGradeChange(rule.sourceListId, e.target.value)}
                          className="w-full bg-[#0a0f1d] border border-white/15 rounded-xl px-3 py-2 text-white font-bold text-xs focus:border-blue-500 outline-none"
                        >
                          {ALL_IRAQI_GRADES.map(g => (
                            <option key={g} value={g} className="bg-[#0b1120] text-white">{g}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-white/50 text-[10px] font-bold block mb-1">اسم الشعبة الجديدة المقترح</label>
                        <input
                          type="text"
                          value={rule.targetClassName}
                          onChange={e => handleTargetNameChange(rule.sourceListId, e.target.value)}
                          className="w-full bg-[#0a0f1d] border border-white/15 rounded-xl px-3 py-2 text-emerald-300 font-bold text-xs focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 4: فرز الطلاب وحالات النجاح */}
          {/* ============================================================== */}
          {!executionResult && currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in-50 duration-300 w-full max-w-full overflow-hidden">
              {/* Filter and Bulk Action Controls */}
              <div className="bg-[#111a33] border border-white/10 rounded-2xl p-4 space-y-3.5 w-full max-w-full overflow-hidden">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="text"
                      value={studentSearchQuery}
                      onChange={e => setStudentSearchQuery(e.target.value)}
                      placeholder="بحث عن طالب بالاسم أو الكود..."
                      className="w-full bg-[#0a0f1d] border border-white/15 rounded-xl pr-9 pl-4 py-2 text-white text-xs outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={studentFilterGrade}
                      onChange={e => setStudentFilterGrade(e.target.value)}
                      className="bg-[#0a0f1d] border border-white/15 rounded-xl px-3 py-2 text-white font-bold text-xs outline-none"
                    >
                      <option value="all">كافة الشعب المحددة ({enabledRules.length})</option>
                      {enabledRules.map(r => (
                        <option key={r.sourceListId} value={r.sourceListId}>{r.sourceClassName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status Filter Tabs - Defaults to "الناجحون فقط" */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  <button
                    onClick={() => setStudentFilterStatus('passed')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                      studentFilterStatus === 'passed'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400'
                        : 'bg-white/5 text-emerald-400 hover:bg-white/10 border border-emerald-500/20'
                    }`}
                  >
                    <span>الناجحون فقط ✅</span>
                    <span className="bg-black/30 px-1.5 py-0.5 rounded-full text-[10px]">
                      {studentStatusCounts.passed}
                    </span>
                  </button>

                  <button
                    onClick={() => setStudentFilterStatus('conditional')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                      studentFilterStatus === 'conditional'
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-1 ring-amber-400'
                        : 'bg-white/5 text-amber-300 hover:bg-white/10 border border-amber-500/20'
                    }`}
                  >
                    <span>المكملون (دور ثاني) ⏳</span>
                    <span className="bg-black/30 px-1.5 py-0.5 rounded-full text-[10px]">
                      {studentStatusCounts.conditional}
                    </span>
                  </button>

                  <button
                    onClick={() => setStudentFilterStatus('failed')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                      studentFilterStatus === 'failed'
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-1 ring-rose-400'
                        : 'bg-white/5 text-rose-300 hover:bg-white/10 border border-rose-500/20'
                    }`}
                  >
                    <span>الراسبون (إعادة) ❌</span>
                    <span className="bg-black/30 px-1.5 py-0.5 rounded-full text-[10px]">
                      {studentStatusCounts.failed}
                    </span>
                  </button>

                  <button
                    onClick={() => setStudentFilterStatus('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                      studentFilterStatus === 'all'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    <span>كافة الحالات</span>
                    <span className="bg-black/30 px-1.5 py-0.5 rounded-full text-[10px]">
                      {studentStatusCounts.total}
                    </span>
                  </button>
                </div>

                {/* Status Notice */}
                {studentFilterStatus === 'passed' && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2 text-emerald-300 text-xs">
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span>
                      عرض تلقائي للناجحين فقط ({studentStatusCounts.passed} طالب مؤهل للترحيل). تم اعتماد قرار الترقية للصف التالي تلقائياً لكل ناجح.
                    </span>
                  </div>
                )}
                {studentFilterStatus === 'failed' && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2 text-rose-300 text-xs">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>
                      عرض الراسبين ({studentStatusCounts.failed} طالب لديهم رسوب أو درجات صفر). تم اعتماد قرار الإبقاء في نفس الصف للإعادة تلقائياً.
                    </span>
                  </div>
                )}
                {studentFilterStatus === 'conditional' && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-amber-300 text-xs">
                    <Clock size={16} className="shrink-0" />
                    <span>
                      عرض المكملين ({studentStatusCounts.conditional} طالب لديهم إكمال دور ثاني). تم اعتماد قرار الإبقاء المؤقت حتى نتيجة الدور الثاني.
                    </span>
                  </div>
                )}

                {/* Bulk Actions Bar */}
                <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-white/50">إجراءات سريعة:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleBulkSetDecisionsForStatus('passed', 'promote')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 font-bold transition-all cursor-pointer"
                    >
                      ترقية جميع الناجحين للصف التالي ✅
                    </button>
                    <button
                      onClick={() => handleBulkSetDecisionsForStatus('conditional', 'retain')}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 font-bold transition-all cursor-pointer"
                    >
                      إبقاء المكملين في نفس الصف مؤقتاً ⏳
                    </button>
                    <button
                      onClick={() => handleBulkSetDecisionsForStatus('failed', 'retain')}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 font-bold transition-all cursor-pointer"
                    >
                      إبقاء الراسبين للإعادة 🔁
                    </button>
                  </div>
                </div>
              </div>

              {/* Students List Display - Locked horizontally, completely responsive */}
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto overflow-x-hidden pr-1 w-full max-w-full custom-scrollbar">
                {enabledRules.flatMap(rule => {
                  if (studentFilterGrade !== 'all' && rule.sourceListId !== studentFilterGrade) return [];

                  return rule.students.filter(stu => {
                    const nameMatch = (stu.name || '').toLowerCase().includes(studentSearchQuery.toLowerCase());
                    const codeMatch = (stu.code || stu.student || '').toLowerCase().includes(studentSearchQuery.toLowerCase());
                    if (studentSearchQuery && !nameMatch && !codeMatch) return false;

                    const evalRes = evaluateStudentAcademicStatus(stu);
                    if (studentFilterStatus === 'passed' && evalRes.status !== 'passed') return false;
                    if (studentFilterStatus === 'conditional' && evalRes.status !== 'conditional') return false;
                    if (studentFilterStatus === 'failed' && evalRes.status !== 'failed') return false;

                    return true;
                  }).map(stu => {
                    const studentCode = stu.student || stu.code;
                    const key = `${rule.sourceListId}_${studentCode}`;
                    const evalRes = evaluateStudentAcademicStatus(stu);
                    const defaultDecisionForStu = evalRes.status === 'passed' ? (rule.isGraduation ? 'graduate' : 'promote') : 'retain';
                    const currentDecision = studentDecisions[key] || defaultDecisionForStu;

                    return (
                      <div 
                        key={key}
                        className="w-full max-w-full bg-[#111a33] border border-white/5 rounded-2xl p-3 sm:p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-white/20 transition-all overflow-hidden"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-[#0a0f1d] border border-white/10 flex items-center justify-center text-base font-black text-white/70 shrink-0">
                            {stu.avatar ? (
                              <img src={stu.avatar} alt="" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              '👨‍🎓'
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="text-white font-bold text-sm truncate max-w-[200px] sm:max-w-md">{stu.name}</h5>
                              <span className="text-white/40 text-[11px] font-mono shrink-0">{studentCode}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-white/50 text-xs shrink-0">{rule.sourceClassName}</span>
                              <span className="w-1 h-1 rounded-full bg-white/20 shrink-0"></span>
                              
                              {/* Academic Result Pill */}
                              {evalRes.status === 'passed' && (
                                <span className="text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0">
                                  ناجح {evalRes.average > 0 ? `(المعدل: ${evalRes.average})` : 'مؤهل للترقية'}
                                </span>
                              )}
                              {evalRes.status === 'conditional' && (
                                <span className="text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0">
                                  مكمل ({evalRes.failingSubjectsCount} مواد)
                                </span>
                              )}
                              {evalRes.status === 'failed' && (
                                <span className="text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0">
                                  {evalRes.average === 0 ? 'راسب (درجات صفر / غير مرصودة)' : `راسب (${evalRes.failingSubjectsCount} مواد)`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Selection Pills */}
                        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                          <button
                            onClick={() => handleStudentDecisionChange(rule.sourceListId, studentCode, 'promote')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                              currentDecision === 'promote' 
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400' 
                                : 'bg-white/5 text-white/60 hover:bg-white/10'
                            }`}
                          >
                            يرحل للصف التالي ↗
                          </button>

                          <button
                            onClick={() => handleStudentDecisionChange(rule.sourceListId, studentCode, 'retain')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                              currentDecision === 'retain' 
                                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-1 ring-amber-400' 
                                : 'bg-white/5 text-white/60 hover:bg-white/10'
                            }`}
                          >
                            معيد (يبقى بصفه) 🔁
                          </button>

                          {rule.isGraduation && (
                            <button
                              onClick={() => handleStudentDecisionChange(rule.sourceListId, studentCode, 'graduate')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                currentDecision === 'graduate' 
                                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400' 
                                  : 'bg-white/5 text-white/60 hover:bg-white/10'
                              }`}
                            >
                              تخرج 🎓
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  });
                })}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 5: السياسة المالية والأكاديمية */}
          {/* ============================================================== */}
          {!executionResult && currentStep === 5 && (
            <div className="space-y-4 animate-in fade-in-50 duration-300">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
                <Coins className="text-amber-400 shrink-0 mt-0.5" size={22} />
                <div>
                  <h4 className="text-amber-300 font-black text-sm">سياسة الرسوم والأقساط للعام الجديد</h4>
                  <p className="text-white/60 text-xs mt-0.5">
                    حدد كيفية معاملة الأقساط القديمة، الخصومات الممنوحة، ودفتر الدرجات في الصف الجديد.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Reset Finances Policy */}
                <div className="bg-[#111a33] border border-white/10 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-white font-black text-sm">تصفير المسدد للعام الجديد</h5>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.resetFinances} 
                        onChange={e => setSettings(prev => ({ ...prev, resetFinances: e.target.checked }))}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-white/50 text-xs leading-relaxed">
                    يعيد ضبط المبلغ المسدد إلى (0) ليبدأ الطالب بتسديد أقساط الصف الجديد، مع بقاء كافة وصولات العام الماضي محفوظة في الأرشيف.
                  </p>
                </div>

                {/* Keep Discounts Policy */}
                <div className="bg-[#111a33] border border-white/10 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-white font-black text-sm">الحفاظ على نسب وأنواع الخصم</h5>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.keepDiscounts} 
                        onChange={e => setSettings(prev => ({ ...prev, keepDiscounts: e.target.checked }))}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                  <p className="text-white/50 text-xs leading-relaxed">
                    تستمر خصومات الطالب (خصم أخوة، خصم كفالة، خصم خاص...) تلقائياً في الصف الجديد دون الحاجة لإعادة إدخالها يدوياً.
                  </p>
                </div>

                {/* Update Student Code Prefix */}
                <div className="bg-[#111a33] border border-white/10 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-white font-black text-sm">تحديث بادئة كود الطالب للصف الجديد</h5>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.updateStudentCodes} 
                        onChange={e => setSettings(prev => ({ ...prev, updateStudentCodes: e.target.checked }))}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-white/50 text-xs leading-relaxed">
                    تحديث بادئة الكود مثل (P1 ➡️ P2 أو M1 ➡️ M2) مع الحفاظ على كود ولي الأمر ورقم الطالب لضمان استمرار الدخول بسلاسة.
                  </p>
                </div>

                {/* Clear Grade Book for New Year */}
                <div className="bg-[#111a33] border border-white/10 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-white font-black text-sm">تصفير سجل الدرجات للشعب الجديدة</h5>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.resetGrades} 
                        onChange={e => setSettings(prev => ({ ...prev, resetGrades: e.target.checked }))}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                  <p className="text-white/50 text-xs leading-relaxed">
                    تجهيز سجل الدرجات بصفوف فارغة وجاهزة للرصد الجديد، مع بقاء كافة درجات العام الماضي محفوظة بالكامل في الأرشيف المجمد.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 6: المراجعة والتنفيذ النهائي */}
          {/* ============================================================== */}
          {!executionResult && currentStep === 6 && (
            <div className="space-y-5 animate-in fade-in-50 duration-300">
              <div className="bg-[#111a33] border border-white/10 rounded-3xl p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
                  <CheckCircle2 size={36} />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-white">جاهز لبدء الترحيل السنوي!</h4>
                  <p className="text-white/60 text-xs mt-1 max-w-md mx-auto">
                    يرجى مراجعة ملخص الأرقام قبل التنفيذ. سيتم أرشفة العام المنصرم ({settings.previousAcademicYear}) وتوليد الشعب للعام الجديد ({settings.newAcademicYear}).
                  </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-right">
                  <div className="bg-[#0a0f1d] border border-emerald-500/30 p-4 rounded-2xl">
                    <span className="text-white/50 text-xs block font-bold">الطلاب المرحلون</span>
                    <span className="text-emerald-400 font-black text-2xl mt-1 block">{selectedStudentsStats.willPromote}</span>
                  </div>
                  <div className="bg-[#0a0f1d] border border-amber-500/30 p-4 rounded-2xl">
                    <span className="text-white/50 text-xs block font-bold">الطلاب المعيدون</span>
                    <span className="text-amber-400 font-black text-2xl mt-1 block">{selectedStudentsStats.willRetain}</span>
                  </div>
                  <div className="bg-[#0a0f1d] border border-purple-500/30 p-4 rounded-2xl">
                    <span className="text-white/50 text-xs block font-bold">الطلاب الخريجون</span>
                    <span className="text-purple-400 font-black text-2xl mt-1 block">{selectedStudentsStats.willGraduate}</span>
                  </div>
                  <div className="bg-[#0a0f1d] border border-blue-500/30 p-4 rounded-2xl">
                    <span className="text-white/50 text-xs block font-bold">الشعب المحددة</span>
                    <span className="text-blue-400 font-black text-2xl mt-1 block">{enabledRules.length}</span>
                  </div>
                </div>

                {/* Safety Guarantee Banner */}
                {settings.createArchiveSnapshot && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-right flex items-center gap-3">
                    <ShieldCheck className="text-emerald-400 shrink-0" size={24} />
                    <div className="text-xs">
                      <span className="text-emerald-300 font-black block">الأرشفة الآمنة مفعلة 🛡️</span>
                      <span className="text-white/60">
                        سيتم حفظ نسخة مطابقة ومجمدة لجميع الشعب الحالية قبل أي تغيير، لتبقى درجات العام الماضي محفوظة للأبد.
                      </span>
                    </div>
                  </div>
                )}

                {/* Progress Animation during execution */}
                {isExecuting && (
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-blue-300">{executionStatusText}</span>
                      <span className="text-white/70 font-mono">{executionProgress}%</span>
                    </div>
                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-300 rounded-full"
                        style={{ width: `${executionProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Bottom Navigation Buttons */}
        {!executionResult && (
          <div className="px-6 py-4 bg-[#0a0f1d] border-t border-white/10 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1 || isExecuting}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowRight size={16} />
              <span>السابق</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                disabled={isExecuting}
                className="px-4 py-2.5 rounded-xl text-white/50 hover:text-white font-bold text-xs transition-all"
              >
                إلغاء
              </button>

              {currentStep < 6 ? (
                <button
                  onClick={() => setCurrentStep(prev => Math.min(6, prev + 1))}
                  disabled={enabledRules.length === 0 && currentStep === 2}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-40"
                >
                  <span>التالي</span>
                  <ArrowLeft size={16} />
                </button>
              ) : (
                <button
                  onClick={handleExecutePromotion}
                  disabled={isExecuting || enabledRules.length === 0}
                  className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-black text-sm shadow-xl shadow-blue-900/40 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-40"
                >
                  {isExecuting ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>جاري الترحيل...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>تأكيد وبدء الترحيل السنوي 🚀</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
  );
};

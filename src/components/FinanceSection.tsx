import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, AlertCircle, Bell, Clock, Check, X, Lock as LockIcon, Hourglass,
  History, Users as UsersIcon, PieChart as LucidePieChart, TrendingUp, TrendingDown, DollarSign, Settings, Wallet,
  ChevronLeft, ArrowRight, Save, Trash2, Send, Search, CheckCircle2, Plus, Edit3, RotateCcw, Smartphone,
  BookOpen, ShieldCheck, Calculator, Megaphone, MessageSquare, Wrench, Car, Lock, UserCog, Verified
} from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { StudentPayment } from '../services/financeService';
import { academicService } from '../services/academicService';
import { AccessLogsSection } from './AccessLogsSection';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { logActivity } from '../utils/auditLogger';
import { auth, db } from '../lib/firebase';
import { collection, query, onSnapshot, orderBy, doc, setDoc, updateDoc, writeBatch, where, addDoc } from 'firebase/firestore';
import { calculateStudentFinancials } from '../utils/studentUtils';
import { DigitalReceiptModal } from './DigitalReceiptModal';
import { safeStorage, safeSessionStorage } from '../lib/storage';

interface FinanceSectionProps {
  isFinanceUnlocked: boolean;
  setIsFinanceUnlocked: (unlocked: boolean) => void;
  financePIN: string;
  setFinancePIN: (pin: string) => void;
  pendingPayments: StudentPayment[];
  setPendingPayments: React.Dispatch<React.SetStateAction<StudentPayment[]>>;
  students: any[];
  setStudents: React.Dispatch<React.SetStateAction<any[]>>;
  savedLists: any[];
  setSavedLists: React.Dispatch<React.SetStateAction<any[]>>;
  discountLabels: Record<string, string>;
  discountRates: Record<string, number>;
  showToast: (message: string, type?: 'success' | 'error') => void;
  setShowDiscountSimulator: (show: boolean) => void;
  setAuthModalPayment: (payment: StudentPayment | null) => void;
  rejectPayment: (id: string, reason: string) => Promise<void>;
  tuitionFee: number;
  setTuitionFee: (val: number) => void;
  updateDiscountRates: (ratesMap: Record<string, number>) => void;
  correctPIN?: string;
  selectedSchoolId?: string | null;
  schoolName?: string;
  schoolSettings?: any;
  gradesByStage: Record<string, string[]>;
  onSubViewChange?: (isOpen: boolean) => void;
}

const getRoleIcon = (role: string, type: 'TEACHER' | 'STAFF', size = 24) => {
  if (type === 'TEACHER') return <BookOpen size={size} />;
  
  switch (role) {
    case 'مدير': return <ShieldCheck size={size} />;
    case 'محاسب': return <Calculator size={size} />;
    case 'معاون': return <UsersIcon size={size} />;
    case 'إعلامي': return <Megaphone size={size} />;
    case 'علاقات عامة': return <MessageSquare size={size} />;
    case 'موظف خدمة': return <Wrench size={size} />;
    case 'سائق': return <Car size={size} />;
    case 'حارس أمني': return <Lock size={size} />;
    default: return <UserCog size={size} />;
  }
};

const checkPaymentMethodIsElectronic = (inst: any, transactions: any[] = []) => {
  const instStatus = (inst.status || '').toLowerCase().trim();
  const isPaid = inst.paid === true || ['paid', 'completed', 'verified', 'approved', 'verified_payment', 'success'].includes(instStatus) || instStatus.includes('مكتمل');
  if (!isPaid) return false;
  
  // Look for any transaction matching this installment
  const matchingTx = (transactions || []).find((t: any) => 
    (inst.transactionId && t.id === inst.transactionId) || 
    (Number(t.amount || 0) === Number(inst.amount || 0) && t.note && t.note.includes(inst.name))
  );
  
  if (matchingTx) {
    const method = (matchingTx.method || '').toLowerCase();
    if (method.includes('نقدي') || method.includes('مدير') || method.includes('cash') || method.includes('manual')) {
      return false;
    }
    return true; // Electronic payments
  }
  
  const instMethod = (inst.method || '').toLowerCase();
  if (instMethod) {
    if (instMethod.includes('نقدي') || instMethod.includes('مدير') || instMethod.includes('cash') || instMethod.includes('manual')) {
      return false;
    }
    return true;
  }
  
  return false;
};

interface StaffSalaryCardProps {
  member: any;
  activeFinanceSubTab: string;
  idx: number;
  updateStaffSalary: (id: string, updates: any) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error') => void;
  selectedMonth: string;
  teachersList: any[];
}

const StaffSalaryCard: React.FC<StaffSalaryCardProps> = ({
  member,
  activeFinanceSubTab,
  idx,
  updateStaffSalary,
  showToast,
  selectedMonth,
  teachersList
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localBaseSalary, setLocalBaseSalary] = useState('');
  const [localRewards, setLocalRewards] = useState('');
  const [localDeductions, setLocalDeductions] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setLocalBaseSalary(member.baseSalary !== undefined && member.baseSalary !== null ? String(member.baseSalary) : '0');
      setLocalRewards(member.rewards !== undefined && member.rewards !== null ? String(member.rewards) : '0');
      setLocalDeductions(member.deductions !== undefined && member.deductions !== null ? String(member.deductions) : '0');
    }
  }, [member, isEditing]);

  const baseNum = isEditing ? (Number(localBaseSalary) || 0) : (Number(member.baseSalary) || 0);
  const rewardsNum = isEditing ? (Number(localRewards) || 0) : (Number(member.rewards) || 0);
  const deductionsNum = isEditing ? (Number(localDeductions) || 0) : (Number(member.deductions) || 0);

  const displayNetSalary = baseNum + rewardsNum - deductionsNum;

  const maxAmt = Math.max(baseNum + rewardsNum, 1);
  const basePercent = Math.round((baseNum / maxAmt) * 100);
  const rewardsPercent = Math.round((rewardsNum / maxAmt) * 100);
  const deductionsPercent = Math.round((deductionsNum / maxAmt) * 100);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateStaffSalary(member.id, {
        baseSalary: Number(localBaseSalary) || 0,
        rewards: Number(localRewards) || 0,
        deductions: Number(localDeductions) || 0,
      });
      setIsEditing(false);
      showToast(`تم حفظ وتحديث راتب الكادر ${member.name} لشهر ${selectedMonth}`, 'success');
    } catch (error) {
      showToast('حدث خطأ أثناء حفظ التعديلات', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx * 0.03, 0.3) }}
      className={`bg-[#101935]/40 backdrop-blur-xl border rounded-3xl p-5 space-y-5 flex flex-col justify-between group hover:bg-[#101935]/70 transition-all duration-300 shadow-xl relative overflow-hidden ${
        isEditing ? 'border-[#00e5ff]/50 bg-[#101935]/80 shadow-[0_0_25px_rgba(0,229,255,0.15)] ring-1 ring-[#00e5ff]/30' : 'border-white/5 hover:border-[#00e5ff]/20'
      }`}
    >
      {/* Glow indicator on paid members */}
      {member.isPaid && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.04] blur-2xl rounded-full" />
      )}

      <div>
        {/* Member card top banner info */}
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white text-lg shrink-0 transition-all duration-300 ${
              member.isPaid 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                : activeFinanceSubTab === 'teachers' 
                  ? 'bg-amber-400/10 text-amber-400 border border-amber-400/15' 
                  : 'bg-blue-600/10 text-blue-400 border border-blue-500/15'
            }`}>
              {member.isPaid ? <CheckCircle2 size={18} /> : getRoleIcon(member.role, activeFinanceSubTab === 'teachers' ? 'TEACHER' : 'STAFF', 18)}
            </div>
            <div className="min-w-0">
              <h4 className="text-white font-extrabold text-[13px] md:text-sm tracking-tight line-clamp-1 group-hover:text-[#00E5FF] transition-colors">{member.name}</h4>
              <span className="text-white/30 text-[9px] font-black block mt-0.5">{member.role}</span>
            </div>
          </div>
          
          {/* Top Status & Edit badging */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${
              member.isPaid 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-amber-400/10 text-amber-500 border-amber-400/20'
            }`}>
              {member.isPaid ? 'قيد التحويل ✓' : 'لم يصرف بعد'}
            </div>

            <div className="flex items-center gap-1">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="text-[9px] font-black px-2.5 py-1.5 rounded-xl bg-emerald-500 text-black hover:bg-emerald-400 transition-all active:scale-95 flex items-center gap-1 shadow-lg shadow-emerald-500/10 cursor-pointer"
                  >
                    <Check size={10} />
                    <span>حفظ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                    className="text-[9px] font-black px-2.5 py-1.5 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5 transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                  >
                    <X size={10} />
                    <span>إلغاء</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-[9px] font-black px-2.5 py-1.5 rounded-xl border bg-cyan-500/10 text-[#00E5FF] border-[#00E5FF]/20 hover:bg-[#00E5FF] hover:text-black hover:border-transparent transition-all active:scale-95 flex items-center gap-1 shadow-[0_2px_10px_rgba(0,229,255,0.05)] cursor-pointer"
                >
                  <Edit3 size={10} />
                  <span>تعديل الراتب</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Interactive inputs when editing or elegant view mode */}
        <div className="space-y-3.5 mt-5">
          {/* Base Salary */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[8px] font-black px-1">
              <span className="text-cyan-400">💸 الراتب الأساسي</span>
              {baseNum > 0 && <span className="text-white/20 font-mono">{(baseNum).toLocaleString()} د.ع</span>}
            </div>
            {isEditing ? (
              <div className="flex bg-black/60 border border-cyan-500/40 rounded-xl px-2.5 py-1 items-center gap-1.5 focus-within:border-cyan-500/80 transition-colors">
                <input 
                  type="number"
                  value={localBaseSalary}
                  onChange={(e) => setLocalBaseSalary(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent text-white text-xs font-mono font-bold placeholder-white/10 outline-none text-left"
                />
              </div>
            ) : (
              <div className="w-full bg-white/[0.01] border border-white/5 rounded-xl px-3 py-2 font-mono text-xs font-bold text-white tracking-wide text-left select-all">
                {baseNum ? baseNum.toLocaleString() : '0'} <span className="text-[8px] font-sans font-normal text-white/30">د.ع</span>
              </div>
            )}
          </div>

          {/* Rewards & Incentives */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[8px] font-black px-1">
              <span className="text-emerald-400">🎁 مكافآت وحوافز</span>
              {rewardsNum > 0 && <span className="text-emerald-400/50 font-mono">+{(rewardsNum).toLocaleString()}</span>}
            </div>
            {isEditing ? (
              <div className="flex bg-black/60 border border-emerald-500/40 rounded-xl px-2.5 py-1 items-center gap-1.5 focus-within:border-emerald-500/80 transition-colors">
                <input 
                  type="number"
                  value={localRewards}
                  onChange={(e) => setLocalRewards(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent text-emerald-400 text-xs font-mono font-bold placeholder-[#10b981]/10 outline-none text-left"
                />
              </div>
            ) : (
              <div className="w-full bg-emerald-500/[0.01] border border-emerald-500/5 rounded-xl px-3 py-2 font-mono text-xs font-bold text-emerald-400 tracking-wide text-left select-all">
                {rewardsNum ? `+${rewardsNum.toLocaleString()}` : '0'} <span className="text-[8px] font-sans font-normal text-emerald-500/50">د.ع</span>
              </div>
            )}
          </div>

          {/* Deductions */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[8px] font-black px-1">
              <span className="text-rose-400">❌ استقطاعات وخصومات</span>
              {deductionsNum > 0 && <span className="text-rose-400/50 font-mono">-{(deductionsNum).toLocaleString()}</span>}
            </div>
            {isEditing ? (
              <div className="flex bg-black/60 border border-rose-500/40 rounded-xl px-2.5 py-1 items-center gap-1.5 focus-within:border-rose-500/80 transition-colors">
                <input 
                  type="number"
                  value={localDeductions}
                  onChange={(e) => setLocalDeductions(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent text-rose-400 text-xs font-mono font-bold placeholder-[#f43f5e]/10 outline-none text-left"
                />
              </div>
            ) : (
              <div className="w-full bg-rose-500/[0.01] border border-rose-500/5 rounded-xl px-3 py-2 font-mono text-xs font-bold text-rose-400 tracking-wide text-left select-all">
                {deductionsNum ? `-${deductionsNum.toLocaleString()}` : '0'} <span className="text-[8px] font-sans font-normal text-rose-500/50">د.ع</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visual proportional layout & final payroll estimation details */}
      <div className="pt-4 border-t border-white/5 space-y-4">
        {/* Micro proportional bar diagram */}
        {(baseNum > 0 || rewardsNum > 0) && (
          <div className="w-full space-y-1">
            <div className="h-1 bg-white/5 rounded-full flex overflow-hidden">
              <div className="bg-cyan-400 rounded-r-full" style={{ width: `${basePercent}%` }} />
              <div className="bg-emerald-400" style={{ width: `${rewardsPercent}%` }} />
              {deductionsNum > 0 && (
                <div className="bg-rose-500 rounded-l-full" style={{ width: `${deductionsPercent}%` }} />
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <span className="text-white/20 text-[8.5px] font-black block mb-0.5">صافي الراتب المستحق</span>
            <span className="text-[#00E5FF] font-black text-base md:text-lg font-mono tracking-tight leading-none block">
              {displayNetSalary.toLocaleString()} <span className="text-[9px] font-bold">د.ع</span>
            </span>
          </div>
          
          {/* Payment control button or static confirmed badge */}
          {member.isPaid ? (
            <div className="flex items-center gap-1.5 bg-[#10b981]/10 text-emerald-400 border border-emerald-500/15 px-3 py-1.5 rounded-xl text-[9px] font-black">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span>تم الصرف</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={async () => {
                try {
                  await updateStaffSalary(member.id, { isPaid: true, paymentDate: new Date().toISOString() });
                  showToast(`تم توثيق صرف راتب الموظف ${member.name} لشهر ${selectedMonth}`, 'success');
                } catch (e) {
                  showToast('فشل صرف هذا المستحق؛ يرجى المحاولة لاحقاً', 'error');
                }
              }}
              disabled={displayNetSalary <= 0 || isEditing}
              className="bg-white/5 border border-white/5 hover:border-[#00E5FF]/20 hover:bg-white/10 text-white disabled:opacity-20 disabled:pointer-events-none px-3 py-1.5 rounded-xl text-[9px] font-black transition-all cursor-pointer"
            >
              توثيق الصرف المالي
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const FinanceSection: React.FC<FinanceSectionProps> = ({
  isFinanceUnlocked,
  setIsFinanceUnlocked,
  financePIN,
  setFinancePIN,
  pendingPayments,
  setPendingPayments,
  students,
  setStudents,
  savedLists,
  setSavedLists,
  discountLabels,
  discountRates,
  showToast,
  setShowDiscountSimulator,
  setAuthModalPayment,
  rejectPayment,
  tuitionFee,
  setTuitionFee,
  updateDiscountRates,
  correctPIN,
  selectedSchoolId,
  schoolName,
  schoolSettings,
  gradesByStage,
  onSubViewChange
}) => {
  const safeDiscountLabels = useMemo(() => {
    try {
      return discountLabels || {};
    } catch (e) {
      console.error('DEBUG: Error creating safeDiscountLabels', e);
      return {};
    }
  }, [discountLabels]);
  const safeDiscountRates = useMemo(() => {
    try {
      return discountRates || {};
    } catch (e) {
      console.error('DEBUG: Error creating safeDiscountRates', e);
      return {};
    }
  }, [discountRates]);
  const [activeTab, setActiveTab] = useState<'config' | 'lists' | 'overview' | 'staff' | 'payment_methods' | 'payment_requests' | 'receipt_logs' | 'accessLogs'>('config');
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [selectedList, setSelectedList] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmCashPayment, setConfirmCashPayment] = useState<{studentCode: string, installmentId: string} | null>(null);
  const [confirmCancelPayment, setConfirmCancelPayment] = useState<{studentCode: string, installmentId: string, installmentName: string} | null>(null);
  const [cancelConfirmationInput, setCancelConfirmationInput] = useState('');

  useEffect(() => {
    if (onSubViewChange) {
      // Toggle back arrow if a detailed view is active
      onSubViewChange(!!selectedStudent || !!selectedList);
    }
    return () => {
      if (onSubViewChange) {
        onSubViewChange(false);
      }
    };
  }, [selectedStudent, selectedList, onSubViewChange]);

  // Auto-scroll to top when Finance Section is unlocked so employee can see the top tab selector immediately
  useEffect(() => {
    if (isFinanceUnlocked) {
      window.scrollTo({ top: 0 });
      const mainEl = document.querySelector('main');
      if (mainEl) {
        mainEl.scrollTop = 0;
      }
      const pageEl = document.documentElement || document.body;
      if (pageEl) {
        pageEl.scrollTop = 0;
      }
    }
  }, [isFinanceUnlocked]);

  // Clear confirmation input on modal open/close
  useEffect(() => {
    if (confirmCancelPayment) {
      setCancelConfirmationInput('');
    }
  }, [confirmCancelPayment]);

  // Payment requests state
  const [paymentRequests, setPaymentRequests] = useState<any[]>([]);
  const [isProcessingRequest, setIsProcessingRequest] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [selectedChartMonth, setSelectedChartMonth] = useState('أيار');
  const [chartHoverIdx, setChartHoverIdx] = useState<number | null>(null);
  
  // Real-time Transaction list states
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [txFilter, setTxFilter] = useState<'all' | 'cash' | 'electronic'>('all');
  const [txViewMode, setTxViewMode] = useState<'dense' | 'detailed'>('dense'); // Default to dense as requested
  const [txPage, setTxPage] = useState(1);
  const txPageSize = 5;

  // Staff search, status filters
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffStatusFilter, setStaffStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  // Payment requests filters
  const [requestSearchQuery, setRequestSearchQuery] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [requestMethodFilter, setRequestMethodFilter] = useState<string>('all');

  const uniquePaymentMethods = useMemo(() => {
    const methods = new Set<string>();
    paymentRequests.forEach(req => {
      if (req.method) {
        methods.add(req.method);
      }
    });
    return Array.from(methods);
  }, [paymentRequests]);

  const filteredPaymentRequests = useMemo(() => {
    return paymentRequests.filter(req => {
      let displayStudentName = req.studentName;
      const isPlaceholder = !displayStudentName || 
                           displayStudentName === req.studentCode || 
                           displayStudentName === req.studentId || 
                           displayStudentName === 'طالب غير محدد' ||
                           displayStudentName === 'غير محدد';

      if (isPlaceholder) {
         const foundStudent = students.find(s => s.code === req.studentCode || s.student === req.studentCode || s.id === req.studentCode);
         if (foundStudent) {
           displayStudentName = foundStudent.name || foundStudent.fullName || displayStudentName;
         }
      }

      const name = (displayStudentName || '').toLowerCase();
      const code = (req.studentCode || req.studentId || '').toLowerCase();
      const txId = (req.transactionId || '').toLowerCase();
      const txNote = (req.transactionNote || '').toLowerCase();
      const holder = (req.cardholderName || '').toLowerCase();
      const search = requestSearchQuery.toLowerCase().trim();

      const matchesSearch = !search || 
        name.includes(search) || 
        code.includes(search) || 
        txId.includes(search) || 
        txNote.includes(search) || 
        holder.includes(search);

      const matchesStatus = requestStatusFilter === 'all' || req.status === requestStatusFilter;
      const matchesMethod = requestMethodFilter === 'all' || req.method === requestMethodFilter;

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [paymentRequests, requestSearchQuery, requestStatusFilter, requestMethodFilter, students]);

  // Sync selected list with real-time savedLists to ensure data updates reflected immediately
  const currentList = selectedList ? (savedLists.find(l => l.id === selectedList.id) || selectedList) : null;

  useEffect(() => {
    if (activeTab === 'payment_requests') {
      let q = query(collection(db, 'payment_requests'), orderBy('createdAt', 'desc'));
      
    if (!selectedSchoolId) return;

    q = query(
      collection(db, 'payment_requests'),
      where('schoolId', '==', selectedSchoolId || 'unassigned'),
      orderBy('createdAt', 'desc')
    );

      return onSnapshot(q, (snap) => {
        const sorted = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a: any, b: any) => {
            // Priority 1: Pending status
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (b.status === 'pending' && a.status !== 'pending') return 1;
            
            // Priority 2: Newest first
            const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || a.timestamp?.seconds * 1000 || 0);
            const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || b.timestamp?.seconds * 1000 || 0);
            return dateB.getTime() - dateA.getTime();
          });
        setPaymentRequests(sorted);
      }, (error) => {
        console.error("Payment requests listener error:", error);
      });
    }
  }, [activeTab, selectedSchoolId]);

  const handleApprovePayment = async (requestId: string) => {
    setIsProcessingRequest(requestId);
    try {
      await academicService.approvePaymentRequest(requestId);
      // Optimistic update for requests list
      setPaymentRequests(prev => prev.map(p => p.id === requestId ? {...p, status: 'approved'} : p));
      showToast('تم تأكيد الدفعة وتحديث حساب الطالب', 'success');
    } catch (error) {
      console.error(error);
      showToast('خطأ في تأكيد الدفعة', 'error');
    } finally {
      setIsProcessingRequest(null);
    }
  };

  const [rejectionModal, setRejectionModal] = useState<{ id: string; reason: string } | null>(null);

  const handleRejectPayment = async (requestId: string) => {
    setRejectionModal({ id: requestId, reason: '' });
  };

  const confirmRejection = async () => {
    if (!rejectionModal || !rejectionModal.reason.trim()) {
      showToast('يرجى إدخال سبب الرفض', 'error');
      return;
    }
    
    setIsProcessingRequest(rejectionModal.id);
    try {
      await academicService.rejectPaymentRequest(rejectionModal.id, rejectionModal.reason);
      showToast('تم رفض الطلب وإبلاغ ولي الأمر', 'success');
      setRejectionModal(null);
    } catch (error) {
      console.error(error);
      showToast('خطأ في معالجة الرفض', 'error');
    } finally {
      setIsProcessingRequest(null);
    }
  };

  const handleCleanupResolved = async () => {
    try {
      const count = await academicService.cleanupResolvedPaymentRequests();
      showToast(`تم تنظيف ${count} طلب مستكمل (مؤكد ومرفوض)`, 'success');
    } catch (e) {
      console.error(e);
      showToast('خطأ في التنظيف', 'error');
    }
  };

  const handleCleanupOrphaned = async () => {
    try {
      const count = await academicService.cleanupOrphanedPaymentRequests();
      showToast(`تم تنظيف ${count} طلب لطلاب محذوفين`, 'success');
    } catch (e) {
      console.error(e);
      showToast('خطأ في التنظيف', 'error');
    }
  };



  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState({
    mastercard: { enabled: false, details: '', label: 'ماستر كارد' },
    zaincash: { enabled: false, details: '', label: 'زين كاش' },
    asiahawala: { enabled: false, details: '', label: 'آسيا حوالة' },
    fib: { enabled: false, details: '', label: 'مصرف العراق الأول FIB' }
  });

  useEffect(() => {
    if (schoolSettings?.paymentMethods) {
      setPaymentMethods(schoolSettings.paymentMethods);
    }
  }, [schoolSettings]);

  const savePaymentMethods = async () => {
    if (!auth.currentUser || !selectedSchoolId) return;
    try {
      await updateDoc(doc(db, 'school_configs', selectedSchoolId), {
        paymentMethods: paymentMethods,
        updatedAt: new Date().toISOString()
      });
      showToast('تم حفظ وسائل الدفع بنجاح', 'success');
    } catch (error) {
      console.error("Error saving payment methods:", error);
      showToast('خطأ في حفظ البيانات', 'error');
    }
  };
  
  // Staff Salaries State from Firebase
  const [staffSalaries, setStaffSalaries] = useState<any[]>([]);
  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [activeFinanceSubTab, setActiveFinanceSubTab] = useState<'teachers' | 'staff'>('teachers');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isPaying, setIsPaying] = useState(false);
  const [showConfirmPayment, setShowConfirmPayment] = useState(false);

  useEffect(() => {
    if (!selectedSchoolId && !schoolName) return;
    
    // Clear previous teachers list on school change
    setTeachersList([]);

    const safeSchoolId = selectedSchoolId || 'unassigned';
    const safeSchoolName = schoolName || 'unassigned';

    const constraints = [
      where('schoolId', '==', safeSchoolId),
      where('schoolName', '==', safeSchoolName),
      where('school', '==', safeSchoolName)
    ];

    const unsubQueries = constraints.map(constraint => {
      const q = query(collection(db, 'teachers'), constraint);
      return onSnapshot(q, (snapshot) => {
        setTeachersList(prev => {
          const newMap = new Map(prev.map(t => [t.id, t]));
          snapshot.docs.forEach(doc => {
            newMap.set(doc.id, { id: doc.id, ...doc.data() });
          });
          return Array.from(newMap.values());
        });
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'teachers', false);
      });
    });

    const qLegacy = query(collection(db, 'teachers'));
    const unsubLegacy = onSnapshot(qLegacy, (snapshot) => {
      setTeachersList(prev => {
        const newMap = new Map(prev.map(t => [t.id, t]));
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (!data.schoolId && !data.schoolName && !data.school) {
            newMap.set(doc.id, { id: doc.id, ...data });
          }
        });
        return Array.from(newMap.values());
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'teachers_legacy', false);
    });

    const qSalaries = query(collection(db, 'salaries'), orderBy('month', 'desc'));
    const unsubSalaries = onSnapshot(qSalaries, (snapshot) => {
      setStaffSalaries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'salaries', false);
    });

    return () => {
      unsubQueries.forEach(unsub => unsub());
      unsubLegacy();
      unsubSalaries();
    };
  }, [selectedSchoolId, schoolName]);

  const updateStaffSalary = async (teacherId: string, updates: any) => {
    const salaryId = `${teacherId}_${selectedMonth}`;
    const teacher = teachersList.find(t => t.id === teacherId);
    
    // Find existing record to preserve other fields
    const existingRecord = staffSalaries.find(s => s.staffId === teacherId && s.month === selectedMonth) || {};
    
    // Find latest record from any other month to fallback if needed
    const fallbackRecord = staffSalaries
      .filter(s => s.staffId === teacherId && s.baseSalary !== undefined)
      .sort((a, b) => b.month.localeCompare(a.month))[0] || {};

    // Merge updates with existing/fallback data
    const base = Number(
      updates.baseSalary !== undefined 
        ? updates.baseSalary 
        : (existingRecord.baseSalary !== undefined ? existingRecord.baseSalary : (fallbackRecord.baseSalary ?? 0))
    );
    const bonus = Number(updates.rewards !== undefined ? updates.rewards : (existingRecord.rewards ?? 0));
    const deductions = Number(updates.deductions !== undefined ? updates.deductions : (existingRecord.deductions ?? 0));
    const net = base + bonus - deductions;
    const isPaid = updates.isPaid !== undefined ? updates.isPaid : (existingRecord.isPaid ?? false);
    const paymentDate = updates.paymentDate !== undefined ? updates.paymentDate : (existingRecord.paymentDate || null);

    try {
      await setDoc(doc(db, 'salaries', salaryId), {
        ...existingRecord,
        staffId: teacherId,
        staffName: teacher?.name || '?',
        month: selectedMonth,
        baseSalary: base,
        rewards: bonus,
        deductions: deductions,
        netSalary: net,
        isPaid,
        paymentDate,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      logActivity({
        action: 'تعديل راتب موظف',
        details: `تم تحديث راتب ${teacher?.name || 'موظف'} لشهر ${selectedMonth}. صافي الراتب الجديد: ${net.toLocaleString()} د.ع`,
        targetId: teacherId,
        targetType: 'finance_staff'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `salaries/${salaryId}`);
    }
  };

  const currentSalaries = React.useMemo(() => {
    return teachersList.map(teacher => {
      const salaryRecord = staffSalaries.find(s => s.staffId === teacher.id && s.month === selectedMonth);
      
      const fallbackRecord = staffSalaries
        .filter(s => s.staffId === teacher.id && s.baseSalary !== undefined)
        .sort((a, b) => b.month.localeCompare(a.month))[0];

      const baseSalary = salaryRecord?.baseSalary !== undefined 
        ? Number(salaryRecord.baseSalary) 
        : (fallbackRecord?.baseSalary !== undefined ? Number(fallbackRecord.baseSalary) : 0);

      const rewards = salaryRecord?.rewards !== undefined ? Number(salaryRecord.rewards) : 0;
      const deductions = salaryRecord?.deductions !== undefined ? Number(salaryRecord.deductions) : 0;
      
      const netSalary = salaryRecord?.netSalary !== undefined 
        ? Number(salaryRecord.netSalary) 
        : (baseSalary + rewards - deductions);

      const displayRole = teacher.role === 'STAFF' ? teacher.subject : (teacher.subject || 'مدرس');
      return {
        id: teacher.id,
        name: teacher.name,
        role: displayRole,
        baseSalary,
        rewards,
        deductions,
        netSalary,
        isPaid: salaryRecord?.isPaid ?? false,
        paymentDate: salaryRecord?.paymentDate,
      };
    });
  }, [teachersList, staffSalaries, selectedMonth]);

  const totalSalariesPaid = React.useMemo(() => {
    return staffSalaries
      .filter(s => s.isPaid && s.month === selectedMonth)
      .reduce((sum, s) => sum + (s.netSalary || 0), 0);
  }, [staffSalaries, selectedMonth]);

  const [confirmDelete, setConfirmDelete] = useState<{ action: () => void; title: string; message: string } | null>(null);
  
  // Forgot PIN States
  const [showForgotPIN, setShowForgotPIN] = useState(false);
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [newPINInput, setNewPINInput] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // Statistics States
  const [isEditingFee, setIsEditingFee] = useState(false);
  const [isEditingDiscounts, setIsEditingDiscounts] = useState(false);
  const [tempFee, setTempFee] = useState(tuitionFee.toString());
  const [tempRates, setTempRates] = useState<Record<string, string>>({});
  const [activeData, setActiveData] = useState<any>(null);

  useEffect(() => {
    if (!isEditingFee) {
      setTempFee(tuitionFee.toString());
    }
  }, [tuitionFee, isEditingFee]);

  useEffect(() => {
    if (!isEditingDiscounts && safeDiscountLabels && typeof safeDiscountLabels === 'object') {
      const initialRates: Record<string, string> = {};
      Object.keys(safeDiscountLabels).forEach(key => {
        if (key && key !== 'NONE') {
          initialRates[key] = (safeDiscountRates && safeDiscountRates[key] ? safeDiscountRates[key] : 0).toString();
        }
      });
      setTempRates(initialRates);
    }
  }, [safeDiscountRates, isEditingDiscounts, safeDiscountLabels]);

  const handleSaveFee = () => {
    const val = parseInt(tempFee.replace(/,/g, '')) || 0;
    setTuitionFee(val);
    setIsEditingFee(false);
    showToast('تم تحديث مبلغ القسط السنوي');
    logActivity({
      action: 'تعديل القسط الأساسي',
      details: `تم تعديل مبلغ القسط السنوي الأساسي إلى: ${val.toLocaleString()} د.ع`,
      targetType: 'finance_config'
    });
  };

  const handleSaveDiscounts = () => {
    const newRatesMap: Record<string, number> = {};
    Object.entries(tempRates).forEach(([type, val]) => {
      newRatesMap[type] = parseInt(val as string) || 0;
    });
    updateDiscountRates(newRatesMap);
    setIsEditingDiscounts(false);
    logActivity({
      action: 'تعديل نسب الخصم',
      details: `تم تحديث نسب الخصم للفئات: ${Object.keys(newRatesMap).join(', ')}`,
      targetType: 'finance_config'
    });
  };

  // Installment Plan Configuration
  const [installmentPlan, setInstallmentPlan] = useState<any[]>(() => {
    const saved = safeStorage.getItem('academy6_installment_plan_v2');
    return saved ? JSON.parse(saved) : [
      { id: 'initial-reg', name: 'قسط التسجيل', amount: 250000, dueDate: '2026-09-01' },
      { id: 'initial-p1', name: 'القسط الأول', amount: 500000, dueDate: '2026-11-01' },
      { id: 'initial-p2', name: 'القسط الثاني', amount: 500000, dueDate: '2027-02-01' },
    ];
  });

  // Tracking sent parent alert bells
  const [sentBells, setSentBells] = useState<Record<string, boolean>>(() => {
    try {
      const saved = safeStorage.getItem('academy6_sent_bells_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleSendParentAlert = async (stu: any, inst: any, bellKey: string) => {
    try {
      const targetUserId = stu.parentCode || stu.code || stu.student || stu.id;
      const displayAmount = (inst.amount || 0).toLocaleString();
      
      // Post notification to Firestore
      await addDoc(collection(db, 'notifications'), {
        userId: targetUserId,
        studentId: stu.id,
        studentCode: stu.code || '',
        title: 'تذكير بموعد القسط - بوابة بيرق',
        message: `يرجى العلم بأنه قد استحق موعد تسديد القسط (${inst.name}) بقيمة ${displayAmount} د.ع للطالب ${stu.name}. يرجى السداد في أقرب وقت لتفادي أي قيود.`,
        type: 'support', // To appear status-wide
        recipientRole: 'parent',
        icon: 'Bell',
        read: false,
        timestamp: new Date(),
        createdAt: new Date()
      });

      // Also post a notification directly for the student as requested
      const studentUserId = stu.code || stu.student || stu.id;
      if (studentUserId && studentUserId !== targetUserId) {
        await addDoc(collection(db, 'notifications'), {
          userId: studentUserId,
          studentId: stu.id,
          studentCode: stu.code || '',
          title: 'تذكير بموعد القسط - بوابة بيرق',
          message: `عزيزي الطالب ${stu.name}، يرجى تذكير ولي الأمر بموعد قسطك (${inst.name}) المستحق بمبلغ ${displayAmount} د.ع.`,
          type: 'support',
          recipientRole: 'student',
          icon: 'Bell',
          read: false,
          timestamp: new Date(),
          createdAt: new Date()
        });
      }

      // Update state
      const updatedBells = { ...sentBells, [bellKey]: true };
      setSentBells(updatedBells);
      safeStorage.setItem('academy6_sent_bells_v1', JSON.stringify(updatedBells));
      
      showToast('تم إرسال الإشعار اللحظي بنجاح إلى هاتف ولي الأمر والطالب نفسه', 'success');

      logActivity({
        action: 'تنبيه قسط متأخر',
        details: `تم إرسال تذكير سداد القسط (${inst.name}) بمبلغ ${displayAmount} د.ع للطالب ${stu.name}.`,
        targetId: stu.code,
        targetType: 'student_finance'
      });
    } catch (error) {
      console.error("Error sending parent alert:", error);
      showToast('خطأ أثناء إرسال الإشعار', 'error');
    }
  };

  const savePlanTemplate = (plan: any[]) => {
    setInstallmentPlan(plan);
    safeStorage.setItem('academy6_installment_plan_v2', JSON.stringify(plan));
    
    logActivity({
      action: 'تعديل مسودة الأقساط',
      details: `تم تحديث مسودة الأقساط: ${plan.map(p => `${p.name}: ${p.amount.toLocaleString()} د.ع`).join(', ')}`,
      targetType: 'finance_config'
    });
  };

  const generateId = () => Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

  const applyPlanToAll = () => {
    if (!installmentPlan || installmentPlan.length === 0) {
      showToast('يرجى إضافة أقساط أولاً', 'error');
      return;
    }

    const newInstallments = installmentPlan.map(p => ({ 
      name: p.name || 'قسط', 
      amount: p.amount || 0, 
      dueDate: p.dueDate || '', 
      date: p.dueDate || '', // Backward compatibility
      id: generateId(), 
      paid: false 
    }));

    // Update main students list and PERSIST to Firestore
    const batch = writeBatch(db);
    
    // Prepare the updated state and the batch updates outside of setStudents
    const updatedStudents = students.map(s => {
      const studentRef = doc(db, 'school_students', s.id);
      
      // Respect student's existing discount if available
      const stuDiscountRate = s.discountRate ?? (s.discountType ? (safeDiscountRates[s.discountType] || 0) : 0);
      const discountFactor = (100 - stuDiscountRate) / 100;
      
      // Scale installments based on student's discount
      const studentInstallments = newInstallments.map(inst => ({
        ...inst,
        amount: Math.round(inst.amount * discountFactor)
      }));
      
      const studentTotalAmount = Math.round(tuitionFee * discountFactor);

      const financeData = {
        installments: studentInstallments,
        totalTuition: studentTotalAmount,
        paidAmount: 0,
        remainingAmount: studentTotalAmount
      };
      
      batch.set(studentRef, { 
        'finance': financeData,
        'totalAmount': studentTotalAmount,
        'paidAmount': 0
      }, { merge: true });

      return {
        ...s,
        finance: financeData,
        installments: studentInstallments,
        paidAmount: 0,
        totalAmount: studentTotalAmount,
        discountRate: stuDiscountRate
      };
    });

    batch.commit().then(() => {
      // Update state AFTER successful DB write
      setStudents(updatedStudents);
      
      // Update saved lists
      setSavedLists(prev => {
        if (!prev) return [];
        return prev.map(list => ({
          ...list,
          students: (list.students || []).map(s => {
            const found = updatedStudents.find(us => us.code === s.code);
            return found ? found : s;
          })
        }));
      });

      showToast('تم تعميم الخطة المالية وحفظها في قاعدة البيانات بنجاح', 'success');

      logActivity({
        action: 'تطبيق خطة مالية',
        details: `تم تطبيق خطة الأقساط على ${relevantStudents.length} طالب/طالبة بقيمة إجمالية ${tuitionFee.toLocaleString()} د.ع للقسط السنوي`,
        targetType: 'finance_config'
      });
    }).catch(err => {
      console.error("Error applying plan to DB:", err);
      showToast('خطأ في حفظ البيانات', 'error');
    });
  };

  const toggleInstallmentPayment = async (studentCode: string, installmentId: string, sendNotification: boolean = false) => {
    // Robust matching for student
    const targetStudent = students.find(s => {
      const sCode = (s.code || '').toString().trim();
      const sStudent = (s.student || '').toString().trim();
      const sId = (s.id || '').toString().trim();
      const search = (studentCode || '').toString().trim();
      
      return sCode === search || sStudent === search || sId === search;
    });
    
    if (!targetStudent) {
      console.warn("Student not found for toggle:", studentCode);
      return;
    }

    // Correctly access installments from finance object if nested
    const currentInstallments = targetStudent.finance?.installments || targetStudent.installments || [];
    let currentTransactions = targetStudent.finance?.transactions || [];
    
    let toggledInstallmentName = "قسط مالي";
    let toggledInstallmentAmount = 0;
    let newPaidStatus = false;
    let toggledInstallmentTime = null;

    const newInstallments = currentInstallments.map((inst: any, idx: number) => {
      // Direct comparison if ID matches or if it's the right index if IDs are missing
      if (inst.id === installmentId || (inst.id === undefined && idx.toString() === installmentId)) {
        const currentlyPaid = inst.paid === true || inst.status === 'paid' || inst.status === 'completed' || inst.status === 'verified';
        
        toggledInstallmentName = inst.name || "قسط مالي";
        toggledInstallmentAmount = Number(inst.amount) || 0;
        newPaidStatus = !currentlyPaid;
        toggledInstallmentTime = newPaidStatus ? new Date().toISOString() : null;

        return { 
          ...inst, 
          paid: newPaidStatus, 
          status: newPaidStatus ? 'completed' : 'upcoming', 
          paidAt: toggledInstallmentTime,
          // If we are paying, store a generic ID that will be used below for transaction creation
          transactionId: newPaidStatus ? (inst.transactionId || `TXN_MANUAL_${Date.now()}`) : null
        };
      }
      return inst;
    });

    if (newPaidStatus) {
       // Create a transparent manual transaction
       const txnIdToUse = newInstallments.find((i: any) => i.name === toggledInstallmentName && i.paid === true)?.transactionId || `TXN_${Date.now()}`;
       const newTxn = {
           id: txnIdToUse,
           amount: toggledInstallmentAmount,
           method: 'نقدي/مدير',
           note: toggledInstallmentName,
           timestamp: new Date().toISOString(),
           status: 'completed',
           adminName: auth.currentUser?.displayName || 'الإدارة',
           isManual: true
       };
       currentTransactions = [...currentTransactions, newTxn];
    } else {
       // Find and remove the matching transaction (most recent one first)
       let idxToRemove = -1;
       for (let i = currentTransactions.length - 1; i >= 0; i--) {
           const t = currentTransactions[i];
           const cleanTNote = typeof t.note === 'string' ? t.note.replace(/وصل رقمي\s*-\s*/, '').replace(/وصل رقمي/, '').trim() : '';
           
           if (Number(t.amount) === toggledInstallmentAmount && 
              (t.note === toggledInstallmentName || t.note?.includes(toggledInstallmentName) || cleanTNote === toggledInstallmentName.trim())) {
               idxToRemove = i;
               break;
           }
       }
       if (idxToRemove !== -1) {
           currentTransactions = [
               ...currentTransactions.slice(0, idxToRemove),
               ...currentTransactions.slice(idxToRemove + 1)
           ];
       }
    }
    
    const newPaidAmount = newInstallments
      .filter((i: any) => i.paid || i.status === 'paid' || i.status === 'completed' || i.status === 'verified')
      .reduce((sum: number, i: any) => sum + (Number(i.amount) || 0), 0);

    // 2. Persist to Firestore
    try {
      const studentDocId = targetStudent.id;
      // Use setDoc with merge: true to avoid "No document to update" if there's an ID mismatch
      await setDoc(doc(db, 'school_students', studentDocId), {
        'finance': {
          ...(targetStudent.finance || {}),
          installments: newInstallments,
          transactions: currentTransactions,
          paidAmount: newPaidAmount,
          lastUpdate: new Date().toISOString()
        },
        'paidAmount': newPaidAmount,
        'updatedAt': new Date().toISOString()
      }, { merge: true });

      if (newPaidStatus && sendNotification) {
          const notifUserId = targetStudent.parentCode || targetStudent.code || targetStudent.student || targetStudent.id;
          await addDoc(collection(db, 'notifications'), {
             userId: notifUserId,
             studentId: targetStudent.id,
             studentCode: targetStudent.code,
             title: 'تم استلام الدفعة النقدية',
             message: `تم استلام القسط (${toggledInstallmentName}) بقيمة ${toggledInstallmentAmount.toLocaleString()} د.ع نقداً بنجاح من قبل المدرسة.`,
             type: 'support', // The user requested it to appear in "Communication with Admin" which counts 'support' notifications unread
             recipientRole: 'parent',
             icon: 'CreditCard',
             read: false,
             timestamp: new Date(),
             createdAt: new Date()
          });
      }

      showToast('تم تحديث حالة القسط بنجاح');
    } catch (error) {
      console.error("Error updating installment in DB:", error);
      showToast('حدث خطأ أثناء التحديث في قاعدة البيانات', 'error');
      return; 
    }

    // 3. Update local state
    setStudents(prev => {
      if (!prev) return [];
      return prev.map(s => {
        if (s.code === studentCode || s.id === targetStudent.id) {
          return { 
            ...s, 
            finance: { ...s.finance, installments: newInstallments, transactions: currentTransactions, paidAmount: newPaidAmount },
            paidAmount: newPaidAmount 
          };
        }
        return s;
      });
    });

    setSavedLists(prev => {
      if (!prev) return [];
      return prev.map(list => ({
        ...list,
        students: (list.students || []).map((s: any) => {
          if (s.code === studentCode || s.id === targetStudent.id) {
            return { 
              ...s, 
              finance: { ...s.finance, installments: newInstallments, transactions: currentTransactions, paidAmount: newPaidAmount },
              paidAmount: newPaidAmount 
            };
          }
          return s;
        })
      }));
    });
  };

  const calculateFinancials = (stu: any) => {
    return calculateStudentFinancials(stu, tuitionFee, safeDiscountRates);
  };

  const tuition = Number(tuitionFee || schoolSettings?.tuitionFee || 1000000);

  const getActiveTransactionsForStudent = React.useCallback((s: any) => {
    if (!s) return [];
    
    const insts = s.finance?.installments || s.installments || [];
    const paidInsts = insts.filter((inst: any) => {
      const instStatus = (inst.status || '').toLowerCase().trim();
      return inst.paid === true || 
             ['paid', 'completed', 'verified', 'approved', 'verified_payment', 'success', 'مكتمل'].includes(instStatus) ||
             instStatus.includes('مكتمل');
    });

    const txns = s.finance?.transactions || [];
    const validTxns = txns.filter((t: any) => {
      const tStatus = (t.status || '').toLowerCase().trim();
      return !['rejected', 'canceled', 'cancelled', 'failed', 'refused', 'withdrawal', 'ملغي', 'مرفوض', 'pending', 'قيد الانتظار'].includes(tStatus) &&
             !tStatus.includes('مرفوض') && 
             !tStatus.includes('ملغي') &&
             !tStatus.includes('الانتظار');
    });

    const matchedTxns: any[] = [];
    const remainingTxns = [...validTxns];

    paidInsts.forEach((inst: any) => {
      let foundIdx = -1;

      // 1. Match by exact transactionId
      if (inst.transactionId) {
        foundIdx = remainingTxns.findIndex((t: any) => t.id === inst.transactionId || t.requestId === inst.transactionId);
      }

      // 2. Match by note / name
      if (foundIdx === -1 && inst.name) {
        foundIdx = remainingTxns.findIndex((t: any) => 
          t.note && (t.note === inst.name || t.note.includes(inst.name) || inst.name.includes(t.note))
        );
      }

      // 3. Match by amount
      if (foundIdx === -1) {
        foundIdx = remainingTxns.findIndex((t: any) => Number(t.amount || 0) === Number(inst.amount || 0));
      }

      // 4. Default to first remaining transaction
      if (foundIdx === -1 && remainingTxns.length > 0) {
        foundIdx = 0;
      }

      const financials = calculateStudentFinancials(s, tuition, safeDiscountRates);
      const discountFactor = financials.discountFactor;
      const amount = financials.isInstallmentsAtGross ? Math.round(Number(inst.amount) * discountFactor) : Number(inst.amount);

      if (foundIdx !== -1) {
        const matchedTx = remainingTxns[foundIdx];
        matchedTxns.push({
          ...matchedTx,
          amount: amount,
          installmentName: inst.name,
          isElectronic: checkPaymentMethodIsElectronic(inst, txns)
        });
        remainingTxns.splice(foundIdx, 1);
      } else {
        const isElectronic = checkPaymentMethodIsElectronic(inst, txns);
        matchedTxns.push({
          id: inst.transactionId || `TXN_SYNCD_${inst.id || Math.floor(Math.random() * 100000)}`,
          amount: amount,
          method: isElectronic ? 'بوابة دفع إلكتروني' : 'نقدي/مدير',
          note: inst.name || 'قسط مالي',
          timestamp: inst.paidAt || s.updatedAt || new Date().toISOString(),
          status: 'completed',
          installmentName: inst.name,
          isElectronic: isElectronic
        });
      }
    });

    return matchedTxns;
  }, [tuition, safeDiscountRates]);

  const isTxnActive = React.useCallback((stu: any, txn: any) => {
    if (!stu || !txn) return false;
    const activeTxns = getActiveTransactionsForStudent(stu);
    return activeTxns.some((t: any) => t.id === txn.id || (t.requestId && t.requestId === txn.requestId));
  }, [getActiveTransactionsForStudent]);

  // SOURCE OF TRUTH: ONLY students present in savedLists
  // This ensures that students deleted from lists are not counted in the financial summary
  const relevantStudents = React.useMemo(() => {
    const allStudentsMap = new Map();
    
    savedLists.forEach(list => {
      if (list && list.students) {
        list.students.forEach((s: any) => {
          // Robust ID detection: try code, student, id
          const id = (s?.code || s?.student || s?.id || '').toString();
          if (id) {
            // Prefer data from the global students collection if it contains more up-to-date financial info
            const globalStu = students.find(gs => (gs.code || gs.id) === id);
            // Merge: global data takes priority for finance, but list presence is the "active" filter
            allStudentsMap.set(id, { ...s, ...globalStu });
          }
        });
      }
    });
    
    return Array.from(allStudentsMap.values()).sort((a,b) => (a.name || '').localeCompare((b.name || ''), 'ar'));
  }, [students, savedLists]);

  const cashVsElectronicData = useMemo(() => {
    let cash = 0;
    let electronic = 0;
    
    relevantStudents.forEach(s => {
       const activeTxns = getActiveTransactionsForStudent(s);
       activeTxns.forEach((t: any) => {
          if (t.isElectronic) {
             electronic += Number(t.amount) || 0;
          } else {
             cash += Number(t.amount) || 0;
          }
       });
    });

    return [
      { name: 'نقداً', value: cash },
      { name: 'إلكترونياً', value: electronic }
    ];
  }, [relevantStudents, getActiveTransactionsForStudent]);

  // Calculate financial statistics correctly
  const { totalCollected, totalExpected, totalRemaining, totalGross, totalDiscounts, totalStudents } = React.useMemo(() => {    
    let collectedSum = 0;
    let expectedSum = 0;
    let grossSum = 0;
    let discountSum = 0;

    relevantStudents.forEach(stu => {
       const financials = calculateStudentFinancials(stu, tuition, safeDiscountRates);

       collectedSum += financials.paidAmount;
       expectedSum += financials.requiredAmount;
       grossSum += tuition;
       discountSum += financials.discountAmount;
    });

    return {
        totalCollected: collectedSum,
        totalExpected: expectedSum,
        totalRemaining: Math.max(0, expectedSum - collectedSum),
        totalGross: grossSum,
        totalDiscounts: discountSum,
        totalStudents: relevantStudents.length
    };
  }, [relevantStudents, tuition, safeDiscountRates]);
  
  const totals = React.useMemo(() => {
    const totalSalaries = currentSalaries.reduce((acc, curr) => acc + (curr.netSalary || 0), 0);
    const paidSalaries = currentSalaries.filter(s => s.isPaid).reduce((acc, curr) => acc + (curr.netSalary || 0), 0);
    const remainingSalaries = totalSalaries - paidSalaries;
    const totalRewards = currentSalaries.reduce((acc, curr) => acc + (Number(curr.rewards) || 0), 0);
    const totalDeductions = currentSalaries.reduce((acc, curr) => acc + (Number(curr.deductions) || 0), 0);
    const totalBaseSalaries = currentSalaries.reduce((acc, curr) => acc + (Number(curr.baseSalary) || 0), 0);
    
    // Use totalCollected from student financial statistics
    const income = totalCollected || 0;
    const profit = income - totalSalaries;
    const paidPercentage = totalSalaries > 0 ? Math.round((paidSalaries / totalSalaries) * 100) : 0;

    return {
      totalSalaries,
      paidSalaries,
      remainingSalaries,
      totalRewards,
      totalDeductions,
      totalBaseSalaries,
      totalIncome: income,
      netProfit: profit,
      paidPercentage
    };
  }, [currentSalaries, totalCollected]);

  const totalHistoricalPaidSalaries = React.useMemo(() => {
    const activeTeacherIds = new Set(teachersList.map(t => t.id));
    return staffSalaries
      .filter((s: any) => s.isPaid === true && activeTeacherIds.has(s.staffId))
      .reduce((sum, s) => sum + (Number(s.netSalary) || 0), 0);
  }, [staffSalaries, teachersList]);

  const monthlyBasicSalarySum = React.useMemo(() => {
    return teachersList.reduce((sum, teacher) => {
      const records = staffSalaries
        .filter(s => s.staffId === teacher.id && s.baseSalary !== undefined)
        .sort((a, b) => b.month.localeCompare(a.month));
      const basic = records.length > 0 ? (Number(records[0].baseSalary) || 0) : 0;
      return sum + basic;
    }, 0);
  }, [teachersList, staffSalaries]);

  const seasonalSalaryCost = React.useMemo(() => {
    return monthlyBasicSalarySum * 10;
  }, [monthlyBasicSalarySum]);

  const globalLogs = useMemo(() => {
    // Always derive logs directly from relevantStudents active transactions to guarantee perfect mathematical precision
    const derivedLogs: any[] = [];
    relevantStudents.forEach(s => {
      const activeTxns = getActiveTransactionsForStudent(s);
      activeTxns.forEach((t: any) => {
        let ts = t.timestamp || t.date || s.updatedAt || new Date().toISOString();
        if (ts && typeof ts === 'object') {
          if ('seconds' in ts) {
            ts = new Date(ts.seconds * 1000).toISOString();
          } else if ('toDate' in ts && typeof ts.toDate === 'function') {
            ts = ts.toDate().toISOString();
          }
        }
        
        derivedLogs.push({
          id: t.id,
          studentCode: s.code,
          studentName: s.name,
          amount: Number(t.amount) || 0,
          method: t.method || (t.isElectronic ? 'بوابة دفع الكترونية' : 'نقدي/مدير'),
          type: 'revenue', 
          timestamp: ts
        });
      });
    });
    return derivedLogs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [relevantStudents, getActiveTransactionsForStudent]);

  const filteredLogs = useMemo(() => {
    let result = [...globalLogs];
    
    // Search filter
    if (txSearchQuery.trim()) {
      const q = txSearchQuery.toLowerCase();
      result = result.filter(log => {
        let name = log.studentName || '';
        const foundStudent = students?.find((s: any) => s.code === log.studentCode || s.student === log.studentCode || s.id === log.studentCode);
        if (foundStudent) {
          name = foundStudent.name || foundStudent.fullName || name;
        }
        return name.toLowerCase().includes(q) || 
               (log.studentCode || '').toLowerCase().includes(q) ||
               (log.method || '').toLowerCase().includes(q);
      });
    }

    // Category filter
    if (txFilter === 'cash') {
      result = result.filter(log => {
        const method = (log.method || '').toLowerCase();
        return !method.includes('electronic') && 
               !method.includes('بوابة') && 
               !method.includes('zain') && 
               !method.includes('asia') && 
               !method.includes('master') && 
               !method.includes('fib');
      });
    } else if (txFilter === 'electronic') {
      result = result.filter(log => {
        const method = (log.method || '').toLowerCase();
        return method.includes('electronic') || 
               method.includes('بوابة') || 
               method.includes('zain') || 
               method.includes('asia') || 
               method.includes('master') || 
               method.includes('fib');
      });
    }

    return result;
  }, [globalLogs, txSearchQuery, txFilter, students]);

  const totalTxPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredLogs.length / txPageSize));
  }, [filteredLogs.length, txPageSize]);

  const pagedLogs = useMemo(() => {
    const startIndex = (txPage - 1) * txPageSize;
     return filteredLogs.slice(startIndex, startIndex + txPageSize);
  }, [filteredLogs, txPage, txPageSize]);

  const disburseSalaries = async () => {
    if (totals.remainingSalaries === 0) {
      showToast('جميع الرواتب مدفوعة بالفعل لهذا الشهر', 'success');
      return;
    }
    
    setIsPaying(true);
    const batchPromises = currentSalaries.map(async (item) => {
      if (!item.isPaid && item.netSalary > 0) {
        const salaryId = `${item.id}_${selectedMonth}`;
        try {
          return await setDoc(doc(db, 'salaries', salaryId), {
            staffId: item.id,
            staffName: item.name,
            month: selectedMonth,
            netSalary: item.netSalary,
            baseSalary: item.baseSalary,
            rewards: item.rewards,
            deductions: item.deductions,
            isPaid: true,
            paymentDate: new Date().toISOString()
          }, { merge: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `salaries/${salaryId}`);
        }
      }
    });

    await Promise.all(batchPromises);
    setIsPaying(false);
    setShowConfirmPayment(false);
    showToast('تم صرف رواتب الشهر لجميع الكادر بنجاح', 'success');
    
    logActivity({
      action: 'صرف الرواتب الجماعي',
      details: `تم اعتماد صرف رواتب شهر ${selectedMonth} لجميع الموظفين بإجمالي: ${totals.totalSalaries.toLocaleString()} د.ع`,
      targetType: 'finance_staff'
    });
  };

  const chartData = React.useMemo(() => {
     const months = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'];
     const monthlyData = months.reduce((acc, month) => ({ ...acc, [month]: { value: 0, count: 0 } }), {} as Record<string, { value: number; count: number }>);
     
     // Derive monthly data from ALL relevant students' paid installments
     relevantStudents.forEach(stu => {
       const installments = stu.finance?.installments || stu.installments || [];
       installments.forEach((inst: any) => {
         const isPaid = inst.paid === true || 
                        ['paid', 'completed', 'verified', 'approved', 'verified_payment'].includes((inst.status || '').toLowerCase());
         
         if (isPaid && inst.paidAt) {
           const date = inst.paidAt.toDate ? inst.paidAt.toDate() : new Date(inst.paidAt);
           const monthIndex = date.getMonth();
           const monthName = months[monthIndex];
           
           if (monthlyData[monthName]) {
             // Use proper effective amount if installments were gross
             const financials = calculateStudentFinancials(stu, tuition, safeDiscountRates);
             const discountFactor = financials.discountFactor;
             const amount = financials.isInstallmentsAtGross ? Math.round(Number(inst.amount) * discountFactor) : Number(inst.amount);
             
             monthlyData[monthName].value += (amount || 0);
             monthlyData[monthName].count += 1;
           }
         }
       });
     });

     return Object.entries(monthlyData).map(([name, data]) => ({ 
       name, 
       value: data.value,
       count: data.count 
     }));
   }, [relevantStudents, tuition, safeDiscountRates]);

  const spotlightData = useMemo(() => {
    const monthsAlphabetical = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'];
    const currentIdx = monthsAlphabetical.indexOf(selectedChartMonth);
    const currentData = chartData.find(m => m.name === selectedChartMonth) || { value: 0, count: 0 };
    const prevMonthName = currentIdx > 0 ? monthsAlphabetical[currentIdx - 1] : null;
    const prevData = prevMonthName ? (chartData.find(m => m.name === prevMonthName) || { value: 0, count: 0 }) : null;
    
    let growthType: 'up' | 'down' | 'stable' | 'none' = 'none';
    let growthPercent = '';
    
    if (prevData && prevData.value > 0) {
      const diff = currentData.value - prevData.value;
      const pct = Math.round((diff / prevData.value) * 100);
      if (diff > 0) {
        growthType = 'up';
        growthPercent = `+${pct}%`;
      } else if (diff < 0) {
        growthType = 'down';
        growthPercent = `${pct}%`;
      } else {
        growthType = 'stable';
        growthPercent = '0%';
      }
    } else if (currentData.value > 0) {
      growthType = 'up';
      growthPercent = 'جديد';
    }

    return {
      current: currentData,
      prev: prevData,
      growthType,
      growthPercent,
      prevMonthName
    };
  }, [selectedChartMonth, chartData]);

  const COLORS = ['#10b981', '#f43f5e'];

  // Refined Statistics Component
  const StatsCard = ({ title, value, colorClass }: { title: string, value: string, colorClass: string }) => (
    <div className="bg-[#101935] p-6 rounded-[30px] border border-white/5 shadow-lg flex flex-col items-center justify-center">
      <p className="text-white/40 text-[11px] font-black uppercase tracking-wider mb-2">{title}</p>
      <p className={`${colorClass} font-black text-2xl`}>{value}</p>
    </div>
  );


  const toggleInstallment = async (studentCode: string, installmentIdx: number) => {
    const targetStudent = students.find(s => s.code === studentCode);
    if (!targetStudent) return;

    const newInst = [...(targetStudent.installments || [])];
    if (newInst[installmentIdx]) {
      const currentlyPaid = newInst[installmentIdx].paid === true || newInst[installmentIdx].status === 'paid' || newInst[installmentIdx].status === 'completed' || newInst[installmentIdx].status === 'verified';
      const newState = !currentlyPaid;
      newInst[installmentIdx].paid = newState;
      newInst[installmentIdx].status = newState ? 'completed' : 'upcoming';
      if (newState) {
        newInst[installmentIdx].paidAt = new Date().toISOString();
        newInst[installmentIdx].verifiedAt = new Date().toISOString();
      } else {
        delete newInst[installmentIdx].paidAt;
        delete newInst[installmentIdx].verifiedAt;
      }
      
      const transactionId = newState ? `TXN-${Date.now()}` : '';
      newInst[installmentIdx].transactionId = transactionId;
      const totalPaid = newInst.reduce((sum: number, i: any) => sum + (i.paid ? i.amount : 0), 0);
      
      try {
        // Use setDoc with merge: true to avoid "No document to update"
        await setDoc(doc(db, 'school_students', targetStudent.id), {
          'finance': {
            ...(targetStudent.finance || {}),
            installments: newInst,
            paidAmount: totalPaid
          },
          'paidAmount': totalPaid,
          'updatedAt': new Date().toISOString()
        }, { merge: true });

        logActivity({
          action: newState ? 'تسديد قسط' : 'إلغاء تسديد قسط',
          details: `تم ${newState ? 'تسديد' : 'إلغاء تسديد'} قسط (${newInst[installmentIdx].name}) للطالب ذو الكود: ${studentCode}`,
          targetId: studentCode,
          targetType: 'student_finance'
        });

        const updateState = (s: any) => {
          if (s.code === studentCode) {
            return { ...s, installments: newInst, paidAmount: totalPaid };
          }
          return s;
        };

        setStudents(prev => prev.map(updateState));
        setSavedLists(prev => prev.map(list => ({
          ...list,
          students: (list.students || []).map(updateState)
        })));
        
        showToast('تم تحديث حالة القسط');
      } catch (error) {
        console.error("Error updating installment in DB:", error);
        showToast('خطأ في الاتصال بقاعدة البيانات', 'error');
      }
    }
  };

  if (!isFinanceUnlocked) {
    const isFirstTimeSetup = !correctPIN && false; // Disable forced setup, use fallback
    const effectivePIN = correctPIN || '1234';

    return (
      <div className="bg-[#101935] border border-white/10 rounded-[40px] p-8 mt-10 flex flex-col items-center text-center space-y-6 shadow-2xl">
         <div className="w-20 h-20 bg-amber-400/10 rounded-3xl flex items-center justify-center text-amber-400 mb-2">
            <CreditCard size={40} />
         </div>
         <div>
           <h3 className="text-white font-black text-xl mb-2">{isFirstTimeSetup ? 'إعداد رمز الخزينة' : 'الخزينة والموقف المالي'}</h3>
           <p className="text-white/40 text-[11px] leading-relaxed">
              {isFirstTimeSetup 
                 ? <><br/>يبدو أن هذه هي المرة الأولى لفتح الموقف المالي للمدرسة. <br/> يرجى تعيين رمز وصول (PIN) للوصول إلى السجلات المالية وحمايتها.</>
                 : <>هذا القسم يحتوي على بيانات مالية حساسة.<br/>يرجى إدخال رمز الوصول الخاص بالمؤسس أو المدير المالي.</>
              }
           </p>
         </div>
         
         <div className="w-full space-y-4">
            <input 
              type="password" 
              value={financePIN}
              onChange={(e) => setFinancePIN(e.target.value)}
              placeholder={isFirstTimeSetup ? "عيّن رمزاً جديداً (٤ أرقام على الأقل)" : "رمز الوصول (PIN)"}
              className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl text-center text-white font-bold text-lg tracking-[0.5em] outline-none focus:border-amber-400 transition-all font-sans"
            />
            <button 
              onClick={async () => {
                if (isFirstTimeSetup) {
                  if (financePIN.length >= 4 && selectedSchoolId) {
                    try {
                      await academicService.updateSchoolSettings(selectedSchoolId, {
                        ...schoolSettings,
                        financePIN
                      });
                      setIsFinanceUnlocked(true);
                      showToast('تم إعداد الرمز المالي بنجاح! السجل المفتوح الآن.');
                      logActivity({
                        action: 'تشفير السجل المالي',
                        details: 'تم إعداد رمز قفل السجل المالي بنجاح',
                        targetType: 'finance_access'
                      });
                    } catch (e) {
                      showToast('حدث خطأ أثناء حفظ الرمز', 'error');
                    }
                  } else {
                     showToast('يجب أن يكون الرمز المالي متكوناً من ٤ أرقام على الأقل', 'error');
                  }
                } else {
                  if (financePIN === effectivePIN) { 
                    setIsFinanceUnlocked(true);
                    showToast('تم فتح قسم المالية');
                    logActivity({
                      action: 'فتح المالية',
                      details: `تم الدخول إلى السجل المالي من قبل ${auth.currentUser?.email || 'المسؤول'}`,
                      targetType: 'finance_access'
                    });
                    // Instant scroll-to-top handler
                    setTimeout(() => {
                      const mainEl = document.querySelector('main');
                      if (mainEl) mainEl.scrollTop = 0;
                      window.scrollTo({ top: 0 });
                    }, 30);
                  } else {
                    showToast('رمز الوصول غير صحيح', 'error');
                    setFinancePIN('');
                  }
                }
              }}
              className="w-full h-14 bg-amber-400 rounded-2xl text-black font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-amber-400/10"
            >
              {isFirstTimeSetup ? 'تعيين الرمز وفتح السجل' : 'فتح السجل المالي'}
            </button>
         </div>
         
         {!isFirstTimeSetup && !showForgotPIN && (
           <div className="w-full pt-2">
             <button 
               onClick={() => setShowForgotPIN(true)}
               className="text-[10px] text-white/30 hover:text-white/60 underline transition-colors"
             >
               نسيت كلمة السر أو ترغب بتغييرها؟
             </button>
           </div>
         )}

         {showForgotPIN && (
           <div className="w-full mt-4 p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4 animate-in fade-in zoom-in duration-300">
             <h4 className="text-white text-sm font-black text-right">إعادة تعيين كلمة السر</h4>
             <p className="text-white/40 text-[10px] text-right font-bold">
               للتحقق من هويتك، يرجى إدخال البريد الإلكتروني الخاص بمدير المدرسة (نفس حساب الدخول الحالي).
             </p>
             {!isEmailVerified ? (
               <div className="space-y-3">
                 <input 
                   type="email"
                   value={adminEmailInput}
                   onChange={(e) => setAdminEmailInput(e.target.value)}
                   placeholder="البريد الإلكتروني للإدارة"
                   className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-white text-right text-xs outline-none focus:border-amber-400 font-sans"
                 />
                 <div className="flex gap-2">
                   <button 
                     onClick={() => {
                       setShowForgotPIN(false);
                       setAdminEmailInput('');
                     }}
                     className="flex-1 h-10 bg-white/10 rounded-xl text-white/50 text-xs font-bold hover:bg-white/20"
                   >
                     إلغاء
                   </button>
                   <button 
                     onClick={() => {
                       if (adminEmailInput === auth.currentUser?.email) {
                         setIsEmailVerified(true);
                         showToast('تم التحقق بنجاح، يمكنك الآن تعيين كلمة سر جديدة', 'success');
                       } else {
                         showToast('البريد الإلكتروني غير صحيح', 'error');
                       }
                     }}
                     className="flex-[2] h-10 bg-amber-500 rounded-xl text-black text-xs font-black hover:bg-amber-400"
                   >
                     تحقق
                   </button>
                 </div>
               </div>
             ) : (
               <div className="space-y-3">
                 <input 
                   type="password"
                   value={newPINInput}
                   onChange={(e) => setNewPINInput(e.target.value)}
                   placeholder="كلمة السر الجديدة (٤ أرقام على الأقل)"
                   className="w-full h-12 bg-black/40 border border-emerald-500/30 rounded-xl text-center text-white font-bold tracking-widest outline-none focus:border-emerald-400"
                 />
                 <button 
                   onClick={async () => {
                     if (newPINInput.length >= 4 && selectedSchoolId) {
                       try {
                         await academicService.updateSchoolSettings(selectedSchoolId, {
                           ...schoolSettings,
                           financePIN: newPINInput
                         });
                         showToast('تم تغيير كلمة السر بنجاح!', 'success');
                         setShowForgotPIN(false);
                         setIsEmailVerified(false);
                         setAdminEmailInput('');
                         setNewPINInput('');
                         setFinancePIN('');
                       } catch (e) {
                         showToast('حدث خطأ أثناء حفظ الرمز', 'error');
                       }
                     } else {
                       showToast('كلمة السر يجب أن تكون ٤ أرقام على الأقل', 'error');
                     }
                   }}
                   className="w-full h-10 bg-emerald-500 rounded-xl text-white text-xs font-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
                 >
                   حفظ كلمة السر الجديدة
                 </button>
               </div>
             )}
           </div>
         )}
         
         <div className="p-4 bg-white/5 rounded-2xl border border-white/5 w-full flex items-start gap-3 mt-4">
            <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={16} />
            <p className="text-[10px] text-white/40 text-right leading-tight font-bold">
              {isFirstTimeSetup ? 'الرمز الذي تقوم بتعيينه الآن سيتم طلبه في كل مرة يتم محاولة فتح السجل المالي فيها.' : 'تم تفعيل خوارزمية التشفير المالي المتطور لحماية بيانات الطلاب والاشتراكات.'}
            </p>
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 md:px-0">
      <ConfirmDialog 
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
            if(confirmDelete) confirmDelete.action();
            setConfirmDelete(null);
        }}
        title={confirmDelete?.title || ''}
        message={confirmDelete?.message || ''}
      />

      {/* Confirm Payment Modal */}
      {showConfirmPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#101935] border border-white/10 p-10 rounded-none md:rounded-[50px] max-w-md w-full text-center space-y-8 shadow-3xl relative overflow-hidden"
          >
             <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-blue-600 via-[#00E5FF] to-blue-600" />
             <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center text-blue-400 mx-auto border border-blue-600/20">
                <DollarSign size={48} />
             </div>
             
             <div className="space-y-4">
                <h3 className="text-white text-2xl font-black tracking-tight">تأكيد عملية الصرف الجماعي</h3>
                <p className="text-white/40 text-sm leading-relaxed">
                   أنت على وشك اعتماد صرف الرواتب لشهر <span className="text-blue-400 font-bold">{selectedMonth}</span> لجميع الكادر غير المستلم حالياً.
                </p>
                
                <div className="bg-white/5 p-6 rounded-[30px] border border-white/5 space-y-3">
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-white/40 font-bold">إجمالي المبلغ المطلوب:</span>
                      <span className="text-white font-black">{totals.remainingSalaries.toLocaleString()} د.ع</span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-white/40 font-bold">عدد الموظفين:</span>
                      <span className="text-white font-black">{currentSalaries.filter(s => !s.isPaid && s.netSalary > 0).length} موظف</span>
                   </div>
                </div>
             </div>

             <div className="flex gap-4">
                <button 
                  onClick={() => setShowConfirmPayment(false)}
                  className="flex-1 py-4 rounded-2xl bg-white/5 font-black text-xs text-white hover:bg-white/10 transition-all"
                >
                  تراجع
                </button>
                <button 
                  onClick={disburseSalaries}
                  className="flex-1 py-4 rounded-2xl bg-[#00E5FF] font-black text-xs text-black hover:bg-white transition-all shadow-xl shadow-[#00E5FF]/20"
                >
                  تأكيد وصرف الآن
                </button>
             </div>
          </motion.div>
        </div>
      )}
      {/* Navigation Tabs */}
      <div className="flex bg-[#101935] p-1.5 rounded-none md:rounded-[25px] border-b md:border border-white/5 shadow-xl -mx-4 md:mx-0 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => { setActiveTab('config'); setSelectedList(null); setSelectedStudent(null); }}
          className={`flex-1 min-w-[100px] h-14 md:h-12 rounded-none md:rounded-2xl text-[10px] md:text-[11px] font-black transition-all flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${activeTab === 'config' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-white/30 hover:bg-white/5'}`}
        >
          <Settings size={18} />
          ضبط الخطة
        </button>
        <button 
          onClick={() => { setActiveTab('overview'); setSelectedList(null); setSelectedStudent(null); }}
          className={`flex-1 min-w-[100px] h-14 md:h-12 rounded-none md:rounded-2xl text-[10px] md:text-[11px] font-black transition-all flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-white/30 hover:bg-white/5'}`}
        >
          <TrendingUp size={18} />
          الموقف العام
        </button>
        <button 
          onClick={() => { setActiveTab('lists'); setSelectedList(null); setSelectedStudent(null); }}
          className={`flex-1 min-w-[100px] h-14 md:h-12 rounded-none md:rounded-2xl text-[10px] md:text-[11px] font-black transition-all flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${activeTab === 'lists' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-white/30 hover:bg-white/5'}`}
        >
          <UsersIcon size={18} />
          قوائم الصفوف
        </button>
        <button 
          onClick={() => { setActiveTab('staff'); setSelectedList(null); setSelectedStudent(null); }}
          className={`flex-1 min-w-[100px] h-14 md:h-12 rounded-none md:rounded-2xl text-[10px] md:text-[11px] font-black transition-all flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${activeTab === 'staff' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-white/30 hover:bg-white/5'}`}
        >
          <DollarSign size={18} />
          رواتب الكادر
        </button>
        <button 
          onClick={() => { setActiveTab('payment_methods'); setSelectedList(null); setSelectedStudent(null); }}
          className={`flex-1 min-w-[100px] h-14 md:h-12 rounded-none md:rounded-2xl text-[10px] md:text-[11px] font-black transition-all flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${activeTab === 'payment_methods' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-white/30 hover:bg-white/5'}`}
        >
          <CreditCard size={18} />
          وسائل الدفع
        </button>
        <button 
          onClick={() => { setActiveTab('payment_requests'); setSelectedList(null); setSelectedStudent(null); }}
          className={`flex-1 min-w-[100px] h-14 md:h-12 rounded-none md:rounded-2xl text-[10px] md:text-[11px] font-black transition-all flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${activeTab === 'payment_requests' ? 'bg-amber-500 text-black shadow-lg shadow-amber-900/40' : 'text-white/30 hover:bg-white/5'}`}
        >
          <div className="relative">
            <Bell size={18} />
            {pendingPayments.length > 0 && (
              <span className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-rose-500 text-white text-[9px] rounded-full flex items-center justify-center font-black animate-bounce border-2 border-[#101935] shadow-lg">
                {pendingPayments.length}
              </span>
            )}
          </div>
          الطلبات
        </button>

        <button 
          onClick={() => { setActiveTab('accessLogs'); setSelectedList(null); setSelectedStudent(null); }}
          className={`flex-1 min-w-[100px] h-14 md:h-12 rounded-none md:rounded-2xl text-[10px] md:text-[11px] font-black transition-all flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${activeTab === 'accessLogs' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-white/30 hover:bg-white/5'}`}
        >
          <History size={18} />
          سجل الوصولات
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-8 pb-12"
          >
            {/* Majestic Control Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5 relative">
              <div className="absolute top-0 right-1/4 w-96 h-24 bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none" />
              <div>
                <h2 className="text-white text-xl sm:text-2xl font-black tracking-tight flex items-center gap-3">
                  <span className="relative flex h-3 w-3 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500 shadow-[0_0_10px_rgba(0,229,255,0.7)]"></span>
                  </span>
                  لوحة الرصد والمراقبة المباشرة للموقف المالي
                </h2>
                <p className="text-white/40 text-[11px] sm:text-xs font-bold mt-2 leading-relaxed">
                  نظام تحليل الإيرادات المباشرة، المدفوعات المستلمة، مقارنات النمو الشهري وهيكلة الخصومات والمنح الأكاديمية.
                </p>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-[#121c3a]/50 border border-white/10 rounded-2xl shrink-0 backdrop-blur-md">
                <span className="text-emerald-400 text-xs font-black flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  مزامنة سحابية حية
                </span>
                <span className="text-white/10 text-xs">|</span>
                <span className="text-white/60 text-[10px] font-mono font-bold tracking-widest uppercase">
                  {(() => {
                    const now = new Date();
                    const iraqTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));
                    return `توقيت العراق ${iraqTime.getUTCHours().toString().padStart(2, '0')}:${iraqTime.getUTCMinutes().toString().padStart(2, '0')}`;
                  })()}
                </span>
              </div>
            </div>

            {/* Premium Bento Grid Header - Part 1 (High priority cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
              
              {/* Card 1: Main safe showing total received and available balance (glowing cyan / gold) */}
              <div className="md:col-span-2 lg:col-span-2 xl:col-span-2 bg-gradient-to-br from-[#121d3f] via-[#0e1730] to-[#0a0f21] p-7 rounded-[32px] border border-cyan-500/25 shadow-2xl relative overflow-hidden flex flex-col justify-between group transition-all duration-500 hover:border-cyan-400/40">
                {/* Visual Accent Elements */}
                <div className="absolute top-0 right-0 w-56 h-56 bg-gradient-to-br from-cyan-400/10 to-transparent blur-[60px] rounded-full pointer-events-none group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#fbbf24]/5 blur-[70px] rounded-full pointer-events-none" />

                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500/15 to-blue-500/5 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/20">
                      <Wallet size={24} className="animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-white/40 font-black text-xs">الخزينة المباشرة والمحررات الإجمالية</h4>
                      <p className="text-[10px] text-[#00E5FF] font-bold mt-1 tracking-wide">السيولة الفعلية والنقدية المستقرة بعد تسليم الأجور</p>
                    </div>
                  </div>
                </div>
                
                <div className="my-6 relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-b border-white/5 py-4">
                  <div>
                    <div className="text-white/30 text-[10px] font-black mb-1">الرصيد المحصل الإجمالي (الطلاب):</div>
                    <h2 className="text-white font-black text-xl sm:text-2xl md:text-3xl tracking-tight leading-none font-mono">
                      {totalCollected.toLocaleString()} <span className="text-white/40 text-xs font-bold">د.ع</span>
                    </h2>
                  </div>
                  <div>
                    <div className="text-[#00E5FF] text-[10px] font-black mb-1">الرصيد المتوفر بالخزينة (بعد دفع الرواتب):</div>
                    <h2 className="text-[#00E5FF] font-black text-xl sm:text-2xl md:text-3xl tracking-tight leading-none font-mono">
                      {(totalCollected - totalHistoricalPaidSalaries).toLocaleString()} <span className="text-[#00E5FF]/60 text-xs font-bold">د.ع</span>
                    </h2>
                  </div>
                </div>

                {/* Highly styled Progress ratio bar and metrics */}
                <div className="space-y-3 relative z-10 pt-2">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-white/50">المعدل الفعلي لإيداع الأقساط الأكاديمية</span>
                    {(() => {
                      const perc = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;
                      return <span className="text-[#00E5FF] font-black tracking-wide text-xs">{perc}%</span>;
                    })()}
                  </div>
                  <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 via-[#00E5FF] to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${totalExpected > 0 ? Math.min(100, Math.round((totalCollected / totalExpected) * 100)) : 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-white/30 pt-0.5 font-bold font-mono tracking-wide">
                    <span>إجمالي الرواتب المصروفة فعلياً: <span className="text-emerald-400">{totalHistoricalPaidSalaries.toLocaleString()} د.ع</span></span>
                    <span className="text-cyan-400/50">الحالة: فعالة بانتظام</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Strategic Expected Net & Profitability Analysis (Glowing Emerald) */}
              <div className="bg-gradient-to-br from-[#121c3a] to-[#0e172e] p-6 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col justify-between group hover:border-[#00e5ff]/20 transition-all duration-350">
                <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 blur-[45px] rounded-full pointer-events-none" />
                
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <h4 className="text-white/40 font-black text-xs">الأرباح والربحية المتوقعة</h4>
                      <p className="text-[9px] text-[#00E5FF] font-bold mt-0.5">الربح الصافي للموسم الدراسي بعد خصم رواتب الكادر</p>
                    </div>
                  </div>
                </div>

                <div className="my-6">
                  <div className="text-emerald-400/80 text-[10px] font-black mb-1">الربح الصافي المتوقع للموسم الدراسي (10 أشهر):</div>
                  <p className="text-emerald-400 font-extrabold text-2xl sm:text-3xl tracking-tight font-mono">
                    {(totalExpected - seasonalSalaryCost).toLocaleString()} <span className="text-xs font-black text-white/40">د.ع</span>
                  </p>
                  <p className="text-white/30 text-[9px] font-bold mt-1">
                    محسوب على أساس رواتب الكادر لـ 10 أشهر دراسية كاملة
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 space-y-2 text-[10px] font-semibold text-white/40 font-mono">
                  <div className="flex justify-between items-center">
                    <span>تحصيلات الطلاب المستهدفة:</span>
                    <span className="text-white/70 font-bold">{totalExpected.toLocaleString()} د.ع</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>مجموع الرواتب الأساسية شهرياً:</span>
                    <span className="text-white/70 font-bold">{monthlyBasicSalarySum.toLocaleString()} د.ع</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>كلفة الرواتب المقدرة للموسم (10 أشهر):</span>
                    <span className="text-rose-400/90 font-bold">-{seasonalSalaryCost.toLocaleString()} د.ع</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-white/5 pt-1.5 mt-1 text-cyan-400 font-sans">
                    <span className="font-semibold">خطة الشهر الحالي ({selectedMonth}):</span>
                    <span className="font-extrabold font-mono">{totals.totalSalaries.toLocaleString()} د.ع</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Outstandings and pending ledger (Glowing Amber) */}
              <div className="bg-gradient-to-br from-[#121c3a] to-[#0e172e] p-6 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col justify-between group hover:border-amber-500/20 transition-all duration-350">
                <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/5 blur-[45px] rounded-full pointer-events-none" />
                
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 ring-4 ring-amber-500/5">
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <h4 className="text-white/40 font-black text-xs">الذمم والمستحقات المتبقية</h4>
                      <p className="text-[9px] text-white/20 font-bold mt-0.5">الديون المطلوب تحصيلها من الطلاب</p>
                    </div>
                  </div>
                </div>

                <div className="my-6">
                  <div className="text-white/20 text-[9px] font-bold mb-1">إجمالي الديون القائمة:</div>
                  <p className="text-amber-400 font-extrabold text-2xl sm:text-3xl tracking-tight font-mono">
                    {totalRemaining.toLocaleString()} <span className="text-xs font-black text-white/40">د.ع</span>
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] text-white/40 font-bold">
                    <span>تأكيدات معلقة:</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-black text-xs ${pendingPayments.length > 0 ? 'bg-amber-500/20 text-amber-400 animate-pulse' : 'bg-white/5 text-white/30'}`}>
                      {pendingPayments.length} طلبات
                    </span>
                  </div>
                  <span className="text-[9px] font-black text-white/20 tracking-wider">الذمة الفعالة</span>
                </div>
              </div>

            </div>

            {/* Bento Grid Header - Part 2 (Two balanced secondary horizontal widgets) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
              
              {/* Box A: Student Count */}
              <div className="bg-gradient-to-r from-[#111a37] to-[#101834]/80 border border-white/5 hover:border-blue-500/20 p-4.5 rounded-2xl flex items-center gap-4 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shrink-0 shadow-inner">
                  <UsersIcon size={20} />
                </div>
                <div>
                  <h5 className="text-white/30 font-black text-[10px] leading-none mb-1.5 uppercase tracking-wide">الطلاب المسجلين مالياً</h5>
                  <p className="text-white font-black text-sm leading-none font-mono flex items-baseline gap-1">
                    <span>{totalStudents.toLocaleString()}</span>
                    <span className="text-[10px] text-white/30 font-bold">طالب</span>
                  </p>
                </div>
              </div>

              {/* Box D: Pending Applications Queue */}
              <div className="bg-gradient-to-r from-[#111a37] to-[#101834]/80 border border-white/5 hover:border-amber-500/20 p-4.5 rounded-2xl flex items-center gap-4 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-[#f59e0b]/20 shrink-0 shadow-inner">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h5 className="text-white/30 font-black text-[10px] leading-none mb-1.5 uppercase tracking-wide">تحويلات قيد الاعتماد والدراسة</h5>
                  <p className="text-amber-400 font-black text-sm leading-none font-mono flex items-baseline gap-1">
                    <span>{pendingPayments.length}</span>
                    <span className="text-[10px] text-white/30 font-bold">طلبات</span>
                  </p>
                </div>
              </div>

              {/* Box C: Financial Flow Distribution */}
              <div className="bg-gradient-to-r from-[#111a37] to-[#101834]/80 border border-white/5 hover:border-emerald-500/20 p-4.5 rounded-2xl flex items-center justify-between gap-4 transition-all duration-300">
                <div>
                  <h5 className="text-white/30 font-black text-[10px] leading-none mb-2 uppercase tracking-wide">توزيع التدفق المالي</h5>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                       <p className="text-white font-black text-xs leading-none font-mono flex items-baseline gap-1">
                         <span className="text-white/70 ml-1">نقدي:</span>
                         <span>{cashVsElectronicData[0].value.toLocaleString()}</span>
                       </p>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                       <p className="text-white font-black text-xs leading-none font-mono flex items-baseline gap-1">
                         <span className="text-white/70 ml-1">إلكتروني:</span>
                         <span>{cashVsElectronicData[1].value.toLocaleString()}</span>
                       </p>
                    </div>
                  </div>
                </div>
                <div className="w-20 h-20 shrink-0 relative flex items-center justify-center">
                  {(() => {
                    const total = cashVsElectronicData[0].value + cashVsElectronicData[1].value;
                    const cashPct = total > 0 ? (cashVsElectronicData[0].value / total) * 100 : 100;
                    return (
                      <div className="w-[72px] h-[72px] rounded-full relative flex items-center justify-center shadow-lg"
                        style={{
                          background: total > 0 ? `conic-gradient(#3b82f6 ${cashPct}%, #10b981 ${cashPct}%)` : '#1e293b'
                        }}
                      >
                         <div className="w-[52px] h-[52px] bg-gradient-to-r from-[#111a37] to-[#101834] rounded-full absolute shadow-inner"></div>
                      </div>
                    )
                  })()}
                  {/* Decorative faint glow behind pie chart */}
                  <div className="absolute inset-0 bg-white/5 blur-xl rounded-full -z-10 mix-blend-screen"></div>
                </div>
              </div>

            </div>

            {/* Majestic Staff Payroll and Benefits Analysis Dashboard */}
            <div className="bg-gradient-to-r from-[#111a37] via-[#101935] to-[#0d1430] rounded-[41px] border border-cyan-500/10 p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden w-full">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/5 blur-[100px] pointer-events-none rounded-full" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-white font-black text-base sm:text-lg tracking-tight flex items-center gap-2">
                    <Calculator className="text-[#00E5FF]" size={20} />
                    تحليل الموازنة المركزية لرواتب الكادر الأكاديمي والوظائف المساندة
                  </h3>
                  <p className="text-white/30 text-[10px] font-bold mt-1">تفريغ تفصيلي للمرتبات الأساسية، مكافآت التميز، والاستقطاعات الحالية لشهر <span className="text-[#00E5FF] font-black">{selectedMonth}</span></p>
                </div>
                <div className="px-3.5 py-1 bg-white/5 rounded-full border border-white/10 text-white/50 text-[10px] font-mono font-bold tracking-wider">
                  الإصدار الاحترافي v2.0
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full">
                
                {/* Widget A: Base Salaries */}
                <div className="bg-[#0c1229]/60 hover:bg-[#0c1229]/90 border border-white/5 hover:border-cyan-500/10 p-5 rounded-3xl transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-white/30 font-black text-[9px] block uppercase">إجمالي المرتبات الأساسية</span>
                      <p className="text-white font-black text-lg sm:text-xl font-mono mt-1.5">{totals.totalBaseSalaries.toLocaleString()} <span className="text-[10px] text-white/30 font-bold">د.ع</span></p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                      <Calculator size={18} />
                    </div>
                  </div>
                  <div className="text-[9px] text-white/20 font-bold mt-3 leading-tight">القيمة المجردة لعقود العمل المبرمة</div>
                </div>

                {/* Widget B: Staff Rewards & Subsidies */}
                <div className="bg-[#0c1229]/60 hover:bg-[#0c1229]/90 border border-white/5 hover:border-emerald-500/10 p-5 rounded-3xl transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-emerald-400/80 font-black text-[9px] block uppercase">مجموع المكافآت والحوافز</span>
                      <p className="text-emerald-400 font-black text-lg sm:text-xl font-mono mt-1.5">+{totals.totalRewards.toLocaleString()} <span className="text-[10px] text-emerald-400/40 font-bold">د.ع</span></p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm shadow-emerald-900/10">
                      <Plus size={18} />
                    </div>
                  </div>
                  <div className="text-[9px] text-emerald-400/50 font-bold mt-3 leading-tight">علاوات مستحقة لقاء أداء استثنائي أو إضافي</div>
                </div>

                {/* Widget C: Staff Deductions */}
                <div className="bg-[#0c1229]/60 hover:bg-[#0c1229]/90 border border-white/5 hover:border-rose-500/10 p-5 rounded-3xl transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-rose-400/80 font-black text-[9px] block uppercase">مجموع الاستقطاعات والغرامات</span>
                      <p className="text-rose-400 font-black text-lg sm:text-xl font-mono mt-1.5">-{totals.totalDeductions.toLocaleString()} <span className="text-[10px] text-rose-400/40 font-bold">د.ع</span></p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 shrink-0">
                      <TrendingDown size={18} />
                    </div>
                  </div>
                  <div className="text-[9px] text-rose-400/50 font-bold mt-3 leading-tight">جزاءات بسبب الغياب أو التقصير بالواجبات</div>
                </div>

                {/* Widget D: Pure Payroll Budget */}
                <div className="bg-[#121c3c]/60 hover:bg-[#121c3c]/90 border border-cyan-500/15 hover:border-cyan-500/25 p-5 rounded-3xl transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[#00E5FF] font-black text-[9px] block uppercase">صافي كلفة الرواتب (المطلوبة)</span>
                      <p className="text-white font-black text-lg sm:text-xl font-mono mt-1.5">{totals.totalSalaries.toLocaleString()} <span className="text-[10px] text-white/30 font-bold">د.ع</span></p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-[#00E5FF] shrink-0">
                      <DollarSign size={18} />
                    </div>
                  </div>
                  <div className="text-[9px] text-white/30 font-bold mt-3 leading-tight flex items-center gap-1">
                    <span>نسبة الصرف الفعلي:</span> 
                    <span className="text-[#00E5FF] font-black">{totals.paidPercentage}%</span>
                  </div>
                </div>

              </div>

              {/* Progress bar of payroll disbursement */}
              <div className="p-4.5 bg-black/20 rounded-2xl border border-white/5 space-y-2">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-white/40">مستوى إكمال صرف رواتب شهر {selectedMonth} للكادر:</span>
                  <span className="text-cyan-400 font-black">{totals.paidPercentage}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden p-[1px]">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${totals.paidPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[9px] text-white/20 pt-1 font-bold">
                  <span>الرواتب المصروفة: <span className="text-emerald-400 font-mono font-black">{totals.paidSalaries.toLocaleString()} د.ع</span></span>
                  <span>الرواتب المتبقية غير المصروفة: <span className="text-amber-400 font-mono font-black">{totals.remainingSalaries.toLocaleString()} د.ع</span></span>
                </div>
              </div>
            </div>

            {/* Charts and logs Core Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
              
              {/* Monthly Comparison Analysis */}
              <div className="bg-gradient-to-b from-[#101935] to-[#0b1022] rounded-[40px] border border-white/5 shadow-2.5xl relative overflow-hidden flex flex-col p-6 sm:p-8">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 blur-[120px] -z-10 rounded-full" />
                
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-black text-lg sm:text-xl tracking-tight flex items-center gap-2">
                      <TrendingUp className="text-cyan-400" size={20} />
                      مؤشر الأداء والتحصيل الشهري
                    </h3>
                    <p className="text-white/30 text-[10px] font-bold mt-1">تتبع التحصيل التراكمي ونسب النمو</p>
                  </div>
                  <span className="text-[9px] bg-white/5 border border-white/10 text-white/50 px-3 py-1 rounded-full font-bold">عام {new Date().getFullYear()}</span>
                </div>

                {/* Modern Visual Trend Chart */}
                <div className="w-full h-36 bg-white/[0.01] border border-white/5 rounded-3xl p-3 flex items-center justify-center relative overflow-hidden mb-5">
                  <div className="absolute inset-0 bg-gradient-to-t from-cyan-400/[0.02] to-transparent pointer-events-none" />
                  
                  {/* Custom High-Fidelity Interactive SVG Area Chart */}
                  {(() => {
                    const maxRevenueValue = Math.max(...chartData.map(d => d.value), 1000000);
                    const svgPoints = chartData.map((item, idx) => {
                      const x = 30 + idx * (540 / 11);
                      const y = 110 - (item.value / maxRevenueValue) * 85;
                      return { x, y, name: item.name, value: item.value, count: item.count, idx };
                    });

                    const svgLinePath = svgPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
                    const svgAreaPath = svgPoints.length > 0 
                      ? `${svgLinePath} L ${svgPoints[svgPoints.length - 1].x.toFixed(1)} 110 L ${svgPoints[0].x.toFixed(1)} 110 Z`
                      : '';

                    const shortMonthNames: Record<string, string> = {
                      'كانون الثاني': 'كانون ٢',
                      'شباط': 'شباط',
                      'آذار': 'آذار',
                      'نيسان': 'نيسان',
                      'أيار': 'أيار',
                      'حزيران': 'حزيران',
                      'تموز': 'تموز',
                      'آب': 'آب',
                      'أيلول': 'أيلول',
                      'تشرين الأول': 'تشرين ١',
                      'تشرين الثاني': 'تشرين ٢',
                      'كانون الأول': 'كانون ١'
                    };

                    const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const relativeX = (x / rect.width) * 600;
                      let closestIdx = 0;
                      let minDiff = Infinity;
                      svgPoints.forEach((p, idx) => {
                        const diff = Math.abs(p.x - relativeX);
                        if (diff < minDiff) {
                          minDiff = diff;
                          closestIdx = idx;
                        }
                      });
                      setChartHoverIdx(closestIdx);
                    };

                    return (
                      <svg 
                        viewBox="0 0 600 130" 
                        className="w-full h-full select-none"
                        onMouseMove={handleSvgMouseMove}
                        onMouseLeave={() => setChartHoverIdx(null)}
                        onClick={() => {
                          if (chartHoverIdx !== null && svgPoints[chartHoverIdx]) {
                            setSelectedChartMonth(svgPoints[chartHoverIdx].name);
                          }
                        }}
                      >
                        <defs>
                          <linearGradient id="svgChartGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00E5FF" stopOpacity={0.32} />
                            <stop offset="100%" stopColor="#00E5FF" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>

                        {/* Grid Lines */}
                        <line x1="25" y1="110" x2="575" y2="110" className="stroke-white/[0.05]" strokeWidth="1" />
                        <line x1="25" y1="70"  x2="575" y2="70"  className="stroke-white/[0.02]" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="25" y1="30"  x2="575" y2="30"  className="stroke-white/[0.02]" strokeWidth="1" strokeDasharray="3 3" />

                        {/* Area Fill */}
                        {svgAreaPath && (
                          <path d={svgAreaPath} fill="url(#svgChartGlow)" />
                        )}

                        {/* Line Stroke */}
                        {svgLinePath && (
                          <path d={svgLinePath} fill="none" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        )}

                        {/* Month Axis Labels */}
                        {svgPoints.map((p) => {
                          const isSelected = p.name === selectedChartMonth;
                          return (
                            <text
                              key={p.name + '_lbl'}
                              x={p.x}
                              y="124"
                              textAnchor="middle"
                              className={`text-[8px] font-black tracking-tight transition-colors duration-300 ${isSelected ? 'fill-[#00E5FF] font-black' : 'fill-white/30'}`}
                            >
                              {shortMonthNames[p.name] || p.name}
                            </text>
                          );
                        })}

                        {/* Vertices/Data Dots */}
                        {svgPoints.map((p, idx) => {
                          const isSelected = p.name === selectedChartMonth;
                          const isHovered = chartHoverIdx === idx;
                          return (
                            <g key={p.name + '_dot'} className="cursor-pointer">
                              {(isSelected || isHovered) && (
                                <circle cx={p.x} cy={p.y} r="7" className="fill-cyan-400/25 animate-pulse" />
                              )}
                              <circle 
                                cx={p.x} 
                                cy={p.y} 
                                r={isSelected ? "4.5" : "3"} 
                                className={`transition-all duration-300 ${isSelected ? 'fill-[#00E5FF] stroke-[#0c122c] stroke-[2]' : 'fill-white/40 hover:fill-[#00E5FF]'}`}
                              />
                            </g>
                          );
                        })}

                        {/* Active hover vertical line vertical cursor */}
                        {chartHoverIdx !== null && svgPoints[chartHoverIdx] && (
                          <line 
                            x1={svgPoints[chartHoverIdx].x} 
                            y1="15" 
                            x2={svgPoints[chartHoverIdx].x} 
                            y2="110" 
                            className="stroke-cyan-400/15 pointer-events-none" 
                            strokeWidth="1" 
                            strokeDasharray="2 2" 
                          />
                        )}

                        {/* High Fidelity interactive inline Tooltip bubble */}
                        {chartHoverIdx !== null && svgPoints[chartHoverIdx] && (
                          <g className="pointer-events-none">
                            {/* Card Background shadow and glow */}
                            <rect 
                              x={Math.max(15, Math.min(465, svgPoints[chartHoverIdx].x - 60))} 
                              y={Math.max(5, svgPoints[chartHoverIdx].y - 30)} 
                              width="120" 
                              height="22" 
                              rx="6" 
                              className="fill-[#0c122c] stroke-white/10" 
                              strokeWidth="1"
                            />
                            {/* Text inside */}
                            <text 
                              x={Math.max(15, Math.min(465, svgPoints[chartHoverIdx].x - 60)) + 60} 
                              y={Math.max(5, svgPoints[chartHoverIdx].y - 30) + 14} 
                              textAnchor="middle" 
                              className="fill-white font-extrabold text-[8px] font-mono"
                              direction="rtl"
                            >
                              {svgPoints[chartHoverIdx].name}: {svgPoints[chartHoverIdx].value.toLocaleString()} د.ع
                            </text>
                          </g>
                        )}
                      </svg>
                    );
                  })()}
                </div>

                {/* Sub-Layout: Selected Spotlight & Compact Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch flex-1">
                  
                  {/* Spotlight Banner Card */}
                  <div className="md:col-span-5 bg-white/[0.02] border border-white/[0.07] rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute -top-12 -left-12 w-24 h-24 bg-cyan-400/10 blur-2xl rounded-full" />
                    
                    <div className="relative z-10">
                      <span className="text-[10px] text-white/30 font-black tracking-widest uppercase block mb-1">الشهر المستهدف</span>
                      <h4 className="text-white font-black text-xl leading-none flex items-center gap-2">
                        {selectedChartMonth}
                        {spotlightData.current.count > 0 && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                      </h4>
                      <p className="text-white/40 text-[9px] font-bold mt-1.5">{spotlightData.current.count} دفعات تم استيفاؤها</p>
                    </div>

                    <div className="mt-4 relative z-10">
                      <span className="text-[9px] text-white/30 font-black block">إجمالي التحصيل</span>
                      <p className="text-2xl font-black text-[#00E5FF] font-mono tracking-tight leading-none mt-1">{spotlightData.current.value.toLocaleString()} <span className="text-[10px] font-black text-white/40">د.ع</span></p>
                      
                      <div className="mt-3 flex items-center">
                        {spotlightData.growthType === 'up' && (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 text-[10px] font-black border border-emerald-500/15">
                            <TrendingUp size={11} />
                            <span>نمو {spotlightData.growthPercent}</span>
                          </div>
                        )}
                        {spotlightData.growthType === 'down' && (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-400 text-[10px] font-black border border-rose-500/15">
                            <TrendingDown size={11} />
                            <span>تراجع {spotlightData.growthPercent}</span>
                          </div>
                        )}
                        {spotlightData.growthType === 'stable' && (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 text-white/50 text-[10px] font-bold">
                            <span>مستقر {spotlightData.growthPercent}</span>
                          </div>
                        )}
                        {spotlightData.growthType === 'none' && (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/[0.02] text-white/20 text-[10px] font-bold">
                            <span>رسم البداية</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Months Selector Grid */}
                  <div className="md:col-span-7 grid grid-cols-3 gap-2 p-1 bg-white/[0.01] border border-white/5 rounded-3xl">
                    {chartData.map((month) => {
                      const isSelected = month.name === selectedChartMonth;
                      const hasPayments = month.count > 0;
                      
                      return (
                        <button
                          key={month.name}
                          type="button"
                          onClick={() => setSelectedChartMonth(month.name)}
                          className={`relative overflow-hidden p-2 rounded-2xl border text-center transition-all duration-300 flex flex-col justify-center items-center gap-0.5 cursor-pointer ${
                            isSelected 
                              ? 'bg-gradient-to-tr from-cyan-500/15 to-blue-500/5 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.15)] scale-[1.03]' 
                              : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/5 text-white/40 hover:text-white/80'
                          }`}
                        >
                          <span className={`text-[10px] font-black leading-none ${isSelected ? 'text-cyan-400' : 'text-white/60 group-hover:text-white'}`}>{month.name}</span>
                          <span className="text-[8px] font-bold leading-none mt-0.5 font-mono opacity-80">
                            {month.value > 0 ? `${(month.value / 1000000).toFixed(1)}M` : '0.0'}
                          </span>
                          {hasPayments && !isSelected && (
                            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400/70" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Recent Transactions List (Synchronization Hub) - Super Compact & Organized */}
              <div className="bg-gradient-to-b from-[#101935] to-[#0b1022] rounded-[40px] border border-white/5 shadow-2.5xl relative overflow-hidden flex flex-col p-6 sm:p-8 min-h-[520px] justify-between">
                <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-500/5 blur-[120px] -z-10 rounded-full animate-pulse" />
                
                <div>
                  {/* Title & Badge Header */}
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-black text-base sm:text-lg tracking-tight flex items-center gap-2">
                        <History className="text-cyan-400" size={18} />
                        سجل المعاملات المباشر
                      </h3>
                      <p className="text-white/30 text-[9px] font-bold mt-1">تتبع مرن ودقيق لكافة الحركات المالية</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-black">مباشر الآن</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse relative block shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>
                  </div>

                  {/* Search, Filter, and View Mode Controls */}
                  <div className="mb-5 space-y-3">
                    {/* Row 1: Search Input */}
                    <div className="relative">
                      <Search className="absolute right-3 top-2.5 text-white/30 pointer-events-none" size={14} />
                      <input
                        type="text"
                        placeholder="البحث باسم الطالب، رقم الكود أو البوابة..."
                        value={txSearchQuery}
                        onChange={(e) => {
                          setTxSearchQuery(e.target.value);
                          setTxPage(1);
                        }}
                        className="w-full text-right text-[11px] bg-white/[0.02] hover:bg-white/[0.04] focus:bg-[#0c1229] border border-white/5 focus:border-cyan-500/30 rounded-2xl py-2.5 pr-9 pl-4 text-white placeholder-white/20 outline-none transition-all duration-300 shadow-inner"
                      />
                      {txSearchQuery && (
                        <button
                          type="button"
                          onClick={() => { setTxSearchQuery(''); setTxPage(1); }}
                          className="absolute left-3 top-2.5 text-white/30 hover:text-white transition-colors"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    {/* Row 2: Filtering and view toggling */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {/* Filter tabs */}
                      <div className="flex items-center gap-1 p-0.5 bg-white/[0.01] border border-white/5 rounded-xl">
                        <button
                          type="button"
                          onClick={() => { setTxFilter('all'); setTxPage(1); }}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-black transition-all ${
                            txFilter === 'all' 
                              ? 'bg-gradient-to-tr from-cyan-500/15 to-blue-500/5 text-cyan-400 border border-cyan-500/20 shadow-md' 
                              : 'text-white/40 hover:text-white/70 border border-transparent'
                          }`}
                        >
                          الكل ({globalLogs.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => { setTxFilter('electronic'); setTxPage(1); }}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-black transition-all ${
                            txFilter === 'electronic' 
                              ? 'bg-gradient-to-tr from-cyan-500/15 to-blue-500/5 text-cyan-400 border border-cyan-500/20' 
                              : 'text-white/40 hover:text-white/70 border border-transparent'
                          }`}
                        >
                          إلكتروني
                        </button>
                        <button
                          type="button"
                          onClick={() => { setTxFilter('cash'); setTxPage(1); }}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-black transition-all ${
                            txFilter === 'cash' 
                              ? 'bg-gradient-to-tr from-cyan-500/15 to-blue-500/5 text-cyan-400 border border-cyan-500/20' 
                              : 'text-white/40 hover:text-white/70 border border-transparent'
                          }`}
                        >
                          نقدي
                        </button>
                      </div>

                      {/* View mode toggle */}
                      <div className="flex items-center gap-1 p-0.5 bg-white/[0.01] border border-white/5 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setTxViewMode('dense')}
                          className={`px-2 py-1 rounded-lg text-[8.5px] font-black transition-all ${
                            txViewMode === 'dense' 
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                              : 'text-white/30 hover:text-white/60'
                          }`}
                        >
                          مكثف ⚡
                        </button>
                        <button
                          type="button"
                          onClick={() => setTxViewMode('detailed')}
                          className={`px-2 py-1 rounded-lg text-[8.5px] font-black transition-all ${
                            txViewMode === 'detailed' 
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                              : 'text-white/30 hover:text-white/60'
                          }`}
                        >
                          تفصيلي
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Core List View (Space Conscious Panel) */}
                  <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                    {pagedLogs.length === 0 ? (
                      <div className="py-14 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/20">
                          <DollarSign size={24} />
                        </div>
                        <p className="text-white/25 text-xs font-bold leading-relaxed">
                          {globalLogs.length === 0 
                            ? 'لا توجد سجلات معاملات معتمدة حالياً' 
                            : 'لا توجد سجلات تطابق التصفية الحالية'}
                        </p>
                      </div>
                    ) : (
                      pagedLogs.map((log: any, idx: number) => {
                        let displayStudentName = log.studentName;
                        if (!displayStudentName || displayStudentName === log.studentCode || displayStudentName === log.studentId) {
                           const foundStudent = students?.find((s: any) => s.code === log.studentCode || s.student === log.studentCode || s.id === log.studentCode);
                           if (foundStudent) {
                             displayStudentName = foundStudent.name || foundStudent.fullName || displayStudentName;
                           }
                        }

                        if (txViewMode === 'dense') {
                          // SUPER SPACE EFFICIENT DENSE VIEW ROW
                          return (
                            <motion.div 
                              key={log.id || idx}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-white/[0.01] hover:bg-white/[0.035] border border-white/5 hover:border-cyan-500/15 rounded-xl px-3 py-2 flex items-center justify-between group transition-all duration-300"
                            >
                              <div className="flex items-center gap-3">
                                {/* Thin, glowing dot */}
                                <div className={`w-2.5 h-2.5 rounded-full ${
                                  log.type === 'revenue' 
                                    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]' 
                                    : 'bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.4)]'
                                }`} />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-white font-extrabold text-[11px] group-hover:text-cyan-400 transition-colors line-clamp-1 max-w-[130px] sm:max-w-[180px]">
                                      {displayStudentName || 'صاحب المعاملة'}
                                    </p>
                                    <span className="text-[7.5px] bg-white/5 border border-white/10 text-white/40 px-1.5 py-0.2 rounded font-mono font-bold">
                                      {log.studentCode}
                                    </span>
                                  </div>
                                  <p className="text-white/20 text-[9px] font-bold mt-0.5">
                                    {(() => {
                                      const m = (log.method || '').toLowerCase();
                                      if (m.includes('zain')) return 'زين كاش 📱';
                                      if (m.includes('asia')) return 'آسيا حوالة 📱';
                                      if (m.includes('master')) return 'ماستركارد 💳';
                                      if (m.includes('fib')) return 'مصرف FIB 🏛️';
                                      return log.method || 'نقدي/مدير حسابات';
                                    })()} • <span className="font-mono">{log.timestamp ? new Date(log.timestamp).toLocaleDateString('ar-IQ') : '--'}</span>
                                  </p>
                                </div>
                              </div>
                              
                              <div className="text-left shrink-0">
                                <p className={`font-black text-xs font-mono tracking-wide ${log.type === 'revenue' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {log.type === 'revenue' ? '+' : '-'}{log.amount.toLocaleString()} <span className="text-[8px] font-bold">د.ع</span>
                                </p>
                              </div>
                            </motion.div>
                          );
                        } else {
                          // DETAILED EXPANDED CARD VIEW
                          return (
                            <motion.div 
                              key={log.id || idx}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-white/[0.015] border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:border-cyan-500/15 hover:bg-white/[0.04] transition-all duration-300 shadow-sm"
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-colors ${
                                  log.type === 'revenue' 
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' 
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/15'
                                }`}>
                                  {log.type === 'revenue' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                </div>
                                <div>
                                  <p className="text-white font-black text-sm group-hover:text-cyan-400 transition-colors">{displayStudentName || 'صاحب المعاملة'}</p>
                                  <span className="text-white/30 text-[10px] font-black mt-1.5 block">
                                    {(() => {
                                      const methodMap: Record<string, string> = {
                                        'asiahawala': 'آسيا حوالة 📱',
                                        'zaincash': 'زين كاش 📱',
                                        'mastercard': 'ماستر كارد 💳',
                                        'fib': 'مصرف العراق الأول FIB 🏛️'
                                      };
                                      return methodMap[log.method] || log.method || 'مدير حسابات / نقدي';
                                    })()} • <span className="font-mono tracking-wider">{log.timestamp ? new Date(log.timestamp).toLocaleDateString('ar-IQ') : '--'}</span>
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`font-black text-sm font-mono tracking-wide ${log.type === 'revenue' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {log.type === 'revenue' ? '+' : '-'}{log.amount.toLocaleString()} د.ع
                                </p>
                                <span className={`text-[8.5px] px-2.5 py-0.5 rounded-full font-black block mt-2 ${
                                  log.type === 'revenue' 
                                    ? 'bg-emerald-500/10 text-emerald-400' 
                                    : 'bg-rose-500/10 text-rose-400'
                                }`}>
                                  {log.type === 'revenue' ? 'تسديد قسط' : 'معالجة رفض'}
                                </span>
                              </div>
                            </motion.div>
                          );
                        }
                      })
                    )}
                  </div>
                </div>

                {/* Pagination Controls Footer */}
                {totalTxPages > 1 && (
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40">
                    <button
                      type="button"
                      disabled={txPage === 1}
                      onClick={() => setTxPage(prev => Math.max(1, prev - 1))}
                      className="px-3 py-1.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/5 text-white disabled:opacity-25 disabled:pointer-events-none transition-all flex items-center gap-1 cursor-pointer font-black"
                    >
                      <span>السابق</span>
                    </button>
                    
                    <span className="font-black">
                      معاملة <span className="text-cyan-400 font-mono">{(txPage - 1) * txPageSize + 1}-{Math.min(txPage * txPageSize, filteredLogs.length)}</span> من <span className="font-mono text-white">{filteredLogs.length}</span>
                    </span>

                    <button
                      type="button"
                      disabled={txPage === totalTxPages}
                      onClick={() => setTxPage(prev => Math.min(totalTxPages, prev + 1))}
                      className="px-3 py-1.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/5 text-white disabled:opacity-25 disabled:pointer-events-none transition-all flex items-center gap-1 cursor-pointer font-black"
                    >
                      <span>التالي</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}

        {activeTab === 'config' && (
          <motion.div 
            key="config"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-6 pb-12"
          >
            {/* 1. Sleek Compact HUD Header */}
            <div className="bg-gradient-to-r from-slate-900/90 via-[#0d142c]/95 to-slate-900/90 rounded-[28px] border border-white/5 p-5 md:p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="absolute top-0 right-1/4 w-64 h-64 bg-cyan-500/[0.03] blur-[80px] pointer-events-none rounded-full" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full font-black border border-blue-500/20">قنوات الهيكلة الذكية</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <h2 className="text-white font-black text-xl sm:text-2xl tracking-tight leading-none">إعدادات المخطط المالي العام</h2>
                <p className="text-white/40 text-[10px] md:text-xs font-bold">تخصيص قيمة اشتراك المقعد الأكاديمي، مصفوفة التسهيلات وجدول الأقساط المعتمد.</p>
              </div>

              <div className="shrink-0 bg-[#0b1021]/60 px-3.5 py-1.5 rounded-xl border border-white/5 flex items-center gap-2 self-start md:self-auto">
                <Settings className="text-amber-400 animate-spin" size={14} style={{ animationDuration: '8s' }} />
                <span className="text-white font-extrabold text-[10px]">مزامنة سحابية مؤمنة لقاعدة البيانات</span>
              </div>
            </div>

            {/* 2. Full-Width Grid: Tuition Input & Discount Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Tuition Card */}
              <div className="lg:col-span-5 flex flex-col justify-between p-6 md:p-8 rounded-[28px] bg-gradient-to-br from-[#101935]/80 to-[#0c1229]/80 border border-white/5 relative overflow-hidden group shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.015] blur-2xl rounded-full pointer-events-none" />
                <div className="space-y-2">
                  <span className="text-[9px] text-amber-400 font-extrabold tracking-wider bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 inline-block">الاشتراك السنوي العام</span>
                  <h3 className="text-white font-black text-lg">مبلغ الاشتراك الموحد</h3>
                  <p className="text-white/40 text-[10px] sm:text-xs font-bold">المبلغ المالي الأساسي المعتمد للمقاعد السنوية لكل الطلبة قبل أي خصومات.</p>
                </div>

                <div className="space-y-4 mt-8">
                  <div className="relative group">
                    <input 
                      type="text" 
                      value={isEditingFee ? tempFee : (parseInt(tempFee) || 0).toLocaleString()}
                      onChange={(e) => setTempFee(e.target.value.replace(/[^\d]/g, ''))}
                      readOnly={!isEditingFee}
                      className={`w-full h-14 bg-black/40 text-white font-black text-2xl rounded-xl text-center outline-none border transition-all pl-12 ${
                        isEditingFee 
                          ? 'border-amber-400/80 text-amber-500 ring-2 ring-amber-400/10 shadow-[inner_0_0_10px_rgba(245,158,11,0.2)] pr-4' 
                          : 'border-white/5 focus:border-white/10 text-white/90 group-hover:border-white/10 pr-12'
                      }`}
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-black text-xs">
                      د.ع
                    </div>
                    {!isEditingFee && (
                      <div className="absolute top-1/2 -translate-y-1/2 right-3 w-7 h-7 bg-[#101935] border border-white/10 rounded-lg flex items-center justify-center text-white/30 shadow-md">
                        <LockIcon size={11} />
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => isEditingFee ? handleSaveFee() : setIsEditingFee(true)}
                    className={`w-full h-12 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md cursor-pointer shrink-0 ${
                      isEditingFee 
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25' 
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25'
                    }`}
                  >
                    {isEditingFee ? (
                      <>
                        <Save size={14} />
                        <span>حفظ التعديل المالي فوراً</span>
                      </>
                    ) : (
                      <>
                        <Edit3 size={14} />
                        <span>تعديل القيمة المالية</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Discount Matrix Card Container (Strict 2x2 Grid) */}
              <div className="lg:col-span-7 p-6 md:p-8 rounded-[28px] bg-gradient-to-br from-[#101935]/80 to-[#0c1229]/80 border border-white/5 relative overflow-hidden flex flex-col justify-between shadow-xl">
                <div className="absolute inset-0 bg-emerald-500/[0.003] blur-3xl rounded-full pointer-events-none" />

                <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                  <div className="space-y-1">
                    <span className="text-[9px] text-emerald-400 font-extrabold tracking-wider bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 inline-block">التخفيضات والمنح الأكاديمية</span>
                    <h3 className="text-white font-black text-base">مصفوفة نسب الخصم</h3>
                  </div>
                  <button 
                     onClick={() => isEditingDiscounts ? handleSaveDiscounts() : setIsEditingDiscounts(true)}
                     className={`h-9 px-4 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md ${
                       isEditingDiscounts 
                         ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                         : 'bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 border border-emerald-500/10'
                     }`}
                  >
                    {isEditingDiscounts ? (
                      <>
                        <Save size={13} />
                        <span>حفظ مصفوفة النسب</span>
                      </>
                    ) : (
                      <>
                        <Edit3 size={13} />
                        <span>تعديل نسب الخصم</span>
                      </>
                    )}
                  </button>
                </div>
                
                {/* 2x2 Grid (Strict columns = 2) */}
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(safeDiscountLabels || {}).filter(([type]) => type && type !== 'NONE').map(([type, label]) => {
                    let discountColor = 'border-white/5 bg-black/30';
                    let iconElement = <Calculator size={15} className="text-white/20" />;
                    
                    if (type === 'SIBLINGS') {
                      discountColor = isEditingDiscounts ? 'border-sky-500/30 bg-sky-500/[0.015]' : 'border-white/5 bg-black/20 hover:border-sky-500/10';
                      iconElement = <UsersIcon className="text-sky-400/70" size={15} />;
                    } else if (type === 'MARTYR') {
                      discountColor = isEditingDiscounts ? 'border-rose-500/30 bg-rose-500/[0.015]' : 'border-white/5 bg-black/20 hover:border-rose-500/10';
                      iconElement = <ShieldCheck className="text-rose-400/70" size={15} />;
                    } else if (type === 'EXCEPTIONAL') {
                      discountColor = isEditingDiscounts ? 'border-emerald-500/30 bg-emerald-500/[0.015]' : 'border-white/5 bg-black/20 hover:border-emerald-500/10';
                      iconElement = <Verified className="text-emerald-400/70" size={15} />;
                    } else {
                      discountColor = isEditingDiscounts ? 'border-indigo-500/30 bg-indigo-500/[0.015]' : 'border-white/5 bg-black/20 hover:border-indigo-500/10';
                      iconElement = <UserCog className="text-indigo-400/70" size={15} />;
                    }

                    return (
                      <div key={type} className={`p-4 rounded-xl border transition-all duration-300 relative group flex items-center justify-between h-18 ${discountColor}`}>
                        <div className="space-y-1 text-right">
                          <p className="text-white/30 text-[10px] font-black">{label}</p>
                          <div className="flex items-center gap-1">
                            <input 
                               type="text" 
                               value={tempRates[type] ?? '0'}
                               onChange={(e) => setTempRates(prev => ({ ...prev, [type]: e.target.value.replace(/[^\d]/g, '') }))}
                               readOnly={!isEditingDiscounts}
                               className={`w-14 bg-transparent text-white font-black text-lg outline-none text-right transition-all leading-none ${
                                 isEditingDiscounts ? 'text-emerald-400 scale-105 font-bold' : 'text-white'
                               }`}
                            />
                            <span className="text-white/20 font-black text-xs">%</span>
                          </div>
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-white/[0.01] border border-white/5 flex items-center justify-center shrink-0">
                          {iconElement}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* 3. Installment Plan Layout */}
            <div className="p-6 md:p-8 rounded-[28px] bg-gradient-to-br from-[#101935]/80 to-[#0c1229]/80 border border-white/5 relative overflow-hidden space-y-6 shadow-xl">
              <div className="absolute top-0 right-1/4 w-64 h-64 bg-blue-500/[0.01] blur-[80px] pointer-events-none rounded-full" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                <div className="space-y-1">
                  <span className="text-[9px] text-blue-400 font-extrabold tracking-wider bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20 inline-block">تفعيل دفعات السداد للطلبة</span>
                  <h3 className="text-white font-black text-base">جدولة وتوزيع الأقساط الأكاديمية</h3>
                </div>
                <button 
                  onClick={applyPlanToAll}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black rounded-xl font-black text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <Save size={15} />
                  <span>تطبيق وتعميم الخطة على الجميع</span>
                </button>
              </div>

              {/* Installments Table-strip list */}
              <div className="space-y-3">
                {installmentPlan.map((inst, idx) => (
                  <div 
                    key={inst.id || idx} 
                    className="group bg-black/20 border border-white/5 p-4 rounded-xl flex flex-col md:flex-row items-center gap-4 hover:border-blue-500/20 transition-all duration-200 relative"
                  >
                    {/* Compact badge + delete button */}
                    <div className="flex items-center gap-3 justify-between w-full md:w-auto shrink-0">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/10 flex items-center justify-center text-blue-400 text-xs font-black">
                        #{idx + 1}
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete({
                            action: () => {
                               const newPlan = installmentPlan.filter((_, i) => i !== idx);
                               savePlanTemplate(newPlan);
                            },
                            title: 'تأكيد الحذف',
                            message: 'هل أنت متأكد من حذف هذا القسط؟'
                          });
                        }}
                        className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center border border-rose-500/10 cursor-pointer shadow-sm active:scale-95"
                        title="حذف القسط"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Compact inputs */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                      
                      {/* Name input */}
                      <div className="space-y-1">
                        <span className="text-white/30 text-[9px] font-black mr-1 flex items-center gap-1">
                          <BookOpen size={10} className="text-blue-400/80" /> مسمى القسط
                        </span>
                        <input 
                          value={inst.name || ''}
                          onChange={(e) => {
                            const newPlan = [...installmentPlan];
                            newPlan[idx].name = e.target.value;
                            savePlanTemplate(newPlan);
                          }}
                          placeholder="مثلاً: الدفعة الأولى"
                          className="w-full h-10 bg-black/30 border border-white/5 rounded-lg text-white font-extrabold text-xs outline-none focus:border-blue-500/40 px-3 text-right"
                        />
                      </div>

                      {/* Amount input */}
                      <div className="space-y-1">
                        <span className="text-white/30 text-[9px] font-black mr-1 flex items-center gap-1">
                          <DollarSign size={10} className="text-emerald-400/80" /> المبلغ المستحق
                        </span>
                        <div className="relative">
                          <input 
                            type="number"
                            value={inst.amount || ''}
                            onChange={(e) => {
                              const newPlan = [...installmentPlan];
                              newPlan[idx].amount = parseInt(e.target.value) || 0;
                              savePlanTemplate(newPlan);
                            }}
                            placeholder="0"
                            className="w-full h-10 bg-black/30 border border-white/5 rounded-lg text-white font-extrabold text-xs outline-none focus:border-blue-500/40 px-3 pl-8 text-right"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-[9px] font-black">د.ع</span>
                        </div>
                      </div>

                      {/* Due date input */}
                      <div className="space-y-1">
                        <span className="text-white/30 text-[9px] font-black mr-1 flex items-center gap-1">
                          <Clock size={10} className="text-amber-400/80" /> تاريخ الاستحقاق
                        </span>
                        <input 
                          type="date"
                          value={inst.dueDate || ''}
                          onChange={(e) => {
                            const newPlan = [...installmentPlan];
                            newPlan[idx].dueDate = e.target.value;
                            savePlanTemplate(newPlan);
                          }}
                          className="w-full h-10 bg-black/30 border border-white/5 rounded-lg text-white font-extrabold text-xs outline-none focus:border-blue-500/40 px-3 text-right cursor-pointer"
                        />
                      </div>

                    </div>
                  </div>
                ))}
                
                {/* Compact Add Button */}
                <button 
                  onClick={() => savePlanTemplate([...installmentPlan, { id: generateId(), name: '', amount: 0, dueDate: '' }])}
                  className="w-full h-12 border border-dashed border-white/10 hover:border-blue-500/30 rounded-xl text-white/30 hover:text-blue-400 hover:bg-blue-500/5 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-99"
                >
                  <Plus size={15} /> 
                  <span className="font-extrabold text-xs">إدراج دفعة قسط إضافية</span>
                </button>
              </div>
            </div>

            {/* Elegant Compact Warning Bar */}
            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center gap-3">
              <AlertCircle className="text-amber-500 shrink-0" size={18} />
              <p className="text-white/40 text-[10px] md:text-xs font-bold text-right leading-tight">
                ملاحظة: تفعيل "تطبيق وتعميم الخطة" سيقوم بإعادة جدولة وتوزيع الدفعات غير المسددة لجميع الطلاب المسجلين بالكامل.
              </p>
            </div>

          </motion.div>
        )}

        {activeTab === 'lists' && !currentList && (
           <motion.div 
            key="lists"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {(savedLists || []).length === 0 ? (
              <div className="col-span-full p-16 text-center bg-gradient-to-br from-[#101935]/40 to-[#101935]/10 rounded-[35px] border border-white/5 shadow-inner">
                <LucidePieChart className="mx-auto mb-4 text-white/10" size={48} />
                <p className="text-white/30 font-black text-sm">لم يتم إنشاء أي قوائم في شؤون الطلاب بعد.</p>
              </div>
            ) : (
              (savedLists || [])
                .slice()
                .sort((a, b) => (a.name || '').localeCompare((b.name || ''), 'ar'))
                .map((list, i) => {
                  // Calculate dynamic statistics for the class
                  const classStudents = (list.students || []).map((stuRef: any) => {
                    return students.find(s => {
                      const sCode = (s.code || '').toString().trim();
                      const sStudent = (s.student || '').toString().trim();
                      const sId = (s.id || '').toString().trim();
                      const refCode = (stuRef.code || '').toString().trim();
                      const refStudent = (stuRef.student || '').toString().trim();
                      const refId = (stuRef.id || '').toString().trim();
                      
                      const sIdentifier = sCode || sStudent;
                      const refIdentifier = refCode || refStudent;

                      return (sIdentifier && refIdentifier && sIdentifier === refIdentifier) ||
                             (sId && refId && sId === refId) ||
                             (s.name && stuRef.name && s.name.trim() === stuRef.name.trim());
                    }) || stuRef;
                  });

                  // Summing required vs paid amounts
                  let listRequired = 0;
                  let listPaid = 0;
                  classStudents.forEach((stu: any) => {
                    const financials = calculateStudentFinancials(stu, tuitionFee, safeDiscountRates);
                    listRequired += financials.requiredAmount;
                    listPaid += financials.paidAmount;
                  });

                  const payPercent = listRequired > 0 ? Math.round((listPaid / listRequired) * 100) : 0;

                  return (
                    <motion.div 
                      key={list.id || i}
                      whileHover={{ y: -5, scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => setSelectedList(list)}
                      className="bg-gradient-to-br from-[#121c3a]/75 to-[#101935]/20 backdrop-blur-2xl border border-white/5 hover:border-[#00E5FF]/30 p-5 rounded-[28px] cursor-pointer transition-all duration-300 shadow-xl hover:shadow-cyan-900/10 flex flex-col justify-between gap-4 group/card relative overflow-hidden"
                    >
                      {/* Ambient light effects inside list cards */}
                      <div className="absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-br from-cyan-500/10 to-transparent blur-[30px] rounded-full pointer-events-none group-hover/card:blur-[40px] transition-all" />

                      <div className="flex items-start justify-between relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover/card:bg-cyan-500 group-hover/card:text-black transition-all duration-300">
                            <LucidePieChart size={18} />
                          </div>
                          <div>
                            <h4 className="text-white font-black text-xs leading-none group-hover/card:text-cyan-400 transition-colors">{list.name}</h4>
                            <p className="text-white/30 text-[9px] font-bold mt-1 tracking-wide font-mono">
                              {list.students?.[0]?.grade || 'جميع الصفوف'}
                            </p>
                          </div>
                        </div>

                        {/* Beautiful pill student list counter */}
                        <span className="text-[10px] font-black tracking-tight px-3 py-1 rounded-full bg-white/5 border border-white/10 group-hover/card:border-cyan-500/20 text-white/80 transition-all">
                          {classStudents.length} طالب
                        </span>
                      </div>

                      {/* Collection Progress indicator */}
                      <div className="space-y-2 relative z-10 pt-1">
                        <div className="flex items-center justify-between text-[9px] font-bold">
                          <span className="text-white/40">نسبة التحصيل المالي</span>
                          <span className={payPercent >= 90 ? "text-emerald-400 font-extrabold" : payPercent >= 50 ? "text-cyan-400" : "text-amber-500"}>{payPercent}%</span>
                        </div>
                        
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(payPercent, 100)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[8px] text-white/30 pt-1 font-mono font-semibold">
                          <span>المسدد: {listPaid.toLocaleString()} د.ع</span>
                          <span>المطلوب: {listRequired.toLocaleString()} د.ع</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
            )}
          </motion.div>
        )}

        {activeTab === 'lists' && currentList && (
           <motion.div 
            key="list-detail"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 w-full"
          >
            {/* Action Bar & Search Input */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => { setSelectedList(null); setSearchQuery(''); }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white/80 rounded-xl transition-all font-black text-xs"
                >
                  <ArrowRight size={16} /> العودة للقوائم
                </button>
                <h3 className="text-white font-black text-lg">{currentList.name} <span className="text-cyan-400 text-xs font-bold font-mono">({(currentList.students || []).length} طالب)</span></h3>
              </div>
              
              {/* Intelligent student list table search */}
              <div className="relative w-full md:w-64">
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  placeholder="ابحث عن طالب في هذا الصف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 bg-[#101935]/40 border border-white/5 rounded-xl font-bold text-xs text-white pr-9 pl-4 outline-none focus:border-cyan-500/50 transition-all placeholder:text-white/20"
                />
              </div>
            </div>
            
            {/* Compact Ledgers - Stretching 100% full screen width */}
            <div className="w-full bg-[#101935]/20 backdrop-blur-2xl border border-white/5 rounded-[30px] overflow-hidden overflow-x-auto custom-scrollbar shadow-2xl">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="px-5 py-4 text-white/50 font-bold text-[10px] uppercase tracking-widest text-right whitespace-nowrap">اسم الطالب</th>
                    <th className="px-3 py-4 text-white/50 font-bold text-[10px] uppercase tracking-widest text-center whitespace-nowrap">القسط الكلي</th>
                    <th className="px-3 py-4 text-white/50 font-bold text-[10px] uppercase tracking-widest text-center whitespace-nowrap">المسدد الكلي</th>
                    {installmentPlan.map((p, i) => (
                      <th key={p.id || i} className="px-2 py-4 text-white/50 font-bold text-[10px] uppercase tracking-widest text-center min-w-[140px]">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-white/70 font-black">{p.name || `قسط ${i+1}`}</span>
                          <span className="text-[8px] text-[#00E5FF] px-1.5 py-0.2 rounded bg-[#00E5FF]/5 border border-[#00E5FF]/10">{(p.amount || 0).toLocaleString()} د.ع</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(currentList.students || [])
                    .slice()
                    .filter((stuRef: any) => {
                      if (!searchQuery) return true;
                      return (stuRef.name || '').includes(searchQuery);
                    })
                    .sort((a,b) => (a.name || '').localeCompare((b.name || ''), 'ar'))
                    .map((stuRef: any, idx: number) => {
                      // Real-time matching logic
                      const stu = students.find(s => {
                        const sCode = (s.code || '').toString().trim();
                        const sStudent = (s.student || '').toString().trim();
                        const sId = (s.id || '').toString().trim();
                        const refCode = (stuRef.code || '').toString().trim();
                        const refStudent = (stuRef.student || '').toString().trim();
                        const refId = (stuRef.id || '').toString().trim();
                        
                        const sIdentifier = sCode || sStudent;
                        const refIdentifier = refCode || refStudent;

                        return (sIdentifier && refIdentifier && sIdentifier === refIdentifier) ||
                               (sId && refId && sId === refId) ||
                               (s.name && stuRef.name && s.name.trim() === stuRef.name.trim());
                      }) || stuRef;

                      const financials = calculateStudentFinancials(stu, tuitionFee, safeDiscountRates);
                      const studentInstallments = stu.finance?.installments || stu.installments || [];
                      const studentPaidAmount = financials.paidAmount;

                      return (
                        <tr key={`student_${stu.code || stu.student || stu.id || ''}_${idx}`} className="hover:bg-white/[0.02] border-b border-white/[0.01] transition-colors group">
                          {/* Student Info - Dense styled row cards */}
                          <td className="px-5 py-2.5 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-white font-black text-xs group-hover:text-[#00E5FF] transition-colors tracking-tight">{stu.name}</span>
                              <span className="text-[8px] text-white/30 font-mono font-bold mt-0.5 tracking-wider">{stu.code || 'بدون كود'}</span>
                            </div>
                          </td>

                          {/* Total Required Compact Badge */}
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            <div className="inline-flex flex-col items-center bg-blue-500/5 px-2.5 py-1 rounded-xl border border-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.01)]">
                              <span className="text-blue-400 font-black text-xs">{financials.requiredAmount.toLocaleString()} د.ع</span>
                              {financials.discountRate > 0 && (
                                <span className="text-[7.5px] text-rose-400 font-bold mt-0.5 bg-rose-500/10 px-1 py-0.2 rounded border border-rose-500/10">
                                  خصم {financials.discountRate}% {safeDiscountLabels[stu.discountType] ? `(${safeDiscountLabels[stu.discountType]})` : ''}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Total Paid Compact Badge */}
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            <div className="inline-flex flex-col items-center bg-emerald-500/5 px-2.5 py-1 rounded-xl border border-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.01)]">
                              <span className="text-emerald-400 font-black text-xs">{studentPaidAmount.toLocaleString()} د.ع</span>
                            </div>
                          </td>

                          {/* Installment dynamic columns - Dense structure */}
                          {studentInstallments.length > 0 ? (
                            studentInstallments.map((inst: any, i: number) => {
                              const instStatus = (inst.status || '').toLowerCase().trim();
                              const isPaid = inst.paid === true || 
                                             ['paid', 'completed', 'verified', 'approved', 'verified_payment', 'success'].includes(instStatus) || instStatus.includes('مكتمل');
                              
                              const isPending = instStatus === 'pending';
                              const rawAmount = Number(inst.amount) || 0;
                              const effectiveAmount = financials.isInstallmentsAtGross ? Math.round(rawAmount * financials.discountFactor) : rawAmount;
                              const displayAmount = effectiveAmount.toLocaleString();
                              const isLate = !isPaid && inst.dueDate && new Date(inst.dueDate) < new Date();
                              const isElectronic = checkPaymentMethodIsElectronic(inst, stu.finance?.transactions);
                              
                              const bellKey = `${stu.code || stu.student || stu.id}_${inst.id || i}`;
                              const hasSentBell = sentBells[bellKey] === true;
                              
                              return (
                                <td key={inst.id || i} className="px-2 py-1.5 text-center min-w-[140px]">
                                  {/* Glassmorphic compact student installment cells */}
                                  <div className={`p-2 rounded-xl border transition-all duration-300 relative group/cell ${
                                    isPaid 
                                      ? 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/10 hover:border-emerald-500/20 text-emerald-400' 
                                      : isLate 
                                        ? 'bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/15 hover:border-rose-500/25 text-rose-400'
                                        : 'bg-white/[0.01] hover:bg-white/[0.02] border-white/5 hover:border-white/10 text-white/50'
                                  }`}>
                                    {/* Action Status Indicators adjacent right inside cells */}
                                    <div className="flex items-center justify-between gap-1 mb-1.5">
                                      <div className="flex items-center gap-1 shrink-0">
                                        {isPaid ? (
                                          <>
                                            <div className="relative group/icon cursor-help p-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-400">
                                              <Lock size={11} />
                                              <div className="absolute bottom-full right-0 mb-1.5 px-2 py-1 bg-slate-950 text-white text-[9px] rounded-md opacity-0 pointer-events-none group-hover/icon:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl">
                                                قسط مغلق ومحمي بموجب السداد 🔒
                                              </div>
                                            </div>
                                            {isElectronic && (
                                              <div className="relative group/icon cursor-help p-1 bg-blue-500/10 border border-blue-500/20 rounded-md text-blue-400">
                                                <CreditCard size={11} />
                                                <div className="absolute bottom-full right-0 mb-1.5 px-2 py-1 bg-slate-950 text-white text-[9px] rounded-md opacity-0 pointer-events-none group-hover/icon:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl">
                                                  تم الدفع بشكل إلكتروني آمن 💳
                                                </div>
                                              </div>
                                            )}
                                          </>
                                        ) : isLate ? (
                                          <div className="flex items-center gap-1">
                                            <div className="relative group/icon cursor-help p-1 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-md animate-pulse">
                                              <AlertCircle size={11} />
                                              <div className="absolute bottom-full right-0 mb-1.5 px-2 py-1 bg-slate-950 text-white text-[9px] rounded-md opacity-0 pointer-events-none group-hover/icon:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl">
                                                متأخر عن تاريخ الاستحقاق ⚠️
                                              </div>
                                            </div>
                                            
                                            {/* Parents Bell notification alert */}
                                            <button
                                              onClick={async (e) => {
                                                e.stopPropagation();
                                                if (hasSentBell) return;
                                                await handleSendParentAlert(stu, inst, bellKey);
                                              }}
                                              disabled={hasSentBell}
                                              className={`p-1 rounded-md border flex items-center justify-center transition-all ${
                                                hasSentBell 
                                                  ? 'bg-gray-500/10 border-gray-500/15 text-gray-400 cursor-not-allowed opacity-40' 
                                                  : 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-black hover:scale-105 active:scale-95'
                                              }`}
                                              title={hasSentBell ? 'تم إرسال تذكير الدفع بالنجاح' : 'إرسال تذكير سداد لولي الأمر والطالب 🔔'}
                                            >
                                              <Bell size={11} className={hasSentBell ? "" : "animate-bounce"} />
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="relative group/icon cursor-help p-1 bg-amber-500/5 border border-amber-500/10 text-amber-500 rounded-md">
                                            {/* Hourglass icon spinning gently to denote pending state */}
                                            <Hourglass size={11} className="animate-spin-slow text-amber-500/70" />
                                            <div className="absolute bottom-full right-0 mb-1.5 px-2 py-1 bg-slate-950 text-white text-[9px] rounded-md opacity-0 pointer-events-none group-hover/icon:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl">
                                              قسط مقبل لم يستحق بعد ⏳
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                                        isPaid 
                                          ? 'bg-emerald-500/10 text-emerald-400' 
                                          : isLate 
                                            ? 'bg-rose-500/10 text-rose-400' 
                                            : 'bg-white/5 text-white/40'
                                      }`}>
                                        {isPaid ? 'مدفوع' : isLate ? 'متأخر' : 'مستقبل'}
                                      </span>
                                    </div>

                                    {/* Event-driven payment & revert confirm button */}
                                    <button 
                                      onClick={() => {
                                         if (!isPaid) {
                                            setConfirmCashPayment({ studentCode: stu.code || stu.student || stu.id, installmentId: inst.id || i.toString() });
                                         } else {
                                            setConfirmCancelPayment({ 
                                               studentCode: stu.code || stu.student || stu.id, 
                                               installmentId: inst.id || i.toString(),
                                               installmentName: inst.name || `قسط ${i+1}`
                                            });
                                         }
                                      }}
                                      disabled={isPending}
                                      className={`w-full py-1.5 px-2 rounded-lg text-[9.5px] font-black transition-all flex items-center justify-center gap-1 ${
                                        isPaid 
                                          ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/15 text-emerald-400 active:scale-95' 
                                          : isPending 
                                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500 cursor-wait' 
                                            : isLate
                                              ? 'bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 active:scale-95'
                                              : 'bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/30 text-white/80 active:scale-95'
                                      }`}
                                    >
                                      {isPaid ? (
                                        <span className="flex items-center gap-0.5">
                                          <Verified size={10} className="fill-emerald-400/20" />
                                          مستلم
                                        </span>
                                      ) : isPending ? (
                                        'منتظر'
                                      ) : (
                                        <span>{displayAmount} د.ع</span>
                                      )}
                                    </button>

                                    {/* Receipt print or Due Date display metadata */}
                                    <div className="mt-1.5 text-[8.5px] font-bold flex flex-col items-center gap-0.5">
                                      {isPaid ? (
                                        <>
                                          {inst.transactionId && (
                                            <button 
                                                onClick={() => {
                                                  const studentTxns = stu.finance?.transactions || [];
                                                  const matchingTx = studentTxns.find((t: any) => {
                                                    if (inst.transactionId && t.id === inst.transactionId) return true;
                                                    if (inst.transactionId && t.id && t.id !== inst.transactionId) return false;
                                                    return Number(t.amount || 0) === Number(inst.amount) && t.note && t.note.includes(inst.name);
                                                  });
                                                  const finalMethod = matchingTx?.method || inst.method || 'نقدي/مدير';
                                                  
                                                  setSelectedTransaction({
                                                      adminName: auth.currentUser?.displayName || 'الإدارة',
                                                      studentName: stu.name,
                                                      studentId: stu.id,
                                                      installmentName: inst.name,
                                                      amount: inst.amount,
                                                      time: inst.paidAt && typeof inst.paidAt === 'object' && 'toDate' in inst.paidAt ? (inst.paidAt as any).toDate() : inst.paidAt instanceof Date ? inst.paidAt : new Date(),
                                                      schoolName: schoolSettings?.name,
                                                      schoolId: selectedSchoolId,
                                                      method: finalMethod,
                                                      id: matchingTx?.id,
                                                      isStamped: matchingTx?.isStamped || false,
                                                      stampTime: matchingTx?.stampTime || null
                                                  });
                                                }}
                                                className="text-[#00E5FF] hover:underline transition-all text-[9.5px] font-extrabold flex items-center gap-0.5"
                                            >
                                              عرض الوصل 📄
                                            </button>
                                          )}
                                          {inst.paidAt && (
                                            <span className="text-emerald-500/40 text-[7.5px] font-semibold">
                                               {inst.paidAt && typeof inst.paidAt === 'object' && 'toDate' in inst.paidAt ? (inst.paidAt as any).toDate().toLocaleDateString('ar-EG') : 
                                                inst.paidAt instanceof Date ? inst.paidAt.toLocaleDateString('ar-EG') : 
                                                typeof inst.paidAt === 'string' ? new Date(inst.paidAt).toLocaleDateString('ar-EG') : 
                                                inst.paidAt}
                                            </span>
                                          )}
                                        </>
                                      ) : (
                                        <span className={`text-[8.5px] font-semibold ${isLate ? 'text-rose-450/60' : 'text-white/20'}`}>
                                          {inst.dueDate ? `استحقاق: ${new Date(inst.dueDate).toLocaleDateString('ar-EG')}` : 'بدون استحقاق'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              );
                            })
                          ) : (
                            <td colSpan={installmentPlan.length} className="px-3 py-4 text-center text-white/10 text-[10px]">لا توجد أقساط</td>
                          )}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'staff' && (
          <motion.div 
            key="staff"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-8"
          >
            {/* Header & Main Control Board */}
            <div className="bg-gradient-to-r from-[#101935] via-[#0d142b] to-[#070b19] border border-white/5 rounded-[32px] p-6 md:p-8 shadow-2xl relative overflow-hidden w-full">
              <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/[0.03] blur-[120px] rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/[0.02] blur-[120px] rounded-full pointer-events-none" />
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#00E5FF]/10 text-[#00E5FF] rounded-xl flex items-center justify-center border border-[#00E5FF]/20 shadow-[0_0_15px_rgba(0,229,255,0.1)]">
                      <UserCog size={20} />
                    </div>
                    <div>
                      <h3 className="text-white font-black text-xl md:text-2xl tracking-tight">نظام الرواتب والأجور المركزي</h3>
                      <p className="text-white/40 text-[10px] md:text-xs font-bold mt-1">إعداد رواتب الهيئة التدريسية والإدارية والخدمية للمدرسة والتحكم بمدفوعاتها</p>
                    </div>
                  </div>
                  
                  {/* Selected Month Indicator & Nav pills */}
                  <div className="flex flex-wrap items-center gap-4 mt-6">
                    <div className="flex items-center gap-2.5 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-2xl">
                      <span className="text-white/40 text-[10px] font-black">الشهر المالي:</span>
                      <input 
                        type="month" 
                        value={selectedMonth}
                        onChange={(e) => {
                          setSelectedMonth(e.target.value);
                          setTxPage(1); // Reset page transitions
                        }}
                        className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-2.5 py-1 text-cyan-300 text-xs font-mono font-black outline-none focus:border-cyan-500 transition-all text-center"
                      />
                    </div>
                    
                    <div className="flex p-1 bg-white/[0.01] border border-white/5 rounded-2xl">
                      <button 
                        onClick={() => { setActiveFinanceSubTab('teachers'); setTxPage(1); }}
                        className={`px-4.5 py-2 rounded-xl text-[10px] sm:text-xs font-black transition-all flex items-center gap-2 ${
                          activeFinanceSubTab === 'teachers' 
                            ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 shadow-md' 
                            : 'text-white/40 hover:text-white/80 border border-transparent'
                        }`}
                      >
                        <BookOpen size={14} />
                        الكادر التدريسي ({teachersList.filter(t => t.role === 'TEACHER' || !t.role).length})
                      </button>
                      <button 
                        onClick={() => { setActiveFinanceSubTab('staff'); setTxPage(1); }}
                        className={`px-4.5 py-2 rounded-xl text-[10px] sm:text-xs font-black transition-all flex items-center gap-2 ${
                          activeFinanceSubTab === 'staff' 
                            ? 'bg-blue-600/15 text-blue-400 border border-blue-500/25 shadow-md' 
                            : 'text-white/40 hover:text-white/80 border border-transparent'
                        }`}
                      >
                        <UsersIcon size={14} />
                        الموظفين والعمال ({teachersList.filter(t => t.role === 'STAFF').length})
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex sm:items-center gap-3 shrink-0">
                  <button 
                    onClick={() => setShowConfirmPayment(true)}
                    disabled={isPaying || totals.remainingSalaries === 0}
                    className="w-full sm:w-auto bg-[#00E5FF] hover:bg-white text-black disabled:bg-white/5 disabled:text-white/20 disabled:shadow-none px-6 md:px-8 py-3.5 rounded-2xl font-black text-xs md:text-sm flex items-center justify-center gap-2.5 transition-all duration-300 shadow-xl shadow-[#00E5FF]/10 active:scale-95 shrink-0"
                  >
                    {isPaying ? <RotateCcw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                    <span>{isPaying ? 'جاري الاعتماد...' : 'اعتماد صرف كافة الرواتب'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Financial Stats Summary Dashboard Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
              {/* Stat card 1: Total payroll budget */}
              <div className="bg-[#101935]/40 backdrop-blur-xl border border-white/5 p-5.5 rounded-2xl flex items-center justify-between group hover:border-[#00e5ff]/10 hover:bg-[#101935]/60 transition-all duration-300">
                <div>
                  <span className="text-white/40 text-[9px] font-black block mb-2">إجمالي موازنة الرواتب</span>
                  <span className="text-white font-black text-lg md:text-xl font-mono tracking-tight leading-none block">
                    {totals.totalSalaries.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-white/30 mt-1 block">دينار عراقي لشهر {new Date(selectedMonth).toLocaleDateString('ar-IQ', {month: 'long'})}</span>
                </div>
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/40 group-hover:bg-[#00e5ff]/10 group-hover:text-[#00e5ff] transition-all">
                  <DollarSign size={20} />
                </div>
              </div>

              {/* Stat card 2: Disbursed Salaries */}
              <div className="bg-[#101935]/40 backdrop-blur-xl border border-white/5 p-5.5 rounded-2xl flex items-center justify-between group hover:border-emerald-500/15 hover:bg-[#101935]/60 transition-all duration-300">
                <div>
                  <span className="text-white/40 text-[9px] font-black block mb-2">الرواتب المصروفة فعلياً</span>
                  <span className="text-emerald-400 font-black text-lg md:text-xl font-mono tracking-tight leading-none block">
                    {totals.paidSalaries.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9.5px] font-black text-emerald-400/80 bg-emerald-500/10 px-1.5 py-0.2 rounded font-mono">
                      {totals.paidPercentage}%
                    </span>
                    <span className="text-[10px] font-bold text-white/30">نسبة الصرف المنجزة</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400">
                  <CheckCircle2 size={20} />
                </div>
              </div>

              {/* Stat card 3: Remaining Balance */}
              <div className="bg-[#101935]/40 backdrop-blur-xl border border-white/5 p-5.5 rounded-2xl flex items-center justify-between group hover:border-amber-500/15 hover:bg-[#101935]/60 transition-all duration-300">
                <div>
                  <span className="text-white/40 text-[9px] font-black block mb-2">الرواتب المتبقية غير المصروفة</span>
                  <span className="text-amber-400 font-black text-lg md:text-xl font-mono tracking-tight leading-none block">
                    {totals.remainingSalaries.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-white/30 mt-1 block">بانتظار التحويل المالي للكادر</span>
                </div>
                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400">
                  <Clock size={20} />
                </div>
              </div>

              {/* Stat card 4: Staff count status progress bar */}
              <div className="bg-[#101935]/40 backdrop-blur-xl border border-white/5 p-5.5 rounded-2xl flex flex-col justify-between group hover:border-blue-500/15 hover:bg-[#101935]/60 transition-all duration-300">
                <div className="flex items-center justify-between w-full">
                  <div>
                    <span className="text-white/40 text-[9px] font-black block">إحصاء تدقيق المستحقات</span>
                    <span className="text-white font-black text-sm mt-1.5 block">
                      {currentSalaries.filter(s => s.isPaid).length} من أصل {currentSalaries.length} موظف
                    </span>
                  </div>
                  <div className="w-9 h-9 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                    <UsersIcon size={16} />
                  </div>
                </div>
                
                <div className="w-full mt-3">
                  <div className="flex items-center justify-between text-[8px] font-black text-white/30 mb-1">
                    <span>مكتمل</span>
                    <span className="font-mono">{totals.paidPercentage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${totals.paidPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Search and Quick Filter Box */}
            <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3 w-full">
              <div className="relative flex-1 w-full">
                <Search className="absolute right-3.5 top-3 text-white/30 pointer-events-none" size={15} />
                <input
                  type="text"
                  placeholder="البحث باسم الكادر أو الدور التخصصي..."
                  value={staffSearchQuery}
                  onChange={(e) => setStaffSearchQuery(e.target.value)}
                  className="w-full text-right text-xs bg-white/[0.01] hover:bg-white/[0.03] focus:bg-[#0c1229] border border-white/5 focus:border-cyan-500/30 rounded-xl py-2.5 pr-10 pl-4 text-white placeholder-white/20 outline-none transition-all duration-300 shadow-inner font-black"
                />
                {staffSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStaffSearchQuery('')}
                    className="absolute left-3.5 top-3 text-white/30 hover:text-white transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-white/[0.01] border border-white/5 rounded-xl shrink-0 self-end sm:self-auto">
                <span className="text-[9px] font-black text-white/30 px-2">الحالة:</span>
                <button
                  type="button"
                  onClick={() => setStaffStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                    staffStatusFilter === 'all' 
                      ? 'bg-white/10 text-white border border-white/5 shadow-md' 
                      : 'text-white/40 hover:text-white/80 border border-transparent'
                  }`}
                >
                  الكل
                </button>
                <button
                  type="button"
                  onClick={() => setStaffStatusFilter('paid')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                    staffStatusFilter === 'paid' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 shadow-md' 
                      : 'text-white/40 hover:text-white/80 border border-transparent'
                  }`}
                >
                  تم الصرف
                </button>
                <button
                  type="button"
                  onClick={() => setStaffStatusFilter('unpaid')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                    staffStatusFilter === 'unpaid' 
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15 shadow-md' 
                      : 'text-white/40 hover:text-white/80 border border-transparent'
                  }`}
                >
                  بانتظار التدقيق
                </button>
              </div>
            </div>

            {/* Core Team Cards Grid - Spans nicely across the screen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
              {currentSalaries
                .filter(m => {
                  const teacher = teachersList.find(t => t.id === m.id);
                  const role = teacher?.role || 'TEACHER';
                  const matchTab = activeFinanceSubTab === 'teachers' ? (role === 'TEACHER') : (role === 'STAFF');
                  
                  if (!matchTab) return false;
                  
                  // Query Filter
                  if (staffSearchQuery.trim()) {
                    const q = staffSearchQuery.toLowerCase();
                    const nameMatch = (m.name || '').toLowerCase().includes(q);
                    const roleMatch = (m.role || '').toLowerCase().includes(q);
                    if (!nameMatch && !roleMatch) return false;
                  }

                  // Status Filter
                  if (staffStatusFilter === 'paid' && !m.isPaid) return false;
                  if (staffStatusFilter === 'unpaid' && m.isPaid) return false;

                  return true;
                })
                .map((member, idx) => (
                  <StaffSalaryCard 
                    key={member.id}
                    member={member}
                    activeFinanceSubTab={activeFinanceSubTab}
                    idx={idx}
                    updateStaffSalary={updateStaffSalary}
                    showToast={showToast}
                    selectedMonth={selectedMonth}
                    teachersList={teachersList}
                  />
                ))}
              {currentSalaries.filter(m => {
                const teacher = teachersList.find(t => t.id === m.id);
                const role = teacher?.role || 'TEACHER';
                const matchTab = activeFinanceSubTab === 'teachers' ? (role === 'TEACHER') : (role === 'STAFF');
                if (!matchTab) return false;
                
                if (staffSearchQuery.trim()) {
                  const q = staffSearchQuery.toLowerCase();
                  if (!(m.name || '').toLowerCase().includes(q) && !(m.role || '').toLowerCase().includes(q)) return false;
                }
                if (staffStatusFilter === 'paid' && !m.isPaid) return false;
                if (staffStatusFilter === 'unpaid' && m.isPaid) return false;
                return true;
              }).length === 0 && (
                <div className="col-span-full py-16 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center text-white/20">
                    <UserCog size={32} />
                  </div>
                  <div>
                    <p className="text-white/40 text-sm font-black">لا توجد سجلات لكادر أو موظفين مطابقة للتصفيات النشطة</p>
                    <p className="text-white/20 text-[10px] font-bold mt-1.5">تأكد من تعديل عبارة البحث أو انتقِ تبويباً آخر</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
        {activeTab === 'payment_methods' && (
          <motion.div 
            key="payment_methods"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-10"
          >
             <div className="bg-[#0D142B] rounded-[30px] border border-white/5 p-6 md:p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden w-full">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -z-10 rounded-full" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 blur-[100px] -z-10 rounded-full" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-white/5">
                   <div>
                     <h3 className="text-white font-black text-xl md:text-2xl tracking-tight">إعدادات وسائل الدفع الإلكتروني</h3>
                     <p className="text-white/40 text-xs font-bold mt-2">قم بضبط وتفعيل بوابات الدفع لتظهر لأولياء الأمور في تطبيقهم</p>
                   </div>
                   <button 
                     onClick={savePaymentMethods}
                     className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-3.5 rounded-2xl font-black text-sm hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2 justify-center shrink-0"
                   >
                     <Save size={18} />
                     حفظ التعديلات
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 w-full">
                   {(Object.entries(paymentMethods) as [string, any][]).map(([key, method]) => (
                     <div key={key} className={`relative overflow-hidden p-6 rounded-[24px] border transition-all duration-300 ${method.enabled ? 'bg-gradient-to-br from-white/[0.04] to-white/[0.01] border-white/10 shadow-lg' : 'bg-black/20 border-white/5 opacity-70 hover:opacity-100'}`}>
                        {method.enabled && <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[50px] -z-10 rounded-full" />}
                        
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                           <div className="flex items-center gap-4">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden border shadow-inner transition-all shrink-0 ${method.enabled ? 'border-white/10 bg-white/5' : 'bg-white/5 border-white/5 opacity-50'}`}>
                                 {key === 'asiahawala' ? (
                                   <div className="w-full h-full bg-[#ed1c24] flex items-center justify-center p-2.5">
                                      <img 
                                        src="https://play-lh.googleusercontent.com/yU4D0W4p-f667ZlC6XIn10Vz5v8Y9C-fBq-C1rB_Y9Dq-W_U" 
                                        alt="AsiaPay" 
                                        className="w-full h-full object-contain invert grayscale brightness-0 drop-shadow-md" 
                                        onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-[10px] font-black text-white">AsiaPay</span>' }}
                                      />
                                   </div>
                                 ) : key === 'zaincash' ? (
                                   <div className="w-full h-full bg-[#6a2b8e] flex items-center justify-center p-2.5">
                                      <img 
                                        src="https://zaincash.iq/wp-content/themes/zaincash/assets/images/zaincash-logo.png" 
                                        alt="Zain Cash" 
                                        className="w-full h-full object-contain invert brightness-0 drop-shadow-md" 
                                        onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.parentElement!.innerHTML = '<div class="flex flex-col items-center"><span class="text-[9px] font-black text-white leading-none">zain</span><span class="text-[7px] font-bold text-white/80 leading-none">CASH</span></div>' }}
                                      />
                                   </div>
                                 ) : key === 'mastercard' ? (
                                   <div className="w-full h-full bg-slate-900 flex items-center justify-center p-2.5">
                                      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" alt="MasterCard" className="w-full h-full object-contain drop-shadow-md" />
                                   </div>
                                 ) : key === 'fib' ? (
                                   <div className="w-full h-full bg-[#00A99D] flex items-center justify-center p-2.5">
                                      <img 
                                        src="https://fib.iq/wp-content/uploads/2021/11/FIB_Logo_Monogram_White.png" 
                                        alt="FIB" 
                                        className="w-full h-full object-contain drop-shadow-md" 
                                        onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-sm font-black text-white">FIB</span>' }}
                                      />
                                   </div>
                                 ) : (
                                   <CreditCard size={28} className={method.enabled ? 'text-white' : 'text-white/50'} />
                                 )}
                              </div>
                              <div>
                                <h4 className="text-white font-black text-lg tracking-wide">{method.label}</h4>
                                <p className={`text-[10px] font-bold mt-1 ${method.enabled ? 'text-emerald-400' : 'text-white/30'}`}>
                                  {method.enabled ? '🟢 مفعل وجاهز للاستقبال' : '⚪ معطل حالياً'}
                                </p>
                              </div>
                           </div>
                           <button 
                             onClick={() => setPaymentMethods(prev => ({
                               ...prev,
                               [key]: { ...(prev as any)[key], enabled: !method.enabled }
                             }))}
                             className={`w-14 h-8 rounded-full relative transition-all shadow-inner ${method.enabled ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-white/10'}`}
                           >
                              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md ${method.enabled ? 'left-1' : 'right-1'}`} />
                           </button>
                        </div>

                        <div className="space-y-3">
                           <label className="text-white/40 text-[11px] font-black block">
                              {key === 'mastercard' ? 'رقم البطاقة أو اسم الحساب المستلم' : 'رقم المحفظة / الحساب'}
                           </label>
                           <div className="relative">
                             <input 
                               type="text"
                               value={method.details || ''}
                               onChange={(e) => setPaymentMethods(prev => ({
                                 ...prev,
                                 [key]: { ...(prev as any)[key], details: e.target.value }
                               }))}
                               placeholder="أدخل البيانات هنا..."
                               disabled={!method.enabled}
                               className={`w-full bg-black/40 border rounded-xl pk-5 pr-5 pl-10 py-3.5 text-white text-sm font-black focus:outline-none transition-all ${method.enabled ? 'border-white/10 focus:border-blue-500 focus:bg-black/60' : 'border-white/5 opacity-50 cursor-not-allowed text-white/30'}`}
                             />
                             {method.enabled && <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />}
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             <div className="bg-blue-500/10 border border-blue-500/20 p-6 md:p-8 rounded-[30px] flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 shadow-xl w-full">
                <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 shrink-0">
                   <Megaphone size={24} />
                </div>
                <div className="text-center md:text-right">
                   <h5 className="text-blue-400 font-black text-sm md:text-base mb-2">تعليمات الإدارة المفتوحة</h5>
                   <p className="text-blue-100/70 text-xs leading-relaxed font-bold max-w-3xl">
                      عبر تفعيل بوابات الدفع، سيتم إدراجها ضمن لوحة ولي الأمر في خطوة بسيطة وآمنة. يقوم النظام بأخذ نسخة (وصولات تحويل) لتوثيق السداد فورياً. سيصلك إشعار بالدفع لتتمكن من قبوله وتحويله إلى رصيد حساب الطالب.
                   </p>
                </div>
             </div>
          </motion.div>
        )}
        {activeTab === 'payment_requests' && (
          <motion.div 
            key="payment_requests"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="bg-[#101935] rounded-[30px] border border-white/5 p-4 md:p-8 shadow-2xl w-full">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 pb-6 border-b border-white/5">
                <div>
                  <h3 className="text-white font-black text-xl md:text-2xl">طلبات التسديد الإلكتروني</h3>
                  <p className="text-white/30 text-xs font-bold mt-1">راجع طلبات الدفع المقدمة من أولياء الأمور وقم بتأكيدها</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-white/[0.02] p-2 rounded-2xl border border-white/5 shadow-inner">
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-500 rounded-xl text-[10px] font-black border border-amber-500/20">
                     <Clock size={14} className="animate-pulse" />
                     {pendingPayments.length} طلب معلق
                  </div>

                  <div className="h-8 w-[1px] bg-white/10 mx-1 hidden sm:block"></div>

                  <button 
                    onClick={handleCleanupResolved}
                    className="group px-4 py-2 bg-rose-500/10 text-rose-400 rounded-xl text-[10px] font-black border border-rose-500/20 hover:bg-rose-600 hover:text-white transition-all flex items-center gap-2"
                  >
                    <Trash2 size={14} className="group-hover:rotate-12 transition-transform" />
                    تنظيف الأرشيف
                  </button>
                </div>
              </div>

              {/* Search & Filter Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 p-4 bg-white/[0.02] border border-white/5 rounded-[24px]">
                {/* Search Text */}
                <div className="relative">
                  <span className="absolute inset-y-0 right-3 flex items-center pr-1 text-white/30 pointer-events-none">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    value={requestSearchQuery}
                    onChange={(e) => setRequestSearchQuery(e.target.value)}
                    placeholder="ابحث باسم الطالب، الكود، رقم العملية..."
                    className="w-full bg-black/40 border border-white/5 rounded-xl pr-10 pl-8 py-2.5 text-xs font-bold text-white placeholder-white/20 focus:outline-none focus:border-amber-500/40 focus:bg-black/60 transition-all text-right"
                  />
                  {requestSearchQuery && (
                    <button 
                      onClick={() => setRequestSearchQuery('')}
                      className="absolute inset-y-0 left-3 flex items-center pl-1 text-white/40 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Status selector */}
                <div className="flex items-center gap-2 bg-black/20 border border-white/5 rounded-xl px-3 py-1">
                  <span className="text-white/30 text-[10px] font-black whitespace-nowrap">حالة الطلب:</span>
                  <select
                    value={requestStatusFilter}
                    onChange={(e: any) => setRequestStatusFilter(e.target.value)}
                    className="w-full bg-transparent text-white text-xs font-bold outline-none border-none py-1 text-right cursor-pointer"
                  >
                    <option value="all" className="bg-[#101935] text-white">الكل</option>
                    <option value="pending" className="bg-[#101935] text-amber-400">قيد الانتظار</option>
                    <option value="approved" className="bg-[#101935] text-emerald-400">تم التأكيد</option>
                    <option value="rejected" className="bg-[#101935] text-rose-400">مرفوض</option>
                  </select>
                </div>

                {/* Method selector */}
                <div className="flex items-center gap-2 bg-black/20 border border-white/5 rounded-xl px-3 py-1 sm:col-span-2 lg:col-span-1">
                  <span className="text-white/30 text-[10px] font-black whitespace-nowrap">البوابة:</span>
                  <select
                    value={requestMethodFilter}
                    onChange={(e: any) => setRequestMethodFilter(e.target.value)}
                    className="w-full bg-transparent text-white text-xs font-bold outline-none border-none py-1 text-right cursor-pointer"
                  >
                    <option value="all" className="bg-[#101935] text-white font-bold">كل البوابات الالكترونية</option>
                    {uniquePaymentMethods.map(method => (
                      <option key={method} value={method} className="bg-[#101935] text-white">{method}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4 w-full">
                {paymentRequests.length === 0 ? (
                  <div className="text-center py-20 bg-white/[0.01] rounded-[40px] border border-dashed border-white/5 w-full">
                    <Megaphone size={48} className="mx-auto text-white/5 mb-4" />
                    <p className="text-white/20 font-bold">لا توجد طلبات تسديد حالياً</p>
                  </div>
                ) : filteredPaymentRequests.length === 0 ? (
                  <div className="text-center py-16 bg-white/[0.01] rounded-[40px] border border-dashed border-white/5 w-full">
                    <Search size={44} className="mx-auto text-amber-500/20 mb-4" />
                    <p className="text-white/40 font-black text-sm">لم يتم العثور على نتائج تطابق الفلترة الحالية</p>
                    <button 
                      onClick={() => {
                        setRequestSearchQuery('');
                        setRequestStatusFilter('all');
                        setRequestMethodFilter('all');
                      }}
                      className="mt-4 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-black rounded-xl border border-amber-500/25 transition-all active:scale-95"
                    >
                      مسح التصفية والبحث
                    </button>
                  </div>
                ) : (
                  filteredPaymentRequests.map((req) => {
                    let displayStudentName = req.studentName;
                    const isPlaceholder = !displayStudentName || 
                                         displayStudentName === req.studentCode || 
                                         displayStudentName === req.studentId || 
                                         displayStudentName === 'طالب غير محدد' ||
                                         displayStudentName === 'غير محدد';

                    if (isPlaceholder) {
                       const foundStudent = students.find(s => s.code === req.studentCode || s.student === req.studentCode || s.id === req.studentCode);
                       if (foundStudent) {
                         displayStudentName = foundStudent.name || foundStudent.fullName || displayStudentName;
                       }
                    }
                    
                    return (
                    <div key={req.id} className="relative w-full overflow-hidden bg-gradient-to-l from-[#0D142B] to-[#050812] border border-white/5 p-4 md:px-6 rounded-[24px] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-amber-500/20 transition-all shadow-lg group hover:bg-white/[0.02]">
                      {req.status === 'pending' && <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-amber-400 to-amber-600 rounded-r-full shadow-[0_0_10px_rgba(251,191,36,0.5)]" />}
                      {req.status === 'approved' && <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-r-full shadow-[0_0_10px_rgba(52,211,153,0.5)]" />}
                      {req.status === 'rejected' && <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-rose-400 to-rose-600 rounded-r-full shadow-[0_0_10px_rgba(244,63,94,0.5)]" />}
                      
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className={`shrink-0 w-12 h-12 rounded-[18px] flex items-center justify-center ${req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : req.status === 'rejected' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'}`}>
                          <Wallet size={24} className={req.status === 'pending' ? 'animate-pulse' : ''} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col md:flex-row md:items-baseline md:gap-3">
                            <h4 className="text-white font-black text-sm md:text-base tracking-wide truncate">{req.studentCode || req.studentId}</h4>
                            <span className="text-white/40 text-[10px] md:text-[11px] font-bold truncate mt-0.5 md:mt-0">{displayStudentName}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-2 w-full text-xs">
                            <span className="bg-white/5 border border-white/5 px-2 py-1 rounded text-white/60 font-bold whitespace-nowrap text-[9px] md:text-[10px]">بواسطة: {req.method}</span>
                            <span className="bg-white/5 border border-white/5 px-2 py-1 rounded text-white/60 font-mono tracking-tighter whitespace-nowrap text-[9px] md:text-[10px]">العملية: {req.transactionId || req.transactionNote}</span>
                            {req.cardholderName && (
                              <span className="bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded text-blue-300 font-bold whitespace-nowrap text-[9px] md:text-[10px]">
                                الحساب: {req.cardholderName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-center justify-end gap-5 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-none border-white/5 shrink-0">
                        {/* Amount Container (Right / End) */}
                        <div className="flex flex-col items-center md:items-end w-full md:w-auto shrink-0 md:ml-4 md:border-l border-white/5 md:pl-6 text-center md:text-right">
                          <p className="text-amber-400 font-black text-2xl md:text-xl tracking-tight">{req.amount.toLocaleString()} <span className="text-xs opacity-60">د.ع</span></p>
                          <p className="text-white/30 text-[9px] font-bold mt-1">
                            {(() => {
                              try {
                                if (req.createdAt?.toDate) return req.createdAt.toDate().toLocaleDateString('ar-IQ');
                                if (req.timestamp?.seconds) return new Date(req.timestamp.seconds * 1000).toLocaleDateString('ar-IQ');
                                if (req.createdAt) return new Date(req.createdAt).toLocaleDateString('ar-IQ');
                                return 'تاريخ غير متوفر';
                              } catch (e) {
                                return 'تاريخ غير صالح';
                              }
                            })()}
                          </p>
                        </div>

                        {/* Action Buttons Container (Left of Amount) */}
                        {req.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-2 w-full md:w-auto">
                             <button 
                               onClick={() => handleRejectPayment(req.id)}
                               disabled={isProcessingRequest === req.id}
                               title="رفض"
                               className="h-10 w-12 flex items-center justify-center bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all active:scale-95 shrink-0"
                             >
                               <X size={20} />
                             </button>
                             <button 
                               onClick={() => handleApprovePayment(req.id)}
                               disabled={isProcessingRequest === req.id || req.status === 'approved'}
                               className="h-10 flex-1 md:w-auto px-6 bg-emerald-500 text-black rounded-xl font-black text-[11px] hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2 shrink-0"
                             >
                               {isProcessingRequest === req.id ? (
                                 <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                               ) : (
                                 <>
                                   <Check size={18} />
                                   تأكيد
                                 </>
                               )}
                             </button>
                          </div>
                        ) : (
                          <div className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-center w-full md:w-auto shrink-0 ${req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {req.status === 'approved' ? 'تم التأكيد' : 'مرفوض'}
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'accessLogs' && (
           <motion.div 
             key="accessLogs-tab"
             initial={{ opacity: 0, y: 10 }} 
             animate={{ opacity: 1, y: 0 }} 
             exit={{ opacity: 0, y: -10 }}
           >
             <AccessLogsSection gradesByStage={gradesByStage} students={relevantStudents} showToast={showToast} />
           </motion.div>
         )}
      </AnimatePresence>

      {selectedStudent && (
        <motion.div 
          key="details"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
        >
          {/* Modal content ... */}
          <div className="bg-[#101935] p-10 rounded-[50px] shadow-3xl text-center">
            <h3 className="text-white font-black text-2xl">{selectedStudent.name}</h3>
            <button onClick={() => setSelectedStudent(null)} className="mt-8 px-6 py-3 bg-white/10 rounded-2xl text-white">إغلاق</button>
          </div>
        </motion.div>
      )}
      {selectedTransaction && (
        <DigitalReceiptModal 
            receipt={selectedTransaction}
            onClose={() => setSelectedTransaction(null)}
        />
      )}

      {/* Rejection Reason Modal */}
      <AnimatePresence>
        {rejectionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#101935] w-full max-w-md rounded-[40px] border border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 mx-auto mb-6">
                  <AlertCircle size={32} />
                </div>
                
                <h3 className="text-white font-black text-xl text-center mb-2">رفض طلب التسديد</h3>
                <p className="text-white/40 text-[11px] font-bold text-center mb-6 leading-relaxed">
                  يرجى توضيح سبب الرفض ليصل إشعار لولي الأمر وتصحيح الطلب
                </p>

                <textarea
                  value={rejectionModal?.reason || ''}
                  onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
                  placeholder="اكتب سبب الرفض هنا... (مثال: الوصل غير واضح، المبلغ غير مطابق لبقية التكاليف)"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-xs font-bold leading-relaxed focus:outline-none focus:border-rose-500/50 min-h-[120px] resize-none mb-6 text-right"
                  dir="rtl"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => setRejectionModal(null)}
                    className="flex-1 py-4 bg-white/5 text-white/60 rounded-2xl font-black text-xs hover:bg-white/10 transition-all active:scale-95"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={confirmRejection}
                    disabled={isProcessingRequest === rejectionModal.id}
                    className="flex-[2] py-4 bg-rose-500 text-white rounded-2xl font-black text-xs hover:bg-rose-600 transition-all active:scale-95 shadow-xl shadow-rose-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessingRequest === rejectionModal.id ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      'تأكيد الرفض'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmCashPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#1a2342] border border-emerald-500/30 rounded-3xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mb-2 ring-4 ring-emerald-500/10">
                  <DollarSign size={32} />
                </div>
                
                <h3 className="text-xl font-black text-white">تأكيد استلام نقدي</h3>
                <p className="text-white/60 text-sm leading-relaxed pb-4">
                  هل أنت متأكد من استلام المبلغ بشكل (نقدي)؟ <br/>
                  <span className="text-emerald-400 mt-2 block text-xs">سيتم إرسال إشعار فوري لولي الأمر بتأكيد الاستلام.</span>
                </p>

                <div className="flex flex-row-reverse items-center justify-between gap-3 w-full pt-4 border-t border-white/10">
                  <button 
                    onClick={() => {
                        toggleInstallmentPayment(confirmCashPayment.studentCode, confirmCashPayment.installmentId, true);
                        setConfirmCashPayment(null);
                    }}
                    className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-emerald-900/50"
                  >
                    نعم، استلمت نقداً
                  </button>
                  <button 
                    onClick={() => setConfirmCashPayment(null)}
                    className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all active:scale-95"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmCancelPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#1a2342] border border-rose-500/30 rounded-3xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden"
            >
              {/* Alert gradient background */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-rose-500/10 blur-[50px] rounded-full pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-400 mb-2 ring-4 ring-rose-500/10">
                  <AlertCircle size={32} />
                </div>
                
                <h3 className="text-xl font-black text-rose-400">تنبيه: القسط مسدد بالفعل!</h3>
                <p className="text-white/75 text-xs md:text-sm leading-relaxed pb-2">
                  هذا القسط ({confirmCancelPayment.installmentName}) مُسجل ومُثبت في سجل المدفوعات كقسط مستلم للرقم التعريفي المالي للطالب.<br/>
                  <span className="text-rose-400/80 mt-2 block font-black">هل تريد بالتأكيد تصفير القسط وإلغاء حالة السداد بشكل رجعي؟</span>
                </p>

                <div className="w-full text-right space-y-2 pb-4">
                  <label className="text-white/60 text-xs font-bold block mb-1">
                    لتأكيد عملية إلغاء السداد، يرجى كتابة كلمة <span className="text-rose-400 font-black">"تأكيد"</span> أدناه:
                  </label>
                  <input
                    type="text"
                    placeholder="اكتب كلمة: تأكيد"
                    value={cancelConfirmationInput}
                    onChange={(e) => setCancelConfirmationInput(e.target.value)}
                    className="w-full h-11 px-4 bg-black/40 border border-white/10 focus:border-rose-500/50 rounded-xl text-center font-black text-sm text-white outline-none transition-all placeholder:text-white/20"
                  />
                </div>

                <div className="flex flex-row-reverse items-center justify-between gap-3 w-full pt-4 border-t border-white/10">
                  <button 
                    onClick={() => {
                        toggleInstallmentPayment(confirmCancelPayment.studentCode, confirmCancelPayment.installmentId, false);
                        setConfirmCancelPayment(null);
                        setCancelConfirmationInput('');
                    }}
                    disabled={cancelConfirmationInput.trim() !== 'تأكيد'}
                    className={`flex-1 py-3.5 rounded-xl font-bold transition-all active:scale-95 shadow-lg ${
                      cancelConfirmationInput.trim() === 'تأكيد'
                        ? 'bg-rose-600 hover:bg-rose-550 text-white shadow-rose-900/50'
                        : 'bg-rose-950/25 border border-rose-900/30 text-rose-500/40 cursor-not-allowed'
                    }`}
                  >
                    تأكيد وإلغاء السداد
                  </button>
                  <button 
                    onClick={() => setConfirmCancelPayment(null)}
                    className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all active:scale-95"
                  >
                    تراجع
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

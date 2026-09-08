import React, { useState, useMemo, useEffect } from 'react';
import { copyToClipboard } from '../utils/clipboard';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  CreditCard, 
  History, 
  ChevronLeft, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Download,
  Share2,
  ShieldCheck,
  QrCode,
  Wallet,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  Eye,
  Info,
  Copy,
  Check,
  MessageCircle
} from 'lucide-react';
import { createPaymentRequest, getStudentFinanceProfile } from '../services/financeService';
import { academicService } from '../services/academicService';
import { DigitalReceiptModal } from './DigitalReceiptModal';
import { WatermarkLayer } from './WatermarkLayer';
import { calculateStudentFinancials } from '../utils/studentUtils';
import { BerqCharacter } from './BerqCharacterManager';
import { realtimeManager } from '../lib/realtimeManager';
import { getOfficialSchoolLogoUrl } from '../lib/constants';
import { FinanceSectionSkeleton } from './shared/ShimmerSkeleton';

interface ParentPaymentViewProps {
  studentCode: string;
  senderName: string;
  studentData?: any;
  tuitionFee?: number;
  discountRates?: Record<string, number>;
  paymentSettings?: any;
  adminWhatsapp?: string;
  initialInstallmentId?: string;
  onBack: () => void;
}

export const ParentPaymentView: React.FC<ParentPaymentViewProps> = ({ 
  studentCode, 
  senderName, 
  studentData,
  tuitionFee = 0,
  discountRates = {},
  paymentSettings,
  adminWhatsapp,
  initialInstallmentId,
  onBack 
}) => {
  const [step, setStep] = useState<'info' | 'payment' | 'receipt' | 'success'>('info');
  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [method, setMethod] = useState<string>('AsiaPay');
  const [financeData, setFinanceData] = useState<any>(null);
  const [schoolSettings, setSchoolSettings] = useState<any>(null);
  const [loading, setLoading] = useState(!studentData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionDate, setTransactionDate] = useState<string>('');
  const [expandedReason, setExpandedReason] = useState<string | null>(null);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string | null>(initialInstallmentId || null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  const handleCopy = async (text: string, id: string) => {
    await copyToClipboard(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const financials = useMemo(() => {
    const rawStu = {
      ...(studentData || {}),
      ...(financeData || {}),
      discountRate: studentData?.discountRate ?? financeData?.discountRate,
      discountType: studentData?.discountType ?? financeData?.discountType,
      status: studentData?.status ?? financeData?.status,
      totalAmount: studentData?.totalAmount ?? financeData?.totalAmount
    };
    
    // Resolve discountRates
    const mergedDiscountRates = {
      SIBLINGS: 15,
      EARLY_REGISTRATION: 10,
      ORPHAN: 50,
      STAFF: 50,
      ...(schoolSettings?.discountRates || {}),
      ...(discountRates || {})
    };

    // Resolve base fee
    let baseTuition = Number(tuitionFee) || 0;
    if (baseTuition === 0 && schoolSettings) {
      const grade = rawStu.grade;
      const byGrade = schoolSettings.tuitionFeesByGrade || {};
      if (grade && byGrade[grade] !== undefined) {
        baseTuition = Number(byGrade[grade]);
      } else if (schoolSettings.tuitionFee) {
        baseTuition = Number(schoolSettings.tuitionFee);
      }
    }

    return calculateStudentFinancials(rawStu, baseTuition, mergedDiscountRates);
  }, [financeData, studentData, schoolSettings, tuitionFee, discountRates]);

  // Handle initial installment selection and amount fill
  useEffect(() => {
    if (initialInstallmentId) {
        let installments = financeData?.installments || studentData?.finance?.installments || studentData?.installments || [];
        const discountFactor = financials.discountFactor || ((100 - (financials.discountRate || 0)) / 100);
        
        // Handle template pre-selection
        if (initialInstallmentId.startsWith('template_') && schoolSettings?.installmentPlan) {
            const templateSum = schoolSettings.installmentPlan.reduce((sum: number, inst: any) => sum + (Number(inst.amount) || 0), 0);
            const scaleFactor = templateSum > 0 ? (financials.requiredAmount / templateSum) : 1;
            
            const index = parseInt(initialInstallmentId.replace('template_', ''));
            const instTemplate = schoolSettings.installmentPlan[index];
            if (instTemplate) {
                const calculatedAmount = Math.round((Number(instTemplate.amount) || 0) * scaleFactor);
                setAmount(calculatedAmount.toString());
                return;
            }
        }

        if (installments.length > 0) {
            const inst = installments.find((i: any) => i.id === initialInstallmentId || (installments.indexOf(i).toString() === initialInstallmentId));
            if (inst) {
                const rawSum = installments.reduce((sum: number, i: any) => sum + (Number(i.amount) || 0), 0);
                let instAmt = Number(inst.amount) || 0;
                if (financials.discountRate > 0 && Math.abs(rawSum - financials.requiredAmount) > 10 && rawSum > 0) {
                    instAmt = Math.round(instAmt * (financials.requiredAmount / rawSum));
                } else if (financials.isInstallmentsAtGross) {
                    instAmt = Math.round(instAmt * discountFactor);
                }
                setAmount(instAmt.toString());
            }
        }
    }
  }, [initialInstallmentId, financeData, studentData, schoolSettings, financials]);


  // Financials calculation using shared utility for 100% accuracy
  const uniqueTransactions = useMemo(() => {
    if (!financeData?.transactions) return [];
    
    const paidInstallments = new Set(
      (financeData?.installments || [])
        .filter((i: any) => i.paid || i.status === 'paid' || i.status === 'completed' || i.status === 'verified')
        .map((i: any) => i.name?.trim())
    );

    // Sort transactions so most recent (and completed) appear first
    const sortedTxns = [...financeData.transactions].sort((a: any, b: any) => {
       if (a.status === 'completed' && b.status !== 'completed') return -1;
       if (b.status === 'completed' && a.status !== 'completed') return 1;
       const bTime = new Date(a.date || a.timestamp || 0).getTime();
       const aTime = new Date(b.date || b.timestamp || 0).getTime();
       return aTime - bTime;
    });

    const finalTxns = [];
    
    for (const t of sortedTxns) {
      const note = typeof t.note === 'string' ? t.note.replace(/وصل رقمي\s*-\s*/, '').replace(/وصل رقمي/, '').trim() : '';
      const amount = Number(t.amount) || 0;
      const reqId = t.requestId || t.id;
      
      // CRITICAL: Ensure we don't show "completed" transactions for installments the admin marked as unpaid
      if (t.status === 'completed' && note !== '') {
          const matchingInst = (financeData?.installments || []).find((i:any) => i.name?.trim() === note);
          if (matchingInst && !paidInstallments.has(note)) {
              continue; // Skip because the installment is unpaid/cancelled
          }
      }
      
      let isDuplicate = false;
      for (let i = 0; i < finalTxns.length; i++) {
         const existing = finalTxns[i];
         const existingNote = typeof existing.note === 'string' ? existing.note.replace(/وصل رقمي\s*-\s*/, '').replace(/وصل رقمي/, '').trim() : '';
         
         if ((reqId && (existing.id === reqId || existing.requestId === reqId)) || 
             (t.id && existing.id === t.id) ||
             (existingNote === note && Number(existing.amount) === amount && note !== '')) {
             
             if (t.status === 'completed' && existing.status !== 'completed') {
                 finalTxns[i] = t; // overwrite
             }
             isDuplicate = true;
             break;
         }
      }
      
      if (!isDuplicate) {
        finalTxns.push(t);
      }
    }
    return finalTxns;
  }, [financeData?.transactions, financeData?.installments]);

  useEffect(() => {
    console.log("DEBUG: ParentPaymentView paymentSettings:", JSON.stringify(paymentSettings));
  }, [paymentSettings]);

  const getFormattedWhatsapp = (phone?: string) => {
    if (!phone) return '9647700000000';
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('00964')) return cleaned.replace('00964', '964');
    if (cleaned.startsWith('+964')) return cleaned.replace('+964', '964');
    if (cleaned.startsWith('0')) return '964' + cleaned.substring(1);
    if (cleaned.startsWith('964')) return cleaned;
    return cleaned.replace('+', ''); 
  };

  const availableMethods = useMemo(() => {
    // ParentPortal passes data.paymentMethods || data
    const settings = paymentSettings || {};
    
    const defaultMethods = [
      { id: 'asiahawala', name: 'آسيا حوالة', color: '#ed1c24' },
      { id: 'zaincash', name: 'زين كاش', color: '#ff0000' },
      { id: 'mastercard', name: 'ماستر كارد', color: '#f79e1b' },
      { id: 'fib', name: 'مصرف العراق الأول FIB', color: '#3b82f6' }
    ];

    const methods = defaultMethods
      .filter(m => {
        const methodData = settings[m.id];
        // If it's the new nested structure { enabled, details, label }
        if (methodData && typeof methodData === 'object' && methodData !== null) {
          return methodData.enabled === true;
        }
        
        // Backward compatibility / flattened structure
        const legacyKeys = [
          `${m.id}_enabled`,
          `${m.id.toLowerCase()}_enabled`,
          `${m.id}_active`,
          `${m.id.toLowerCase()}_active`,
          m.id,
          m.id.toLowerCase()
        ];
        
        return legacyKeys.some(key => {
          const val = settings[key];
          return val === true || val === 'true' || val === 1 || val === '1' || val === 'checked';
        });
      })
      .map(m => {
        const methodData = settings[m.id];
        let accountNumber = 'غير محدد';
        
        if (methodData && typeof methodData === 'object' && methodData !== null && methodData.details) {
          accountNumber = methodData.details;
        } else {
          accountNumber = settings[`${m.id}_account`] || settings[`${m.id.toLowerCase()}_account`] || 
                         settings[`${m.id}_number`] || settings[`${m.id.toLowerCase()}_number`] ||
                         settings[`${m.id}_details`] || 'غير محدد';
        }

        return {
          ...m,
          accountNumber
        };
      });
    
    return methods;
  }, [paymentSettings]);

  useEffect(() => {
    if (availableMethods.length > 0 && !availableMethods.find(m => m.id === method)) {
      setMethod(availableMethods[0].id);
    }
  }, [availableMethods, method]);

  const [imageError, setImageError] = useState(false);

  // Logo mapping logic (Official circular logo)
  const schoolLogo = useMemo(() => {
    return getOfficialSchoolLogoUrl(schoolSettings?.id || financeData?.schoolId || undefined, schoolSettings?.name || undefined);
  }, [schoolSettings, financeData?.schoolId]);

  useEffect(() => {
    if (!studentCode) return;

    const fetchFinanceData = async () => {
      try {
        const data = await getStudentFinanceProfile(studentCode);
        if (data) {
          // Map finance data to the structure expected by the UI
          setFinanceData({
            ...studentData,
            ...data.finance,
            discountRate: studentData?.discountRate ?? data.discountRate ?? data.finance?.discountRate,
            discountType: studentData?.discountType ?? data.discountType ?? data.finance?.discountType,
            status: studentData?.status ?? data.status,
            totalAmount: studentData?.totalAmount ?? data.totalAmount,
            transactions: data.transactions,
            pendingRequests: data.pendingRequests,
            schoolId: data.schoolId || studentData?.schoolId,
            studentName: data.studentName || studentData?.name
          });

          if (data.schoolId) {
             const settings = await academicService.getSchoolSettings(data.schoolId);
             if (settings) setSchoolSettings(settings);
          }
        }
      } catch (error: any) {
        if (error?.name === 'AbortError') return;
        console.warn("[ParentPaymentView] Transient issue fetching finance profile:", error?.message || error);
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceData();
    const interval = setInterval(fetchFinanceData, 30000); // Poll every 30 seconds
    
    // Subscribe to realtime updates for this student's data
    const unsubRealtime = realtimeManager.on('students', (event) => {
        // We could check if it's the right student, but fetching is safe enough
        fetchFinanceData();
    });
    
    const unsubTransactions = realtimeManager.on('student_transactions', () => {
        fetchFinanceData();
    });

    return () => {
       clearInterval(interval);
       unsubRealtime();
       unsubTransactions();
    };
  }, [studentCode]);

  const handleSubmitPayment = async () => {
    if (!amount || !transactionId) return;
    setIsSubmitting(true);

    try {
      const now = new Date();
      setTransactionDate(now.toISOString());
      
      const paymentData = {
        studentId: studentCode,
        studentName: studentData?.name || studentData?.fullName || financeData?.studentName || 'طالب غير محدد',
        senderName: senderName || studentData?.name || financeData?.studentName || 'ولي أمر',
        amount: Number(amount),
        transactionId,
        cardholderName,
        method,
        notes: `طلب تسديد من ${senderName || 'ولي أمر'}`,
        schoolId: studentData?.schoolId || financeData?.schoolId || null,
        installmentId: selectedInstallmentId
      };

      await createPaymentRequest(paymentData as any);
      
      setStep('success');
    } catch (error) {
      console.error('Payment error:', error);
      alert('حدث خطأ أثناء إرسال معلومات الدفع. يرجى المحاولة لاحقاً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async () => {
    const text = `وصل استلام مالي - ${schoolSettings?.name || 'بيرق'}\nالطالب: ${financeData?.studentName}\nالمبلغ: ${Number(amount).toLocaleString()} د.ع\nالمرجع: ${transactionId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'وصل استلام', text });
      } catch (e) {}
    }
  };

  const handleDownloadImage = () => {
    alert('جاري حفظ الوصل في معرض الصور الخاص بك...');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal p-6 max-w-md mx-auto space-y-6">
        <FinanceSectionSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen overflow-y-auto bg-charcoal text-white font-sans selection:bg-blue-500/30 no-scrollbar pb-24">
      <div className="max-w-md mx-auto p-6 md:p-8 space-y-8 pb-32">
        {/* Standardized Header Banner */}
        <div className="shrink-0 relative rounded-2xl overflow-hidden border border-white/5 bg-[#0D47A1] shadow-[0_10px_30px_rgba(13,71,161,0.3)] h-[105px] flex items-center">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a2342] via-[#0D47A1] to-[#0D47A1] opacity-90" />
          <div className="absolute top-0 left-0 w-36 h-36 bg-[#FFD600]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Bairaq Video Mascot on Left */}
          <div className="absolute left-0 top-0 bottom-0 h-full w-32 sm:w-36 md:w-40 z-10 overflow-hidden rounded-l-2xl flex items-center justify-center">
            <div className="absolute -left-4 -top-4 w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-amber-400/30 bg-amber-400/5 shadow-[0_0_15px_rgba(255,214,0,0.15)] animate-pulse" />
            <BerqCharacter
              pose="pose_finance_officer"
              glowColor="gold"
              className="w-full h-full object-cover relative z-10 scale-110"
            />
          </div>

          {/* Text Info */}
          <div className="relative z-10 flex-1 flex flex-col justify-center pr-6 pl-36 sm:pl-40 md:pl-44 py-2 select-none h-full text-right min-w-0">
            <h2 className="text-white text-base sm:text-lg md:text-xl font-black leading-tight drop-shadow-md truncate">
              المحفظة المالية والأقساط المدرسية 💳
            </h2>
            <div className="flex items-center gap-1 text-[#FFD600] font-bold text-xs sm:text-sm tracking-wide drop-shadow-sm mt-0.5 min-w-0">
              <span className="shrink-0 text-xs">🏛️</span>
              <span className="truncate">{schoolSettings?.name || 'ثانوية أوائل غماس الأهلية'}</span>
            </div>
            <div className="flex items-center gap-1 text-white/80 font-semibold text-[11px] sm:text-xs tracking-wide drop-shadow-sm mt-0.5 min-w-0">
              <span className="shrink-0 text-[10px]">⚡</span>
              <span className="truncate">إدارة وسداد الأقساط والوصولات الرسمية</span>
            </div>
          </div>

          {/* Return Button */}
          <button
            onClick={onBack}
            className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 transition-colors flex items-center justify-center text-white shrink-0 border border-white/10 shadow-lg"
            title="عودة"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Stats Card */}
        <div className="bg-[#101935] rounded-[32px] p-6 relative overflow-hidden group border border-white/5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-600/20 transition-all duration-500" />
          
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-400">
                <Wallet size={24} />
              </div>
              <div>
                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">مرحباً بك ولي امر {senderName.replace( /ولي أمر/g, '' ).trim()}</p>
                <h2 className="text-base font-black truncate max-w-[200px]">{financeData?.studentName}</h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div>
                <p className="text-[10px] text-white/40 font-bold mb-1">المبلغ المطلوب</p>
                <p className="text-lg font-black tabular-nums">
                  {financials.requiredAmount.toLocaleString()} <span className="text-[10px] text-white/20">د.ع</span>
                </p>
              </div>
              <div className="text-left">
                <p className="text-[10px] text-white/40 font-bold mb-1">المبلغ المدفوع</p>
                <p className="text-lg font-black text-emerald-400 tabular-nums">
                  {financials.paidAmount.toLocaleString()} <span className="text-[10px] text-emerald-400/20">د.ع</span>
                </p>
              </div>
            </div>

            <div className="mt-2 bg-white/5 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-rose-400" />
                <p className="text-[11px] font-black">المبلغ المتبقي</p>
              </div>
              <p className="text-base font-black text-rose-400">
                {financials.remainingAmount.toLocaleString()} د.ع
              </p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black flex items-center gap-2">
              <CreditCard size={18} className="text-blue-400" />
            إرسال معلومات الدفع
            </h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <label className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-2 block mr-2">اختر وسيلة الدفع</label>
              {availableMethods.map((m) => (
                <div
                  key={m.id}
                  className={`p-5 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                    method === m.id 
                    ? 'bg-blue-600/10 border-blue-500' 
                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                  onClick={() => setMethod(m.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden border shadow-sm transition-all ${method === m.id ? 'bg-white border-blue-500/30' : 'bg-white/10 border-white/10'}`}>
                      {m.id === 'asiahawala' ? (
                        <div className="w-full h-full bg-[#ed1c24] flex items-center justify-center p-1.5">
                          <img src="https://play-lh.googleusercontent.com/yU4D0W4p-f667ZlC6XIn10Vz5v8Y9C-fBq-C1rB_Y9Dq-W_U" alt="AsiaPay" className="w-full h-full object-contain invert grayscale brightness-0" onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-[8px] font-black text-white">AsiaPay</span>' }} />
                        </div>
                      ) : m.id === 'zaincash' ? (
                        <div className="w-full h-full bg-[#6a2b8e] flex items-center justify-center p-1.5">
                          <img src="https://zaincash.iq/wp-content/themes/zaincash/assets/images/zaincash-logo.png" alt="Zain Cash" className="w-full h-full object-contain brightness-0 invert" onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.parentElement!.innerHTML = '<div class="flex flex-col items-center"><span class="text-[8px] font-black text-white leading-none">zain</span><span class="text-[6px] font-bold text-white/80 leading-none">CASH</span></div>' }} />
                        </div>
                      ) : m.id === 'mastercard' ? (
                        <div className="w-full h-full bg-white flex items-center justify-center p-1.5">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" alt="MasterCard" className="w-full h-full object-contain" />
                        </div>
                      ) : m.id === 'fib' ? (
                        <div className="w-full h-full bg-[#00A99D] flex items-center justify-center p-2">
                           <img src="https://fib.iq/wp-content/uploads/2021/11/FIB_Logo_Monogram_White.png" alt="FIB" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-xs font-black text-white">FIB</span>' }} />
                        </div>
                      ) : (
                        <CreditCard size={20} />
                      )}
                    </div>
                    <div>
                      <p className="font-black text-sm text-white">{m.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-white/40 font-bold">{m.accountNumber}</p>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(m.accountNumber, m.id);
                          }}
                          className={`p-1 px-2.5 rounded-lg transition-all flex items-center gap-1.5 group/copy border shadow-sm ${
                            copiedId === m.id 
                            ? 'bg-emerald-500 border-emerald-400/50 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                            : 'bg-amber-400/10 border-amber-400/20 text-amber-400 hover:bg-amber-400 hover:text-black transition-all duration-300'
                          }`}
                        >
                          {copiedId === m.id ? (
                            <Check size={10} className="text-white" />
                          ) : (
                            <Copy size={10} className="opacity-60 group-hover/copy:opacity-100" />
                          )}
                          <span className="text-[9px] font-black uppercase">
                            {copiedId === m.id ? 'تم' : 'نسخ'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${method === m.id ? 'border-blue-500 bg-blue-600' : 'border-white/20'}`}>
                    {method === m.id && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-2 block mr-2">المبلغ المراد إرساله (د.ع)</label>
              <div className="relative">
                <input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="مثال: 250,000"
                  className="w-full h-16 bg-white/5 rounded-3xl px-6 font-black text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-white/10 placeholder:text-white/10 transition-all"
                />
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 font-black text-xs">IQD</div>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-2 block mr-2">رقم مرجع العملية / معرف الدفع</label>
              <div className="relative">
                <input 
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="أدخل الرقم الموجود في رسالة التأكيد"
                  className="w-full h-16 bg-white/5 rounded-3xl px-6 font-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-white/10 placeholder:text-white/10 transition-all"
                />
                <Info size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10" />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-2 block mr-2">اسم صاحب البطاقة/الحساب</label>
              <div className="relative">
                <input 
                  type="text"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  placeholder="أدخل الاسم الحقيقي لصاحب الحساب"
                  className="w-full h-16 bg-white/5 rounded-3xl px-6 font-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-white/10 placeholder:text-white/10 transition-all"
                />
                <Info size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10" />
              </div>
            </div>

            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex flex-col gap-3">
              <p className="text-[11px] text-emerald-400 font-black leading-relaxed text-center">
                ⚠️ إذا تعذر أخذ لقطة شاشة، يرجى استخدام زر "المشاركة" (Share) في تطبيق الدفع وإرسال التفاصيل مباشرة لواتساب الإدارة للتوثيق.
              </p>
              <a 
                href={`https://wa.me/${getFormattedWhatsapp(adminWhatsapp)}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-3 bg-emerald-500 text-black rounded-2xl flex items-center justify-center gap-2 font-black text-xs hover:bg-emerald-400 transition-all active:scale-95"
              >
                <MessageCircle size={16} />
                واتساب الإدارة
              </a>
            </div>

            <button 
              onClick={handleSubmitPayment}
              disabled={isSubmitting || !amount || !transactionId}
              className={`w-full h-18 rounded-[28px] font-black text-sm flex items-center justify-center gap-3 transition-all relative overflow-hidden ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'
              } bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/20`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  تأكيد وإرسال المعلومات
                  <ArrowUpRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* History Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black flex items-center gap-2">
              <History size={18} className="text-white/40" />
              سجل الدفعات الأخيرة
            </h3>
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{financeData?.transactions?.length || 0} Transactions</span>
          </div>

          <div className="space-y-3">
            {uniqueTransactions.map((txn: any) => (
              <div 
                key={txn.id}
                className="bg-white/5 rounded-3xl p-5 border border-white/5 hover:bg-white/10 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      txn.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                      txn.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-rose-500/20 text-rose-400'
                    }`}>
                      {txn.status === 'completed' ? <CheckCircle2 size={20} /> :
                       txn.status === 'pending' ? <Clock size={20} /> :
                       <AlertCircle size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">{txn.note?.replace('وصل رقمي - ', '') || 'وصل مالي'}</p>
                      <p className="text-[10px] text-white/40 font-bold">
                        {(() => {
                            const d = new Date(txn.date || txn.timestamp || 0);
                            return !isNaN(d.getTime()) ? `${d.getFullYear()}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')}` : 'غير متاح';
                        })()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                    txn.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    txn.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {txn.status === 'completed' ? 'مقبول' : 
                     txn.status === 'pending' ? 'قيد المراجعة' : 'مرفوض'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-[10px] text-white/40 font-bold">{Number(txn.amount).toLocaleString()} د.ع</span>
                  <button 
                    onClick={() => {
                      let dateVal = txn.date || txn.timestamp;
                      if (dateVal && typeof dateVal === 'object') {
                          if (dateVal.toDate) dateVal = dateVal.toDate();
                          else if (dateVal.seconds) dateVal = new Date(dateVal.seconds * 1000);
                      }
                      setSelectedReceipt({
                      adminName: txn.adminName || 'مدير النظام',
                      studentName: financeData.studentName,
                      studentId: studentCode,
                      amount: Number(txn.amount),
                      time: new Date(dateVal || 0),
                      schoolName: schoolSettings?.name,
                      schoolId: financeData?.schoolId,
                      installmentName: txn.note?.replace('وصل رقمي - ', ''),
                      isStamped: txn.isStamped,
                      stampTime: txn.stampTime,
                      method: txn.method
                    })}}
                    className="text-[10px] text-blue-400 font-black cursor-pointer"
                  >
                    عرض الوصل
                  </button>
                </div>
              </div>
            ))}
            {(!financeData?.transactions || financeData.transactions.length === 0) && (
              <div className="bg-[#101935] rounded-[28px] p-12 flex flex-col items-center justify-center gap-4 text-white/20 border border-dashed border-white/10">
                <History size={48} strokeWidth={1} />
                <p className="text-xs font-bold text-center">لا توجد سجلات دفع سابقة لعرضها</p>
              </div>
            )}
          </div>
        </div>

        {/* Receipt Step */}
        <DigitalReceiptModal 
            receipt={selectedReceipt} 
            onClose={() => setSelectedReceipt(null)}
            hideActions={true}
        />
        <AnimatePresence>
          {step === 'success' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0a0a0a]/95 backdrop-blur-xl"
            >
              <div className="w-full max-w-sm flex flex-col items-center justify-center text-center">
                 <div className="w-24 h-24 bg-emerald-500/10 border-2 border-emerald-500/20 text-emerald-400 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/20">
                    <CheckCircle2 size={48} />
                 </div>
                 <h2 className="text-2xl font-black text-white mb-3">تم إرسال المعلومات</h2>
                 <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-3xl mb-8">
                   <p className="text-emerald-400 text-xs leading-relaxed font-bold">
                     تم تسجيل معلومات التحويل بنجاح وهي قيد المراجعة حالياً.
                     <br/><br/>
                     <span className="text-white">لإكمال عملية التدقيق، يرجى إرسال لقطة شاشة (وصل الدفع) من التطبيق الذي قمت بالدفع من خلاله إلى إدارة المدرسة عبر واتساب.</span>
                   </p>
                 </div>

                 <a 
                    href={`https://wa.me/${getFormattedWhatsapp(adminWhatsapp)}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full h-16 bg-emerald-500 text-black rounded-3xl flex items-center justify-center gap-2 font-black text-sm hover:bg-emerald-400 transition-all active:scale-95 mb-4 shadow-xl shadow-emerald-500/20"
                  >
                    <MessageCircle size={22} />
                    إرسال لقطة الشاشة عبر واتساب
                  </a>
                  
                  <button 
                    onClick={() => { setStep('info'); setAmount(''); setTransactionId(''); onBack(); }}
                    className="w-full h-16 bg-white/5 text-white/50 hover:text-white hover:bg-white/10 rounded-3xl font-black text-sm transition-all"
                  >
                    العودة للمحفظة
                  </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};



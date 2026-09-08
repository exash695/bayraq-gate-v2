import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from '@/src/lib/firebase';
import { ShieldCheck, Calendar, Wallet, User, ShieldAlert, BadgeCheck } from 'lucide-react';
import { SCHOOLS_DATA, getOfficialSchoolLogoUrl, getOfficialSchoolName } from '../lib/constants';
import { Skeleton } from './shared/ShimmerSkeleton';

interface VerificationProps {
  receiptId: string;
}

export function ReceiptVerification({ receiptId }: VerificationProps) {
  const [loading, setLoading] = useState(true);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const docRef = doc(db, 'receipts', receiptId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setReceiptData({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('Receipt not found or invalid.');
        }
      } catch (err) {
        console.error('Error fetching receipt validation', err);
        setError('Verification system unavailable.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReceipt();
  }, [receiptId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 dir-rtl">
        <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center max-w-sm w-full border border-gray-100 space-y-4">
          <Skeleton variant="circular" className="w-16 h-16" />
          <Skeleton variant="rounded" className="w-48 h-6" />
          <Skeleton variant="rounded" className="w-full h-12" />
          <Skeleton variant="rounded" className="w-3/4 h-4" />
        </div>
      </div>
    );
  }

  if (error || !receiptData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 dir-rtl" style={{ direction: 'rtl' }}>
        <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm w-full border border-red-100">
          <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6">
            <ShieldAlert size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">وصل غير صالح!</h2>
          <p className="text-gray-600 text-center mb-6 leading-relaxed">
            تعذر تأكيد صحة هذا الوصل في قاعدة بياناتنا. قد يكون الوصل مزوراً أو غير مكتمل أو تم حذفه.
          </p>
          <div className="bg-gray-50 p-4 rounded-xl w-full text-center border border-gray-200">
            <p className="text-xs font-mono text-gray-500 mb-1">الرقم المفحوص</p>
            <p className="text-sm font-semibold text-gray-800 break-all">{receiptId}</p>
          </div>
        </div>
      </div>
    );
  }

  const schoolName = getOfficialSchoolName(receiptData?.schoolId, receiptData?.schoolName);
  
  let d: Date | null = null;
  if (receiptData?.time instanceof Date) d = receiptData.time;
  else if (typeof receiptData?.time === 'object' && receiptData.time !== null && (receiptData.time as any).toDate) d = (receiptData.time as any).toDate();
  else if (typeof receiptData?.time === 'object' && receiptData.time !== null && 'seconds' in receiptData.time) d = new Date((receiptData.time as any).seconds * 1000);
  else if (receiptData?.time) d = new Date(receiptData.time);

  const dateStr = (d && !isNaN(d.getTime())) ? `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}` : 'غير متاح';

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center pt-10 pb-20 p-4 dir-rtl" style={{ direction: 'rtl', fontFamily: '"Tajawal", "Noto Sans Arabic", sans-serif' }}>
      
      {/* Header Logo Area */}
      <div className="w-full max-w-md flex justify-center mb-6">
        <div className="w-24 h-24 bg-white rounded-full shadow-md flex items-center justify-center p-2 border border-gray-100 relative mb-4">
           <img 
             src={getOfficialSchoolLogoUrl(receiptData?.schoolId, receiptData?.schoolName)} 
             className="w-16 h-16 object-contain" 
             alt="School Logo" 
             loading="eager"
             onError={(e) => {
               const target = e.currentTarget as HTMLImageElement;
               if (target.src.endsWith('.png') || target.src.includes('.png')) {
                 target.src = target.src.replace('.png', '.jpg');
               } else if (!target.src.includes('school1.jpg')) {
                 target.src = '/school-logos/logo1.jpg';
               } else {
                 target.src = '/school-logos/logo1.jpg';
               }
             }}
           />
           
           <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-2 border-4 border-[#f8fafc] shadow-sm">
             <ShieldCheck size={20} />
           </div>
        </div>
      </div>

      <div className="bg-white p-1 rounded-3xl shadow-xl max-w-md w-full border border-gray-100 overflow-hidden relative">
        {/* Verification Status Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-6 text-center text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-xl"></div>
           <div className="absolute bottom-0 left-0 w-24 h-24 bg-black opacity-10 rounded-full -ml-10 -mb-10 blur-xl"></div>
           
           <div className="relative z-10 flex flex-col items-center">
             <BadgeCheck size={48} className="mb-3 text-emerald-100" />
             <h2 className="text-2xl font-bold tracking-tight">VERIFIED OFFICIAL</h2>
             <p className="text-emerald-50 font-medium mt-1">وصل رقمي موثق رسمياً</p>
           </div>
        </div>

        <div className="p-8 pt-6">
           <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-100">
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">المؤسسة التعليمية</p>
                <h3 className="text-lg font-bold text-gray-900 leading-tight">{schoolName}</h3>
              </div>
           </div>

           <div className="space-y-6">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                 <User size={24} />
               </div>
               <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">اسم الطالب</p>
                  <p className="text-xl font-bold text-gray-900">{receiptData.studentName || 'غير مكتوب'}</p>
               </div>
             </div>

             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                 <Wallet size={24} />
               </div>
               <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">المبلغ المدفوع</p>
                  <p className="text-2xl font-black text-gray-900 tracking-tight">{(receiptData.amount || 0).toLocaleString('en-US')} <span className="text-base font-bold text-gray-500 ml-1">د.ع</span></p>
                  <p className="text-sm font-medium text-emerald-600 bg-emerald-50 inline-block px-2 py-0.5 rounded-md mt-1 border border-emerald-100">
                    عن طريق {receiptData.method || 'غير محدد'}
                  </p>
               </div>
             </div>

             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                 <Calendar size={24} />
               </div>
               <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">تاريخ الوصل</p>
                  <p className="text-lg font-bold text-gray-900">{dateStr}</p>
               </div>
             </div>
           </div>
        </div>
        
        {/* Footer Area with reference code */}
        <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
           <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">رقم المرجع الرقمي | RECEIPT NO</p>
           <p className="text-lg font-mono text-gray-700 bg-white px-4 py-2 rounded-xl border border-gray-200 inline-block font-bold">
             BRQ-PAY-{d ? d.getFullYear() : new Date().getFullYear()}-{receiptId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase()}
           </p>
           
           <div className="mt-4 pt-4 border-t border-gray-200 border-dashed">
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Digital Signature</p>
             <p className="text-xs font-mono text-gray-500">
                {btoa(encodeURIComponent(`${receiptData.id}-${receiptData.studentName}-${receiptData.amount}-${d ? d.getFullYear() : new Date().getFullYear()}`)).replace(/[^A-Z0-9]/ig, '').toUpperCase().substring(0,4)}
                -
                {btoa(encodeURIComponent(`${receiptData.id}-${receiptData.studentName}-${receiptData.amount}-${d ? d.getFullYear() : new Date().getFullYear()}`)).replace(/[^A-Z0-9]/ig, '').toUpperCase().substring(4,8)}
                •••
                {btoa(encodeURIComponent(`${receiptData.id}-${receiptData.studentName}-${receiptData.amount}-${d ? d.getFullYear() : new Date().getFullYear()}`)).replace(/[^A-Z0-9]/ig, '').toUpperCase().slice(-4)}
             </p>
           </div>
           
           <div className="mt-5 space-y-1">
             <p className="text-xs font-semibold text-gray-400">BAYRAQ DIGITAL SECURE PLATFORM</p>
           </div>
        </div>
      </div>
    </div>
  );
}

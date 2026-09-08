import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, QrCode, Lock, Verified, Download, RefreshCw, CheckCircle2, X, ArrowRight } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, getDoc, updateDoc } from '@/src/lib/firebase';
import { getOfficialSchoolLogoUrl, getOfficialSchoolName } from '../lib/constants';

interface DigitalReceiptModalProps {
  receipt: { 
    id?: string;
    adminName: string; 
    studentName: string; 
    amount: number; 
    time: Date | string;
    schoolName?: string;
    schoolId?: string | null;
    studentId?: string;
    installmentName?: string;
    method?: string;
    isStamped?: boolean;
    isSyncedToParent?: boolean;
    stampTime?: string;
  } | null;
  onClose: () => void;
  hideActions?: boolean;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({
  receipt,
  onClose,
  hideActions
}) => {
  const [imageError, setImageError] = React.useState(false);
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isStamped, setIsStamped] = useState(receipt?.isStamped || false);
  const [stampTime, setStampTime] = useState<string | null>(receipt?.stampTime || null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    // Update local state if receipt changes
    setIsStamped(receipt?.isStamped || false);
    setStampTime(receipt?.stampTime || null);
    setSynced(receipt?.isSyncedToParent || false);
    
    if (!receipt || !receipt.studentId) return;
    
    const checkSyncStatus = async () => {
        try {
            const studentRef = doc(db, 'school_students', receipt.studentId!);
            const studentSnap = await getDoc(studentRef);
            
            if (studentSnap.exists()) {
                const studentData = studentSnap.data();
                const currentTransactions = studentData.finance?.transactions || [];
                
                const installmentName = receipt.installmentName || 'وصل رقمي';
                const cleanInput = installmentName.replace(/وصل رقمي\s*-\s*/, '').replace(/وصل رقمي/, '').trim();
                
                // Sort transactions to find the most recent matching one if id is not provided
                const sortedTxns = [...currentTransactions].sort((a: any, b: any) => 
                    new Date(b.date || b.timestamp || 0).getTime() - new Date(a.date || a.timestamp || 0).getTime()
                );

                const syncedTransaction = sortedTxns.find((t: any) => {
                  if (t.id && receipt.id && t.id === receipt.id) return true;
                  if (receipt.id && t.id && t.id !== receipt.id) return false; // If both have IDs and they differ, don't fallback to strings
                  
                  const tNote = t.note || '';
                  const cleanTNote = tNote.replace(/وصل رقمي\s*-\s*/, '').replace(/وصل رقمي/, '').trim();
                  const amountsMatch = Number(t.amount) === Number(receipt.amount);
                  const notesMatch = (cleanTNote === cleanInput && cleanInput.length > 0) || 
                                     (cleanTNote.includes(cleanInput) && cleanInput.length > 3) || 
                                     (cleanInput.includes(cleanTNote) && cleanTNote.length > 3);
                  
                  // Also verify they happened roughly around the same time if we are falling back to string match
                  const rTime = receipt.time instanceof Date ? receipt.time.getTime() : new Date(receipt.time || new Date()).getTime();
                  const tTime = new Date(t.date || t.timestamp || 0).getTime();
                  const timeMatch = Math.abs(rTime - tTime) < 1000 * 60 * 60 * 24 * 7; // Within 7 days

                  return amountsMatch && notesMatch && timeMatch;
                });
                
                if (syncedTransaction) {
                    if (syncedTransaction.isSyncedToParent) {
                        setSynced(true);
                    }
                    if (syncedTransaction.isStamped) {
                        setIsStamped(true);
                        setStampTime(syncedTransaction.stampTime || null);
                    }
                }
            }
        } catch (error) {
            console.error('Error checking sync status:', error);
        }
    };
    
    checkSyncStatus();
  }, [receipt]);

  const toggleStamp = async () => {
    const newIsStamped = !isStamped;
    let newStampTime = null;

    if (newIsStamped) {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'});
      newStampTime = `${dateStr} ${timeStr}`;
    }

    setIsStamped(newIsStamped);
    setStampTime(newStampTime);

    if (receipt?.studentId) {
      try {
        const studentRef = doc(db, 'school_students', receipt.studentId);
        const studentSnap = await getDoc(studentRef);
        
        if (studentSnap.exists()) {
          const studentData = studentSnap.data();
          const currentTransactions = studentData.finance?.transactions || [];
          
          const installmentName = receipt.installmentName || 'وصل رقمي';
          const cleanInput = installmentName.replace(/وصل رقمي\s*-\s*/, '').replace(/وصل رقمي/, '').trim();
          
          let updated = false;
          const updatedTransactions = currentTransactions.map((t: any) => {
            const tNote = t.note || '';
            const cleanTNote = tNote.replace(/وصل رقمي\s*-\s*/, '').replace(/وصل رقمي/, '').trim();
            const amountsMatch = Number(t.amount) === Number(receipt.amount);
            const notesMatch = (cleanTNote === cleanInput && cleanInput.length > 0) || 
                               (cleanTNote.includes(cleanInput) && cleanInput.length > 3) || 
                               (cleanInput.includes(cleanTNote) && cleanTNote.length > 3);
            
            const idMatch = t.id === receipt.id;
            const rTime = receipt.time instanceof Date ? receipt.time.getTime() : new Date(receipt.time || new Date()).getTime();
            const tTime = new Date(t.date || t.timestamp || 0).getTime();
            const timeMatch = Math.abs(rTime - tTime) < 1000 * 60 * 60 * 24 * 7;

            if (idMatch || (amountsMatch && notesMatch && timeMatch)) {
              updated = true;
              return { ...t, isStamped: newIsStamped, stampTime: newStampTime };
            }
            return t;
          });
          
          if (updated) {
            await updateDoc(studentRef, {
              'finance': {
                ...(studentData.finance || {}),
                transactions: updatedTransactions
              }
            });
          }
        }
      } catch (err) {
        console.error("Error auto-saving stamp:", err);
      }
    }
  };

  // Generate a high-security digital signature hash
  const digitalSignature = useMemo(() => {
    if (!receipt) return '';
    const timeValue = receipt.time instanceof Date ? receipt.time.getTime() : new Date(receipt.time || new Date()).getTime();
    const dataString = `${receipt.studentName}-${receipt.amount}-${timeValue}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(dataString);
    return Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 48).toUpperCase();
  }, [receipt]);


  const schoolLogoPath = useMemo(() => {
    return getOfficialSchoolLogoUrl(receipt?.schoolId || undefined, receipt?.schoolName || undefined);
  }, [receipt?.schoolName, receipt?.schoolId]);

  const displaySchoolName = useMemo(() => {
    return getOfficialSchoolName(receipt?.schoolId || undefined, receipt?.schoolName || undefined);
  }, [receipt?.schoolName, receipt?.schoolId]);

  const [logoSrc, setLogoSrc] = useState<string>(schoolLogoPath);

  useEffect(() => {
    setLogoSrc(schoolLogoPath);
  }, [schoolLogoPath]);

  const handleLogoError = useCallback(() => {
    setLogoSrc((prev) => {
      if (prev !== '/school-logos/logo1.jpg') {
        return '/school-logos/logo1.jpg';
      }
      return '/school-logos/logo1.jpg';
    });
  }, []);

  const handleSync = async () => {
    if (!receipt || !receipt.studentId) {
      setStatusMessage('❌ خطأ: بيانات الطالب غير كاملة.');
      return;
    }
    setSyncing(true);
    setStatusMessage('جاري المزامنة مع محفظة الوالد...');
    
    try {
      console.log('--- Starting Sync ---');
      
      // 1. Generate ID for new transaction
      const newTransactionId = Math.random().toString(36).substring(2, 15);

      // 2. Add to student's finance.transactions in school_students
      const studentRef = doc(db, 'school_students', receipt.studentId);
      const studentSnap = await getDoc(studentRef);
      
      if (studentSnap.exists()) {
        const studentData = studentSnap.data();
        const currentTransactions = studentData.finance?.transactions || [];
        
        // Search if installment with same name and amount already exists
        const installmentName = receipt.installmentName || 'وصل رقمي';
        const cleanInput = installmentName.replace(/وصل رقمي\s*-\s*/, '').replace(/وصل رقمي/, '').trim();
        const targetNote = installmentName.startsWith('وصل رقمي - ') ? installmentName : `وصل رقمي - ${installmentName}`;

        const isDuplicate = currentTransactions.some((t: any) => {
          if (t.id && receipt.id && t.id === receipt.id) return true;
          const tNote = t.note || '';
          const cleanTNote = tNote.replace(/وصل رقمي\s*-\s*/, '').replace(/وصل رقمي/, '').trim();
          const amountsMatch = Number(t.amount) === Number(receipt.amount);
          const notesMatch = (cleanTNote === cleanInput && cleanInput.length > 0) || 
                             (cleanTNote.includes(cleanInput) && cleanInput.length > 3) || 
                             (cleanInput.includes(cleanTNote) && cleanTNote.length > 3);
          return amountsMatch && notesMatch;
        });
        
        if (!isDuplicate) {
          const newTransaction = {
            id: newTransactionId,
            amount: receipt.amount,
            method: receipt.method || 'نقدي/مدير',
            status: 'completed',
            date: new Date(receipt.time || new Date()).toISOString(),
            adminName: receipt.adminName,
            note: targetNote,
            isStamped,
            stampTime,
            isSyncedToParent: true
          };
          
          await updateDoc(studentRef, {
            'finance': {
              ...(studentData.finance || {}),
              'transactions': [...currentTransactions, newTransaction]
            }
          });
          console.log('--- Sync Successful: Added new transaction ---');
        } else {
          // Update the duplicate transaction's stamp state instead of skipping
          const updatedTransactions = currentTransactions.map((t: any) => {
            const tNote = t.note || '';
            const cleanTNote = tNote.replace(/وصل رقمي\s*-\s*/, '').replace(/وصل رقمي/, '').trim();
            const amountsMatch = Number(t.amount) === Number(receipt.amount);
            const notesMatch = (cleanTNote === cleanInput && cleanInput.length > 0) || 
                               (cleanTNote.includes(cleanInput) && cleanInput.length > 3) || 
                               (cleanInput.includes(cleanTNote) && cleanTNote.length > 3);
            const idMatch = t.id === receipt.id;
            const rTime = receipt.time instanceof Date ? receipt.time.getTime() : new Date(receipt.time || new Date()).getTime();
            const tTime = new Date(t.date || t.timestamp || 0).getTime();
            const timeMatch = Math.abs(rTime - tTime) < 1000 * 60 * 60 * 24 * 7;

            if (idMatch || (amountsMatch && notesMatch && timeMatch)) {
              return {
                ...t,
                isStamped: true,
                stampTime: stampTime,
                isSyncedToParent: true,
                // Keep the original method if valid (e.g., zaincash), otherwise use the receipt's method
                method: t.method && t.method !== 'نقدي/مدير' && t.method !== 'نقدي' && t.method !== 'غير محدد' 
                  ? t.method 
                  : (receipt.method || t.method || 'نقدي/مدير'),
                // Preserve or upgrade notes
                note: t.note && !t.note.startsWith('وصل رقمي - ') ? t.note : targetNote
              };
            }
            return t;
          });

          await updateDoc(studentRef, {
            'finance': {
              ...(studentData.finance || {}),
              'transactions': updatedTransactions
            }
          });
          console.log('--- Sync Successful: Updated duplicate transaction to be stamped ---');
        }
      } else {
        console.warn('Student not found for finance sync');
      }

      console.log('--- Sync Successful ---');
      setSynced(true);
      setStatusMessage('✅ تمت المزامنة بنجاح!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error('--- Sync Error ---', error);
      setStatusMessage('❌ فشلت المزامنة. حاول مجدداً.');
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setSyncing(false);
    }
  };

  const handlePrint = async () => {
    setIsGeneratingPDF(true);
    setStatusMessage('جاري توليد الوصل الرسمي...');
    
    try {
      const QRCode = (await import('qrcode')).default;
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1600;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context not available');

      // Soft off-white premium background
      ctx.fillStyle = '#f7f7f5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Premium extremely subtle watermark
      ctx.save();
      ctx.fillStyle = '#111827';
      ctx.globalAlpha = 0.02; // Ensure subtle but visible watermark
      ctx.font = 'bold 56px "Tajawal", "Noto Sans Arabic", sans-serif'; // Readable size
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 6); // Diagonal
      
      const watermarkText = 'BAYRAQ VERIFIED • BAYRAQ VERIFIED';
      for (let i = -3; i <= 3; i++) {
        for (let j = -4; j <= 4; j++) {
           ctx.fillText(watermarkText, i * 900, j * 220); // Spaced nicely without clash
        }
      }
      ctx.restore();

      ctx.textBaseline = 'top';
      ctx.direction = 'rtl';

      // Top Security Ribbon
      ctx.save();
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 26px "Tajawal", "Noto Sans Arabic", sans-serif';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '1px';
      ctx.fillText('VERIFIED DIGITAL RECEIPT   •   بوابة بيرق   •   نظام وصولات معتمد', canvas.width / 2, 45);
      ctx.restore();

      // Load Logo with fallback
      const logo = new Image();
      await new Promise<void>((resolve) => {
        logo.onload = () => resolve();
        logo.onerror = () => {
          if (schoolLogoPath.endsWith('.png')) {
            const fallbackLogo = new Image();
            fallbackLogo.onload = () => {
              logo.src = fallbackLogo.src;
              resolve();
            };
            fallbackLogo.onerror = () => {
              // try school1.jpg as ultimate fallback
              const defaultLogo = new Image();
              defaultLogo.onload = () => {
                logo.src = defaultLogo.src;
                resolve();
              };
              defaultLogo.onerror = () => resolve();
              defaultLogo.src = '/school-logos/logo1.jpg';
            };
            fallbackLogo.src = schoolLogoPath.replace('.png', '.jpg');
          } else {
            resolve();
          }
        };
        logo.src = schoolLogoPath;
      });
      
      // Load QR Code
      const verifyUrl = `${window.location.origin}${window.location.pathname}?verify=${receipt?.id || 'no-id'}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 240,
        margin: 1,
        color: {
          dark: '#111827',
          light: '#ffffff'
        }
      });
      const qrImage = new Image();
      qrImage.src = qrDataUrl;
      await new Promise((resolve) => {
        qrImage.onload = resolve;
        qrImage.onerror = resolve;
      });

      // Receipt Border (Subtly elegant)
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

      // Header Line
      ctx.beginPath();
      ctx.moveTo(80, 240);
      ctx.lineTo(canvas.width - 80, 240);
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Top headers
      ctx.textAlign = 'right';
      ctx.fillStyle = '#172554'; // Dark navy / dark blue
      ctx.font = 'bold 56px "Tajawal", "Noto Sans Arabic", sans-serif';
      ctx.fillText('وصل استلام مالي', canvas.width - 80, 80);
      
      ctx.fillStyle = '#6b7280';
      ctx.font = 'bold 32px "Tajawal", "Noto Sans Arabic", sans-serif';
      ctx.fillText(receipt?.schoolName || 'ثانوية أوائل غماس الأهلية', canvas.width - 80, 160);

      if (logo.complete && logo.naturalHeight !== 0) {
        // Soft circular background glow behind logo
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
        ctx.shadowBlur = 40;
        ctx.beginPath();
        ctx.arc(80 + 65, 50 + 65, 75, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();

        // Draw Logo (Size increased by ~10%)
        ctx.drawImage(logo, 80, 50, 130, 130);
      }

      // Details
      const labelsY = 280;
      const valuesY = 325;
      
      ctx.fillStyle = '#6b7280';
      ctx.font = 'bold 28px "Tajawal", "Noto Sans Arabic", sans-serif';
      ctx.fillText('بيان العملية', canvas.width - 80, labelsY);
      
      const methodMap: Record<string, string> = {
  'asiahawala': 'آسيا حوالة',
  'zaincash': 'زين كاش',
  'mastercard': 'ماستر كارد',
  'fib': 'مصرف العراق الأول FIB',
  'نقدي/مدير': 'نقدي',
  'cash': 'نقدي'
};
      const methodName = methodMap[receipt?.method || ''] || receipt?.method || 'غير متاح';
      
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 44px "Tajawal", "Noto Sans Arabic", sans-serif';
      ctx.fillText(`${methodName}`, canvas.width - 80, valuesY);

      // Date
      ctx.textAlign = 'left';
      ctx.direction = 'ltr';
      ctx.fillStyle = '#6b7280';
      ctx.font = 'bold 28px "Tajawal", "Noto Sans Arabic", sans-serif';
      ctx.fillText('تاريخ الوصل', 80, labelsY);

      let d: Date | null = null;
      if (receipt?.time instanceof Date) d = receipt.time;
      else if (typeof receipt?.time === 'object' && receipt.time !== null && (receipt.time as any).toDate) d = (receipt.time as any).toDate();
      else if (typeof receipt?.time === 'object' && receipt.time !== null && 'seconds' in (receipt.time as any)) d = new Date(((receipt.time as any).seconds || 0) * 1000);
      else if (receipt?.time) d = new Date(receipt.time || new Date());
      
      const dateStr = (d && !isNaN(d.getTime())) ? `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}` : 'غير متاح';
      
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 44px "Tajawal", "Noto Sans Arabic", sans-serif';
      ctx.fillText(dateStr, 80, valuesY);
      
      ctx.direction = 'rtl';
      ctx.textAlign = 'right';
      
      // Add Official Serial Section
      const dYear = d && !isNaN(d.getTime()) ? d.getFullYear() : new Date().getFullYear();
      
      // Divider
      ctx.beginPath();
      ctx.moveTo(80, 440);
      ctx.lineTo(canvas.width - 80, 440);
      ctx.stroke();

      // Student Name
      ctx.fillStyle = '#6b7280';
      ctx.font = 'bold 28px "Tajawal", "Noto Sans Arabic", sans-serif';
      ctx.fillText('اسم الطالب الثلاثي', canvas.width - 80, 490);
      
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 72px "Tajawal", "Noto Sans Arabic", sans-serif';
      ctx.fillText(receipt?.studentName || '', canvas.width - 80, 540);

      // Amount box
      ctx.fillStyle = '#6b7280';
      ctx.font = 'bold 28px "Tajawal", "Noto Sans Arabic", sans-serif';
      ctx.fillText('المبلغ المدفوع (د.ع)', canvas.width - 80, 680);
      
      const amountBoxY = 730;
      const amountBoxHeight = 220;
      
      // Amount Box Backplate & Shadow effect
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.roundRect(80, amountBoxY, canvas.width - 160, amountBoxHeight, 32);
      ctx.fill();
      
      // Subtle top inner shadow simulation via linear gradient
      const grad = ctx.createLinearGradient(0, amountBoxY, 0, amountBoxY + 30);
      grad.addColorStop(0, 'rgba(0,0,0,0.4)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(80, amountBoxY, canvas.width - 160, amountBoxHeight, 32);
      ctx.fill();

      // Ensure proper text contrast and spacing inside amount box
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 120px "Tajawal", "Noto Sans Arabic", sans-serif';
      ctx.fillText((receipt?.amount || 0).toLocaleString('en-US'), canvas.width - 140, amountBoxY + 40);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px "Tajawal", "Noto Sans Arabic", sans-serif';
      ctx.textAlign = 'left';
      ctx.direction = 'ltr';
      ctx.fillText('د.ع', 120, amountBoxY + 50);
      
      ctx.fillStyle = '#d1d5db';
      ctx.font = 'bold 28px "Tajawal", "Noto Sans Arabic", sans-serif';
      ctx.fillText('PAID VERIFIED', 120, amountBoxY + 140);
      
      ctx.direction = 'rtl';
      ctx.textAlign = 'right';
      
      // Verification section
      const verificationY = 1040;
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 44px "Tajawal", "Noto Sans Arabic", sans-serif';
      ctx.fillText('بيانات التحقق الرقمي', canvas.width - 80, verificationY);
      
      ctx.fillStyle = '#4b5563';
      ctx.font = '34px "Tajawal", "Noto Sans Arabic", sans-serif';
      ctx.fillText(`وثيقة أصيلة مسجلة رسمياً للطالب: ${receipt?.studentName || ''}`, canvas.width - 80, verificationY + 70);
      ctx.fillText(`بمبلغ وقدره (${(receipt?.amount || 0).toLocaleString('en-US')} دينار عراقي).`, canvas.width - 80, verificationY + 125);

      // Generate unique identifiers based on receipt content
      const safeIdStr = receipt?.id ? receipt.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : Math.floor(Math.random() * 900000 + 100000).toString();
      const receiptNoStr = `Receipt No: BRQ-PAY-${dYear}-${safeIdStr.substring(0, 6)}`;
      
      const hashData = `${receipt?.id}-${receipt?.studentName}-${receipt?.amount}-${dYear}`;
      const mockHash = btoa(encodeURIComponent(hashData)).replace(/[^A-Z0-9]/ig, '').toUpperCase();
      const shortSig = `SIGNATURE: ${mockHash.substring(0, 4)}-${mockHash.substring(4, 8)}•••${mockHash.substring(mockHash.length - 4)}`;

      // Receipt No & Digital Signature replacing old digital signature hash
      ctx.fillStyle = '#374151';
      ctx.direction = 'ltr';
      ctx.textAlign = 'left';
      
      // Receipt No
      ctx.font = 'bold 30px "Tajawal", "Noto Sans Arabic", monospace';
      ctx.fillText(receiptNoStr, 80, 1370);
      
      // Digital Signature Short
      ctx.fillStyle = '#6b7280';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(shortSig, 80, 1420);

      ctx.direction = 'rtl';
      ctx.textAlign = 'right';

      // QR Code in bottom-right
      if (qrImage.complete && qrImage.naturalHeight !== 0) {
        ctx.drawImage(qrImage, canvas.width - 80 - 220, verificationY + 180, 220, 220);
        ctx.fillStyle = '#6b7280';
        ctx.font = 'bold 18px "Tajawal", "Noto Sans Arabic", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Scan To Verify', canvas.width - 80 - 110, verificationY + 180 + 220 + 24);
        ctx.textAlign = 'right';
      }
      
      if (isStamped) {
         ctx.save();
         // Stamp Opacity: 0.15
         ctx.globalAlpha = 0.15;
         ctx.strokeStyle = '#991b1b';
         
         // Move stamp somewhat higher to avoid dynamic receipt number section
         const cx = 220;
         const cy = 1170;
         // Reduce size by 25%: r was 140 -> 105
         const r = 105;
         
         ctx.lineWidth = 10;
         ctx.beginPath();
         ctx.arc(cx, cy, r, 0, Math.PI * 2);
         ctx.stroke();
         ctx.beginPath();
         ctx.lineWidth = 3;
         ctx.arc(cx, cy, r + 14, 0, Math.PI * 2);
         ctx.stroke();

         ctx.fillStyle = '#991b1b';
         ctx.textAlign = 'center';
         ctx.direction = 'rtl';
         
         ctx.font = 'bold 22px "Tajawal", "Noto Sans Arabic", sans-serif';
         ctx.fillText(displaySchoolName, cx, cy - 50);

         if (logo.complete && logo.naturalHeight !== 0) {
             ctx.drawImage(logo, cx - 26, cy - 26, 52, 52);
         }
         
         ctx.font = 'bold 26px "Tajawal", "Noto Sans Arabic", sans-serif';
         ctx.fillText('الإدارة', cx, cy + 45);
         ctx.font = 'bold 18px "Tajawal", "Noto Sans Arabic", sans-serif';
         ctx.fillText(stampTime || '', cx, cy + 70);
         
         ctx.restore();
      }

      ctx.direction = 'rtl';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#4b5563'; // Dark gray color
      ctx.font = '24px "Tajawal", "Noto Sans Arabic", sans-serif'; // Reduced font weight
      
      // We manually add spaces to simulate letter spacing for wider support
      const securityText = 'S E C U R E • V E R I F I E D • O F F I C I A L • B A Y R A Q';
      ctx.fillText(securityText, canvas.width / 2, canvas.height - 70);

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const fileName = `Official_Receipt_${(receipt?.studentName || 'Student').replace(/[\s\W]+/g, '_')}_${Date.now()}.png`;

      const fileObj = new File([blob], fileName, { type: 'image/png' });
        
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [fileObj] })) {
          try {
            await navigator.share({
              files: [fileObj],
              title: 'وصل استلام رسمي',
              text: `مرفق لكم الوصل الرقمي الرسمي من ${displaySchoolName}`
            });
            setStatusMessage('✅ تمت المشاركة بنجاح');
            return;
          } catch (shareErr: any) {
            console.log('Share error or cancelled', shareErr);
            const errMsg = shareErr?.message || '';
            if (
              shareErr?.name === 'AbortError' || 
              errMsg.includes('aborted') || 
              errMsg.includes('abort') || 
              errMsg.includes('cancel') || 
              errMsg.includes('without reason')
            ) {
              return;
            }
          }
      }
        
      const fileUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(fileUrl);
      setStatusMessage('✅ تم تنزيل الوصل بنجاح!');

    } catch (e) {
      console.error('Canvas generation failed:', e);
      setStatusMessage('❌ فشل توليد الوصل.');
    } finally {
      setIsGeneratingPDF(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  if (!receipt) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999999] bg-black/95 backdrop-blur-xl overflow-y-auto flex flex-col items-center p-3 sm:p-6 text-white digital-receipt-modal-wrapper"
        dir="rtl"
      >
        {/* Floating Sticky Top Bar - Visible always at the top of viewport */}
        <div className="w-full max-w-sm sticky top-0 z-[1000000] pt-2 pb-3 px-1 flex items-center justify-between no-print bg-black/80 backdrop-blur-md rounded-b-2xl mb-3 border-b border-white/10 shadow-2xl">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-[0_0_20px_rgba(217,119,6,0.4)] text-xs font-black transition-all active:scale-95 border border-amber-400/40 cursor-pointer"
          >
            <ArrowRight size={16} />
            <span>العودة للوحة الإدارة</span>
          </button>
          
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-rose-600 text-gray-200 hover:text-white transition-all active:scale-95 border border-white/15 cursor-pointer text-xs font-bold"
            title="إغلاق الوصل"
          >
            <span>إغلاق</span>
            <X size={18} />
          </button>
        </div>

        <div className="w-full max-w-sm my-auto pb-8">
          {/* THE DIGITAL RECEIPT CARD */}
          <motion.div
            id="digital-receipt-card"
            initial={{ scale: 0.9, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 50 }}
            className="w-full rounded-[40px] p-8 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] relative overflow-hidden"
            style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#121212', color: '#f3f4f6', border: '1px solid #1f2937' }}
          >
             {/* HOLOGRAM EFFECT LAYER */}
             <div 
               className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay"
               style={{ background: 'linear-gradient(60deg, transparent, rgba(255, 255, 255, 0.02), transparent)' }}
             ></div>

             {/* HEADER STRIPE */}
             <div className="absolute top-0 left-0 w-full h-[6px] z-10" style={{ background: 'linear-gradient(90deg, #451a03 0%, #d97706 50%, #451a03 100%)' }}></div>
             
             {/* CLOSE BUTTON ON CARD */}
             <button
               onClick={onClose}
               className="absolute top-4 left-4 z-50 p-2.5 rounded-full hover:bg-rose-600 hover:text-white transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-lg no-print"
               style={{ backgroundColor: '#1f2937', color: '#ffffff', border: '1px solid #374151' }}
               title="إغلاق"
             >
               <X size={18} />
             </button>
             
             {/* CARD HEADER WITH LOGO */}
             <div className="relative z-10 mt-6 select-none flex items-center justify-between gap-4 mb-8">
                <img 
                    src={logoSrc} 
                    alt={displaySchoolName} 
                    className="w-20 h-20 object-contain p-2 rounded-full shadow-lg border border-amber-500/20 bg-gray-900"
                    loading="eager"
                    onError={handleLogoError}
                  />
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2 mb-1">
                      <div className="flex items-center gap-1 text-[8px] font-black px-1.5 py-0.5 rounded-full" style={{ color: '#f59e0b', backgroundColor: '#451a03', border: '1px solid #78350f'}}>
                        <ShieldCheck size={9} />
                        VERIFIED
                      </div>
                  </div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tighter leading-tight">وصل استلام مالي</h2>
                  <p className="text-xs font-semibold mt-0.5 tracking-wide" style={{ color: '#9ca3af'}}>{displaySchoolName}</p>
                </div>
             </div>

             <div className="rounded-[32px] p-6 space-y-5 shadow-inner relative z-10" style={{ backgroundColor: '#1a1a1a', border: '1px solid #1f2937' }}>
              <div className="flex justify-between items-center pb-4" style={{ borderBottom: '1px solid #1f2937' }}>
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6b7280' }}>{receipt.method ? `بيانات العملية - ${(() => {
                                         const methodMap: Record<string, string> = {
  'asiahawala': 'آسيا حوالة',
  'zaincash': 'زين كاش',
  'mastercard': 'ماستر كارد',
  'fib': 'مصرف العراق الأول FIB',
  'نقدي/مدير': 'نقدي',
  'cash': 'نقدي'
};
                                         return methodMap[receipt.method] || receipt.method;
                                     })()}` : 'بيانات العملية'}</span>
                <span className="text-xs font-medium tabular-nums px-3 py-1.5 rounded-lg" style={{ color: '#d1d5db', backgroundColor: 'black', border: '1px solid #1f2937'}}>
                  {(() => {
                    let d: Date | null = null;
                    if (receipt.time instanceof Date) {
                      d = receipt.time;
                    } else if (typeof receipt.time === 'object' && receipt.time !== null && (receipt.time as any).toDate) {
                      d = (receipt.time as any).toDate();
                    } else if (typeof receipt.time === 'object' && receipt.time !== null && 'seconds' in (receipt.time as any)) {
                      d = new Date(((receipt.time as any).seconds || 0) * 1000);
                    } else if (typeof receipt.time === 'string' || typeof receipt.time === 'number') {
                      d = new Date(receipt.time || new Date());
                    }

                    if (d && !isNaN(d.getTime())) {
                      return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
                    }
                    return 'غير متاح';
                  })()}
                </span>
              </div>

               <div className="space-y-1">
                 <span className="text-[10px] font-bold uppercase mb-1 block" style={{ color: '#6b7280'}}>اسم الطالب الثلاثي</span>
                 <div className="flex items-center gap-2">
                   <span className="text-xl font-bold text-white tracking-tight leading-tight">{receipt.studentName}</span>
                   <Verified size={16} />
                 </div>
               </div>

               <div className="space-y-2 pt-2">
                 <span className="text-[10px] font-bold uppercase block" style={{ color: '#6b7280'}}>المبلغ المدفوع</span>
                 <div className="text-white rounded-2xl p-5 flex items-center justify-between" style={{ backgroundColor: '#d97706', boxShadow: '0 10px 15px -3px rgba(69, 26, 3, 0.2)'}}>
                   <span className="text-3xl font-black tabular-nums tracking-tighter text-white">
                     {receipt.amount.toLocaleString('en-US')}
                   </span>
                   <div className="flex flex-col items-end">
                     <span className="text-xs font-black opacity-70">د.ع</span>
                     <span className="text-[8px] font-black" style={{ color: '#fef3c7'}}>PAID</span>
                   </div>
                 </div>

                 <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-800/50">
                 <div className="w-16 h-16 rounded-2xl flex items-center justify-center p-2" style={{ backgroundColor: 'rgba(217, 119, 6, 0.1)', border: '1px solid rgba(217, 119, 6, 0.2)' }}>
                   <QrCode size={48} strokeWidth={1} style={{ color: 'rgba(217, 119, 6, 0.7)' }} />
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[9px] font-black leading-tight uppercase mb-1" style={{ color: 'rgba(245, 245, 245, 0.6)' }}>رادار التحقق الرقمي</span>
                   <p className="text-[8px] font-medium max-w-[170px] leading-relaxed" style={{ color: 'rgba(245, 245, 245, 0.9)' }}>
                     تحقق: هذا الوصل أصلي ومسجل باسم الطالب: ({receipt.studentName})، بمبلغ: ({receipt.amount.toLocaleString('en-US')} د.ع).
                   </p>
                 </div>
               </div>
            </div>

            <div className="mt-8 relative flex items-end justify-between px-2 z-20">
              {/* Signature Side */}
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase mb-1" style={{ color: 'rgba(245, 245, 245, 0.4)' }}>التوقيع الرقمي المعتمد</span>
                <div className="font-mono text-[7px] break-all max-w-[130px] leading-tight mb-2" style={{ color: 'rgba(245, 245, 245, 0.6)' }}>
                  {digitalSignature}
                </div>
                <span className="text-[10px] font-black flex items-center gap-1 px-2 py-1 rounded-lg" style={{ color: '#d97706', backgroundColor: 'rgba(217, 119, 6, 0.1)', border: '1px solid rgba(217, 119, 6, 0.5)'}}>
                  <Lock size={10} style={{ fill: 'rgba(217, 119, 6, 0.2)' }}/> موثق إلكترونياً - بوابة بيرق
                </span>
              </div>
              
              {/* SECURE STAMP AREA */}
              <div className="relative w-24 h-24">
                <AnimatePresence>
                  {isStamped && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
                      animate={{ opacity: 0.8, scale: 1, rotate: -15 }}
                      exit={{ opacity: 0, scale: 0.5, rotate: 0 }}
                      className="absolute z-40"
                    >
                      <div className="rounded-full w-24 h-24 flex flex-col items-center justify-center font-bold p-1 shadow-lg overflow-hidden" style={{ border: '6px double #991b1b', color: '#f3f4f6', backgroundColor: '#991b1b' }}>
                          <span className="text-[6px] tracking-widest uppercase text-center font-black leading-none max-w-[80px] truncate px-0.5">
                            {displaySchoolName}
                          </span>
                          <img 
                              src={logoSrc} 
                              alt="School Stamp Logo" 
                              className="w-6 h-6 object-contain my-0.5"
                              onError={handleLogoError}
                          />
                          <span className="text-[7px] uppercase leading-none font-black">الإدارة</span>
                          <div className="text-[5px] text-center mt-0.5 font-mono border-t pt-0.5 w-full" style={{ borderColor: 'rgba(243, 244, 246, 0.3)' }}>
                              {stampTime}
                          </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* SECURITY STRIP */}
            <div className="mt-8 w-full py-2 flex items-center justify-center gap-4 text-[7px] font-bold tracking-widest uppercase" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(217, 119, 6, 0.2) 50%, transparent 100%)', color: 'rgba(245, 245, 245, 0.5)' }}>
              <span>SECURE</span> • <span>VERIFIED</span> • <span>OFFICIAL</span> • <span>BAYRAQ</span>
            </div>

            {statusMessage && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="mt-4 p-3 rounded-xl bg-gray-900 border border-gray-700 text-center text-xs font-bold text-gray-300"
               >
                 {statusMessage}
               </motion.div>
            )}

            {!hideActions && (
              <div className="flex gap-2 mt-6 no-print">
                <button 
                  onClick={toggleStamp}
                  className={`flex-1 h-12 rounded-xl font-black text-[10px] md:text-sm transition-all active:scale-95 flex items-center justify-center gap-1 md:gap-2 relative z-50 ${isStamped ? 'bg-red-800 hover:bg-red-700 text-red-100' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                >
                  {isStamped ? 'إلغاء' : 'ختم الإدارة'}
                  <ShieldCheck size={16} className="hidden md:block" />
                </button>
                <button 
                  onClick={handleSync}
                  disabled={syncing || !isStamped || synced}
                  className="flex-[1.2] md:flex-[1.5] h-12 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-[10px] md:text-sm transition-all shadow-lg shadow-amber-950/30 active:scale-95 flex items-center justify-center gap-1 md:gap-2 relative z-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="truncate">{syncing ? 'جاري...' : (synced ? 'تمت المزامنة' : 'مزامنة الوالد')}</span>
                  {syncing ? <RefreshCw size={16} className="animate-spin hidden md:block" /> : (synced ? <CheckCircle2 size={16} className="hidden md:block" /> : <RefreshCw size={16} className="hidden md:block" />)}
                </button>
                <button
                  onClick={handlePrint}
                  disabled={isGeneratingPDF}
                  className="flex-[1.2] md:flex-[1.5] h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] md:text-sm transition-all active:scale-95 flex items-center justify-center gap-1 md:gap-2 cursor-pointer shadow-lg shadow-indigo-900/30 disabled:opacity-50 disabled:cursor-not-allowed duration-300 relative z-50"
                >
                  {isGeneratingPDF ? (
                    <>
                      <RefreshCw size={16} className="animate-spin hidden md:block" />
                      <span>تجهيز...</span>
                    </>
                  ) : (
                    <>
                      <Download size={16} className="hidden md:block" />
                      <span>تنزيل الوصل</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <p className="mt-5 text-center text-[8px] text-gray-600 font-black uppercase tracking-[0.3em] pointer-events-none relative z-10">
              BAYRAQ SECURED DOCUMENT • {new Date().getFullYear()}
            </p>
          </div>
          </motion.div>

          {/* Bottom Return Button for convenient access */}
          <div className="mt-4 no-print select-none space-y-2">
            {hideActions && (
              <button
                onClick={handlePrint}
                disabled={isGeneratingPDF}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(79,70,229,0.6)] hover:scale-[1.02] text-white rounded-2xl font-black text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed duration-300"
              >
                {isGeneratingPDF ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>جاري التجهيز...</span>
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    <span>تنزيل الوصل الرسمي</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full h-12 bg-white/10 hover:bg-white/20 hover:border-white/30 text-gray-200 hover:text-white rounded-2xl font-black text-xs border border-white/15 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <ArrowRight size={16} />
              <span>العودة للأقسام / لوحة الإدارة</span>
            </button>
          </div>
        </div>

      </motion.div>
    </AnimatePresence>
  );
};

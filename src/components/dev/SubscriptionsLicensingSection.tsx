import React, { useState, useEffect, useRef } from 'react';
import {
  Award,
  Calendar,
  Clock,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Sparkles,
  RefreshCw,
  Search,
  SlidersHorizontal,
  FileText,
  Key,
  Lock,
  Zap,
  Users,
  QrCode as QrCodeIcon,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  CreditCard,
  Ban,
  HelpCircle,
  Download,
  Share2,
  X,
  Archive,
  PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { logActivity } from '../../utils/auditLogger';
import { generateQrDataUrl } from '../../utils/qrGenerator';
import { SchoolArchiveManager } from './SchoolArchiveManager';
import { schoolService, SchoolRecord } from '../../services/schoolService';
import { db, collection, getDocs, doc, setDoc } from '@/src/lib/firebase';
import { getOfficialSchoolLogoUrl } from '../../lib/constants';

export type PlanTier = 'trial' | 'standard' | 'premium' | 'enterprise' | 'custom';
export type LicenseStatus = 'active' | 'expiring_soon' | 'expired' | 'suspended' | 'archived';
export type PaymentStatus = 'paid' | 'partial' | 'pending';

export interface SchoolLicense {
  id: string;
  schoolId: string;
  schoolName: string;
  governorate: string;
  receiptNumber: string; // e.g. RCPT-B6-2026-9812
  licenseNumber: string; // e.g. B6-LIC-8942-7719
  plan: PlanTier;
  status: LicenseStatus;
  maxStudents: number;
  currentStudents: number;
  startDate: string;
  expiryDate: string;
  issuedDate: string;
  subscriptionFee: number; // in IQD
  paymentStatus: PaymentStatus;
  contactPerson: string;
  contactPhone: string;
  notes?: string;
  aiQuotaMonthly: number;
  qrCodeUrl?: string;
  schoolStamp?: string;
  schoolLogo?: string;
}

// Compute dynamic license status based on dates, archival and manual suspension
export const computeLicenseStatus = (statusFromDb: string | undefined, expiryDateStr: string): LicenseStatus => {
  if (statusFromDb === 'archived') return 'archived';
  if (statusFromDb === 'suspended') return 'suspended';
  if (!expiryDateStr) return 'active';
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDateStr);
  exp.setHours(0, 0, 0, 0);

  const diffTime = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'expiring_soon';
  return 'active';
};

// Calculate exact remaining days
export const calculateRemainingDays = (expiryDateStr: string): number => {
  if (!expiryDateStr) return 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDateStr);
  exp.setHours(0, 0, 0, 0);
  const diffTime = exp.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const SubscriptionsLicensingSection: React.FC = () => {
  const [licenses, setLicenses] = useState<SchoolLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');

  // Active View Tab: 'licenses' vs 'archives'
  const [activeTab, setActiveTab] = useState<'licenses' | 'archives'>('licenses');
  const [archiveTargetSchoolId, setArchiveTargetSchoolId] = useState<string | null>(null);

  // Edit / Extension Modal
  const [editingLicense, setEditingLicense] = useState<SchoolLicense | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Grant New School License Modal
  const [availableSchools, setAvailableSchools] = useState<SchoolRecord[]>([]);
  const [isGrantLicenseModalOpen, setIsGrantLicenseModalOpen] = useState(false);
  const [grantForm, setGrantForm] = useState({
    schoolId: '',
    schoolName: '',
    governorate: '',
    plan: 'standard' as PlanTier,
    maxStudents: 600,
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    subscriptionFee: 1500000,
    paymentStatus: 'paid' as PaymentStatus,
    contactPerson: '',
    contactPhone: '',
    notes: 'ترخيص سنوي معتمد لاستخدام منصة بوابة بيرق التعليمية.'
  });

  // Official Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<SchoolLicense | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);

  // QR Verification Preview Modal
  const [verifyingLicense, setVerifyingLicense] = useState<SchoolLicense | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    showToast(`تم نسخ ${label} بنجاح: ${text}`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const fetchLicensesAndSchools = async () => {
    setLoading(true);
    try {
      const [schoolsList, codesSnap] = await Promise.all([
        schoolService.fetchSchools(),
        getDocs(collection(db, 'activation_codes'))
      ]);

      setAvailableSchools(schoolsList);

      const list: SchoolLicense[] = [];
      const now = new Date();
      const defaultExp = new Date(now.getTime() + 180 * 86400000).toISOString().split('T')[0];
      const defaultStart = new Date(now.getTime() - 180 * 86400000).toISOString().split('T')[0];
      const todayStr = now.toISOString().split('T')[0];

      for (const data of schoolsList) {
        const sId = data.id;
        const exp = (data as any).expiryDate || (data as any).subscriptionEnd || defaultExp;
        const start = (data as any).subscriptionStart || (data.createdAt ? String(data.createdAt).split('T')[0] : defaultStart);
        const issued = (data as any).receiptIssuedDate || start || todayStr;
        const currentStd = Number(data.studentsCount || data.students || 0);

        // Derive consistent stable numbers for Receipt and License
        const numericHash = Math.abs(
          sId.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
        );
        const receiptNo = data.receiptNumber || `RCPT-B6-2026-${String(numericHash % 9000 + 1000)}`;
        const licenseNo = data.licenseNumber || `B6-LIC-${sId.slice(0, 3).toUpperCase()}-${String((numericHash * 7) % 90000 + 10000)}`;

        const status = computeLicenseStatus(data.status, exp);
        const maxCapacity = data.maxStudents || (data.plan === 'enterprise' ? 3000 : data.plan === 'premium' ? 1500 : 600);
        const defaultFee = data.subscriptionFee || (data.plan === 'enterprise' ? 4500000 : data.plan === 'premium' ? 2500000 : 1500000);
        const paymentStat: PaymentStatus = (data.paymentStatus as PaymentStatus) || 'paid';

        const savedLocalLogo = typeof localStorage !== 'undefined' ? localStorage.getItem(`school_logo_${sId}`) : null;
        const resolvedLogo = data.schoolLogoUrl || data.logoUrl || (data as any).schoolLogo || savedLocalLogo || getOfficialSchoolLogoUrl(sId, data.name);

        // Pre-generate verification QR code
        const verifyPayload = `https://bayraq-gate6.iq/verify?lic=${licenseNo}&rcpt=${receiptNo}&school=${encodeURIComponent(data.name || 'مدرسة')}&exp=${exp}&cap=${maxCapacity}&status=${status}`;
        const qrUrl = await generateQrDataUrl(verifyPayload);

        list.push({
          id: sId,
          schoolId: sId,
          schoolName: data.name || 'مدرسة غير مسمّاة',
          governorate: data.governorate || 'بغداد',
          receiptNumber: receiptNo,
          licenseNumber: licenseNo,
          plan: (data.plan as PlanTier) || 'standard',
          status,
          maxStudents: maxCapacity,
          currentStudents: currentStd,
          startDate: start,
          expiryDate: exp,
          issuedDate: issued,
          subscriptionFee: defaultFee,
          paymentStatus: paymentStat,
          contactPerson: data.adminName || 'المدير المفوض',
          contactPhone: data.adminPhone || '07700000000',
          notes: data.licenseNotes || 'ترخيص سنوي معتمد لاستخدام منصة بوابة بيرق التعليمية.',
          aiQuotaMonthly: data.plan === 'enterprise' ? 10000 : data.plan === 'premium' ? 5000 : 2000,
          qrCodeUrl: qrUrl,
          schoolStamp: data.stampUrl || data.schoolStamp || data.sealUrl || '',
          schoolLogo: resolvedLogo
        });
      }

      setLicenses(list);
    } catch (e) {
      console.error('Error fetching licensing data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicensesAndSchools();
  }, []);

  const handleSelectSchoolToGrant = (schoolId: string) => {
    const sc = availableSchools.find(s => s.id === schoolId);
    if (!sc) return;
    const defaultExp = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
    const defaultFee = sc.plan === 'enterprise' ? 4500000 : sc.plan === 'premium' ? 2500000 : 1500000;
    const maxCapacity = sc.maxStudents || (sc.plan === 'enterprise' ? 3000 : sc.plan === 'premium' ? 1500 : 600);
    
    setGrantForm({
      schoolId: sc.id,
      schoolName: sc.name,
      governorate: sc.governorate || 'الديوانية - غماس',
      plan: (sc.plan as PlanTier) || 'standard',
      maxStudents: maxCapacity,
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: defaultExp,
      subscriptionFee: defaultFee,
      paymentStatus: (sc.paymentStatus as PaymentStatus) || 'paid',
      contactPerson: sc.adminName || `إدارة ${sc.name}`,
      contactPhone: sc.adminPhone || '07700000000',
      notes: sc.licenseNotes || 'ترخيص سنوي معتمد لاستخدام منصة بوابة بيرق التعليمية.'
    });
  };

  const handleGrantLicenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantForm.schoolId) {
      showToast('يرجى اختيار المدرسة أولاً لمنحها الترخيص');
      return;
    }

    const sc = availableSchools.find(s => s.id === grantForm.schoolId);
    const sId = grantForm.schoolId;
    const numericHash = Math.abs(
      sId.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
    );
    const receiptNo = sc?.receiptNumber || `RCPT-B6-2026-${String(numericHash % 9000 + 1000)}`;
    const licenseNo = sc?.licenseNumber || `B6-LIC-${sId.slice(0, 3).toUpperCase()}-${String((numericHash * 7) % 90000 + 10000)}`;

    const savedLocalLogo = typeof localStorage !== 'undefined' ? localStorage.getItem(`school_logo_${sId}`) : null;
    const resolvedLogo = sc?.schoolLogoUrl || sc?.logoUrl || (sc as any)?.schoolLogo || savedLocalLogo || getOfficialSchoolLogoUrl(sId, grantForm.schoolName);

    const newLicense: SchoolLicense = {
      id: sId,
      schoolId: sId,
      schoolName: grantForm.schoolName,
      governorate: grantForm.governorate,
      receiptNumber: receiptNo,
      licenseNumber: licenseNo,
      plan: grantForm.plan,
      status: computeLicenseStatus('active', grantForm.expiryDate),
      maxStudents: Number(grantForm.maxStudents),
      currentStudents: Number(sc?.studentsCount || sc?.students || 0),
      startDate: grantForm.startDate,
      expiryDate: grantForm.expiryDate,
      issuedDate: new Date().toISOString().split('T')[0],
      subscriptionFee: Number(grantForm.subscriptionFee),
      paymentStatus: grantForm.paymentStatus,
      contactPerson: grantForm.contactPerson,
      contactPhone: grantForm.contactPhone,
      notes: grantForm.notes,
      aiQuotaMonthly: grantForm.plan === 'enterprise' ? 10000 : grantForm.plan === 'premium' ? 5000 : 2000,
      qrCodeUrl: '',
      schoolStamp: '',
      schoolLogo: resolvedLogo
    };

    await handleUpdateLicense(newLicense);
    setIsGrantLicenseModalOpen(false);
    setSelectedReceipt(newLicense);
    showToast(`تم منح وتفعيل الترخيص لمدرسة (${grantForm.schoolName}) بنجاح! 🏛️📜`);
  };

  const handleUpdateLicense = async (updated: SchoolLicense) => {
    try {
      const computedStatus = computeLicenseStatus(updated.status, updated.expiryDate);
      const updatedWithStatus = { ...updated, status: computedStatus };

      const payload = {
        plan: updated.plan,
        maxStudents: Number(updated.maxStudents),
        subscriptionStart: updated.startDate,
        expiryDate: updated.expiryDate,
        subscriptionEnd: updated.expiryDate,
        receiptIssuedDate: updated.issuedDate,
        receiptNumber: updated.receiptNumber,
        licenseNumber: updated.licenseNumber,
        subscriptionFee: Number(updated.subscriptionFee),
        paymentStatus: updated.paymentStatus,
        adminName: updated.contactPerson || '',
        adminPhone: updated.contactPhone || '',
        licenseNotes: updated.notes || '',
        status: updated.status === "suspended" ? "suspended" : "active"
      };

      try {
        await fetch(`/api/schools/${updated.schoolId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch(e) {}

      await setDoc(doc(db, "schools", updated.schoolId), payload, { merge: true });

      await logActivity({
        action: 'تحديث بيانات ترخيص ووصل المدرسة',
        details: `تم تحديث بيانات ترخيص مدرسة ${updated.schoolName} (الترخيص: ${updated.licenseNumber} - الوصل: ${updated.receiptNumber}) حتى ${updated.expiryDate}`,
        targetId: updated.schoolId,
        targetType: 'school_licenses'
      });

      // Update QR code url
      const verifyPayload = `https://bayraq-gate6.iq/verify?lic=${updated.licenseNumber}&rcpt=${updated.receiptNumber}&school=${encodeURIComponent(updated.schoolName)}&exp=${updated.expiryDate}&cap=${updated.maxStudents}&status=${computedStatus}`;
      const newQrUrl = await generateQrDataUrl(verifyPayload);
      const finalRecord = { ...updatedWithStatus, qrCodeUrl: newQrUrl };

      setLicenses(prev => prev.map(l => l.schoolId === updated.schoolId ? finalRecord : l));
      showToast(`تم حفظ وتحديث ترخيص ووصل مدرسة (${updated.schoolName}) بنجاح 🔒⚡`);
      setEditingLicense(null);
      if (selectedReceipt?.schoolId === updated.schoolId) {
        setSelectedReceipt(finalRecord);
      }
    } catch (e) {
      console.error('Failed to update license:', e);
      showToast('تم تحديث البيانات في الذاكرة الحالية');
      setLicenses(prev => prev.map(l => l.schoolId === updated.schoolId ? updated : l));
      setEditingLicense(null);
    }
  };

  const handleQuickExtend = async (lic: SchoolLicense, days: number) => {
    const currentExp = new Date(lic.expiryDate);
    const newExp = new Date(Math.max(Date.now(), currentExp.getTime()) + days * 86400000);
    const newExpStr = newExp.toISOString().split('T')[0];

    const updated: SchoolLicense = {
      ...lic,
      expiryDate: newExpStr,
      status: computeLicenseStatus('active', newExpStr)
    };
    await handleUpdateLicense(updated);
  };

  const generateLicenseCanvas = async (lic: SchoolLicense): Promise<HTMLCanvasElement> => {
    try {
      if (document.fonts) {
        await document.fonts.ready;
      }
    } catch {
      // Continue if fonts API not available
    }

    const canvas = document.createElement('canvas');
    // Standard A4 aspect ratio 1 : 1.4142 at high resolution (1600 x 2263 px)
    canvas.width = 1600;
    canvas.height = 2263;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');

    // 1. Pristine luxury off-white certificate background
    ctx.fillStyle = '#fafaf8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Guilloche Security Watermark Pattern
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.globalAlpha = 0.022;
    ctx.font = 'bold 36px "Tajawal", "Noto Sans Arabic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 6);
    const watermark = 'BAYRAQ GATE 6  •  OFFICIAL SCHOOL LICENSE  •  بوابة بيرق  •  ترخيص معتمد';
    for (let i = -3; i <= 3; i++) {
      for (let j = -7; j <= 7; j++) {
        ctx.fillText(watermark, i * 900, j * 160);
      }
    }
    ctx.restore();

    // 3. Luxury Dual Outer & Inner Borders
    ctx.strokeStyle = '#d97706'; // Amber/Gold 600
    ctx.lineWidth = 6;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    ctx.strokeStyle = '#059669'; // Emerald 600
    ctx.lineWidth = 2.5;
    ctx.strokeRect(52, 52, canvas.width - 104, canvas.height - 104);

    // Corner Rosette Accents
    const drawCornerRosette = (cx: number, cy: number) => {
      ctx.save();
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    };
    drawCornerRosette(52, 52);
    drawCornerRosette(canvas.width - 52, 52);
    drawCornerRosette(52, canvas.height - 52);
    drawCornerRosette(canvas.width - 52, canvas.height - 52);

    // 4. Top Security Ribbon
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(52, 52, canvas.width - 104, 55);

    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 22px "Tajawal", "Noto Sans Arabic", sans-serif';
    ctx.fillText('وثيقة ترخيص واشتراك مدرسي رسمي معتمد  •  منصة بوابة بيرق  •  BAYRAQ GATE 6', canvas.width / 2, 80);

    // 5. Load Official Logo
    const logo = new Image();
    await new Promise<void>((resolve) => {
      logo.onload = () => resolve();
      logo.onerror = () => resolve();
      logo.src = '/logo.png';
    });

    // 6. Load High-Resolution Verification QR Code
    const verifyPayload = `https://bayraq-gate6.iq/verify?lic=${lic.licenseNumber}&rcpt=${lic.receiptNumber}&school=${encodeURIComponent(lic.schoolName)}&exp=${lic.expiryDate}&cap=${lic.maxStudents}&status=${lic.status}`;
    const QRCode = (await import('qrcode')).default;
    const qrDataUrl = await QRCode.toDataURL(verifyPayload, {
      width: 400,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' }
    });
    const qrImage = new Image();
    qrImage.src = qrDataUrl;
    await new Promise((res) => {
      qrImage.onload = res;
      qrImage.onerror = res;
    });

    // 7. Load School Stamp (if available)
    let schoolStampImg: HTMLImageElement | null = null;
    if (lic.schoolStamp) {
      const sImg = new Image();
      sImg.crossOrigin = 'anonymous';
      await new Promise<void>((res) => {
        sImg.onload = () => { schoolStampImg = sImg; res(); };
        sImg.onerror = () => { schoolStampImg = null; res(); };
        sImg.src = lic.schoolStamp!;
      });
    }

    // 8. Header Section
    ctx.textBaseline = 'top';
    ctx.textAlign = 'right';

    // Circular Bayraq Logo Badge on Top Left
    const logoCx = 160;
    const logoCy = 195;
    const logoR = 64;

    ctx.save();
    // Outer decorative gold circle
    ctx.beginPath();
    ctx.arc(logoCx, logoCy, logoR + 7, 0, Math.PI * 2);
    ctx.fillStyle = '#fef3c7';
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Inner emerald ring
    ctx.beginPath();
    ctx.arc(logoCx, logoCy, logoR + 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Circular clip for logo
    ctx.beginPath();
    ctx.arc(logoCx, logoCy, logoR, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#070B19';
    ctx.fillRect(logoCx - logoR, logoCy - logoR, logoR * 2, logoR * 2);
    if (logo.complete && logo.naturalHeight !== 0) {
      ctx.drawImage(logo, logoCx - logoR, logoCy - logoR, logoR * 2, logoR * 2);
    }
    ctx.restore();

    // Header Titles (RTL, right-aligned)
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 44px "Tajawal", "Noto Sans Arabic", sans-serif';
    ctx.fillText('منصة بوابة بيرق الذكية (BAYRAQ GATE 6)', canvas.width - 90, 145);

    ctx.fillStyle = '#059669';
    ctx.font = 'bold 24px "Tajawal", "Noto Sans Arabic", sans-serif';
    ctx.fillText('وصل ترخيص واشتراك مدرسي رسمي معتمد  •  OFFICIAL LICENSE & SUBSCRIPTION VOUCHER', canvas.width - 90, 205);

    // 9. Top Meta Bar (4 spacious columns)
    const topBarY = 275;
    const contentWidth = canvas.width - 150; // 1450 px
    const leftX = 75;
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(leftX, topBarY, contentWidth, 135, 22);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Col 1 (Right): Receipt Number
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 20px "Tajawal", sans-serif';
    ctx.fillText('رقم الوصل الفريد:', canvas.width - 105, topBarY + 26);
    ctx.fillStyle = '#b45309';
    ctx.font = 'bold 28px monospace';
    ctx.fillText(lic.receiptNumber, canvas.width - 105, topBarY + 68);

    // Col 2: License Number
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 20px "Tajawal", sans-serif';
    ctx.fillText('رقم الترخيص المعتمد:', canvas.width - 455, topBarY + 26);
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 26px monospace';
    ctx.fillText(lic.licenseNumber, canvas.width - 455, topBarY + 68);

    // Col 3: Issue Date
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 20px "Tajawal", sans-serif';
    ctx.fillText('تاريخ إصدار الوصل:', canvas.width - 820, topBarY + 26);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 25px "Tajawal", sans-serif';
    ctx.fillText(lic.issuedDate, canvas.width - 820, topBarY + 68);

    // Col 4: License Status
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 20px "Tajawal", sans-serif';
    ctx.fillText('حالة الوصل والترخيص:', canvas.width - 1140, topBarY + 26);
    ctx.fillStyle = lic.status === 'active' ? '#059669' : lic.status === 'expiring_soon' ? '#d97706' : '#dc2626';
    ctx.font = 'bold 24px "Tajawal", sans-serif';
    ctx.fillText(
      lic.status === 'active' ? '🟢 سارٍ ونشط رسمياً' : lic.status === 'expiring_soon' ? '🟡 سارٍ (قريب الانتهاء)' : '🔴 منتهي الصلاحية',
      canvas.width - 1140,
      topBarY + 68
    );

    // 10. Two Core Details Cards
    const cardsY = 440;
    const cardW = (contentWidth - 30) / 2; // 710px
    const cardH = 440;

    // Card 1 (Right): School Details
    const card1X = leftX + cardW + 30; // 815
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(card1X, cardsY, cardW, cardH, 22);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#d97706';
    ctx.font = 'bold 26px "Tajawal", sans-serif';
    ctx.fillText('🏢 بيانات الجهة والمدرسة المرخصة', card1X + cardW - 28, cardsY + 28);

    ctx.strokeStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(card1X + 22, cardsY + 72);
    ctx.lineTo(card1X + cardW - 22, cardsY + 72);
    ctx.stroke();

    const schoolRows = [
      { label: 'اسم المدرسة:', val: lic.schoolName, bold: true },
      { label: 'المحافظة:', val: lic.governorate },
      { label: 'المعرف المؤسسي:', val: lic.schoolId, font: 'monospace' },
      { label: 'المسؤول المفوض:', val: lic.contactPerson },
      { label: 'هاتف التواصل:', val: lic.contactPhone, font: 'monospace', color: '#059669', bold: true }
    ];

    schoolRows.forEach((r, idx) => {
      const rowY = cardsY + 98 + idx * 64;
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 22px "Tajawal", sans-serif';
      ctx.fillText(r.label, card1X + cardW - 28, rowY);

      ctx.fillStyle = (r as any).color || '#0f172a';
      ctx.font = r.font === 'monospace' ? 'bold 24px monospace' : (r.bold ? 'bold 25px "Tajawal", sans-serif' : '23px "Tajawal", sans-serif');
      ctx.textAlign = 'left';
      ctx.direction = 'ltr';
      ctx.fillText(r.val, card1X + 28, rowY);
      ctx.direction = 'rtl';
      ctx.textAlign = 'right';
    });

    // Card 2 (Left): Subscription & License Scope
    const card2X = leftX;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(card2X, cardsY, cardW, cardH, 22);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#4f46e5';
    ctx.font = 'bold 26px "Tajawal", sans-serif';
    ctx.fillText('🏆 باقة الترخيص وفترة الصلاحية', card2X + cardW - 28, cardsY + 28);

    ctx.strokeStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(card2X + 22, cardsY + 72);
    ctx.lineTo(card2X + cardW - 22, cardsY + 72);
    ctx.stroke();

    const daysRem = calculateRemainingDays(lic.expiryDate);
    const scopeRows = [
      { label: 'نوع الباقة:', val: getPlanArabicName(lic.plan), bold: true },
      { label: 'السعة المرخصة للطلاب:', val: `${lic.maxStudents.toLocaleString()} طالب`, color: '#059669', bold: true },
      { label: 'بداية الاشتراك:', val: lic.startDate, font: 'monospace' },
      { label: 'نهاية الاشتراك:', val: lic.expiryDate, font: 'monospace', color: '#b45309', bold: true },
      { label: 'الأيام المتبقية:', val: daysRem > 0 ? `${daysRem} يوم متبقي` : 'منتهي الصلاحية', color: daysRem > 0 ? '#059669' : '#dc2626', bold: true }
    ];

    scopeRows.forEach((r, idx) => {
      const rowY = cardsY + 98 + idx * 64;
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 22px "Tajawal", sans-serif';
      ctx.fillText(r.label, card2X + cardW - 28, rowY);

      ctx.fillStyle = (r as any).color || '#0f172a';
      ctx.font = r.font === 'monospace' ? 'bold 24px monospace' : (r.bold ? 'bold 25px "Tajawal", sans-serif' : '23px "Tajawal", sans-serif');
      ctx.textAlign = 'left';
      ctx.direction = 'ltr';
      ctx.fillText(r.val, card2X + 28, rowY);
      ctx.direction = 'rtl';
      ctx.textAlign = 'right';
    });

    // 11. Financial & Payment Box
    const finY = 910;
    ctx.fillStyle = '#fefce8';
    ctx.beginPath();
    ctx.roundRect(leftX, finY, contentWidth, 145, 22);
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#854d0e';
    ctx.font = 'bold 22px "Tajawal", sans-serif';
    ctx.fillText('قيمة الاشتراك المالي المعتمد:', canvas.width - 105, finY + 28);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 44px "Tajawal", sans-serif';
    ctx.fillText(`${(lic.subscriptionFee || 0).toLocaleString()} د.ع`, canvas.width - 105, finY + 74);

    ctx.fillStyle = '#854d0e';
    ctx.font = 'bold 22px "Tajawal", sans-serif';
    ctx.fillText('حالة السداد والتوثيق المالي:', canvas.width - 790, finY + 28);
    ctx.fillStyle = lic.paymentStatus === 'paid' ? '#059669' : lic.paymentStatus === 'partial' ? '#d97706' : '#dc2626';
    ctx.font = 'bold 30px "Tajawal", sans-serif';
    ctx.fillText(
      lic.paymentStatus === 'paid' ? '✓ مدفوع بالكامل (معتمد رسمي)' : lic.paymentStatus === 'partial' ? '⏳ دفعة جزئية' : '⚠️ بانتظار استكمال السداد',
      canvas.width - 790,
      finY + 76
    );

    // 12. Mandatory Legal Disclaimer Clause Box
    const legalY = 1080;
    ctx.fillStyle = '#fffbeb';
    ctx.beginPath();
    ctx.roundRect(leftX, legalY, contentWidth, 215, 22);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#b45309';
    ctx.font = 'bold 25px "Tajawal", sans-serif';
    ctx.fillText('⚠️ إقرار وشروط الترخيص الرسمي (License Terms & Agreement):', canvas.width - 105, legalY + 30);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 25px "Tajawal", "Noto Sans Arabic", sans-serif';
    const disclaimerLine1 = '« هذا الوصل يثبت ترخيص الجهة لاستخدام خدمات منصة بوابة بيرق وفق الباقة والمدة المحددة،';
    const disclaimerLine2 = 'ولا يمنح أي حقوق ملكية أو شراكة أو حصة مالية في المنصة بأي شكل من الأشكال. »';
    ctx.fillText(disclaimerLine1, canvas.width - 105, legalY + 86);
    ctx.fillText(disclaimerLine2, canvas.width - 105, legalY + 140);

    // 13. Verification, Stamps & Signatures Section (3 Balanced Columns - Fully Utilizing Canvas Height)
    const verifySectionY = 1325;
    const verifyH = 800;

    // Background Card
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(leftX, verifySectionY, contentWidth, verifyH, 24);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Column 1 (Right): Official Bayraq Electronic Stamp
    const stampColRightX = canvas.width - 320;
    const stampCenterY = verifySectionY + 250;
    const stampR = 135;

    ctx.save();
    ctx.strokeStyle = '#991b1b'; // Deep Crimson
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(stampColRightX, stampCenterY, stampR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 2.2;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.arc(stampColRightX, stampCenterY, stampR - 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#991b1b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 25px "Tajawal", sans-serif';
    ctx.fillText('منصة بوابة بيرق', stampColRightX, stampCenterY - 55);
    ctx.font = 'bold 30px "Tajawal", sans-serif';
    ctx.fillText('ختم واعتماد إلكتروني', stampColRightX, stampCenterY - 5);
    ctx.font = 'bold 21px "Tajawal", sans-serif';
    ctx.fillText('الإدارة المركزية للتراخيص', stampColRightX, stampCenterY + 42);
    ctx.font = 'bold 16px monospace';
    ctx.fillText('GATE 6 VERIFIED', stampColRightX, stampCenterY + 76);
    ctx.restore();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px "Tajawal", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ختم منصة بوابة بيرق الرسمي', stampColRightX, verifySectionY + 445);
    ctx.font = '18px "Tajawal", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('توثيق سحابي رقمي مشفر', stampColRightX, verifySectionY + 485);

    // Column 2 (Center): School Authorized Seal (مكان ختم واعتماد الجهة المرخصة)
    const schoolSealCenterX = leftX + (contentWidth / 2);
    const schoolSealCenterY = stampCenterY;

    ctx.save();
    if (schoolStampImg && (schoolStampImg as HTMLImageElement).complete && (schoolStampImg as HTMLImageElement).naturalHeight !== 0) {
      ctx.beginPath();
      ctx.arc(schoolSealCenterX, schoolSealCenterY, stampR, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(schoolStampImg, schoolSealCenterX - stampR, schoolSealCenterY - stampR, stampR * 2, stampR * 2);
    } else {
      // Official Blank Stamp Placeholder Box
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.setLineDash([9, 6]);
      ctx.beginPath();
      ctx.arc(schoolSealCenterX, schoolSealCenterY, stampR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(schoolSealCenterX, schoolSealCenterY, stampR - 14, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 22px "Tajawal", sans-serif';
      ctx.fillText('مخصص لختم المدرسة الرسمي', schoolSealCenterX, schoolSealCenterY - 18);
      ctx.font = '20px "Tajawal", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('(يُختم ويُوقّع هنا)', schoolSealCenterX, schoolSealCenterY + 24);
    }
    ctx.restore();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px "Tajawal", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ختم واعتماد الجهة المرخصة', schoolSealCenterX, verifySectionY + 445);
    ctx.font = 'bold 20px "Tajawal", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`إدارة مدرسة: ${lic.schoolName}`, schoolSealCenterX, verifySectionY + 485);

    // Column 3 (Left): High-Resolution Enlarged QR Code + Required Verification Text
    const qrBoxCenterX = leftX + 240;
    const qrSize = 340;
    const qrTopLeftX = qrBoxCenterX - (qrSize / 2);
    const qrTopLeftY = verifySectionY + 80;

    if (qrImage.complete && qrImage.naturalHeight !== 0) {
      ctx.drawImage(qrImage, qrTopLeftX, qrTopLeftY, qrSize, qrSize);
    }

    // Required Text Underneath QR: "امسح للتحقق من صحة الترخيص"
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px "Tajawal", "Noto Sans Arabic", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('امسح للتحقق من صحة الترخيص', qrBoxCenterX, verifySectionY + 445);

    ctx.fillStyle = '#059669';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`ID: ${lic.licenseNumber}`, qrBoxCenterX, verifySectionY + 485);

    // 14. Security Footer at Bottom
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 19px monospace, "Tajawal", sans-serif';
    ctx.fillText(`SECURE DIGITAL LICENSING  •  PLATFORM BAYRAQ GATE 6  •  AUDIT ID: ${lic.receiptNumber}`, canvas.width / 2, canvas.height - 75);

    return canvas;
  };

  const handleExportPdf = async (lic: SchoolLicense) => {
    setIsGeneratingDoc(true);
    showToast('جاري تصدير وثيقة الترخيص الرسمية (A4 PDF)...');
    try {
      const canvas = await generateLicenseCanvas(lic);
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      // Standard A4 dimensions in mm: 210 x 297
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');

      const fileName = `Official_License_Receipt_${lic.schoolName.replace(/[\s\W]+/g, '_')}_${lic.receiptNumber}.pdf`;
      pdf.save(fileName);
      showToast('✅ تم تصدير وتحميل مستند PDF الرسمي بنجاح!');
    } catch (e) {
      console.error('Failed to export PDF:', e);
      showToast('❌ تعذر التصدير التلقائي. يتم فتح نافذة الطباعة...');
      window.print();
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  const handleDownloadImage = async (lic: SchoolLicense) => {
    setIsGeneratingDoc(true);
    showToast('جاري حفظ صورة الوصل الرسمية عالية الدقة...');
    try {
      const canvas = await generateLicenseCanvas(lic);
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const fileName = `Official_License_Receipt_${lic.schoolName.replace(/[\s\W]+/g, '_')}_${lic.receiptNumber}.png`;
      const fileObj = new File([blob], fileName, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [fileObj] })) {
        try {
          await navigator.share({
            files: [fileObj],
            title: 'وصل ترخيص واشتراك مدرسي رسمي',
            text: `وصل ترخيص واشتراك مدرسة ${lic.schoolName} من منصة بوابة بيرق (رقم الوصل: ${lic.receiptNumber})`
          });
          showToast('✅ تمت المشاركة والحفظ بنجاح!');
          return;
        } catch (err: any) {
          if (err?.name !== 'AbortError') {
            console.log('Fallback to direct download...');
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
      showToast('✅ تم تنزيل وحفظ صورة الوصل بنجاح!');
    } catch (e) {
      console.error('Failed to download image:', e);
      showToast('❌ تعذر حفظ الصورة.');
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  const handleDownloadOrPrintReceipt = async (lic: SchoolLicense) => {
    await handleExportPdf(lic);
  };

  // Filtered dataset
  const filteredLicenses = licenses.filter(lic => {
    if (filterPlan !== 'all' && lic.plan !== filterPlan) return false;
    if (filterStatus !== 'all' && lic.status !== filterStatus) return false;
    if (filterPayment !== 'all' && lic.paymentStatus !== filterPayment) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        lic.schoolName.toLowerCase().includes(term) ||
        lic.schoolId.toLowerCase().includes(term) ||
        lic.licenseNumber.toLowerCase().includes(term) ||
        lic.receiptNumber.toLowerCase().includes(term) ||
        lic.governorate.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // KPI Counters
  const totalSchools = licenses.length;
  const activeLicensesCount = licenses.filter(l => l.status === 'active').length;
  const expiringSoonCount = licenses.filter(l => l.status === 'expiring_soon').length;
  const expiredCount = licenses.filter(l => l.status === 'expired').length;
  const suspendedCount = licenses.filter(l => l.status === 'suspended').length;
  const totalCapacity = licenses.reduce((acc, l) => acc + l.maxStudents, 0);
  const totalEnrolled = licenses.reduce((acc, l) => acc + l.currentStudents, 0);
  const totalReceiptsValue = licenses.reduce((acc, l) => acc + (l.subscriptionFee || 0), 0);

  const getPlanArabicName = (plan: PlanTier) => {
    switch (plan) {
      case 'trial': return 'الباقة التجريبية (Trial)';
      case 'standard': return 'الباقة الأساسية (Standard)';
      case 'premium': return 'الباقة المتقدمة (Premium)';
      case 'enterprise': return 'الباقة المؤسسية الشاملة (Enterprise)';
      case 'custom': return 'باقة مخصصة (Custom)';
      default: return plan;
    }
  };

  const getStatusBadge = (status: LicenseStatus, daysRemaining: number) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            🟢 نشط وسارٍ
          </span>
        );
      case 'expiring_soon':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <AlertTriangle size={12} className="text-amber-400" />
            🟡 قريب الانتهاء ({daysRemaining} يوم)
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <Ban size={12} />
            🔴 منتهي الصلاحية
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-slate-500/20 text-slate-300 border border-slate-500/30">
            <Lock size={12} />
            ⚪ موقوف مؤقتاً
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Archive size={12} className="text-amber-400" />
            📦 مؤرشفة (Read-Only)
          </span>
        );
    }
  };

  const getPaymentBadge = (payment: PaymentStatus) => {
    switch (payment) {
      case 'paid':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            مدفوع بالكامل ✓
          </span>
        );
      case 'partial':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
            دفعة جزئية ⏳
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20">
            بانتظار السداد ⚠️
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-400/40 text-xs font-bold flex items-center gap-2"
          >
            <Sparkles size={16} className="text-amber-300 animate-spin" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#050A18] via-[#0B1128] to-[#0A1A2F] border border-emerald-500/30 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-inner">
                <ShieldCheck size={26} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  منظومة التراخيص وإدارة الاشتراكات المدرسية
                  <span className="text-[11px] font-mono font-normal px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    BAYRAQ GATE 6
                  </span>
                </h2>
                <p className="text-xs text-white/60 font-bold mt-0.5">
                  إدارة عقود الاستخدام، السعة المرخصة، وإصدار وصولات التراخيص الرسمية المعتمدة مع رمز التحقق الإلكتروني QR.
                </p>
              </div>
            </div>

            {/* Legal Notice Note Banner */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-3 text-[11px] text-white/70 flex items-start gap-2.5">
              <HelpCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-black text-amber-300">طبيعة العلاقة التعاقدية: </span>
                المدارس والجهات المشتركة هي عملاء يدفعون مقابل حق استخدام خدمات تطبيق ومنصة "بوابة بيرق"، ولا تمنح الاشتراكات أي حصص شراكة أو حقوق ملكية أو نسب من إيرادات المنصة.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                if (availableSchools.length > 0) {
                  handleSelectSchoolToGrant(availableSchools[0].id);
                }
                setIsGrantLicenseModalOpen(true);
              }}
              className="px-5 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-2xl font-black text-xs transition-all active:scale-95 shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer border border-emerald-300"
            >
              <PlusCircle size={18} />
              منح ترخيص جديد لمدرسة 🏛️📜
            </button>

            <button
              onClick={() => {
                setArchiveTargetSchoolId(null);
                setActiveTab('archives');
              }}
              className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-2xl font-black text-xs transition-all active:scale-95 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer border border-amber-400/40"
            >
              <Archive size={18} />
              أرشيف المدرسة والسجلات 📦
            </button>

            <button
              onClick={() => {
                if (licenses.length > 0) {
                  setSelectedReceipt(licenses[0]);
                } else {
                  showToast('لا توجد مدارس مسجلة حالياً لعرض الوصل');
                }
              }}
              className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-xs transition-all active:scale-95 shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30"
            >
              <FileText size={18} />
              عرض وصل ترخيص رسمي 📄
            </button>

            <button
              onClick={fetchLicensesAndSchools}
              className="p-3 bg-white/5 hover:bg-white/10 text-white/80 rounded-2xl transition-all border border-white/10"
              title="تحديث البيانات"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-3 bg-[#080B1C] border border-white/10 p-1.5 rounded-2xl max-w-lg">
        <button
          onClick={() => setActiveTab('licenses')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'licenses'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <ShieldCheck size={16} />
          <span>سجل التراخيص والوصولات ({licenses.length})</span>
        </button>

        <button
          onClick={() => {
            setArchiveTargetSchoolId(null);
            setActiveTab('archives');
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'archives'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Archive size={16} />
          <span>أرشيف المدارس والسجلات 📦</span>
        </button>
      </div>

      {/* Render Active View */}
      {activeTab === 'archives' ? (
        <SchoolArchiveManager
          schools={licenses.map(l => ({
            id: l.id,
            schoolId: l.schoolId,
            schoolName: l.schoolName,
            name: l.schoolName,
            governorate: l.governorate,
            status: l.status,
            plan: l.plan,
            expiryDate: l.expiryDate,
            subscriptionFee: l.subscriptionFee,
            currentStudents: l.currentStudents,
            maxStudents: l.maxStudents
          }))}
          showToast={(msg, type) => showToast(msg)}
          onRefreshSchools={fetchLicensesAndSchools}
          initialSelectedSchoolId={archiveTargetSchoolId}
          onClose={() => setActiveTab('licenses')}
        />
      ) : (
        <>

      {/* Global Licensing KPI Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Schools */}
        <div className="bg-[#0B0D1B] border border-white/10 rounded-3xl p-4 shadow-lg hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-xs font-bold">المدارس المرخصة</span>
            <Building size={18} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white flex items-baseline gap-1.5">
            {activeLicensesCount}
            <span className="text-xs text-white/40 font-normal">/ {totalSchools} مدرسة</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              🟢 {activeLicensesCount} نشطة
            </span>
            {expiringSoonCount > 0 && (
              <span className="text-[10px] font-black text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full">
                🟡 {expiringSoonCount} قريبة
              </span>
            )}
          </div>
        </div>

        {/* Capacity vs Enrolled */}
        <div className="bg-[#0B0D1B] border border-white/10 rounded-3xl p-4 shadow-lg hover:border-indigo-500/30 transition-all">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-xs font-bold">سعة المقاعد المرخصة</span>
            <Users size={18} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white flex items-baseline gap-1.5">
            {totalEnrolled.toLocaleString()}
            <span className="text-xs text-white/40 font-normal">/ {totalCapacity.toLocaleString()} مقعد</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2 mt-2.5 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all"
              style={{ width: `${totalCapacity > 0 ? Math.min(100, Math.round((totalEnrolled / totalCapacity) * 100)) : 0}%` }}
            />
          </div>
        </div>

        {/* Expiry Alerts */}
        <div className="bg-[#0B0D1B] border border-white/10 rounded-3xl p-4 shadow-lg hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-xs font-bold">حالة التراخيص والصلاحية</span>
            <Clock size={18} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white flex items-baseline gap-2">
            <span className="text-emerald-400 text-xl font-bold">{activeLicensesCount} سارٍ</span>
            {expiredCount > 0 && <span className="text-rose-400 text-xs font-bold">({expiredCount} منتهي)</span>}
          </div>
          <p className="text-[10px] text-white/50 font-bold mt-1.5">
            {expiringSoonCount > 0 ? `⚠️ يوجد ${expiringSoonCount} اشتراك ينتهي خلال 30 يوم` : '✓ جميع التراخيص ضمن فترة الصلاحية'}
          </p>
        </div>

        {/* Security & Verification Tokens */}
        <div className="bg-[#0B0D1B] border border-white/10 rounded-3xl p-4 shadow-lg hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between text-white/40 mb-2">
            <span className="text-xs font-bold">الوصولات المعتمدة رقمياً</span>
            <QrCodeIcon size={18} className="text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300">{totalSchools} وصل معتمد</div>
          <p className="text-[10px] text-purple-400 font-bold mt-1 flex items-center gap-1">
            <CheckCircle2 size={12} /> توثيق سحابي مشفر بـ QR Code
          </p>
        </div>
      </div>

      {/* Licenses & Subscriptions Matrix Table */}
      <div className="bg-[#0B0D1B] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Award size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-white">سجل التراخيص ووصولات الاشتراكات المدرسية</h3>
              <p className="text-xs text-white/40">استعراض تفاصيل العقد، السعة، الأيام المتبقية، والوصول الفوري لوصل الاشتراك الرسمي</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
              <input
                type="text"
                placeholder="ابحث باسم المدرسة، رقم الترخيص أو الوصل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-emerald-400 font-bold"
              />
            </div>

            {/* Plan Filter */}
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none font-bold"
            >
              <option value="all" className="bg-[#0B0D1B]">كافة الباقات</option>
              <option value="trial" className="bg-[#0B0D1B]">تجريبي (Trial)</option>
              <option value="standard" className="bg-[#0B0D1B]">أساسي (Standard)</option>
              <option value="premium" className="bg-[#0B0D1B]">متقدم (Premium)</option>
              <option value="enterprise" className="bg-[#0B0D1B]">مؤسسي (Enterprise)</option>
              <option value="custom" className="bg-[#0B0D1B]">مخصص (Custom)</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none font-bold"
            >
              <option value="all" className="bg-[#0B0D1B]">كافة الحالات</option>
              <option value="active" className="bg-[#0B0D1B]">🟢 نشط وسارٍ</option>
              <option value="expiring_soon" className="bg-[#0B0D1B]">🟡 قريب الانتهاء</option>
              <option value="expired" className="bg-[#0B0D1B]">🔴 منتهي</option>
              <option value="suspended" className="bg-[#0B0D1B]">⚪ موقوف</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/40 font-bold text-[11px]">
                <th className="pb-3 pr-3">المدرسة / الجهة</th>
                <th className="pb-3 px-2">رقم الوصل والترخيص</th>
                <th className="pb-3 px-2">الباقة والسعة</th>
                <th className="pb-3 px-2">الأيام المتبقية والانتهاء</th>
                <th className="pb-3 px-2">حالة الترخيص</th>
                <th className="pb-3 px-2">قيمة الاشتراك والدفع</th>
                <th className="pb-3 pl-3 text-left">إجراءات الوصل والترخيص</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLicenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-white/40">
                    لا توجد تراخيص تطابق خيارات البحث الحالية.
                  </td>
                </tr>
              ) : (
                filteredLicenses.map((lic) => {
                  const daysRemaining = calculateRemainingDays(lic.expiryDate);
                  const capacityRatio = lic.maxStudents > 0 ? (lic.currentStudents / lic.maxStudents) * 100 : 0;

                  return (
                    <tr key={lic.id} className="hover:bg-white/[0.02] transition-colors group">
                      {/* School Name & Info with Logo */}
                      <td className="py-4 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                            <img
                              src={lic.schoolLogo || getOfficialSchoolLogoUrl(lic.schoolId, lic.schoolName)}
                              alt={lic.schoolName}
                              className="w-full h-full object-contain rounded-lg"
                              referrerPolicy="no-referrer"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                            />
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{lic.schoolName}</div>
                            <div className="text-[10px] text-white/40 mt-0.5 flex items-center gap-1.5">
                              <span>{lic.governorate}</span>
                              <span>•</span>
                              <span className="font-mono text-emerald-400/80">ID: {lic.schoolId}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Receipt & License IDs */}
                      <td className="py-4 px-2">
                        <div className="space-y-1">
                          <div className="font-mono font-bold text-[11px] text-amber-300 flex items-center gap-1">
                            <span>{lic.receiptNumber}</span>
                          </div>
                          <div className="font-mono text-[10px] text-white/50">
                            {lic.licenseNumber}
                          </div>
                        </div>
                      </td>

                      {/* Plan & Capacity */}
                      <td className="py-4 px-2">
                        <div className="space-y-1">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            lic.plan === 'enterprise' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                            lic.plan === 'premium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            lic.plan === 'trial' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                            'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}>
                            {lic.plan}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-white/70 font-mono font-bold">
                            <span>{lic.currentStudents} / {lic.maxStudents} طالب</span>
                          </div>
                        </div>
                      </td>

                      {/* Remaining Days & Expiry */}
                      <td className="py-4 px-2">
                        <div className="space-y-0.5">
                          <div className={`font-black text-xs ${
                            daysRemaining < 0 ? 'text-rose-400' :
                            daysRemaining <= 30 ? 'text-amber-300' :
                            'text-emerald-400'
                          }`}>
                            {daysRemaining > 0 ? `⏳ متبقي ${daysRemaining} يوم` : `⚠️ منتهي منذ ${Math.abs(daysRemaining)} يوم`}
                          </div>
                          <div className="text-[10px] text-white/40 font-mono">
                            حتى: {lic.expiryDate}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-2">
                        {getStatusBadge(lic.status, daysRemaining)}
                      </td>

                      {/* Fee & Payment Status */}
                      <td className="py-4 px-2">
                        <div className="space-y-1">
                          <div className="font-black text-xs text-white">
                            {(lic.subscriptionFee || 0).toLocaleString()} <span className="text-[10px] text-white/40 font-normal">د.ع</span>
                          </div>
                          <div>{getPaymentBadge(lic.paymentStatus)}</div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 pl-3 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Official Receipt */}
                          <button
                            onClick={() => setSelectedReceipt(lic)}
                            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl text-xs font-black transition-all flex items-center gap-1 border border-emerald-500/30 active:scale-95 cursor-pointer shadow-sm"
                            title="عرض وصل الترخيص والاشتراك الرسمي"
                          >
                            <FileText size={14} />
                            عرض الوصل
                          </button>

                          {/* Print / Save PDF Direct */}
                          <button
                            onClick={() => handleDownloadOrPrintReceipt(lic)}
                            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-xl transition-all border border-emerald-500/20"
                            title="حفظ وتصدير الوصل الرقمي (PDF / صورة)"
                          >
                            <Download size={15} />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedReceipt(lic);
                              setTimeout(() => {
                                window.print();
                              }, 350);
                            }}
                            className="p-1.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-xl transition-all border border-white/10"
                            title="طباعة ورقية مباشرة"
                          >
                            <Printer size={15} />
                          </button>

                          {/* Quick +1 Year */}
                          <button
                            onClick={() => handleQuickExtend(lic, 365)}
                            className="px-2.5 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-xl text-[11px] font-bold transition-all border border-indigo-500/30 active:scale-95 cursor-pointer"
                            title="تمديد سنة كاملة فوراً"
                          >
                            +1 سنة
                          </button>

                          {/* Archive School Data */}
                          <button
                            onClick={() => {
                              setArchiveTargetSchoolId(lic.schoolId);
                              setActiveTab('archives');
                            }}
                            className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-[11px] font-bold transition-all border border-amber-500/30 active:scale-95 flex items-center gap-1 cursor-pointer"
                            title="أرشفة المدرسة وتنزيل تقرير وسجل البيانات الكامل"
                          >
                            <Archive size={13} />
                            <span>أرشفة</span>
                          </button>

                          {/* Grant / Edit / Configure */}
                          <button
                            onClick={() => setEditingLicense(lic)}
                            className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded-xl text-[11px] font-bold transition-all border border-emerald-500/30 flex items-center gap-1 cursor-pointer active:scale-95"
                            title="تعديل وتحديث تفاصيل وسعة الترخيص"
                          >
                            <ShieldCheck size={14} />
                            <span>منح / تعديل</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* ========================================================================= */}
      {/* 📄 OFFICIAL SCHOOL LICENSE & SUBSCRIPTION RECEIPT MODAL (وصل الترخيص الرسمي) */}
      {/* ========================================================================= */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#070B19] border border-amber-500/40 rounded-3xl p-3 sm:p-6 max-w-4xl w-full shadow-[0_0_80px_rgba(245,158,11,0.2)] text-right relative my-auto animate-in fade-in zoom-in-95 duration-200">
            
            {/* Top Close & Actions Toolbar (Screen Only) */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 screen-only flex-wrap gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-slate-950 p-1 flex items-center justify-center border border-amber-400/60 shadow-md ring-2 ring-emerald-500/30 overflow-hidden">
                  <img src="/logo.png" alt="شعار بوابة بيرق" className="w-full h-full object-contain rounded-full" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span>وصل ترخيص واشتراك مدرسي رسمي</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                      A4 Official Document
                    </span>
                  </h3>
                  <p className="text-[10px] text-white/50">وثيقة اعتماد سارية ومحمية صادرة من منصة بوابة بيرق (GATE 6)</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Export PDF Button */}
                <button
                  disabled={isGeneratingDoc}
                  onClick={() => handleExportPdf(selectedReceipt)}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 active:scale-95 cursor-pointer disabled:opacity-50"
                  title="تصدير مستند PDF عالي الدقة بمقاس A4"
                >
                  <FileText size={15} />
                  <span>{isGeneratingDoc ? 'جاري التصدير...' : 'تصدير PDF (A4)'}</span>
                </button>

                {/* Save PNG Image Button */}
                <button
                  disabled={isGeneratingDoc}
                  onClick={() => handleDownloadImage(selectedReceipt)}
                  className="px-3.5 py-2 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-amber-500/40 active:scale-95 cursor-pointer disabled:opacity-50"
                  title="حفظ الوصل كصورة عالية الدقة PNG"
                >
                  <Download size={15} />
                  <span>حفظ صورة (PNG)</span>
                </button>

                {/* Direct Print Button */}
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer border border-white/10"
                  title="طباعة ورقية مباشرة على ورق A4"
                >
                  <Printer size={15} />
                  <span>طباعة فورية</span>
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="p-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl transition-all cursor-pointer"
                  title="إغلاق النافذة"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable & Screen High-Grade A4 Certificate / Receipt Document */}
            <div
              id="official-license-receipt-print-area"
              className="bg-[#050A18] print:bg-white text-white print:text-black p-6 sm:p-10 rounded-3xl border-2 border-amber-500/40 print:border-neutral-900 shadow-2xl relative overflow-hidden space-y-6"
            >
              {/* Background Luxury Guilloche Watermark Pattern */}
              <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
              <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Document Header with Circular High-Res Bayraq Logo */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-5 border-b-2 border-amber-500/40 print:border-neutral-900">
                <div className="flex items-center gap-4">
                  {/* Circular Bayraq Logo */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-950 p-1 flex items-center justify-center border-2 border-amber-400/80 shadow-lg shrink-0 overflow-hidden ring-2 ring-emerald-500/50">
                    <img
                      src="/logo.png"
                      alt="شعار منصة بوابة بيرق الرسمي"
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white print:text-neutral-900">
                      منصة بوابة بيرق الذكية (BAYRAQ GATE 6)
                    </h1>
                    <p className="text-xs sm:text-sm font-bold text-emerald-400 print:text-emerald-800 tracking-wider mt-0.5">
                      وصل ترخيص واشتراك مدرسي رسمي معتمد • OFFICIAL LICENSE & SUBSCRIPTION VOUCHER
                    </p>
                  </div>
                </div>

                <div className="text-center sm:text-left font-mono space-y-1">
                  <div className="text-xs text-white/50 print:text-neutral-500 font-bold">رقم الوصل الفريد</div>
                  <div className="text-base sm:text-lg font-black text-amber-300 print:text-neutral-900 bg-black/40 print:bg-neutral-100 px-4 py-2 rounded-xl border border-amber-500/30 print:border-neutral-300 shadow-sm">
                    {selectedReceipt.receiptNumber}
                  </div>
                </div>
              </div>

              {/* 4-Column Meta Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 bg-white/[0.03] print:bg-neutral-50 p-4 rounded-2xl border border-white/10 print:border-neutral-200">
                <div className="space-y-1">
                  <span className="text-xs text-white/50 print:text-neutral-500 block font-bold">رقم الوصل:</span>
                  <span className="font-mono font-black text-sm sm:text-base text-amber-300 print:text-neutral-900 block">{selectedReceipt.receiptNumber}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-white/50 print:text-neutral-500 block font-bold">رقم الترخيص المعتمد:</span>
                  <span className="font-mono font-black text-sm sm:text-base text-emerald-400 print:text-neutral-900 block">{selectedReceipt.licenseNumber}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-white/50 print:text-neutral-500 block font-bold">تاريخ إصدار الوصل:</span>
                  <span className="font-bold text-sm sm:text-base text-white print:text-neutral-900 block">{selectedReceipt.issuedDate}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-white/50 print:text-neutral-500 block font-bold">حالة الوصل والترخيص:</span>
                  <span className="font-black text-sm sm:text-base block">
                    {selectedReceipt.status === 'active' && '🟢 سارٍ ونشط رسمياً'}
                    {selectedReceipt.status === 'expiring_soon' && '🟡 سارٍ (قريب الانتهاء)'}
                    {selectedReceipt.status === 'expired' && '🔴 منتهي الصلاحية'}
                    {selectedReceipt.status === 'suspended' && '⚪ موقوف مؤقتاً'}
                  </span>
                </div>
              </div>

              {/* Core School & Subscription Details (Two-Column Layout) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Column 1: School Details (With Contact Phone & Logo) */}
                <div className="bg-black/30 print:bg-white p-5 rounded-2xl border border-white/10 print:border-neutral-200 space-y-3">
                  <div className="text-sm sm:text-base font-black text-amber-300 print:text-neutral-900 border-b border-white/10 print:border-neutral-200 pb-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building size={18} /> بيانات الجهة والمدرسة المرخصة
                    </div>
                    {selectedReceipt.schoolLogo && (
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-amber-400/30 overflow-hidden flex items-center justify-center p-1">
                        <img
                          src={selectedReceipt.schoolLogo}
                          alt={selectedReceipt.schoolName}
                          className="w-full h-full object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2.5 text-xs sm:text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 print:text-neutral-500 font-bold">اسم المدرسة:</span>
                      <span className="font-black text-white print:text-neutral-900 text-sm sm:text-base">{selectedReceipt.schoolName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 print:text-neutral-500 font-bold">المحافظة:</span>
                      <span className="font-bold text-white print:text-neutral-800 text-sm">{selectedReceipt.governorate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 print:text-neutral-500 font-bold">المعرف المؤسسي:</span>
                      <span className="font-mono font-bold text-white/90 print:text-neutral-800 text-sm">{selectedReceipt.schoolId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 print:text-neutral-500 font-bold">المسؤول المفوض:</span>
                      <span className="font-bold text-white print:text-neutral-800 text-sm">{selectedReceipt.contactPerson}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 print:text-neutral-500 font-bold">هاتف التواصل:</span>
                      <span className="font-mono font-black text-emerald-400 print:text-emerald-700 text-sm" dir="ltr">{selectedReceipt.contactPhone}</span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Subscription Scope & Limits */}
                <div className="bg-black/30 print:bg-white p-5 rounded-2xl border border-white/10 print:border-neutral-200 space-y-3">
                  <div className="text-sm sm:text-base font-black text-indigo-300 print:text-neutral-900 border-b border-white/10 print:border-neutral-200 pb-2.5 flex items-center gap-2">
                    <Award size={18} /> باقة الترخيص وفترة الصلاحية
                  </div>
                  <div className="space-y-2.5 text-xs sm:text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 print:text-neutral-500 font-bold">نوع الباقة المعتمدة:</span>
                      <span className="font-black text-indigo-400 print:text-neutral-900 text-sm sm:text-base">{getPlanArabicName(selectedReceipt.plan)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 print:text-neutral-500 font-bold">السعة المرخصة للطلاب:</span>
                      <span className="font-black text-emerald-400 print:text-emerald-700 text-sm sm:text-base">{selectedReceipt.maxStudents.toLocaleString()} طالب</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 print:text-neutral-500 font-bold">بداية الاشتراك:</span>
                      <span className="font-mono font-bold text-white print:text-neutral-800 text-sm">{selectedReceipt.startDate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 print:text-neutral-500 font-bold">نهاية الاشتراك:</span>
                      <span className="font-mono font-black text-amber-300 print:text-neutral-900 text-sm">{selectedReceipt.expiryDate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 print:text-neutral-500 font-bold">الأيام المتبقية:</span>
                      <span className="font-black text-emerald-400 print:text-emerald-700 text-sm">
                        {calculateRemainingDays(selectedReceipt.expiryDate)} يوم متبقي
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial & Payment Row */}
              <div className="bg-gradient-to-r from-amber-500/10 via-black/40 to-emerald-500/10 print:bg-neutral-50 p-5 rounded-2xl border border-amber-500/30 print:border-neutral-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CreditCard size={24} className="text-amber-400 print:text-neutral-800 shrink-0" />
                    <div>
                      <span className="text-white/50 print:text-neutral-500 block text-xs font-bold">قيمة الاشتراك المالي المعتمد:</span>
                      <span className="text-xl sm:text-2xl font-black text-amber-300 print:text-neutral-900">
                        {(selectedReceipt.subscriptionFee || 0).toLocaleString()} دينار عراقي
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:text-left">
                    <div>
                      <span className="text-white/50 print:text-neutral-500 block text-xs font-bold">حالة السداد والتوثيق المالي:</span>
                      <span className="font-black text-base sm:text-lg text-emerald-400 print:text-emerald-700">
                        {selectedReceipt.paymentStatus === 'paid' && '✓ مدفوع بالكامل (معتمد رسمي)'}
                        {selectedReceipt.paymentStatus === 'partial' && '⏳ دفعة جزئية (قيد الاكتمال)'}
                        {selectedReceipt.paymentStatus === 'pending' && '⚠️ بانتظار استكمال السداد'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================================================================= */}
              {/* ⚠️ MANDATORY LEGAL DISCLAIMER CLAUSE (شرط عدم التملك والشراكة) */}
              {/* ================================================================= */}
              <div className="bg-amber-950/30 print:bg-neutral-100 border-2 border-amber-500/50 print:border-neutral-400 rounded-2xl p-4 sm:p-5 text-right">
                <div className="flex items-start gap-3.5">
                  <ShieldAlert size={26} className="text-amber-400 print:text-neutral-800 shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <h4 className="text-xs sm:text-sm font-black text-amber-300 print:text-neutral-900">
                      إقرار وشروط الترخيص الرسمي (License Terms & Agreement):
                    </h4>
                    <p className="text-xs sm:text-sm font-bold text-white/95 print:text-neutral-800 leading-relaxed">
                      "هذا الوصل يثبت ترخيص الجهة لاستخدام خدمات منصة بوابة بيرق وفق الباقة والمدة المحددة، ولا يمنح أي حقوق ملكية أو شراكة أو حصة مالية في المنصة بأي شكل من الأشكال."
                    </p>
                  </div>
                </div>
              </div>

              {/* Official Stamps, Verification & Signatures Section (3 Columns) */}
              <div className="pt-5 border-t-2 border-white/10 print:border-neutral-900 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                
                {/* Column 1 (Right): Official Bayraq Stamp (ختم منصة بوابة بيرق الرسمي) */}
                <div className="flex flex-col items-center text-center space-y-2.5">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-red-700 print:border-red-800 p-1.5 flex flex-col items-center justify-center text-center relative bg-gradient-to-tr from-red-900/20 to-amber-900/20 shadow-md">
                    <div className="absolute inset-1.5 rounded-full border-2 border-dashed border-red-500/60 print:border-red-600" />
                    <Sparkles size={16} className="text-red-400 print:text-red-700 mb-0.5" />
                    <span className="text-[10px] sm:text-xs font-black text-red-300 print:text-red-800 leading-none">ختم واعتماد إلكتروني</span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-white/80 print:text-neutral-700 mt-1">منصة بوابة بيرق</span>
                    <span className="text-[8px] sm:text-[9px] font-mono font-bold text-red-400 print:text-red-700 mt-1">GATE 6 VERIFIED</span>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs sm:text-sm font-bold text-white print:text-neutral-900">ختم منصة بوابة بيرق الرسمي</div>
                    <div className="text-[11px] text-white/50 print:text-neutral-500">توثيق سحابي رقمي مشفر</div>
                  </div>
                </div>

                {/* Column 2 (Center): School Authorized Stamp Placeholder (ختم واعتماد الجهة المرخصة) */}
                <div className="flex flex-col items-center text-center space-y-2.5">
                  {selectedReceipt.schoolStamp ? (
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-emerald-500/60 print:border-neutral-800 p-1 overflow-hidden flex items-center justify-center bg-white/5">
                      <img src={selectedReceipt.schoolStamp} alt="ختم المدرسة" className="w-full h-full object-contain rounded-full" />
                    </div>
                  ) : (
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-dashed border-white/30 print:border-neutral-400 p-3 flex flex-col items-center justify-center text-center bg-white/[0.02] print:bg-neutral-50">
                      <div className="text-[10px] sm:text-xs font-bold text-white/70 print:text-neutral-600 leading-tight">
                        مخصص لختم المدرسة الرسمي
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-white/40 print:text-neutral-400 mt-1 font-mono">
                        (يُختم ويُوقّع هنا)
                      </div>
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <div className="text-xs sm:text-sm font-bold text-white print:text-neutral-900">ختم واعتماد الجهة المرخصة</div>
                    <div className="text-[11px] text-white/50 print:text-neutral-500 font-bold">{selectedReceipt.schoolName}</div>
                  </div>
                </div>

                {/* Column 3 (Left): Enlarged QR Code with Verification Text */}
                <div className="flex flex-col items-center text-center space-y-2.5">
                  <div className="bg-white p-2.5 rounded-2xl shadow-lg border border-white/20 print:border-neutral-300">
                    {selectedReceipt.qrCodeUrl ? (
                      <img
                        src={selectedReceipt.qrCodeUrl}
                        alt="رمز التحقق الإلكتروني للترخيص"
                        className="w-28 h-28 sm:w-32 sm:h-32 object-contain rounded-lg"
                      />
                    ) : (
                      <div className="w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center text-black">
                        <QrCodeIcon size={56} />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    {/* Required verification text underneath QR */}
                    <div className="text-xs sm:text-sm font-black text-amber-300 print:text-neutral-900">
                      امسح للتحقق من صحة الترخيص
                    </div>
                    <div className="text-[10px] sm:text-xs font-mono font-bold text-emerald-400 print:text-neutral-600">
                      ID: {selectedReceipt.licenseNumber}
                    </div>
                    <button
                      onClick={() => setVerifyingLicense(selectedReceipt)}
                      className="text-xs font-bold text-indigo-300 print:hidden hover:underline inline-flex items-center gap-1 cursor-pointer pt-0.5"
                    >
                      <ExternalLink size={12} /> اختبار فحص الرمز مباشرة
                    </button>
                  </div>
                </div>

              </div>

              {/* Bottom Security Footer */}
              <div className="text-center pt-3 border-t border-white/5 print:border-neutral-200">
                <p className="text-[10px] sm:text-xs font-mono text-white/40 print:text-neutral-500">
                  SECURE DIGITAL LICENSING • PLATFORM BAYRAQ GATE 6 • AUDIT ID: {selectedReceipt.receiptNumber}
                </p>
              </div>
            </div>

            {/* Bottom Actions Bar (Screen Only) */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 screen-only">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(selectedReceipt.licenseNumber, 'رقم الترخيص')}
                  className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl text-xs font-bold transition-all border border-white/10 flex items-center gap-1.5"
                >
                  {copiedKey === 'رقم الترخيص' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  نسخ رقم الترخيص
                </button>

                <button
                  onClick={() => copyToClipboard(selectedReceipt.receiptNumber, 'رقم الوصل')}
                  className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl text-xs font-bold transition-all border border-white/10 flex items-center gap-1.5"
                >
                  {copiedKey === 'رقم الوصل' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  نسخ رقم الوصل
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const toEdit = selectedReceipt;
                    setSelectedReceipt(null);
                    setEditingLicense(toEdit);
                  }}
                  className="px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 rounded-xl text-xs font-bold transition-all border border-indigo-500/30 flex items-center gap-1.5"
                >
                  <SlidersHorizontal size={14} /> تعديل بيانات الترخيص
                </button>

                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
                >
                  إغلاق
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⚙️ EDIT & MANAGE LICENSE MODAL (تعديل وتمديد الترخيص) */}
      {/* ========================================================================= */}
      {editingLicense && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0B0D1B] border border-white/15 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-right my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-emerald-400" />
                <h3 className="text-sm font-black text-white">إدارة وتعديل ترخيص: {editingLicense.schoolName}</h3>
              </div>
              <button onClick={() => setEditingLicense(null)} className="text-white/40 hover:text-white">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Plan & Capacity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-white/50 mb-1">نوع الباقة (Plan Tier):</label>
                  <select
                    value={editingLicense.plan}
                    onChange={(e) => setEditingLicense({ ...editingLicense, plan: e.target.value as PlanTier })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-bold outline-none focus:border-emerald-500"
                  >
                    <option value="trial" className="bg-[#0B0D1B]">تجريبي (Trial)</option>
                    <option value="standard" className="bg-[#0B0D1B]">أساسي (Standard)</option>
                    <option value="premium" className="bg-[#0B0D1B]">متقدم (Premium)</option>
                    <option value="enterprise" className="bg-[#0B0D1B]">مؤسسي شامل (Enterprise)</option>
                    <option value="custom" className="bg-[#0B0D1B]">مخصص (Custom)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/50 mb-1">السعة المرخصة للطلاب:</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={editingLicense.maxStudents === 0 ? '' : editingLicense.maxStudents}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingLicense({
                        ...editingLicense,
                        maxStudents: val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0)
                      });
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-bold outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Contact Person & Phone Number (تعديل رقم الهاتف ليظهر في الوصل) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-white/50 mb-1">المسؤول المفوض:</label>
                  <input
                    type="text"
                    value={editingLicense.contactPerson || ''}
                    onChange={(e) => setEditingLicense({ ...editingLicense, contactPerson: e.target.value })}
                    placeholder="اسم المدير / المسؤول"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-bold outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/50 mb-1">رقم هاتف التواصل:</label>
                  <input
                    type="tel"
                    value={editingLicense.contactPhone || ''}
                    onChange={(e) => setEditingLicense({ ...editingLicense, contactPhone: e.target.value })}
                    placeholder="077XXXXXXXX"
                    dir="ltr"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-bold text-right outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-white/50 mb-1">تاريخ بداية الاشتراك:</label>
                  <input
                    type="date"
                    value={editingLicense.startDate}
                    onChange={(e) => setEditingLicense({ ...editingLicense, startDate: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-bold text-left outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/50 mb-1">تاريخ نهاية الاشتراك:</label>
                  <input
                    type="date"
                    value={editingLicense.expiryDate}
                    onChange={(e) => setEditingLicense({ ...editingLicense, expiryDate: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-bold text-left outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Financial Fee & Payment Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-white/50 mb-1">قيمة الاشتراك (د.ع):</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={editingLicense.subscriptionFee === 0 ? '' : editingLicense.subscriptionFee}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingLicense({
                        ...editingLicense,
                        subscriptionFee: val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0)
                      });
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-bold outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/50 mb-1">حالة السداد المالي:</label>
                  <select
                    value={editingLicense.paymentStatus}
                    onChange={(e) => setEditingLicense({ ...editingLicense, paymentStatus: e.target.value as PaymentStatus })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-bold outline-none focus:border-emerald-500"
                  >
                    <option value="paid" className="bg-[#0B0D1B]">مدفوع بالكامل ✓</option>
                    <option value="partial" className="bg-[#0B0D1B]">دفعة جزئية ⏳</option>
                    <option value="pending" className="bg-[#0B0D1B]">بانتظار السداد ⚠️</option>
                  </select>
                </div>
              </div>

              {/* Status Control */}
              <div>
                <label className="block text-[10px] font-bold text-white/50 mb-1">التحكم بحالة الترخيص:</label>
                <select
                  value={editingLicense.status}
                  onChange={(e) => setEditingLicense({ ...editingLicense, status: e.target.value as LicenseStatus })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-bold outline-none focus:border-emerald-500"
                >
                  <option value="active" className="bg-[#0B0D1B]">🟢 نشط وسارٍ</option>
                  <option value="suspended" className="bg-[#0B0D1B]">⚪ موقوف ومعلق مؤقتاً</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-bold text-white/50 mb-1">ملاحظات العقد والترخيص:</label>
                <textarea
                  rows={2}
                  value={editingLicense.notes || ''}
                  onChange={(e) => setEditingLicense({ ...editingLicense, notes: e.target.value })}
                  placeholder="أدخل أي بنود أو ملاحظات إدارية خاصة بهذا الترخيص..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white font-bold text-xs outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Quick Extend Shortcuts */}
              <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-2">
                <span className="text-[10px] font-bold text-white/50 block">تمديد سريع لصلاحية الترخيص:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = new Date(editingLicense.expiryDate);
                      const nxt = new Date(cur.getTime() + 365 * 86400000);
                      setEditingLicense({ ...editingLicense, expiryDate: nxt.toISOString().split('T')[0] });
                      showToast('تمت إضافة 365 يوماً إلى تاريخ الانتهاء');
                    }}
                    className="flex-1 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-lg font-bold text-[11px] transition-all"
                  >
                    +1 سنة (365 يوم)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = new Date(editingLicense.expiryDate);
                      const nxt = new Date(cur.getTime() + 180 * 86400000);
                      setEditingLicense({ ...editingLicense, expiryDate: nxt.toISOString().split('T')[0] });
                      showToast('تمت إضافة 180 يوماً إلى تاريخ الانتهاء');
                    }}
                    className="flex-1 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg font-bold text-[11px] transition-all"
                  >
                    +6 أشهر (180 يوم)
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-white/10 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateLicense(editingLicense)}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  حفظ وتطبيق تعديلات الترخيص ⚡
                </button>
                <button
                  type="button"
                  onClick={() => setEditingLicense(null)}
                  className="py-3 px-5 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔍 LIVE QR VERIFICATION SIMULATION MODAL */}
      {/* ========================================================================= */}
      {verifyingLicense && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#0B0D1B] border border-emerald-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl text-right animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/30">
              <CheckCircle2 size={32} />
            </div>

            <h3 className="text-base font-black text-white text-center mb-1">
              نتيجة التحقق السحابي الفوري
            </h3>
            <p className="text-xs text-emerald-400 font-bold text-center mb-4">
              ✓ تم التحقق بنجاح من صحة وسريان الوصل والترخيص
            </p>

            <div className="bg-black/50 border border-white/10 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-white/50">المدرسة المرخصة:</span>
                <span className="font-bold text-white">{verifyingLicense.schoolName}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-white/50">رقم الوصل الرسمي:</span>
                <span className="font-mono font-bold text-amber-300">{verifyingLicense.receiptNumber}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-white/50">رقم الترخيص:</span>
                <span className="font-mono font-bold text-emerald-400">{verifyingLicense.licenseNumber}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-white/50">السعة المعتمدة:</span>
                <span className="font-bold text-white">{verifyingLicense.maxStudents} طالب</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">تاريخ انتهاء الصلاحية:</span>
                <span className="font-bold text-white">{verifyingLicense.expiryDate}</span>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={() => setVerifyingLicense(null)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs cursor-pointer shadow-lg"
              >
                إغلاق نافذة التحقق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grant License to School Modal */}
      {isGrantLicenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0B1120] border-2 border-emerald-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                  <PlusCircle size={24} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    منح وتفعيل ترخيص لمدرسة من الميادين 🏛️📜
                  </h3>
                  <p className="text-xs text-white/60 font-bold mt-0.5">
                    اختر أي مدرسة مسجلة لمنحها ترخيصاً رسمياً معتمداً وتحديد باقتها وسعتها.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsGrantLicenseModalOpen(false)}
                className="p-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGrantLicenseSubmit} className="space-y-4">
              {/* School Selector */}
              <div>
                <label className="text-xs font-black text-white/80 block mb-1.5">
                  اختيار المدرسة المراد منحها الترخيص (من قائمة المدارس في الميادين):
                </label>
                <select
                  value={grantForm.schoolId}
                  onChange={(e) => handleSelectSchoolToGrant(e.target.value)}
                  className="w-full bg-[#151C2F] border border-emerald-500/40 text-white rounded-xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  required
                >
                  <option value="" disabled>-- اضغط لاختيار المدرسة من الميادين --</option>
                  {availableSchools.map((sc) => {
                    const hasActiveLic = licenses.some(l => l.schoolId === sc.id && l.status === 'active');
                    return (
                      <option key={sc.id} value={sc.id}>
                        {sc.name} ({sc.governorate || 'غماس'}) {hasActiveLic ? '• [مرخصة حالياً]' : '• [بانتظار منح الترخيص]'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* School Preview card if selected */}
              {grantForm.schoolId && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-black/40 border border-emerald-500/40 overflow-hidden flex items-center justify-center p-1 shrink-0">
                      <img
                        src={
                          availableSchools.find(s => s.id === grantForm.schoolId)?.logoUrl ||
                          (typeof localStorage !== 'undefined' ? localStorage.getItem(`school_logo_${grantForm.schoolId}`) : null) ||
                          getOfficialSchoolLogoUrl(grantForm.schoolId, grantForm.schoolName)
                        }
                        alt={grantForm.schoolName}
                        className="w-full h-full object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-black text-emerald-300">{grantForm.schoolName}</div>
                      <div className="text-xs text-white/60 font-mono">المعرف: {grantForm.schoolId} • {grantForm.governorate}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-lg font-bold border border-emerald-500/30">
                      جاهز لمنح الترخيص
                    </span>
                  </div>
                </div>
              )}

              {/* Grid 1: Plan Tier & Max Students */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-white/70 block mb-1">نوع باقة الترخيص:</label>
                  <select
                    value={grantForm.plan}
                    onChange={(e) => {
                      const p = e.target.value as PlanTier;
                      const cap = p === 'enterprise' ? 3000 : p === 'premium' ? 1500 : 600;
                      const fee = p === 'enterprise' ? 4500000 : p === 'premium' ? 2500000 : 1500000;
                      setGrantForm(prev => ({ ...prev, plan: p, maxStudents: cap, subscriptionFee: fee }));
                    }}
                    className="w-full bg-[#151C2F] border border-white/10 text-white rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="standard">الباقة الأساسية (Standard - حتى 600 طالب)</option>
                    <option value="premium">الباقة المتقدمة (Premium - حتى 1500 طالب)</option>
                    <option value="enterprise">الباقة المؤسسية الشاملة (Enterprise - حتى 3000 طالب)</option>
                    <option value="trial">باقة تجريبية (Trial)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-white/70 block mb-1">سعة الطلاب المرخصة:</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={grantForm.maxStudents === 0 ? '' : grantForm.maxStudents}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value;
                      setGrantForm(prev => ({
                        ...prev,
                        maxStudents: val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0)
                      }));
                    }}
                    className="w-full bg-[#151C2F] border border-white/10 text-white rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Grid 2: Start Date & Expiry Date with quick buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-white/70 block mb-1">تاريخ بدء الترخيص:</label>
                  <input
                    type="date"
                    value={grantForm.startDate}
                    onChange={(e) => setGrantForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-[#151C2F] border border-white/10 text-white rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-white/70">تاريخ انتهاء الصلاحية:</label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0];
                          setGrantForm(prev => ({ ...prev, expiryDate: d }));
                        }}
                        className="text-[10px] bg-white/5 hover:bg-white/10 text-white/80 px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        +6 أشهر
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
                          setGrantForm(prev => ({ ...prev, expiryDate: d }));
                        }}
                        className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded cursor-pointer font-bold"
                      >
                        +1 سنة
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date(Date.now() + 730 * 86400000).toISOString().split('T')[0];
                          setGrantForm(prev => ({ ...prev, expiryDate: d }));
                        }}
                        className="text-[10px] bg-white/5 hover:bg-white/10 text-white/80 px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        +2 سنتين
                      </button>
                    </div>
                  </div>
                  <input
                    type="date"
                    value={grantForm.expiryDate}
                    onChange={(e) => setGrantForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full bg-[#151C2F] border border-white/10 text-white rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Grid 3: Fee & Payment Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-white/70 block mb-1">رسوم الاشتراك السنوي (د.ع):</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={grantForm.subscriptionFee === 0 ? '' : grantForm.subscriptionFee}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value;
                      setGrantForm(prev => ({
                        ...prev,
                        subscriptionFee: val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0)
                      }));
                    }}
                    className="w-full bg-[#151C2F] border border-white/10 text-white rounded-xl p-2.5 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-white/70 block mb-1">حالة السداد والوصل:</label>
                  <select
                    value={grantForm.paymentStatus}
                    onChange={(e) => setGrantForm(prev => ({ ...prev, paymentStatus: e.target.value as PaymentStatus }))}
                    className="w-full bg-[#151C2F] border border-white/10 text-white rounded-xl p-2.5 text-xs font-bold"
                  >
                    <option value="paid">مدفوع بالكامل (Paid) ✓</option>
                    <option value="partial">مسدد جزئياً (Partial)</option>
                    <option value="pending">بانتظار السداد (Pending)</option>
                    <option value="waived">إعفاء رسمي (Waived)</option>
                  </select>
                </div>
              </div>

              {/* Grid 4: Contact Person & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-white/70 block mb-1">اسم المسؤول المفوض:</label>
                  <input
                    type="text"
                    value={grantForm.contactPerson}
                    onChange={(e) => setGrantForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                    className="w-full bg-[#151C2F] border border-white/10 text-white rounded-xl p-2.5 text-xs font-bold"
                    placeholder="المدير المفوض"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-white/70 block mb-1">هاتف التواصل الرسمي:</label>
                  <input
                    type="text"
                    value={grantForm.contactPhone}
                    onChange={(e) => setGrantForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                    className="w-full bg-[#151C2F] border border-white/10 text-white rounded-xl p-2.5 text-xs font-mono font-bold"
                    placeholder="07700000000"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsGrantLicenseModalOpen(false)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95 transition-all flex items-center gap-2"
                >
                  <ShieldCheck size={16} />
                  <span>منح وتفعيل الترخيص فوراً وإصدار الوصل 📜⚡</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

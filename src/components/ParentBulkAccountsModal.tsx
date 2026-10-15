import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileSpreadsheet, Upload, UserCheck, Printer, Trash2, Plus, 
  CheckCircle2, AlertCircle, RefreshCw, X, ShieldCheck, History, 
  Search, Calendar, Eye, AlertTriangle, Send, MessageCircle, Share2 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { printHTML, exportToExcel } from '../lib/exportUtils';
import { logActivity } from '../utils/auditLogger';

export interface ParentAccountRow {
  id: string;
  studentName: string;
  rawPhone: string;
  formattedPhone: string;
  password: string;
  status: 'valid' | 'duplicate' | 'invalid_phone';
  errorMessage?: string;
}

export interface ExcelUploadHistoryEntry {
  id: string;
  fileName: string;
  schoolName: string;
  schoolId?: string;
  branch: 'boys' | 'girls';
  totalRowsCount: number;
  validAccountsCount: number;
  uploadedBy: string;
  uploadDate: string;
  sampleStudentNames: string[];
  accounts: ParentAccountRow[];
}

interface ParentBulkAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolName: string;
  schoolId?: string;
  adminBranch: 'boys' | 'girls';
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

/**
 * Standardize phone numbers to start with '7' (without leading zero or country codes).
 */
export const sanitizeIraqiPhoneNumber = (input: string): string => {
  if (!input) return '';
  let cleaned = input.toString().replace(/[٠-٩]/g, d => '٠١٢٣٥٦٧٨٩'.indexOf(d).toString());
  cleaned = cleaned.replace(/\D/g, '');

  if (cleaned.startsWith('00964')) {
    cleaned = cleaned.substring(5);
  } else if (cleaned.startsWith('964')) {
    cleaned = cleaned.substring(3);
  }

  cleaned = cleaned.replace(/^0+/, '');
  return cleaned;
};

export const generateDefaultPassword = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const ParentBulkAccountsModal: React.FC<ParentBulkAccountsModalProps> = ({
  isOpen,
  onClose,
  schoolName,
  schoolId,
  adminBranch,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'new_upload' | 'upload_history'>('new_upload');
  const [rows, setRows] = useState<ParentAccountRow[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Row State
  const [manualStudentName, setManualStudentName] = useState('');
  const [manualPhone, setManualPhone] = useState('');

  // History State
  const [historyLogs, setHistoryLogs] = useState<ExcelUploadHistoryEntry[]>([]);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<ExcelUploadHistoryEntry | null>(null);
  const historySyncInputRef = useRef<HTMLInputElement>(null);
  const [isSavingHistory, setIsSavingHistory] = useState(false);

  // Interactive Smart Matching Preview State
  const [matchingPreviewModalOpen, setMatchingPreviewModalOpen] = useState(false);
  const [matchSearchQuery, setMatchSearchQuery] = useState('');
  const [matchingData, setMatchingData] = useState<{
    fileName: string;
    totalParsed: number;
    matchedUpdates: { phone: string; studentName: string; currentName: string; status: 'matched' | 'new' }[];
  } | null>(null);
  const [isExecutingMatch, setIsExecutingMatch] = useState(false);
  const [isPrintingSlips, setIsPrintingSlips] = useState(false);

  // Load history logs from server and cache
  const fetchUploadHistory = async () => {
    try {
      // 1. Try local cache first for instant UI response
      const cached = localStorage.getItem('berq_parent_excel_uploads_history');
      if (cached) {
        setHistoryLogs(JSON.parse(cached));
      }

      // 2. Fetch from backend API
      const res = await fetch('/api/auth/parent-upload-history');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.history)) {
          setHistoryLogs(data.history);
          localStorage.setItem('berq_parent_excel_uploads_history', JSON.stringify(data.history));
        }
      }
    } catch (err) {
      console.error('Failed to fetch Excel upload history:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUploadHistory();
    }
  }, [isOpen]);

  // Handle editing student name inside an expanded history entry
  const handleHistoryNameEdit = (entryId: string, accId: string, newName: string) => {
    setHistoryLogs(prev => prev.map(entry => {
      if (entry.id !== entryId) return entry;
      const updatedAccounts = entry.accounts.map(acc => {
        if (acc.id === accId) {
          return { ...acc, studentName: newName };
        }
        return acc;
      });
      const sampleNames = updatedAccounts.slice(0, 4).map(a => a.studentName);
      return { ...entry, accounts: updatedAccounts, sampleStudentNames: sampleNames };
    }));

    if (selectedHistoryItem && selectedHistoryItem.id === entryId) {
      const updatedAccs = selectedHistoryItem.accounts.map(acc => acc.id === accId ? { ...acc, studentName: newName } : acc);
      setSelectedHistoryItem({ ...selectedHistoryItem, accounts: updatedAccs, sampleStudentNames: updatedAccs.slice(0, 4).map(a => a.studentName) });
    }
  };

  // Save updated history student names to server
  const handleSaveHistoryEntryNames = async (entry: ExcelUploadHistoryEntry) => {
    setIsSavingHistory(true);
    try {
      const updates = entry.accounts.map(acc => ({
        phone: acc.formattedPhone || acc.rawPhone,
        studentName: acc.studentName
      }));

      // 1. Update accounts in backend DB
      await fetch('/api/auth/parent-update-student-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });

      // 2. Save history entry back
      await fetch('/api/auth/parent-upload-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });

      // 3. Update local cache
      localStorage.setItem('berq_parent_excel_uploads_history', JSON.stringify(historyLogs));

      showToast('تم حفظ وتحديث أسماء الطلاب في السجل وجميع الحسابات بنجاح ⚡', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('خطأ أثناء حفظ التحديثات: ' + (err?.message || ''), 'error');
    } finally {
      setIsSavingHistory(false);
    }
  };

  // Handle smart sync by re-uploading an Excel file in History tab or via Match button
  const handleHistorySyncFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (!data || data.length === 0) {
          showToast('الملف فارغ', 'error');
          if (e.target) e.target.value = '';
          return;
        }

        const isPhonePattern = (str: string) => {
          if (!str) return false;
          const cleaned = str.toString().replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString()).replace(/\D/g, '');
          return cleaned.length >= 8 && cleaned.length <= 12 && (cleaned.startsWith('7') || cleaned.startsWith('07') || cleaned.startsWith('964') || cleaned.startsWith('00964'));
        };

        // Build phone lookup map from current history logs
        const phoneToCurrentName = new Map<string, string>();
        historyLogs.forEach(entry => {
          entry.accounts.forEach(acc => {
            const clean = sanitizeIraqiPhoneNumber(acc.formattedPhone || acc.rawPhone);
            if (clean) {
              phoneToCurrentName.set(clean, acc.studentName || '');
            }
          });
        });

        const updates: { phone: string; studentName: string; currentName: string; status: 'matched' | 'new' }[] = [];

        for (let i = 0; i < data.length; i++) {
          const rowData = data[i];
          if (!rowData || !Array.isArray(rowData) || rowData.length === 0) continue;

          let foundPhone = '';
          let foundName = '';

          for (const cell of rowData) {
            const cellStr = String(cell || '').trim();
            if (!cellStr) continue;

            if (isPhonePattern(cellStr) && !foundPhone) {
              foundPhone = sanitizeIraqiPhoneNumber(cellStr);
            } else if (
              !/^\d+$/.test(cellStr.replace(/\s+/g, '')) &&
              cellStr.length > 1 &&
              !cellStr.toLowerCase().includes('هاتف') &&
              !cellStr.toLowerCase().includes('تلميذ') &&
              !cellStr.toLowerCase().includes('طالب') &&
              !cellStr.toLowerCase().includes('موبايل') &&
              !cellStr.toLowerCase().includes('رقم')
            ) {
              if (!foundName) {
                foundName = cellStr;
              }
            }
          }

          if (foundPhone && foundName) {
            const current = phoneToCurrentName.get(foundPhone) || 'ولي أمر (غير محدد)';
            updates.push({
              phone: foundPhone,
              studentName: foundName,
              currentName: current,
              status: phoneToCurrentName.has(foundPhone) ? 'matched' : 'new'
            });
          }
        }

        if (e.target) e.target.value = '';

        if (updates.length === 0) {
          showToast('لم يتم العثور على أرقام هواتف وأسماء صالحة للمطابقة في هذا الملف', 'error');
          return;
        }

        setMatchingData({
          fileName: file.name,
          totalParsed: data.length,
          matchedUpdates: updates
        });
        setMatchSearchQuery('');
        setMatchingPreviewModalOpen(true);
        showToast(`تم اكتشاف ${updates.length} طالب وجاهز للمطابقة والعرض ⚡`, 'success');
      } catch (err: any) {
        console.error(err);
        showToast('خطأ أثناء معالجة ملف المطابقة: ' + (err?.message || ''), 'error');
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  // Execute matching updates to server and refresh state
  const handleConfirmExecuteMatching = async () => {
    if (!matchingData || matchingData.matchedUpdates.length === 0) return;
    setIsExecutingMatch(true);

    try {
      const updates = matchingData.matchedUpdates.map(u => ({
        phone: u.phone,
        studentName: u.studentName
      }));

      const res = await fetch('/api/auth/parent-update-student-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });

      const resData = await res.json();
      if (resData.success) {
        await fetchUploadHistory();
        setMatchingPreviewModalOpen(false);
        showToast(`تمت المطابقة الذكية بنجاح! تم تحديث أسماء ${resData.updatedCount || updates.length} طالب في كافة الحسابات والقصاصات 🎉`, 'success');
      } else {
        showToast('فشل التحديث: ' + (resData.message || ''), 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast('خطأ أثناء معالجة المطابقة: ' + (err?.message || ''), 'error');
    } finally {
      setIsExecutingMatch(false);
    }
  };

  if (!isOpen) return null;

  const processPhoneRow = (studentName: string, phoneRaw: string): ParentAccountRow => {
    let cleanStudent = studentName ? studentName.trim() : '';
    const cleanPhone = sanitizeIraqiPhoneNumber(phoneRaw);
    let status: 'valid' | 'duplicate' | 'invalid_phone' = 'valid';
    let errorMessage = '';

    // If student name is empty or consists purely of digits/phone numbers, sanitize it
    const digitsOnly = cleanStudent.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString()).replace(/\D/g, '');
    if (!cleanStudent || (digitsOnly.length >= 8 && digitsOnly === cleanStudent.replace(/\D/g, ''))) {
      cleanStudent = cleanPhone ? `طالب (ولي الأمر: ${cleanPhone})` : 'طالب بدون اسم';
    }

    if (!cleanPhone || !cleanPhone.startsWith('7') || cleanPhone.length < 9 || cleanPhone.length > 11) {
      status = 'invalid_phone';
      errorMessage = 'الرقم يجب أن يبدأ بـ 7 ويتكون من 10 أرقام';
    }

    return {
      id: crypto.randomUUID(),
      studentName: cleanStudent,
      rawPhone: phoneRaw || '',
      formattedPhone: cleanPhone,
      password: generateDefaultPassword(),
      status,
      errorMessage,
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    setUploadedFileName(fileName);
    setDuplicateWarning(null);

    // Check if filename was uploaded previously
    const existingEntry = historyLogs.find(
      h => h.fileName.toLowerCase().trim() === fileName.toLowerCase().trim()
    );
    if (existingEntry) {
      const formattedDate = new Date(existingEntry.uploadDate).toLocaleDateString('ar-IQ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      setDuplicateWarning(
        `⚠️ تنبيه هام: تم رفع ملف بنفس هذا الاسم (${fileName}) سابقاً بتاريخ ${formattedDate} بواقع ${existingEntry.validAccountsCount} حساب. يرجى المراجعة لتجنب تكرار إنشاء الحسابات!`
      );
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (data.length === 0) {
          showToast('الملف المرفوع فارغ', 'error');
          return;
        }

        const newRows: ParentAccountRow[] = [];
        const phoneSet = new Set<string>();

        let nameColIdx = 0;
        let phoneColIdx = 1;

        if (data.length > 0) {
          const headerRow = data[0] || [];
          headerRow.forEach((cellVal: any, idx: number) => {
            const str = String(cellVal || '').toLowerCase().trim();
            if (str.includes('هاتف') || str.includes('رقم') || str.includes('phone') || str.includes('موبايل') || str.includes('جوال')) {
              phoneColIdx = idx;
            } else if (str.includes('اسم') || str.includes('طالب') || str.includes('name') || str.includes('تلميذ')) {
              nameColIdx = idx;
            }
          });
        }

        let startRowIdx = 0;
        const firstRowStr = JSON.stringify(data[0] || []).toLowerCase();
        if (
          firstRowStr.includes('اسم') ||
          firstRowStr.includes('طالب') ||
          firstRowStr.includes('هاتف') ||
          firstRowStr.includes('رقم') ||
          firstRowStr.includes('phone') ||
          firstRowStr.includes('name')
        ) {
          startRowIdx = 1;
        }

        const isPhonePattern = (str: string) => {
          if (!str) return false;
          const cleaned = str.toString().replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString()).replace(/\D/g, '');
          return cleaned.length >= 8 && cleaned.length <= 12 && (cleaned.startsWith('7') || cleaned.startsWith('07') || cleaned.startsWith('964') || cleaned.startsWith('00964'));
        };

        for (let i = startRowIdx; i < data.length; i++) {
          const rowData = data[i];
          if (!rowData || rowData.length === 0) continue;

          let valA = rowData[nameColIdx] !== undefined ? String(rowData[nameColIdx]).trim() : '';
          let valB = rowData[phoneColIdx] !== undefined ? String(rowData[phoneColIdx]).trim() : '';

          if (!valB && rowData.length > 1) {
            valB = String(rowData.find((v: any, idx: number) => idx !== nameColIdx && v !== undefined && v !== null && String(v).trim() !== '') || '').trim();
          }

          let finalStudentName = '';
          let finalPhoneRaw = '';

          // Smart auto-detection if columns are swapped or column A is phone
          if (isPhonePattern(valA) && !isPhonePattern(valB) && valB.length > 0) {
            finalStudentName = valB;
            finalPhoneRaw = valA;
          } else if (isPhonePattern(valA) && (!valB || isPhonePattern(valB))) {
            finalStudentName = '';
            finalPhoneRaw = valA;
          } else {
            finalStudentName = valA;
            finalPhoneRaw = valB;
          }

          if (!finalStudentName && !finalPhoneRaw) continue;

          const parsed = processPhoneRow(finalStudentName, finalPhoneRaw);

          if (parsed.status === 'valid' && phoneSet.has(parsed.formattedPhone)) {
            parsed.status = 'duplicate';
            parsed.errorMessage = 'رقم مكرر داخل الملف';
          } else if (parsed.status === 'valid') {
            phoneSet.add(parsed.formattedPhone);
          }

          newRows.push(parsed);
        }

        setRows(newRows);
        setIsSuccess(false);
        showToast(`تم قراءة ${newRows.length} سجل من ملف الإكسل: ${fileName}`, 'info');
      } catch (err: any) {
        console.error(err);
        showToast('حدث خطأ أثناء قراءة ملف الإكسل: ' + (err?.message || ''), 'error');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleAddManualRow = () => {
    if (!manualStudentName.trim() || !manualPhone.trim()) {
      showToast('يرجى إدخال اسم الطالب ورقم الهاتف', 'error');
      return;
    }

    const newRow = processPhoneRow(manualStudentName, manualPhone);
    setRows(prev => [newRow, ...prev]);
    setManualStudentName('');
    setManualPhone('');
    showToast('تم إضافة السجل بنجاح', 'success');
  };

  const handleRemoveRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdateRow = (id: string, field: 'studentName' | 'formattedPhone' | 'password', val: string) => {
    setRows(prev =>
      prev.map(r => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: val };
        if (field === 'formattedPhone') {
          const reprocessed = processPhoneRow(updated.studentName, val);
          return { ...updated, formattedPhone: reprocessed.formattedPhone, status: reprocessed.status, errorMessage: reprocessed.errorMessage };
        }
        return updated;
      })
    );
  };

  const handleSaveAccounts = async () => {
    const validRows = rows.filter(r => r.status === 'valid');
    if (validRows.length === 0) {
      showToast('لا توجد حسابات صالحة للإنشاء', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const accountsList = validRows.map(row => ({
        studentName: row.studentName,
        phone: row.formattedPhone,
        username: row.formattedPhone,
        password: row.password,
        schoolName: schoolName,
        branch: adminBranch,
        role: 'parent',
        createdAt: new Date().toISOString(),
        isActive: true
      }));

      // 1. Save directly to server
      const response = await fetch('/api/auth/parent-bulk-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accounts: accountsList,
          schoolId: schoolId || schoolName || 'school1'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'فشل حفظ الحسابات في السيرفر');
      }

      // 2. Also keep local cache
      const existingParentsStr = localStorage.getItem('berq_parent_accounts_cache') || '[]';
      const existingParents = JSON.parse(existingParentsStr);
      const updatedParents = [...existingParents, ...accountsList];
      localStorage.setItem('berq_parent_accounts_cache', JSON.stringify(updatedParents));

      // 3. Record Excel upload history entry
      const historyEntry: ExcelUploadHistoryEntry = {
        id: `upl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        fileName: uploadedFileName || `ملف_إكسل_${new Date().toLocaleDateString('ar-IQ').replace(/\//g, '-')}.xlsx`,
        schoolName,
        branch: adminBranch,
        totalRowsCount: rows.length,
        validAccountsCount: validRows.length,
        uploadedBy: 'إدارة المدرسة',
        uploadDate: new Date().toISOString(),
        sampleStudentNames: validRows.slice(0, 4).map(r => r.studentName),
        accounts: validRows
      };

      try {
        await fetch('/api/auth/parent-upload-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(historyEntry)
        });
      } catch (histErr) {
        console.error('Error logging upload history:', histErr);
      }

      const updatedHistory = [historyEntry, ...historyLogs];
      setHistoryLogs(updatedHistory);
      localStorage.setItem('berq_parent_excel_uploads_history', JSON.stringify(updatedHistory));

      logActivity({
        action: 'إنشاء حسابات أولياء أمور إكسل',
        details: `تم إنشاء ${validRows.length} حساب ولي أمر من ملف ${historyEntry.fileName} لمدرسة ${schoolName}`,
        targetType: 'parent_accounts'
      });

      setCreatedCount(validRows.length);
      setIsSuccess(true);
      showToast(`تم إنشاء ${validRows.length} حساب وتسجيل الملف في السجل بنجاح!`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast('حدث خطأ أثناء حفظ الحسابات: ' + (err?.message || ''), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintSlips = async (targetAccounts?: ParentAccountRow[]) => {
    if (isPrintingSlips) return;

    const validRows = (targetAccounts || rows).filter(r => r.status === 'valid');
    const targetRows = validRows.length > 0 ? validRows : (targetAccounts || rows);

    if (targetRows.length === 0) {
      showToast('لا توجد بيانات للطباعة', 'error');
      return;
    }

    try {
      setIsPrintingSlips(true);
      showToast('جاري تحضير ملف PDF بدقة عالية وشديدة الوضوح...', 'info');
      await new Promise(r => setTimeout(r, 50));

      // Chunk cards into groups of 8 cards per A4 page for perfect printing
      const cardsPerPage = 8;
      const pages: ParentAccountRow[][] = [];
      for (let i = 0; i < targetRows.length; i += cardsPerPage) {
        pages.push(targetRows.slice(i, i + cardsPerPage));
      }

      const totalPages = pages.length;

      const pagesHtml = pages.map((pageCards, pageIdx) => {
        const cardsHtml = pageCards.map((item) => {
          let displayStudentName = item.studentName || '';
          // Ensure phone numbers never appear as student names
          if (!displayStudentName || /^\+?\d+$/.test(displayStudentName.replace(/\s+/g, ''))) {
            displayStudentName = item.formattedPhone ? `طالب (ولي الأمر: ${item.formattedPhone})` : 'طالب بدون اسم';
          }

          return `
            <div style="
              box-sizing: border-box;
              border: 1.5px dashed #475569;
              border-radius: 10px;
              padding: 10px 12px;
              background: #ffffff;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              position: relative;
              height: 220px;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
              <span style="position: absolute; top: -10px; right: 14px; background: #ffffff; padding: 0 6px; font-size: 10px; color: #64748b; font-weight: 700;">✂ قص من هنا</span>
              
              <div>
                <div style="
                  background: #0f172a;
                  color: #facc15;
                  padding: 6px 10px;
                  border-radius: 6px;
                  text-align: center;
                  font-weight: 800;
                  font-size: 13px;
                  margin-bottom: 8px;
                ">
                  بَوّابة بيرق - مدرسة ${schoolName}
                </div>

                <div style="text-align: center; font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 8px; background: #e0f2fe; padding: 5px 8px; border-radius: 6px; border: 1px solid #bae6fd;">
                  إلى ولي أمر الطالب/ة: <span style="color: #0369a1; font-weight: 900;">${displayStudentName}</span>
                </div>

                <div style="
                  background: #f8fafc;
                  border: 1px solid #cbd5e1;
                  border-radius: 6px;
                  padding: 8px 10px;
                ">
                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; margin-bottom: 5px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px;">
                    <span style="color: #475569; font-weight: 700;">اسم المستخدم (الهاتف):</span>
                    <span style="font-family: monospace; font-weight: 800; font-size: 14px; color: #047857; direction: ltr;">${item.formattedPhone}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
                    <span style="color: #475569; font-weight: 700;">كلمة المرور الابتدائية:</span>
                    <span style="font-family: monospace; font-weight: 800; font-size: 14px; color: #b45309; letter-spacing: 1px;">${item.password}</span>
                  </div>
                </div>
              </div>

              <div style="text-align: center; font-size: 9.5px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 4px; margin-top: 4px;">
                <strong>📱 يرجى تحميل تطبيق (بَوّابة بيرق) وتسجيل الدخول بهذه البيانات.</strong>
              </div>
            </div>
          `;
        }).join('');

        return `
          <div class="a4-page" style="
            width: 794px;
            height: 1123px;
            padding: 24px;
            box-sizing: border-box;
            background: #ffffff;
            page-break-after: always;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            overflow: hidden;
            margin: 0 auto;
          ">
            <div style="text-align: center; margin-bottom: 14px; border-bottom: 2px solid #0284c7; padding-bottom: 8px;">
              <h2 style="font-size: 17px; color: #0f172a; font-weight: 900; margin: 0;">بَوّابة بيرق التعليمية - قصاصات دخول أولياء الأمور</h2>
              <p style="font-size: 11px; color: #64748b; margin-top: 3px; font-weight: 700;">مدرسة ${schoolName} • صفحة ${pageIdx + 1} من ${totalPages} • إجمالي القصاصات: ${targetRows.length}</p>
            </div>

            <div style="
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              grid-template-rows: repeat(4, 1fr);
              gap: 12px;
              flex-grow: 1;
            ">
              ${cardsHtml}
            </div>
          </div>
        `;
      }).join('');

      const fullHtml = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>قصاصات حسابات أولياء الأمور - مدرسة ${schoolName}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              background: #ffffff;
              direction: rtl;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .a4-page {
              width: 210mm;
              height: 297mm;
              padding: 12mm;
              box-sizing: border-box;
              background: #ffffff;
              page-break-after: always;
              break-after: page;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              overflow: hidden;
              margin: 0 auto;
            }
            .a4-page:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
            @media print {
              html, body {
                width: 210mm;
                height: 297mm;
                background: #ffffff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .a4-page {
                box-shadow: none !important;
                margin: 0 !important;
                width: 210mm !important;
                height: 297mm !important;
              }
            }
          </style>
        </head>
        <body>
          ${pagesHtml}
        </body>
        </html>
      `;

      await printHTML(fullHtml, `Bairaq_Parent_Slips_${Date.now()}.pdf`);
      showToast('تم استخراج واستحداث ملف PDF بنجاح! 📄🎉', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('حدث خطأ أثناء إعداد القصاصات للطباعة: ' + (err?.message || ''), 'error');
    } finally {
      setIsPrintingSlips(false);
    }
  };

  const handleShareTelegram = async (targetAccounts?: ParentAccountRow[]) => {
    const validRows = (targetAccounts || rows).filter(r => r.status === 'valid');
    const targetRows = validRows.length > 0 ? validRows : (targetAccounts || rows);

    if (targetRows.length === 0) {
      showToast('لا توجد بيانات للمشاركة', 'error');
      return;
    }

    try {
      showToast('جاري توجيه كشف الحسابات وملف الـ PDF إلى تليجرام...', 'info');

      const sampleList = targetRows.slice(0, 10).map((acc, i) => (
        `• ${acc.studentName} | هاتف: ${acc.formattedPhone} | رمز: ${acc.password}`
      )).join('\n');

      const tgText = `📋 **قصاصات حسابات أولياء الأمور - بَوّابة بيرق**\n🏫 المدرسة: ${schoolName}\n👥 عدد الحسابات: ${targetRows.length} طالب/ة\n\n${sampleList}${targetRows.length > 10 ? `\n...وغيرهم من الحسابات (${targetRows.length - 10})` : ''}\n\n📲 **رابط المنصة:** ${window.location.origin}`;

      const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(tgText)}`;
      window.open(tgShareUrl, '_blank');

      await handlePrintSlips(targetAccounts);
      showToast('تم توجيه الملف إلى تليجرام وتوليد PDF بنجاح ✈️', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('خطأ أثناء إرسال التليجرام: ' + (err?.message || ''), 'error');
    }
  };

  const handleShareWhatsApp = async (targetAccounts?: ParentAccountRow[]) => {
    const validRows = (targetAccounts || rows).filter(r => r.status === 'valid');
    const targetRows = validRows.length > 0 ? validRows : (targetAccounts || rows);

    if (targetRows.length === 0) {
      showToast('لا توجد بيانات للمشاركة', 'error');
      return;
    }

    try {
      showToast('جاري توجيه كشف الحسابات وملف الـ PDF إلى واتساب...', 'info');

      const sampleList = targetRows.slice(0, 10).map((acc, i) => (
        `• *${acc.studentName}* | هاتف: \`${acc.formattedPhone}\` | الرمز: \`${acc.password}\``
      )).join('\n');

      const waText = `📋 *قصاصات حسابات أولياء الأمور - بَوّابة بيرق*\n🏫 *المدرسة:* ${schoolName}\n👥 *عدد الحسابات:* ${targetRows.length}\n\n${sampleList}${targetRows.length > 10 ? `\n_(بقية الحسابات موجودة في ملف PDF المرفق)_` : ''}\n\n📲 *رابط المنصة:* ${window.location.origin}`;

      const waShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;
      window.open(waShareUrl, '_blank');

      await handlePrintSlips(targetAccounts);
      showToast('تم توجيه الملف إلى واتساب وتوليد PDF بنجاح 💬', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('خطأ أثناء إرسال الواتساب: ' + (err?.message || ''), 'error');
    }
  };

  const handleDeleteHistoryEntry = async (id: string) => {
    if (!window.confirm('هل أنت تأكد من إزالة هذا السجل من قائمة الملفات المرفوعة؟')) return;

    try {
      await fetch(`/api/auth/parent-upload-history/${id}`, { method: 'DELETE' });
      const updated = historyLogs.filter(h => h.id !== id);
      setHistoryLogs(updated);
      localStorage.setItem('berq_parent_excel_uploads_history', JSON.stringify(updated));
      showToast('تم حذف السجل بنجاح', 'success');
    } catch (err) {
      showToast('تعذر حذف السجل من السيرفر', 'error');
    }
  };

  const handleDownloadSampleTemplate = async () => {
    try {
      const sampleData = [
        { 'اسم الطالب': 'علي محمد حسين', 'رقم هاتف ولي الأمر': '07701234567' },
        { 'اسم الطالب': 'فاطمة أحمد كاظم', 'رقم هاتف ولي الأمر': '07809876543' },
        { 'اسم الطالب': 'حسين علي عباس', 'رقم هاتف ولي الأمر': '07501122334' },
      ];

      await exportToExcel(sampleData, 'نموذج_إكسل_حسابات_أولياء_الأمور.xlsx', 'نموذج_الحسابات');
      showToast('تم تحميل نموذج ملف الإكسل بنجاح 📊', 'success');
    } catch (err: any) {
      console.error(err);
      showToast('خطأ في تحضير ملف النموذج: ' + (err?.message || ''), 'error');
    }
  };

  const filteredHistory = historyLogs.filter(h => {
    if (!historySearchQuery.trim()) return true;
    const q = historySearchQuery.toLowerCase();
    return (
      h.fileName.toLowerCase().includes(q) ||
      h.schoolName.toLowerCase().includes(q) ||
      h.sampleStudentNames.some(s => s.toLowerCase().includes(q))
    );
  });

  const validRowsCount = rows.filter(r => r.status === 'valid').length;

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
        <div className="relative w-full max-w-lg bg-[#0c1329] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 text-white" style={{ direction: 'rtl' }}>
          
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20 animate-bounce">
            <CheckCircle2 size={48} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">تم إنشاء الحسابات وتسجيل السجل! 🎉</h2>
            <p className="text-sm text-emerald-400 font-bold">تم حفظ {createdCount} حساب ولي أمر مفعّل برقم الهاتف في السيرفر والسجل</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-right text-xs text-white/70 space-y-2.5">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <ShieldCheck size={18} className="text-emerald-400" />
              <span>الخطوة التالية لتوزيع القصاصات:</span>
            </div>
            <p>1. اضغط على الزر الذهبي أدناه لطباعة قصاصات الدخول (PDF) الجاهزة لكل طالب.</p>
            <p>2. تم تدوين اسم الملف المرفوع وزمن الإنشاء في سِجل رفع الإكسل لمنع تكراره مستقبلاً.</p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => handlePrintSlips()}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
            >
              <Printer size={18} />
              <span>طباعة قصاصات PDF 🖨️</span>
            </button>
          </div>

          <button
            onClick={() => {
              setIsSuccess(false);
              setRows([]);
              onClose();
            }}
            className="w-full py-2.5 px-5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white font-bold text-xs cursor-pointer transition-colors"
          >
            إغلاق النافذة
          </button>

          <button
            onClick={() => {
              setIsSuccess(false);
              setRows([]);
              setActiveTab('new_upload');
            }}
            className="text-xs text-emerald-400 hover:underline font-bold block mx-auto cursor-pointer"
          >
            + إضافة دفعة إكسل جديدة
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in overflow-hidden">
      <div className="relative w-full h-full sm:h-[95vh] max-w-full sm:max-w-6xl bg-[#0c1329] border-0 sm:border border-white/10 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden text-right flex flex-col my-auto text-white shrink-0" style={{ direction: 'rtl' }}>
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-[#101935] to-[#0d1428] border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <FileSpreadsheet size={22} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black text-white">إدارة وحسابات أولياء الأمور (Excel)</h2>
              <p className="text-[10px] sm:text-xs text-white/50 mt-0.5">إنشاء الحسابات بالجملة وتتبع سجلات الملفات المرفوعة سابقاً</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* View Mode Switcher */}
            <div className="flex items-center p-1 bg-black/40 border border-white/10 rounded-xl">
              <button
                onClick={() => setActiveTab('new_upload')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'new_upload' 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Upload size={14} />
                <span>رفع جديد</span>
              </button>
              <button
                onClick={() => setActiveTab('upload_history')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'upload_history' 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <History size={14} />
                <span>سجل الملفات ({historyLogs.length})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="إغلاق النافذة"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          
          {activeTab === 'upload_history' ? (
            /* Upload History View */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/10">
                <div className="relative w-full sm:w-72">
                  <Search size={16} className="absolute right-3 top-3 text-white/40" />
                  <input
                    type="text"
                    value={historySearchQuery}
                    onChange={e => setHistorySearchQuery(e.target.value)}
                    placeholder="ابحث باسم الملف أو الطالب..."
                    className="w-full pr-9 pl-3 py-2 bg-black/30 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                  <input
                    type="file"
                    ref={historySyncInputRef}
                    accept=".xlsx, .xls, .csv"
                    onChange={handleHistorySyncFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => historySyncInputRef.current?.click()}
                    className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/30 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                    title="تحديث أسماء الطلاب السابقة عبر رفع ملف إكسل يضم أرقام الهواتف والأسماء"
                  >
                    <RefreshCw size={14} />
                    <span>مطابقة إكسل وتحديث الأسماء بالهاتف ⚡</span>
                  </button>

                  <span className="text-xs text-white/60 font-bold">
                    إجمالي الملفات: <strong className="text-emerald-400">{historyLogs.length}</strong>
                  </span>
                </div>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="bg-black/20 border border-dashed border-white/10 p-10 rounded-2xl text-center space-y-3">
                  <History size={40} className="mx-auto text-white/20" />
                  <p className="text-xs text-white/40 font-bold">لا يوجد سجل ملفات مرفوعة يطابق بحثك حتى الآن.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {filteredHistory.map(entry => (
                    <div 
                      key={entry.id}
                      className="bg-gradient-to-r from-[#101935] to-[#0a0f1f] border border-white/10 hover:border-emerald-500/30 rounded-2xl p-4 space-y-3 transition-all shadow-md"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                            <FileSpreadsheet size={18} />
                          </div>
                          <div>
                            <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                              <span>{entry.fileName}</span>
                              <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                {entry.validAccountsCount} حساب
                              </span>
                            </h3>
                            <div className="flex items-center gap-3 text-[10px] text-white/50 font-bold mt-0.5">
                              <span className="flex items-center gap-1">
                                <Calendar size={12} className="text-amber-400" />
                                {new Date(entry.uploadDate).toLocaleDateString('ar-IQ', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <span>• المدرسة: {entry.schoolName}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 flex-wrap">
                          <button
                            onClick={() => handlePrintSlips(entry.accounts)}
                            disabled={isPrintingSlips}
                            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                            title="إعادة طباعة قصاصات هذا الملف"
                          >
                            {isPrintingSlips ? (
                              <RefreshCw size={14} className="animate-spin text-amber-300" />
                            ) : (
                              <Printer size={14} />
                            )}
                            <span>{isPrintingSlips ? 'جاري التحضير...' : 'طباعة PDF'}</span>
                          </button>

                          <button
                            onClick={() => setSelectedHistoryItem(selectedHistoryItem?.id === entry.id ? null : entry)}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Eye size={14} />
                            <span>{selectedHistoryItem?.id === entry.id ? 'إخفاء' : 'عرض البيانات / تعديل الأسماء'}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteHistoryEntry(entry.id)}
                            className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-colors cursor-pointer"
                            title="حذف السجل"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Sample Student Names */}
                      {entry.sampleStudentNames.length > 0 && (
                        <div className="text-[11px] text-white/60 font-bold flex flex-wrap items-center gap-1.5">
                          <span className="text-white/40">عينة التلاميذ:</span>
                          {entry.sampleStudentNames.map((name, idx) => (
                            <span key={idx} className="bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg text-white">
                              {name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Expanded View of Accounts */}
                      {selectedHistoryItem?.id === entry.id && (
                        <div className="mt-3 bg-black/40 border border-white/10 rounded-xl p-3 space-y-3 animate-in fade-in">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
                            <h4 className="text-xs font-black text-emerald-400 flex items-center gap-2">
                              <span>قائمة كافة الحسابات لهذا الملف ({entry.accounts.length})</span>
                              <span className="text-[10px] text-white/40 font-mono">ID: {entry.id}</span>
                            </h4>
                            <button
                              onClick={() => handleSaveHistoryEntryNames(entry)}
                              disabled={isSavingHistory}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-lg flex items-center gap-1.5 shadow cursor-pointer transition-colors"
                            >
                              <RefreshCw size={12} className={isSavingHistory ? 'animate-spin' : ''} />
                              <span>حفظ وتحديث أسماء الطلاب بالسيرفر</span>
                            </button>
                          </div>

                          <p className="text-[10px] text-amber-300/80 font-bold">
                            💡 يمكنك تعديل اسم أي طالب في الحقل المخصص أدناه، ثم الضغط على "حفظ وتحديث أسماء الطلاب بالسيرفر" لحفظ التعديل وإعادة طباعة القصاصات بالاسم الجديد فوراً دون تغيير كلمة المرور.
                          </p>

                          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                            {entry.accounts.map((acc, idx) => (
                              <div key={acc.id || idx} className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 gap-2">
                                <span className="text-white/40 font-mono w-6 shrink-0 text-center">{idx + 1}.</span>
                                <input
                                  type="text"
                                  value={acc.studentName}
                                  onChange={e => handleHistoryNameEdit(entry.id, acc.id, e.target.value)}
                                  placeholder="اسم الطالب..."
                                  className="bg-black/40 border border-white/10 focus:border-emerald-500 text-white rounded px-2.5 py-1 text-xs font-bold flex-1 outline-none"
                                />
                                <span className="font-mono text-emerald-400 text-[11px] font-bold shrink-0 px-2" style={{ direction: 'ltr' }}>{acc.formattedPhone}</span>
                                <span className="font-mono text-amber-300 text-[11px] font-bold shrink-0">{acc.password}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* New Upload View */
            <>
              {/* Duplicate Warning Banner */}
              {duplicateWarning && (
                <div className="bg-amber-500/15 border border-amber-500/40 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in">
                  <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={20} />
                  <p className="text-xs font-bold text-amber-200 leading-relaxed">
                    {duplicateWarning}
                  </p>
                </div>
              )}

              {/* Instructions Box */}
              <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck size={16} />
                    <span>شروط ومعالجة الملف السريعة:</span>
                  </span>
                  <p className="text-xs text-white/70 leading-relaxed">
                    1. الملف يحتوي على عمودين: <strong className="text-white">اسم الطالب</strong> و <strong className="text-white">رقم هاتف ولي الأمر</strong>.<br />
                    2. النظام يقبل الأرقام بكل الصيغ ويحولها تلقائياً لتبدأ بـ <strong className="text-emerald-300">7 (بدون صفر أولي أو كود دولة)</strong>.<br />
                    3. كلمة المرور تولّد عشوائياً وتُسجل مع أرشفة اسم الملف لمنع الخطأ والتكرار.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0 w-full sm:w-auto">
                  <button
                    onClick={handleDownloadSampleTemplate}
                    className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-white/10"
                    title="تحميل نموذج إكسل تجريبي جاهز"
                  >
                    <FileSpreadsheet size={16} className="text-amber-400" />
                    <span>تحميل نموذج Excel</span>
                  </button>

                  <button
                    onClick={() => historySyncInputRef.current?.click()}
                    className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all border border-amber-400/30"
                    title="مطابقة أرقام الهواتف وتحديث أسماء الطلاب من الملف الأصلي"
                  >
                    <RefreshCw size={14} />
                    <span>مطابقة ملف أصلي بأسماء الطلاب ⚡</span>
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all"
                  >
                    <Upload size={16} />
                    <span>رفع إنشاء جديد (Excel)</span>
                  </button>
                </div>
              </div>

              {/* Quick Manual Entry row */}
              <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-3">
                <span className="text-xs font-black text-white/80 block">إضافة سجل يدوي أو تجريبي:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="اسم الطالب / التلميذ..."
                    value={manualStudentName}
                    onChange={e => setManualStudentName(e.target.value)}
                    className="h-10 px-4 bg-[#0d1428] border border-white/10 rounded-xl text-xs text-white placeholder-white/30 outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="رقم الهاتف (مثال: 7701234567)..."
                    value={manualPhone}
                    onChange={e => setManualPhone(e.target.value)}
                    className="h-10 px-4 bg-[#0d1428] border border-white/10 rounded-xl text-xs text-white placeholder-white/30 outline-none focus:border-emerald-500 text-left"
                    style={{ direction: 'ltr' }}
                  />
                  <button
                    onClick={handleAddManualRow}
                    className="h-10 px-4 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Plus size={16} />
                    <span>إضافة للجدول</span>
                  </button>
                </div>
              </div>

              {/* Table Preview */}
              {rows.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white/80 flex items-center gap-2">
                      <span>معاينة الحسابات المستوردة</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                        {validRowsCount} صالحة من أصل {rows.length}
                      </span>
                    </span>

                    <button
                      onClick={() => {
                        setRows([]);
                        setUploadedFileName('');
                        setDuplicateWarning(null);
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={14} />
                      <span>مسح القائمة</span>
                    </button>
                  </div>

                  <div className="border border-white/10 rounded-2xl overflow-x-auto overflow-y-auto bg-black/20 max-h-[50vh] sm:max-h-[420px] overscroll-contain touch-auto">
                    <table className="w-full min-w-[720px] text-right text-xs">
                      <thead className="bg-[#101935] text-white/60 sticky top-0 font-black border-b border-white/10 z-10">
                        <tr>
                          <th className="p-3 text-center w-12">#</th>
                          <th className="p-3 min-w-[180px]">اسم الطالب (القصاصة)</th>
                          <th className="p-3 text-center min-w-[170px]">رقم هاتف ولي الأمر (يبدأ بـ 7)</th>
                          <th className="p-3 text-center min-w-[120px]">كلمة المرور الابتدائية</th>
                          <th className="p-3 text-center min-w-[140px]">الحالة</th>
                          <th className="p-3 text-center w-16">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-white">
                        {rows.map((r, idx) => (
                          <tr key={r.id} className={`hover:bg-white/5 ${r.status !== 'valid' ? 'bg-rose-950/10' : ''}`}>
                            <td className="p-3 text-center font-mono text-white/40">{idx + 1}</td>
                            <td className="p-3 font-bold">
                              <input
                                type="text"
                                value={r.studentName}
                                onChange={e => handleUpdateRow(r.id, 'studentName', e.target.value)}
                                className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-emerald-500 outline-none w-full font-bold"
                              />
                            </td>
                            <td className="p-3 text-center font-mono dir-ltr font-bold text-emerald-400">
                              <input
                                type="text"
                                value={r.formattedPhone}
                                onChange={e => handleUpdateRow(r.id, 'formattedPhone', e.target.value)}
                                className="bg-transparent text-center border-b border-transparent hover:border-white/20 focus:border-emerald-500 outline-none w-full font-mono text-emerald-400 font-bold"
                                style={{ direction: 'ltr' }}
                              />
                            </td>
                            <td className="p-3 text-center font-mono text-amber-300">
                              {r.password}
                            </td>
                            <td className="p-3 text-center">
                              {r.status === 'valid' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold whitespace-nowrap">
                                  <CheckCircle2 size={12} /> جاهز
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-full font-bold whitespace-nowrap" title={r.errorMessage}>
                                  <AlertCircle size={12} /> {r.errorMessage || 'غير صالح'}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleRemoveRow(r.id)}
                                className="p-1 hover:bg-rose-500/20 rounded text-rose-400 transition-colors cursor-pointer"
                                title="حذف السجل"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-black/20 border border-dashed border-white/10 p-8 sm:p-12 rounded-2xl text-center space-y-3">
                  <FileSpreadsheet size={40} className="mx-auto text-white/20" />
                  <p className="text-xs text-white/40 font-bold">لم يتم رفع أي ملف إكسل بعد. يمكنك استخدام الزر أعلاه لتحميل نموذج تجريبي أو رفع ملف الإكسل المجهز.</p>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer Actions */}
        {activeTab === 'new_upload' && (
          <div className="p-4 sm:p-6 bg-[#0d1428] border-t border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0 sticky bottom-0 z-20">
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              <button
                onClick={() => handlePrintSlips()}
                disabled={rows.length === 0 || isPrintingSlips}
                className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-black text-xs flex items-center justify-center gap-1.5 disabled:opacity-40 transition-all cursor-pointer"
                title="طباعة وتحميل قصاصات PDF"
              >
                {isPrintingSlips ? (
                  <RefreshCw size={15} className="animate-spin text-amber-300" />
                ) : (
                  <Printer size={15} />
                )}
                <span>{isPrintingSlips ? 'جاري التوليد...' : 'طباعة (PDF)'}</span>
              </button>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-bold text-xs cursor-pointer transition-colors"
              >
                إلغاء
              </button>

              <button
                onClick={handleSaveAccounts}
                disabled={isProcessing || validRowsCount === 0}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-40 cursor-pointer transition-all"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>جاري إنشاء الحسابات...</span>
                  </>
                ) : (
                  <>
                    <UserCheck size={16} />
                    <span>إنشاء {validRowsCount} حساب بنقرة زر 🚀</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Interactive Smart Matching Preview Modal */}
        {matchingPreviewModalOpen && matchingData && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in">
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#090d1a] border border-emerald-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col space-y-4 text-white overflow-hidden" style={{ direction: 'rtl' }}>
              
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <RefreshCw size={22} className="animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <span>معاينة نتائج المطابقة الذكية للملف الأصلي ⚡</span>
                    </h3>
                    <p className="text-xs text-emerald-400/90 font-bold mt-0.5">
                      الملف المرفوع: <strong className="text-white font-mono">{matchingData.fileName}</strong> ({matchingData.matchedUpdates.length} طالب)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setMatchingPreviewModalOpen(false)}
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="إلغاء المعاينة"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Summary Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-right">
                  <span className="text-[11px] text-white/50 block font-bold">إجمالي السطور المعالجة</span>
                  <span className="text-lg font-black text-white font-mono">{matchingData.totalParsed}</span>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 text-right">
                  <span className="text-[11px] text-emerald-300 block font-bold">مطابقة وجاهزة للتحديث بالاسم الصريح</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">{matchingData.matchedUpdates.length} طالب</span>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-right">
                  <span className="text-[11px] text-amber-300 block font-bold">تحديث الحسابات والقصاصات</span>
                  <span className="text-xs font-bold text-amber-200">فور التأكيد بنقرة زر</span>
                </div>
              </div>

              {/* Search filter in matching preview */}
              <div className="flex items-center justify-between gap-3 shrink-0">
                <div className="relative w-full sm:w-72">
                  <Search size={16} className="absolute right-3 top-3 text-white/40" />
                  <input
                    type="text"
                    value={matchSearchQuery}
                    onChange={e => setMatchSearchQuery(e.target.value)}
                    placeholder="تصفية بالاسم أو رقم الهاتف..."
                    className="w-full pr-9 pl-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
                <span className="text-xs text-white/50 font-bold shrink-0">
                  معروض: {matchingData.matchedUpdates.filter(u => !matchSearchQuery.trim() || u.studentName.includes(matchSearchQuery) || u.phone.includes(matchSearchQuery)).length}
                </span>
              </div>

              {/* Matched Students Table */}
              <div className="border border-white/10 rounded-2xl overflow-x-auto overflow-y-auto bg-black/30 flex-1 max-h-[45vh] min-h-[220px] touch-pan-y overscroll-contain">
                <table className="w-full min-w-[650px] text-right text-xs">
                  <thead className="bg-[#101935] text-white/60 sticky top-0 font-black border-b border-white/10 z-10">
                    <tr>
                      <th className="p-3 text-center w-12">#</th>
                      <th className="p-3 text-center min-w-[140px]">رقم الهاتف</th>
                      <th className="p-3 min-w-[170px]">الاسم الحالي بالنظام</th>
                      <th className="p-3 min-w-[180px]">الاسم المستخرج من الملف الأصلي</th>
                      <th className="p-3 text-center min-w-[120px]">حالة الربط</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white">
                    {matchingData.matchedUpdates
                      .filter(u => !matchSearchQuery.trim() || u.studentName.includes(matchSearchQuery) || u.phone.includes(matchSearchQuery))
                      .map((item, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                          <td className="p-3 text-center font-mono text-white/40">{idx + 1}</td>
                          <td className="p-3 text-center font-mono text-emerald-400 font-black" style={{ direction: 'ltr' }}>
                            {item.phone}
                          </td>
                          <td className="p-3 text-white/60 font-bold">
                            {item.currentName}
                          </td>
                          <td className="p-3 font-black text-amber-300">
                            {item.studentName}
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">
                              <CheckCircle2 size={12} /> مطابق للربط
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 pt-4 shrink-0">
                <p className="text-xs text-white/60 font-bold text-right">
                  سيتم تحديث كافة أسماء أولياء الأمور والقصاصات وسجل الملفات بأرقام الهواتف المطابقة فوراً.
                </p>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setMatchingPreviewModalOpen(false)}
                    disabled={isExecutingMatch}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer transition-colors"
                  >
                    إلغاء
                  </button>

                  <button
                    onClick={handleConfirmExecuteMatching}
                    disabled={isExecutingMatch}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isExecutingMatch ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>جاري تنفيذ المطابقة والتحديث...</span>
                      </>
                    ) : (
                      <>
                        <UserCheck size={16} />
                        <span>تأكيد واستبدال الأسماء ({matchingData.matchedUpdates.length} طالب) 🚀</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

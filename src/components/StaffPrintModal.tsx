import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  ArrowRight,
  Download,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { getOfficialSchoolName } from '../lib/constants';

interface Teacher {
  id: string;
  name: string;
  photo?: string;
  subject: string;
  role: 'TEACHER' | 'STAFF';
  bio?: string;
  classes?: string[];
  schedule?: string[];
  canPublish?: boolean;
  isActive?: boolean;
  rating?: number;
  adminNotes?: string;
  code?: string;
  classCodes?: Record<string, string>;
}

interface StaffPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: Teacher[];
  currentFilteredTeachers: Teacher[];
  currentFilteredStaff: Teacher[];
  activeSubTab: 'teachers' | 'staff' | 'schedule';
  schoolName: string;
  schoolId?: string | null;
  schoolLogoUrl?: string;
  getTeacherSections: (teacher: Teacher) => string[];
}

export const StaffPrintModal: React.FC<StaffPrintModalProps> = ({
  isOpen,
  onClose,
  teachers,
  currentFilteredTeachers,
  currentFilteredStaff,
  activeSubTab,
  schoolName,
  schoolId,
  getTeacherSections,
}) => {
  const [printScope, setPrintScope] = useState<'current' | 'all' | 'teachers' | 'staff'>('current');
  const [includeCodes, setIncludeCodes] = useState(false);
  const [includeSections, setIncludeSections] = useState(true);
  const [includeSignatureCol, setIncludeSignatureCol] = useState(true);
  const [includeOfficialFooter, setIncludeOfficialFooter] = useState(true);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const officialSchoolName = getOfficialSchoolName(schoolId || undefined, schoolName);

  // Determine list of members to print
  let membersToPrint: Teacher[] = [];
  let scopeTitle = '';

  switch (printScope) {
    case 'current':
      if (activeSubTab === 'teachers') {
        membersToPrint = currentFilteredTeachers;
        scopeTitle = 'قائمة الكادر التدريسي (حسب التصفية)';
      } else if (activeSubTab === 'staff') {
        membersToPrint = currentFilteredStaff;
        scopeTitle = 'قائمة الكادر الوظيفي والإداري (حسب التصفية)';
      } else {
        membersToPrint = teachers;
        scopeTitle = 'قائمة الكادر العامة';
      }
      break;
    case 'teachers':
      membersToPrint = teachers.filter(t => t.role === 'TEACHER' || !t.role);
      scopeTitle = 'قائمة الكادر التدريسي الشاملة';
      break;
    case 'staff':
      membersToPrint = teachers.filter(t => t.role === 'STAFF');
      scopeTitle = 'قائمة الكادر الإداري والخدمي الشاملة';
      break;
    case 'all':
    default:
      membersToPrint = teachers;
      scopeTitle = 'السجل العام للكادر التعليمي والوظيفي';
      break;
  }

  const totalTeachers = teachers.filter(t => t.role === 'TEACHER' || !t.role).length;
  const totalStaff = teachers.filter(t => t.role === 'STAFF').length;

  const currentDate = new Date().toLocaleDateString('ar-IQ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Generate standalone printable document HTML string
  const getDocumentHtml = () => {
    const tableRows = membersToPrint.map((member, idx) => {
      const sections = getTeacherSections(member);
      const isTeacher = member.role === 'TEACHER' || !member.role;
      const sectionsText = sections && sections.length > 0 
        ? sections.join(' ، ') 
        : (isTeacher ? 'لم تحدد شُعب' : 'مهام إدارية عامة');
      
      return `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 10px; font-weight: bold; color: #0f172a;">${member.name || 'غير محدد'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-weight: bold; color: ${isTeacher ? '#1e3a8a' : '#334155'};">
            ${isTeacher ? `مدرس: ${member.subject || 'عام'}` : (member.subject || 'موظف')}
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center;">
            <span style="background: ${isTeacher ? '#dbeafe' : '#dcfce7'}; color: ${isTeacher ? '#1e40af' : '#166534'}; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; border: 1px solid ${isTeacher ? '#bfdbfe' : '#bbf7d0'};">
              ${isTeacher ? 'تدريسي' : 'إداري/خدمي'}
            </span>
          </td>
          ${includeSections ? `<td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11px; color: #334155;">${sectionsText}</td>` : ''}
          ${includeCodes ? `<td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-family: monospace; font-weight: bold; font-size: 11px;">${member.code || '-'}</td>` : ''}
          <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-weight: bold; color: ${member.isActive !== false ? '#15803d' : '#b91c1c'}; font-size: 11px;">
            ${member.isActive !== false ? 'نشط' : 'متوقف'}
          </td>
          ${includeSignatureCol ? `<td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center;"><div style="border-bottom: 1px dashed #94a3b8; height: 20px; width: 100%;"></div></td>` : ''}
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${scopeTitle} - ${officialSchoolName}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
          }
          body {
            background-color: #ffffff;
            color: #0f172a;
            margin: 0;
            padding: 20px;
            direction: rtl;
            font-size: ${fontSize === 'sm' ? '11px' : fontSize === 'lg' ? '14px' : '12px'};
          }
          .header-box {
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .header-flex {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .title-badge {
            background-color: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 8px;
            text-align: center;
            margin-top: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th {
            background-color: #0f172a;
            color: #ffffff;
            font-weight: 900;
            padding: 8px 6px;
            border: 1px solid #334155;
            font-size: 11px;
          }
          .footer-box {
            margin-top: 35px;
            padding-top: 15px;
            border-top: 1px solid #cbd5e1;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .stamp-circle {
            width: 80px;
            height: 80px;
            border: 2px dashed #94a3b8;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            color: #64748b;
            margin: 0 auto;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div class="header-flex">
            <div>
              <div style="font-size: 11px; font-weight: bold; color: #475569;">جمهورية العراق</div>
              <div style="font-size: 11px; font-weight: bold; color: #475569;">وزارة التربية والتعليم</div>
              <div style="font-size: 17px; font-weight: 900; color: #0f172a; margin-top: 2px;">${officialSchoolName}</div>
              <div style="font-size: 11px; color: #64748b; font-weight: 600; margin-top: 1px;">إدارة شؤون الكادر والموظفين</div>
            </div>
            <div style="text-align: left; font-size: 11px; color: #475569; line-height: 1.6;">
              <div>التاريخ: <strong style="color: #0f172a;">${currentDate}</strong></div>
              <div>المستند: <strong style="color: #0f172a;">سجل رسمي معتمد</strong></div>
              <div>إجمالي العدد: <strong style="color: #0f172a;">${membersToPrint.length} فرد</strong></div>
            </div>
          </div>

          <div class="title-badge">
            <div style="font-size: 15px; font-weight: 900; color: #0f172a;">${scopeTitle}</div>
            <div style="font-size: 10px; color: #64748b; font-weight: bold; margin-top: 2px;">
              العام الدراسي ${new Date().getFullYear()} - ${new Date().getFullYear() + 1} م
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 35px;">ت</th>
              <th style="text-align: right;">الاسم الكامل</th>
              <th>الصفة / الاختصاص</th>
              <th style="width: 75px;">النوع</th>
              ${includeSections ? '<th style="text-align: right;">الشُعب / المراحل المسندة</th>' : ''}
              ${includeCodes ? '<th style="width: 85px;">كود الدخول</th>' : ''}
              <th style="width: 60px;">الحالة</th>
              ${includeSignatureCol ? '<th style="width: 90px;">توقيع المستلم</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        ${includeOfficialFooter ? `
          <div class="footer-box">
            <div style="text-align: center;">
              <div style="font-size: 11px; font-weight: bold; color: #64748b; margin-bottom: 25px;">مسؤول شؤون الكادر</div>
              <div style="font-size: 11px; font-weight: 900; color: #0f172a;">التوقيع: ..........................</div>
            </div>
            <div style="text-align: center;">
              <div class="stamp-circle">ختم الإدارة الرسمي</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 11px; font-weight: bold; color: #64748b; margin-bottom: 25px;">مدير المؤسسة التعليمية</div>
              <div style="font-size: 11px; font-weight: 900; color: #0f172a;">التوقيع: ..........................</div>
            </div>
          </div>
        ` : ''}
      </body>
      </html>
    `;
  };

  // Download / Save as PDF HTML document
  const handleDownloadPdfDocument = () => {
    try {
      const docHtml = getDocumentHtml();
      const blob = new Blob([docHtml], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `سجل_الكادر_${new Date().toISOString().slice(0, 10)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setStatusMessage('تم تنزيل مستند الكادر بنجاح (يمكن فتحه وحفظه كـ PDF)');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  // Export to Excel / CSV
  const handleExportCsv = () => {
    try {
      const headers = ['ت', 'الاسم الكامل', 'الصفة/المادة', 'النوع', 'الشعب والصفوف', 'كود الدخول', 'الحالة'];
      const rows = membersToPrint.map((m, idx) => {
        const isTeacher = m.role === 'TEACHER' || !m.role;
        const sections = getTeacherSections(m).join(' - ');
        return [
          idx + 1,
          `"${m.name || ''}"`,
          `"${m.subject || ''}"`,
          `"${isTeacher ? 'تدريسي' : 'إداري'}"`,
          `"${sections || ''}"`,
          `"${m.code || ''}"`,
          `"${m.isActive !== false ? 'نشط' : 'متوقف'}"`
        ];
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `سجل_الكادر_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setStatusMessage('تم تصدير ملف الإكسل (CSV) بنجاح');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error('CSV export error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md overflow-hidden">
      {/* Strict Print CSS for full page A4 printing */}
      <style>{`
        @media print {
          html, body {
            background: white !important;
            color: black !important;
            height: auto !important;
            overflow: visible !important;
          }
          body * {
            visibility: hidden !important;
          }
          #staff-print-area, #staff-print-area * {
            visibility: visible !important;
          }
          #staff-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            padding: 10px !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>

      <div className="relative w-full h-full sm:h-auto sm:max-h-[94vh] max-w-5xl bg-[#0f172a] sm:border sm:border-white/10 sm:rounded-3xl shadow-2xl flex flex-col no-print overflow-hidden">
        {/* Sticky Top Header Bar (Clean - Only Back & Title & Close) */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 bg-slate-900 z-20 shadow-md">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-rose-500/20 text-white/80 hover:text-rose-300 transition-colors border border-white/10 text-xs font-bold cursor-pointer"
              title="إغلاق والعودة"
            >
              <ArrowRight size={16} />
              <span className="hidden sm:inline">رجوع</span>
            </button>
            
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="text-white font-black text-sm sm:text-base leading-tight">سجل وتصدير قوائم الكادر</h3>
                <p className="text-white/50 text-[10px] sm:text-xs font-bold">تجهيز المستند الرسمي للتصدير والحفظ</p>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/60 hover:text-rose-300 transition-colors border border-white/5 cursor-pointer"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Notification Toast */}
        {statusMessage && (
          <div className="bg-emerald-500 text-slate-950 font-black text-xs px-4 py-2 text-center flex items-center justify-center gap-2">
            <CheckCircle2 size={16} />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Scrollable Center Body: Settings Controls + Document Preview */}
        <div className="flex-1 overflow-y-auto overscroll-contain bg-slate-950/70 p-3 sm:p-6 space-y-4">
          {/* Options & Controls Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-white/10 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <span className="text-xs font-black text-emerald-400 flex items-center gap-2">
                <FileText size={14} />
                خيارات تخصيص المستند
              </span>
              <span className="text-[11px] font-bold text-white/50 bg-white/5 px-2.5 py-1 rounded-lg">
                إجمالي الكادر المحدد: <strong className="text-white font-black">{membersToPrint.length}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Scope Selection */}
              <div>
                <label className="block text-[11px] font-black text-white/70 mb-1.5">نطاق القائمة:</label>
                <select 
                  value={printScope} 
                  onChange={(e) => setPrintScope(e.target.value as any)}
                  className="w-full bg-[#1e293b] border border-white/10 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="current">القائمة الحالية المعروضة</option>
                  <option value="teachers">الكادر التدريسي فقط ({totalTeachers})</option>
                  <option value="staff">الكادر الإداري والخدمي فقط ({totalStaff})</option>
                  <option value="all">القائمة الشاملة لكافة الكادر ({teachers.length})</option>
                </select>
              </div>

              {/* Font Size Selection */}
              <div>
                <label className="block text-[11px] font-black text-white/70 mb-1.5">حجم الخط:</label>
                <select 
                  value={fontSize} 
                  onChange={(e) => setFontSize(e.target.value as any)}
                  className="w-full bg-[#1e293b] border border-white/10 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-emerald-500"
                >
                  <option value="sm">مدمج (صغير - للأعداد الكبيرة)</option>
                  <option value="base">قياسي (متوسط - موصى به)</option>
                  <option value="lg">كبير وواضح</option>
                </select>
              </div>

              {/* Include Codes Toggle */}
              <div className="flex items-center justify-between bg-[#1e293b]/70 p-2.5 rounded-xl border border-white/5">
                <div>
                  <span className="text-xs font-black text-white block">إظهار أكواد الدخول</span>
                  <span className="text-[10px] text-white/40">تضمين رمز الدخول السري</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setIncludeCodes(!includeCodes)}
                  className={`w-11 h-6 rounded-full p-1 transition-colors ${includeCodes ? 'bg-amber-500' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${includeCodes ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Include Sections Toggle */}
              <div className="flex items-center justify-between bg-[#1e293b]/70 p-2.5 rounded-xl border border-white/5">
                <div>
                  <span className="text-xs font-black text-white block">إظهار الشُعب والصفوف</span>
                  <span className="text-[10px] text-white/40">توضيح الشُعب الموكلة</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setIncludeSections(!includeSections)}
                  className={`w-11 h-6 rounded-full p-1 transition-colors ${includeSections ? 'bg-emerald-500' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${includeSections ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
              <div className="flex items-center gap-4 text-xs text-white/70">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={includeSignatureCol} 
                    onChange={(e) => setIncludeSignatureCol(e.target.checked)}
                    className="rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-0 w-4 h-4"
                  />
                  <span className="font-bold">عمود التوقيع الإداري</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={includeOfficialFooter} 
                    onChange={(e) => setIncludeOfficialFooter(e.target.checked)}
                    className="rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-0 w-4 h-4"
                  />
                  <span className="font-bold">تذييل الختم وتوقيع الإدارة</span>
                </label>
              </div>
            </div>
          </div>

          {/* Printable Sheet Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-white/50 font-bold px-1">
              <span>معاينة المستند المطبوع (ورقة A4 الرسمية)</span>
              <span className="text-emerald-400 font-black">جاهز للطباعة والتصدير</span>
            </div>

            <div 
              id="staff-print-area" 
              className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200 min-h-[450px] text-right font-sans overflow-x-auto"
              dir="rtl"
            >
              {/* Header with Official Seals */}
              <div className="border-b-2 border-slate-800 pb-4 mb-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-600">جمهورية العراق</p>
                    <p className="text-xs font-bold text-slate-600">وزارة التربية والتعليم</p>
                    <h2 className="text-lg font-black text-slate-900 mt-1">{officialSchoolName}</h2>
                    <p className="text-xs font-semibold text-slate-500">إدارة شؤون الكادر والموظفين</p>
                  </div>

                  <div className="text-left text-xs font-semibold text-slate-600 space-y-1">
                    <p>التاريخ: <span className="font-bold text-slate-900">{currentDate}</span></p>
                    <p>المستند: <span className="font-bold text-slate-900">سجل رسمي معتمد</span></p>
                    <p>إجمالي العدد: <span className="font-bold text-slate-900">{membersToPrint.length} فرد</span></p>
                  </div>
                </div>

                <div className="mt-4 text-center bg-slate-100 py-2.5 rounded-xl border border-slate-200">
                  <h1 className="text-base font-black text-slate-900">{scopeTitle}</h1>
                  <p className="text-[11px] text-slate-600 font-bold mt-0.5">
                    العام الدراسي {new Date().getFullYear()} - {new Date().getFullYear() + 1} م
                  </p>
                </div>
              </div>

              {/* Main Data Table */}
              {membersToPrint.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-bold text-sm">
                  لا يوجد أفراد مطابقين للخيارات المحددة
                </div>
              ) : (
                <table className={`w-full border-collapse border border-slate-300 ${
                  fontSize === 'sm' ? 'text-[10px]' : fontSize === 'lg' ? 'text-sm' : 'text-xs'
                }`}>
                  <thead>
                    <tr className="bg-slate-800 text-white font-black text-center">
                      <th className="border border-slate-700 py-2 px-2 w-10">ت</th>
                      <th className="border border-slate-700 py-2 px-3 text-right">الاسم الكامل</th>
                      <th className="border border-slate-700 py-2 px-3">الصفة / الاختصاص</th>
                      <th className="border border-slate-700 py-2 px-2 w-20">النوع</th>
                      {includeSections && (
                        <th className="border border-slate-700 py-2 px-3 text-right">الشُعب / المراحل المسندة</th>
                      )}
                      {includeCodes && (
                        <th className="border border-slate-700 py-2 px-2 text-center w-28">كود الدخول</th>
                      )}
                      <th className="border border-slate-700 py-2 px-2 w-16">الحالة</th>
                      {includeSignatureCol && (
                        <th className="border border-slate-700 py-2 px-3 w-28 text-center">توقيع المستلم</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {membersToPrint.map((member, idx) => {
                      const sections = getTeacherSections(member);
                      const isTeacher = member.role === 'TEACHER' || !member.role;

                      return (
                        <tr 
                          key={member.id || idx} 
                          className={`border-b border-slate-300 hover:bg-slate-50 transition-colors ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                          }`}
                        >
                          <td className="border border-slate-300 py-2 px-2 text-center font-bold text-slate-600">
                            {idx + 1}
                          </td>
                          <td className="border border-slate-300 py-2 px-3 font-black text-slate-900">
                            {member.name || 'غير محدد'}
                          </td>
                          <td className="border border-slate-300 py-2 px-3 text-center font-bold text-slate-800">
                            {isTeacher ? (
                              <span className="text-indigo-900 font-bold">مدرس: {member.subject || 'عام'}</span>
                            ) : (
                              <span className="text-slate-700 font-bold">{member.subject || 'موظف'}</span>
                            )}
                          </td>
                          <td className="border border-slate-300 py-2 px-2 text-center font-bold">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              isTeacher 
                                ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {isTeacher ? 'تدريسي' : 'إداري/خدمي'}
                            </span>
                          </td>
                          {includeSections && (
                            <td className="border border-slate-300 py-2 px-3 text-slate-700 text-[11px] leading-relaxed">
                              {sections && sections.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {sections.map((sec, sIdx) => (
                                    <span 
                                      key={sIdx} 
                                      className="inline-block bg-slate-200/80 px-1.5 py-0.5 rounded text-slate-800 text-[10px] font-bold"
                                    >
                                      {sec}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">
                                  {isTeacher ? 'لم تحدد شُعب' : 'مهام إدارية عامة'}
                                </span>
                              )}
                            </td>
                          )}
                          {includeCodes && (
                            <td className="border border-slate-300 py-2 px-2 text-center font-mono font-bold text-slate-900 text-[10px]">
                              {member.code ? (
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                                  {member.code}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                          )}
                          <td className="border border-slate-300 py-2 px-2 text-center font-bold">
                            <span className={`text-[10px] ${member.isActive !== false ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {member.isActive !== false ? 'نشط' : 'متوقف'}
                            </span>
                          </td>
                          {includeSignatureCol && (
                            <td className="border border-slate-300 py-2 px-3 text-center">
                              <div className="h-6 border-b border-dashed border-slate-300 w-full" />
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* Official Footer */}
              {includeOfficialFooter && (
                <div className="mt-10 pt-6 border-t border-slate-300 flex items-end justify-between px-6 text-slate-800">
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-500 mb-6">مسؤول شؤون الكادر</p>
                    <p className="text-xs font-black text-slate-800">التوقيع: ..........................</p>
                  </div>

                  <div className="text-center">
                    <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400 mx-auto">
                      ختم الإدارة الرسمي
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-500 mb-6">مدير المؤسسة التعليمية</p>
                    <p className="text-xs font-black text-slate-800">التوقيع: ..........................</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clean Sticky Bottom Actions Bar */}
        <div className="flex-shrink-0 px-3 sm:px-6 py-3 border-t border-white/10 bg-slate-900 z-20 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 shadow-lg">
          <button 
            type="button"
            onClick={onClose}
            className="px-3 sm:px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold transition-all border border-white/5 cursor-pointer"
          >
            إلغاء وإغلاق
          </button>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
            {/* 1. Export Excel / CSV */}
            <button 
              type="button"
              onClick={handleExportCsv}
              className="bg-amber-600 hover:bg-amber-500 active:scale-95 text-white px-3 sm:px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              title="تصدير بيانات الكادر إلى ملف إكسل"
            >
              <FileSpreadsheet size={15} />
              <span className="hidden sm:inline">تصدير</span>
              <span>ملف إكسل</span>
            </button>

            {/* 2. Download / PDF document */}
            <button 
              type="button"
              onClick={handleDownloadPdfDocument}
              className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white px-4 sm:px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-lg hover:shadow-blue-500/25 cursor-pointer"
              title="تنزيل المستند الرسمي لفتحه وحفظه كـ PDF"
            >
              <Download size={16} />
              <span>PDF / مستند</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export interface AttendancePrintStudent {
  name: string;
  code?: string;
  dayStatus: 'present' | 'absent' | 'late' | 'unrecorded';
  period?: string;
  reason?: string;
  by?: string;
  dayLog?: {
    status?: string;
    by?: string;
    reason?: string;
    period?: string;
    timestamp?: string;
  } | null;
}

export interface AttendancePrintOptions {
  schoolName?: string;
  className: string;
  date: string;
  supervisorName?: string;
  students: AttendancePrintStudent[];
  stats?: {
    total: number;
    present: number;
    absent: number;
    late: number;
    unrecorded?: number;
    attendanceRate: number;
  };
}

export const printAttendanceReport = (options: AttendancePrintOptions) => {
  const {
    schoolName = 'مجموعة مدارس بيرق الأهلية النموذجية',
    className,
    date,
    supervisorName = 'الكادر التعليمي والإداري',
    students = [],
    stats
  } = options;

  const total = stats?.total ?? students.length;
  const present = stats?.present ?? students.filter(s => s.dayStatus === 'present').length;
  const absent = stats?.absent ?? students.filter(s => s.dayStatus === 'absent').length;
  const late = stats?.late ?? students.filter(s => s.dayStatus === 'late').length;
  const unrecorded = stats?.unrecorded ?? students.filter(s => s.dayStatus === 'unrecorded').length;
  const attendanceRate = stats?.attendanceRate ?? (total > 0 ? Math.round((present / total) * 100) : 0);

  // Format date nicely in Arabic
  let formattedDateArabic = date;
  try {
    const d = new Date(date + 'T00:00:00');
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const dayName = dayNames[d.getDay()] || '';
    formattedDateArabic = `${dayName} - ${date}`;
  } catch {}

  const printTimeStr = new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });

  const tableRowsHtml = students.map((st, idx) => {
    let statusLabel = 'غير مرصود';
    let statusBg = '#f1f5f9';
    let statusColor = '#475569';
    let statusBorder = '#cbd5e1';
    let statusIcon = '⚪';

    const dayStatus = st.dayStatus || 'unrecorded';
    const reason = st.reason || st.dayLog?.reason || '';
    const period = st.period || st.dayLog?.period || '';
    const recordedBy = st.by || st.dayLog?.by || supervisorName || 'الإدارة';

    if (dayStatus === 'present') {
      statusLabel = 'حاضر';
      statusIcon = '✅';
      statusBg = '#ecfdf5';
      statusColor = '#065f46';
      statusBorder = '#a7f3d0';
    } else if (dayStatus === 'absent') {
      statusLabel = 'غائب';
      statusIcon = '❌';
      statusBg = '#fef2f2';
      statusColor = '#991b1b';
      statusBorder = '#fecaca';
    } else if (dayStatus === 'late') {
      statusLabel = 'متأخر';
      statusIcon = '⏳';
      statusBg = '#fffbeb';
      statusColor = '#92400e';
      statusBorder = '#fde68a';
    }

    let notesText = '-';
    if (dayStatus === 'absent') {
      notesText = reason ? `السبب: ${reason}` : 'بدون عذر معتمد';
    } else if (dayStatus === 'late') {
      notesText = `الحصة: ${period || '1'}${reason ? ' - ' + reason : ''}`;
    } else if (dayStatus === 'present' && period && period !== 'يوم كامل') {
      notesText = `حصة ${period}`;
    }

    return `
      <tr class="student-row" style="background-color: ${idx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
        <td style="text-align: center; font-weight: 700; color: #475569; width: 40px;">${idx + 1}</td>
        <td style="text-align: right; font-weight: 800; color: #0f172a; font-size: 11pt;">${st.name || 'طالب'}</td>
        <td style="text-align: center; font-family: monospace; font-size: 9.5pt; color: #334155; direction: ltr; font-weight: 600;">${st.code || '-'}</td>
        <td style="text-align: center;">
          <span style="display: inline-block; background-color: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder}; padding: 3px 10px; border-radius: 6px; font-weight: 800; font-size: 9.5pt; white-space: nowrap;">
            ${statusIcon} ${statusLabel}
          </span>
        </td>
        <td style="text-align: right; font-size: 9.5pt; color: #334155;">${notesText}</td>
        <td style="text-align: center; font-size: 9pt; color: #64748b;">${recordedBy}</td>
      </tr>
    `;
  }).join('');

  const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>كشف الحضور والغياب اليومي - ${className} - ${date}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    body {
      font-family: 'Cairo', 'Tajawal', system-ui, -apple-system, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      direction: rtl;
      text-align: right;
      padding: 20px;
      line-height: 1.4;
      font-size: 10pt;
    }

    .no-print-bar {
      max-width: 900px;
      margin: 0 auto 16px auto;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
    }

    .print-btn-main {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #ffffff;
      border: none;
      padding: 8px 20px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
      font-family: inherit;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
      transition: all 0.2s;
    }

    .print-btn-main:hover {
      background: linear-gradient(135deg, #1d4ed8, #1e40af);
      transform: translateY(-1px);
    }

    .close-btn {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 7px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .report-sheet {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      border: 2px solid #0f172a;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
    }

    .official-header {
      width: 100%;
      border-bottom: 2.5px solid #0f172a;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }

    .header-table {
      width: 100%;
      border-collapse: collapse;
    }

    .header-table td {
      border: none;
      padding: 0;
      vertical-align: middle;
    }

    .school-branding {
      font-size: 18pt;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.3px;
      margin-bottom: 4px;
    }

    .doc-main-title {
      font-size: 13pt;
      font-weight: 800;
      color: #1d4ed8;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .meta-tags {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
    }

    .tag-item {
      background: #f1f5f9;
      border: 1.5px solid #cbd5e1;
      padding: 4px 12px;
      border-radius: 8px;
      font-size: 10pt;
      font-weight: 700;
      color: #1e293b;
      white-space: nowrap;
    }

    .tag-item strong {
      color: #0f172a;
      font-weight: 900;
    }

    /* KPI Summary Row */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
      margin-bottom: 18px;
    }

    .kpi-box {
      border: 1.5px solid #cbd5e1;
      background: #f8fafc;
      border-radius: 8px;
      padding: 8px 10px;
      text-align: center;
    }

    .kpi-box.kpi-present {
      background: #ecfdf5;
      border-color: #a7f3d0;
    }

    .kpi-box.kpi-absent {
      background: #fef2f2;
      border-color: #fecaca;
    }

    .kpi-box.kpi-late {
      background: #fffbeb;
      border-color: #fde68a;
    }

    .kpi-box.kpi-unrecorded {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }

    .kpi-box .val {
      font-size: 16pt;
      font-weight: 900;
      line-height: 1.2;
    }

    .kpi-box .lbl {
      font-size: 8.5pt;
      font-weight: 800;
      color: #475569;
      margin-top: 2px;
    }

    /* Attendance Table */
    .attendance-data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 22px;
      font-size: 10pt;
    }

    .attendance-data-table th,
    .attendance-data-table td {
      border: 1.5px solid #94a3b8;
      padding: 7px 10px;
      vertical-align: middle;
    }

    .attendance-data-table th {
      background-color: #0f172a;
      color: #ffffff;
      font-weight: 800;
      font-size: 9.5pt;
      text-align: center;
      white-space: nowrap;
    }

    .attendance-data-table tr.student-row:nth-child(even) {
      background-color: #f8fafc;
    }

    /* Signatures Section */
    .signatures-block {
      margin-top: 26px;
      padding-top: 16px;
      border-top: 2px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 20px;
    }

    .signature-card {
      text-align: center;
      width: 220px;
    }

    .signature-card .role {
      font-size: 10pt;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 35px;
    }

    .signature-card .line {
      border-top: 1.5px solid #475569;
      padding-top: 4px;
      font-size: 9pt;
      color: #475569;
      font-weight: 700;
    }

    .official-stamp-box {
      width: 110px;
      height: 75px;
      border: 2px dashed #b91c1c;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #b91c1c;
      font-weight: 900;
      font-size: 9pt;
      text-align: center;
      margin: 0 auto;
      background: #fffafa;
    }

    .footer-note {
      margin-top: 16px;
      text-align: center;
      font-size: 8pt;
      color: #94a3b8;
      font-weight: 600;
    }

    /* PRINT RULES */
    @media print {
      @page {
        size: A4 portrait;
        margin: 8mm 8mm 8mm 8mm;
      }

      body {
        background: transparent !important;
        padding: 0 !important;
        font-size: 9.5pt !important;
      }

      .no-print-bar {
        display: none !important;
      }

      .report-sheet {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
        margin: 0 !important;
      }

      .attendance-data-table {
        page-break-inside: auto;
      }

      .attendance-data-table thead {
        display: table-header-group !important;
      }

      .attendance-data-table tfoot {
        display: table-footer-group !important;
      }

      .student-row {
        page-break-inside: avoid !important;
        page-break-after: auto !important;
      }

      .signatures-block {
        page-break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div style="display: flex; align-items: center; gap: 10px;">
      <button class="print-btn-main" onclick="window.print()">
        <span>🖨️</span>
        <span>طباعة المستند الآن (أو حفظ بتنسيق PDF)</span>
      </button>
      <span style="font-size: 11px; color: #94a3b8;">💡 تم ضبط الكشف بأبعاد صفحة A4 الرسمية ونسبة وضوح عالية</span>
    </div>
    <button class="close-btn" onclick="window.close()">إغلاق ✕</button>
  </div>

  <div class="report-sheet">
    <div class="official-header">
      <table class="header-table">
        <tr>
          <td style="width: 55%;">
            <div class="school-branding">🏫 ${schoolName}</div>
            <div class="doc-main-title">
              <span>كشف تفصيلي لرصد الحضور والغياب اليومي</span>
            </div>
            <div style="font-size: 9pt; color: #64748b; margin-top: 4px;">
              المسؤول / المشرف: <strong style="color: #1e293b;">${supervisorName}</strong>
            </div>
          </td>
          <td style="width: 45%;">
            <div class="meta-tags">
              <div class="tag-item">الشعبة الأكاديمية: <strong>${className}</strong></div>
              <div class="tag-item">التاريخ: <strong>${formattedDateArabic}</strong></div>
              <div style="font-size: 8pt; color: #94a3b8; margin-top: 2px;">توقيت الاستخراج: ${printTimeStr}</div>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- KPI Summary Row -->
    <div class="kpi-row">
      <div class="kpi-box">
        <div class="val" style="color: #0f172a;">${total}</div>
        <div class="lbl">إجمالي الشعبة</div>
      </div>
      <div class="kpi-box kpi-present">
        <div class="val" style="color: #047857;">${present}</div>
        <div class="lbl">حاضر (${attendanceRate}%)</div>
      </div>
      <div class="kpi-box kpi-absent">
        <div class="val" style="color: #b91c1c;">${absent}</div>
        <div class="lbl">غياب</div>
      </div>
      <div class="kpi-box kpi-late">
        <div class="val" style="color: #b45309;">${late}</div>
        <div class="lbl">تأخير</div>
      </div>
      <div class="kpi-box kpi-unrecorded">
        <div class="val" style="color: #64748b;">${unrecorded}</div>
        <div class="lbl">غير مرصود</div>
      </div>
    </div>

    <!-- Main Table -->
    <table class="attendance-data-table">
      <thead>
        <tr>
          <th style="width: 35px;">ت</th>
          <th style="text-align: right;">اسم الطالب الرباعي</th>
          <th style="width: 85px;">كود الطالب</th>
          <th style="width: 105px;">حالة الحضور</th>
          <th style="text-align: right;">الملاحظات / العذر / الحصة</th>
          <th style="width: 100px;">المسجل</th>
        </tr>
      </thead>
      <tbody>
        ${tableRowsHtml || '<tr><td colspan="6" style="padding: 24px; text-align: center; color: #94a3b8; font-weight: bold;">لا يوجد طلاب مسجلين في هذه الشعبة</td></tr>'}
      </tbody>
    </table>

    <!-- Signatures -->
    <div class="signatures-block">
      <div class="signature-card">
        <div class="role">مسجل الحضور / المشرف</div>
        <div class="line">${supervisorName}</div>
      </div>

      <div class="signature-card">
        <div class="official-stamp-box">
          <span>ختم المدرسة</span>
          <span style="font-size: 7.5pt; font-weight: normal; margin-top: 2px;">الرسمي المعتمد</span>
        </div>
      </div>

      <div class="signature-card">
        <div class="role">مصادقة إدارة المدرسة</div>
        <div class="line">المدير / المعاون الإداري</div>
      </div>
    </div>

    <div class="footer-note">
      مستند رسمي معتمد صادر عن نظام الإدارة المدرسية الموحد - بوابة بيرق النموذجية
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function() {
          setTimeout(function() {
            window.print();
          }, 300);
        });
      } else {
        setTimeout(function() {
          window.print();
        }, 500);
      }
    });
  </script>
</body>
</html>`;

  // Printing execution:
  // 1. Try to open popup window
  let printWindow: Window | null = null;
  try {
    printWindow = window.open('', '_blank', 'width=980,height=850,menubar=no,toolbar=no,location=no');
  } catch {
    printWindow = null;
  }

  if (printWindow && printWindow.document) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    // 2. Iframe fallback for iframe-contained or popup-blocked browsers
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = 'none';
    printFrame.style.zIndex = '-9999';
    printFrame.style.visibility = 'hidden';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(htmlContent);
      frameDoc.close();

      setTimeout(() => {
        try {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
        } catch (err) {
          console.error('Print iframe error:', err);
        }
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
        }, 3000);
      }, 600);
    }
  }
};

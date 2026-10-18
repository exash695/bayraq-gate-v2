import * as XLSX from 'xlsx';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Device } from '@capacitor/device';

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Platform Detective
 */
export const getPlatformInfo = async () => {
  const platform = Capacitor.getPlatform(); // 'web', 'ios', 'android'
  const info = await Device.getInfo();
  return { platform, ...info };
};

/**
 * Helper to convert Blob or ArrayBuffer to Base64 string
 */
const toBase64 = (data: Blob | ArrayBuffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    if (data instanceof Blob) {
      reader.readAsDataURL(data);
    } else {
      const blob = new Blob([data]);
      reader.readAsDataURL(blob);
    }
  });
};

/**
/**
 * Helper to generate a PDF Blob from an HTML string using jsPDF and canvas
 */
export const generatePDFBlobFromHTML = async (html: string): Promise<Blob> => {
  const parser = new DOMParser();
  const parsedDoc = parser.parseFromString(html, 'text/html');
  const pageNodes = Array.from(parsedDoc.querySelectorAll('.a4-page'));

  const container = document.createElement('div');
  container.id = 'bairaq-pdf-silent-container';
  container.style.cssText = 'position: fixed; left: -9999px; top: 0; width: 794px; background: #ffffff; z-index: -99999; overflow: hidden;';
  document.body.appendChild(container);

  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    if (pageNodes.length > 0) {
      for (let i = 0; i < pageNodes.length; i++) {
        container.innerHTML = '';
        container.appendChild(document.importNode(pageNodes[i], true));
        await new Promise((r) => setTimeout(r, 15));

        const canvas = await html2canvas(container, {
          scale: 1.25,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 794,
          windowHeight: 1123,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

        container.innerHTML = '';
        canvas.width = 0;
        canvas.height = 0;
      }
    } else {
      container.innerHTML = html;
      await new Promise((r) => setTimeout(r, 30));

      const canvas = await html2canvas(container, {
        scale: 1.25,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(imgHeight, pdfHeight), undefined, 'FAST');
    }

    if (document.body.contains(container)) container.remove();
    return pdf.output('blob');
  } catch (err) {
    if (document.body.contains(container)) container.remove();
    throw err;
  }
};

/**
 * Universal Print Function.
 * Triggers native system printing directly (0ms, zero visual modals, zero flickering).
 * - On Mobile Native (Capacitor iOS/Android): Generates PDF and opens native system share/print sheet.
 * - On Web / Mobile Browsers (Chrome, Safari, Edge): Prints silently via off-screen hidden iframe,
 *   directly launching the browser's native print dialog without any screen flicker or blue overlays.
 */
export const printHTML = async (
  html: string,
  customFileName?: string
) => {
  const fileName = customFileName
    ? (customFileName.toLowerCase().endsWith('.pdf') ? customFileName : `${customFileName}.pdf`)
    : `Bairaq_Document_${Date.now()}.pdf`;

  // 1. Mobile Native App (Capacitor Android APK / iOS)
  if (Capacitor.isNativePlatform()) {
    try {
      const pdfBlob = await generatePDFBlobFromHTML(html);
      await saveOrSharePDF({ output: () => pdfBlob } as any, fileName);
      return;
    } catch (nativeErr) {
      console.warn('Native Capacitor direct PDF export failed, falling back to silent iframe:', nativeErr);
    }
  }

  // 2. Web & Mobile Browsers: Completely Silent Offscreen IFrame (Zero UI, No Blue Modals, No Progress Shifts)
  try {
    const existing = document.getElementById('bairaq-silent-print-frame');
    if (existing) {
      existing.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'bairaq-silent-print-frame';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position: fixed; top: -10000px; left: -10000px; width: 10px; height: 10px; border: none; opacity: 0; pointer-events: none; z-index: -9999;';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
    }

    let hasPrinted = false;
    const triggerPrint = () => {
      if (hasPrinted) return;
      hasPrinted = true;
      try {
        if (iframe.contentWindow) {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } else {
          window.print();
        }
      } catch (err) {
        console.warn('IFrame print restricted by browser, using window.print:', err);
        try {
          window.print();
        } catch (e) {}
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            iframe.remove();
          }
        }, 3000);
      }
    };

    if (iframe.contentDocument?.readyState === 'complete') {
      setTimeout(triggerPrint, 150);
    } else {
      iframe.onload = () => setTimeout(triggerPrint, 150);
      // Safety timeout in case onload event was missed
      setTimeout(triggerPrint, 600);
    }
  } catch (err) {
    console.error('printHTML error, falling back to window.print():', err);
    try {
      window.print();
    } catch (e) {}
  }
};

/**
 * Backward compatibility export
 */
export const printViaDOM = (html: string): boolean => {
  printHTML(html);
  return true;
};

/**
 * Unified Export to Excel
 */
export const exportToExcel = async (data: any[], fileName: string, sheetName: string = 'Sheet1') => {
  try {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    
    await saveAndShareFile(wbout, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  } catch (err) {
    console.error('Excel export failed:', err);
  }
};

/**
 * Unified Export to CSV
 */
export const exportToCSV = async (csvContent: string, fileName: string) => {
  try {
    const actualFileName = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const buffer = await blob.arrayBuffer();
    
    await saveAndShareFile(buffer, actualFileName, 'text/csv');
  } catch (err) {
    console.error('CSV export failed:', err);
  }
};

/**
 * Unified PDF Save/Share
 */
export const saveOrSharePDF = async (doc: jsPDF, fileName: string) => {
  try {
    const actualFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    const pdfBlob = doc.output('blob');
    await saveAndShareFile(pdfBlob, actualFileName, 'application/pdf');
  } catch (err) {
    console.error('PDF save/share failed:', err);
    try { doc.save(fileName); } catch(e) {}
  }
};

/**
 * Generic File Downloader (Supports R2/S3/External URLs)
 */
export const downloadFileFromUrl = async (url: string, fileName: string) => {
  const platform = Capacitor.getPlatform();
  
  if (platform === 'web' && typeof navigator === 'undefined') {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  try {
    const response = await fetch(url);
    const blob = await response.blob();
    await saveAndShareFile(blob, fileName, blob.type);
  } catch (err) {
    console.error('File download from URL failed:', err);
  }
};

/**
 * INTERNAL: Core save/share logic
 */
async function saveAndShareFile(data: any, fileName: string, mimeType: string, isBase64 = false) {
  const platform = Capacitor.getPlatform();

  let blob: Blob;
  if (data instanceof Blob) {
    blob = data;
  } else if (data instanceof ArrayBuffer) {
    blob = new Blob([data], { type: mimeType });
  } else if (isBase64) {
    const byteCharacters = atob(data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    blob = new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
  } else {
    blob = new Blob([data], { type: mimeType });
  }

  // 1. Mobile Native App (Capacitor Android APK / iOS)
  if (platform !== 'web') {
    try {
      const base64Data = isBase64 ? data : await toBase64(blob);
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      await Share.share({
        title: fileName,
        text: fileName,
        url: savedFile.uri,
      });
      return;
    } catch (nativeErr) {
      console.error('Native Capacitor share failed, falling back to Web Share / modal:', nativeErr);
    }
  }

  // 2. Open Native Share Dialog via Interactive User-Gesture Modal on Web / Mobile Browsers
  showInteractiveShareModal(blob, fileName, mimeType);
}

/**
 * Displays an interactive RTL popup modal that guarantees the native Android / iOS
 * share sheet pops up upon direct user touch, solving browser user-gesture timeouts.
 */
function showInteractiveShareModal(blob: Blob, fileName: string, mimeType: string) {
  const existing = document.getElementById('bairaq-share-modal-dialog');
  if (existing) existing.remove();

  const file = new File([blob], fileName, { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);

  const modal = document.createElement('div');
  modal.id = 'bairaq-share-modal-dialog';
  modal.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(8px);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    font-family: system-ui, -apple-system, sans-serif;
    direction: rtl;
  `;

  modal.innerHTML = `
    <div style="
      background: #ffffff;
      border-radius: 20px;
      max-width: 440px;
      width: 100%;
      padding: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
      border: 1px solid #e2e8f0;
      text-align: center;
      animation: popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    ">
      <div style="
        width: 64px;
        height: 64px;
        background: #dcfce7;
        color: #15803d;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        margin: 0 auto 16px auto;
      ">🎉</div>
      <h3 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">تم تجهيز الملف بنجاح!</h3>
      <p style="font-size: 13.5px; color: #475569; margin-bottom: 22px; line-height: 1.6;">
        اضغط على الزر الأزرق أدناه لفتح **نافذة مشاركة التطبيقات** ومشاركة الملف مباشرة عبر <strong>تليجرام (Telegram)</strong> أو <strong>واتساب</strong> أو الطباعة.
      </p>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button id="bairaq-share-main-btn" style="
          width: 100%;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #ffffff;
          border: none;
          padding: 15px 20px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 15px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
        ">
          <span>📲 فتح نافذة المشاركة (تليجرام / واتساب)</span>
        </button>

        <a id="bairaq-download-direct-btn" href="${objectUrl}" download="${fileName}" style="
          width: 100%;
          background: #f8fafc;
          color: #334155;
          border: 1px solid #cbd5e1;
          padding: 12px 20px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        ">
          <span>💾 حفظ / تنزيل الملف على الجهاز</span>
        </a>

        <button id="bairaq-close-modal-btn" style="
          background: transparent;
          color: #94a3b8;
          border: none;
          padding: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 2px;
        ">
          إغلاق
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const mainShareBtn = document.getElementById('bairaq-share-main-btn');
  const closeBtn = document.getElementById('bairaq-close-modal-btn');

  const executeShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        if (!navigator.canShare || navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: fileName,
            text: fileName
          });
          modal.remove();
          return;
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.warn('Navigator share error:', err);
      }
    }
    // Fallback if browser can't share files
    const downloadLink = document.getElementById('bairaq-download-direct-btn') as HTMLAnchorElement;
    if (downloadLink) downloadLink.click();
  };

  mainShareBtn?.addEventListener('click', executeShare);

  closeBtn?.addEventListener('click', () => {
    modal.remove();
  });

  // Try auto-sharing immediately in case browser allows it
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    navigator.share({
      files: [file],
      title: fileName,
      text: fileName
    }).then(() => {
      modal.remove();
    }).catch(() => {
      // Ignored: User can click the prominent blue button with fresh gesture!
    });
  }
}


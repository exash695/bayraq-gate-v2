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
 * Universal print helper.
 * Strictly generates a genuine, high-quality .PDF document file without freezing the UI thread,
 * then opens the native App Sharing Window (Share Sheet) on mobile/app, or downloads on web.
 */
export const printHTML = async (
  html: string,
  customFileName?: string
) => {
  const fileName = customFileName
    ? (customFileName.toLowerCase().endsWith('.pdf') ? customFileName : `${customFileName}.pdf`)
    : `Bairaq_Parent_Slips_${Date.now()}.pdf`;

  // Parse HTML string into DOM structure
  const parser = new DOMParser();
  const parsedDoc = parser.parseFromString(html, 'text/html');
  const pageNodes = Array.from(parsedDoc.querySelectorAll('.a4-page'));

  // Create isolated single-page render container in offscreen space
  const container = document.createElement('div');
  container.id = 'bairaq-pdf-render-container';
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px'; // Standard A4 width at 96 DPI
  container.style.background = '#ffffff';
  container.style.zIndex = '-99999';
  container.style.overflow = 'hidden';
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

        // Brief delay for inline layout & fonts calculation
        await new Promise((r) => setTimeout(r, 20));

        const canvas = await html2canvas(container, {
          scale: 1.25,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          allowTaint: true,
          windowWidth: 794,
          windowHeight: 1123,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

        // Free memory immediately
        container.innerHTML = '';
        canvas.width = 0;
        canvas.height = 0;

        // Yield to event loop
        await new Promise((r) => setTimeout(r, 5));
      }
    } else {
      // Fallback for single raw HTML string
      container.innerHTML = html;
      await new Promise((r) => setTimeout(r, 50));

      const canvas = await html2canvas(container, {
        scale: 1.25,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        windowWidth: 794,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(imgHeight, pdfHeight), undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }
    }

    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }

    await saveOrSharePDF(pdf, fileName);
  } catch (err) {
    console.error('PDF generation error:', err);
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    try {
      window.print();
    } catch (fallbackErr) {
      console.error('Native print fallback failed:', fallbackErr);
    }
  }
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
      console.error('Native Capacitor share failed, falling back to Web Share / download:', nativeErr);
    }
  }

  // 2. Web Share API for Mobile Browsers (Chrome Android, Safari iOS, PWA, etc.)
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const file = new File([blob], fileName, { type: mimeType });
      if (!navigator.canShare || navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: fileName,
          text: fileName,
        });
        return;
      }
    } catch (shareErr: any) {
      if (shareErr.name === 'AbortError') {
        console.log('User dismissed share sheet window');
        return;
      }
      console.warn('Web Share API failed, falling back to browser download:', shareErr);
    }
  }

  // 3. Standard Web Download (Blob URL trigger)
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 500);
  } catch (webErr) {
    console.error('Web blob download failed:', webErr);
  }
}

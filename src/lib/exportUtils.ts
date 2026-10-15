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
 * Web: uses iframe.print()
 * Mobile: Converts to PDF and shares via OS share sheet.
 */
export const printHTML = async (html: string, customFileName?: string) => {
  const platform = Capacitor.getPlatform();
  
  // Create hidden iframe to render the HTML
  let iframe = document.getElementById('bairaq-universal-render-frame') as HTMLIFrameElement;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'bairaq-universal-render-frame';
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '-9999px';
    iframe.style.width = '1024px';
    iframe.style.height = '1448px';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.style.border = 'none';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);
  }

  const renderPromise = new Promise<void>((resolve) => {
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc && iframe.contentWindow) {
      doc.open();
      doc.write(html);
      doc.close();
      
      const checkLoaded = () => {
        if (doc.readyState === 'complete') {
          setTimeout(resolve, 800);
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
    } else {
      resolve();
    }
  });

  await renderPromise;

  try {
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    const docElement = doc?.body;
    if (!docElement) throw new Error('Render frame body not found');

    // Attempt 1: Try generating PDF using html-to-image (handles Arabic SVG + CSS cleanly without html2canvas CSS parser crashes)
    let imgData: string | null = null;
    let canvasWidth = 1024;
    let canvasHeight = 1448;

    try {
      const { toPng } = await import('html-to-image');
      const pngUrl = await toPng(docElement, {
        quality: 0.98,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        skipFonts: true,
        filter: (domNode: HTMLElement) => {
          // Filter out external stylesheet link tags to Google Fonts to prevent CORS/inlining errors
          if (domNode.tagName === 'LINK' && domNode.getAttribute('href')?.includes('fonts.googleapis.com')) {
            return false;
          }
          return true;
        }
      });
      imgData = pngUrl;
      canvasWidth = docElement.scrollWidth || 1024;
      canvasHeight = docElement.scrollHeight || 1448;
    } catch (toImgErr) {
      console.warn('html-to-image failed, falling back to html2canvas:', toImgErr);
      const canvas = await html2canvas(docElement, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1024,
        windowHeight: 1448
      });
      imgData = canvas.toDataURL('image/jpeg', 0.95);
      canvasWidth = canvas.width;
      canvasHeight = canvas.height;
    }

    if (!imgData) throw new Error('Could not render image data');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfPageHeight = pdf.internal.pageSize.getHeight();
    const computedHeight = (canvasHeight * pdfWidth) / (canvasWidth || 1);

    if (computedHeight <= pdfPageHeight) {
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, computedHeight);
    } else {
      // Multi-page slicing or fit
      let remainingHeight = computedHeight;
      let position = 0;

      while (remainingHeight > 0) {
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, computedHeight);
        remainingHeight -= pdfPageHeight;
        if (remainingHeight > 0) {
          position -= pdfPageHeight;
          pdf.addPage();
        }
      }
    }

    const fileName = customFileName || `Bairaq_Report_${new Date().getTime()}.pdf`;

    const pdfBlob = pdf.output('blob');
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

    let shared = false;
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          files: [pdfFile],
          title: 'قصاصات حسابات أولياء الأمور - بوابة بيرق',
          text: 'مرفق لكم ملف قصاصات حسابات أولياء الأمور بصيغة PDF (تليجرام / واتساب)'
        });
        shared = true;
      } catch (shareErr: any) {
        if (shareErr?.name !== 'AbortError') {
          console.warn('Share sheet cancelled or failed:', shareErr);
        }
      }
    }

    if (!shared) {
      if (platform !== 'web') {
        const pdfBase64 = pdf.output('datauristring').split(',')[1];
        await saveAndShareFile(pdfBase64, fileName, 'application/pdf', true);
      } else {
        pdf.save(fileName);
      }
    }
  } catch (err) {
    console.error('PDF generation failed:', err);
    // Robust fallback: native browser print dialog
    if (platform === 'web') {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (printErr) {
        console.error('Direct print failed:', printErr);
      }
    } else {
      const base64 = btoa(unescape(encodeURIComponent(html)));
      await saveAndShareFile(base64, `Print_${Date.now()}.html`, 'text/html', true);
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
export const saveOrSharePDF = async (doc: any, fileName: string) => {
  try {
    const actualFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    const platform = Capacitor.getPlatform();

    if (platform !== 'web') {
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      await saveAndShareFile(pdfBase64, actualFileName, 'application/pdf', true);
    } else {
      doc.save(actualFileName);
    }
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
  
  if (platform === 'web') {
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
    // For mobile, we fetch the file and use Share
    const response = await fetch(url);
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    await saveAndShareFile(buffer, fileName, blob.type);
  } catch (err) {
    console.error('Mobile download failed:', err);
  }
};

/**
 * INTERNAL: Core save/share logic
 */
async function saveAndShareFile(data: any, fileName: string, mimeType: string, isBase64 = false) {
  const platform = Capacitor.getPlatform();

  // 1. Try Web Share API if supported on mobile browsers
  if (typeof navigator !== 'undefined' && navigator.canShare) {
    try {
      const blob = isBase64 
        ? await (await fetch(`data:${mimeType};base64,${data}`)).blob() 
        : new Blob([data], { type: mimeType });
      const file = new File([blob], fileName, { type: mimeType });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: fileName,
        });
        return;
      }
    } catch (shareErr) {
      console.warn('Web Share API failed or cancelled:', shareErr);
    }
  }

  // 2. Try Native Capacitor Filesystem if running in APK / Native shell
  if (platform !== 'web') {
    try {
      const base64Data = isBase64 ? data : await toBase64(data);
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      await Share.share({
        title: fileName,
        url: savedFile.uri,
      });
      return;
    } catch (nativeErr) {
      console.error('Native file operation failed, falling back to web download:', nativeErr);
    }
  }

  // 3. Standard Web Download (Blob URL)
  try {
    const blob = isBase64 
      ? await (await fetch(`data:${mimeType};base64,${data}`)).blob() 
      : new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 300);
  } catch (webErr) {
    console.error('Web blob download failed:', webErr);
    // 4. Ultimate Fallback: Data URI
    try {
      const base64Data = isBase64 ? data : await toBase64(data);
      const dataUri = `data:${mimeType};base64,${base64Data}`;
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 300);
    } catch (uriErr) {
      console.error('Data URI download failed:', uriErr);
    }
  }
}

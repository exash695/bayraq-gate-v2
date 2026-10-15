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
 * Strictly generates a genuine, high-quality .PDF document file without freezing the UI thread.
 */
export const printHTML = async (
  html: string,
  customFileName?: string
) => {
  const platform = Capacitor.getPlatform();
  const fileName = customFileName
    ? (customFileName.toLowerCase().endsWith('.pdf') ? customFileName : `${customFileName}.pdf`)
    : `Bairaq_Parent_Slips_${Date.now()}.pdf`;

  // Create or reuse hidden iframe to render the HTML
  let iframe = document.getElementById('bairaq-universal-render-frame') as HTMLIFrameElement;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'bairaq-universal-render-frame';
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '-9999px';
    iframe.style.width = '1024px';
    iframe.style.height = '1448px';
    iframe.style.opacity = '0.01';
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
          setTimeout(resolve, 100);
        } else {
          setTimeout(checkLoaded, 30);
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
    if (!doc || !iframe.contentWindow) throw new Error('Render frame body not found');

    const pageNodes = doc.querySelectorAll('.a4-page');

    if (pageNodes && pageNodes.length > 0) {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();

      let canvasSuccess = true;

      for (let i = 0; i < pageNodes.length; i++) {
        const pageEl = pageNodes[i] as HTMLElement;
        
        try {
          const canvas = await html2canvas(pageEl, {
            scale: 1.5,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            allowTaint: true
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.88);
          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfPageHeight, undefined, 'FAST');
        } catch (pageErr) {
          console.warn(`Page ${i + 1} capture failed:`, pageErr);
          canvasSuccess = false;
          break;
        }

        // YIELD to browser main event loop so UI does not freeze or block
        await new Promise(r => setTimeout(r, 15));
      }

      if (canvasSuccess) {
        await saveOrSharePDF(pdf, fileName);
        return;
      }
    }

    // Fallback if canvas rendering is skipped or failed: Direct native print dialog
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  } catch (err) {
    console.error('PDF generation error:', err);
    try {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }
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

import * as XLSX from 'xlsx';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Device } from '@capacitor/device';

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
 * Mobile: shares HTML file to be printed via OS share sheet.
 */
export const printHTML = async (html: string) => {
  const platform = Capacitor.getPlatform();
  
  if (platform !== 'web') {
    try {
      const fileName = `Print_${new Date().getTime()}.html`;
      // Use standard btoa for mobile-safe HTML sharing
      const base64 = btoa(unescape(encodeURIComponent(html)));
      
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Cache,
      });

      await Share.share({
        title: 'طباعة المستند',
        url: savedFile.uri,
      });
      return;
    } catch (err) {
      console.error('Native print share failed:', err);
    }
  }

  // Web logic (unchanged to maintain production stability)
  try {
    let iframe = document.getElementById('bairaq-universal-print-frame') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'bairaq-universal-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }, 500);
    }
  } catch (err) {
    window.print(); // Last resort fallback
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

  if (platform === 'web') {
    const blob = isBase64 ? await (await fetch(`data:${mimeType};base64,${data}`)).blob() : new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    return;
  }

  try {
    const base64Data = isBase64 ? data : await toBase64(data);
    
    // Choose directory based on platform
    // iOS usually works better with Directory.Documents for persistence or Directory.Cache for sharing
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Cache, // Use Cache so it's temporary but accessible for share sheet
    });

    await Share.share({
      title: fileName,
      url: savedFile.uri,
    });
  } catch (err) {
    console.error('Native file operation failed:', err);
  }
}

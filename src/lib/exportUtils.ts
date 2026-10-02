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
export const printHTML = async (html: string) => {
  const platform = Capacitor.getPlatform();
  
  // Create hidden iframe to render the HTML
  let iframe = document.getElementById('bairaq-universal-render-frame') as HTMLIFrameElement;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'bairaq-universal-render-frame';
    iframe.style.position = 'fixed';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.width = '1200px'; // Wide enough for high-quality rendering
    iframe.style.height = '1600px';
    document.body.appendChild(iframe);
  }

  const renderPromise = new Promise<void>((resolve) => {
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc && iframe.contentWindow) {
      // Disable print command to prevent browser dialog from appearing during PDF generation
      (iframe.contentWindow as any).print = () => { console.log('Internal print disabled during PDF generation'); };
      
      doc.open();
      doc.write(html);
      doc.close();
      
      // Wait for fonts and images to load
      const checkLoaded = () => {
        if (doc.readyState === 'complete') {
          // Additional delay for any scripts or font rendering
          setTimeout(resolve, 1000);
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
    const docElement = iframe.contentWindow?.document.body;
    if (!docElement) throw new Error('Render frame body not found');

    const canvas = await html2canvas(docElement, {
      scale: 2, // High quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    const fileName = `Bairaq_Report_${new Date().getTime()}.pdf`;

    if (platform !== 'web') {
      const pdfBase64 = pdf.output('datauristring').split(',')[1];
      await saveAndShareFile(pdfBase64, fileName, 'application/pdf', true);
    } else {
      pdf.save(fileName);
    }
  } catch (err) {
    console.error('PDF generation failed:', err);
    // Fallback to basic print if PDF generation fails
    if (platform === 'web') {
      iframe.contentWindow?.print();
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

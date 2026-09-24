import { resolveApiUrl } from '../lib/serverConfig';

/**
 * Utility to compress large images on client side before upload
 * Prevents HTTP 413 Payload Too Large and enhances speed across mobile networks
 */
export async function compressImageIfNeeded(file: File, maxDimension = 1920, quality = 0.85): Promise<File> {
  // Only compress images (exclude SVG, GIFs which might have animations, and videos)
  if (!file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
    return file;
  }

  // If already under 1.5MB, no mandatory compression needed
  if (file.size <= 1.5 * 1024 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(file);
          }

          ctx.drawImage(img, 0, 0, width, height);
          const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          canvas.toBlob(
            (blob) => {
              if (blob && blob.size < file.size) {
                const compressedFile = new File([blob], file.name, {
                  type: mimeType,
                  lastModified: Date.now()
                });
                console.log(`[Image Compression] Compressed from ${(file.size / (1024 * 1024)).toFixed(2)}MB to ${(compressedFile.size / (1024 * 1024)).toFixed(2)}MB`);
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            mimeType,
            quality
          );
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    } catch {
      resolve(file);
    }
  });
}

export const uploadFileToR2 = async (
  rawFile: File, 
  onProgressOrCategory?: ((progress: number) => void) | string,
  onProgressOrXhr?: ((progress: number) => void) | ((xhr: XMLHttpRequest) => void),
  onXhrCreated?: (xhr: XMLHttpRequest) => void
): Promise<string> => {
  // Normalize parameters in case caller passed (file, category, onProgress) or (file, onProgress, onXhr)
  const onProgress: ((progress: number) => void) | undefined = 
    typeof onProgressOrCategory === 'function' 
      ? onProgressOrCategory 
      : typeof onProgressOrXhr === 'function' && onProgressOrXhr.length <= 1 
        ? (onProgressOrXhr as (progress: number) => void) 
        : undefined;

  const resolvedOnXhrCreated: ((xhr: XMLHttpRequest) => void) | undefined =
    typeof onXhrCreated === 'function'
      ? onXhrCreated
      : typeof onProgressOrXhr === 'function' && typeof onProgressOrCategory === 'function'
        ? (onProgressOrXhr as (xhr: XMLHttpRequest) => void)
        : undefined;

  // Auto-compress high-resolution images to avoid 413 Payload Too Large
  const file = await compressImageIfNeeded(rawFile);

  try {
    // 1. First Priority: Check if Cloudflare R2 presigned URL is available
    let presignData: any = null;
    try {
      const presignRes = await fetch(resolveApiUrl('/api/upload-url'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || 'application/octet-stream'
        })
      });
      if (presignRes.ok) {
        presignData = await presignRes.json();
      }
    } catch (e) {
      console.warn('[uploadService] Cloudflare R2 presign check skipped:', e);
    }

    // 2. If R2 is explicitly configured with a real presigned URL, upload directly to R2
    if (presignData && !presignData.local && presignData.presignedUrl && presignData.publicUrl) {
      try {
        return await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          if (resolvedOnXhrCreated) resolvedOnXhrCreated(xhr);

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && typeof onProgress === 'function') {
              const progress = Math.round((event.loaded / event.total) * 100);
              onProgress(progress);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(presignData.publicUrl);
            } else {
              reject(new Error(`R2 direct upload failed with status ${xhr.status}`));
            }
          });

          xhr.addEventListener('error', () => reject(new Error('Network error during R2 upload')));
          xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

          xhr.open('PUT', presignData.presignedUrl, true);
          xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
          xhr.send(file);
        });
      } catch (r2Error) {
        console.warn('[uploadService] R2 direct upload failed, proceeding to server proxy upload...', r2Error);
      }
    }

    // 3. Core Permanent Storage: Server-side proxy upload (/api/upload)
    // Supports Cloudflare R2 on backend or local permanent /uploads storage
    // Provides real-time progress events and permanent CDN/accessible URL
    return await new Promise<string>((resolve, reject) => {
      const fallbackXhr = new XMLHttpRequest();
      if (resolvedOnXhrCreated) resolvedOnXhrCreated(fallbackXhr);

      fallbackXhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && typeof onProgress === 'function') {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      fallbackXhr.addEventListener('load', () => {
        if (fallbackXhr.status >= 200 && fallbackXhr.status < 300) {
          try {
            const response = JSON.parse(fallbackXhr.responseText);
            const resolvedUrl = response.publicUrl || response.url;
            if (resolvedUrl && typeof resolvedUrl === 'string' && resolvedUrl.trim().length > 0) {
              console.log('[uploadService] File upload succeeded. URL:', resolvedUrl);
              resolve(resolvedUrl);
            } else {
              reject(new Error('لم يرجع الخادم رابطاً صالحاً للملف المرفوع'));
            }
          } catch (e) {
            reject(new Error('استجابة غير صالحة من خادم الرفع'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(fallbackXhr.responseText);
            reject(new Error(errorResponse.error || `فشل الرفع: رمز الخطأ ${fallbackXhr.status}`));
          } catch (e) {
            if (fallbackXhr.status === 413) {
              reject(new Error('حجم الملف كبير جداً (رمز 413). تم تقليله، يرجى إعادة المحاولة.'));
            } else {
              reject(new Error(`فشل رفع الملف إلى السحابة: رمز ${fallbackXhr.status}`));
            }
          }
        }
      });

      fallbackXhr.addEventListener('error', () => reject(new Error('خطأ في الاتصال بالشبكة أثناء رفع الملف')));
      fallbackXhr.addEventListener('abort', () => reject(new Error('تم إلغاء رفع الملف')));

      const formData = new FormData();
      formData.append('file', file);
      fallbackXhr.open('POST', resolveApiUrl('/api/upload'), true);
      fallbackXhr.setRequestHeader('X-Frontend-Origin', window.location.origin);
      fallbackXhr.send(formData);
    });

  } catch (error: any) {
    const errMsg = error?.message || '';
    const isAbort = error?.name === 'AbortError' || 
                    errMsg.includes('aborted') || 
                    errMsg.includes('abort') || 
                    errMsg.includes('cancel') || 
                    errMsg.includes('without reason');
    
    if (!isAbort) {
      console.error('[uploadService] Error during upload:', error);
    }
    throw error;
  }
};

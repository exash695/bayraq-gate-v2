export const uploadFileToR2 = async (
  file: File, 
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

  try {
    // 1. First Priority: Check if Cloudflare R2 presigned URL is available
    let presignData: any = null;
    try {
      const presignRes = await fetch('/api/upload-url', {
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
            reject(new Error(`فشل رفع الملف إلى السحابة: رمز ${fallbackXhr.status}`));
          }
        }
      });

      fallbackXhr.addEventListener('error', () => reject(new Error('خطأ في الاتصال بالشبكة أثناء رفع الملف')));
      fallbackXhr.addEventListener('abort', () => reject(new Error('تم إلغاء رفع الملف')));

      const formData = new FormData();
      formData.append('file', file);
      fallbackXhr.open('POST', '/api/upload', true);
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
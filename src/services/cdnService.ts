/**
 * Cloudflare R2 CDN Media Service for Bairaq Portal
 * Resolves heavy media assets (videos, pose images, school logos, static files)
 * to Cloudflare R2 CDN endpoints with automatic fallback to local paths.
 */

import { cacheService } from './cacheService';

export interface CDNMediaConfig {
  r2CdnBaseUrl?: string;
  enableCdn: boolean;
}

class CDNService {
  private cdnBaseUrl: string = '';
  private isCdnEnabled: boolean = true;

  constructor() {
    this.initCdnConfig();
  }

  private initCdnConfig(): void {
    // Route via secure backend /cdn proxy to ensure S3 authentication, CORS headers, and local fallback
    this.cdnBaseUrl = '';
    this.isCdnEnabled = false;
  }

  /**
   * Set or update CDN base URL dynamically
   */
  public setCdnBaseUrl(url: string): void {
    this.cdnBaseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    this.isCdnEnabled = Boolean(this.cdnBaseUrl);
  }

  /**
   * Resolve local media path (e.g., /mascot/sliced_bairaq_...mp4, /school-logos/school1.png)
   * to Cloudflare R2 CDN link if configured, or return optimized local path.
   */
  public getMediaUrl(localPath: string): string {
    if (!localPath) return '';

    // If it's already an absolute external HTTP/HTTPS URL or blob/data URI, return directly
    if (
      localPath.startsWith('http://') ||
      localPath.startsWith('https://') ||
      localPath.startsWith('blob:') ||
      localPath.startsWith('data:')
    ) {
      return localPath;
    }

    // Ensure leading slash for key mapping
    let cleanPath = localPath.startsWith('/') ? localPath : `/${localPath}`;

    // Normalize legacy .png references for school cover images, logos, and mascot files to existing .jpg files
    if (cleanPath.match(/^\/(schools|school-logos|mascot)\/.*\.png$/i)) {
      cleanPath = cleanPath.replace(/\.png$/i, '.jpg');
    }

    if (this.isCdnEnabled && this.cdnBaseUrl) {
      return `${this.cdnBaseUrl}${cleanPath}`;
    }

    // Direct 100% local static serving from public directory with cache-busting version parameter
    return cleanPath.includes('?') ? `${cleanPath}&v=bayraq_v101` : `${cleanPath}?v=bayraq_v101`;
  }

  /**
   * Get R2 CDN URL for mascot videos and pose images
   */
  public getMascotAssetUrl(assetFilename: string): string {
    const relativePath = assetFilename.startsWith('/mascot/') ? assetFilename : `/mascot/${assetFilename}`;
    return this.getMediaUrl(relativePath);
  }

  /**
   * Get R2 CDN URL for school logos
   */
  public getSchoolLogoUrl(logoFilename: string): string {
    const relativePath = logoFilename.startsWith('/school-logos/') ? logoFilename : `/school-logos/${logoFilename}`;
    return this.getMediaUrl(relativePath);
  }

  /**
   * Get R2 CDN URL for school card covers
   */
  public getSchoolCardUrl(cardFilename: string): string {
    const relativePath = cardFilename.startsWith('/schools/') ? cardFilename : `/schools/${cardFilename}`;
    return this.getMediaUrl(relativePath);
  }

  /**
   * Request a Cloudflare R2 direct presigned upload URL from Cloudflare Worker gateway
   */
  public async getPresignedUploadUrl(fileName: string, contentType: string): Promise<{ presignedUrl?: string; key: string; publicUrl: string }> {
    const response = await fetch('/api/worker/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, contentType }),
    });

    if (!response.ok) {
      throw new Error('Failed to obtain R2 presigned upload URL');
    }

    return await response.json();
  }

  /**
   * Upload file directly to Cloudflare R2 bucket
   */
  public async uploadToR2(file: File): Promise<{ publicUrl: string; key: string }> {
    // 1. Try presigned direct upload
    try {
      const { presignedUrl, key, publicUrl } = await this.getPresignedUploadUrl(file.name, file.type);

      if (presignedUrl) {
        const uploadRes = await fetch(presignedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        if (uploadRes.ok) {
          return { publicUrl, key };
        }
      }
    } catch (e) {
      console.warn('[CDNService] Presigned upload failed, falling back to gateway multipart upload:', e);
    }

    // 2. Gateway multipart fallback
    const formData = new FormData();
    formData.append('file', file);

    const gatewayRes = await fetch('/api/worker/upload', {
      method: 'POST',
      body: formData,
    });

    if (!gatewayRes.ok) {
      throw new Error('Failed to upload media asset to Cloudflare R2');
    }

    const data = await gatewayRes.json();
    return {
      publicUrl: data.publicUrl || data.url || this.getMediaUrl(data.key),
      key: data.key || file.name,
    };
  }

  /**
   * Preload critical media assets into browser cache
   */
  public preloadAssets(urls: string[]): void {
    if (typeof window === 'undefined') return;

    urls.forEach((url) => {
      const fullUrl = this.getMediaUrl(url);
      const cacheKey = cacheService.generateHashKey('asset_preload', fullUrl);

      cacheService.getOrFetch(cacheKey, async () => {
        if (fullUrl.endsWith('.mp4') || fullUrl.endsWith('.webm')) {
          const res = await fetch(fullUrl, { method: 'GET' });
          return res.ok ? fullUrl : null;
        } else {
          return new Promise<string>((resolve) => {
            const img = new Image();
            img.onload = () => resolve(fullUrl);
            img.onerror = () => resolve(fullUrl);
            img.src = fullUrl;
          });
        }
      }, 24 * 3600 * 1000); // 24 hours TTL
    });
  }
}

export const cdnService = new CDNService();

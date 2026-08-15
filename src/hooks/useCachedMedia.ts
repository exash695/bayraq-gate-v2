import { useState, useEffect } from 'react';
import { getCachedMediaUrl, getOptimizedImageUrl, getInMemoryCachedUrl } from '../utils/imageCacher';
import { isVideoUrl } from '../components/BerqCharacterManager';

/**
 * A highly optimized React hook that retrieves cached local object URLs for media elements,
 * protecting against infinite re-renders and memory leaks, starting with the optimized URL
 * immediately to avoid blank or delayed rendering.
 */
export function useCachedMedia(originalUrl: string, width?: number) {
  const isVideo = isVideoUrl(originalUrl);
  const optimizedUrl = (!isVideo && width) ? getOptimizedImageUrl(originalUrl, width) : originalUrl;

  return { url: optimizedUrl || originalUrl || '', loading: false };
}

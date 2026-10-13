/**
 * Utility to asynchronously preload key Berq mascot media assets (videos & PNGs)
 * into browser memory/cache without blocking user interaction or bandwidth
 * on weak internet connections.
 */

import { preloadSchoolAssets, preloadVideoBlob } from './imageCacher';

const PRELOADED_ASSETS = new Set<string>();

export const CRITICAL_MASCOT_VIDEOS = [
  '/mascot/pose_sixty_seconds_challenger.mp4',
  '/mascot/sliced_bairaq_sheet5_greeting_hello.mp4',
  '/mascot/sliced_bairaq_sheet5_pose_academic_scholar.mp4',
  '/mascot/sliced_bairaq_sheet5_pose_broadcaster.mp4',
  '/mascot/sliced_bairaq_sheet5_pose_idea_genius.mp4',
];

export const CRITICAL_MASCOT_IMAGES = [
  '/mascot/welcome.png',
  '/mascot/welcome.jpg',
  '/mascot/study.jpg',
  '/mascot/connect.jpg',
  '/mascot/launch.jpg',
  '/mascot/transit.jpg',
  '/mascot/achieve.jpg',
];

const SECONDARY_VIDEOS: string[] = [];

/**
 * Checks if the user is on a slow or metered network connection
 */
function isLowBandwidthConnection(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as any;
  if (nav.connection) {
    if (nav.connection.saveData === true) return true;
    const type = nav.connection.effectiveType;
    if (type === 'slow-2g' || type === '2g' || type === '3g') return true;
  }
  return false;
}

/**
 * Preloads a single media URL silently into browser cache
 */
export function preloadSingleAsset(url: string) {
  if (!url || PRELOADED_ASSETS.has(url) || typeof window === 'undefined') return;
  
  PRELOADED_ASSETS.add(url);

  if (url.endsWith('.mp4') || url.endsWith('.webm')) {
    if (!isLowBandwidthConnection()) {
      preloadVideoBlob(url);
    }
  } else {
    const img = new Image();
    img.src = url;
  }
}

/**
 * Preloads assets smartly:
 * Lightweight images immediately.
 * Heavy MP4 videos only after the app has fully booted and only on adequate network speeds.
 */
export function preloadAllMascotAssets() {
  if (typeof window === 'undefined') return;

  // 1. Preload lightweight images in background
  CRITICAL_MASCOT_IMAGES.forEach((imgUrl) => {
    const img = new Image();
    img.src = imgUrl;
  });

  // 2. Heavy video and school assets are delayed until the app is fully loaded & user is active
  const runBackgroundPreload = () => {
    if (isLowBandwidthConnection()) {
      // On weak/metered connections, preserve all network bandwidth for app features
      return;
    }

    preloadSchoolAssets();

    // Sequentially preload videos with generous delay so we never choke bandwidth
    let delay = 1000;
    CRITICAL_MASCOT_VIDEOS.forEach((videoUrl) => {
      setTimeout(() => {
        if (!PRELOADED_ASSETS.has(videoUrl)) {
          PRELOADED_ASSETS.add(videoUrl);
          preloadVideoBlob(videoUrl);
        }
      }, delay);
      delay += 2500;
    });
  };

  // Give initial UI and data fetching 5 seconds of clear bandwidth before any background media
  if ('requestIdleCallback' in window) {
    setTimeout(() => {
      (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(runBackgroundPreload);
    }, 4000);
  } else {
    setTimeout(runBackgroundPreload, 5000);
  }
}

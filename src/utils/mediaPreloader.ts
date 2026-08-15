/**
 * Utility to asynchronously preload key Berq mascot media assets (videos & PNGs)
 * into browser memory/cache, ensuring instant 0ms rendering
 * when navigating between views and dashboards.
 */

import { preloadSchoolAssets, preloadVideoBlob } from './imageCacher';

const PRELOADED_ASSETS = new Set<string>();

export const CRITICAL_MASCOT_VIDEOS = [
  '/mascot/sliced_bairaq_sheet5_live.mp4',
  '/mascot/sliced_bairaq_sheet5_pose_academic_scholar.mp4',
  '/mascot/sliced_bairaq_sheet5_pose_ai_companion.mp4',
  '/mascot/sliced_bairaq_sheet5_pose_champion_laureate.mp4',
  '/mascot/sliced_bairaq_sheet5_pose_excellence_champion.mp4',
  '/mascot/sliced_bairaq_sheet5_pose_idea_genius.mp4',
  '/mascot/sliced_bairaq_sheet5_pose_live_announcer.mp4',
  '/mascot/sliced_bairaq_sheet5_pose_parent_dashboard.mp4',
  '/mascot/sliced_bairaq_sheet5_pose_radar_navigator.mp4',
  '/mascot/sliced_bairaq_sheet5_pose_school_uniform.mp4',
  '/mascot/sliced_bairaq_sheet5_pose_sixty_seconds_challenger.mp4',
  '/mascot/pose_waving_hand.mp4',
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
 * Preloads a single media URL silently into browser cache
 */
export function preloadSingleAsset(url: string) {
  if (!url || PRELOADED_ASSETS.has(url) || typeof window === 'undefined') return;
  
  PRELOADED_ASSETS.add(url);

  if (url.endsWith('.mp4') || url.endsWith('.webm')) {
    preloadVideoBlob(url);
  } else {
    const img = new Image();
    img.src = url;
  }
}

/**
 * Preloads all essential mascot assets and school cards/logos in the background after initial app mount
 */
export function preloadAllMascotAssets() {
  if (typeof window === 'undefined') return;

  // 1. Immediately preload critical images & critical videos (0ms priority)
  CRITICAL_MASCOT_IMAGES.forEach((imgUrl) => {
    const img = new Image();
    img.src = imgUrl;
  });

  CRITICAL_MASCOT_VIDEOS.forEach((videoUrl) => {
    preloadVideoBlob(videoUrl);
  });

  preloadSchoolAssets();

  // 2. Secondary assets preloaded in idle / background sequence
  const runSecondaryPreload = () => {
    let delay = 30;
    SECONDARY_VIDEOS.forEach((videoUrl) => {
      setTimeout(() => {
        preloadSingleAsset(videoUrl);
      }, delay);
      delay += 50;
    });
  };

  if ('requestIdleCallback' in window) {
    (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(runSecondaryPreload);
  } else {
    setTimeout(runSecondaryPreload, 200);
  }
}

import React, { useState } from 'react';
import { copyToClipboard } from '../utils/clipboard';
import { motion } from 'motion/react';
import { useCachedMedia } from '../hooks/useCachedMedia';
import { getInMemoryCachedUrl } from '../utils/imageCacher';
import { db } from '../lib/firebase';
import { doc, getDoc, onSnapshot } from '@/src/lib/firebase';
import { resolveApiUrl } from '../lib/serverConfig';

// Berq Debug Store for UI Inspection
export type BerqDebugLog = {
  timestamp: string;
  pose: string;
  imageUrl: string;
  srcPath: string;
  fetchStatus: string;
  imgSrc: string;
  currentSrc: string;
  complete: boolean;
  naturalWidth: number;
  hasError: boolean;
};

let globalBerqLogs: BerqDebugLog[] = [];
let logListeners: ((logs: BerqDebugLog[]) => void)[] = [];

export function addBerqDebugLog(log: BerqDebugLog) {
  globalBerqLogs = [log, ...globalBerqLogs.slice(0, 49)];
  logListeners.forEach(cb => cb(globalBerqLogs));
}

export function subscribeBerqLogs(cb: (logs: BerqDebugLog[]) => void) {
  logListeners.push(cb);
  cb(globalBerqLogs);

  return () => {
    logListeners = logListeners.filter(l => l !== cb);
  };
}

const LOCAL_STORAGE_KEY = 'bairaq_active_poses_v1';

const loadCachedLocalPoses = (): Record<string, string> => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) || {};
      }
    } catch (e) {}
  }
  return {};
};

let globalPoseOverrides: Record<string, string> = loadCachedLocalPoses();
let poseSubscribers: ((poses: Record<string, string>) => void)[] = [];

export const updateGlobalPoses = (newPoses: Record<string, string>, isAuthoritativeFullSync = false) => {
  if (!newPoses || typeof newPoses !== 'object') return;
  const updated = isAuthoritativeFullSync ? { ...newPoses } : { ...globalPoseOverrides, ...newPoses };
  // Expand aliases
  for (const [key, value] of Object.entries(updated)) {
    if (typeof value === 'string' && value) {
      const aliases = POSE_ALIASES_MAP[key] || [];
      for (const alias of aliases) {
        updated[alias] = value;
      }
    }
  }
  globalPoseOverrides = updated;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(globalPoseOverrides));
    } catch (e) {}
  }
  console.log(`[STATE UPDATE] globalPoseOverrides updated (${Object.keys(globalPoseOverrides).length} keys, authoritative: ${isAuthoritativeFullSync})`);
  poseSubscribers.forEach(cb => cb(globalPoseOverrides));
};

export const POSE_ALIASES_MAP: Record<string, string[]> = {
  pulse: ['pose_portal_pulse'],
  pose_portal_pulse: ['pulse'],
  finance: ['pose_finance_officer'],
  pose_finance_officer: ['finance'],
  codes: ['pose_key_master'],
  pose_key_master: ['codes'],
  students: ['pose_student_manager'],
  pose_student_manager: ['students'],
  broadcast: ['pose_broadcaster', 'pose_digital_broadcaster'],
  pose_broadcaster: ['broadcast', 'pose_digital_broadcaster'],
  pose_digital_broadcaster: ['broadcast', 'pose_broadcaster'],
  attendance: ['pose_discipline_shield'],
  pose_discipline_shield: ['attendance'],
  uniform: ['pose_school_uniform'],
  pose_school_uniform: ['uniform'],
  teachers: ['pose_academic_scholar', 'pose_staff_leader'],
  pose_academic_scholar: ['teachers'],
  pose_staff_leader: ['teachers', 'pose_academic_scholar'],
  transport: ['pose_transport_manager', 'pose_bus_captain', 'use_driving_bus'],
  pose_transport_manager: ['transport', 'pose_bus_captain', 'use_driving_bus'],
  pose_bus_captain: ['transport', 'pose_transport_manager', 'use_driving_bus'],
  use_driving_bus: ['transport', 'pose_transport_manager', 'pose_bus_captain'],
  ideas: ['pose_idea_genius'],
  pose_idea_genius: ['ideas'],
  support: ['pose_customer_support'],
  pose_customer_support: ['support'],
  resources: ['pose_content_control', 'pose_control_mechanic'],
  pose_content_control: ['resources', 'pose_control_mechanic'],
  pose_control_mechanic: ['resources', 'pose_content_control'],
  audit: ['pose_activity_logs'],
  pose_activity_logs: ['audit'],
  captain_bairaq_guardian: ['mayadeen_tab_bairaq', 'pose_dual_arena'],
  mayadeen_tab_bairaq: ['captain_bairaq_guardian', 'pose_dual_arena'],
  pose_dual_arena: ['captain_bairaq_guardian', 'mayadeen_tab_bairaq'],
  pose_questions_bank: ['pose_radar_navigator'],
  pose_radar_navigator: ['pose_questions_bank'],
  welcome_video: ['greeting_welcome', 'greet_hello', 'in_app_use_welcomes_students'],
  greeting_welcome: ['welcome_video', 'greet_hello', 'in_app_use_welcomes_students'],
  welcome_video_secondary: ['welcome_intro_secondary', 'intro_secondary_video'],
  welcome_intro_secondary: ['welcome_video_secondary'],
  app_logo: ['logo', 'bairaq_logo', 'application_logo', 'header_logo'],
  logo: ['app_logo', 'bairaq_logo'],
  welcome_card_welcome: ['welcome'],
  welcome: ['welcome_card_welcome'],
  welcome_card_connect: ['connect'],
  connect: ['welcome_card_connect'],
  welcome_card_study: ['study'],
  study: ['welcome_card_study'],
  welcome_card_transit: ['transit'],
  transit: ['welcome_card_transit'],
  welcome_card_achieve: ['achieve'],
  achieve: ['welcome_card_achieve'],
  welcome_card_launch: ['launch'],
  launch: ['welcome_card_launch'],
};

export const subscribeToPoseOverrides = (cb: (poses: Record<string, string>) => void) => {
  poseSubscribers.push(cb);
  cb(globalPoseOverrides);
  return () => {
    poseSubscribers = poseSubscribers.filter(l => l !== cb);
  };
};

export const useBerqPoses = () => {
  const [poses, setPoses] = React.useState<Record<string, string>>(globalPoseOverrides);
  React.useEffect(() => {
    return subscribeToPoseOverrides(setPoses);
  }, []);
  return poses;
};

export const getAppLogoUrl = (): string => {
  return globalPoseOverrides['app_logo'] || globalPoseOverrides['logo'] || globalPoseOverrides['bairaq_logo'] || '/logo.png';
};

export const useAppLogo = (): string => {
  const poses = useBerqPoses();
  return poses['app_logo'] || poses['logo'] || poses['bairaq_logo'] || '/logo.png';
};

export function initPoseOverrides() {
  console.log(`[RELOAD] Initializing Berq Character Manager and Pose Overrides...`);

  // Fast initial fetch from backend admin API (PostgreSQL Single Source of Truth)
  try {
    fetch(resolveApiUrl('/api/bairaq/poses'))
      .then(res => res.json())
      .then(data => {
        if (data.poses && typeof data.poses === 'object') {
          console.log(`[DATABASE READ] [AUTHORITATIVE SERVER SYNC] Loaded ${Object.keys(data.poses).length} poses from PostgreSQL`);
          updateGlobalPoses(data.poses, true);
        }
      })
      .catch((err) => {
        console.warn("[DATABASE READ] Server fetch notice (using cache):", err?.message || err);
      });
  } catch(e) {}
  // Listen to realtime socket for bairaq_poses
  import("../lib/realtimeManager").then(({ realtimeManager }) => {
    realtimeManager.subscribe("bairaq_poses", null, (event) => {
      if (event.type === 'UPDATE' || event.type === 'INSERT') {
        const payload = event.data as Record<string, string>;
        if (payload) {
          updateGlobalPoses(payload);
        }
      }
    });
  }).catch(() => {});
}
initPoseOverrides();

// Define the exact names of the poses based on manifest.json
export type BerqPose =
  | 'standing_arms_crossed'
  | 'main_mascot_full_body'
  | 'pose_crossed_arms'
  | 'pose_thumbs_up'
  | 'pose_holding_tablet'
  | 'pose_waving_hand'
  | 'captain_bairaq_guardian'
  | 'general_pose_encouragement'
  | 'general_pose_diligent_student'
  | 'general_pose_explanation_guidance'
  | 'general_pose_excellence_achievement'
  | 'general_pose_notifications'
  | 'general_pose_protection_followup'
  | 'logo_mascot'
  | 'Characters'
  | 'excellence_tab_bairaq'
  | 'Expressions'
  | 'GeneralPoses'
  | 'Greetings'
  | 'InAppUse'
  | 'character_student'
  | 'character_teacher'
  | 'character_driver'
  | 'character_guardian'
  | 'character_administrator'
  | 'face_neutral'
  | 'face_wink_left'
  | 'face_happy'
  | 'face_surprised'
  | 'face_laughing'
  | 'face_wink_right'
  | 'face_thinking'
  | 'face_excited'
  | 'face_winking'
  | 'face_encouraging'
  | 'face_sad'
  | 'face_anxious'
  | 'face_angry'
  | 'face_tired'
  | 'face_focused'
  | 'face_proud'
  | 'face_shocked'
  | 'face_reassured'
  | 'face_grateful'
  | 'face_welcoming'
  | 'face_celebrating'
  | 'face_sleeping'
  | 'face_very_happy'
  | 'face_astonished'
  | 'face_mildly_angry'
  | 'face_playful'
  | 'app_notification_delivery_reached'
  | 'app_notification_award_received'
  | 'app_notification_study_time'
  | 'app_menu_guide'
  | 'in_app_use_drives_buses'
  | 'in_app_use_welcomes_students'
  | 'in_app_use_accompanies_student'
  | 'in_app_use_helps_teachers'
  | 'in_app_use_reassures_parents'
  | 'in_app_use_safety_first'
  | 'in_app_use_awards_medals'
  | 'use_driving_bus'
  | 'use_studying'
  | 'use_smart_education'
  | 'use_safety_protection'
  | 'use_notifications_alerts'
  | 'use_achievement_excellence'
  | 'use_tracking_trips'
  | 'use_parental_supervision'
  | 'main_standing_pose'
  | 'greeting_welcome'
  | 'greet_hello'
  | 'greet_well_done'
  | 'greet_congratulations'
  | 'greet_lets_go'
  | 'pose_finance_officer'
  | 'pose_key_master'
  | 'pose_student_manager'
  | 'pose_broadcaster'
  | 'pose_discipline_shield'
  | 'pose_school_uniform'
  | 'pose_staff_leader'
  | 'pose_bus_captain'
  | 'pose_idea_genius'
  | 'pose_customer_support'
  | 'pose_portal_pulse'
  | 'pose_content_control'
  | 'pose_activity_logs'
  | 'pose_transport_manager'
  | 'pose_parent_dashboard'
  | 'pose_gateway_guardian'
  | 'pose_academic_scholar'
  | 'pose_sixty_seconds_challenger'
  | 'pose_radar_navigator'
  | 'pose_champion_laureate'
  | 'pose_control_mechanic'
  | 'pose_idea_creator'
  | 'pose_ai_companion'
  | 'pose_sovereign_leader'
  | 'pose_digital_broadcaster'
  | 'pose_homework_master'
  | 'pose_live_announcer'
  | 'pose_schedule_planner'
  | 'pose_questions_bank'
  | 'pose_excellence_champion'
  | 'pose_live_stream'
  | 'pose_live'
  | 'pose_dual_arena'
  | 'mayadeen_tab_bairaq';

interface BerqCharacterProps {
  pose: BerqPose;
  className?: string;
  glowColor?: 'gold' | 'cyan' | 'purple' | 'emerald' | 'red' | 'none';
  animate?: boolean;
  onClick?: () => void;
  altText?: string;
  height?: number | string;
  fitMode?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

// Map short pose name to actual public URL
export const getBerqImageUrl = (pose: BerqPose): string => {
  // Only map to verified physically present video files in public/mascot/
  const videoMapping: Partial<Record<BerqPose, string>> = {
    'pose_academic_scholar': '/mascot/sliced_bairaq_sheet5_pose_academic_scholar.mp4',
    'pose_broadcaster': '/mascot/sliced_bairaq_sheet5_pose_broadcaster.mp4',
    'pose_digital_broadcaster': '/mascot/sliced_bairaq_sheet5_pose_broadcaster.mp4',
    'pose_idea_genius': '/mascot/sliced_bairaq_sheet5_pose_idea_genius.mp4',
    'pose_idea_creator': '/mascot/sliced_bairaq_sheet5_pose_idea_genius.mp4',
    'pose_sixty_seconds_challenger': '/mascot/pose_sixty_seconds_challenger.mp4',
    'general_pose_diligent_student': '/mascot/sliced_bairaq_sheet5_pose_academic_scholar.mp4',
    'general_pose_explanation_guidance': '/mascot/sliced_bairaq_sheet5_pose_academic_scholar.mp4',
    'use_smart_education': '/mascot/sliced_bairaq_sheet5_pose_academic_scholar.mp4',
    'use_studying': '/mascot/sliced_bairaq_sheet5_pose_academic_scholar.mp4',
  };

  const imageMapping: Record<BerqPose, string> = {
    'pose_dual_arena': '/mascot/connect.jpg',
    'app_menu_guide': '/mascot/welcome.jpg',
    'app_notification_award_received': '/mascot/achieve.jpg',
    'app_notification_delivery_reached': '/mascot/connect.jpg',
    'app_notification_study_time': '/mascot/study.jpg',
    'captain_bairaq_guardian': '/mascot/connect.jpg',
    'character_administrator': '/mascot/welcome.jpg',
    'character_driver': '/mascot/transit.jpg',
    'character_guardian': '/mascot/connect.jpg',
    'character_student': '/mascot/study.jpg',
    'character_teacher': '/mascot/study.jpg',
    'Characters': '/mascot/welcome.jpg',
    'excellence_tab_bairaq': '/mascot/achieve.jpg',
    'Expressions': '/mascot/welcome.jpg',
    'face_angry': '/mascot/welcome.jpg',
    'face_anxious': '/mascot/welcome.jpg',
    'face_astonished': '/mascot/welcome.jpg',
    'face_celebrating': '/mascot/achieve.jpg',
    'face_encouraging': '/mascot/welcome.jpg',
    'face_excited': '/mascot/welcome.jpg',
    'face_focused': '/mascot/study.jpg',
    'face_grateful': '/mascot/welcome.jpg',
    'face_happy': '/mascot/welcome.jpg',
    'face_laughing': '/mascot/welcome.jpg',
    'face_mildly_angry': '/mascot/welcome.jpg',
    'face_neutral': '/mascot/welcome.jpg',
    'face_playful': '/mascot/welcome.jpg',
    'face_proud': '/mascot/achieve.jpg',
    'face_reassured': '/mascot/connect.jpg',
    'face_sad': '/mascot/welcome.jpg',
    'face_shocked': '/mascot/welcome.jpg',
    'face_sleeping': '/mascot/welcome.jpg',
    'face_surprised': '/mascot/welcome.jpg',
    'face_thinking': '/mascot/study.jpg',
    'face_tired': '/mascot/welcome.jpg',
    'face_very_happy': '/mascot/welcome.jpg',
    'face_welcoming': '/mascot/welcome.jpg',
    'face_wink_left': '/mascot/welcome.jpg',
    'face_wink_right': '/mascot/welcome.jpg',
    'face_winking': '/mascot/welcome.jpg',
    'general_pose_diligent_student': '/mascot/study.jpg',
    'general_pose_encouragement': '/mascot/welcome.jpg',
    'general_pose_excellence_achievement': '/mascot/achieve.jpg',
    'general_pose_explanation_guidance': '/mascot/study.jpg',
    'general_pose_notifications': '/mascot/welcome.jpg',
    'general_pose_protection_followup': '/mascot/connect.jpg',
    'GeneralPoses': '/mascot/welcome.jpg',
    'greet_congratulations': '/mascot/achieve.jpg',
    'greet_hello': '/mascot/welcome.jpg',
    'greet_lets_go': '/mascot/launch.jpg',
    'greet_well_done': '/mascot/achieve.jpg',
    'greeting_welcome': '/mascot/welcome.jpg',
    'Greetings': '/mascot/welcome.jpg',
    'in_app_use_accompanies_student': '/mascot/connect.jpg',
    'in_app_use_awards_medals': '/mascot/achieve.jpg',
    'in_app_use_drives_buses': '/mascot/transit.jpg',
    'in_app_use_helps_teachers': '/mascot/study.jpg',
    'in_app_use_reassures_parents': '/mascot/connect.jpg',
    'in_app_use_safety_first': '/mascot/connect.jpg',
    'in_app_use_welcomes_students': '/mascot/welcome.jpg',
    'InAppUse': '/mascot/welcome.jpg',
    'logo_mascot': '/mascot/welcome.jpg',
    'main_mascot_full_body': '/mascot/welcome.jpg',
    'main_standing_pose': '/mascot/welcome.jpg',
    'mayadeen_tab_bairaq': '/mascot/connect.jpg',
    'pose_academic_scholar': '/mascot/study.jpg',
    'pose_activity_logs': '/mascot/welcome.jpg',
    'pose_ai_companion': '/mascot/launch.jpg',
    'pose_broadcaster': '/mascot/welcome.jpg',
    'pose_bus_captain': '/mascot/transit.jpg',
    'pose_champion_laureate': '/mascot/achieve.jpg',
    'pose_content_control': '/mascot/welcome.jpg',
    'pose_control_mechanic': '/mascot/welcome.jpg',
    'pose_crossed_arms': '/mascot/welcome.jpg',
    'pose_customer_support': '/mascot/connect.jpg',
    'pose_digital_broadcaster': '/mascot/welcome.jpg',
    'pose_discipline_shield': '/mascot/connect.jpg',
    'pose_excellence_champion': '/mascot/achieve.jpg',
    'pose_finance_officer': '/mascot/study.jpg',
    'pose_gateway_guardian': '/mascot/connect.jpg',
    'pose_holding_tablet': '/mascot/study.jpg',
    'pose_homework_master': '/mascot/study.jpg',
    'pose_idea_creator': '/mascot/launch.jpg',
    'pose_idea_genius': '/mascot/launch.jpg',
    'pose_key_master': '/mascot/study.jpg',
    'pose_live_announcer': '/mascot/welcome.jpg',
    'pose_parent_dashboard': '/mascot/connect.jpg',
    'pose_portal_pulse': '/mascot/launch.jpg',
    'pose_questions_bank': '/mascot/study.jpg',
    'pose_radar_navigator': '/mascot/launch.jpg',
    'pose_schedule_planner': '/mascot/study.jpg',
    'pose_school_uniform': '/mascot/welcome.jpg',
    'pose_sixty_seconds_challenger': '/mascot/launch.jpg',
    'pose_sovereign_leader': '/mascot/achieve.jpg',
    'pose_staff_leader': '/mascot/achieve.jpg',
    'pose_student_manager': '/mascot/study.jpg',
    'pose_thumbs_up': '/mascot/welcome.jpg',
    'pose_transport_manager': '/mascot/transit.jpg',
    'pose_waving_hand': '/mascot/welcome.jpg',
    'standing_arms_crossed': '/mascot/welcome.jpg',
    'pose_live_stream': '/mascot/welcome.jpg',
    'pose_live': '/mascot/welcome.jpg',
    'use_achievement_excellence': '/mascot/achieve.jpg',
    'use_driving_bus': '/mascot/transit.jpg',
    'use_notifications_alerts': '/mascot/welcome.jpg',
    'use_parental_supervision': '/mascot/connect.jpg',
    'use_safety_protection': '/mascot/connect.jpg',
    'use_smart_education': '/mascot/study.jpg',
    'use_studying': '/mascot/study.jpg',
    'use_tracking_trips': '/mascot/transit.jpg',
  };

  if (globalPoseOverrides[pose]) {
    return globalPoseOverrides[pose];
  }
  const aliases = POSE_ALIASES_MAP[pose] || [];
  for (const alias of aliases) {
    if (globalPoseOverrides[alias]) {
      return globalPoseOverrides[alias];
    }
  }

  const videoUrl = videoMapping[pose];
  if (videoUrl) {
    return videoUrl;
  }

  return imageMapping[pose] || '/mascot/welcome.jpg';
};

export const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  if (url.startsWith('data:video/')) return true;
  const clean = url.split('?')[0].split('#')[0].toLowerCase();
  return ['.mp4', '.webm', '.ogg', '.mov', '.m4v', '.avi', '.mkv', '.3gp'].some(ext => clean.endsWith(ext));
};

export const getBerqFallbackImage = (pose?: BerqPose): string => {
  if (!pose) return '/mascot/welcome.jpg';
  const imageMapping: Partial<Record<BerqPose, string>> = {
    'captain_bairaq_guardian': '/mascot/connect.jpg',
    'mayadeen_tab_bairaq': '/mascot/connect.jpg',
    'pose_dual_arena': '/mascot/connect.jpg',
    'pose_academic_scholar': '/mascot/study.jpg',
    'pose_excellence_champion': '/mascot/achieve.jpg',
    'pose_ai_companion': '/mascot/launch.jpg',
    'pose_transport_manager': '/mascot/transit.jpg',
    'pose_idea_genius': '/mascot/launch.jpg',
    'pose_finance_officer': '/mascot/study.jpg',
    'pose_parent_dashboard': '/mascot/connect.jpg',
  };
  return imageMapping[pose] || '/mascot/welcome.jpg';
};

export const getBerqFallbackPngUrl = (_pose?: BerqPose): string => {
  return '/mascot/welcome.jpg';
};

export const getBerqFallbackJpgUrl = (_pose?: BerqPose): string => {
  return '/mascot/welcome.jpg';
};

export const BerqCharacter: React.FC<BerqCharacterProps> = ({
  pose,
  className = '',
  glowColor = 'gold',
  animate = true,
  onClick,
  altText = 'Berq Mascot',
  height = '100%',
  fitMode,
}) => {
  const defaultImageUrl = getBerqImageUrl(pose);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);

  React.useEffect(() => {
    return subscribeToPoseOverrides((poses) => {
      let resolved = poses[pose] || null;
      if (!resolved) {
        const aliases = POSE_ALIASES_MAP[pose] || [];
        for (const alias of aliases) {
          if (poses[alias]) {
            resolved = poses[alias];
            break;
          }
        }
      }
      setCustomImageUrl(resolved);
    });
  }, [pose]);

  const imageUrl = customImageUrl || defaultImageUrl;
  const { url: cachedUrl } = useCachedMedia(imageUrl);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const isVideoFile = isVideoUrl(imageUrl);

  React.useEffect(() => {
    setVideoError(false);
    setIsVideoPlaying(false);
  }, [pose, imageUrl]);

  const effectiveVideoSrc = isVideoFile ? (getInMemoryCachedUrl(imageUrl) || cachedUrl || imageUrl) : '';
  const fallbackImageSrc = getBerqFallbackImage(pose);
  const finalImageSrc = videoError ? fallbackImageSrc : imageUrl;

  // Robust Autoplay Effect
  React.useEffect(() => {
    if (isVideoFile && !videoError && videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      videoRef.current.play().then(() => {
        setIsVideoPlaying(true);
      }).catch(err => {
        console.log('[BERQ VIDEO] Autoplay status:', err?.message || err);
        if (videoRef.current?.error || String(err).includes('NotSupportedError') || String(err).includes('source') || String(err).includes('format')) {
          setVideoError(true);
        }
      });
    }
  }, [effectiveVideoSrc, isVideoFile, videoError]);

  const glowShadows = {
    gold: 'drop-shadow-[0_0_25px_rgba(212,175,55,0.45)] drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]',
    cyan: 'drop-shadow-[0_0_25px_rgba(0,229,255,0.4)] drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]',
    purple: 'drop-shadow-[0_0_25px_rgba(139,92,246,0.45)] drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]',
    emerald: 'drop-shadow-[0_0_25px_rgba(16,185,129,0.4)] drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]',
    red: 'drop-shadow-[0_0_25px_rgba(239,68,68,0.45)] drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]',
    none: 'drop-shadow-[0_10px_15px_rgba(0,0,0,0.6)]',
  };

  const isCover = className.includes('object-cover');
  const fitClass = fitMode 
    ? `w-full h-full object-${fitMode}`
    : isCover 
    ? 'w-full h-full object-cover' 
    : className.includes('object-contain') || className.includes('w-full') || className.includes('h-full')
    ? 'w-full h-full object-contain' 
    : 'max-w-full object-contain';

  return (
    <motion.div
      initial={animate ? { opacity: 0, scale: 0.9, y: 15 } : false}
      animate={animate ? { opacity: 1, scale: 1, y: 0 } : false}
      transition={{ type: 'spring', stiffness: 180, damping: 20 }}
      className={`relative flex items-center justify-center ${className}`}
      onClick={onClick}
    >
      <motion.div
        className="w-full h-full flex items-center justify-center relative z-10"
        animate={animate ? { y: [0, -6, 0] } : false}
        transition={animate ? { duration: 4, repeat: Infinity, ease: "easeInOut" } : undefined}
      >
        {glowColor !== 'none' && (
          <div className="absolute inset-0 rounded-full blur-[40px] pointer-events-none -z-10 animate-pulse" 
            style={{
              background: glowColor === 'gold' ? 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)' :
                          glowColor === 'cyan' ? 'radial-gradient(circle, rgba(0,229,255,0.15) 0%, transparent 70%)' :
                          glowColor === 'purple' ? 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)' :
                          glowColor === 'emerald' ? 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)' :
                          'radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)'
            }}
          />
        )}

        {/* Guaranteed Strict Rendering: Video file goes to <video> ONLY, Image file goes to <img> ONLY */}
        {isVideoFile && !videoError ? (
          <video
            ref={(el) => {
              videoRef.current = el;
              if (el) {
                el.muted = true;
                el.defaultMuted = true;
                el.playsInline = true;
                el.loop = true;
                el.play().catch(err => {
                  console.log('[BERQ VIDEO] Ref play notice:', err?.message || err);
                  if (el.error || String(err).includes('NotSupportedError') || String(err).includes('source') || String(err).includes('format')) {
                    setVideoError(true);
                  }
                });
              }
            }}
            key={effectiveVideoSrc}
            src={effectiveVideoSrc}
            autoPlay
            loop
            muted
            playsInline
            controls={false}
            disablePictureInPicture
            preload="auto"
            onEnded={(e) => {
              const v = e.currentTarget;
              v.currentTime = 0;
              v.play().catch(() => {});
            }}
            onPause={(e) => {
              const v = e.currentTarget;
              if (v && !v.ended) {
                v.play().catch(() => {});
              }
            }}
            onLoadedData={(e) => {
              console.log(`[BERQ DEBUG] Element: video | Pose: ${pose} | URL: ${effectiveVideoSrc} | Event: onLoadedData`);
              setIsVideoPlaying(true);
              addBerqDebugLog({
                timestamp: new Date().toLocaleTimeString(),
                pose: String(pose),
                imageUrl: String(effectiveVideoSrc),
                srcPath: String(effectiveVideoSrc),
                fetchStatus: 'Video onLoadedData success',
                imgSrc: 'video',
                currentSrc: e.currentTarget.currentSrc,
                complete: true,
                naturalWidth: e.currentTarget.videoWidth || 0,
                hasError: false
              });
            }}
            onCanPlay={(e) => {
              console.log(`[BERQ DEBUG] Element: video | Pose: ${pose} | URL: ${effectiveVideoSrc} | Event: onCanPlay`);
              e.currentTarget.play().catch(() => {});
            }}
            onError={(e) => {
              const err = e.currentTarget.error;
              console.warn(`[BERQ DEBUG] Element: video | Pose: ${pose} | URL: ${effectiveVideoSrc} | Event: onError | Code: ${err?.code} | Message: ${err?.message}`);
              setVideoError(true);
              addBerqDebugLog({
                timestamp: new Date().toLocaleTimeString(),
                pose: String(pose),
                imageUrl: String(effectiveVideoSrc),
                srcPath: String(effectiveVideoSrc),
                fetchStatus: `Video Error Code ${err?.code}: ${err?.message}`,
                imgSrc: 'video',
                currentSrc: '',
                complete: false,
                naturalWidth: 0,
                hasError: true
              });
            }}
            className={`cursor-pointer select-none rounded-2xl ${fitClass} ${glowShadows[glowColor]} relative z-10`}
            style={{ height: height }}
          />
        ) : (
          <img
            src={finalImageSrc}
            alt={altText}
            loading="eager"
            onLoad={(e) => {
              console.log(`[BERQ DEBUG] Element: img | Pose: ${pose} | URL: ${finalImageSrc} | Event: onLoad`);
              addBerqDebugLog({
                timestamp: new Date().toLocaleTimeString(),
                pose: String(pose),
                imageUrl: String(finalImageSrc),
                srcPath: String(finalImageSrc),
                fetchStatus: 'Image onLoad success',
                imgSrc: finalImageSrc,
                currentSrc: e.currentTarget.currentSrc,
                complete: e.currentTarget.complete,
                naturalWidth: e.currentTarget.naturalWidth,
                hasError: false
              });
            }}
            onError={(e) => {
              console.warn(`[BERQ DEBUG] Element: img | Pose: ${pose} | URL: ${finalImageSrc} | Event: onError`);
              const imgTarget = e.currentTarget;
              if (imgTarget.src && !imgTarget.src.endsWith('/mascot/connect.jpg') && !imgTarget.src.endsWith('/mascot/welcome.png')) {
                imgTarget.src = '/mascot/connect.jpg';
              } else {
                imgTarget.onerror = null;
                imgTarget.style.display = 'none';
              }
              addBerqDebugLog({
                timestamp: new Date().toLocaleTimeString(),
                pose: String(pose),
                imageUrl: String(finalImageSrc),
                srcPath: String(finalImageSrc),
                fetchStatus: 'Image onError handled',
                imgSrc: finalImageSrc,
                currentSrc: e.currentTarget.currentSrc,
                complete: false,
                naturalWidth: 0,
                hasError: true
              });
            }}
            className={`cursor-pointer select-none ${fitClass} ${glowShadows[glowColor]} relative z-10`}
            style={{ height: height }}
          />
        )}
      </motion.div>
    </motion.div>
  );
};

export const BerqDebugConsoleModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [logs, setLogs] = useState<BerqDebugLog[]>([]);

  React.useEffect(() => {
    return subscribeBerqLogs(setLogs);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-text" dir="rtl">
      <div className="bg-[#121620] border border-white/15 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-white font-black text-lg">📡 رادار تتبع شخصية بيرق (Berq Trace Console)</h3>
          </div>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 font-bold text-sm transition-colors"
          >
            إغلاق النافذة ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-white/50">جاري جمع بيانات التتبع... انقر أو تفاعل مع الشاشة لتشغيل الشخصيات.</div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className={`p-4 rounded-xl border ${log.hasError ? 'bg-red-950/20 border-red-500/30 text-red-200' : 'bg-white/5 border-white/10 text-emerald-200'} space-y-1.5`}>
                <div className="flex justify-between items-center text-white/70 border-b border-white/10 pb-1 mb-2">
                  <span className="font-bold text-amber-400">#{(logs.length - idx)} [{log.timestamp}]</span>
                  <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] text-white">الوضعيات: {log.pose}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div><span className="text-white/50">اسم الملف النهائي (URL):</span> <span className="text-white break-all">{log.imageUrl}</span></div>
                  <div><span className="text-white/50">المسار الفعلي للـ src:</span> <span className="text-white break-all">{log.srcPath}</span></div>
                  <div><span className="text-white/50">نتيجة التحميل:</span> <span className={log.hasError ? 'text-red-400 font-bold' : 'text-emerald-400'}>{log.fetchStatus}</span></div>
                  <div><span className="text-white/50">نوع العنصر / المصدر:</span> <span className="text-white break-all">{log.imgSrc}</span></div>
                  <div><span className="text-white/50">currentSrc:</span> <span className="text-white break-all">{log.currentSrc || 'غير متوفر'}</span></div>
                  <div><span className="text-white/50">أبعاد الوسائط (Natural/Video Width):</span> <span className="text-emerald-400 font-bold">{log.naturalWidth}px (فحص متوقف مؤقتًا)</span></div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white/5 border-t border-white/10 flex justify-between items-center text-white/60 text-xs gap-2 flex-wrap">
          <span>إجمالي السجلات: {logs.length}</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={async () => {
                const text = logs.map((l) => `[${l.timestamp}] Pose: ${l.pose} | URL: ${l.imageUrl} | Src: ${l.srcPath} | Status: ${l.fetchStatus} | Width: ${l.naturalWidth}`).join('\n');
                await copyToClipboard(text);
                alert('تم نسخ جميع السجلات بنجاح! يمكنك الآن لصقها هنا في المحادثة.');
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-bold shadow transition-all flex items-center gap-1"
            >
              📋 نسخ محتوى السجلات (Copy Logs)
            </button>
            <button 
              onClick={() => { globalBerqLogs = []; setLogs([]); }}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
            >
              مسح السجلات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

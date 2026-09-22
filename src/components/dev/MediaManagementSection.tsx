import React, { useState, useEffect } from "react";
import {
  ImageIcon, ChevronDown, FileUp, Sparkles, Megaphone,
  Trash2, X, RefreshCw
} from "lucide-react";
import { isVideoUrl, POSE_ALIASES_MAP, updateGlobalPoses, subscribeToPoseOverrides } from "../BerqCharacterManager";
import { uploadFileToR2 } from "../../services/uploadService";
import { BairaqAssetHistoryModal } from "../BairaqAssetHistoryModal";
import { GlobalAnnouncementsBanner } from "../GlobalAnnouncementsBanner";
import { GlobalAnnouncementsPopup } from "../GlobalAnnouncementsPopup";
import { realtimeManager } from "../../lib/realtimeManager";

export const DASHBOARDS_POSES = {
  admin: [
    { id: 'captain_bairaq_guardian', title: 'هيدر الميدان التفاعلي المعتمد (ميادين الفرسان)', defaultSrc: '/mascot/connect.jpg' },
    { id: 'pulse', title: 'هيدر نبض البوابة', defaultSrc: '/mascot/launch.jpg' },
    { id: 'finance', title: 'هيدر الموقف المالي', defaultSrc: '/mascot/study.jpg' },
    { id: 'codes', title: 'هيدر حارس الأكواد والتراخيص', defaultSrc: '/mascot/study.jpg' },
    { id: 'students', title: 'هيدر مدير شؤون الطلاب', defaultSrc: '/mascot/study.jpg' },
    { id: 'broadcast', title: 'هيدر مذيع البوابة الذكي', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_broadcaster.mp4' },
    { id: 'attendance', title: 'هيدر درع الانضباط المدرسي', defaultSrc: '/mascot/connect.jpg' },
    { id: 'uniform', title: 'هيدر مراقب الزي المدرسي', defaultSrc: '/mascot/welcome.jpg' },
    { id: 'teachers', title: 'هيدر قائد الكادر التعليمي', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_academic_scholar.mp4' },
    { id: 'transport', title: 'هيدر كابتن النقل والرحلات', defaultSrc: '/mascot/transit.jpg' },
    { id: 'ideas', title: 'هيدر عبقري بنك الأفكار', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_idea_genius.mp4' },
    { id: 'support', title: 'هيدر مستشار الدعم والشكاوى', defaultSrc: '/mascot/connect.jpg' },
    { id: 'resources', title: 'هيدر حامي بوابة الأمان', defaultSrc: '/mascot/welcome.jpg' },
    { id: 'audit', title: 'هيدر مفتش سجل النشاطات', defaultSrc: '/mascot/welcome.jpg' },
    { id: 'sovereignty', title: 'هيدر منصة السيادة', defaultSrc: '/mascot/welcome.jpg' }
  ],
  student: [
    { id: 'captain_bairaq_guardian', title: 'هيدر الميدان التفاعلي المعتمد (ميادين الفرسان)', defaultSrc: '/mascot/connect.jpg' },
    { id: 'pose_waving_hand', title: 'هيدر الساحة التفاعلية', defaultSrc: '/mascot/welcome.jpg' },
    { id: 'pose_academic_scholar', title: 'هيدر المكتبة والمقررات', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_academic_scholar.mp4' },
    { id: 'pose_live_announcer', title: 'هيدر المرئيات', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_broadcaster.mp4' },
    { id: 'pose_questions_bank', title: 'هيدر بنك الأسئلة', defaultSrc: '/mascot/study.jpg' },
    { id: 'pose_homework_master', title: 'هيدر الواجبات', defaultSrc: '/mascot/study.jpg' },
    { id: 'pose_champion_laureate', title: 'هيدر المسابقات', defaultSrc: '/mascot/achieve.jpg' },
    { id: 'pose_sixty_seconds_challenger', title: 'هيدر تحدي الـ 60 ثانية', defaultSrc: '/mascot/pose_sixty_seconds_challenger.mp4' },
    { id: 'pose_dual_arena', title: 'هيدر المواجهات الثنائية', defaultSrc: '/mascot/connect.jpg' },
    { id: 'pose_schedule_planner', title: 'هيدر جدولي', defaultSrc: '/mascot/study.jpg' },
    { id: 'pose_excellence_champion', title: 'هيدر التميز', defaultSrc: '/mascot/achieve.jpg' },
    { id: 'sovereignty', title: 'هيدر منصة السيادة', defaultSrc: '/mascot/welcome.jpg' }
  ],
  teacher: [
    { id: 'captain_bairaq_guardian', title: 'هيدر الميدان التفاعلي المعتمد (ميادين الفرسان)', defaultSrc: '/mascot/connect.jpg' },
    { id: 'pose_waving_hand', title: 'هيدر الساحة التفاعلية', defaultSrc: '/mascot/welcome.jpg' },
    { id: 'pose_excellence_champion', title: 'هيدر سجل التميز', defaultSrc: '/mascot/achieve.jpg' },
    { id: 'pose_ai_companion', title: 'هيدر مساعد الذكاء الاصطناعي', defaultSrc: '/mascot/launch.jpg' },
    { id: 'pose_questions_bank', title: 'هيدر بنك الأسئلة', defaultSrc: '/mascot/study.jpg' },
    { id: 'pose_live_announcer', title: 'هيدر البث المباشر', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_broadcaster.mp4' },
    { id: 'pose_content_control', title: 'هيدر المحتوى', defaultSrc: '/mascot/welcome.jpg' },
    { id: 'pose_homework_master', title: 'هيدر الواجبات', defaultSrc: '/mascot/study.jpg' },
    { id: 'pose_champion_laureate', title: 'هيدر المسابقات', defaultSrc: '/mascot/achieve.jpg' },
    { id: 'pose_schedule_planner', title: 'هيدر جدولي', defaultSrc: '/mascot/study.jpg' },
    { id: 'sovereignty', title: 'هيدر منصة السيادة', defaultSrc: '/mascot/welcome.jpg' }
  ],
  parent: [
    { id: 'pose_waving_hand', title: 'هيدر ساحة التواصل', defaultSrc: '/mascot/welcome.jpg' },
    { id: 'pose_parent_dashboard', title: 'هيدر المتابعة الأبوية', defaultSrc: '/mascot/connect.jpg' },
    { id: 'pose_student_manager', title: 'هيدر سجل الدرجات', defaultSrc: '/mascot/study.jpg' },
    { id: 'pose_schedule_planner', title: 'هيدر الحضور والجدول', defaultSrc: '/mascot/study.jpg' },
    { id: 'pose_finance_officer', title: 'هيدر الرسوم المالية', defaultSrc: '/mascot/study.jpg' },
    { id: 'pose_academic_scholar', title: 'هيدر المكتبة والمعلمون', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_academic_scholar.mp4' },
    { id: 'pose_discipline_shield', title: 'هيدر السلوك والانضباط', defaultSrc: '/mascot/connect.jpg' },
    { id: 'pose_activity_logs', title: 'هيدر التقارير والإشعارات', defaultSrc: '/mascot/welcome.jpg' },
    { id: 'pose_champion_laureate', title: 'هيدر الأنشطة والمشاركات', defaultSrc: '/mascot/achieve.jpg' },
    { id: 'pose_transport_manager', title: 'هيدر النقل المدرسي', defaultSrc: '/mascot/transit.jpg' },
    { id: 'pose_ai_companion', title: 'هيدر الرؤية المستقبلية', defaultSrc: '/mascot/launch.jpg' },
    { id: 'pose_customer_support', title: 'هيدر الدعم والشكاوى', defaultSrc: '/mascot/connect.jpg' },
    { id: 'pose_idea_genius', title: 'هيدر بنك الأفكار', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_idea_genius.mp4' },
    { id: 'pose_school_uniform', title: 'هيدر الزي المدرسي', defaultSrc: '/mascot/welcome.jpg' }
  ],
  driver: [
    { id: 'pose_transport_manager', title: 'هيدر كابتن النقل', defaultSrc: '/mascot/transit.jpg' },
    { id: 'pose_bus_captain', title: 'هيدر الرحلات المدرسية', defaultSrc: '/mascot/transit.jpg' },
    { id: 'use_driving_bus', title: 'هيدر مسار الحافلة', defaultSrc: '/mascot/transit.jpg' }
  ],
  welcome: [
    { id: 'welcome_video', title: 'الفيديو الترحيبي الرئيسي (المقدمة 1)', defaultSrc: '/mascot/sliced_bairaq_sheet5_pose_broadcaster.mp4' },
    { id: 'welcome_video_secondary', title: 'الفيديو الترحيبي الثانوي (المقدمة 2)', defaultSrc: '/mascot/pose_sixty_seconds_challenger.mp4' },
    { id: 'app_logo', title: 'شعار التطبيق الرسمي (App Logo)', defaultSrc: '/logo.png' },
    { id: 'welcome_card_welcome', title: 'البطاقة الترحيبية الأولى (مرحباً)', defaultSrc: '/mascot/welcome.jpg' },
    { id: 'welcome_card_connect', title: 'البطاقة الترحيبية الثانية (التواصل)', defaultSrc: '/mascot/connect.jpg' },
    { id: 'welcome_card_study', title: 'البطاقة الترحيبية الثالثة (الدراسة)', defaultSrc: '/mascot/study.jpg' },
    { id: 'welcome_card_transit', title: 'البطاقة الترحيبية الرابعة (النقل)', defaultSrc: '/mascot/transit.jpg' },
    { id: 'welcome_card_achieve', title: 'البطاقة الترحيبية الخامسة (التفوق)', defaultSrc: '/mascot/achieve.jpg' },
    { id: 'welcome_card_launch', title: 'البطاقة الترحيبية السادسة (الانطلاق)', defaultSrc: '/mascot/launch.jpg' }
  ]
};

export const DASHBOARD_TABS = [
  { id: 'admin', label: 'لوحة الإدارة' },
  { id: 'student', label: 'لوحة الطالب' },
  { id: 'teacher', label: 'لوحة الأستاذ' },
  { id: 'parent', label: 'لوحة ولي الأمر' },
  { id: 'driver', label: 'لوحة السائق' },
  { id: 'welcome', label: 'البطاقات الترحيبية' }
];

interface MediaManagementSectionProps {
  triggerToast: (message: string, type?: "success" | "error" | "info") => void;
}

interface MediaPreviewCardProps {
  header: { id: string; title: string; defaultSrc: string };
  currentPose: string;
  progress: number;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onHistory: () => void;
  onReset: () => void;
}

const MediaPreviewCard: React.FC<MediaPreviewCardProps> = ({
  header,
  currentPose,
  progress,
  onUpload,
  onHistory,
  onReset,
}) => {
  const [loadError, setLoadError] = useState(false);

  // Reset error when the currentPose prop changes
  useEffect(() => {
    setLoadError(false);
  }, [currentPose]);

  const activeSrc = loadError ? header.defaultSrc : (currentPose || header.defaultSrc);
  const isVideo = isVideoUrl(activeSrc);

  return (
    <div className="bg-black/40 border border-white/5 rounded-3xl p-4 flex flex-col gap-3 relative overflow-hidden">
      {/* Upload Progress Bar */}
      {progress > 0 && progress < 100 && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center backdrop-blur-md">
          <div className="w-3/4 bg-white/10 rounded-full h-2 overflow-hidden mb-2">
            <div 
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-bold text-white/90">جاري الرفع... {progress}%</span>
        </div>
      )}

      <div className="aspect-video w-full rounded-2xl bg-black/60 border border-white/5 overflow-hidden relative group">
        {isVideo ? (
          <video 
            key={activeSrc}
            src={activeSrc} 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover"
            onError={() => {
              console.warn(`[MEDIA PREVIEW] Video error for ${header.id} at ${activeSrc}. Falling back to default.`);
              setLoadError(true);
            }}
          />
        ) : (
          <img 
            key={activeSrc}
            src={activeSrc} 
            alt={header.title} 
            className="w-full h-full object-cover"
            onError={(e) => {
              console.warn(`[MEDIA PREVIEW] Image error for ${header.id} at ${activeSrc}.`);
              if (!loadError && activeSrc !== header.defaultSrc) {
                setLoadError(true);
              } else {
                (e.currentTarget as HTMLImageElement).src = '/mascot/connect.jpg';
              }
            }} 
          />
        )}

        {loadError && (
          <div className="absolute top-2 right-2 bg-amber-500/90 text-black text-[10px] font-black px-2 py-0.5 rounded-full z-10 shadow pointer-events-none">
            الوضعية الافتراضية
          </div>
        )}

        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity backdrop-blur-sm z-20">
          <ImageIcon size={24} className="text-white mb-2" />
          <span className="text-xs font-bold text-white">تغيير الوضعية</span>
          <input 
            type="file" 
            className="hidden" 
            accept="image/*,video/mp4,video/webm,video/quicktime,video/x-m4v" 
            onChange={onUpload} 
            disabled={progress > 0} 
          />
        </label>
      </div>
      
      <div className="flex items-center justify-between mt-2 gap-2">
        <h4 className="font-bold text-white/90 text-sm truncate" title={header.title}>{header.title}</h4>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onHistory}
            className="bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-[10px] font-bold py-1 px-2 rounded transition-colors"
            title="سجل الإصدارات والاستعادة السحابية"
          >
            السجل
          </button>
          <button
            onClick={() => {
              setLoadError(false);
              onReset();
            }}
            className="bg-white/10 hover:bg-red-500/30 text-white/80 hover:text-white text-[10px] font-bold py-1 px-2 rounded transition-colors"
            title="إعادة ضبط للوضعية المعتمدة الأصلية"
          >
            استعادة
          </button>
        </div>
      </div>
    </div>
  );
};

export const MediaManagementSection: React.FC<MediaManagementSectionProps> = ({ triggerToast }) => {
  const [activeMediaDashboard, setActiveMediaDashboard] = useState<keyof typeof DASHBOARDS_POSES>('admin');
  const [headerPoses, setHeaderPoses] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [historyModalAsset, setHistoryModalAsset] = useState<{ id: string; title: string } | null>(null);

  // Global Announcements State
  const [globalAnnTitle, setGlobalAnnTitle] = useState("");
  const [globalAnnCategory, setGlobalAnnCategory] = useState("إعلان عاجل");
  const [globalAnnMessage, setGlobalAnnMessage] = useState("");
  const [globalAnnImage, setGlobalAnnImage] = useState("");
  const [globalAnnLocation, setGlobalAnnLocation] = useState<'both' | 'popup' | 'top_banner' | 'ticker'>('both');
  const [globalAnnTargets, setGlobalAnnTargets] = useState<string[]>(['all']);
  const [globalAnnPublishing, setGlobalAnnPublishing] = useState(false);
  const [globalAnnProgress, setGlobalAnnProgress] = useState(0);
  const [publishedGlobalAnns, setPublishedGlobalAnns] = useState<any[]>([]);
  const [loadingBroadcasts, setLoadingBroadcasts] = useState(true);
  const [announcementToDelete, setAnnouncementToDelete] = useState<any | null>(null);

  // Subscribe to character pose overrides
  useEffect(() => {
    const unsub = subscribeToPoseOverrides((poses) => {
      setHeaderPoses(poses);
    });
    return () => unsub();
  }, []);

  // Fetch broadcasts from PostgreSQL API
  const fetchBroadcasts = async () => {
    try {
      const res = await fetch('/api/firestore-docs/broadcasts');
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json.items) ? json.items : (Array.isArray(json.data) ? json.data : []);
        const formatted = items.map((d: any) => {
          const timestampMs = d.timestampMs || ((d.timestamp && typeof d.timestamp.toMillis === 'function')
            ? d.timestamp.toMillis()
            : (typeof d.timestamp === 'number' ? d.timestamp : Date.now()));
          return { id: d.id, ...d, timestampMs };
        }).sort((a: any, b: any) => b.timestampMs - a.timestampMs);
        setPublishedGlobalAnns(formatted);
      }
    } catch (err: any) {
      console.warn("Notice loading broadcasts from PostgreSQL API:", err?.message || err);
    } finally {
      setLoadingBroadcasts(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();

    const unsubRealtime = realtimeManager.subscribe('broadcasts', () => {
      fetchBroadcasts();
    });

    const handleLocalEvent = () => fetchBroadcasts();
    window.addEventListener('app_broadcast_event', handleLocalEvent);

    const interval = setInterval(fetchBroadcasts, 8000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('app_broadcast_event', handleLocalEvent);
      unsubRealtime();
    };
  }, []);

  const handleHeaderPoseUpload = async (headerId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadProgress(prev => ({ ...prev, [headerId]: 10 }));
      triggerToast("جاري رفع ومعالجة الملف السحابي...", "info");

      const publicUrl = await uploadFileToR2(file, (p) => {
        setUploadProgress(prev => ({ ...prev, [headerId]: Math.max(10, Math.round(p * 0.7)) }));
      });

      console.log(`[R2 SUCCESS] File uploaded to storage: ${publicUrl}`);
      setUploadProgress(prev => ({ ...prev, [headerId]: 80 }));

      const aliases = POSE_ALIASES_MAP[headerId] || [];
      const keysToSave = Array.from(new Set([headerId, ...aliases]));
      const savePayload: Record<string, string> = {};
      keysToSave.forEach(k => {
        savePayload[k] = publicUrl;
      });

      // 1. Authoritative Backend PostgreSQL API persistence
      try {
        const response = await fetch('/api/bairaq/poses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assetId: headerId,
            publicUrl,
            aliases,
            fileName: file.name,
            fileSize: file.size,
            assetType: file.type
          })
        });

        if (!response.ok) {
          throw new Error(`خطأ في استجابة الخادم: ${response.statusText}`);
        }
        const resData = await response.json();
        console.log(`[DATABASE WRITE] [POSTGRESQL] Server confirmed pose update:`, resData);
      } catch (backendErr: any) {
        console.warn("Backend API pose save warning:", backendErr);
      }

      // 2. Update Global Singleton State immediately
      updateGlobalPoses(savePayload);
      console.log(`[STATE UPDATE] Updated global pose engine with ${headerId} and aliases`);

      setUploadProgress(prev => ({ ...prev, [headerId]: 100 }));
      triggerToast("تم الحفظ بنجاح وتوثيقه في السجل الدائم!", "success");

      setHeaderPoses(prev => {
        const next = { ...prev };
        keysToSave.forEach(k => { next[k] = publicUrl; });
        return next;
      });

      setTimeout(() => {
        setUploadProgress(prev => {
          const next = { ...prev };
          delete next[headerId];
          return next;
        });
      }, 1500);

    } catch (err: any) {
      console.error("[UPLOAD ERROR]", err);
      triggerToast(err.message || "فشل الرفع، النسخة الحالية سليمة ولم تتأثر.", "error");
      setUploadProgress(prev => {
        const next = { ...prev };
        delete next[headerId];
        return next;
      });
    }
  };

  const handleResetHeaderPose = async (headerId: string) => {
    try {
      triggerToast("جاري استعادة الوضعية المعتمدة...", "info");
      console.log(`[ASSET OVERRIDE] Resetting pose override for ${headerId}`);

      const aliases = POSE_ALIASES_MAP[headerId] || [];
      const keysToReset = Array.from(new Set([headerId, ...aliases]));

      // 1. Server-side API reset in PostgreSQL backend
      await fetch('/api/bairaq/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: headerId })
      }).catch(e => console.warn("Backend API pose reset warning:", e));

      setHeaderPoses(prev => {
        const next = { ...prev };
        keysToReset.forEach(k => { delete next[k]; });
        return next;
      });

      // Update global singleton state
      const nullPayload: Record<string, string> = {};
      keysToReset.forEach(k => { nullPayload[k] = ''; });
      updateGlobalPoses(nullPayload);

      triggerToast("تمت استعادة الوضعية المعتمدة بنجاح!", "success");
    } catch (err) {
      console.error(err);
      triggerToast("حدث خطأ أثناء استعادة الوضعية", "error");
    }
  };

  const handleGlobalAnnImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      triggerToast("حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 10 ميجابايت", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 900;
        const MAX_HEIGHT = 900;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          if (compressedBase64.length > 900000) {
            triggerToast("الصورة ضخمة جداً حتى بعد الضغط، يرجى اختيار صورة أصغر", "error");
            return;
          }
          setGlobalAnnImage(compressedBase64);
          triggerToast("تم ضغط وتحميل الصورة بنجاح 🖼️", "success");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handlePublishGlobalAnn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalAnnMessage.trim()) {
      triggerToast("يرجى كتابة نص الإعلان أو التهنئة!", "error");
      return;
    }

    try {
      setGlobalAnnPublishing(true);
      setGlobalAnnProgress(20);
      triggerToast("جاري تجهيز ونشر الإعلان لجميع المستخدمين...", "info");
      await new Promise(r => setTimeout(r, 400));
      setGlobalAnnProgress(60);

      const newBroadcast = {
        title: globalAnnTitle.trim() || 'إعلان وتبريكات المنصة',
        category: globalAnnCategory,
        message: globalAnnMessage.trim(),
        imageUrl: globalAnnImage || '',
        targetLocation: globalAnnLocation,
        targetDashboards: globalAnnTargets,
        schoolId: '',
        author: 'إدارة المنصة المركزية',
        subject: globalAnnCategory,
        targetGrades: ['الجميع'],
        timestampMs: Date.now(),
        expiryDate: Date.now() + 14 * 24 * 3600 * 1000,
        isGlobalAnnouncement: true,
        isCentralPlatform: true
      };

      const res = await fetch('/api/firestore-docs/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBroadcast)
      });

      if (!res.ok) {
        throw new Error("Failed to post announcement to server");
      }

      const savedDoc = await res.json();
      setGlobalAnnProgress(100);

      // Trigger realtime broadcast
      try {
        realtimeManager.trigger('broadcasts', savedDoc);
        window.dispatchEvent(new CustomEvent('app_broadcast_event', { detail: { action: 'INSERT', data: savedDoc } }));
      } catch (evErr) {
        console.warn("Broadcast event trigger:", evErr);
      }

      await fetchBroadcasts();

      triggerToast("✅ تم نشر الإعلان بنجاح في أجهزة وواجهات جميع المستخدمين!", "success");
      setGlobalAnnTitle("");
      setGlobalAnnMessage("");
      setGlobalAnnImage("");
    } catch (err) {
      console.error(err);
      triggerToast("فشل في نشر الإعلان، يرجى المحاولة مرة أخرى", "error");
    } finally {
      setGlobalAnnPublishing(false);
      setGlobalAnnProgress(0);
    }
  };

  const confirmDeleteGlobalAnn = async () => {
    if (!announcementToDelete) return;
    try {
      const res = await fetch(`/api/firestore-docs/broadcasts/${encodeURIComponent(announcementToDelete.id)}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        throw new Error("Failed to delete announcement from server");
      }

      try {
        realtimeManager.trigger('broadcasts', { id: announcementToDelete.id, action: 'DELETE' });
        window.dispatchEvent(new CustomEvent('app_broadcast_event', { detail: { action: 'DELETE', id: announcementToDelete.id } }));
      } catch (evErr) {
        console.warn("Delete event trigger:", evErr);
      }

      await fetchBroadcasts();
      triggerToast("✅ تم حذف الإعلان بنجاح من المنصة", "success");
      setAnnouncementToDelete(null);
    } catch (err) {
      console.error(err);
      triggerToast("فشل في حذف الإعلان، يرجى المحاولة مرة أخرى", "error");
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="p-6 bg-gradient-to-br from-[#0c1024] to-[#060815] border-b border-white/5">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
              <ImageIcon size={24} />
            </div>
            <div>
              <h3 className="font-black text-white text-lg">إدارة الوسائط وهيدرات المنصة</h3>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">تخصيص وضعيات بيرق عبر تخزين PostgreSQL السحابي</p>
            </div>
          </div>
          
          <div className="relative">
            <select
              value={activeMediaDashboard}
              onChange={(e) => setActiveMediaDashboard(e.target.value as keyof typeof DASHBOARDS_POSES)}
              className="appearance-none bg-black/40 border border-white/10 text-white text-sm font-bold rounded-2xl pl-10 pr-4 py-2.5 outline-none focus:border-purple-500 transition-all min-w-[180px] cursor-pointer"
            >
              {DASHBOARD_TABS.map(tab => (
                <option key={tab.id} value={tab.id} className="bg-gray-900 text-white">
                  {tab.label}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
          </div>
        </div>

        {/* Quick Identity & Welcome Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-cyan-500/10 border border-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-12 h-12 rounded-xl bg-black/60 border border-amber-500/30 p-1 flex items-center justify-center shrink-0 shadow-lg overflow-hidden">
              <img 
                src={headerPoses['app_logo'] || '/logo.png'} 
                alt="شعار التطبيق" 
                className="w-full h-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png'; }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-400">شعار وهوية التطبيق (App Logo)</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {headerPoses['app_logo'] ? 'مخصص سحابياً في PostgreSQL' : 'الافتراضي المعتمد'}
                </span>
              </div>
              <p className="text-[11px] text-white/60">يظهر في الشاشات الرئيسية وشاشات تسجيل الدخول والشهادات.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-md active:scale-95">
              <FileUp size={14} />
              <span>رفع شعار التطبيق</span>
              <input 
                type="file" 
                className="hidden" 
                accept="image/png,image/jpeg,image/webp,image/svg+xml" 
                onChange={(e) => {
                  setActiveMediaDashboard('welcome');
                  handleHeaderPoseUpload('app_logo', e);
                }} 
              />
            </label>
            <button
              onClick={() => setActiveMediaDashboard('welcome')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                activeMediaDashboard === 'welcome'
                  ? 'bg-purple-500/30 border-purple-500 text-purple-300'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
              }`}
            >
              عرض الفيديوهات الترحيبية 🎬
            </button>
          </div>
        </div>

        {/* Poses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DASHBOARDS_POSES[activeMediaDashboard].map((header) => {
            const currentPose = headerPoses[header.id] || header.defaultSrc;
            const progress = uploadProgress[header.id] || 0;

            return (
              <MediaPreviewCard
                key={header.id}
                header={header}
                currentPose={currentPose}
                progress={progress}
                onUpload={(e) => handleHeaderPoseUpload(header.id, e)}
                onHistory={() => setHistoryModalAsset({ id: header.id, title: header.title })}
                onReset={() => handleResetHeaderPose(header.id)}
              />
            );
          })}
        </div>

        {/* Global Announcements & Greetings Manager */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
              <Megaphone size={24} />
            </div>
            <div>
              <h3 className="font-black text-white text-lg">إدارة الإعلانات، الأخبار، التبريكات والتعازي العامة</h3>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">نشر المحتوى لجميع اللوحات وأشرطة الإعلانات (قاعدة بيانات PostgreSQL)</p>
            </div>
          </div>

          <GlobalAnnouncementsBanner dashboardType="admin" />
          <GlobalAnnouncementsPopup dashboardType="admin" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Publish Form */}
            <form onSubmit={handlePublishGlobalAnn} className="lg:col-span-1 bg-black/40 border border-white/5 rounded-3xl p-6 space-y-4">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" />
                إضافة إعلان أو تهنئة جديدة
              </h4>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1.5">عنوان الإعلان / المناسبة</label>
                <input
                  type="text"
                  value={globalAnnTitle}
                  onChange={(e) => setGlobalAnnTitle(e.target.value)}
                  placeholder="مثل: تهنئة عيد الفطر المبارك / خبر عاجل"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1.5">التصنيف</label>
                <select
                  value={globalAnnCategory}
                  onChange={(e) => setGlobalAnnCategory(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-amber-500 transition-all cursor-pointer"
                >
                  <option value="إعلان عاجل">إعلان عاجل</option>
                  <option value="تهنئة">تهنئة (عيد / مناسبة)</option>
                  <option value="تعزية">تعزية ومواساة</option>
                  <option value="مناسبة وطنية">مناسبة وطنية</option>
                  <option value="خبر عام">خبر عام</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1.5">نص الإعلان أو التهنئة</label>
                <textarea
                  rows={3}
                  value={globalAnnMessage}
                  onChange={(e) => setGlobalAnnMessage(e.target.value)}
                  placeholder="اكتب تفاصيل الإعلان أو التهنئة أو التعزية هنا..."
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-amber-500 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1.5">صورة أو تصميم المناسبة (اختياري)</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 border border-dashed border-white/20 hover:border-amber-500 rounded-xl p-3 text-center cursor-pointer bg-black/20 hover:bg-black/40 transition-all">
                    <span className="text-[11px] font-bold text-white/70">اختر صورة المناسبة...</span>
                    <input type="file" accept="image/*" onChange={handleGlobalAnnImageUpload} className="hidden" />
                  </label>
                  {globalAnnImage && (
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/20 shrink-0">
                      <img src={globalAnnImage} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1.5">مكان الظهور</label>
                <select
                  value={globalAnnLocation}
                  onChange={(e) => setGlobalAnnLocation(e.target.value as any)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-amber-500 transition-all cursor-pointer"
                >
                  <option value="both">الكل (بانر، شريط، ونافذة منبثقة عند الفتح)</option>
                  <option value="popup">نافذة منبثقة تنبثق عند فتح التطبيق فقط</option>
                  <option value="top_banner">بانر / إشعار أعلى الشاشة الرئيسية فقط</option>
                  <option value="ticker">شريط الإعلانات المتحرك فقط</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/70 mb-1.5">اللوحات المستهدفة</label>
                <select
                  value={globalAnnTargets[0]}
                  onChange={(e) => setGlobalAnnTargets([e.target.value])}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs outline-none focus:border-amber-500 transition-all cursor-pointer"
                >
                  <option value="all">جميع اللوحات (إدارة، طالب، أستاذ، ولي أمر، سائق)</option>
                  <option value="admin">لوحة الإدارة فقط</option>
                  <option value="student">لوحة الطالب فقط</option>
                  <option value="teacher">لوحة الأستاذ فقط</option>
                  <option value="parent">لوحة ولي الأمر فقط</option>
                  <option value="driver">لوحة السائق فقط</option>
                </select>
              </div>

              {globalAnnPublishing && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold text-amber-400">
                    <span>جاري النشر في PostgreSQL وبث التحديث لجميع الأجهزة...</span>
                    <span>{globalAnnProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300"
                      style={{ width: `${globalAnnProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={globalAnnPublishing}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-black font-black text-xs py-3 rounded-xl shadow-lg transition-all cursor-pointer"
              >
                {globalAnnPublishing ? 'جاري النشر...' : 'نشر الإعلان فوراً لجميع المستخدمين'}
              </button>
            </form>

            {/* Published Announcements List */}
            <div className="lg:col-span-2 bg-black/40 border border-white/5 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Megaphone size={16} className="text-purple-400" />
                  الإعلانات والتبريكات المنشورة حالياً ({publishedGlobalAnns.length})
                </h4>
                <button
                  onClick={fetchBroadcasts}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                  title="تحديث القائمة"
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {loadingBroadcasts ? (
                  <div className="text-center py-16 text-white/40 text-xs">جاري تحميل الإعلانات من قاعدة البيانات...</div>
                ) : publishedGlobalAnns.length === 0 ? (
                  <div className="text-center py-16 text-white/30 text-xs">لا توجد إعلانات أو تهانٍ منشورة حالياً.</div>
                ) : (
                  publishedGlobalAnns.map((item) => (
                    <div key={item.id} className="bg-black/60 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between relative group">
                      {item.imageUrl && (
                        <div className="w-20 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10">
                          <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 text-right min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                            {item.category || 'إعلان'}
                          </span>
                          <span className="text-white/40 text-[10px]">
                            {new Date(item.timestampMs || Date.now()).toLocaleDateString('ar-SA')}
                          </span>
                        </div>
                        <h5 className="font-bold text-white text-sm truncate">{item.title}</h5>
                        <p className="text-white/70 text-xs line-clamp-2">{item.message}</p>
                      </div>
                      <button
                        onClick={() => setAnnouncementToDelete(item)}
                        className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white font-bold text-[11px] transition-all cursor-pointer"
                      >
                        حذف
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Modal for Deleting Announcement */}
        {announcementToDelete && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" dir="rtl">
            <div className="bg-[#121829] border border-red-500/40 rounded-3xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.2)] space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 border border-red-500/30">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h4 className="font-black text-white text-base">تأكيد حذف الإعلان أو التهنئة</h4>
                  <p className="text-white/50 text-[11px]">هذا الإجراء نهائي وسيتم إزالة الإعلان فوراً من PostgreSQL وأجهزة جميع المستخدمين.</p>
                </div>
              </div>

              <div className="bg-black/50 border border-white/10 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                  {announcementToDelete.category || 'إعلان'}
                </span>
                <h5 className="font-bold text-white text-sm mt-1">{announcementToDelete.title}</h5>
                <p className="text-white/70 text-xs line-clamp-2">{announcementToDelete.message}</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={confirmDeleteGlobalAnn}
                  className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs shadow-lg transition-all cursor-pointer"
                >
                  نعم، حذف الإعلان نهائياً
                </button>
                <button
                  onClick={() => setAnnouncementToDelete(null)}
                  className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History Modal */}
        {historyModalAsset && (
          <BairaqAssetHistoryModal
            assetId={historyModalAsset.id}
            assetTitle={historyModalAsset.title}
            onClose={() => setHistoryModalAsset(null)}
            onRestored={(url) => {
              setHeaderPoses(prev => ({ ...prev, [historyModalAsset.id]: url }));
            }}
            triggerToast={triggerToast}
          />
        )}
      </section>
    </div>
  );
};

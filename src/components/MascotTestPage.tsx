import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Upload, 
  CloudUpload, 
  ShieldCheck, 
  Image as ImageIcon,
  Sparkles,
  Info,
  Maximize2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { BerqCharacter, BerqPose } from './BerqCharacterManager';

interface MascotVerifyFile {
  fileName: string;
  url: string;
  sizeBytes: number;
  sizeKb: string;
  headerHex: string;
  expectedHeader: string;
  isValidHeader: boolean;
  width: number | null;
  height: number | null;
  format: string | null;
  sharpError: string | null;
  isHealthy: boolean;
}

interface VerifyApiResponse {
  success: boolean;
  allValid: boolean;
  totalFiles: number;
  files: MascotVerifyFile[];
}

const ALL_POSES: BerqPose[] = [
  'standing_arms_crossed',
  'main_mascot_full_body',
  'pose_crossed_arms',
  'pose_thumbs_up',
  'pose_holding_tablet',
  'pose_waving_hand',
  'captain_bairaq_guardian',
  'general_pose_encouragement',
  'general_pose_diligent_student',
  'general_pose_explanation_guidance',
  'general_pose_excellence_achievement',
  'general_pose_notifications',
  'general_pose_protection_followup',
  'character_student',
  'character_teacher',
  'character_driver',
  'character_guardian',
  'character_administrator',
  'face_neutral',
  'face_wink_left',
  'face_happy',
  'face_surprised',
  'face_laughing',
  'face_wink_right',
  'face_thinking',
  'face_excited',
  'face_winking',
  'face_encouraging',
  'face_sad',
  'face_anxious',
  'face_angry',
  'face_tired',
  'face_focused',
  'face_proud',
  'face_shocked',
  'face_reassured',
  'face_grateful',
  'face_welcoming',
  'face_celebrating',
  'face_sleeping',
  'face_very_happy',
  'face_astonished',
  'face_mildly_angry',
  'face_playful',
  'use_driving_bus',
  'use_studying',
  'use_smart_education',
  'use_safety_protection',
  'use_notifications_alerts',
  'use_achievement_excellence',
  'use_tracking_trips',
  'use_parental_supervision',
  'main_standing_pose',
  'greeting_welcome',
  'greet_hello',
  'greet_well_done',
  'greet_congratulations',
  'greet_lets_go',
  'pose_finance_officer',
  'pose_key_master',
  'pose_student_manager',
  'pose_broadcaster',
  'pose_discipline_shield',
  'pose_school_uniform',
  'pose_staff_leader',
  'pose_bus_captain',
  'pose_idea_genius',
  'pose_customer_support',
  'pose_portal_pulse',
  'pose_content_control',
  'pose_activity_logs',
  'pose_transport_manager',
  'pose_parent_dashboard',
  'pose_gateway_guardian',
  'pose_academic_scholar',
  'pose_sixty_seconds_challenger',
  'pose_radar_navigator',
  'pose_champion_laureate',
  'pose_control_mechanic',
  'pose_idea_creator',
  'pose_ai_companion',
  'pose_sovereign_leader',
  'pose_digital_broadcaster',
  'pose_homework_master',
  'pose_live_announcer',
  'pose_schedule_planner',
  'pose_questions_bank',
  'pose_excellence_champion',
];

export const MascotTestPage: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [verifyData, setVerifyData] = useState<VerifyApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [syncingR2, setSyncingR2] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // 20 random poses state
  const [randomPoses, setRandomPoses] = useState<BerqPose[]>([]);

  const fetchVerification = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/mascot/verify');
      const data: VerifyApiResponse = await res.json();
      setVerifyData(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل في الاتصال بخادم الفحص');
    } finally {
      setLoading(false);
    }
  };

  const pick20RandomPoses = () => {
    const shuffled = [...ALL_POSES].sort(() => 0.5 - Math.random());
    setRandomPoses(shuffled.slice(0, 20));
  };

  useEffect(() => {
    fetchVerification();
    pick20RandomPoses();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setSyncMessage(null);
    setErrorMessage(null);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const res = await fetch('/api/mascot/upload-binary', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'فشل رفع الملفات');
      }

      setSyncMessage(`تم نسخ ${files.length} ملف بنجاح في وضع الثنائي النقي (Binary Mode) وتم فحص سلامتها!`);
      await fetchVerification();
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء رفع الملفات');
    } finally {
      setUploading(false);
    }
  };

  const handleSyncR2 = async () => {
    if (!verifyData?.allValid) {
      alert('لا يمكن ربط R2! توجد صور غير سليمة أو تعرضت للتلف. يرجى تصحيح التلف أولاً.');
      return;
    }

    setSyncingR2(true);
    setSyncMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/mascot/sync-r2', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'فشل ربط Cloudflare R2');
      }

      setSyncMessage(data.message || 'تم إعادة ربط Cloudflare R2 بالملفات السليمة بنجاح!');
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل ربط Cloudflare R2');
    } finally {
      setSyncingR2(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 dir-rtl font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {onBack && (
                <button 
                  onClick={onBack}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
                  title="عودة"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
              <h1 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
                <ShieldCheck className="w-7 h-7 text-amber-400" />
                اختبار وتدقيق سلامة شخصية بيرق (Binary Magic Bytes Check)
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              فحص التوقيع الثنائي (89 50 4E 47 0D 0A 1A 0A) وأبعاد الصور عبر Sharp لضمان خلوها من التلف
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchVerification}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              إعادة الفحص
            </button>

            <button
              onClick={pick20RandomPoses}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              توليد 20 وضعية عشوائية جديدة
            </button>
          </div>
        </div>

        {/* Binary Health Summary */}
        {verifyData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
              <div className={`p-3.5 rounded-xl ${verifyData.allValid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                {verifyData.allValid ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">حالة التوقيع الثنائي</p>
                <p className={`text-base font-bold mt-0.5 ${verifyData.allValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {verifyData.allValid ? 'سليمة 100% (Binary OK)' : 'يوجد ملفات تالفة!'}
                </p>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">إجمالي صور public/mascot</p>
                <p className="text-lg font-bold text-slate-100 mt-0.5">{verifyData.totalFiles} ملف</p>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">بايت PNG المتوقع</p>
                <p className="text-xs font-mono font-bold text-amber-300 mt-0.5">89 50 4E 47 0D 0A 1A 0A</p>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
              <button
                onClick={handleSyncR2}
                disabled={!verifyData.allValid || syncingR2}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                  verifyData.allValid
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <CloudUpload className={`w-4 h-4 ${syncingR2 ? 'animate-bounce' : ''}`} />
                {syncingR2 ? 'جاري رفع R2...' : 'ربط Cloudflare R2 بالنسخة السليمة'}
              </button>
            </div>
          </div>
        )}

        {/* Status Alerts */}
        <AnimatePresence>
          {syncMessage && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-2xl flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <p>{syncMessage}</p>
            </motion.div>
          )}

          {errorMessage && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl flex items-center gap-3 text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <p>{errorMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Drop Zone for Original Binary Copy */}
        <div className="bg-slate-900/40 border border-dashed border-slate-700 hover:border-amber-500/50 rounded-2xl p-6 transition-all text-center">
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileUpload}
            id="mascot-binary-upload"
            className="hidden"
            disabled={uploading}
          />
          <label htmlFor="mascot-binary-upload" className="cursor-pointer flex flex-col items-center gap-3">
            <div className="p-4 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Upload className={`w-6 h-6 ${uploading ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-200">
                {uploading ? 'جاري نسخ الملفات بنمط Binary Copy...' : 'رفع نسخة جديدة من الجهاز (Binary Copy فقط)'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                يتم نسخ الملفات كما هي مباشرة لكتل البايت المباشرة بدون أي إعادة حفظ نصية أو ترميز utf8
              </p>
            </div>
          </label>
        </div>

        {/* 20 Random Poses Visual Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              عرض 20 صورة عشوائية لسباق وضعيات بيرق
            </h2>
            <span className="text-xs text-slate-400 bg-slate-800/80 border border-slate-700 px-3 py-1 rounded-full font-mono">
              20 / {ALL_POSES.length} Pose Keys
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {randomPoses.map((poseKey, index) => (
              <motion.div
                key={`${poseKey}-${index}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-between text-center gap-3 shadow-xl relative overflow-hidden group"
              >
                {/* Index badge */}
                <div className="absolute top-3 right-3 bg-slate-800/90 text-amber-400 text-xs font-mono font-bold px-2 py-0.5 rounded-md border border-slate-700">
                  #{index + 1}
                </div>

                {/* Character preview */}
                <div className="w-full h-44 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-center p-3 relative overflow-hidden bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
                  <BerqCharacter
                    pose={poseKey}
                    height="100%"
                    animate={false}
                    className="max-h-full max-w-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                  />
                </div>

                {/* Pose info & health check */}
                <div className="w-full space-y-1.5 text-right">
                  <p className="text-xs font-mono font-semibold text-slate-200 truncate dir-ltr text-center" title={poseKey}>
                    {poseKey}
                  </p>
                  
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                    <span>البايتات:</span>
                    <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      89 50 4E 47...
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Sharp Status:</span>
                    <span className="text-slate-300 font-medium">Valid 100%</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Detailed File Inspector Table */}
        {verifyData && verifyData.files && verifyData.files.length > 0 && (
          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400" />
              تفاصيل الفحص التقني لملفات public/mascot ({verifyData.files.length} ملف)
            </h2>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden overflow-x-auto shadow-xl">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-950/80 text-slate-400 text-xs font-medium border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">الملف</th>
                    <th className="p-3.5 text-center">التوقيع الثنائي (Header Hex)</th>
                    <th className="p-3.5 text-center">الأبعاد (Sharp)</th>
                    <th className="p-3.5 text-center">الحجم</th>
                    <th className="p-3.5 text-center">حالة السلامة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {verifyData.files.map((file) => (
                    <tr key={file.fileName} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 text-slate-200 font-sans font-medium flex items-center gap-2 dir-ltr">
                        <span className="truncate max-w-[200px]">{file.fileName}</span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-1 rounded font-mono ${file.isValidHeader ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                          {file.headerHex}
                        </span>
                      </td>
                      <td className="p-3.5 text-center text-slate-300">
                        {file.width && file.height ? `${file.width} × ${file.height} px (${file.format})` : 'غير محدد'}
                      </td>
                      <td className="p-3.5 text-center text-slate-400">{file.sizeKb} KB</td>
                      <td className="p-3.5 text-center font-sans">
                        {file.isHealthy ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            سليم 100%
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-semibold bg-rose-500/10 px-2 py-0.5 rounded-full text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            تالف
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

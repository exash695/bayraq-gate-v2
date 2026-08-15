import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Smartphone, ShieldAlert, Sparkles, PauseCircle, 
  RefreshCw, Clock, ArrowLeft, CheckCircle2, Globe, 
  PhoneCall, Lock, X, ExternalLink, Download, Flame, 
  Zap, Wrench, Server, ShieldCheck, AlertTriangle
} from "lucide-react";
import { RemoteConfig } from "../services/remoteConfig";

// Official Google Play Store Vector Icon Component (Unclipped 24x24 precise vector)
const GooglePlayOfficialIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
    <path fill="#00D2FF" d="M3.609 1.814C3.244 2.184 3.021 2.726 3.021 3.385v17.23c0 .659.223 1.201.588 1.571L13.792 12 3.609 1.814z"/>
    <path fill="#00E676" d="M17.29 8.513l2.88 1.638c1.03.586 1.03 1.542 0 2.128l-2.88 1.638-3.498-3.5 3.498-3.404z"/>
    <path fill="#FF3D00" d="M13.792 12l3.498 3.5-13.68 7.781c-.596.338-1.206.27-1.637-.095L13.792 12z"/>
    <path fill="#FFC107" d="M13.792 12L1.973.814c.431-.365 1.041-.433 1.637-.095l13.682 7.78L13.792 12z"/>
  </svg>
);

// Official Apple Vector Icon Component (Unclipped 24x24 precise vector)
const AppleOfficialIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.8 1.11-1.92.99-3.04-.96.04-2.12.64-2.8 1.44-.61.71-1.14 1.86-1 2.97 1.08.08 2.16-.57 2.81-1.37z"/>
  </svg>
);

export type SystemModalType = 
  | "mandatory_update"
  | "optional_update"
  | "maintenance"
  | "system_pause"
  | "new_version";

interface SystemDialogsModalProps {
  type: SystemModalType;
  remoteConfig: RemoteConfig;
  isOpen: boolean;
  onClose?: () => void;
  onDeveloperBypass?: () => void;
  isPreview?: boolean;
}

export const SystemDialogsModal: React.FC<SystemDialogsModalProps> = ({
  type,
  remoteConfig,
  isOpen,
  onClose,
  onDeveloperBypass,
  isPreview = false,
}) => {
  if (!isOpen) return null;

  // Format changelog bullet points cleanly
  const changelogPoints = (remoteConfig.updateChangelog || "")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // Modal Theme Configuration based on type
  const getModalConfig = () => {
    switch (type) {
      case "mandatory_update":
        return {
          statusBadge: `تحديث إجباري v${remoteConfig.latestVersion || "1.2.0"}`,
          statusBadgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]",
          title: "تحديث جديد للتطبيق متوفر الآن 🚀",
          subtitle: "يرجى تحديث التطبيق للاستمرار بفتح جميع الميزات والدروس والنتائج الرسمية.",
          accentGlow: "from-amber-500/20 via-orange-500/10 to-transparent",
          cardBorder: "border-amber-500/30 shadow-[0_20px_80px_rgba(245,158,11,0.25)]",
          iconBg: "bg-gradient-to-br from-amber-500/20 to-orange-500/30 border-amber-500/50 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.4)]",
          Icon: Smartphone,
          animClass: "animate-bounce",
          showStores: true,
          showBypass: true,
          canClose: false,
        };
      case "optional_update":
        return {
          statusBadge: `تحديث اختياري متاح v${remoteConfig.latestVersion || "1.2.0"}`,
          statusBadgeClass: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.2)]",
          title: "إصدار جديد متوفر في المتجر ✨",
          subtitle: "يتوفر إيجاز وتحديث جديد لتحسين سرعة واستقرار المنصة.",
          accentGlow: "from-indigo-500/20 via-sky-500/10 to-transparent",
          cardBorder: "border-indigo-500/30 shadow-[0_20px_80px_rgba(99,102,241,0.25)]",
          iconBg: "bg-gradient-to-br from-indigo-500/20 to-sky-500/30 border-indigo-500/50 text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.4)]",
          Icon: Sparkles,
          animClass: "animate-pulse",
          showStores: true,
          showBypass: false,
          canClose: true,
        };
      case "maintenance":
        return {
          statusBadge: "صيانة سحابية مركزية طارئة 🛠️",
          statusBadgeClass: "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]",
          title: "المنصة قيد الصيانة والتحديث الدوري",
          subtitle: "يقوم الفريق التقني بإجراء تحسينات ومزامنة خوادم سحابية لرفع الأداء.",
          accentGlow: "from-rose-500/20 via-purple-500/10 to-transparent",
          cardBorder: "border-rose-500/30 shadow-[0_20px_80px_rgba(244,63,94,0.25)]",
          iconBg: "bg-gradient-to-br from-rose-500/20 to-purple-500/30 border-rose-500/50 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.4)]",
          Icon: Server,
          animClass: "animate-pulse",
          showStores: false,
          showBypass: true,
          canClose: false,
        };
      case "system_pause":
        return {
          statusBadge: "إيقاف الخدمة مؤقتاً ⏸️",
          statusBadgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]",
          title: "تم إيقاف المنظومة مؤقتاً",
          subtitle: remoteConfig.systemPauseReason || "تم تجميد العمليات مؤقتاً بناءً على توجيهات إدارة المنظومة.",
          accentGlow: "from-purple-500/20 via-indigo-500/10 to-transparent",
          cardBorder: "border-purple-500/30 shadow-[0_20px_80px_rgba(168,85,247,0.25)]",
          iconBg: "bg-gradient-to-br from-purple-500/20 to-indigo-500/30 border-purple-500/50 text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.4)]",
          Icon: PauseCircle,
          animClass: "animate-pulse",
          showStores: false,
          showBypass: true,
          canClose: false,
        };
      case "new_version":
      default:
        return {
          statusBadge: `ميزات جديدة v${remoteConfig.latestVersion || "1.2.0"}`,
          statusBadgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
          title: `مرحباً بك في الإصدار الجديد v${remoteConfig.latestVersion || "1.2.0"} 🌟`,
          subtitle: "قمنا بإضافة تحسينات وميزات ذكية جبارة لرفع كفاءة تجربتك التعلمية.",
          accentGlow: "from-emerald-500/20 via-teal-500/10 to-transparent",
          cardBorder: "border-emerald-500/30 shadow-[0_20px_80px_rgba(16,185,129,0.25)]",
          iconBg: "bg-gradient-to-br from-emerald-500/20 to-teal-500/30 border-emerald-500/50 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)]",
          Icon: Zap,
          animClass: "animate-pulse",
          showStores: true,
          showBypass: false,
          canClose: true,
        };
    }
  };

  const config = getModalConfig();
  const IconComponent = config.Icon;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-[#040711]/85 backdrop-blur-2xl selection:bg-theme-primary/30"
        dir="rtl"
      >
        {/* Soft Ambient Radial Background Effect */}
        <div className={`absolute inset-0 bg-gradient-to-b ${config.accentGlow} pointer-events-none`} />

        {/* Live Preview Floating Header Flag */}
        {isPreview && (
          <div className="absolute top-4 inset-x-4 max-w-md mx-auto z-50 bg-amber-500/20 border border-amber-500/50 backdrop-blur-md rounded-2xl px-4 py-2 flex items-center justify-between text-xs font-black text-amber-300 shadow-xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span>معاينة مباشرة من لوحة المطور (Live Preview Mode)</span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="px-2.5 py-1 bg-black/40 hover:bg-black/60 text-white rounded-lg transition-colors text-[10px]"
              >
                إغلاق المعاينة
              </button>
            )}
          </div>
        )}

        {/* Glassmorphic Modal Card Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`relative w-full max-w-lg bg-[#0a0f24]/85 backdrop-blur-3xl border ${config.cardBorder} rounded-[2rem] p-6 sm:p-8 space-y-6 text-center text-white overflow-hidden shadow-2xl my-auto`}
        >
          {/* Subtle Corner Glow Orb */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          {/* Optional Close Button for Dismissible Modals */}
          {config.canClose && onClose && (
            <button
              onClick={onClose}
              className="absolute top-5 left-5 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all cursor-pointer z-10"
              title="إغلاق النافذة"
            >
              <X size={18} />
            </button>
          )}

          {/* HEADER SECTION */}
          <div className="space-y-4 relative z-10">
            {/* Glass Icon Halo Badge */}
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
              <div className={`w-20 h-20 rounded-3xl border flex items-center justify-center ${config.iconBg} ${config.animClass}`}>
                <IconComponent size={38} />
              </div>
            </div>

            {/* Status Badge & Version */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className={`px-3.5 py-1.5 rounded-full text-xs font-black border ${config.statusBadgeClass}`}>
                {config.statusBadge}
              </span>
            </div>

            {/* Headline Title & Description */}
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                {config.title}
              </h2>
              <p className="text-xs sm:text-sm text-white/70 font-bold leading-relaxed max-w-md mx-auto">
                {config.subtitle}
              </p>
            </div>
          </div>

          {/* BODY SECTION */}
          <div className="space-y-4 relative z-10 text-right">
            {/* Maintenance Message or System Pause Details */}
            {type === "maintenance" && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-right space-y-2">
                <p className="text-xs text-rose-300 font-bold flex items-center gap-1.5">
                  <Wrench size={14} />
                  <span>بيان الفريق التقني والهندسي:</span>
                </p>
                <p className="text-xs text-white/90 font-bold leading-relaxed whitespace-pre-line bg-black/30 p-3 rounded-xl border border-white/5">
                  {remoteConfig.maintenanceMessage || "جاري إجراء عمليات صيانة وتحديثات سحابية دورية، سنعود للعمل بكفاءة أعلى بأقرب وقت ممكن."}
                </p>
              </div>
            )}

            {type === "system_pause" && (
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-right space-y-3">
                <p className="text-xs text-purple-300 font-bold flex items-center gap-1.5">
                  <Clock size={14} />
                  <span>تفاصيل التوقف المؤقت للخدمة:</span>
                </p>
                <p className="text-xs text-white/90 font-bold leading-relaxed bg-black/30 p-3 rounded-xl border border-white/5">
                  {remoteConfig.systemPauseReason || "الخدمة متوقفة مؤقتاً لأغراض تنظيمية وتحديث البنية التحتية."}
                </p>
                {remoteConfig.systemPauseEta && (
                  <div className="flex items-center gap-2 text-xs font-black text-purple-200">
                    <span className="text-white/50">الوقت المتوقع للعودة:</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/20 border border-purple-500/30 font-mono">
                      {remoteConfig.systemPauseEta}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Updates / Changelog Feature List */}
            {(type === "mandatory_update" || type === "optional_update" || type === "new_version") && changelogPoints.length > 0 && (
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2.5">
                <p className="text-xs text-amber-400 font-black flex items-center gap-1.5">
                  <CheckCircle2 size={15} />
                  <span>أبرز الإضافات والتحديثات الجديدة:</span>
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {changelogPoints.map((point, index) => (
                    <div 
                      key={index} 
                      className="flex items-start gap-2 text-xs text-white/85 font-bold bg-white/[0.03] p-2.5 rounded-xl border border-white/5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                      <span className="leading-relaxed">{point.replace(/^[•\-*]\s*/, "")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Real-time sync indicator for Maintenance */}
            {type === "maintenance" && (
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-white/50 font-bold bg-white/5 rounded-xl border border-white/5">
                <RefreshCw size={14} className="animate-spin text-rose-400 shrink-0" />
                <span>جاري المزامنة السحابية مع السيرفرات تلقائياً...</span>
              </div>
            )}
          </div>

          {/* FOOTER & BUTTONS SECTION */}
          <div className="space-y-3 pt-2 relative z-10">
            {/* Store Buttons for Mandatory & Optional Updates */}
            {config.showStores && (
              <div className="space-y-3">
                {remoteConfig.playStoreUrl && (
                  <a
                    href={remoteConfig.playStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative w-full p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#031526] via-[#092238] to-[#041220] hover:from-[#061d36] hover:to-[#081a2e] border border-emerald-500/40 hover:border-emerald-400 text-white shadow-[0_10px_30px_rgba(0,210,255,0.15)] hover:shadow-[0_15px_40px_rgba(0,210,255,0.3)] hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 cursor-pointer overflow-hidden flex items-center justify-between"
                  >
                    {/* Subtle Ambient Glow Effect inside button */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl group-hover:bg-emerald-500/25 transition-all pointer-events-none" />
                    
                    <div className="flex items-center gap-3.5 relative z-10 text-right">
                      {/* Official Google Play Vector Icon Container */}
                      <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 group-hover:border-emerald-400/80 group-hover:bg-white/15 transition-all p-2.5">
                        <GooglePlayOfficialIcon className="w-full h-full drop-shadow-md" />
                      </div>
                      
                      {/* Store Typography Hierarchy */}
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] sm:text-xs font-bold text-emerald-400/90 tracking-wide">
                          تحديث مباشر ورفع الأداء عبر
                        </span>
                        <span className="text-sm sm:text-base font-black text-white group-hover:text-emerald-300 transition-colors tracking-tight flex items-center gap-1.5">
                          Google Play Store
                        </span>
                      </div>
                    </div>

                    {/* Left Action Indicator Pill */}
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0 group-hover:bg-emerald-400 group-hover:text-black group-hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] transition-all relative z-10">
                      <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                    </div>
                  </a>
                )}

                {remoteConfig.appStoreUrl && (
                  <a
                    href={remoteConfig.appStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative w-full p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#110e2e] via-[#1a1645] to-[#0c0a24] hover:from-[#181342] hover:to-[#120e33] border border-sky-500/40 hover:border-sky-400 text-white shadow-[0_10px_30px_rgba(14,165,233,0.15)] hover:shadow-[0_15px_40px_rgba(14,165,233,0.3)] hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 cursor-pointer overflow-hidden flex items-center justify-between"
                  >
                    {/* Subtle Ambient Glow Effect inside button */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-sky-500/15 rounded-full blur-2xl group-hover:bg-sky-500/25 transition-all pointer-events-none" />
                    
                    <div className="flex items-center gap-3.5 relative z-10 text-right">
                      {/* Official Apple Vector Icon Container */}
                      <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 group-hover:border-sky-400/80 group-hover:bg-white/15 transition-all p-2.5 text-white">
                        <AppleOfficialIcon className="w-full h-full fill-white drop-shadow-md" />
                      </div>
                      
                      {/* Store Typography Hierarchy */}
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] sm:text-xs font-bold text-sky-400/90 tracking-wide">
                          تنزيل التحديث المباشر من
                        </span>
                        <span className="text-sm sm:text-base font-black text-white group-hover:text-sky-300 transition-colors tracking-tight flex items-center gap-1.5">
                          Apple App Store
                        </span>
                      </div>
                    </div>

                    {/* Left Action Indicator Pill */}
                    <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/40 text-sky-300 flex items-center justify-center shrink-0 group-hover:bg-sky-400 group-hover:text-black group-hover:shadow-[0_0_20px_rgba(14,165,233,0.6)] transition-all relative z-10">
                      <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                    </div>
                  </a>
                )}
              </div>
            )}

            {/* Support Buttons for Maintenance / Pause */}
            {(type === "maintenance" || type === "system_pause") && (
              <div className="grid grid-cols-2 gap-3">
                {remoteConfig.supportWhatsapp && (
                  <a
                    href={`https://wa.me/${remoteConfig.supportWhatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-3 bg-emerald-600/80 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg border border-emerald-400/30 transition-all hover:scale-[1.02]"
                  >
                    <PhoneCall size={15} />
                    <span>واتساب الدعم</span>
                  </a>
                )}
                {remoteConfig.supportTelegram && (
                  <a
                    href={remoteConfig.supportTelegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-3 bg-sky-600/80 hover:bg-sky-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg border border-sky-400/30 transition-all hover:scale-[1.02]"
                  >
                    <Globe size={15} />
                    <span>تليجرام الدعم</span>
                  </a>
                )}
              </div>
            )}

            {/* Optional / Dismiss Actions */}
            {config.canClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-bold text-xs rounded-xl border border-white/10 transition-all cursor-pointer"
              >
                {type === "optional_update" ? "تأجيل / ربما لاحقاً ⏳" : "فهمت، استمرار ⚡"}
              </button>
            )}

            {/* Developer Bypass Button */}
            {config.showBypass && onDeveloperBypass && (
              <button
                type="button"
                onClick={onDeveloperBypass}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/80 font-bold text-[11px] rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Lock size={13} />
                <span>تجاوز التحديث ودخول المسؤولين (Developer Bypass)</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

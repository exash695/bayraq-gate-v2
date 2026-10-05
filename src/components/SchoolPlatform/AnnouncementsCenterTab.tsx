import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Megaphone, 
  Search, 
  Building2, 
  UserCheck, 
  Clock, 
  Sparkles, 
  Bell, 
  ShieldCheck, 
  FileText,
  Calendar,
  Filter,
  CheckCircle,
  Inbox,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { broadcastService } from "../../services/broadcastService";
import { matchesBroadcastAudience, isSchoolMatch } from "../../utils/gradeMatcher";
import { BerqCharacter } from "../BerqCharacterManager";

interface AnnouncementsCenterTabProps {
  schoolId: string;
  grade: string;
  section?: string;
  isTeacher?: boolean;
  isParent?: boolean;
  notifications: any[];
  hideHeader?: boolean;
  fullWidth?: boolean;
}

export const AnnouncementsCenterTab: React.FC<AnnouncementsCenterTabProps> = ({
  schoolId,
  grade,
  section,
  isTeacher,
  isParent = false,
  notifications = [],
  hideHeader = false,
  fullWidth = false
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"admin" | "staff" | "all">("admin");
  const [searchQuery, setSearchQuery] = useState("");
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Date filter state (مطابق لتبويب سجل الحضور)
  const todayStr = useMemo(() => {
    try {
      return new Date().toISOString().split("T")[0];
    } catch {
      return "2026-10-05";
    }
  }, []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [isDateFilterActive, setIsDateFilterActive] = useState<boolean>(false);

  // Read/seen status for badge disappearance upon opening using broadcast IDs
  const [readBroadcastIds, setReadBroadcastIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("bairaq_read_broadcast_ids");
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.filter(id => typeof id === "string") : [];
      }
      return [];
    } catch {
      return [];
    }
  });

  const isItemRead = useCallback((item: any) => {
    if (!item) return true;
    if (item.read === true) return true;
    if (item.id && Array.isArray(readBroadcastIds) && readBroadcastIds.includes(String(item.id))) return true;
    return false;
  }, [readBroadcastIds]);

  // Safe helper to extract milliseconds from various timestamp formats
  const getSafeTimestamp = (val: any): number => {
    if (!val) return 0;
    if (typeof val === "number") return isNaN(val) ? 0 : val;
    if (typeof val?.toMillis === "function") return val.toMillis();
    if (typeof val?.seconds === "number") return val.seconds * 1000;
    if (typeof val?._seconds === "number") return val._seconds * 1000;
    if (val instanceof Date) return val.getTime();
    if (typeof val === "string") {
      const parsed = new Date(val).getTime();
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // 1. Subscribe to administrative & school radio announcements
  useEffect(() => {
    setIsLoading(true);
    const currentSchoolId = schoolId || "school1";

    const unsub = broadcastService.subscribeToBroadcasts(currentSchoolId, (allData) => {
      try {
        const filtered = (allData || [])
          .filter((b: any) => {
            if (!b) return false;
            // Exclude global celebration items that are solely for the celebrations popup modal
            if (b.type === "global_celebration" && b.targetLocation === "popup") return false;
            return true; // We show both ticker, both, post, etc.
          })
          .filter((b: any) => {
            // School check
            const bSchool = b.schoolId || b.school_id;
            if (!isSchoolMatch(currentSchoolId, bSchool)) return false;

            // Expiry check
            const now = Date.now();
            const expMs = getSafeTimestamp(b.expiryDate || b.expiry_date);
            if (expMs > 0 && expMs < now) return false;

            // Audience & Section Matching
            const audienceMatches = matchesBroadcastAudience(b, {
              grade,
              section,
              className: section && grade ? `${grade} ${section}` : (section || grade),
              isTeacher,
              isParent
            });
            return audienceMatches;
          })
          .sort((a: any, b: any) => {
            const timeA = getSafeTimestamp(a.timestampMs || a.timestamp_ms || a.createdAt);
            const timeB = getSafeTimestamp(b.timestampMs || b.timestamp_ms || b.createdAt);
            return timeB - timeA;
          });
        setBroadcasts(filtered);
      } catch (err) {
        console.warn("Announcements filter error:", err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsub();
  }, [schoolId, grade, section, isTeacher, isParent]);

  // 2. Classify announcements into Admin (Radio/Administration/Finance) vs Teachers (Control panel)
  const isTeacherItem = (item: any) => {
    if (!item) return false;
    const authorRaw = item.author || item.metadata?.senderName || item.metadata?.teacherName || "";
    const author = typeof authorRaw === "string" ? authorRaw.toLowerCase() : String(authorRaw || "").toLowerCase();
    
    const subjectRaw = item.subject || item.metadata?.subject || "";
    const subject = typeof subjectRaw === "string" ? subjectRaw.toLowerCase() : String(subjectRaw || "").toLowerCase();
    
    const typeRaw = item.type || item.metadata?.type || "";
    const type = typeof typeRaw === "string" ? typeRaw.toLowerCase() : String(typeRaw || "").toLowerCase();
    
    const msgRaw = item.message || item.body || item.title || "";
    const msg = typeof msgRaw === "string" ? msgRaw.toLowerCase() : String(msgRaw || "").toLowerCase();

    // Explicit Administration & Finance keywords & types -> ALWAYS Admin
    if (
      author.includes("إدارة") || 
      author.includes("ادارة") || 
      author.includes("الإذاعة") || 
      author.includes("اذاعة") || 
      author.includes("المالية") || 
      author.includes("الحسابات") ||
      author.includes("الأكاديمية") ||
      author.includes("الأقساط") ||
      author.includes("مدير") ||
      author.includes("مستخدم") ||
      author === "user" ||
      author === "admin" ||
      type.includes("admin") ||
      type.includes("broadcast") ||
      type.includes("ticker") ||
      type.includes("school") ||
      type.includes("finance") ||
      type.includes("payment") ||
      type.includes("installment") ||
      item.isSchoolBroadcast === true ||
      item.is_school_broadcast === true
    ) {
      return false;
    }
    if (
      subject.includes("إذاعة") || 
      subject.includes("اذاعة") || 
      subject.includes("إداري") || 
      subject.includes("مالي") || 
      subject.includes("قسط") || 
      subject.includes("أقساط") ||
      subject.includes("رسوم")
    ) {
      return false;
    }
    if (
      type.includes("admin") || 
      type.includes("finance") || 
      type.includes("payment") || 
      type.includes("installment")
    ) {
      return false;
    }
    if (
      msg.includes("قسطك") || 
      msg.includes("الأقساط") || 
      msg.includes("الدفعة") || 
      msg.includes("تسديد") || 
      msg.includes("القسم المالي") ||
      msg.includes("الإذاعة المدرسية")
    ) {
      return false;
    }

    // Explicit Teacher markers (from Teacher Control Panel)
    if (
      item.metadata?.isTeacher || 
      item.isTeacher || 
      type.includes("teacher") || 
      author.startsWith("أ.") || 
      author.startsWith("الاستاذ") || 
      author.startsWith("الأستاذ") || 
      author.startsWith("المعلم") || 
      author.startsWith("المعلمة") || 
      author.startsWith("الست") ||
      (author !== "" && author !== "كادر المدرسة 🎓" && author !== "كادر المدرسة" && !author.includes("إدارة"))
    ) {
      return true;
    }

    // If subject is an academic course -> Teacher announcement
    const academicSubjects = ["رياضيات", "فيزياء", "كيمياء", "أحياء", "احياء", "عربي", "لغة عربية", "انجليزي", "لغة انكليزية", "اسلامية", "تربية اسلامية", "حاسوب", "اجتماعيات", "تاريخ", "جغرافيا", "وطنية", "علوم", "قرآن", "واجب", "امتحان", "كويز", "تحضير"];
    if (academicSubjects.some(sub => subject.includes(sub))) {
      return true;
    }

    return false;
  };

  // Map notifications
  const mappedNotifications = useMemo(() => {
    return (notifications || []).map(n => {
      if (!n) return null;
      const isTeacher = isTeacherItem(n);
      const titleStr = typeof n.title === "string" ? n.title : "";
      const bodyStr = typeof n.body === "string" ? n.body : "";
      const isFinance = bodyStr.includes('قسط') || bodyStr.includes('تسديد') || titleStr.includes('قسط');
      const nAuthor = n.metadata?.senderName || n.metadata?.teacherName || n.author || "";
      const isAuthorDefault = !nAuthor || nAuthor === "مستخدم" || nAuthor === "مستخدم 🏛️" || nAuthor === "مستخدم 🎓" || nAuthor === "user" || nAuthor === "admin";
      
      const cleanAuthor = isAuthorDefault
        ? (isTeacher ? "أستاذ المادة 🎓" : isFinance ? "القسم المالي والإداري 🏛️" : "الإدارة المدرسية 🏛️")
        : (typeof nAuthor === "string" ? nAuthor : String(nAuthor || ""));

      return {
        id: String(n.id || Math.random()),
        message: bodyStr || titleStr || (typeof n.message === "string" ? n.message : ""),
        title: titleStr,
        author: cleanAuthor,
        subject: isTeacher ? (n.metadata?.subject || "تبليغ صفي") : (isFinance ? "متابعة الأقساط والرسوم" : "تبليغ إداري رسمي"),
        createdAt: n.createdAt,
        timestampMs: getSafeTimestamp(n.timestampMs || n.timestamp_ms || n.createdAt) || Date.now(),
        read: n.read || (n.id && Array.isArray(readBroadcastIds) ? readBroadcastIds.includes(String(n.id)) : false),
        type: isTeacher ? "staff" : "admin"
      };
    }).filter(Boolean);
  }, [notifications, readBroadcastIds]);

  // Combined broadcasts + notifications categorized accurately
  const { adminItems, staffItems } = useMemo(() => {
    const adminList: any[] = [];
    const staffList: any[] = [];

    // Process broadcasts
    (broadcasts || []).forEach(b => {
      if (!b) return;
      const isTeacher = isTeacherItem(b);
      const bAuthor = b.author || b.metadata?.senderName || b.metadata?.teacherName || "";
      const isAuthorDefault = !bAuthor || bAuthor === "مستخدم" || bAuthor === "مستخدم 🏛️" || bAuthor === "مستخدم 🎓" || bAuthor === "user" || bAuthor === "admin";
      
      const cleanAuthor = isAuthorDefault 
        ? (isTeacher ? "أستاذ المادة 🎓" : "الإدارة المدرسية 🏛️")
        : (typeof bAuthor === "string" ? bAuthor : String(bAuthor || ""));

      const messageContent = typeof b.message === "string" ? b.message : (typeof b.body === "string" ? b.body : (typeof b.title === "string" ? b.title : ""));

      if (isTeacher) {
        staffList.push({
          ...b,
          type: "staff",
          author: cleanAuthor,
          message: messageContent,
          subject: b.subject || "تبليغ صفي",
          timestampMs: getSafeTimestamp(b.timestampMs || b.timestamp_ms || b.createdAt) || Date.now()
        });
      } else {
        adminList.push({
          ...b,
          type: "admin",
          author: cleanAuthor,
          message: messageContent,
          subject: b.subject || "الإذاعة المدرسية 📻",
          timestampMs: getSafeTimestamp(b.timestampMs || b.timestamp_ms || b.createdAt) || Date.now()
        });
      }
    });

    // Process notifications
    mappedNotifications.forEach((n: any) => {
      if (!n) return;
      if (n.type === "staff") {
        staffList.push(n);
      } else {
        adminList.push(n);
      }
    });

    return { adminItems: adminList, staffItems: staffList };
  }, [broadcasts, mappedNotifications]);

  const unreadAdminCount = useMemo(() => {
    return adminItems.filter(item => !isItemRead(item)).length;
  }, [adminItems, isItemRead]);

  const unreadStaffCount = useMemo(() => {
    return staffItems.filter(item => !isItemRead(item)).length;
  }, [staffItems, isItemRead]);

  // Mark items as read based on current sub-tab
  useEffect(() => {
    let changed = false;
    if (activeSubTab === "admin") {
      const unreadAdminIds = adminItems
        .filter(item => !isItemRead(item) && item.id)
        .map(item => String(item.id));
      if (unreadAdminIds.length > 0) {
        setReadBroadcastIds(prev => {
          const currentArr = Array.isArray(prev) ? prev : [];
          const next = [...new Set([...currentArr, ...unreadAdminIds])];
          try {
            localStorage.setItem("bairaq_read_broadcast_ids", JSON.stringify(next));
          } catch {}
          return next;
        });
        changed = true;
      }
    } else if (activeSubTab === "staff") {
      const unreadStaffIds = staffItems
        .filter(item => !isItemRead(item) && item.id)
        .map(item => String(item.id));
      if (unreadStaffIds.length > 0) {
        setReadBroadcastIds(prev => {
          const currentArr = Array.isArray(prev) ? prev : [];
          const next = [...new Set([...currentArr, ...unreadStaffIds])];
          try {
            localStorage.setItem("bairaq_read_broadcast_ids", JSON.stringify(next));
          } catch {}
          return next;
        });
        changed = true;
      }
    }

    if (changed) {
      window.dispatchEvent(new CustomEvent("bairaq_announcements_read"));
    }
  }, [activeSubTab, adminItems, staffItems, isItemRead]);

  // 3. Combined & Searched items list
  const displayItems = useMemo(() => {
    let combined: any[] = [];
    if (activeSubTab === "admin") {
      combined = [...adminItems];
    } else if (activeSubTab === "staff") {
      combined = [...staffItems];
    } else {
      combined = [...adminItems, ...staffItems];
    }

    // Sort by timestamp
    combined.sort((a, b) => {
      const timeA = getSafeTimestamp(a.timestampMs || a.timestamp_ms || a.createdAt);
      const timeB = getSafeTimestamp(b.timestampMs || b.timestamp_ms || b.createdAt);
      return timeB - timeA;
    });

    // Apply date filter if active (مطابق لسجل الحضور)
    if (isDateFilterActive && selectedDate) {
      combined = combined.filter(item => {
        const ts = getSafeTimestamp(item.timestampMs || item.timestamp_ms || item.createdAt);
        if (!ts) return false;
        try {
          const d = new Date(ts);
          if (isNaN(d.getTime())) return false;
          const itemDateStr = d.toISOString().split("T")[0];
          return itemDateStr === selectedDate;
        } catch {
          return false;
        }
      });
    }

    // Apply search filter
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      combined = combined.filter(item => {
        const msg = String(item.message || item.body || "").toLowerCase();
        const sub = String(item.subject || "").toLowerCase();
        const tit = String(item.title || "").toLowerCase();
        const aut = String(item.author || "").toLowerCase();
        return msg.includes(q) || sub.includes(q) || tit.includes(q) || aut.includes(q);
      });
    }

    return combined;
  }, [activeSubTab, adminItems, staffItems, searchQuery, isDateFilterActive, selectedDate]);

  // Helper to format date
  const formatTimeAgo = (item: any) => {
    const ts = getSafeTimestamp(item.timestampMs || item.timestamp_ms || item.createdAt) || Date.now();
    const seconds = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    
    if (seconds < 60) return "الآن ⚡";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `قبل ${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `قبل ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "أمس";
    if (days === 2) return "قبل يومين";
    return `قبل ${days} أيام`;
  };

  return (
    <div className={hideHeader ? (fullWidth ? "w-full text-right p-0 m-0" : "w-full text-right") : "w-full h-full bg-[#050A18] text-right overflow-y-auto no-scrollbar pb-24 px-4 md:px-6 pt-4"} dir="rtl">
      
      {/* 📣 Premium Megaphone Header Banner (100% Aligned with Student/Teacher Board style) */}
      {!hideHeader && (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#0a2342] via-[#0D47A1] to-[#0D47A1] relative overflow-hidden h-[125px] sm:h-[135px] mb-6 flex items-center justify-between shadow-lg shadow-indigo-950/20">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a2342] via-[#0D47A1] to-[#0D47A1] opacity-90" />
          <div className="absolute top-0 left-0 w-36 h-36 bg-[#FFD600]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Bairaq Video Companion on the LEFT side - Spans edge to edge */}
          <div className="absolute left-0 top-0 bottom-0 h-full w-32 sm:w-36 md:w-40 z-10 overflow-hidden rounded-l-2xl flex items-center justify-center">
            <div className="absolute -left-4 -top-4 w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-amber-400/30 bg-amber-400/5 shadow-[0_0_15px_rgba(255,214,0,0.15)] animate-pulse" />
            <BerqCharacter
              pose="pose_broadcaster"
              glowColor="cyan"
              className="w-full h-full object-cover relative z-10 scale-110"
            />
            <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-r from-transparent to-[#0D47A1] z-20 pointer-events-none" />
          </div>

          {/* Header Title & Subtitle */}
          <div className="relative z-10 flex-1 flex flex-col justify-center pr-6 pl-32 sm:pl-36 md:pl-40 py-2 select-none text-right h-full min-w-0">
            <h2 className="text-white text-base sm:text-lg md:text-xl font-black leading-tight drop-shadow-md truncate flex items-center gap-2">
              <span>مركز التبليغات والإعلانات 📢</span>
              <span className="text-[9px] font-black text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/30 uppercase tracking-widest animate-pulse">مباشر ومحدث</span>
            </h2>
            <div className="flex items-center gap-1 text-[#FFD600] font-bold text-xs sm:text-sm tracking-wide drop-shadow-sm mt-0.5 min-w-0">
              <span className="shrink-0 text-xs">🏛️</span>
              <span className="truncate">السجل المركزي الشامل لتبليغات الإدارة والأساتذة</span>
            </div>
            <div className="flex items-center gap-1 text-white/85 font-semibold text-[11px] sm:text-xs tracking-wide drop-shadow-sm mt-0.5 min-w-0">
              <span className="shrink-0 text-[10px]">📻</span>
              <span className="truncate">شاشة موحدة لمتابعة التوجيهات اليومية وإعلانات الإذاعة المدرسية فورياً!</span>
            </div>
          </div>
        </div>
      )}

      {/* 🔍 Filter & Search Bar Section */}
      <div className={fullWidth ? "flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#070D1E]/95 border-b border-white/10 px-4 sm:px-6 py-3.5 backdrop-blur-xl mb-0 w-full sticky top-0 z-20 rounded-none" : "flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl backdrop-blur-xl mb-6"}>
        
        {/* Sub-tab Selectors */}
        <div className="flex flex-wrap items-center gap-2 select-none">
          <div className="flex p-1 bg-black/40 rounded-xl border border-white/10 w-fit shrink-0 gap-1 select-none">
            <button
              onClick={() => {
                if (typeof window !== "undefined" && (window as any).sounds?.playClick) (window as any).sounds.playClick();
                setActiveSubTab("admin");
              }}
              className={`px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === "admin"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/15"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <Building2 size={13} />
              <span>إعلانات الإدارة 🏛️</span>
              {activeSubTab !== "admin" && unreadAdminCount > 0 && (
                <span className="px-1.5 h-4 text-[9px] font-bold rounded-full flex items-center justify-center bg-rose-600 text-white animate-pulse">
                  {unreadAdminCount}
                </span>
              )}
            </button>
            
            <button
              onClick={() => {
                if (typeof window !== "undefined" && (window as any).sounds?.playClick) (window as any).sounds.playClick();
                setActiveSubTab("staff");
              }}
              className={`px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === "staff"
                  ? "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/15"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <UserCheck size={13} />
              <span>تبليغات الأساتذة 🎓</span>
              {activeSubTab !== "staff" && unreadStaffCount > 0 && (
                <span className="px-1.5 h-4 text-[9px] font-bold rounded-full flex items-center justify-center bg-rose-600 text-white animate-pulse">
                  {unreadStaffCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                if (typeof window !== "undefined" && (window as any).sounds?.playClick) (window as any).sounds.playClick();
                setActiveSubTab("all");
              }}
              className={`px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === "all"
                  ? "bg-white/10 text-white border border-white/10"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <Inbox size={13} />
              <span>الكل 📬</span>
            </button>
          </div>

          {/* Date Picker & Fast Navigator with arrows (مزود بأسهم لعرض التاريخ كما في تبويب سجل الحضور) */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setIsDateFilterActive(true);
                const prev = new Date(selectedDate);
                prev.setDate(prev.getDate() - 1);
                setSelectedDate(prev.toISOString().split("T")[0]);
              }}
              title="اليوم السابق"
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronRight size={15} />
            </button>

            <div className="px-2 flex items-center gap-1.5">
              <Calendar size={13} className="text-cyan-400 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setIsDateFilterActive(true);
                }}
                className="bg-transparent text-xs font-bold text-cyan-200 outline-none cursor-pointer [color-scheme:dark]"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setIsDateFilterActive(true);
                const next = new Date(selectedDate);
                next.setDate(next.getDate() + 1);
                setSelectedDate(next.toISOString().split("T")[0]);
              }}
              title="اليوم التالي"
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronLeft size={15} />
            </button>

            {isDateFilterActive && (
              <button
                type="button"
                onClick={() => setIsDateFilterActive(false)}
                className="px-2 py-0.5 text-[10px] font-bold text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 rounded-md border border-amber-400/20 transition-all cursor-pointer mr-0.5"
                title="عرض كافة التواريخ"
              >
                عرض الكل
              </button>
            )}
          </div>
        </div>

        {/* Real-time Search input */}
        <div className="relative w-full lg:max-w-xs">
          <input
            type="text"
            placeholder="ابحث عن إعلان، أستاذ، أو موضوع..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#030610] text-white text-xs font-bold px-4 py-2.5 pr-10 rounded-xl border border-white/10 focus:border-cyan-500/50 outline-none transition-all placeholder:text-white/20 text-right"
          />
          <Search size={14} className="absolute top-1/2 -translate-y-1/2 right-3 text-white/30 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute top-1/2 -translate-y-1/2 left-3 text-white/40 hover:text-white text-[10px] font-bold cursor-pointer"
            >
              مسح
            </button>
          )}
        </div>
      </div>

      {/* 📋 Central Grid List of Announcements */}
      <div className="pb-16">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xs text-white/40 font-bold">جاري تحميل وتحديث سجل الإعلانات المعتمدة...</p>
          </div>
        ) : displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white/[0.01] border border-white/5 rounded-3xl p-8">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20 mb-4 animate-bounce">
              <Megaphone size={28} />
            </div>
            <h3 className="text-base font-black text-white/80">السجل هادئ وفارغ حالياً ✨</h3>
            <p className="text-xs text-white/40 font-bold mt-1.5 max-w-sm leading-relaxed">
              {searchQuery 
                ? "لا توجد نتائج تطابق بحثك المكتوب، جرب كلمات مفتاحية أخرى!" 
                : isDateFilterActive
                  ? `لا توجد تبليغات منشورة بتاريخ ${selectedDate}.`
                  : "لم يتم نشر أي تبليغات رسمية في هذا القسم للدوائر المحددة بعد."}
            </p>
            {isDateFilterActive && (
              <button
                type="button"
                onClick={() => setIsDateFilterActive(false)}
                className="mt-3 px-3 py-1.5 text-xs font-bold text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl transition-all cursor-pointer"
              >
                عرض كافة التواريخ 📅
              </button>
            )}
          </div>
        ) : (
          <div className={fullWidth ? "flex flex-col divide-y divide-white/10 w-full p-0 m-0" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
            <AnimatePresence mode="popLayout">
              {displayItems.map((item, idx) => {
                const isAdminType = item.type === "admin";
                
                return (
                  <motion.div
                    key={`ann_${item.id || idx}`}
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.4) }}
                    className={fullWidth
                      ? `relative px-4 sm:px-6 py-5 w-full transition-all flex flex-col justify-between overflow-hidden border-0 rounded-none shadow-none m-0 ${
                          isAdminType
                            ? "bg-gradient-to-r from-[#0b142c]/90 via-[#091024]/90 to-[#070c1c]/90 hover:from-[#0e1b3d]/90 hover:to-[#0a1428]/90"
                            : "bg-gradient-to-r from-[#120d2e]/90 via-[#0d0924]/90 to-[#070c1c]/90 hover:from-[#191340]/90 hover:to-[#0a1428]/90"
                        }`
                      : `relative p-5 rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-lg ${
                          isAdminType
                            ? "bg-[#0b122b]/50 hover:bg-[#0e1b3d]/60 border-cyan-500/20 hover:border-cyan-500/35"
                            : "bg-[#110e2d]/50 hover:bg-[#18143d]/60 border-purple-500/20 hover:border-purple-500/35"
                        }`
                    }
                  >
                    {/* Visual Glowing Edge Indicator */}
                    <div className={`absolute top-0 bottom-0 right-0 w-[4px] ${isAdminType ? "bg-gradient-to-b from-cyan-400 to-blue-500" : "bg-gradient-to-b from-purple-400 to-fuchsia-500"}`} />
                    
                    <div className="space-y-3.5 pr-2">
                      <div className="flex items-center justify-between">
                        
                        {/* Author Info */}
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isAdminType ? "bg-cyan-500/10 text-cyan-400" : "bg-purple-500/10 text-purple-400"}`}>
                            {isAdminType ? <Building2 size={14} /> : <UserCheck size={14} />}
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-black text-white/90 block leading-tight">
                              {item.author || (isAdminType ? "إدارة الأكاديمية 🏛️" : "أستاذ المادة 🎓")}
                            </span>
                            <span className="text-[8px] text-white/40 font-bold block mt-0.5">
                              {isAdminType ? "تبليغ مركزي عام" : "تبليغ صفي فوري"}
                            </span>
                          </div>
                        </div>

                        {/* Top Accent Badges */}
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${
                            isAdminType 
                              ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20" 
                              : "bg-purple-500/10 text-purple-300 border-purple-500/20"
                          }`}>
                            {item.subject || "الإذاعة المدرسية 📻"}
                          </span>
                        </div>
                      </div>

                      {/* Announcement Message Content */}
                      <div className="text-right">
                        <p className="text-[11.5px] font-semibold text-white/90 leading-relaxed font-sans whitespace-pre-line break-words">
                          {typeof item.message === 'string' ? item.message : typeof item.body === 'string' ? item.body : String(item.message || item.body || '')}
                        </p>
                      </div>
                    </div>

                    {/* Footer Info */}
                    <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-white/5 pr-2 select-none">
                      <div className="flex items-center gap-1 text-[9px] text-white/35 font-bold font-mono">
                        <Clock size={10} className="text-white/40" />
                        <span>{formatTimeAgo(item)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-[8.5px] text-[#00E5FF] font-black flex items-center gap-1">
                          <Sparkles size={9} />
                          {isAdminType ? "موثق من الإدارة 🛡️" : "تبليغ الأستاذ المباشر"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

    </div>
  );
};

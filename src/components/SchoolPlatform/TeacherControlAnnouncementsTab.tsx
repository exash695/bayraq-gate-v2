import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { motion, AnimatePresence } from 'motion/react';
import { useWebRTCStream } from '../../hooks/useWebRTCStream';
import { sounds } from "../../lib/sounds";
import { GlobalAnnouncementsBanner } from '../GlobalAnnouncementsBanner';
import { GlobalAnnouncementsPopup } from '../GlobalAnnouncementsPopup';
import { useRemoteConfig } from '../../services/remoteConfig';
import { SeasonalThemeBanner } from "../SeasonalThemeBanner";
import { TeacherAIAssistant } from "../TeacherAIAssistant";
import { copyToClipboard } from "../../utils/clipboard";
import { AIEnhancedRadar } from "../AIEnhancedRadar";
import { AIQuestionAssistantModal } from "../AIQuestionAssistantModal";
import { AIPaperExtractorModal } from "../AIPaperExtractorModal";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  serverTimestamp,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
  setDoc,
  increment,
  updateDoc,
  deleteDoc,
  arrayUnion,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  db,
  auth,
  storage,
} from "../../lib/firebase";
import { handleFirestoreError, OperationType } from "../../lib/firestoreUtils";
import { academicService } from "../../services/academicService";
import { compressImage } from "../../utils/imageCompressor";
import {
  computeExcellencePoints,
  computeAcademicIdentity,
  getLevelData,
  OUTSTANDING_BADGES,
  getSubjectsForGrade,
} from "../../utils/studentUtils";
import {
  Rss, FolderOpen, Megaphone, GraduationCap, ArrowRight, Star, LayoutGrid, BookOpen,
  Award, Trophy, Crown, Languages, Sigma, Zap, Laptop, Calculator, Globe, Palette,
  Briefcase, Library, Dna, Earth, Atom, Variable, Book, FlaskConical, Microscope,
  ScrollText, User, ShieldCheck, Users, Pin, Lock, Bell, Sparkles, Feather, Compass,
  Landmark, LineChart, Plus, Activity, BookOpenText, AlertCircle, Shirt, Camera,
  MonitorPlay, Layers, FileUp, FileText, CheckCircle, Video, Radio, Edit2, Trash2,
  Coffee, RefreshCw, FlipHorizontal, Upload, Eye, Save, Heart, MessageCircle, Share2,
  MoreHorizontal, Image as ImageIcon, School as SchoolIcon, Calendar, X, ChevronLeft,
  ChevronRight, ChevronDown, ChevronUp, Mic, MicOff, VideoOff, ThumbsUp, Send, Clock,
  HelpCircle, Hand as HandIcon, PenTool, Search, Filter, MailQuestion, ShieldAlert,
  Database, Bot, ClipboardCheck, Play, Target, Terminal, Bug, Info, Unlock, Download,
  Minimize2, Scan, XCircle, MessageSquare
} from "lucide-react";
import { SchoolContent } from "../SchoolContent";
import { BroadcastTicker } from "../BroadcastTicker";
import { StudentLounge } from "../StudentLounge";
import { StudentSupportForm } from "../StudentSupportForm";
import { StudentSchedule } from "../StudentSchedule";
import { ScheduleAlerter } from "../ScheduleAlerter";
import { ConfirmDialog } from "../ConfirmDialog";
import StrictContentViewer from "../StrictContentViewer";
import { Station1Viewer } from "../Station1Viewer";
import { SixthAcademyPro } from "../SixthAcademyPro";
import { TransformerLogsViewer } from "../TransformerLogsViewer";
import { BerqCharacter } from "../BerqCharacterManager";
import { safeStorage, safeSessionStorage } from '../../lib/storage';
import { processPdfInForeground, parseLiteralTextToBlocks } from "../../utils/pdfProcessor";
import { SixtySecondChallenge } from "../SixtySecondChallenge";
import { TeacherQuestionBank } from "../TeacherQuestionBank";
import DevDashboard from "../DevDashboard";
import { VerticalScrollPicker } from "./VerticalScrollPicker";
import { RevealBlock, RenderTextWithTags } from "./RevealBlock";
import { VideoComments } from "./VideoComments";
import { PostCommentsSection } from "./PostCommentsSection";
import { pushSocialNotification } from "./SocialNotifications";
import {
  sanitizeForFirestore,
  stopStoryAudio,
  playStoryAudio,
  initStoryAudioContext,
  getSimulatedFileContent,
  generateQuestionsForDocument,
  getSanitizedVideoUrl,
} from "./utils";
import type { Teacher, MaterialField, Post, SchoolPlatformProps, PlatformTab, HandRaiseRequest, LiveQuestion } from "./types";
import { useSchoolPlatform } from "./SchoolPlatformContext";

export const TeacherControlAnnouncementsTab: React.FC = () => {
  const { 
    announcementDays, 
    announcementHours, 
    announcementText, 
    resolvedSchoolId, 
    schoolId, 
    selectedTeacherClass,
    setAnnouncementDays, 
    setAnnouncementHours, 
    setAnnouncementText, 
    showToast, 
    targetBroadcastGrade, 
    teacherAssignedSections,
    teacherBroadcasts, 
    teacherData 
  } = useSchoolPlatform();

  const isAllSections = !selectedTeacherClass || selectedTeacherClass === 'ALL' || selectedTeacherClass === 'كافة الشُعب';
  const targetLabel = isAllSections ? "كافة الشُعب الموكلة" : selectedTeacherClass;

  const displayedBroadcasts = (teacherBroadcasts || []).filter((item: any) => {
    if (isAllSections) return true;
    if (item.targetSection && item.targetSection !== 'ALL') {
      return item.targetSection === selectedTeacherClass;
    }
    if (item.targetSections && Array.isArray(item.targetSections)) {
      return item.targetSections.includes(selectedTeacherClass) || item.targetSections.includes('ALL');
    }
    return true;
  });

  return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Col: Broadcast Message */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-[#0E152D]/60 border border-white/5 p-6 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">
                          بث إعلان عاجل في شريط التنبيهات للطلاب
                        </h3>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-black">
                          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                          <span>الوجهة: {targetLabel}</span>
                        </div>
                      </div>

                      {/* Active target banner */}
                      <div className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-3 flex items-center justify-between text-right" dir="rtl">
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-black text-purple-300 block">
                            📡 نطاق الإرسال المتزامن: {targetLabel}
                          </span>
                          <span className="text-[9px] text-white/50 font-bold block">
                            {isAllSections 
                              ? `سيظهر هذا الإعلان في أشرطة شاشات جميع الطلاب في كل شُعبك الموكلة (${teacherAssignedSections?.length || 0} شُعب)` 
                              : `سيظهر هذا الإعلان فقط لطلاب (${selectedTeacherClass}) في شريطهم اللحظي`}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-purple-300 border border-white/5">
                          {isAllSections ? 'بث جماعي' : 'بث شعبة'}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-white/40 font-bold block">
                          نص الإعلان أو التوجيه الهام للفرسان
                        </label>
                        <textarea
                          rows={3}
                          value={announcementText}
                          onChange={(e) => setAnnouncementText(e.target.value)}
                          placeholder="مثال: تنبيه عاجل لفرسان السادس الإعدادي: سيتم بدء البث مراجعة قواعد الوحدة الأولى بعد حوالي 15 دقيقة من الآن المرجو التحضير!"
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-purple-500/40 transition-all font-sans resize-none leading-relaxed font-semibold"
                        />
                      </div>

                      <div className="space-y-1.5 p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <label className="text-[10px] text-purple-300 font-extrabold block text-center">
                          تحديد مـدة بقاء الإعـلان وتوقيت الاختفاء الـتلقائي ⏱️
                        </label>
                        <div className="flex justify-center items-center gap-12 py-2">
                          <VerticalScrollPicker 
                            value={announcementHours} 
                            onChange={setAnnouncementHours} 
                            min={0} 
                            max={23} 
                            label="ساعات" 
                          />
                          <VerticalScrollPicker 
                            value={announcementDays} 
                            onChange={setAnnouncementDays} 
                            min={0} 
                            max={30} 
                            label="أيام" 
                          />
                        </div>
                        <p className="text-[9px] text-white/40 text-center font-bold">
                          💡 متبقي الإعلان: 
                          <span className="text-purple-400 mx-1">
                            {announcementDays > 0 ? `${announcementDays} يوم ` : ""}
                            {announcementHours > 0 ? `${announcementHours} ساعة` : ""}
                            {announcementDays === 0 && announcementHours === 0 ? "ساعة واحدة (حد أدنى تلقائي)" : ""}
                          </span>
                          ثم يختفي تماماً من شريط الطلاب.
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex gap-1.5">
                          {["📢 عاجل:", "⭐ تنبيه:", "🎯 هام جداً:"].map(
                            (prefix) => (
                              <button
                                key={prefix}
                                onClick={() =>
                                  setAnnouncementText(
                                    prefix + " " + announcementText,
                                  )
                                }
                                className="px-2 py-1 bg-white/5 hover:bg-white/10 text-[9px] text-white/75 font-semibold rounded-lg border border-white/5 transition-all cursor-pointer"
                              >
                                {prefix}
                              </button>
                            ),
                          )}
                        </div>

                        <button
                          onClick={() => {
                            if (!announcementText.trim()) {
                              showToast(
                                "يرجى كتابة نص الإعلان أولاً قبل البث",
                                "error",
                              );
                              return;
                            }
                            const tName = teacherData?.name || "أستاذ المادة";
                            const tSubject = teacherData?.subject || "مادة عامة";
                            const formattedMessage = `📢 [الأستاذ ${tName} - مادة ${tSubject}]: ${announcementText}`;

                            const durationHours = (announcementDays * 24) + announcementHours || 1;

                            const targetSectionsList = isAllSections
                              ? (teacherAssignedSections || []).map((s: any) => s.name).filter(Boolean)
                              : [selectedTeacherClass];
                            const targetGradesList = isAllSections
                              ? Array.from(new Set((teacherAssignedSections || []).map((s: any) => s.grade || s.name).filter(Boolean)))
                              : [targetBroadcastGrade || selectedTeacherClass];

                            const handlePost = async () => {
                              try {
                                await addDoc(collection(db, "broadcasts"), {
                                  message: formattedMessage,
                                  rawText: announcementText,
                                  author: tName,
                                  subject: tSubject,
                                  targetSection: isAllSections ? "ALL" : selectedTeacherClass,
                                  targetSections: targetSectionsList,
                                  targetSectionLabel: targetLabel,
                                  targetGrades: targetGradesList.length > 0 ? targetGradesList : [targetBroadcastGrade || "الجميع"],
                                  schoolId: resolvedSchoolId,
                                  type: 'school_broadcast',
                                  isSchoolBroadcast: true,
                                  targetLocation: 'ticker',
                                  isCentralPlatform: false,
                                  expiryDate: Date.now() + durationHours * 3600 * 1000,
                                  timestamp: serverTimestamp(),
                                  timestampMs: Date.now()
                                });
                                showToast(
                                  `تم بث ونشر الإعلان فوراً إلى (${targetLabel})! 📡`,
                                  "success",
                                );
                                setAnnouncementText("");
                              } catch (e) {
                                console.error("Error creating broadcast:", e);
                                showToast("حدث خطأ أثناء بث الإعلان", "error");
                              }
                            };
                            handlePost();
                          }}
                          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(147,51,234,0.1)] cursor-pointer"
                        >
                          إرسال وبث الآن
                        </button>
                      </div>
                    </div>

                    {/* Previews */}
                    <div className="bg-[#0E152D]/30 border border-white/5 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                        <h4 className="text-[11px] text-white/50 font-black">
                          أشرطة عواجل البوابة النشطة حالياً لبوابتك
                        </h4>
                        <span className="text-[10px] text-purple-300 font-bold">
                          المعروض: {targetLabel} ({displayedBroadcasts.length})
                        </span>
                      </div>
                      <div className="space-y-2">
                        {displayedBroadcasts.length === 0 ? (
                          <div className="text-center p-6 text-white/30 text-xs">
                            لا توجد إعلانات عاجلة نشطة حالياً لـ ({targetLabel}).
                          </div>
                        ) : (
                          displayedBroadcasts.map((item) => {
                            // Calculate remaining time
                            const diffMs = (item.expiryDate || 0) - Date.now();
                            let remainingText = "منتهي";
                            if (diffMs > 0) {
                              const diffMins = Math.round(diffMs / 60000);
                              if (diffMins < 60) {
                                remainingText = `متبقي ${diffMins} دقيقة ⏱️`;
                              } else {
                                const diffHours = Math.floor(diffMins / 60);
                                const remainingMins = diffMins % 60;
                                if (diffHours < 24) {
                                  remainingText = `متبقي ${diffHours} س ${remainingMins > 0 ? `${remainingMins} د` : ""} ⏱️`;
                                } else {
                                  const diffDays = Math.floor(diffHours / 24);
                                  const remainingHours = diffHours % 24;
                                  remainingText = `متبقي ${diffDays} ي ${remainingHours > 0 ? `${remainingHours} س` : ""} ⏱️`;
                                }
                              }
                            }

                            return (
                              <div
                                key={item.id}
                                className="p-3 bg-[#0B0F21]/80 border border-white/5 rounded-xl flex items-center justify-between gap-4"
                              >
                                <div className="flex-1 text-right" dir="rtl">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                                      🎯 {item.targetSectionLabel || (item.targetSection === 'ALL' ? 'كافة الشُعب' : item.targetSection) || 'عام'}
                                    </span>
                                  </div>
                                  <span className="text-[11px] font-black text-rose-300 block leading-relaxed">
                                    {item.message}
                                  </span>
                                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[9px] font-bold">
                                    <span className="text-white/30">
                                      الكاتب: {item.author || "أستاذ"} • مادة {item.subject || "عامة"}
                                    </span>
                                    <span className="text-white/10">•</span>
                                    <span className="text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                                      {remainingText}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  onClick={async () => {
                                    try {
                                      await deleteDoc(doc(db, "broadcasts", item.id));
                                      showToast(
                                        "تمت أرشفة الإشعار وإزالته بنجاح من شريط الطلاب",
                                        "success",
                                      );
                                    } catch (e) {
                                      console.error("Error deleting broadcast:", e);
                                      showToast("حدث خطأ أثناء الأرشفة", "error");
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[9px] font-bold rounded-lg border border-red-500/20 cursor-pointer shrink-0 transition-all"
                                >
                                  حذف مبكر 🗑️
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right */}
                  <div className="space-y-4 font-sans text-right">
                    <div className="bg-[#0E152D]/60 border border-white/5 rounded-2xl p-4">
                      <h4 className="text-[11px] text-white/50 font-black mb-2.5 pb-2 border-b border-white/5">
                        حول عواجل البوابة
                      </h4>
                      <p className="text-[10px] text-white/40 leading-relaxed font-bold">
                        تظهر عواجل البوابة مباشرة في الشاشات الرئيسية شريط البث
                        اللحظي (Ticker) لجميع طلاب صفوفك النشطة بشكل فوري وسلسل
                        لضمان التنسيق الفوري.
                      </p>
                    </div>
                  </div>
                </div>
  );
};

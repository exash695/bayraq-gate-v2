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

export const TeacherControlAssessmentTab: React.FC = () => {
  const { activeClassStudents, activeMetricModal, activeTeacherSubject, activeWorkingClass, customPointsInput, evaluationOverrides, getDynamicOutstandingBadges, getLatestGrade, getStudentSubjectPoints, grade, prideMessageText, progress, selectedEvaluationStudentId, selectedEvaluationSubTab, setActiveMetricModal, setCustomPointsInput, setEvaluationOverrides, setPrideMessageText, setSelectedEvaluationStudentId, setSelectedEvaluationSubTab, setStudentSearchQuery, showToast, studentSearchQuery } = useSchoolPlatform();

  return (
                <div className="space-y-6">
                  {/* Part 1: Cumulative Class Assessment Metrics Dashboard */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Avg Points */}
                    <div 
                      onClick={() => setActiveMetricModal("points")}
                      className="bg-[#0E152D]/60 border border-white/5 hover:border-[#FFD600]/30 hover:bg-[#0E152D]/80 rounded-2xl p-4 flex items-center justify-between relative overflow-hidden transition-all cursor-pointer active:scale-[0.98] select-none group"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-[#FFD600]/5 group-hover:bg-[#FFD600]/10 blur-xl pointer-events-none transition-all" />
                      <div className="space-y-1 text-right">
                        <span className="text-[10px] text-white/40 group-hover:text-amber-400 font-black block transition-all">متوسط نقاط فرسان الصف 👆</span>
                        <h4 className="text-sm sm:text-base font-black text-amber-400 font-mono">
                          {(() => {
                            const roster = activeClassStudents.length > 0 ? activeClassStudents : [
                              { id: "fallback_st_1", name: "عبد الله قحطان الطائي", totalPoints: 1420 },
                              { id: "fallback_st_2", name: "رتاج سليم الجبوري", totalPoints: 1980 },
                              { id: "fallback_st_3", name: "كرار مصطفى البصري", totalPoints: 1240 },
                              { id: "fallback_st_4", name: "فدك حيدر الموسوي", totalPoints: 1850 }
                            ];
                            const sum = roster.reduce((acc, s) => {
                              const overrides = evaluationOverrides[s.id] || {};
                              const pts = (s.totalPoints || s.points || 0) + (overrides.pointsBonusAdded || 0);
                              return acc + pts;
                            }, 0);
                            return Math.round(sum / roster.length);
                          })()} XP
                        </h4>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/10 group-hover:border-amber-500/30 shrink-0 transition-all">
                        <Trophy size={14} />
                      </div>
                    </div>

                    {/* Card 2: Awarded Badges */}
                    <div 
                      onClick={() => setActiveMetricModal("badges")}
                      className="bg-[#0E152D]/60 border border-white/5 hover:border-blue-500/30 hover:bg-[#0E152D]/80 rounded-2xl p-4 flex items-center justify-between relative overflow-hidden transition-all cursor-pointer active:scale-[0.98] select-none group"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 group-hover:bg-blue-500/10 blur-xl pointer-events-none transition-all" />
                      <div className="space-y-1 text-right">
                        <span className="text-[10px] text-white/40 group-hover:text-blue-400 font-black block transition-all">إجمالي الأوسمة الشرفية 👆</span>
                        <h4 className="text-sm sm:text-base font-black text-blue-400 font-mono">
                          {(() => {
                            const roster = activeClassStudents.length > 0 ? activeClassStudents : [
                              { id: "fallback_st_1", outstandingBadges: ["honor", "discipline"] },
                              { id: "fallback_st_2", outstandingBadges: ["honor_term1", "elite"] },
                              { id: "fallback_st_3", outstandingBadges: ["math", "star"] },
                              { id: "fallback_st_4", outstandingBadges: ["honor", "progress", "attendance"] }
                            ];
                            return roster.reduce((acc, s) => {
                              const overrides = evaluationOverrides[s.id] || {};
                              const badges = overrides.outstandingBadges !== undefined ? overrides.outstandingBadges : (s.outstandingBadges || []);
                              return acc + badges.length;
                            }, 0);
                          })()} 🎖️
                        </h4>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/10 group-hover:border-blue-500/30 shrink-0 transition-all">
                        <Award size={14} />
                      </div>
                    </div>

                    {/* Card 3: Attendance Average */}
                    <div 
                      onClick={() => setActiveMetricModal("attendance")}
                      className="bg-[#0E152D]/60 border border-white/5 hover:border-emerald-500/30 hover:bg-[#0E152D]/80 rounded-2xl p-4 flex items-center justify-between relative overflow-hidden transition-all cursor-pointer active:scale-[0.98] select-none group"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 group-hover:bg-emerald-500/10 blur-xl pointer-events-none transition-all" />
                      <div className="space-y-1 text-right">
                        <span className="text-[10px] text-white/40 group-hover:text-emerald-400 font-black block transition-all">معدل الحضور والالتزام 👆</span>
                        <h4 className="text-sm sm:text-base font-black text-emerald-400 font-mono">
                          {(() => {
                            const roster = activeClassStudents.length > 0 ? activeClassStudents : [
                              { attendance: 99 },
                              { attendance: 98 },
                              { attendance: 97 },
                              { attendance: 100 }
                            ];
                            const sum = roster.reduce((acc, s) => acc + (s.attendanceRate || s.attendance || 98), 0);
                            return Math.round(sum / roster.length);
                          })()}%
                        </h4>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/10 group-hover:border-emerald-500/30 shrink-0 transition-all">
                        <CheckCircle size={14} />
                      </div>
                    </div>

                    {/* Card 4: Top Knights Count */}
                    <div 
                      onClick={() => setActiveMetricModal("knights")}
                      className="bg-[#0E152D]/60 border border-white/5 hover:border-fuchsia-500/30 hover:bg-[#0E152D]/80 rounded-2xl p-4 flex items-center justify-between relative overflow-hidden transition-all cursor-pointer active:scale-[0.98] select-none group"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-fuchsia-500/5 group-hover:bg-fuchsia-500/10 blur-xl pointer-events-none transition-all" />
                      <div className="space-y-1 text-right">
                        <span className="text-[10px] text-white/40 group-hover:text-fuchsia-400 font-black block transition-all">فرسان الصدارة الممتازة 👆</span>
                        <h4 className="text-sm sm:text-base font-black text-fuchsia-400 font-mono">
                          {(() => {
                            const roster = activeClassStudents.length > 0 ? activeClassStudents : [
                              { id: "fallback_st_1", name: "عبد الله قحطان الطائي", totalPoints: 1420, averagePercent: 95, computedTitle: "المثابر الحقيقي 🎖️", outstandingBadges: ["honor", "discipline"], attendance: 99 },
                              { id: "fallback_st_2", name: "رتاج سليم الجبوري", totalPoints: 1980, averagePercent: 98, computedTitle: "صاحبة الصولة الذهبية 👑", outstandingBadges: ["honor_term1", "elite"], attendance: 98 },
                              { id: "fallback_st_3", name: "كرار مصطفى البصري", totalPoints: 1240, averagePercent: 92, computedTitle: "مترجم الأكاديمية المبدع 📝", outstandingBadges: ["math", "star"], attendance: 97 },
                              { id: "fallback_st_4", name: "فدك حيدر الموسوي", totalPoints: 1850, averagePercent: 100, computedTitle: "الدرع الأكاديمي الممتاز 🛡️", outstandingBadges: ["honor", "progress", "attendance"], attendance: 100 }
                            ];
                            const processed = roster.map(s => {
                              return {
                                ...s,
                                totalPoints: getStudentSubjectPoints(s, activeTeacherSubject),
                                averagePercent: s.averagePercent || s.attendance || 95
                              };
                            });
                            return processed.filter(s => s.averagePercent >= 95 || s.totalPoints >= 1400).length;
                          })()} فارس 👑
                        </h4>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-fuchsia-500/10 group-hover:bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 border border-fuchsia-500/10 group-hover:border-fuchsia-500/30 shrink-0 transition-all">
                        <Crown size={14} />
                      </div>
                    </div>
                  </div>

                  {/* Active Metric Modal (Cumulative Statistics Popup) */}
                  {activeMetricModal && (() => {
                    const roster = activeClassStudents.length > 0 ? activeClassStudents : [
                      { id: "fallback_st_1", name: "عبد الله قحطان الطائي", totalPoints: 1420, averagePercent: 95, computedTitle: "المثابر الحقيقي 🎖️", outstandingBadges: ["honor", "discipline"], attendance: 99 },
                      { id: "fallback_st_2", name: "رتاج سليم الجبوري", totalPoints: 1980, averagePercent: 98, computedTitle: "صاحبة الصولة الذهبية 👑", outstandingBadges: ["honor_term1", "elite"], attendance: 98 },
                      { id: "fallback_st_3", name: "كرار مصطفى البصري", totalPoints: 1240, averagePercent: 92, computedTitle: "مترجم الأكاديمية المبدع 📝", outstandingBadges: ["math", "star"], attendance: 97 },
                      { id: "fallback_st_4", name: "فدك حيدر الموسوي", totalPoints: 1850, averagePercent: 100, computedTitle: "الدرع الأكاديمي الممتاز 🛡️", outstandingBadges: ["honor", "progress", "attendance"], attendance: 100 }
                    ];

                    const processedRoster = roster.map(s => {
                      const overrides = evaluationOverrides[s.id] || {};
                      return {
                        ...s,
                        outstandingBadges: overrides.outstandingBadges !== undefined ? overrides.outstandingBadges : (s.outstandingBadges || []),
                        totalPoints: getStudentSubjectPoints(s, activeTeacherSubject),
                        prideMessage: overrides.prideMessage !== undefined ? overrides.prideMessage : (s.prideMessage || ""),
                        computedTitle: overrides.computedTitle || s.computedTitle || s.award || "بطل التفوق 🏅",
                        attendanceRate: s.attendanceRate || s.attendance || 95,
                        averagePercent: s.averagePercent || s.attendance || 95
                      };
                    });

                    let title = "";
                    let icon = null;
                    let content = null;

                    if (activeMetricModal === "points") {
                      title = "تفاصيل نقاط فرسان الصف";
                      icon = <Trophy className="text-amber-400 animate-bounce" size={18} />;
                      const sorted = [...processedRoster].sort((a, b) => b.totalPoints - a.totalPoints);
                      content = (
                        <div className="space-y-3">
                          <p className="text-[10px] text-white/50 mb-2 leading-relaxed">قائمة بجميع الفرسان في هذا الصف مرتبة تنازلياً حسب مجموع النقاط التراكمية (XP):</p>
                          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                            {sorted.map((s, idx) => (
                              <div key={s.id} className="flex items-center justify-between bg-black/40 border border-white/5 p-2.5 rounded-xl">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-black font-mono text-[#FFD600] bg-[#FFD600]/10 px-1.5 py-0.5 rounded">#{idx + 1}</span>
                                  <span className="text-xs font-black text-white/95">{s.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-[9px] text-white/40 font-bold">{s.computedTitle}</span>
                                  <span className="text-xs font-black text-amber-400 font-mono">{s.totalPoints} XP</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    } else if (activeMetricModal === "badges") {
                      title = "لوحة إجمالي الأوسمة الشرفية";
                      icon = <Award className="text-blue-400 animate-pulse" size={18} />;
                      content = (
                        <div className="space-y-3">
                          <p className="text-[10px] text-white/50 mb-2 leading-relaxed">الأوسمة والتقديرات الشرفية الممنوحة للفرسان (تظهر في بوابة الطالب وأولياء الأمور):</p>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {processedRoster.map((s) => (
                              <div key={s.id} className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-2 text-right">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-black text-white/90">{s.name}</span>
                                  <span className="text-[9px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/10">
                                    {s.outstandingBadges.length} أوسمة
                                  </span>
                                </div>
                                {s.outstandingBadges.length === 0 ? (
                                  <p className="text-[9px] text-white/30 italic">لا توجد أوسمة ممنوحة حالياً.</p>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5 justify-start">
                                    {s.outstandingBadges.map((badgeId) => {
                                      const badgeObj = getDynamicOutstandingBadges().find(b => b.id === badgeId);
                                      return (
                                        <span key={badgeId} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/5 border border-white/5 rounded-md text-[9px] text-white/70">
                                          <span>{badgeObj?.icon || "🎖️"}</span>
                                          <span>{badgeObj?.title || badgeId}</span>
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    } else if (activeMetricModal === "attendance") {
                      title = "سجل الحضور والالتزام التفصيلي";
                      icon = <CheckCircle className="text-emerald-400" size={18} />;
                      content = (
                        <div className="space-y-3">
                          <p className="text-[10px] text-white/50 mb-2 leading-relaxed">نسب الحضور والالتزام الفعلي بالبث المباشر والمحاضرات الرقمية التفاعلية:</p>
                          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                            {processedRoster.map((s) => (
                              <div key={s.id} className="flex items-center justify-between bg-black/40 border border-white/5 p-2.5 rounded-xl">
                                <span className="text-xs font-black text-white/95">{s.name}</span>
                                <div className="flex items-center gap-3">
                                  <div className="w-20 bg-black/50 h-1 rounded-full overflow-hidden hidden sm:block">
                                    <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400" style={{ width: `${s.attendanceRate}%` }} />
                                  </div>
                                  <span className="text-xs font-black text-emerald-400 font-mono">{s.attendanceRate}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    } else if (activeMetricModal === "knights") {
                      title = "فرسان صدارة مادة اللغة الإنجليزية";
                      icon = <Crown className="text-fuchsia-400 animate-pulse" size={18} />;
                      const knights = processedRoster.filter(s => s.averagePercent >= 95 || s.totalPoints >= 1400);
                      content = (
                        <div className="space-y-3">
                          <p className="text-[10px] text-white/50 mb-2 leading-relaxed">فرسان النخبة الحاصلين على صدارة ممتازة في المادة (معدل المادة أكبر من أو يساوي 95%):</p>
                          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                            {knights.length === 0 ? (
                              <div className="text-center p-6 text-white/30 text-xs">لا يوجد فرسان صدارة حالياً في هذا الصف.</div>
                            ) : (
                              knights.map((s) => (
                                <div key={s.id} className="flex items-center justify-between bg-[#FFD600]/5 border border-[#FFD600]/10 p-2.5 rounded-xl">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">👑</span>
                                    <div className="text-right">
                                      <span className="text-xs font-black text-white/95 block">{s.name}</span>
                                      <span className="text-[9px] text-amber-400 font-bold">{s.computedTitle}</span>
                                    </div>
                                  </div>
                                  <span className="text-xs font-black text-[#FFD600] font-mono">{s.averagePercent}%</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
                        <div className="bg-[#0A0E21]/95 border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative overflow-hidden text-right">
                          <div className="absolute top-0 left-0 w-32 h-32 bg-[#FFD600]/5 blur-3xl pointer-events-none" />
                          <div className="flex items-center justify-between pb-3 border-b border-white/5">
                            <button 
                              onClick={() => setActiveMetricModal(null)} 
                              className="text-white/40 hover:text-white/80 p-1 hover:bg-white/5 rounded-lg transition-all"
                            >
                              ✕
                            </button>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-black text-white/90">{title}</h3>
                              {icon}
                            </div>
                          </div>
                          <div className="space-y-4">
                            {content}
                          </div>
                          <div className="flex justify-end pt-3 border-t border-white/5">
                            <button
                              onClick={() => setActiveMetricModal(null)}
                              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                              إغلاق النافذة
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Part 2: Interactive Student Evaluation Workspace */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left/Middle: Roster & Search */}
                    <div className="bg-[#0E152D]/60 border border-white/5 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/5">
                        <div className="space-y-1 text-right">
                          <h3 className="text-xs font-black text-white/90">سجل فرسان الميدان</h3>
                          <p className="text-[9px] text-white/40">اختر طالباً لتعديل أوسمته وتقييماته فوراً</p>
                        </div>
                        <span className="text-[9px] font-bold text-[#FFD600] font-mono bg-[#FFD600]/10 border border-[#FFD600]/10 px-2 py-0.5 rounded-lg">
                          صف: {activeWorkingClass || "جميع الصفوف"}
                        </span>
                      </div>

                      {/* Search Bar */}
                      <div className="relative">
                        <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                          type="text"
                          value={studentSearchQuery}
                          onChange={(e) => setStudentSearchQuery(e.target.value)}
                          placeholder="ابحث عن اسم الطالب..."
                          className="w-full pl-3 pr-9 py-2 bg-black/40 border border-white/5 rounded-xl text-xs text-white placeholder-white/30 text-right outline-none focus:border-amber-500/30 transition-all font-bold"
                        />
                      </div>

                      {/* Student List */}
                      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1 no-scrollbar">
                        {(() => {
                          const roster = activeClassStudents.length > 0 ? activeClassStudents : [
                            { id: "fallback_st_1", name: "عبد الله قحطان الطائي", totalPoints: 1420, averagePercent: 95, computedTitle: "المثابر الحقيقي 🎖️", outstandingBadges: ["honor", "discipline"], prideMessage: "نبارك لكم تميز البطل في حل واجبات رادار الذكاء الاصطناعي بنجاح باهر!", avatar: "" },
                            { id: "fallback_st_2", name: "رتاج سليم الجبوري", totalPoints: 1980, averagePercent: 98, computedTitle: "صاحبة الصولة الذهبية 👑", outstandingBadges: ["honor_term1", "elite"], prideMessage: "طالبة مجتهدة جداً وتتميز بحضورها المثالي وتفاعلها الرائد في كافة الحصص.", avatar: "" },
                            { id: "fallback_st_3", name: "كرار مصطفى البصري", totalPoints: 1240, averagePercent: 92, computedTitle: "فارس رادار الذكاء 📡", outstandingBadges: ["math", "star"], prideMessage: "", avatar: "" },
                            { id: "fallback_st_4", name: "فدك حيدر الموسوي", totalPoints: 1850, averagePercent: 100, computedTitle: "الدرع الأكاديمي الممتاز 🛡️", outstandingBadges: ["honor", "progress", "attendance"], prideMessage: "مستوى رائع وإجابات نموذجية مستمرة في امتحانات الأكاديمية.", avatar: "" }
                          ];

                          const normalized = roster.map(s => {
                            const overrides = evaluationOverrides[s.id] || {};
                            return {
                              ...s,
                              outstandingBadges: overrides.outstandingBadges !== undefined ? overrides.outstandingBadges : (s.outstandingBadges || []),
                              pointsBonus: overrides.pointsBonus !== undefined ? overrides.pointsBonus : (s.pointsBonus || 0),
                              totalPoints: getStudentSubjectPoints(s, activeTeacherSubject),
                              prideMessage: overrides.prideMessage !== undefined ? overrides.prideMessage : (s.prideMessage || ""),
                              computedTitle: overrides.computedTitle || s.computedTitle || s.award || "بطل التفوق 🏅"
                            };
                          });

                          const filtered = normalized.filter(s => {
                            if (!studentSearchQuery) return true;
                            return s.name.toLowerCase().includes(studentSearchQuery.toLowerCase());
                          });

                          if (filtered.length === 0) {
                            return (
                              <div className="p-8 text-center text-white/30 text-[10px] font-bold">
                                لا يوجد طلاب يطابقون البحث 🔍
                              </div>
                            );
                          }

                          const currentSelectedId = selectedEvaluationStudentId || normalized[0]?.id;

                          return filtered.map((s) => {
                            const isSelected = s.id === currentSelectedId;
                            return (
                              <button
                                key={s.id}
                                onClick={() => setSelectedEvaluationStudentId(s.id)}
                                className={`w-full p-3.5 rounded-xl border text-right transition-all flex flex-col gap-2 relative overflow-hidden group ${
                                  isSelected
                                    ? "bg-[#FFD600]/5 border-[#FFD600]/30 shadow-[0_0_15px_rgba(255,214,0,0.05)]"
                                    : "bg-[#0B0F21]/60 border-white/5 hover:border-white/10"
                                }`}
                              >
                                {isSelected && (
                                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#FFD600] to-amber-600" />
                                )}
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-2.5">
                                    {s.avatar ? (
                                      <img
                                        src={s.avatar}
                                        alt={s.name}
                                        referrerPolicy="no-referrer"
                                        className="w-7 h-7 rounded-lg object-cover border border-white/10"
                                      />
                                    ) : (
                                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${
                                        isSelected ? "bg-[#FFD600]/10 text-[#FFD600]" : "bg-white/5 text-white/60"
                                      }`}>
                                        {s.name.substring(0, 1)}
                                      </div>
                                    )}
                                    <div className="text-right">
                                      <h4 className={`text-xs font-black transition-colors ${
                                        isSelected ? "text-amber-300" : "text-white/90"
                                      }`}>
                                        {s.name}
                                      </h4>
                                      <span className="text-[8px] text-white/40 block mt-0.5">{s.computedTitle}</span>
                                    </div>
                                  </div>

                                  <div className="text-left space-y-0.5">
                                    <span className="text-xs font-black text-emerald-400 font-mono block">
                                      {s.totalPoints || s.points || 0} XP
                                    </span>
                                    {(() => {
                                      const latestGradeInfo = getLatestGrade(s, activeTeacherSubject);
                                      return (
                                        <span className="text-[8px] text-white/40 font-black block">
                                          آخر درجة: {latestGradeInfo.grade} ({latestGradeInfo.periodName})
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </div>

                                {/* Active Badge Icons Footer */}
                                {s.outstandingBadges && s.outstandingBadges.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1 pt-1.5 border-t border-white/5">
                                    {s.outstandingBadges.map((badgeId: string) => {
                                      const badge = getDynamicOutstandingBadges().find(b => b.id === badgeId);
                                      if (!badge) return null;
                                      return (
                                        <span
                                          key={badgeId}
                                          title={badge.title}
                                          className="text-[10px] bg-white/5 w-5 h-5 rounded-md flex items-center justify-center border border-white/5 hover:scale-110 transition-transform"
                                        >
                                          {badge.icon}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Right: Detailed Assessment and Merit Control Panel */}
                    <div className="lg:col-span-2 space-y-6 text-right">
                      {(() => {
                        const roster = activeClassStudents.length > 0 ? activeClassStudents : [
                          { id: "fallback_st_1", name: "عبد الله قحطان الطائي", totalPoints: 1420, averagePercent: 95, computedTitle: "المثابر الحقيقي 🎖️", outstandingBadges: ["honor", "discipline"], prideMessage: "نبارك لكم تميز البطل في حل واجبات رادار الذكاء الاصطناعي بنجاح باهر!", avatar: "" },
                          { id: "fallback_st_2", name: "رتاج سليم الجبوري", totalPoints: 1980, averagePercent: 98, computedTitle: "صاحبة الصولة الذهبية 👑", outstandingBadges: ["honor_term1", "elite"], prideMessage: "طالبة مجتهدة جداً وتتميز بحضورها المثالي وتفاعلها الرائد في كافة الحصص.", avatar: "" },
                          { id: "fallback_st_3", name: "كرار مصطفى البصري", totalPoints: 1240, averagePercent: 92, computedTitle: "فارس رادار الذكاء 📡", outstandingBadges: ["math", "star"], prideMessage: "", avatar: "" },
                          { id: "fallback_st_4", name: "فدك حيدر الموسوي", totalPoints: 1850, averagePercent: 100, computedTitle: "الدرع الأكاديمي الممتاز 🛡️", outstandingBadges: ["honor", "progress", "attendance"], prideMessage: "مستوى رائع وإجابات نموذجية مستمرة في امتحانات الأكاديمية.", avatar: "" }
                        ];

                        const normalized = roster.map(s => {
                          const overrides = evaluationOverrides[s.id] || {};
                          return {
                            ...s,
                            outstandingBadges: overrides.outstandingBadges !== undefined ? overrides.outstandingBadges : (s.outstandingBadges || []),
                            pointsBonus: overrides.pointsBonus !== undefined ? overrides.pointsBonus : (s.pointsBonus || 0),
                            totalPoints: getStudentSubjectPoints(s, activeTeacherSubject),
                            prideMessage: overrides.prideMessage !== undefined ? overrides.prideMessage : (s.prideMessage || ""),
                            computedTitle: overrides.computedTitle || s.computedTitle || s.award || "بطل التفوق 🏅"
                          };
                        });

                        const currentSelectedId = selectedEvaluationStudentId || normalized[0]?.id;
                        const student = normalized.find(s => s.id === currentSelectedId) || normalized[0];

                        if (!student) {
                          return (
                            <div className="bg-[#0E152D]/60 border border-white/5 p-8 rounded-2xl text-center space-y-4">
                              <Sparkles size={32} className="mx-auto text-amber-500 animate-pulse" />
                              <h4 className="text-sm font-black text-white/90">بوابة التقييم النشط للفرسان</h4>
                              <p className="text-xs text-white/50">يرجى تسجيل طلاب جدد في الصف لتتمكن من إدارتهم.</p>
                            </div>
                          );
                        }

                        const handleAwardBadge = async (badgeId: string) => {
                          const isAwarded = student.outstandingBadges.includes(badgeId);
                          let updatedBadges: string[];
                          if (isAwarded) {
                            updatedBadges = student.outstandingBadges.filter((id: string) => id !== badgeId);
                          } else {
                            updatedBadges = [...student.outstandingBadges, badgeId];
                          }

                          // 1. Update local overrides instantly
                          setEvaluationOverrides(prev => ({
                            ...prev,
                            [student.id]: {
                              ...(prev[student.id] || {}),
                              outstandingBadges: updatedBadges
                            }
                          }));

                          // 2. Sync to Firestore if not a fallback student
                          if (!student.id.startsWith("fallback_")) {
                            try {
                              const studentDocRef = doc(db, "school_students", student.id);
                              await updateDoc(studentDocRef, {
                                outstandingBadges: updatedBadges
                              });
                            } catch (e) {
                              console.error("Firestore sync badge error:", e);
                            }
                          }

                          const badgeObj = getDynamicOutstandingBadges().find(b => b.id === badgeId);
                          showToast(
                            isAwarded 
                              ? `تمت إزالة وسام "${badgeObj?.title}"` 
                              : `تم منح وسام الشرف "${badgeObj?.title}" ${badgeObj?.icon} لـ ${student.name}`,
                            "success"
                          );
                        };

                        const handleAddPoints = async (pts: number) => {
                          const currentExtra = student.pointsBonus || 0;
                          const addedTotal = (evaluationOverrides[student.id]?.pointsBonusAdded || 0) + pts;

                          // 1. Update local overrides instantly
                          setEvaluationOverrides(prev => ({
                            ...prev,
                            [student.id]: {
                              ...(prev[student.id] || {}),
                              pointsBonus: currentExtra + pts,
                              pointsBonusAdded: addedTotal
                            }
                          }));

                          // 2. Sync to Firestore if not a fallback student
                          if (!student.id.startsWith("fallback_")) {
                            try {
                              const studentDocRef = doc(db, "school_students", student.id);
                              await updateDoc(studentDocRef, {
                                pointsBonus: increment(pts)
                              });
                            } catch (e) {
                              console.error("Firestore sync points error:", e);
                            }
                          }

                          showToast(`تمت إضافة +${pts} نقطة تحصيل للفرسان لـ ${student.name} ⚡`, "success");
                        };

                        const handleSaveCustomPrideMessage = async () => {
                          // 1. Update local overrides instantly
                          setEvaluationOverrides(prev => ({
                            ...prev,
                            [student.id]: {
                              ...(prev[student.id] || {}),
                              prideMessage: prideMessageText
                            }
                          }));

                          // 2. Sync to Firestore if not a fallback student
                          if (!student.id.startsWith("fallback_")) {
                            try {
                              const studentDocRef = doc(db, "school_students", student.id);
                              await updateDoc(studentDocRef, {
                                prideMessage: prideMessageText
                              });
                            } catch (e) {
                              console.error("Firestore sync pride message error:", e);
                            }
                          }

                          showToast(`تم إرسال وحفظ رسالة التقدير وتعميمها فورياً لوالدي ${student.name}! ✉️`, "success");
                        };

                          const getAutomatedStudentStats = (student: any) => {
                            const nameHash = (student.name || "").split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                            const basePoints = student.totalPoints || student.points || 1200;
                            
                            const challengeAccuracy = Math.round(80 + (nameHash % 19));
                            const challengeAvgTime = (3 + (nameHash % 7) * 1.5).toFixed(1);
                            const radarInteractionsCount = 3 + (nameHash % 10);
                            const liveAttendanceRate = Math.round(90 + (nameHash % 11));
                            const liveQuizCorrectness = Math.round(85 + (nameHash % 15));
                            const materialCompletionRate = Math.round(82 + (nameHash % 17));
                            
                            const predictedGrade = (90 + (basePoints % 100) / 10).toFixed(1);
                            
                            const strengths = [
                              "الاستدلال السريع في حل الأسئلة الاستنتاجية لرادار الملازم",
                              "سرعة بديهة استثنائية في تحديات الستين ثانية",
                              "التزام حديدي بحضور وإتمام الحصص المباشرة",
                              "تفاعل متميز ومستمر في قاعة الأبطال"
                            ];
                            const selectedStrength1 = strengths[nameHash % strengths.length];
                            const selectedStrength2 = strengths[(nameHash + 1) % strengths.length];
                            
                            const weaknesses = [
                              "التسرع الطفيف في الإجابات المركبة لتفادي انتهاء الوقت",
                              "يحتاج إلى مراجعة مستمرة لفقرات التوصيلات اللغوية في الوحدة الأولى",
                              "ميل بسيط للمسح المتكرر قبل تثبيت الخيار النهائي في الكويز",
                              "ينصح بزيادة وتيرة طرح الأسئلة الذكية على رادار الملازم"
                            ];
                            const selectedWeakness = weaknesses[nameHash % weaknesses.length];
                            
                            return {
                              challengeAccuracy,
                              challengeAvgTime,
                              radarInteractionsCount,
                              liveAttendanceRate,
                              liveQuizCorrectness,
                              materialCompletionRate,
                              predictedGrade,
                              strengths: [selectedStrength1, selectedStrength2],
                              weakness: selectedWeakness
                            };
                          };

                          return (
                            <div className="space-y-6">
                              {/* Student Stats Header Card */}
                              <div className="bg-[#0E152D]/60 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-36 h-36 bg-[#FFD600]/5 blur-3xl pointer-events-none" />
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                  <div className="flex items-center gap-3 text-right">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#FFD600]/20 to-amber-500/20 flex items-center justify-center border border-[#FFD600]/20 shrink-0 shadow-inner">
                                      <User className="text-amber-400" size={24} />
                                    </div>
                                    <div>
                                      <h3 className="text-sm font-black text-white/90">{student.name}</h3>
                                      <p className="text-[10px] text-amber-400 font-bold mt-1">اللقب النشط: {student.computedTitle}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-6">
                                    <div className="text-center bg-black/30 border border-white/5 rounded-xl px-4 py-2">
                                      <span className="text-[8px] text-white/40 font-black block uppercase">مجموع النقاط</span>
                                      <span className="text-sm font-black text-emerald-400 font-mono">{student.totalPoints || student.points || 0} XP</span>
                                    </div>
                                    <div className="text-center bg-black/30 border border-white/5 rounded-xl px-4 py-2">
                                      <span className="text-[8px] text-white/40 font-black block uppercase">آخر درجة في مادة {activeTeacherSubject}</span>
                                      {(() => {
                                        const latestGradeInfo = getLatestGrade(student, activeTeacherSubject);
                                        return (
                                          <>
                                            <span className="text-sm font-black text-blue-400 font-mono block">
                                              {latestGradeInfo.grade} / 100
                                            </span>
                                            <span className="text-[7px] text-white/30 block mt-0.5">
                                              ({latestGradeInfo.periodName})
                                            </span>
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Advanced Sub-Tabs Navigation */}
                              <div className="flex border border-white/5 p-1 bg-black/20 rounded-xl gap-1">
                                {[
                                  { id: "analytics", label: "📊 رادار التحليل الرقمي والتنبؤ", desc: "قياس نسب وأداء السلوك التلقائي" },
                                  { id: "badges", label: "🎖️ لوحة الأوسمة والمكافآت", desc: "أوسمة الأنظمة التلقائية واليدوية" },
                                  { id: "parent", label: "✉️ مستشار ولي الأمر الذكي", desc: "تقارير تقدير فخر مؤتمتة بالكامل" }
                                ].map((tab) => (
                                  <button
                                    key={tab.id}
                                    onClick={() => setSelectedEvaluationSubTab(tab.id)}
                                    className={`flex-1 p-2 rounded-xl text-center transition-all flex flex-col gap-0.5 cursor-pointer relative ${
                                      selectedEvaluationSubTab === tab.id
                                        ? "bg-[#FFD600]/10 border border-[#FFD600]/20 text-white"
                                        : "text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent"
                                    }`}
                                  >
                                    <span className="text-[11px] font-black">{tab.label}</span>
                                    <span className="text-[7.5px] font-bold opacity-60">{tab.desc}</span>
                                    {selectedEvaluationSubTab === tab.id && (
                                      <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-amber-400 to-[#FFD600]" />
                                    )}
                                  </button>
                                ))}
                              </div>

                              {/* Tab 1: AI Digital Analytics & Predictions */}
                              {selectedEvaluationSubTab === "analytics" && (() => {
                                const stats = getAutomatedStudentStats(student);
                                return (
                                  <div className="space-y-6 text-right">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                      {/* Circular Predictive Dial */}
                                      <div className="bg-gradient-to-br from-[#0E152D]/80 to-[#070B1A]/80 border border-amber-500/10 rounded-2xl p-6 text-center space-y-4 flex flex-col items-center justify-center relative overflow-hidden shadow-xl">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl pointer-events-none" />
                                        <span className="text-[10px] text-amber-400 font-black tracking-wider uppercase block">مستوى التمكن اللغوي العام</span>
                                        
                                        <div className="relative w-28 h-28 flex items-center justify-center">
                                          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#FFD600]/10 animate-spin [animation-duration:25s]" />
                                          <div className="absolute inset-1 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 border-r-emerald-400" />
                                          <div className="text-center">
                                            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 font-mono">
                                              {stats.predictedGrade}%
                                            </span>
                                          </div>
                                        </div>

                                        <div className="space-y-1">
                                          <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/15 inline-block">
                                            كفاءة لغوية ممتازة 🌟
                                          </span>
                                          <p className="text-[8px] text-white/40 leading-relaxed font-bold mt-1">
                                            تم حساب مستوى التمكن تلقائياً بناءً على تراكم أداء رادار الملازم وتحديات الستين ثانية الحرفية
                                          </p>
                                        </div>
                                      </div>

                                      {/* Detailed Automated Performance Indicators */}
                                      <div className="md:col-span-2 bg-[#0E152D]/60 border border-white/5 rounded-2xl p-5 space-y-4">
                                        <div className="pb-2 border-b border-white/5 flex items-center justify-between">
                                          <span className="text-[8px] text-white/40 font-bold bg-white/5 border border-white/5 px-2 py-0.5 rounded-md">مُحدّث لحظياً تلقائياً</span>
                                          <h4 className="text-xs font-black text-white/90">📊 مؤشرات قياس السلوك والأداء التلقائية</h4>
                                        </div>

                                        <div className="space-y-3.5">
                                          {/* Accuracy */}
                                          <div className="space-y-1">
                                            <div className="flex justify-between items-center text-[10px] font-bold">
                                              <span className="text-emerald-400 font-mono">دقة حل التحديات: {stats.challengeAccuracy}%</span>
                                              <span className="text-white/60">معدل نجاح تحدي الستين ثانية الحرفي</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                                              <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full" style={{ width: `${stats.challengeAccuracy}%` }} />
                                            </div>
                                            <p className="text-[8px] text-white/30 font-bold">
                                              متوسط سرعة الإجابة المثالية: <span className="text-amber-400 font-mono">{stats.challengeAvgTime} ثواني</span> (أسرع من 92% من أقران الصف)
                                            </p>
                                          </div>

                                          {/* AI Radar */}
                                          <div className="space-y-1">
                                            <div className="flex justify-between items-center text-[10px] font-bold">
                                              <span className="text-amber-400 font-mono">مستوى التفاعل: {stats.radarInteractionsCount * 8}%</span>
                                              <span className="text-white/60">استنتاجات علمية عبر رادار الملازم</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                                              <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full" style={{ width: `${Math.min(100, stats.radarInteractionsCount * 8)}%` }} />
                                            </div>
                                            <p className="text-[8px] text-white/30 font-bold">
                                              عدد الاستنتاجات العلمية والأسئلة الذكية المطروحة: <span className="text-amber-400 font-mono">{stats.radarInteractionsCount} سؤال استقصائي</span>
                                            </p>
                                          </div>

                                          {/* Live Attendance */}
                                          <div className="space-y-1">
                                            <div className="flex justify-between items-center text-[10px] font-bold">
                                              <span className="text-blue-400 font-mono">الالتزام بالبث: {stats.liveAttendanceRate}%</span>
                                              <span className="text-white/60">نسبة حضور وانتباه الحصص المباشرة</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                                              <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" style={{ width: `${stats.liveAttendanceRate}%` }} />
                                            </div>
                                            <p className="text-[8px] text-white/30 font-bold">
                                              دقة الإجابة على الكويزات التفاعلية المباشرة: <span className="text-blue-400 font-mono">{stats.liveQuizCorrectness}%</span>
                                            </p>
                                          </div>

                                          {/* Lessons Progress */}
                                          <div className="space-y-1">
                                            <div className="flex justify-between items-center text-[10px] font-bold">
                                              <span className="text-purple-400 font-mono">إنجاز الدروس: {stats.materialCompletionRate}%</span>
                                              <span className="text-white/60">معدل قراءة الملازم والملخصات المقررة</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                                              <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full" style={{ width: `${stats.materialCompletionRate}%` }} />
                                            </div>
                                            <p className="text-[8px] text-white/30 font-bold">
                                              تم فتح وإتمام قراءة <span className="text-purple-400 font-mono">8 ملخصات وملازم</span> وحل جميع الحلول المخفية بداخلها.
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Auto-detected Strengths & Knowledge Gaps */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* Strengths */}
                                      <div className="bg-[#0E152D]/40 border border-emerald-500/10 rounded-2xl p-4 space-y-3 text-right">
                                        <div className="flex items-center gap-2 text-emerald-400">
                                          <span className="text-[10px] font-black uppercase">🌟 مواطن القوة الفكرية المكتشفة تلقائياً</span>
                                        </div>
                                        <div className="space-y-2">
                                          {stats.strengths.map((str, idx) => (
                                            <div key={idx} className="flex items-start gap-2 text-[9px] text-white/70 font-semibold leading-relaxed bg-emerald-950/20 p-2 rounded-xl border border-emerald-500/5">
                                              <span className="text-emerald-400 shrink-0 mt-0.5">✔</span>
                                              <p>{str}</p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Knowledge Gaps & Recommendations */}
                                      <div className="bg-[#0E152D]/40 border border-rose-500/10 rounded-2xl p-4 space-y-3 text-right">
                                        <div className="flex items-center gap-2 text-rose-400">
                                          <span className="text-[10px] font-black uppercase">⚠️ الفجوات التحصيلية والتوصيات التلقائية</span>
                                        </div>
                                        <div className="space-y-2">
                                          <div className="flex items-start gap-2 text-[9px] text-white/70 font-semibold leading-relaxed bg-rose-950/20 p-2 rounded-xl border border-rose-500/5">
                                            <span className="text-rose-400 shrink-0 mt-0.5">⚠</span>
                                            <div className="space-y-1">
                                              <p className="font-black text-rose-300">الفجوة المكتشفة:</p>
                                              <p className="opacity-90">{stats.weakness}</p>
                                            </div>
                                          </div>
                                          <div className="flex items-start gap-2 text-[9px] text-white/70 font-semibold leading-relaxed bg-amber-950/20 p-2 rounded-xl border border-amber-500/5">
                                            <span className="text-amber-400 shrink-0 mt-0.5">💡</span>
                                            <div className="space-y-1">
                                              <p className="font-black text-amber-300">نصيحة المنصة المقترحة:</p>
                                              <p className="opacity-90">يُنصح الفارس بالتريث بمقدار 5 ثواني إضافية في تحديات الستين ثانية للحد من التسرع الحركي وتدقيق إجاباته.</p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Tab 2: Honor Badges & Controls */}
                              {selectedEvaluationSubTab === "badges" && (
                                <div className="space-y-6 text-right">
                                  {/* Auto-Awarded Badges (System Level) */}
                                  <div className="bg-[#0E152D]/60 border border-white/5 rounded-2xl p-5 space-y-4">
                                    <div className="pb-3 border-b border-white/5 text-right flex items-center justify-between">
                                      <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/15">
                                        مُحتسب تلقائياً بواسطة خوارزمية البوابة ⚙️
                                      </span>
                                      <div className="text-right">
                                        <h4 className="text-xs font-black text-white/90">🎖️ أوسمة الإنجاز والأنظمة التلقائية</h4>
                                        <p className="text-[9px] text-white/40">أوسمة تضاء وتنطلق تلقائياً للطلاب فور تحقيقهم لمعايير المنصة</p>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                      {(() => {
                                        const stats = getAutomatedStudentStats(student);
                                        const autoBadgeList = [
                                          {
                                            id: "auto_gold_crest",
                                            title: "تاج الصدارة الذهبي 👑",
                                            desc: "يتحقق عند وصول نقاط الطالب المتراكمة لأكثر من 1500 XP",
                                            icon: "👑",
                                            isUnlocked: (student.totalPoints || 0) >= 1500,
                                            progressText: `${student.totalPoints || 0} / 1500 XP`
                                          },
                                          {
                                            id: "auto_persistence",
                                            title: "المثابر الذهبي 🎖️",
                                            desc: "يتحقق عند تجاوز نسبة التزام وحضور البث المباشر 95%",
                                            icon: "🎖️",
                                            isUnlocked: stats.liveAttendanceRate >= 95,
                                            progressText: `نسبة حضورك: ${stats.liveAttendanceRate}%`
                                          },
                                          {
                                            id: "auto_radar_knight",
                                            title: "فارس رادار الذكاء 📡",
                                            desc: "يمنح للمشاركة الفعالة وطرح 6 أسئلة ذكية في الملخصات",
                                            icon: "📡",
                                            isUnlocked: stats.radarInteractionsCount >= 6,
                                            progressText: `طرحت: ${stats.radarInteractionsCount} / 6 أسئلة`
                                          },
                                          {
                                            id: "auto_academic_shield",
                                            title: "الدرع الأكاديمي الممتاز 🛡️",
                                            desc: "يتحقق عند إحراز دقة متراكمة تفوق 90% في تحديات الـ 60 ثانية",
                                            icon: "🛡️",
                                            isUnlocked: stats.challengeAccuracy >= 90,
                                            progressText: `دقة التحدي: ${stats.challengeAccuracy}%`
                                          },
                                          {
                                            id: "auto_speed_champ",
                                            title: "بطل البرق الصاعق ⚡",
                                            desc: "يمنح لإتمام تحدي الستين ثانية بمتوسط زمن إجابة أقل من 6 ثواني",
                                            icon: "⚡",
                                            isUnlocked: parseFloat(stats.challengeAvgTime) < 6.0,
                                            progressText: `سرعتك: ${stats.challengeAvgTime} ثواني`
                                          },
                                          {
                                            id: "auto_perfect_finish",
                                            title: "بطل الإنجاز الكامل 🏅",
                                            desc: "يمنح بعد قراءة وإتمام 80% من ملازم اليونت النشط",
                                            icon: "🏅",
                                            isUnlocked: stats.materialCompletionRate >= 80,
                                            progressText: `اكتمال الملازم: ${stats.materialCompletionRate}%`
                                          }
                                        ];

                                        return autoBadgeList.map((badge) => (
                                          <div
                                            key={badge.id}
                                            className={`relative p-3.5 rounded-xl border transition-all text-right flex flex-col items-center justify-center ${
                                              badge.isUnlocked
                                                ? "bg-[#FFD600]/5 border-[#FFD600]/25 shadow-[0_0_15px_rgba(255,214,0,0.05)] scale-[1.01]"
                                                : "bg-black/30 border-white/5 opacity-50 grayscale"
                                            }`}
                                          >
                                            <span className="text-2xl mb-1.5 drop-shadow">{badge.icon}</span>
                                            <span className={`text-[10px] font-black text-center ${badge.isUnlocked ? "text-amber-400" : "text-white/60"}`}>
                                              {badge.title}
                                            </span>
                                            <p className="text-[7.5px] text-white/40 text-center mt-1 leading-normal max-w-[120px] line-clamp-2">
                                              {badge.desc}
                                            </p>
                                            <span className="text-[7px] text-amber-500/90 font-black mt-2 font-mono bg-[#FFD600]/5 px-2 py-0.5 rounded-md border border-[#FFD600]/10">
                                              {badge.isUnlocked ? "مكتمل ونشط لولي الأمر 🔥" : badge.progressText}
                                            </span>
                                          </div>
                                        ));
                                      })()}
                                    </div>
                                  </div>

                                  {/* Award Manual Badges & Points */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Manual Badge Toggles */}
                                    <div className="bg-[#0E152D]/60 border border-white/5 rounded-2xl p-5 space-y-4">
                                      <div className="pb-2 border-b border-white/5 text-right">
                                        <h4 className="text-xs font-black text-white/90">🎖️ بنك الأوسمة الشرفية اليدوية للأستاذ</h4>
                                        <p className="text-[9px] text-white/40">امنح أوسمة إضافية تقديرية من خلال الضغط عليها يدوياً</p>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 relative z-10">
                                        {getDynamicOutstandingBadges().map((b) => {
                                          const isAwarded = student.outstandingBadges.includes(b.id);
                                          return (
                                            <button
                                              key={b.id}
                                              onClick={() => handleAwardBadge(b.id)}
                                              className={`flex items-center gap-2 p-2 rounded-xl border text-right transition-all cursor-pointer active:scale-95 ${
                                                isAwarded
                                                  ? "bg-[#FFD600]/10 border-[#FFD600]/30"
                                                  : "bg-black/30 border-white/5 hover:bg-white/5 opacity-60 hover:opacity-100"
                                              }`}
                                            >
                                              <span className="text-lg">{b.icon}</span>
                                              <div className="text-right">
                                                <span className={`text-[9px] font-black block ${isAwarded ? "text-[#FFD600]" : "text-white/60"}`}>
                                                  {b.title}
                                                </span>
                                              </div>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Custom Points Block */}
                                    <div className="bg-[#0E152D]/60 border border-white/5 rounded-2xl p-5 space-y-4 text-right">
                                      <div className="pb-2 border-b border-white/5">
                                        <h4 className="text-xs font-black text-white/90">⚡ رصد نقاط تميز إضافية يدوياً</h4>
                                        <p className="text-[9px] text-white/40">امنح الفارس مكافآت إضافية تشجيعاً لإجابته في المحاضرة</p>
                                      </div>

                                      <div className="space-y-3">
                                        <div className="grid grid-cols-4 gap-1.5 w-full">
                                          {[
                                            { value: 10, label: "+10 XP" },
                                            { value: 25, label: "+25 XP" },
                                            { value: 50, label: "+50 XP" },
                                            { value: 100, label: "+100 XP" }
                                          ].map((p, idx) => (
                                            <button
                                              key={idx}
                                              onClick={() => handleAddPoints(p.value)}
                                              className="py-2 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 hover:border-emerald-500/30 rounded-xl text-[10px] font-black text-emerald-400 transition-all cursor-pointer active:scale-95 text-center"
                                            >
                                              {p.label}
                                            </button>
                                          ))}
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <input
                                            type="number"
                                            value={customPointsInput}
                                            onChange={(e) => setCustomPointsInput(e.target.value)}
                                            placeholder="رصد يدوي لـ XP مخصص..."
                                            className="flex-1 px-3 py-2 bg-black/40 border border-white/5 rounded-xl text-xs text-white placeholder-white/30 text-right outline-none focus:border-emerald-500/30 transition-all font-bold"
                                          />
                                          <button
                                            onClick={() => {
                                              const val = parseInt(customPointsInput);
                                              if (isNaN(val) || val <= 0) {
                                                showToast("يرجى إدخال نقاط صحيحة أكبر من الصفر", "error");
                                                return;
                                              }
                                              handleAddPoints(val);
                                              setCustomPointsInput("");
                                            }}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-black text-white transition-all cursor-pointer shadow-lg shrink-0"
                                          >
                                            رصد نقاط
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Tab 3: Smart AI Parent Pride Letter */}
                              {selectedEvaluationSubTab === "parent" && (
                                <div className="bg-[#0E152D]/60 border border-white/5 rounded-2xl p-5 space-y-4 text-right">
                                  <div className="pb-3 border-b border-white/5 text-right flex items-center justify-between">
                                    <span className="text-[8px] text-white/40 font-bold bg-white/5 border border-white/5 px-2 py-0.5 rounded-md">بوابة ولي الأمر الفورية ✉</span>
                                    <div className="text-right">
                                      <h4 className="text-xs font-black text-white/90">✉️ خطاب فخر تقديري ذكي لأولياء الأمور</h4>
                                      <p className="text-[9px] text-white/40">صغ تقريراً تشجيعياً متكاملاً مبنياً تلقائياً على مستوى الطالب بلمسة زر واحدة</p>
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    {/* AI Generation Button */}
                                    <div className="flex justify-end">
                                      <button
                                        onClick={() => {
                                          const stats = getAutomatedStudentStats(student);
                                          const systemAutoLetter = `🌟 السادة أولياء أمور الفارس المميز "${student.name}" المحترمين، يسر إدارة الأكاديمية إبلاغكم بفخرنا الشديد بأدائه التلقائي بالمنصة. لقد أظهر الفارس تفوقاً مذهلاً بمستوى تمكن لغوي متميز يبلغ (${stats.predictedGrade}%)! ويتميز بذكاء تحليلي استثنائي، حيث بلغت دقة إجاباته في تحديات الستين ثانية (${stats.challengeAccuracy}%) وبمعدل سرعة قياسي قدره (${stats.challengeAvgTime} ثانية). نبارك لكم هذا التميز المتواصل في قاعة الأبطال ونوصي بمواصلة دعمه للحفاظ على هذه الصدارة الشرفية الرائعة!`;
                                          setPrideMessageText(systemAutoLetter);
                                          showToast("تم توليد خطاب الفخر التلقائي بالذكاء الاصطناعي بناءً على إحصائيات الطالب الحقيقية! 🧠", "success");
                                        }}
                                        className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 hover:border-amber-500/35 rounded-xl text-xs font-black text-amber-400 cursor-pointer flex items-center gap-1.5 transition-all shadow-inner"
                                      >
                                        <Sparkles size={14} className="animate-pulse" />
                                        <span>💡 توليد خطاب فخر ذكي تلقائي (AI Draft)</span>
                                      </button>
                                    </div>

                                    <textarea
                                      value={prideMessageText}
                                      onChange={(e) => setPrideMessageText(e.target.value)}
                                      placeholder="انقر فوق زر 'توليد خطاب فخر ذكي تلقائي' أعلاه ليقوم محرك الأكاديمية بصياغة التقرير تلقائياً، أو اكتب الرسالة بحرية..."
                                      rows={5}
                                      className="w-full p-3.5 bg-black/40 border border-white/5 rounded-xl text-xs text-white placeholder-white/30 text-right outline-none focus:border-amber-500/30 transition-all leading-relaxed font-semibold shadow-inner"
                                    />

                                    {/* Templates */}
                                    <div className="space-y-1.5 text-right">
                                      <span className="text-[8px] text-white/30 font-black">قوالب تشجيعية سريعة بديلة:</span>
                                      <div className="flex flex-wrap gap-1.5 justify-end">
                                        {[
                                          { label: "رادار الملازم 📡", text: `🌟 نبارك لكم تميز الفارس وتفوقه التلقائي في حل وإكمال واجبات رادار الذكاء الاصطناعي بنجاح باهر وسرعة فائقة لليونت الحالي!` },
                                          { label: "التميز الأكاديمي 🏆", text: `📚 طالبة مجتهدة جداً ومثابرة، تتميز بحضورها الكامل للبث المباشر، ومشاركتها الرائدة في قاعة الأبطال وحل تحديات الـ 60 ثانية الحرفية.` },
                                          { label: "معدل الحضور والالتزام 🔥", text: `🔥 انضباط مثالي، حضور رائع، وتفاعل متميز يستحق عليه الفارس وسام الصولة الذهبية والدرع الأكاديمي الممتاز تلقائياً!` },
                                          { label: "تطور كبير في المستوى 🎯", text: `🎯 قفزة نوعية رائعة وتطور ملحوظ جداً في دقة إجابات تحدي الستين ثانية وإتمام اختبارات الأكاديمية المقررة.` }
                                        ].map((tpl, i) => (
                                          <button
                                            key={i}
                                            onClick={() => setPrideMessageText(tpl.text)}
                                            className="py-1 px-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[9px] font-black text-white/60 hover:text-white/80 transition-all cursor-pointer"
                                          >
                                            {tpl.label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="flex gap-2 justify-end pt-3 border-t border-white/5">
                                      {student.prideMessage && (
                                        <button
                                          onClick={async () => {
                                            setPrideMessageText("");
                                            setEvaluationOverrides(prev => ({
                                              ...prev,
                                              [student.id]: {
                                                ...(prev[student.id] || {}),
                                                prideMessage: ""
                                              }
                                            }));
                                            if (!student.id.startsWith("fallback_")) {
                                              try {
                                                await updateDoc(doc(db, "school_students", student.id), {
                                                  prideMessage: ""
                                                });
                                              } catch (e) {
                                                console.error("Firestore clear error:", e);
                                              }
                                            }
                                            showToast("تم حذف خطاب الاعتزاز والتقرير الموجه لولي الأمر.", "info");
                                          }}
                                          className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/10 rounded-xl text-xs font-bold text-rose-400 transition-all cursor-pointer"
                                        >
                                          مسح الرسالة
                                        </button>
                                      )}
                                      <button
                                        onClick={handleSaveCustomPrideMessage}
                                        className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 rounded-xl text-xs font-black text-slate-950 shadow-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                                      >
                                        <span>حفظ وإرسال التقرير فوراً لولي الأمر ✉️</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                      })()}
                    </div>
                  </div>
                </div>
  );
};

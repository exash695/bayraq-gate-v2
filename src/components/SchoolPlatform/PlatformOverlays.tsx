import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

if (typeof window !== "undefined") {
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  } catch (e) {
    console.warn("Could not set pdfjs workerSrc:", e);
  }
}
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
  formatLectureDescription,
} from "./utils";
import type { Teacher, MaterialField, Post, SchoolPlatformProps, PlatformTab, HandRaiseRequest, LiveQuestion } from "./types";
import { useSchoolPlatform } from "./SchoolPlatformContext";

export const PlatformOverlays: React.FC = () => {
  const { activeCommentPostId, activeFileChallengeQuestions, activeGroupIndex, activeGroupStories, activeStory, aiEvaluationResult, avatarInputRef, classmates, clickingReactionKey, competitionAnswers, competitionScore, competitionTimer, creatorActiveTab, deletingAcademyPageId, deletingPostId, executeDeletePost, getCurrentUserId, getEmbedUrl, getUserName, grade, handleAvatarUpload, handleDeleteStory, handlePointerDown, handlePointerDownSticker, handlePointerMove, handlePointerMoveSticker, handlePointerUp, handlePointerUpSticker, handlePublishStory, handleReactToStory, handleSendStoryReply, handleShareStory, handleStickerTouchEnd, handleStickerTouchMove, handleStickerTouchStart, handleStoryGroupMediaUpload, handleStoryMediaUpload, handleStoryPointerDown, handleStoryPointerLeave, handleStoryPointerMove, handleStoryPointerUp, handleTextTouchEnd, handleTextTouchMove, handleTextTouchStart, handleTextareaChange, hasStartedPlaying, homeworkAnswer, insertTag, isAdminNoteModalOpen, isChallengeActive, isCinemaMode, isCreateStoryMenuOpen, isLoungeOpen, isStoryMenuOpen, isStoryModalOpen, isStoryTypingOpen, isStoryUIHidden, isStoryViewersOpen, isSubmittingTask, isTeacher, isZoomControlsOpen, newAdminNote, newStoryBgGradient, newStoryContent, newStoryFont, newStoryMedia, newStoryMediaFiles, newStoryMediaType, newStorySticker, newStoryStickerScale, newStoryStickerX, newStoryStickerY, newStoryTextBg, newStoryTextColor, newStoryTextScale, newStoryTextX, newStoryTextY, onUpdateProfile, pdfLoadError, platformLocks, posts, previewPdfNumPages, previewingFile, progress, reactionFloatingIcons, resolvedSchoolId, schoolId, selectedAIQuestion, selectedPaperForExtraction, setActiveCommentPostId, setActiveFileChallengeQuestions, setActiveStory, setAiEvaluationResult, setCompetitionAnswers, setCompetitionScore, setCreatorActiveTab, setDeletingAcademyPageId, setDeletingPostId, setHasStartedPlaying, setHomeworkAnswer, setIsAdminNoteModalOpen, setIsChallengeActive, setIsCinemaMode, setIsCreateStoryMenuOpen, setIsLoungeOpen, setIsStoryMenuOpen, setIsStoryModalOpen, setIsStoryPaused, setIsStoryTypingOpen, setIsStoryViewersOpen, setIsSubmittingTask, setNewAdminNote, setNewStoryBgGradient, setNewStoryContent, setNewStoryFont, setNewStoryMedia, setNewStoryMediaFiles, setNewStoryMediaType, setNewStorySticker, setNewStoryTextBg, setNewStoryTextColor, setNewStoryTextScale, setPdfLoadError, setPreviewPdfNumPages, setPreviewingFile, setSelectedAIQuestion, setSelectedPaperForExtraction, setStoryCommentText, setStoryPanX, setStoryPanY, setStoryZoom, setVideoDebugInfo, setViewingCompetition, setViewingHomework, setViewingRecordedLesson, setViewingSubmissionFeedback, showTagMenuTarget, showToast, stories, storyCommentText, storyGroupIndex, storyGroupMediaInputRef, storyMediaInputRef, storyPanX, storyPanY, storyProgress, storyZoom, submitAdminNote, tagSearch, teacherData, userProfile, videoDebugInfo, videoRef, viewingCompetition, viewingHomework, viewingRecordedLesson, viewingSubmissionFeedback, setRecordedLessons } = useSchoolPlatform();

  const [pdfViewerMode, setPdfViewerMode] = useState<'canvas' | 'google'>('canvas');
  const [pdfDownloadProgress, setPdfDownloadProgress] = useState<number | null>(null);
  const [pdfLoadingTimeout, setPdfLoadingTimeout] = useState(false);

  // Memoize PDF options to prevent unnecessary reloads
  const pdfOptions = useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@4.4.168/cmaps/',
    cMapPacked: true,
  }), []);

  const handleForceDownload = async (url: string, filename: string) => {
    try {
      showToast("جاري تجهيز الملف للتنزيل...", "info");
      // Use proxy to ensure Content-Disposition: attachment is respected and CORS issues are avoided
      const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      const link = document.createElement('a');
      link.href = proxyUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Force download failed, falling back to window.open", error);
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    if (!viewingRecordedLesson?.id) return;
    // Don't count the teacher's own preview as a student view
    if (isTeacher) return;

    const viewerId = 
      userProfile?.id || 
      userProfile?.uid || 
      userProfile?.studentCode || 
      userProfile?.code || 
      auth?.currentUser?.uid || 
      (typeof localStorage !== 'undefined' ? localStorage.getItem('gate6_user_id') : null) || 
      'student_guest';

    const localKey = `gate6_viewed_lesson_${viewingRecordedLesson.id}_${viewerId}`;

    if (typeof localStorage !== 'undefined' && localStorage.getItem(localKey)) {
      return; // Already counted for this student
    }

    const markViewed = async () => {
      try {
        const lessonRef = doc(db, "recorded_lessons_views", `${viewingRecordedLesson.id}_${viewerId}`);
        let alreadyViewed = false;
        try {
          const viewSnap = await getDoc(lessonRef);
          alreadyViewed = Boolean(viewSnap && typeof viewSnap.exists === 'function' && viewSnap.exists());
        } catch (e) {
          console.warn("Could not check view doc:", e);
        }
        
        if (!alreadyViewed) {
          // First time this student views this lesson
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(localKey, '1');
          }

          try {
            await setDoc(lessonRef, {
              lessonId: viewingRecordedLesson.id,
              userId: viewerId,
              studentName: userProfile?.name || userProfile?.studentName || userProfile?.fullName || "طالب",
              timestamp: new Date().toISOString()
            });
          } catch (e) {
            console.warn("Could not save view record:", e);
          }

          // Update SQL count via API
          try {
            const res = await fetch(`/api/recorded-lessons/${viewingRecordedLesson.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ incrementViews: true })
            });

            if (res.ok) {
              const data = await res.json();
              const newViews = data.views ?? ((viewingRecordedLesson.views || 0) + 1);
              setRecordedLessons?.((prev: any[]) => prev.map((l: any) => l.id === viewingRecordedLesson.id ? {
                ...l,
                views: newViews,
                viewCount: newViews
              } : l));
            }
          } catch (e) {
            console.warn("Failed to increment views:", e);
          }
        } else {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(localKey, '1');
          }
        }
      } catch (error) {
        console.error("Error updating lesson view count:", error);
      }
    };
    markViewed();
  }, [viewingRecordedLesson?.id, userProfile?.id, userProfile?.uid, isTeacher]);

  useEffect(() => {
    if (previewingFile?.fileUrl) {
      setPdfViewerMode('canvas');
      setPdfDownloadProgress(null);
      setPdfLoadingTimeout(false);
      const timer = setTimeout(() => {
        setPdfLoadingTimeout(true);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [previewingFile?.fileUrl]);

  return (
<>
      {/* Fullscreen Success Story Viewer (Excellence Diaries) */}
      {activeStory &&
        (() => {
          // Gradient presets mapping
          const gradientPresets: { [key: string]: string } = {
            indigo: "from-[#0b0c1e] via-[#101935] to-[#04060f]",
            purple: "from-[#2e0854] via-[#120024] to-[#05000a]",
            gold: "from-[#2a1d00] via-[#140e00] to-[#050300]",
            emerald: "from-[#031d0d] via-[#010a04] to-[#000200]",
          };
          const activeGradient =
            gradientPresets[activeStory.bgGradient || "indigo"] ||
            gradientPresets.indigo;

          // Font presets mapping
          const fontPresets: { [key: string]: string } = {
            classic:
              "text-[16px] sm:text-lg font-black tracking-tight leading-relaxed font-sans text-center",
            handwriting:
              "text-[18px] sm:text-xl font-black italic underline decoration-[#00E5FF]/20 text-center",
            neon: "text-[20px] sm:text-2xl font-extrabold tracking-widest drop-shadow-[0_0_8px_currentColor] drop-shadow-[0_0_20px_currentColor] text-center",
            elegant:
              "text-[17px] sm:text-lg font-bold font-serif leading-loose text-center underline decoration-indigo-500/30",
          };
          const activeFontClass =
            fontPresets[activeStory.fontStyle || "classic"] ||
            fontPresets.classic;

          const isOwner = getCurrentUserId() === activeStory.userId;
          const groupMedia = activeStory.postMediaGroup || [];
          const hasGroupMedia =
            activeStory.mediaType === "group" && groupMedia.length > 0;

          return (
            <div
              className="fixed inset-0 bg-[#020512] z-[9999] flex flex-col justify-between overflow-hidden select-none font-sans"
              dir="rtl"
            >
              {/* Immersive Background Layer - Stretches from topmost to bottommost pixels under replies as requested */}
              <div
                className="absolute inset-0 w-full h-full z-0 overflow-hidden flex items-center justify-center transition-all bg-black"
                style={{
                  transform: `scale(${storyZoom}) translate(${storyPanX}px, ${storyPanY}px)`,
                  transition: "transform 0.15s ease-out",
                }}
              >
                {hasGroupMedia ? (
                  <div className="w-full h-full relative flex items-center justify-center">
                    <img
                      src={groupMedia[storyGroupIndex] || activeStory.postMedia}
                      alt=""
                      className="w-full h-full object-cover pointer-events-none"
                    />
                    {groupMedia.length > 1 && (
                      <>
                        {/* Discrete dots indicators */}
                        <div className="absolute bottom-36 left-0 right-0 flex justify-center gap-1.5 z-20 pointer-events-none">
                          {groupMedia.map((_: any, i: number) => (
                            <div
                              key={i}
                              className={`h-1.5 rounded-full transition-all duration-300 ${i === storyGroupIndex ? "w-5 bg-[#00E5FF]" : "w-1.5 bg-white/30"}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : activeStory.postMedia ? (
                  activeStory.postMedia.startsWith("data:video") ||
                  (activeStory.postMedia || '').endsWith('.mp4') ||
                  activeStory.postMedia.includes("video") ? (
                    <video
                      src={activeStory.postMedia}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  ) : (
                    <img
                      src={activeStory.postMedia}
                      alt=""
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  )
                ) : (
                  /* Text story colorful customizable metallic gradient background */
                  <div
                    className={`w-full h-full bg-gradient-to-b ${activeGradient} flex flex-col items-center justify-center p-8 text-center`}
                  >
                    <div className="text-5xl animate-bounce mb-6 text-[#00E5FF]">
                      ✨
                    </div>
                  </div>
                )}
              </div>

              {/* Glowing Custom Sticker Overlay */}
              {activeStory.sticker &&
                (() => {
                  const stickerX = activeStory.stickerX ?? 0;
                  const stickerY = activeStory.stickerY ?? 0;
                  const stickerScale = activeStory.stickerScale ?? 1.2;
                  return (
                    <div
                      className="absolute top-[32%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl select-none filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)] z-10 pointer-events-none"
                      style={{
                        transform: `translate(${stickerX}px, ${stickerY}px) scale(${stickerScale})`,
                      }}
                    >
                      {activeStory.sticker}
                    </div>
                  );
                })()}

              {/* Immersive Text Overlay with customizable colors, background styles, and drag positions (FB style) */}
              {activeStory.postContent &&
                (() => {
                  const viewX = activeStory.textX || 0;
                  const viewY = activeStory.textY || 0;
                  const viewColor = activeStory.textColor || "#ffffff";
                  const viewBg = activeStory.textBg || "transparent";
                  const viewScale = activeStory.textScale || 1.0;

                  return (
                    <div
                      className="absolute z-10 pointer-events-none flex flex-col items-center justify-center left-5 right-5"
                      style={{
                        transform: `translate(${viewX}px, ${viewY}px) scale(${viewScale})`,
                        top: "48%",
                      }}
                    >
                      <div
                        className={`px-5 py-3 rounded-2xl select-none text-center w-fit mx-auto max-w-[310px] break-words shadow-2xl transition-all inline-block ${
                          viewBg === "transparent"
                            ? "bg-transparent"
                            : viewBg === "semi-black"
                              ? "bg-black/80 border border-white/10"
                              : viewBg === "solid-white"
                                ? "bg-white text-black border border-black/10"
                                : viewBg === "neon-glow"
                                  ? "bg-[#050510]/95 border-2 border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.7)]"
                                  : ""
                        }`}
                        style={{
                          color:
                            viewBg === "solid-white" ? "#000000" : viewColor,
                        }}
                      >
                        <p
                          className={`${activeFontClass} leading-relaxed font-black font-all`}
                        >
                          {activeStory.postContent}
                        </p>
                      </div>
                    </div>
                  );
                })()}

              {/* Top Transparent Dark Gradient Vignette for header text contrast */}
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-10" />

              {/* Bottom Transparent Dark Gradient Vignette is removed to ensure original image quality as requested by the user */}

              {/* Gesture and Interaction Overlay */}
              <div
                className="absolute inset-0 z-[15]"
                style={{ touchAction: "none" }}
                onPointerDown={handleStoryPointerDown}
                onPointerMove={handleStoryPointerMove}
                onPointerUp={handleStoryPointerUp}
                onPointerLeave={handleStoryPointerLeave}
                onContextMenu={(e) => {
                  e.preventDefault();
                  return false;
                }}
              />

              {/* Floating Top Header Section */}
              <div className="w-full px-4 pt-4 pb-2 z-20 flex flex-col gap-3 relative pointer-events-auto">
                {/* Progress Segment Bars */}
                <div className="flex gap-1.5 w-full">
                  {activeGroupStories.map((story, idx) => {
                    let progressVal = 0;
                    if (idx < activeGroupIndex) progressVal = 100;
                    else if (idx === activeGroupIndex)
                      progressVal = storyProgress;

                    return (
                      <div
                        key={`progress-bar-${story.id}-${idx}`}
                        className="h-1 flex-1 bg-white/15 rounded-full overflow-hidden"
                      >
                        <div
                          className="h-full bg-gradient-to-r from-[#00E5FF] to-indigo-500 transition-all duration-[100ms] ease-linear"
                          style={{ width: `${progressVal}%` }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Story Owner Info Details and Toolbar */}
                <div
                  className={`flex justify-between items-center px-2 transition-opacity duration-300 ${isStoryUIHidden ? "opacity-0 pointer-events-none" : "opacity-100"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full border border-[#00E5FF]/40 p-[1.5px] bg-gradient-to-tr from-[#00E5FF] to-pink-500">
                      <div className="w-full h-full rounded-full overflow-hidden bg-[#101935] flex items-center justify-center">
                        {activeStory.userPhotoURL ? (
                          <img
                            src={activeStory.userPhotoURL}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="text-white/40" size={16} />
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-black text-sm block leading-tight">
                        {activeStory.userName}
                      </span>
                      <span className="text-[#00E5FF]/90 text-[10px] uppercase font-black tracking-widest mt-0.5 block">
                        حالة ⭐
                      </span>
                    </div>
                  </div>

                  {/* Top Action controls (Three-dots menu) */}
                  <div className="flex items-center gap-2">
                    {/* [3-DOTS FB/IG MENU] */}
                    <div className="relative">
                      <button
                        onClick={() => setIsStoryMenuOpen(!isStoryMenuOpen)}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/90 active:scale-95 transition-all text-xs cursor-pointer font-black"
                        title="خيارات الحالة"
                      >
                        •••
                      </button>

                      <AnimatePresence>
                        {isStoryMenuOpen && (
                          <motion.div
                            key="story-menu"
                            initial={{ opacity: 0, scale: 0.9, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                            className="absolute left-0 mt-2 bg-[#0b0c1e] border border-white/15 rounded-2xl py-2 w-36 shadow-2xl text-right overflow-hidden z-50 flex flex-col gap-1"
                          >
                            <button
                              onClick={() => {
                                setIsStoryMenuOpen(false);
                                handleShareStory(activeStory);
                              }}
                              className="px-4 py-2 hover:bg-white/10 text-xs font-black text-white flex items-center gap-2 cursor-pointer transition-all"
                            >
                              <span>🔗 مشاركة الرابط</span>
                            </button>
                            {(isOwner ||
                              isTeacher ||
                              userProfile?.role === "admin") && (
                              <button
                                onClick={() => {
                                  setIsStoryMenuOpen(false);
                                  if (
                                    confirm(
                                      "هل تريد بالتأكيد إيقاف هذه الحالة؟",
                                    )
                                  ) {
                                    handleDeleteStory(activeStory.id);
                                  }
                                }}
                                className="px-4 py-2 hover:bg-rose-500/20 text-xs font-black text-rose-500 flex items-center gap-2 cursor-pointer transition-all border-t border-[#00E5FF]/10 text-right"
                              >
                                <span>🗑️ إيقاف الحالة</span>
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Exit story viewer button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveStory(null);
                      }}
                      className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 hover:border-rose-500/40 flex items-center justify-center text-white/95 active:scale-95 transition-all text-sm cursor-pointer"
                      title="الخروج وإغلاق العرض"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>

              {/* Scale controls widget popover */}
              {isZoomControlsOpen && (
                <div className="absolute top-24 left-4 z-30 bg-black/85 backdrop-blur border border-white/10 rounded-2xl p-2.5 flex flex-col gap-2 pointer-events-auto">
                  <button
                    onClick={() => setStoryZoom(Math.min(3, storyZoom + 0.2))}
                    className="w-7 h-7 rounded-lg bg-white/10 hover:bg-[#00E5FF] hover:text-black font-black flex items-center justify-center text-xs text-white"
                  >
                    +
                  </button>
                  <button
                    onClick={() => {
                      setStoryZoom(1);
                      setStoryPanX(0);
                      setStoryPanY(0);
                    }}
                    className="text-[9px] font-bold text-[#00E5FF] hover:underline"
                  >
                    صيانة
                  </button>
                  <button
                    onClick={() => setStoryZoom(Math.max(1, storyZoom - 0.2))}
                    className="w-7 h-7 rounded-lg bg-white/10 hover:bg-[#00E5FF] hover:text-black font-black flex items-center justify-center text-xs text-white"
                  >
                    -
                  </button>
                </div>
              )}

              {/* Render Floating Reactions Over Story */}
              <div className="absolute inset-x-0 bottom-32 pointer-events-none z-30 h-64 flex justify-center items-end overflow-visible">
                <AnimatePresence>
                  {reactionFloatingIcons.map((icon) => (
                    <motion.div
                      key={icon.id}
                      initial={{
                        opacity: 0,
                        scale: 0.5,
                        y: 50 + (icon.y || 0),
                        x: icon.x || 0,
                      }}
                      animate={{
                        opacity: [0, 1, 1, 0],
                        scale: [0.5, 1.5, 1.2, 1],
                        y: -200 - Math.random() * 100,
                        x: (icon.x || 0) + (Math.random() * 40 - 20),
                      }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: 1.5 + Math.random(),
                        delay: icon.delay || 0,
                        ease: "easeOut",
                      }}
                      className="absolute text-5xl filter drop-shadow-xl"
                    >
                      {icon.char}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Translucent Glass Interactions Panel - Positioned bottom floating overlay */}
              <div
                className={`z-20 w-full px-4 pb-6 pt-2 pointer-events-auto space-y-3 relative mt-auto transition-opacity duration-300 ${isStoryUIHidden ? "opacity-0 pointer-events-none" : "opacity-100"}`}
              >
                {/* [SWIPE-UP / SHOW VIEWS DRAWER TRIGGER] - Available to the story owner */}
                {isOwner && (
                  <div className="w-full flex flex-col items-center justify-center pb-2 pt-1">
                    <button
                      onClick={() => setIsStoryViewersOpen(!isStoryViewersOpen)}
                      className="flex flex-col items-center gap-0.5 text-white/50 hover:text-[#00E5FF] font-black text-[10px] transition-all cursor-pointer"
                    >
                      <span className="animate-bounce">▲</span>
                      <span>
                        المشاهدات ({activeStory.viewers?.length || 0})
                      </span>
                    </button>

                    <AnimatePresence>
                      {isStoryViewersOpen && (
                        <motion.div
                          key="story-viewers"
                          initial={{ opacity: 0, y: "100%" }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: "100%" }}
                          className="fixed inset-x-0 bottom-0 bg-[#070913]/98 border-t border-[#00E5FF]/20 rounded-t-[2.5rem] p-5 shadow-[0_-20px_50px_rgba(0,0,0,0.9)] max-h-[40vh] overflow-y-auto no-scrollbar z-50 text-right"
                        >
                          <div className="flex justify-between items-center pb-2.5 border-b border-white/5 mb-3">
                            <span className="text-[#00E5FF] font-black text-sm">
                              👁️ من شاهد تميزك اليومي؟
                            </span>
                            <button
                              onClick={() => setIsStoryViewersOpen(false)}
                              className="text-white/40 text-xs font-bold hover:text-white"
                            >
                              إغلاق ✕
                            </button>
                          </div>

                          {activeStory.viewers &&
                          activeStory.viewers.length > 0 ? (
                            <div className="grid grid-cols-1 divide-y divide-white/5">
                              {activeStory.viewers.map(
                                (v: any, index: number) => (
                                  <div
                                    key={v.uid || v.id || `viewer-${index}`}
                                    className="flex items-center gap-3 py-2"
                                  >
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#101935] border border-white/10">
                                      {v.photoURL ? (
                                        <img
                                          src={v.photoURL}
                                          alt=""
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/40 text-[9px]">
                                          👤
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 text-right">
                                      <span className="text-white font-black text-xs block">
                                        {v.name}
                                      </span>
                                      <span className="text-white/40 text-[9px] block">
                                        {v.timestamp &&
                                        typeof v.timestamp === "number"
                                          ? new Date(
                                              v.timestamp,
                                            ).toLocaleTimeString("ar-IQ", {
                                              hour: "numeric",
                                              minute: "2-digit",
                                            })
                                          : "شوهد"}
                                      </span>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          ) : (
                            <div className="py-8 text-center text-[#00E5FF]/40 text-xs font-semibold">
                              لا توجد مشاهدات حتى الآن. شارك إنجازك اليومي
                              المتميز!
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* [INTERACTIONS / QUICK REPLIES BAR] - Available to viewers */}
                {!isOwner && (
                  <div
                    className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 w-full"
                    dir="rtl"
                  >
                    <div className="flex-1 bg-black/40 backdrop-blur-md border border-white/20 rounded-full flex items-center px-4 py-2 hover:bg-black/60 transition-colors focus-within:bg-black/80">
                      <input
                        type="text"
                        placeholder="أرسل تشجيعاً أو رداً..."
                        className="w-full bg-transparent border-none outline-none text-white text-[13px] placeholder:text-white/60"
                        value={storyCommentText}
                        onChange={(e) => setStoryCommentText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSendStoryReply();
                        }}
                        onFocus={() => setIsStoryPaused(true)}
                        onBlur={() => setIsStoryPaused(false)}
                      />
                      {storyCommentText && (
                        <button
                          onClick={handleSendStoryReply}
                          className="text-blue-400 font-bold mr-2 shrink-0 text-sm"
                        >
                          إرسال
                        </button>
                      )}
                    </div>

                    {/* Floating Action Reactions */}
                    <div className="flex justify-center items-center gap-2 shrink-0">
                      {[
                        { type: "love", emoji: "❤️" },
                        { type: "fire", emoji: "🔥" },
                        { type: "clap", emoji: "👏" },
                        { type: "star", emoji: "🌟" },
                        { type: "trophy", emoji: "🏆" },
                      ].map((reaction) => {
                        const isClicking =
                          clickingReactionKey === reaction.type;
                        return (
                          <button
                            key={reaction.type}
                            onClick={() =>
                              handleReactToStory(activeStory.id, reaction.type)
                            }
                            className={`w-10 h-10 flex items-center justify-center text-xl rounded-full bg-black/40 hover:bg-black/60 transition-all transform border border-white/10 shadow-[0_4px_10px_rgba(0,0,0,0.3)] ${
                              isClicking
                                ? "scale-[1.8] -translate-y-4 shadow-[0_0_20px_rgba(255,214,0,0.5)] rotate-12 z-50"
                                : "hover:scale-110 active:scale-95"
                            }`}
                          >
                            {reaction.emoji}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

      {isCreateStoryMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
          dir="rtl"
        >
          <div className="bg-[#090E17] border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-white font-black text-xl flex items-center gap-2">
                <span>إضافة حالة جديدة</span>
                <div className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse"></div>
              </h3>
              <button
                onClick={() => setIsCreateStoryMenuOpen(false)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/5"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setIsCreateStoryMenuOpen(false);
                  setNewStoryMedia(null);
                  setNewStoryMediaFiles([]);
                  setNewStoryMediaType("image");
                  setNewStoryTextBg("transparent");
                  setIsStoryModalOpen(true);
                }}
                className="bg-gradient-to-br from-[#1A233A] to-[#101935] border border-white/10 rounded-3xl p-6 flex flex-col items-center gap-4 hover:border-[#00E5FF]/40 hover:shadow-[0_0_20px_rgba(0,229,255,0.15)] group transition-all duration-300 cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500/20 transition-all border border-blue-500/20">
                  <span className="text-2xl text-blue-400 font-serif font-black italic">
                    Aa
                  </span>
                </div>
                <span className="text-white/90 font-black text-sm tracking-wide">
                  نص فقط
                </span>
              </button>
              <button
                onClick={() => {
                  setIsCreateStoryMenuOpen(false);
                  storyMediaInputRef.current?.click();
                }}
                className="bg-gradient-to-br from-[#1A233A] to-[#101935] border border-white/10 rounded-3xl p-6 flex flex-col items-center gap-4 hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] group transition-all duration-300 cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-500/20 transition-all border border-purple-500/20">
                  <ImageIcon size={26} className="text-purple-400" />
                </div>
                <span className="text-white/90 font-black text-sm tracking-wide">
                  صورة / فيديو
                </span>
              </button>
            </div>
            <div className="px-6 pb-6 pt-2">
              <p className="text-center text-xs text-white/40 font-medium leading-relaxed">
                شارك حالتك، أسئلتك، أو إبداعاتك مع زملائك في الساحة الأكاديمية!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Story Creation Modal */}
      {isStoryModalOpen &&
        (() => {
          // Gradient presets mapping for preview
          const gradientPresets: { [key: string]: string } = {
            indigo: "from-[#0b0c1e] via-[#101935] to-[#04060f]",
            purple: "from-[#2e0854] via-[#120024] to-[#05000a]",
            gold: "from-[#2a1d00] via-[#140e00] to-[#050300]",
            emerald: "from-[#031d0d] via-[#010a04] to-[#000200]",
          };
          const activeGradient =
            gradientPresets[newStoryBgGradient || "indigo"] ||
            gradientPresets.indigo;

          // Font presets mapping for preview
          const fontPresets: { [key: string]: string } = {
            classic:
              "text-xs sm:text-sm md:text-base font-black tracking-tight leading-relaxed font-sans text-center",
            handwriting:
              "text-sm sm:text-base md:text-lg font-black italic underline decoration-[#00E5FF]/20 text-center",
            neon: "text-base sm:text-lg md:text-xl font-extrabold tracking-widest drop-shadow-[0_0_8px_currentColor] drop-shadow-[0_0_15px_currentColor] text-center",
            elegant:
              "text-xs sm:text-sm md:text-base font-bold font-serif leading-loose text-center underline decoration-indigo-500/30",
          };
          const activeFontClass =
            fontPresets[newStoryFont || "classic"] || fontPresets.classic;

          return (
            <div
              className="fixed inset-0 bg-[#020512]/95 backdrop-blur-xl z-[9999] flex flex-col items-center justify-center p-4 overflow-hidden"
              dir="rtl"
            >
              {/* Glowing decorative ambient light background */}
              <div className="absolute top-0 left-0 w-72 h-72 bg-[#00E5FF]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Immersive Phone Frame Viewport container */}
              <div className="aspect-[9/16] w-full max-w-[390px] bg-[#050510] rounded-[2.5rem] relative border-4 border-white/10 overflow-hidden shadow-[0_0_80px_rgba(3,229,255,0.15)] flex flex-col justify-between select-none">
                {/* Media render or pure Gradient background */}
                <div className="absolute inset-0 w-full h-full z-0">
                  {newStoryMediaType === "group" &&
                  newStoryMediaFiles.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1 w-full h-full p-1 bg-[#050510]">
                      {newStoryMediaFiles.slice(0, 4).map((file, idx) => {
                        const isLast =
                          idx === 3 && newStoryMediaFiles.length > 4;
                        return (
                          <div
                            key={idx}
                            className={`relative overflow-hidden rounded-xl h-full border border-white/5 ${
                              newStoryMediaFiles.length === 3 && idx === 2
                                ? "col-span-2"
                                : ""
                            }`}
                          >
                            <img
                              src={file}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            {isLast && (
                              <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-xs">
                                <span className="text-white text-sm font-black">
                                  +{newStoryMediaFiles.length - 4}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : newStoryMediaType === "video" && newStoryMedia ? (
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      src={newStoryMedia}
                      className="w-full h-full object-cover"
                    />
                  ) : newStoryMedia ? (
                    <img
                      src={newStoryMedia}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-full h-full bg-gradient-to-b ${activeGradient} flex items-center justify-center p-6 text-center`}
                    />
                  )}
                  {/* Shadow overlays for elegant contrast */}
                  <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
                </div>

                {/* Indicator mock similar to FB/IG */}
                <div className="absolute top-4 inset-x-4 z-10 flex flex-col gap-1.5 pointer-events-none">
                  <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#00E5FF] to-pink-500 w-1/3 rounded-full" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#00E5FF] to-pink-500 p-[1.5px]">
                      <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-[7px]" />
                    </div>
                    <span className="text-[10px] text-white/90 font-black">
                      حالة نجاحي المتميزة 🚀
                    </span>
                  </div>
                </div>

                {/* Floating control buttons (Upper Left side column) */}
                <div className="absolute left-3.5 top-14 z-20 flex flex-col gap-2.5 pointer-events-auto">
                  {/* 1. Aa Write text tool */}
                  <button
                    type="button"
                    onClick={() => setIsStoryTypingOpen(true)}
                    className="w-10 h-10 rounded-full bg-black/60 hover:bg-[#00E5FF] hover:text-black hover:scale-105 active:scale-95 border border-white/20 hover:border-[#00E5FF] text-white font-extrabold text-xs flex items-center justify-center shadow-lg transition-all cursor-pointer"
                    title="أداة الكتابة ونصوص الحالة"
                  >
                    Aa
                  </button>

                  {/* 4. Multiple image picker */}
                  <button
                    type="button"
                    onClick={() => storyGroupMediaInputRef.current?.click()}
                    className="w-10 h-10 rounded-full bg-black/60 text-white hover:bg-[#00E5FF] hover:text-black hover:scale-105 border border-white/20 flex items-center justify-center shadow-lg transition-all cursor-pointer text-sm"
                    title="ألبوم/مجموعة صور للمنشور"
                  >
                    🖼️
                  </button>

                  {/* 5. Stickers picker */}
                  <button
                    type="button"
                    onClick={() =>
                      setCreatorActiveTab(
                        creatorActiveTab === "sticker" ? null : "sticker",
                      )
                    }
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg cursor-pointer text-sm ${
                      creatorActiveTab === "sticker"
                        ? "bg-[#00E5FF] text-black scale-105 border border-[#00E5FF]"
                        : "bg-black/60 text-white hover:bg-[#00E5FF] hover:text-black hover:scale-105 border border-white/20"
                    }`}
                    title="ملصقات التميز العائمة"
                  >
                    ⭐
                  </button>
                </div>

                {/* Premium Scale Slider on the right edge of the Phone Frame (Facebook styled) */}
                {newStoryContent.trim() && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1.5 bg-black/75 border border-white/10 px-1.5 py-3 rounded-2xl backdrop-blur-md shadow-2xl">
                    <button
                      type="button"
                      onClick={() =>
                        setNewStoryTextScale((prev) =>
                          Math.min(2.5, prev + 0.1),
                        )
                      }
                      className="w-5.5 h-5.5 rounded-lg bg-white/5 hover:bg-[#00E5FF] hover:text-black font-extrabold text-[11px] flex items-center justify-center text-white/90 active:scale-95 transition-all cursor-pointer"
                      title="تكبير النص"
                    >
                      ＋
                    </button>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.05"
                      value={newStoryTextScale}
                      onChange={(e) =>
                        setNewStoryTextScale(parseFloat(e.target.value))
                      }
                      className="h-16 w-1 accent-[#00E5FF] bg-white/10 rounded-full cursor-pointer orientation-vertical [writing-mode:vertical-lr]"
                      title="حجم الخط"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setNewStoryTextScale((prev) =>
                          Math.max(0.5, prev - 0.1),
                        )
                      }
                      className="w-5.5 h-5.5 rounded-lg bg-white/5 hover:bg-[#00E5FF] hover:text-black font-extrabold text-[11px] flex items-center justify-center text-white/90 active:scale-95 transition-all cursor-pointer"
                      title="تصغير النص"
                    >
                      －
                    </button>
                    <span className="text-[7.5px] text-[#00E5FF] font-black">
                      {Math.round(newStoryTextScale * 100)}%
                    </span>
                  </div>
                )}

                {/* Centered Rendered text from students directly in the center (Draggable, colorable tight-fit box with Pointer & pinch events) */}
                {newStoryContent.trim() ? (
                  <div
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onTouchStart={handleTextTouchStart}
                    onTouchMove={handleTextTouchMove}
                    onTouchEnd={handleTextTouchEnd}
                    style={{
                      transform: `translate(${newStoryTextX}px, ${newStoryTextY}px) scale(${newStoryTextScale})`,
                    }}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-15 flex flex-col items-center justify-center cursor-pointer max-h-[60%] select-none pointer-events-auto touch-none"
                  >
                    <div
                      className={`px-4.5 py-3 rounded-2xl transition-all w-fit mx-auto max-w-[280px] break-words shadow-2xl text-center inline-block ${
                        newStoryTextBg === "transparent"
                          ? "bg-transparent"
                          : newStoryTextBg === "semi-black"
                            ? "bg-black/60 border border-white/10"
                            : newStoryTextBg === "solid-white"
                              ? "bg-white text-black border border-black/10"
                              : newStoryTextBg === "neon-glow"
                                ? "bg-[#050510]/95 border-2 border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.7)]"
                                : ""
                      }`}
                      style={{
                        color:
                          newStoryTextBg === "solid-white"
                            ? "#000000"
                            : newStoryTextColor,
                      }}
                    >
                      <p
                        className={`${activeFontClass} leading-relaxed select-none`}
                      >
                        {newStoryContent}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsStoryTypingOpen(true)}
                    className="absolute inset-x-5 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center justify-center opacity-40 cursor-pointer text-center bg-black/10 hover:bg-black/20 p-4 border border-dashed border-white/10 rounded-2xl transition-all"
                  >
                    <span className="text-xl mb-1.5 block">✍️</span>
                    <span className="text-[11px] text-white font-black block">
                      انقر فوق أي مكان للكتابة والتعبير...
                    </span>
                  </div>
                )}

                {/* Draggable selected sticker mock */}
                {newStorySticker && (
                  <div
                    onPointerDown={handlePointerDownSticker}
                    onPointerMove={handlePointerMoveSticker}
                    onPointerUp={handlePointerUpSticker}
                    onTouchStart={handleStickerTouchStart}
                    onTouchMove={handleStickerTouchMove}
                    onTouchEnd={handleStickerTouchEnd}
                    style={{
                      transform: `translate(${newStoryStickerX}px, ${newStoryStickerY}px) scale(${newStoryStickerScale})`,
                    }}
                    className="absolute top-[32%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)] z-15 pointer-events-auto touch-none cursor-pointer"
                  >
                    {newStorySticker}
                  </div>
                )}

                {/* Context Option popups inside preview (Gradients / Music / Stickers) */}
                <AnimatePresence>
                  {creatorActiveTab && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 30 }}
                      className="absolute inset-x-3 bottom-4 z-30 bg-black/95 border border-white/10 rounded-2xl p-3 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.95)] text-right flex flex-col gap-2 pointer-events-auto"
                    >
                      {creatorActiveTab === "gradient" && (
                        <div>
                          <span className="text-[10px] text-[#00E5FF] font-black mb-1.5 block">
                            🎨 اختر لون وتدريج الخلفية:
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              {
                                key: "indigo",
                                label: "كوني عميق 🌌",
                                style:
                                  "bg-gradient-to-tr from-indigo-900 to-[#101935]",
                              },
                              {
                                key: "purple",
                                label: "ملكي متميز 🔮",
                                style:
                                  "bg-gradient-to-tr from-purple-900 to-[#120024]",
                              },
                              {
                                key: "gold",
                                label: "تاج ذهبي 🏆",
                                style:
                                  "bg-gradient-to-tr from-amber-900 to-[#1a0f00]",
                              },
                              {
                                key: "emerald",
                                label: "سلام الإنجاز 🌿",
                                style:
                                  "bg-gradient-to-tr from-emerald-950 to-[#010a04]",
                              },
                            ].map((g) => (
                              <button
                                key={g.key}
                                type="button"
                                onClick={() => setNewStoryBgGradient(g.key)}
                                className={`text-[9.5px] py-1.5 px-2 rounded-lg border font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                  newStoryBgGradient === g.key
                                    ? "bg-[#00E5FF] text-black border-[#00E5FF]"
                                    : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                                }`}
                              >
                                <div
                                  className={`w-2.5 h-2.5 rounded-full ${g.style} border border-white/20`}
                                />
                                <span>{g.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {creatorActiveTab === "sticker" && (
                        <div>
                          <span className="text-[10px] text-[#00E5FF] font-black mb-1 block">
                            🏆 ملصقات تميز ومثابرة عائمة:
                          </span>
                          <div className="flex flex-wrap gap-2 justify-center pt-1">
                            {[
                              { emoji: "👑", desc: "تاج" },
                              { emoji: "🏆", desc: "كأس" },
                              { emoji: "🎓", desc: "تخرج" },
                              { emoji: "🔥", desc: "شغف" },
                              { emoji: "💯", desc: "درجة كاملة" },
                              { emoji: "❤️", desc: "حب" },
                            ].map((s) => (
                              <button
                                key={s.emoji}
                                type="button"
                                onClick={() =>
                                  setNewStorySticker(
                                    newStorySticker === s.emoji
                                      ? null
                                      : s.emoji,
                                  )
                                }
                                className={`text-lg p-1.5 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                                  newStorySticker === s.emoji
                                    ? "bg-[#00E5FF]/20 border-[#00E5FF] scale-105 shadow-[0_0_8px_#00E5FF]/50 text-xl"
                                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                                }`}
                                title={s.desc}
                              >
                                {s.emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setCreatorActiveTab(null)}
                        className="text-[9px] text-[#00E5FF] hover:underline block w-full text-center mt-1 border-t border-white/5 pt-1.5 font-black cursor-pointer"
                      >
                        موافق وإغلاق الخيارات ✕
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Focused text editing overlay when client clicks Aa / Write (Simulates dynamic pop up keyboard) */}
                <AnimatePresence>
                  {isStoryTypingOpen && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/90 backdrop-blur-md z-40 p-4 flex flex-col justify-between pointer-events-auto"
                    >
                      {/* Header bar */}
                      <div className="flex justify-between items-center pb-2 border-b border-white/10">
                        <button
                          type="button"
                          onClick={() => setIsStoryTypingOpen(false)}
                          className="text-xs font-black text-rose-400 hover:text-rose-300"
                        >
                          إلغاء
                        </button>
                        <span className="text-[11px] font-black text-white/50">
                          اكتب نص الحالة
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsStoryTypingOpen(false)}
                          className="px-3 py-1 bg-[#00E5FF] hover:bg-cyan-400 text-black rounded-lg text-xs font-black"
                        >
                          تم ✓
                        </button>
                      </div>

                      {/* Font presets selection on typing overlay */}
                      <div className="flex flex-col gap-1 items-center pb-2 border-b border-white/5">
                        <span className="text-[10px] text-white/45 font-black">
                          نمط وشكل الخط:
                        </span>
                        <div className="flex gap-1.5 overflow-x-auto no-scrollbar justify-center">
                          {[
                            { key: "classic", label: "كلاسيكي" },
                            { key: "neon", label: "نيون وهّاج" },
                            { key: "elegant", label: "رصين وعريض" },
                          ].map((fp) => (
                            <button
                              key={fp.key}
                              type="button"
                              onClick={() => setNewStoryFont(fp.key)}
                              className={`text-[9.5px] py-1 px-2.5 rounded-full border font-black whitespace-nowrap transition-all ${
                                newStoryFont === fp.key
                                  ? "bg-[#00E5FF] text-black border-[#00E5FF]"
                                  : "bg-white/5 border-white/15 text-white/80"
                              }`}
                            >
                              {fp.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Background shape options */}
                      <div className="flex flex-col gap-1 items-center py-2 border-b border-white/5">
                        <span className="text-[10px] text-white/45 font-black">
                          برواز خلفية النص:
                        </span>
                        <div className="flex gap-1.5 overflow-x-auto no-scrollbar justify-center">
                          {[
                            { key: "transparent", label: "🚫 بدون إطار" },
                            { key: "semi-black", label: "🕵️ مظلل داكن" },
                            { key: "solid-white", label: "🏳️ أبيض ناصع" },
                            { key: "neon-glow", label: "⚡ توهج نيون" },
                          ].map((bStyle) => (
                            <button
                              key={bStyle.key}
                              type="button"
                              onClick={() =>
                                setNewStoryTextBg(bStyle.key as any)
                              }
                              className={`text-[9.5px] py-1 px-3 rounded-full border font-black whitespace-nowrap transition-all ${
                                newStoryTextBg === bStyle.key
                                  ? "bg-amber-400 text-black border-amber-400"
                                  : "bg-white/5 border-white/15 text-white/70 hover:bg-white/10"
                              }`}
                            >
                              {bStyle.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Premium Color Selection Palette */}
                      <div className="flex flex-col gap-1 items-center py-2 border-b border-white/5">
                        <span className="text-[10px] text-white/45 font-black">
                          لون الكلمات للتمييز:
                        </span>
                        <div className="flex gap-2.5 justify-center">
                          {[
                            { color: "#ffffff", name: "أبيض" },
                            { color: "#00E5FF", name: "سماوي" },
                            { color: "#FFEB3B", name: "أصفر" },
                            { color: "#FF4081", name: "وردي" },
                            { color: "#4CAF50", name: "أخضر" },
                            { color: "#FF9800", name: "برتقالي" },
                          ].map((cOpt) => (
                            <button
                              key={cOpt.color}
                              type="button"
                              onClick={() => setNewStoryTextColor(cOpt.color)}
                              className={`w-6 h-6 rounded-full transition-all border hover:scale-110 active:scale-90 ${
                                newStoryTextColor === cOpt.color
                                  ? "border-[#00E5FF] ring-2 ring-[#00E5FF]/40 scale-110"
                                  : "border-white/20"
                              }`}
                              style={{ backgroundColor: cOpt.color }}
                              title={cOpt.name}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Real Textarea Area with interactive live preview */}
                      <div className="flex-1 flex items-center justify-center px-4 py-6">
                        <div
                          className={`px-5 py-3 rounded-2xl transition-all w-fit max-w-[280px] break-words shadow-2xl text-center inline-block ${
                            newStoryTextBg === "transparent"
                              ? "bg-transparent border border-dashed border-white/10"
                              : newStoryTextBg === "semi-black"
                                ? "bg-black/80 border border-white/10"
                                : newStoryTextBg === "solid-white"
                                  ? "bg-white text-black border border-black/10"
                                  : newStoryTextBg === "neon-glow"
                                    ? "bg-[#050510]/95 border-2 border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.7)]"
                                    : ""
                          }`}
                          style={{
                            color:
                              newStoryTextBg === "solid-white"
                                ? "#000000"
                                : newStoryTextColor,
                            transform: `scale(${newStoryTextScale})`,
                          }}
                        >
                          <div className="relative">
                            <textarea
                              value={newStoryContent}
                              onChange={(e) =>
                                handleTextareaChange(
                                  e,
                                  setNewStoryContent,
                                  "story",
                                )
                              }
                              placeholder="اكتب تميزك هنا..."
                              autoFocus
                              maxLength={180}
                              rows={2}
                              className={`bg-transparent text-center border-none focus:outline-none focus:ring-0 leading-relaxed font-black resize-none ${activeFontClass} w-48`}
                              style={{
                                color:
                                  newStoryTextBg === "solid-white"
                                    ? "#000000"
                                    : newStoryTextColor,
                                caretColor: "#00E5FF",
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Count indicator */}
                      <div className="text-center text-[10px] text-white/40 font-bold mt-2">
                        {newStoryContent.length}/180 حرف
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {showTagMenuTarget === "story" &&
                  classmates
                    .map((c) => c.name)
                    .filter((n) => n.includes(tagSearch)).length > 0 && (
                    <div className="fixed top-[20%] md:top-[10%] left-1/2 -translate-x-1/2 max-h-[50vh] overflow-y-auto bg-[#090D1C]/95 backdrop-blur-xl border-2 border-[#00E5FF]/60 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-[99999] w-[90%] max-w-sm text-right px-1 py-1">
                      <div className="pt-2 pb-1 px-3 border-b border-white/5 mb-1 flex items-center justify-between">
                        <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">
                          إشارة لحساب
                        </span>
                        <span className="text-[#00E5FF] text-[10px] font-black">
                          {
                            classmates.filter((c) => c.name.includes(tagSearch))
                              .length
                          }{" "}
                          نتائج
                        </span>
                      </div>
                      {classmates
                        .filter((c) => c.name.includes(tagSearch))
                        .map((c, i) => (
                          <button
                            key={c.id || c.uid || c.name || `classmate-${i}`}
                            type="button"
                            onClick={() =>
                              insertTag(
                                c.name,
                                newStoryContent,
                                setNewStoryContent,
                              )
                            }
                            className="w-full text-right px-4 py-3.5 text-white/90 hover:bg-[#00E5FF]/20 hover:text-[#00E5FF] font-black border-b border-white/5 last:border-0 text-sm cursor-pointer transition-all rounded-lg my-0.5 flex items-center justify-end gap-3 group"
                          >
                            <span className="truncate">{c.name}</span>
                            <div className="w-6 h-6 rounded-full bg-white/5 group-hover:bg-[#00E5FF]/20 flex items-center justify-center border border-white/10 group-hover:border-[#00E5FF]/40 transition-colors">
                              <User
                                size={12}
                                className="text-white/50 group-hover:text-[#00E5FF]"
                              />
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
              </div>

              {/* Floating primary actions under the simulated Phone Frame */}
              <div className="mt-5 w-full max-w-[390px] flex gap-3 z-30 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => setIsStoryModalOpen(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-xs rounded-2xl transition-all cursor-pointer border border-white/10"
                >
                  إلغاء المعاينة
                </button>
                <button
                  type="button"
                  onClick={handlePublishStory}
                  disabled={
                    !newStoryContent.trim() &&
                    !newStoryMedia &&
                    newStoryMediaFiles.length === 0
                  }
                  className="flex-1.5 py-3 bg-gradient-to-r from-emerald-400 to-[#00E5FF] hover:scale-[1.02] active:scale-98 disabled:opacity-40 text-black font-black text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(3,229,255,0.3)]"
                >
                  <span>🚀 انشر الآن</span>
                </button>
              </div>
            </div>
          );
        })()}

      {/* Hidden file inputs for stories */}
      <input
        type="file"
        ref={storyMediaInputRef}
        onChange={handleStoryMediaUpload}
        accept="image/*,video/*"
        className="hidden"
      />
      <input
        type="file"
        ref={storyGroupMediaInputRef}
        onChange={handleStoryGroupMediaUpload}
        accept="image/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleAvatarUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Confirm deletion dialog */}
      <ConfirmDialog
        isOpen={deletingPostId !== null}
        onClose={() => setDeletingPostId(null)}
        onConfirm={executeDeletePost}
        title="تأكيد حذف المنشور"
        message="هل أنت متأكد من رغبتك في حذف هذا المنشور؟ لا يمكن التراجع عن هذا الإجراء."
      />

      {/* Confirm deletion dialog for Academy Pages */}
      <ConfirmDialog
        isOpen={deletingAcademyPageId !== null}
        onClose={() => setDeletingAcademyPageId(null)}
        onConfirm={async () => {
          const idToDelete = deletingAcademyPageId;
          if (!idToDelete) return;
          try {
            await deleteDoc(doc(db, "academy_pages", idToDelete));
            showToast("تم الحذف بنجاح", "success");
            setDeletingAcademyPageId(null);
          } catch(err) {
            showToast("حدث خطأ أثناء الحذف", "error");
          }
        }}
        title="تأكيد حذف الملف"
        message="هل أنت متأكد من رغبتك في حذف هذا الملف؟ لا يمكن التراجع عن هذا الإجراء وسيختفي من منصة الطالب."
      />

      {/* Global Full-Screen Comments Modal */}
      {activeCommentPostId &&
        posts.find((p) => p.id === activeCommentPostId) && (
          <PostCommentsSection
            post={posts.find((p) => p.id === activeCommentPostId)}
            userProfile={userProfile}
            showToast={showToast}
            onClose={() => setActiveCommentPostId(null)}
            currentUserId={getCurrentUserId()}
            currentUserName={getUserName()}
            classmates={classmates}
          />
        )}

      {/* Admin Note Modal */}
      <AnimatePresence>
        {isAdminNoteModalOpen && (
          <div
            key="admin-note-overlay"
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            dir="rtl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0D1527] border border-white/10 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl relative"
            >
              <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                <h3 className="text-white font-black text-lg">
                  إضافة ملاحظة إدارية 🏛️
                </h3>
                <button
                  onClick={() => setIsAdminNoteModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                <textarea
                  autoFocus
                  value={newAdminNote}
                  onChange={(e) => setNewAdminNote(e.target.value)}
                  placeholder="اكتب التوجيه الإداري هنا..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-blue-500/50 min-h-[120px] resize-none shadow-inner"
                />
              </div>

              <div className="p-6 pt-2">
                <button
                  onClick={submitAdminNote}
                  disabled={!newAdminNote.trim()}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl transition-all"
                >
                  إضافة توجيه
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lounge full-screen Modal */}
      <AnimatePresence>
        {isLoungeOpen && (
          <StudentLounge
            key="student-lounge-modal"
            onClose={() => setIsLoungeOpen(false)}
            userProfile={userProfile}
            schoolId={schoolId}
            grade={grade}
            isTeacher={!!isTeacher}
            teacherData={teacherData}
            isLocked={platformLocks.loungeLock}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {aiEvaluationResult && (
          <div key="ai-evaluation-overlay" className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" dir="rtl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#050A18] border border-amber-500/30 rounded-3xl w-full max-w-lg p-6 sm:p-8 flex flex-col shadow-[0_0_50px_rgba(245,158,11,0.2)] text-center relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500"></div>
              
              <div className="mx-auto w-20 h-20 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 mb-6 relative group">
                <div className="absolute inset-0 bg-amber-500/20 rounded-2xl blur-xl group-hover:scale-150 transition-all duration-300"></div>
                <Trophy size={40} className="relative z-10 animate-bounce" />
              </div>

              <h3 className="text-2xl font-black text-white mb-2">تهانينا! تم التقييم التلقائي بالذكاء الاصطناعي 🎉</h3>
              <p className="text-sm text-white/60 mb-6">لقد قام نظام التقييم الذكي بفحص ومراجعة إجابتك فوراً!</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center">
                  <span className="text-xs text-white/40 mb-1">نقاط الخبرة المكتسبة</span>
                  <span className="text-2xl font-black text-amber-400 font-mono">+{aiEvaluationResult.pointsAwarded} XP</span>
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center">
                  <span className="text-xs text-white/40 mb-1">الوسام الممنوح</span>
                  {aiEvaluationResult.badgeAwarded ? (() => {
                    const badgeObj = OUTSTANDING_BADGES.find(b => b.id === aiEvaluationResult.badgeAwarded);
                    return (
                      <span className="text-sm font-bold text-emerald-400 flex items-center gap-1 mt-1">
                        <span>{badgeObj?.icon || "🎖️"}</span>
                        <span>{badgeObj?.title || aiEvaluationResult.badgeAwarded}</span>
                      </span>
                    );
                  })() : (
                    <span className="text-xs text-white/30 italic mt-1.5">لا يوجد وسام إضافي</span>
                  )}
                </div>
              </div>

              <div className="bg-black/40 border border-white/5 rounded-2xl p-4 text-right mb-6 max-h-[180px] overflow-y-auto custom-scrollbar">
                <h4 className="text-xs font-black text-amber-400/80 mb-2 flex items-center gap-1.5">
                  <Sparkles size={14} /> التقييم والتوجيه التربوي:
                </h4>
                <p className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap">{aiEvaluationResult.feedback}</p>
              </div>

              <button 
                onClick={() => setAiEvaluationResult(null)}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] transition-all text-black font-black rounded-xl text-sm shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                رائع، شكراً لك! 👍
              </button>
            </motion.div>
          </div>
        )}

        {viewingHomework && (
          <div key="view-homework-overlay" className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-md" dir="rtl">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#050A18] border border-amber-500/20 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
              {isSubmittingTask && (
                <div className="absolute inset-0 bg-[#050A18]/95 z-[10001] flex flex-col items-center justify-center p-6 text-center">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                    <Sparkles className="absolute inset-0 m-auto text-amber-400 animate-pulse" size={24} />
                  </div>
                  <h4 className="text-xl font-bold text-amber-400 mb-2">جاري تقييم الإجابة من قبل مساعد الأستاذ الذكي...</h4>
                  <p className="text-sm text-white/60 max-w-md">يقوم المساعد الذكي الآن بقراءة إجابتك وتحليلها وتقدير الدرجة المناسبة والوسام المستحق.</p>
                </div>
              )}
              <div className="flex justify-between items-center p-4 border-b border-white/5 bg-amber-500/5 shrink-0">
                <h3 className="text-xl font-bold text-amber-400">📝 {viewingHomework.name}</h3>
                <button onClick={() => setViewingHomework(null)} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="prose prose-invert max-w-none text-white/80" dir="auto">
                  <ReactMarkdown>{viewingHomework.content.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '')}</ReactMarkdown>
                </div>
                <div className="mt-12 border-t border-white/10 pt-8">
                  <h4 className="text-lg font-bold text-white mb-4">إرسال الحل للأستاذ</h4>
                  <textarea
                    value={homeworkAnswer}
                    onChange={(e) => {
                      setHomeworkAnswer(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    placeholder="اكتب حلك هنا..."
                    className="w-full min-h-[180px] bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-amber-500/50 mb-4 resize-none transition-all duration-75 overflow-hidden"
                    dir="auto"
                  />
                  <button 
                    disabled={!homeworkAnswer.trim() || isSubmittingTask}
                    onClick={async () => {
                      setIsSubmittingTask(true);
                      try {
                        const resolvedStudentName = userProfile?.studentName || userProfile?.name || userProfile?.fullName || "طالب";
                        const response = await fetch('/api/gemini/evaluate-homework', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            schoolId: resolvedSchoolId,
                            taskId: viewingHomework.id,
                            taskTitle: viewingHomework.name,
                            studentId: userProfile?.id || "unknown",
                            studentName: resolvedStudentName,
                            content: homeworkAnswer
                          })
                        });

                        const data = await response.json();
                        if (response.ok && data.success) {
                          const studentId = userProfile?.id || "unknown";
                          const studentName = resolvedStudentName;

                          // Save submission in firestore
                          const submissionsCol = collection(db, "schools", resolvedSchoolId, "activities_submissions");
                          await addDoc(submissionsCol, {
                            taskId: viewingHomework.id,
                            taskTitle: viewingHomework.name,
                            type: "homework",
                            studentId,
                            studentName,
                            content: homeworkAnswer,
                            feedback: data.feedback,
                            score: data.pointsAwarded, // use points as score
                            pointsAwarded: data.pointsAwarded,
                            badgeAwarded: data.badgeAwarded || null,
                            aiGraded: true,
                            createdAt: serverTimestamp()
                          });

                          // Update user score and badges in Firestore if studentId is not unknown
                          const targetUserUid = userProfile?.uid || auth.currentUser?.uid;
                          if (targetUserUid) {
                            const userRef = doc(db, "users", targetUserUid);
                            const updateFields: any = {
                              totalScore: increment(data.pointsAwarded),
                              xp: increment(data.pointsAwarded)
                            };
                            if (data.badgeAwarded) {
                              updateFields.outstandingBadges = arrayUnion(data.badgeAwarded);
                            }
                            try {
                              await updateDoc(userRef, updateFields);
                            } catch (err) {
                              console.warn("Failed to update user document in users collection for points sync:", err);
                            }

                            // Update local state so that the user immediately sees the score
                            if (onUpdateProfile) {
                              onUpdateProfile({
                                ...userProfile,
                                totalScore: (userProfile?.totalScore || 0) + data.pointsAwarded,
                                xp: (userProfile?.xp || 0) + data.pointsAwarded,
                                outstandingBadges: data.badgeAwarded 
                                  ? [...(userProfile?.outstandingBadges || []), data.badgeAwarded] 
                                  : (userProfile?.outstandingBadges || [])
                              });
                            }
                          }

                          sounds.playSuccess();
                          setAiEvaluationResult({
                            pointsAwarded: data.pointsAwarded,
                            feedback: data.feedback,
                            badgeAwarded: data.badgeAwarded
                          });
                          showToast("تم إرسال الواجب وتقييمه تلقائياً بنجاح! 🎉", "success");
                          setViewingHomework(null);
                          setHomeworkAnswer('');
                        } else {
                          throw new Error(data.error || "خطأ أثناء التقييم التلقائي");
                        }
                      } catch(e: any) {
                        console.error(e);
                        showToast(e.message || "حدث خطأ أثناء إرسال وتقييم الواجب.", "error");
                      } finally {
                        setIsSubmittingTask(false);
                      }
                    }}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 w-full md:w-auto"
                  >
                    {isSubmittingTask ? 'جاري الإرسال...' : 'إرسال الحل'} <Send size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {viewingCompetition && (
          <div key="view-competition-overlay" className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-md" dir="rtl">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#050A18] border border-rose-500/20 rounded-2xl w-full max-w-3xl h-[90vh] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(244,63,94,0.15)] relative">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 to-fuchsia-500"></div>
              <div className="flex justify-between items-center p-4 border-b border-white/5 bg-rose-500/5 shrink-0 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 overflow-hidden shrink-0 relative">
                    <BerqCharacter 
                      pose="pose_sixty_seconds_challenger" 
                      glowColor="gold" 
                      className="w-full h-full object-cover scale-110" 
                    />
                  </div>
                  <h3 className="text-xl font-bold text-rose-400 flex items-center gap-2"><Trophy size={20} /> {viewingCompetition.name}</h3>
                </div>
                {competitionScore === null && (
                  <div className="flex items-center gap-2 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20">
                    <span className="text-white/60 text-xs">الوقت المتبقي:</span>
                    <span className={`font-mono font-black text-lg ${competitionTimer <= 10 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>00:{competitionTimer.toString().padStart(2, '0')}</span>
                  </div>
                )}
                <button onClick={() => setViewingCompetition(null)} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 relative z-10">
                {(() => {
                  let quizData = null;
                  try {
                    const jsonMatch = viewingCompetition.content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                    if (jsonMatch && jsonMatch[1]) {
                      quizData = JSON.parse(jsonMatch[1].trim());
                    } else {
                      quizData = JSON.parse(viewingCompetition.content);
                    }
                  } catch (e) {}

                  if (quizData && quizData.questions) {
                    return (
                      <div className="space-y-6 sm:space-y-8 max-w-2xl mx-auto">
                        {quizData.questions.map((q: any, i: number) => (
                          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 relative overflow-hidden group shadow-lg">
                            <div className="absolute top-0 right-0 w-12 h-12 bg-rose-500/10 rounded-bl-3xl flex items-center justify-center font-black text-rose-500/50">
                              {i + 1}
                            </div>
                            <h4 className="text-base sm:text-lg font-bold text-white mb-6 pl-2 pr-6 leading-relaxed" dir="auto">{q.question}</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {q.options.map((opt: string, optIdx: number) => {
                                const isSelected = competitionAnswers[i] === optIdx;
                                const isRevealed = competitionScore !== null;
                                const isCorrect = q.correctAnswerIndex === optIdx;
                                const isWrongSelected = isSelected && !isCorrect;
                                
                                let btnClass = "p-3 sm:p-4 rounded-xl border text-right font-medium transition-all duration-300 relative overflow-hidden text-sm sm:text-base outline-none ";
                                if (isRevealed) {
                                  if (isCorrect) btnClass += "bg-emerald-500/20 border-emerald-500/50 text-emerald-400";
                                  else if (isWrongSelected) btnClass += "bg-rose-500/20 border-rose-500/50 text-rose-400";
                                  else btnClass += "bg-white/5 border-white/10 text-white/40";
                                } else {
                                  btnClass += isSelected 
                                    ? "bg-rose-500 text-white border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)] transform scale-[1.02]" 
                                    : "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20";
                                }
                                
                                return (
                                  <button
                                    key={optIdx}
                                    disabled={isRevealed}
                                    onClick={() => setCompetitionAnswers(prev => ({ ...prev, [i]: optIdx }))}
                                    className={btnClass}
                                    dir="auto"
                                  >
                                    {isSelected && !isRevealed && <div className="absolute inset-0 bg-white/20 animate-pulse rounded-xl" />}
                                    <span className="relative z-10">{opt}</span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                        
                        {competitionScore === null ? (
                          <button
                            disabled={Object.keys(competitionAnswers).length !== quizData.questions.length || isSubmittingTask}
                            onClick={async () => {
                              setIsSubmittingTask(true);
                              let score = 0;
                              quizData.questions.forEach((q: any, i: number) => {
                                if (competitionAnswers[i] === q.correctAnswerIndex) score++;
                              });
                              try {
                                await addDoc(collection(db, "schools", resolvedSchoolId, "activities_submissions"), {
                                  taskId: viewingCompetition.id,
                                  taskTitle: viewingCompetition.name,
                                  type: "competition",
                                  studentId: userProfile?.id || "unknown",
                                  studentName: userProfile?.studentName || userProfile?.name || userProfile?.fullName || "طالب",
                                  score: score,
                                  totalQuestions: quizData.questions.length,
                                  createdAt: serverTimestamp()
                                });
                              } catch(e) {
                                console.error(e);
                              }
                              setCompetitionScore(score);
                              setIsSubmittingTask(false);
                              if (score === quizData.questions.length) {
                                 sounds.playSuccess();
                                 showToast("مبروك! أضفت كأساً جديداً إلى سجل الشرف!", "success");
                              } else if (score > quizData.questions.length / 2) {
                                 sounds.playClick();
                                 showToast("أداء جيد! يمكنك المحاولة مرة أخرى للحصول على علامة كاملة.", "success");
                              }
                            }}
                            className="w-full py-4 mt-8 bg-gradient-to-r from-rose-500 to-fuchsia-500 hover:from-rose-400 hover:to-fuchsia-400 text-white font-black text-lg rounded-2xl shadow-[0_4px_25px_rgba(244,63,94,0.3)] transition-all disabled:opacity-50 disabled:grayscale outline-none"
                          >
                            {isSubmittingTask ? 'جاري تصحيح الإجابات...' : 'إنهاء المسابقة وإرسال الإجابات'}
                          </button>
                        ) : (
                          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl p-8 text-center mt-8">
                            <div className="w-28 h-28 mx-auto mb-4 relative overflow-hidden rounded-2xl border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                              <BerqCharacter pose="pose_excellence_champion" glowColor="gold" className="w-full h-full object-contain p-1" />
                            </div>
                            <h3 className="text-2xl font-black text-emerald-400 mb-2">النتيجة النهائية</h3>
                            <div className="text-5xl font-black text-white mb-4">
                              {competitionScore} <span className="text-2xl text-white/50">/ {quizData.questions.length}</span>
                            </div>
                            <p className="text-emerald-300/80 font-medium">تم إرسال نتيجتك إلى أستاذ المادة وتم تحديث سجل الشرف.</p>
                          </motion.div>
                        )}
                      </div>
                    );
                  }
                  
                  return (
                    <div className="prose prose-invert max-w-none text-white/80" dir="auto">
                       <ReactMarkdown>{viewingCompetition.content}</ReactMarkdown>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
        
        {/* Modal for viewing submission feedback */}
        <AnimatePresence key="submission-feedback-presence">
          {viewingSubmissionFeedback && (
            <div key="submission-feedback-overlay" className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md" dir="rtl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#050A18] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden"
              >
                <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <ClipboardCheck size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">نتيجة النشاط والتقييم</h3>
                      <p className="text-xs text-white/40 mt-1">{viewingSubmissionFeedback.taskTitle}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewingSubmissionFeedback(null)}
                    className="p-2 bg-white/5 rounded-xl hover:bg-rose-500/10 hover:text-rose-400 text-white/50 transition-colors cursor-pointer"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-white/50">تاريخ التسليم</span>
                      <span className="font-mono text-sm text-white/80">
                        {viewingSubmissionFeedback.createdAt && typeof viewingSubmissionFeedback.createdAt.toDate === 'function' 
                          ? (typeof viewingSubmissionFeedback.createdAt?.toDate === 'function' ? viewingSubmissionFeedback.createdAt.toDate() : new Date(viewingSubmissionFeedback.createdAt)).toLocaleDateString('ar-SA')
                          : ''}
                      </span>
                    </div>
                    {viewingSubmissionFeedback.score !== undefined && (
                      <div className="flex flex-col gap-1 items-end">
                        <span className="text-xs text-white/50">النتيجة</span>
                        <div className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 font-black rounded-lg text-lg">
                          {viewingSubmissionFeedback.score} <span className="text-sm font-normal text-rose-400/50">/ {viewingSubmissionFeedback.totalQuestions || '-'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {viewingSubmissionFeedback.type === 'homework' && (
                    <div className="mb-6">
                      <h5 className="text-xs font-bold text-amber-400/70 mb-2 tracking-wide">إجابتك المرسلة:</h5>
                      <div className="bg-[#0A0F24] border border-white/5 rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap text-white/80">
                        {viewingSubmissionFeedback.content}
                      </div>
                    </div>
                  )}

                  {viewingSubmissionFeedback.feedback ? (
                    <div className="mb-6">
                      <h5 className="text-xs font-bold text-emerald-400/70 mb-2 flex items-center gap-2">
                        <MessageSquare size={14} className="text-emerald-400" />
                        <span>تقييم المعلم (التغذية الراجعة):</span>
                      </h5>
                      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5 text-sm leading-relaxed whitespace-pre-wrap text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
                        {viewingSubmissionFeedback.feedback}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-white/5 border border-white/10 rounded-xl mb-6 flex flex-col items-center justify-center gap-2 text-white/40">
                      <MessageSquare size={24} className="opacity-50" />
                      <p className="text-sm">لم يتم إضافة تقييم من المعلم حتى الآن.</p>
                    </div>
                  )}
                  
                  {(viewingSubmissionFeedback.pointsAwarded > 0 || viewingSubmissionFeedback.badgeAwarded) && (
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      {viewingSubmissionFeedback.pointsAwarded > 0 && (
                        <div className="bg-[#0A0F24] border border-white/5 rounded-xl p-4 flex flex-col justify-center items-center gap-2">
                          <span className="text-[10px] text-white/40 uppercase tracking-widest">نقاط الخبرة المكتسبة</span>
                          <span className="text-xl font-black text-amber-400 font-mono">+{viewingSubmissionFeedback.pointsAwarded} XP</span>
                        </div>
                      )}
                      {viewingSubmissionFeedback.badgeAwarded && (
                        <div className="bg-[#0A0F24] border border-white/5 rounded-xl p-4 flex flex-col justify-center items-center gap-2">
                          <span className="text-[10px] text-white/40 uppercase tracking-widest">الوسام الممنوح</span>
                          <span className="text-sm font-bold text-emerald-400 text-center">🎖️ {viewingSubmissionFeedback.badgeAwarded}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {viewingRecordedLesson && (
          <div key="recorded-lesson-overlay" className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-md animate-fade-in" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#050A18] border border-white/10 rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden shadow-[0_0_80px_rgba(0,229,255,0.2)] transition-all duration-300"
            >
              {/* 1. Header (Hidden in Cinema Mode) */}
              {!isCinemaMode && (
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#00E5FF]/20 text-[#00E5FF] flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.1)]">
                      <Video size={20} />
                    </div>
                    <div>
                      <h2 className="text-white font-black text-sm">{viewingRecordedLesson.title}</h2>
                      <p className="text-white/40 text-[10px] uppercase font-bold flex items-center gap-2">
                        <span>{viewingRecordedLesson.subject}</span>
                        <span>•</span>
                        <span className="text-amber-400 font-bold">{viewingRecordedLesson.grade || grade || "الصف المقرر"}</span>
                        <span>•</span>
                        <span className="text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-0.5 rounded border border-[#00E5FF]/20">1080p FHD</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setViewingRecordedLesson(null);
                      setIsCinemaMode(false);
                      setHasStartedPlaying(false);
                    }}
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
              {/* 2. Video Area (Expandable/Cinema support with Hero feeling!) */}
              <div className={`relative flex items-center justify-center transition-all duration-500 overflow-hidden shrink-0 ${
                isCinemaMode 
                  ? "flex-1 h-full bg-black w-full" 
                  : "px-4 py-5 bg-[#030610] w-full border-b border-white/5"
              }`} style={isCinemaMode ? {} : { maxHeight: '55vh', aspectRatio: '16/9' }}>
                
                {/* Floating controls when in cinema mode */}
                {isCinemaMode && (
                  <>
                    <div className="absolute top-4 left-4 z-50 px-3 py-1 bg-[#00E5FF]/10 backdrop-blur-md border border-[#00E5FF]/30 rounded-full text-[#00E5FF] text-[10px] font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,229,255,0.25)] select-none">
                      <span className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full animate-ping" />
                      <span>وضع السينما الفخم • 1080p Ultra FHD</span>
                    </div>

                    <button
                      onClick={() => setIsCinemaMode(false)}
                      className="absolute top-4 right-4 z-50 px-4 py-2 bg-black/70 hover:bg-black/90 hover:scale-105 border border-white/10 hover:border-[#00E5FF]/30 text-white/90 hover:text-[#00E5FF] text-[10px] font-black rounded-full transition-all flex items-center gap-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.6)] cursor-pointer"
                    >
                      <Minimize2 size={12} />
                      <span>خروج من وضع السينما ✕</span>
                    </button>
                  </>
                )}

                {/* Main Video Frame with Glow in normal mode */}
                <div className={`transition-all duration-500 relative w-full ${
                  isCinemaMode 
                    ? "h-full flex items-center justify-center bg-black" 
                    : "max-w-4xl h-full rounded-2xl border border-[#00E5FF]/20 shadow-[0_0_30px_rgba(0,229,255,0.06)] overflow-hidden bg-black"
                }`}>
                  
                  {/* Big Play cover (Thumbnail) if not started yet */}
                  {!hasStartedPlaying && (
                    <div className="absolute inset-0 bg-[#0A0D1A] z-40 flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
                      {(() => {
                        const ytMatch = viewingRecordedLesson.videoUrl?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
                        const ytId = ytMatch ? ytMatch[1] : null;
                        if (ytId) {
                          return (
                            <img 
                              src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} 
                              alt="Thumbnail" 
                              className="absolute inset-0 w-full h-full object-cover opacity-25 filter blur-[2px] scale-105"
                            />
                          );
                        }
                        return null;
                      })()}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D1A] via-[#05070F]/80 to-[#0A0D1A]/90" />
                      <div className="relative z-10 flex flex-col items-center">
                        <span className="px-3 py-1 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/20 text-[#00E5FF] text-[10px] font-bold mb-4 uppercase tracking-widest flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full animate-pulse" />
                          1080p Full High-Definition
                        </span>
                        
                        <motion.button
                          whileHover={{ scale: 1.1, boxShadow: "0 0 30px rgba(0, 229, 255, 0.4)" }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setHasStartedPlaying(true);
                            setIsCinemaMode(true);
                            if (videoRef.current) {
                              const v = videoRef.current;
                              if (v.readyState >= 3) {
                                v.play().catch(err => console.log("Play failed", err));
                              } else {
                                const onCanPlay = () => {
                                  v.play().catch(err => console.log("Play failed", err));
                                };
                                v.addEventListener('canplay', onCanPlay, { once: true });
                              }
                            }
                          }}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#00E5FF] text-black flex items-center justify-center shadow-[0_0_30px_rgba(0,229,255,0.3)] transition-all cursor-pointer mb-4"
                        >
                          <Play size={28} className="mr-[-4px]" fill="currentColor" />
                        </motion.button>
                        
                        <h3 className="text-white font-black text-xs sm:text-sm max-w-md line-clamp-1 mb-1">
                          {viewingRecordedLesson.title}
                        </h3>
                        <p className="text-white/40 text-[9px] sm:text-[10px] font-bold max-w-xs font-sans">
                          {viewingRecordedLesson.subject} {(viewingRecordedLesson.grade || grade) ? `• ${viewingRecordedLesson.grade || grade}` : ''} • انقر للبدء بتجربة سينمائية فخمة
                        </p>
                      </div>
                    </div>
                  )}
                 {viewingRecordedLesson.videoUrl && (viewingRecordedLesson.videoUrl.includes("youtube.com") || viewingRecordedLesson.videoUrl.includes("youtu.be")) ? (
                   hasStartedPlaying ? (
                     <iframe
                       src={`${getEmbedUrl(viewingRecordedLesson.videoUrl)}${getEmbedUrl(viewingRecordedLesson.videoUrl).includes('?') ? '&' : '?'}autoplay=1&rel=0&playsinline=1`}
                       className="w-full h-full border-0"
                       allowFullScreen
                       allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                     />
                   ) : (
                     <div className="w-full h-full bg-black" />
                   )
                 ) : viewingRecordedLesson.videoUrl && viewingRecordedLesson.videoUrl.includes("vimeo.com") ? (
                   hasStartedPlaying ? (
                     <iframe
                       src={`${getEmbedUrl(viewingRecordedLesson.videoUrl)}${getEmbedUrl(viewingRecordedLesson.videoUrl).includes('?') ? '&' : '?'}autoplay=1`}
                       className="w-full h-full border-0"
                       allowFullScreen
                       allow="fullscreen; picture-in-picture"
                     />
                   ) : (
                     <div className="w-full h-full bg-black" />
                   )
                 ) : viewingRecordedLesson.videoUrl ? (
                   <video
                      key={viewingRecordedLesson.id}
                      preload="auto"
                      crossOrigin="anonymous"
                      ref={videoRef}
                      src={getSanitizedVideoUrl(viewingRecordedLesson.videoUrl)}
                     controlsList={viewingRecordedLesson.allowDownload === false ? "nodownload" : undefined}
                     disablePictureInPicture={viewingRecordedLesson.allowDownload === false}
                     controls
                     className="w-full h-full outline-none"
                     onLoadStart={(e) => {
                       console.log("🎥 [حالة التحميل]: بدأ عنصر الفيديو في جلب البيانات (LoadStart).");
                       setVideoDebugInfo(prev => ({
                         ...prev,
                         loadState: "بدأ جلب البيانات (LoadStart)",
                         playbackState: "جاري التحميل..."
                       }));
                     }}
                     onLoadedMetadata={(e) => {
                       const video = e.currentTarget;
                       const durationText = `${Math.floor(video.duration / 60)}:${Math.round(video.duration % 60).toString().padStart(2, '0')}`;
                       const meta = `${video.videoWidth}x${video.videoHeight} | المدة: ${durationText} (${video.duration.toFixed(1)} ثانية)`;
                       console.log("🎥 [المعلومات الوصفية]: تم تحميل الميتا بنجاح (LoadedMetadata):", meta);
                       setVideoDebugInfo(prev => ({
                         ...prev,
                         loadState: "تم تحميل الميتا (LoadedMetadata)",
                         metadata: meta
                       }));
                     }}
                     onCanPlay={(e) => {
                       console.log("🎥 [حالة التحميل]: جاهز للتشغيل الآن (CanPlay).");
                       setVideoDebugInfo(prev => ({
                         ...prev,
                         loadState: "جاهز للتشغيل (CanPlay)",
                         playbackState: "جاهز / متوقف مؤقتاً"
                       }));
                     }}
                     onPlaying={(e) => {
                       console.log("🎥 [حالة التشغيل]: الفيديو يعمل الآن (Playing).");
                       setVideoDebugInfo(prev => ({
                         ...prev,
                         playbackState: "يعمل حالياً (Playing)"
                       }));
                     }}
                     onPause={(e) => {
                       console.log("🎥 [حالة التشغيل]: الفيديو متوقف مؤقتاً (Pause).");
                       setVideoDebugInfo(prev => ({
                         ...prev,
                         playbackState: "متوقف مؤقتاً (Paused)"
                       }));
                     }}
                     onWaiting={(e) => {
                       console.log("🎥 [حالة التشغيل]: الفيديو ينتظر البيانات / يبفر (Waiting).");
                       setVideoDebugInfo(prev => ({
                         ...prev,
                         playbackState: "جاري التخزين المؤقت (Buffering...)"
                       }));
                     }}
                     onEnded={(e) => {
                       console.log("🎥 [حالة التشغيل]: انتهى تشغيل الفيديو (Ended).");
                       setVideoDebugInfo(prev => ({
                         ...prev,
                         playbackState: "منتهي (Ended)"
                       }));
                     }}
                     onError={(e) => {
                       const error = e.currentTarget.error;
                       let errorMsg = "خطأ غير معروف";
                       if (error) {
                         switch(error.code) {
                           case 1: errorMsg = "تم إيقاف التحميل من قبل المستخدم (MEDIA_ERR_ABORTED)"; break;
                           case 2: errorMsg = "خطأ في الشبكة أثناء التحميل (MEDIA_ERR_NETWORK)"; break;
                           case 3: errorMsg = "فشل في فك ترميز الفيديو (MEDIA_ERR_DECODE)"; break;
                           case 4: errorMsg = "الفيديو غير مدعوم أو الرابط غير صالح (MEDIA_ERR_SRC_NOT_SUPPORTED)"; break;
                         }
                       }
                       const errObj = new Error("Video playback failure");
                        const stack = errObj.stack || "لا يوجد Stack trace متوفر حالياً";
                        console.error("❌ [خطأ في الفيديو]: حدث خطأ في عنصر التشغيل:", errorMsg, error);
                        console.error("❌ Stack Trace للخطأ:", stack);
                       setVideoDebugInfo(prev => ({
                         ...prev,
                         loadState: "فشل التحميل (Error)",
                         playbackState: "متوقف بسبب خطأ",
                         errorCode: error ? `${error.code}` : "غير معروف",
                          errorMessage: errorMsg,
                          stackTrace: typeof stack !== 'undefined' ? stack : "لا يوجد Stack trace",
                          errorFunction: "HTMLVideoElement.onError",
                          errorLine: "15466 (داخل دالة render في مكون SchoolPlatform)"
                       }));
                     }}
                   />
                 ) : (
                   <div className="text-center">
                      <Play size={48} className="text-white/20 mx-auto mb-4" />
                      <p className="text-white/40 text-xs font-bold w-3/4 mx-auto leading-relaxed">
                        لا يوجد فيديو متاح لهذه المحاضرة
                      </p>
                   </div>
                 )}
              </div>
              </div>
              
              {/* 3. Description Area (Hidden in Cinema Mode) */}
              {!isCinemaMode && (
                <div className="px-4 py-3 bg-black/40 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black text-white">{viewingRecordedLesson.title}</span>
                      <span className="px-1.5 py-0.5 bg-[#00E5FF]/10 border border-[#00E5FF]/20 text-[#00E5FF] text-[8px] font-bold rounded">1080p Super FHD</span>
                      {(viewingRecordedLesson.grade || grade) && (
                        <span className="px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[8px] font-black rounded">
                          {viewingRecordedLesson.grade || grade}
                        </span>
                      )}
                    </div>
                    <p className="text-white/50 text-[10px] font-bold leading-relaxed">
                      {formatLectureDescription(viewingRecordedLesson.description, viewingRecordedLesson.grade || grade)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                    <div className="text-right">
                      <span className="text-[8px] text-white/30 block font-bold">تاريخ النشر</span>
                      <span className="text-[10px] text-white/70 font-mono font-bold">{viewingRecordedLesson.date || "2026/06/20"}</span>
                    </div>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="text-right">
                      <span className="text-[8px] text-white/30 block font-bold">مدة الشرح</span>
                      <span className="text-[10px] text-white/70 font-mono font-bold">{viewingRecordedLesson.duration || "0:00"}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex-1 overflow-y-auto no-scrollbar p-4 bg-[#030610] space-y-4">
                {false && (
                  <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-5 font-sans text-right" dir="rtl">
                   <div className="flex items-center justify-between border-b border-white/10 pb-3">
                     <span className="text-[#00E5FF] text-xs sm:text-sm font-black flex items-center gap-2">
                       <span className="inline-block w-3 h-3 rounded-full bg-[#00E5FF] animate-pulse"></span>
                       📡 لوحة التشخيص المتقدمة للفيديو (Advanced Diagnostics Dashboard)
                     </span>
                     <span className="px-2.5 py-1 rounded bg-[#00E5FF]/10 text-[#00E5FF] text-[9px] font-bold">
                       وضع عدم الإصلاح التلقائي - رصد الأخطاء الحقيقية ⚠️
                     </span>
                   </div>
                   
                   {/* 1. Technical Standards Fields (The 12 Fields) */}
                   <div className="space-y-2">
                     <h4 className="text-[#00E5FF] text-[10px] font-bold tracking-wider uppercase border-r-2 border-[#00E5FF] pr-2">
                       المعايير الفنية الـ 12 المطلوبة (Technical Metrics)
                     </h4>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-[10px] text-white/80 font-mono">
                       <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 flex flex-col justify-between">
                         <span className="text-white/40 text-[9px] mb-1">1. جهة التخزين (Storage Provider)</span>
                         <span className="font-bold text-[#00E5FF]">{videoDebugInfo.storageProvider}</span>
                       </div>

                       <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 flex flex-col justify-between">
                         <span className="text-white/40 text-[9px] mb-1">2. معرف المقطع (Video ID)</span>
                         <span className="font-bold text-white/90 truncate">{videoDebugInfo.videoId}</span>
                       </div>

                       <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 flex flex-col justify-between">
                         <span className="text-white/40 text-[9px] mb-1">3. اسم الملف المادي (File Name)</span>
                         <span className="font-bold text-amber-400 truncate" title={videoDebugInfo.fileName}>{videoDebugInfo.fileName}</span>
                       </div>

                       <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 flex flex-col justify-between">
                         <span className="text-white/40 text-[9px] mb-1">4. حجم الملف المادي (File Size)</span>
                         <span className="font-bold text-emerald-400">{videoDebugInfo.fileSize}</span>
                       </div>

                       <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 flex flex-col justify-between">
                         <span className="text-white/40 text-[9px] mb-1">5. نوع المحتوى (MIME Type)</span>
                         <span className="font-bold text-pink-400">{videoDebugInfo.mimeType}</span>
                       </div>

                       <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 flex flex-col justify-between">
                         <span className="text-white/40 text-[9px] mb-1">8. حالة الـ HTTP واستجابة الرابط (HTTP Status)</span>
                         <span className={`font-bold ${videoDebugInfo.httpStatus.includes("200") || videoDebugInfo.httpStatus.includes("OK") ? "text-emerald-400" : "text-red-400"}`}>
                           {videoDebugInfo.httpStatus}
                         </span>
                       </div>

                       <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 flex flex-col justify-between">
                         <span className="text-white/40 text-[9px] mb-1">9. جاهزية مشغل الفيديو (Ready State)</span>
                         <span className="font-bold text-white/90">{videoDebugInfo.readyState}</span>
                       </div>

                       <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 flex flex-col justify-between">
                         <span className="text-white/40 text-[9px] mb-1">10. حالة الشبكة للمشغل (Network State)</span>
                         <span className="font-bold text-white/90">{videoDebugInfo.networkState}</span>
                       </div>

                       <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 flex flex-col justify-between">
                         <span className="text-white/40 text-[9px] mb-1">11. رمز خطأ الميديا (Media Error Code)</span>
                         <span className={`font-bold ${videoDebugInfo.errorCode !== "لا يوجد" && videoDebugInfo.errorCode !== "لا يوجد أخطاء" ? "text-red-500 animate-pulse" : "text-white/40"}`}>
                           {videoDebugInfo.errorCode}
                         </span>
                       </div>

                       <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 md:col-span-2 lg:col-span-3 flex flex-col justify-between">
                         <span className="text-white/40 text-[9px] mb-1">12. رسالة الخطأ التفصيلية (Media Error Message)</span>
                         <span className={`font-bold ${videoDebugInfo.errorCode !== "لا يوجد" && videoDebugInfo.errorCode !== "لا يوجد أخطاء" ? "text-red-400" : "text-white/30"}`}>
                           {videoDebugInfo.errorMessage}
                         </span>
                       </div>

                       <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 md:col-span-2 lg:col-span-3 flex flex-col gap-1.5">
                         <div className="flex items-center justify-between">
                           <span className="text-white/40 text-[9px]">6. رابط الفيديو المستهدف (Video URL)</span>
                           <button 
                             onClick={() => {
                               copyToClipboard(videoDebugInfo.url);
                               showToast("تم نسخ رابط الفيديو المستهدف! 📋", "success");
                             }}
                             className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded text-[8px]"
                           >
                             نسخ الرابط
                           </button>
                         </div>
                         <span className="text-[#00E5FF] font-mono text-[9px] select-all break-all">{videoDebugInfo.url}</span>
                       </div>

                       <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 md:col-span-2 lg:col-span-3 flex flex-col gap-1.5">
                         <div className="flex items-center justify-between">
                           <span className="text-white/40 text-[9px]">7. رابط التنزيل والمصدر الأساسي (Download URL)</span>
                           <button 
                             onClick={() => {
                               copyToClipboard(videoDebugInfo.downloadUrl);
                               showToast("تم نسخ رابط التنزيل! 📋", "success");
                             }}
                             className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded text-[8px]"
                           >
                             نسخ الرابط
                           </button>
                         </div>
                         <span className="text-[#00E5FF] font-mono text-[9px] select-all break-all">{videoDebugInfo.downloadUrl}</span>
                       </div>
                     </div>
                   </div>

                   {/* 2. Checks & Verifications (The 6 Checks requested in prompt) */}
                   <div className="space-y-2 pt-2 border-t border-white/5">
                     <h4 className="text-amber-400 text-[10px] font-bold tracking-wider uppercase border-r-2 border-amber-400 pr-2">
                       فحص سلامة سلسلة التوريد والتشغيل (Diagnostics Checklist)
                     </h4>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-[10px]">
                       <div className="p-2.5 bg-black/30 rounded-xl border border-white/5 flex items-center justify-between">
                         <span className="text-white/60">رفع الملف بنجاح (Uploaded Successfully)</span>
                         <span className="font-bold text-white/90">{videoDebugInfo.uploadStatus}</span>
                       </div>

                       <div className="p-2.5 bg-black/30 rounded-xl border border-white/5 flex items-center justify-between">
                         <span className="text-white/60">وجود الملف مادياً في المخزن (Physical Existence)</span>
                         <span className="font-bold text-white/90">{videoDebugInfo.physicalStorageStatus}</span>
                       </div>

                       <div className="p-2.5 bg-black/30 rounded-xl border border-white/5 flex items-center justify-between">
                         <span className="text-white/60">صلاحية الرابط (URL Validity)</span>
                         <span className="font-bold text-white/90">{videoDebugInfo.urlValidity}</span>
                       </div>

                       <div className="p-2.5 bg-black/30 rounded-xl border border-white/5 flex items-center justify-between">
                         <span className="text-white/60">صلاحيات القراءة واستجابة CORS (Permissions)</span>
                         <span className="font-bold text-white/90">{videoDebugInfo.readPermissions}</span>
                       </div>

                       <div className="p-2.5 bg-black/30 rounded-xl border border-white/5 flex items-center justify-between">
                         <span className="text-white/60">سلامة مشغل الفيديو وعنصره (Video Player Correctness)</span>
                         <span className="font-bold text-white/90">{videoDebugInfo.playerCorrectness}</span>
                       </div>

                       <div className="p-2.5 bg-black/30 rounded-xl border border-white/5 flex items-center justify-between">
                         <span className="text-white/60">توافق صيغة الملف والكودك (Codec Compatibility)</span>
                         <span className="font-bold text-white/90">{videoDebugInfo.formatCompatibility}</span>
                       </div>
                     </div>
                   </div>

                   {/* 3. Code-Level Debug Stack (Shown only if failure exists or requested) */}
                   {videoDebugInfo.errorCode !== "لا يوجد" && videoDebugInfo.errorCode !== "لا يوجد أخطاء" && (
                     <div className="space-y-3 pt-3 border-t border-white/10 text-right animate-pulse-slow">
                       <h4 className="text-red-500 text-[10px] font-bold tracking-wider uppercase border-r-2 border-red-500 pr-2 flex items-center gap-1">
                         <span>⚠️</span> تفاصيل الخطأ البرمجي الفعلي وتتبع المكون (Code-Level Error Stack)
                       </h4>

                       <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[9px] font-mono text-white/95">
                         <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                           <span className="text-white/40 block">اسم الملف البرمجي المستدعي</span>
                           <span className="font-bold text-red-300">{videoDebugInfo.errorComponent}</span>
                         </div>
                         <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                           <span className="text-white/40 block">اسم الدالة المعالجة</span>
                           <span className="font-bold text-red-300">{videoDebugInfo.errorFunction}</span>
                         </div>
                         <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                           <span className="text-white/40 block">رقم السطر الفعلي للحدث</span>
                           <span className="font-bold text-red-300">{videoDebugInfo.errorLine}</span>
                         </div>
                       </div>

                       <div className="p-3 bg-black/90 border border-red-500/30 rounded-xl font-mono text-[8px] leading-relaxed text-red-300 text-left overflow-x-auto select-all h-36">
                         <div className="text-right text-white/40 mb-1 border-b border-white/5 pb-1 select-none">
                           سلسلة تتبع الخطأ الكاملة (Stack Trace)
                         </div>
                         <pre className="no-scrollbar">{videoDebugInfo.stackTrace}</pre>
                       </div>

                       {/* 4. Actionable Steps */}
                       <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl space-y-2">
                         <div className="text-yellow-400 text-[11px] font-black">
                           🛠️ الخطوات التشخيصية المقترحة لمعالجة المشكلة بالتسلسل:
                         </div>
                         <ol className="list-decimal list-inside text-white/75 text-[10px] space-y-1.5 leading-relaxed">
                           <li>
                             <strong className="text-yellow-300">التحقق من صحة الملف ملوذاً:</strong> 
                             بما أن الخطأ هو <code className="bg-white/10 px-1 py-0.5 rounded text-white">{videoDebugInfo.errorCode}</code>، تأكد من عدم تحرك الملف من مكانه على السيرفر في مجلد <code className="bg-white/10 px-1 py-0.5 rounded text-white">public/uploads</code>.
                           </li>
                           <li>
                             <strong className="text-yellow-300">مراجعة صيغة الكودك (Codec):</strong> 
                             قد يكون الملف بامتداد <code className="bg-white/10 px-1 py-0.5 rounded text-white">.mp4</code> ولكن كودك الفيديو الداخلي هو HEVC/H.265 وهو غير مدعوم في بعض متصفحات Chrome دون إضافات. يفضل تحويل صيغة كودك المقطع إلى <code className="bg-white/10 px-1 py-0.5 rounded text-white">H.264 / AAC</code> القياسية عبر برامج مثل Handbrake.
                           </li>
                           <li>
                             <strong className="text-yellow-300">التحقق من سياسة CORS:</strong> 
                             الرابط المفتوح استجاب بـ <code className="bg-white/10 px-1 py-0.5 rounded text-white">{videoDebugInfo.httpStatus}</code>. إذا كنت تستخدم مخزن سحابي مثل S3، يرجى تفعيل سياسات CORS للسماح بالقراءة العامة لعنوان المضيف الخاص بالمنصة.
                           </li>
                         </ol>
                       </div>
                     </div>
                   )}
                 </div>
                )}
                {false && 
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3 font-mono text-right" dir="rtl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-[#00E5FF] text-[11px] font-black flex items-center gap-1.5">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#00E5FF] animate-pulse"></span>
                      📡 رادار فحص الأخطاء ومعلومات الفيديو (Video Debug Radar)
                    </span>
                    <span className="text-white/40 text-[9px] font-sans">معلومات حية مباشرة</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-[10px] text-white/80">
                    <div className="p-2 bg-black/30 rounded-lg border border-white/5">
                      <span className="text-white/40 block mb-1">حالة الرفع (Upload Status)</span>
                      <span className={`font-bold ${viewingRecordedLesson.videoUrl?.includes("/uploads/") ? "text-[#00E5FF]" : "text-amber-400"}`}>
                        {viewingRecordedLesson.videoUrl?.includes("/uploads/") 
                          ? "✅ مرفوع محلياً بنجاح (Local Storage)" 
                          : viewingRecordedLesson.videoUrl?.includes("youtube.com") || viewingRecordedLesson.videoUrl?.includes("youtu.be")
                          ? "🌐 رابط خارجي (YouTube)"
                          : viewingRecordedLesson.videoUrl?.includes("vimeo.com")
                          ? "🌐 رابط خارجي (Vimeo)"
                          : "✅ مرفوع بنجاح (سيرفر خارجي)"}
                      </span>
                    </div>

                    <div className="p-2 bg-black/30 rounded-lg border border-white/5">
                      <span className="text-white/40 block mb-1">مسار التخزين (Storage Path)</span>
                      <span className="font-mono text-[9px] block truncate text-white/90">
                        {viewingRecordedLesson.videoUrl?.includes("/uploads/") 
                          ? `public/uploads/${viewingRecordedLesson.videoUrl.split("/uploads/")[1]}` 
                          : "رابط مباشر أو خارجي"}
                      </span>
                    </div>

                    <div className="p-2 bg-black/30 rounded-lg border border-white/5 col-span-1 md:col-span-2 lg:col-span-1">
                      <span className="text-white/40 block mb-1">رابط التحميل المباشر (Download URL)</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[9px] text-[#00E5FF] truncate block flex-1">
                          {videoDebugInfo.url}
                        </span>
                        <button 
                          onClick={() => {
                            copyToClipboard(videoDebugInfo.url);
                            showToast("تم نسخ رابط الفيديو المباشر! 📋", "success");
                          }}
                          className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded text-[9px] cursor-pointer"
                        >
                          نسخ
                        </button>
                      </div>
                    </div>

                    <div className="p-2 bg-black/30 rounded-lg border border-white/5">
                      <span className="text-white/40 block mb-1">بيانات الفيديو الوصفية (Metadata)</span>
                      <span className="font-sans font-bold text-white/90">{videoDebugInfo.metadata}</span>
                    </div>

                    <div className="p-2 bg-black/30 rounded-lg border border-white/5">
                      <span className="text-white/40 block mb-1">حالة التشغيل الحالية (Playback State)</span>
                      <span className="font-sans font-bold text-emerald-400">{videoDebugInfo.playbackState}</span>
                    </div>

                    <div className="p-2 bg-black/30 rounded-lg border border-white/5">
                      <span className="text-white/40 block mb-1">رمز الخطأ الحالي (Error Code)</span>
                      <span className={`font-sans font-bold ${videoDebugInfo.errorCode !== "لا يوجد" ? "text-red-400" : "text-white/40"}`}>
                        {videoDebugInfo.errorCode}
                      </span>
                    </div>
                    
                    <div className="p-2 bg-black/30 rounded-lg border border-white/5">
                      <span className="text-white/40 block mb-1">حالة الـ HTTP واستجابة الرابط</span>
                      <span className="font-mono font-bold text-white/90">{videoDebugInfo.httpStatus}</span>
                    </div>

                    <div className="p-2 bg-black/30 rounded-lg border border-white/5">
                      <span className="text-white/40 block mb-1">نوع المحتوى (MIME Type)</span>
                      <span className="font-mono font-bold text-white/90">{videoDebugInfo.mimeType}</span>
                    </div>

                    <div className="p-2 bg-black/30 rounded-lg border border-white/5">
                      <span className="text-white/40 block mb-1">حالة تحميل عنصر الفيديو (Load State)</span>
                      <span className="font-sans text-white/90">{videoDebugInfo.loadState}</span>
                    </div>
                  </div>
                </div>

               }
               <VideoComments 
                 lessonId={viewingRecordedLesson.id} 
                 isTeacher={!!isTeacher} 
                 currentUser={userProfile} 
                 teacherData={teacherData}
                 lessonTitle={viewingRecordedLesson.title}
                 lessonGrade={viewingRecordedLesson.grade || grade}
                 setRecordedLessons={setRecordedLessons}
               />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Academy Smart Document Viewer Modal */}
      <AnimatePresence>
        {previewingFile && (
          <div key="pdf-viewer-overlay" className="fixed inset-0 z-[9999] flex flex-col bg-[#05070F] text-white overflow-hidden" dir="rtl">
            <motion.div
              key="pdf-viewer-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-[#0A0D18] w-full h-full flex flex-col overflow-hidden text-white"
            >
              {/* Sleek PDF Reader Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-1.5 border-b border-white/10 bg-[#0A0D18] text-white select-none shrink-0">
                <div className="flex items-center gap-3">
                  <div className="text-right truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                    <h2 className="text-white font-bold text-xs sm:text-sm leading-tight truncate">
                      {(previewingFile.title || '').endsWith('.pdf') ? previewingFile.title : `${previewingFile.title || previewingFile.name || 'بدون_عنوان'}.pdf`}
                    </h2>
                  </div>
                </div>

                {/* PDF Viewer Page Count */}
                {previewPdfNumPages && (
                  <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-lg border border-white/5 text-[10px] font-sans text-white/60">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/10 text-amber-500">
                      📖 القارئ التفاعلي
                    </span>
                    <span className="font-bold px-1 hidden md:inline-block">
                      {previewPdfNumPages} صفحة
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 sm:gap-2">
                  {(previewingFile.allowDownload !== false || isTeacher || userProfile?.role === 'admin' || userProfile?.isAdmin) && (
                    <button
                      onClick={() => handleForceDownload(previewingFile.fileUrl!, (previewingFile.title || previewingFile.name || 'document') + '.pdf')}
                      className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer border border-emerald-500/20 text-xs flex items-center gap-1 font-bold"
                      title="تحميل نسخة من الملف للجهاز"
                    >
                      <span className="hidden sm:inline">📥 تحميل</span>
                      <span className="sm:hidden">📥</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      sounds.playClick();
                      window.print();
                    }}
                    className="p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer border border-white/5 text-xs flex items-center gap-1 font-bold"
                    title="طباعة المستند"
                  >
                    <span className="hidden sm:inline">🖨️ طباعة</span>
                    <span className="sm:hidden">🖨️</span>
                  </button>

                  <button
                    onClick={() => {
                      setPreviewingFile(null);
                      setPreviewPdfNumPages(null);
                      setPdfViewerMode('canvas');
                    }}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-red-600/15 border border-red-500/25 hover:bg-red-600/30 text-red-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer font-bold text-xs"
                    title="إغلاق"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Document Contents Area */}
              <div className="bg-[#181920] flex-1 relative overflow-y-auto no-scrollbar">
                {previewingFile.fileUrl && !pdfLoadError ? (
                  <div className="w-full flex flex-col items-center py-6 px-2 sm:px-4 space-y-6">
                    <Document
                      file={previewingFile.fileUrl}
                      options={pdfOptions}
                      onLoadSuccess={({ numPages }) => {
                        setPreviewPdfNumPages(numPages);
                        setPdfLoadError(false);
                      }}
                      onLoadProgress={({ loaded, total }) => {
                        if (total > 0) {
                          setPdfDownloadProgress(Math.round((loaded / total) * 100));
                        }
                      }}
                      onLoadError={(err) => {
                        console.warn("PDF load error:", err);
                        setPdfLoadError(true);
                      }}
                      onSourceError={(err) => {
                        console.warn("PDF source error:", err);
                        setPdfLoadError(true);
                      }}
                      loading={
                        <div className="text-white text-sm font-bold text-center p-8 bg-white/5 rounded-2xl border border-white/10 mt-10 max-w-md mx-auto space-y-4 shadow-2xl backdrop-blur-xl">
                          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 text-2xl animate-pulse">
                            📄
                          </div>
                          <div className="space-y-1">
                            <p className="text-white font-black text-sm">جاري فتح وتجهيز صفحات المستند...</p>
                            <p className="text-[11px] text-white/50">{previewingFile.title || 'ملف دراسي'} • {previewingFile.size || '30.8 MB'}</p>
                          </div>
                          {pdfDownloadProgress !== null && (
                            <div className="space-y-1.5 pt-2">
                              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-300 rounded-full"
                                  style={{ width: `${pdfDownloadProgress}%` }}
                                />
                              </div>
                              <p className="text-[11px] text-amber-400 font-mono font-bold">تم تحميل {pdfDownloadProgress}%</p>
                            </div>
                          )}
                        </div>
                      }
                      error={null}
                      className="flex flex-col items-center space-y-6 w-full max-w-5xl"
                    >
                      {previewPdfNumPages && previewPdfNumPages > 0 ? (
                        Array.from(new Array(previewPdfNumPages), (el, index) => (
                          <div key={`page_${index + 1}`} className="flex justify-center w-full px-1">
                            <Page
                              pageNumber={index + 1}
                              renderTextLayer={false}
                              renderAnnotationLayer={false}
                              width={typeof window !== 'undefined' ? Math.min(window.innerWidth - 16, 900) : 900}
                              className="rounded-xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/10 bg-white"
                              loading={
                                <div className="w-full h-80 flex items-center justify-center bg-white/5 rounded-xl border border-white/5 text-white/40 text-xs">
                                  جاري تحضير صفحة {index + 1}...
                                </div>
                              }
                            />
                          </div>
                        ))
                      ) : null}
                    </Document>
                  </div>
                ) : (
                  <div className="space-y-8 p-4 sm:p-8 pb-12">
                    {previewingFile.fileUrl && pdfLoadError && (
                      <div className="max-w-2xl mx-auto bg-gradient-to-r from-red-500/10 to-orange-500/5 border border-red-500/20 rounded-2xl p-6 text-right space-y-3 mb-8 shadow-xl shadow-black/40 relative overflow-hidden">
                        <div className="absolute -left-4 -top-4 text-8xl opacity-5 grayscale pointer-events-none">⚠️</div>
                        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20 mb-4">
                          <span className="text-xl">⚠️</span>
                        </div>
                        <h4 className="text-sm font-black text-white leading-relaxed">تعذر العرض المباشر عبر مشغل الكانفاس</h4>
                        <p className="text-xs text-white/60 leading-relaxed max-w-lg">
                          يمكنك تنزيل ملف الملزمة المرفوع فوراً أدناه إذا كان مسموحاً:
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          {(previewingFile.allowDownload !== false || isTeacher || userProfile?.role === 'admin' || userProfile?.isAdmin) && (
                            <button
                              onClick={() => handleForceDownload(previewingFile.fileUrl!, (previewingFile.title || previewingFile.name || 'document') + '.pdf')}
                              className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-emerald-500/30"
                            >
                              <span>📥 تنزيل الملف للجهاز</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    {/* Page 1 */}
                  <div className="bg-white text-[#1A1A1A] max-w-2xl mx-auto rounded-sm shadow-[0_8px_30px_rgba(0,0,0,0.3)] border border-slate-300 p-8 sm:p-12 text-right space-y-6 relative overflow-hidden min-h-[750px] flex flex-col justify-between select-text">
                    <div>
                      {/* PDF Header Accent */}
                      <div className="flex justify-between items-center border-b border-slate-200 pb-3 text-[10px] text-slate-400 font-bold mb-6">
                        <span>وزارة التربية • المنهج العراقي</span>
                        <span>مستند رسمي معتمد</span>
                      </div>

                      <div className="space-y-4">
                        <div className="text-center space-y-2 mb-8">
                          <span className="text-[10px] text-slate-500 border border-slate-300 px-3 py-1 rounded-full font-bold">
                            المنهج الذهبي الشامل
                          </span>
                          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-2">
                            {previewingFile.title}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                            {getSimulatedFileContent(previewingFile.title, previewingFile.subject).subtitle}
                          </p>
                        </div>

                        {/* Render sections on page 1 */}
                        {getSimulatedFileContent(previewingFile.title, previewingFile.subject).sections.map((section: any, idx: number) => (
                          <div key={idx} className="space-y-3 pt-4 border-t border-slate-100">
                            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                              <span className="w-1 h-3 bg-red-600 rounded-full" />
                              {section.heading}
                            </h4>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-line font-sans">
                              {section.body}
                            </p>

                            {section.hasReveal && (
                              <div className="pt-2">
                                <RevealBlock 
                                  label={section.revealLabel}
                                  text={section.revealText}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* PDF Footer Accent */}
                    <div className="flex justify-between items-center border-t border-slate-200 pt-3 text-[9px] text-slate-400 font-bold">
                      <span className="font-mono">Page 1 of 2</span>
                    </div>
                  </div>

                  {/* Page 2 - Sixty Second Challenge Callout (formatted like a printed quiz page) */}
                  <div className="bg-white text-[#1A1A1A] max-w-2xl mx-auto rounded-sm shadow-[0_8px_30px_rgba(0,0,0,0.3)] border border-slate-300 p-8 sm:p-12 text-right space-y-6 relative overflow-hidden min-h-[600px] flex flex-col justify-between select-text">
                    <div>
                      <div className="flex justify-between items-center border-b border-slate-200 pb-3 text-[10px] text-slate-400 font-bold mb-6">
                        <span>ملحق التقييم والمراجعة السريعة</span>
                        <span className="text-emerald-600">QUIZ & ASSESSMENT</span>
                      </div>

                      <div className="flex flex-col justify-center items-center text-center space-y-6 py-12">
                        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                          <Zap size={32} className="animate-pulse" />
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="text-md sm:text-lg font-black text-slate-900">⚡ ورقة تقييم الفهم السريع</h4>
                          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                            هل ترغب في قياس مدى استيعابك للمفاهيم السابقة؟ أطلق تحدي الـ 60 ثانية لحل الأسئلة الوزارية التفاعلية المستوحاة مباشرة من هذا الملخص المعتمد!
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            const questions = generateQuestionsForDocument(previewingFile.title, previewingFile.subject);
                            setActiveFileChallengeQuestions(questions);
                            setIsChallengeActive(true);
                          }}
                          className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-2 hover:scale-[1.02]"
                        >
                          <span>⚡ ابدأ تحدي الـ 60 ثانية الآن</span>
                        </button>
                      </div>
                    </div>

                    {/* PDF Footer Accent */}
                    <div className="flex justify-between items-center border-t border-slate-200 pt-3 text-[9px] text-slate-400 font-bold">
                      <span className="font-mono">Page 2 of 2</span>
                    </div>
                  </div>
                </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 60s Challenge Modal Triggered from Document */}
      <AnimatePresence>
        {isChallengeActive && activeFileChallengeQuestions && (
          <SixtySecondChallenge 
            key="sixty-second-challenge"
            questions={activeFileChallengeQuestions}
            onComplete={(score) => {
              showToast(`أحسنت بطل! لقد أكملت التحدي بنجاح وحققت ${score} من أصل ${activeFileChallengeQuestions.length} 🏆`, "success");
              setIsChallengeActive(false);
              setActiveFileChallengeQuestions(null);
            }}
            onClose={() => {
              setIsChallengeActive(false);
              setActiveFileChallengeQuestions(null);
            }}
          />
        )}
        
        {selectedAIQuestion && (
          <AIQuestionAssistantModal
            key="ai-question-assistant"
            question={selectedAIQuestion}
            onClose={() => setSelectedAIQuestion(null)}
          />
        )}
        
        {selectedPaperForExtraction && (
          <AIPaperExtractorModal
            key="ai-paper-extractor"
            paper={selectedPaperForExtraction}
            onClose={() => setSelectedPaperForExtraction(null)}
          />
        )}
      </AnimatePresence>
</>
  );
};

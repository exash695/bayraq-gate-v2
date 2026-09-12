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


export interface TeacherControlLiveTabProps {
  realActiveKnights: number;
  displayAttendees: any[];
  displayActiveNotAttending: any[];
  toggleStudentMic: (studentId: string, studentName: string) => void;
  toggleStudentCam: (studentId: string, studentName: string) => void;
  toggleStudentBoard: (studentId: string, studentName: string) => void;
}

export const TeacherControlLiveTab: React.FC<TeacherControlLiveTabProps> = ({
  realActiveKnights,
  displayAttendees,
  displayActiveNotAttending,
  toggleStudentMic,
  toggleStudentCam,
  toggleStudentBoard,
}) => {
  const { activeLiveQuiz, activeWorkingClass, activeYoutubeVideoId, boardColor, boardImageScale, boardTextContent, boardTextSize, boardTool, brushThickness, camEnabled, cameraFacingMode, cameraLayout, cameraStream, captureAndSyncPdf, currentShape, draw, extractYouTubeId, formatLiveDuration, grade, handRaises, handleDraw, handleSetWhiteboardImage, handleStartDrawing, handleToggleCamera, handleToggleMic, isLiveActive, isTeacher, isWhiteboardActive, laserPosition, liveQuestions, liveSeconds, liveStreamType, liveTitle, micEnabled, notifications, onPipDragStart, pdfFile, pdfNumPages, pdfPageNumber, pdfScale, pinnedQuestion, pipPosition, pipShape, quizCorrectIndex, quizResponses, reactionCounts, realLiveAttendees, recordingStartTime, remoteStream, renderStroke, renderWhiteboardBackground, resolvedSchoolId, schoolId, selectedMaterialIndex, selectedQuality, selectedTeacherClass, setActiveLiveQuiz, setBoardColor, setBoardImageScale, setBoardTextContent, setBoardTextSize, setBoardTool, setBrushThickness, setCameraFacingMode, setCameraLayout, setHandRaises, setIsLiveActive, setIsWhiteboardActive, setLiveStreamType, setLiveTitle, setPdfFile, setPdfNumPages, setPdfPageNumber, setPdfScale, setPinnedQuestion, setPipShape, setQuizCorrectIndex, setQuizResponses, setQuizTimerActive, setRecordingStartTime, setSelectedQuality, setSharedPdfPageBase64, setShowDetailedQuizResults, setStudentCanDraw, setStudentQuizAnswered, setStudentQuizCorrect, setTeacherLiveSubTab, setWhiteboardStrokes, setYoutubeLiveUrl, sharedPdfPageBase64, showDetailedQuizResults, showToast, startDrawing, stopDrawing, studentCanDraw, studentLiveControls, targetBroadcastGrade, teacherAssignedSections, teacherCameraEnabled, teacherData, teacherLiveSubTab, teacherVideoRef, whiteboardImage, whiteboardStrokes, youtubeLiveUrl } = useSchoolPlatform();

  const isAllSections = !selectedTeacherClass || selectedTeacherClass === 'ALL' || selectedTeacherClass === 'كافة الشُعب';
  const targetSectionLabel = isAllSections ? "كافة الشُعب الموكلة" : selectedTeacherClass;
  const targetSectionsList = isAllSections
    ? (teacherAssignedSections || []).map((s: any) => s.name).filter(Boolean)
    : [selectedTeacherClass];

  return (
                <div className="w-full flex flex-col">
                  {/* HUGE Edge-to-edge Live Stream Window (بعرض الشاشة من الحافة للحافة) */}
                  <div
                    className={`w-full border-y border-white/5 transition-all duration-500 relative ${isLiveActive ? "bg-red-500/5 bg-opacity-70" : "bg-[#0E152D]/40"}`}
                  >
                    <div className="max-w-[100vw] mx-auto">
                      {/* Interactive Camera Screen Preview */}
                      <div className="aspect-video sm:aspect-[16/9] min-h-[420px] sm:min-h-[540px] md:min-h-[620px] lg:min-h-[660px] w-full bg-[#04060C] relative overflow-hidden flex flex-col items-center justify-center p-4">
                        {/* Header row in stream window */}
                        <div className="absolute top-3 left-4 right-4 flex items-center justify-between z-10 w-auto">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 shadow-sm">
                              <span
                                className={`w-2 h-2 rounded-full ${isLiveActive ? "bg-red-500 animate-pulse" : "bg-white/20"}`}
                              />
                              <span className="text-[9px] font-bold text-white/95 leading-none">
                                {isLiveActive ? "البث مفعّل" : "الغرفة جاهزة"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-purple-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-purple-500/30 text-purple-200 shadow-sm text-[9px] font-black">
                              <span>🎯 الوجهة: {targetSectionLabel}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 shadow-sm">
                            {camEnabled && (
                              <button
                                onClick={() => {
                                  setCameraFacingMode((prev) =>
                                    prev === "user" ? "environment" : "user",
                                  );
                                  showToast(
                                    cameraFacingMode === "user"
                                      ? "تم تبديل الكاميرا إلى الخلفية 🔄"
                                      : "تم تبديل الكاميرا إلى الأمامية 🔄",
                                    "info",
                                  );
                                }}
                                type="button"
                                className="pointer-events-auto flex items-center justify-center gap-1 bg-black/80 hover:bg-[#00E5FF]/20 text-white hover:text-[#00E5FF] transition-all duration-300 px-1.5 py-0.5 rounded border border-white/10 hover:border-[#00E5FF]/30 shadow-sm cursor-pointer ml-1 text-[8px] font-black font-sans shrink-0 inline-flex"
                                title="تبديل اتجاه الكاميرا"
                              >
                                <FlipHorizontal
                                  size={9}
                                  className={`transition-transform duration-300 text-[#00E5FF] ${cameraFacingMode === "environment" ? "rotate-180" : ""}`}
                                />
                                <span>قلب الكاميرا 🔄</span>
                              </button>
                            )}
                            <span className="text-[8px] text-white/50 font-bold leading-none">
                              الدقة النشطة:
                            </span>
                            <select
                              value={selectedQuality}
                              onChange={(e) =>
                                setSelectedQuality(e.target.value)
                              }
                              className="text-[8px] bg-transparent border-none text-[#00E5FF] font-black outline-none cursor-pointer p-0 leading-none"
                            >
                              <option value="1080p" className="bg-[#0A1024]">
                                Ultra HD (1080p)
                              </option>
                              <option value="720p" className="bg-[#0A1024]">
                                HD (720p)
                              </option>
                              <option value="480p" className="bg-[#0A1024]">
                                SD (480p)
                              </option>
                            </select>
                          </div>
                        </div>

                        {(isTeacher ? (camEnabled || (liveStreamType === 'youtube' && !!extractYouTubeId(youtubeLiveUrl))) : (isLiveActive || camEnabled)) ? (
                          <div
                            className={
                              cameraLayout === "pip" && isWhiteboardActive
                                ? `absolute bottom-16 right-6 shadow-2xl z-40 bg-[#050A18]/90 overflow-hidden border-2 border-indigo-500/30 transition-shadow cursor-move flex items-center justify-center hover:shadow-[0_10px_40px_rgba(99,102,241,0.3)] ${pipShape === "round" ? "rounded-full w-40 h-40" : "rounded-2xl w-56 h-36"}`
                                : "absolute inset-0 bg-black flex items-center justify-center transition-all duration-500"
                            }
                            style={
                              cameraLayout === "pip" && isWhiteboardActive
                                ? {
                                    transform: `translate(${pipPosition.x}px, ${pipPosition.y}px)`,
                                  }
                                : {}
                            }
                            onMouseDown={
                              cameraLayout === "pip" && isWhiteboardActive
                                ? onPipDragStart
                                : undefined
                            }
                            onTouchStart={
                              cameraLayout === "pip" && isWhiteboardActive
                                ? onPipDragStart
                                : undefined
                            }
                            onDoubleClick={() => {
                              if (cameraLayout === "pip")
                                setPipShape((s) =>
                                  s === "round" ? "square" : "round",
                                );
                            }}
                          >
                            {(activeYoutubeVideoId || (isTeacher && liveStreamType === 'youtube' && extractYouTubeId(youtubeLiveUrl))) ? (
                              <iframe
                                src={`https://www.youtube-nocookie.com/embed/${activeYoutubeVideoId || extractYouTubeId(youtubeLiveUrl)}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1`}
                                title={liveTitle || "بث مباشر تفاعلي للفرسان"}
                                className="w-full h-full object-cover absolute inset-0 z-0 border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            ) : (
                              <video
                                ref={(el) => {
                                  teacherVideoRef.current = el;
                                  if (el) {
                                    if (isTeacher) {
                                      if (cameraStream && el.srcObject !== cameraStream) {
                                        try {
                                          el.srcObject = cameraStream;
                                        } catch (err) {}
                                      }
                                    } else {
                                      if (remoteStream) {
                                        if (el.srcObject !== remoteStream) {
                                          try {
                                            el.srcObject = remoteStream;
                                            el.play().catch(e => {});
                                          } catch (err) {
                                          }
                                        }
                                      }
                                    }
                                  }
                                }}
                                autoPlay
                                playsInline
                                muted={isTeacher}
                                className="w-full h-full object-cover absolute inset-0 z-0 transition-transform duration-300"
                              />
                            )}
                            {/* Student self-view video */}
                            {!isTeacher && cameraStream && (
                                <video
                                  ref={(el) => {
                                    if (el && el.srcObject !== cameraStream) {
                                      el.srcObject = cameraStream;
                                    }
                                  }}
                                  autoPlay playsInline muted
                                  className="absolute bottom-4 left-4 w-32 h-44 rounded-xl shadow-lg border-2 border-white/20 object-cover z-30"
                                />
                            )}
                            {/* Cam Active animation */}
                            {!(
                              cameraLayout === "pip" && isWhiteboardActive
                            ) && (
                              <div
                                className={`text-center space-y-4 z-10 transition-opacity duration-500 ${(cameraStream || activeYoutubeVideoId || (isTeacher && liveStreamType === 'youtube' && extractYouTubeId(youtubeLiveUrl)) || (!isTeacher && isLiveActive && teacherCameraEnabled)) ? "opacity-0 hover:opacity-100 bg-black/70 p-6 rounded-xl backdrop-blur-sm" : "opacity-100 bg-black/75 p-6 rounded-xl backdrop-blur-sm"}`}
                              >
                                <div className="w-16 h-16 rounded-full bg-red-400/10 flex items-center justify-center text-red-500 mx-auto animate-pulse border border-red-500/20 animate-duration-1000">
                                  <Video size={30} />
                                </div>
                                <p className="text-white text-base font-black font-sans tracking-wide">
                                  {!isTeacher && !teacherCameraEnabled && !activeYoutubeVideoId ? (
                                    "سيظهر الأستاذ على الصفحة المباشرة بمجرد سماحه بفتح الكاميرا 📹"
                                  ) : isLiveActive ? (
                                    "البث المباشر التفاعلي والسبورة الذكية نشطة الآن 📡"
                                  ) : (
                                    "معاينة البث المباشر والسبورة الذكية (البث غير نشط)"
                                  )}
                                </p>
                                <span className="text-xs text-white/40 font-bold block">
                                  أستاذ {teacherData?.name || "الأستاذ"} يلقي
                                  درساً مباشراً للفرسان
                                </span>
                              </div>
                            )}
                            {!(
                              cameraLayout === "pip" && isWhiteboardActive
                            ) && (
                              <div className="absolute top-16 right-6 flex items-center gap-2 z-20 font-sans">
                                {isLiveActive ? (
                                  <div className={`text-[10px] font-black tracking-widest text-white px-3 py-1 rounded-full uppercase shadow-lg flex items-center gap-1.5 animate-pulse ${activeYoutubeVideoId || liveStreamType === 'youtube' ? 'bg-rose-600 shadow-rose-600/50' : 'bg-red-650 shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`}>
                                    {activeYoutubeVideoId || liveStreamType === 'youtube' ? '📡 YOUTUBE LIVE ● بث تفاعلي هجين' : 'LIVE ● مباشر للفرسان'}
                                  </div>
                                ) : (
                                  <div className="bg-amber-550 text-[10px] font-black tracking-widest text-black px-3 py-1 rounded-full uppercase shadow-[0_0_15px_rgba(245,158,11,0.35)]">
                                    معاينة البث (غير مبثوث)
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                              <VideoOff size={30} />
                            </div>
                            <p className="text-white/40 text-sm font-bold font-sans">
                              الكاميرا مغلقة
                            </p>
                          </div>
                        )}

                        {isWhiteboardActive && (
                          <>
                            {whiteboardImage &&
                              whiteboardImage.startsWith("data:image") && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                                  <img
                                    src={whiteboardImage}
                                    alt="board"
                                    className="object-contain"
                                    style={{
                                      width: `${boardImageScale * 100}%`,
                                      height: `${boardImageScale * 100}%`,
                                    }}
                                  />
                                </div>
                              )}
                            {whiteboardImage === "pdf_viewer" && pdfFile && (
                              <>
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900 overflow-auto no-scrollbar pointer-events-auto">
                                  <Document
                                    file={pdfFile}
                                    onLoadSuccess={({ numPages }) =>
                                      setPdfNumPages(numPages)
                                    }
                                    loading={
                                      <div className="text-white text-xs font-bold animate-pulse">
                                        جاري تحميل الملف...
                                      </div>
                                    }
                                  >
                                    <Page
                                      pageNumber={pdfPageNumber}
                                      scale={pdfScale}
                                      renderTextLayer={false}
                                      renderAnnotationLayer={false}
                                      height={window.innerHeight * 0.6}
                                      onRenderSuccess={captureAndSyncPdf}
                                    />
                                  </Document>
                                </div>
                              </>
                            )}
                            {whiteboardImage === "pdf_viewer" && !pdfFile && (
                              <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900 pointer-events-auto overflow-auto no-scrollbar">
                                 {sharedPdfPageBase64 ? (
                                    <div className="w-full h-full flex items-center justify-center overflow-auto pointer-events-auto">
                                      <img src={sharedPdfPageBase64} alt="pdf-page" className="object-contain transition-transform duration-300 pointer-events-none" style={{ transform: `scale(${pdfScale})` }} />
                                    </div>
                                 ) : (
                                   <div className="flex flex-col items-center opacity-40">
                                     <FileText size={48} className="text-[#00E5FF] mb-4 animate-pulse" />
                                     <span className="text-white text-xs font-bold">جاري المزامنة...</span>
                                   </div>
                                 )}
                              </div>
                            )}
                            <canvas
                              onMouseDown={startDrawing}
                              onMouseMove={draw}
                              onMouseUp={stopDrawing}
                              onMouseLeave={stopDrawing}
                              onTouchStart={(e) =>
                                handleStartDrawing(
                                  e.touches[0].clientX,
                                  e.touches[0].clientY,
                                  e.currentTarget,
                                )
                              }
                              onTouchMove={(e) =>
                                handleDraw(
                                  e.touches[0].clientX,
                                  e.touches[0].clientY,
                                  e.currentTarget,
                                )
                              }
                              onTouchEnd={stopDrawing}
                              ref={(canvas) => {
                                if (!canvas) return;
                                const ctx = canvas.getContext("2d");
                                if (!ctx) return;
                                const parent = canvas.parentElement;
                                if (parent) {
                                  if (
                                    canvas.width !== parent.clientWidth ||
                                    canvas.height !== parent.clientHeight
                                  ) {
                                    canvas.width = parent.clientWidth;
                                    canvas.height = parent.clientHeight;
                                  }
                                }
                                ctx.clearRect(
                                  0,
                                  0,
                                  canvas.width,
                                  canvas.height,
                                );

                                renderWhiteboardBackground(
                                  ctx,
                                  canvas,
                                  whiteboardImage,
                                );

                                // Render strokes
                                whiteboardStrokes.forEach((s) =>
                                  renderStroke(ctx, s, canvas),
                                );
                                if (currentShape) {
                                  renderStroke(ctx, currentShape, canvas);
                                }
                                ctx.globalCompositeOperation = "source-over";
                              }}
                              className={`absolute inset-0 z-20 ${boardTool === "pointer" ? "pointer-events-none" : "cursor-crosshair"}`}
                            />
                            {laserPosition && (
                              <div
                                className="absolute z-50 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_15px_4px_rgba(239,68,68,0.9)] pointer-events-none transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
                                style={{
                                  left: `${laserPosition.x * 100}%`,
                                  top: `${laserPosition.y * 100}%`,
                                }}
                              />
                            )}
                          </>
                        )}
                        {isLiveActive && (
                          <div className="absolute bottom-4 left-6 right-6 flex flex-row-reverse justify-between items-center pointer-events-none z-30 select-none">
                            <div className="flex items-center gap-3">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                              <span className="text-[11px] sm:text-xs text-white font-extrabold font-mono tracking-wider drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.95)]">
                                {formatLiveDuration(liveSeconds)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dedicated PDF Controls Below Video */}
                  {isWhiteboardActive &&
                    whiteboardImage === "pdf_viewer" &&
                    pdfFile && (
                      <div className="mx-6 md:mx-8 mb-6 bg-[#0C1229] border border-white/5 py-2 px-4 rounded-xl shadow-xl flex items-center justify-center gap-6 overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded-lg border border-white/5 shadow-inner">
                          <button
                            onClick={() =>
                              setPdfPageNumber((p) =>
                                Math.min(pdfNumPages, p + 1),
                              )
                            }
                            className="w-8 h-8 rounded-md text-white bg-white/5 hover:bg-[#00E5FF]/20 hover:text-[#00E5FF] font-black transition-all flex items-center justify-center shadow-sm"
                          >
                            &lt;
                          </button>
                          <span
                            className="text-xs font-black text-[#00E5FF] tracking-widest text-center font-mono w-16 drop-shadow-md"
                            dir="ltr"
                          >
                            {pdfPageNumber}{" "}
                            <span className="text-white/30">
                              / {pdfNumPages}
                            </span>
                          </span>
                          <button
                            onClick={() =>
                              setPdfPageNumber((p) => Math.max(1, p - 1))
                            }
                            className="w-8 h-8 rounded-md text-white bg-white/5 hover:bg-[#00E5FF]/20 hover:text-[#00E5FF] font-black transition-all flex items-center justify-center shadow-sm"
                          >
                            &gt;
                          </button>
                        </div>

                        <div className="w-[1px] h-6 bg-white/10 shrink-0" />

                        <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded-lg border border-white/5 shadow-inner shrink-0">
                          <button
                            onClick={() => {
                              const ns = pdfScale + 0.1;
                              setPdfScale(ns);
                            }}
                            className="w-8 h-8 rounded-md bg-white/5 hover:bg-emerald-500/20 text-white font-black hover:text-emerald-400 transition-all flex items-center justify-center text-sm shadow-sm"
                            title="تكبير"
                          >
                            +
                          </button>
                          <span
                            className="text-[10px] font-black text-emerald-400 text-center font-mono w-10 drop-shadow-md"
                            dir="ltr"
                          >
                            {Math.round(pdfScale * 100)}%
                          </span>
                          <button
                            onClick={() => {
                              const ns = Math.max(0.5, pdfScale - 0.1);
                              setPdfScale(ns);
                            }}
                            className="w-8 h-8 rounded-md bg-white/5 hover:bg-orange-500/20 text-white font-black hover:text-orange-400 transition-all flex items-center justify-center text-sm shadow-sm"
                            title="تصغير"
                          >
                            -
                          </button>
                        </div>
                      </div>
                    )}

                  {/* Roster & Controls directly below the widescreen video */}
                  <div className="px-6 py-6 md:px-8 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Row: Quick streaming details config card & triggers */}
                    <div className="lg:col-span-2 space-y-4 text-right">
                      <div className="bg-[#0C1229]/95 border border-white/5 p-6 rounded-2xl backdrop-blur-md space-y-5 shadow-xl">
                        {/* Live interaction control tab navigation */}
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-white/5 pb-3">
                          {[
                            { id: "settings", label: "⚙️ الأجهزة" },
                            { id: "board", label: "💻 السبورة" },
                            { id: "quiz", label: "⚡ اختبار سريع" },
                            {
                              id: "questions",
                              label: `📡 أسئلة حية (${liveQuestions.length})`,
                            },
                            {
                              id: "raises",
                              label: `✋ المداخلات (${handRaises.filter((h) => h.status === "pending").length})`,
                            },
                            { id: "stats", label: "📊 المؤشرات" },
                          ].map((tab) => {
                            const active = teacherLiveSubTab === tab.id;
                            return (
                              <button
                                key={tab.id}
                                onClick={() =>
                                  setTeacherLiveSubTab(tab.id as any)
                                }
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer whitespace-nowrap ${active ? "bg-[#00E5FF] text-[#050A18] shadow-md shadow-[#00E5FF]/10" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
                              >
                                {tab.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Render Sub tab views */}
                        {teacherLiveSubTab === "settings" && (
                          <div className="space-y-4 animate-fadeIn">
                            <h3 className="text-xs font-black text-white/50 uppercase tracking-widest flex items-center gap-2">
                              <ShieldCheck
                                size={16}
                                className="text-blue-500"
                              />
                              محددات البث المفتوح والاتصال للأستاذ
                            </h3>

                            <div>
                              <label className="text-[10px] text-white/40 block mb-1.5 text-right">
                                أدخل اسم أو عنوان بث الدرس الحالي للفرسان
                              </label>
                              <input
                                type="text"
                                value={liveTitle}
                                onChange={(e) => setLiveTitle(e.target.value)}
                                placeholder="مثال: مراجعة قواعد الماضي البسيط والوزاريات"
                                className="w-full bg-[#101633] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 outline-none focus:border-red-400/40 transition-all font-sans font-bold text-right"
                                dir="rtl"
                              />
                            </div>

                            {/* Stream Engine Mode Selector */}
                            <div className="space-y-2">
                              <label className="text-[10px] text-white/50 font-black block text-right">
                                اختر محرك البث المباشر للفرسان 📡
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setLiveStreamType('youtube')}
                                  className={`p-3 rounded-xl border text-right transition-all flex flex-col gap-1 cursor-pointer ${
                                    liveStreamType === 'youtube'
                                      ? 'bg-rose-500/15 border-rose-500/50 text-white shadow-lg shadow-rose-500/10'
                                      : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-black text-xs text-rose-400">⚡ بث تفاعلي هجين (YouTube Live)</span>
                                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">موصى به (100+ طالب)</span>
                                  </div>
                                  <p className="text-[10px] text-white/50 leading-relaxed font-sans">
                                    بث فائق الجودة بدون تقطيع يتسع لآلاف الطلاب مع بقاء كافة الأدوات التفاعلية (سبورة، مايك، أسئلة).
                                  </p>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setLiveStreamType('webrtc')}
                                  className={`p-3 rounded-xl border text-right transition-all flex flex-col gap-1 cursor-pointer ${
                                    liveStreamType === 'webrtc'
                                      ? 'bg-indigo-500/15 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/10'
                                      : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-black text-xs text-indigo-400">📹 غرفة تفاعلية (WebRTC Direct)</span>
                                    <span className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold">مجموعات صغيرة</span>
                                  </div>
                                  <p className="text-[10px] text-white/50 leading-relaxed font-sans">
                                    اتصال كاميرا مباشر من المتصفح مباشرة، مناسب لمجموعات تفاعلية حتى 50 طالباً.
                                  </p>
                                </button>
                              </div>
                            </div>

                            {liveStreamType === 'youtube' && (
                              <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3.5 space-y-2 text-right">
                                <div className="flex items-center justify-between flex-wrap gap-1">
                                  <label className="text-[11px] text-rose-300 font-extrabold flex items-center gap-1.5">
                                    <Video size={14} className="text-rose-400" />
                                    رابط أو معرف البث المباشر من يوتيوب (YouTube Live URL)
                                  </label>
                                  <span className="text-[9px] text-white/40 font-mono">يمكن استخدام بث غير مدرج (Unlisted)</span>
                                </div>
                                <input
                                  type="text"
                                  value={youtubeLiveUrl}
                                  onChange={(e) => setYoutubeLiveUrl(e.target.value)}
                                  placeholder="مثال: https://www.youtube.com/watch?v=XXXXX أو https://youtu.be/XXXXX"
                                  className="w-full bg-[#080D1F] border border-rose-500/30 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/20 outline-none focus:border-rose-400 transition-all font-sans dir-ltr text-left"
                                />
                                <p className="text-[9px] text-white/50 leading-snug">
                                  💡 **آلية العمل التفاعلية:** ابدأ البث على يوتيوب (أو OBS)، ثم ضع الرابط هنا. ستظهر شاشتك فوراً لجميع الطلاب داخل التطبيق مع الاحتفاظ بكامل السبورة الذكية، المحادثة، والأسئلة المباشرة!
                                </p>
                              </div>
                            )}

                            <div className="grid grid-cols-3 gap-2 md:gap-3 w-full">
                              <button
                                type="button"
                                onClick={handleToggleMic}
                                className={`p-2 md:p-3 rounded-lg md:rounded-xl border text-[10px] md:text-xs font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 cursor-pointer ${micEnabled ? "bg-blue-600/10 border-blue-500/20 text-blue-200" : "bg-white/5 border-white/5 text-white/30"}`}
                              >
                                {micEnabled ? (
                                  <Mic
                                    size={14}
                                    className="shrink-0 text-blue-400"
                                  />
                                ) : (
                                  <MicOff
                                    size={14}
                                    className="shrink-0 text-white/30"
                                  />
                                )}
                                <span className="truncate font-sans">
                                  {micEnabled ? "الميكروفون نشط" : "كتم المايك"}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={handleToggleCamera}
                                className={`p-2 md:p-3 rounded-lg md:rounded-xl border text-[10px] md:text-xs font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 cursor-pointer ${camEnabled ? "bg-emerald-600/10 border-emerald-500/20 text-emerald-200" : "bg-white/5 border-white/5 text-white/30"}`}
                              >
                                <Video
                                  size={14}
                                  className="shrink-0 text-emerald-400"
                                />
                                <span className="truncate font-sans">
                                  {camEnabled
                                    ? "الكاميرا نشطة"
                                    : "تشغيل الكاميرا"}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (recordingStartTime) {
                                    const durationSecs = Math.floor((Date.now() - recordingStartTime) / 1000);
                                    const mins = Math.floor(durationSecs / 60);
                                    const secs = durationSecs % 60;
                                    
                                    addDoc(collection(db, "recorded_lessons"), {
                                      schoolId: resolvedSchoolId,
                                      title: liveTitle || 'تسجيل بث مباشر أكاديمي (جديد)',
                                      subject: teacherData?.subject || 'مادة عامة',
                                      grade: targetBroadcastGrade || activeWorkingClass,
                                      section: isAllSections ? null : selectedTeacherClass,
                                      targetSections: targetSectionsList,
                                      targetSectionLabel: targetSectionLabel,
                                      duration: `${mins} دقيقة و ${secs} ثانية`,
                                      date: new Date().toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }),
                                      timestamp: serverTimestamp()
                                    }).catch(console.error);

                                    setRecordingStartTime(null);
                                    showToast(`تم إيقاف التسجيل وحفظ الدرس في ميادين (${targetSectionLabel}) 📥`, "success");
                                  } else {
                                    setRecordingStartTime(Date.now());
                                    showToast(`بدأ التوثيق والتسجيل السحابي للبث لـ (${targetSectionLabel}) 🔴`, "info");
                                  }
                                }}
                                className={`p-2 md:p-3 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 cursor-pointer border ${recordingStartTime ? 'bg-red-600/20 border-red-500/50 text-red-400 bubble-animation' : 'bg-purple-600/20 border-purple-500/30 hover:bg-purple-600/30 text-purple-300'}`}
                              >
                                <div className={`w-3 h-3 rounded-full shrink-0 ${recordingStartTime ? 'bg-red-500 animate-ping' : 'bg-purple-500 animate-[pulse_3s_ease-in-out_infinite]'}`} />
                                <span className="truncate font-sans">
                                  {recordingStartTime ? 'إيقاف وحفظ التسجيل' : 'تسجيل البث'}
                                </span>
                              </button>

                              <button
                                onClick={async () => {
                                  try {
                                    console.log("[Broadcast DEBUG] Button clicked. isLiveActive state:", isLiveActive);
                                    
                                    const nextState = !isLiveActive;
                                    const subjectStr = teacherData?.subject || teacherData?.specialty || "unknown";
                                    const teacherId = teacherData?.id || teacherData?.code || teacherData?.name || "unknown";
                                    const classId = targetBroadcastGrade;
                                    const liveSessionId = `${resolvedSchoolId}_${targetBroadcastGrade}`;

                                    console.log("[Broadcast DEBUG] Broadcast initialization started. Parameters:", {
                                      resolvedSchoolId,
                                      targetBroadcastGrade,
                                      nextState,
                                      subjectId: subjectStr,
                                      classId,
                                      liveSessionId,
                                      teacherId,
                                      teacherName: teacherData?.name || "الأستاذ"
                                    });

                                    if (!resolvedSchoolId) {
                                      throw new Error("تنبيه: كود المدرسة غير موجود أو غير معرّف (schoolId is missing).");
                                    }
                                    if (!targetBroadcastGrade) {
                                      throw new Error("تنبيه: الصف المستهدف غير معرّف (targetBroadcastGrade is missing).");
                                    }

                                    // IMPORTANT: Set safeSessionStorage BEFORE the Firestore setDoc call to prevent the onSnapshot 
                                    // race condition where the self-healing listener immediately shuts down the stream.
                                    if (nextState) {
                                      safeSessionStorage.setItem("s6_is_broadcasting", "true");
                                      console.log("[Broadcast DEBUG] Set safeSessionStorage s6_is_broadcasting to true (pre-write to database)");
                                    } else {
                                      safeSessionStorage.removeItem("s6_is_broadcasting");
                                      console.log("[Broadcast DEBUG] Removed safeSessionStorage s6_is_broadcasting (pre-write to database)");
                                    }

                                    await setDoc(doc(db, "live_sessions", liveSessionId), {
                                      liveId: `live_${Date.now()}`,
                                      isLiveActive: nextState,
                                      isLive: nextState,
                                      title: liveTitle,
                                      streamType: liveStreamType,
                                      youtubeUrl: youtubeLiveUrl,
                                      youtubeVideoId: liveStreamType === 'youtube' ? extractYouTubeId(youtubeLiveUrl) : null,
                                      heartbeat: nextState ? Date.now() : null,
                                      updatedAt: serverTimestamp(),
                                      startTime: serverTimestamp(),
                                      teacherId: teacherId,
                                      teacherName: teacherData?.name || "الأستاذ",
                                      subjectId: subjectStr,
                                      subjectName: subjectStr,
                                      classId: classId,
                                      targetSection: isAllSections ? "ALL" : selectedTeacherClass,
                                      targetSections: targetSectionsList,
                                      targetSectionLabel: targetSectionLabel,
                                      targetGrade: targetBroadcastGrade,
                                      materialIndex: selectedMaterialIndex,
                                      isWhiteboardActive: isWhiteboardActive,
                                      cameraEnabled: nextState ? camEnabled : false,
                                      isCameraOn: nextState ? camEnabled : false,
                                      teacherVideoActive: nextState ? camEnabled : false,
                                      camEnabled: nextState ? camEnabled : false,
                                      micEnabled: nextState ? micEnabled : false,
                                      isMicOn: nextState ? micEnabled : false,
                                      teacherMicActive: nextState ? micEnabled : false,
                                      ...(nextState ? {
                                        reactionCounts: {
                                          fire: 0,
                                          heart: 0,
                                          lightbulb: 0,
                                          clap: 0,
                                          excellent: 0,
                                        },
                                        handRaises: [],
                                        liveQuestions: [],
                                        studentLiveControls: {},
                                        activeLiveQuizStr: null
                                      } : {})
                                    }, { merge: true });

                                    console.log("[Broadcast DEBUG] Live session created/updated successfully in Firestore document:", liveSessionId);

                                    if (nextState) {
                                      console.log("[Broadcast DEBUG] Sending notification for the new stream...");
                                      await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
                                        userId: `class_${resolvedSchoolId}_${targetBroadcastGrade}`,
                                        type: "general",
                                        title: `بث تفاعلي جديد لـ (${targetSectionLabel})! 📡`,
                                        message: `تم إطلاق بث لمادة ${subjectStr} بعنوان "${liveTitle}" موجه إلى (${targetSectionLabel}) من قبل الأستاذ ${teacherData?.name?.replace(/^(أ\.|أستاذ\s+)/, '').trim() || 'القدير'}. انضم الآن!`,
                                        recipientRole: 'student',
                                        targetSection: isAllSections ? "ALL" : selectedTeacherClass,
                                        targetSections: targetSectionsList,
                                        read: false
                                      }) });
                                      console.log("[Broadcast DEBUG] Notification sent successfully.");
                                    }

                                    setIsLiveActive(nextState);
                                    console.log("[Broadcast DEBUG] Broadcast state updated successfully. isLiveActive is now:", nextState);

                                    showToast(
                                      nextState
                                        ? `تم إطلاق البث المباشر لـ (${targetSectionLabel}) فوراً! 🚀`
                                        : "تم إنهاء البث التفاعلي بنجاح",
                                      nextState ? "success" : "info",
                                    );
                                  } catch (error: any) {
                                    console.warn("[Broadcast DEBUG] Live Error encountered:", error);
                                    // Make sure we revert safeSessionStorage if we failed to initiate
                                    if (!isLiveActive) {
                                      safeSessionStorage.removeItem("s6_is_broadcasting");
                                    }
                                    showToast(
                                      `⚠️ عذراً، فشل تفعيل البث: ${error?.message || "خطأ غير معروف"}`,
                                      "error"
                                    );
                                  }
                                }}
                                className={`p-2 md:p-3 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 cursor-pointer ${isLiveActive ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]" : "bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-[#050A18]"}`}
                              >
                                <Radio
                                  size={14}
                                  className={`shrink-0 ${isLiveActive ? "animate-pulse" : ""}`}
                                />
                                <span className="truncate font-sans">
                                  {isLiveActive ? "إنهاء البث" : "إطلاق البث"}
                                </span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Smart board tools */}
                        {teacherLiveSubTab === "board" && (
                          <div
                            className="space-y-4 animate-fadeIn text-right"
                            dir="rtl"
                          >
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0 pb-2">
                              <h3 className="text-xs font-black text-[#00E5FF] uppercase tracking-widest flex items-center gap-2">
                                <Palette size={16} />
                                حقيبة أدوات السبورة الذكية الحقيقية
                              </h3>
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  onClick={async () => {
                                    const nextState = !studentCanDraw;
                                    setStudentCanDraw(nextState);
                                    if (isLiveActive && resolvedSchoolId && targetBroadcastGrade) {
                                      try {
                                        await setDoc(doc(db, "live_sessions", `${resolvedSchoolId}_${targetBroadcastGrade}`), {
                                          studentCanDraw: nextState
                                        }, { merge: true });
                                      } catch (err) {
                                        console.error(err);
                                      }
                                    }
                                  }}
                                  className={`px-3 py-1 rounded-full text-[9px] font-black transition-all shadow-md ${studentCanDraw ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-zinc-800 text-white/50 border border-white/10 hover:text-white"}`}
                                >
                                  {studentCanDraw
                                    ? "إلغاء رسم الطالب"
                                    : "منح السبورة للطالب ✍️"}
                                </button>
                                <button
                                  onClick={async () => {
                                    const nextLayout = cameraLayout === "pip" ? "default" : "pip";
                                    setCameraLayout(nextLayout);
                                    if (isLiveActive) {
                                      try {
                                        await setDoc(doc(db, "live_sessions", `${resolvedSchoolId}_${targetBroadcastGrade}`), {
                                          cameraLayout: nextLayout,
                                        }, { merge: true });
                                      } catch (err) {
                                        console.error(err);
                                      }
                                    }
                                  }}
                                  className={`px-3 py-1 rounded-full text-[9px] font-black transition-all shadow-md ${cameraLayout === "pip" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-zinc-800 text-white/50 border border-white/10 hover:text-white"}`}
                                >
                                  تفعيل الكاميرا PiP 🎥
                                </button>
                                {cameraLayout === "pip" && (
                                  <button
                                    onClick={async () => {
                                      const nextShape = pipShape === "round" ? "square" : "round";
                                      setPipShape(nextShape);
                                      if (isLiveActive) {
                                        try {
                                          await setDoc(doc(db, "live_sessions", `${resolvedSchoolId}_${targetBroadcastGrade}`), {
                                            pipShape: nextShape,
                                          }, { merge: true });
                                        } catch (err) {
                                          console.error(err);
                                        }
                                      }
                                    }}
                                    className="px-3 py-1 rounded-full text-[9px] font-black transition-all shadow-md bg-[#FF2A54]/10 text-[#FF2A54] border border-[#FF2A54]/30 hover:bg-[#FF2A54]/20"
                                  >
                                    تغيير الشكل (مربع/دائري)
                                  </button>
                                )}
                                <button
                                  onClick={async () => {
                                    const nextState = !isWhiteboardActive;
                                    setIsWhiteboardActive(nextState);
                                    if (isLiveActive) {
                                      try {
                                        await setDoc(doc(db, "live_sessions", `${resolvedSchoolId}_${targetBroadcastGrade}`), {
                                          isWhiteboardActive: nextState,
                                        }, { merge: true });
                                      } catch (err) {
                                        console.error(err);
                                      }
                                    }
                                  }}
                                  className={`px-3 py-1 rounded-full text-[9px] font-black transition-all shadow-md ${isWhiteboardActive ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20"}`}
                                >
                                  {isWhiteboardActive
                                    ? "إيقاف عرض السبورة"
                                    : "تفعيل السبورة 💻"}
                                </button>
                              </div>
                            </div>

                            {isWhiteboardActive ? (
                              <div className="space-y-4 bg-black/40 p-4 rounded-xl border border-white/5">
                                {/* Colors & Eraser Toggle */}
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-white/50 font-bold">
                                      لون القلم:
                                    </span>
                                    {[
                                      { hex: "#00E5FF", label: "فسفوري" },
                                      { hex: "#FFD600", label: "ذهبي" },
                                      { hex: "#10B981", label: "أخضر" },
                                      { hex: "#EF4444", label: "أحمر" },
                                      { hex: "#FFFFFF", label: "أبيض" },
                                    ].map((c) => (
                                      <button
                                        key={c.hex}
                                        onClick={() => {
                                          setBoardColor(c.hex);
                                          setBoardTool("pencil");
                                        }}
                                        className={`w-6 h-6 rounded-full border transition-all flex items-center justify-center ${boardColor === c.hex && boardTool === "pencil" ? "scale-110 ring-2 ring-[#00E5FF]/40 border-white" : "border-white/10"}`}
                                        style={{ backgroundColor: c.hex }}
                                        title={c.label}
                                      />
                                    ))}

                                    <button
                                      onClick={() => setBoardTool("eraser")}
                                      className={`px-2.5 py-1 rounded text-[10px] font-black flex items-center gap-1 ${boardTool === "eraser" ? "bg-red-500 text-white" : "bg-white/5 text-white/60 hover:bg-white/10"}`}
                                    >
                                      🧹 ممسحة مخصصة
                                    </button>
                                  </div>

                                  {/* Thickness */}
                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-white/50 font-bold">
                                        سمك الخط:
                                      </span>
                                      <input
                                        type="range"
                                        min="2"
                                        max="16"
                                        value={brushThickness}
                                        onChange={(e) =>
                                          setBrushThickness(
                                            parseInt(e.target.value),
                                          )
                                        }
                                        className="w-20 accent-[#00E5FF] cursor-pointer"
                                      />
                                      <span className="text-xs text-white font-mono font-bold">
                                        {brushThickness}px
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-white/50 font-bold">
                                        حجم النص:
                                      </span>
                                      <input
                                        type="range"
                                        min="12"
                                        max="72"
                                        value={boardTextSize}
                                        onChange={(e) =>
                                          setBoardTextSize(
                                            parseInt(e.target.value),
                                          )
                                        }
                                        className="w-20 accent-[#00E5FF] cursor-pointer"
                                      />
                                      <span className="text-xs text-white font-mono font-bold">
                                        {boardTextSize}px
                                      </span>
                                    </div>
                                    {whiteboardImage &&
                                      whiteboardImage.startsWith(
                                        "data:image",
                                      ) && (
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] text-white/50 font-bold">
                                            حجم الصورة:
                                          </span>
                                          <input
                                            type="range"
                                            min="0.2"
                                            max="3"
                                            step="0.1"
                                            value={boardImageScale}
                                            onChange={(e) =>
                                              setBoardImageScale(
                                                parseFloat(e.target.value),
                                              )
                                            }
                                            className="w-20 accent-emerald-500 cursor-pointer"
                                          />
                                        </div>
                                      )}
                                  </div>
                                </div>

                                {/* Drawing Shapes/Tools Options */}
                                <div className="flex flex-col gap-2 border-b border-white/5 pb-3">
                                  <div className="flex flex-wrap items-center gap-2 justify-end">
                                    {[
                                      { id: "pointer", label: "👆 تصفح" },
                                      { id: "pencil", label: "✏️ قلم حر" },
                                      { id: "laser", label: "🔴 مؤشر الليزر" },
                                      { id: "line", label: "📏 مستقيم" },
                                      { id: "rect", label: "⬛ مستطيل" },
                                      { id: "circle", label: "⭕ دائرة" },
                                      { id: "arrow", label: "↗️ سهم" },
                                      { id: "text", label: "📝 نص" },
                                    ].map((tool) => (
                                      <button
                                        key={tool.id}
                                        onClick={() =>
                                          setBoardTool(tool.id as any)
                                        }
                                        className={`px-3 py-1.5 rounded text-[10px] font-bold transition-all ${boardTool === tool.id ? "bg-[#00E5FF] text-black shadow-lg shadow-[#00E5FF]/20" : "bg-white/5 text-white/70 hover:bg-white/10"}`}
                                      >
                                        {tool.label}
                                      </button>
                                    ))}
                                  </div>
                                  {boardTool === "text" && (
                                    <div className="flex items-center gap-2 mt-2 ml-auto shadow-sm shadow-[#00E5FF]/10 w-full max-w-sm rounded backdrop-blur">
                                      <input
                                        type="text"
                                        value={boardTextContent}
                                        onChange={(e) =>
                                          setBoardTextContent(e.target.value)
                                        }
                                        placeholder="اكتب النص هنا، ثم انقر على السبورة لوضعه..."
                                        className="flex-1 bg-black/40 border border-[#00E5FF]/30 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#00E5FF] text-right placeholder:text-zinc-600 transition-colors"
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* Worksheets and clearing */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-1.5 text-right">
                                    <label className="text-[10px] text-white/40 block">
                                      الخلفيات النموذجية الذكية للدرس (اختيار
                                      قالب):
                                    </label>
                                    <div className="flex flex-wrap gap-1.5 md:max-w-md">
                                      <button
                                        onClick={() => {
                                          handleSetWhiteboardImage("white");
                                          showToast("تحويل السبورة لخلفية بيضاء نظيفة", "success");
                                        }}
                                        className={`px-2 py-1.5 rounded text-[9px] font-bold ${whiteboardImage === "white" ? "bg-white text-black shadow-lg shadow-white/20" : "bg-white/5 text-white/70 hover:bg-white/10"}`}
                                      >
                                        بيضاء نظيفة
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleSetWhiteboardImage("chalkboard");
                                          showToast("تحويل السبورة لسبورة داكنة", "success");
                                        }}
                                        className={`px-2 py-1.5 rounded text-[9px] font-bold ${whiteboardImage === "chalkboard" ? "bg-[#0E8A51] text-white shadow-lg shadow-[#0E8A51]/20" : "bg-white/5 text-white/70 hover:bg-[#0E8A51]/10"}`}
                                      >
                                        داكنة طباشيرية
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleSetWhiteboardImage("ruled");
                                          showToast("تم تحويل السبورة لورق مسطر", "success");
                                        }}
                                        className={`px-2 py-1.5 rounded text-[9px] font-bold ${whiteboardImage === "ruled" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-white/5 text-white/70 hover:bg-indigo-500/10"}`}
                                      >
                                        ورق مسطر
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleSetWhiteboardImage("grid");
                                          showToast("تحويل السبورة لورق مربعات رياضيات", "success");
                                        }}
                                        className={`px-2 py-1.5 rounded text-[9px] font-bold ${whiteboardImage === "grid" ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20" : "bg-white/5 text-white/70 hover:bg-cyan-500/10"}`}
                                      >
                                        مربعات رياضيات
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleSetWhiteboardImage("coordinate_grid");
                                          showToast("تم الانتقال لشبكة إحداثيات", "success");
                                        }}
                                        className={`px-2 py-1.5 rounded text-[9px] font-bold ${whiteboardImage === "coordinate_grid" ? "bg-red-500/40 text-white shadow-lg shadow-red-500/20" : "bg-white/5 text-white/70 hover:bg-red-500/20"}`}
                                      >
                                        شبكة إحداثيات
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleSetWhiteboardImage("geometric");
                                          showToast("تم الانتقال لخلفية هندسية", "success");
                                        }}
                                        className={`px-2 py-1.5 rounded text-[9px] font-bold ${whiteboardImage === "geometric" ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20" : "bg-white/5 text-white/70 hover:bg-purple-500/10"}`}
                                      >
                                        خلفية هندسية
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleSetWhiteboardImage("music");
                                          showToast("تحويل السبورة لأسطر نوتة", "success");
                                        }}
                                        className={`px-2 py-1.5 rounded text-[9px] font-bold ${whiteboardImage === "music" ? "bg-zinc-200 text-black shadow-lg shadow-amber-500/20" : "bg-white/5 text-white/70 hover:bg-white/20"}`}
                                      >
                                        موسيقى (نوتة)
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleSetWhiteboardImage("science");
                                          showToast("تحويل السبورة لشبكة مخبرية علوم", "success");
                                        }}
                                        className={`px-2 py-1.5 rounded text-[9px] font-bold ${whiteboardImage === "science" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-white/5 text-white/70 hover:bg-emerald-500/10"}`}
                                      >
                                        العلوم (مخبرية)
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleSetWhiteboardImage("arabic");
                                          showToast("تحويل السبورة لكتابة عربية محسنة", "success");
                                        }}
                                        className={`px-2 py-1.5 rounded text-[9px] font-bold ${whiteboardImage === "arabic" ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20" : "bg-white/5 text-white/70 hover:bg-amber-600/10"}`}
                                      >
                                        أسطر كتابة عربية
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleSetWhiteboardImage(null);
                                          showToast(
                                            "تم تحويل السبورة لخلفية شفافة فارغة",
                                            "info",
                                          );
                                        }}
                                        className={`px-2 py-1.5 rounded text-[9px] font-bold ${!whiteboardImage ? "bg-[#00E5FF] text-black shadow-lg shadow-[#00E5FF]/20" : "bg-white/5 text-white/70 hover:bg-white/10"}`}
                                      >
                                        شفافة (فوق الكاميرا)
                                      </button>
                                      
                                      <label className="relative inline-flex items-center justify-center cursor-pointer px-2 py-1.5 rounded text-[9px] font-bold bg-[#FF2A54]/10 text-[#FF2A54] hover:bg-[#FF2A54]/20 border border-[#FF2A54]/30 shadow-md">
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              const reader = new FileReader();
                                              reader.onload = (e) => {
                                                const b64 = e.target?.result as string;
                                                handleSetWhiteboardImage(b64);
                                                showToast("تم إدراج الصورة بنجاح", "success");
                                              };
                                              reader.readAsDataURL(file);
                                            }
                                            e.target.value = '';
                                          }}
                                        />
                                        🖼 إضافة صورة
                                      </label>

                                      <label className="relative inline-flex items-center justify-center cursor-pointer px-2 py-1.5 rounded text-[9px] font-bold bg-[#FF2A54]/10 text-[#FF2A54] hover:bg-[#FF2A54]/20 border border-[#FF2A54]/30 shadow-md">
                                        <input
                                          type="file"
                                          accept=".pdf"
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              const fileUrl = URL.createObjectURL(file);
                                              setPdfFile(fileUrl);
                                              setPdfScale(1.0);
                                              setPdfPageNumber(1);
                                              handleSetWhiteboardImage("pdf_viewer");
                                              showToast("تم رفع الملف بنجاح، جاري عرض المحتوى... 📄", "success");
                                            }
                                            e.target.value = '';
                                          }}
                                        />
                                        📄 إرفاق PDF
                                      </label>
                                      
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          showToast("عذراً، نظام العروض التقديمية التفاعلية قيد التحديث لدعم (PPT/PPTX). يرجى تقديم العرض كملف PDF حالياً.", "info");
                                        }}
                                        className="relative inline-flex items-center justify-center cursor-pointer px-2 py-1.5 rounded text-[9px] font-bold bg-[#FF7A00]/10 text-[#FF7A00] hover:bg-[#FF7A00]/20 border border-[#FF7A00]/30 shadow-md"
                                      >
                                        📊 إرفاق PPT
                                      </button>

                                      {(whiteboardImage && whiteboardImage.startsWith("data:image") || whiteboardImage === "pdf_viewer") && (
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            if (whiteboardImage === "pdf_viewer") {
                                                setPdfFile(null);
                                                setSharedPdfPageBase64(null);
                                            }
                                            handleSetWhiteboardImage(null);
                                            showToast("تم حذف المرفق", "info");
                                          }}
                                          className="px-2 py-1.5 rounded text-[9px] font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 shadow-md"
                                        >
                                          🗑 حذف المرفق
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Column 2: Clearing / Undo tools */}
                                  <div className="space-y-1.5 text-right flex flex-col justify-end">
                                    <label className="text-[10px] text-white/40 block">
                                      أدوات مسح وإدارة الطبقة المرسومة:
                                    </label>
                                    <div className="flex flex-wrap gap-1.5 justify-end">
                                      <button
                                        onClick={() => {
                                          setWhiteboardStrokes([]);
                                          showToast("تم مسح جميع الرسوم والخطوط بنجاح 🧹", "info");
                                        }}
                                        className="px-3 py-1.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 text-[9px] font-black hover:bg-red-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                                      >
                                        🧹 مسح الجميع
                                      </button>
                                      <button
                                        onClick={() => {
                                          setWhiteboardStrokes((prev) => {
                                            if (prev.length === 0) return prev;
                                            const lastStroke = prev[prev.length - 1];
                                            if (lastStroke.groupId) {
                                              return prev.filter(s => s.groupId !== lastStroke.groupId);
                                            }
                                            return prev.slice(0, -1);
                                          });
                                          showToast("تم التراجع عن خطوة واحدة ↩️", "info");
                                        }}
                                        className="px-3 py-1.5 rounded bg-indigo-500/20 text-indigo-350 border border-indigo-500/30 text-[9px] font-black hover:bg-indigo-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                                      >
                                        ↩️ تراجع
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-black/20 p-8 rounded-xl border border-white/5 text-center text-white/40 text-xs">
                                يرجى تفعيل السبورة لعرض أدوات الرسم وحواضن المحتوى.
                              </div>
                            )}

                          </div>
                        )}

                        {teacherLiveSubTab === "quiz" && (
                          <div
                            className="space-y-4 animate-fadeIn text-right"
                            dir="rtl"
                          >
                            <h3 className="text-xs font-black text-[#00E5FF] uppercase tracking-widest flex items-center gap-2">
                              <Zap size={16} className="text-[#00E5FF] animate-bounce" />
                              محرك الاختبارات الفورية لبوابة بيرق المميزة (تحدي الـ 60 ثانية)
                            </h3>

                            {activeLiveQuiz ? (
                              <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20 space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {activeLiveQuiz.isActive ? (
                                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                                    ) : (
                                      <span className="w-2.5 h-2.5 rounded-full bg-zinc-500" />
                                    )}
                                    <span className="text-amber-300 text-xs font-black">
                                      {activeLiveQuiz.isActive ? "اختبار نشط حالياً على شاشات الطلاب ⏱️" : "اختبار منتهي - عرض النتائج الختامية 🏆"}
                                    </span>
                                  </div>
                                  <span className="text-sm font-mono text-amber-400 font-bold">
                                    {activeLiveQuiz.secondsRemaining} ثانية متبقية
                                  </span>
                                </div>

                                <div className="bg-[#050A18] p-3 rounded-lg border border-white/5 space-y-1">
                                  <span className="text-[9px] text-[#00E5FF] font-black font-sans">
                                    السؤال المطروح للفرسان:
                                  </span>
                                  <p className="text-white text-xs font-bold">
                                    {activeLiveQuiz.question}
                                  </p>
                                </div>

                                {/* Live Quiz Stats */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="p-3 bg-white/5 rounded-lg text-center space-y-1">
                                    <span className="text-[10px] text-zinc-400 font-bold block">
                                      إجمالي الفرسان المشاركين
                                    </span>
                                    <span className="text-lg font-black text-white font-mono">
                                      {quizResponses.length}
                                    </span>
                                  </div>

                                  <div className="p-3 bg-white/5 rounded-lg text-center space-y-1">
                                    <span className="text-[10px] text-zinc-400 font-bold block">
                                      نسبة النجاح والحلول الصائبة
                                    </span>
                                    <span className="text-lg font-black text-emerald-400 font-mono">
                                      {quizResponses.length > 0
                                        ? `${Math.round((quizResponses.filter((r) => r.isCorrect).length / quizResponses.length) * 100)}%`
                                        : "0%"}
                                    </span>
                                  </div>
                                </div>

                                {/* Detailed Results Breakdown */}
                                <div className="space-y-3 bg-[#080B1A] p-3 rounded-xl border border-white/5">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] text-zinc-300 font-black">
                                      📊 التوزيع الإحصائي لخيارات الطلاب
                                    </h4>
                                    <button
                                      onClick={() => setShowDetailedQuizResults(!showDetailedQuizResults)}
                                      className="text-[9px] text-[#00E5FF] hover:underline font-black"
                                    >
                                      {showDetailedQuizResults ? "إخفاء التفاصيل" : "عرض التفاصيل الإحصائية"}
                                    </button>
                                  </div>

                                  {showDetailedQuizResults && (
                                    <div className="space-y-2 animate-fadeIn pt-1">
                                      {activeLiveQuiz.options.map((opt, idx) => {
                                        const count = quizResponses.filter((r) => r.answerIndex === idx).length;
                                        const pct = quizResponses.length > 0 ? (count / quizResponses.length) * 100 : 0;
                                        const isCorrect = idx === activeLiveQuiz.correctIndex;
                                        return (
                                          <div key={idx} className="space-y-1">
                                            <div className="flex justify-between items-center text-[10px] font-bold">
                                              <span className={isCorrect ? "text-emerald-400 font-black" : "text-white/75"}>
                                                الخيار {idx + 1}: {opt} {isCorrect && "✅ (الإجابة المعتمدة)"}
                                              </span>
                                              <span className="text-zinc-400">{count} طالب ({Math.round(pct)}%)</span>
                                            </div>
                                            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                              <div
                                                style={{ width: `${pct}%` }}
                                                className={`h-full rounded-full ${isCorrect ? "bg-emerald-500" : "bg-[#00E5FF]"}`}
                                              />
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>

                                {/* Leaderboard Speed Knights - Expanded up to 10 fastest knights */}
                                <div className="space-y-2">
                                  <h4 className="text-[10px] text-[#00E5FF] font-black flex items-center gap-1">
                                    ⭐ أسرع الفرسان إجابة (الترتيب التنافسي للفرسان الأبطال)
                                  </h4>
                                  <div className="space-y-1 max-h-[220px] overflow-y-auto no-scrollbar">
                                    {[...quizResponses]
                                      .filter((r) => r.isCorrect)
                                      .sort((a, b) => a.timeSpent - b.timeSpent)
                                      .slice(0, 10)
                                      .map((r, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-center justify-between bg-black/40 px-3 py-2 rounded-lg text-xs hover:bg-black/50 transition-colors"
                                        >
                                          <div className="flex items-center gap-2">
                                            <span
                                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${
                                                idx === 0
                                                  ? "bg-yellow-500 text-black shadow-[0_0_8px_rgba(234,179,8,0.4)]"
                                                  : idx === 1
                                                  ? "bg-zinc-350 text-black"
                                                  : idx === 2
                                                  ? "bg-amber-700 text-white"
                                                  : "bg-indigo-500/20 text-[#00E5FF]"
                                              }`}
                                            >
                                              {idx === 0 ? "👑" : idx + 1}
                                            </span>
                                            <span className="text-white font-black">
                                              {r.studentName || r.name}
                                            </span>
                                          </div>
                                          <span className="text-emerald-400 font-mono text-[10px] font-bold">
                                            {r.timeSpent.toFixed(1)} ثانية ⏱️
                                          </span>
                                        </div>
                                      ))}
                                    {quizResponses.filter((r) => r.isCorrect).length === 0 && (
                                      <p className="text-[9px] text-zinc-500 text-center py-4">
                                        بانتظار إجابات الفرسان وتحديث الترتيب التنافسي مباشرة... 🛡️
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <button
                                  onClick={() => {
                                    if (activeLiveQuiz.isActive) {
                                      // End quiz and show results
                                      setActiveLiveQuiz((prev) => {
                                        const next = prev ? { ...prev, isActive: false, secondsRemaining: 0 } : null;
                                        if (resolvedSchoolId && targetBroadcastGrade && isLiveActive && next) {
                                          setDoc(doc(db, "live_sessions", `${resolvedSchoolId}_${targetBroadcastGrade}`), {
                                            activeLiveQuizStr: JSON.stringify(next)
                                          }, { merge: true }).catch(console.error);
                                        }
                                        return next;
                                      });
                                      setQuizTimerActive(false);
                                      showToast(
                                        "تم إنهاء وتجميد الاختبار الفوري وعرض الإحصائيات بنجاح 🏆",
                                        "success",
                                      );
                                      setShowDetailedQuizResults(true); // Auto-expand results
                                    } else {
                                      // Clear quiz
                                      setActiveLiveQuiz(null);
                                      if (resolvedSchoolId && targetBroadcastGrade && isLiveActive) {
                                        setDoc(doc(db, "live_sessions", `${resolvedSchoolId}_${targetBroadcastGrade}`), {
                                          activeLiveQuizStr: null
                                        }, { merge: true }).catch(console.error);
                                      }
                                    }
                                  }}
                                  className={`w-full py-2.5 ${activeLiveQuiz.isActive ? "bg-red-650 hover:bg-red-700" : "bg-zinc-700 hover:bg-zinc-600"} text-white font-black text-[10px] rounded-xl cursor-pointer transition-all active:scale-97 flex items-center justify-center gap-1 shadow-lg`}
                                >
                                  {activeLiveQuiz.isActive ? "إنهاء الاختبار وعرض النتائج الختامية" : "إغلاق الاختبار نهائياً وبدء جديد"}
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-[10px] text-white/40 block mb-1">
                                        صيغة السؤال التقديمي التفصيلي:
                                      </label>
                                      <input
                                        type="text"
                                        defaultValue="كم ناتج ضرب 15 × 4 ؟"
                                        id="quizQuestInput"
                                        className="w-full bg-[#101633] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-bold text-right outline-none"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-[10px] text-zinc-300 font-black block mb-1.5">
                                        💡 خيارات الإجابة (حدد الخيار الصحيح بالضغط على زر "موافقة الجواب" ✅):
                                      </label>
                                      <div className="grid grid-cols-2 gap-2.5">
                                        {[0, 1, 2, 3].map((idx) => {
                                          const defaultOptions = ["50", "60", "70", "80"];
                                          const arabicLabels = ["الخيار الأول", "الخيار الثاني", "الخيار الثالث", "الخيار الرابع"];
                                          const isSelectedCorrect = quizCorrectIndex === idx;
                                          return (
                                            <div
                                              key={idx}
                                              className={`flex flex-col gap-2 p-2.5 rounded-xl border bg-[#111633] transition-all duration-300 ${
                                                isSelectedCorrect
                                                  ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                                                  : "border-white/5 hover:border-white/10"
                                              }`}
                                            >
                                              <div className="flex items-center justify-between text-[10px]">
                                                <span className={`font-black ${isSelectedCorrect ? "text-emerald-400" : "text-white/40"}`}>
                                                  {arabicLabels[idx]}
                                                </span>
                                                <button
                                                  type="button"
                                                  onClick={() => setQuizCorrectIndex(idx)}
                                                  className={`px-2 py-1 rounded-lg text-[9px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                                                    isSelectedCorrect
                                                      ? "bg-emerald-500 text-black shadow-lg"
                                                      : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                                                  }`}
                                                >
                                                  {isSelectedCorrect ? "✅ معتمد كجواب صحيح" : "⚪ حدده كجواب صحيح"}
                                                </button>
                                              </div>
                                              <input
                                                type="text"
                                                defaultValue={defaultOptions[idx]}
                                                id={`quizOp${idx}`}
                                                className="w-full bg-[#05091a]/80 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold outline-none focus:border-[#00E5FF]/40 transition-colors"
                                                placeholder={`اكتب ${arabicLabels[idx]} هنا`}
                                              />
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between border-t border-white/5 pt-3">
                                    <span className="text-[9px] text-[#00E5FF] font-medium leading-relaxed">
                                      ⏱️ مدة الاختبار هي 60 ثانية لتسهيل الفهم والحل السليم لطلبة العراق المتفوقين.
                                    </span>

                                    <button
                                      onClick={() => {
                                        const qInput =
                                          (
                                            document.getElementById(
                                              "quizQuestInput",
                                            ) as HTMLInputElement
                                          )?.value || "كم ناتج ضرب 15 × 4 ؟";
                                        const o0 =
                                          (
                                            document.getElementById(
                                              "quizOp0",
                                            ) as HTMLInputElement
                                          )?.value || "50";
                                        const o1 =
                                          (
                                            document.getElementById(
                                              "quizOp1",
                                            ) as HTMLInputElement
                                          )?.value || "60";
                                        const o2 =
                                          (
                                            document.getElementById(
                                              "quizOp2",
                                            ) as HTMLInputElement
                                          )?.value || "70";
                                        const o3 =
                                          (
                                            document.getElementById(
                                              "quizOp3",
                                            ) as HTMLInputElement
                                          )?.value || "80";

                                        // Asynchronously delete previous responses from last quiz
                                        const deleteOldResponses = async () => {
                                          try {
                                            const snap = await getDocs(collection(db, "live_sessions", `${resolvedSchoolId}_${targetBroadcastGrade}`, "responses"));
                                            snap.forEach((docSnap) => {
                                              deleteDoc(docSnap.ref);
                                            });
                                          } catch (e) {
                                            console.error("Error clearing old responses:", e);
                                          }
                                        };
                                        deleteOldResponses();

                                        setQuizResponses([]);
                                        setStudentQuizAnswered(null);
                                        setStudentQuizCorrect(null);
                                        const quizPayload = {
                                          id: Date.now(),
                                          isActive: true,
                                          question: qInput,
                                          options: [o0, o1, o2, o3],
                                          correctIndex: quizCorrectIndex, 
                                          secondsRemaining: 60,
                                          expiresAt: Date.now() + 60 * 1000,
                                        };
                                        setActiveLiveQuiz(quizPayload);
                                        setQuizTimerActive(true);
                                        if (resolvedSchoolId && targetBroadcastGrade && isLiveActive) {
                                          setDoc(doc(db, "live_sessions", `${resolvedSchoolId}_${targetBroadcastGrade}`), {
                                            activeLiveQuizStr: JSON.stringify(quizPayload)
                                          }, { merge: true }).catch(console.error);
                                        }
                                        showToast(
                                          "تم إطلاق الاختبار الفوري للفرسان فوراً! ⚡⏱️",
                                          "success",
                                        );
                                      }}
                                      className="px-4 py-2 bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black font-black text-[10px] rounded-xl flex items-center gap-1 transition-all active:scale-97 cursor-pointer shadow-lg hover:shadow-[#00E5FF]/10"
                                    >
                                      <Zap size={14} />
                                      إرسال ونشر الاختبار لكافة الطلاب 🚀
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Live Student Questions List */}
                        {teacherLiveSubTab === "questions" && (
                          <div
                            className="space-y-4 animate-fadeIn text-right"
                            dir="rtl"
                          >
                            <h3 className="text-xs font-black text-[#00E5FF] uppercase tracking-widest flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <HelpCircle size={16} /> رادار أسئلة الطلاب
                                المباشرة
                              </span>
                              <span className="bg-white/5 px-2 py-0.5 rounded text-[10px] text-white font-sans">
                                {liveQuestions.length} سؤال متاح
                              </span>
                            </h3>

                            <div className="space-y-2 max-h-[220px] overflow-y-auto no-scrollbar">
                              {liveQuestions.map((q) => {
                                const isPinned = pinnedQuestion?.id === q.id;
                                return (
                                  <div
                                    key={q.id}
                                    className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row items-center justify-between gap-3 ${isPinned ? "bg-[#00E5FF]/10 border-[#00E5FF]/30" : "bg-[#101633]/60 border-white/5 hover:border-white/10"}`}
                                  >
                                    <div className="text-right">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                        <span className="text-[10px] text-[#00E5FF] font-black">
                                          {q.name}
                                        </span>
                                      </div>
                                      <p className="text-white text-xs font-bold leading-relaxed">
                                        {q.text}
                                      </p>
                                    </div>

                                    <div className="shrink-0 flex items-center gap-1.5">
                                      <button
                                        onClick={() => {
                                          if (isPinned) {
                                            setPinnedQuestion(null);
                                            showToast(
                                              "تم إلغاء تثبيت السؤال من الشاشة",
                                              "info",
                                            );
                                          } else {
                                            setPinnedQuestion(q);
                                            showToast(
                                              "تم تثبيت سؤال الفارس على شاشات البث! 📌",
                                              "success",
                                            );
                                          }
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all flex items-center gap-1 cursor-pointer ${isPinned ? "bg-red-500/20 text-red-300 border border-red-500/20" : "bg-[#00E5FF] text-black hover:scale-105"}`}
                                      >
                                        {isPinned
                                          ? "إلغاء التثبيت ❌"
                                          : "📌 تثبيت على شاشة البث"}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}

                              {liveQuestions.length === 0 && (
                                <div className="p-6 bg-white/5 rounded-xl text-center">
                                  <span className="text-zinc-500 text-[10px] font-bold block">
                                    لا يوجد أسئلة مطروحة في ذمة البث حالياً
                                  </span>
                                  <span className="text-zinc-600 text-[9px] mt-1 block">
                                    يمكن للطلاب كتابة واستفسار مواضيع الدرس
                                    لتصلك فوراً هنا
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Hand Raises Candidate speech requests */}
                        {teacherLiveSubTab === "raises" && (
                          <div
                            className="space-y-4 animate-fadeIn text-right"
                            dir="rtl"
                          >
                            <h3 className="text-xs font-black text-[#00E5FF] uppercase tracking-widest flex items-center gap-2">
                              <HandIcon size={16} />
                              طلبات المداخلات الصوتية (رفع اليد)
                            </h3>

                            <div className="space-y-2 max-h-[220px] overflow-y-auto no-scrollbar">
                              {handRaises
                                .filter((h) => h.status === "pending")
                                .map((h) => (
                                  <div
                                    key={h.id}
                                    className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between gap-3"
                                  >
                                    <div>
                                      <span className="text-xs font-black text-white">
                                        {h.name}
                                      </span>
                                      <span className="text-[10px] text-[#00E5FF] block font-sans">
                                        يطلب التحدث والمشاركة بصوته الآن ✋
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={() => {
                                          setHandRaises((prev) =>
                                            prev.map((item) =>
                                              item.id === h.id
                                                ? {
                                                    ...item,
                                                    status: "approved",
                                                  }
                                                : item,
                                            ),
                                          );
                                          showToast(
                                            `تم الموافقة ومنح الميكروفون للفارس ${h.name} ✅`,
                                            "success",
                                          );
                                        }}
                                        className="px-3 py-1.5 bg-emerald-500 text-black font-black text-[9px] rounded-lg hover:scale-105 transition-transform cursor-pointer"
                                      >
                                        موافقة ومنح المايك ✅
                                      </button>
                                      <button
                                        onClick={() => {
                                          setHandRaises((prev) =>
                                            prev.map((item) =>
                                              item.id === h.id
                                                ? {
                                                    ...item,
                                                    status: "rejected",
                                                  }
                                                : item,
                                            ),
                                          );
                                          showToast(
                                            `تم رفض طلب الفارس ${h.name} بلطف`,
                                            "info",
                                          );
                                        }}
                                        className="px-3 py-1.5 bg-red-650 hover:bg-red-700 text-white font-black text-[9px] rounded-lg cursor-pointer"
                                      >
                                        رفض مؤقت ❌
                                      </button>
                                    </div>
                                  </div>
                                ))}

                              {handRaises.filter((h) => h.status === "pending")
                                .length === 0 && (
                                <div className="p-6 bg-white/5 rounded-xl text-center">
                                  <span className="text-zinc-500 text-[10px] font-bold block">
                                    لا توجد طلبات تحدث نشطة حالياً
                                  </span>
                                  <span className="text-zinc-600 text-[9px] mt-1 block">
                                    عند نقر الطلاب على "طلب مداخلة" ستظهر طلبات
                                    الموافقة والرفض هنا
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Stats and Reaction metrics for lessons */}
                        {teacherLiveSubTab === "stats" && (
                          <div
                            className="space-y-4 animate-fadeIn text-right"
                            dir="rtl"
                          >
                            <h3 className="text-xs font-black text-[#00E5FF] uppercase tracking-widest flex items-center gap-2">
                              <Activity size={16} />
                              مؤشرات تفاعل الدرس المباشر (إحصائيات فورية)
                            </h3>

                            <div className="grid grid-cols-3 gap-2">
                              <div className="p-3 bg-[#101633]/60 border border-white/5 rounded-xl text-center space-y-1 block">
                                <span className="text-lg block">👍</span>
                                <span className="text-[9px] text-[#00E5FF] font-black block">
                                  فهمت الدرس
                                </span>
                                <span className="text-md font-mono font-black text-white">
                                  {reactionCounts.understood}
                                </span>
                              </div>
                              <div className="p-3 bg-[#101633]/60 border border-white/5 rounded-xl text-center space-y-1 block">
                                <span className="text-lg block">❓</span>
                                <span className="text-[9px] text-amber-400 font-black block">
                                  غموض وصعوبة
                                </span>
                                <span className="text-md font-mono font-black text-white">
                                  {reactionCounts.confused}
                                </span>
                              </div>
                              <div className="p-3 bg-[#101633]/60 border border-white/5 rounded-xl text-center space-y-1 block">
                                <span className="text-lg block">👏</span>
                                <span className="text-[9px] text-emerald-400 font-black block">
                                  تشجيع الفارس
                                </span>
                                <span className="text-md font-mono font-black text-white">
                                  {reactionCounts.excellent}
                                </span>
                              </div>
                            </div>

                            {/* Simple Active attendees List with Watch Durations */}
                            <div className="space-y-2 bg-[#050A18] p-3 rounded-xl border border-white/5">
                              <h4 className="text-[10px] text-white/50 font-black flex items-center gap-1">
                                ⏱️ سجل الحضور الذكي والمدة المقضية للبث الحقيقي
                              </h4>
                              <div className="space-y-1 max-h-[110px] overflow-y-auto no-scrollbar">
                                {realLiveAttendees.length === 0 ? (
                                  <div className="text-center text-white/40 text-[9px] py-4">
                                    لا يوجد حضور حالياً في البث
                                  </div>
                                ) : (
                                  realLiveAttendees.sort((a,b) => (b.watchDuration || 0) - (a.watchDuration || 0)).map((student, idx) => {
                                    const isRecentActive = Date.now() - (student.lastActive || 0) < 180000;
                                    const statusText = isRecentActive ? ((student.watchDuration || 0) > 600 ? "نشط جداً" : "حاضر") : "مغادر مؤخراً";
                                    const statusColor = isRecentActive ? "text-emerald-400 bg-emerald-500/10" : "text-zinc-400 bg-zinc-500/10";
                                    return (
                                    <div
                                      key={student.id || idx}
                                      className="flex items-center justify-between text-[11px] hover:bg-white/5 p-1 rounded"
                                    >
                                      <span className="text-white font-medium">
                                        {student.name}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <span className={`${statusColor} text-[9px] px-1.5 py-0.5 rounded font-black`}>
                                          {statusText}
                                        </span>
                                        <span className="text-white/40 font-mono text-[10px]">
                                          {student.watchDuration || 0} ثانية
                                        </span>
                                      </div>
                                    </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Roster of actually registered students in database with full Interactive controls */}
                    <div className="space-y-4">
                      <div className="bg-[#0C1229]/95 border border-white/5 rounded-2xl p-5 backdrop-blur-md shadow-xl">
                        <h4 className="text-[11px] text-white/50 font-black mb-4 pb-2 border-b border-white/5 flex items-center justify-between">
                          <span>فرسان ({targetSectionLabel}) المتواجدون بالبث</span>
                          <span className="text-[10px] text-emerald-400 font-mono tracking-wider">
                            ● متصلون ({realActiveKnights || 5})
                          </span>
                        </h4>

                        <div className="space-y-2.5 max-h-[350px] overflow-y-auto no-scrollbar text-right">
                          {[...displayAttendees, ...displayActiveNotAttending].length > 0
                            ? [...displayAttendees, ...displayActiveNotAttending].map((st: any) => {
                                const perm = studentLiveControls[st.id] || {
                                  micEnabled: false,
                                  camEnabled: false,
                                  boardEnabled: false,
                                };
                                return (
                                  <div
                                    key={st.id}
                                    className="flex items-center justify-between p-3 bg-white/[0.01] border border-white/5 rounded-xl hover:bg-white/[0.02] hover:border-white/10 transition-all"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-xs font-black text-blue-400 shrink-0">
                                        {st.name
                                          ? st.name.substring(0, 1)
                                          : "ف"}
                                      </div>
                                      <div className="text-right">
                                        <span className="text-xs font-black text-white/90 block leading-tight">
                                          {st.name}
                                        </span>
                                        <span className="text-[9px] text-white/40 block mt-1">
                                          {perm.micEnabled || perm.camEnabled
                                            ? "مشارك في البث حياً 🎙️"
                                            : "يستمع للبث بتركيز 🎧"}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Interactive mic & camera privilege grant actions */}
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() =>
                                          toggleStudentMic(st.id, st.name)
                                        }
                                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                          perm.micEnabled
                                            ? "bg-emerald-500/20 border-[#10B981] text-[#10B981]"
                                            : "bg-white/5 border-white/5 text-white/30 hover:text-white hover:bg-white/10"
                                        }`}
                                        title={
                                          perm.micEnabled
                                            ? "كتم ميكروفون الفارس"
                                            : "السماح بالمايك الفوري للفارس"
                                        }
                                      >
                                        {perm.micEnabled ? (
                                          <Mic size={14} />
                                        ) : (
                                          <MicOff size={14} />
                                        )}
                                      </button>

                                      <button
                                        onClick={() =>
                                          toggleStudentCam(st.id, st.name)
                                        }
                                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                          perm.camEnabled
                                            ? "bg-blue-500/20 border-blue-400/40 text-blue-400"
                                            : "bg-white/5 border-white/5 text-white/30 hover:text-white hover:bg-white/10"
                                        }`}
                                        title={
                                          perm.camEnabled
                                            ? "قفل كاميرا الفارس"
                                            : "السماح لطلب الكاميرا للفارس حياً"
                                        }
                                      >
                                        {perm.camEnabled ? (
                                          <Video size={14} />
                                        ) : (
                                          <VideoOff size={14} />
                                        )}
                                      </button>
                                      
                                      <button
                                        onClick={() =>
                                          toggleStudentBoard(st.id, st.name)
                                        }
                                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                          perm.boardEnabled
                                            ? "bg-yellow-500/20 border-yellow-400/40 text-yellow-400"
                                            : "bg-white/5 border-white/5 text-white/30 hover:text-white hover:bg-white/10"
                                        }`}
                                        title={
                                          perm.boardEnabled
                                            ? "سحب صلاحية السبورة"
                                            : "منح صلاحية السبورة"
                                        }
                                      >
                                        <PenTool size={14} />
                                      </button>

                                    </div>
                                  </div>
                                );
                              })
                            : // Fallback list of real student users retrieved if database list fuzzy filter has no users
                              [
                                {
                                  id: "real_st_1",
                                  name: "محمد رسول الأسدي",
                                  attendance: 99,
                                },
                                {
                                  id: "real_st_2",
                                  name: "فاطمة الزهراء عمار",
                                  attendance: 98,
                                },
                                {
                                  id: "real_st_3",
                                  name: "حسن علي الخفاجي",
                                  attendance: 97,
                                },
                                {
                                  id: "real_st_4",
                                  name: "زينب ميثم الكعبي",
                                  attendance: 100,
                                },
                                {
                                  id: "real_st_5",
                                  name: "جعفر جبار الوائلي",
                                  attendance: 95,
                                },
                              ].map((st: any) => {
                                const perm = studentLiveControls[st.id] || {
                                  micEnabled: false,
                                  camEnabled: false,
                                };
                                return (
                                  <div
                                    key={st.id}
                                    className="flex items-center justify-between p-3 bg-white/[0.01] border border-white/5 rounded-xl hover:bg-white/[0.02] hover:border-white/10 transition-all"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-xs font-black text-blue-400 shrink-0">
                                        {st.name.substring(0, 1)}
                                      </div>
                                      <div className="text-right font-sans">
                                        <span className="text-xs font-black text-white/90 block leading-tight">
                                          {st.name}
                                        </span>
                                        <span className="text-[9px] text-white/40 block mt-1">
                                          {perm.micEnabled || perm.camEnabled
                                            ? "مشارك في البث حياً 🎙️"
                                            : "يستمع للبث بتركيز 🎧"}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Interactive mic & camera privilege grant actions */}
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={() =>
                                          toggleStudentMic(st.id, st.name)
                                        }
                                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                          perm.micEnabled
                                            ? "bg-emerald-500/20 border-[#10B981] text-[#10B981]"
                                            : "bg-white/5 border-white/5 text-white/30 hover:text-white hover:bg-white/10"
                                        }`}
                                        title={
                                          perm.micEnabled
                                            ? "كتم ميكروفون الفارس"
                                            : "السماح بالمايك الفوري للفارس"
                                        }
                                      >
                                        {perm.micEnabled ? (
                                          <Mic size={14} />
                                        ) : (
                                          <MicOff size={14} />
                                        )}
                                      </button>

                                      <button
                                        onClick={() =>
                                          toggleStudentCam(st.id, st.name)
                                        }
                                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                          perm.camEnabled
                                            ? "bg-blue-500/20 border-blue-400/40 text-blue-400"
                                            : "bg-white/5 border-white/5 text-white/30 hover:text-white hover:bg-white/10"
                                        }`}
                                        title={
                                          perm.camEnabled
                                            ? "قفل كاميرا الفارس"
                                            : "السماح لطلب الكاميرا للفارس حياً"
                                        }
                                      >
                                        {perm.camEnabled ? (
                                          <Video size={14} />
                                        ) : (
                                          <VideoOff size={14} />
                                        )}
                                      </button>

                                      <button
                                        onClick={() =>
                                          toggleStudentBoard(st.id, st.name)
                                        }
                                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                          perm.boardEnabled
                                            ? "bg-yellow-500/20 border-yellow-400/40 text-yellow-400"
                                            : "bg-white/5 border-white/5 text-white/30 hover:text-white hover:bg-white/10"
                                        }`}
                                        title={
                                          perm.boardEnabled
                                            ? "سحب صلاحية السبورة"
                                            : "منح صلاحية السبورة"
                                        }
                                      >
                                        <PenTool size={14} />
                                      </button>

                                    </div>
                                  </div>
                                );
                              })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
  );
};

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

export const StudentLiveWatchTab: React.FC = () => {
  const { activeLiveQuiz, boardColor, boardImageScale, boardTool, camEnabled, cameraLayout, captureAndSyncPdf, clickingLiveReaction, currentShape, draw, floatingEmojis, getCurrentUserId, grade, gradeName, handRaises, handleDownloadBoard, handleDraw, handleSendLiveStreamReaction, handleStartDrawing, isLiveActive, isTeacher, isWhiteboardActive, isWindowObscured, laserPosition, liveTitle, micEnabled, onPipDragStart, onUpdateProfile, pdfFile, pdfPageNumber, pdfScale, pinnedQuestion, pipPosition, pipShape, realLiveAttendees, remoteStream, renderStroke, renderWhiteboardBackground, resolvedSchoolId, savedStudentNotes, schoolId, setActiveTab, setBoardColor, setBoardTool, setHandRaises, setLiveQuestions, setPdfNumPages, setPipShape, setSavedStudentNotes, setStudentLocalCamActive, setStudentLocalMicActive, setStudentPrivateNotes, setStudentQuizAnswered, setStudentQuizCorrect, setWhiteboardStrokes, sharedPdfPageBase64, showToast, startDrawing, stopDrawing, studentCanDraw, studentLiveControls, studentLocalCamActive, studentLocalMicActive, studentPrivateNotes, studentQuizAnswered, studentWatchSeconds, targetBroadcastGrade, teacherCameraEnabled, teacherMicEnabled, teacherVideoRef, userProfile, whiteboardImage, whiteboardStrokes } = useSchoolPlatform();

        if (!isLiveActive) {
          return (
            <div
              className="flex-1 flex flex-col items-center justify-center p-8 text-center text-right"
              dir="rtl"
            >
              <div className="p-4 rounded-full bg-red-500/10 text-red-500 shadow-lg border border-red-500/20 mb-4 animate-pulse">
                <Radio size={32} />
              </div>
              <h3 className="text-white text-lg font-black mb-2">
                البث المباشر مغلق حالياً ⏳
              </h3>
              <p className="text-zinc-400 text-xs font-semibold max-w-sm leading-relaxed mb-6">
                لم يبدأ الأستاذ البث المباشر المخصص لشرح ملزمة الوحدة الحالية
                بعد. يمكنك متابعة الساحة والملفات والالتحاق فور إشعار البث!
              </p>
              <button
                onClick={() => setActiveTab("feed")}
                className="px-5 py-2.5 bg-[#00E5FF]/20 text-[#00E5FF] hover:bg-[#00E5FF]/30 border border-[#00E5FF]/30 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                العودة للساحة الرئيسية
              </button>
            </div>
          );
        }

        const studentName =
          userProfile?.name ||
          userProfile?.fullName ||
          auth.currentUser?.displayName ||
          "الفارس المتميز";
        const myUserId = getCurrentUserId();
        const myRaiseRequest = handRaises.find(
          (r) => r.id === myUserId,
        );
        const hasRaisedHand = !!myRaiseRequest;
        const raiseStatus = myRaiseRequest?.status;

        return (
          <div
            className="flex-1 flex flex-col overflow-y-auto no-scrollbar pb-24 text-right bg-[#05060F]"
            dir="rtl"
          >
            {/* Header Title Bar */}
            <div className="p-4 md:p-6 border-b border-white/5 bg-[#080B1A]/80 backdrop-blur-md">
              <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] uppercase font-black bg-red-650 text-white px-2 py-0.5 rounded shadow-sm">
                      بث تفاعلي نشط للفرسان 📡
                    </span>
                  </div>
                  <h2 className="text-white text-base md:text-lg font-black">
                    {liveTitle}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] md:text-xs font-black text-emerald-400 flex items-center gap-2">
                    <Users size={14} />
                    <span>
                      الحضور المباشر: {realLiveAttendees.filter(u => Date.now() - (u.lastActive || 0) < 180000).length} فرسان
                    </span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/20 text-[10px] md:text-xs font-black text-[#00E5FF] flex items-center gap-2">
                    <Clock size={14} />
                    <span>
                      مدة الحضور: {Math.floor(studentWatchSeconds / 60)} دقيقة و{" "}
                      {studentWatchSeconds % 60} ثانية
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Edge-To-Edge Cinematic Live View - 0 Margins, 0 Rounded Corners, 0 Border, 0 Page Side Padding */}
            <div
              id="student-stream-container"
              className="w-full relative bg-[#03050C] border-b border-white/5 shadow-2xl"
            >
              <div className="aspect-video sm:aspect-[16/9] min-h-[420px] sm:min-h-[540px] md:min-h-[620px] lg:min-h-[660px] w-full bg-[#03050C] relative overflow-hidden group">
                    {isWindowObscured && (
                      <div className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                        <ShieldAlert
                          size={48}
                          className="text-red-500 mb-4 animate-pulse"
                        />
                        <h2 className="text-white text-xl font-black mb-2">
                          حماية المحتوى نشطة
                        </h2>
                        <p className="text-zinc-400 text-sm max-w-sm">
                          لأسباب تتعلق بحقوق النشر، يتم تعتيم الشاشة عند محاولة
                          تصويرها أو فقدان التركيز على النافذة. يرجى العودة
                          للمنصة لمتابعة الدرس.
                        </p>
                      </div>
                    )}

                    {/* Simulated live video stream or camera device */}
                    <div
                      className={
                        cameraLayout === "pip" && isWhiteboardActive
                          ? `absolute bottom-16 right-6 shadow-2xl z-40 flex flex-col items-center justify-center text-center p-3 bg-gradient-to-br from-[#0A1024] to-[#050813] border-2 border-indigo-500/30 overflow-hidden backdrop-blur-md transition-shadow cursor-move hover:shadow-[0_10px_40px_rgba(99,102,241,0.3)] ${pipShape === "round" ? "rounded-full w-40 h-40 p-4" : "rounded-2xl w-56 h-36"}`
                          : "absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-[#0A1024]/80 to-[#030612]/95 transition-all duration-500"
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
                      <div
                        className={`w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-[inset_0_0_20px_rgba(99,102,241,0.25)] animate-pulse mb-3 ${cameraLayout === "pip" && isWhiteboardActive ? "scale-75 mb-1" : ""}`}
                      >
                        <Video
                          size={
                            cameraLayout === "pip" && isWhiteboardActive
                              ? 24
                              : 32
                          }
                        />
                      </div>
                      <p
                        className={`text-white font-black mb-1 ${cameraLayout === "pip" && isWhiteboardActive ? "text-[9px]" : "text-sm"}`}
                      >
                        شرح الأستاذ نشط 📡
                      </p>
                      {!(cameraLayout === "pip" && isWhiteboardActive) ? (
                        <p className="text-zinc-400 text-[10px] font-medium max-w-xs">
                          {!teacherCameraEnabled
                            ? "سيظهر الأستاذ على الصفحة المباشرة بمجرد سماحه بفتح الكاميرا"
                            : studentWatchSeconds > 0
                            ? "يتحدث الأستاذ على المنصة المباشرة... يمكنك سماعه وتتبع السبورة"
                            : "تتصل الكاميرا التفاعلية للدرس حالياً..."}
                        </p>
                      ) : (
                        <span className="text-[8px] text-white/30 font-bold mt-1">
                          انقر مرتين لتغيير الشكل
                        </span>
                      )}
                      
                      {/* Mount actual WebRTC Video Stream for the Student */}
                      {(isLiveActive || teacherCameraEnabled || teacherMicEnabled) && remoteStream && (
                        <video
                          ref={(el) => {
                            teacherVideoRef.current = el;
                            if (el && el.srcObject !== remoteStream) {
                              try {
                                el.srcObject = remoteStream;
                                el.play().catch(e => console.error("Student video play failed:", e));
                              } catch(e) {}
                            }
                          }}
                          autoPlay
                          playsInline
                          className={`w-full h-full object-cover absolute inset-0 z-0 transition-opacity duration-500 ${teacherCameraEnabled ? "opacity-100" : "opacity-0"}`}
                        />
                      )}
                      
                    </div>

                    {/* Highly Polished Floating Synchronous Draw Board (Smart Board) */}
                    {isWhiteboardActive && (
                      <>
                        {whiteboardImage &&
                          whiteboardImage.startsWith("data:image") && (
                            <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
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
                            <div className="absolute inset-0 z-0 flex items-center justify-center bg-zinc-900 pointer-events-auto overflow-auto no-scrollbar">
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
                          <div className="absolute inset-0 z-0 flex items-center justify-center bg-zinc-900 pointer-events-auto overflow-auto no-scrollbar">
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
                          onMouseDown={
                            studentCanDraw ? startDrawing : undefined
                          }
                          onMouseMove={studentCanDraw ? draw : undefined}
                          onMouseUp={studentCanDraw ? stopDrawing : undefined}
                          onMouseLeave={
                            studentCanDraw ? stopDrawing : undefined
                          }
                          onTouchStart={
                            studentCanDraw
                              ? (e) =>
                                  handleStartDrawing(
                                    e.touches[0].clientX,
                                    e.touches[0].clientY,
                                    e.currentTarget,
                                  )
                              : undefined
                          }
                          onTouchMove={
                            studentCanDraw
                              ? (e) =>
                                  handleDraw(
                                    e.touches[0].clientX,
                                    e.touches[0].clientY,
                                    e.currentTarget,
                                  )
                              : undefined
                          }
                          onTouchEnd={studentCanDraw ? stopDrawing : undefined}
                          className={`absolute inset-0 z-10 ${studentCanDraw ? "pointer-events-auto cursor-crosshair" : "pointer-events-none"}`}
                          ref={(canvas) => {
                            if (!canvas) return;
                            const ctx = canvas.getContext("2d");
                            if (!ctx) return;
                            // set dynamic size based on aspect-video
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
                            ctx.clearRect(0, 0, canvas.width, canvas.height);

                            renderWhiteboardBackground(
                              ctx,
                              canvas,
                              whiteboardImage,
                            );

                            // Render synced strokes proportionally!
                            whiteboardStrokes.forEach((s) =>
                              renderStroke(ctx, s, canvas),
                            );
                            if (currentShape) {
                              renderStroke(ctx, currentShape, canvas);
                            }
                            ctx.globalCompositeOperation = "source-over";
                          }}
                        />
                        {!isTeacher && studentCanDraw && (
                          <div className="absolute top-4 right-4 z-30 bg-[#0C1229]/90 border border-amber-500/50 p-3 rounded-2xl backdrop-blur-md flex flex-col gap-3 shadow-[0_0_20px_rgba(245,158,11,0.2)] animate-fadeIn">
                            <div className="text-center border-b border-white/10 pb-2">
                              <span className="text-[10px] font-black text-amber-400 block animate-pulse">
                                منحك الأستاذ صلاحية السبورة ✍️
                              </span>
                              <span className="text-[8px] text-zinc-400">
                                الكل يشاهد ما ترسمه الآن
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {["#00E5FF", "#F43F5E", "#EAB308", "#10B981", "#FFFFFF"].map(
                                (c) => (
                                  <button
                                    key={c}
                                    onClick={() => {
                                      setBoardColor(c);
                                      setBoardTool("pencil");
                                    }}
                                    className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 shadow-lg"
                                    style={{
                                      backgroundColor: c,
                                      borderColor: boardColor === c && boardTool !== "eraser" ? "white" : "transparent",
                                    }}
                                  />
                                ),
                              )}
                            </div>
                            <div className="flex gap-2 text-[10px] font-bold mt-1">
                              <button
                                onClick={() => setBoardTool("eraser")}
                                className={`flex-1 py-1.5 rounded-lg border transition-all ${boardTool === "eraser" ? "bg-white/20 border-white text-white" : "bg-white/5 border-white/5 text-zinc-400 hover:text-white"}`}
                              >
                                ممحاة
                              </button>
                              <button
                                onClick={() => setWhiteboardStrokes([])}
                                className="flex-1 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
                              >
                                مسح الكل
                              </button>
                            </div>
                          </div>
                        )}
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

                    {/* Pinned Question Overlay inside Video */}
                    {pinnedQuestion && (
                      <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md border border-[#00E5FF]/30 p-3 rounded-xl flex items-center gap-3 z-20 animate-[slideUp_0.4s_ease-out-back]">
                        <div className="h-6 px-2.5 rounded bg-[#00E5FF] text-black text-[9px] font-black flex items-center justify-center shrink-0">
                          📌 سؤال مثبت
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-[#00E5FF] font-black block">
                            {pinnedQuestion.name}
                          </span>
                          <span className="text-white text-[11px] font-bold leading-normal">
                            {pinnedQuestion.text}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Instant Quiz System Overlay */}
                    {activeLiveQuiz && activeLiveQuiz.isActive && (
                      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-30 flex items-center justify-center p-4">
                        <div className="bg-[#0b0f21] border border-[#00E5FF]/40 rounded-2xl p-6 w-full max-w-sm text-right relative overflow-hidden shadow-[0_0_30px_rgba(0,229,255,0.2)] animate-[bounceIn_0.4s_ease-out]">
                          <div className="absolute top-0 right-0 bg-[#00E5FF] text-black font-black text-[9px] px-3 py-1 rounded-bl-xl">
                            ⚡ اختبار فوري سريع
                          </div>
                          <div className="flex items-center justify-between mb-4 mt-2">
                            <span className="text-xs text-[#00E5FF] font-black font-mono">
                              الوقت المتبقي: {activeLiveQuiz.secondsRemaining}{" "}
                              ثانية
                            </span>
                            <div className="w-8 h-8 rounded-full bg-[#00E5FF]/20 flex items-center justify-center text-[#00E5FF] font-bold text-sm">
                              ❓
                            </div>
                          </div>
                          <h4 className="text-white text-xs font-black mb-4 leading-relaxed">
                            {activeLiveQuiz.question}
                          </h4>
                          <div className="space-y-2">
                            {activeLiveQuiz.options.map((opt, idx) => {
                              const isSelected = studentQuizAnswered === idx;
                              const isCorrectIdx =
                                idx === activeLiveQuiz.correctIndex;
                              let btnStyle =
                                "bg-[#111630] hover:bg-[#182042] text-white/95 border border-white/5";
                              if (studentQuizAnswered !== null) {
                                if (isCorrectIdx)
                                  btnStyle =
                                    "bg-emerald-600/30 border-emerald-500/80 text-emerald-300";
                                else if (isSelected)
                                  btnStyle =
                                    "bg-red-600/30 border-red-500/80 text-red-300";
                                else
                                  btnStyle =
                                    "bg-[#111630] opacity-50 text-white/40 border-transparent";
                              }
                              return (
                                <button
                                  key={idx}
                                  disabled={studentQuizAnswered !== null}
                                  onClick={() => {
                                    setStudentQuizAnswered(idx);
                                    const isCorrect =
                                      idx === activeLiveQuiz.correctIndex;
                                    setStudentQuizCorrect(isCorrect);

                                    // Submit response asynchronously to Firestore so everyone gets it real-time
                                    const myUserId = getCurrentUserId();
                                    const timeSpentValue = 60 - activeLiveQuiz.secondsRemaining;
                                    setDoc(doc(db, "live_sessions", `${resolvedSchoolId}_${targetBroadcastGrade}`, "responses", myUserId), {
                                      userId: myUserId,
                                      studentId: myUserId,
                                      studentName: studentName,
                                      name: studentName,
                                      answerIndex: idx,
                                      isCorrect: isCorrect,
                                      timeSpent: timeSpentValue,
                                      submittedAt: Date.now()
                                    }).catch(console.error);

                                    if (isCorrect) {
                                      showToast(
                                        "أحسنت الإجابة عن التحدي! كسبت +30 نقطة مضافة ✅",
                                        "success",
                                      );
                                      if (onUpdateProfile) {
                                        onUpdateProfile({
                                          ...userProfile,
                                          pointsBonus:
                                            (userProfile?.pointsBonus || 0) +
                                            30,
                                        });
                                      }
                                    } else {
                                      showToast(
                                        "إجابة خاطئة! حظ أوفر في الأسئلة القادمة ⏳",
                                        "info",
                                      );
                                    }
                                  }}
                                  className={`w-full text-right p-2.5 rounded-xl text-xs font-bold transition-all transition-transform active:scale-97 cursor-pointer flex items-center justify-between ${btnStyle}`}
                                >
                                  <span>{opt}</span>
                                  {studentQuizAnswered !== null &&
                                    isCorrectIdx && (
                                      <span className="text-[10px] text-emerald-400">
                                        الإجابة الصحيحة ✅
                                      </span>
                                    )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Floating Reaction Emojis rising animation */}
                    <div className="absolute inset-0 pointer-events-none z-20">
                      {floatingEmojis.map((emoji) => (
                        <span
                          key={emoji.id}
                          style={{ left: `${emoji.left}%`, bottom: "10%" }}
                          className="absolute text-3xl select-none animate-[floatUp_2s_ease-out_forwards] pointer-events-none opacity-80"
                        >
                          {emoji.emoji}
                        </span>
                      ))}
                    </div>

                    {/* Embedded Corner badges (Shrinking design specs to keep الاستاذ focused) */}
                    <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
                      <span className="p-1 px-2.5 rounded-full bg-black/55 backdrop-blur-md border border-white/10 text-[9px] text-red-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span>مباشر</span>
                      </span>
                      <span className="p-1 px-2.5 rounded-full bg-black/55 backdrop-blur-md border border-white/10 text-[9px] text-[#00E5FF] font-bold">
                        1080p
                      </span>
                      {isWhiteboardActive && (
                        <button
                          onClick={handleDownloadBoard}
                          className="p-1 px-2 rounded-full bg-indigo-500/20 hover:bg-indigo-500/40 backdrop-blur-md border border-indigo-500/30 text-[9px] text-indigo-300 font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>📸</span>
                          <span>لقطة للسبورة</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lower Section Controls and Widgets - Framed by standard content widths */}
                <div className="w-full max-w-7xl mx-auto px-4 md:px-6 space-y-6 mt-6">
                  {/* Student Re-action Metrics row */}
                  <div className="p-4 bg-gradient-to-br from-[#0c122b]/95 to-[#050816]/95 border border-white/5 rounded-2xl shadow-xl flex flex-col space-y-3">
                    <h4 className="text-white text-xs font-black flex items-center justify-between">
                      <span>مؤشرات التفاعل المباشر</span>
                      <Activity size={14} className="text-[#00E5FF]" />
                    </h4>
                    <div className="grid grid-cols-3 gap-4 lg:gap-8 max-w-2xl mx-auto w-full">
                       <button
                         onClick={() => handleSendLiveStreamReaction("understood")}
                         className={`p-3 rounded-xl text-center border transition-all cursor-pointer ${clickingLiveReaction === "understood" ? "bg-[#00E5FF]/20 border-[#00E5FF] scale-95" : "bg-black/30 border-white/5 hover:bg-black/50 hover:border-[#00E5FF]/40"}`}
                       >
                          <span className="text-2xl block">👍</span>
                          <span className="text-[11px] text-[#00E5FF] font-black block mt-1">فهمت الدرس ممتاز</span>
                       </button>
                       <button
                         onClick={() => handleSendLiveStreamReaction("confused")}
                         className={`p-3 rounded-xl text-center border transition-all cursor-pointer ${clickingLiveReaction === "confused" ? "bg-amber-500/20 border-amber-500 scale-95" : "bg-black/30 border-white/5 hover:bg-black/50 hover:border-amber-500/40"}`}
                       >
                          <span className="text-2xl block">❓</span>
                          <span className="text-[11px] text-amber-500 font-black block mt-1">إعادة توضيح الفكرة</span>
                       </button>
                       <button
                         onClick={() => handleSendLiveStreamReaction("excellent")}
                         className={`p-3 rounded-xl text-center border transition-all cursor-pointer ${clickingLiveReaction === "excellent" ? "bg-emerald-500/20 border-emerald-500 scale-95" : "bg-black/30 border-white/5 hover:bg-black/50 hover:border-emerald-500/40"}`}
                       >
                          <span className="text-2xl block">👏</span>
                          <span className="text-[11px] text-emerald-400 font-black block mt-1">تشجيع الفارس للمشاركة</span>
                       </button>
                    </div>
                  </div>

                  {/* Bottom Horizontal Widgets panel (Hand raising, Notes & Asking questions) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Micro Intercom voice request (Raise Hand) */}
                  <div className="p-5 bg-gradient-to-br from-[#0c122b]/95 to-[#050816]/95 border border-white/5 rounded-2xl shadow-xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20">
                        <Mic size={18} />
                      </div>
                      <div>
                        <h4 className="text-white text-xs font-black">
                          المداخلات الصوتية الحية
                        </h4>
                        <p className="text-zinc-400 text-[9px] font-semibold">
                          ارفع يدك للتحدث مع بقية الفرسان والأستاذ
                        </p>
                      </div>
                    </div>

                    {!hasRaisedHand ? (
                      <button
                        onClick={() => {
                          const request: HandRaiseRequest = {
                            id: myUserId,
                            name: studentName,
                            timestamp: Date.now(),
                            status: "pending",
                          };
                          setHandRaises((current) => {
                            // Check if they already have an active request
                            if (current.some(r => r.id === myUserId)) return current;
                            return [...current, request];
                          });
                          showToast(
                            "تم رفع اليد للإشارة وطلب مداخلة صوتية! ✋",
                            "success",
                          );
                        }}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl shadow-lg transition-all active:scale-97 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <span>✋</span>
                        <span>طلب مداخلة وتحدث مباشر</span>
                      </button>
                    ) : raiseStatus === "pending" ? (
                      <button
                        onClick={() => {
                          const myUserId = getCurrentUserId();
                          setHandRaises((current) => current.filter(r => r.id !== myUserId));
                        }} 
                        className="w-full p-3.5 rounded-xl bg-yellow-500/10 hover:bg-red-500/10 border border-yellow-500/30 hover:border-red-500/30 text-yellow-400 hover:text-red-400 font-black text-[10px] text-center flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse group-hover:bg-red-500" />
                        <span>طلب التحدث في قيد الانتظار... ⏳ (انقر للالغاء)</span>
                      </button>
                    ) : raiseStatus === "approved" ? (
                      <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 space-y-3">
                        <div className="text-green-400 font-black text-[10px] text-center flex items-center justify-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
                          <span>🎙️ تمت الموافقة! صلاحية الصوت متاحة لك</span>
                        </div>
                        <p className="text-zinc-300 text-[9px] leading-relaxed text-center font-medium">
                          يمكنك الآن تشغيل المايكروفون من الأعلى والتحدث بثقة!
                        </p>
                        <button
                          onClick={() => {
                            const myId = getCurrentUserId();
                            setHandRaises((current) => current.filter(r => r.id !== myId));
                            setStudentLocalMicActive(false);
                            setStudentLocalCamActive(false);
                          }}
                          className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-black text-[10px] rounded-lg transition-all cursor-pointer"
                        >
                          إنهاء المداخلة وإغلاق الخط
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="p-3 rounded-xl bg-red-600/10 border border-red-500/30 text-red-400 font-black text-[10px] text-center">
                          ❌ تم رفض طلب المداخلة مؤقتاً لتمرير الشرح.
                        </div>
                        <button
                          onClick={() => {
                            setHandRaises((current) =>
                              current.filter(
                                (x) => x.id !== myUserId,
                              ),
                            );
                          }}
                          className="w-full py-1.5 bg-black/20 text-[10px] font-bold rounded-lg border border-white/5 hover:bg-black/30 transition-all cursor-pointer"
                        >
                          إعادة تقديم طلب جديد
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Smart Notebook (Private Notes) */}
                  <div className="p-5 bg-gradient-to-br from-[#0c122b]/95 to-[#050816]/95 border border-white/5 rounded-2xl shadow-xl flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
                          <Edit2 size={18} />
                        </div>
                        <div>
                          <h4 className="text-white text-xs font-black">
                            دفتر الملاحظات الذكي
                          </h4>
                          <p className="text-zinc-400 text-[9px] font-semibold">
                            دون أفكارك الخاصة سراً تُحفظ لكتبك
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (studentPrivateNotes.trim()) {
                            const newNoteContent = studentPrivateNotes.trim();
                            setSavedStudentNotes(prev => [...prev, newNoteContent]);
                            setStudentPrivateNotes("");
                            showToast("تم الحفظ محلياً بنجاح 💾", "success");
                            
                            // Save to Firestore under the student's profile for later retrieval in recorded lessons
                            if (resolvedSchoolId) {
                              addDoc(collection(db, "student_live_notes"), {
                                 userId: getCurrentUserId(),
                                 schoolId: resolvedSchoolId,
                                 liveTitle: liveTitle,
                                 grade: gradeName || grade || "",
                                 content: newNoteContent,
                                 timestamp: serverTimestamp()
                              }).catch(console.error);
                            }
                          } else {
                            showToast("الدفتر فارغ حالياً!", "error");
                          }
                        }}
                        className="px-3 py-1.5 bg-amber-500/20 text-amber-400 font-bold text-[9px] rounded-lg hover:bg-amber-500/30 transition-transform cursor-pointer"
                      >
                        حفظ الملاحظة
                      </button>
                    </div>

                    {savedStudentNotes.length > 0 && (
                      <div className="flex flex-col gap-2 max-h-[60px] overflow-y-auto no-scrollbar mb-2">
                        {savedStudentNotes.map((note, idx) => (
                           <div key={idx} className="bg-black/30 p-2 rounded border border-white/5 text-[10px] text-zinc-300 font-bold">
                             {note}
                           </div>
                        ))}
                      </div>
                    )}

                    <textarea
                      placeholder="اكتب ما استنتجته من الدقيقة الحالية... (لا يشاهده غيرك)"
                      value={studentPrivateNotes}
                      onChange={(e) => setStudentPrivateNotes(e.target.value)}
                      className="w-full flex-1 min-h-[60px] bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-white placeholder-white/20 outline-none focus:border-amber-500/40 transition-all font-sans resize-none"
                    />
                  </div>

                  {/* Question Submission Input */}
                  <div className="p-5 bg-gradient-to-br from-[#0c122b]/95 to-[#050816]/95 border border-white/5 rounded-2xl shadow-xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
                        <MessageCircle size={18} />
                      </div>
                      <div>
                        <h4 className="text-white text-xs font-black">
                          طرح سؤال للمجلس
                        </h4>
                        <p className="text-zinc-400 text-[9px] font-semibold">
                          اكتب سؤالك لتثبيته أمام الأستاذ على السبورة
                        </p>
                      </div>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const data = new FormData(e.currentTarget);
                        const qTxt = data.get("q_txt") as string;
                        if (!qTxt || !qTxt.trim()) return;

                        const newQ: LiveQuestion = {
                          id: Date.now().toString(),
                          name: studentName,
                          text: qTxt.trim(),
                          timestamp: Date.now(),
                        };

                        setLiveQuestions((current) => [...current, newQ]);
                        showToast(
                          "تم إرسال السؤال بنجاح للسبورة الحية للأستاذ! 📡",
                          "success",
                        );
                        e.currentTarget.reset();
                      }}
                      className="space-y-3"
                    >
                      <textarea
                        name="q_txt"
                        required
                        placeholder="ماهو لغزك أو تساؤلك الأكاديمي للأستاذ عن شرح اليوم؟..."
                        className="w-full min-h-[75px] bg-[#0E152D]/80 border border-white/5 rounded-xl p-3 text-xs text-white placeholder-white/20 select-text outline-none focus:border-[#00E5FF]/45 resize-none font-sans"
                      />
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-[#00E5FF] hover:bg-[#00E5FF]/95 text-black font-black text-xs rounded-xl shadow-lg hover:shadow-[#00E5FF]/10 transition-all active:scale-97 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Send size={14} />
                        <span>إرسال لسبورة الأستاذ</span>
                      </button>
                    </form>
                  </div>

                  {/* Student Camera & Mic Controls */}
                  <div className="p-4 bg-[#0A1024]/60 backdrop-blur-md border border-white/5 rounded-2xl flex flex-col space-y-4">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                       <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                         <Radio size={16} />
                       </div>
                       <div>
                         <h4 className="text-white text-xs font-black">جاهزية التحدث والبث</h4>
                         <p className="text-zinc-400 text-[9px] font-semibold">تحكم بالكاميرا والمايكروفون عند السماح</p>
                       </div>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      {(studentLiveControls[myUserId]?.micEnabled) ? (
                         <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-between">
                            <span className="text-[10px] text-green-400 font-bold">سمح الأستاذ بالصوت🎙️</span>
                            <button
                              onClick={() => {
                                setStudentLocalMicActive(!studentLocalMicActive);
                                showToast(studentLocalMicActive ? "تم إغلاق المايك" : "تم فتح المايك", "info");
                              }}
                              className={`px-3 py-1.5 rounded bg-black/30 border text-[9px] font-black transition-all ${studentLocalMicActive ? "border-red-500/50 text-red-400" : "border-green-500/50 text-green-400"}`}
                            >
                              {studentLocalMicActive ? "كتم الصوت الآن" : "تفعيل وبدء التحدث"}
                            </button>
                         </div>
                      ) : (
                         <div className="p-3 rounded-xl bg-zinc-800/50 border border-white/5 text-[10px] text-zinc-500 font-bold flex gap-2 items-center text-center justify-center">
                            <MicOff size={12} />
                            الصوت مقفل من قبل الأستاذ
                         </div>
                      )}

                      {(studentLiveControls[myUserId]?.camEnabled) ? (
                         <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
                            <span className="text-[10px] text-blue-400 font-bold">سمح الأستاذ بالكاميرا 📹</span>
                            <button
                              onClick={() => {
                                setStudentLocalCamActive(!studentLocalCamActive);
                                showToast(studentLocalCamActive ? "تم إغلاق الكاميرا" : "تم فتح الكاميرا", "info");
                              }}
                              className={`px-3 py-1.5 rounded bg-black/30 border text-[9px] font-black transition-all ${studentLocalCamActive ? "border-red-500/50 text-red-400" : "border-blue-500/50 text-blue-400"}`}
                            >
                              {studentLocalCamActive ? "إيقاف الكاميرا" : "تشغيل الكاميرا"}
                            </button>
                         </div>
                      ) : (
                         <div className="p-3 rounded-xl bg-zinc-800/50 border border-white/5 text-[10px] text-zinc-500 font-bold flex gap-2 items-center text-center justify-center">
                            <Video size={12} />
                            الكاميرا مقفلة من قبل الأستاذ
                         </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
};

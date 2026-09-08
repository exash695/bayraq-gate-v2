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

export const StudentFeedTab: React.FC = () => {
  const { activeCommentPostId, activeLiveTeacherName, activePostReactionId, classmates, editingPostContent, editingPostId, getCurrentUserId, getUserName, getUserPhoto, grade, handleAddAdminNoteClick, handleAddStoryClick, handleComment, handleDeletePost, handleEditPost, handleMediaUpload, handlePost, handleReactToPost, handleSaveEditPost, handleShare, handleTextareaChange, handleToggleLockPost, handleTogglePinPost, handleViewUserStories, insertTag, isLiveActive, isPosting, isTeacher, liveTitle, mediaInputRef, newPostContent, newPostMedia, openMenuPostId, platformLocks, posts, schoolName, setActivePostReactionId, setActiveTab, setEditingPostContent, setEditingPostId, setIsPosting, setNewPostContent, setNewPostMedia, setOpenMenuPostId, showTagMenuTarget, showToast, stories, tagSearch, teacherData, toggleLike, uniqueStoryUsers, userProfile } = useSchoolPlatform();

        return (
          <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
            <div className="px-0 md:px-4 py-4 md:py-6 space-y-4">
              {/* السمة الموسمية السحابية العالمية */}
              <SeasonalThemeBanner />

              {/* بوابة البث المباشر النشط للفرسان */}
              {isLiveActive && !isTeacher && (
                <div
                  onClick={() => setActiveTab("live_watch", "Live Broadcast Active Knights Banner onClick")}
                  className="mx-0 md:mx-0 bg-gradient-to-r from-red-500/25 via-red-500/10 to-indigo-500/20 border border-red-500/40 hover:border-red-400 p-4 rounded-xl text-right cursor-pointer relative overflow-hidden group shadow-[0_0_20px_rgba(239,68,68,0.15)] transition-all"
                  dir="rtl"
                >
                  <div className="absolute top-0 left-0 bg-red-600 text-[9px] font-black px-3 py-0.5 rounded-br-xl shadow-md">
                    LIVE ● مباشر
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500 shrink-0 border border-red-500/35">
                        <Radio size={20} className="animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-white text-xs font-black leading-tight">
                          {activeLiveTeacherName ? `الأستاذ ${activeLiveTeacherName.replace(/^(أ\.|أستاذ\s+)/, '').trim()}` : 'الأستاذ'} يثبّت درساً تفاعلياً مباشراً الآن!
                        </h4>
                        <p className="text-white/60 text-[10px] font-bold mt-1 truncate max-w-[240px] sm:max-w-[400px]">
                          عنوان الحصة: {liveTitle}
                        </p>
                      </div>
                    </div>
                    <button className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-black text-[10px] rounded-lg shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer self-end sm:self-auto">
                      انضم للبث المباشر 📡
                    </button>
                  </div>
                </div>
              )}
              {/* حالات التميز (Excellence Diaries Stories) */}
              <div
                className="bg-[#101935]/40 backdrop-blur-md rounded-none md:rounded-2xl p-4 border-y md:border border-white/5 space-y-3 -mx-0 md:mx-0 overflow-hidden text-right"
                dir="rtl"
              >
                <span className="text-[#00E5FF] text-[10px] font-black uppercase tracking-wider block">
                  ✨ حالات التميز
                </span>
                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                  {/* إضافة يومية جديدة - الملف الشخصي مع علامة + مستقلة كـ فيسبوك وإنستغرام تماماً */}
                  {(() => {
                    const myUserId = getCurrentUserId();
                    const myUserGroup = uniqueStoryUsers.find(
                      (u) => u.userId === myUserId,
                    );
                    const hasMyStories = !!myUserGroup;
                    const isSeen = myUserGroup ? myUserGroup.allSeen : true;

                    const label = "حالاتي";

                    if (hasMyStories && myUserGroup) {
                      return (
                        <div className="flex flex-col items-center gap-1.5 shrink-0 relative">
                          {/* Clicking the avatar plays my stories */}
                          <button
                            onClick={() => handleViewUserStories(myUserGroup)}
                            className="flex flex-col items-center focus:outline-none group relative cursor-pointer"
                          >
                            <div
                              className={`w-14 h-14 rounded-full p-[2px] transition-transform duration-300 group-hover:scale-105 ${
                                isSeen
                                  ? "bg-white/10 border border-white/10"
                                  : "bg-gradient-to-tr from-[#00E5FF] via-purple-500 to-[#FFD600] animate-[pulse_2s_infinite] shadow-[0_0_12px_rgba(0,229,255,0.45)]"
                              }`}
                            >
                              <div className="w-full h-full rounded-full border border-[#050505] overflow-hidden bg-[#101935] flex items-center justify-center">
                                {getUserPhoto() ? (
                                  <img
                                    src={getUserPhoto()!}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <User size={20} className="text-white/40" />
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] text-white/90 font-black max-w-[64px] text-center truncate mt-1.5 leading-none">
                              {label}
                            </span>
                          </button>

                          {/* Plus sign overlay to add a new story - stays static and clickable separately */}
                          <button
                            onClick={handleAddStoryClick}
                            className="absolute bottom-4 -left-1 bg-[#00E5FF] hover:bg-cyan-400 text-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-[#101935] font-black text-sm font-mono shadow-[0_0_15px_rgba(0,229,255,0.4)] hover:scale-110 active:scale-90 transition-all z-20 cursor-pointer"
                            title="أضف حالة تفوق جديدة 🌟"
                          >
                            +
                          </button>
                        </div>
                      );
                    } else {
                      // Normal look when no stories created yet
                      return (
                        <button
                          onClick={() => handleAddStoryClick()}
                          className="flex flex-col items-center gap-1.5 focus:outline-none shrink-0 group relative cursor-pointer"
                        >
                          <div className="w-14 h-14 rounded-full p-[2.5px] bg-[#101935] border border-white/15 transition-transform duration-300 relative group-hover:scale-105">
                            <div className="w-full h-full rounded-full overflow-hidden bg-[#101935]/60 flex items-center justify-center border border-dashed border-white/20">
                              {getUserPhoto() ? (
                                <img
                                  src={getUserPhoto()!}
                                  alt=""
                                  className="w-full h-full object-cover opacity-60 group-hover:opacity-95 transition-opacity"
                                />
                              ) : (
                                <User size={20} className="text-white/30" />
                              )}
                            </div>
                            {/* Plus icon overlay */}
                            <div className="absolute -bottom-1 -left-1 bg-[#00E5FF] text-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#050505] font-black text-sm font-mono shadow-[0_0_10px_rgba(0,229,255,0.3)]">
                              +
                            </div>
                          </div>
                          <span className="text-[10px] text-white/50 max-w-[64px] text-center truncate font-bold leading-none">
                            {label}
                          </span>
                        </button>
                      );
                    }
                  })()}

                  {/* الزملاء الآخرين - استبعاد حساب الطالب الحالي لمنع التكرار */}
                  {uniqueStoryUsers
                    .filter((user) => user.userId !== getCurrentUserId())
                    .map((user) => {
                      const isSeen = user.allSeen;
                      return (
                        <button
                          key={`user-story-${user.userId}`}
                          onClick={() => handleViewUserStories(user)}
                          className="flex flex-col items-center gap-1.5 focus:outline-none shrink-0 group relative cursor-pointer"
                        >
                          <div
                            className={`w-14 h-14 rounded-full p-[2px] transition-transform duration-300 group-hover:scale-105 ${
                              isSeen
                                ? "bg-white/10 border border-white/10"
                                : "bg-gradient-to-tr from-[#00E5FF] via-purple-500 to-[#FFD600] animate-[pulse_2s_infinite] shadow-[0_0_12px_rgba(0,229,255,0.45)]"
                            }`}
                          >
                            <div className="w-full h-full rounded-full border border-[#050505] overflow-hidden bg-[#101935] flex items-center justify-center">
                              {user.userPhotoURL ? (
                                <img
                                  src={user.userPhotoURL}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User size={20} className="text-white/40" />
                              )}
                            </div>
                          </div>
                          <span
                            className={`text-[10px] max-w-[64px] text-center truncate font-bold leading-none ${
                              isSeen
                                ? "text-white/40 font-medium"
                                : "text-white/90 font-black"
                            }`}
                          >
                            {user.userName.split(" ")[0]}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* منطقة كتابة منشور جديد */}
              {(!isTeacher && userProfile?.role !== 'admin' && userProfile?.role !== 'manager' && userProfile?.role !== 'super_admin' && (platformLocks.communityLockAll || platformLocks.communityLockGrades.includes(userProfile?.grade || ''))) ? (
                 <div className="bg-[#101935]/80 backdrop-blur-xl rounded-none md:rounded-2xl p-6 border-y md:border border-red-500/10 text-center shadow-xl -mx-0 md:mx-0">
                    <Lock className="text-red-400 mx-auto mb-3" size={24} />
                    <h4 className="text-white font-bold text-sm">النشر مقفل حالياً</h4>
                    <p className="text-white/40 text-xs mt-1">قامت الإدارة بإيقاف النشر في الساحة مؤقتاً. يمكن للإدارة والأساتذة فقط النشر الآن.</p>
                 </div>
              ) : (
              <div
                className={`bg-[#101935]/80 backdrop-blur-xl rounded-none md:rounded-2xl p-4 md:p-6 border-y md:border border-white/5 transition-all shadow-xl -mx-0 md:mx-0 ${userProfile?.canPost === false ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {!isPosting ? (
                  <div
                    onClick={() => {
                      if (userProfile?.canPost === false) {
                        alert("تم تقييد صلاحية النشر لديك من قبل الإدارة.");
                        return;
                      }
                      setIsPosting(true);
                    }}
                    className="flex items-center gap-4 cursor-pointer group"
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl ${isTeacher ? "bg-amber-500" : userProfile?.role === "admin" ? "bg-[#FFD600]" : "bg-blue-600"} flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform shadow-lg shrink-0 relative overflow-hidden`}
                    >
                      {isTeacher ? (
                        teacherData?.photoURL ? (
                          <img
                            src={teacherData.photoURL}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <GraduationCap size={24} className="text-white" />
                        )
                      ) : userProfile?.role === "admin" ? (
                        <ShieldCheck size={24} className="text-black" />
                      ) : getUserPhoto() ? (
                        <img
                          src={getUserPhoto()!}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={24} className="text-white" />
                      )}
                      {userProfile?.canPost === false && (
                        <Lock
                          size={16}
                          className="absolute -top-1 -right-1 text-rose-500 bg-white rounded-full p-0.5"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="text-white/40 text-sm font-medium">
                        {isTeacher
                          ? `بماذا تود توجيه طلبتك يا أستاذ ${teacherData?.name ? teacherData.name.split(" ")[0] : ""}؟`
                          : userProfile?.role === "admin"
                            ? `شارك إعلان أو توجيه كإدارة المدرسة للصف ${grade}...`
                            : `بماذا تفكر يا بطل ${schoolName}؟`}
                      </span>
                    </div>
                    <ImageIcon
                      size={20}
                      className="text-white/20 group-hover:text-amber-400 transition-colors"
                    />
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
                    <div className="relative">
                      <textarea
                        autoFocus
                        value={newPostContent}
                        onChange={(e) =>
                          handleTextareaChange(e, setNewPostContent, "post")
                        }
                        placeholder={
                          isTeacher
                            ? `بماذا تود توجيه طلبتك يا أستاذ ${teacherData?.name ? teacherData.name.split(" ")[0] : ""}؟`
                            : userProfile?.role === "admin"
                              ? `شارك إعلان أو توجيه كإدارة المدرسة للصف ${grade}...`
                              : `بماذا تفكر يا بطل ${schoolName}؟`
                        }
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white text-base focus:outline-none focus:border-blue-500/50 min-h-[140px] resize-none shadow-inner"
                      />
                      {showTagMenuTarget === "post" &&
                        classmates
                          .map((c) => c.name)
                          .filter((n) => n.includes(tagSearch)).length > 0 && (
                          <div className="absolute top-full left-0 mt-1 max-h-40 overflow-y-auto bg-[#101935] border border-blue-500/30 rounded-xl shadow-2xl z-[50] w-64 text-right">
                            {classmates
                              .filter((c) => c.name.includes(tagSearch))
                              .map((c, i) => (
                                <button
                                  key={i}
                                  onClick={() =>
                                    insertTag(
                                      c.name,
                                      newPostContent,
                                      setNewPostContent,
                                    )
                                  }
                                  className="w-full text-right px-4 py-2 text-white/90 hover:bg-blue-500/20 font-bold border-b border-white/5 last:border-0 hover:text-blue-400 text-sm"
                                >
                                  {c.name}
                                </button>
                              ))}
                          </div>
                        )}
                    </div>
                    {newPostMedia && (
                      <div className="relative w-fit">
                        <img
                          src={newPostMedia}
                          alt="مرفق جديد"
                          className="max-h-48 rounded-xl border border-white/10"
                        />
                        <button
                          onClick={() => setNewPostMedia(null)}
                          className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={mediaInputRef}
                          onChange={handleMediaUpload}
                        />
                        <button
                          onClick={() => mediaInputRef.current?.click()}
                          className="p-2 rounded-xl text-blue-400 hover:bg-blue-500/10 flex items-center gap-2 transition-colors border border-blue-500/20 bg-blue-500/5"
                        >
                          <ImageIcon size={18} />
                          <span className="text-xs font-bold text-blue-400/80">
                            إضافة صورة
                          </span>
                        </button>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setIsPosting(false);
                            setNewPostMedia(null);
                          }}
                          className="px-6 py-2.5 rounded-xl text-white/40 text-xs font-black hover:bg-white/5 uppercase tracking-widest"
                        >
                          إلغاء
                        </button>
                        <button
                          onClick={handlePost}
                          disabled={!newPostContent.trim() && !newPostMedia}
                          className="px-8 py-3 rounded-xl bg-blue-600 text-white text-xs font-black disabled:opacity-50 shadow-xl shadow-blue-900/40 uppercase tracking-widest"
                        >
                          نشر الآن
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
              )}

              {/* قائمة المنشورات */}
              {posts
                .filter(
                  (post, index, self) =>
                    index === self.findIndex((p) => p.id === post.id),
                )
                .map((post, idx) => (
                  <motion.div
                    key={`post-${post.id || idx}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`backdrop-blur-md rounded-none md:rounded-2xl border-y md:border overflow-hidden shadow-2xl transition-all ${
                      post.type === "admin"
                        ? "bg-gradient-to-br from-amber-950/20 to-[#101935]/80 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.08)]"
                        : "bg-[#101935]/60 border-white/5"
                    }`}
                  >
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg overflow-hidden ${
                            post.type === "admin"
                              ? "bg-amber-400 border-amber-300/30"
                              : "bg-blue-600/10 border-blue-500/20"
                          }`}
                        >
                          {post.type === "admin" ? (
                            post.stageIcon ? (
                              <span
                                className="text-2.5xl select-none"
                                role="img"
                                aria-label="admin-stage-icon"
                              >
                                {post.stageIcon}
                              </span>
                            ) : (
                              <SchoolIcon size={24} className="text-black" />
                            )
                          ) : post.userPhotoURL ? (
                            <img
                              src={post.userPhotoURL}
                              alt={post.userName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User
                              size={24}
                              className={
                                post.type === "teacher"
                                  ? "text-amber-400"
                                  : "text-blue-400"
                              }
                            />
                          )}
                        </div>
                        <div>
                          <h4 className="text-white font-black text-base tracking-tight flex items-center gap-2">
                            {post.userName}
                            {post.isPinned && (
                              <Pin
                                size={14}
                                className="text-amber-400 animate-bounce"
                              />
                            )}
                            {post.isLocked && (
                              <Lock size={14} className="text-rose-400" />
                            )}
                          </h4>
                          <span className="text-white/20 text-[10px] font-bold uppercase tracking-widest leading-none">
                            {post.time}
                          </span>
                        </div>
                      </div>
                      {/* Three Dots Menu Placement */}
                      {!(
                        post.type === "admin" &&
                        !isTeacher &&
                        userProfile?.role !== "admin"
                      ) && (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuPostId(
                                openMenuPostId === post.id ? null : post.id,
                              );
                            }}
                            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all cursor-pointer active:scale-95"
                          >
                            <MoreHorizontal size={20} />
                          </button>

                          {openMenuPostId === post.id && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuPostId(null);
                                }}
                              />
                              <div
                                className="absolute left-0 mt-2 w-48 rounded-2xl bg-[#090D1C]/95 backdrop-blur-xl border border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.6)] py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150 text-right"
                                dir="rtl"
                              >
                                {!isTeacher &&
                                userProfile?.role !== "admin" &&
                                post.userId === getCurrentUserId() ? (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditPost(post);
                                      }}
                                      className="w-full px-4 py-2.5 text-right text-xs font-bold text-white/85 hover:text-amber-400 hover:bg-white/[0.03] transition-all flex items-center justify-between cursor-pointer"
                                    >
                                      <span>تعديل المنشور</span>
                                      <Edit2 size={14} className="opacity-60" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeletePost(post.id);
                                      }}
                                      className="w-full px-4 py-2.5 text-right text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-all flex items-center justify-between border-t border-white/5 cursor-pointer"
                                    >
                                      <span>حذف المنشور</span>
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                ) : (post.userId === getCurrentUserId() || userProfile?.role === "admin") ? (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeletePost(post.id);
                                      }}
                                      className="w-full px-4 py-2.5 text-right text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-all flex items-center justify-between border-t border-white/5 cursor-pointer"
                                    >
                                      <span>حذف المنشور</span>
                                      <Trash2 size={14} />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTogglePinPost(post);
                                      }}
                                      className="w-full px-4 py-2.5 text-right text-xs font-bold text-amber-500 hover:bg-amber-500/10 transition-all flex items-center justify-between border-t border-white/5 cursor-pointer"
                                    >
                                      <span>
                                        {post.isPinned
                                          ? "إلغاء التثبيت"
                                          : "تثبيت المنشور"}
                                      </span>
                                      <Pin
                                        size={14}
                                        className={
                                          post.isPinned ? "fill-amber-500" : ""
                                        }
                                      />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleLockPost(post);
                                      }}
                                      className="w-full px-4 py-2.5 text-right text-xs font-bold text-rose-400 hover:bg-rose-400/10 transition-all flex items-center justify-between border-t border-white/5 cursor-pointer"
                                    >
                                      <span>
                                        {post.isLocked
                                          ? "فتح التعليقات"
                                          : "قفل التعليقات"}
                                      </span>
                                      <Lock size={14} />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddAdminNoteClick(post);
                                      }}
                                      className="w-full px-4 py-2.5 text-right text-xs font-bold text-blue-400 hover:bg-blue-400/10 transition-all flex items-center justify-between border-t border-white/5 cursor-pointer"
                                    >
                                      <span>إضافة ملاحظة إدارية</span>
                                      <MessageCircle size={14} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copyToClipboard(
                                          post.content,
                                        );
                                        showToast(
                                          "تم نسخ النص بنجاح 🎉",
                                          "success",
                                        );
                                        setOpenMenuPostId(null);
                                      }}
                                      className="w-full px-4 py-2.5 text-right text-xs font-bold text-white/85 hover:text-blue-400 hover:bg-white/[0.03] transition-all flex items-center justify-between cursor-pointer"
                                    >
                                      <span>نسخ النص الحرفي</span>
                                      <span className="text-[10px] text-white/30 font-medium">
                                        نسخ
                                      </span>
                                    </button>
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          const postRef = doc(
                                            db,
                                            "community_posts",
                                            post.id,
                                          );
                                          await updateDoc(postRef, {
                                            reportsCount: increment(1),
                                          });

                                          await addDoc(
                                            collection(db, "support_tickets"),
                                            {
                                              userId: getCurrentUserId(),
                                              studentName: getUserName(),
                                              grade: grade || "All",
                                              studentCode:
                                                userProfile?.studentCode ||
                                                userProfile?.code ||
                                                teacherData?.code ||
                                                teacherData?.id ||
                                                "guest",
                                              role: isTeacher
                                                ? "teacher"
                                                : "student",
                                              senderType: isTeacher
                                                ? "teacher"
                                                : "student",
                                              issueType: "محتوى غير لائق",
                                              title:
                                                "إبلاغ عن محتوى في نبض البوابة",
                                              message: `تم الإبلاغ عن منشور للكاتب: ${post.userName}\nمحتوى المنشور:\n${post.content}`,
                                              reportedPostId: post.id,
                                              status: "pending",
                                              readByAdmin: false,
                                              timestamp: serverTimestamp(),
                                            },
                                          );

                                          showToast(
                                            "شكراً لمساهمتك، تم إرسال الإبلاغ للإدارة وسيتم مراجعته.",
                                            "info",
                                          );
                                        } catch (err) {
                                          console.error("Report error", err);
                                          showToast(
                                            "حدث خطأ أثناء الإبلاغ",
                                            "error",
                                          );
                                        }
                                        setOpenMenuPostId(null);
                                      }}
                                      className="w-full px-4 py-2.5 text-right text-xs font-bold text-rose-400/80 hover:bg-white/[0.03] transition-all flex items-center justify-between border-t border-white/5 cursor-pointer"
                                    >
                                      <span>إبلاغ عن محتوى غير لائق</span>
                                      <Lock size={12} className="opacity-60" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="px-5 pb-5">
                      {editingPostId === post.id ? (
                        <div
                          className="space-y-3 bg-white/[0.02] border border-white/5 rounded-2xl p-4"
                          dir="rtl"
                        >
                          <textarea
                            value={editingPostContent}
                            onChange={(e) =>
                              setEditingPostContent(e.target.value)
                            }
                            className="w-full bg-black/40 border border-white/10 focus:border-[#00E5FF]/40 rounded-xl p-3 text-white text-sm focus:outline-none transition-colors"
                            rows={3}
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleSaveEditPost(post.id)}
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all active:scale-95"
                            >
                              حفظ التعديلات
                            </button>
                            <button
                              onClick={() => setEditingPostId(null)}
                              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl text-xs font-bold cursor-pointer transition-all"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-white/90 text-base md:text-lg leading-relaxed selection:bg-blue-500/30 font-medium whitespace-pre-wrap">
                          <RenderTextWithTags text={post.content} />
                        </p>
                      )}

                      {post.mediaUrl && (
                        <div className="mt-4 rounded-xl overflow-hidden border border-white/10">
                          <img
                            src={post.mediaUrl}
                            alt="Post media"
                            className="w-full object-contain max-h-[500px]"
                          />
                        </div>
                      )}

                      {/* Admin Notes */}
                      {post.adminNotes && post.adminNotes.length > 0 && (
                        <div className="mt-4 bg-blue-500/5 backdrop-blur-sm border border-blue-500/10 rounded-2xl p-5 border-r-4 border-r-blue-500 relative overflow-hidden group/note">
                          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/note:opacity-100 transition-opacity" />
                          {post.adminNotes.map((note, noteIdx) => (
                            <div
                              key={`admin_note_${post.id}_${noteIdx}`}
                              className="text-sm text-blue-100/80 leading-relaxed relative z-10 whitespace-pre-wrap"
                            >
                              <span className="font-black text-blue-400 text-[10px] block mb-2 uppercase tracking-[0.2em]">
                                الإدارة 🏛️:
                              </span>
                              <RenderTextWithTags text={note.content} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="px-5 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between relative">
                      <div className="flex items-center gap-8">
                        <div className="relative">
                          {/* Facebook-style Reactions Popover */}
                          {activePostReactionId === post.id && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setActivePostReactionId(null)}
                              />
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: -12, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-full right-0 mb-3 z-50 flex items-center gap-2 bg-[#0d1532]/98 backdrop-blur-2xl border border-white/10 p-2 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200"
                                dir="rtl"
                              >
                                {[
                                  { char: "💡", label: "فكرة ذكية" },
                                  { char: "✍️", label: "سأجتهد" },
                                  { char: "👏", label: "مبدع كفو" },
                                  { char: "🧠", label: "عصف ذهني" },
                                  { char: "📚", label: "معلومة قيمة" },
                                  { char: "👑", label: "فخور بك" },
                                ].map((react) => (
                                  <button
                                    key={`react-${post.id}-${react.char}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReactToPost(post.id, react.char);
                                      setActivePostReactionId(null);
                                      if (!post.isLiked) {
                                        toggleLike(post.id, false);
                                      }
                                    }}
                                    className="flex flex-col items-center gap-1 hover:scale-125 active:scale-90 transition-all duration-200 cursor-pointer text-center group"
                                  >
                                    <span className="text-xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
                                      {react.char}
                                    </span>
                                    <span className="text-[8px] text-white/55 font-black group-hover:text-[#00E5FF] transition-colors leading-none whitespace-nowrap">
                                      {react.label}
                                    </span>
                                  </button>
                                ))}
                              </motion.div>
                            </>
                          )}

                          {/* Trigger button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePostReactionId(
                                activePostReactionId === post.id
                                  ? null
                                  : post.id,
                              );
                            }}
                            className={`flex items-center gap-2 transition-all hover:scale-105 active:scale-95 ${post.isLiked ? "text-[#00E5FF] drop-shadow-cyan" : "text-white/35 hover:text-white/70"}`}
                          >
                            <ThumbsUp
                              size={20}
                              strokeWidth={2.5}
                              className="animate-pulse"
                            />
                            <span className="text-xs font-black">
                              تفاعل / أعجبني
                            </span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleComment(post.id)}
                          className={`flex items-center gap-2 transition-colors ${activeCommentPostId === post.id ? "text-blue-500" : "text-white/30 hover:text-white/60"}`}
                        >
                          <MessageCircle size={20} strokeWidth={2.5} />
                          {userProfile?.canComment === false && (
                            <Lock size={12} className="text-rose-500" />
                          )}
                          <span className="text-xs font-black">
                            {post.comments}
                          </span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleShare(post)}
                        className="flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors group"
                      >
                        <Share2
                          size={20}
                          strokeWidth={2.5}
                          className="group-hover:rotate-12 transition-transform"
                        />
                        <span className="text-xs font-black uppercase tracking-widest">
                          مشاركة
                        </span>
                        <span className="text-xs font-bold">
                          {post.shares || 0}
                        </span>
                      </button>
                    </div>

                    {/* Render Accumulating Student Educational Reactions under Post (Facebook summary-style) */}
                    {post.reactions &&
                      Object.keys(post.reactions).some((k) =>
                        ["💡", "✍️", "👏", "🧠", "📚", "👑"].includes(k),
                      ) && (
                        <div className="px-5 pb-3 flex items-center justify-between -mt-2">
                          <div className="flex flex-wrap items-center gap-2 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-xl text-white font-mono text-[11px]">
                            <div className="flex items-center -space-x-1.5 space-x-reverse">
                              {["💡", "✍️", "👏", "🧠", "📚", "👑"].map(
                                (char) => {
                                  const count = post.reactions?.[char] || 0;
                                  if (count === 0) return null;
                                  return (
                                    <div
                                      key={char}
                                      className="w-5.5 h-5.5 rounded-full bg-[#101935] border border-white/10 flex items-center justify-center text-xs shadow-md z-10"
                                      title={char}
                                    >
                                      {char}
                                    </div>
                                  );
                                },
                              )}
                            </div>
                            <span className="font-extrabold text-[#00E5FF] px-1 text-xs">
                              {Object.entries(post.reactions)
                                .filter(([key]) =>
                                  ["💡", "✍️", "👏", "🧠", "📚", "👑"].includes(
                                    key,
                                  ),
                                )
                                .reduce(
                                  (acc, [_, val]) => acc + (val as number),
                                  0,
                                )}
                            </span>
                          </div>
                        </div>
                      )}

                    {/* Global comments modal handles comments instead of inline */}
                  </motion.div>
                ))}
            </div>
          </div>
        );
};

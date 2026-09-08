import React, { useState, useEffect } from "react";
import { query, collection, where, orderBy, onSnapshot, addDoc, db, auth, doc, updateDoc, increment, deleteDoc } from "../../lib/firebase";
import { RefreshCw, MoreVertical, Edit2, Trash2, X, Check, MessageSquare, CornerDownLeft, Send } from "lucide-react";
import { notificationService } from "../../services/notificationService";
import { useSchoolPlatform } from "./SchoolPlatformContext";

export interface VideoCommentsProps {
  lessonId: string;
  isTeacher: boolean;
  currentUser: any;
  teacherData?: any;
  lessonTitle?: string;
  lessonGrade?: string;
  setRecordedLessons?: any;
}

export const VideoComments: React.FC<VideoCommentsProps> = ({
  lessonId,
  isTeacher,
  currentUser,
  teacherData,
  lessonTitle,
  lessonGrade,
  setRecordedLessons: propSetRecordedLessons,
}) => {
  const context = useSchoolPlatform();
  const setRecordedLessons = propSetRecordedLessons || context?.setRecordedLessons;
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const currentUserId = 
    currentUser?.id || 
    currentUser?.uid || 
    currentUser?.studentCode || 
    currentUser?.code || 
    currentUser?.student_code || 
    auth?.currentUser?.uid || 
    (typeof localStorage !== 'undefined' ? (localStorage.getItem('gate6_user_id') || localStorage.getItem('gate6_student_code')) : null) || 
    'user';

  useEffect(() => {
    const q = query(
      collection(db, "video_comments"),
      where("lessonId", "==", lessonId),
      orderBy("timestamp", "asc"),
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((doc) => ({ 
          id: doc.id, 
          authorId: doc.data().userId || doc.data().authorId,
          ...doc.data() 
        }));
        setComments(list);
        setLoading(false);

        // Keep local recordedLessons list updated with exact count
        const total = list.length;
        setRecordedLessons?.((prev: any[]) => prev.map((l: any) => l.id === lessonId ? {
          ...l,
          commentCount: total,
          comment_count: total
        } : l));

        // Sync with SQL database so the record is persistent
        fetch(`/api/recorded-lessons/${lessonId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ commentCount: total })
        }).catch(() => {});
      },
      (err) => {
        console.error(err);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [lessonId]);

  const getResolvedAuthorName = () => {
    if (isTeacher) {
      let tName = 
        teacherData?.fullName || 
        teacherData?.name || 
        currentUser?.fullName || 
        currentUser?.displayName || 
        currentUser?.name || 
        "حسين";
      if (!tName || tName === "مستخدم" || tName.trim() === "أستاذ" || tName.trim() === "الاستاذ") {
        tName = "حسين";
      }
      if (!tName.startsWith("الأستاذ") && !tName.startsWith("الاستاذ")) {
        tName = `الأستاذ ${tName}`;
      }
      return tName;
    } else {
      let sName = 
        currentUser?.fullName || 
        currentUser?.name || 
        currentUser?.studentName || 
        currentUser?.student_name || 
        currentUser?.displayName || 
        (typeof localStorage !== 'undefined' ? localStorage.getItem('gate6_user_name') : null) || 
        "";
      if (!sName || sName === "مستخدم") {
        sName = currentUser?.email ? currentUser.email.split('@')[0] : (lessonGrade && lessonGrade !== "الكل" ? `طالب ${lessonGrade}` : "طالب مجتهد");
      }
      return sName;
    }
  };

  const getDisplayAuthorName = (c: any) => {
    if (c.isTeacher) {
      let name = c.authorName;
      if (!name || name === "مستخدم" || name.trim() === "أستاذ" || name.trim() === "الاستاذ") {
        name = teacherData?.fullName || teacherData?.name ? (teacherData.fullName || teacherData.name) : "حسين";
      }
      if (!name.startsWith("الأستاذ") && !name.startsWith("الاستاذ")) {
        name = `الأستاذ ${name}`;
      }
      return name;
    } else {
      let name = c.authorName;
      if (!name || name === "مستخدم") {
        name = currentUser?.studentName || currentUser?.name || currentUser?.fullName || (lessonGrade && lessonGrade !== "الكل" ? `طالب ${lessonGrade}` : "طالب مجتهد");
      }
      return name;
    }
  };

  const checkIsOwner = (comment: any) => {
    if (!comment) return false;

    // 1. Teacher ownership
    if (isTeacher && comment.isTeacher) return true;

    // 2. Direct ID matching across all possible student IDs
    const myIds = [
      currentUser?.id,
      currentUser?.uid,
      currentUser?.studentCode,
      currentUser?.code,
      currentUser?.student_code,
      currentUserId,
      auth?.currentUser?.uid,
      typeof localStorage !== 'undefined' ? localStorage.getItem('gate6_user_id') : null,
      typeof localStorage !== 'undefined' ? localStorage.getItem('gate6_student_code') : null,
    ].filter(Boolean).map(x => String(x).trim().toLowerCase());

    const commentIds = [
      comment.authorId,
      comment.userId,
      comment.author_id,
      comment.user_id,
    ].filter(Boolean).map(x => String(x).trim().toLowerCase());

    if (commentIds.some(cid => myIds.includes(cid))) {
      return true;
    }

    // 3. Name matching for students (covers previously posted comments)
    if (!comment.isTeacher) {
      const myNames = [
        currentUser?.studentName,
        currentUser?.name,
        currentUser?.fullName,
        currentUser?.student_name,
        currentUser?.displayName,
        typeof localStorage !== 'undefined' ? localStorage.getItem('gate6_user_name') : null,
      ].filter(Boolean).map(x => String(x).trim().toLowerCase());

      const commentAuthor = String(comment.authorName || comment.author_name || '').trim().toLowerCase();
      if (commentAuthor && myNames.some(mn => mn && (commentAuthor === mn || commentAuthor.includes(mn) || mn.includes(commentAuthor)))) {
        return true;
      }
    }

    return false;
  };

  const handleSubmit = async (parentId: string | null = null) => {
    const text = parentId ? replyText : newComment;
    if (!text.trim()) return;

    try {
      const authorName = getResolvedAuthorName();

      await addDoc(collection(db, "video_comments"), {
        lessonId,
        text: text.trim(),
        authorName,
        authorId: currentUserId,
        userId: currentUserId,
        isTeacher,
        parentId: parentId || null,
        timestamp: new Date(),
      });

      // Send notification if it's a reply
      if (parentId) {
        const parentComment = comments.find(c => c.id === parentId);
        const targetRecipient = parentComment?.authorId || parentComment?.userId;
        if (parentComment && targetRecipient && targetRecipient !== currentUserId) {
          await notificationService.sendNotification({
            userId: targetRecipient,
            title: isTeacher ? "رد الأستاذ على سؤالك 💬" : "رد جديد على تعليقك 💬",
            message: isTeacher 
              ? `قام ${authorName} بالرد على سؤالك في المحاضرة${lessonTitle ? `: (${lessonTitle})` : ""}`
              : `قام الزميل ${authorName} بالرد على تعليقك.`,
            type: "reply",
            icon: "MessageCircle"
          }).catch(err => console.error("Notification failed", err));
        }
        setReplyText("");
        setReplyTo(null);
      } else {
        setNewComment("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async (id: string) => {
    const trimmed = editText.trim();
    if (!trimmed) return;

    // Optimistic UI update immediately
    setComments(prev => prev.map(c => c.id === id ? { ...c, text: trimmed, isEdited: true } : c));
    setEditingId(null);
    setEditText("");

    try {
      // Direct PATCH to server API
      const patchRes = await fetch(`/api/video-comments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: trimmed,
          isEdited: true
        })
      });
      if (!patchRes.ok) {
        await updateDoc(doc(db, "video_comments", id), {
          text: trimmed,
          isEdited: true,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn("Update fallback:", e);
      try {
        await updateDoc(doc(db, "video_comments", id), {
          text: trimmed,
          isEdited: true,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Failed to update comment:", err);
      }
    }
  };

  const executeDelete = async (id: string) => {
    setConfirmDeleteId(null);

    // Optimistic delete immediately
    setComments(prev => prev.filter(c => c.id !== id && c.parentId !== id));

    const remaining = comments.filter(c => c.id !== id && c.parentId !== id).length;
    setRecordedLessons?.((prev: any[]) => prev.map((l: any) => l.id === lessonId ? {
      ...l,
      commentCount: remaining,
      comment_count: remaining
    } : l));

    try {
      const delRes = await fetch(`/api/video-comments/${id}`, {
        method: 'DELETE'
      });
      if (!delRes.ok) {
        await deleteDoc(doc(db, "video_comments", id));
      }
      fetch(`/api/recorded-lessons/${lessonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentCount: remaining })
      }).catch(() => {});
    } catch (e) {
      console.warn("Delete fallback:", e);
      try {
        await deleteDoc(doc(db, "video_comments", id));
      } catch (err) {
        console.error("Failed to delete comment:", err);
      }
    }
  };

  const mainComments = comments.filter(c => !c.parentId);
  const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);

  const CommentActions = ({ comment }: { comment: any }) => {
    const isOwner = checkIsOwner(comment);
    if (!isOwner) return null;

    if (confirmDeleteId === comment.id) {
      return (
        <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/40 rounded-xl px-2 py-1 animate-in fade-in">
          <span className="text-[9px] text-red-300 font-bold ml-1">تأكيد الحذف؟</span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              executeDelete(comment.id);
            }}
            className="p-1 hover:bg-red-500/40 rounded-lg text-red-300 hover:text-white cursor-pointer active:scale-95 transition-all"
            title="نعم، احذف التعليق"
          >
            <Check size={13} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDeleteId(null);
            }}
            className="p-1 hover:bg-white/20 rounded-lg text-white/50 hover:text-white cursor-pointer active:scale-95 transition-all"
            title="إلغاء"
          >
            <X size={13} />
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">
        <button 
          onClick={() => {
            setConfirmDeleteId(null);
            setEditingId(comment.id);
            setEditText(comment.text);
          }}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-white/50 hover:text-[#00E5FF] cursor-pointer active:scale-95"
          title="تعديل تعليقي"
        >
          <Edit2 size={12} />
        </button>
        <button 
          onClick={() => setConfirmDeleteId(comment.id)}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-white/50 hover:text-red-400 cursor-pointer active:scale-95"
          title="حذف تعليقي"
        >
          <Trash2 size={12} />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-black text-[#00E5FF] border-b border-white/5 pb-2.5 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <MessageSquare size={14} />
          تعليقات وأسئلة {lessonGrade && lessonGrade !== "الكل" ? `فرسان ${lessonGrade}` : "الطلبة"}
        </span>
        <span className="text-[10px] text-white/50 font-mono bg-white/5 px-2 py-0.5 rounded-full">
          {comments.length} تعليق
        </span>
      </h3>

      <div className="space-y-3.5 max-h-[420px] overflow-y-auto no-scrollbar pb-4 pr-1">
        {loading ? (
          <div className="text-center py-6">
            <RefreshCw
              className="animate-spin mx-auto text-[#00E5FF]/60"
              size={22}
            />
          </div>
        ) : mainComments.length === 0 ? (
          <div className="text-center py-8 px-4 bg-white/[0.02] border border-dashed border-white/5 rounded-2xl">
            <MessageSquare className="mx-auto text-white/20 mb-2" size={24} />
            <p className="text-[11px] font-bold text-white/40">
              لا توجد تعليقات حتى الآن. كن أول من يطرح سؤالاً للأستاذ!
            </p>
          </div>
        ) : (
          mainComments.map((c) => {
            const replies = getReplies(c.id);
            return (
              <div key={c.id} className="space-y-2">
                {/* Main Comment */}
                <div
                  className={`p-3.5 rounded-2xl border transition-all ${
                    c.isTeacher
                      ? "bg-[#00E5FF]/5 border-[#00E5FF]/20 shadow-[0_4px_16px_rgba(0,229,255,0.05)]"
                      : "bg-[#0c1228]/80 border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                        c.isTeacher ? "bg-[#00E5FF] text-black" : "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                      }`}>
                        {c.isTeacher ? "أ" : (c.authorName?.[0] || "ط")}
                      </div>
                      <span
                        className={`text-[11px] font-black ${
                          c.isTeacher ? "text-[#00E5FF]" : "text-amber-300"
                        }`}
                      >
                        {getDisplayAuthorName(c)}{" "}
                        {c.isTeacher && (
                          <span className="bg-[#00E5FF]/20 text-[#00E5FF] px-1.5 py-0.5 rounded-md mr-1 text-[8px] font-bold">
                            الأستاذ المحاضر
                          </span>
                        )}
                      </span>
                      <span className="text-[8px] text-white/30 font-mono">
                        {c.timestamp?.toDate
                          ? c.timestamp
                              .toDate()
                              .toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                          : ""}
                        {c.isEdited && <span className="mr-1 text-white/40">(معدل)</span>}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <CommentActions comment={c} />
                      <button 
                        onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          replyTo === c.id
                            ? "bg-[#00E5FF] text-black"
                            : "text-white/50 hover:text-[#00E5FF] hover:bg-white/5"
                        }`}
                      >
                        <CornerDownLeft size={10} />
                        رد
                      </button>
                    </div>
                  </div>

                  {editingId === c.id ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input 
                        type="text"
                        autoFocus
                        className="flex-1 bg-black/70 border border-[#00E5FF]/50 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#00E5FF] shadow-inner"
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleUpdate(c.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                      <button 
                        type="button"
                        onClick={() => handleUpdate(c.id)} 
                        disabled={!editText.trim()}
                        className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 disabled:opacity-40 cursor-pointer active:scale-95 transition-all shadow-sm"
                        title="حفظ التعديل"
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => setEditingId(null)} 
                        className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 cursor-pointer active:scale-95 transition-all shadow-sm"
                        title="إلغاء"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <p className="text-white/90 text-xs font-semibold leading-relaxed whitespace-pre-wrap">
                      {c.text}
                    </p>
                  )}
                </div>

                {/* Threaded Replies (Facebook Style directly beneath the question) */}
                {(replies.length > 0 || replyTo === c.id) && (
                  <div className="mr-6 space-y-2 border-r-2 border-[#00E5FF]/20 pr-3.5 mt-2 relative">
                    {replies.map(reply => (
                      <div
                        key={reply.id}
                        className={`p-3 rounded-xl border relative transition-all ${
                          reply.isTeacher
                            ? "bg-[#00E5FF]/10 border-[#00E5FF]/30 shadow-[0_4px_16px_rgba(0,229,255,0.06)]"
                            : "bg-white/[0.03] border-white/5"
                        }`}
                      >
                        {/* Connector visual indicator */}
                        <div className="absolute -right-[15px] top-4 w-3.5 h-[2px] bg-[#00E5FF]/30" />
                        <div className="absolute -right-[17px] top-4 w-1.5 h-1.5 rounded-full bg-[#00E5FF] -translate-y-1/2" />
                        
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-black ${
                                reply.isTeacher ? "text-[#00E5FF]" : "text-amber-300"
                              }`}
                            >
                              {getDisplayAuthorName(reply)}{" "}
                              {reply.isTeacher && (
                                <span className="bg-[#00E5FF]/20 text-[#00E5FF] px-1 py-0.5 rounded text-[7px] font-bold mr-1">
                                  رد الأستاذ
                                </span>
                              )}
                            </span>
                            <span className="text-[8px] text-white/30 font-mono">
                              {reply.timestamp?.toDate
                                ? reply.timestamp
                                    .toDate()
                                    .toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                : ""}
                              {reply.isEdited && <span className="mr-1 text-white/40">(معدل)</span>}
                            </span>
                          </div>
                          <CommentActions comment={reply} />
                        </div>

                        {editingId === reply.id ? (
                          <div className="flex items-center gap-2 mt-2">
                            <input 
                              type="text"
                              autoFocus
                              className="flex-1 bg-black/70 border border-[#00E5FF]/50 rounded-xl px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#00E5FF] shadow-inner"
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleUpdate(reply.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                            />
                            <button 
                              type="button"
                              onClick={() => handleUpdate(reply.id)} 
                              disabled={!editText.trim()}
                              className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 disabled:opacity-40 cursor-pointer active:scale-95 transition-all"
                              title="حفظ التعديل"
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              type="button"
                              onClick={() => setEditingId(null)} 
                              className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 cursor-pointer active:scale-95 transition-all"
                              title="إلغاء"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <p className="text-white/80 text-[11px] font-medium leading-relaxed whitespace-pre-wrap">
                            {reply.text}
                          </p>
                        )}
                      </div>
                    ))}

                    {/* Inline Reply Input Box under this specific comment */}
                    {replyTo === c.id && (
                      <div className="flex gap-2 mt-2 pt-1">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={isTeacher ? "اكتب توضيحك أو إجابتك على سؤال الطالب..." : "اكتب ردك هنا..."}
                          className="flex-1 bg-black/60 border border-[#00E5FF]/40 rounded-xl px-3 py-1.5 text-[11px] text-white outline-none focus:border-[#00E5FF] transition-colors"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSubmit(c.id);
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleSubmit(c.id)}
                          disabled={!replyText.trim()}
                          className="px-3.5 py-1.5 bg-[#00E5FF] hover:bg-[#33ebff] text-black text-[10px] font-black rounded-xl transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1"
                        >
                          <Send size={11} />
                          رد
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Main Comment Input */}
      <div className="flex gap-2 pt-1 border-t border-white/5">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={
            isTeacher
              ? "أضف رداً أو توجيهاً عاماً للطلبة حول هذا الدرس..."
              : "اطرح سؤالك أو شارك استفسارك للأستاذ حول هذا الدرس..."
          }
          className="flex-1 bg-[#0c1228] border border-white/10 rounded-xl px-3.5 text-xs text-white placeholder-white/30 focus:border-[#00E5FF]/50 outline-none transition-colors h-10"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
        />
        <button
          onClick={() => handleSubmit()}
          disabled={!newComment.trim()}
          className="h-10 px-5 bg-[#00E5FF] disabled:opacity-40 hover:bg-[#33ebff] text-black font-black text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,229,255,0.15)]"
        >
          <Send size={13} />
          إرسال
        </button>
      </div>
    </div>
  );
};

export default VideoComments;


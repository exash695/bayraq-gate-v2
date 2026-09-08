import React, { useState, useEffect } from "react";
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
  db,
} from "../../lib/firebase";
import {
  Heart,
  MessageCircle,
  ThumbsUp,
  Send,
  MoreHorizontal,
  X,
  User,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Lock,
} from "lucide-react";
import { RenderTextWithTags } from "./RevealBlock";
import { pushSocialNotification } from "./SocialNotifications";

export interface PostCommentsSectionProps {
  post: any;
  userProfile: any;
  showToast: (msg: string, type?: "success" | "error") => void;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
  classmates?: { name: string }[];
}

export const PostCommentsSection: React.FC<PostCommentsSectionProps> = ({
  post,
  userProfile,
  showToast,
  onClose,
  currentUserId,
  currentUserName,
  classmates = [],
}: {
  post: any;
  userProfile: any;
  showToast: (msg: string, type?: "success" | "error") => void;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
  classmates?: { name: string }[];
}) => {
  const [comments, setComments] = useState<any[]>([]);
  const [reactionUsers, setReactionUsers] = useState<any[]>([]);
  const [selectedReactionFilter, setSelectedReactionFilter] = useState<
    string | null
  >(null);
  const [expandedReplies, setExpandedReplies] = useState<{
    [key: string]: boolean;
  }>({});
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [activeCommentReactionId, setActiveCommentReactionId] = useState<
    string | null
  >(null);
  const isLocked = post.isLocked || false;

  const [tagSearch, setTagSearch] = useState("");
  const [showTagMenuTarget, setShowTagMenuTarget] = useState<"comment" | null>(
    null,
  );
  const [tagCursorPos, setTagCursorPos] = useState(0);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCommentText(val);
    const cursor = e.target.selectionStart || 0;
    const textBeforeCursor = val.substring(0, cursor);
    const lastAtPos = textBeforeCursor.lastIndexOf("@");
    if (lastAtPos !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtPos + 1);
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setTagSearch(textAfterAt);
        setShowTagMenuTarget("comment");
        setTagCursorPos(lastAtPos);
        return;
      }
    }
    setShowTagMenuTarget(null);
  };

  const insertTag = (name: string) => {
    const before = commentText.substring(0, tagCursorPos);
    const searchLen = tagSearch.length;
    const after = commentText.substring(tagCursorPos + 1 + searchLen);
    const formattedName = name.replace(/\s+/g, "_");
    setCommentText(before + "@" + formattedName + " " + after);
    setShowTagMenuTarget(null);
  };

  useEffect(() => {
    const q = query(
      collection(db, "community_posts", post.id, "comments_list"),
      orderBy("timestamp", "asc"),
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setComments(list);
        setLoading(false);
      },
      (err) => {
        console.error("Comments subcollection error:", err);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [post.id]);

  useEffect(() => {
    const q = query(
      collection(db, "community_posts", post.id, "reactions_list"),
      orderBy("timestamp", "desc"),
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReactionUsers(list);
      },
      (err) => {
        console.error("Reactions subcollection error:", err);
      },
    );
    return () => unsubscribe();
  }, [post.id]);

  const handleReactToComment = async (commentId: string, sticker: string) => {
    try {
      const commentRef = doc(
        db,
        "community_posts",
        post.id,
        "comments_list",
        commentId,
      );
      await updateDoc(commentRef, {
        [`reactions.${sticker}`]: increment(1),
      });
      setActiveCommentReactionId(null);
    } catch (err) {
      console.error("Error reacting to comment:", err);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUserId) return;

    if (isLocked) {
      showToast("عذراً، التعليقات مغلقة لهذا المنشور من قبل الإدارة.", "error");
      return;
    }

    if (userProfile && userProfile?.canComment === false) {
      alert("تم تقييد صلاحية التعليق لديك من قبل الإدارة.");
      return;
    }

    const textToSubmit = commentText;
    setCommentText("");

    try {
      if (replyTo) {
        const commentRef = doc(
          db,
          "community_posts",
          post.id,
          "comments_list",
          replyTo.id,
        );
        await updateDoc(commentRef, {
          replies: arrayUnion({
            id: Date.now().toString(),
            userId: currentUserId,
            userName: currentUserName,
            userPhotoURL: userProfile?.photoURL || null,
            content: textToSubmit,
            timestamp: new Date().toISOString(),
          }),
        });
        setReplyTo(null);
        showToast("تمت إضافة الرد بنجاح!", "success");
      } else {
        await addDoc(
          collection(db, "community_posts", post.id, "comments_list"),
          {
            userId: currentUserId,
            userName: currentUserName,
            userPhotoURL: userProfile?.photoURL || null,
            content: textToSubmit,
            timestamp: serverTimestamp(),
          },
        );

        const postRef = doc(db, "community_posts", post.id);
        await updateDoc(postRef, {
          comments: increment(1),
        });

        if (post.userId !== currentUserId) {
          pushSocialNotification(
            post.userId,
            null,
            currentUserName,
            userProfile?.photoURL || null,
            "comment",
            post.content || "",
          );
        }

        const matches = textToSubmit.match(/@(\S+)/g);
        if (matches) {
          matches.forEach((m: string) => {
            const name = m.substring(1).replace(/_/g, " ");
            if (name !== currentUserName) {
              pushSocialNotification(
                null,
                name,
                currentUserName,
                userProfile?.photoURL || null,
                "mention_comment",
                textToSubmit,
              );
            }
          });
        }

        showToast("تمت إضافة التعليق بنجاح!", "success");
      }
    } catch (err) {
      console.error("Error adding comment/reply:", err);
      showToast("فشل إضافة التعليق", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#050A18] flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-300">
      {/* Header */}
      <div className="h-16 bg-[#101935] border-b border-white/10 flex items-center justify-between px-4 shrink-0">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <X size={20} className="text-white/80" />
        </button>
        <span className="text-white font-black">التعليقات والتفاعلات</span>
        <div className="w-10" />
      </div>

      {/* Reactions Overview Header */}
      {((post.reactions && Object.keys(post.reactions).length > 0) ||
        reactionUsers.length > 0) && (
        <div
          className="bg-[#101935]/80 border-b border-white/5 px-4 py-3 shrink-0"
          dir="rtl"
        >
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedReactionFilter(null)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0 transition-colors border ${selectedReactionFilter === null ? "bg-[#00E5FF]/20 border-[#00E5FF]/50 text-white" : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"}`}
            >
              <span className="text-xs font-bold">الكل</span>
            </button>
            {Object.entries(post.reactions || {}).map(([key, val]) => {
              if (val === 0) return null;
              const isSelected = selectedReactionFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedReactionFilter(key)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0 transition-colors border ${isSelected ? "bg-[#00E5FF]/20 border-[#00E5FF]/50" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                >
                  <span className="text-sm">{key}</span>
                  <span className="text-xs text-white/90 font-bold">
                    {val as number}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Area: Comments or Reacting Users */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {selectedReactionFilter ? (
          // View Reacting Users List
          <div className="space-y-3" dir="rtl">
            {reactionUsers
              .filter((u) => u.sticker === selectedReactionFilter)
              .map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 bg-white/[0.02] p-3 rounded-2xl border border-white/5 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-white/5 border border-white/10 flex items-center justify-center">
                    {u.photoURL ? (
                      <img
                        src={u.photoURL}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={20} className="text-white/40" />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="text-white font-bold text-sm block">
                      {u.name}
                    </span>
                  </div>
                  <div className="shrink-0 flex items-center justify-center w-8 h-8 bg-white/5 rounded-full border border-white/10 shadow-inner">
                    <span className="text-lg leading-none">{u.sticker}</span>
                  </div>
                </div>
              ))}
            {reactionUsers.filter((u) => u.sticker === selectedReactionFilter)
              .length === 0 && (
              <div className="text-center text-white/30 text-xs py-8">
                لا يوجد متفاعلين بهذا الملصق
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full text-white/30 text-xs font-bold">
            جاري تحميل التعليقات...
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/20">
            <MessageCircle size={40} className="mb-3 opacity-50" />
            <span className="text-sm font-black">لا توجد تعليقات بعد</span>
            <span className="text-xs">كن أول من يعلق! ✨</span>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-3 items-start text-right"
              dir="rtl"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-lg">
                {comment.userPhotoURL ? (
                  <img
                    src={comment.userPhotoURL}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={20} className="text-white/40" />
                )}
              </div>
              <div className="flex-1">
                <div className="bg-[#101935] rounded-2xl px-4 py-3 border border-white/5 shadow-md inline-block min-w-[60%] relative">
                  <div className="flex flex-col mb-1.5">
                    <span className="text-[#00E5FF] font-black text-xs">
                      {comment.userName}
                    </span>
                  </div>
                  <p className="text-white/90 text-[13px] leading-relaxed break-words whitespace-pre-wrap">
                    <RenderTextWithTags text={comment.content} />
                  </p>

                  {/* Inline comment reactions */}
                  {comment.reactions &&
                    Object.keys(comment.reactions).length > 0 && (
                      <div className="absolute -bottom-2 -left-2 flex items-center gap-1 bg-[#050A18] border border-white/10 px-1.5 py-0.5 rounded-full shadow-lg">
                        {Object.keys(comment.reactions).map((sticker) => (
                          <span key={sticker} className="text-xs">
                            {sticker}
                          </span>
                        ))}
                        <span className="text-[10px] text-white/50 font-bold ml-1">
                          {
                            Object.values(comment.reactions).reduce(
                              (a: any, b: any) => a + b,
                              0,
                            ) as number
                          }
                        </span>
                      </div>
                    )}
                </div>
                <div className="mt-1 mr-2 flex items-center gap-3 relative">
                  <span className="text-[10px] text-white/30 font-bold">
                    {comment.timestamp?.toDate
                      ? comment.timestamp
                          .toDate()
                          .toLocaleTimeString("ar-IQ", {
                            hour: "numeric",
                            minute: "2-digit",
                          })
                      : "الآن"}
                  </span>
                  {!isLocked && (
                    <>
                      <button
                        onClick={() =>
                          setReplyTo({ id: comment.id, name: comment.userName })
                        }
                        className="text-[10px] font-bold text-white/50 hover:text-white transition-colors cursor-pointer"
                      >
                        رد
                      </button>
                      <button
                        onClick={() =>
                          setActiveCommentReactionId(
                            activeCommentReactionId === comment.id
                              ? null
                              : comment.id,
                          )
                        }
                        className="text-[10px] font-bold text-white/50 hover:text-[#00E5FF] transition-colors cursor-pointer"
                      >
                        تفاعل
                      </button>
                    </>
                  )}

                  {/* Comment Reaction Popover */}
                  {activeCommentReactionId === comment.id && (
                    <div className="absolute top-full mt-1 right-0 z-50 flex items-center gap-1 bg-[#101935] border border-white/10 p-1.5 rounded-2xl shadow-xl">
                      {["❤️", "👍", "💡", "👏", "🔥"].map((sticker) => (
                        <button
                          key={sticker}
                          onClick={() =>
                            handleReactToComment(comment.id, sticker)
                          }
                          className="text-lg hover:scale-125 transition-transform"
                        >
                          {sticker}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-2">
                    {!expandedReplies[comment.id] ? (
                      <button
                        onClick={() =>
                          setExpandedReplies((prev) => ({
                            ...prev,
                            [comment.id]: true,
                          }))
                        }
                        className="text-white/50 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <div className="w-6 h-[1px] bg-white/20"></div>
                        {comment.replies.length === 1
                          ? "عرض رد واحد"
                          : `عرض ${comment.replies.length} ردود`}
                      </button>
                    ) : (
                      <div className="space-y-3 mt-3">
                        {comment.replies.map((reply: any) => (
                          <div
                            key={reply.id}
                            className="flex gap-2 items-start"
                          >
                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                              {reply.userPhotoURL ? (
                                <img
                                  src={reply.userPhotoURL}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User size={16} className="text-white/40" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="bg-[#0c1427] rounded-2xl px-3 py-2 border border-white/5 shadow-inner inline-block">
                                <span className="text-[#00E5FF] font-black text-[11px] block">
                                  {reply.userName}
                                </span>
                                <p className="text-white/80 text-xs leading-relaxed mt-0.5 whitespace-pre-wrap">
                                  <RenderTextWithTags text={reply.content} />
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() =>
                            setExpandedReplies((prev) => ({
                              ...prev,
                              [comment.id]: false,
                            }))
                          }
                          className="text-white/40 hover:text-white text-[10px] font-bold flex items-center gap-1 transition-colors mt-1"
                        >
                          إخفاء الردود
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isLocked ? (
        <div
          className="bg-[#101935] border-t border-rose-500/20 p-6 shrink-0 flex items-center justify-center"
          dir="rtl"
        >
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs bg-rose-500/10 px-4 py-2 rounded-full border border-rose-500/20">
            <Lock size={14} />
            <span>لقد قامت الإدارة بقفل التعليقات على هذا المنشور.</span>
          </div>
        </div>
      ) : (
        /* Write Comment Form */
        <div
          className="bg-[#101935] border-t border-white/10 p-4 shrink-0"
          dir="rtl"
        >
          {replyTo && (
            <div className="max-w-2xl mx-auto mb-2 flex items-center justify-between bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-xs text-white/60">
                الرد على{" "}
                <span className="font-bold text-[#00E5FF]">{replyTo.name}</span>
              </span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-white/40 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          )}
          <form
            onSubmit={handleSendComment}
            className="flex gap-3 items-center max-w-2xl mx-auto relative"
          >
            <input
              type="text"
              value={commentText}
              onChange={handleTextareaChange}
              placeholder={replyTo ? "اكتب ردك..." : "اكتب تعليقاً..."}
              className="flex-1 bg-black/40 border border-white/10 rounded-full pl-12 pr-5 py-3.5 text-white text-sm focus:outline-none focus:border-[#00E5FF]/50 transition-colors placeholder:text-white/30 font-bold"
            />
            {showTagMenuTarget === "comment" &&
              classmates.map((c) => c.name).filter((n) => n.includes(tagSearch))
                .length > 0 && (
                <div className="absolute bottom-full left-0 mb-2 max-h-40 overflow-y-auto bg-[#101935] border border-blue-500/30 rounded-xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-[60] w-64 text-right">
                  {classmates
                    .filter((c) => c.name.includes(tagSearch))
                    .map((c, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => insertTag(c.name)}
                        className="w-full text-right px-4 py-2 text-white/90 hover:bg-blue-500/20 font-bold border-b border-white/5 last:border-0 hover:text-blue-400 text-sm cursor-pointer"
                      >
                        {c.name}
                      </button>
                    ))}
                </div>
              )}
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="absolute left-1.5 top-1.5 bottom-1.5 w-10 disabled:opacity-50 disabled:bg-white/5 bg-[#00E5FF] hover:bg-cyan-400 text-black rounded-full flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <Send size={16} className="mr-0.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};


export default PostCommentsSection;

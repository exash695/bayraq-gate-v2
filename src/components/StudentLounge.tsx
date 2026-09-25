import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Image as ImageIcon, Smile, MoreVertical, Coffee, Search, Check, CheckCheck, User, MessageCircle, ArrowRight, Lock, Paperclip, FileText, Video, Headphones, Loader2, Mic, AlertTriangle, Maximize2, ExternalLink, Download, Film } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, doc, serverTimestamp, onSnapshot, limit } from '../lib/firebase';
import { realtimeManager } from '../lib/realtimeManager';
import { staffService } from '../services/staffService';

interface StudentLoungeProps {
  onClose: () => void;
  userProfile: any;
  schoolId: string;
  grade: string | null;
  isTeacher: boolean;
  teacherData?: any;
  initialSelectedUser?: any;
  isLocked?: boolean;
}

interface LoungeMessage {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
  userRole: string; // 'student', 'teacher', 'admin'
  schoolId: string;
  createdAt: any;
  timestamp?: any;
  imageUrl?: string;
  recipientId?: string;
  read?: boolean;
}

export const StudentLounge = React.forwardRef<HTMLDivElement, StudentLoungeProps>(({
  onClose,
  userProfile,
  schoolId,
  grade,
  isTeacher,
  teacherData,
  initialSelectedUser,
  isLocked
}, ref) => {
  const [messages, setMessages] = useState<LoungeMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [knights, setKnights] = useState<any[]>([]); 
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [isGeneralChat, setIsGeneralChat] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<{ file: File; previewUrl: string; type: 'image' | 'video' | 'audio' | 'file' } | null>(null);
  const [fullMediaPreview, setFullMediaPreview] = useState<{ url: string; type: 'image' | 'video' | 'audio' | 'file'; name?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'knights' | 'teachers'>(initialSelectedUser ? 'chat' : 'knights');
  const [selectedChatUser, setSelectedChatUser] = useState<any>(initialSelectedUser || null);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentUserUid = auth.currentUser?.uid;
  // Grade Normalizer: Matches grades across all sections (e.g., "أول ابتدائي", "اول ابتدائي ب", "اول ابتدائي - أ")
  const getGradeCore = (g?: string | null): string => {
    if (!g) return "";
    let norm = g
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/^ال/, "")
      .trim();
    norm = norm.replace(/[-/–]/g, " ");
    norm = norm.replace(/\s+(ا|ب|ج|د|ه|و|أ|A|B|C|D)$/i, "");
    return norm.replace(/\s+/g, " ").trim();
  };

  const isGradeMatch = (userGrade?: string | null, targetGrade?: string | null): boolean => {
    if (isTeacher || !targetGrade) return true;
    const coreTarget = getGradeCore(targetGrade);
    const coreUser = getGradeCore(userGrade);
    if (!coreTarget || !coreUser) return true;
    return coreTarget === coreUser || coreUser.includes(coreTarget) || coreTarget.includes(coreUser);
  };

  
  const formatMessageTime = (msg: any): string => {
    try {
      const raw = msg.createdAt || msg.timestamp || msg.created_at;
      if (!raw) {
        return new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
      }
      if (typeof raw?.toDate === 'function') {
        return raw.toDate().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
      }
      if (raw?.seconds) {
        return new Date(raw.seconds * 1000).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
      }
      const parsedDate = new Date(raw);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
      }
      return new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
    }
  };

  const currentChatRoomId = isGeneralChat 
    ? schoolId 
    : (selectedChatUser && currentUserUid ? [currentUserUid, selectedChatUser.id].sort().join('_') : null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load teachers
  useEffect(() => {
    if (!schoolId) return;
    const unsub = staffService.subscribeToTeachers(schoolId, (teachers) => {
      setTeachersList(teachers || []);
    });
    return () => unsub();
  }, [schoolId]);

  // Load knights (PostgreSQL)
  useEffect(() => {
    if (!schoolId) return;
    
    const fetchKnights = async () => {
      try {
        const res = await fetch(`/api/users?schoolId=${schoolId}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          let users = data.users.map((u: any) => ({
            id: u.id,
            name: u.name || u.fullName || 'مستخدم',
            photo: u.photo || u.photoURL || u.avatar || null,
            role: u.role || 'student',
            grade: u.grade || 'غير محدد',
            schoolId: u.schoolId || 'unassigned',
            lastActive: u.lastActive || u.lastLogin
          }));
          
          // Filter out current user and non-students
          users = users.filter((u: any) => u.id !== currentUserUid && u.role === 'student');
          
          // Filter strictly to student's own grade (including all sections of that grade)
          if (!isTeacher && grade && grade !== 'غير محدد' && grade !== 'all') {
            users = users.filter((u: any) => isGradeMatch(u.grade, grade));
          }

          setKnights(users);
        }
      } catch (err) {
        console.warn("Notice: error fetching knights:", err);
      }
    };

    fetchKnights();
    const unsub = realtimeManager.subscribe('users', () => {
      fetchKnights();
    });
    return () => unsub();
  }, [schoolId, currentUserUid, grade, isTeacher]);


  // Track unread messages per user (PostgreSQL)
  useEffect(() => {
    if (!currentUserUid) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch(`/api/lounge-messages/unread/${currentUserUid}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.counts) {
            setUnreadCounts(data.counts);
          }
        }
      } catch (e) {
        console.warn("Notice: error fetching unread lounge count:", e);
      }
    };
    fetchUnread();
    const unsubUnread = realtimeManager.subscribe('lounge_messages', () => {
      fetchUnread();
    });
    return () => unsubUnread();
  }, [currentUserUid]);

  // Load private messages (PostgreSQL)
  useEffect(() => {
    if (!currentChatRoomId) {
      setMessages([]);
      return;
    }
    
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/lounge-messages/${currentChatRoomId}`);
        const data = await res.json();
        if (data.success) {
           const msgs = data.messages.map((m: any) => ({
             ...m,
             userId: m.userId || m.user_id,
             userName: m.userName || m.user_name,
             userPhoto: m.userPhoto || m.user_photo,
             userRole: m.userRole || m.user_role,
             recipientId: m.recipientId || m.recipient_id,
             schoolId: m.schoolId || m.school_id,
             createdAt: m.timestamp || m.created_at || m.createdAt || new Date(),
             timestamp: m.timestamp || m.created_at || m.createdAt || new Date()
           }));
           setMessages(msgs.slice(-100));

           // Mark as read if it's a private chat
           if (!isGeneralChat && selectedChatUser && currentUserUid) {
             await fetch(`/api/lounge-messages/read/${currentChatRoomId}/${currentUserUid}`, { method: 'PATCH' });
           }
        }
      } catch (e) {
        console.error("Error loading lounge messages", e);
      }
    };
    
    fetchMessages();
    const unsubMessages = realtimeManager.subscribe('lounge_messages', () => {
      fetchMessages();
    });
    return () => unsubMessages();
  }, [currentChatRoomId, isGeneralChat, selectedChatUser, currentUserUid]);



  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined' && !MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4'; // Safari fallback
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
           const ext = mimeType === 'audio/mp4' ? 'mp4' : 'webm';
           const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
           const audioFile = new File([audioBlob], `voice_message.${ext}`, { type: mimeType });
           await uploadVoiceMessage(audioFile);
        }
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setUploadError('لا يمكن الوصول إلى الميكروفون. يرجى التحقق من الصلاحيات واستخدام متصفح حديث.');
      setTimeout(() => setUploadError(null), 5000);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
     if (mediaRecorderRef.current && isRecording) {
       mediaRecorderRef.current.onstop = () => {
           mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
           audioChunksRef.current = [];
       };
       mediaRecorderRef.current.stop();
       setIsRecording(false);
     }
  };

  const uploadVoiceMessage = async (file: File) => {
    if (!auth.currentUser || !currentChatRoomId) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to upload');
      
      const fileUrl = uploadData.publicUrl || uploadData.url;
      const currentName = isTeacher ? (teacherData?.name || auth.currentUser.displayName) : (userProfile?.name || userProfile?.fullName || 'طالب');
      const currentPhoto = isTeacher ? teacherData?.photoURL : userProfile?.photoURL;
      const currentRole = isTeacher ? 'teacher' : (userProfile?.role === 'admin' ? 'admin' : 'student');
      
      await fetch('/api/lounge-messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        text: 'بصمة صوتية',
        userId: auth.currentUser.uid,
        userName: currentName || 'مستخدم',
        userPhoto: currentPhoto || null,
        userRole: currentRole,
        schoolId: currentChatRoomId,
        realSchoolId: schoolId,
        recipientId: isGeneralChat ? 'all' : selectedChatUser?.id,
        imageUrl: fileUrl, 
        read: false,
        grade: grade || 'all',
      }) });
    } catch (err) {
      console.error("Upload error", err);
      setUploadError("فشل إرسال البصمة الصوتية. يرجى المحاولة مرة أخرى.");
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isLocked && !isTeacher && userProfile?.role !== 'admin' && userProfile?.role !== 'manager' && userProfile?.role !== 'super_admin') {
      setUploadError("الدردشة مقفلة حالياً من قبل الإدارة.");
      setTimeout(() => setUploadError(null), 5000);
      return;
    }

    // Determine type
    const type = file.type;
    let mediaType: 'image' | 'video' | 'audio' | 'file' = 'file';
    if (type.startsWith('image/')) mediaType = 'image';
    else if (type.startsWith('video/')) mediaType = 'video';
    else if (type.startsWith('audio/')) mediaType = 'audio';

    const previewUrl = URL.createObjectURL(file);
    setPendingFile({
      file,
      previewUrl,
      type: mediaType
    });
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const cancelPendingFile = () => {
    if (pendingFile?.previewUrl) {
      URL.revokeObjectURL(pendingFile.previewUrl);
    }
    setPendingFile(null);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!newMessage.trim() && !pendingFile) || !auth.currentUser || !currentChatRoomId) return;

    if (isLocked && !isTeacher && userProfile?.role !== 'admin' && userProfile?.role !== 'manager' && userProfile?.role !== 'super_admin') {
      setUploadError("الدردشة مقفلة حالياً من قبل الإدارة.");
      setTimeout(() => setUploadError(null), 5000);
      return;
    }

    const currentName = isTeacher ? (teacherData?.name || auth.currentUser.displayName) : (userProfile?.name || userProfile?.fullName || 'طالب');
    const currentPhoto = isTeacher ? teacherData?.photoURL : userProfile?.photoURL;
    const currentRole = isTeacher ? 'teacher' : (userProfile?.role === 'admin' ? 'admin' : 'student');
    const msgText = newMessage.trim();

    try {
      if (pendingFile) {
        setIsUploading(true);
        const fileToUpload = pendingFile.file;
        const fileKind = pendingFile.type;
        
        // Clean up preview URL
        if (pendingFile.previewUrl) URL.revokeObjectURL(pendingFile.previewUrl);
        setPendingFile(null);
        setNewMessage('');

        const formData = new FormData();
        formData.append('file', fileToUpload);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'فشل رفع الملف');

        const fileUrl = uploadData.publicUrl || uploadData.url;

        let typeText = 'مرفق';
        if (fileKind === 'image') typeText = 'صورة';
        else if (fileKind === 'video') typeText = 'فيديو';
        else if (fileKind === 'audio') typeText = 'مقطع صوتي';
        else typeText = 'ملف';

        await fetch('/api/lounge-messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: msgText || typeText,
            userId: auth.currentUser.uid,
            userName: currentName || 'مستخدم',
            userPhoto: currentPhoto || null,
            userRole: currentRole,
            schoolId: currentChatRoomId,
            realSchoolId: schoolId,
            recipientId: isGeneralChat ? 'all' : selectedChatUser?.id,
            imageUrl: fileUrl,
            read: false,
            grade: grade || 'all',
          })
        });
      } else {
        setNewMessage(''); // optimistic clear
        await fetch('/api/lounge-messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: msgText,
            userId: auth.currentUser.uid,
            userName: currentName || 'مستخدم',
            userPhoto: currentPhoto || null,
            userRole: currentRole,
            schoolId: currentChatRoomId,
            realSchoolId: schoolId,
            recipientId: isGeneralChat ? 'all' : selectedChatUser?.id,
            read: false,
            grade: grade || 'all',
          })
        });
      }
    } catch (err: any) {
      console.error("Error sending message", err);
      setUploadError(err.message || "حدث خطأ أثناء الإرسال. يرجى المحاولة مجدداً.");
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed inset-0 bg-[#050A18] z-[9999] flex flex-col overflow-hidden" dir="rtl"
    >
      {/* Header */}
      <div className="h-16 px-4 flex justify-between items-center bg-[#0D142A]/80 backdrop-blur-xl shrink-0 z-20">
        <div className="flex items-center gap-3">
          {activeTab === 'chat' ? (
            <button 
              onClick={() => {
                setActiveTab('knights');
                setSelectedChatUser(null);
                setIsGeneralChat(false);
              }}
              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/70"
            >
               <ArrowRight size={20} />
            </button>
          ) : (
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 relative">
              <Coffee size={20} className="text-amber-400" />
              <div className="absolute 0 top-0 left-0 w-3 h-3 bg-green-500 border-2 border-[#0D142A] rounded-full"></div>
            </div>
          )}
          
          <div>
             {activeTab === 'chat' ? (
                 <>
                   <h2 className="text-sm font-black text-white leading-tight">
                     {isGeneralChat ? 'دردشة المجلس العامة' : selectedChatUser?.name}
                   </h2>
                   <p className="text-[#00E5FF] text-[10px] font-bold">
                     {isGeneralChat ? 'غرفة تجمع كل الفرسان' : 'متصل الآن'}
                   </p>
                 </>
             ) : (
                 <>
                   <h2 className="text-lg font-black text-white leading-tight">المجلس</h2>
                   <p className="text-white/40 text-[10px] font-bold">
                       {knights.length} من الأبطال النشطين
                   </p>
                 </>
             )}
          </div>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/10 shadow-lg"
        >
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 bg-[#0D142A] shrink-0">
        <button 
          onClick={() => setActiveTab('knights')}
          className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'knights' ? 'border-amber-400 text-amber-400' : 'border-transparent text-white/50 hover:text-white/80'}`}
        >
          الفرسان
        </button>
        {!isTeacher && (
          <button 
            onClick={() => setActiveTab('teachers')}
            className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'teachers' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-white/50 hover:text-white/80'}`}
          >
            أساتذتي
          </button>
        )}
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'chat' ? 'border-[#00E5FF] text-[#00E5FF]' : 'border-transparent text-white/50 hover:text-white/80'}`}
        >
          الدردشة
        </button>
      </div>
      
      {/* Content Area */}
      {activeTab === 'knights' && (
          <div className="flex-1 overflow-y-auto px-4 py-6 bg-[#050A18] flex flex-col gap-2">
              <div className="mb-4 relative">
                 <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن فرسان (بالاسم)..." 
                    className="w-full bg-[#1A233A] text-white text-sm rounded-xl px-4 py-3 pr-10 border border-white/10 outline-none focus:border-amber-400 focus:bg-[#0D142A] transition-all"
                 />
                 <Search size={18} className="absolute right-3 top-3.5 text-white/40" />
              </div>

              {/* General Chat Room Item */}
              <div 
                onClick={() => {
                  setIsGeneralChat(true);
                  setSelectedChatUser(null);
                  setActiveTab('chat');
                }}
                className="flex items-center justify-between p-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-2xl cursor-pointer transition-all group mb-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                    <Coffee size={20} className="text-white" />
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-sm text-white font-black">غرفة المجلس العامة</span>
                    <span className="text-[10px] text-amber-400/80 font-bold">دردشة جماعية لكل المدرسة</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <MessageCircle size={16} />
                </div>
              </div>
              
              {(() => {
                // Merge knights with users who have unread messages but might be offline
                const allInterestedUsers = [...knights];
                
                const filteredKnights = allInterestedUsers.filter(k => {
                  const matchesSearch = k.name.includes(searchQuery);
                  const matchesGrade = isTeacher || !grade || isGradeMatch(k.grade, grade);
                  return matchesSearch && matchesGrade;
                });

                return filteredKnights.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-50 grayscale mt-10">
                        <User size={48} className="text-white/20 mb-4" />
                        <p className="text-white/40 text-sm font-bold">لا يوجد فرسان نشطين في صفك حالياً</p>
                    </div>
                ) : (
                    filteredKnights.map((user) => (
                        <div 
                          key={user.id} 
                        onClick={() => {
                          setSelectedChatUser(user);
                          setActiveTab('chat');
                        }}
                        className="flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/5 border border-white/5 rounded-2xl cursor-pointer transition-colors group"
                      >
                          <div className="flex items-center gap-3">
                              <div className="relative">
                                  <div className={`w-11 h-11 rounded-full border border-white/10 overflow-hidden ${user.role === 'teacher' ? 'ring-1 ring-amber-400/50' : ''}`}>
                                      {user.photo ? (
                                         <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                                      ) : (
                                         <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                             <User size={18} className="text-white/30" />
                                         </div>
                                      )}
                                  </div>
                                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#050A18] rounded-full"></div>
                                  {unreadCounts[user.id] > 0 && (
                                     <div className="absolute -top-1 -left-1 bg-red-600 rounded-full min-w-[16px] h-[16px] px-1 flex items-center justify-center shadow-lg border-2 border-[#050A18]">
                                        <span className="text-[9px] font-black text-white">{unreadCounts[user.id]}</span>
                                     </div>
                                  )}
                              </div>
                              <div className="flex flex-col text-right">
                                  <span className="text-[13px] text-white/90 font-bold">{user.name}</span>
                                  <span className={`text-[9px] font-bold ${user.role === 'teacher' ? 'text-amber-400' : (user.role === 'admin' ? 'text-blue-400' : 'text-white/40')}`}>
                                      {user.role === 'teacher' ? 'إشراف' : (user.role === 'admin' ? 'إدارة' : 'طالب')}
                                  </span>
                              </div>
                          </div>
                          <button 
                            className="w-10 h-10 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center opacity-50 group-hover:opacity-100 transition-all shrink-0 ml-1"
                          >
                            <MessageCircle size={18} />
                          </button>
                      </div>
                  ))
              );
              })()}
          </div>
      )}

      {activeTab === 'teachers' && !isTeacher && (
          <div className="flex-1 overflow-y-auto px-4 py-6 bg-[#050A18] flex flex-col gap-2">
              <div className="mb-4 relative">
                 <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن أستاذ..." 
                    className="w-full bg-[#1A233A] text-white text-sm rounded-xl px-4 py-3 pr-10 border border-white/10 outline-none focus:border-emerald-400 focus:bg-[#0D142A] transition-all"
                 />
                 <Search size={18} className="absolute right-3 top-3.5 text-white/40" />
              </div>
              
              {(() => {
                const teacherMatch = (t: any) => {
                   if (isTeacher || !grade || grade === 'غير محدد') return true;
                   const tClasses = Array.isArray(t.classes) ? t.classes : [];
                   const tGrade = t.grade || '';
                   if (tClasses.includes(grade) || tClasses.some((c: string) => isGradeMatch(c, grade))) return true;
                   if (tGrade === grade || isGradeMatch(tGrade, grade)) return true;
                   return false;
                };
                const filteredTeachers = teachersList.filter(t => t.name?.includes(searchQuery) && t.role === 'TEACHER' && teacherMatch(t));

                return filteredTeachers.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-50 grayscale mt-10">
                        <User size={48} className="text-white/20 mb-4" />
                        <p className="text-white/40 text-sm font-bold">لا يوجد أساتذة حالياً</p>
                    </div>
                ) : (
                    filteredTeachers.map((teacher) => (
                        <div 
                          key={teacher.id} 
                        onClick={() => {
                          setSelectedChatUser({...teacher, role: 'teacher'});
                          setActiveTab('chat');
                        }}
                        className="flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/5 border border-white/5 rounded-2xl cursor-pointer transition-colors group"
                      >
                          <div className="flex items-center gap-3">
                              <div className="relative">
                                  <div className="w-11 h-11 rounded-full border border-white/10 overflow-hidden ring-1 ring-emerald-400/50">
                                      {teacher.photo || teacher.photoURL ? (
                                         <img src={teacher.photo || teacher.photoURL} alt={teacher.name} className="w-full h-full object-cover" />
                                      ) : (
                                         <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                             <User size={18} className="text-white/30" />
                                         </div>
                                      )}
                                  </div>
                                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#050A18] rounded-full"></div>
                                  {unreadCounts[teacher.id] > 0 && (
                                     <div className="absolute -top-1 -left-1 bg-red-600 rounded-full min-w-[16px] h-[16px] px-1 flex items-center justify-center shadow-lg border-2 border-[#050A18]">
                                        <span className="text-[9px] font-black text-white">{unreadCounts[teacher.id]}</span>
                                     </div>
                                  )}
                              </div>
                              <div className="flex flex-col text-right">
                                  <span className="text-[13px] text-white/90 font-bold">{teacher.name}</span>
                                  <span className="text-[9px] font-bold text-emerald-400">
                                      {teacher.subject || 'مدرس'}
                                  </span>
                              </div>
                          </div>
                          <button 
                            className="w-10 h-10 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center opacity-50 group-hover:opacity-100 transition-all shrink-0 ml-1"
                          >
                            <MessageCircle size={18} />
                          </button>
                      </div>
                  ))
              );
              })()}
          </div>
      )}

      {activeTab === 'chat' && (
        <>
          {selectedChatUser ? (
             <>
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto px-4 py-6 space-y-4 no-scrollbar bg-[#050A18] flex flex-col"
                  style={{ backgroundImage: 'radial-gradient(circle at center, rgba(255,214,0,0.02) 0%, transparent 70%)' }}
                >
                    {messages.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-50 grayscale">
                            <MessageCircle size={48} className="text-white/20 mb-4" />
                            <p className="text-white/40 text-sm font-bold">بادر بإرسال أول رسالة!</p>
                        </div>
                    ) : (
                        <>
                        {messages.map((msg, index) => {
                            const isMe = msg.userId === currentUserUid;
                            const showAvatar = !isMe && (index === 0 || messages[index - 1].userId !== msg.userId);
                            const isTeacherMode = msg.userRole === 'teacher';
                            const isAdminMode = msg.userRole === 'admin';
                            
                            return (
                              <motion.div 
                                  key={msg.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${!showAvatar && !isMe ? 'mt-1' : 'mt-4'}`}
                              >
                                  {!isMe && (
                                      <div className="w-8 shrink-0 ml-2 flex flex-col justify-end pb-1">
                                          {showAvatar && (
                                              <div className={`w-8 h-8 rounded-full overflow-hidden border ${isTeacherMode ? 'border-amber-500/50' : (isAdminMode ? 'border-blue-500/50' : 'border-white/10')}`}>
                                                  {msg.userPhoto ? (
                                                      <img src={msg.userPhoto} alt={msg.userName} className="w-full h-full object-cover" />
                                                  ) : (
                                                      <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                                          <User size={14} className="text-white/30" />
                                                      </div>
                                                  )}
                                              </div>
                                          )}
                                      </div>
                                  )}
                                  
                                  <div className={`flex flex-col max-w-[85%] ${isMe ? 'items-end' : 'items-start'}`}>
                                      <div className={`px-4 py-2.5 rounded-2xl relative group ${
                                          isMe 
                                            ? 'bg-blue-600 text-white rounded-br-sm shadow-[0_4px_15px_rgba(37,99,235,0.2)]' 
                                            : 'bg-[#1A233A] text-white/90 rounded-bl-sm border border-white/5 shadow-sm'
                                      }`}>
                                          {msg.imageUrl && (
                                              <div className="mb-2">
                                                  {msg.text === 'بصمة صوتية' || msg.imageUrl.match(/\.(mp3|wav|ogg)$/i) ? (
                                                      <audio src={msg.imageUrl} controls className="max-w-[200px] sm:max-w-[250px]" />
                                                  ) : msg.imageUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? (
                                                      <div 
                                                          onClick={() => setFullMediaPreview({ url: msg.imageUrl!, type: 'image' })} 
                                                          className="relative group/media cursor-pointer rounded-xl overflow-hidden border border-white/10 hover:opacity-95 transition-all max-w-[220px] sm:max-w-xs"
                                                      >
                                                          <img src={msg.imageUrl} alt="attachment" className="w-full h-auto object-cover max-h-72" />
                                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                              <div className="bg-black/60 p-2 rounded-full text-white backdrop-blur-sm shadow-md">
                                                                  <Maximize2 size={18} />
                                                              </div>
                                                          </div>
                                                      </div>
                                                  ) : msg.imageUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                                                      <div className="relative group/media rounded-xl overflow-hidden border border-white/10 max-w-[240px] sm:max-w-xs">
                                                          <video src={msg.imageUrl} controls className="w-full h-auto max-h-72" />
                                                          <button
                                                              type="button"
                                                              onClick={() => setFullMediaPreview({ url: msg.imageUrl!, type: 'video' })}
                                                              title="عرض بالكامل"
                                                              className="absolute top-2 left-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg backdrop-blur-sm transition-colors"
                                                          >
                                                              <Maximize2 size={16} />
                                                          </button>
                                                      </div>
                                                  ) : (
                                                      <div 
                                                          onClick={() => setFullMediaPreview({ url: msg.imageUrl!, type: 'file', name: msg.imageUrl!.split('/').pop() })}
                                                          className="flex items-center gap-3 bg-black/25 hover:bg-black/40 p-2.5 rounded-xl border border-white/10 cursor-pointer transition-all group/file"
                                                      >
                                                          <div className={`p-2 rounded-lg ${isMe ? "bg-white/15 text-white" : "bg-blue-500/20 text-blue-400"}`}>
                                                              <FileText size={22} />
                                                          </div>
                                                          <div className="flex-1 min-w-0 text-right">
                                                              <p className="text-xs font-medium text-white/90 truncate max-w-[150px] sm:max-w-[180px]">
                                                                  {msg.imageUrl.split('/').pop() || 'مستند مرفق'}
                                                              </p>
                                                              <span className="text-[10px] text-white/50 group-hover/file:text-white/80 transition-colors">
                                                                  اضغط لفتح الملف بالكامل
                                                              </span>
                                                          </div>
                                                          <Maximize2 size={16} className="text-white/40 group-hover/file:text-white transition-colors shrink-0" />
                                                      </div>
                                                  )}
                                              </div>
                                          )}
                                          {msg.text && msg.text !== 'مرفق' && msg.text !== 'صورة' && msg.text !== 'فيديو' && msg.text !== 'مقطع صوتي' && msg.text !== 'ملف' && msg.text !== 'بصمة صوتية' && (
                                              <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                                          )}
                                          
                                          {/* Timestamp */}
                                          <div className={`text-[9px] mt-1 flex items-center gap-1 ${isMe ? 'text-blue-200/70 justify-end' : 'text-white/40 justify-start'}`}>
                                              <span>{formatMessageTime(msg)}</span>
                                              {isMe && <CheckCheck size={12} className="text-blue-300" />}
                                          </div>
                                      </div>
                                  </div>
                              </motion.div>
                            );
                        })}
                        
                        {(isLocked && !isTeacher && userProfile?.role !== 'admin' && userProfile?.role !== 'manager' && userProfile?.role !== 'super_admin') && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="w-full flex justify-center my-6"
                            >
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2">
                                    <Lock size={14} />
                                    <span>تم إغلاق المجلس من قبل الإدارة</span>
                                </div>
                            </motion.div>
                        )}
                        </>
                    )}
                </div>

                {/* Input Area */}
                <div className="h-auto min-h-[70px] bg-[#0D142A]/90 backdrop-blur-xl border-t border-white/10 px-4 py-3 shrink-0 z-20 flex items-end gap-3 pb-8 md:pb-4 flex-col">
                    {uploadError && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold px-4 py-2 rounded-xl flex items-center justify-between mb-2"
                        >
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={14} />
                                <span>{uploadError}</span>
                            </div>
                            <button onClick={() => setUploadError(null)} className="text-red-400/50 hover:text-red-400 transition-colors">
                                <X size={14} />
                            </button>
                        </motion.div>
                    )}
                    {(isLocked && !isTeacher && userProfile?.role !== 'admin' && userProfile?.role !== 'manager' && userProfile?.role !== 'super_admin') ? (
                        <div className="w-full flex items-center justify-center bg-red-500/10 rounded-3xl border border-red-500/20 p-3 text-red-400 text-sm font-bold gap-2">
                            <Lock size={16} />
                            المجلس (الدردشة) مغلق حالياً من قبل الإدارة
                        </div>
                    ) : (
                    <>
                    {/* Pending file preview */}
                    {pendingFile && (
                        <div className="w-full bg-[#1A233A] border border-blue-500/30 rounded-2xl p-2.5 flex items-center justify-between gap-3 shadow-lg">
                            <div className="flex items-center gap-3 overflow-hidden">
                                {pendingFile.type === "image" ? (
                                    <img src={pendingFile.previewUrl} alt="معاينة" className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0" />
                                ) : pendingFile.type === "video" ? (
                                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                                        <Film size={20} />
                                    </div>
                                ) : pendingFile.type === "audio" ? (
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                                        <Mic size={20} />
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                                        <FileText size={20} />
                                    </div>
                                )}
                                <div className="flex flex-col min-w-0 text-right">
                                    <span className="text-white text-xs font-bold truncate max-w-[200px] sm:max-w-[280px]">
                                        {pendingFile.file.name}
                                    </span>
                                    <span className="text-white/40 text-[11px]">
                                        {(pendingFile.file.size / 1024 / 1024).toFixed(2)} ميجابايت • اضغط إرسال لنشر الملف
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={cancelPendingFile}
                                className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white/50 flex items-center justify-center transition-colors shrink-0"
                                title="إلغاء المرفق"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSendMessage} className="w-full flex items-end gap-2 bg-[#050A18] rounded-3xl border border-white/10 p-1 pl-4">
                        
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                        <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading || isRecording}
                            className="w-10 h-10 rounded-full hover:bg-white/5 text-white/50 hover:text-white flex items-center justify-center transition-all shrink-0 mb-0.5"
                        >
                            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
                        </button>
                        
                        {isRecording ? (
                             <div className="flex-1 flex items-center gap-3 bg-red-500/10 px-4 rounded-xl py-2 animate-pulse border border-red-500/20 max-h-12">
                                 <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                 <span className="text-red-400 text-sm font-bold flex-1">جاري التسجيل...</span>
                                 <button type="button" onClick={cancelRecording} className="text-white/50 hover:text-red-400 p-1">
                                    <X size={18} />
                                 </button>
                             </div>
                        ) : (
                            <textarea 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                dir="auto"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="اكتب رسالتك..."
                                className="w-full bg-transparent border-none outline-none text-white text-sm py-2.5 max-h-32 min-h-[40px] resize-none no-scrollbar font-sans"
                                rows={1}
                            />
                        )}
                        
                        {newMessage.trim() || pendingFile || isUploading ? (
                            <button 
                                type="submit"
                                disabled={(!newMessage.trim() && !pendingFile) || isUploading}
                                className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-white/30 text-white flex items-center justify-center transition-all shrink-0 shadow-lg mb-0.5"
                            >
                                <div dir="ltr" className="flex items-center justify-center mr-0.5 mt-0.5" style={{ transform: 'rotate(225deg)' }}>
                                    <Send size={18} />
                                </div>
                            </button>
                        ) : (
                            <button 
                                type="button"
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={isUploading}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 shadow-lg mb-0.5 ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                            >
                                {isRecording ? <Send size={18} /> : <Mic size={18} />}
                            </button>
                        )}
                    </form>
                    </>
                    )}
                </div>
             </>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-start px-4 pt-10 bg-[#050A18] overflow-y-auto">
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 shrink-0">
                  <MessageCircle size={32} className="text-blue-400" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2 shrink-0">محادثة خاصة</h3>
                <p className="text-white/50 text-sm text-center mb-6 max-w-xs shrink-0">يرجى اختيار فارس من قائمة الفرسان النشطين لبدء محادثة خاصة ومعزولة.</p>
                
                {Object.keys(unreadCounts).filter(id => unreadCounts[id] > 0).length > 0 && (
                   <div className="w-full max-w-md mt-4 flex flex-col gap-2">
                       <h4 className="text-white/70 font-bold text-sm mb-2 text-right">رسائل غير مقروءة:</h4>
                       {knights.filter(k => unreadCounts[k.id] > 0).map(user => (
                          <div 
                              key={user.id} 
                              onClick={() => {
                                setSelectedChatUser(user);
                                setActiveTab('chat');
                              }}
                              className="flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/5 border border-white/5 rounded-2xl cursor-pointer transition-colors group"
                          >
                              <div className="flex items-center gap-3">
                                  <div className="relative">
                                      <div className={`w-11 h-11 rounded-full border border-white/10 overflow-hidden ${user.role === 'teacher' ? 'ring-1 ring-amber-400/50' : ''}`}>
                                          {user.photo ? (
                                             <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                                          ) : (
                                             <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                                 <User size={18} className="text-white/30" />
                                             </div>
                                          )}
                                      </div>
                                      <div className="absolute -top-1 -left-1 bg-red-600 rounded-full min-w-[16px] h-[16px] px-1 flex items-center justify-center shadow-lg border-2 border-[#050A18]">
                                          <span className="text-[9px] font-black text-white">{unreadCounts[user.id]}</span>
                                      </div>
                                  </div>
                                  <div className="flex flex-col text-right">
                                      <span className="text-[13px] text-white/90 font-bold">{user.name}</span>
                                      <span className="text-[9px] font-bold text-white/40">اضغط للرد</span>
                                  </div>
                              </div>
                          </div>
                       ))}
                   </div>
                )}
                
                <button 
                  onClick={() => setActiveTab('knights')}
                  className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-sm transition-colors shrink-0"
                >
                  العودة لقائمة الفرسان
                </button>
             </div>
          )}
        </>
      )}

      {/* Fullscreen Media Viewer Modal */}
      <AnimatePresence>
        {fullMediaPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-md flex flex-col justify-between p-4"
            onClick={() => setFullMediaPreview(null)}
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between z-10 w-full max-w-5xl mx-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 text-white">
                <span className="text-sm font-bold truncate max-w-xs md:max-w-md">
                  {fullMediaPreview.name || (fullMediaPreview.type === "image" ? "صورة" : fullMediaPreview.type === "video" ? "فيديو" : "ملف")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={fullMediaPreview.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-bold"
                  title="تحميل الملف"
                >
                  <Download size={18} />
                  <span className="hidden sm:inline">تحميل</span>
                </a>
                <a
                  href={fullMediaPreview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-bold"
                  title="فتح في نافذة جديدة"
                >
                  <ExternalLink size={18} />
                  <span className="hidden sm:inline">فتح في علامة تبويب</span>
                </a>
                <button
                  type="button"
                  onClick={() => setFullMediaPreview(null)}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-red-500/80 text-white transition-colors"
                  title="إغلاق"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Media Content Area */}
            <div 
              className="flex-1 flex items-center justify-center p-2 md:p-6 w-full max-w-5xl mx-auto overflow-hidden" 
              onClick={(e) => e.stopPropagation()}
            >
              {fullMediaPreview.type === "image" ? (
                <img
                  src={fullMediaPreview.url}
                  alt="عرض بالكامل"
                  className="max-h-[82vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
                />
              ) : fullMediaPreview.type === "video" ? (
                <video
                  src={fullMediaPreview.url}
                  controls
                  autoPlay
                  className="max-h-[82vh] max-w-full rounded-2xl shadow-2xl border border-white/10 bg-black"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-[#0D142A] border border-white/10 rounded-3xl max-w-md w-full text-center shadow-2xl">
                  <div className="w-20 h-20 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 border border-blue-500/30">
                    <FileText size={40} />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2 truncate max-w-xs">
                    {fullMediaPreview.name || fullMediaPreview.url.split("/").pop() || "ملف مرفق"}
                  </h3>
                  <p className="text-white/50 text-sm mb-6">
                    يمكنك استعراض هذا الملف بالكامل أو تحميله مباشرة على جهازك.
                  </p>
                  <div className="flex items-center gap-3 w-full">
                    <a
                      href={fullMediaPreview.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg"
                    >
                      <ExternalLink size={18} />
                      فتح في نافذة كاملة
                    </a>
                    <a
                      href={fullMediaPreview.url}
                      download
                      className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <Download size={18} />
                      تحميل الملف
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom info */}
            <div className="text-center text-white/40 text-xs py-1" onClick={(e) => e.stopPropagation()}>
              انقر خارج النافذة أو زر الإغلاق للعودة إلى المجلس
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
StudentLounge.displayName = 'StudentLounge';

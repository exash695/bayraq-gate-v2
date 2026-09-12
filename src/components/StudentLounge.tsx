import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Image as ImageIcon, Smile, MoreVertical, Coffee, Search, Check, CheckCheck, User, MessageCircle, ArrowRight, Lock } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, doc, serverTimestamp, onSnapshot, limit } from '@/src/lib/firebase';
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
  const [knights, setKnights] = useState<any[]>([]); 
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [isGeneralChat, setIsGeneralChat] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'knights' | 'teachers'>(initialSelectedUser ? 'chat' : 'knights');
  const [selectedChatUser, setSelectedChatUser] = useState<any>(initialSelectedUser || null);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentUserUid = auth.currentUser?.uid;
  
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
          
          // Filter out current user
          users = users.filter((u: any) => u.id !== currentUserUid);
          setKnights(users);
        }
      } catch (err) {
        console.error("Error fetching knights", err);
      }
    };

    fetchKnights();
    const unsub = realtimeManager.subscribe('users', () => {
      fetchKnights();
    });
    return () => unsub();
  }, [schoolId, currentUserUid]);


  // Track unread messages per user (PostgreSQL)
  useEffect(() => {
    if (!currentUserUid) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch(`/api/lounge-messages/unread/${currentUserUid}`);
        const data = await res.json();
        if (data.success) {
          setUnreadCounts(data.counts);
        }
      } catch (e) {
        console.error("Error fetching unread", e);
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
             timestamp: { seconds: new Date(m.timestamp).getTime() / 1000 }
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

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !auth.currentUser || !currentChatRoomId) return;

    if (isLocked && !isTeacher && userProfile?.role !== 'admin' && userProfile?.role !== 'manager' && userProfile?.role !== 'super_admin') {
      alert("الدردشة مقفلة حالياً من قبل الإدارة.");
      return;
    }

    try {
      const currentName = isTeacher ? (teacherData?.name || auth.currentUser.displayName) : (userProfile?.name || userProfile?.fullName || 'طالب');
      const currentPhoto = isTeacher ? teacherData?.photoURL : userProfile?.photoURL;
      const currentRole = isTeacher ? 'teacher' : (userProfile?.role === 'admin' ? 'admin' : 'student');
      
      const msgText = newMessage.trim();
      setNewMessage(''); // optimistic clear
      
      await fetch('/api/lounge-messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
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
      })});
    } catch (err) {
      console.error("Error sending message", err);
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
                const currentGrade = grade || 'غير محدد';
                const gradeMatch = (k: any) => {
                   if (isTeacher || !grade) return true;
                   const kg = k.grade || 'غير محدد';
                   if (kg === 'غير محدد' || kg === 'all') return true;
                   return kg === currentGrade || kg.includes(currentGrade) || currentGrade.includes(kg);
                };
                
                // Merge knights with users who have unread messages but might be offline
                const allInterestedUsers = [...knights];
                // We ensure all users in unreadCounts are visible if they are students
                // (Teachers are in the other tab)
                
                const filteredKnights = allInterestedUsers.filter(k => k.name.includes(searchQuery) && gradeMatch(k));

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
                const filteredTeachers = teachersList.filter(t => t.name?.includes(searchQuery) && t.role === 'TEACHER');

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
                                          <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                                          
                                          {/* Timestamp */}
                                          <div className={`text-[9px] mt-1 flex items-center gap-1 ${isMe ? 'text-blue-200/70 justify-end' : 'text-white/30 justify-start'}`}>
                                              {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) : 'الآن'}
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
                <div className="h-auto min-h-[70px] bg-[#0D142A]/90 backdrop-blur-xl border-t border-white/10 px-4 py-3 shrink-0 z-20 flex items-end gap-3 pb-8 md:pb-4">
                    {(isLocked && !isTeacher && userProfile?.role !== 'admin' && userProfile?.role !== 'manager' && userProfile?.role !== 'super_admin') ? (
                        <div className="w-full flex items-center justify-center bg-red-500/10 rounded-3xl border border-red-500/20 p-3 text-red-400 text-sm font-bold gap-2">
                            <Lock size={16} />
                            المجلس (الدردشة) مغلق حالياً من قبل الإدارة
                        </div>
                    ) : (
                    <form onSubmit={handleSendMessage} className="w-full flex items-end gap-2 bg-[#050A18] rounded-3xl border border-white/10 p-1 pl-4">
                        
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
                        
                        <button 
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-white/30 text-white flex items-center justify-center transition-all shrink-0 shadow-lg mb-0.5"
                        >
                            <div dir="ltr" className="flex items-center justify-center mr-0.5 mt-0.5" style={{ transform: 'rotate(225deg)' }}>
                                <Send size={18} />
                            </div>
                        </button>
                    </form>
                    )}
                </div>
             </>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center px-4 bg-[#050A18]">
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle size={32} className="text-blue-400" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">محادثة خاصة</h3>
                <p className="text-white/50 text-sm text-center mb-6 max-w-xs">يرجى اختيار فارس من قائمة الفرسان النشطين لبدء محادثة خاصة ومعزولة.</p>
                <button 
                  onClick={() => setActiveTab('knights')}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-sm transition-colors"
                >
                  العودة لقائمة الفرسان
                </button>
             </div>
          )}
        </>
      )}
    </motion.div>
  );
});
StudentLounge.displayName = 'StudentLounge';

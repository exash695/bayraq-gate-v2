import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Image as ImageIcon, Smile, MoreVertical, Coffee, Search, Check, CheckCheck, User, MessageCircle, ArrowRight, Lock, Paperclip, FileText, Video, Headphones, Loader2, Mic, AlertTriangle, Maximize2, ExternalLink, Download, Film, Layers, ChevronDown, Filter } from 'lucide-react';
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
  isParent?: boolean;
  teacherData?: any;
  teacherAssignedSections?: { name: string; grade: string; studentCount: number; listId?: string }[];
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
  isParent,
  teacherData,
  teacherAssignedSections,
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
  const [parents, setParents] = useState<any[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [academicLists, setAcademicLists] = useState<any[]>([]);
  const [recentChatsTimestamps, setRecentChatsTimestamps] = useState<Record<string, string>>({});
  const [recentChatsList, setRecentChatsList] = useState<any[]>([]);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [isGeneralChat, setIsGeneralChat] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<{ file: File; previewUrl: string; type: 'image' | 'video' | 'audio' | 'file' } | null>(null);
  const [fullMediaPreview, setFullMediaPreview] = useState<{ url: string; type: 'image' | 'video' | 'audio' | 'file'; name?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'knights' | 'teachers' | 'parents'>(initialSelectedUser ? 'chat' : (isTeacher ? 'knights' : 'teachers'));
  const [selectedChatUser, setSelectedChatUser] = useState<any>(initialSelectedUser || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [isSectionMenuOpen, setIsSectionMenuOpen] = useState(false);
  const sectionDropdownRef = useRef<HTMLDivElement>(null);
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

  const normalizeArabic = (s?: string | null): string => {
    if (!s) return "";
    return s
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/[-/–]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const isGradeMatch = (userGrade?: string | null, targetGrade?: string | null): boolean => {
    if (!targetGrade || targetGrade === 'all' || targetGrade === 'الكل') return true;
    if (!userGrade) return false;
    const coreTarget = getGradeCore(targetGrade);
    const coreUser = getGradeCore(userGrade);
    if (!coreTarget || !coreUser) return false;
    return coreTarget === coreUser || coreUser.includes(coreTarget) || coreTarget.includes(coreUser);
  };

  // Find the current teacher in the Staff & Teachers department (الكادر والموظفين)
  const currentStaffTeacher = useMemo(() => {
    if (!isTeacher) return null;
    const uid = userProfile?.id || userProfile?.uid || auth.currentUser?.uid;
    const email = userProfile?.email?.toLowerCase().trim();
    const name = (userProfile?.name || teacherData?.name || '').trim();
    
    return teachersList.find((t: any) => 
      (t.id && (t.id === uid || t.userId === uid)) ||
      (email && t.email && t.email.toLowerCase().trim() === email) ||
      (name && t.name && (t.name.trim() === name || t.name.includes(name) || name.includes(t.name)))
    ) || teacherData || null;
  }, [isTeacher, userProfile, teacherData, teachersList]);

  // Compute available sections list strictly for the teacher (from Staff section + Control section)
  const availableSections = useMemo(() => {
    const list: string[] = [];

    // Helper to safely add section string
    const addSection = (secName?: string | null) => {
      if (!secName || typeof secName !== 'string') return;
      const clean = secName.trim();
      if (clean && !list.some(item => normalizeArabic(item) === normalizeArabic(clean))) {
        list.push(clean);
      }
    };

    if (isTeacher) {
      // 1. From passed teacherAssignedSections props (لوحة التحكم)
      if (Array.isArray(teacherAssignedSections) && teacherAssignedSections.length > 0) {
        teacherAssignedSections.forEach(s => addSection(s?.name));
      }

      // 2. From currentStaffTeacher (قسم الكادر والموظفين)
      if (Array.isArray(currentStaffTeacher?.classes)) {
        currentStaffTeacher.classes.forEach((c: any) => {
          const name = typeof c === 'string' ? c : (c.name || c.grade || c.title);
          addSection(name);
        });
      }

      // 3. From currentStaffTeacher.assignedGrades or assignedSections
      if (Array.isArray(currentStaffTeacher?.assignedGrades)) {
        currentStaffTeacher.assignedGrades.forEach((g: any) => {
          const name = typeof g === 'string' ? g : (g.name || g.grade);
          addSection(name);
        });
      }

      // 4. From teacherData.classes (قسم التحكم)
      if (Array.isArray(teacherData?.classes)) {
        teacherData.classes.forEach((c: any) => {
          const name = typeof c === 'string' ? c : (c.name || c.grade || c.title);
          addSection(name);
        });
      }

      // 5. From userProfile.classes
      if (Array.isArray(userProfile?.classes)) {
        userProfile.classes.forEach((c: any) => {
          const name = typeof c === 'string' ? c : (c.name || c.grade);
          addSection(name);
        });
      }

      // 6. Single fallback grade if no classes list
      if (list.length === 0) {
        if (currentStaffTeacher?.grade) addSection(currentStaffTeacher.grade);
        else if (teacherData?.grade) addSection(teacherData.grade);
        else if (userProfile?.grade) addSection(userProfile.grade);
        else if (grade) addSection(grade);
      }

      return list;
    }

    // Admin view: all active academic lists
    if (userProfile?.role === 'admin') {
      academicLists.forEach((al: any) => {
        if (al.name) addSection(al.name);
      });
      if (list.length === 0) {
        knights.forEach(k => {
          if (k.grade && k.grade !== 'غير محدد') addSection(k.grade);
        });
      }
      return list;
    }

    return [];
  }, [isTeacher, userProfile, teacherAssignedSections, currentStaffTeacher, teacherData, grade, academicLists, knights]);

  // Precise section matching taking into account specific section letter (أ، ب، ج، د) and academic list membership
  const isSectionMatch = (userGrade?: string | null, targetSection?: string | null, studentObj?: any): boolean => {
    if (!targetSection || targetSection === 'all' || targetSection === 'الكل') return true;
    
    // 1. Direct match in academicLists if studentObj exists
    if (studentObj && academicLists && academicLists.length > 0) {
      const targetNorm = normalizeArabic(targetSection);
      const matchedList = academicLists.find((al: any) => normalizeArabic(al.name) === targetNorm);
      if (matchedList && Array.isArray(matchedList.students)) {
        const isInList = matchedList.students.some((s: any) => 
          (s.id && s.id === studentObj.id) ||
          (s.code && (s.code === studentObj.code || s.code === studentObj.studentCode || s.code === studentObj.id)) ||
          (s.student && (s.student === studentObj.code || s.student === studentObj.id)) ||
          (s.name && studentObj.name && s.name.trim() === studentObj.name.trim())
        );
        if (isInList) return true;
      }
    }

    if (!userGrade) return false;
    const cleanUser = userGrade.trim();
    const cleanTarget = targetSection.trim();
    if (cleanUser === cleanTarget) return true;

    const normUser = normalizeArabic(cleanUser);
    const normTarget = normalizeArabic(cleanTarget);
    if (normUser === normTarget) return true;

    // Extract section letter (أ, ب, ج, د)
    const getSectionLetter = (str: string) => {
      const m = str.match(/(?:شعبة|قسم)?\s*([أإآابجدeEaAbBcC])$/i) || str.match(/\s+([أإآابجدeEaAbBcC])\b/i);
      return m ? m[1].replace(/[أإآ]/g, 'ا').toLowerCase() : null;
    };

    const targetLetter = getSectionLetter(cleanTarget);
    const userLetter = getSectionLetter(cleanUser);

    if (targetLetter && userLetter) {
      return targetLetter === userLetter && getGradeCore(cleanUser) === getGradeCore(cleanTarget);
    }

    if (targetLetter && !userLetter) {
      return false;
    }

    return getGradeCore(cleanUser) === getGradeCore(cleanTarget);
  };

  // Accurate student count per section
  const getSectionStudentCount = (secName: string): number => {
    const targetNorm = normalizeArabic(secName);
    const matchedList = academicLists.find((al: any) => normalizeArabic(al.name) === targetNorm);
    if (matchedList && Array.isArray(matchedList.students) && matchedList.students.length > 0) {
      return matchedList.students.length;
    }
    return knights.filter(k => isSectionMatch(k.grade, secName, k)).length;
  };

  // Handle outside click for section dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sectionDropdownRef.current && !sectionDropdownRef.current.contains(event.target as Node)) {
        setIsSectionMenuOpen(false);
      }
    };
    if (isSectionMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSectionMenuOpen]);

  
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

  // Load academic lists for accurate class student mappings and counts
  useEffect(() => {
    if (!schoolId) return;
    const fetchLists = async () => {
      try {
        const res = await fetch(`/api/academic-lists?schoolId=${schoolId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && (Array.isArray(data.lists) || Array.isArray(data))) {
            setAcademicLists(data.lists || data || []);
          }
        }
      } catch (err) {
        console.warn("Notice: error fetching academic lists in Lounge:", err);
      }
    };
    fetchLists();
    const unsub = realtimeManager.subscribe('academic_lists', () => {
      fetchLists();
    });
    return () => unsub();
  }, [schoolId]);

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
    
    const fetchUsers = async () => {
      try {
        const res = await fetch(`/api/users?schoolId=${schoolId}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          const allUsers = data.users.map((u: any) => ({
            id: u.id,
            name: u.name || u.fullName || 'مستخدم',
            photo: u.photo || u.photoURL || u.avatar || null,
            role: u.role || 'student',
            grade: u.grade || u.studentGrade || u.linkedGrade || 'غير محدد',
            schoolId: u.schoolId || 'unassigned',
            lastActive: u.lastActive || u.lastLogin,
            code: u.code || u.studentCode,
            studentCode: u.studentCode || u.code,
            studentId: u.studentId || u.linkedStudentId || null,
            parentCode: u.parentCode,
            childCode: u.childCode || u.parentCode,
            classes: u.classes || u.assignedGrades || []
          }));
          
          // Filter students
          let studentKnights = allUsers.filter((u: any) => u.id !== currentUserUid && u.role === 'student');
          if (!isTeacher && !isParent && grade && grade !== 'غير محدد' && grade !== 'all') {
            studentKnights = studentKnights.filter((u: any) => isGradeMatch(u.grade, grade));
          }
          setKnights(studentKnights);

          // Filter parents (only for teachers/admins)
          if (isTeacher || userProfile?.role === 'admin') {
            const parentUsers = allUsers.filter((u: any) => u.role === 'parent');
            setParents(parentUsers);
          }
        }
      } catch (err) {
        console.warn("Notice: error fetching users:", err);
      }
    };

    fetchUsers();
    const unsub = realtimeManager.subscribe('users', () => {
      fetchUsers();
    });
    return () => unsub();
  }, [schoolId, currentUserUid, grade, isTeacher, isParent]);

  // Memoized filtered knights based on selected section and search
  const filteredKnights = useMemo(() => {
    return knights.filter(k => {
      const matchesSearch = searchQuery.trim() ? (k.name || '').toLowerCase().includes(searchQuery.toLowerCase()) : true;
      if (!matchesSearch) return false;

      if (selectedSection !== 'all') {
        return isSectionMatch(k.grade, selectedSection, k);
      }

      const matchesGrade = isTeacher || !grade || isGradeMatch(k.grade, grade);
      return matchesGrade;
    });
  }, [knights, searchQuery, selectedSection, isTeacher, grade, academicLists]);

  // Memoized filtered parents based on selected section and search
  const filteredParents = useMemo(() => {
    return parents.filter(p => {
      const matchesSearch = searchQuery.trim() ? (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) : true;
      if (!matchesSearch) return false;

      if (selectedSection !== 'all') {
        const parentGradeMatch = p.grade && isSectionMatch(p.grade, selectedSection);
        if (parentGradeMatch) return true;

        if (p.studentId || p.studentCode || p.childCode) {
          const matchedStudent = knights.find(k => 
            (p.studentId && k.id === p.studentId) ||
            (p.studentCode && (k.code === p.studentCode || k.studentCode === p.studentCode)) ||
            (p.childCode && (k.code === p.childCode || k.parentCode === p.childCode))
          );
          if (matchedStudent && isSectionMatch(matchedStudent.grade, selectedSection, matchedStudent)) return true;
        }

        return false;
      }

      return true;
    });
  }, [parents, searchQuery, selectedSection, knights, academicLists]);


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

  // Load recent chats timestamps to sort conversations (Messenger style)
  useEffect(() => {
    if (!currentUserUid) return;
    const fetchRecentChats = async () => {
      try {
        const res = await fetch(`/api/lounge-messages/recent-chats/${currentUserUid}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            if (data.latestTimestamps) {
              setRecentChatsTimestamps(data.latestTimestamps);
            }
            if (Array.isArray(data.recentChats)) {
              setRecentChatsList(data.recentChats);
            }
          }
        }
      } catch (e) {
        console.warn("Notice: error fetching recent chats:", e);
      }
    };
    fetchRecentChats();
    const unsubRecent = realtimeManager.subscribe('lounge_messages', () => {
      fetchRecentChats();
    });
    return () => unsubRecent();
  }, [currentUserUid]);

  const allLoungeUsers = useMemo(() => {
    const map = new Map<string, any>();
    knights.forEach(k => map.set(k.id, { ...k, role: k.role || 'student' }));
    parents.forEach(p => map.set(p.id, { ...p, role: 'parent' }));
    teachersList.forEach(t => map.set(t.id, { ...t, role: 'teacher' }));
    return map;
  }, [knights, parents, teachersList]);

  // Formatted recent conversations log list
  const displayRecentConversations = useMemo(() => {
    const chatUsersMap = new Map<string, any>();

    // 1. From recentChatsList (with last messages)
    recentChatsList.forEach(rc => {
      if (!rc?.otherId || rc.otherId === currentUserUid) return;
      const matchedUser = allLoungeUsers.get(rc.otherId) || {
        id: rc.otherId,
        name: rc.senderName || 'مستخدم',
        role: 'student',
        grade: 'غير محدد'
      };
      chatUsersMap.set(rc.otherId, {
        ...matchedUser,
        lastMessage: rc.lastMessage || 'رسالة جديدة',
        timestamp: rc.timestamp,
        read: rc.read
      });
    });

    // 2. From unreadCounts or recentChatsTimestamps
    Object.keys(recentChatsTimestamps).forEach(uid => {
      if (!chatUsersMap.has(uid) && uid !== currentUserUid) {
        const matchedUser = allLoungeUsers.get(uid);
        if (matchedUser) {
          chatUsersMap.set(uid, {
            ...matchedUser,
            lastMessage: unreadCounts[uid] > 0 ? `${unreadCounts[uid]} رسائل غير مقروءة` : 'محادثة سابقة',
            timestamp: recentChatsTimestamps[uid]
          });
        }
      }
    });

    // 3. Include any user with unread messages
    Object.keys(unreadCounts).forEach(uid => {
      if (unreadCounts[uid] > 0 && !chatUsersMap.has(uid) && uid !== currentUserUid) {
        const matchedUser = allLoungeUsers.get(uid);
        if (matchedUser) {
          chatUsersMap.set(uid, {
            ...matchedUser,
            lastMessage: `${unreadCounts[uid]} رسالة جديدة`,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    const list = Array.from(chatUsersMap.values());
    list.sort((a, b) => {
      const tsA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tsB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tsB - tsA;
    });

    if (chatSearchQuery.trim()) {
      const q = chatSearchQuery.toLowerCase().trim();
      return list.filter(c => (c.name || '').toLowerCase().includes(q) || (c.lastMessage || '').toLowerCase().includes(q));
    }

    return list;
  }, [recentChatsList, recentChatsTimestamps, unreadCounts, allLoungeUsers, chatSearchQuery, currentUserUid]);

  const sortByRecentChat = (a: any, b: any) => {
    const tsA = recentChatsTimestamps[a.id] || '';
    const tsB = recentChatsTimestamps[b.id] || '';
    if (tsA && tsB) {
      return tsB.localeCompare(tsA); // Descending (latest first)
    }
    if (tsA) return -1;
    if (tsB) return 1;
    return (a.name || '').localeCompare(b.name || '', 'ar-IQ');
  };

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
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        setUploadError('المتصفح لا يدعم تسجيل الصوت أو يتطلب اتصالاً آمناً.');
        setTimeout(() => setUploadError(null), 5000);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : undefined);
      
      const mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        try {
          if (audioChunksRef.current.length > 0) {
             const finalType = mimeType || mediaRecorder.mimeType || 'audio/webm';
             const ext = finalType.includes('mp4') ? 'mp4' : 'webm';
             const audioBlob = new Blob(audioChunksRef.current, { type: finalType });
             const audioFile = new File([audioBlob], `voice_message.${ext}`, { type: finalType });
             await uploadVoiceMessage(audioFile);
          }
        } catch (blobErr) {
          console.error("Error finalizing audio blob:", blobErr);
        } finally {
          stream.getTracks().forEach(track => track.stop());
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      const errName = err?.name || "";
      if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
        setUploadError("تم رفض إذن الميكروفون. يرجى تفعيل الصلاحية في إعدادات جهازك.");
      } else {
        setUploadError('لا يمكن الوصول إلى الميكروفون حالياً. يرجى التحقق من التوصيل والإذن.');
      }
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
      const currentName = isTeacher ? (teacherData?.name || auth.currentUser.displayName) : (userProfile?.name || userProfile?.fullName || (isParent ? 'ولي أمر' : 'طالب'));
      const currentPhoto = isTeacher ? teacherData?.photoURL : userProfile?.photoURL;
      const currentRole = isTeacher ? 'teacher' : (isParent ? 'parent' : (userProfile?.role === 'admin' ? 'admin' : 'student'));
      
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

    const currentName = isTeacher ? (teacherData?.name || auth.currentUser.displayName) : (userProfile?.name || userProfile?.fullName || (isParent ? 'ولي أمر' : 'طالب'));
    const currentPhoto = isTeacher ? teacherData?.photoURL : userProfile?.photoURL;
    const currentRole = isTeacher ? 'teacher' : (isParent ? 'parent' : (userProfile?.role === 'admin' ? 'admin' : 'student'));
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
          {activeTab === 'chat' && (selectedChatUser || isGeneralChat) ? (
            <button 
              onClick={() => {
                setSelectedChatUser(null);
                setIsGeneralChat(false);
              }}
              title="العودة لسجل المحادثات"
              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/70 cursor-pointer"
            >
               <ArrowRight size={20} />
            </button>
          ) : (
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 relative">
              <Coffee size={20} className="text-amber-400" />
              <div className="absolute top-0 left-0 w-3 h-3 bg-green-500 border-2 border-[#0D142A] rounded-full"></div>
            </div>
          )}
          
          <div>
             {activeTab === 'chat' ? (
                 selectedChatUser || isGeneralChat ? (
                   <>
                     <h2 className="text-sm font-black text-white leading-tight">
                       {isGeneralChat ? 'دردشة المجلس العامة' : selectedChatUser?.name}
                     </h2>
                     <div className="flex items-center gap-1.5 mt-0.5">
                       <span className="text-[#00E5FF] text-[10px] font-bold">
                         {isGeneralChat ? 'غرفة تجمع كل الفرسان' : (selectedChatUser?.role === 'parent' ? 'ولي أمر' : (selectedChatUser?.role === 'teacher' ? 'أستاذ' : 'طالب'))}
                       </span>
                       {selectedChatUser?.grade && selectedChatUser.grade !== 'غير محدد' && (
                         <span className="text-[9px] text-amber-300/80 bg-white/5 px-1.5 py-0.2 rounded font-mono">
                           {selectedChatUser.grade}
                         </span>
                       )}
                     </div>
                   </>
                 ) : (
                   <>
                     <h2 className="text-lg font-black text-white leading-tight">سجل المحادثات</h2>
                     <p className="text-[#00E5FF] text-[10px] font-bold">
                       {displayRecentConversations.length > 0 ? `${displayRecentConversations.length} محادثة نشطة` : 'لا توجد محادثات سابقة'}
                     </p>
                   </>
                 )
             ) : activeTab === 'parents' ? (
                 <>
                   <h2 className="text-lg font-black text-white leading-tight">أولياء الأمور</h2>
                   <p className="text-white/40 text-[10px] font-bold">
                       {selectedSection !== 'all' ? `${filteredParents.length} ولي أمر في (${selectedSection})` : `${parents.length} من أولياء الأمور`}
                   </p>
                 </>
             ) : activeTab === 'teachers' ? (
                 <>
                   <h2 className="text-lg font-black text-white leading-tight">{isParent ? 'الكادر التدريسي' : 'الأساتذة'}</h2>
                   <p className="text-white/40 text-[10px] font-bold">
                       {teachersList.length} أستاذ متاح
                   </p>
                 </>
             ) : (
                 <>
                   <h2 className="text-lg font-black text-white leading-tight">المجلس</h2>
                   <p className="text-white/40 text-[10px] font-bold">
                       {selectedSection !== 'all' ? `${filteredKnights.length} بطل في (${selectedSection})` : `${knights.length} من الأبطال النشطين`}
                   </p>
                 </>
             )}
          </div>
        </div>

        {/* Action Buttons: Section Switcher + Close Button */}
        <div className="flex items-center gap-2">
          {/* زر التبديل بين الشعب للأستاذ والإدارة بجانب علامة X */}
          {(isTeacher || userProfile?.role === 'admin') && activeTab !== 'chat' && (
            <div className="relative" ref={sectionDropdownRef}>
              <button
                type="button"
                onClick={() => setIsSectionMenuOpen(!isSectionMenuOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm active:scale-95 ${
                  selectedSection !== 'all'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/40'
                    : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                }`}
                title="التبديل بين الشعب المكلفة"
              >
                <Layers size={14} className={selectedSection !== 'all' ? 'text-amber-400' : 'text-white/50'} />
                <span className="max-w-[100px] truncate text-[11px] font-black">
                  {selectedSection === 'all' ? 'الشعب' : selectedSection}
                </span>
                <ChevronDown size={13} className={`text-white/40 transition-transform duration-200 ${isSectionMenuOpen ? 'rotate-180 text-amber-400' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isSectionMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-2 w-56 bg-[#090F1E] border border-white/15 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-xl divide-y divide-white/5"
                    dir="rtl"
                  >
                    <div className="px-2.5 py-1.5 mb-1 text-[10px] font-black text-amber-400 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Filter size={11} />
                        <span>تصفية حسب الشعبة</span>
                      </span>
                      <span className="text-white/40 font-mono text-[9px] bg-white/5 px-1.5 py-0.5 rounded">
                        {availableSections.length} شعبة
                      </span>
                    </div>

                    <div className="max-h-60 overflow-y-auto no-scrollbar py-1 space-y-1">
                      {/* خيار جميع الشعب */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSection('all');
                          setIsSectionMenuOpen(false);
                        }}
                        className={`w-full text-right px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                          selectedSection === 'all'
                            ? 'bg-amber-500/20 text-amber-300 font-black border border-amber-500/30'
                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${selectedSection === 'all' ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'bg-white/20'}`}></span>
                          <span>جميع الشعب</span>
                        </div>
                        <span className="text-[10px] text-white/40 font-mono bg-white/5 px-1.5 py-0.5 rounded-md">
                          {knights.length}
                        </span>
                      </button>

                      {/* قائمة الشعب المكلفة والمتاحة */}
                      {availableSections.length > 0 ? (
                        availableSections.map((secName) => {
                          const count = getSectionStudentCount(secName);
                          const isCurrent = selectedSection === secName;
                          return (
                            <button
                              key={secName}
                              type="button"
                              onClick={() => {
                                setSelectedSection(secName);
                                setIsSectionMenuOpen(false);
                              }}
                              className={`w-full text-right px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                                isCurrent
                                  ? 'bg-amber-500/20 text-amber-300 font-black border border-amber-500/30'
                                  : 'text-white/70 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'bg-white/20'}`}></span>
                                <span className="truncate">{secName}</span>
                              </div>
                              <span className="text-[10px] text-white/40 font-mono bg-white/5 px-1.5 py-0.5 rounded-md shrink-0 mr-1">
                                {count}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-3 py-2 text-[11px] text-white/40 text-center">
                          لا توجد شعب محددة
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* زر الإغلاق X */}
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/10 shadow-lg"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 bg-[#0D142A] shrink-0">
        {!isParent && (
          <button 
            onClick={() => setActiveTab('knights')}
            className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'knights' ? 'border-amber-400 text-amber-400' : 'border-transparent text-white/50 hover:text-white/80'}`}
          >
            الفرسان
          </button>
        )}
        {(isTeacher || userProfile?.role === 'admin') && (
           <button 
            onClick={() => setActiveTab('parents')}
            className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'parents' ? 'border-blue-400 text-blue-400' : 'border-transparent text-white/50 hover:text-white/80'}`}
          >
            أولياء الأمور
          </button>
        )}
        {!isTeacher && (
          <button 
            onClick={() => setActiveTab('teachers')}
            className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'teachers' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-white/50 hover:text-white/80'}`}
          >
            {isParent ? 'الكادر التدريسي' : 'أساتذتي'}
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
              <div className="mb-2 relative">
                 <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن فرسان (بالاسم)..." 
                    className="w-full bg-[#1A233A] text-white text-sm rounded-xl px-4 py-3 pr-10 border border-white/10 outline-none focus:border-amber-400 focus:bg-[#0D142A] transition-all"
                 />
                 <Search size={18} className="absolute right-3 top-3.5 text-white/40" />
              </div>

              {/* Active Section Filter Notice */}
              {selectedSection !== 'all' && (
                <div className="flex items-center justify-between px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-1 text-xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <Filter size={13} className="text-amber-400" />
                    <span>عرض فرسان شعبة: <strong className="text-amber-200 font-black">{selectedSection}</strong> ({filteredKnights.length})</span>
                  </div>
                  <button
                    onClick={() => setSelectedSection('all')}
                    className="text-[10px] text-white/60 hover:text-white bg-white/5 hover:bg-white/15 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                  >
                    عرض كل الشعب
                  </button>
                </div>
              )}

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
              
              {filteredKnights.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-50 grayscale mt-10">
                      <User size={48} className="text-white/20 mb-4" />
                      <p className="text-white/40 text-sm font-bold">
                        {selectedSection !== 'all' ? `لا يوجد فرسان مسجلين في شعبة ${selectedSection}` : 'لا يوجد فرسان نشطين حالياً'}
                      </p>
                  </div>
              ) : (
                  [...filteredKnights].sort(sortByRecentChat).map((user) => (
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
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[9px] font-bold ${user.role === 'teacher' ? 'text-amber-400' : (user.role === 'admin' ? 'text-blue-400' : 'text-white/40')}`}>
                                      {user.role === 'teacher' ? 'إشراف' : (user.role === 'admin' ? 'إدارة' : 'طالب')}
                                  </span>
                                  {user.grade && user.grade !== 'غير محدد' && (
                                    <span className="text-[8px] bg-white/5 text-amber-300/80 px-1.5 py-0.2 rounded font-mono">
                                      {user.grade}
                                    </span>
                                  )}
                                </div>
                            </div>
                        </div>
                        <button 
                          className="w-10 h-10 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center opacity-50 group-hover:opacity-100 transition-all shrink-0 ml-1 cursor-pointer"
                        >
                          <MessageCircle size={18} />
                        </button>
                    </div>
                ))
            )}
          </div>
      )}

      {activeTab === 'parents' && (isTeacher || userProfile?.role === 'admin') && (
          <div className="flex-1 overflow-y-auto px-4 py-6 bg-[#050A18] flex flex-col gap-2">
              <div className="mb-2 relative">
                 <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن ولي أمر..." 
                    className="w-full bg-[#1A233A] text-white text-sm rounded-xl px-4 py-3 pr-10 border border-white/10 outline-none focus:border-blue-400 focus:bg-[#0D142A] transition-all"
                 />
                 <Search size={18} className="absolute right-3 top-3.5 text-white/40" />
              </div>

              {/* Active Section Filter Notice */}
              {selectedSection !== 'all' && (
                <div className="flex items-center justify-between px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-1 text-xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-blue-300 font-bold">
                    <Filter size={13} className="text-blue-400" />
                    <span>عرض أولياء أمور شعبة: <strong className="text-blue-200 font-black">{selectedSection}</strong> ({filteredParents.length})</span>
                  </div>
                  <button
                    onClick={() => setSelectedSection('all')}
                    className="text-[10px] text-white/60 hover:text-white bg-white/5 hover:bg-white/15 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                  >
                    عرض كل الشعب
                  </button>
                </div>
              )}
              
              {filteredParents.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-50 grayscale mt-10">
                      <User size={48} className="text-white/20 mb-4" />
                      <p className="text-white/40 text-sm font-bold">
                        {selectedSection !== 'all' ? `لا يوجد أولياء أمور مرتبطين بشعبة ${selectedSection}` : 'لا يوجد أولياء أمور مسجلين'}
                      </p>
                  </div>
              ) : (
                  [...filteredParents].sort(sortByRecentChat).map((parent) => (
                      <div 
                        key={parent.id} 
                        onClick={() => {
                          setSelectedChatUser({...parent, role: 'parent'});
                          setActiveTab('chat');
                        }}
                        className="flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/5 border border-white/5 rounded-2xl cursor-pointer transition-colors group"
                      >
                          <div className="flex items-center gap-3">
                              <div className="relative">
                                  <div className="w-11 h-11 rounded-full border border-white/10 overflow-hidden ring-1 ring-blue-400/50">
                                      {parent.photo ? (
                                         <img src={parent.photo} alt={parent.name} className="w-full h-full object-cover" />
                                      ) : (
                                         <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                             <User size={18} className="text-white/30" />
                                         </div>
                                      )}
                                  </div>
                                  {unreadCounts[parent.id] > 0 && (
                                     <div className="absolute -top-1 -left-1 bg-red-600 rounded-full min-w-[16px] h-[16px] px-1 flex items-center justify-center shadow-lg border-2 border-[#050A18]">
                                        <span className="text-[9px] font-black text-white">{unreadCounts[parent.id]}</span>
                                     </div>
                                  )}
                              </div>
                              <div className="flex flex-col text-right">
                                  <span className="text-[13px] text-white/90 font-bold">{parent.name}</span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-bold text-blue-400">ولي أمر</span>
                                    {parent.grade && parent.grade !== 'غير محدد' && (
                                      <span className="text-[8px] bg-white/5 text-blue-300/80 px-1.5 py-0.2 rounded font-mono">
                                        {parent.grade}
                                      </span>
                                    )}
                                  </div>
                              </div>
                          </div>
                          <button 
                            className="w-10 h-10 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center opacity-50 group-hover:opacity-100 transition-all shrink-0 ml-1 cursor-pointer"
                          >
                            <MessageCircle size={18} />
                          </button>
                      </div>
                  ))
              )}
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
                   
                   const norm = (str: string) => (str || '')
                     .replace(/[\s\-_()\/\\.]+/g, '')
                     .replace(/^(الصف|صف)/g, '')
                     .replace(/شعبة/g, '')
                     .replace(/ال/g, '')
                     .replace(/ة/g, 'ه')
                     .replace(/[أإآٱ]/g, 'ا')
                     .replace(/ى/g, 'ي')
                     .replace(/ـ/g, '')
                     .toLowerCase();

                   const normGrade = norm(grade);
                   const classesList = Array.isArray(t.classes) ? t.classes : [];
                   
                   if (classesList.length > 0) {
                     return classesList.some((c: any) => {
                       const cName = typeof c === 'string' ? c : (c?.name || c?.className || '');
                       const normC = norm(cName);
                       if (!normC) return false;
                       return normGrade.includes(normC) || normC.includes(normGrade);
                     });
                   }

                   if (Array.isArray(t.schedule) && t.schedule.length > 0) {
                     return t.schedule.some((s: any) => {
                       const cName = s?.className || s?.class || s?.grade || '';
                       const normC = norm(cName);
                       return normC && (normC.includes(normGrade) || normGrade.includes(normC));
                     });
                   }

                   const tGrade = t.grade || '';
                   if (tGrade) {
                     const normT = norm(tGrade);
                     return normGrade.includes(normT) || normT.includes(normGrade);
                   }

                   return true;
                };
                const filteredTeachers = teachersList.filter(t => 
                  (t.name || '').includes(searchQuery) && 
                  (!t.role || t.role.toUpperCase() === 'TEACHER' || t.role.toLowerCase() === 'cadre' || t.role.toLowerCase() === 'teacher') && 
                  teacherMatch(t)
                );

                return filteredTeachers.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-50 grayscale mt-10">
                        <User size={48} className="text-white/20 mb-4" />
                        <p className="text-white/40 text-sm font-bold">لا يوجد أساتذة حالياً</p>
                    </div>
                ) : (
                    [...filteredTeachers].sort(sortByRecentChat).map((teacher) => (
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
                             const isParentMode = msg.userRole === 'parent';
                             
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
                                               <div className={`w-8 h-8 rounded-full overflow-hidden border ${isTeacherMode ? 'border-amber-500/50' : (isAdminMode ? 'border-blue-500/50' : (isParentMode ? 'border-emerald-500/50' : 'border-white/10'))}`}>
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
             <div className="flex-1 overflow-y-auto px-4 py-6 bg-[#050A18] flex flex-col gap-2">
                {/* Search Bar for Recent Chats */}
                <div className="mb-2 relative">
                   <input 
                      type="text" 
                      value={chatSearchQuery}
                      onChange={(e) => setChatSearchQuery(e.target.value)}
                      placeholder="ابحث في سجل المحادثات..." 
                      className="w-full bg-[#1A233A] text-white text-sm rounded-xl px-4 py-3 pr-10 border border-white/10 outline-none focus:border-[#00E5FF] focus:bg-[#0D142A] transition-all"
                   />
                   <Search size={18} className="absolute right-3 top-3.5 text-white/40" />
                </div>

                {/* General Chat Room Shortcut Item */}
                <div 
                  onClick={() => {
                    setIsGeneralChat(true);
                    setSelectedChatUser(null);
                  }}
                  className="flex items-center justify-between p-3.5 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent hover:from-amber-500/25 hover:via-amber-500/15 border border-amber-500/30 rounded-2xl cursor-pointer transition-all group mb-1 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)] ring-2 ring-amber-400/50">
                      <Coffee size={22} className="text-white" />
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-sm text-white font-black">غرفة المجلس العامة</span>
                      <span className="text-[11px] text-amber-300 font-bold">دردشة جماعية مفتوحة للجميع</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded-full font-bold border border-amber-500/20">
                      عامة
                    </span>
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                      <MessageCircle size={16} />
                    </div>
                  </div>
                </div>

                {/* Section Header */}
                <div className="px-1 py-1 flex items-center justify-between text-xs font-black text-white/60">
                  <span>المحادثات المباشرة ({displayRecentConversations.length})</span>
                  {displayRecentConversations.length > 0 && (
                    <span className="text-[10px] text-[#00E5FF]">اضغط لفتح المحادثة فوراً</span>
                  )}
                </div>

                {/* Recent Chats List */}
                {displayRecentConversations.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 my-auto">
                        <div className="w-16 h-16 rounded-full bg-[#00E5FF]/10 flex items-center justify-center mb-3 border border-[#00E5FF]/20 shadow-[0_0_20px_rgba(0,229,255,0.15)]">
                            <MessageCircle size={28} className="text-[#00E5FF]" />
                        </div>
                        <h3 className="text-white font-black text-base mb-1">لا توجد محادثات سابقة بعد</h3>
                        <p className="text-white/40 text-xs max-w-xs mb-5">
                          اختر طالباً أو ولي أمر من القوائم لبدء محادثة مباشرة وسريعة، وسيظهر هنا تلقائياً.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                           <button 
                             onClick={() => setActiveTab('knights')}
                             className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                           >
                             تصفح الفرسان
                           </button>
                           {(isTeacher || userProfile?.role === 'admin') && (
                             <button 
                               onClick={() => setActiveTab('parents')}
                               className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                             >
                               تصفح أولياء الأمور
                             </button>
                           )}
                        </div>
                    </div>
                ) : (
                    displayRecentConversations.map((user) => {
                      const hasUnread = unreadCounts[user.id] > 0;
                      const roleName = user.role === 'teacher' ? 'أستاذ' : (user.role === 'parent' ? 'ولي أمر' : 'طالب');
                      const roleColor = user.role === 'teacher' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30 ring-amber-400/40' : (user.role === 'parent' ? 'text-blue-400 bg-blue-500/10 border-blue-500/30 ring-blue-400/40' : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30 ring-cyan-400/40');
                      
                      return (
                        <div 
                          key={user.id} 
                          onClick={() => {
                            setSelectedChatUser(user);
                            setIsGeneralChat(false);
                          }}
                          className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all border group ${
                            hasUnread 
                              ? 'bg-blue-600/10 hover:bg-blue-600/20 border-blue-500/40 shadow-[0_0_15px_rgba(37,99,235,0.15)]' 
                              : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/5 hover:border-white/15'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative shrink-0">
                              <div className={`w-12 h-12 rounded-full border border-white/10 overflow-hidden ring-1 ${roleColor}`}>
                                {user.photo ? (
                                  <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                    <User size={20} className="text-white/40" />
                                  </div>
                                )}
                              </div>
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#050A18] rounded-full"></div>
                              {hasUnread && (
                                <div className="absolute -top-1 -left-1 bg-red-600 rounded-full min-w-[18px] h-[18px] px-1.5 flex items-center justify-center shadow-lg border-2 border-[#050A18] animate-pulse">
                                  <span className="text-[10px] font-black text-white">{unreadCounts[user.id]}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col text-right min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-black truncate max-w-[140px] sm:max-w-[200px] ${hasUnread ? 'text-white' : 'text-white/90'}`}>
                                  {user.name}
                                </span>
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${roleColor}`}>
                                  {roleName}
                                </span>
                                {user.grade && user.grade !== 'غير محدد' && (
                                  <span className="text-[8px] bg-white/5 text-amber-300/80 px-1.5 py-0.5 rounded font-mono hidden sm:inline-block">
                                    {user.grade}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`text-xs truncate max-w-[180px] sm:max-w-[260px] ${hasUnread ? 'text-blue-300 font-bold' : 'text-white/50'}`}>
                                  {user.lastMessage || 'فتح المحادثة'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0 mr-2">
                            {user.timestamp && (
                              <span className="text-[10px] text-white/40 font-mono">
                                {formatMessageTime(user)}
                              </span>
                            )}
                            <button 
                              className="w-8 h-8 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all cursor-pointer"
                              title="فتح المحادثة"
                            >
                              <MessageCircle size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
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

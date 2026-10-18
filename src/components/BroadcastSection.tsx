import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone, Bell, History, AlertCircle, Trash2, Radio, CheckCircle, Target, Sparkles, Mic, Square, Play, Pause, RotateCcw, Volume2, Users, GraduationCap, UserCheck, HeartHandshake, UploadCloud, FileText } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';
import { broadcastService } from '../services/broadcastService';
import { logActivity } from '../utils/auditLogger';
import { academicService } from '../services/academicService';
import { doc, deleteDoc, db } from '../lib/firebase';
import { uploadFileToR2 } from '../services/uploadService';

interface VerticalScrollPickerProps {
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  label: string;
}

const VerticalScrollPicker: React.FC<VerticalScrollPickerProps> = ({ value, onChange, min, max, label }) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const startY = React.useRef(0);
  const startValue = React.useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startY.current = e.clientY;
    startValue.current = value;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaY = startY.current - e.clientY;
    const step = Math.round(deltaY / 15);
    let newValue = startValue.current + step;
    if (newValue < min) newValue = min;
    if (newValue > max) newValue = max;
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
    startValue.current = value;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = startY.current - e.touches[0].clientY;
    const step = Math.round(deltaY / 15);
    let newValue = startValue.current + step;
    if (newValue < min) newValue = min;
    if (newValue > max) newValue = max;
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  const increment = () => {
    if (value < max) onChange(value + 1);
  };

  const decrement = () => {
    if (value > min) onChange(value - 1);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      if (value < max) onChange(value + 1);
    } else {
      if (value > min) onChange(value - 1);
    }
  };

  const getVisibleNumbers = () => {
    const nums = [];
    for (let i = -2; i <= 2; i++) {
      const v = value + i;
      if (v >= min && v <= max) {
        nums.push({ val: v, offset: i });
      } else {
        nums.push({ val: null, offset: i });
      }
    }
    return nums;
  };

  return (
    <div 
      className="flex flex-col items-center select-none"
      onWheel={handleWheel}
    >
      <span className="text-[10px] font-black text-white/40 mb-1">{label}</span>
      <div 
        className={`w-20 h-28 bg-[#090D1E]/90 border ${isDragging ? 'border-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.25)]' : 'border-white/5'} rounded-2xl flex flex-col items-center justify-between py-1 relative overflow-hidden transition-all touch-none cursor-ns-resize`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUpOrLeave}
      >
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#090D1E] to-transparent pointer-events-none z-10" />
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#090D1E] to-transparent pointer-events-none z-10" />

        <button 
          type="button"
          onClick={(e) => { e.stopPropagation(); increment(); }}
          className="text-white/30 hover:text-rose-400 p-1 transition-colors z-20 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
          </svg>
        </button>

        <div className="flex-1 flex flex-col justify-center items-center relative h-12 w-full">
          <div className="absolute inset-y-2 inset-x-1 border-y border-rose-500/30 bg-rose-500/5 pointer-events-none rounded" />

          <div className="flex flex-col items-center justify-center gap-1 py-0.5">
            {getVisibleNumbers().map((item, idx) => {
              if (item.val === null) {
                return <div key={`empty-${idx}`} className="h-4 w-4" />;
              }
              const isActive = item.offset === 0;
              return (
                <div 
                  key={item.val}
                  onClick={(e) => { e.stopPropagation(); onChange(item.val as number); }}
                  className={`text-center transition-all duration-150 cursor-pointer ${
                    isActive 
                      ? "text-rose-400 font-extrabold text-sm scale-110 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" 
                      : "text-white/20 font-bold text-[10px]"
                  }`}
                >
                  {item.val}
                </div>
              );
            })}
          </div>
        </div>

        <button 
          type="button"
          onClick={(e) => { e.stopPropagation(); decrement(); }}
          className="text-white/30 hover:text-rose-400 p-1 transition-colors z-20 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

interface BroadcastSectionProps {
  onSendMessage?: (message: string, targetGrades: string[], duration: number, targetSection?: string, targetSections?: string[]) => void;
  onUpdateMessage?: (broadcastId: string, newMessage: string) => void;
  onDeleteMessage?: (id: string) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
  schoolId?: string;
  savedLists?: any[];
}

export const BroadcastSection: React.FC<BroadcastSectionProps> = ({
  onSendMessage,
  onUpdateMessage,
  onDeleteMessage,
  showToast,
  schoolId,
  savedLists
}) => {
  const [message, setMessage] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState('');
  const [level, setLevel] = React.useState<'primary' | 'intermediate' | 'preparatory'>('primary');
  const [selectedGrades, setSelectedGrades] = React.useState<string[]>(['أول']);
  const [selectedBranches, setSelectedBranches] = React.useState<string[]>(['علمي', 'أدبي']);
  const [selectedSection, setSelectedSection] = React.useState<string>('ALL');
  const [internalLists, setInternalLists] = React.useState<any[]>(savedLists || []);
  const [durationHours, setDurationHours] = React.useState<number>(0);
  const [durationDays, setDurationDays] = React.useState<number>(1);
  const [history, setHistory] = React.useState<any[]>([]);
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);

  // Target Role Selection
  const [targetRoles, setTargetRoles] = React.useState<string[]>(['all']);

  // Voice Recording State & Refs
  const [recordingState, setRecordingState] = React.useState<'idle' | 'recording' | 'recorded'>('idle');
  const [recordingTime, setRecordingTime] = React.useState<number>(0);
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = React.useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = React.useState<boolean>(false);
  const [isUploadingAudio, setIsUploadingAudio] = React.useState<boolean>(false);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const timerRef = React.useRef<any>(null);
  const previewAudioRef = React.useRef<HTMLAudioElement | null>(null);

  const toggleTargetRole = (role: 'all' | 'teachers' | 'students' | 'parents') => {
    if (role === 'all') {
      setTargetRoles(['all']);
      return;
    }
    setTargetRoles(prev => {
      const withoutAll = prev.filter(r => r !== 'all');
      if (withoutAll.includes(role)) {
        const next = withoutAll.filter(r => r !== role);
        return next.length === 0 ? ['all'] : next;
      } else {
        const next = [...withoutAll, role];
        if (next.length === 3) return ['all'];
        return next;
      }
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioPreviewUrl(url);
        setRecordingState('recorded');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecordingState('recording');
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Failed to start audio recording:", err);
      showToast('تعذر الوصول إلى المايكروفون: ' + (err.message || 'يرجى السماح بالوصول للمايكروفون'), 'error');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const resetRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setIsPlayingPreview(false);
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }
    setAudioBlob(null);
    setAudioPreviewUrl(null);
    setRecordingState('idle');
    setRecordingTime(0);
  };

  const togglePlayPreview = () => {
    if (!audioPreviewUrl) return;
    if (!previewAudioRef.current) {
      const audio = new Audio(audioPreviewUrl);
      previewAudioRef.current = audio;
      audio.onended = () => setIsPlayingPreview(false);
    }
    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play().catch(() => {});
      setIsPlayingPreview(true);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  React.useEffect(() => {
    if (savedLists && savedLists.length > 0) {
      setInternalLists(savedLists);
    }
  }, [savedLists]);

  React.useEffect(() => {
    const unsubLists = academicService.subscribeToLists(schoolId || 'school1', (lists) => {
      if (lists && Array.isArray(lists) && lists.length > 0) {
        setInternalLists(lists);
      }
    });
    return () => unsubLists();
  }, [schoolId]);

  React.useEffect(() => {
    const unsub = broadcastService.subscribeToBroadcasts(schoolId, (data) => {
      setHistory(data);
    });
    return () => unsub();
  }, [schoolId]);

  const levels = [
    { id: 'primary', name: 'ابتدائي' },
    { id: 'intermediate', name: 'متوسط' },
    { id: 'preparatory', name: 'إعدادي' }
  ];

  const gradeMap = {
    primary: ['أول', 'ثاني', 'ثالث', 'رابع', 'خامس', 'سادس'],
    intermediate: ['أول', 'ثاني', 'ثالث'],
    preparatory: ['رابع', 'خامس', 'سادس']
  };

  const branches = ['علمي', 'أدبي'];

  const toggleGrade = (grade: string) => {
    setSelectedSection('ALL');
    if (grade === 'الجميع') {
      setSelectedGrades(['الجميع']);
      return;
    }
    
    setSelectedGrades(prev => {
      const filtered = prev.filter(g => g !== 'الجميع');
      if (filtered.includes(grade)) {
        const next = filtered.filter(g => g !== grade);
        return next.length === 0 ? ['الجميع'] : next;
      }
      return [grade];
    });
  };

  const toggleBranch = (branch: string) => {
    setSelectedSection('ALL');
    setSelectedBranches(prev => 
      prev.includes(branch) 
        ? prev.filter(b => b !== branch) 
        : [...prev, branch]
    );
  };

  const isSingleGradeSelected = selectedGrades.length === 1 && !selectedGrades.includes('الجميع');
  const selectedGradeName = isSingleGradeSelected ? selectedGrades[0] : null;

  const selectedGradeFullName = React.useMemo(() => {
    if (!selectedGradeName) return null;
    if (level === 'primary') return `${selectedGradeName} ابتدائي`;
    if (level === 'intermediate') return `${selectedGradeName} متوسط`;
    if (level === 'preparatory') {
      if (selectedBranches.length === 1) return `${selectedGradeName} ${selectedBranches[0]}`;
      return `${selectedGradeName} إعدادي`;
    }
    return selectedGradeName;
  }, [selectedGradeName, level, selectedBranches]);

  const availableSections = React.useMemo(() => {
    if (!selectedGradeFullName) return [];

    const norm = (s: string) => (s || '')
      .trim()
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/\s+/g, '')
      .replace(/^(الصف|صف)/g, '')
      .replace(/^ال/, '')
      .toLowerCase();

    const targetGradeNorm = norm(selectedGradeFullName);

    // 1. Search matching lists from academicLists / savedLists
    const matchedLists = (internalLists || []).filter((l: any) => {
      if (!l || !l.name) return false;
      const lNorm = norm(l.name);
      return lNorm.includes(targetGradeNorm) || targetGradeNorm.includes(lNorm);
    });

    if (matchedLists.length > 0) {
      return matchedLists.map((l: any) => {
        const trimmed = (l.name || '').trim();
        const match = trimmed.match(/[\s\-_–—]+([\u0621-\u064Aa-zA-Z0-9])$|\(([\u0621-\u064Aa-zA-Z0-9]+)\)|شعبة\s*([\u0621-\u064Aa-zA-Z0-9]+)/);
        const letter = match ? (match[1] || match[2] || match[3]) : '';
        const label = letter ? `شعبة ${letter}` : l.name;
        return {
          id: l.id,
          fullName: l.name,
          label: label,
          letter: letter || label
        };
      });
    }

    // 2. Default fallback sections for any grade without registered lists yet
    return [
      { id: `${selectedGradeFullName}_A`, fullName: `${selectedGradeFullName} أ`, label: 'شعبة أ', letter: 'أ' },
      { id: `${selectedGradeFullName}_B`, fullName: `${selectedGradeFullName} ب`, label: 'شعبة ب', letter: 'ب' },
      { id: `${selectedGradeFullName}_C`, fullName: `${selectedGradeFullName} ج`, label: 'شعبة ج', letter: 'ج' },
    ];
  }, [selectedGradeFullName, internalLists]);

  const activeTargetLabel = React.useMemo(() => {
    if (!isSingleGradeSelected || !selectedGradeFullName) {
      return selectedGrades.includes('الجميع') ? 'كل المرحلة' : `صفوف (${selectedGrades.join('، ')})`;
    }
    if (!selectedSection || selectedSection === 'ALL') {
      return `كافة شُعب (${selectedGradeFullName})`;
    }
    const matchedSec = availableSections.find(s => s.fullName === selectedSection);
    return `${selectedGradeFullName} (${matchedSec ? matchedSec.label : selectedSection})`;
  }, [isSingleGradeSelected, selectedGradeFullName, selectedGrades, selectedSection, availableSections]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const targetId = confirmDelete;
    const itemToDelete = history.find(h => h.id === targetId);
    const previousHistory = [...history];
    setConfirmDelete(null);

    // 1. Instantaneous optimistic removal from UI (0ms delay)
    setHistory(prev => prev.filter(br => br.id !== targetId));

    try {
      // 2. Perform deletion in backend (PostgreSQL + realtime)
      await broadcastService.deleteBroadcast(targetId, itemToDelete?.message);

      // 3. Delete from Firestore if exists
      try {
        await deleteDoc(doc(db, "broadcasts", targetId));
      } catch (_) {}

      showToast('تم حذف البث الإذاعي بنجاح', 'success');

      logActivity({
        action: 'حذف بث إذاعي',
        details: 'تم حذف بث إذاعي نهائياً من قاعدة البيانات',
        targetId: targetId,
        targetType: 'broadcast'
      });
    } catch (e: any) {
      console.error("Error deleting broadcast: ", e);
      // Rollback on failure
      setHistory(previousHistory);
      showToast('حدث خطأ أثناء الحذف: ' + (e.message || ''), 'error');
    }
  };

  const handleSend = async () => {
    if (!message.trim() && !audioBlob && !audioPreviewUrl) {
      showToast('يرجى كتابة رسالة نصية أو تسجيل بصمة صوتية للبث', 'error');
      return;
    }

    let finalSelection: string[] = [];
    const currentLevelGrades = gradeMap[level];

    if (selectedGrades.includes('الجميع')) {
      if (level === 'primary') {
        finalSelection = currentLevelGrades.map(g => `${g} ابتدائي`);
      } else if (level === 'intermediate') {
        finalSelection = currentLevelGrades.map(g => `${g} متوسط`);
      } else if (level === 'preparatory') {
        currentLevelGrades.forEach(g => {
          branches.forEach(b => finalSelection.push(`${g} ${b}`));
        });
      }
    } else {
      if (level === 'primary') {
        finalSelection = selectedGrades.map(g => `${g} ابتدائي`);
      } else if (level === 'intermediate') {
        finalSelection = selectedGrades.map(g => `${g} متوسط`);
      } else if (level === 'preparatory') {
        selectedGrades.forEach(g => {
          selectedBranches.forEach(b => {
             finalSelection.push(`${g} ${b}`);
          });
        });
      }
    }

    const durationInHours = (durationDays * 24) + durationHours || 1;
    const msg = message.trim();

    // Handle voice upload to Cloudflare R2 / Server if audioBlob exists
    let uploadedAudioUrl: string | null = null;
    if (audioBlob) {
      setIsUploadingAudio(true);
      try {
        const audioFile = new File([audioBlob], `voice_broadcast_${Date.now()}.webm`, { type: audioBlob.type || 'audio/webm' });
        uploadedAudioUrl = await uploadFileToR2(audioFile);
      } catch (err: any) {
        console.warn('R2 upload warning, converting to base64 fallback:', err);
      }

      if (!uploadedAudioUrl || (!uploadedAudioUrl.startsWith('http') && !uploadedAudioUrl.startsWith('/'))) {
        uploadedAudioUrl = await new Promise<string>((res) => {
          const reader = new FileReader();
          reader.onloadend = () => res((reader.result as string) || '');
          reader.onerror = () => res('');
          reader.readAsDataURL(audioBlob);
        });
      }
      setIsUploadingAudio(false);
    }

    // Determine section targeting
    const isSpecificSection = isSingleGradeSelected && selectedSection && selectedSection !== 'ALL';
    const targetSectionVal = isSpecificSection ? selectedSection : 'ALL';
    const targetSectionsVal = isSpecificSection 
      ? [selectedSection] 
      : (availableSections.length > 0 ? availableSections.map(s => s.fullName) : []);
    const targetGradesVal = isSpecificSection ? [selectedSection] : finalSelection;
    const targetSectionLabelVal = isSpecificSection
      ? (availableSections.find(s => s.fullName === selectedSection)?.label ? `${selectedGradeFullName} (${availableSections.find(s => s.fullName === selectedSection)?.label})` : selectedSection)
      : (isSingleGradeSelected ? `كافة شُعب (${selectedGradeFullName})` : 'كافة الشُعب');

    const expiryMs = Date.now() + durationInHours * 3600 * 1000;
    const broadcastId = `br_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Optimistic UI update in Smart Broadcast Log
    const optimisticBroadcast = {
      id: broadcastId,
      schoolId: schoolId || 'school1',
      message: msg || 'تسجيل صوتی من الإذاعة المدرسية 📻',
      targetGrades: targetGradesVal,
      targetSection: targetSectionVal,
      targetSections: targetSectionsVal,
      targetSectionLabel: targetSectionLabelVal,
      durationHours: durationInHours,
      expiryDate: expiryMs,
      author: 'الإدارة المدرسية',
      subject: 'الإذاعة المدرسية',
      targetLocation: 'ticker',
      audioUrl: uploadedAudioUrl || audioPreviewUrl,
      targetRoles: targetRoles,
      timestampMs: Date.now(),
      createdAt: new Date()
    };
    setHistory(prev => [optimisticBroadcast, ...prev.filter(b => b.id !== optimisticBroadcast.id)]);
    setMessage('');
    resetRecording();

    try {
      // 1. Core database persistence with full audioUrl and targetRoles
      const finalAudioUrl = uploadedAudioUrl || audioPreviewUrl || undefined;
      await broadcastService.sendBroadcast({
        id: broadcastId,
        schoolId: schoolId || 'school1',
        message: msg || 'تسجيل صوتی من الإذاعة المدرسية 📻',
        targetGrades: targetGradesVal,
        targetSection: targetSectionVal,
        targetSections: targetSectionsVal,
        durationHours: durationInHours,
        expiryDate: expiryMs,
        author: 'الإدارة المدرسية',
        subject: 'الإذاعة المدرسية',
        targetLocation: 'ticker',
        audioUrl: finalAudioUrl,
        targetRoles: targetRoles
      });

      // 2. Notify parent listener if provided
      if (onSendMessage) {
        try {
          (onSendMessage as any)(
            msg || 'تسجيل صوتی من الإذاعة المدرسية 📻', 
            targetGradesVal, 
            durationInHours, 
            targetSectionVal, 
            targetSectionsVal,
            finalAudioUrl,
            targetRoles
          );
        } catch (err) {
          console.warn('onSendMessage listener notice:', err);
        }
      }

      logActivity({
        action: 'إطلاق بث إذاعي',
        details: `تم إرسال بث إذاعي للفئات: ${targetGradesVal.join(', ')} (${targetSectionLabelVal})`,
        targetType: 'broadcast'
      });

      showToast(`تم إرسال ونشر البث في شاشات المستهدفين وسجل البث فوراً 📡`, 'success');

      // Re-sync with backend
      const latest = await broadcastService.getBroadcasts(schoolId);
      if (latest && latest.length > 0) {
        setHistory(latest);
      }
    } catch (e: any) {
      console.error("Error sending broadcast:", e);
      showToast('حدث خطأ أثناء إرسال البث: ' + (e.message || ''), 'error');
    }
  };

  const currentGrades = gradeMap[level];

  return (
    <div className="w-full -mx-3 md:-mx-6 w-[calc(100%+1.5rem)] md:w-[calc(100%+3rem)] pb-12 text-right overflow-x-hidden" dir="rtl">
      <ConfirmDialog 
         isOpen={!!confirmDelete}
         onClose={() => setConfirmDelete(null)}
         onConfirm={handleDelete}
         title="تأكيد الحذف"
         message="هل أنت متأكد من حذف هذا البث الإذاعي نهائياً؟"
      />

      {/* 1. Edge-to-Edge Banner Header */}
      <div className="w-full bg-gradient-to-b from-rose-950/40 via-[#0D1126] to-[#0A0D1E] py-8 sm:py-10 px-4 sm:px-8 text-center space-y-6 border-b border-rose-500/20">
         <div className="w-16 h-16 sm:w-20 sm:h-20 bg-rose-500 rounded-3xl flex items-center justify-center text-white mx-auto shadow-2xl shadow-rose-900/50 animate-pulse">
            <Megaphone size={36} />
         </div>
         <div className="space-y-2">
           <h3 className="text-white font-black text-xl sm:text-2xl flex items-center justify-center gap-2">
             <span>رادار الذكاء الإذاعي والإعلانات المركزية 📢</span>
           </h3>
           <p className="text-white/70 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto font-medium px-2">
              أرسل إعلانات الإذاعة المدرسية، التوجيهات المركزية، أو التبليغات الموجهة لأولياء الأمور والطلاب بكل احترافية، مع توجيه دقيق للمراحل والشُعب المحددة.
           </p>
         </div>

         {/* Level Selector */}
         <div className="flex items-center justify-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 mx-auto w-fit">
            {levels.map(l => (
              <button 
                key={l.id}
                onClick={() => {
                  setLevel(l.id as any);
                  setSelectedGrades(l.id === 'primary' ? ['أول'] : ['الجميع']);
                  setSelectedSection('ALL');
                }}
                className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                  level === l.id ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/40 scale-105' : 'text-white/50 hover:text-white'
                }`}
              >
                {l.name}
              </button>
            ))}
         </div>
      </div>

      {/* 2. Target Selection Section (Edge-to-Edge, Unboxed) */}
      <div className="w-full bg-[#0A0D1E] py-6 sm:py-8 px-4 sm:px-8 space-y-6 border-b border-white/10">
         <div className="space-y-3">
           <p className="text-rose-300 text-xs font-black uppercase tracking-wider flex items-center gap-2">
             <Target size={15} />
             <span>تحديد المرحلة والصف المستهدف:</span>
           </p>
           <div className="flex flex-wrap items-center gap-2 pt-1">
             <button 
               onClick={() => toggleGrade('الجميع')}
               className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all border cursor-pointer ${
                 selectedGrades.includes('الجميع') 
                 ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/30' 
                 : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
               }`}
             >
               🌟 كافة صفوف المرحلة
             </button>
             {currentGrades.map(grade => (
               <button 
                 key={grade}
                 onClick={() => toggleGrade(grade)}
                 className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all border cursor-pointer ${
                   selectedGrades.includes(grade) 
                   ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/30' 
                   : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                 }`}
               >
                 {grade}
               </button>
             ))}
           </div>
         </div>

         {/* Branch Selector for Preparatory Grades */}
         {level === 'preparatory' && !selectedGrades.includes('الجميع') && (
           <motion.div 
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             className="pt-4 border-t border-white/10 space-y-3"
           >
             <p className="text-rose-300 text-xs font-black flex items-center gap-2">
               <AlertCircle size={14} />
               <span>اختر الفرع الدراسي:</span>
             </p>
             <div className="flex flex-wrap gap-3">
               {branches.map(branch => (
                 <button 
                   key={branch}
                   onClick={() => toggleBranch(branch)}
                   className={`px-8 py-2.5 rounded-xl font-black text-xs transition-all border-2 cursor-pointer ${
                     selectedBranches.includes(branch) 
                     ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/30' 
                     : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                   }`}
                 >
                   {branch}
                 </button>
               ))}
             </div>
           </motion.div>
         )}

         {/* Section selector when single grade is chosen */}
         {isSingleGradeSelected && selectedGradeFullName && (
           <motion.div 
             initial={{ opacity: 0, y: -8 }}
             animate={{ opacity: 1, y: 0 }}
             className="pt-4 border-t border-white/10 space-y-3"
           >
             <div className="flex flex-wrap items-center justify-between gap-2">
               <span className="text-xs font-black text-rose-300 flex items-center gap-2">
                 <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
                 <span>الشُعب المتاحة لصف ({selectedGradeFullName}):</span>
               </span>
               <span className="text-[10px] text-white/60 font-bold px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                 {selectedSection === 'ALL' ? 'بث جماعي لكافة الشُعب' : `موجه حصرياً: ${activeTargetLabel}`}
               </span>
             </div>

             <div className="flex flex-wrap items-center gap-2 pt-1">
               <button
                 type="button"
                 onClick={() => setSelectedSection('ALL')}
                 className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border ${
                   selectedSection === 'ALL'
                     ? 'bg-rose-600 text-white shadow-lg border-rose-400 scale-105'
                     : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border-white/10'
                 }`}
               >
                 <span>🌟 كافة شُعب الصف</span>
               </button>

               {availableSections.map((sec) => {
                 const isCurrent = selectedSection === sec.fullName;
                 return (
                   <button
                     key={sec.id || sec.fullName}
                     type="button"
                     onClick={() => setSelectedSection(sec.fullName)}
                     className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border ${
                       isCurrent
                         ? 'bg-cyan-500 text-black shadow-lg border-cyan-300 scale-105 font-extrabold'
                         : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border-white/10'
                     }`}
                   >
                     <span>📌 {sec.label}</span>
                   </button>
                 );
               })}
             </div>

             <p className="text-[10px] text-white/50 font-bold">
               {selectedSection === 'ALL'
                 ? `💡 سيتم بث هذا الإعلان لكافة طلاب جميع شُعب صف (${selectedGradeFullName}).`
                 : `💡 سيصل هذا الإعلان حصرياً لشاشة طلاب (${activeTargetLabel}) في شريط التنبيهات ولن يظهر للشُعب الأخرى.`}
             </p>
           </motion.div>
         )}

         {/* Target Audience Roles Selector */}
         <div className="pt-4 border-t border-white/10 space-y-3">
           <div className="flex flex-wrap items-center justify-between gap-2">
             <span className="text-xs font-black text-rose-300 flex items-center gap-2">
               <Users size={15} />
               <span>الفئات المستهدفة بالظهور في مركز التبليغات والاعلانات:</span>
             </span>
             <span className="text-[10px] text-white/60 font-bold px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
               {targetRoles.includes('all')
                 ? '🌟 يظهر للجميع (أساتذة + طلاب + أولياء أمور)'
                 : `🎯 يظهر لـ: ${targetRoles.map(r => r === 'teachers' ? 'الأساتذة' : r === 'students' ? 'الطلاب' : 'أولياء الأمور').join(' + ')}`}
             </span>
           </div>

           <div className="flex flex-wrap gap-2 pt-1">
             <button
               type="button"
               onClick={() => toggleTargetRole('all')}
               className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 border ${
                 targetRoles.includes('all')
                   ? 'bg-rose-600 text-white shadow-lg border-rose-400 scale-105'
                   : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border-white/10'
               }`}
             >
               <span>🌟 الجميع (كافة الفئات)</span>
             </button>
             <button
               type="button"
               onClick={() => toggleTargetRole('teachers')}
               className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 border ${
                 targetRoles.includes('teachers') && !targetRoles.includes('all')
                   ? 'bg-amber-500 text-black shadow-lg border-amber-300 scale-105 font-extrabold'
                   : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border-white/10'
               }`}
             >
               <GraduationCap size={14} />
               <span>الأساتذة</span>
             </button>
             <button
               type="button"
               onClick={() => toggleTargetRole('students')}
               className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 border ${
                 targetRoles.includes('students') && !targetRoles.includes('all')
                   ? 'bg-cyan-500 text-black shadow-lg border-cyan-300 scale-105 font-extrabold'
                   : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border-white/10'
               }`}
             >
               <UserCheck size={14} />
               <span>الطلاب</span>
             </button>
             <button
               type="button"
               onClick={() => toggleTargetRole('parents')}
               className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 border ${
                 targetRoles.includes('parents') && !targetRoles.includes('all')
                   ? 'bg-purple-500 text-white shadow-lg border-purple-300 scale-105 font-extrabold'
                   : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border-white/10'
               }`}
             >
               <HeartHandshake size={14} />
               <span>أولياء الأمور</span>
             </button>
           </div>
         </div>

         {/* Duration Selector */}
         <div className="pt-4 border-t border-white/10 space-y-3">
           <label className="text-rose-300 text-xs font-black block text-center">
             تحديد مدة بقاء الإعلان وتوقيت الاختفاء التلقائي ⏱️
           </label>
           <div className="flex justify-center items-center gap-10 py-2">
             <VerticalScrollPicker 
               value={durationHours} 
               onChange={setDurationHours} 
               min={0} 
               max={23} 
               label="ساعات" 
             />
             <VerticalScrollPicker 
               value={durationDays} 
               onChange={setDurationDays} 
               min={0} 
               max={30} 
               label="أيام" 
             />
           </div>
           <p className="text-[10px] text-white/50 text-center font-bold">
             💡 متبقي البث: 
             <span className="text-rose-400 mx-1 font-extrabold">
               {durationDays > 0 ? `${durationDays} يوم ` : ""}
               {durationHours > 0 ? `${durationHours} ساعة` : ""}
               {durationDays === 0 && durationHours === 0 ? "ساعة واحدة (حد أدنى تلقائي)" : ""}
             </span>
             ثم يختفي تماماً من شاشات المستهدفين.
           </p>
         </div>
      </div>

      {/* 3. Text & Voice Input Section (Edge-to-Edge, Unboxed) */}
      <div className="w-full bg-[#080B18] py-6 sm:py-8 px-4 sm:px-8 space-y-6 border-b border-white/10">
         {/* Primary Text Input */}
         <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-300 flex items-center gap-2">
                <FileText className="text-rose-400" size={16} />
                <span>محتوى الرسالة والتبليغ النصي (الأساسي) 📝</span>
              </span>
              <span className="text-[10px] text-white/50 font-bold bg-white/5 px-3 py-1 rounded-full border border-white/10">
                {message.trim().length > 0 ? `${message.trim().length} حرف` : 'نص التبليغ المكتوب'}
              </span>
            </div>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full h-36 bg-white/[0.04] border border-white/15 focus:border-rose-500 rounded-2xl p-5 text-white font-bold text-sm sm:text-base outline-none transition-all resize-none placeholder:text-white/30 leading-relaxed shadow-inner"
              placeholder="اكتب نص التبليغ أو الإعلان النصي الذي سيظهر في مركز التبليغات وعلى هواتف المستهدفين..."
            ></textarea>
         </div>

         {/* Optional Voice Recording Widget */}
         <div className="space-y-4 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-black text-rose-300 flex items-center gap-2">
                <Mic className="text-rose-400 animate-pulse" size={16} />
                <span>إضافة بصمة صوتية من الإذاعة المدرسية 🎙️</span>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-500/30 font-bold">
                  ميزة إضافية اختيارية
                </span>
              </span>
              {recordingState === 'recording' && (
                <span className="flex items-center gap-2 text-rose-400 font-mono font-black text-xs bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/30 animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  جاري التسجيل: {formatSeconds(recordingTime)}
                </span>
              )}
            </div>

            <p className="text-white/50 text-[10px] sm:text-xs font-bold">
              💡 يمكنك إرسال التبليغ كنص فقط دون تسجيل، أو إضافة تسجيل بصمة صوتية مرافق للتبليغ النصي!
            </p>

            {recordingState === 'idle' && (
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-rose-500/30 rounded-2xl bg-rose-500/[0.03] hover:bg-rose-500/[0.07] transition-all">
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 text-rose-400 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all shadow-xl shadow-rose-900/40 hover:scale-110 cursor-pointer"
                >
                  <Mic size={28} />
                </button>
                <p className="text-white/90 text-xs sm:text-sm font-extrabold mt-3">انقر لبدء تسجيل بصمة صوتية اختيارية 🎙️</p>
                <p className="text-white/40 text-[10px] sm:text-xs mt-0.5 font-bold">التسجيل اختياري للرغبة في إضافة بصمة صوتية من الإذاعة المدرسية</p>
              </div>
            )}

            {recordingState === 'recording' && (
              <div className="flex flex-col items-center justify-center p-6 border-2 border-rose-500/40 rounded-2xl bg-rose-500/10 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-bounce" />
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-400 animate-bounce delay-100" />
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-300 animate-bounce delay-200" />
                </div>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg cursor-pointer active:scale-95 transition-all"
                >
                  <Square size={16} fill="white" />
                  <span>إنهاء التسجيل واعتماده ({formatSeconds(recordingTime)})</span>
                </button>
              </div>
            )}

            {recordingState === 'recorded' && audioPreviewUrl && (
              <div className="p-4 border border-rose-500/30 rounded-2xl bg-rose-500/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-rose-300 flex items-center gap-2">
                    <Volume2 size={16} />
                    <span>معاينة البصمة الصوتية المرفقة ({formatSeconds(recordingTime)})</span>
                  </span>
                  <button
                    type="button"
                    onClick={resetRecording}
                    className="text-white/60 hover:text-rose-400 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>إلغاء أو إعادة التسجيل</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 bg-black/40 p-3 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={togglePlayPreview}
                    className="w-11 h-11 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    {isPlayingPreview ? <Pause size={20} /> : <Play size={20} className="mr-0.5" />}
                  </button>
                  <div className="flex-1">
                    <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full bg-rose-500 rounded-full ${isPlayingPreview ? 'animate-pulse w-full' : 'w-1/3'}`} />
                    </div>
                    <p className="text-[10px] text-white/60 font-mono mt-1 text-right">
                      {isPlayingPreview ? 'جاري الاستماع للتسجيل المرفق...' : 'البصمة الصوتية جاهزة للإرفاق بالنشر 📻'}
                    </p>
                  </div>
                </div>
              </div>
            )}
         </div>

         {/* Dynamic Send Button */}
         <div className="space-y-2 pt-4">
            <button 
              disabled={isUploadingAudio || (!message.trim() && !audioBlob && !audioPreviewUrl) || (level === 'preparatory' && !selectedGrades.includes('الجميع') && selectedBranches.length === 0)}
              onClick={handleSend}
              className="w-full h-16 sm:h-20 bg-rose-600 hover:bg-rose-500 rounded-2xl text-white font-black text-base sm:text-lg shadow-xl shadow-rose-950/60 active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:grayscale cursor-pointer group"
            >
               {isUploadingAudio ? (
                 <UploadCloud size={26} className="animate-bounce text-white" />
               ) : (
                 <Bell size={26} className="group-hover:rotate-12 transition-transform" />
               )}
               <span>
                 {isUploadingAudio
                   ? 'جاري رفّع البصمة الصوتية ونشر التبليغ...'
                   : (message.trim() && audioBlob 
                       ? 'إطلاق التبليغ النصي + البصمة الصوتية 📢🎙️'
                       : (audioBlob 
                           ? 'إطلاق البث الصوتي من الإذاعة المدرسية 🎙️' 
                           : (message.trim() 
                               ? (selectedGrades.includes('الجميع') ? 'إرسال التبليغ النصي لكافة الصفوف 📢' : `إرسال التبليغ النصي لـ (${activeTargetLabel}) 📢`)
                               : 'يرجى كتابة نص أو تسجيل بصمة صوتية للإرسال')))}
               </span>
            </button>
            {(!message.trim() && !audioBlob) && (
              <p className="text-[10px] sm:text-xs text-white/40 text-center font-bold">
                * يمكنك كتابة نص التبليغ، أو تسجيل بصمة صوتية، أو دمج الاثنين معاً.
              </p>
            )}
         </div>
      </div>
      
      {/* 4. History Section (Edge-to-Edge, Unboxed) */}
      <div className="w-full bg-[#050814] py-8 px-4 sm:px-8 space-y-6 min-h-[300px]">
         <div className="flex items-center justify-between pb-3 border-b border-white/10">
           <h4 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
             <History className="text-rose-400" size={18} />
             <span>سجل البث الذكي والإعلانات المعتمدة</span>
           </h4>
           <span className="text-xs text-white/50 font-mono">
             {history.length} إعلان مؤرشف
           </span>
         </div>
         <div className="space-y-3">
           {history.map((br) => {
             const expiryMs = typeof br.expiryDate === 'number'
               ? br.expiryDate
               : (br.expiryDate ? new Date(br.expiryDate).getTime() : 0);
             const diffMs = expiryMs ? expiryMs - Date.now() : 0;
             let remainingBadgeText = '';
             if (diffMs > 0) {
               const diffMins = Math.round(diffMs / 60000);
               const diffHours = Math.floor(diffMins / 60);
               const remMins = diffMins % 60;
               remainingBadgeText = diffHours < 24
                 ? `متبقي ${diffHours} س ${remMins > 0 ? `${remMins} د` : ""} ⏱️`
                 : `متبقي ${Math.floor(diffHours / 24)} يوم ⏱️`;
             }

             return (
               <div key={br.id} className="p-4 sm:p-5 bg-white/[0.03] hover:bg-white/[0.05] rounded-xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all relative overflow-hidden">
                  <div className="flex gap-4 w-full">
                     <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                        <Bell size={18} />
                     </div>
                     <div className="text-right w-full">
                        {editingId === br.id ? (
                          <div className="flex flex-col gap-2">
                              <textarea 
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-full bg-black/40 border border-white/20 rounded-xl p-3 text-white font-bold text-sm outline-none focus:border-rose-500 transition-all resize-none text-right"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                  <button 
                                    onClick={async () => {
                                      try {
                                        if (onUpdateMessage) {
                                          onUpdateMessage(br.id, editValue);
                                        }
                                        await broadcastService.updateBroadcast(br.id, editValue);
                                        setHistory(prev => prev.map(p => p.id === br.id ? { ...p, message: editValue } : p));
                                        showToast('تم تعديل البث بنجاح', 'success');
                                      } catch (e: any) {
                                        showToast('خطأ في تعديل البث', 'error');
                                      }
                                      setEditingId(null);
                                    }}
                                    className="px-5 py-2 bg-rose-500 text-white rounded-lg text-xs font-black cursor-pointer"
                                  >حفظ التعديل</button>
                                  <button 
                                    onClick={() => setEditingId(null)}
                                    className="px-5 py-2 bg-white/10 text-white/60 rounded-lg text-xs font-black hover:bg-white/20 cursor-pointer"
                                  >إلغاء</button>
                              </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                              <p className="text-white text-sm sm:text-base font-black leading-snug">{br.message}</p>
                              
                              {/* Audio Player in History Log */}
                              {(() => {
                                const logAudioUrl = br.audioUrl || br.audio_url || br.audio || br.soundUrl || br.voiceUrl;
                                if (!logAudioUrl) return null;
                                return (
                                  <div className="mt-2.5 p-2.5 rounded-xl bg-black/60 border border-rose-500/30 space-y-1.5" dir="rtl">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-black text-rose-300 flex items-center gap-1.5">
                                        <Volume2 size={13} className="text-rose-400 animate-pulse" />
                                        <span>البصمة الصوتية المسجلة للإذاعة 📻 (استماع)</span>
                                      </span>
                                      <span className="text-[9px] font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30">
                                        تسجيل إذاعي
                                      </span>
                                    </div>
                                    <audio src={logAudioUrl} controls controlsList="nodownload" className="w-full h-8 rounded-lg" />
                                  </div>
                                );
                              })()}

                              <div className="flex items-center gap-2.5 flex-wrap">
                                  <span className="text-[10px] bg-rose-500/15 text-rose-300 px-2.5 py-0.5 rounded-md font-bold border border-rose-500/20">
                                      🎯 {br.targetSectionLabel || (br.targetSection && br.targetSection !== 'ALL' ? br.targetSection : (br.targetGrades?.includes('الجميع') ? 'لكافة الصفوف' : (Array.isArray(br.targetGrades) ? br.targetGrades.join(', ') : 'للجميع')))}
                                  </span>
                                  {remainingBadgeText && (
                                    <span className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-md font-bold">
                                      {remainingBadgeText}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-white/50 font-bold">
                                      {(() => {
                                        const ts = br.timestampMs || (br.createdAt ? new Date(br.createdAt).getTime() : (br.timestamp ? (typeof br.timestamp.toDate === 'function' ? br.timestamp.toDate().getTime() : new Date(br.timestamp).getTime()) : Date.now()));
                                        const date = new Date(ts);
                                        return isNaN(date.getTime()) ? 'الآن' : new Intl.DateTimeFormat('ar-EG', { hour: 'numeric', minute: 'numeric', day: 'numeric', month: 'short' }).format(date);
                                      })()}
                                  </span>
                              </div>
                          </div>
                        )}
                     </div>
                  </div>
                  
                  {/* Actions Section - Only show when NOT editing */}
                  {editingId !== br.id && (
                    <div className="flex items-center gap-2 shrink-0 justify-end w-full md:w-auto border-t md:border-0 border-white/10 pt-2 md:pt-0">               
                        <button 
                            onClick={() => {
                                setEditingId(br.id);
                                setEditValue(br.message);
                            }}
                            className="h-9 px-4 rounded-lg bg-blue-500/15 text-blue-300 hover:bg-blue-600 hover:text-white transition-all text-xs font-bold cursor-pointer"
                        >
                            تعديل
                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDelete(br.id);
                            }}
                            className="w-9 h-9 bg-rose-500/15 text-rose-400 hover:bg-rose-600 hover:text-white rounded-lg transition-all flex items-center justify-center cursor-pointer"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                  )}
               </div>
             );
           })}
           {history.length === 0 && (
             <div className="py-16 text-center text-white/30 font-bold text-xs italic">
               لا يوجد سجل بث حالياً..
             </div>
           )}
         </div>
      </div>
    </div>
  );
};

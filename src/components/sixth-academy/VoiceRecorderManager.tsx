import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Volume2, Sparkles, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { VoiceNoteRecord } from './types';
import { safeStorage } from '../../lib/storage';

interface VoiceRecorderNodeProps {
  nodeKey: string;
  label?: string;
  isTeacherMode?: boolean;
  onVoiceUpdate?: () => void;
}

export const VoiceRecorderNode: React.FC<VoiceRecorderNodeProps> = ({
  nodeKey,
  label = "بصمة صوتية للأستاذ",
  isTeacherMode = true,
  onVoiceUpdate
}) => {
  const [record, setRecord] = useState<VoiceNoteRecord | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const storageKey = `s6_voicenote_${nodeKey}`;

  // Load existing audio note from storage
  useEffect(() => {
    const saved = safeStorage.getItem(storageKey);
    if (saved) {
      try {
        setRecord(JSON.parse(saved));
      } catch (e) {
        console.warn("Error loading voice note:", e);
      }
    } else {
      setRecord(null);
    }
  }, [storageKey]);

  // Handle Recording Timer
  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = async () => {
    setErrorMessage(null);

    // Check mediaDevices support
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      setErrorMessage("المتصفح لا يدعم تسجيل الصوت أو يتطلب اتصالاً آمناً (HTTPS).");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : undefined);

      const mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        try {
          const type = mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64Data = reader.result as string;
            const newRecord: VoiceNoteRecord = {
              id: Date.now().toString(),
              audioData: base64Data,
              duration: recordingTime || 1,
              timestamp: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
              teacherName: "الأستاذ"
            };
            setRecord(newRecord);
            safeStorage.setItem(storageKey, JSON.stringify(newRecord));
            if (onVoiceUpdate) onVoiceUpdate();
          };
        } catch (blobErr) {
          console.warn("Error finalizing audio recording:", blobErr);
        } finally {
          // Stop all audio tracks to release microphone hardware
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      const errName = err?.name || "";
      const errMsg = err?.message || String(err);
      console.warn("Microphone access notice:", errName, errMsg);

      if (
        errName === "NotAllowedError" ||
        errName === "PermissionDeniedError" ||
        errMsg.toLowerCase().includes("permission denied") ||
        errMsg.toLowerCase().includes("not allowed")
      ) {
        setErrorMessage("تم رفض إذن الميكروفون. يرجى تفعيل إذن الصوت في المتصفح أو فتح التطبيق في نافذة مستقلة.");
      } else if (
        errName === "NotFoundError" ||
        errName === "DevicesNotFoundError" ||
        errMsg.toLowerCase().includes("not found")
      ) {
        setErrorMessage("لم يتم العثور على ميكروفون متصل بالجهاز.");
      } else {
        setErrorMessage("تعذر الوصول إلى الميكروفون حالياً. يرجى التحقق من أذونات المتصفح.");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (stopErr) {
        console.warn("Error stopping media recorder:", stopErr);
      }
      setIsRecording(false);
    }
  };

  const togglePlay = () => {
    if (!record) return;

    if (isPlaying) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
      }
      setIsPlaying(false);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const audio = new Audio(record.audioData);
      audioPlayerRef.current = audio;

      audio.ontimeupdate = () => {
        setPlaybackTime(Math.floor(audio.currentTime));
      };

      audio.onended = () => {
        setIsPlaying(false);
        setPlaybackTime(0);
      };

      audio.onerror = () => {
        setIsPlaying(false);
      };

      audio.play().catch(e => console.warn("Audio playback notice:", e));
      setIsPlaying(true);
    }
  };

  const deleteRecording = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    setIsPlaying(false);
    setRecord(null);
    safeStorage.removeItem(storageKey);
    if (onVoiceUpdate) onVoiceUpdate();
  };

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // 1. If voice recording exists -> Show stylish audio player badge
  if (record) {
    return (
      <div className="inline-flex items-center gap-2.5 bg-gradient-to-r from-emerald-950/80 to-[#0A1A24]/90 border border-emerald-500/30 text-emerald-300 px-3.5 py-1.5 rounded-2xl shadow-lg my-1.5 transition-all text-xs font-bold">
        <button
          onClick={togglePlay}
          className="w-7 h-7 rounded-xl bg-emerald-500 text-black flex items-center justify-center hover:bg-emerald-400 active:scale-95 transition-all shadow-md cursor-pointer shrink-0"
          title={isPlaying ? "إيقاف الشرح الصوتي" : "استماع للشرح الصوتي للأستاذ"}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" className="mr-0.5" />}
        </button>

        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-white flex items-center gap-1">
              <Volume2 size={13} className="text-emerald-400 animate-pulse" />
              {label}
            </span>
            <span className="text-[9px] text-emerald-400/80 font-mono">
              {isPlaying ? `${formatSec(playbackTime)} / ` : ''}{formatSec(record.duration)} ({record.timestamp})
            </span>
          </div>

          {/* Animated audio wave bars */}
          {isPlaying && (
            <div className="flex items-center gap-0.5 h-4 px-1">
              <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite_100ms] h-3" />
              <span className="w-1 bg-emerald-300 rounded-full animate-[bounce_0.6s_infinite_300ms] h-4" />
              <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite_200ms] h-2" />
              <span className="w-1 bg-emerald-200 rounded-full animate-[bounce_0.6s_infinite_400ms] h-4" />
            </div>
          )}
        </div>

        {/* Delete option for Teacher */}
        {isTeacherMode && (
          <button
            onClick={deleteRecording}
            className="text-white/40 hover:text-rose-400 p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer mr-1"
            title="حذف التسجيل الصوتي"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    );
  }

  // 2. If actively recording -> Show live recording badge
  if (isRecording) {
    return (
      <div className="inline-flex items-center gap-2 bg-rose-950/90 border border-rose-500/40 text-rose-300 px-3.5 py-1.5 rounded-2xl animate-pulse shadow-lg my-1.5 text-xs font-bold">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
        <span>جارٍ التسجيل: <span className="font-mono text-white">{formatSec(recordingTime)}</span></span>
        <button
          onClick={stopRecording}
          className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] flex items-center gap-1 shadow cursor-pointer mr-1"
        >
          <Square size={10} fill="currentColor" />
          <span>إيقاف وحفظ</span>
        </button>
      </div>
    );
  }

  // 3. If no recording -> Compact button to add voice recording + friendly error message if permission blocked
  return (
    <div className="inline-flex flex-col gap-1.5 my-1">
      <div className="inline-flex items-center gap-2">
        <button
          onClick={startRecording}
          className="inline-flex items-center gap-1.5 bg-white/[0.03] hover:bg-emerald-500/15 text-white/50 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/30 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-sm"
          title="تسجيل شرح صوتي للأستاذ بجانب هذه النقطة"
        >
          <Mic size={13} className="text-emerald-400" />
          <span>تسجيل شرح صوتي</span>
        </button>

        {errorMessage && (
          <button
            onClick={() => setErrorMessage(null)}
            className="text-white/40 hover:text-white text-xs cursor-pointer p-0.5"
            title="إخفاء التنبيه"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] px-2.5 py-1 rounded-xl max-w-sm">
          <AlertCircle size={12} className="shrink-0 text-amber-400" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};

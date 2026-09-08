import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Volume2, Play, Pause, X, BookOpen, Clock, Music } from 'lucide-react';
import { NormalizedPage, VoiceNoteRecord } from './types';
import { safeStorage } from '../../lib/storage';

interface VoiceIndexModalProps {
  isOpen: boolean;
  onClose: () => void;
  docTitle: string;
  pages: NormalizedPage[];
  onJumpToPage: (pageIndex: number) => void;
}

interface DiscoveredVoiceNote {
  key: string;
  title: string;
  pageIndex: number;
  pageNumber: number;
  record: VoiceNoteRecord;
}

export const VoiceIndexModal: React.FC<VoiceIndexModalProps> = ({
  isOpen,
  onClose,
  docTitle,
  pages,
  onJumpToPage
}) => {
  const [voiceList, setVoiceList] = useState<DiscoveredVoiceNote[]>([]);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);

  // Scan storage for all voice recordings belonging to this document
  useEffect(() => {
    if (!isOpen) return;

    const list: DiscoveredVoiceNote[] = [];

    // 1. General page notes
    pages.forEach((page, pIdx) => {
      const pageKey = `s6_voicenote_s6_page_voice_${docTitle}_p${pIdx}`;
      const savedPage = safeStorage.getItem(pageKey);
      if (savedPage) {
        try {
          list.push({
            key: pageKey,
            title: `الشرح الصوتي العام لصفحة ${page.pageNumber} (${page.title})`,
            pageIndex: pIdx,
            pageNumber: page.pageNumber,
            record: JSON.parse(savedPage)
          });
        } catch (e) {}
      }

      // 2. Nodes voice notes
      page.structuredContent.forEach((node, nIdx) => {
        const nodeKey = `s6_voicenote_${docTitle}_p${pIdx}_n${nIdx}`;
        const savedNode = safeStorage.getItem(nodeKey);
        if (savedNode) {
          try {
            list.push({
              key: nodeKey,
              title: node.type === 'question' 
                ? `شرح سؤال: ${node.questionText?.slice(0, 40)}...`
                : node.type === 'note'
                  ? `شرح ملاحظة: ${node.content?.slice(0, 40)}...`
                  : `شرح قاعدة صفحة ${page.pageNumber}`,
              pageIndex: pIdx,
              pageNumber: page.pageNumber,
              record: JSON.parse(savedNode)
            });
          } catch (e) {}
        }
      });
    });

    setVoiceList(list);
  }, [isOpen, docTitle, pages]);

  if (!isOpen) return null;

  const togglePlay = (item: DiscoveredVoiceNote) => {
    if (playingKey === item.key) {
      if (audioEl) audioEl.pause();
      setPlayingKey(null);
    } else {
      if (audioEl) audioEl.pause();
      const audio = new Audio(item.record.audioData);
      setAudioEl(audio);
      setPlayingKey(item.key);
      audio.onended = () => setPlayingKey(null);
      audio.onerror = () => setPlayingKey(null);
      audio.play().catch(e => console.error("Audio error", e));
    }
  };

  const playConsecutive = () => {
    if (voiceList.length === 0) return;
    let idx = 0;
    const playNext = () => {
      if (idx < voiceList.length) {
        const currentItem = voiceList[idx];
        setPlayingKey(currentItem.key);
        const audio = new Audio(currentItem.record.audioData);
        setAudioEl(audio);
        audio.onended = () => {
          idx++;
          playNext();
        };
        audio.play().catch(e => console.error(e));
      } else {
        setPlayingKey(null);
      }
    };
    playNext();
  };

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[360] flex items-center justify-center bg-black/85 backdrop-blur-2xl p-4" dir="rtl">
        <motion.div
          initial={{ scale: 0.92, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 20 }}
          className="w-full max-w-2xl bg-[#090E24] border border-emerald-500/35 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_0_80px_rgba(16,185,129,0.18)] relative overflow-hidden flex flex-col max-h-[90vh] text-right"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shadow-lg">
                <Mic size={22} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>فهرس البصمات الصوتية للأستاذ</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                    {voiceList.length} تسجيل
                  </span>
                </h3>
                <p className="text-xs text-white/50">
                  استمعي لجميع الشروح الصوتية المسجلة في الملزمة كـ بودكاست متسلسل
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (audioEl) audioEl.pause();
                onClose();
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Podcast Action */}
          {voiceList.length > 0 && (
            <div className="py-3 flex items-center justify-between border-b border-white/10 shrink-0">
              <span className="text-xs text-white/60 font-bold">
                إجمالي وقت الشرح الصوتي: {formatSec(voiceList.reduce((acc, v) => acc + (v.record.duration || 0), 0))}
              </span>

              <button
                onClick={playConsecutive}
                className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Music size={14} />
                <span>تشغيل الكل كـ بودكاست متصل 🎧</span>
              </button>
            </div>
          )}

          {/* Voice Notes List */}
          <div className="flex-1 overflow-y-auto space-y-3 py-3 no-scrollbar">
            {voiceList.length === 0 ? (
              <div className="text-center py-12 text-white/40 space-y-2">
                <Mic size={40} className="mx-auto opacity-30" />
                <p className="text-xs">لم يتم تسجيل شروح صوتية في هذا الملف بعد.</p>
                <p className="text-[10px] text-white/30">يمكن للأستاذ تسجيل الشرح بجانب أي قاعدة أو من الشريط العلوي.</p>
              </div>
            ) : (
              voiceList.map((item) => {
                const isItemPlaying = playingKey === item.key;
                return (
                  <div
                    key={item.key}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isItemPlaying
                        ? 'bg-emerald-950/80 border-emerald-500/50 shadow-lg'
                        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => togglePlay(item)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0 transition-all cursor-pointer ${
                          isItemPlaying ? 'bg-emerald-400 text-black' : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                        }`}
                      >
                        {isItemPlaying ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
                      </button>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <h4 className="text-white font-bold text-xs sm:text-sm truncate">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-white/40">
                          <span className="text-emerald-400/80 font-mono">
                            {formatSec(item.record.duration)} دقيقة
                          </span>
                          <span>•</span>
                          <span>{item.record.timestamp}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onJumpToPage(item.pageIndex);
                        if (audioEl) audioEl.pause();
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer border border-white/5"
                    >
                      <BookOpen size={12} />
                      <span>صفحة {item.pageNumber}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-white/10 flex justify-end shrink-0">
            <button
              onClick={() => {
                if (audioEl) audioEl.pause();
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold cursor-pointer"
            >
              إغلاق
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

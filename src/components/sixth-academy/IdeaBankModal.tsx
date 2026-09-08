import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lightbulb, X, Plus, Trash2, Tag, Check, Filter, BookOpen } from 'lucide-react';
import { NoteItem, NoteCategory } from './types';

interface IdeaBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: NoteItem[];
  onAddNote: (text: string, tag: NoteCategory, pageNumber?: number) => void;
  onDeleteNote: (id: string) => void;
  currentPageNumber?: number;
  initialText?: string;
  initialTag?: NoteCategory;
  onJumpToPage?: (pageNumber: number) => void;
}

const CATEGORIES: Array<{ key: NoteCategory; label: string; colorClass: string; bgClass: string; borderClass: string; icon: string }> = [
  { key: 'فكرة ذهبية', label: '💡 فكرة ذهبية', colorClass: 'text-amber-300', bgClass: 'bg-amber-500/15', borderClass: 'border-amber-500/30', icon: '💡' },
  { key: 'تنبيه', label: '⚠️ تنبيه', colorClass: 'text-red-300', bgClass: 'bg-red-500/15', borderClass: 'border-red-500/30', icon: '⚠️' },
  { key: 'امتحاني', label: '🎯 امتحاني', colorClass: 'text-purple-300', bgClass: 'bg-purple-500/15', borderClass: 'border-purple-500/30', icon: '🎯' },
  { key: 'قاعدة ملخصة', label: '🗒️ قاعدة ملخصة', colorClass: 'text-blue-300', bgClass: 'bg-blue-500/15', borderClass: 'border-blue-500/30', icon: '🗒️' }
];

export const IdeaBankModal: React.FC<IdeaBankModalProps> = ({
  isOpen,
  onClose,
  notes,
  onAddNote,
  onDeleteNote,
  currentPageNumber,
  initialText = '',
  initialTag = 'فكرة ذهبية',
  onJumpToPage
}) => {
  const [textInput, setTextInput] = useState(initialText);
  const [selectedTag, setSelectedTag] = useState<NoteCategory>(initialTag);
  const [activeFilter, setActiveFilter] = useState<'الكل' | NoteCategory>('الكل');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!textInput.trim()) return;
    onAddNote(textInput.trim(), selectedTag, currentPageNumber);
    setTextInput('');
  };

  const filteredNotes = activeFilter === 'الكل' 
    ? notes 
    : notes.filter(n => n.tag === activeFilter);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[330] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" dir="rtl">
        <motion.div
          initial={{ scale: 0.92, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 20 }}
          className="w-full max-w-2xl bg-[#0C1026] border border-amber-500/30 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] text-right"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shadow-lg">
                <Lightbulb size={20} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>بنك الأفكار والملاحظات الذكية</span>
                  {currentPageNumber && (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                      الصفحة الحالية: {currentPageNumber}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-white/50">
                  تدوين الملاحظات الذكية والاستنتاجات الوزارية مع الربط برقم الصفحة
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* New Note Creation Section */}
          <div className="py-4 space-y-3 shrink-0 border-b border-white/10">
            <span className="text-xs font-black text-white/80 block">إضافة ملاحظة جديدة مصنفة:</span>
            
            {/* Category selection chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedTag(cat.key)}
                  className={`px-3 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedTag === cat.key
                      ? `${cat.bgClass} ${cat.colorClass} ${cat.borderClass} ring-2 ring-amber-400/40`
                      : 'bg-white/5 text-white/60 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.key}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave();
                }}
                rows={2}
                placeholder={currentPageNumber ? `اكتبي ملاحظة أو استنتاج ذكي لصفحة ${currentPageNumber}...` : "اكتبي الملاحظة أو الاستنتاج الذكي هنا..."}
                className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-400"
              />

              <button
                onClick={handleSave}
                disabled={!textInput.trim()}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 cursor-pointer shrink-0 transition-all active:scale-95"
              >
                <Plus size={16} />
                <span>حفظ بالبنك</span>
              </button>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="py-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[11px] font-bold text-white/50 flex items-center gap-1 ml-1">
              <Filter size={12} />
              التصفية:
            </span>

            <button
              onClick={() => setActiveFilter('الكل')}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                activeFilter === 'الكل'
                  ? 'bg-amber-500 text-black font-black shadow'
                  : 'bg-white/5 text-white/50 hover:text-white'
              }`}
            >
              الكل ({notes.length})
            </button>

            {CATEGORIES.map(cat => {
              const count = notes.filter(n => n.tag === cat.key).length;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveFilter(cat.key)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    activeFilter === cat.key
                      ? `${cat.bgClass} ${cat.colorClass} border ${cat.borderClass} font-black`
                      : 'bg-white/5 text-white/50 hover:text-white'
                  }`}
                >
                  {cat.key} ({count})
                </button>
              );
            })}
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 no-scrollbar min-h-[150px]">
            {filteredNotes.length === 0 ? (
              <div className="text-center text-white/30 py-8 text-xs">
                لا توجد ملاحظات مسجلة ضمن هذا التصنيف حالياً.
              </div>
            ) : (
              filteredNotes.map(note => {
                const catInfo = CATEGORIES.find(c => c.key === note.tag) || CATEGORIES[0];
                return (
                  <div
                    key={note.id}
                    className="p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl flex items-start justify-between gap-3 transition-colors"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${catInfo.bgClass} ${catInfo.colorClass} ${catInfo.borderClass}`}>
                          {catInfo.label}
                        </span>

                        {note.pageNumber && (
                          <button
                            onClick={() => {
                              if (onJumpToPage && note.pageNumber) {
                                onJumpToPage(note.pageNumber);
                                onClose();
                              }
                            }}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/25 flex items-center gap-1 hover:bg-blue-500/25 cursor-pointer"
                          >
                            <BookOpen size={10} />
                            <span>صفحة {note.pageNumber}</span>
                          </button>
                        )}

                        <span className="text-[10px] text-white/40 font-mono">{note.createdAt}</span>
                      </div>

                      <p className="text-white text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-line">
                        {note.text}
                      </p>
                    </div>

                    <button
                      onClick={() => onDeleteNote(note.id)}
                      className="p-2 rounded-xl text-white/30 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                      title="حذف الملاحظة"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-white/10 flex justify-end shrink-0">
            <button
              onClick={onClose}
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

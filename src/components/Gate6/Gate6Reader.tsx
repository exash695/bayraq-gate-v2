import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Lock, Radar, Award, Settings, Lightbulb, ChevronRight, ChevronLeft, Zap, X } from 'lucide-react';

interface PageContent {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface Gate6ReaderProps {
  unitTitle?: string;
  fileTitle?: string;
  pages?: PageContent[];
  onClose?: () => void;
}

export const Gate6Reader: React.FC<Gate6ReaderProps> = ({
  unitTitle = "الوحدة الأولى",
  fileTitle = "الملزمة الذهبية الشاملة",
  pages = [],
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'station1' | 'station2' | 'radar' | 'heroes' | 'settings' | 'ideas'>('station1');
  const [currentPage, setCurrentPage] = useState(0);
  const [challengeActive, setChallengeActive] = useState(false);
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    let interval: any;
    if (challengeActive && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0) {
      setChallengeActive(false);
      setTimer(60); // reset or handle end
    }
    return () => clearInterval(interval);
  }, [challengeActive, timer]);

  const tabs = [
    { id: 'station1', icon: BookOpen, title: "المحطة الأولى", subtitle: `${unitTitle} • ${fileTitle}` },
    { id: 'station2', icon: Lock, title: "المحطة الثانية", subtitle: "مقفلة حالياً", locked: true },
    { id: 'radar', icon: Radar, title: "رادار الذكاء", subtitle: "أسئلة استنتاجية" },
    { id: 'heroes', icon: Award, title: "قاعة الأبطال", subtitle: "أوسمة وانجازات" },
    { id: 'ideas', icon: Lightbulb, title: "بنك الأفكار", subtitle: "ملاحظات الطالبة" },
    { id: 'settings', icon: Settings, title: "غرفة التحكم", subtitle: "إعدادات التطبيق" },
  ];

  return (
    <div className="fixed inset-0 z-[99999] flex bg-gradient-to-br from-[#1a1b2e] via-[#0f111a] to-[#0a0c10] text-white overflow-hidden font-sans" dir="rtl">
      
      {/* Glassmorphism Sidebar */}
      <div className="w-72 flex-shrink-0 bg-white/[0.03] backdrop-blur-2xl border-l border-white/10 flex flex-col h-full shadow-[20px_0_40px_rgba(0,0,0,0.5)] z-20">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black bg-gradient-to-l from-amber-300 to-amber-500 bg-clip-text text-transparent drop-shadow-sm tracking-tight">
              بوابة بيرق Gate 6
            </h1>
            <p className="text-[10px] text-emerald-400 font-bold mt-1 tracking-widest uppercase opacity-80">Strict Content Mode</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                disabled={tab.locked}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-right p-3.5 rounded-xl transition-all duration-300 relative overflow-hidden group flex items-start gap-3 ${
                  isActive ? "bg-white/10 border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)]" : "hover:bg-white/5 border border-transparent"
                } ${tab.locked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {isActive && (
                  <motion.div layoutId="activeTabIndicator" className="absolute right-0 top-0 bottom-0 w-1 bg-amber-400 rounded-l-full shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                )}
                <div className={`p-2 rounded-lg transition-colors ${
                  isActive ? "bg-amber-400/20 text-amber-300" : "bg-white/5 text-white/60 group-hover:text-white group-hover:bg-white/10"
                }`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-bold text-sm ${isActive ? "text-white" : "text-white/80"}`}>{tab.title}</h3>
                  <p className={`text-[10px] mt-0.5 ${isActive ? "text-amber-200" : "text-white/40"} ${tab.locked ? "italic" : ""}`}>
                    {tab.subtitle}
                  </p>
                </div>
                {tab.locked && <Lock size={14} className="text-white/20 absolute left-4 top-1/2 -translate-y-1/2" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex flex-col h-full overflow-hidden">
        
        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto pb-40 px-6 sm:px-12 scroll-smooth">
          <div className="max-w-4xl mx-auto py-12">
            {pages.length > 0 ? (
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="prose prose-invert prose-amber max-w-none prose-headings:text-amber-50 prose-p:text-slate-300 prose-p:leading-loose prose-p:text-lg"
              >
                <div className="bg-[#1e2030]/50 backdrop-blur-md border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl relative">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                  
                  {/* Actual Content Render */}
                  <div className="relative z-10">
                    <h2 className="text-2xl sm:text-3xl font-black text-white mb-8 border-b border-white/10 pb-4 inline-block">
                      {pages[currentPage].title}
                    </h2>
                    {pages[currentPage].content}
                  </div>
                </div>
                
                {/* 60s Challenge Button */}
                <div className="mt-16 flex justify-center">
                  <button
                    onClick={() => setChallengeActive(true)}
                    className="group relative px-8 py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-2xl shadow-[0_0_40px_rgba(79,70,229,0.3)] hover:shadow-[0_0_60px_rgba(79,70,229,0.5)] transition-all hover:-translate-y-1 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_2s_infinite] pointer-events-none" />
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="p-2 bg-white/20 rounded-xl">
                        <Zap className="text-amber-300 group-hover:animate-pulse" size={24} />
                      </div>
                      <span className="text-xl font-black text-white tracking-wide">ابدأ تحدي الـ 60 ثانية</span>
                    </div>
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-white/30 space-y-4">
                <div className="w-16 h-16 rounded-full border-2 border-white/10 border-t-amber-400 animate-spin" />
                <p className="font-bold animate-pulse">في انتظار رفع الملفات لمعالجتها واستخراج المحتوى...</p>
              </div>
            )}
          </div>
        </div>

        {/* Floating Navigation */}
        {pages.length > 0 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[#0a0c10]/80 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl">
            <button
              onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))}
              disabled={currentPage === pages.length - 1}
              className="p-3 sm:px-6 sm:py-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all flex items-center gap-2 font-bold text-sm text-white"
            >
              <ChevronRight size={18} />
              <span className="hidden sm:inline">التالي</span>
            </button>
            
            <div className="px-4 font-mono font-bold text-amber-400 text-sm">
              {currentPage + 1} / {pages.length}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-3 sm:px-6 sm:py-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all flex items-center gap-2 font-bold text-sm text-white"
            >
              <span className="hidden sm:inline">السابق</span>
              <ChevronLeft size={18} />
            </button>
          </div>
        )}

      </div>

      {/* 60s Challenge Modal Overlay */}
      <AnimatePresence>
        {challengeActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-b from-[#1a1b2e] to-[#0a0c10] w-full max-w-xl rounded-3xl border border-amber-500/30 shadow-[0_0_50px_rgba(251,191,36,0.15)] overflow-hidden"
            >
              <div className="p-6 bg-amber-500/10 border-b border-amber-500/20 flex justify-between items-center text-amber-400">
                <div className="flex items-center gap-3">
                  <Zap className="animate-pulse" />
                  <h3 className="text-xl font-black">تحدي الـ 60 ثانية</h3>
                </div>
                <div className="font-mono text-3xl font-black tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                  00:{timer.toString().padStart(2, '0')}
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-white">سؤال 1: استناداً للصفحة الحالية، ما هو...</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map(opt => (
                      <button key={opt} className="p-4 rounded-xl border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 text-right text-sm text-slate-300 transition-all font-medium">
                        خيار الإجابة رقم {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="pt-4 flex justify-between">
                  <button onClick={() => setChallengeActive(false)} className="text-white/50 hover:text-white px-4 py-2 font-bold text-sm">
                    إلغاء التحدي
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

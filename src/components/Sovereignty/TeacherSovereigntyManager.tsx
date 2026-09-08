import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Flag, Zap, Crosshair, Plus, Sparkles, Users, Award, Play } from 'lucide-react';

export function TeacherSovereigntyManager({ language, teacherData }: any) {
  const [activeSubTab, setActiveSubTab] = useState<'battles' | 'flags' | 'leaderboard'>('battles');

  const tabs = [
    { id: 'battles', label: language === "ar" ? "إطلاق التحديات" : "Launch Battles", icon: Zap },
    { id: 'flags', label: language === "ar" ? "منح الرايات" : "Grant Flags", icon: Flag },
    { id: 'leaderboard', label: language === "ar" ? "ترتيب الصف" : "Class Leaderboard", icon: Users },
  ] as const;

  return (
    <div className="w-full h-full min-h-[500px] flex flex-col lg:flex-row gap-4" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Sidebar */}
      <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-2">
        <div className="bg-[#0A0F1D] border border-blue-500/20 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
              <Crosshair className="text-blue-400" size={20} />
            </div>
            <div>
              <h2 className="text-white font-black text-sm">{language === "ar" ? "مدير التحديات" : "Challenge Manager"}</h2>
              <p className="text-white/50 text-[10px]">{language === "ar" ? "منصة المعلم للسيادة" : "Teacher Sovereignty"}</p>
            </div>
          </div>
          
          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible">
            {tabs.map(t => {
              const Icon = t.icon;
              const isActive = activeSubTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveSubTab(t.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all text-sm font-bold shrink-0 lg:w-full ${language === "ar" ? "text-right" : "text-left"} ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' 
                      : 'text-white/50 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  {t.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Teacher Stats */}
        <div className="bg-gradient-to-br from-[#0A0F1D] to-blue-900/20 border border-white/5 rounded-2xl p-4 flex-1">
          <h3 className="text-xs font-black text-white/50 mb-3 uppercase tracking-wider">{language === "ar" ? "إحصائيات صفي" : "Class Stats"}</h3>
          <div className="space-y-3">
            <div className="bg-white/5 p-2 rounded-lg border border-white/5">
              <p className="text-[10px] text-white/50">{language === "ar" ? "بطل الصف الحالي" : "Current Class Champ"}</p>
              <p className="text-xs font-bold text-amber-400 flex items-center gap-1"><Trophy size={10} /> علي محمد رضا</p>
            </div>
            <div className="bg-white/5 p-2 rounded-lg border border-white/5">
              <p className="text-[10px] text-white/50">{language === "ar" ? "التحديات المكتملة" : "Completed Battles"}</p>
              <p className="text-xs font-bold text-emerald-400 flex items-center gap-1"><Zap size={10} /> 14 تحدي</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 bg-[#0A0F1D] border border-white/5 rounded-2xl p-4 md:p-6 overflow-hidden relative min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeSubTab === 'battles' && <TeacherBattlesPanel language={language} />}
            {activeSubTab === 'flags' && <TeacherFlagsPanel language={language} />}
            {activeSubTab === 'leaderboard' && <TeacherLeaderboardPanel language={language} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function TeacherBattlesPanel({ language }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-black text-white">{language === "ar" ? "التحديات السريعة" : "Quick Battles"}</h3>
          <p className="text-xs text-white/50">{language === "ar" ? "إطلاق تحدي 60 ثانية لطلابك" : "Launch 60s challenges"}</p>
        </div>
        <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-lg shadow-blue-900/50">
          <Sparkles size={14} />
          {language === "ar" ? "توليد تحدي بالذكاء الاصطناعي" : "AI Generate Battle"}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg"><Zap size={18} /></div>
            <span className="px-2 py-1 bg-white/10 rounded text-[10px] text-white/50">{language === "ar" ? "مسودة" : "Draft"}</span>
          </div>
          <h4 className="text-sm font-bold text-white mb-1">{language === "ar" ? "تحدي الفصل الثاني - فيزياء" : "Chapter 2 Challenge - Physics"}</h4>
          <p className="text-[10px] text-white/50 mb-4">{language === "ar" ? "5 أسئلة • وقت الإجابة: 60 ثانية" : "5 Qs • 60s timer"}</p>
          <button className="w-full bg-rose-600 hover:bg-rose-500 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors">
            <Play size={14} className={language === "ar" ? "rotate-180" : ""} />
            {language === "ar" ? "إطلاق التحدي الآن" : "Launch Now"}
          </button>
        </div>
        
        <div className="border border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer min-h-[140px]">
          <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mb-2">
            <Plus className="text-white/50" />
          </div>
          <p className="text-sm font-bold text-white mb-1">{language === "ar" ? "تحدي جديد" : "New Battle"}</p>
          <p className="text-[10px] text-white/50">{language === "ar" ? "صمم تحدي من الصفر" : "Create from scratch"}</p>
        </div>
      </div>
    </div>
  );
}

function TeacherFlagsPanel({ language }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-black text-white">{language === "ar" ? "منح الرايات" : "Grant Flags"}</h3>
          <p className="text-xs text-white/50">{language === "ar" ? "كافئ الطلاب المتميزين برايات تخصصية" : "Reward outstanding students"}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {["راية التفوق", "راية الإبداع", "راية المثابرة", "راية القراءة"].map((flag, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center cursor-pointer hover:bg-white/10 transition-colors border-b-2 border-b-transparent hover:border-b-blue-500">
            <Flag size={18} className="mx-auto text-amber-400 mb-2" />
            <p className="text-xs font-bold text-white">{flag}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <h4 className="text-sm font-bold text-white mb-3">{language === "ar" ? "اختر الطالب لمنحه الراية" : "Select Student"}</h4>
        <div className="flex items-center gap-2">
          <select className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
            <option>علي محمد رضا</option>
            <option>حسين جاسم</option>
            <option>أحمد حسن</option>
          </select>
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
            <Award size={16} />
            {language === "ar" ? "منح" : "Grant"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TeacherLeaderboardPanel({ language }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-black text-white">{language === "ar" ? "ترتيب الصف" : "Class Leaderboard"}</h3>
          <p className="text-xs text-white/50">{language === "ar" ? "راقب أداء طلابك ونقاط السيادة الخاصة بهم" : "Monitor students' performance"}</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-2 p-3 border-b border-white/5 text-[10px] font-black text-white/40 uppercase">
          <div className="col-span-2 text-center">#</div>
          <div className="col-span-6">{language === "ar" ? "الطالب" : "Student"}</div>
          <div className="col-span-2 text-center">{language === "ar" ? "الرايات" : "Flags"}</div>
          <div className="col-span-2 text-center">{language === "ar" ? "النقاط" : "Points"}</div>
        </div>

        <div className="divide-y divide-white/5">
          {[
            { rank: 1, name: "علي محمد رضا", flags: 4, points: "1,450" },
            { rank: 2, name: "أحمد حسن", flags: 2, points: "1,120" },
            { rank: 3, name: "حسين جاسم", flags: 1, points: "980" },
          ].map((student, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-white/5 transition-colors">
              <div className="col-span-2 flex justify-center">
                <span className={`text-sm font-black ${idx === 0 ? 'text-amber-400' : 'text-white/50'}`}>{student.rank}</span>
              </div>
              <div className="col-span-6 font-bold text-sm text-white line-clamp-1">{student.name}</div>
              <div className="col-span-2 flex justify-center text-emerald-400 font-bold text-xs">{student.flags}</div>
              <div className="col-span-2 flex justify-center text-amber-400 font-black text-xs">{student.points}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

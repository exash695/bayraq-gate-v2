import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Clock, Users, Swords, Calculator, BookOpen, FlaskConical, Play } from 'lucide-react';

export function SovereigntyTournaments({ language, userProfile, isCompetitionsMode }: any) {
  const tournaments = [
    {
      id: 1,
      title: language === "ar" ? "كأس الرياضيات الكبرى" : "Great Math Cup",
      type: "league",
      subject: "math",
      icon: Calculator,
      color: "from-blue-600 to-indigo-800",
      accent: "text-blue-400",
      participants: "45 مدرسة",
      timeLeft: "3 أيام",
      status: "active"
    },
    {
      id: 2,
      title: language === "ar" ? "تحدي القراءة السريع" : "Speed Reading Challenge",
      type: "school",
      subject: "arabic",
      icon: BookOpen,
      color: "from-emerald-600 to-teal-800",
      accent: "text-emerald-400",
      participants: "12 صف",
      timeLeft: "5 ساعات",
      status: "active"
    },
    {
      id: 3,
      title: language === "ar" ? "بطولة عباقرة العلوم" : "Science Geniuses",
      type: "class",
      subject: "science",
      icon: FlaskConical,
      color: "from-rose-600 to-pink-800",
      accent: "text-rose-400",
      participants: "32 طالب",
      timeLeft: "غداً",
      status: "upcoming"
    }
  ];

  const filtered = isCompetitionsMode 
    ? tournaments.filter(t => t.type === 'class' || t.type === 'school')
    : tournaments.filter(t => t.type === 'league' || t.type === 'school');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="text-lg md:text-xl font-black text-white leading-tight">
            {isCompetitionsMode 
              ? (language === "ar" ? "منافساتي الداخلية" : "Internal Competitions")
              : (language === "ar" ? "البطولات ودوري المدارس" : "Tournaments & League")}
          </h2>
          <p className="text-[10px] md:text-xs text-white/50 mt-0.5">
            {language === "ar" ? "شارك، نافس، وارفع رايتك!" : "Join, compete, and raise your flag!"}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {filtered.map((t) => {
          const Icon = t.icon;
          return (
            <motion.div 
              key={t.id}
              whileHover={{ y: -2 }}
              className={`bg-gradient-to-br ${t.color} p-[1px] rounded-2xl overflow-hidden shadow-lg`}
            >
              <div className="bg-[#0A0F1D]/90 backdrop-blur-md w-full h-full rounded-[15px] p-3 md:p-4 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-2 rounded-xl bg-white/5 border border-white/10 ${t.accent}`}>
                    <Icon size={18} />
                  </div>
                  <div className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[9px] font-bold text-white flex items-center gap-1">
                    {t.status === 'active' ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        {language === "ar" ? "جارية الآن" : "Live"}
                      </>
                    ) : (
                      <>
                        <Clock size={10} />
                        {language === "ar" ? "قريباً" : "Upcoming"}
                      </>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-base font-black text-white mb-1.5 leading-tight">{t.title}</h3>
                  <div className="flex flex-wrap gap-2 text-[10px] font-medium text-white/70">
                    <span className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded-md border border-white/5">
                      <Users size={12} /> {t.participants}
                    </span>
                    <span className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded-md border border-white/5">
                      <Clock size={12} /> {t.timeLeft}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-white/50">
                    {t.type === 'league' ? (language === "ar" ? "دوري المدارس" : "Schools League") : 
                     t.type === 'school' ? (language === "ar" ? "منافسة مدرسية" : "School Battle") :
                     (language === "ar" ? "تحدي صفي" : "Class Challenge")}
                  </span>
                  <button className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors border border-white/10 shadow-sm">
                    <Play size={14} className={language === "ar" ? "rotate-180" : ""} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

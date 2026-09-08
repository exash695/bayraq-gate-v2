import React from 'react';
import { motion } from 'motion/react';
import { History, Crown, Star } from 'lucide-react';

export function SovereigntyHistory({ language }: any) {
  const history = [
    {
      year: "2025",
      season: language === "ar" ? "الفصل الأول" : "Term 1",
      champion: "إعدادية الكرار للمتفوقين",
      tournament: "كأس بيرق الذهبي",
      points: "120,500"
    },
    {
      year: "2024",
      season: language === "ar" ? "البطولة الصيفية" : "Summer Tourney",
      champion: "مدرسة الموهوبين",
      tournament: "دوري البرمجة",
      points: "85,200"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-white/10 rounded-xl">
          <History className="text-white/70" size={20} />
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-black text-white leading-tight">
            {language === "ar" ? "سجل البطولات التاريخية" : "Hall of History"}
          </h2>
          <p className="text-[10px] md:text-xs text-white/50 mt-0.5">
            {language === "ar" ? "الأبطال الذين خلدوا أسماءهم في منصة السيادة" : "Champions who immortalized their names"}
          </p>
        </div>
      </div>

      <div className="relative border-l-2 border-white/10 pl-5 ml-3 md:ml-6 space-y-6" dir={language === "ar" ? "rtl" : "ltr"}>
        {history.map((record, idx) => (
          <motion.div 
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.15 }}
            key={idx} 
            className="relative"
          >
            <div className={`absolute w-4 h-4 rounded-full border-2 border-[#0A0F1D] ${idx === 0 ? 'bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-white/30'} -left-[29px] top-1.5`} />
            
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-4 shadow-md hover:border-white/20 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-amber-400 font-bold text-[10px] tracking-wider">{record.year} • {record.season}</span>
                  <h3 className="text-base font-black text-white mt-0.5">{record.tournament}</h3>
                </div>
                <Crown className={idx === 0 ? "text-amber-400" : "text-white/20"} size={20} />
              </div>
              
              <div className="bg-black/30 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-white/50 mb-0.5">{language === "ar" ? "البطل المتوج" : "Crowned Champion"}</p>
                  <p className="text-sm font-bold text-emerald-400">{record.champion}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-white/50 mb-0.5">{language === "ar" ? "النقاط" : "Points"}</p>
                  <p className="text-sm font-black text-amber-400 flex items-center gap-1 justify-end">
                    {record.points} <Star size={12} />
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

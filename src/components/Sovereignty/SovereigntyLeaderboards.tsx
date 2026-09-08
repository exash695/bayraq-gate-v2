import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, Crown, Star, Users, Flag } from 'lucide-react';

export function SovereigntyLeaderboards({ language }: any) {
  const [boardType, setBoardType] = useState<'league' | 'school' | 'class'>('league');

  const boards = [
    { id: 'league', label: language === "ar" ? "دوري المدارس" : "League" },
    { id: 'school', label: language === "ar" ? "المدرسة" : "School" },
    { id: 'class', label: language === "ar" ? "الصف" : "Class" }
  ];

  const mockData = {
    league: [
      { rank: 1, name: "إعدادية الكرار للمتفوقين", points: "15,420", flags: 12, isMe: false },
      { rank: 2, name: "مدرستي (مدرسة الموهوبين)", points: "14,890", flags: 10, isMe: true },
      { rank: 3, name: "ثانوية المتنبي", points: "12,100", flags: 8, isMe: false },
      { rank: 4, name: "إعدادية الحكمة", points: "9,500", flags: 5, isMe: false },
    ],
    school: [
      { rank: 1, name: "السادس العلمي (أ)", points: "5,200", flags: 4, isMe: false },
      { rank: 2, name: "السادس العلمي (ب)", points: "4,800", flags: 3, isMe: true },
      { rank: 3, name: "الخامس العلمي", points: "3,100", flags: 1, isMe: false },
    ],
    class: [
      { rank: 1, name: "علي محمد رضا", points: "1,450", flags: 2, isMe: false },
      { rank: 2, name: "أنت (بطل بيرق)", points: "1,240", flags: 1, isMe: true },
      { rank: 3, name: "حسين جاسم", points: "980", flags: 0, isMe: false },
    ]
  };

  const currentData = mockData[boardType];

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
        <div>
          <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2 leading-tight">
            <Trophy className="text-amber-400" size={18} />
            {language === "ar" ? "لوحات الشرف والترتيب" : "Leaderboards & Honor"}
          </h2>
          <p className="text-[10px] md:text-xs text-white/50 mt-0.5">
            {language === "ar" ? "نظام نقاط موزون وعادل" : "Weighted fair points system"}
          </p>
        </div>

        <div className="flex bg-[#050810] p-1 rounded-lg border border-white/10 w-full md:w-auto">
          {boards.map(b => (
            <button
              key={b.id}
              onClick={() => setBoardType(b.id as any)}
              className={`flex-1 md:flex-none px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                boardType === b.id 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#050810] border border-white/5 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 gap-2 p-3 border-b border-white/5 text-[10px] font-black text-white/40 uppercase">
          <div className="col-span-2 md:col-span-1 text-center">#</div>
          <div className="col-span-6 md:col-span-7">{language === "ar" ? "الاسم" : "Name"}</div>
          <div className="col-span-2 text-center">{language === "ar" ? "الرايات" : "Flags"}</div>
          <div className="col-span-2 text-center">{language === "ar" ? "النقاط" : "Points"}</div>
        </div>

        <div className="p-1.5 space-y-1.5">
          {currentData.map((item, idx) => (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={idx}
              className={`grid grid-cols-12 gap-2 p-2.5 rounded-xl items-center border ${
                item.isMe 
                  ? 'bg-indigo-500/10 border-indigo-500/30 shadow-sm' 
                  : 'bg-white/5 border-transparent hover:bg-white/10 transition-colors'
              }`}
            >
              <div className="col-span-2 md:col-span-1 flex justify-center">
                {item.rank === 1 ? <Crown size={18} className="text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]" /> :
                 item.rank === 2 ? <Medal size={16} className="text-gray-300" /> :
                 item.rank === 3 ? <Medal size={16} className="text-amber-700" /> :
                 <span className="text-sm font-black text-white/30">{item.rank}</span>}
              </div>
              <div className="col-span-6 md:col-span-7 font-bold text-xs md:text-sm text-white flex items-center gap-1.5 line-clamp-1">
                {item.isMe && <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-indigo-500 animate-pulse" />}
                <span className="truncate">{item.name}</span>
              </div>
              <div className="col-span-2 flex justify-center items-center gap-1 text-emerald-400 font-bold text-xs">
                <span className="hidden md:inline">{item.flags}</span>
                <Flag size={12} />
              </div>
              <div className="col-span-2 flex justify-center items-center gap-1 text-amber-400 font-black text-xs">
                <span className="hidden md:inline">{item.points}</span>
                <Star size={12} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

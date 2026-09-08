import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Target, Flag, ShieldAlert, Sparkles, Swords } from 'lucide-react';

export function SovereigntyDashboard({ language, userProfile, onNavigate }: any) {
  return (
    <div className="space-y-4 md:space-y-5">
      {/* Berq Announcement Banner */}
      <div className="bg-gradient-to-r from-amber-500/20 via-[#101935] to-indigo-900/40 border border-amber-500/30 rounded-[1.25rem] p-4 relative overflow-hidden flex flex-row items-center gap-3 md:gap-5 shadow-lg">
        <div className="absolute -right-5 -top-5 w-32 h-32 bg-amber-500/20 blur-[30px] rounded-full pointer-events-none" />
        
        {/* Berq Mascot Avatar - smaller for density */}
        <div className="w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-0.5 shadow-xl relative animate-pulse-slow">
          <div className="w-full h-full bg-[#0A0F1D] rounded-[0.9rem] flex items-center justify-center overflow-hidden relative">
             <Sparkles size={24} className="text-amber-400" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg border border-white/20 animate-bounce">
            {language === "ar" ? "جديد!" : "New!"}
          </div>
        </div>

        <div className="flex-1 text-right z-10 flex flex-col justify-center">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full w-fit mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-[10px] font-bold text-amber-400">
              {language === "ar" ? "بيرق يعلن التحدي!" : "Challenge Alert!"}
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h2 className="text-base md:text-lg font-black text-white mb-0.5 leading-tight">
                {language === "ar" ? "كأس الرياضيات الكبرى 🏆" : "The Great Math Cup 🏆"}
              </h2>
              <p className="text-[10px] md:text-xs text-white/70 font-medium max-w-sm leading-snug line-clamp-2">
                {language === "ar" 
                  ? "انطلقت الآن بطولة المدارس في الرياضيات! شارك واكسب النقاط الموزونة لفريقك."
                  : "The Inter-School Math Tournament has begun! Earn points for your team."}
              </p>
            </div>
            <button onClick={() => onNavigate('tournaments')} className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-lg text-xs font-bold shadow-md shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5 w-fit shrink-0 mt-1 md:mt-0">
              <Swords size={14} />
              {language === "ar" ? "شارك" : "Join"}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title={language === "ar" ? "نقاط السيادة" : "Sovereignty Points"} value="1,240" icon={Trophy} color="amber" />
        <StatCard title={language === "ar" ? "ترتيب المدرسة" : "School Rank"} value="#3" icon={Target} color="indigo" />
        <StatCard title={language === "ar" ? "الرايات المكتسبة" : "Earned Flags"} value="5" icon={Flag} color="emerald" />
        <StatCard title={language === "ar" ? "ترتيب الصف" : "Class Rank"} value="#1" icon={ShieldAlert} color="rose" />
      </div>
      
      {/* My Current Status */}
      <div className="bg-white/5 border border-white/10 rounded-[1.25rem] p-4 md:p-5">
        <h3 className="text-sm md:text-base font-black text-white mb-3 flex items-center gap-2">
          <Flag className="text-blue-400" size={16} />
          {language === "ar" ? "موقفي الحالي" : "My Current Status"}
        </h3>
        <div className="flex flex-col md:flex-row gap-4 items-center bg-[#050810] p-3 rounded-xl border border-white/5">
           <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
             <Trophy size={20} className="text-blue-400" />
           </div>
           <div className="flex-1 text-center md:text-right">
             <h4 className="text-sm font-bold text-white">{userProfile?.fullName || (language === "ar" ? "بطل بيرق" : "Berq Hero")}</h4>
             <p className="text-[10px] md:text-xs text-white/50 mt-0.5">{language === "ar" ? "المستوى 12 • منافس نشط" : "Level 12 • Active Contender"}</p>
           </div>
           <div className="w-full md:w-1/3">
             <div className="flex justify-between text-[10px] mb-1">
               <span className="text-blue-400 font-bold">{language === "ar" ? "نحو المستوى التالي" : "To next level"}</span>
               <span className="text-white">85%</span>
             </div>
             <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 rounded-full w-[85%] shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colors = {
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
  };
  const activeColor = colors[color as keyof typeof colors];

  return (
    <div className="bg-[#050810] border border-white/5 rounded-xl p-3 flex flex-col justify-center items-center text-center gap-1.5 relative overflow-hidden group">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${activeColor}`}>
        <Icon size={16} />
      </div>
      <h3 className="text-lg md:text-xl font-black text-white leading-none">{value}</h3>
      <p className="text-[9px] md:text-[10px] font-bold text-white/40 leading-none">{title}</p>
    </div>
  );
}

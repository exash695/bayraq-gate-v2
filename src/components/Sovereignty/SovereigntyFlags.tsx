import React from 'react';
import { motion } from 'motion/react';
import { Flag, Star, Zap, Brain, Target, Shield } from 'lucide-react';

export function SovereigntyFlags({ language, userProfile }: any) {
  const flags = [
    { id: 1, name: "راية الرياضيات", enName: "Math Flag", desc: "بطل الجبر والهندسة", icon: CalculatorIcon, color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/30", earned: true },
    { id: 2, name: "راية العلوم", enName: "Science Flag", desc: "المكتشف الصغير", icon: FlaskIcon, color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/30", earned: true },
    { id: 3, name: "راية القراءة", enName: "Reading Flag", desc: "دودة الكتب", icon: BookIcon, color: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500/30", earned: false },
    { id: 4, name: "راية الإبداع", enName: "Creativity Flag", desc: "أفكار خارج الصندوق", icon: Zap, color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/30", earned: true },
    { id: 5, name: "راية المثابرة", enName: "Perseverance Flag", desc: "لا يستسلم أبداً", icon: Shield, color: "text-rose-400", bg: "bg-rose-500/20", border: "border-rose-500/30", earned: false },
    { id: 6, name: "راية التاريخ", enName: "History Flag", desc: "حارس الحضارات", icon: Target, color: "text-indigo-400", bg: "bg-indigo-500/20", border: "border-indigo-500/30", earned: false },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center max-w-sm mx-auto mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)] mb-3 border border-white/20">
          <Flag size={20} className="text-white" />
        </div>
        <h2 className="text-lg md:text-xl font-black text-white mb-1.5 leading-tight">
          {language === "ar" ? "نظام الرايات والشارات" : "Flags & Badges System"}
        </h2>
        <p className="text-[10px] md:text-xs text-white/60 font-medium leading-snug">
          {language === "ar" 
            ? "الراية هي رمز السيادة والإنجاز. احصل عليها عبر الفوز بالمنافسات." 
            : "Flags represent your sovereignty. Earn them by winning battles."}
        </p>
      </div>

      {/* Increased density: grid-cols-2 on tiny mobile, 3 on normal mobile, 4 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-3">
        {flags.map((flag, idx) => {
          const Icon = flag.icon;
          return (
            <motion.div
              key={flag.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`relative overflow-hidden rounded-[1.25rem] border flex flex-col items-center text-center transition-transform ${
                flag.earned 
                  ? flag.border + " " + flag.bg.replace('/20', '/10') + " p-3" 
                  : 'border-white/5 bg-white/5 grayscale opacity-70 scale-[0.96] p-2.5'
              }`}
            >
              {flag.earned && <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxjaXJjbGUgY3g9IjEiIGN5PSIxIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-50" />}
              
              {/* Flag Pole Graphic - Reduced height for density */}
              <div className="relative mb-2 mt-1">
                <div className="w-1 h-10 bg-white/20 absolute -left-1.5 bottom-0 rounded-full" />
                <div className={`w-9 h-7 rounded-md flex items-center justify-center shadow-md relative z-10 ${flag.earned ? flag.bg.replace('/20', '') : 'bg-white/10'}`}>
                  <Icon size={14} className={flag.earned ? 'text-white' : 'text-white/30'} />
                </div>
              </div>

              <h3 className="text-[11px] md:text-xs font-black text-white mb-0.5 leading-tight">
                {language === "ar" ? flag.name : flag.enName}
              </h3>
              <p className="text-[9px] text-white/50 font-bold mb-2 leading-tight min-h-[1.2rem]">{flag.desc}</p>
              
              {flag.earned ? (
                <div className="bg-white/10 px-2 py-0.5 rounded-full border border-white/10 text-[9px] font-bold text-white flex items-center gap-1 shadow-inner">
                  <Star size={8} className="text-amber-400" /> 
                  {language === "ar" ? "مكتسبة" : "Earned"}
                </div>
              ) : (
                <div className="bg-black/20 px-2 py-0.5 rounded-full border border-white/5 text-[9px] font-bold text-white/40">
                  <LockIcon size={8} /> 
                  {language === "ar" ? "مقفلة" : "Locked"}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function CalculatorIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>; }
function FlaskIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.52 16h12.96"/></svg>; }
function BookIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>; }
function LockIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>; }

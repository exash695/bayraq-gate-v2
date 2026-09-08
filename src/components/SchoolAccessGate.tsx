import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock as LockIcon, ArrowRight, ShieldCheck, UserCheck, GraduationCap, Bus } from 'lucide-react';
import { BerqCharacter } from './BerqCharacterManager';

interface SchoolAccessGateProps {
  schoolName: string;
  onVerify: (code: string, isParent: boolean) => void;
  onBack: () => void;
  isVerifying?: boolean;
  savedCode?: string;
}

export const SchoolAccessGate: React.FC<SchoolAccessGateProps> = ({ schoolName, onVerify, onBack, isVerifying, savedCode }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleVerify = () => {
    const cleanCode = code.trim().toUpperCase();
    
    if (!cleanCode) {
      setError('يرجى إدخال الكود أولاً');
      return;
    }
    
    // We send to App.tsx via onVerify, which will now use customAuth.loginWithCode
    onVerify(cleanCode, false);
  };

  const getActivePortal = () => {
    const clean = code.trim().toUpperCase();
    if (!clean) return null;

    if (clean.startsWith('PAR-') || clean.startsWith('PCODE-')) return 'parent';
    if (clean.startsWith('ADM-') || clean === '112233') return 'admin';
    if (clean.startsWith('TCH-')) return 'teacher';
    if (clean.startsWith('DRI-') || clean.startsWith('DRV-') || /^\d{6}$/.test(clean)) return 'driver';
    
    if (
      clean.startsWith('STU-') || 
      clean.startsWith('PRI-') || 
      clean.startsWith('INT-') || 
      clean.startsWith('SCI-') || 
      clean.startsWith('LIT-') ||
      /^P\d/i.test(clean) ||
      /^M\d/i.test(clean) ||
      /^S\d/i.test(clean) ||
      clean.startsWith('P-') ||
      clean.startsWith('M-') ||
      clean.startsWith('S-')
    ) {
      return 'student';
    }

    return null;
  };

  const activePortal = getActivePortal();

  const portals = [
    { id: 'student', label: 'بوابة الطالب', icon: UserCheck, color: 'from-[#00E5FF] to-[#0083B0]', glowColor: '#00E5FF' },
    { id: 'parent', label: 'بوابة الوالدين', icon: ShieldCheck, color: 'from-[#00E676] to-[#00B0FF]', glowColor: '#00E676' },
    { id: 'teacher', label: 'بوابة الأستاذ', icon: GraduationCap, color: 'from-[#FF1744] to-[#D500F9]', glowColor: '#FF1744' },
    { id: 'driver', label: 'بوابة سائق الباص', icon: Bus, color: 'from-[#FF9100] to-[#FF3D00]', glowColor: '#FF9100' },
    { id: 'admin', label: 'بوابة الإدارة', icon: LockIcon, color: 'from-[#FFD600] to-[#FF8F00]', glowColor: '#FFD600' }
  ];

  return (
    <div className="fixed inset-0 bg-[#050A18] flex flex-col items-center justify-center p-6 text-center z-[110]" dir="rtl">
      {/* Floating Back Button */}
      <button 
        onClick={onBack}
        className="fixed top-8 right-6 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
      >
        <ArrowRight size={20} />
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Majestic Gate Key Video */}
        <div className="relative mx-auto w-40 h-40 flex items-center justify-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-2 border-dashed border-[#FFD600]/20 rounded-full"
          />
          <div className="absolute inset-3 flex items-center justify-center rounded-full overflow-hidden bg-black/40 shadow-[0_0_25px_rgba(255,214,0,0.15)] border border-[#FFD600]/30 backdrop-blur-md">
            <BerqCharacter
              pose="pose_key_master"
              glowColor="none"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>

        {/* Text Group */}
        <div className="space-y-3">
          <h2 className="text-2xl font-black text-white tracking-tight leading-relaxed">
            {schoolName}
          </h2>
          <p className="text-white/50 text-sm leading-relaxed px-8">
            يرجى إدخال رمز العبور الخاص بك للدخول إلى المنصة الذكية
          </p>
        </div>

        {/* Input Area */}
        <div className="space-y-4">
          <div className="relative">
            <input 
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isVerifying) {
                  e.preventDefault();
                  handleVerify();
                }
              }}
              placeholder="أدخل كود العبور"
              className="w-full h-14 px-6 bg-[#101935] border-2 border-transparent focus:border-[#FFD600] rounded-full text-center text-white placeholder:text-white/20 text-lg font-bold tracking-wider placeholder:tracking-normal outline-none transition-all shadow-xl"
            />
            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-rose-500 text-xs mt-2 font-bold text-center"
              >
                {error}
              </motion.p>
            )}
          </div>

          <button 
            onClick={handleVerify}
            disabled={isVerifying}
            className="w-full h-14 bg-[#FFD600] rounded-full flex items-center justify-center gap-3 text-black font-black text-lg shadow-[0_10px_30px_rgba(255,214,0,0.2)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-6 h-6 border-2 border-black border-t-transparent rounded-full"
              />
            ) : (
              <ShieldCheck size={24} />
            )}
            {isVerifying ? 'جاري التحقق...' : 'تـحـقـق ودخـول'}
          </button>
        </div>

        {/* Dynamic Portals Ticker */}
        <div className="pt-5 border-t border-white/5 space-y-3">
          <p className="text-[10px] text-white/30 font-black tracking-wider uppercase text-center">البوابات واللوحات الذكية المعتمدة</p>
          <div className="grid grid-cols-5 gap-1.5 w-full max-w-sm mx-auto">
            {portals.map((p) => {
              const IconComp = p.icon;
              const isActive = activePortal === p.id;
              const isAnyActive = activePortal !== null;
              
              return (
                <div 
                  key={p.id}
                  className={`flex flex-col items-center gap-1 transition-all duration-300 w-full ${
                    isAnyActive ? (isActive ? 'scale-110' : 'opacity-20 scale-90 blur-[0.5px]') : 'opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  <div 
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 relative ${
                      isActive 
                        ? `bg-gradient-to-br ${p.color} text-black border border-white shadow-[0_0_15px_${p.glowColor}]` 
                        : 'bg-white/5 border border-white/10 text-white/40'
                    }`}
                  >
                    <IconComp size={18} className={isActive ? 'animate-pulse' : ''} />
                    {isActive && (
                      <motion.div 
                        layoutId="activeGlowRing"
                        className="absolute -inset-1 rounded-full border border-dashed animate-spin"
                        style={{ 
                          borderColor: p.glowColor,
                          animationDuration: '10s'
                        }}
                      />
                    )}
                  </div>
                  <span className={`text-[8px] sm:text-[9px] font-black tracking-normal transition-colors text-center leading-tight block w-full ${isActive ? 'text-white' : 'text-white/40'}`}>
                    <span className="block text-[7px] sm:text-[8px] opacity-60 font-medium mb-0.5">بوابة</span>
                    <span className="block whitespace-nowrap">{p.label.replace('بوابة ', '')}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

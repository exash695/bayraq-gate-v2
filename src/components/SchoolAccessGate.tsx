import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock as LockIcon, 
  ArrowRight, 
  ShieldCheck, 
  UserCheck, 
  GraduationCap, 
  Bus, 
  Trash2, 
  Sparkles, 
  KeyRound, 
  Check,
  ChevronDown
} from 'lucide-react';
import { BerqCharacter } from './BerqCharacterManager';
import { 
  getSavedAccessCodes, 
  saveAccessCode, 
  removeSavedAccessCode, 
  SavedAccessCodeItem 
} from '../lib/savedAccessCodes';

interface SchoolAccessGateProps {
  schoolName: string;
  onVerify: (code: string, isParent: boolean) => void;
  onBack: () => void;
  isVerifying?: boolean;
  savedCode?: string;
}

export const SchoolAccessGate: React.FC<SchoolAccessGateProps> = ({ 
  schoolName, 
  onVerify, 
  onBack, 
  isVerifying, 
  savedCode 
}) => {
  const [code, setCode] = useState(savedCode || '');
  const [error, setError] = useState('');
  const [savedCodes, setSavedCodes] = useState<SavedAccessCodeItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [rememberCode, setRememberCode] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load saved codes from localStorage on mount
  useEffect(() => {
    const list = getSavedAccessCodes(schoolName);
    setSavedCodes(list);
    
    // If there's a recently used code for this school and input is empty, pre-fill it
    if (!code && list.length > 0) {
      const match = list.find(item => item.schoolName === schoolName || item.schoolId);
      if (match) {
        setCode(match.code);
      }
    }
  }, [schoolName]);

  // Handle clicking outside to close suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleVerify = (codeToVerify?: string) => {
    const targetCode = (codeToVerify || code).trim().toUpperCase();
    
    if (!targetCode) {
      setError('يرجى إدخال الكود أولاً');
      return;
    }
    
    if (rememberCode) {
      saveAccessCode({
        code: targetCode,
        schoolName: schoolName
      });
      // Refresh list
      setSavedCodes(getSavedAccessCodes(schoolName));
    }

    setShowDropdown(false);
    onVerify(targetCode, false);
  };

  const handleSelectSavedCode = (item: SavedAccessCodeItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCode(item.code);
    setError('');
    setShowDropdown(false);
    handleVerify(item.code);
  };

  const handleDeleteSavedCode = (codeToRemove: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = removeSavedAccessCode(codeToRemove);
    setSavedCodes(updated);
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
    <div className="fixed inset-0 bg-[#050A18] flex flex-col items-center justify-center p-6 text-center z-[110] overflow-y-auto" dir="rtl">
      {/* Floating Back Button */}
      <button 
        onClick={onBack}
        className="fixed top-8 right-6 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all z-20 cursor-pointer"
      >
        <ArrowRight size={20} />
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-6 my-auto py-6"
      >
        {/* Majestic Gate Key Video */}
        <div className="relative mx-auto w-36 h-36 flex items-center justify-center">
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
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white tracking-tight leading-relaxed">
            {schoolName}
          </h2>
          <p className="text-white/50 text-xs sm:text-sm leading-relaxed px-6">
            يرجى إدخال رمز العبور الخاص بك للدخول إلى المنصة الذكية
          </p>
        </div>

        {/* Input Area with Auto-Suggestions */}
        <div className="space-y-3 relative z-30" ref={containerRef}>
          <div className="relative">
            <input 
              ref={inputRef}
              type="text"
              name="accessCode"
              id="accessCodeInput"
              autoComplete="username"
              autoCapitalize="characters"
              spellCheck={false}
              value={code}
              onFocus={() => {
                if (savedCodes.length > 0) {
                  setShowDropdown(true);
                }
              }}
              onClick={() => {
                if (savedCodes.length > 0) {
                  setShowDropdown(true);
                }
              }}
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
              className="w-full h-14 px-12 bg-[#101935] border-2 border-transparent focus:border-[#FFD600] rounded-full text-center text-white placeholder:text-white/20 text-lg font-bold tracking-wider placeholder:tracking-normal outline-none transition-all shadow-xl font-mono"
            />

            {/* Quick Key Icon on Left */}
            <div className="absolute left-4 inset-y-0 flex items-center text-white/30 pointer-events-none">
              <KeyRound size={20} />
            </div>

            {/* Saved Codes Indicator / Dropdown Trigger on Right */}
            {savedCodes.length > 0 && (
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="absolute right-3.5 inset-y-0 my-auto h-8 px-2.5 rounded-full bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="الأكواد المحفوظة"
              >
                <Sparkles size={13} className="text-amber-400" />
                <span className="hidden sm:inline">محفوظ ({savedCodes.length})</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
            )}

            {/* Auto-Suggestion Dropdown Menu */}
            <AnimatePresence>
              {showDropdown && savedCodes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-[#0C1427]/98 border border-amber-500/30 rounded-3xl p-3 shadow-[0_15px_40px_rgba(0,0,0,0.7)] backdrop-blur-2xl z-50 text-right overflow-hidden"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 px-2">
                    <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <Sparkles size={14} />
                      <span>الأكواد المحفوظة على هذا الجهاز:</span>
                    </span>
                    <span className="text-[10px] text-white/40">انقر للدخول الفوري</span>
                  </div>

                  <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
                    {savedCodes.map((item) => {
                      const isCurrent = code.toUpperCase() === item.code.toUpperCase();
                      return (
                        <div
                          key={item.code}
                          onClick={(e) => handleSelectSavedCode(item, e)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer group ${
                            isCurrent
                              ? 'bg-amber-500/15 border-amber-400/50 text-amber-200 shadow-sm'
                              : 'bg-white/[0.03] border-white/5 hover:border-amber-400/30 hover:bg-white/[0.07] text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0 font-bold">
                              <KeyRound size={15} />
                            </div>
                            <div className="min-w-0 flex flex-col items-start text-right">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-sm tracking-wider text-white group-hover:text-amber-300 transition-colors">
                                  {item.code}
                                </span>
                                {item.role && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white/10 text-white/70">
                                    {item.role === 'admin' ? 'إدارة' : item.role === 'teacher' ? 'أستاذ' : item.role === 'parent' ? 'ولي أمر' : item.role === 'driver' ? 'سائق' : 'طالب'}
                                  </span>
                                )}
                              </div>
                              {item.studentName && (
                                <span className="text-[10px] text-white/50 truncate max-w-[180px]">
                                  {item.studentName}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => handleDeleteSavedCode(item.code, e)}
                              title="حذف هذا الكود من الجهاز"
                              className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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

          {/* Remember Code Checkbox Toggle */}
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-white/60 py-1">
            <label className="flex items-center gap-2 cursor-pointer select-none hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={rememberCode}
                onChange={(e) => setRememberCode(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-amber-400 focus:ring-0 focus:ring-offset-0 accent-amber-400 cursor-pointer"
              />
              <span>تثبيت وحفظ الكود على هذا الجهاز لتسريع الدخول</span>
            </label>
          </div>

          <button 
            onClick={() => handleVerify()}
            disabled={isVerifying}
            className="w-full h-14 bg-[#FFD600] hover:bg-[#FFE033] rounded-full flex items-center justify-center gap-3 text-black font-black text-lg shadow-[0_10px_30px_rgba(255,214,0,0.25)] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
        <div className="pt-4 border-t border-white/5 space-y-3">
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

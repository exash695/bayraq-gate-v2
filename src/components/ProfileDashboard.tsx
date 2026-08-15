import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Flame, Shield, Flag, Award, BookOpen, Target, Trophy, Crosshair, Lock as LockIcon, Hourglass, Gem, ScrollText, PenLine, LogOut, Camera } from 'lucide-react';
import { UserProgress, Badge } from '../types';
import { translations } from '../lib/translations';
import { BADGES } from '../constants/badges';
import { safeStorage, safeSessionStorage } from '../lib/storage';

const IconMap: { [key: string]: any } = {
  PenLine, Target, BookOpen, Trophy, Crosshair, Lock: LockIcon, Hourglass, Gem, ScrollText
};

export const ProfileDashboard = ({ userProfile, progress, language }: { userProfile: any, progress: UserProgress, language: 'ar' | 'en' }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[language];
  const isAr = language === 'ar';

  const profile = userProfile || {
    fullName: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || (isAr ? 'فارس منصة بيرق' : 'Knight of Bayraq'),
    name: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || (isAr ? 'فارس منصة بيرق' : 'Knight of Bayraq'),
    email: auth.currentUser?.email || '',
    schoolName: isAr ? 'ميدان السادس العام' : 'Sixth Grade Field',
    governorate: isAr ? 'الديوانية - غماس' : 'Al-Diwaniyah',
    rank: progress?.rank || 'squire',
    photoURL: auth.currentUser?.photoURL || ''
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت.");
      return;
    }

    try {
      const { uploadFileToR2 } = await import('../services/uploadService');
      const publicUrl = await uploadFileToR2(file);
      await updateDoc(doc(db, 'users', auth.currentUser!.uid), {
        photoURL: publicUrl
      });
    } catch (err) {
      console.error(err);
      alert("فشل رفع الصورة، يرجى المحاولة مرة أخرى.");
    }
  };

  
  const rankDisplay = {
    squire: t.squire,
    knight: t.knight,
    commander: t.commander,
    guardian: t.guardian
  };

  const rankThemes = {
    squire: {
      color: 'text-slate-400',
      border: 'border-slate-400/30',
      bg: 'bg-slate-400/10',
      glow: 'shadow-[0_0_20px_rgba(148,163,184,0.3)]',
      icon: '🛡️'
    },
    knight: {
      color: 'text-blue-400',
      border: 'border-blue-400/30',
      bg: 'bg-blue-400/10',
      glow: 'shadow-[0_0_20px_rgba(96,165,250,0.3)]',
      icon: '🛡️'
    },
    commander: {
      color: 'text-purple-400',
      border: 'border-purple-400/30',
      bg: 'bg-purple-400/10',
      glow: 'shadow-[0_0_20px_rgba(192,132,252,0.3)]',
      icon: '⚔️'
    },
    guardian: {
      color: 'text-[#D4AF37]',
      border: 'border-[#D4AF37]/30',
      bg: 'bg-[#D4AF37]/10',
      glow: 'shadow-[0_0_30px_rgba(212,175,55,0.4)]',
      icon: '👑'
    }
  };

  const currentRank = profile.rank || progress?.rank || 'squire';
  const theme = rankThemes[currentRank as keyof typeof rankThemes] || rankThemes.squire;

  const masteredCount = progress?.masteredPages?.length || 0;
  const nextRankThreshold = masteredCount < 10 ? 10 : masteredCount < 30 ? 30 : masteredCount < 60 ? 60 : 100;
  const progressToNext = (masteredCount / nextRankThreshold) * 100;

  const earnedBadges = BADGES.filter(b => progress?.badges?.[b.id]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Main Identity Card */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-[#050505] border-2 border-[#D4AF37]/30 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,229,255,0.05),transparent_70%)]" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
        
        <div className="relative p-8 sm:p-12">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Avatar Section */}
            <div className="relative group">
              <div className={`w-48 h-48 rounded-full border-4 ${theme.border} flex items-center justify-center bg-white/5 text-7xl ${theme.glow} relative z-10 transition-transform duration-700 group-hover:scale-105 overflow-hidden`}>
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">{theme.icon}</span>
                )}
                
                {/* Camera Overlay */}
                <div 
                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                   <Camera size={32} className="text-white drop-shadow-lg" />
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handlePhotoUpload}
                />
              </div>

              {/* Floating Camera Button */}
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-4 bottom-4 bg-[#D4AF37] hover:scale-110 text-black p-3.5 rounded-full z-30 shadow-2xl border-2 border-[#050505] transition-all cursor-pointer flex items-center justify-center hover:bg-[#FFD600]"
                title="تحميل الصورة"
              >
                <Camera size={18} strokeWidth={2.5} />
              </button>

              {/* Animated Rings */}
              <div className="absolute inset-[-8px] border border-[#D4AF37]/20 rounded-full animate-[spin_10s_linear_infinite]" />
              <div className="absolute inset-[-16px] border border-[#00E5FF]/10 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`absolute -bottom-4 left-1/2 -translate-x-1/2 px-8 py-2 rounded-full border-2 ${theme.border} ${theme.bg} backdrop-blur-sm z-20 shadow-2xl`}
              >
                <span className={`text-lg font-black tracking-widest uppercase ${theme.color}`}>
                  {rankDisplay[currentRank as keyof typeof rankDisplay] || currentRank}
                </span>
              </motion.div>
            </div>

            {/* Info Section */}
            <div className="flex-1 text-center lg:text-right space-y-6 w-full">
              <div className="space-y-2">
                <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  {profile.fullName || profile.name}
                </h2>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-[#00E5FF] font-bold text-lg opacity-80">
                  <span className="px-3 py-1 bg-[#00E5FF]/10 rounded-lg border border-[#00E5FF]/20">{profile.schoolName}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/50" />
                  <span className="px-3 py-1 bg-[#D4AF37]/10 rounded-lg border border-[#D4AF37]/20 text-[#D4AF37]">{profile.governorate}</span>
                </div>
              </div>

              {/* Rank Progress */}
              <div className="space-y-3 max-w-xl lg:mr-0 mx-auto">
                <div className="flex justify-between items-end">
                  <div className="text-right">
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">
                      {isAr ? 'التقدم للرتبة التالية' : 'Next Rank Progress'}
                    </p>
                    <p className="text-xl font-black text-white">
                      {masteredCount} <span className="text-white/30 text-sm">/ {nextRankThreshold}</span>
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-black text-[#00E5FF]">{Math.round(progressToNext)}%</p>
                  </div>
                </div>
                <div className="h-4 bg-white/5 rounded-full p-1 border border-white/10 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progressToNext, 100)}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-[#00E5FF] via-[#D4AF37] to-[#00E5FF] bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite] rounded-full shadow-[0_0_15px_rgba(0,229,255,0.5)]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-white/10 bg-white/5">
          {[
            { label: isAr ? 'الموارد' : 'Resources', value: userProfile.resources || 0, color: 'text-amber-400', icon: Gem },
            { label: isAr ? 'النقاط' : 'Score', value: userProfile.totalScore || 0, color: 'text-[#00E5FF]', icon: Target },
            { label: isAr ? 'الشعلة' : 'Streak', value: userProfile.streak || 0, color: 'text-orange-500', icon: Flame },
            { label: isAr ? 'الكتيبة' : 'Battalion', value: userProfile.battalionName || (isAr ? 'مستقل' : 'Independent'), color: 'text-emerald-400', icon: Shield },
          ].map((stat) => (
            <div key={stat.label} className={`p-6 flex flex-col items-center justify-center gap-2 border-r border-white/10 last:border-0 hover:bg-white/5 transition-colors group`}>
              <stat.icon size={20} className={`${stat.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{stat.label}</p>
              <p className={`text-2xl font-black ${stat.color} tracking-tight`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Hall of Champions */}
        <div className="relative overflow-hidden rounded-[2rem] bg-[#050505]/60 backdrop-blur-sm border border-[#D4AF37]/20 p-8 shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
          <h3 className="text-2xl font-black text-[#D4AF37] flex items-center gap-4 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
              <Award size={24} />
            </div>
            {t.hallOfChampions}
          </h3>
          
          {earnedBadges.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {earnedBadges.map(badge => {
                const Icon = IconMap[badge.icon] || Award;
                return (
                  <div key={badge.id} className="group relative flex flex-col items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-[#D4AF37]/40 transition-all duration-500 hover:-translate-y-1">
                    <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white group-hover:text-[#D4AF37] transition-colors shadow-inner`}>
                      <Icon size={24} />
                    </div>
                    <span className="text-[10px] font-black text-white/60 text-center leading-tight uppercase tracking-tighter">{badge.title}</span>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-48 p-3 bg-black/95 border border-[#D4AF37]/30 rounded-xl text-[10px] text-white/80 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-30 shadow-2xl backdrop-blur-sm scale-95 group-hover:scale-100">
                      <p className="font-black text-[#D4AF37] mb-1 uppercase tracking-widest">{badge.title}</p>
                      {badge.description}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto opacity-20">
                <LockIcon size={32} />
              </div>
              <p className="text-white/20 italic font-medium">
                {isAr ? 'لم تكتسب أي أوسمة بعد.. ابدأ رحلتك الآن أيها الفارس!' : 'No badges earned yet.. Start your journey now, Knight!'}
              </p>
            </div>
          )}
        </div>

        {/* Artifacts Collection */}
        <div className="relative overflow-hidden rounded-[2rem] bg-[#050505]/60 backdrop-blur-sm border border-[#00E5FF]/20 p-8 shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00E5FF]/30 to-transparent" />
          <h3 className="text-2xl font-black text-[#00E5FF] flex items-center gap-4 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 flex items-center justify-center">
              <Gem size={24} />
            </div>
            {isAr ? 'متحف التحف' : 'Artifacts Museum'}
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-square rounded-3xl bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 group hover:border-[#00E5FF]/30 transition-colors cursor-help">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/10 group-hover:text-[#00E5FF]/20 transition-colors">
                <Hourglass size={32} />
              </div>
              <p className="text-xs font-black text-white/20 uppercase tracking-widest">{isAr ? 'قريباً' : 'Soon'}</p>
            </div>
            <div className="aspect-square rounded-3xl bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 opacity-50">
              <LockIcon size={32} className="text-white/10" />
            </div>
          </div>
        </div>
      </div>

      {/* Logout Action */}
      <div className="pt-8">
        <button 
          onClick={() => {
            safeStorage.setItem('s6_user_logged_out', 'true');
            signOut(auth);
          }} 
          className="w-full group relative overflow-hidden py-6 bg-rose-500/5 text-rose-500 border-2 border-rose-500/20 rounded-[2rem] hover:bg-rose-500 hover:text-white transition-all duration-500 font-black text-xl shadow-lg hover:shadow-rose-500/40"
        >
          <div className="relative z-10 flex items-center justify-center gap-4">
            <LogOut size={24} className="group-hover:-translate-x-2 transition-transform" />
            <span>{isAr ? 'تسجيل الخروج من الحصن' : 'Logout from Fortress'}</span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </button>
      </div>
    </div>
  );
};

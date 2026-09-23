import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmDialog } from './ConfirmDialog';
import { 
  Settings, 
  Volume2, 
  VolumeX, 
  Type, 
  CheckCircle2, 
  Palette, 
  Languages, 
  Eye, 
  Trash2, 
  RefreshCcw, 
  Bell, 
  ExternalLink,
  Instagram,
  Send,
  AlertTriangle,
  Clock,
  Sun,
  Moon,
  Play,
  X,
  ShieldCheck
} from 'lucide-react';
import { AppSettings, ThemeColor, FontFamily, UserProgress } from '../types';
import { translations } from '../lib/translations';
import { clearMediaCache } from '../utils/imageCacher';
import { PrivacyPolicy } from './PrivacyPolicy';
import { auth } from '../lib/firebase';

interface ControlRoomProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  progress: UserProgress;
  onResetProgress: () => void;
  onClearNotes: () => void;
  onResetSettings: () => void;
  onResetOnboarding?: () => void;
  onOpenPrivacy?: () => void;
  userProfile?: any;
}

export const ControlRoom = ({ 
  settings, 
  setSettings, 
  progress,
  onResetProgress,
  onClearNotes,
  onResetSettings,
  onResetOnboarding,
  onOpenPrivacy,
  userProfile
}: ControlRoomProps) => {
  const t = translations[settings.language];
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [flashingButtonId, setFlashingButtonId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ type: 'clear' | 'reset' | null; isOpen: boolean }>({ type: null, isOpen: false });

  const isDev = 
    auth.currentUser?.email === "mntzralghanm527@gmail.com" || 
    userProfile?.email === "mntzralghanm527@gmail.com" ||
    userProfile?.role === "dev" ||
    userProfile?.isAdmin === true;

  const handleButtonClick = (name: string, id: string, action: () => void) => {
    setToastMessage(`${name} Pressed!`);
    setFlashingButtonId(id);
    action();
    setTimeout(() => {
      setToastMessage(null);
      setFlashingButtonId(null);
    }, 500);
  };

  const fontFamilies: { id: FontFamily; label: string; class: string }[] = [
    { id: 'cairo', label: 'Cairo', class: 'font-cairo' },
    { id: 'tajawal', label: 'Tajawal', class: 'font-tajawal' },
    { id: 'noto-sans', label: 'Noto Sans', class: 'font-noto' },
    { id: 'inter', label: 'Inter', class: 'font-sans' },
  ];

  const themes: { id: ThemeColor; label: string; color: string }[] = [
    { id: 'blue', label: settings.language === 'ar' ? 'أزرق' : 'Blue', color: 'bg-neon-blue' },
    { id: 'purple', label: settings.language === 'ar' ? 'أرجواني' : 'Purple', color: 'bg-neon-purple' },
    { id: 'gold', label: settings.language === 'ar' ? 'ذهبي' : 'Gold', color: 'bg-neon-gold' },
    { id: 'emerald', label: settings.language === 'ar' ? 'زمردي' : 'Emerald', color: 'bg-neon-emerald' },
    { id: 'rose', label: settings.language === 'ar' ? 'وردي' : 'Rose', color: 'bg-neon-rose' },
  ];

  const [playingId, setPlayingId] = useState<string | null>(null);

  const tones = [
    { name: settings.language === 'ar' ? 'بيانو ناعم' : 'Piano Soft', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { name: settings.language === 'ar' ? 'جرس كلاسيكي' : 'Classic Bell', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { name: settings.language === 'ar' ? 'تنبيه رقمي' : 'Digital Alert', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { name: settings.language === 'ar' ? 'جرس المدرسة' : 'School Bell', url: 'https://actions.google.com/sounds/v1/alarms/mechanical_clock_ring.ogg' },
  ];

  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const playPreview = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (!previewAudioRef.current) {
        previewAudioRef.current = new Audio();
        previewAudioRef.current.onended = () => setPlayingId(null);
      }
      
      if (playingId === url) {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
        setPlayingId(null);
      } else {
        previewAudioRef.current.src = url;
        previewAudioRef.current.play().catch(err => {
          console.error("Autoplay prevented:", err);
          alert(settings.language === 'ar' ? 'يرجى السماح بتشغيل الصوت' : 'Please allow audio playback');
          setPlayingId(null);
        });
        setPlayingId(url);
      }
    } catch (err) {
      console.error("Preview error:", err);
      setPlayingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full overflow-x-hidden p-2 sm:p-4">
      {/* 1. App Language */}
      <section className="glass-card p-4 sm:p-6 space-y-6 w-full">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full">
            <div className="p-3 rounded-xl bg-theme-primary/10 text-theme-primary shrink-0">
              <Languages size={24} />
            </div>
            <h3 className="text-lg sm:text-xl font-bold flex-1">{t.appLanguage}</h3>
          </div>
          <div className="flex items-center gap-3 bg-white/5 p-1 rounded-full border border-white/10 shrink-0">
            <button
              onClick={() => setSettings(prev => ({ ...prev, language: 'ar' }))}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${settings.language === 'ar' ? 'bg-theme-primary text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              العربية
            </button>
            <button
              onClick={() => setSettings(prev => ({ ...prev, language: 'en' }))}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${settings.language === 'en' ? 'bg-theme-primary text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              English
            </button>
          </div>
        </div>
      </section>

      {/* 2. Visual Settings */}
      <section className="glass-card p-4 sm:p-6 space-y-8 w-full">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-theme-primary/10 text-theme-primary shrink-0">
            <Palette size={24} />
          </div>
          <h3 className="text-xl font-bold">{t.visualSettings}</h3>
        </div>

        <div className="grid gap-6 w-full">
          {/* Theme Mode Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 w-full">
            <div className="flex items-center gap-3">
              {settings.themeMode === 'dark' ? <Moon size={20} className="text-theme-primary" /> : <Sun size={20} className="text-theme-primary" />}
              <span className="font-bold text-sm sm:text-base">{settings.language === 'ar' ? 'الوضع الليلي' : 'Dark Mode'}</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSettings(prev => ({ ...prev, themeMode: prev.themeMode === 'dark' ? 'light' : 'dark' }))}
              className={`w-12 h-6 rounded-full relative transition-colors ${settings.themeMode === 'dark' ? 'bg-theme-primary' : 'bg-slate-300'}`}
            >
              <motion.div
                animate={{ x: settings.themeMode === 'dark' ? (settings.language === 'ar' ? -26 : 26) : (settings.language === 'ar' ? -4 : 4) }}
                className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-lg"
              />
            </motion.button>
          </div>

          {/* Eye Care Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 w-full">
            <div className="flex items-center gap-3">
              <Eye size={20} className="text-theme-primary" />
              <span className="font-bold text-sm sm:text-base">{t.eyeCare}</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSettings(prev => ({ ...prev, eyeCare: !prev.eyeCare }))}
              className={`w-12 h-6 rounded-full relative transition-colors ${settings.eyeCare ? 'bg-theme-primary' : 'bg-white/20'}`}
            >
              <motion.div
                animate={{ x: settings.eyeCare ? (settings.language === 'ar' ? -26 : 26) : (settings.language === 'ar' ? -4 : 4) }}
                className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-lg"
              />
            </motion.button>
          </div>

          {/* Theme Color */}
          <div className="space-y-4 w-full">
            <span className="text-sm text-white/40 font-bold block">{t.neonTheme}</span>
            <div className="grid grid-cols-5 gap-2 w-full">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    const newSettings = { ...settings, themeColor: theme.id };
                    setSettings(newSettings);
                    handleButtonClick(theme.label, theme.id, () => {});
                  }}
                  className={`h-10 sm:h-12 rounded-xl border-2 transition-all flex items-center justify-center relative z-50 ${
                    settings.themeColor === theme.id
                      ? 'border-theme-primary bg-theme-primary/20 shadow-[0_0_15px_var(--theme-glow)]'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  } ${flashingButtonId === theme.id ? 'bg-yellow-500 border-yellow-500' : ''}`}
                >
                  <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${theme.color} shadow-lg`} />
                </button>
              ))}
            </div>
          </div>

          {/* Font Family & Size */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="space-y-3 w-full">
              <span className="text-sm text-white/40 font-bold block">{t.fontFamily}</span>
              <div className="grid grid-cols-2 gap-2 w-full">
                {fontFamilies.map(ff => (
                  <button
                    key={ff.id}
                    onClick={() => {
                      const newSettings = { ...settings, fontFamily: ff.id };
                      setSettings(newSettings);
                      handleButtonClick(ff.label, ff.id, () => {});
                    }}
                    className={`p-3 rounded-xl border transition-all font-bold text-sm relative z-50 ${
                      settings.fontFamily === ff.id
                        ? 'bg-theme-primary text-black border-theme-primary'
                        : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                    } ${flashingButtonId === ff.id ? 'bg-yellow-500 border-yellow-500' : ''}`}
                  >
                    {ff.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3 w-full">
              <span className="text-sm text-white/40 font-bold block">{t.fontSize}</span>
              <div className="grid grid-cols-3 gap-2 w-full bg-white/5 p-2 rounded-xl border border-white/10">
                <button
                  onClick={() => {
                    setSettings({ ...settings, fontSize: 14 });
                    handleButtonClick(settings.language === 'ar' ? 'صغير' : 'Small', 'font-small', () => {});
                  }}
                  className={`p-3 rounded-lg font-bold transition-all border-2 ${
                    settings.fontSize === 14 
                      ? 'bg-theme-primary text-black border-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.5)]' 
                      : 'bg-white/10 text-white/60 border-transparent hover:bg-white/20'
                  }`}
                >
                  {settings.language === 'ar' ? 'صغير' : 'Small'}
                </button>
                <button
                  onClick={() => {
                    setSettings({ ...settings, fontSize: 18 });
                    handleButtonClick(settings.language === 'ar' ? 'وسط' : 'Medium', 'font-medium', () => {});
                  }}
                  className={`p-3 rounded-lg font-bold transition-all border-2 ${
                    settings.fontSize === 18 
                      ? 'bg-theme-primary text-black border-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.5)]' 
                      : 'bg-white/10 text-white/60 border-transparent hover:bg-white/20'
                  }`}
                >
                  {settings.language === 'ar' ? 'وسط' : 'Medium'}
                </button>
                <button
                  onClick={() => {
                    setSettings({ ...settings, fontSize: 24 });
                    handleButtonClick(settings.language === 'ar' ? 'كبير' : 'Large', 'font-large', () => {});
                  }}
                  className={`p-3 rounded-lg font-bold transition-all border-2 ${
                    settings.fontSize === 24 
                      ? 'bg-theme-primary text-black border-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.5)]' 
                      : 'bg-white/10 text-white/60 border-transparent hover:bg-white/20'
                  }`}
                >
                  {settings.language === 'ar' ? 'كبير' : 'Large'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Confirmation Button */}
          
        </div>
      </section>

      {/* 3. System Management */}
      <section className="glass-card p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-theme-primary/10 text-theme-primary">
            <Settings size={24} />
          </div>
          <h3 className="text-xl font-bold">{t.systemManagement}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setConfirmDialog({ type: 'clear', isOpen: true })}
            className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 font-bold flex items-center justify-center gap-3 hover:bg-rose-500/20 transition-all"
          >
            <Trash2 size={20} />
            {t.clearNotes}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setConfirmDialog({ type: 'reset', isOpen: true })}
            className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 font-bold flex items-center justify-center gap-3 hover:bg-amber-500/20 transition-all"
          >
            <RefreshCcw size={20} />
            {t.resetProgress}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onResetSettings()}
            className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-500 font-bold flex items-center justify-center gap-3 hover:bg-purple-500/20 transition-all"
          >
            <RefreshCcw size={20} />
            {settings.language === 'ar' ? 'استعادة الإعدادات الافتراضية' : 'Reset to Defaults'}
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              setToastMessage(settings.language === 'ar' ? 'جاري تفريغ ذاكرة الوسائط والإنعاش...' : 'Clearing media cache...');
              await clearMediaCache();
              setTimeout(() => {
                window.location.reload();
              }, 600);
            }}
            className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold flex items-center justify-center gap-3 hover:bg-cyan-500/20 transition-all md:col-span-2"
          >
            <RefreshCcw size={20} className="animate-spin" />
            {settings.language === 'ar' ? '⚡ تفريغ ذاكرة التخزين المؤقت للوسائط (Clear Media Cache)' : '⚡ Clear Media Cache & Refresh'}
          </motion.button>
          
          {onResetOnboarding && isDev && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onResetOnboarding();
                setToastMessage(settings.language === 'ar' ? 'تمت إعادة ضبط الجولة التعريفية (خاص بالمطور)' : 'Onboarding reset successfully');
                setTimeout(() => setToastMessage(null), 2000);
              }}
              className="p-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] font-bold flex items-center justify-center gap-3 hover:bg-[#D4AF37]/20 transition-all"
            >
              <RefreshCcw size={20} />
              {settings.language === 'ar' ? 'إعادة عرض اللوحات التعريفية (خاص بالمطور 👑)' : 'Reset Onboarding Tour (Dev Only)'}
            </motion.button>
          )}
        </div>
      </section>

      {/* 5. Notifications */}
      <section className="glass-card p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-theme-primary/10 text-theme-primary">
            <Bell size={24} />
          </div>
          <h3 className="text-xl font-bold">{t.notifications}</h3>
        </div>

        {/* Ringtone Selection */}
        <div className="space-y-4 w-full">
          <span className="text-sm text-white/40 font-bold block">{settings.language === 'ar' ? 'اختر نغمة التنبيه' : 'Select Alarm Tone'}</span>
          <div className="space-y-2">
            {tones.map((tone) => (
              <div key={tone.url} className="flex items-center gap-2">
                <button
                  onClick={() => setSettings(prev => ({ ...prev, studyTone: tone.url }))}
                  className={`flex-1 flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    settings.studyTone === tone.url
                      ? 'border-theme-primary bg-theme-primary/10 text-theme-primary'
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 ${settings.studyTone === tone.url ? 'border-theme-primary bg-theme-primary' : 'border-white/30'}`} />
                  {tone.name}
                </button>
                <button
                  onClick={(e) => playPreview(e, tone.url)}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                  {playingId === tone.url ? <VolumeX size={20} /> : <Play size={20} />}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-theme-primary" />
            <span className="font-bold">{settings.language === 'ar' ? 'منبه الحصص الدراسية' : 'Class Alerts'}</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSettings(prev => ({ ...prev, classAlertsEnabled: !prev.classAlertsEnabled }))}
            className={`w-12 h-6 rounded-full relative transition-colors ${settings.classAlertsEnabled ? 'bg-theme-primary' : 'bg-white/20'}`}
          >
            <motion.div
              animate={{ x: settings.classAlertsEnabled ? (settings.language === 'ar' ? -26 : 26) : (settings.language === 'ar' ? -4 : 4) }}
              className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-lg"
            />
          </motion.button>
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-theme-primary" />
            <span className="font-bold">{t.studyReminder}</span>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="time" 
              value={settings.studyReminder || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, studyReminder: e.target.value }))}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white outline-none focus:border-theme-primary"
            />
            {settings.studyReminder && (
              <button
                onClick={() => setSettings(prev => ({ ...prev, studyReminder: null }))}
                className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors"
                title={settings.language === 'ar' ? 'إلغاء المنبه' : 'Cancel Alarm'}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Day Selection */}
        <div className="space-y-2">
          <span className="text-sm text-white/40 font-bold block">{settings.language === 'ar' ? 'أيام التنبيه' : 'Alarm Days'}</span>
          <div className="grid grid-cols-7 gap-1">
            {[0, 1, 2, 3, 4, 5, 6].map(day => (
              <button
                key={day}
                onClick={() => {
                  const days = settings.studyReminderDays || [];
                  const newDays = days.includes(day) ? days.filter(d => d !== day) : [...days, day];
                  setSettings(prev => ({ ...prev, studyReminderDays: newDays }));
                }}
                className={`p-2 rounded-lg text-xs font-bold transition-all ${
                  (settings.studyReminderDays || []).includes(day)
                    ? 'bg-theme-primary text-black'
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                {settings.language === 'ar' ? ['ح', 'ن', 'ث', 'ع', 'خ', 'ج', 'س'][day] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'][day]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-theme-primary" />
            <span className="font-bold">{t.sovereigntyNotifications}</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSettings(prev => ({ ...prev, sovereigntyNotifications: !prev.sovereigntyNotifications }))}
            className={`w-12 h-6 rounded-full relative transition-colors ${settings.sovereigntyNotifications ? 'bg-theme-primary' : 'bg-white/20'}`}
          >
            <motion.div
              animate={{ x: settings.sovereigntyNotifications ? (settings.language === 'ar' ? -26 : 26) : (settings.language === 'ar' ? -4 : 4) }}
              className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-lg"
            />
          </motion.button>
        </div>
      </section>

      {/* 6. Developer Support & Privacy */}
      <section className="glass-card p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-theme-primary/10 text-theme-primary">
            <ExternalLink size={24} />
          </div>
          <h3 className="text-xl font-bold">{t.techSupport}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="https://t.me/Exashly1998"
            target="_blank"
            rel="noopener noreferrer"
            className="neon-button flex items-center justify-center gap-3 py-4"
          >
            <Send size={20} />
            Telegram: @Exashly1998
          </a>
          <a
            href="https://instagram.com/m.4ku"
            target="_blank"
            rel="noopener noreferrer"
            className="neon-button flex items-center justify-center gap-3 py-4"
          >
            <Instagram size={20} />
            Instagram: m.4ku
          </a>
        </div>

        {/* Official Privacy Policy Card */}
        <div className="pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={() => onOpenPrivacy ? onOpenPrivacy() : setShowPrivacyModal(true)}
            className="w-full p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3 text-right">
              <ShieldCheck size={20} className="shrink-0" />
              <div>
                <span className="block text-sm text-white font-bold">وثيقة سياسة الخصوصية وحماية البيانات</span>
                <span className="block text-[11px] text-white/50 font-normal">مطابقة لسياسات Google Play & Apple App Store</span>
              </div>
            </div>
            <span className="text-xs bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 text-emerald-300">عرض الوثيقة</span>
          </button>
        </div>
      </section>

      {/* Standalone Privacy Policy Modal if opened locally */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-[9999] bg-[#050A18] overflow-y-auto">
          <PrivacyPolicy onBack={() => setShowPrivacyModal(false)} />
        </div>
      )}

      {/* Confirmation Dialog replacement for Modal */}
      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ type: null, isOpen: false })}
        onConfirm={() => {
          if (confirmDialog.type === 'clear') {
            onClearNotes();
            handleButtonClick(t.clearNotes, 'clear', () => {});
          } else if (confirmDialog.type === 'reset') {
            onResetProgress();
            handleButtonClick(t.resetProgress, 'reset', () => {});
          }
          setConfirmDialog({ type: null, isOpen: false });
        }}
        title={t.confirmAction}
        message={confirmDialog.type === 'clear' ? t.confirmClearNotes : t.confirmResetProgress}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-4 right-4 z-[1000] bg-theme-primary text-black p-4 rounded-xl text-center font-bold shadow-lg"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useState } from 'react';
import { auth, db, GoogleAuthProvider as GAP, signInWithPopup as SIP, doc, setDoc } from '@/src/lib/firebase';
const GoogleAuthProvider = GAP as any;
const signInWithPopup = SIP as any;
import { customAuth } from '../services/customAuthService';
import { promptGoogleAccountPicker } from '../lib/googleAuthHelper';
import { safeStorage } from '../lib/storage';
import { Eye, EyeOff, Shield, Zap, Sparkles, Mail, Lock, User, Phone, MapPin, Building, ChevronRight, Layers, BrainCircuit, ShieldCheck } from 'lucide-react';
import { LoadingScreen } from './LoadingScreen';
import { motion, AnimatePresence } from 'motion/react';
import { useAppLogo } from './BerqCharacterManager';
import { PrivacyPolicy } from './PrivacyPolicy';
import { RecoveryModal } from './RecoveryModal';
import { GoogleAccountPickerModal } from './GoogleAccountPickerModal';

const iraqRegions: { [key: string]: string[] } = {
  "بغداد": ["مدرسة المتميزين", "إعدادية المركزية", "ثانوية كلية بغداد", "مدرسة العقيدة", "أخرى (كتابة يدوية)"],
  "ذي قار": ["إعدادية الناصرية للمتفوقين", "ثانوية أور", "مدرسة البطحاء", "إعدادية الفيحاء", "أخرى (كتابة يدوية)"],
  "البصرة": ["إعدادية البصرة", "مدرسة الخليج العربي", "ثانوية المتفوقين في البصرة", "أخرى (كتابة يدوية)"],
  "نينوى": ["إعدادية الشرقية", "ثانوية الموصل للمتميزين", "مدرسة الحدباء", "أخرى (كتابة يدوية)"],
  "بابل": ["إعدادية الحلة للبنين", "مدرسة الجنائن المعلقة", "ثانوية المتفوقات", "أخرى (كتابة يدوية)"],
  "النجف": ["إعدادية النجف الأشرف", "مدرسة الموهوبين", "ثانوية الصدر", "أخرى (كتابة يدوية)"],
  "كربلاء": ["إعدادية كربلاء", "مدرسة الوارث", "ثانوية الذرى", "أخرى (كتابة يدوية)"],
  "الديوانية": ["إعدادية القادسية", "ثانوية المتميزين في الديوانية", "أخرى (كتابة يدوية)"],
  "الأنبار": ["إعدادية الرمادي", "ثانوية الفلوجة للمتميزين", "أخرى (كتابة يدوية)"],
  "ميسان": ["إعدادية العمارة", "مدرسة المتميزين في ميسان", "أخرى (كتابة يدوية)"],
  "المثنى": ["إعدادية السماوة", "ثانوية المتفوقين في المثنى", "أخرى (كتابة يدوية)"],
  "واسط": ["إعدادية الكوت", "ثانوية الكوت للمتميزين", "أخرى (كتابة يدوية)"],
  "ديالى": ["إعدادية بعقوبة", "ثانوية المتميزين في ديالى", "أخرى (كتابة يدوية)"],
  "كركوك": ["إعدادية كركوك", "ثانوية المتميزين في كركوك", "أخرى (كتابة يدوية)"],
  "صلاح الدين": ["إعدادية تكريت", "ثانوية المتفوقين", "أخرى (كتابة يدوية)"],
  "أربيل": ["ثانوية أربيل النموذجية", "أخرى (كتابة يدوية)"],
  "السليمانية": ["ثانوية السليمانية للمتفوقين", "أخرى (كتابة يدوية)"],
  "دهوك": ["ثانوية دهوك النموذجية", "أخرى (كتابة يدوية)"]
};

interface AuthPageProps {
  onOpenPrivacy?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onOpenPrivacy }) => {
  const appLogo = useAppLogo();
  const [isLogin, setIsLogin] = useState(true);
  const [showInternalPrivacy, setShowInternalPrivacy] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showGooglePickerModal, setShowGooglePickerModal] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '', governorate: '', school: '', phone: '' });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setAuthLoading(true);
    try {
      if (isLogin) {
        await customAuth.loginWithEmail(formData.email, formData.password);
        safeStorage.setItem('s6_activeSection', 'hub');
      } else {
        const user = await customAuth.registerWithEmail(formData.email, formData.password, formData.fullName || 'مستخدم جديد', 'student', 'general');
        safeStorage.setItem('s6_activeSection', 'hub');
        try {
          await setDoc(doc(db, 'users', user.uid), {
            fullName: formData.fullName,
            governorate: formData.governorate,
            schoolName: formData.school,
            phoneNumber: formData.phone ? '+964' + formData.phone : '',
            rank: 'طالب جديد',
            xp: 0,
            status: 'online'
          });
        } catch (docErr) {
          console.warn('User registered in SQL, Firestore sync warning:', docErr);
        }
      }
    } catch (err: any) {
      const msg = err.message || err.error || '';
      if (err.code === 'auth/email-already-in-use' || msg.includes('موجود بالفعل') || msg.includes('مسجل مسبقاً')) {
        setError('هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول أو استعادة كلمة المرور.');
      } else if (err.code === 'auth/invalid-credential' || msg.includes('غير صحيحة') || msg.includes('Invalid credentials')) {
        setError('البريد الإلكتروني أو كلمة السر غير صحيحة.');
      } else if (msg) {
        setError(msg);
      } else {
        setError('حدث خطأ أثناء الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.');
      }
      console.error("Auth Error details:", err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOpenGooglePicker = () => {
    setError(null);
    setMessage(null);
    setShowGooglePickerModal(true);
  };

  const handleSelectGoogleAccount = async (account: { email: string; name?: string; photoURL?: string }) => {
    setError(null);
    setMessage(null);
    setAuthLoading(true);
    try {
      await customAuth.loginWithGoogle(account.email, account.name, account.photoURL);
      safeStorage.setItem('s6_activeSection', 'hub');
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      const msg = err.message || 'فشل تسجيل الدخول عبر Google';
      setError(msg);
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('يرجى إدخال البريد الإلكتروني أولاً.');
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const res = await customAuth.forgotPassword(formData.email);
      setMessage(res.message || 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إرسال رابط استعادة كلمة المرور.');
    }
  };

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (showInternalPrivacy) {
    return <PrivacyPolicy onBack={() => setShowInternalPrivacy(false)} />;
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden bg-[#020617] text-right font-sans" dir="rtl">
      
      {/* Background Splashes & Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#0A1024] to-[#050A18] pointer-events-none" />
      
      {/* Starry Tech Nodes Effect */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-10" 
           style={{ 
             backgroundImage: 'radial-gradient(circle at center, rgba(212,175,55,0.8) 1px, transparent 1px)', 
             backgroundSize: '40px 40px',
             backgroundPosition: '0 0, 20px 20px'
           }} 
      />
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D4AF37]/15 via-transparent to-transparent opacity-80" />
      
      {/* Dynamic Glow Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#D4AF37]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00E5FF]/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Content Container - Edge to Edge Feel */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md flex flex-col items-center justify-center"
      >
        {/* Header Section */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex flex-col items-center mb-10 w-full"
        >
          <img 
            src={appLogo} 
            alt="بوابة بيرق" 
            className="w-36 h-auto mb-6 object-contain rounded-[25px] drop-shadow-[0_0_20px_rgba(212,175,55,0.3)]" 
            style={{ maskImage: 'radial-gradient(circle at center, black 55%, transparent 100%)', WebkitMaskImage: 'radial-gradient(circle at center, black 55%, transparent 100%)' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/logo.png';
            }}
          />
          <h1 className="text-2xl sm:text-3xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 mb-2 text-center tracking-tight leading-tight whitespace-nowrap">
            مرحباً بك في بوابة المستقبل
          </h1>
          <p className="text-[#FFD700] text-lg font-bold opacity-100 text-center flex items-center gap-2 drop-shadow-[0_0_8px_rgba(255,215,0,0.4)]">
            <Sparkles size={16} /> المنصة التعليمية الرائدة بالذكاء الاصطناعي
          </p>
        </motion.div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-4 overflow-hidden"
              >
                {/* Full Name */}
                <div className="relative w-full group">
                  <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-white/40 group-focus-within:text-[#D4AF37] transition-colors">
                    <User size={22} strokeWidth={1.5} />
                  </div>
                  <input 
                    type="text" 
                    required={!isLogin}
                    placeholder="الاسم الثلاثي" 
                    value={formData.fullName || ''}
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                    className="w-full bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-4 pr-16 rounded-[2rem] outline-none text-white placeholder-white/40 focus:bg-white/[0.05] focus:border-amber-400 focus:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all text-lg font-medium"
                  />
                </div>

                {/* Governorate */}
                <div className="relative w-full group">
                  <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-white/40 group-focus-within:text-[#D4AF37] transition-colors">
                    <MapPin size={22} strokeWidth={1.5} />
                  </div>
                  <select 
                    required={!isLogin}
                    value={formData.governorate || ''}
                    onChange={e => setFormData({...formData, governorate: e.target.value})}
                    className="w-full bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-4 pr-16 rounded-[2rem] outline-none text-white placeholder-white/40 focus:bg-white/[0.05] focus:border-amber-400 focus:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all text-lg font-medium appearance-none"
                  >
                    <option value="" className="bg-[#050A18] text-white">المحافظة</option>
                    {Object.keys(iraqRegions).map(p => <option key={p} value={p} className="bg-[#050A18] text-white">{p}</option>)}
                  </select>
                </div>

                {/* School */}
                <div className="relative w-full group">
                  <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-white/40 group-focus-within:text-[#D4AF37] transition-colors">
                    <Building size={22} strokeWidth={1.5} />
                  </div>
                  <input 
                    type="text"
                    required={!isLogin}
                    placeholder="اسم المدرسة"
                    value={formData.school || ''}
                    onChange={e => setFormData({...formData, school: e.target.value})}
                    className="w-full bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-4 pr-16 rounded-[2rem] outline-none text-white placeholder-white/40 focus:bg-white/[0.05] focus:border-amber-400 focus:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all text-lg font-medium text-right"
                  />
                </div>

                {/* Phone */}
                <div className="relative w-full group">
                  <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-white/40 group-focus-within:text-[#D4AF37] transition-colors">
                    <span className="text-[#D4AF37] font-bold text-sm tracking-wider dir-ltr">+964</span>
                  </div>
                  <div className="absolute inset-y-0 right-16 flex items-center">
                     <span className="h-6 w-px bg-white/20"></span>
                  </div>
                  <input 
                    type="tel" 
                    required={!isLogin}
                    maxLength={10} 
                    value={formData.phone || ''}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="7XXXXXXXXX" 
                    className="w-full bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-4 pr-20 rounded-[2rem] outline-none text-white placeholder-white/40 focus:bg-white/[0.05] focus:border-amber-400 focus:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all text-lg font-medium"
                    dir="ltr"
                  />
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-white/40 group-focus-within:text-[#D4AF37] transition-colors">
                     <Phone size={22} strokeWidth={1.5} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email */}
          <div className="relative w-full group">
            <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-white/40 group-focus-within:text-[#D4AF37] transition-colors">
              <Mail size={22} strokeWidth={1.5} />
            </div>
            <input 
              type="email" 
              required
              placeholder="البريد الإلكتروني" 
              value={formData.email || ''}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-4 pr-16 rounded-[2rem] outline-none text-white placeholder-white/40 focus:bg-white/[0.05] focus:border-amber-400 focus:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all text-lg font-medium"
            />
          </div>

          {/* Password */}
          <div className="relative w-full group">
            <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-white/40 group-focus-within:text-[#D4AF37] transition-colors">
              <Lock size={22} strokeWidth={1.5} />
            </div>
            <input 
              type={showPassword ? "text" : "password"} 
              required
              placeholder="كلمة المرور" 
              value={formData.password || ''}
              onChange={e => setFormData({...formData, password: e.target.value})}
              className="w-full bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-4 pr-16 rounded-[2rem] outline-none text-white placeholder-white/40 focus:bg-white/[0.05] focus:border-amber-400 focus:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all text-lg font-medium"
            />
            <button 
              type="button" 
              className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 hover:text-[#D4AF37] transition-colors" 
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={22} strokeWidth={1.5} /> : <Eye size={22} strokeWidth={1.5} />}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-rose-500 text-sm font-bold text-center mt-2 px-4 shadow-sm bg-rose-500/10 py-2 rounded-xl">
                {error}
              </motion.p>
            )}
            {message && (
              <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-emerald-500 text-sm font-bold text-center mt-2 px-4 shadow-sm bg-emerald-500/10 py-2 rounded-xl">
                {message}
              </motion.p>
            )}
          </AnimatePresence>

          {isLogin && (
            <div className="flex justify-between items-center px-2 mt-1 mb-2">
              <button 
                type="button" 
                onClick={() => setShowRecoveryModal(true)} 
                className="text-sm text-amber-400/90 hover:text-amber-300 transition-colors font-medium flex items-center gap-1.5"
              >
                <span>نسيت كلمة المرور؟</span>
              </button>
            </div>
          )}

          {/* Primary Submit Button */}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full py-4.5 bg-gradient-to-r from-[#F59E0B] via-[#FFD700] to-[#F59E0B] bg-[length:200%_auto] hover:bg-[position:right_center] text-[#050A18] font-black text-xl rounded-[2rem] transition-all shadow-[0_10px_35px_-5px_rgba(245,158,11,0.5)] mt-2 flex justify-center items-center gap-2"
          >
            {isLogin ? 'دخول إلى بوابة بيرق' : 'إنشاء حساب جديد'}
          </motion.button>
        </form>

        {isLogin && (
          <div className="w-full mt-6 flex flex-col gap-5">
            <div className="flex items-center gap-4 w-full px-2">
              <div className="h-px bg-gradient-to-r from-transparent to-white/5 flex-1" />
              <span className="text-white/20 text-sm font-medium">أو</span>
              <div className="h-px bg-gradient-to-l from-transparent to-white/5 flex-1" />
            </div>

            {/* Google Fast Sign In */}
            <div className="flex justify-center w-full">
              <motion.button 
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.95)" }}
                whileTap={{ scale: 0.95 }}
                onClick={handleOpenGooglePicker} 
                type="button"
                className="py-4 px-8 bg-white text-gray-900 font-bold text-[17px] rounded-[1.5rem] flex items-center justify-center gap-3 transition-all shadow-[0_10px_25px_rgba(255,255,255,0.1)] w-auto"
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" className="w-7 h-7 shrink-0 -mt-0.5" alt="Google" />
                <span className="whitespace-nowrap">المتابعة باستخدام Google</span>
              </motion.button>
            </div>
          </div>
        )}

        {/* Toggle Mode */}
        <div className="mt-8 text-center">
          <button 
            type="button" 
            onClick={() => { setIsLogin(!isLogin); setError(null); setMessage(null); }}
            className="text-white/60 hover:text-white font-medium text-lg flex items-center justify-center gap-2 transition-colors mx-auto"
          >
            {isLogin ? 'ليس لديك حساب؟' : 'لديك حساب مسبقاً؟'}
            <span className="text-white font-bold underline underline-offset-4 decoration-white/30 hover:decoration-[#FFD700] hover:text-[#FFD700] transition-all">
              {isLogin ? <><span className="text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]">سجل كفارس</span> جديد</> : 'الدخول للبوابة'}
            </span>
          </button>
        </div>

        {/* Quality Indicators & Privacy Policy Link */}
        <div className="flex justify-between w-full max-w-[320px] mx-auto mt-10 mb-3 text-white/50 text-xs font-bold">
          <span className="flex flex-col items-center gap-1.5"><Shield size={16} className="text-[#FFD700]/90 drop-shadow-[0_0_5px_rgba(255,215,0,0.4)]"/> آمن</span>
          <span className="flex flex-col items-center gap-1.5"><Zap size={16} className="text-[#FFD700]/90 drop-shadow-[0_0_5px_rgba(255,215,0,0.4)]"/> سريع</span>
          <span className="flex flex-col items-center gap-1.5"><BrainCircuit size={16} className="text-[#FFD700]/90 drop-shadow-[0_0_5px_rgba(255,215,0,0.4)]"/> ذكي</span>
          <span className="flex flex-col items-center gap-1.5"><Layers size={16} className="text-[#FFD700]/90 drop-shadow-[0_0_5px_rgba(255,215,0,0.4)]"/> متكامل</span>
        </div>

        {/* Official Privacy Policy Link for App Stores & Users */}
        <div className="text-center pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={() => onOpenPrivacy ? onOpenPrivacy() : setShowInternalPrivacy(true)}
            className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-amber-400 transition-colors font-medium"
          >
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>سياسة الخصوصية وحماية البيانات (Privacy Policy)</span>
          </button>
        </div>

      </motion.div>

      {/* Google Account Picker Modal */}
      <GoogleAccountPickerModal
        isOpen={showGooglePickerModal}
        onClose={() => setShowGooglePickerModal(false)}
        initialEmail={formData.email}
        onSelectAccount={handleSelectGoogleAccount}
      />

      {/* Recovery Modal (WhatsApp & Email) */}
      <RecoveryModal
        isOpen={showRecoveryModal}
        onClose={() => setShowRecoveryModal(false)}
        initialEmail={formData.email}
        onSuccessLogin={() => {
          setShowRecoveryModal(false);
          setMessage('تم تحديث كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول مباشرة.');
        }}
      />
    </div>
  );
};


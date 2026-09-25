import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, MapPin, ShieldCheck, ChevronLeft } from 'lucide-react';
import { doc, setDoc } from '../lib/firebase';
import { db } from '../lib/firebase';

const iraqGovernorates = [
  "بغداد", "ذي قار", "البصرة", "نينوى", "بابل", "النجف", "كربلاء", 
  "الديوانية", "الأنبار", "ميسان", "المثنى", "واسط", "ديالى", 
  "كركوك", "صلاح الدين", "أربيل", "السليمانية", "دهوك"
];

interface ProfileSetupProps {
  userId: string;
  onComplete: (updatedProfile: any) => void;
  language: 'ar' | 'en';
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ userId, onComplete, language }) => {
  const [fullName, setFullName] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().split(' ').length < 2) {
      setError(language === 'ar' ? 'يرجى إدخال الاسم الثنائي على الأقل' : 'Please enter at least two names');
      return;
    }
    if (!governorate) {
      setError(language === 'ar' ? 'يرجى اختيار المحافظة' : 'Please select a governorate');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userRef = doc(db, 'users', userId);
      const updates = {
        fullName: fullName.trim(),
        governorate: governorate,
        profileCompleted: true,
        status: 'online',
        lastActive: new Date().toISOString()
      };
      
      await setDoc(userRef, updates, { merge: true });
      onComplete(updates);
    } catch (err: any) {
      console.error("Error completing profile:", err);
      setError(language === 'ar' ? 'حدث خطأ أثناء حفظ البيانات' : 'Error saving profile data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-[#020617] flex items-center justify-center p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-lg p-8 border-theme-primary/30 relative overflow-hidden"
      >
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-theme-primary/10 blur-3xl rounded-full -mr-16 -mt-16" />
        
        <div className="text-center mb-8 relative z-10">
          <div className="w-20 h-20 bg-theme-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-theme-primary shadow-[0_0_20px_var(--theme-glow)]">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">
            {language === 'ar' ? 'إعداد هوية الفارس' : 'Knight Identity Setup'}
          </h2>
          <p className="text-white/60">
            {language === 'ar' ? 'أكمل بياناتك لتتمكن من الظهور في قائمة الفرسان والمنافسة على العرش' : 'Complete your details to appear in the knights list and compete for the throne'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-bold text-white/40 mb-2 mr-1">
              {language === 'ar' ? 'الاسم الكامل (الثنائي أو الثلاثي)' : 'Full Name (Double or Triple)'}
            </label>
            <div className="relative">
              <User className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
              <input 
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 p-4 pr-12 rounded-xl focus:border-theme-primary outline-none transition-all text-white"
                placeholder={language === 'ar' ? 'مثال: أحمد علي' : 'e.g., Ahmed Ali'}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-white/40 mb-2 mr-1">
              {language === 'ar' ? 'المحافظة' : 'Governorate'}
            </label>
            <div className="relative">
              <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
              <select 
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 p-4 pr-12 rounded-xl focus:border-theme-primary outline-none transition-all text-white appearance-none"
              >
                <option value="" className="bg-charcoal text-white/40">
                  {language === 'ar' ? 'اختر محافظتك...' : 'Select your governorate...'}
                </option>
                {iraqGovernorates.map(gov => (
                  <option key={gov} value={gov} className="bg-charcoal text-white">
                    {gov}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-rose-500 text-sm text-center font-bold"
            >
              {error}
            </motion.p>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-theme-primary text-black font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_var(--theme-glow)] disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <span>{language === 'ar' ? 'تأكيد الهوية والعبور' : 'Confirm Identity & Enter'}</span>
                <ChevronLeft size={20} />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

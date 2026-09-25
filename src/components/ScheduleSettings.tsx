import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from '../lib/firebase';
import { db } from '../lib/firebase';
import { Save, Plus, Trash2 } from 'lucide-react';
import { safeStorage, safeSessionStorage } from '../lib/storage';

interface Props {
  schoolId: string | null;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export const ScheduleSettings: React.FC<Props> = ({ schoolId, showToast }) => {
  const [times, setTimes] = useState<string[]>([]);
  const [newTime, setNewTime] = useState('');
  const [isAlertsEnabled, setIsAlertsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    const fetchSettings = async () => {
      const docRef = doc(db, 'school_settings', schoolId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.times) setTimes(data.times);
        if (data.isAlertsEnabled !== undefined) setIsAlertsEnabled(data.isAlertsEnabled);
      } else {
        // Default
        setTimes(['08:00 صباحاً', '09:00 صباحاً', '10:00 صباحاً', '11:00 صباحاً', '12:00 ظهراً', '01:00 ظهراً', '02:00 ظهراً', '03:00 عصراً', '04:00 عصراً', '05:00 عصراً']);
        setIsAlertsEnabled(true);
      }
      setLoading(false);
    };
    fetchSettings();
  }, [schoolId]);

  const handleSave = async () => {
    if (!schoolId) return;
    try {
      await setDoc(doc(db, 'school_settings', schoolId), { times, isAlertsEnabled }, { merge: true });
      safeStorage.setItem('classAlertsEnabled', String(isAlertsEnabled));
      showToast('تم حفظ الإعدادات بنجاح', 'success');
    } catch (e) {
      showToast('حدث خطأ أثناء الحفظ', 'error');
    }
  };

  const addTime = () => {
    if (newTime && !times.includes(newTime)) {
        setTimes([...times, newTime]);
        setNewTime('');
    }
  };

  const removeTime = (time: string) => {
      setTimes(times.filter(t => t !== time));
  };

  if (loading) return <div className="text-white">جاري التحميل...</div>;

  return (
    <div className="bg-[#101935] p-6 rounded-[30px] border border-white/5 space-y-6">
      <h3 className="text-xl font-black text-white">إعدادات أوقات الحصص</h3>
      
      <div className="flex gap-2">
        <input 
            type="text" 
            value={newTime} 
            onChange={e => setNewTime(e.target.value)}
            placeholder="أدخل وقت جديد (مثلاً 08:30 صباحاً)"
            className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-3 text-white"
        />
        <button onClick={addTime} className="bg-purple-600 p-3 rounded-2xl text-white"><Plus /></button>
      </div>

      <div className="flex flex-wrap gap-2">
        {times.map(t => (
            <div key={t} className="bg-white/5 px-4 py-2 rounded-xl flex items-center gap-2 text-white">
                {t}
                <button onClick={() => removeTime(t)} className="text-rose-500"><Trash2 size={14} /></button>
            </div>
        ))}
      </div>

      <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/10">
        <span className="text-white font-bold">تفعيل منبه الحصص</span>
        <button 
           onClick={() => setIsAlertsEnabled(!isAlertsEnabled)}
           className={`w-12 h-6 rounded-full transition-colors ${isAlertsEnabled ? 'bg-emerald-600' : 'bg-gray-600'}`}
        >
          <div className={`w-3 h-3 rounded-full bg-white transition-transform ${isAlertsEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
      </div>

      <button onClick={handleSave} className="w-full bg-emerald-600 p-4 rounded-2xl text-white font-black flex items-center justify-center gap-2">
        <Save /> حفظ التغييرات
      </button>
    </div>
  );
};

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, X, Save } from 'lucide-react';
import { getSubjectsForGrade } from '../utils/studentUtils';
import { logActivity } from '../utils/auditLogger';

interface GradingModalProps {
  gradingStudent: any | null;
  setGradingStudent: (student: any | null) => void;
  setStudents: React.Dispatch<React.SetStateAction<any[]>>;
  showToast: (message: string, type?: 'success' | 'error') => void;
  subjectMapping?: any;
}

export const GradingModal: React.FC<GradingModalProps> = ({
  gradingStudent,
  setGradingStudent,
  setStudents,
  showToast,
  subjectMapping
}) => {
  if (!gradingStudent) return null;

  const subjects = getSubjectsForGrade(gradingStudent.grade, [], subjectMapping);

  const handleSave = () => {
    setStudents(prev => prev.map(s => s.code === gradingStudent.code || s.student === gradingStudent.student ? gradingStudent : s));
    setGradingStudent(null);
    showToast('تم حفظ درجات الطالب ومزامنتها بنجاح');

    logActivity({
      action: 'تعديل درجات',
      details: `تم تحديث درجات الطالب: ${gradingStudent.name} (كود: ${gradingStudent.student || gradingStudent.code})`,
      targetId: gradingStudent.student || gradingStudent.code,
      targetType: 'student_grades',
      targetName: gradingStudent.name
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4"
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="bg-[#101935] w-full max-w-2xl h-full sm:h-auto sm:max-h-[85vh] sm:rounded-[40px] border border-white/10 shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="shrink-0 p-8 bg-gradient-to-b from-white/5 to-transparent relative">
            <button 
              onClick={() => setGradingStudent(null)}
              className="absolute top-8 left-8 text-white/30 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            <div className="w-16 h-16 bg-[#FFD600] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <GraduationCap size={32} className="text-[#0D47A1]" />
            </div>
            <h3 className="text-2xl font-black text-center text-white">{gradingStudent.name}</h3>
            <p className="text-[#FFD600] text-center text-xs font-bold mt-1 tracking-widest uppercase">تعديل درجات الطالب • {gradingStudent.code}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-[#050A18]/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjects.map((sub) => (
                <div key={sub.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
                  <label className="text-white/40 text-[10px] font-black">{sub.name}</label>
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    value={gradingStudent.grades?.[sub.id] || 0}
                    onChange={(e) => {
                      const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                      setGradingStudent({
                        ...gradingStudent,
                        grades: { ...gradingStudent.grades, [sub.id]: val }
                      });
                    }}
                    className="bg-black/30 border border-white/10 rounded-xl h-12 text-center text-white font-black text-xl outline-none focus:border-[#FFD600] transition-all"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="shrink-0 p-8 bg-[#0D47A1]/20 flex gap-4">
            <button 
              onClick={handleSave}
              className="flex-1 h-16 bg-[#FFD600] rounded-2xl text-[#0D47A1] font-black text-lg shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Save size={24} />
              حفظ الدرجات والمزامنة
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

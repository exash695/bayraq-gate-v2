import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, X } from 'lucide-react';

interface DiscountSimulatorModalProps {
  show: boolean;
  onClose: () => void;
}

export const DiscountSimulatorModal: React.FC<DiscountSimulatorModalProps> = ({
  show,
  onClose
}) => {
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 text-white"
      >
         <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-[#101935] border border-emerald-500/30 rounded-[30px] p-6 w-full max-w-sm shadow-[0_0_50px_rgba(16,185,129,0.1)] relative"
         >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-white/30 hover:text-white"
            >
              <X size={20} />
            </button>
            
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
               <PieChart size={32} />
            </div>
            
            <h3 className="text-xl font-black text-center text-white mb-2">محاكاة نظام الخصومات</h3>
            <p className="text-center text-white/40 text-[11px] mb-8 font-bold">نموذج تطبيقي لكيفية اقتطاع الخصومات للمشمولين بالرعاية أو لذوي الشهداء.</p>
            
            <div className="space-y-4">
              <div className="bg-black/30 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                 <span className="text-white/60 text-xs font-bold">مبلغ القسط الكلي (الأساسي)</span>
                 <span className="text-white font-black">1,000,000 <span className="text-[9px] text-white/40">د.ع</span></span>
              </div>
              
              <div className="bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20 flex flex-col gap-2">
                 <div className="flex items-center gap-2">
                   <span className="bg-rose-500 text-white px-2 py-0.5 rounded text-[10px] font-black">مثال</span>
                   <span className="text-rose-400 text-xs font-bold">فئة المشمولين (ذوي الشهداء)</span>
                 </div>
                 <div className="flex justify-between items-center mt-2 border-t border-rose-500/10 pt-2">
                   <span className="text-white/60 text-[11px] font-bold">الخصم المطبق (25%)</span>
                   <span className="text-rose-400 font-black">-250,000 <span className="text-[9px]">د.ع</span></span>
                 </div>
              </div>

              <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/30 flex justify-between items-center">
                 <span className="text-emerald-400 text-sm font-black">قيمة القسط النهائي للطالب</span>
                 <span className="text-emerald-400 font-black text-xl">750,000 <span className="text-[9px]">د.ع</span></span>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="w-full h-12 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black text-sm transition-all mt-6"
            >
              حسناً، فهمت الآلية
            </button>
         </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

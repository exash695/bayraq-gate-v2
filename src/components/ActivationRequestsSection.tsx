import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, AlertCircle } from 'lucide-react';

interface ActivationRequestsSectionProps {
  schoolId: string;
}

export const ActivationRequestsSection: React.FC<ActivationRequestsSectionProps> = ({ schoolId }) => {
  return (
    <div className="p-6 bg-[#0B1220] border border-amber-500/20 rounded-2xl shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-amber-500/10 rounded-xl">
          <ShieldCheck className="text-amber-400" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">تفعيل الفرسان (WhatsApp)</h2>
          <p className="text-gray-400 text-sm">إدارة طلبات التفعيل الواردة من تطبيق الطالب</p>
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="p-4 bg-gray-800/50 rounded-full">
          <AlertCircle className="text-gray-500" size={48} />
        </div>
        <div>
          <p className="text-gray-300 font-medium">لا توجد طلبات تفعيل معلقة حالياً</p>
          <p className="text-gray-500 text-sm mt-1">سيتم عرض الطلبات التي تصل عبر WhatsApp هنا تلقائياً</p>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Gate6Reader } from './Gate6Reader';

const demoPages = [
  {
    id: "page_1",
    title: "المقدمة: عالم الفيزياء الحديثة",
    content: (
      <div className="space-y-6">
        <p>
          الفيزياء الحديثة هي أحد فروع الفيزياء التي تتعامل مع الظواهر التي لا يمكن تفسيرها بواسطة الميكانيكا الكلاسيكية (النيوتنية). 
          بدأ هذا العصر بظهور نظريتين ثوريتين في أوائل القرن العشرين: نظرية النسبية ونظرية ميكانيكا الكم.
        </p>
        <div className="bg-amber-500/10 border-r-4 border-amber-500 p-6 rounded-l-xl text-amber-100 italic">
          "إن الخيال أهم من المعرفة، لأن المعرفة محدودة، بينما الخيال يطوق العالم كله." - ألبرت أينشتاين
        </div>
        <p>
          حيث أدت هذه النظريات إلى تغيير جذري في فهمنا للكون، من أصغر الجسيمات دون الذرية إلى أكبر المجرات والنجوم في الفضاء السحيق.
        </p>
        
        {/* Click to reveal component simulation */}
        <details className="group mt-8 bg-white/5 border border-white/10 rounded-2xl cursor-pointer">
          <summary className="p-4 font-bold text-emerald-400 outline-none list-none flex items-center justify-between">
            <span>انقر لإظهار: ما هو الفرق الأساسي بين الميكانيكا الكلاسيكية والحديثة؟</span>
            <span className="text-white/30 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="p-4 pt-0 border-t border-white/5 text-slate-300">
            الميكانيكا الكلاسيكية تتعامل مع الأجسام العادية بسرعات عادية، بينما الحديثة تتعامل إما مع سرعات تقارب سرعة الضوء (النسبية) أو أحجام متناهية الصغر (الكم).
          </div>
        </details>
      </div>
    )
  },
  {
    id: "page_2",
    title: "المفاهيم الأساسية في ميكانيكا الكم",
    content: (
      <div className="space-y-6">
        <p>
          ميكانيكا الكم هي النظرية الأساسية في الفيزياء التي توفر وصفًا للخصائص الفيزيائية للطبيعة على مقياس الذرات والجسيمات دون الذرية.
        </p>
        <ul className="list-disc list-inside space-y-3 text-slate-300 marker:text-amber-500">
          <li><strong>مبدأ عدم اليقين لهيزنبرج:</strong> لا يمكننا أبداً معرفة موقع وزخم الجسيم في نفس الوقت بدقة متناهية.</li>
          <li><strong>الازدواجية (موجة-جسيم):</strong> كل جسيم أو كيان كمي يمكن وصفه إما كجسيم أو كموجة.</li>
          <li><strong>التشابك الكمي:</strong> ظاهرة ترتبط فيها الجسيمات ببعضها بحيث لا يمكن وصف حالة الجسيم الواحد بشكل مستقل عن حالة الجسيمات الأخرى.</li>
        </ul>
      </div>
    )
  }
];

export const Gate6Demo: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#05070A] flex items-center justify-center p-6 text-white" dir="rtl">
      <div className="max-w-md text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black bg-gradient-to-r from-amber-300 to-amber-600 bg-clip-text text-transparent">بوابة بيرق Gate 6</h1>
          <p className="text-white/50 text-sm font-medium">تجربة واجهة الطالب المستقلة (Strict Content Mode)</p>
        </div>
        
        <button
          onClick={() => setIsOpen(true)}
          className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl font-bold transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 w-full"
        >
          <span className="text-2xl">🚀</span>
          <span>إطلاق البوابة (عرض تجريبي)</span>
        </button>
      </div>

      {isOpen && (
        <Gate6Reader 
          fileTitle="فيزياء السادس العلمي - الفصل الخامس"
          unitTitle="الفيزياء الحديثة"
          pages={demoPages}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

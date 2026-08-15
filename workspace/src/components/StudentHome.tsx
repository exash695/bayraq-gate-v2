import React from 'react';
import { BookOpen, Award, CheckCircle2, Clock, Calendar, FileText, ArrowRight, Bell } from 'lucide-react';

export const StudentHome: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-l from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute left-0 bottom-0 opacity-10 translate-x-10 translate-y-10">
          <BookOpen className="w-64 h-64" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="bg-emerald-500/30 text-emerald-100 text-xs px-3 py-1 rounded-full font-medium inline-block mb-2">
              الصف الثاني الثانوي • الفصل الدراسي الثاني
            </span>
            <h1 className="text-2xl md:text-3xl font-bold">أهلاً بك، أحمد محمد 👋</h1>
            <p className="text-emerald-100 mt-1 text-sm md:text-base">
              لديك اليوم 4 حصص دراسية وواجبان جديدان قيد الانتظار. واصل تفوقك!
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/25 flex items-center gap-4">
            <div className="text-center">
              <span className="block text-2xl font-bold text-emerald-200">96.8%</span>
              <span className="text-xs text-emerald-100">المعدل التراكمي</span>
            </div>
            <div className="h-10 w-px bg-white/2ning"></div>
            <div className="text-center">
              <span className="block text-2xl font-bold text-emerald-200">المركز 3</span>
              <span className="text-xs text-emerald-100">على الصف</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">مطلوب اليوم</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mt-4">2</h3>
          <p className="text-sm text-slate-500">واجبات منزلية معلقة</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">التالي</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mt-4">الفيزياء</h3>
          <p className="text-sm text-slate-500">يبدأ الحصة القادمة 10:00 ص</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Award className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded">ممتاز</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mt-4">98/100</h3>
          <p className="text-sm text-slate-500">آخر اختبار رياضيات</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">100%</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mt-4">منتظم</h3>
          <p className="text-sm text-slate-500">سجل الحضور هذا الشهر</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              جدول الحصص اليومي
            </h2>
            <button className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1">
              الجدول الأسبوعي <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {[
              { time: '08:00 - 08:45 ص', subject: 'الرياضيات المتقدمة', teacher: 'أ. سالم القحطاني', room: 'قاعة 102', status: 'منتهية' },
              { time: '08:50 - 09:35 ص', subject: 'اللغة العربية والإنشاء', teacher: 'أ. فهد العمري', room: 'قاعة 102', status: 'منتهية' },
              { time: '10:00 - 10:45 ص', subject: 'الفيزياء الكمية', teacher: 'د. خالد الزهراني', room: 'مختبر الفيزياء', status: 'الحالية' },
              { time: '10:50 - 11:35 ص', subject: 'اللغة الإنجليزية', teacher: 'أ. ميكيل براون', room: 'قاعة 102', status: 'قادمة' },
              { time: '11:40 - 12:25 م', subject: 'الكيمياء العضوية', teacher: 'أ. نورة الشمري', room: 'مختبر الكيمياء', status: 'قادمة' },
            ].map((cls, idx) => (
              <div 
                key={idx} 
                className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all ${
                  cls.status === 'الحالية' 
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' 
                    : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    cls.status === 'الحالية' ? 'bg-emerald-600 text-white animate-pulse' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {cls.status}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{cls.subject}</h4>
                    <p className="text-xs text-slate-500">{cls.teacher} • {cls.room}</p>
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-600 bg-white px-3 py-1 rounded-md border border-slate-200">
                  {cls.time}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assignments & Tasks Sidebar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                الواجبات والمهام
              </h2>
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold">2 معلق</span>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800 text-sm">بحث في قوانين الحركة</h4>
                  <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-medium">متبقي يومان</span>
                </div>
                <p className="text-xs text-slate-600 mb-3">مادة الفيزياء - تسليم تقرير موجز عن تطبيقات قوانين نيوتن الثلاثة.</p>
                <button className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors">
                  رفع الحل الآن
                </button>
              </div>

              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800 text-sm">حل تمارين المعادلات التفاضلية</h4>
                  <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-medium">متبقي 3 أيام</span>
                </div>
                <p className="text-xs text-slate-600 mb-3">مادة الرياضيات - الأسئلة من 1 إلى 15 في الكتاب المدرسي.</p>
                <button className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors">
                  عرض التفاصيل
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">تحتاج مساعدة في دراستك؟ <a href="#" className="text-emerald-600 font-bold hover:underline">المعلم الذكي متاح الآن</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

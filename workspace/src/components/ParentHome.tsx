import React from 'react';
import { Users, Award, CheckCircle2, Calendar, FileText, Bell, PhoneCall, ArrowRight, Heart } from 'lucide-react';

export const ParentHome: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-l from-amber-600 to-orange-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute left-0 bottom-0 opacity-10 translate-x-10 translate-y-10">
          <Users className="w-64 h-64" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="bg-amber-500/30 text-amber-100 text-xs px-3 py-1 rounded-full font-medium inline-block mb-2">
              ولي أمر الأبناء: أحمد ومريم محمد
            </span>
            <h1 className="text-2xl md:text-3xl font-bold">أهلاً بك، أ. محمد عبدالله 👨‍👧‍👦</h1>
            <p className="text-amber-100 mt-1 text-sm md:text-base">
              جميع الأبناء منتظمون في الدوام المدرسي اليوم مع أداء أكاديمي ممتاز.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/25 flex items-center gap-4">
            <div className="text-center">
              <span className="block text-2xl font-bold text-amber-200">2 أناء</span>
              <span className="text-xs text-amber-100">مسجلين بالمدرسة</span>
            </div>
            <div className="h-10 w-px bg-white/20"></div>
            <div className="text-center">
              <span className="block text-2xl font-bold text-amber-200">0 غياب</span>
              <span className="text-xs text-amber-100">هذا الفصل</span>
            </div>
          </div>
        </div>
      </div>

      {/* Children Switcher Tabs */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        <button className="px-5 py-3 bg-white border-2 border-amber-600 text-amber-900 rounded-xl font-bold shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">أ</div>
          <div className="text-right">
            <div className="text-sm">أحمد محمد</div>
            <div className="text-xs font-normal text-slate-500">الثاني الثانوي • 96.8%</div>
          </div>
        </button>

        <button className="px-5 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-medium shadow-sm flex items-center gap-3 transition-colors">
          <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-sm">م</div>
          <div className="text-right">
            <div className="text-sm">مريم محمد</div>
            <div className="text-xs font-normal text-slate-500">السادس الابتدائي • 99.2%</div>
          </div>
        </button>
      </div>

      {/* Quick Stats Grid for Ahmed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Award className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">مرتفع</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mt-4">96.8%</h3>
          <p className="text-sm text-slate-500">المعدل العام لأحمد</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">100%</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mt-4">حاضر اليوم</h3>
          <p className="text-sm text-slate-500">بصمة الحضور: 07:45 ص</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded">قيد التنفيذ</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mt-4">2 واجب</h3>
          <p className="text-sm text-slate-500">واجبات منزلية مطلوبة قريباً</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Bell className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded">ملاحظات</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mt-4">0 تنبيهات</h3>
          <p className="text-sm text-slate-500">سلوك ومواظبة ممتازين</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Child's Academic Schedule & Today's Classes */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              متابعة حصص أحمد اليومية
            </h2>
            <button className="text-sm text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1">
              سجل الدرجات الكامل <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {[
              { time: '08:00 - 08:45 ص', subject: 'الرياضيات المتقدمة', teacher: 'أ. سالم القحطاني', grade: '98/100' },
              { time: '08:50 - 09:35 ص', subject: 'اللغة العربية', teacher: 'أ. فهد العمري', grade: '95/100' },
              { time: '10:00 - 10:45 ص', subject: 'الفيزياء الكمية', teacher: 'د. خالد الزهراني', grade: '97/100' },
              { time: '10:50 - 11:35 ص', subject: 'اللغة الإنجليزية', teacher: 'أ. ميكيل براون', grade: '96/100' },
            ].map((cls, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                  <div>
                    <h4 className="font-bold text-slate-800">{cls.subject}</h4>
                    <p className="text-xs text-slate-500">المعلم: {cls.teacher}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    تقييم: {cls.grade}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">{cls.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Communications & Notes from Teachers */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-amber-600" />
                تواصل المعلمين والإدارة
              </h2>
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold">جديد</span>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800 text-sm">أ. خالد الزهراني (معلم الفيزياء)</h4>
                  <span className="text-xs text-slate-400">منذ ساعتين</span>
                </div>
                <p className="text-xs text-slate-600 mb-3">"أحمد أظهر تفوقاً ملحوظاً اليوم في حل مسائل الحث الكهرومغناطيسي. بورك فيه."</p>
                <button className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors">
                  إرسال شكر / رد
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800 text-sm">إدارة المدرسة</h4>
                  <span className="text-xs text-slate-400">أمس</span>
                </div>
                <p className="text-xs text-slate-600 mb-3">تذكير بموعد اللقاء الإبوي الدوري لمناقشة خطط التحصيل الدراسي.</p>
                <button className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors">
                  حجز موعد اللقاء
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">هل تواجه استفساراً مالياً أو إدارياً؟ <a href="#" className="text-amber-600 font-bold hover:underline">تواصل مع شؤون الطلاب</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

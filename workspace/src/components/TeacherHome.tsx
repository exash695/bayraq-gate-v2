import React from 'react';
import { BookOpen, Users, CheckSquare, Clock, Calendar, BarChart3, Bell, ArrowRight } from 'lucide-react';

export const TeacherHome: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-l from-blue-700 to-indigo-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute left-0 bottom-0 opacity-10 translate-x-10 translate-y-10">
          <BookOpen className="w-64 h-64" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="bg-blue-600/50 text-blue-100 text-xs px-3 py-1 rounded-full font-medium inline-block mb-2">
              قسم العلوم الفيزيائية • المعلم المسؤول
            </span>
            <h1 className="text-2xl md:text-3xl font-bold">مرحباً بك، أ. خالد الزهراني 👨‍🏫</h1>
            <p className="text-blue-100 mt-1 text-sm md:text-base">
              لديك اليوم 3 حصص دراسية و12 واجب بانتظار التصحيح والتقييم.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/25 flex items-center gap-4">
            <div className="text-center">
              <span className="block text-2xl font-bold text-blue-200">142</span>
              <span className="text-xs text-blue-100">طالب في فصولك</span>
            </div>
            <div className="h-10 w-px bg-white/20"></div>
            <div className="text-center">
              <span className="block text-2xl font-bold text-blue-200">94%</span>
              <span className="text-xs text-blue-100">نسبة حضور الطلاب</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">نشط</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mt-4">4 فصول</h3>
          <p className="text-sm text-slate-500">تم جدولتها لهذا الأسبوع</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <CheckSquare className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded">معلق</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mt-4">12 واجب</h3>
          <p className="text-sm text-slate-500">بحاجة للمراجعة والتقييم</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">القادمة</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mt-4">ثاني ثانوي / 2</h3>
          <p className="text-sm text-slate-500">تبدأ الساعة 10:00 صباحاً</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <BarChart3 className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded">ممتاز</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mt-4">4.8 / 5.0</h3>
          <p className="text-sm text-slate-500">تقييم الأداء والرضا العام</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classes Schedule */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              جدول الحصص والدروس اليومية
            </h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
              إدارة الفصول <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {[
              { time: '08:00 - 08:45 ص', class: 'ثاني ثانوي (أ)', subject: 'الفيزياء المتقدمة', attendance: '32/34 طالب', status: 'منتهية' },
              { time: '09:00 - 09:45 ص', class: 'أول ثانوي (ب)', subject: 'العلوم العامة', attendance: '29/30 طالب', status: 'منتهية' },
              { time: '10:00 - 10:45 ص', class: 'ثالث ثانوي (ج)', subject: 'مختبر الفيزياء الكمية', attendance: '28 طالب', status: 'الحالية' },
              { time: '11:15 - 12:00 م', class: 'ثاني ثانوي (ب)', subject: 'الفيزياء الكلاسيكية', attendance: 'مجدولة', status: 'قادمة' },
            ].map((cls, idx) => (
              <div 
                key={idx} 
                className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all ${
                  cls.status === 'الحالية' 
                    ? 'border-blue-500 bg-blue-50/50 shadow-sm' 
                    : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    cls.status === 'الحالية' ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {cls.status}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{cls.subject} - <span className="text-blue-600">{cls.class}</span></h4>
                    <p className="text-xs text-slate-500">حضور الطلاب: {cls.attendance}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-600 bg-white px-3 py-1 rounded-md border border-slate-200">
                    {cls.time}
                  </span>
                  {cls.status === 'الحالية' && (
                    <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors">
                      بدء البث / التحضير
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions & Pending Tasks */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                مهام التصحيح السريع
              </h2>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">12 واجب</span>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800 text-sm">اختبار قصير الفصل الثالث</h4>
                  <span className="text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-medium">ثاني ثانوي (أ)</span>
                </div>
                <p className="text-xs text-slate-600 mb-3">تم تسليم 30 من أصل 34 إجابة.</p>
                <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors">
                  بدء التصحيح الآلي واليدوي
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800 text-sm">إرسال تعميم إضافي</h4>
                  <span className="text-xs text-slate-700 bg-slate-200 px-2 py-0.5 rounded font-medium">إداري</span>
                </div>
                <p className="text-xs text-slate-600 mb-3">تذكير الطلاب بموعد تسليم المشاريع العملية القادمة.</p>
                <button className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors">
                  إنشاء إعلان جديد
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">تحتاج تعديل المناهج؟ <a href="#" className="text-blue-600 font-bold hover:underline">مكتبة المصادر الرقمية</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

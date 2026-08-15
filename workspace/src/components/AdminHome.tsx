import React from 'react';
import { ShieldAlert, Users, BookOpen, BarChart3, Building2, UserCheck, DollarSign, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export const AdminHome: React.FC = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-l from-purple-700 to-indigo-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute left-0 bottom-0 opacity-10 translate-x-10 translate-y-10">
          <ShieldAlert className="w-64 h-64" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="bg-purple-600/50 text-purple-100 text-xs px-3 py-1 rounded-full font-medium inline-block mb-2">
              لوحة التحكم المركزية • إدارة المؤسسة التعليمية
            </span>
            <h1 className="text-2xl md:text-3xl font-bold">أهلاً بك، د. إبراهيم السعيد (مدير المدرسة) 🏛️</h1>
            <p className="text-purple-100 mt-1 text-sm md:text-base">
              حالة النظام مستقرة، نسبة الحضور العامة اليوم 97.4% مع اكتمال جداول الكادر التعليمي.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/25 flex items-center gap-4">
            <div className="text-center">
              <span className="block text-2xl font-bold text-purple-200">1,240</span>
              <span className="text-xs text-purple-100">إجمالي الطلاب</span>
            </div>
            <div className="h-10 w-px bg-white/20"></div>
            <div className="text-center">
              <span className="block text-2xl font-bold text-purple-200">86</span>
              <span className="text-xs text-purple-100">معلم وموظف</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">+3.2% هذا الشهر</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mt-4">1,240 طالب</h3>
          <p className="text-sm text-slate-500">موزعين على 36 فصل دراسي</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <UserCheck className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">محدث اليوم</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mt-4">97.4%</h3>
          <p className="text-sm text-slate-500">نسبة الحضور المدرسية الكلية</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">نشط بالكامل</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mt-4">4 مرافق</h3>
          <p className="text-sm text-slate-500">مختبرات وملاعب ومكتبة مركزية</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">منتظم</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mt-4">98.5%</h3>
          <p className="text-sm text-slate-500">تحصيل الرسوم والالتزام المالي</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* School Departments & Classes Overview */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              مؤشرات الأداء الأكاديمي والصفوف
            </h2>
            <button className="text-sm text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1">
              التقرير التفصيلي الشامل <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {[
              { stage: 'المرحلة الابتدائية', students: '450 طالب', classes: '12 فصل', avgScore: '96.2%', status: 'مستقر' },
              { stage: 'المرحلة المتوسطة', students: '390 طالب', classes: '12 فصل', avgScore: '94.8%', status: 'مستقر' },
              { stage: 'المرحلة الثانوية - علمي', students: '240 طالب', classes: '6 فصول', avgScore: '95.5%', status: 'ممتاز' },
              { stage: 'المرحلة الثانوية - أدبي', students: '160 طالب', classes: '6 فصول', avgScore: '93.1%', status: 'جيد جداً' },
            ].map((row, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                  <div>
                    <h4 className="font-bold text-slate-800">{row.stage}</h4>
                    <p className="text-xs text-slate-500">{row.students} • {row.classes}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <span className="block text-sm font-bold text-slate-800">{row.avgScore}</span>
                    <span className="text-xs text-slate-400">متوسط التحصيل</span>
                  </div>
                  <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-md border border-purple-200">
                    {row.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Administrative Alerts & Quick Approvals */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-purple-600" />
                الطلبات والموافقات الإدارية
              </h2>
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full font-bold">3 معلق</span>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800 text-sm">طلب إجازة مرضية (أ. سامي العتيبي)</h4>
                  <span className="text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded font-medium">معلم مادة</span>
                </div>
                <p className="text-xs text-slate-600 mb-3">طلب إجازة لمدة يومين مع توفير معلم بديل.</p>
                <div className="flex gap-2">
                  <button className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors">
                    اعتماد الطلب
                  </button>
                  <button className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors">
                    مراجعة
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800 text-sm">شراء أجهزة معمل الكيمياء</h4>
                  <span className="text-xs text-slate-700 bg-slate-200 px-2 py-0.5 rounded font-medium">مشتريات</span>
                </div>
                <p className="text-xs text-slate-600 mb-3">موازنة التجهيزات المخبرية الجديدة للفصل الثاني.</p>
                <button className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors">
                  عرض الموازنة واعتمادها
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">هل تحتاج إصدار تقرير وزاري؟ <a href="#" className="text-purple-600 font-bold hover:underline">مولد التقارير الآلي</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

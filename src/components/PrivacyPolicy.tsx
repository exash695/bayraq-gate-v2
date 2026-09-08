import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Lock, 
  MapPin, 
  Eye, 
  UserCheck, 
  Database, 
  Trash2, 
  Mail, 
  Bell, 
  Camera, 
  FileText, 
  ExternalLink, 
  ArrowRight, 
  Printer, 
  CheckCircle2, 
  Smartphone,
  Globe,
  Sparkles,
  AlertTriangle,
  Users,
  Layers,
  Cpu,
  Clock,
  KeyRound,
  FileCheck,
  ShieldAlert,
  Info,
  Server
} from 'lucide-react';
import { useAppLogo } from './BerqCharacterManager';

interface PrivacyPolicyProps {
  onBack?: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  const appLogo = useAppLogo();
  const [activeLang, setActiveLang] = useState<'ar' | 'en'>('ar');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="privacy-policy-view" className="min-h-screen bg-[#050A18] text-white flex flex-col font-cairo selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Floating / Sticky Header */}
      <header className="sticky top-0 z-50 bg-[#050A18]/85 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-all">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all flex items-center gap-1.5 text-sm font-bold border border-white/5"
              title="العودة للتطبيق"
            >
              <ArrowRight size={18} className="rtl:rotate-0 ltr:rotate-180" />
              <span className="hidden sm:inline">{activeLang === 'ar' ? 'العودة للتطبيق' : 'Back to App'}</span>
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 p-1 flex items-center justify-center shrink-0">
              <img src={appLogo || '/logo.png'} alt="شعار بوابة بيرق" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-1.5">
                بوابة بيرق <span className="text-amber-400 text-xs px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">Gate 6</span>
              </h1>
              <p className="text-[10px] text-white/40 font-medium">
                {activeLang === 'ar' ? 'وثيقة سياسة الخصوصية وحماية البيانات الشاملة' : 'Comprehensive Privacy & Data Protection Policy'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex items-center text-xs font-bold">
            <button
              onClick={() => setActiveLang('ar')}
              className={`px-3 py-1 rounded-lg transition-all ${activeLang === 'ar' ? 'bg-amber-500 text-black shadow-md font-black' : 'text-white/60 hover:text-white'}`}
            >
              العربية
            </button>
            <button
              onClick={() => setActiveLang('en')}
              className={`px-3 py-1 rounded-lg transition-all ${activeLang === 'en' ? 'bg-amber-500 text-black shadow-md font-black' : 'text-white/60 hover:text-white'}`}
            >
              English
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-white/5 hidden sm:flex items-center gap-1.5 text-xs font-bold"
            title="طباعة الوثيقة"
          >
            <Printer size={16} />
            <span>{activeLang === 'ar' ? 'طباعة' : 'Print'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Header Badge & Hero Statement */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 mb-10 pb-8 border-b border-white/10"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wide">
            <ShieldCheck size={16} />
            <span>
              {activeLang === 'ar' 
                ? 'وثيقة قانونية معتمدة ومطابقة لمتطلبات المتاجر الرسمية Google Play & Apple App Store' 
                : 'Official Policy Document Compliant with Google Play & Apple App Store Guidelines'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
            {activeLang === 'ar' ? 'وثيقة سياسة الخصوصية وحماية بيانات المستخدمين' : 'Privacy Policy & User Data Protection'}
          </h2>

          <p className="text-sm sm:text-base text-white/70 max-w-3xl mx-auto leading-relaxed">
            {activeLang === 'ar'
              ? 'تلتزم منصة وتطبيق (بوابة بيرق - Gate 6) بحماية الخصوصية الرقمية لجميع مستخدميها (الطلاب، أولياء الأمور، المعلمين، الكوادر الإدارية، وإدارات المدارس) وفق أرفع معايير أمن المعلومات والشفافية القانونية.'
              : 'The (Bayraq Gate - Gate 6) educational platform is committed to safeguarding digital privacy and securing personal and academic data for students, parents, teachers, and school administrations.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-white/50 pt-2 font-medium">
            <span>📅 {activeLang === 'ar' ? 'تاريخ السريان: 17 آب 2026' : 'Effective Date: August 17, 2026'}</span>
            <span>•</span>
            <span>🏢 {activeLang === 'ar' ? 'الإصدار المعتمد: v6.3.0' : 'Official Version: v6.3.0'}</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">🔒 {activeLang === 'ar' ? 'تشفير سحابي آمن SSL/TLS' : 'Encrypted Transit (SSL/TLS)'}</span>
          </div>
        </motion.div>

        {activeLang === 'ar' ? (
          /* ========================================================================= */
          /*                          ARABIC VERSION (العربية)                         */
          /* ========================================================================= */
          <div className="space-y-6 text-right" dir="rtl">

            {/* 1. نطاق السياسة وتعريف المستخدمين */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-amber-400 font-black text-lg">
                <Users size={22} className="shrink-0" />
                <h3>1. نطاق السياسة وأطراف الاستخدام (User Roles & Scope)</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                تنظم هذه الوثيقة الشروط والممارسات المتعلقة بجمع ومعالجة وحماية البيانات في تطبيق وموقع <strong>"بوابة بيرق" (Gate 6)</strong>. تنطبق هذه السياسة على جميع الفئات المستخدمة للمنصة:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <span className="font-bold text-amber-300 text-xs block mb-1">👨‍🎓 الطالب (Student):</span>
                  <p className="text-xs text-white/70">المستفيد الأساسي من المناهج، التحديات المعرفية (تحدي الـ 60 ثانية)، الواجبات، ومتابعة المحطات التعليمية.</p>
                </div>
                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <span className="font-bold text-blue-300 text-xs block mb-1">👨‍👩‍👧 ولي الأمر (Parent/Guardian):</span>
                  <p className="text-xs text-white/70">المتابع المعتمد لدرجات أبنائه، مستويات حضورهم، وخط سير الحافلة المدرسية.</p>
                </div>
                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <span className="font-bold text-emerald-300 text-xs block mb-1">👨‍🏫 المعلم والكوادر التعليمية (Teacher):</span>
                  <p className="text-xs text-white/70">المسؤول عن رصد الدرجات، إرسال الواجبات والتحديات، وإدارة المحتوى الصفي.</p>
                </div>
                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <span className="font-bold text-purple-300 text-xs block mb-1">🏫 إدارة المدرسة والمشرفين (School Admin):</span>
                  <p className="text-xs text-white/70">الجهة المسؤولة عن ترخيص الحسابات المدرسية وتعيين الصلاحيات وإدارة السجلات الرسمية.</p>
                </div>
              </div>
            </section>

            {/* 2. أنواع البيانات المجمعة */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-4">
              <div className="flex items-center gap-3 text-blue-400 font-black text-lg">
                <Database size={22} className="shrink-0" />
                <h3>2. أنواع البيانات التي نقوم بجمعها (Categories of Data)</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                تجمع المنصة البيانات الضرورية فقط لتقديم الخدمات التعليمية والإدارية، وتصنف البيانات إلى:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
                  <span className="font-bold text-white text-sm flex items-center gap-2 text-amber-300">
                    <UserCheck size={16} /> أ. بيانات الهوية الشخصية والمدرسية:
                  </span>
                  <p className="text-xs text-white/70 leading-relaxed">
                    الاسم الكامل، المحافظة، اسم المدرسة، الصف والشعبة، كود الطالب الفريد، كود ولي الأمر، ورقم الهاتف أو البريد الإلكتروني المعتمد عند التسجيل.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
                  <span className="font-bold text-white text-sm flex items-center gap-2 text-cyan-300">
                    <FileText size={16} /> ب. البيانات الأكاديمية والتقييمية:
                  </span>
                  <p className="text-xs text-white/70 leading-relaxed">
                    الدرجات والنتائج الامتحانية، نتائج تحديات الستين ثانية الذكية، الواجبات المسلمة، سجلات الحضور والغياب، والأوسمة والإنجازات في قاعة الأبطال.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
                  <span className="font-bold text-white text-sm flex items-center gap-2 text-emerald-300">
                    <MapPin size={16} /> ج. بيانات النقل المدرسي والموقع (Transit GPS):
                  </span>
                  <p className="text-xs text-white/70 leading-relaxed">
                    تُجمع إحداثيات الموقع الجغرافي <strong>حصراً من هواتف سائقي الحافلات المعتمدين أثناء الرحلات المدرسية النشطة</strong>، لتأمين مسار الطلبة وتنبيه أولياء الأمور فقط. لا يتم تتبع موقع الطلاب في الخلفية.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
                  <span className="font-bold text-white text-sm flex items-center gap-2 text-purple-300">
                    <Camera size={16} /> د. الصور والمستندات والوسائط:
                  </span>
                  <p className="text-xs text-white/70 leading-relaxed">
                    الملفات والمستندات والملاحظات التي يرفعها الطالب أو المعلم في المحطات التعليمية، أو صور الواجبات والمراجعات الدراسية لليونتات المرفوعة.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. بيانات الأطفال والقاصرين والموافقة الأبوية */}
            <section className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-emerald-400 font-black text-lg">
                <ShieldCheck size={22} className="shrink-0" />
                <h3>3. حماية خصوصية الأطفال والقاصرين وإشراف المدرسة (Children Privacy)</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                تُعد سلامة الطلاب القاصرين محور تصميم التطبيق. نلتزم بالمبادئ الوقائية لحماية القاصرين:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-white/70 list-disc list-inside">
                <li>يتم تسجيل حسابات الطلاب بإشراف وتفويض إدارة المدرسة وموافقة ولي الأمر الصريحة أو الضمنية عبر الالتحاق بالمؤسسة التعليمية.</li>
                <li>يتاح لولي الأمر عبر كود المتابعة الاطلاع المباشر على بيانات وسجلات ابنه في أي وقت.</li>
                <li>التطبيق بيئة مغلقة تعليمية؛ لا يحتوي على أي نوافذ تواصل عامة غير خاضعة للرقابة التربوية، ولا يتيح التواصل مع جهات غريبة.</li>
              </ul>
            </section>

            {/* 4. أغراض جمع واستخدام البيانات */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-cyan-400 font-black text-lg">
                <FileCheck size={22} className="shrink-0" />
                <h3>4. أغراض استخدام ومعالجة البيانات (Purpose of Processing)</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                تُعالج البيانات فقط للأغراض التعليمية والإدارية والتشغيلية المحددة التالية:
              </p>
              <ul className="space-y-1.5 text-xs sm:text-sm text-white/70 list-disc list-inside">
                <li>تمكين الطالب من دراسة المحطات واليونتات والمشاركة في تحديات الستين ثانية ورصد إنجازاته.</li>
                <li>تمكين المعلمين وإدارة المدرسة من إدارة الدرجات، الواجبات، ورصد الحضور والغياب.</li>
                <li>تزويد أولياء الأمور بتقارير الأداء الأكاديمي وتنبيهات وصول ومغادرة الحافلات المدرسية.</li>
                <li>التحقق من صحة تسجيل الدخول، حماية الحسابات، وصيانة واستقرار البنية التحتية للتطبيق.</li>
                <li><strong>حظر تام:</strong> لا تُستخدم البيانات نهائياً لأي تسويق تجاري، أو بناء ملفات تعريف إعلانية، أو إعادة بيع البيانات.</li>
              </ul>
            </section>

            {/* 5. مشاركة البيانات وحدود الإفصاح */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-purple-400 font-black text-lg">
                <Layers size={22} className="shrink-0" />
                <h3>5. مشاركة البيانات وحدود الإفصاح (Data Sharing Limits)</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                نلتزم بأعلى درجات السرية، ولا نشارك البيانات إلا في النطاق الضيق التالي:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-white/70 list-disc list-inside">
                <li><strong>مع المدرسة والمعلمين المعنيين:</strong> لإدارة العملية التربوية وسجلات الطلاب المنتسبين.</li>
                <li><strong>مع ولي الأمر المرتبط:</strong> لعرض بيانات أبنائه فقط وفق كود التحقق الأبوي.</li>
                <li><strong>مع مزودي البنية السحابية الأساسية:</strong> (مثل خدمات Firebase وGoogle Cloud) لأغراض الاستضافة والتخزين المشفر ومعالجة البيانات، وفق عقود حماية وسرية بيانات صارمة.</li>
                <li><strong>الامتثال القانوني:</strong> الإفصاح عند وجود أمر قضائي أو طلب قانوني ملزم من الجهات الرسمية المختصة.</li>
              </ul>
            </section>

            {/* 6. الأذونات المطلوبة من الجهاز ومبرراتها */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-4">
              <div className="flex items-center gap-3 text-amber-400 font-black text-lg">
                <Smartphone size={22} className="shrink-0" />
                <h3>6. الأذونات المطلوبة على جهاز المستخدم (Device Permissions)</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                لا يطلب التطبيق أي إذن لا يرتبط بوظيفة أساسية وملموسة. الأذونات تشمل:
              </p>
              <div className="space-y-2.5 text-xs sm:text-sm text-white/70">
                <div className="p-3 rounded-xl bg-black/20 border border-white/5 flex items-start gap-3">
                  <MapPin className="text-emerald-400 shrink-0 mt-0.5" size={18} />
                  <div>
                    <span className="font-bold text-white">إذن الموقع الجغرافي (Location Permission):</span>
                    <p className="text-white/60 text-xs mt-0.5">يُطلب من حساب السائق المعتمد فقط لبث مسار الحافلة المدرسية وتتبعها حياً لأولياء الأمور أثناء الرحلة.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/20 border border-white/5 flex items-start gap-3">
                  <Camera className="text-blue-400 shrink-0 mt-0.5" size={18} />
                  <div>
                    <span className="font-bold text-white">إذن الكاميرا والتخزين (Camera & Media Storage):</span>
                    <p className="text-white/60 text-xs mt-0.5">لالتقاط وتصوير الواجبات المدرسية، مسح رموز QR السريعة للتحقق، أو حفظ وتنزيل الملازم الدراسية.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/20 border border-white/5 flex items-start gap-3">
                  <Bell className="text-amber-400 shrink-0 mt-0.5" size={18} />
                  <div>
                    <span className="font-bold text-white">إذن الإشعارات والتنبيهات (Push Notifications):</span>
                    <p className="text-white/60 text-xs mt-0.5">لإرسال التنبيهات الضرورية الخاصة بمواعيد الاختبارات، وصول الحافلة، الإعلانات الإدارية، وتحديثات الواجبات.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 7. أمن المعلومات والتشفير */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-cyan-400 font-black text-lg">
                <Lock size={22} className="shrink-0" />
                <h3>7. أمن وسرية المعلومات وإدارة المخاطر (Information Security)</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                نطبق منظومة أمنية متقدمة تشمل تشفير البيانات أثناء النقل عبر بروتوكولات (TLS / HTTPS) وتشفير قواعد البيانات التخزينية (AES-256) وإدارة الصلاحيات القائمة على الأدوار (RBAC) عبر خوادم <strong>Google Firebase</strong>.
              </p>
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 leading-relaxed flex items-center gap-2">
                <Info size={16} className="shrink-0" />
                <span>إشعار أمني موضوعي: نتبع أفضل المعايير التقنية لحماية البيانات وتقليل المخاطر، مع الإقرار بأنه لا يوجد نظام إلكتروني متصل بالإنترنت يوفر حصانة مطلقة بنسبة 100%.</span>
              </div>
            </section>

            {/* 8. مدة الاحتفاظ بالبيانات والنسخ الاحتياطية */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-emerald-400 font-black text-lg">
                <Clock size={22} className="shrink-0" />
                <h3>8. مدة الاحتفاظ بالبيانات والنسخ الاحتياطية (Data Retention & Backups)</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                نحتفظ بالبيانات الأكاديمية والشخصية طوال فترة انتساب الطالب للمدرسة وتفعيل العام الدراسي:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-white/70 list-disc list-inside">
                <li>عند تخرج الطالب أو انتقاله أو انتهاء التعاقد المدرسي، يتم أرشفة البيانات أو إتلافها وفق طلب المدرسة أو ولي الأمر.</li>
                <li>تخضع النسخ الاحتياطية الفنية الدورية (System Backups) لدورة تدوير وحذف تقني تلقائي تتراوح بين 30 إلى 90 يوماً لأغراض التعافي من الكوارث والأخطاء البرمجية.</li>
              </ul>
            </section>

            {/* 9. حقوق المستخدم وولي الأمر */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-purple-400 font-black text-lg">
                <CheckCircle2 size={22} className="shrink-0" />
                <h3>9. حقوق المستخدم وولي الأمر (User & Parental Rights)</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                يتمتع المستخدمون وأولياء أمور الطلاب القاصرين بكافة الحقوق الأساسية الآتية:
              </p>
              <ul className="space-y-1.5 text-xs sm:text-sm text-white/70 list-disc list-inside">
                <li><strong>حق الوصول والاطلاع:</strong> معرفة كافة البيانات والدرجات المخزنة على حساب الطالب.</li>
                <li><strong>حق التصحيح والتحديث:</strong> تعديل وتصحيح أي بيانات خاطئة أو غير محدثة بالتنسيق مع إدارة المدرسة.</li>
                <li><strong>حق الاعتراض وسحب الموافقة:</strong> إيقاف استخدام التطبيق وحذف الحساب نهائياً في أي وقت.</li>
              </ul>
            </section>

            {/* 10 & 11. حذف الحساب والبيانات + بيانات القاصرين */}
            <section className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-rose-400 font-black text-lg">
                <Trash2 size={22} className="shrink-0" />
                <h3>10. إجراءات حذف الحساب والبيانات نهائياً (Account & Data Deletion)</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                امتثالاً للوائح متاجر التطبيقات (Google Play & Apple App Store)، نوفر مساراً واضحاً وسهلاً لطلب حذف الحساب وجميع البيانات الشخصية:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                  <span className="font-bold text-white block">طريقة الحذف المباشرة:</span>
                  <p className="text-white/70">
                    يمكن إرسال طلب حذف رسمي إلى البريد الإلكتروني المعتمد:
                    <span className="block text-rose-300 font-mono font-bold mt-1 dir-ltr">mntzralghanm527@gmail.com</span>
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                  <span className="font-bold text-white block">حذف بيانات الطلاب القاصرين:</span>
                  <p className="text-white/70">
                    يتم التحقق من صفة ولي الأمر أو التنسيق مع إدارة المدرسة المعنية لضمان عدم حذف سجلات أكاديمية مطلوبة قانونياً قبل تنفيذ الحذف خلال مدة أقصاها 30 يوماً.
                  </p>
                </div>
              </div>
            </section>

            {/* 12. إدارة الحوادث الأمنية */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-amber-400 font-black text-lg">
                <ShieldAlert size={22} className="shrink-0" />
                <h3>11. إدارة الحوادث والاستجابة للاختراقات (Security Incident Response)</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                في حالة حدوث أو الاشتباه في أي خرق أمني أو وصول غير مصرح به يؤثر على سرية البيانات الشخصية، يتخذ الفريق الإجراءات الفورية التالية:
              </p>
              <ul className="space-y-1.5 text-xs sm:text-sm text-white/70 list-disc list-inside">
                <li>عزل الثغرة أو الخادم المتأثر ومعالجة الخلل فورياً عبر إجراءات الترقيع الأمني.</li>
                <li>إشعار إدارات المدارس والمستخدمين المتأثرين وتوجيههم بالخطوات الاحترازية المناسبة.</li>
                <li>توثيق الحادثة ورفع التقارير للجهات المختصة ومراجعي المنصات وفق المتطلبات النظامية.</li>
              </ul>
            </section>

            {/* 13. البنية التحتية والخدمات الخارجية */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-blue-400 font-black text-lg">
                <Server size={22} className="shrink-0" />
                <h3>12. البنية التحتية والخدمات التقنية المعتمدة (Third-Party Services)</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                يعتمد التطبيق حصراً على خدمات تقنية موثوقة وعالمية لتشغيل الخوادم وقواعد البيانات:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                  <span className="font-bold text-white block mb-1">🔥 Google Firebase:</span>
                  <p className="text-white/60">للمصادقة الآمنة (Authentication)، وقواعد البيانات السحابية الحية (Firestore)، والتخزين المشفر.</p>
                </div>
                <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                  <span className="font-bold text-white block mb-1">☁️ Google Cloud Platform:</span>
                  <p className="text-white/60">لاستضافة خوادم التطبيق وبيئة التشغيل المحمية بجدران نارية متقدمة.</p>
                </div>
              </div>
            </section>

            {/* 14 & 15. حظر بيع البيانات وحظر الإعلانات الموجهة */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-emerald-400 font-black text-lg">
                <Eye size={22} className="shrink-0" />
                <h3>13. حظر بيع البيانات وحظر الإعلانات التجارية (No Data Monetization)</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                نقر ونتعهد بالتالي:
              </p>
              <ul className="space-y-1.5 text-xs sm:text-sm text-white/70 list-disc list-inside">
                <li><strong>لا نبيع ولا نؤجر ولا نقايض</strong> بيانات المستخدمين أو الطلاب مع أي جهة خارجية أو شركات وسيطة تحت أي ظرف.</li>
                <li><strong>بيئة خالية من الإعلانات:</strong> لا نقوم بعرض إعلانات تجارية موجهة لأطراف ثالثة داخل المنصة، ولا نستخدم أدوات تتبع سلوكي للأطفال.</li>
              </ul>
            </section>

            {/* 16 & 17. مسؤوليات إدارة المدرسة والمستخدم */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-cyan-400 font-black text-lg">
                <KeyRound size={22} className="shrink-0" />
                <h3>14. مسؤوليات إدارة المدرسة والمستخدم (User & School Roles)</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                  <span className="font-bold text-cyan-300 block">مسؤولية إدارة المدرسة:</span>
                  <p className="text-white/70">
                    التحقق من صحة أسماء وبيانات الطلاب والمعلمين، وتوزيع الأكواد الرسمية، وإلغاء صلاحية أي مستخدم يغادر المؤسسة فوراً.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                  <span className="font-bold text-amber-300 block">مسؤولية المستخدم (طالب / معلم / ولي أمر):</span>
                  <p className="text-white/70">
                    الحفاظ على سرية كلمة المرور وكود الدخول الخاص به، وعدم مشاركته مع أطراف أخرى، وإبلاغ الدعم في حال الشك بأي اختراق.
                  </p>
                </div>
              </div>
            </section>

            {/* 18. سياسة الإشعارات والرسائل */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-amber-400 font-black text-lg">
                <Bell size={22} className="shrink-0" />
                <h3>15. سياسة الإشعارات والتنبيهات (Notification Policy)</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                تقتصر الإشعارات الصادرة من التطبيق على الأمور التشغيلية والأكاديمية (مثل إشعارات بدء الامتحانات، نشر الدرجات، تنبيه اقتراب الحافلة، والتعاميم المدرسية). يحق للمستخدم التحكم في استلام الإشعارات أو تخصيصها من إعدادات جهازه.
              </p>
            </section>

            {/* 19. سياسة الموقع الجغرافي للنقل المدرسي */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-emerald-400 font-black text-lg">
                <MapPin size={22} className="shrink-0" />
                <h3>16. ضوابط الموقع الجغرافي للنقل المدرسي (Transit Geolocation)</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                تخضع بيانات الموقع الجغرافي لضوابط حازمة: يتم تفعيلها حصراً لدى سائق الحافلة المدرسية خلال أوقات نقل الطلاب الفعلية، وتُحذف المسارات اللحظية تلقائياً بعد اكتمال الرحلة، دون تخزين تاريخي لمواقع المنازل الخاصة خارج نطاق إدارة المحطات المدرسية المعتمدة.
              </p>
            </section>

            {/* 20. المحتوى والملفات المرفوعة */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-purple-400 font-black text-lg">
                <Camera size={22} className="shrink-0" />
                <h3>17. سياسة الصور والملفات والمستندات (Uploaded Content)</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                جميع الملفات والواجبات والصور المرفوعة تظل ملكاً لمستخدميها ومدرستهم، وتُستخدم فقط داخل السياق التعليمي المخصص. يُحظر تماماً رفع أي محتوى مخالف أو غير لائق أو ينتهك حقوق الملكية الفكرية أو يمس خصوصية الآخرين.
              </p>
            </section>

            {/* 21. السجلات التقنية وبيانات الاستخدام */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-blue-400 font-black text-lg">
                <Cpu size={22} className="shrink-0" />
                <h3>18. السجلات التقنية وبيانات الأداء (Technical Logs & Diagnostics)</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                تجمع الخوادم سجلات تقنية مؤقتة ومجهولة الهوية مثل (نوع الجهاز، نظام التشغيل، سجلات الأخطاء البرمجية Crashes، وعناوين IP التشغيلية) لغرض استكشاف الأخطاء التقنية، صيانة الأداء، ومكافحة الهجمات السيبرانية.
              </p>
            </section>

            {/* 22. المعالجة والتقييم الآلي */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-cyan-400 font-black text-lg">
                <Sparkles size={22} className="shrink-0" />
                <h3>19. المعالجة والتقييم الآلي (Automated Scoring & Quiz Engine)</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                يقتصر عمل المعالجة الآلية والذكية في التطبيق على احتساب نتائج الاختبارات التفاعلية وتحديات الستين ثانية (60s Challenge) ومنح الأوسمة الأكاديمية التشجيعية، ولا توجد أي قرارات مصيرية أو قانونية تُتخذ بشكل آلي بحت دون إشراف الكادر التعليمي.
              </p>
            </section>

            {/* 23. تحديثات سياسة الخصوصية */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-amber-400 font-black text-lg">
                <Globe size={22} className="shrink-0" />
                <h3>20. تحديثات سياسة الخصوصية (Policy Amendments)</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                نراجع هذه الوثيقة دورياً لضمان مواكبتها لأحدث المتطلبات القانونية والتقنية. عند إجراء أي تعديل جوهري، يتم إشعار المستخدمين عبر تنبيه داخل التطبيق وتحديث تاريخ السريان أعلى هذه الصفحة.
              </p>
            </section>

            {/* 24. بيانات التواصل الرسمية */}
            <section className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 border border-amber-500/20 rounded-2xl p-5 sm:p-7 space-y-4">
              <div className="flex items-center gap-3 text-amber-300 font-black text-lg">
                <Mail size={22} className="shrink-0" />
                <h3>21. بيانات التواصل الرسمية والاستفسارات (Official Privacy Contact)</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                لتقديم أي استفسار قانوني، أو ممارسة حقوق الخصوصية، أو تقديم طلبات حذف البيانات، يُرجى التواصل معنا عبر القنوات المعتمدة:
              </p>
              <div className="flex flex-wrap gap-3 text-xs sm:text-sm font-bold pt-1">
                <a 
                  href="mailto:mntzralghanm527@gmail.com"
                  className="px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-amber-400/50 flex items-center gap-2 text-white hover:text-amber-300 transition-all"
                >
                  <Mail size={16} className="text-amber-400 shrink-0" />
                  <span>البريد الإلكتروني المعتمد: mntzralghanm527@gmail.com</span>
                </a>
                <a 
                  href="https://t.me/Exashly1998" 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-cyan-400/50 flex items-center gap-2 text-white hover:text-cyan-300 transition-all"
                >
                  <ExternalLink size={16} className="text-cyan-400 shrink-0" />
                  <span>الدعم الفني والتقني: Telegram @Exashly1998</span>
                </a>
              </div>
            </section>

            {/* 25. التنبيه القانوني المرجعي (COPPA / GDPR-K Disclaimer) */}
            <section className="bg-black/40 border border-white/10 rounded-2xl p-4 sm:p-5 text-xs text-white/50 space-y-2">
              <div className="flex items-center gap-2 text-white/80 font-bold">
                <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                <span>إشعار وتنبيه قانوني مرجعي (Legal Principles Disclaimer):</span>
              </div>
              <p className="leading-relaxed">
                أي إشارة في هذه الوثيقة إلى معايير مثل (COPPA) أو (GDPR-K) أو سياسات عائلة متاجر التطبيقات هي إشارة استرشادية لتبني أفضل الممارسات المعيارية المعترف بها دولياً في حماية بيانات الأطفال والقاصرين، وليست ادعاءً بالحصول على شهادات اعتماد قانونية خاصة ما لم يتم إثبات ذلك رسمياً وفق القوانين المحلية النافذة.
              </p>
            </section>

          </div>
        ) : (
          /* ========================================================================= */
          /*                          ENGLISH VERSION (English)                        */
          /* ========================================================================= */
          <div className="space-y-6 text-left" dir="ltr">

            {/* 1. Scope & Definitions */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-amber-400 font-black text-lg">
                <Users size={22} className="shrink-0" />
                <h3>1. Policy Scope & User Roles</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                This Privacy Policy establishes the standards and procedures regarding the collection, handling, and security of user data within the <strong>"Bayraq Gate" (Gate 6)</strong> application and web platform. It applies to all authorized users:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <span className="font-bold text-amber-300 text-xs block mb-1">👨‍🎓 Students:</span>
                  <p className="text-xs text-white/70">Accessing study stations, curriculum units, 60-second interactive challenges, and tracking learning progress.</p>
                </div>
                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <span className="font-bold text-blue-300 text-xs block mb-1">👨‍👩‍👧 Parents/Guardians:</span>
                  <p className="text-xs text-white/70">Monitoring their children's academic performance, daily attendance records, and active school bus transit.</p>
                </div>
                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <span className="font-bold text-emerald-300 text-xs block mb-1">👨‍🏫 Teachers:</span>
                  <p className="text-xs text-white/70">Managing class assignments, recording exam grades, evaluating student activities, and moderating curriculum.</p>
                </div>
                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <span className="font-bold text-purple-300 text-xs block mb-1">🏫 School Administration:</span>
                  <p className="text-xs text-white/70">Provisioning and licensing accounts, setting role permissions, and supervising academic compliance.</p>
                </div>
              </div>
            </section>

            {/* 2. Categories of Data */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-4">
              <div className="flex items-center gap-3 text-blue-400 font-black text-lg">
                <Database size={22} className="shrink-0" />
                <h3>2. Categories of Data Collected</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                We only collect data strictly necessary to fulfill academic, administrative, and student transit operations:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
                  <span className="font-bold text-white text-sm flex items-center gap-2 text-amber-300">
                    <UserCheck size={16} /> a. Identity & School Credentials:
                  </span>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Full name, registered school, grade and division, governorate, unique student access code, parent verification PIN, and contact phone or email if provided.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
                  <span className="font-bold text-white text-sm flex items-center gap-2 text-cyan-300">
                    <FileText size={16} /> b. Academic & Performance Records:
                  </span>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Exam scores, homework submissions, 60-second quiz results, attendance logs, teacher notes, and Hall of Champions achievement badges.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
                  <span className="font-bold text-white text-sm flex items-center gap-2 text-emerald-300">
                    <MapPin size={16} /> c. School Transit & GPS Data:
                  </span>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Live geolocation coordinates are gathered <strong>strictly from designated bus drivers' devices during active transport trips</strong> to ensure student transit safety. Background student geolocation is never tracked.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
                  <span className="font-bold text-white text-sm flex items-center gap-2 text-purple-300">
                    <Camera size={16} /> d. Media Files & Attachments:
                  </span>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Homework photos, educational documents, and course notes voluntarily submitted by students or teachers within study sections.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Children's Privacy */}
            <section className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-emerald-400 font-black text-lg">
                <ShieldCheck size={22} className="shrink-0" />
                <h3>3. Protection of Children & Minors</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                The protection of minors is our utmost priority, aligned with the best industry principles for child safety:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-white/70 list-disc list-inside">
                <li>Student accounts are created exclusively under school authority with verifiable parental consent.</li>
                <li>Parents possess continuous visibility into their child’s academic records and platform activity via dedicated parent codes.</li>
                <li>The platform is a closed, secure educational sanctuary containing zero unmoderated chat rooms or external public outreach.</li>
              </ul>
            </section>

            {/* 4. Purpose of Processing */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-cyan-400 font-black text-lg">
                <FileCheck size={22} className="shrink-0" />
                <h3>4. Purposes of Data Processing & Commercial Prohibition</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                All data is processed strictly for educational and administrative functions:
              </p>
              <ul className="space-y-1.5 text-xs sm:text-sm text-white/70 list-disc list-inside">
                <li>Delivering interactive curriculum units, 60s challenges, and learning analytics.</li>
                <li>Facilitating teacher grading, attendance tracking, and administrative reports.</li>
                <li>Providing parents with live transit alerts and academic evaluation summaries.</li>
                <li>Maintaining authentication security, preventing unauthorized access, and debugging system errors.</li>
                <li><strong>Strict Ban:</strong> User data is NEVER processed for behavioral advertising, marketing campaigns, or third-party sale.</li>
              </ul>
            </section>

            {/* 5. Data Sharing Limits */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-purple-400 font-black text-lg">
                <Layers size={22} className="shrink-0" />
                <h3>5. Data Sharing Boundaries & Third-Party Disclosure</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                We maintain strict confidentiality and only disclose data within defined educational boundaries:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-white/70 list-disc list-inside">
                <li><strong>Designated School Staff:</strong> Authorized teachers and administrators managing the enrolled student.</li>
                <li><strong>Verified Parents/Guardians:</strong> Accessing solely their own linked student's records.</li>
                <li><strong>Essential Technical Providers:</strong> Secure enterprise cloud infrastructure (Google Firebase & Google Cloud) bound by strict data protection agreements.</li>
                <li><strong>Legal Compliance:</strong> If mandated by enforceable legal court orders or governmental regulations.</li>
              </ul>
            </section>

            {/* 6. Device Permissions */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-4">
              <div className="flex items-center gap-3 text-amber-400 font-black text-lg">
                <Smartphone size={22} className="shrink-0" />
                <h3>6. Device Permissions & Technical Justifications</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                We strictly avoid requesting unneeded device privileges. The requested permissions are:
              </p>
              <div className="space-y-2.5 text-xs sm:text-sm text-white/70">
                <div className="p-3 rounded-xl bg-black/20 border border-white/5 flex items-start gap-3">
                  <MapPin className="text-emerald-400 shrink-0 mt-0.5" size={18} />
                  <div>
                    <span className="font-bold text-white">Location Permission (GPS):</span>
                    <p className="text-white/60 text-xs mt-0.5">Requested solely on authorized driver devices to transmit live bus route coordinates to parents during active trips.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/20 border border-white/5 flex items-start gap-3">
                  <Camera className="text-blue-400 shrink-0 mt-0.5" size={18} />
                  <div>
                    <span className="font-bold text-white">Camera & Storage Permissions:</span>
                    <p className="text-white/60 text-xs mt-0.5">Used to upload homework pictures, scan authentication QR codes, and download lesson booklets.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/20 border border-white/5 flex items-start gap-3">
                  <Bell className="text-amber-400 shrink-0 mt-0.5" size={18} />
                  <div>
                    <span className="font-bold text-white">Push Notifications:</span>
                    <p className="text-white/60 text-xs mt-0.5">Used for critical announcements, exam schedules, bus arrival alerts, and urgent school notices.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 7. Information Security */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-cyan-400 font-black text-lg">
                <Lock size={22} className="shrink-0" />
                <h3>7. Information Security & Encryption (SSL/TLS & AES-256)</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                All communications are secured in transit via TLS/HTTPS encryption, and stored data is encrypted at rest using AES-256 on Google Cloud & Firebase. Strict Role-Based Access Controls (RBAC) prevent unauthorized data inspection.
              </p>
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 leading-relaxed flex items-center gap-2">
                <Info size={16} className="shrink-0" />
                <span>Security Notice: We implement robust technical controls to mitigate risks, acknowledging that no internet transmission system can guarantee absolute 100% invulnerability against all possible cyber threats.</span>
              </div>
            </section>

            {/* 8. Retention & Backups */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-emerald-400 font-black text-lg">
                <Clock size={22} className="shrink-0" />
                <h3>8. Data Retention, Archiving & Technical Backups</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                Personal and academic data is retained throughout the student's active enrollment:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-white/70 list-disc list-inside">
                <li>Upon student graduation, transfer, or school contract termination, records are archived or permanently expunged based on school policy.</li>
                <li>Routine technical backups automatically expire and rotate on a designated cycle (30 to 90 days) for disaster recovery and system continuity.</li>
              </ul>
            </section>

            {/* 9. User & Parental Rights */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-purple-400 font-black text-lg">
                <CheckCircle2 size={22} className="shrink-0" />
                <h3>9. User & Parental Rights (Access, Correction & Deletion)</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                Users and guardians possess clear statutory rights over their personal data:
              </p>
              <ul className="space-y-1.5 text-xs sm:text-sm text-white/70 list-disc list-inside">
                <li><strong>Right to Access:</strong> View all stored records, scores, and profile details.</li>
                <li><strong>Right to Rectification:</strong> Request corrections for outdated or incorrect information through the school admin.</li>
                <li><strong>Right to Erasure:</strong> Request full termination of account and complete deletion of associated personal data.</li>
              </ul>
            </section>

            {/* 10. Account & Data Deletion */}
            <section className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-rose-400 font-black text-lg">
                <Trash2 size={22} className="shrink-0" />
                <h3>10. Account & Data Deletion Procedures</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                In strict compliance with Google Play & Apple App Store account deletion requirements, users have an easy path to delete their data:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                  <span className="font-bold text-white block">Direct Email Deletion Request:</span>
                  <p className="text-white/70">
                    Send a verified deletion request to our privacy team at:
                    <span className="block text-rose-300 font-mono font-bold mt-1">mntzralghanm527@gmail.com</span>
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                  <span className="font-bold text-white block">Minor Deletion Coordination:</span>
                  <p className="text-white/70">
                    Requests for minor student deletion are confirmed with the legal guardian or school to prevent inadvertent loss of official academic records. Verified requests are executed within 30 days.
                  </p>
                </div>
              </div>
            </section>

            {/* 11. Security Incident Response */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-amber-400 font-black text-lg">
                <ShieldAlert size={22} className="shrink-0" />
                <h3>11. Security Incident Management & Breach Protocol</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                If a confirmed security event or unauthorized data exposure occurs, our technical team executes immediate countermeasures:
              </p>
              <ul className="space-y-1.5 text-xs sm:text-sm text-white/70 list-disc list-inside">
                <li>Isolating affected infrastructure and deploying rapid security patches.</li>
                <li>Notifying impacted institutions, school administrators, and users without undue delay.</li>
                <li>Filing requisite reports with relevant regulatory and platform review bodies as required by law.</li>
              </ul>
            </section>

            {/* 12. Third-Party Services */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-blue-400 font-black text-lg">
                <Server size={22} className="shrink-0" />
                <h3>12. Authorized Third-Party Cloud Infrastructure</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                We solely utilize verified enterprise cloud infrastructure providers:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                  <span className="font-bold text-white block mb-1">🔥 Google Firebase:</span>
                  <p className="text-white/60">Authentication, real-time Firestore database storage, and secure media hosting.</p>
                </div>
                <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                  <span className="font-bold text-white block mb-1">☁️ Google Cloud Platform:</span>
                  <p className="text-white/60">Application hosting, scalable container runtime, and enterprise network firewalls.</p>
                </div>
              </div>
            </section>

            {/* 13. No Sale & No Targeted Ads */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-emerald-400 font-black text-lg">
                <Eye size={22} className="shrink-0" />
                <h3>13. Absolute Ban on Data Sale & Targeted Advertising</h3>
              </div>
              <ul className="space-y-1.5 text-xs sm:text-sm text-white/70 list-disc list-inside">
                <li><strong>No Commercial Monetization:</strong> We do NOT sell, rent, license, or monetize student or user personal information to any third party under any circumstances.</li>
                <li><strong>No Commercial Ads:</strong> The application does not incorporate third-party advertising SDKs or commercial tracking mechanisms.</li>
              </ul>
            </section>

            {/* 14. School & User Responsibilities */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-cyan-400 font-black text-lg">
                <KeyRound size={22} className="shrink-0" />
                <h3>14. School & User Security Responsibilities</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                  <span className="font-bold text-cyan-300 block">School Administration Duties:</span>
                  <p className="text-white/70">
                    Ensuring accurate enrollment rosters, managing role privileges, distributing access PINs, and promptly deactivating departing personnel.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-black/30 border border-white/5 space-y-1">
                  <span className="font-bold text-amber-300 block">User Duties (Students, Teachers, Parents):</span>
                  <p className="text-white/70">
                    Maintaining password and access code secrecy, logging out on shared devices, and notifying support immediately if unauthorized activity is suspected.
                  </p>
                </div>
              </div>
            </section>

            {/* 15. Notifications */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-amber-400 font-black text-lg">
                <Bell size={22} className="shrink-0" />
                <h3>15. Notification & Alert Guidelines</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                Push alerts are restricted strictly to functional school notifications (e.g. exam schedules, grade releases, bus arrival alerts, urgent closures). Notification preferences can be configured via device system settings.
              </p>
            </section>

            {/* 16. Transit Geolocation */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-emerald-400 font-black text-lg">
                <MapPin size={22} className="shrink-0" />
                <h3>16. School Transit Geolocation Standards</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                Transit GPS tracking is strictly active only on authorized bus driver devices during operational transport hours. Live route telemetry is purged upon trip conclusion, without indefinite historical tracking of private residences.
              </p>
            </section>

            {/* 17. Uploaded Content */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-purple-400 font-black text-lg">
                <Camera size={22} className="shrink-0" />
                <h3>17. User-Uploaded Media & Study Documents</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                All uploaded study files and homework images remain the property of their respective creators and institutions, strictly utilized within the legitimate educational context. Uploading unlawful, harmful, or infringing material is strictly prohibited.
              </p>
            </section>

            {/* 18. Technical Logs */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-blue-400 font-black text-lg">
                <Cpu size={22} className="shrink-0" />
                <h3>18. Technical Diagnostics & Telemetry Logs</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                Our infrastructure records pseudonymous technical diagnostics (such as OS version, device type, crash logs, and operational IP timestamps) exclusively for security audits, crash remediation, and abuse prevention.
              </p>
            </section>

            {/* 19. Automated Scoring */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-cyan-400 font-black text-lg">
                <Sparkles size={22} className="shrink-0" />
                <h3>19. Automated Quiz Scoring & Game Engine</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                Algorithmic processing is limited to instant calculation of 60-Second Challenge scores and educational achievement badges. No high-stakes or legal determinations are conducted via automated profiling without educator oversight.
              </p>
            </section>

            {/* 20. Policy Updates */}
            <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-7 space-y-3">
              <div className="flex items-center gap-3 text-amber-400 font-black text-lg">
                <Globe size={22} className="shrink-0" />
                <h3>20. Policy Amendments & Notifications</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                We periodically review this policy to mirror technological and regulatory developments. Material changes will be accompanied by an in-app notice, and the updated effective date will be posted at the top of this document.
              </p>
            </section>

            {/* 21. Contact Information */}
            <section className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 border border-amber-500/20 rounded-2xl p-5 sm:p-7 space-y-4">
              <div className="flex items-center gap-3 text-amber-300 font-black text-lg">
                <Mail size={22} className="shrink-0" />
                <h3>21. Official Privacy Contact & Legal Inquiries</h3>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                For questions regarding data protection, statutory inquiries, or to exercise your deletion rights, contact our privacy officers:
              </p>
              <div className="flex flex-wrap gap-3 text-xs sm:text-sm font-bold pt-1">
                <a 
                  href="mailto:mntzralghanm527@gmail.com"
                  className="px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-amber-400/50 flex items-center gap-2 text-white hover:text-amber-300 transition-all"
                >
                  <Mail size={16} className="text-amber-400 shrink-0" />
                  <span>Official Email: mntzralghanm527@gmail.com</span>
                </a>
                <a 
                  href="https://t.me/Exashly1998" 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-cyan-400/50 flex items-center gap-2 text-white hover:text-cyan-300 transition-all"
                >
                  <ExternalLink size={16} className="text-cyan-400 shrink-0" />
                  <span>Technical Support: Telegram @Exashly1998</span>
                </a>
              </div>
            </section>

            {/* 22. Legal Disclaimer */}
            <section className="bg-black/40 border border-white/10 rounded-2xl p-4 sm:p-5 text-xs text-white/50 space-y-2">
              <div className="flex items-center gap-2 text-white/80 font-bold">
                <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                <span>Legal Principles Reference Disclaimer:</span>
              </div>
              <p className="leading-relaxed">
                References to frameworks such as COPPA, GDPR-K, or App Store Family Policies within this document signify adoption of recognized international best practices for children and data protection, and do not constitute an assertion of statutory certification unless independently audited under relevant local jurisdictions.
              </p>
            </section>

          </div>
        )}

        {/* Footer Action */}
        <div className="mt-12 text-center pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            {activeLang === 'ar' 
              ? 'جميع الحقوق محفوظة © 2026 - بوابة بيرق (Gate 6). منصة تعليمية آمنة ومسجلة رسمياً.' 
              : 'All rights reserved © 2026 - Bayraq Gate (Gate 6). Secure educational platform.'}
          </p>
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-2.5 rounded-xl bg-amber-500 text-black font-black text-xs hover:bg-amber-400 transition-all shadow-lg"
            >
              {activeLang === 'ar' ? 'العودة إلى التطبيق' : 'Return to App'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

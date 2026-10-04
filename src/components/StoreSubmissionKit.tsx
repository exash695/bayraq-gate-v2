import React, { useState } from 'react';
import { 
  Package, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Trash2, 
  KeyRound, 
  FileText, 
  Image as ImageIcon, 
  Terminal, 
  Smartphone
} from 'lucide-react';

interface StoreSubmissionKitProps {
  onBack?: () => void;
}

export const StoreSubmissionKit: React.FC<StoreSubmissionKitProps> = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const privacyUrl = 'https://bairaq-iq.com/privacy';
  const deleteAccountUrl = 'https://bairaq-iq.com/delete-account';

  const shortDesc = 'بوابة بيرق التعليمية: متابعة ذكية للطلاب، أولياء الأمور، المدارس، والخطوط.';
  const longDesc = `بوابة بيرق التعليمية (Bayraq Gate) – المنظومة الرقمية المتكاملة لإدارة المدارس الأهلية والمعاهد التعليمية، والتواصل اللحظي بين المدرسة، الطالب، ولي الأمر، الكادر التدريسي، وخطوط النقل المدرسي.

تجمع "بوابة بيرق" بين الإدارة الأكاديمية الذكية وبيئة التعلم التفاعلية المحفزة، لتوفر تجربة تعليمية عصرية وآمنة لكل أطراف العملية التربوية:

🌟 أبرز المميزات للطلاب:
• صرح القراءة والتعلم التفاعلي: اختبارات ذكية، تحديات علمية، ومحتوى تعليمي تفاعلي.
• البطاقة الرقمية والأوسمة: نظام نقاط ومستويات تحفيزية وأوسمة تميز (برونزي، فضي، ذهبي، ماسي) تشجع الطالب على الاجتهاد والتفوق.
• الجداول والواجبات: متابعة يومية للجدول الأسبوعي، المحاضرات، الملخصات، والملفات الدراسية المرسلة من الأساتذة.

👨‍👩‍👧‍👦 بوابة ولي الأمر الذكية:
• متابعة الحضور والانصراف: إشعارات فورية بحضور الطالب أو غيابه وإمكانية تقديم طلبات الإجازة إلكترونياً.
• السجل الأكاديمي والدرجات: الاطلاع اللحظي على درجات الامتحانات الشهرية والفصلية وتقييمات السلوك والأداء.
• الإدارة المالية والأقساط: كشف حساب مالي شفاف يوضح الأقساط الدراسية، المبالغ المسددة، المتبقية، والوصولات الإلكترونية الموثقة.
• تتبع خطوط النقل المدرسي: متابعة حالة رحلة الطالب مع السائق وإشعارات الوصول بأمان.

👨‍🏫 بوابة الكادر التدريسي والإدارة المدرسية:
• إدارة الصفوف والشعب: رصد الدرجات، تسجيل الحضور، ونشر الواجبات والملفات التعليمية بضغطة زر.
• غرف الصوت والمجتمع المدرسي: بيئة تواصل تربوية آمنة بإشراف إدارة المدرسة لنشر الإعلانات والتكريمات ولوحة الشرف.
• نظام الأكواد الذكي: دخول آمن وسريع لكل مستخدم عبر الكود المخصص من إدارة مدرسته مع حماية كاملة للخصوصية وعزل تام لبيانات كل مؤسسة تعليمية.

🔒 الأمان والخصوصية:
تلتزم بوابة بيرق بأعلى معايير تشفير وحماية البيانات للطلاب وأولياء الأمور، مع عزل كامل لبيانات كل مدرسة وضمان بيئة تعليمية آمنة وموثوقة.`;

  const reviewerNotes = `How to sign in for App Review:
1. Open the app and select any educational institution (e.g., the first school card) and tap "دخول المدرسة" (Enter School).
2. Choose the user role (Student, Parent, or Teacher).
3. Enter one of the following permanent demo access codes:
   - Student Role Code: STU-DEMO-2026
   - Parent Role Code: PAR-DEMO-2026
   - Teacher Role Code: TCH-DEMO-2026
4. Tap Verify/Login to access the full dashboard features. No additional password or hardware token is required.`;

  const aabCommands = `# 1. فك ضغط السورس كود وتثبيت الحزم
npm install

# 2. بناء واجهة الويب ومزامنة ملفات الأندرويد مع Capacitor
npm run build
npx cap sync android

# 3. استخراج ملف الـ .aab الموقّع للرفع على Google Play
cd android
./gradlew bundleRelease

# مسار ملف الـ .aab الناتج:
# android/app/build/outputs/bundle/release/app-release.aab`;

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#050A18] text-white font-cairo pb-16">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#050A18]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 p-1.5 flex items-center justify-center">
              <img src="/store-icon-512.png" alt="Logo" className="w-full h-full object-contain rounded-lg" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-white">
                حقيبة المطور لرفع المتاجر (Google Play & App Store Kit)
              </h1>
              <p className="text-xs text-white/50">
                جميع متطلبات النشر الرسمية، الأيقونات، الروابط، وحسابات المراجعة جاهزة للنسخ والتحميل المباشر
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* 1. Identifiers */}
        <section className="rounded-3xl bg-[#0B132B]/90 border border-white/10 p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-black text-base">
            <Package size={20} />
            <h2>1. المعرّفات الرسمية للتطبيق (App Identifiers)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs text-white/50">اسم التطبيق (App Name)</div>
                <div className="text-sm font-black text-white mt-1">بوابة بيرق - Bayraq Gate</div>
              </div>
              <button
                onClick={() => copyText('appName', 'بوابة بيرق - Bayraq Gate')}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold flex items-center gap-1.5 shrink-0"
              >
                {copiedKey === 'appName' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedKey === 'appName' ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs text-white/50">الباكج نيم (Package Name / Bundle ID)</div>
                <div className="text-sm font-mono font-black text-amber-400 mt-1" dir="ltr">com.bairaq.gate6</div>
              </div>
              <button
                onClick={() => copyText('pkg', 'com.bairaq.gate6')}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold flex items-center gap-1.5 shrink-0"
              >
                {copiedKey === 'pkg' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedKey === 'pkg' ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* 2. Store Graphics & Logos */}
        <section className="rounded-3xl bg-[#0B132B]/90 border border-white/10 p-6 space-y-5">
          <div className="flex items-center gap-2 text-amber-400 font-black text-base">
            <ImageIcon size={20} />
            <h2>2. اللوغو والصور الترويجية الرسمية للمتجر (الأبعاد القياسية بدون شفافية)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center text-center space-y-3">
              <img src="/store-icon-512.png" alt="512x512 Icon" className="w-24 h-24 rounded-2xl border border-white/15 shadow-lg" />
              <div>
                <div className="text-sm font-black text-white">أيقونة Google Play</div>
                <div className="text-xs text-white/50">512 × 512 PNG (بدون شفافية)</div>
              </div>
              <a
                href="/store-icon-512.png"
                download="bayraq-gate-icon-512x512.png"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Download size={15} />
                <span>تحميل 512×512</span>
              </a>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center text-center space-y-3">
              <img src="/store-icon-1024.png" alt="1024x1024 Icon" className="w-24 h-24 rounded-2xl border border-white/15 shadow-lg" />
              <div>
                <div className="text-sm font-black text-white">أيقونة Apple App Store</div>
                <div className="text-xs text-white/50">1024 × 1024 PNG (بدون ألفا)</div>
              </div>
              <a
                href="/store-icon-1024.png"
                download="bayraq-gate-icon-1024x1024.png"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Download size={15} />
                <span>تحميل 1024×1024</span>
              </a>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center text-center space-y-3">
              <img src="/feature-graphic-1024x500.png" alt="Feature Graphic" className="w-full h-24 object-cover rounded-xl border border-white/15 shadow-lg" />
              <div>
                <div className="text-sm font-black text-white">بنر المتجر Feature Graphic</div>
                <div className="text-xs text-white/50">1024 × 500 PNG (إلزامي لـ Google Play)</div>
              </div>
              <a
                href="/feature-graphic-1024x500.png"
                download="bayraq-feature-graphic-1024x500.png"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Download size={15} />
                <span>تحميل 1024×500</span>
              </a>
            </div>
          </div>
        </section>

        {/* 3. Privacy & Account Deletion Links */}
        <section className="rounded-3xl bg-[#0B132B]/90 border border-white/10 p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-black text-base">
            <ShieldCheck size={20} />
            <h2>3. روابط سياسة الخصوصية وحذف الحساب (تعمل مباشرة بدون تسجيل دخول)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">رابط سياسة الخصوصية (Privacy Policy URL)</span>
                <a href="/privacy" target="_blank" rel="noreferrer" className="text-xs text-white/60 hover:text-white flex items-center gap-1">
                  <span>معاينة</span>
                  <ExternalLink size={12} />
                </a>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 font-mono text-xs text-white/90 break-all" dir="ltr">
                {privacyUrl}
              </div>
              <button
                onClick={() => copyText('privacy', privacyUrl)}
                className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {copiedKey === 'privacy' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedKey === 'privacy' ? 'تم نسخ رابط الخصوصية' : 'نسخ رابط الخصوصية'}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                  <Trash2 size={13} />
                  <span>رابط حذف الحساب والبيانات (Delete Account URL)</span>
                </span>
                <a href="/delete-account" target="_blank" rel="noreferrer" className="text-xs text-white/60 hover:text-white flex items-center gap-1">
                  <span>معاينة</span>
                  <ExternalLink size={12} />
                </a>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 font-mono text-xs text-white/90 break-all" dir="ltr">
                {deleteAccountUrl}
              </div>
              <button
                onClick={() => copyText('deleteUrl', deleteAccountUrl)}
                className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {copiedKey === 'deleteUrl' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedKey === 'deleteUrl' ? 'تم نسخ رابط حذف الحساب' : 'نسخ رابط حذف الحساب'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* 4. Reviewer Test Accounts */}
        <section className="rounded-3xl bg-[#0B132B]/90 border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-blue-400 font-black text-base">
              <KeyRound size={20} />
              <h2>4. حسابات التيست لمراجعي المتاجر (App Review Demo Accounts)</h2>
            </div>
            <button
              onClick={() => copyText('reviewerNotes', reviewerNotes)}
              className="px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center gap-1.5"
            >
              {copiedKey === 'reviewerNotes' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copiedKey === 'reviewerNotes' ? 'تم نسخ تعليمات المراجع بالإنجليزية' : 'نسخ تعليمات المراجع (English)'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'كود الطالب التجريبي (Student)', code: 'STU-DEMO-2026' },
              { label: 'كود ولي الأمر التجريبي (Parent)', code: 'PAR-DEMO-2026' },
              { label: 'كود الأستاذ التجريبي (Teacher)', code: 'TCH-DEMO-2026' },
            ].map((item) => (
              <div key={item.code} className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-white/50">{item.label}</div>
                  <div className="text-sm font-mono font-black text-blue-300 mt-0.5" dir="ltr">{item.code}</div>
                </div>
                <button
                  onClick={() => copyText(item.code, item.code)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs"
                >
                  {copiedKey === item.code ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            ))}
          </div>

          <pre className="p-4 rounded-2xl bg-black/60 border border-white/10 text-xs font-mono text-white/80 overflow-x-auto leading-relaxed" dir="ltr">
            {reviewerNotes}
          </pre>
        </section>

        {/* 5. Short & Long Descriptions */}
        <section className="rounded-3xl bg-[#0B132B]/90 border border-white/10 p-6 space-y-5">
          <div className="flex items-center gap-2 text-purple-400 font-black text-base">
            <FileText size={20} />
            <h2>5. الوصف القصير والوصف الطويل للمتجر</h2>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/70">الوصف القصير (Short Description - 76 حرفاً)</span>
              <button
                onClick={() => copyText('shortDesc', shortDesc)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold flex items-center gap-1.5"
              >
                {copiedKey === 'shortDesc' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copiedKey === 'shortDesc' ? 'تم النسخ' : 'نسخ الوصف القصير'}</span>
              </button>
            </div>
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white">
              {shortDesc}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/70">الوصف الطويل الشامل (Full Description)</span>
              <button
                onClick={() => copyText('longDesc', longDesc)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold flex items-center gap-1.5"
              >
                {copiedKey === 'longDesc' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copiedKey === 'longDesc' ? 'تم النسخ' : 'نسخ الوصف الطويل'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs sm:text-sm text-white/85 whitespace-pre-wrap font-cairo leading-relaxed max-h-72 overflow-y-auto">
              {longDesc}
            </pre>
          </div>
        </section>

        {/* 6. Source Code & .aab Generation */}
        <section className="rounded-3xl bg-[#0B132B]/90 border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-amber-400 font-black text-base">
              <Terminal size={20} />
              <h2>6. السورس كود واستخراج ملف (.aab) و السكرينات</h2>
            </div>
            <button
              onClick={() => copyText('aabCommands', aabCommands)}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold flex items-center gap-1.5"
            >
              {copiedKey === 'aabCommands' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copiedKey === 'aabCommands' ? 'تم نسخ الأوامر' : 'نسخ أوامر بناء .aab'}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs sm:text-sm text-white/90 space-y-1">
              <div className="font-black text-amber-400 text-sm">📦 تحميل السورس كود الكامل للمشروع (Full Source Code ZIP)</div>
              <p className="text-xs text-white/70">
                يحتوي على المشروع كاملاً مع مجلدي <code>android/</code> و <code>ios/</code> المهيأين مسبقاً بـ Capacitor والباكج نيم الرسمي <code>com.bairaq.gate6</code>.
              </p>
            </div>
            <a
              href="/bayraq-gate-source-code.zip"
              download="bayraq-gate-source-code.zip"
              className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm flex items-center gap-2 shrink-0 shadow-lg transition-all"
            >
              <Download size={16} />
              <span>تحميل السورس كود (.ZIP)</span>
            </a>
          </div>

          <div className="text-xs sm:text-sm text-white/75 space-y-2 leading-relaxed">
            <p>• <strong>أوامر استخراج ملف <code>.aab</code> للمطور بعد فك ضغط الملف:</strong></p>
          </div>

          <pre className="p-4 rounded-2xl bg-black/60 border border-white/10 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed" dir="ltr">
            {aabCommands}
          </pre>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
            <Smartphone size={20} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-white/75 space-y-1 leading-relaxed">
              <div className="font-black text-white">السكرينات المطلوبة للمتجر (Screenshots - من 4 إلى 8 صور):</div>
              <p>التقط 5 صور شاشة طولية (بنسبة 9:16) من الهاتف أو المتصفح للواجهات التالية بعد الدخول بكود التيست <code>STU-DEMO-2026</code> و <code>PAR-DEMO-2026</code>:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-white/65">
                <li>شاشة الميادين الرئيسية (قائمة المدارس والأكاديمية).</li>
                <li>الواجهة الرئيسية للطالب (الأوسمة، النقاط، والمستوى).</li>
                <li>صرح القراءة والاختبارات التفاعلية.</li>
                <li>بوابة ولي الأمر (متابعة الحضور، الدرجات، والأقساط المالية).</li>
                <li>غرف الصوت والمجتمع المدرسي أو تتبع خطوط النقل.</li>
              </ol>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

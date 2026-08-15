# Cloudflare Workers & R2 Setup Guide for Bairaq Portal (بوابة بيرق)

هذا المجلد يحتوي على التكوينات البرمجية الخاصة بـ Cloudflare Workers و Cloudflare R2 لربط التطبيق مع البوابة السحابية المتقدمة.

---

## 🚀 1. الخطوات السريعة لنشر Cloudflare Worker

### الخطوة الأولى: تثبيت Wrangler وتسجيل الدخول
```bash
npm install -g wrangler
wrangler login
```

### الخطوة الثانية: إنشاء دلو R2 لتخزين الفيديوهات والصور الثقيلة
```bash
wrangler r2 bucket create al-sadis-academy
```

### الخطوة الثالثة: ضبط مفاتيح الذكاء الاصطناعي المشفرة (Secrets)
```bash
wrangler secret put GEMINI_API_KEY
```
*(أدخل مفتاح Gemini الخاص بك عندما يُطلب منك ذلك)*.

### الخطوة الرابعة: نشر الـ Worker إلى السحابة
```bash
cd cloudflare
wrangler deploy
```

---

## 🛠️ 2. المتغيرات البيئية والتكامل مع التطبيق

في ملف المتغيرات البيئية الخاص بالتطبيق `.env`:

```env
# رابط الـ Worker بعد النشر
VITE_WORKER_GATEWAY_URL=https://bairaq-portal-gateway.YOUR_SUBDOMAIN.workers.dev

# رابط CDN الخاص بـ Cloudflare R2 لعرض الصور والفيديوهات
VITE_R2_PUBLIC_URL=https://cdn.bairaq.app
```

---

## 📦 3. رفع ملفات وسائط بيرق إلى Cloudflare R2

يمكنك رفع مجلدات الوسائط الثقيلة من مجلد `public` مباشرة إلى Cloudflare R2 باستخدام Wrangler:

```bash
# رفع الفيديوهات وصور الشخصية
wrangler r2 object put al-sadis-academy/mascot --file=./public/mascot/ --recursive

# رفع شعارات المدارس
wrangler r2 object put al-sadis-academy/school-logos --file=./public/school-logos/ --recursive
```

---

## ✨ المميزات الرئيسية لهذه الهيكلية

1. **حماية 100% لمفاتيح API**: لا تظهر مفاتيح Gemini أبداً في كود الواجهة الأمامية.
2. **مرونة تبديل المزودين**: إمكانية تغيير مزود الذكاء الاصطناعي (Gemini, OpenAI, Claude) من داخل Worker دون إعادة بناء التطبيق.
3. **سرعة الاستجابة وذاكرة التخزين**: توفير ذاكرة تخزين مؤقت استباقية (`cacheService`) للحد من الاستدعاءات المكررة.
4. **توفير الباندويث**: تحويل مسارات الوسائط الثقيلة إلى شبكة توصيل المحتوى CDN الخاصة بـ Cloudflare R2.

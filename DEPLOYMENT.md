# دليل النشر على Render

هذا الدليل يشرح كيفية نشر نظام إدارة محلات الملابس على خدمة Render.

## المتطلبات المسبقة

1. حساب على [Render](https://render.com)
2. حساب GitHub بالمشروع مربوط
3. حساب Supabase مع بيانات الاتصال

## خطوات النشر

### الخطوة 1: ربط المشروع بـ Render

1. اذهب إلى [Render Dashboard](https://dashboard.render.com)
2. انقر على **"New +"** واختر **"Web Service"**
3. اختر **"Build and deploy from a Git repository"**
4. ابحث عن المشروع `miysara-ahmed-store-management`
5. اختر الفرع الذي تريد نشره (عادة `main`)
6. اضغط **"Connect"**

### الخطوة 2: إعدادات البناء

1. املأ التفاصيل التالية:

   - **Name**: `miysara-ahmed-store` (أو أي اسم تريده)
   - **Environment**: `Node`
   - **Build Command**: `pnpm install && pnpm run build`
   - **Start Command**: تُترك فارغة (خدمة ثابتة)
   - **Instance Type**: `Free` (أو الخطة المدفوعة)

2. اترك الإعدادات الأخرى على حالتها

### الخطوة 3: إضافة متغيرات البيئة

1. انتقل إلى قسم **"Environment"**
2. أضف المتغيرات التالية:

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. استبدل القيم بـ URL والمفتاح الفعليين من Supabase

### الخطوة 4: التحقق من ملف render.yaml

تأكد من أن ملف `render.yaml` موجود في جذر المشروع ويحتوي على:

```yaml
services:
  - type: web
    name: miysara-ahmed-store
    env: static
    buildCommand: pnpm install && pnpm run build
    staticPublishPath: ./dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    envVars:
      - key: VITE_SUPABASE_URL
        sync: false
      - key: VITE_SUPABASE_ANON_KEY
        sync: false
```

### الخطوة 5: النشر

1. انقر على **"Create Web Service"**
2. سيبدأ Render بـ:
   - استنساخ المشروع
   - تثبيت الاعتماديات
   - بناء التطبيق
   - نشر الملفات الثابتة
3. سيظهر رابط النشر عند انتهاء العملية

## استكشاف الأخطاء في النشر

### خطأ: "متغيرات البيئة مفقودة"

**السبب**: لم تتم إضافة `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY`

**الحل**:
1. اذهب إلى إعدادات الخدمة
2. انقر على **"Environment"**
3. أضف المتغيرات المفقودة
4. اضغط **"Redeploy"**

### خطأ: "Build failed"

**السبب**: مشكلة في الاعتماديات أو البناء

**الحل**:
1. تحقق من السجلات (Logs)
2. تأكد من أن جميع الملفات مرفوعة على GitHub
3. جرّب إعادة النشر

### خطأ: "Cannot find module..."

**السبب**: اعتماديات مفقودة

**الحل**:
1. تأكد من أن `pnpm install` تم تنفيذه بنجاح
2. حذف `pnpm-lock.yaml` محليًا وأنشئ جديد: `pnpm install`
3. ادفع التغييرات إلى GitHub
4. أعد النشر

## إعادة النشر بعد التحديثات

عند إضافة تحديثات جديدة:

1. ادفع التغييرات إلى GitHub:
   ```bash
   git add .
   git commit -m "تحديث الميزة الجديدة"
   git push origin main
   ```

2. Render سينشر التحديثات تلقائيًا (إذا كان القطع التلقائي مفعلاً)

3. أو انقر على **"Redeploy"** يدويًا

## تحسين الأداء

### تقليل حجم الحزمة

المشروع مُحسّن بالفعل مع:
- تقسيم الـ chunks
- تحديد الاعتماديات
- استخدام Gzip

### مراقبة الأداء

في لوحة تحكم Render:
- اعرض الـ **"Logs"** لمراقبة الخوادم
- استخدم **"Metrics"** لمراقبة الاستخدام

## إدارة النطاق

للدخول بنطاق مخصص:

1. اذهب إلى **"Settings"** للخدمة
2. انقر على **"Custom Domain"**
3. أضف نطاقك
4. اتبع الخطوات لتحديث DNS

## الأمان

1. استخدم متغيرات البيئة لكل المفاتيح السرية
2. لا تضع أي مفاتيح مباشرة في الكود
3. استخدم HTTPS (يتم تفعيله تلقائيًا)

## الدعم والمساعدة

- [توثيق Render](https://render.com/docs)
- [دعم Render](https://support.render.com)
- فتح Issue في GitHub

---

نشر سعيد! 🚀

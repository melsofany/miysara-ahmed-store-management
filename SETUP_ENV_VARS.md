# دليل إضافة متغيرات البيئة على Render

هذا الدليل يشرح كيفية إضافة متغيرات البيئة (`VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY`) على Render باستخدام API أو الـ Dashboard.

## ⚙️ المتغيرات المطلوبة

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## الطريقة 1️⃣: استخدام السكريبت (الأسهل)

### متطلبات:
- Render API Key (من Render Dashboard)
- Service ID (معرف الخدمة على Render)
- بيانات Supabase

### الخطوات:

#### أ) استخدام Node.js Script:

```bash
# باستخدام متغيرات البيئة:
export RENDER_API_KEY="your-api-key"
export RENDER_SERVICE_ID="your-service-id"
export VITE_SUPABASE_URL="your-url"
export VITE_SUPABASE_ANON_KEY="your-key"

node scripts/set-render-env.js

# أو باستخدام معاملات سطر الأوامر:
node scripts/set-render-env.js \
  --api-key "your-api-key" \
  --service-id "your-service-id" \
  --url "your-url" \
  --anon-key "your-key"
```

#### ب) استخدام Bash Script:

```bash
export RENDER_API_KEY="your-api-key"
export RENDER_SERVICE_ID="your-service-id"
export VITE_SUPABASE_URL="your-url"
export VITE_SUPABASE_ANON_KEY="your-key"

bash scripts/set-render-env.sh
```

---

## الطريقة 2️⃣: استخدام Render Dashboard (اليدوي)

### الخطوات:

1. **ادخل إلى [Render Dashboard](https://dashboard.render.com)**

2. **اختر مشروعك:**
   - انقر على `miysara-ahmed-store`

3. **اذهب إلى الإعدادات:**
   - انقر على **Settings** في الأعلى

4. **أضف المتغيرات:**
   - اختر **Environment** من القائمة الجانبية
   - انقر **Add Environment Variable**
   
5. **أضف المتغير الأول:**
   ```
   Key: VITE_SUPABASE_URL
   Value: https://your-project.supabase.co
   ```
   - انقر **Save Changes**

6. **أضف المتغير الثاني:**
   ```
   Key: VITE_SUPABASE_ANON_KEY
   Value: your-anon-key-here
   ```
   - انقر **Save Changes**

7. **أعد النشر:**
   - انقر **Redeploy** (أو أنتظر النشر التلقائي)
   - انتظر 2-5 دقائق

8. **تحقق من النتيجة:**
   - افتح الموقع الخاص بك
   - يجب أن يظهر بدون أخطاء البيئة

---

## الطريقة 3️⃣: استخدام Render CLI

إذا كان لديك Render CLI مثبت:

```bash
# تثبيت Render CLI
npm install -g @render-com/cli

# المصادقة
render login

# إضافة المتغيرات
render env add VITE_SUPABASE_URL "https://your-project.supabase.co"
render env add VITE_SUPABASE_ANON_KEY "your-anon-key-here"
```

---

## 🔑 كيفية الحصول على المعلومات المطلوبة

### 1. Render API Key:
- ادخل إلى [Render Dashboard](https://dashboard.render.com)
- انقر على صورة الملف الشخصي في الزاوية العلوية اليسرى
- اختر **Account Settings**
- انقر على **API Keys**
- انقر **Create API Key**
- انسخ المفتاح

### 2. Render Service ID:
- ادخل إلى [Render Dashboard](https://dashboard.render.com)
- اختر مشروعك
- انقر على **Settings**
- ستجد Service ID في أعلى الصفحة أو في عنوان URL

### 3. VITE_SUPABASE_URL:
- ادخل إلى [Supabase Dashboard](https://app.supabase.com)
- اختر مشروعك
- انقر على **Project Settings** → **API**
- ستجد `Project URL`

### 4. VITE_SUPABASE_ANON_KEY:
- في نفس صفحة Supabase API
- ستجد `anon` (public) key
- انسخها

---

## ✅ التحقق من نجاح الإضافة

### في Render Dashboard:
- اذهب إلى **Settings** → **Environment**
- يجب أن ترى المتغيرات مضافة

### على الموقع:
- افتح الموقع الخاص بك
- يجب أن تختفي رسالة "متغيرات البيئة مفقودة"
- يجب أن ترى تحميل التطبيق بشكل طبيعي

---

## 🔧 استكشاف الأخطاء

### خطأ: "Invalid API Key"
- تحقق من أن API Key صحيح
- تحقق من أنك نسخت المفتاح كاملاً

### خطأ: "Service not found"
- تحقق من Service ID
- تأكد من أنك تستخدم ID الصحيح

### خطأ: "Invalid URL"
- تحقق من أن الـ URL صحيح ولا يحتوي على مسافات

### رسالة "متغيرات مفقودة" بعد الإضافة:
- تأكد من الضغط على **Redeploy**
- انتظر 2-5 دقائق حتى يعاد النشر
- حاول تحديث الصفحة (Ctrl+F5)

---

## 📝 أمثلة

### مثال 1: استخدام Node Script مع متغيرات البيئة:

```bash
#!/bin/bash

# ضع هذا في ملف .env.render
export RENDER_API_KEY="rnd_xxxxxxxxxxxxx"
export RENDER_SERVICE_ID="srv-xxxxxxxxxxxxx"
export VITE_SUPABASE_URL="https://abcdefg.supabase.co"
export VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# ثم قم بتشغيل:
source .env.render
node scripts/set-render-env.js
```

### مثال 2: استخدام البوش المباشر:

```bash
RENDER_API_KEY="rnd_xxxxxxxxxxxxx" \
RENDER_SERVICE_ID="srv-xxxxxxxxxxxxx" \
VITE_SUPABASE_URL="https://abcdefg.supabase.co" \
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
bash scripts/set-render-env.sh
```

---

## 🎯 الخطوات التالية

بعد إضافة المتغيرات بنجاح:

1. ✅ تحقق من أن الموقع يعمل
2. ✅ اختبر جميع الميزات الأساسية
3. ✅ تحقق من السجلات للأخطاء
4. ✅ احفظ المفاتيح في مكان آمن

---

## 🔐 نصائح أمان

- ✋ لا تحفظ المفاتيح في ملفات Git
- ✋ استخدم متغيرات البيئة بدلاً من القيم المرمزة
- ✋ غيّر المفاتيح بشكل دوري
- ✋ لا تشارك API Keys مع أي أحد

---

## 📞 الدعم

للمزيد من المساعدة:
- اقرأ [HELP.md](./HELP.md)
- اقرأ [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- اقرأ [RENDER_SETUP.md](./RENDER_SETUP.md)

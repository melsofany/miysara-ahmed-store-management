# دليل الرفع عبر API Render - دليل شامل

## 📌 المحتويات
- [الطريقة الأولى: السكريبت (الأسهل)](#الطريقة-الأولى-السكريبت)
- [الطريقة الثانية: API المباشرة](#الطريقة-الثانية-api-المباشرة)
- [الطريقة الثالثة: Dashboard اليدويّ](#الطريقة-الثالثة-dashboard)
- [استكشاف الأخطاء](#استكشاف-الأخطاء)

---

## ✅ قائمة التحقق السريعة

قبل البدء، تأكد من وجود:

- [ ] Render API Key
- [ ] Render Service ID
- [ ] VITE_SUPABASE_URL
- [ ] VITE_SUPABASE_ANON_KEY
- [ ] Node.js مثبت (إذا استخدمت Node Script)
- [ ] curl مثبت (إذا استخدمت Bash Script)

---

## الطريقة الأولى: السكريبت (الأسهل) 🚀

### أ) استخدام Node.js Script

هذه الطريقة **الأسهل والأسرع**.

#### الخطوة 1: جهز البيانات

اجمع المعلومات التالية:
```
RENDER_API_KEY = rnd_xxxxxxxxxxxxx
RENDER_SERVICE_ID = srv-xxxxxxxxxxxxx
VITE_SUPABASE_URL = https://abcdefg.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### الخطوة 2: استخدم السكريبت

**الطريقة أ: متغيرات البيئة (الأفضل)**

```bash
export RENDER_API_KEY="rnd_xxxxxxxxxxxxx"
export RENDER_SERVICE_ID="srv-xxxxxxxxxxxxx"
export VITE_SUPABASE_URL="https://abcdefg.supabase.co"
export VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

node scripts/set-render-env.js
```

**الطريقة ب: معاملات سطر الأوامر**

```bash
node scripts/set-render-env.js \
  --api-key "rnd_xxxxxxxxxxxxx" \
  --service-id "srv-xxxxxxxxxxxxx" \
  --url "https://abcdefg.supabase.co" \
  --anon-key "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### النتيجة المتوقعة:

```
╔════════════════════════════════════════════════════════════╗
║    Render Environment Variables Setup Script             ║
║    سكريبت إضافة متغيرات البيئة على Render                  ║
╚════════════════════════════════════════════════════════════╝

🔄 جاري الاتصال بـ Render API...

✓ تم العثور على الخدمة: miysara-ahmed-store

📋 المتغيرات الحالية:
   (لا توجد متغيرات حالياً)

🚀 جاري إضافة المتغيرات الجديدة...

📝 إضافة متغير: VITE_SUPABASE_URL
   ✓ تم إضافة VITE_SUPABASE_URL بنجاح
📝 إضافة متغير: VITE_SUPABASE_ANON_KEY
   ✓ تم إضافة VITE_SUPABASE_ANON_KEY بنجاح

✅ تم إضافة جميع المتغيرات بنجاح!

📋 المتغيرات بعد التحديث:
   • VITE_SUPABASE_URL = https://...
   • VITE_SUPABASE_ANON_KEY = eyJhbGci...

🎉 تم بنجاح!

الخطوة التالية:
1. اذهب إلى Render Dashboard
2. اختر الخدمة
3. انقر "Redeploy"
4. انتظر 2-5 دقائق
```

---

### ب) استخدام Bash Script

إذا كنت تفضل Bash:

```bash
export RENDER_API_KEY="rnd_xxxxxxxxxxxxx"
export RENDER_SERVICE_ID="srv-xxxxxxxxxxxxx"
export VITE_SUPABASE_URL="https://abcdefg.supabase.co"
export VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

bash scripts/set-render-env.sh
```

---

## الطريقة الثانية: API المباشرة 🔧

إذا كنت تريد التحكم الكامل، استخدم API مباشرة:

### الخطوة 1: احصل على معرّف الخدمة

```bash
curl -H "Authorization: Bearer rnd_xxxxxxxxxxxxx" \
  https://api.render.com/v1/services | jq '.services'
```

### الخطوة 2: أضف المتغيرات

```bash
# أضف VITE_SUPABASE_URL
curl -X POST \
  -H "Authorization: Bearer rnd_xxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "VITE_SUPABASE_URL",
    "value": "https://abcdefg.supabase.co"
  }' \
  https://api.render.com/v1/services/srv-xxxxxxxxxxxxx/env-vars

# أضف VITE_SUPABASE_ANON_KEY
curl -X POST \
  -H "Authorization: Bearer rnd_xxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "VITE_SUPABASE_ANON_KEY",
    "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }' \
  https://api.render.com/v1/services/srv-xxxxxxxxxxxxx/env-vars
```

### الخطوة 3: تحقق من المتغيرات

```bash
curl -H "Authorization: Bearer rnd_xxxxxxxxxxxxx" \
  https://api.render.com/v1/services/srv-xxxxxxxxxxxxx/env-vars
```

---

## الطريقة الثالثة: Dashboard 🖱️

إذا كنت تفضل الواجهة الرسومية:

### الخطوات:

1. **ادخل إلى [Render Dashboard](https://dashboard.render.com)**

2. **اختر مشروعك:**
   - من القائمة الجانبية، اختر `miysara-ahmed-store`

3. **اذهب إلى الإعدادات:**
   - انقر على **Settings** في الأعلى

4. **افتح بيئة المتغيرات:**
   - من القائمة الجانبية، اختر **Environment**

5. **أضف المتغيرات:**
   - انقر **Add Environment Variable**
   
   للمتغير الأول:
   ```
   Key:   VITE_SUPABASE_URL
   Value: https://abcdefg.supabase.co
   ```
   - انقر **Save Changes**
   
   للمتغير الثاني:
   ```
   Key:   VITE_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   - انقر **Save Changes**

6. **أعد النشر:**
   - اضغط **Redeploy**
   - انتظر 2-5 دقائق

---

## 🔑 كيفية الحصول على المعلومات المطلوبة

### 1️⃣ Render API Key

**الخطوات:**

1. ادخل [Render Dashboard](https://dashboard.render.com)
2. انقر صورة الملف الشخصي (الزاوية العلوية اليسرى)
3. اختر **Account Settings**
4. اختر **API Keys** من الجانب
5. انقر **Create API Key**
6. اختر "Full access"
7. انسخ المفتاح

**⚠️ تنبيه:** احفظ المفتاح في مكان آمن، لن تره مرة أخرى!

### 2️⃣ Render Service ID

**الخطوات:**

1. ادخل [Render Dashboard](https://dashboard.render.com)
2. اختر مشروعك `miysara-ahmed-store`
3. اذهب إلى **Settings**
4. ستجد **Service ID** في أعلى الصفحة

**أو:**

من عنوان URL: `https://dashboard.render.com/services/srv-xxxxxxxxxxxxx`
- الـ ID هو: `srv-xxxxxxxxxxxxx`

### 3️⃣ VITE_SUPABASE_URL

**الخطوات:**

1. ادخل [Supabase Dashboard](https://app.supabase.com)
2. اختر مشروعك
3. انقر **Project Settings** على الجانب
4. اختر **API**
5. انسخ **Project URL** (يبدو كـ `https://abcdefg.supabase.co`)

### 4️⃣ VITE_SUPABASE_ANON_KEY

**في نفس صفحة Supabase API:**

1. ابحث عن **anon (public)** key
2. انسخها

---

## ✅ التحقق من النجاح

### 1. تحقق من Render Dashboard:

```bash
curl -H "Authorization: Bearer rnd_xxxxxxxxxxxxx" \
  https://api.render.com/v1/services/srv-xxxxxxxxxxxxx/env-vars | jq
```

يجب أن ترى المتغيرات في الرد:

```json
{
  "envVars": [
    {
      "key": "VITE_SUPABASE_URL",
      "value": "https://abcdefg.supabase.co"
    },
    {
      "key": "VITE_SUPABASE_ANON_KEY",
      "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  ]
}
```

### 2. تحقق من الموقع:

- ادخل موقعك على Render
- يجب أن تختفي رسالة "متغيرات البيئة مفقودة"
- يجب أن يحمّل التطبيق بشكل طبيعي

### 3. تحقق من السجلات:

```bash
curl -H "Authorization: Bearer rnd_xxxxxxxxxxxxx" \
  https://api.render.com/v1/services/srv-xxxxxxxxxxxxx/logs | tail -50
```

---

## 🔍 استكشاف الأخطاء

### ❌ خطأ: "Unauthorized"

**السبب:** API Key خاطئ أو منتهي الصلاحية

**الحل:**
```bash
# تحقق من API Key
echo $RENDER_API_KEY

# أنشئ مفتاح جديد إن لزم الأمر
# اتبع الخطوات أعلاه
```

### ❌ خطأ: "Service not found"

**السبب:** Service ID خاطئ

**الحل:**
```bash
# اعثر على Service ID الصحيح
curl -H "Authorization: Bearer $RENDER_API_KEY" \
  https://api.render.com/v1/services | jq '.services[].id'
```

### ❌ خطأ: "Invalid URL"

**السبب:** الـ URL يحتوي على أخطاء أو مسافات

**الحل:**
```bash
# تحقق من الـ URL
echo $VITE_SUPABASE_URL

# تأكد من عدم وجود مسافات أو أحرف غريبة
```

### ❌ مازال يظهر "متغيرات مفقودة"

**السبب:** لم يعاد النشر بعد

**الحل:**
```bash
# 1. تأكد من إضافة المتغيرات
curl -H "Authorization: Bearer $RENDER_API_KEY" \
  https://api.render.com/v1/services/$RENDER_SERVICE_ID/env-vars

# 2. اعد النشر
curl -X POST \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  https://api.render.com/v1/services/$RENDER_SERVICE_ID/redeploy

# 3. انتظر 2-5 دقائق

# 4. حدّث الصفحة (Ctrl+F5 أو Cmd+Shift+R)
```

---

## 📊 أمثلة عملية

### مثال 1: سكريبت كامل في bash

```bash
#!/bin/bash

# تعيين المتغيرات
export RENDER_API_KEY="rnd_xxxxxxxxxxxxx"
export RENDER_SERVICE_ID="srv-xxxxxxxxxxxxx"
export VITE_SUPABASE_URL="https://abcdefg.supabase.co"
export VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# استدعاء السكريبت
node scripts/set-render-env.js
```

### مثال 2: تشغيل مباشر في Terminal

```bash
RENDER_API_KEY="rnd_xxxxxxxxxxxxx" \
RENDER_SERVICE_ID="srv-xxxxxxxxxxxxx" \
VITE_SUPABASE_URL="https://abcdefg.supabase.co" \
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
bash scripts/set-render-env.sh
```

### مثال 3: استخدام ملف .env.render

```bash
# ملف .env.render
RENDER_API_KEY=rnd_xxxxxxxxxxxxx
RENDER_SERVICE_ID=srv-xxxxxxxxxxxxx
VITE_SUPABASE_URL=https://abcdefg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ثم:
source .env.render
node scripts/set-render-env.js
```

---

## 🎯 ملخص الخطوات

### الطريقة السريعة (5 دقائق):

1. ✅ اجمع المعلومات الأربع
2. ✅ شغّل `node scripts/set-render-env.js`
3. ✅ اضغط "Redeploy" على Render
4. ✅ انتظر 2-5 دقائق
5. ✅ افتح الموقع وتحقق

### الطريقة اليدويّة (10 دقائق):

1. ✅ ادخل Render Dashboard
2. ✅ اختر الخدمة
3. ✅ Settings → Environment
4. ✅ أضف المتغيرات يدويّاً
5. ✅ انقر "Redeploy"
6. ✅ انتظر وتحقق

---

## 📞 الدعم

للمزيد من المساعدة:

- اقرأ [SETUP_ENV_VARS.md](./SETUP_ENV_VARS.md)
- اقرأ [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- اقرأ [HELP.md](./HELP.md)
- اقرأ [RENDER_SETUP.md](./RENDER_SETUP.md)

---

**الآن أنت جاهز للرفع! 🚀**

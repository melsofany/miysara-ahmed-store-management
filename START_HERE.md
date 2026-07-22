# 🚀 ابدأ من هنا - دليل سريع

**مرحباً! اتبع هذه الخطوات البسيطة والسريعة للنشر على Render.**

---

## ⚡ 3 خطوات فقط (5 دقائق)

### 1️⃣ اجمع المعلومات (دقيقتان)

احصل على 4 معلومات من:

**أ) Render API Key:**
- ادخل [Render Dashboard](https://dashboard.render.com)
- صورة الملف الشخصي → Account Settings → API Keys
- انقر "Create API Key" → Full access
- انسخ المفتاح

**ب) Render Service ID:**
- في Render Dashboard
- اختر مشروعك
- Settings → ستجد Service ID في أعلى الصفحة
- أو من URL: `dashboard.render.com/services/srv-xxxxx`

**ج) VITE_SUPABASE_URL:**
- ادخل [Supabase](https://app.supabase.com)
- اختر مشروعك
- Project Settings → API
- انسخ "Project URL"

**د) VITE_SUPABASE_ANON_KEY:**
- في نفس صفحة Supabase API
- انسخ "anon (public)" key

### 2️⃣ شغّل السكريبت (دقيقة واحدة)

```bash
# في Terminal الخاص بك:

export RENDER_API_KEY="your-api-key-here"
export RENDER_SERVICE_ID="your-service-id-here"
export VITE_SUPABASE_URL="https://your-project.supabase.co"
export VITE_SUPABASE_ANON_KEY="your-anon-key-here"

node scripts/set-render-env.js
```

**ستظهر رسالة "تم بنجاح"** ✅

### 3️⃣ أعد النشر (دقيقتان)

- ادخل [Render Dashboard](https://dashboard.render.com)
- اختر مشروعك
- انقر **Redeploy** (أو حتى بدون الضغط سيعاد النشر تلقائياً)
- انتظر 2-5 دقائق
- افتح موقعك - **يجب أن يعمل بدون أخطاء!** 🎉

---

## ✅ تحقق من النجاح

افتح موقعك وتأكد من:
- لا توجد رسالة "متغيرات البيئة مفقودة"
- يحمّل التطبيق بشكل طبيعي
- تستطيع تسجيل الدخول

---

## 📚 للمزيد من المساعدة

| الموضوع | الملف |
|--------|------|
| أسهل طريقة | [QUICK_START.md](./QUICK_START.md) |
| خطوات مفصلة | [RENDER_SETUP.md](./RENDER_SETUP.md) |
| استخدام API | [RENDER_API_GUIDE.md](./RENDER_API_GUIDE.md) |
| طرق أخرى | [SETUP_ENV_VARS.md](./SETUP_ENV_VARS.md) |
| حل المشاكل | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) |
| أسئلة شائعة | [FAQ.md](./FAQ.md) |
| مركز المساعدة | [HELP.md](./HELP.md) |

---

## ⚠️ عند وجود مشاكل

### الخطأ: "Invalid API Key"
→ تحقق من API Key، جرب إنشاء مفتاح جديد

### الخطأ: "Service not found"
→ تحقق من Service ID

### ظهور "متغيرات مفقودة" بعد الإضافة
→ تأكد من الضغط على Redeploy، انتظر 2-5 دقائق

### لا تزال توجد مشاكل
→ اقرأ [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) أو [HELP.md](./HELP.md)

---

## 💡 نصائح

✅ احفظ المفاتيح في مكان آمن
✅ استخدم متغيرات البيئة بدلاً من القيم المرمزة
✅ لا تشارك المفاتيح مع أحد
✅ غيّر المفاتيح كل 3-6 أشهر

---

**كل شيء جاهز! ابدأ الآن! 🚀**

انسخ الأوامر أعلاه وشغّلها في Terminal.

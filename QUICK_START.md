# البدء السريع - 5 دقائق فقط ⚡

## للتشغيل المحلي (على حاسوبك)

### 1. استنساخ المشروع
```bash
git clone https://github.com/melsofany/miysara-ahmed-store-management.git
cd miysara-ahmed-store-management
```

### 2. تثبيت الاعتماديات
```bash
pnpm install
```

### 3. إعداد البيئة
```bash
cp .env.example .env.development.local
```

### 4. إضافة بيانات Supabase
افتح `.env.development.local` وأضف:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

كيفية الحصول على البيانات؟
1. ادخل [supabase.com](https://supabase.com)
2. افتح مشروعك
3. **Settings** → **API**
4. انسخ `Project URL` و `anon public`

### 5. التشغيل
```bash
pnpm dev
```

ستظهر الرسالة:
```
Local:   http://localhost:5173/
```

استمع، انقر على الرابط وابدأ الاستخدام! 🎉

---

## للنشر على Render

### 1. ادخل إلى Render
انتقل إلى [render.com](https://render.com) وسجّل الدخول

### 2. افتح مشروعك
البحث عن `miysara-ahmed-store` وانقر عليه

### 3. أضف متغيرات البيئة
- انقر **Settings**
- اختر **Environment**
- أضف:
  - `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
  - `VITE_SUPABASE_ANON_KEY` = `your-anon-key`

### 4. انشر التحديثات
- انقر **Redeploy**
- انتظر 2-5 دقائق

تم! الموقع يعمل الآن! 🚀

---

## أول خطوات بعد النشر

1. **تسجيل الدخول**: استخدم حسابك في Supabase
2. **إنشاء متجر**: أضف محل جديد
3. **إضافة المنتجات**: ابدأ بإضافة المنتجات
4. **فتح نقطة بيع**: استخدم POS للبيع

---

## تحتاج مساعدة؟

- **مشاكل محلية?** اقرأ [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **مشاكل Render?** اقرأ [RENDER_SETUP.md](./RENDER_SETUP.md)
- **أسئلة عامة?** اقرأ [README.md](./README.md)

---

## الأوامر المهمة

```bash
# التشغيل المحلي
pnpm dev

# البناء للنشر
pnpm build

# التحقق من الأخطاء
pnpm lint

# فحص أنواع TypeScript
pnpm typecheck

# معاينة البناء
pnpm preview
```

---

**ممتاز! أنت جاهز الآن 🎊**

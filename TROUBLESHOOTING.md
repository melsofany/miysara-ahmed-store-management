# دليل حل المشاكل الشائعة

## المشاكل الشائعة والحلول

### 1. خطأ: "متغيرات البيئة مفقودة"

**الأعراض**:
- صفحة فارغة مع رسالة "متغيرات البيئة مفقودة"
- لا يمكن الاتصال بـ Supabase

**الأسباب المحتملة**:
- `VITE_SUPABASE_URL` غير محدد
- `VITE_SUPABASE_ANON_KEY` غير محدد
- القيم غير صحيحة أو ناقصة

**الحل**:
1. تأكد من وجود ملف `.env.development.local`:
   ```bash
   cp .env.example .env.development.local
   ```

2. أضف بيانات Supabase الصحيحة:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. أعد تشغيل الخادم:
   ```bash
   pnpm dev
   ```

### 2. خطأ: "Cannot find module 'react-router-dom'"

**الأعراض**:
- رسالة خطأ في console: `Cannot find module 'react-router-dom'`
- صفحة بيضاء فارغة

**الحل**:
1. تثبيت الاعتماديات مجددًا:
   ```bash
   pnpm install
   ```

2. حذف مجلد `node_modules`:
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

3. أعد تشغيل dev server

### 3. خطأ: "Failed to connect to Supabase"

**الأعراض**:
- رسالة خطأ: "Failed to fetch"
- لا يمكن تسجيل الدخول

**الأسباب المحتملة**:
- عنوان Supabase غير صحيح
- المفتاح الـ anon غير صحيح
- مشكلة في الاتصال بالإنترنت
- Supabase غير متصل

**الحل**:
1. تحقق من بيانات Supabase:
   - اذهب إلى [console.supabase.co](https://console.supabase.co)
   - اختر مشروعك
   - انقر على "Settings" ثم "API"
   - انسخ `Project URL` و `anon public key`

2. تأكد من أن القيم صحيحة في `.env.development.local`

3. تحقق من الاتصال بالإنترنت

4. تحقق من أن Supabase مشروع مفعل وليس معطل

### 4. خطأ: "Localhost:5173 refused to connect"

**الأعراض**:
- لا يمكن الوصول إلى http://localhost:5173
- رسالة "Connection refused"

**الحل**:
1. تأكد من تشغيل dev server:
   ```bash
   pnpm dev
   ```

2. تحقق من المنفذ 5173:
   ```bash
   lsof -i :5173  # macOS/Linux
   netstat -ano | findstr :5173  # Windows
   ```

3. إذا كان المنفذ مشغول، غيّر المنفذ في `vite.config.ts`

### 5. خطأ: "Build failed on Render"

**الأسباب المحتملة**:
- اعتماديات غير محدثة
- متغيرات البيئة غير محددة
- `package.json` غير صحيح

**الحل**:
1. تحديث `pnpm-lock.yaml` محليًا:
   ```bash
   pnpm install
   ```

2. تأكد من أن متغيرات البيئة مضافة في Render

3. ادفع التغييرات إلى GitHub:
   ```bash
   git add .
   git commit -m "إصلاح البناء"
   git push
   ```

4. أعد النشر على Render

### 6. الصفحة بطيئة أو تستغرق وقتًا طويلاً

**الأسباب المحتملة**:
- اتصال Supabase بطيء
- عدد كبير من الاستعلامات
- حجم الـ bundle كبير جدًا

**الحل**:
1. تحقق من سرعة الإنترنت

2. استخدم DevTools للتحقق من الاستعلامات البطيئة:
   ```bash
   # في المتصفح
   Open DevTools → Network tab
   ```

3. تحقق من أداء Supabase:
   - اذهب إلى Supabase Console
   - انقر على "Performance" tab

4. قلل عدد الاستعلامات بالمخزن المؤقت

### 7. عدم حفظ البيانات

**الأعراض**:
- البيانات لا تُحفظ بعد الإدخال
- عند تحديث الصفحة، تختفي البيانات

**الأسباب المحتملة**:
- الخطأ في الاتصال بـ Supabase
- صلاحيات RLS غير صحيحة
- اتصال الإنترنت منقطع

**الحل**:
1. تحقق من سجل الأخطاء في console:
   ```bash
   # اضغط F12 → Console tab
   ```

2. تحقق من صلاحيات RLS في Supabase:
   - اذهب إلى جدول البيانات
   - انقر على "RLS" icon
   - تأكد من الصلاحيات الصحيحة

3. تحقق من قيم الإدخال وأنها صحيحة

### 8. رسالة: "لا تملك صلاحية الوصول لهذه الصفحة"

**الأسباب المحتملة**:
- لم تتم إسناد دور (role) للمستخدم
- لم تتم إسناد الصلاحيات (permissions) المطلوبة

**الحل**:
1. سجل الدخول بحساب Super Admin

2. اذهب إلى صفحة "المستخدمون"

3. اختر المستخدم وأسند دورًا مناسبًا

4. أعد تسجيل الدخول

### 9. خطأ TypeScript

**الأعراض**:
- رسالة خطأ: "Type 'X' is not assignable to type 'Y'"

**الحل**:
1. تحقق من أنواع البيانات:
   ```bash
   pnpm typecheck
   ```

2. اقرأ الخطأ بعناية وصحح الملف

3. أعد تشغيل dev server

### 10. الملف index.html لم يُنشر على Render

**الأسباب المحتملة**:
- إعدادات `render.yaml` غير صحيحة
- مسار البناء غير صحيح

**الحل**:
1. تأكد من أن `staticPublishPath: ./dist` صحيح

2. تحقق من أن `buildCommand` ينتج مجلد `dist`:
   ```bash
   pnpm build
   ls -la dist/
   ```

3. أعد النشر

## نصائح عامة للتصحيح

### 1. استخدم Browser DevTools
```bash
# افتح Developer Tools
F12 أو Ctrl+Shift+I أو Cmd+Option+I

# تحقق من:
- Console tab للأخطاء
- Network tab للطلبات
- Application tab للـ storage
```

### 2. تحقق من السجلات
```bash
# محليًا
pnpm dev  # انظر إلى الأخطاء

# على Render
Dashboard → Logs tab
```

### 3. استخدم console.log للتصحيح
```typescript
console.log("[v0] Variable value:", variable);
console.log("[v0] API Response:", response);
```

### 4. امسح الـ cache والـ cookies
```bash
# في المتصفح
DevTools → Application → Storage → Clear all
```

## طلب المساعدة

إذا لم تتمكن من حل المشكلة:

1. تحقق من GitHub Issues
2. اسأل في المنتديات
3. فتح issue جديد مع:
   - وصف المشكلة
   - رسائل الأخطاء كاملة
   - خطوات إعادة الإنتاج

---

حظاً موفقاً! 🍀

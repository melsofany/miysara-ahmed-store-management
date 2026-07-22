# دليل المساهمة

شكراً لاهتمامك بالمساهمة في مشروع MIYSARA Ahmed! نرحب بجميع أنواع المساهمات.

## كيفية المساهمة

### 1. تحديد المشروع

```bash
git clone https://github.com/melsofany/miysara-ahmed-store-management.git
cd miysara-ahmed-store-management
```

### 2. إنشاء فرع جديد

```bash
git checkout -b feature/your-feature-name
# أو للإصلاحات
git checkout -b fix/bug-name
```

### 3. تثبيت الاعتماديات

```bash
pnpm install
```

### 4. إجراء التغييرات

اتبع معايير الكود:

- استخدم TypeScript الكامل (لا تستخدم `any`)
- أضف التعليقات للأكواد المعقدة
- اتبع نمط المشروع الحالي
- استخدم اسماء متغيرات واضحة وموصوفة

### 5. الاختبار المحلي

```bash
# تشغيل dev server
pnpm dev

# التحقق من الأخطاء
pnpm typecheck

# الفحص بـ ESLint
pnpm lint
```

### 6. الالتزام والدفع

```bash
# الالتزام بالتغييرات
git add .
git commit -m "feat: وصف الميزة الجديدة"
# أو
git commit -m "fix: وصف الإصلاح"

# الدفع إلى الفرع البعيد
git push origin feature/your-feature-name
```

### 7. فتح Pull Request

1. اذهب إلى [GitHub repository](https://github.com/melsofany/miysara-ahmed-store-management)
2. انقر على "New Pull Request"
3. اختر الفرع الخاص بك
4. املأ وصف PR

## معايير الالتزام

استخدم الصيغة التالية:

```
type(scope): subject

body

footer
```

### الأنواع:
- `feat`: ميزة جديدة
- `fix`: إصلاح خطأ
- `docs`: تحديث التوثيق
- `style`: تنسيق بدون تغيير الأكواد
- `refactor`: إعادة كتابة بدون تغيير الوظائف
- `perf`: تحسين الأداء
- `test`: إضافة أو تحديث الاختبارات
- `chore`: تحديثات الاعتماديات أو الإعدادات

### مثال:

```
feat(dashboard): إضافة رسم بياني للمبيعات الشهرية

- إضافة مكون ChartComponent
- تحديث Dashboard page
- إضافة الاستعلامات اللازمة

Closes #123
```

## معايير الكود

### 1. التنسيق

استخدم Prettier:

```bash
pnpm prettier --write "src/**/*.{ts,tsx}"
```

### 2. ESLint

```bash
pnpm lint
```

### 3. TypeScript

استخدم الأنواع الدقيقة:

```typescript
// ❌ تجنب
const data: any = response;

// ✅ استخدم
interface User {
  id: string;
  name: string;
}
const data: User = response;
```

### 4. التعليقات

```typescript
// ❌ تعليق غير مفيد
const result = x + y; // إضافة x و y

// ✅ تعليق مفيد
// حساب الإجمالي بناءً على الكمية والسعر
const result = quantity * price;
```

## هيكل المجلدات

```
src/
├── components/     # المكونات المشتركة
├── pages/          # الصفحات الرئيسية
├── lib/            # المكتبات والأدوات
│   ├── auth.tsx    # المصادقة
│   ├── supabase.ts # Supabase
│   ├── types.ts    # التعريفات
│   └── ...
└── index.css       # الأنماط العامة
```

## إضافة ميزة جديدة

### مثال: إضافة صفحة جديدة

1. أنشئ ملف جديد في `src/pages/NewPage.tsx`
2. أضف المسار في `src/App.tsx`
3. أضف عنصر التنقل في `src/components/AdminLayout.tsx`
4. اختبر محليًا
5. ادفع التغييرات

### مثال:

```typescript
// src/pages/NewPage.tsx
import { PageHeader } from '@/components/PageHeader';

export function NewPage() {
  return (
    <div>
      <PageHeader title="الصفحة الجديدة" icon={<Icon size={22} />} />
      {/* المحتوى */}
    </div>
  );
}
```

## إصلاح خطأ

1. ابحث عن Issue مفتوح
2. انفذ الإصلاح
3. أضف اختبارات إذا أمكن
4. افتح PR

## المراجعة والقبول

سيتم مراجعة PR من قِبل الفريق:

- التحقق من الكود والمعايير
- اختبار الوظائف
- التحقق من عدم وجود مشاكل أمان
- التعليقات والاقتراحات

## القوانين والسلوك الحسن

- احترم آراء الآخرين
- كن محترمًا وودودًا
- اتبع [Contributor Covenant](https://www.contributor-covenant.org/)

## الأسئلة والاستفسارات

- اسأل في GitHub Issues
- شارك أفكارك في Discussions
- تابع updates في README

---

شكراً لمساهمتك! 🙏

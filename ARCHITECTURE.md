# بنية المشروع

## نظرة عامة

نظام MIYSARA Ahmed مبني على عمارة حديثة وقابلة للتوسع:

- **الواجهة الأمامية**: React 18 + TypeScript + Tailwind CSS
- **الراوتنج**: React Router v7
- **قاعدة البيانات**: Supabase (PostgreSQL)
- **المصادقة**: Supabase Auth
- **البناء**: Vite
- **إدارة الحالة**: React Context + Hooks

## هيكل المشروع

```
miysara-ahmed-store-management/
├── src/
│   ├── components/           # مكونات React المشتركة
│   │   ├── AdminLayout.tsx   # تخطيط الإدارة الرئيسي
│   │   ├── Modal.tsx         # مكون النوافذ المنبثقة
│   │   ├── Form.tsx          # مكونات النماذج
│   │   ├── Toast.tsx         # إشعارات المستخدم
│   │   ├── PageHeader.tsx    # رأس الصفحة
│   │   ├── StatCard.tsx      # بطاقات الإحصائيات
│   │   ├── ProtectedRoute.tsx# المسارات المحمية
│   │   └── ...
│   ├── pages/                # صفحات التطبيق
│   │   ├── AuthPage.tsx      # صفحة تسجيل الدخول
│   │   ├── DashboardPage.tsx # لوحة التحكم
│   │   ├── ProductsPage.tsx  # المنتجات
│   │   ├── PosPage.tsx       # واجهة الكاشير
│   │   ├── InvoicesPage.tsx  # الفواتير
│   │   ├── InventoryPage.tsx # المخزون
│   │   └── ...
│   ├── lib/                  # المكتبات والأدوات
│   │   ├── auth.tsx          # نظام المصادقة والسياق
│   │   ├── supabase.ts       # إعداد Supabase
│   │   ├── types.ts          # تعريفات TypeScript
│   │   ├── catalog.ts        # التصنيفات والموردين
│   │   ├── format.ts         # صيغ التنسيق
│   │   └── reporting.ts      # التقارير والإحصائيات
│   ├── App.tsx               # المكون الرئيسي
│   ├── main.tsx              # نقطة الدخول
│   └── index.css             # الأنماط العامة
├── public/                   # الملفات الثابتة
├── vite.config.ts            # إعدادات Vite
├── tailwind.config.js        # إعدادات Tailwind
├── tsconfig.json             # إعدادات TypeScript
├── package.json              # الاعتماديات والإعدادات
├── render.yaml               # إعدادات النشر على Render
└── README.md                 # الوثائق

```

## تدفق البيانات

```
┌─────────────────────────────────────────────────────────────┐
│                         المتصفح                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    React Application                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            AdminLayout / Pages                       │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │           Components (Modal, Form, etc)        │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                               │
│                              ▼                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │      Context (Auth, State Management)               │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │  useAuth(), useCan(), useCatalog()             │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                               │
│                              ▼                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │        Supabase Client (supabase.ts)                │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │  Authentication, Database Queries              │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase (Backend)                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            PostgreSQL Database                      │  │
│  │  • Profiles    • Products    • Invoices            │  │
│  │  • Categories  • Warehouses  • Inventory           │  │
│  │  • POS         • Users       • Audit Logs          │  │
│  │  • Shifts      • Returns     • Reports             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## المصادقة والتخويل

### تدفق المصادقة

```
┌──────────────┐
│   المستخدم  │ ─── البريد + كلمة المرور
└──────────────┘
       │
       ▼
┌─────────────────────────────┐
│   Supabase Auth             │
│ ├─ التحقق من البيانات     │
│ ├─ إنشاء جلسة             │
│ └─ إصدار JWT Token        │
└─────────────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│   AuthProvider Context      │
│ ├─ تخزين Session           │
│ ├─ تحميل Profile           │
│ ├─ تحميل Role              │
│ └─ تحميل Permissions       │
└─────────────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│   ProtectedRoute             │
│ ├─ التحقق من Session        │
│ ├─ التحقق من الصلاحيات    │
│ └─ السماح/رفض الوصول     │
└──────────────────────────────┘
```

### أنماط الأدوار

```
Super Admin
└── جميع الصلاحيات

System Manager
├── إدارة المستخدمين
├── إدارة الأدوار
└── الإعدادات

Warehouse Manager
├── إدارة المخزون
├── تسجيل الحركات
└── التقارير

Warehouse User
├── عرض المخزون
└── تسجيل الحركات

POS Manager
├── إدارة نقاط البيع
├── تقارير POS
└── إدارة الشفتات

Cashier
└── استخدام POS فقط
```

## إدارة الحالة

### استخدام Context

```typescript
// AuthContext - المصادقة والمستخدم
const { session, profile, role, permissions } = useAuth();

// useCan - التحقق من الصلاحيات
const { can, isSuperAdmin } = useCan();

// useCatalog - التصنيفات والموردين
const { categories, suppliers, manufacturers } = useCatalog();
```

## قاعدة البيانات

### الجداول الرئيسية

```sql
-- المستخدمون والأدوار
profiles          -- بيانات المستخدم
roles             -- الأدوار (Super Admin, Manager, etc)
permissions       -- الصلاحيات
role_permissions  -- ربط الأدوار بالصلاحيات

-- المنتجات والمخزون
products          -- المنتجات الرئيسية
product_variants  -- متغيرات المنتجات
categories        -- التصنيفات
suppliers         -- الموردين
manufacturers     -- الشركات المصنعة
sizes             -- الأحجام
colors            -- الألوان
seasons           -- المواسم

-- المخازن والمخزون
warehouses        -- المخازن
warehouse_stock   -- المخزون في كل مخزن
stock_movements   -- حركات المخزون

-- المبيعات والفواتير
pos_locations     -- نقاط البيع
invoices          -- الفواتير
invoice_items     -- بنود الفاتورة
returns           -- المرتجعات

-- الشفتات والدرج
cash_shifts       -- شفتات الكاشير
cash_drawer       -- درج الكاشير
cash_movements    -- حركات النقود

-- التدقيق
audit_logs        -- سجلات التدقيق (كل العمليات)
```

## معايير الترميز

### تسمية الملفات

- **المكونات**: PascalCase (`MyComponent.tsx`)
- **الملفات العادية**: camelCase (`myFile.ts`)
- **المجلدات**: kebab-case (`my-folder`)

### تسمية المتغيرات

```typescript
// المتغيرات: camelCase
const userName = 'Ahmed';

// الثوابت: UPPER_SNAKE_CASE
const MAX_ITEMS = 100;

// الأنواع: PascalCase
interface User {
  id: string;
}
```

### هيكل المكون

```typescript
// 1. Imports
import { useState } from 'react';
import { useAuth } from '@/lib/auth';

// 2. Types
interface Props {
  title: string;
}

// 3. Component
export function MyComponent({ title }: Props) {
  // Hooks
  const { user } = useAuth();

  // State
  const [count, setCount] = useState(0);

  // Effects
  useEffect(() => {
    // ...
  }, []);

  // Handlers
  const handleClick = () => {
    // ...
  };

  // Render
  return <div>{title}</div>;
}
```

## الأداء والتحسينات

### تقسيم الكود

```
dist/
├── vendor-*.js       # React, ReactDOM, Router
├── supabase-*.js     # Supabase client
├── icons-*.js        # Lucide icons
└── index-*.js        # تطبيقك الرئيسي
```

### الحمل البطيء

```typescript
// استخدام React.lazy للصفحات
const LazyPage = React.lazy(() => import('./pages/LazyPage'));
```

## الأمان

### أفضل الممارسات

1. **عدم تخزين الأسرار**: لا تضع مفاتيح في الكود
2. **استخدام متغيرات البيئة**: VITE_* فقط
3. **التحقق من الصلاحيات**: دائماً تحقق من `can()` قبل السماح بالعملية
4. **RLS**: استخدم Row Level Security في Supabase
5. **HTTPS**: استخدم HTTPS دائماً في الإنتاج

## الاختبار

### اختبار محلي

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Building
pnpm build
```

---

للمزيد من المعلومات، راجع README.md و CONTRIBUTING.md

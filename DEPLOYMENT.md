# نشر التطبيق على Render

## المعمارية

```
Render Web Service (Node.js)
├── Express API  →  /api/*
│   ├── /api/auth/login   — تسجيل الدخول (JWT)
│   ├── /api/auth/signup  — إنشاء حساب
│   ├── /api/auth/me      — بيانات المستخدم الحالي
│   ├── /api/query        — استعلامات قراءة عامة
│   └── /api/mutate       — عمليات كتابة/حذف/تحديث
└── React SPA   →  /*      (ملفات dist/)
```

## خطوات النشر

### 1. قاعدة البيانات (Render PostgreSQL)
تأكد أن قاعدة البيانات `miysara-ahmed-db` مُنشأة على Render.

نفّذ migrations SQL يدوياً عبر Render Shell أو psql:
```bash
psql "$DATABASE_URL" -f supabase/migrations/20260722171700_0001_foundation_auth_roles.sql
psql "$DATABASE_URL" -f supabase/migrations/20260722171732_0002_catalog_reference.sql
psql "$DATABASE_URL" -f supabase/migrations/20260722171734_0003_locations.sql
psql "$DATABASE_URL" -f supabase/migrations/20260722171806_0004_products_inventory.sql
psql "$DATABASE_URL" -f supabase/migrations/20260722171852_0005_sales_returns_shifts_audit.sql
```

### 2. Web Service على Render
- **Build Command:** `npm install --include=dev && npm run build && cd server && npm install`
- **Start Command:** `node server/index.js`
- **Environment:** Node

### 3. متغيرات البيئة (Environment Variables)
أضفها في Render Dashboard → Service → Environment:

| المتغير | القيمة |
|---------|--------|
| `DATABASE_URL` | Internal Database URL من صفحة قاعدة البيانات |
| `JWT_SECRET` | أي نص عشوائي طويل (أو اجعل Render يولّده تلقائياً) |
| `NODE_ENV` | `production` |

### 4. إنشاء أول مستخدم (Super Admin)
بعد النشر، سجّل حساباً عبر صفحة التسجيل في التطبيق.
ثم عدّل الدور يدوياً في قاعدة البيانات:

```sql
UPDATE profiles
SET role_id = (SELECT id FROM roles WHERE key = 'super_admin')
WHERE email = 'your@email.com';
```

## ملاحظة
- لا يوجد Supabase في هذا الإصدار — كل شيء يعمل عبر Express + Render PostgreSQL.
- JWT صالح لـ 7 أيام، يُخزَّن في localStorage.

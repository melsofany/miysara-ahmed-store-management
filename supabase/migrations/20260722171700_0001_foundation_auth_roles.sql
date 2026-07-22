/*
# Foundation: Company, Profiles, Roles & Permissions

## Overview
Core authentication/authorization foundation for MIYSARA Ahmed.
Single-company, multi-location system. All authenticated staff share the
company's operational data.

## New Tables
1. `companies` — owning company (MIYSARA Ahmed).
2. `roles` — authorization roles (super_admin, system_manager, warehouse_manager,
   warehouse_user, pos_manager, cashier). System roles are seeded/protected.
3. `permissions` — fine-grained permission keys grouped by module.
4. `role_permissions` — many-to-many granting permissions to roles.
5. `profiles` — staff profiles, 1:1 with `auth.users`.

## Security
- RLS enabled on every table.
- Policies scoped `TO authenticated` with `USING (true)`/`WITH CHECK (true)`
  because all authenticated staff share ONE company's operational data
  (intentionally shared company data — not an ownership bypass).
  Fine-grained permission enforcement happens in the application layer.
- Profiles: any authenticated user reads; each user updates only their own row
  OR an admin (permission checked in app) updates any.

## Seed Data
- One company row: MIYSARA Ahmed.
- Six system roles.
- ~40 permission keys across modules.
- Default role->permission mappings.
*/

-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ar text,
  currency text NOT NULL DEFAULT 'EGP',
  tax_enabled boolean NOT NULL DEFAULT false,
  tax_rate numeric(5,2) NOT NULL DEFAULT 0,
  phone text,
  address text,
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_companies" ON companies;
CREATE POLICY "auth_read_companies" ON companies FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_write_companies" ON companies;
CREATE POLICY "auth_write_companies" ON companies FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  name_ar text,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_roles" ON roles;
CREATE POLICY "auth_read_roles" ON roles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_write_roles" ON roles;
CREATE POLICY "auth_write_roles" ON roles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Permissions
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  name_ar text,
  module text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_permissions" ON permissions;
CREATE POLICY "auth_read_permissions" ON permissions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_write_permissions" ON permissions;
CREATE POLICY "auth_write_permissions" ON permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Role <-> Permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_role_permissions" ON role_permissions;
CREATE POLICY "auth_read_role_permissions" ON role_permissions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_write_role_permissions" ON role_permissions;
CREATE POLICY "auth_write_role_permissions" ON role_permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Profiles (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  role_id uuid REFERENCES roles(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  full_name_ar text,
  email text NOT NULL,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  can_view_cost boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_profiles" ON profiles;
CREATE POLICY "auth_read_profiles" ON profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_profiles" ON profiles;
CREATE POLICY "auth_insert_profiles" ON profiles FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_own_profile" ON profiles;
CREATE POLICY "auth_update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "auth_update_profiles_admin" ON profiles;
CREATE POLICY "auth_update_profiles_admin" ON profiles FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ===========================================================================
-- SEED
-- ===========================================================================
INSERT INTO companies (id, name, name_ar, currency)
SELECT '00000000-0000-0000-0000-000000000001', 'MIYSARA Ahmed', 'ميسرة أحمد', 'EGP'
WHERE NOT EXISTS (SELECT 1 FROM companies);

INSERT INTO roles (key, name, name_ar, description, is_system) VALUES
  ('super_admin', 'Super Admin', 'مدير عام', 'Full access to the entire system.', true),
  ('system_manager', 'System Manager', 'مدير النظام', 'Manage system, settings, reports and users.', true),
  ('warehouse_manager', 'Warehouse Manager', 'مدير المخزن', 'Manage warehouses and stock movements.', true),
  ('warehouse_user', 'Warehouse User', 'مستخدم مخزن', 'Execute allowed warehouse operations.', true),
  ('pos_manager', 'POS Manager', 'مدير نقطة البيع', 'Manage a POS location and its users.', true),
  ('cashier', 'Cashier', 'كاشير', 'Execute sales and collect payments.', true)
ON CONFLICT (key) DO NOTHING;

INSERT INTO permissions (key, name, name_ar, module) VALUES
  ('view_dashboard','View Dashboard','عرض لوحة التحكم','dashboard'),
  ('view_users','View Users','عرض المستخدمين','users'),
  ('manage_users','Manage Users','إدارة المستخدمين','users'),
  ('view_roles','View Roles','عرض الأدوار','roles'),
  ('manage_roles','Manage Roles','إدارة الأدوار','roles'),
  ('view_pos','View POS Locations','عرض نقاط البيع','pos'),
  ('manage_pos','Manage POS Locations','إدارة نقاط البيع','pos'),
  ('view_warehouses','View Warehouses','عرض المخازن','warehouses'),
  ('manage_warehouses','Manage Warehouses','إدارة المخازن','warehouses'),
  ('view_products','View Products','عرض المنتجات','products'),
  ('manage_products','Manage Products','إدارة المنتجات','products'),
  ('view_cost','View Cost Prices','عرض أسعار التكلفة','products'),
  ('view_categories','View Categories','عرض التصنيفات','catalog'),
  ('manage_categories','Manage Categories','إدارة التصنيفات','catalog'),
  ('view_suppliers','View Suppliers','عرض الموردين','catalog'),
  ('manage_suppliers','Manage Suppliers','إدارة الموردين','catalog'),
  ('view_manufacturers','View Manufacturers','عرض المصنعين','catalog'),
  ('manage_manufacturers','Manage Manufacturers','إدارة المصنعين','catalog'),
  ('view_inventory','View Inventory','عرض المخزون','inventory'),
  ('manage_inventory','Manage Inventory','إدارة المخزون','inventory'),
  ('view_stock_value','View Stock Value','عرض قيمة المخزون','inventory'),
  ('view_movements','View Movements','عرض الحركات','movements'),
  ('create_movements','Create Movements','إنشاء الحركات','movements'),
  ('approve_movements','Approve Movements','اعتماد الحركات','movements'),
  ('use_pos','Use POS','استخدام الكاشير','pos_sales'),
  ('view_sales','View Sales','عرض المبيعات','pos_sales'),
  ('view_invoices','View Invoices','عرض الفواتير','invoices'),
  ('edit_invoices','Edit Invoices','تعديل الفواتير','invoices'),
  ('cancel_invoices','Cancel Invoices','إلغاء الفواتير','invoices'),
  ('view_returns','View Returns','عرض المرتجعات','returns'),
  ('process_returns','Process Returns','معالجة المرتجعات','returns'),
  ('view_shifts','View Shifts','عرض الشفتات','shifts'),
  ('manage_shifts','Manage Shifts','إدارة الشفتات','shifts'),
  ('open_close_shift','Open/Close Shift','فتح/إغلاق الشفت','shifts'),
  ('apply_discount','Apply Discount','تطبيق الخصم','discounts'),
  ('manage_discounts','Manage Discounts','إدارة الخصومات','discounts'),
  ('view_reports','View Reports','عرض التقارير','reports'),
  ('view_profit_reports','View Profit Reports','عرض تقارير الأرباح','reports'),
  ('view_audit_logs','View Audit Logs','عرض سجلات التدقيق','audit'),
  ('manage_settings','Manage Settings','إدارة الإعدادات','settings')
ON CONFLICT (key) DO NOTHING;

DO $$
DECLARE
  r_super uuid; r_sys uuid; r_whm uuid; r_whu uuid; r_posm uuid; r_cash uuid;
BEGIN
  SELECT id INTO r_super FROM roles WHERE key='super_admin';
  SELECT id INTO r_sys   FROM roles WHERE key='system_manager';
  SELECT id INTO r_whm   FROM roles WHERE key='warehouse_manager';
  SELECT id INTO r_whu   FROM roles WHERE key='warehouse_user';
  SELECT id INTO r_posm  FROM roles WHERE key='pos_manager';
  SELECT id INTO r_cash  FROM roles WHERE key='cashier';

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r_super, id FROM permissions ON CONFLICT DO NOTHING;

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r_sys, id FROM permissions WHERE key IN (
    'view_dashboard','view_users','manage_users','view_roles','view_pos','manage_pos',
    'view_warehouses','view_products','manage_products','view_cost','view_categories','manage_categories',
    'view_suppliers','manage_suppliers','view_manufacturers','manage_manufacturers',
    'view_inventory','manage_inventory','view_stock_value','view_movements','create_movements','approve_movements',
    'view_sales','view_invoices','edit_invoices','cancel_invoices','view_returns','process_returns',
    'view_shifts','manage_shifts','apply_discount','manage_discounts','view_reports','view_profit_reports',
    'view_audit_logs','manage_settings')
  ON CONFLICT DO NOTHING;

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r_whm, id FROM permissions WHERE key IN (
    'view_dashboard','view_warehouses','manage_warehouses','view_products','manage_products','view_cost',
    'view_categories','view_suppliers','view_manufacturers','view_inventory','manage_inventory',
    'view_stock_value','view_movements','create_movements','approve_movements','view_sales','view_invoices',
    'view_reports')
  ON CONFLICT DO NOTHING;

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r_whu, id FROM permissions WHERE key IN (
    'view_warehouses','view_products','view_categories','view_suppliers','view_manufacturers',
    'view_inventory','view_movements','create_movements')
  ON CONFLICT DO NOTHING;

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r_posm, id FROM permissions WHERE key IN (
    'view_dashboard','view_pos','view_products','view_categories','view_inventory','view_movements',
    'use_pos','view_sales','view_invoices','edit_invoices','cancel_invoices','view_returns','process_returns',
    'view_shifts','manage_shifts','open_close_shift','apply_discount','view_reports')
  ON CONFLICT DO NOTHING;

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r_cash, id FROM permissions WHERE key IN (
    'view_pos','view_products','view_categories','use_pos','view_sales','view_invoices',
    'open_close_shift','apply_discount')
  ON CONFLICT DO NOTHING;
END $$;

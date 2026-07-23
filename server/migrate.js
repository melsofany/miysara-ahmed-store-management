/**
 * Runs all schema migrations on startup.
 * Idempotent — uses IF NOT EXISTS everywhere.
 * Works on plain PostgreSQL (Render, Neon, etc.) — no Supabase-specific RLS.
 */
import { pool } from './db.js';

export async function runMigrations() {
  const client = await pool.connect();
  try {
    // ── 0001 foundation ────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL, name_ar text,
        currency text NOT NULL DEFAULT 'EGP',
        tax_enabled boolean NOT NULL DEFAULT false,
        tax_rate numeric(5,2) NOT NULL DEFAULT 0,
        phone text, address text, logo_url text,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS roles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        key text UNIQUE NOT NULL, name text NOT NULL,
        name_ar text, description text,
        is_system boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS permissions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        key text UNIQUE NOT NULL, name text NOT NULL,
        name_ar text, module text NOT NULL, description text,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS profiles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
        role_id uuid REFERENCES roles(id) ON DELETE SET NULL,
        full_name text NOT NULL, full_name_ar text,
        email text UNIQUE NOT NULL, phone text,
        is_active boolean NOT NULL DEFAULT true,
        can_view_cost boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (role_id, permission_id)
      );
    `);

    // ── 0002 catalog ───────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL, name_ar text,
        parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS suppliers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL, name_ar text,
        phone text, email text, address text,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS manufacturers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL, name_ar text, country text,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS seasons (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL, name_ar text,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS sizes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL, name_ar text,
        category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
        sort_order int NOT NULL DEFAULT 0,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS colors (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL, name_ar text, hex_code text,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // ── 0003 locations ─────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS warehouses (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
        name text NOT NULL, name_ar text,
        code text UNIQUE NOT NULL,
        address text, phone text,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS pos_locations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
        warehouse_id uuid REFERENCES warehouses(id) ON DELETE SET NULL,
        name text NOT NULL, name_ar text,
        code text UNIQUE NOT NULL,
        allow_sell_out_of_stock boolean NOT NULL DEFAULT false,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS user_pos_locations (
        user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        pos_location_id uuid NOT NULL REFERENCES pos_locations(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, pos_location_id)
      );
      CREATE TABLE IF NOT EXISTS user_warehouses (
        user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        warehouse_id uuid NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, warehouse_id)
      );
    `);

    // ── 0004 products & inventory ──────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        sku text UNIQUE NOT NULL, barcode text,
        name text NOT NULL, name_ar text, description text,
        category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
        season_id uuid REFERENCES seasons(id) ON DELETE SET NULL,
        supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
        manufacturer_id uuid REFERENCES manufacturers(id) ON DELETE SET NULL,
        model_number text, unit text NOT NULL DEFAULT 'piece', image_url text,
        default_selling_price numeric(12,2) NOT NULL DEFAULT 0,
        min_stock_level int NOT NULL DEFAULT 0,
        has_variants boolean NOT NULL DEFAULT false,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS product_variants (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        size_id uuid REFERENCES sizes(id) ON DELETE SET NULL,
        color_id uuid REFERENCES colors(id) ON DELETE SET NULL,
        barcode text, sku text,
        cost_price numeric(12,2) NOT NULL DEFAULT 0,
        selling_price numeric(12,2) NOT NULL DEFAULT 0,
        last_cost_price numeric(12,2) NOT NULL DEFAULT 0,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
      CREATE INDEX IF NOT EXISTS idx_variants_barcode  ON product_variants(barcode);
      CREATE TABLE IF NOT EXISTS inventory (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        product_variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
        location_id uuid NOT NULL,
        location_type text NOT NULL CHECK (location_type IN ('warehouse','pos')),
        quantity int NOT NULL DEFAULT 0,
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (product_variant_id, location_id, location_type)
      );
      CREATE INDEX IF NOT EXISTS idx_inventory_variant  ON inventory(product_variant_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory(location_id, location_type);
      CREATE TABLE IF NOT EXISTS stock_movements (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        movement_type text NOT NULL CHECK (movement_type IN (
          'stock_in','issue_to_pos','transfer_wh','transfer_to_pos','pos_receive',
          'return_to_wh','adjustment','sale','sale_return')),
        product_variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
        from_location_id uuid,
        from_location_type text CHECK (from_location_type IS NULL OR from_location_type IN ('warehouse','pos')),
        to_location_id uuid,
        to_location_type text CHECK (to_location_type IS NULL OR to_location_type IN ('warehouse','pos')),
        quantity int NOT NULL,
        unit_cost_price numeric(12,2) NOT NULL DEFAULT 0,
        document_ref text, notes text,
        user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_movements_variant ON stock_movements(product_variant_id);
      CREATE INDEX IF NOT EXISTS idx_movements_created ON stock_movements(created_at);
    `);

    // ── 0005 sales / shifts / audit ────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS cash_shifts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        pos_location_id uuid NOT NULL REFERENCES pos_locations(id) ON DELETE RESTRICT,
        user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
        shift_number text NOT NULL,
        opening_cash numeric(12,2) NOT NULL DEFAULT 0,
        cash_sales numeric(12,2) NOT NULL DEFAULT 0,
        card_sales numeric(12,2) NOT NULL DEFAULT 0,
        e_payment_sales numeric(12,2) NOT NULL DEFAULT 0,
        cash_refunds numeric(12,2) NOT NULL DEFAULT 0,
        cash_expenses numeric(12,2) NOT NULL DEFAULT 0,
        expected_cash numeric(12,2) NOT NULL DEFAULT 0,
        actual_cash numeric(12,2),
        difference numeric(12,2) NOT NULL DEFAULT 0,
        status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
        opened_at timestamptz NOT NULL DEFAULT now(),
        closed_at timestamptz, notes text
      );
      CREATE INDEX IF NOT EXISTS idx_shifts_pos    ON cash_shifts(pos_location_id);
      CREATE INDEX IF NOT EXISTS idx_shifts_user   ON cash_shifts(user_id);
      CREATE INDEX IF NOT EXISTS idx_shifts_status ON cash_shifts(status);
      CREATE TABLE IF NOT EXISTS invoices (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_number text UNIQUE NOT NULL,
        pos_location_id uuid NOT NULL REFERENCES pos_locations(id) ON DELETE RESTRICT,
        cashier_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
        shift_id uuid REFERENCES cash_shifts(id) ON DELETE SET NULL,
        subtotal numeric(12,2) NOT NULL DEFAULT 0,
        discount_amount numeric(12,2) NOT NULL DEFAULT 0,
        tax_amount numeric(12,2) NOT NULL DEFAULT 0,
        total numeric(12,2) NOT NULL DEFAULT 0,
        paid_amount numeric(12,2) NOT NULL DEFAULT 0,
        change_amount numeric(12,2) NOT NULL DEFAULT 0,
        status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','paid','cancelled','partially_returned','returned')),
        note text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_invoices_pos     ON invoices(pos_location_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_cashier ON invoices(cashier_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_created ON invoices(created_at);
      CREATE INDEX IF NOT EXISTS idx_invoices_status  ON invoices(status);
      CREATE TABLE IF NOT EXISTS invoice_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        product_variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
        product_name text NOT NULL,
        quantity int NOT NULL,
        unit_price numeric(12,2) NOT NULL,
        unit_cost_price numeric(12,2) NOT NULL,
        discount_amount numeric(12,2) NOT NULL DEFAULT 0,
        line_total numeric(12,2) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_items_invoice ON invoice_items(invoice_id);
      CREATE INDEX IF NOT EXISTS idx_items_variant ON invoice_items(product_variant_id);
      CREATE TABLE IF NOT EXISTS payments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        method text NOT NULL CHECK (method IN ('cash','card','bank','e_wallet')),
        amount numeric(12,2) NOT NULL, reference text,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
      CREATE TABLE IF NOT EXISTS invoice_returns (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        return_number text UNIQUE NOT NULL,
        original_invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
        pos_location_id uuid NOT NULL REFERENCES pos_locations(id) ON DELETE RESTRICT,
        user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
        type text NOT NULL CHECK (type IN ('full','partial')),
        total numeric(12,2) NOT NULL DEFAULT 0, reason text,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_returns_invoice ON invoice_returns(original_invoice_id);
      CREATE TABLE IF NOT EXISTS invoice_return_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        return_id uuid NOT NULL REFERENCES invoice_returns(id) ON DELETE CASCADE,
        invoice_item_id uuid NOT NULL REFERENCES invoice_items(id) ON DELETE RESTRICT,
        product_variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
        quantity int NOT NULL,
        unit_price numeric(12,2) NOT NULL,
        refund_amount numeric(12,2) NOT NULL
      );
      CREATE TABLE IF NOT EXISTS audit_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
        action text NOT NULL, entity text NOT NULL, entity_id uuid,
        old_values jsonb, new_values jsonb, reason text,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_audit_entity  ON audit_logs(entity, entity_id);
      CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
    `);

    // ── auth_credentials (replaces Supabase auth.users) ───────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS auth_credentials (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text UNIQUE NOT NULL,
        password_hash text NOT NULL,
        profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // ── seed data ──────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO companies (name, name_ar, currency)
        VALUES ('MIYSARA Ahmed','ميسرة أحمد','EGP') ON CONFLICT DO NOTHING;
      INSERT INTO seasons (name, name_ar) VALUES
        ('Summer','صيفي'),('Winter','شتوي'),('All Seasons','جميع المواسم')
        ON CONFLICT DO NOTHING;
      INSERT INTO categories (name, name_ar) VALUES
        ('Newborn','ملابس مواليد'),('Kids','ملابس أطفال'),
        ('Underwear','ملابس داخلية'),('Men','رجالي'),
        ('Women','حريمي'),('Sports','رياضي'),
        ('Shoes','أحذية'),('Accessories','إكسسوارات')
        ON CONFLICT DO NOTHING;
      INSERT INTO roles (key, name, name_ar, is_system) VALUES
        ('super_admin','Super Admin','مدير عام',true),
        ('system_manager','System Manager','مدير النظام',true),
        ('warehouse_manager','Warehouse Manager','مدير مخزن',true),
        ('warehouse_user','Warehouse User','مستخدم مخزن',true),
        ('pos_manager','POS Manager','مدير نقطة بيع',true),
        ('cashier','Cashier','كاشير',true)
        ON CONFLICT (key) DO NOTHING;
    `);

    // seed permissions
    const perms = [
      ['view_dashboard','Dashboard','لوحة التحكم','dashboard'],
      ['view_users','View Users','عرض المستخدمين','users'],
      ['manage_users','Manage Users','إدارة المستخدمين','users'],
      ['view_roles','View Roles','عرض الأدوار','roles'],
      ['manage_roles','Manage Roles','إدارة الأدوار','roles'],
      ['view_pos','View POS','عرض نقاط البيع','pos'],
      ['manage_pos','Manage POS','إدارة نقاط البيع','pos'],
      ['use_pos','Use POS','استخدام نقطة البيع','pos'],
      ['view_warehouses','View Warehouses','عرض المخازن','inventory'],
      ['manage_warehouses','Manage Warehouses','إدارة المخازن','inventory'],
      ['view_products','View Products','عرض المنتجات','products'],
      ['manage_products','Manage Products','إدارة المنتجات','products'],
      ['view_cost','View Cost','عرض التكلفة','products'],
      ['view_categories','View Categories','عرض التصنيفات','catalog'],
      ['manage_categories','Manage Categories','إدارة التصنيفات','catalog'],
      ['view_suppliers','View Suppliers','عرض الموردين','catalog'],
      ['manage_suppliers','Manage Suppliers','إدارة الموردين','catalog'],
      ['view_manufacturers','View Manufacturers','عرض الشركات المصنعة','catalog'],
      ['manage_manufacturers','Manage Manufacturers','إدارة الشركات المصنعة','catalog'],
      ['view_inventory','View Inventory','عرض المخزون','inventory'],
      ['manage_inventory','Manage Inventory','إدارة المخزون','inventory'],
      ['view_stock_value','View Stock Value','عرض قيمة المخزون','inventory'],
      ['view_movements','View Movements','عرض الحركات','inventory'],
      ['create_movements','Create Movements','إنشاء حركات','inventory'],
      ['approve_movements','Approve Movements','اعتماد الحركات','inventory'],
      ['view_sales','View Sales','عرض المبيعات','sales'],
      ['view_invoices','View Invoices','عرض الفواتير','sales'],
      ['edit_invoices','Edit Invoices','تعديل الفواتير','sales'],
      ['cancel_invoices','Cancel Invoices','إلغاء الفواتير','sales'],
      ['view_returns','View Returns','عرض المرتجعات','sales'],
      ['process_returns','Process Returns','معالجة المرتجعات','sales'],
      ['view_shifts','View Shifts','عرض الشفتات','shifts'],
      ['manage_shifts','Manage Shifts','إدارة الشفتات','shifts'],
      ['open_close_shift','Open/Close Shift','فتح/إغلاق الشفت','shifts'],
      ['apply_discount','Apply Discount','تطبيق خصم','sales'],
      ['manage_discounts','Manage Discounts','إدارة الخصومات','sales'],
      ['view_reports','View Reports','عرض التقارير','reports'],
      ['view_profit_reports','View Profit Reports','عرض تقارير الربح','reports'],
      ['view_audit_logs','View Audit Logs','عرض سجل التدقيق','audit'],
      ['manage_settings','Manage Settings','إدارة الإعدادات','settings'],
    ];
    for (const [key, name, name_ar, module] of perms) {
      await client.query(
        `INSERT INTO permissions (key,name,name_ar,module) VALUES ($1,$2,$3,$4) ON CONFLICT (key) DO NOTHING`,
        [key, name, name_ar, module]
      );
    }
    // super_admin gets everything
    await client.query(`
      INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM roles r, permissions p
        WHERE r.key = 'super_admin' ON CONFLICT DO NOTHING;
    `);
    // other roles
    const grants = {
      system_manager: [
        'view_dashboard','view_users','manage_users','view_roles','view_pos','manage_pos',
        'view_warehouses','view_products','manage_products','view_cost','view_categories','manage_categories',
        'view_suppliers','manage_suppliers','view_manufacturers','manage_manufacturers',
        'view_inventory','manage_inventory','view_stock_value','view_movements','create_movements','approve_movements',
        'view_sales','view_invoices','edit_invoices','cancel_invoices','view_returns','process_returns',
        'view_shifts','manage_shifts','apply_discount','manage_discounts','view_reports','view_profit_reports',
        'view_audit_logs','manage_settings',
      ],
      warehouse_manager: [
        'view_dashboard','view_warehouses','manage_warehouses','view_products','manage_products','view_cost',
        'view_categories','view_suppliers','view_manufacturers','view_inventory','manage_inventory',
        'view_stock_value','view_movements','create_movements','approve_movements','view_sales','view_invoices','view_reports',
      ],
      warehouse_user: ['view_warehouses','view_products','view_categories','view_suppliers','view_manufacturers','view_inventory','view_movements','create_movements'],
      pos_manager: [
        'view_dashboard','view_pos','view_products','view_categories','view_inventory','view_movements',
        'use_pos','view_sales','view_invoices','edit_invoices','cancel_invoices','view_returns','process_returns',
        'view_shifts','manage_shifts','open_close_shift','apply_discount','view_reports',
      ],
      cashier: ['view_pos','view_products','view_categories','use_pos','view_sales','view_invoices','open_close_shift','apply_discount'],
    };
    for (const [roleKey, permKeys] of Object.entries(grants)) {
      await client.query(
        `INSERT INTO role_permissions (role_id, permission_id)
           SELECT r.id, p.id FROM roles r, permissions p
           WHERE r.key=$1 AND p.key=ANY($2::text[]) ON CONFLICT DO NOTHING`,
        [roleKey, permKeys]
      );
    }

    console.log('✅ All migrations applied.');
  } finally {
    client.release();
  }
}

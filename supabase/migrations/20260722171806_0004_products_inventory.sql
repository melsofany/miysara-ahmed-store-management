/*
# Products, Variants & Inventory

## Overview
Products with optional variants (size/color combos). Inventory is tracked per
variant per location (warehouse or POS), and every quantity change flows through
`stock_movements` (never a direct column edit).

## New Tables
1. `products` — product master record (SKU, barcode, category, season, supplier,
   manufacturer, model number, default selling price, reorder point).
2. `product_variants` — size/color combination of a product. Each variant has its
   own barcode and the cost price captured at the moment stock entered the
   warehouse (kept for profit calc).
3. `inventory` — on-hand quantity per variant per location. `location_type`
   distinguishes warehouse vs POS.
4. `stock_movements` — immutable audit of every quantity change: type, source,
   destination, qty, unit cost, document ref, user, notes.

## Key rules enforced
- Unique barcode across products AND variants (precondition checks in app).
- Cost price stored at stock-entry time on the movement AND carried on the
  variant's `last_cost_price` for profit calc; never overwritten.
- `inventory` rows are never updated directly by quantity; they change via
  movements (app layer enforces). The DB keeps a running `quantity` for fast reads.

## Security
RLS enabled, `TO authenticated` shared-data policies.
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE NOT NULL,
  barcode text,
  name text NOT NULL,
  name_ar text,
  description text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  season_id uuid REFERENCES seasons(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  manufacturer_id uuid REFERENCES manufacturers(id) ON DELETE SET NULL,
  model_number text,
  unit text NOT NULL DEFAULT 'piece',
  image_url text,
  default_selling_price numeric(12,2) NOT NULL DEFAULT 0,
  min_stock_level int NOT NULL DEFAULT 0,
  has_variants boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_rw_products" ON products;
CREATE POLICY "auth_rw_products" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size_id uuid REFERENCES sizes(id) ON DELETE SET NULL,
  color_id uuid REFERENCES colors(id) ON DELETE SET NULL,
  barcode text,
  sku text,
  cost_price numeric(12,2) NOT NULL DEFAULT 0,
  selling_price numeric(12,2) NOT NULL DEFAULT 0,
  last_cost_price numeric(12,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_rw_product_variants" ON product_variants;
CREATE POLICY "auth_rw_product_variants" ON product_variants FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_barcode ON product_variants(barcode);

CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  location_id uuid NOT NULL,
  location_type text NOT NULL CHECK (location_type IN ('warehouse','pos')),
  quantity int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_variant_id, location_id, location_type)
);
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_rw_inventory" ON inventory;
CREATE POLICY "auth_rw_inventory" ON inventory FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_inventory_variant ON inventory(product_variant_id);
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
  document_ref text,
  notes text,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_rw_stock_movements" ON stock_movements;
CREATE POLICY "auth_rw_stock_movements" ON stock_movements FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_movements_variant ON stock_movements(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_movements_created ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_movements_type ON stock_movements(movement_type);

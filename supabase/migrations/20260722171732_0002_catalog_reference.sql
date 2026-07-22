/*
# Catalog: Categories, Suppliers, Manufacturers, Seasons, Sizes, Colors

## Overview
Reference/catalog tables for clothing products. All shared company data.

## New Tables
1. `categories` — product categories (e.g. ملابس مواليد, ملابس أطفال, رجالي, حرمي).
2. `suppliers` — suppliers/vendors.
3. `manufacturers` — brands/factories.
4. `seasons` — product seasons (صيفي, شتوي, جميع المواسم).
5. `sizes` — sizes (e.g. 6 سنوات, S, M, L, 42).
6. `colors` — colors.

## Security
RLS enabled, `TO authenticated` shared-data policies (USING/WITH CHECK true).

## Seed
Default seasons and a few sample categories.
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ar text,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_rw_categories" ON categories;
CREATE POLICY "auth_rw_categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ar text,
  phone text,
  email text,
  address text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_rw_suppliers" ON suppliers;
CREATE POLICY "auth_rw_suppliers" ON suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS manufacturers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ar text,
  country text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE manufacturers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_rw_manufacturers" ON manufacturers;
CREATE POLICY "auth_rw_manufacturers" ON manufacturers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ar text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_rw_seasons" ON seasons;
CREATE POLICY "auth_rw_seasons" ON seasons FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ar text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE sizes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_rw_sizes" ON sizes;
CREATE POLICY "auth_rw_sizes" ON sizes FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ar text,
  hex_code text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE colors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_rw_colors" ON colors;
CREATE POLICY "auth_rw_colors" ON colors FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed seasons
INSERT INTO seasons (name, name_ar) VALUES
  ('Summer','صيفي'), ('Winter','شتوي'), ('All Seasons','جميع المواسم')
ON CONFLICT DO NOTHING;

-- Seed categories (sample)
INSERT INTO categories (name, name_ar) VALUES
  ('Newborn','ملابس مواليد'),
  ('Kids','ملابس أطفال'),
  ('Underwear','ملابس داخلية'),
  ('Men','رجالي'),
  ('Women','حريمي'),
  ('Sports','رياضي'),
  ('Shoes','أحذية'),
  ('Accessories','إكسسوارات')
ON CONFLICT DO NOTHING;

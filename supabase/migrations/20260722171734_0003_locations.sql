/*
# Locations: Warehouses, POS Locations, user-assignment link tables

## Overview
Multi-location structure: warehouses and POS (cashier) locations, plus which
users are allowed to work at each.

## New Tables
1. `warehouses` — central/storage warehouses (source of cost & initial stock).
2. `pos_locations` — points of sale (cashier stations), each linked to a warehouse.
3. `user_pos_locations` — which POS a user may work at.
4. `user_warehouses` — which warehouses a user may manage.

## Security
RLS enabled, `TO authenticated` shared-data policies.
*/

CREATE TABLE IF NOT EXISTS warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  name text NOT NULL,
  name_ar text,
  code text UNIQUE NOT NULL,
  address text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_rw_warehouses" ON warehouses;
CREATE POLICY "auth_rw_warehouses" ON warehouses FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS pos_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  warehouse_id uuid REFERENCES warehouses(id) ON DELETE SET NULL,
  name text NOT NULL,
  name_ar text,
  code text UNIQUE NOT NULL,
  allow_sell_out_of_stock boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE pos_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_rw_pos_locations" ON pos_locations;
CREATE POLICY "auth_rw_pos_locations" ON pos_locations FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS user_pos_locations (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pos_location_id uuid NOT NULL REFERENCES pos_locations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, pos_location_id)
);
ALTER TABLE user_pos_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_rw_user_pos" ON user_pos_locations;
CREATE POLICY "auth_rw_user_pos" ON user_pos_locations FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS user_warehouses (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  warehouse_id uuid NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, warehouse_id)
);
ALTER TABLE user_warehouses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_rw_user_warehouses" ON user_warehouses;
CREATE POLICY "auth_rw_user_warehouses" ON user_warehouses FOR ALL TO authenticated USING (true) WITH CHECK (true);

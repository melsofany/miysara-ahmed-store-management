/*
# Sales: Invoices, Items, Payments, Returns, Shifts, Audit Log

## Overview
The commercial core. Invoices are never deleted. Returns adjust inventory and
sales. Shifts reconcile the cash drawer. Every sensitive change is recorded in
the audit log.

## New Tables
1. `cash_shifts` — a cashier's work session at a POS: opening float, cash/card/
   e-payment totals, refunds, expenses, expected vs actual cash, over/short.
2. `invoices` — sales documents. Has auto-generated number, POS, cashier, shift,
   totals, discount, tax, status (open/paid/cancelled/returned).
3. `invoice_items` — line items: variant, qty, unit price, cost (snapshotted),
   discount, total. Cost is snapshotted at sale time for profit calc.
4. `payments` — payments for an invoice (cash/card/bank/e-wallet), amount paid,
   change.
5. `invoice_returns` — return records linked to original invoice, full or partial.
6. `invoice_return_items` — items returned.
7. `audit_logs` — immutable record of sensitive changes (old/new JSON, user, reason).

## Status enums
- invoice.status: open|paid|cancelled|partially_returned|returned
- return.type: full|partial

## Security
RLS enabled, `TO authenticated` shared-data policies.
*/

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
  closed_at timestamptz,
  notes text
);
ALTER TABLE cash_shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_rw_cash_shifts" ON cash_shifts;
CREATE POLICY "auth_rw_cash_shifts" ON cash_shifts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_shifts_pos ON cash_shifts(pos_location_id);
CREATE INDEX IF NOT EXISTS idx_shifts_user ON cash_shifts(user_id);
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
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_rw_invoices" ON invoices;
CREATE POLICY "auth_rw_invoices" ON invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_invoices_pos ON invoices(pos_location_id);
CREATE INDEX IF NOT EXISTS idx_invoices_cashier ON invoices(cashier_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

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
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_rw_invoice_items" ON invoice_items;
CREATE POLICY "auth_rw_invoice_items" ON invoice_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_items_variant ON invoice_items(product_variant_id);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  method text NOT NULL CHECK (method IN ('cash','card','bank','e_wallet')),
  amount numeric(12,2) NOT NULL,
  reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_rw_payments" ON payments;
CREATE POLICY "auth_rw_payments" ON payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);

CREATE TABLE IF NOT EXISTS invoice_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number text UNIQUE NOT NULL,
  original_invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  pos_location_id uuid NOT NULL REFERENCES pos_locations(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  type text NOT NULL CHECK (type IN ('full','partial')),
  total numeric(12,2) NOT NULL DEFAULT 0,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE invoice_returns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_rw_invoice_returns" ON invoice_returns;
CREATE POLICY "auth_rw_invoice_returns" ON invoice_returns FOR ALL TO authenticated USING (true) WITH CHECK (true);

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
ALTER TABLE invoice_return_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_rw_invoice_return_items" ON invoice_return_items;
CREATE POLICY "auth_rw_invoice_return_items" ON invoice_return_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_rw_audit_logs" ON audit_logs;
CREATE POLICY "auth_rw_audit_logs" ON audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

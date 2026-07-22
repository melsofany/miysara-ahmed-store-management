export type RoleKey =
  | 'super_admin'
  | 'system_manager'
  | 'warehouse_manager'
  | 'warehouse_user'
  | 'pos_manager'
  | 'cashier';

export interface Company {
  id: string;
  name: string;
  name_ar: string | null;
  currency: string;
  tax_enabled: boolean;
  tax_rate: number;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  is_active: boolean;
}

export interface Role {
  id: string;
  key: RoleKey;
  name: string;
  name_ar: string | null;
  description: string | null;
  is_system: boolean;
}

export interface Permission {
  id: string;
  key: string;
  name: string;
  name_ar: string | null;
  module: string;
}

export interface Profile {
  id: string;
  company_id: string | null;
  role_id: string | null;
  role?: Role;
  full_name: string;
  full_name_ar: string | null;
  email: string;
  phone: string | null;
  is_active: boolean;
  can_view_cost: boolean;
}

export interface Category {
  id: string;
  name: string;
  name_ar: string | null;
  parent_id: string | null;
  is_active: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  name_ar: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean;
}

export interface Manufacturer {
  id: string;
  name: string;
  name_ar: string | null;
  country: string | null;
  is_active: boolean;
}

export interface Season {
  id: string;
  name: string;
  name_ar: string | null;
  is_active: boolean;
}

export interface Size {
  id: string;
  name: string;
  name_ar: string | null;
  category_id: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Color {
  id: string;
  name: string;
  name_ar: string | null;
  hex_code: string | null;
  is_active: boolean;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  name_ar: string | null;
  description: string | null;
  category_id: string | null;
  category?: Category;
  season_id: string | null;
  season?: Season;
  supplier_id: string | null;
  supplier?: Supplier;
  manufacturer_id: string | null;
  manufacturer?: Manufacturer;
  model_number: string | null;
  unit: string;
  image_url: string | null;
  default_selling_price: number;
  min_stock_level: number;
  has_variants: boolean;
  is_active: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  product?: Product;
  size_id: string | null;
  size?: Size;
  color_id: string | null;
  color?: Color;
  barcode: string | null;
  sku: string | null;
  cost_price: number;
  selling_price: number;
  last_cost_price: number;
  is_active: boolean;
}

export type LocationType = 'warehouse' | 'pos';

export interface Inventory {
  id: string;
  product_variant_id: string;
  location_id: string;
  location_type: LocationType;
  quantity: number;
  updated_at: string;
}

export type MovementType =
  | 'stock_in'
  | 'issue_to_pos'
  | 'transfer_wh'
  | 'transfer_to_pos'
  | 'pos_receive'
  | 'return_to_wh'
  | 'adjustment'
  | 'sale'
  | 'sale_return';

export interface StockMovement {
  id: string;
  movement_type: MovementType;
  product_variant_id: string;
  product_variant?: ProductVariant;
  from_location_id: string | null;
  from_location_type: LocationType | null;
  to_location_id: string | null;
  to_location_type: LocationType | null;
  quantity: number;
  unit_cost_price: number;
  document_ref: string | null;
  notes: string | null;
  user_id: string | null;
  created_at: string;
}

export interface Warehouse {
  id: string;
  company_id: string | null;
  name: string;
  name_ar: string | null;
  code: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
}

export interface PosLocation {
  id: string;
  company_id: string | null;
  warehouse_id: string | null;
  warehouse?: Warehouse;
  name: string;
  name_ar: string | null;
  code: string;
  allow_sell_out_of_stock: boolean;
  is_active: boolean;
}

export type PaymentMethod = 'cash' | 'card' | 'bank' | 'e_wallet';

export interface Invoice {
  id: string;
  invoice_number: string;
  pos_location_id: string;
  pos_location?: PosLocation;
  cashier_id: string;
  cashier?: Profile;
  shift_id: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  paid_amount: number;
  change_amount: number;
  status: 'open' | 'paid' | 'cancelled' | 'partially_returned' | 'returned';
  note: string | null;
  created_at: string;
  updated_at: string;
  invoice_items?: InvoiceItem[];
  payments?: Payment[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_variant_id: string;
  product_variant?: ProductVariant;
  product_name: string;
  quantity: number;
  unit_price: number;
  unit_cost_price: number;
  discount_amount: number;
  line_total: number;
}

export interface Payment {
  id: string;
  invoice_id: string;
  method: PaymentMethod;
  amount: number;
  reference: string | null;
  created_at: string;
}

export interface CashShift {
  id: string;
  pos_location_id: string;
  pos_location?: PosLocation;
  user_id: string;
  user?: Profile;
  shift_number: string;
  opening_cash: number;
  cash_sales: number;
  card_sales: number;
  e_payment_sales: number;
  cash_refunds: number;
  cash_expenses: number;
  expected_cash: number;
  actual_cash: number | null;
  difference: number;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at: string | null;
  notes: string | null;
}

export interface InvoiceReturn {
  id: string;
  return_number: string;
  original_invoice_id: string;
  original_invoice?: Invoice;
  pos_location_id: string;
  user_id: string;
  user?: Profile;
  type: 'full' | 'partial';
  total: number;
  reason: string | null;
  created_at: string;
  invoice_return_items?: InvoiceReturnItem[];
}

export interface InvoiceReturnItem {
  id: string;
  return_id: string;
  invoice_item_id: string;
  invoice_item?: InvoiceItem;
  product_variant_id: string;
  quantity: number;
  unit_price: number;
  refund_amount: number;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user?: Profile;
  action: string;
  entity: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  reason: string | null;
  created_at: string;
}

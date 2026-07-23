import { supabase } from './supabase';

export interface DateRange {
  from: string;
  to: string;
}

export function rangePreset(preset: string): DateRange {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  switch (preset) {
    case 'today': {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { from: start.toISOString(), to: end.toISOString() };
    }
    case 'yesterday': {
      const start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const yEnd = new Date(start);
      yEnd.setHours(23, 59, 59, 999);
      return { from: start.toISOString(), to: yEnd.toISOString() };
    }
    case 'week': {
      const start = new Date(now);
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);
      return { from: start.toISOString(), to: end.toISOString() };
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: start.toISOString(), to: end.toISOString() };
    }
    default:
      return { from: '2000-01-01', to: end.toISOString() };
  }
}

export interface DashboardMetrics {
  totalSales: number;
  invoiceCount: number;
  avgInvoice: number;
  totalReturns: number;
  totalDiscount: number;
  estimatedProfit: number;
  stockCostValue: number;
  stockSellValue: number;
  posBreakdown: { posId: string; posName: string; total: number; count: number }[];
  topProducts: { name: string; qty: number; total: number }[];
  lowProducts: { name: string; qty: number }[];
  categorySales: { name: string; total: number }[];
  userSales: { name: string; total: number; count: number }[];
}

export async function fetchDashboard(
  range: DateRange,
  posId?: string
): Promise<DashboardMetrics> {
  const empty: DashboardMetrics = {
    totalSales: 0,
    invoiceCount: 0,
    avgInvoice: 0,
    totalReturns: 0,
    totalDiscount: 0,
    estimatedProfit: 0,
    stockCostValue: 0,
    stockSellValue: 0,
    posBreakdown: [],
    topProducts: [],
    lowProducts: [],
    categorySales: [],
    userSales: [],
  };

  let posQuery = supabase
    .from('invoices')
    .select('id, pos_location_id, cashier_id, total, discount_amount, status, created_at')
    .gte('created_at', range.from)
    .lte('created_at', range.to)
    .in('status', ['paid', 'partially_returned']);
  if (posId) posQuery = posQuery.eq('pos_location_id', posId);
  const { data: invoices } = await posQuery;

  let itemsQuery = supabase
    .from('invoice_items')
    .select('product_variant_id, product_name, quantity, unit_price, unit_cost_price, line_total, invoice_id')
    .in('invoice_id', (invoices ?? []).map((i) => i.id));
  const { data: items } = await itemsQuery;

  let returnsQuery = supabase
    .from('invoice_returns')
    .select('total, created_at')
    .gte('created_at', range.from)
    .lte('created_at', range.to);
  if (posId) returnsQuery = returnsQuery.eq('pos_location_id', posId);
  const { data: returns } = await returnsQuery;

  const { data: inventory } = await supabase
    .from('inventory')
    .select('quantity, product_variant_id');
  const variantIds = [...new Set((inventory ?? []).map((i) => i.product_variant_id))];
  const { data: variants } = await supabase
    .from('product_variants')
    .select('id, selling_price, last_cost_price, product_id, product:products(name, name_ar, category_id, category:categories(name, name_ar))')
    .in('id', variantIds.length ? variantIds : ['00000000-0000-0000-0000-000000000000']);

  const { data: posLocations } = await supabase.from('pos_locations').select('id, name, name_ar');
  const { data: profiles } = await supabase.from('profiles').select('id, full_name');
  const { data: categories } = await supabase.from('categories').select('id, name, name_ar');

  // totals
  const totalSales = (invoices ?? []).reduce((s, i) => s + Number(i.total), 0);
  const invoiceCount = invoices?.length ?? 0;
  const avgInvoice = invoiceCount ? totalSales / invoiceCount : 0;
  const totalReturns = (returns ?? []).reduce((s, r) => s + Number(r.total), 0);
  const totalDiscount = (invoices ?? []).reduce((s, i) => s + Number(i.discount_amount), 0);

  // profit
  const itemsList = items ?? [];
  const estimatedProfit = itemsList.reduce(
    (s, it) => s + (Number(it.unit_price) - Number(it.unit_cost_price)) * Number(it.quantity),
    0
  );

  // stock value
  const variantMap = new Map((variants ?? []).map((v) => [v.id, v]));
  let stockCostValue = 0;
  let stockSellValue = 0;
  const qtyByVariant = new Map<string, number>();
  (inventory ?? []).forEach((inv) => {
    const v = variantMap.get(inv.product_variant_id);
    if (!v) return;
    const qty = Number(inv.quantity);
    stockCostValue += qty * Number(v.last_cost_price);
    stockSellValue += qty * Number(v.selling_price);
    qtyByVariant.set(inv.product_variant_id, (qtyByVariant.get(inv.product_variant_id) ?? 0) + qty);
  });

  // pos breakdown
  const posMap = new Map((posLocations ?? []).map((p) => [p.id, p]));
  const posAgg = new Map<string, { total: number; count: number }>();
  (invoices ?? []).forEach((inv) => {
    const cur = posAgg.get(inv.pos_location_id) ?? { total: 0, count: 0 };
    cur.total += Number(inv.total);
    cur.count += 1;
    posAgg.set(inv.pos_location_id, cur);
  });
  const posBreakdown = Array.from(posAgg.entries()).map(([id, v]) => ({
    posId: id,
    posName: posMap.get(id)?.name_ar ?? posMap.get(id)?.name ?? '—',
    total: v.total,
    count: v.count,
  }));

  // top products
  const prodAgg = new Map<string, { name: string; qty: number; total: number }>();
  itemsList.forEach((it) => {
    const cur = prodAgg.get(it.product_variant_id) ?? { name: it.product_name, qty: 0, total: 0 };
    cur.qty += Number(it.quantity);
    cur.total += Number(it.line_total);
    prodAgg.set(it.product_variant_id, cur);
  });
  const topProducts = Array.from(prodAgg.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // category sales
  const catMap = new Map((categories ?? []).map((c) => [c.id, c]));
  const catAgg = new Map<string, number>();
  itemsList.forEach((it) => {
    const v = variantMap.get(it.product_variant_id);
    // @ts-expect-error nested join typing
    const catId = v?.product?.category_id;
    if (!catId) return;
    catAgg.set(catId, (catAgg.get(catId) ?? 0) + Number(it.line_total));
  });
  const categorySales = Array.from(catAgg.entries()).map(([id, total]) => ({
    name: catMap.get(id)?.name_ar ?? catMap.get(id)?.name ?? '—',
    total,
  }));

  // user sales
  const profMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const userAgg = new Map<string, { total: number; count: number }>();
  (invoices ?? []).forEach((inv) => {
    const cur = userAgg.get(inv.cashier_id) ?? { total: 0, count: 0 };
    cur.total += Number(inv.total);
    cur.count += 1;
    userAgg.set(inv.cashier_id, cur);
  });
  const userSales = Array.from(userAgg.entries()).map(([id, v]) => ({
    name: profMap.get(id)?.full_name ?? '—',
    total: v.total,
    count: v.count,
  }));

  // low stock (below min) - requires products
  const { data: allProducts } = await supabase
    .from('products')
    .select('id, name, name_ar, min_stock_level');
  const totalQtyByProduct = new Map<string, number>();
  (variants ?? []).forEach((v) => {
    const pid = v.product_id;
    const q = qtyByVariant.get(v.id) ?? 0;
    totalQtyByProduct.set(pid, (totalQtyByProduct.get(pid) ?? 0) + q);
  });
  const lowProducts = (allProducts ?? [])
    .filter((p) => (totalQtyByProduct.get(p.id) ?? 0) <= Number(p.min_stock_level))
    .map((p) => ({
      name: p.name_ar ?? p.name,
      qty: totalQtyByProduct.get(p.id) ?? 0,
    }))
    .slice(0, 5);

  return {
    totalSales,
    invoiceCount,
    avgInvoice,
    totalReturns,
    totalDiscount,
    estimatedProfit,
    stockCostValue,
    stockSellValue,
    posBreakdown,
    topProducts,
    lowProducts,
    categorySales,
    userSales,
  };
}

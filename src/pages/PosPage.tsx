import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  X,
  Printer,
  Loader2,
  Store,
  ScanLine,
  Banknote,
  CreditCard,
  Wallet,
  ArrowLeft,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Modal } from '@/components/Modal';
import { toast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import { useAuth, useCan } from '@/lib/auth';
import { useCatalog, categoryName, seasonName, sizeName, colorName } from '@/lib/catalog';
import { formatCurrency } from '@/lib/format';
import type { PosLocation, ProductVariant, Product, CashShift, PaymentMethod } from '@/lib/types';

interface CartItem {
  variantId: string;
  productId: string;
  name: string;
  barcode: string;
  price: number;
  cost: number;
  qty: number;
  sizeName: string;
  colorName: string;
}

interface ProductSearchResult {
  variant: ProductVariant;
  product: Product;
  qty: number;
  selected: boolean;
}

export function PosPage() {
  const { profile, signOut } = useAuth();
  const { can } = useCan();
  const canApplyDiscount = can('apply_discount');
  const navigate = useNavigate();
  const cat = useCatalog();

  const [posList, setPosList] = useState<PosLocation[]>([]);
  const [activePos, setActivePos] = useState<PosLocation | null>(null);
  const [activeShift, setActiveShift] = useState<CashShift | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ category: '', season: '', size: '', supplier: '' });
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showShift, setShowShift] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const barcodeRef = useRef<HTMLInputElement>(null);

  // Load POS locations for this user
  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: links } = await supabase
        .from('user_pos_locations')
        .select('pos_location_id, pos:pos_locations(*)')
        .eq('user_id', profile.id);
      const posIds = (links ?? []).map((l: any) => l.pos_location_id);
      if (posIds.length === 0) {
        // fallback: all active POS
        const { data: allPos } = await supabase.from('pos_locations').select('*').eq('is_active', true);
        setPosList((allPos as PosLocation[]) ?? []);
      } else {
        setPosList((links as any)?.map((l: any) => l.pos).filter(Boolean) ?? []);
      }
    })();
  }, [profile]);

  // Check for open shift when POS selected
  const checkShift = useCallback(async (posId: string) => {
    const { data } = await supabase
      .from('cash_shifts')
      .select('*')
      .eq('pos_location_id', posId)
      .eq('user_id', profile?.id)
      .eq('status', 'open')
      .maybeSingle();
    setActiveShift((data as CashShift) ?? null);
    setShowShift(!data);
  }, [profile]);

  useEffect(() => {
    if (activePos) checkShift(activePos.id);
  }, [activePos, checkShift]);

  // Search products
  useEffect(() => {
    if (!activePos) return;
    setLoadingSearch(true);
    const t = setTimeout(async () => {
      let q = supabase
        .from('product_variants')
        .select('*, product:products(*)')
        .eq('is_active', true)
        .limit(60);

      if (search) {
        q = q.or(`barcode.ilike.%${search}%,sku.ilike.%${search}%`);
      }
      const { data } = await q;
      let list = (data as (ProductVariant & { product: Product })[]) ?? [];

      // Apply product-level filters
      if (filters.category || filters.season || filters.supplier) {
        list = list.filter((v) => {
          const p = v.product;
          if (filters.category && p.category_id !== filters.category) return false;
          if (filters.season && p.season_id !== filters.season) return false;
          if (filters.supplier && p.supplier_id !== filters.supplier) return false;
          return true;
        });
      }
      if (filters.size) {
        list = list.filter((v) => v.size_id === filters.size);
      }

      // Also search by product name if no barcode match
      // (Two-step query: PostgREST does not support .ilike() on joined columns via the JS client)
      if (search && list.length === 0) {
        const { data: matchingProducts } = await supabase
          .from('products')
          .select('id')
          .or(`name.ilike.%${search}%,name_ar.ilike.%${search}%`)
          .eq('is_active', true)
          .limit(30);
        if (matchingProducts && matchingProducts.length > 0) {
          const productIds = (matchingProducts as { id: string }[]).map((p) => p.id);
          const { data: byName } = await supabase
            .from('product_variants')
            .select('*, product:products(*)')
            .in('product_id', productIds)
            .eq('is_active', true)
            .limit(60);
          list = (byName as (ProductVariant & { product: Product })[]) ?? [];
        }
      }

      // Get inventory for this POS
      const { data: inv } = await supabase
        .from('inventory')
        .select('product_variant_id, quantity')
        .eq('location_id', activePos.id)
        .eq('location_type', 'pos');
      const invMap = new Map((inv ?? []).map((i) => [i.product_variant_id, i.quantity]));

      setResults(
        list.map((v) => ({
          variant: v,
          product: v.product,
          qty: invMap.get(v.id) ?? 0,
          selected: false,
        }))
      );
      setLoadingSearch(false);
    }, 200);
    return () => clearTimeout(t);
  }, [search, filters, activePos]);

  // Barcode scanner: if exact barcode match, add to cart directly
  function handleBarcodeEnter(e: React.KeyboardEvent) {
    if (e.key !== 'Enter' || !search) return;
    const exact = results.find((r) => r.variant.barcode === search.trim());
    if (exact) {
      addToCart(exact.variant, exact.product);
      setSearch('');
    } else if (results.length === 1) {
      addToCart(results[0].variant, results[0].product);
      setSearch('');
    }
  }

  function addToCart(variant: ProductVariant, product: Product) {
    if (!activePos?.allow_sell_out_of_stock) {
      const inCart = cart.find((c) => c.variantId === variant.id);
      const r = results.find((x) => x.variant.id === variant.id);
      if (r && inCart && inCart.qty + 1 > r.qty) {
        toast('الكمية غير متوفرة في المخزون', 'error');
        return;
      }
      if (r && r.qty <= 0) {
        toast('المنتج غير متوفر في المخزون', 'error');
        return;
      }
    }
    setCart((c) => {
      const existing = c.find((i) => i.variantId === variant.id);
      if (existing) return c.map((i) => (i.variantId === variant.id ? { ...i, qty: i.qty + 1 } : i));
      return [
        ...c,
        {
          variantId: variant.id,
          productId: product.id,
          name: product.name_ar ?? product.name,
          barcode: variant.barcode ?? '',
          price: Number(variant.selling_price) || Number(product.default_selling_price),
          cost: Number(variant.last_cost_price),
          qty: 1,
          sizeName: sizeName(variant.size_id, cat.sizes),
          colorName: colorName(variant.color_id, cat.colors),
        },
      ];
    });
  }

  function updateQty(variantId: string, delta: number) {
    setCart((c) =>
      c.map((i) => {
        if (i.variantId !== variantId) return i;
        const newQty = i.qty + delta;
        if (newQty <= 0) return i;
        return { ...i, qty: newQty };
      })
    );
  }

  function setQty(variantId: string, qty: number) {
    setCart((c) => c.map((i) => (i.variantId === variantId ? { ...i, qty: Math.max(1, qty) } : i)));
  }

  function removeItem(variantId: string) {
    setCart((c) => c.filter((i) => i.variantId !== variantId));
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = Math.min(globalDiscount, subtotal);
  const total = subtotal - discount;

  // Bulk add selected items
  function bulkAdd() {
    results.filter((r) => r.selected).forEach((r) => addToCart(r.variant, r.product));
    setResults((r) => r.map((x) => ({ ...x, selected: false })));
  }

  function toggleSelect(variantId: string) {
    setResults((r) => r.map((x) => (x.variant.id === variantId ? { ...x, selected: !x.selected } : x)));
  }

  function setBulkQty(variantId: string, qty: number) {
    setResults((r) => r.map((x) => (x.variant.id === variantId ? { ...x, qty: Math.max(1, qty) } : x)));
  }

  async function openShift(openingCash: number) {
    if (!activePos || !profile) return;
    const shiftNumber = `SHIFT-${Date.now()}`;
    const { data, error } = await supabase
      .from('cash_shifts')
      .insert({
        pos_location_id: activePos.id,
        user_id: profile.id,
        shift_number: shiftNumber,
        opening_cash: openingCash,
        status: 'open',
      })
      .select()
      .single();
    if (error) { toast(error.message, 'error'); return; }
    setActiveShift(data as CashShift);
    setShowShift(false);
    toast('تم فتح الشفت');
  }

  async function completeSale(method: PaymentMethod, paidAmount: number) {
    if (!activePos || !profile || cart.length === 0) return;
    const change = Math.max(0, paidAmount - total);
    const invoiceNumber = `INV-${Date.now()}`;
    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        pos_location_id: activePos.id,
        cashier_id: profile.id,
        shift_id: activeShift?.id ?? null,
        subtotal,
        discount_amount: discount,
        tax_amount: 0,
        total,
        paid_amount: paidAmount,
        change_amount: change,
        status: 'paid',
      })
      .select()
      .single();
    if (invErr) { toast(invErr.message, 'error'); return; }

    const items = cart.map((i) => ({
      invoice_id: invoice.id,
      product_variant_id: i.variantId,
      product_name: i.name,
      quantity: i.qty,
      unit_price: i.price,
      unit_cost_price: i.cost,
      discount_amount: 0,
      line_total: i.price * i.qty,
    }));
    await supabase.from('invoice_items').insert(items);
    await supabase.from('payments').insert({
      invoice_id: invoice.id,
      method,
      amount: total,
    });

    // Record stock movements + update inventory
    for (const i of cart) {
      await supabase.from('stock_movements').insert({
        movement_type: 'sale',
        product_variant_id: i.variantId,
        from_location_id: activePos.id,
        from_location_type: 'pos',
        quantity: i.qty,
        unit_cost_price: i.cost,
        document_ref: invoiceNumber,
        user_id: profile.id,
      });
      // Upsert inventory: deduct sold qty, or create row at 0 if missing
      const { data: inv } = await supabase
        .from('inventory')
        .select('id, quantity')
        .eq('product_variant_id', i.variantId)
        .eq('location_id', activePos.id)
        .eq('location_type', 'pos')
        .maybeSingle();
      const newQty = Math.max(0, ((inv as any)?.quantity ?? 0) - i.qty);
      if (inv) {
        await supabase
          .from('inventory')
          .update({ quantity: newQty, updated_at: new Date().toISOString() })
          .eq('id', (inv as any).id);
      } else {
        // No inventory row yet — create one at 0 (item sold from untracked stock)
        await supabase.from('inventory').insert({
          product_variant_id: i.variantId,
          location_id: activePos.id,
          location_type: 'pos',
          quantity: 0,
        });
      }
    }

    // Update shift totals — also update local state so subsequent sales in the
    // same shift use the correct running totals (not stale initial values).
    if (activeShift) {
      const newCashSales = method === 'cash' ? Number(activeShift.cash_sales) + total : Number(activeShift.cash_sales);
      const newCardSales = method === 'card' ? Number(activeShift.card_sales) + total : Number(activeShift.card_sales);
      // bank transfers (تحويل) are tracked alongside e-wallet as electronic non-cash payments
      const newEPaySales = (method === 'e_wallet' || method === 'bank') ? Number(activeShift.e_payment_sales) + total : Number(activeShift.e_payment_sales);
      const newExpectedCash = Number(activeShift.opening_cash) + newCashSales - Number(activeShift.cash_refunds) - Number(activeShift.cash_expenses);
      const updates: Partial<CashShift> = {
        cash_sales: newCashSales,
        card_sales: newCardSales,
        e_payment_sales: newEPaySales,
        expected_cash: newExpectedCash,
      };
      await supabase.from('cash_shifts').update(updates).eq('id', activeShift.id);
      // Mirror the new totals in local state so the next sale computes correctly
      setActiveShift({ ...activeShift, ...updates });
    }

    setLastInvoice({ ...invoice, items: cart, change, method });
    setShowReceipt(true);
    setCart([]);
    setGlobalDiscount(0);
    setShowCheckout(false);
    toast('تم إتمام البيع بنجاح');
  }

  // Select POS first
  if (!activePos) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-6">
        <div className="mb-8"><Logo size={48} /></div>
        <div className="mi-card w-full max-w-md p-6">
          <h2 className="mb-1 text-xl font-bold text-slate-800">اختر نقطة البيع</h2>
          <p className="mb-4 text-sm text-slate-500">اختر نقطة البيع التي ستعمل عليها</p>
          {posList.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">لا توجد نقاط بيع مخصصة لك. تواصل مع المدير.</p>
          ) : (
            <div className="space-y-2">
              {posList.map((p) => (
                <button key={p.id} onClick={() => setActivePos(p)} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-4 text-right hover:border-teal-600 hover:bg-teal-50">
                  <Store size={22} className="text-teal-600" />
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{p.name_ar ?? p.name}</p>
                    <p className="text-xs text-slate-400">كود: {p.code}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          <button onClick={async () => { await signOut(); navigate('/login'); }} className="mi-btn-ghost mt-4 w-full">
            <ArrowLeft size={16} /> رجوع
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      {/* POS Header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setActivePos(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <ArrowLeft size={20} />
          </button>
          <Logo size={36} variant="compact" />
          <div className="h-8 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <Store size={18} className="text-teal-600" />
            <span className="font-bold text-slate-700">{activePos.name_ar ?? activePos.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`mi-badge ${activeShift ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
            {activeShift ? `شفت مفتوح: ${activeShift.shift_number}` : 'لا يوجد شفت'}
          </span>
          <span className="text-sm font-semibold text-slate-600">{profile?.full_name}</span>
        </div>
      </header>

      {/* Main body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Product search & results */}
        <div className="flex flex-1 flex-col overflow-hidden p-4">
          {/* Search bar with barcode */}
          <div className="relative mb-3">
            <ScanLine size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-600" />
            <input
              ref={barcodeRef}
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleBarcodeEnter}
              placeholder="امسح الباركود أو ابحث بالاسم، SKU، الباركود..."
              className="mi-input pr-11 text-base"
              dir="ltr"
            />
          </div>

          {/* Filters */}
          <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
            <select value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="">كل التصنيفات</option>
              {cat.categories.map((c) => <option key={c.id} value={c.id}>{c.name_ar ?? c.name}</option>)}
            </select>
            <select value={filters.season} onChange={(e) => setFilters((f) => ({ ...f, season: e.target.value }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="">كل المواسم</option>
              {cat.seasons.map((s) => <option key={s.id} value={s.id}>{s.name_ar ?? s.name}</option>)}
            </select>
            <select value={filters.size} onChange={(e) => setFilters((f) => ({ ...f, size: e.target.value }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="">كل المقاسات</option>
              {cat.sizes.map((s) => <option key={s.id} value={s.id}>{s.name_ar ?? s.name}</option>)}
            </select>
            <select value={filters.supplier} onChange={(e) => setFilters((f) => ({ ...f, supplier: e.target.value }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="">كل الموردين</option>
              {cat.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Results grid */}
          <div className="flex-1 overflow-y-auto">
            {loadingSearch ? (
              <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-teal-600" /></div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Search size={40} />
                <p className="mt-3 text-sm">ابحث عن منتجات أو امسح الباركود</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {results.map((r) => (
                  <div
                    key={r.variant.id}
                    className={`mi-card flex flex-col p-3 transition ${r.selected ? 'ring-2 ring-teal-600' : 'hover:shadow-md'}`}
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                        {r.product.image_url ? <img src={r.product.image_url} alt="" className="h-full w-full object-cover" /> : <Tag size={20} className="text-slate-300" />}
                      </div>
                      {r.qty > 0 ? (
                        <span className="mi-badge bg-green-50 text-green-600">{r.qty} متوفر</span>
                      ) : (
                        <span className="mi-badge bg-red-50 text-red-600">نفد</span>
                      )}
                    </div>
                    <p className="mb-1 line-clamp-2 text-sm font-bold text-slate-700">{r.product.name_ar ?? r.product.name}</p>
                    <p className="mb-2 text-xs text-slate-400">
                      {r.variant.barcode ?? r.variant.sku}
                      {(r.variant.size_id || r.variant.color_id) && ` · ${r.variant.size_id ? sizeName(r.variant.size_id, cat.sizes) : ''} ${r.variant.color_id ? colorName(r.variant.color_id, cat.colors) : ''}`}
                    </p>
                    <p className="mb-2 font-bold text-teal-700">{formatCurrency(r.variant.selling_price)}</p>
                    {r.selected ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => setBulkQty(r.variant.id, r.qty - 1)} className="rounded-lg bg-slate-100 p-1.5 text-slate-600"><Minus size={14} /></button>
                        <input type="number" value={r.qty} onChange={(e) => setBulkQty(r.variant.id, Number(e.target.value))} className="w-12 rounded border border-slate-200 px-1 py-1 text-center text-sm" dir="ltr" />
                        <button onClick={() => setBulkQty(r.variant.id, r.qty + 1)} className="rounded-lg bg-slate-100 p-1.5 text-slate-600"><Plus size={14} /></button>
                        <button onClick={() => toggleSelect(r.variant.id)} className="mr-auto rounded-lg bg-slate-100 p-1.5 text-slate-400"><X size={14} /></button>
                      </div>
                    ) : (
                      <button onClick={() => toggleSelect(r.variant.id)} className="mi-btn-secondary w-full py-1.5 text-xs">تحديد</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {results.some((r) => r.selected) && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-teal-700 px-4 py-2.5 text-white">
              <span className="text-sm font-semibold">{results.filter((r) => r.selected).length} منتج محدد</span>
              <button onClick={bulkAdd} className="rounded-lg bg-white px-4 py-1.5 text-sm font-bold text-teal-700">إضافة للسلة</button>
            </div>
          )}
        </div>

        {/* Cart panel */}
        <div className="flex w-96 flex-col border-r border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h3 className="flex items-center gap-2 font-bold text-slate-700"><ShoppingCart size={18} /> السلة</h3>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs font-semibold text-red-500 hover:underline">إفراغ</button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                <ShoppingCart size={40} />
                <p className="mt-2 text-sm">السلة فارغة</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((i) => (
                  <div key={i.variantId} className="rounded-xl border border-slate-100 p-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-700">{i.name}</p>
                        <p className="text-xs text-slate-400">{i.sizeName} {i.colorName} · {i.barcode}</p>
                      </div>
                      <button onClick={() => removeItem(i.variantId)} className="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500"><Trash2 size={15} /></button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(i.variantId, -1)} className="rounded-lg bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200"><Minus size={14} /></button>
                        <input type="number" value={i.qty} onChange={(e) => setQty(i.variantId, Number(e.target.value))} className="w-12 rounded border border-slate-200 px-1 py-1 text-center text-sm" dir="ltr" />
                        <button onClick={() => updateQty(i.variantId, 1)} className="rounded-lg bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200"><Plus size={14} /></button>
                      </div>
                      <span className="font-bold text-teal-700">{formatCurrency(i.price * i.qty)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="border-t border-slate-200 p-4">
            <div className="mb-2 flex justify-between text-sm text-slate-500">
              <span>الإجمالي الفرعي</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {canApplyDiscount && (
              <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
                <span>خصم</span>
                <input type="number" step="0.01" value={globalDiscount || ''} onChange={(e) => setGlobalDiscount(Number(e.target.value))} placeholder="0" className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-left text-sm" dir="ltr" />
              </div>
            )}
            <div className="mb-4 flex justify-between text-lg font-extrabold text-slate-800">
              <span>الإجمالي</span>
              <span className="text-teal-700">{formatCurrency(total)}</span>
            </div>
            <button
              onClick={() => setShowCheckout(true)}
              disabled={cart.length === 0}
              className="mi-btn-primary w-full py-3 text-base"
            >
              <Banknote size={20} /> دفع وإتمام
            </button>
          </div>
        </div>
      </div>

      {/* Checkout modal */}
      {showCheckout && (
        <CheckoutModal
          total={total}
          onClose={() => setShowCheckout(false)}
          onComplete={completeSale}
        />
      )}

      {/* Shift open modal */}
      {showShift && activePos && (
        <ShiftOpenModal
          posName={activePos.name_ar ?? activePos.name}
          onClose={() => navigate('/')}
          onOpen={openShift}
        />
      )}

      {/* Receipt modal */}
      {showReceipt && lastInvoice && (
        <ReceiptModal
          invoice={lastInvoice}
          posName={activePos.name_ar ?? activePos.name}
          cashierName={profile?.full_name ?? ''}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
}

function CheckoutModal({
  total,
  onClose,
  onComplete,
}: {
  total: number;
  onClose: () => void;
  onComplete: (method: PaymentMethod, paidAmount: number) => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [paid, setPaid] = useState(total);
  const [processing, setProcessing] = useState(false);

  const change = Math.max(0, paid - total);

  const methods: { key: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { key: 'cash', label: 'نقدي', icon: <Banknote size={20} /> },
    { key: 'card', label: 'بطاقة', icon: <CreditCard size={20} /> },
    { key: 'e_wallet', label: 'محفظة', icon: <Wallet size={20} /> },
    { key: 'bank', label: 'تحويل', icon: <CreditCard size={20} /> },
  ];

  async function handleComplete() {
    setProcessing(true);
    await onComplete(method, method === 'cash' ? paid : total);
    setProcessing(false);
  }

  return (
    <Modal open onClose={onClose} title="إتمام البيع" size="md">
      <div className="space-y-5">
        <div className="rounded-2xl bg-teal-50 p-5 text-center">
          <p className="text-sm text-teal-600">المبلغ المطلوب</p>
          <p className="text-3xl font-extrabold text-teal-800">{formatCurrency(total)}</p>
        </div>

        <div>
          <label className="mi-label">طريقة الدفع</label>
          <div className="grid grid-cols-4 gap-2">
            {methods.map((m) => (
              <button
                key={m.key}
                onClick={() => { setMethod(m.key); if (m.key !== 'cash') setPaid(total); }}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-semibold ${method === m.key ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-600'}`}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {method === 'cash' && (
          <>
            <div>
              <label className="mi-label">المبلغ المدفوع</label>
              <input type="number" step="0.01" value={paid} onChange={(e) => setPaid(Number(e.target.value))} className="mi-input text-lg font-bold" dir="ltr" autoFocus />
            </div>
            <div className="flex gap-2">
              {[total, Math.ceil(total / 50) * 50, Math.ceil(total / 100) * 100, Math.ceil(total / 200) * 200].map((amt, i) => (
                <button key={i} onClick={() => setPaid(amt)} className="flex-1 rounded-lg bg-slate-100 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200">
                  {formatCurrency(amt)}
                </button>
              ))}
            </div>
            <div className="flex justify-between rounded-xl bg-slate-50 p-4 text-lg font-bold">
              <span className="text-slate-600">الباقي</span>
              <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(change)}</span>
            </div>
          </>
        )}

        <button onClick={handleComplete} disabled={processing} className="mi-btn-primary w-full py-3 text-base">
          {processing ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
          تأكيد الدفع
        </button>
      </div>
    </Modal>
  );
}

function ShiftOpenModal({
  posName,
  onClose,
  onOpen,
}: {
  posName: string;
  onClose: () => void;
  onOpen: (openingCash: number) => void;
}) {
  const [opening, setOpening] = useState(2000);
  return (
    <Modal open onClose={onClose} title="فتح شفت جديد" size="sm">
      <p className="mb-4 text-sm text-slate-500">
        يجب فتح شفت قبل بدء البيع في <span className="font-bold">{posName}</span>.
        أدخل مبلغ الفكة (Opening Cash) في درج الكاشير.
      </p>
      <div>
        <label className="mi-label">مبلغ افتتاح الشفت</label>
        <input type="number" step="0.01" value={opening} onChange={(e) => setOpening(Number(e.target.value))} className="mi-input text-lg font-bold" dir="ltr" autoFocus />
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} className="mi-btn-secondary">إلغاء</button>
        <button onClick={() => onOpen(opening)} className="mi-btn-primary">فتح الشفت</button>
      </div>
    </Modal>
  );
}

function ReceiptModal({
  invoice,
  posName,
  cashierName,
  onClose,
}: {
  invoice: any;
  posName: string;
  cashierName: string;
  onClose: () => void;
}) {
  return (
    <Modal open onClose={onClose} title="إيصال البيع" size="sm">
      <div className="receipt-print mx-auto max-w-xs font-mono text-xs text-slate-800">
        <div className="mb-2 text-center">
          <p className="text-base font-bold">MIYSARA Ahmed</p>
          <p className="text-slate-500">ميسرة أحمد</p>
          <p className="text-slate-500">{posName}</p>
        </div>
        <div className="my-2 border-t border-dashed border-slate-300" />
        <div className="mb-2 flex justify-between">
          <span>رقم: {invoice.invoice_number}</span>
          <span>{new Date(invoice.created_at).toLocaleString('ar-EG')}</span>
        </div>
        <div className="mb-2 flex justify-between">
          <span>كاشير: {cashierName}</span>
        </div>
        <div className="my-2 border-t border-dashed border-slate-300" />
        <table className="w-full">
          <tbody>
            {invoice.items.map((i: any, idx: number) => (
              <tr key={idx}>
                <td className="py-0.5">{i.name}</td>
                <td className="py-0.5 text-center">{i.qty}</td>
                <td className="py-0.5 text-left">{formatCurrency(i.price * i.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="my-2 border-t border-dashed border-slate-300" />
        <div className="flex justify-between"><span>الإجمالي الفرعي</span><span>{formatCurrency(invoice.subtotal)}</span></div>
        {invoice.discount_amount > 0 && <div className="flex justify-between"><span>خصم</span><span>-{formatCurrency(invoice.discount_amount)}</span></div>}
        <div className="flex justify-between font-bold"><span>الإجمالي</span><span>{formatCurrency(invoice.total)}</span></div>
        <div className="flex justify-between"><span>المدفوع</span><span>{formatCurrency(invoice.paid_amount)}</span></div>
        <div className="flex justify-between"><span>الباقي</span><span>{formatCurrency(invoice.change_amount)}</span></div>
        <div className="my-2 border-t border-dashed border-slate-300" />
        <p className="text-center">شكرًا لزيارتكم!</p>
      </div>
      <div className="no-print mt-6 flex justify-end gap-2">
        <button onClick={onClose} className="mi-btn-secondary">إغلاق</button>
        <button onClick={() => window.print()} className="mi-btn-primary"><Printer size={18} /> طباعة</button>
      </div>
    </Modal>
  );
}

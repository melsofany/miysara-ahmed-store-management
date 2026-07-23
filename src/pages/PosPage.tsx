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
import { useCatalog, categoryName, sizeName, colorName } from '@/lib/catalog';
import { formatCurrency } from '@/lib/format';
import type { PosLocation, ProductVariant, Product, CashShift, PaymentMethod, Invoice } from '@/lib/types';

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

interface UserPosLink {
  pos_location_id: string;
  pos: PosLocation | null;
}

interface LastInvoice extends Invoice {
  items: CartItem[];
  change: number;
  method: PaymentMethod;
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
  const [lastInvoice, setLastInvoice] = useState<LastInvoice | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: links } = await supabase
        .from('user_pos_locations')
        .select('pos_location_id, pos:pos_locations(*)')
        .eq('user_id', profile.id);
      
      const userLinks = (links as unknown as UserPosLink[]) ?? [];
      const posIds = userLinks.map((l) => l.pos_location_id);
      
      if (posIds.length === 0) {
        const { data: allPos } = await supabase.from('pos_locations').select('*').eq('is_active', true);
        setPosList((allPos as PosLocation[]) ?? []);
      } else {
        setPosList(userLinks.map((l) => l.pos).filter((p): p is PosLocation => p !== null));
      }
    })();
  }, [profile]);

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

  function bulkAdd() {
    results.filter((r) => r.selected).forEach((r) => addToCart(r.variant, r.product));
    setResults((r) => r.map((x) => ({ ...x, selected: false })));
  }

  function toggleSelect(variantId: string) {
    setResults((r) => r.map((x) => (x.variant.id === variantId ? { ...x, selected: !x.selected } : x)));
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
        await supabase.from('inventory').insert({
          product_variant_id: i.variantId,
          location_id: activePos.id,
          location_type: 'pos',
          quantity: 0,
        });
      }
    }

    if (activeShift) {
      const newCashSales = method === 'cash' ? Number(activeShift.cash_sales) + total : Number(activeShift.cash_sales);
      const newCardSales = method === 'card' ? Number(activeShift.card_sales) + total : Number(activeShift.card_sales);
      const newEPaySales = (method === 'e_wallet' || method === 'bank') ? Number(activeShift.e_payment_sales) + total : Number(activeShift.e_payment_sales);
      const newExpectedCash = Number(activeShift.opening_cash) + newCashSales - Number(activeShift.cash_refunds) - Number(activeShift.cash_expenses);
      const updates: Partial<CashShift> = {
        cash_sales: newCashSales,
        card_sales: newCardSales,
        e_payment_sales: newEPaySales,
        expected_cash: newExpectedCash,
      };
      await supabase.from('cash_shifts').update(updates).eq('id', activeShift.id);
      setActiveShift({ ...activeShift, ...updates });
    }

    setLastInvoice({ ...invoice, items: cart, change, method });
    setShowReceipt(true);
    setCart([]);
    setGlobalDiscount(0);
    setShowCheckout(false);
    toast('تم إتمام البيع بنجاح');
  }

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
                  <ArrowLeft size={18} className="text-slate-300" />
                </button>
              ))}
            </div>
          )}
          <button onClick={() => signOut()} className="mt-6 w-full py-2 text-sm text-slate-400 hover:text-slate-600">تسجيل الخروج</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100 overflow-hidden">
      <header className="flex shrink-0 items-center justify-between bg-white px-4 py-2 shadow-sm">
        <div className="flex items-center gap-4">
          <Logo size={28} />
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <p className="text-sm font-bold text-slate-800">{activePos.name_ar ?? activePos.name}</p>
            <p className="text-[10px] text-slate-400">{profile?.full_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeShift && (
            <div className="hidden items-center gap-4 rounded-lg bg-slate-50 px-3 py-1.5 text-xs sm:flex">
              <div className="text-center">
                <p className="text-slate-400">مبيعات اليوم</p>
                <p className="font-bold text-teal-700">{formatCurrency(Number(activeShift.cash_sales) + Number(activeShift.card_sales) + Number(activeShift.e_payment_sales))}</p>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div className="text-center">
                <p className="text-slate-400">رقم الشفت</p>
                <p className="font-bold text-slate-700" dir="ltr">{activeShift.shift_number}</p>
              </div>
            </div>
          )}
          <button onClick={() => navigate('/dashboard')} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><ArrowLeft size={20} /></button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden p-2 gap-2">
        <div className="flex flex-1 flex-col overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-b p-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={barcodeRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleBarcodeEnter}
                placeholder="ابحث بالاسم أو الباركود (F1)..."
                className="mi-input pr-10"
                autoFocus
              />
            </div>
            <div className="flex gap-1 overflow-x-auto">
              <select value={filters.category} onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))} className="mi-input h-9 py-1 text-xs min-w-[100px]">
                <option value="">كل التصنيفات</option>
                {cat.categories.map(c => <option key={c.id} value={c.id}>{c.name_ar ?? c.name}</option>)}
              </select>
              <select value={filters.size} onChange={(e) => setFilters(f => ({ ...f, size: e.target.value }))} className="mi-input h-9 py-1 text-xs min-w-[80px]">
                <option value="">المقاس</option>
                {cat.sizes.map(s => <option key={s.id} value={s.id}>{s.name_ar ?? s.name}</option>)}
              </select>
            </div>
            {results.some(r => r.selected) && (
              <button onClick={bulkAdd} className="mi-btn-primary h-9 px-3 text-xs"><Plus size={14} /> إضافة المختار</button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {loadingSearch ? (
              <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-teal-600" /></div>
            ) : results.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-slate-400">
                <ScanLine size={48} className="mb-2 opacity-20" />
                <p>لا توجد نتائج بحث</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {results.map((r) => (
                  <div
                    key={r.variant.id}
                    onClick={() => addToCart(r.variant, r.product)}
                    className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border transition hover:border-teal-500 hover:shadow-md ${r.selected ? 'border-teal-600 bg-teal-50' : 'border-slate-200 bg-white'}`}
                  >
                    <div className="aspect-square w-full bg-slate-50">
                      {r.product.image_url ? (
                        <img src={r.product.image_url} alt={r.product.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-200"><Package size={32} /></div>
                      )}
                      {r.qty <= 0 && !activePos.allow_sell_out_of_stock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                          <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">نفذ</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2 text-right">
                      <p className="truncate text-xs font-bold text-slate-700">{r.product.name_ar ?? r.product.name}</p>
                      <p className="mb-1 text-[10px] text-slate-400">
                        {sizeName(r.variant.size_id, cat.sizes)} {r.variant.color_id && `· ${colorName(r.variant.color_id, cat.colors)}`}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-teal-700">{formatCurrency(Number(r.variant.selling_price) || Number(r.product.default_selling_price))}</span>
                        <span className={`text-[10px] ${r.qty <= 5 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>{r.qty} ق</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSelect(r.variant.id); }}
                      className={`absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border transition ${r.selected ? 'bg-teal-600 border-teal-600 text-white' : 'bg-white/80 border-slate-300 text-transparent group-hover:border-teal-500'}`}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col overflow-hidden rounded-xl bg-white shadow-sm sm:w-80 lg:w-96">
          <div className="flex shrink-0 items-center justify-between border-b bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-teal-600" />
              <h2 className="font-bold text-slate-700">السلة</h2>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">{cart.length}</span>
            </div>
            {cart.length > 0 && <button onClick={() => setCart([])} className="text-xs text-red-500 hover:underline">مسح الكل</button>}
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-slate-300">
                <ShoppingCart size={48} className="mb-2 opacity-20" />
                <p className="text-sm">السلة فارغة</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.variantId} className="flex gap-2 rounded-xl border border-slate-100 bg-white p-2 hover:border-teal-200">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-bold text-slate-700">{item.name}</p>
                      <p className="text-[10px] text-slate-400">{item.sizeName} {item.colorName && `· ${item.colorName}`}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs font-bold text-teal-700">{formatCurrency(item.price)}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQty(item.variantId, -1)} className="rounded bg-slate-100 p-1 text-slate-600 hover:bg-slate-200"><Minus size={12} /></button>
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => setQty(item.variantId, parseInt(e.target.value) || 1)}
                            className="w-8 border-none bg-transparent text-center text-xs font-bold focus:ring-0"
                          />
                          <button onClick={() => updateQty(item.variantId, 1)} className="rounded bg-slate-100 p-1 text-slate-600 hover:bg-slate-200"><Plus size={12} /></button>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => removeItem(item.variantId)} className="self-start rounded p-1 text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t bg-slate-50 p-4">
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-500"><span>المجموع الفرعي</span><span>{formatCurrency(subtotal)}</span></div>
              {canApplyDiscount && (
                <div className="flex items-center justify-between text-slate-500">
                  <span className="flex items-center gap-1"><Tag size={14} /> الخصم</span>
                  <input
                    type="number"
                    value={globalDiscount || ''}
                    onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-20 rounded border-slate-200 py-0.5 text-left text-xs focus:border-teal-500 focus:ring-teal-500"
                  />
                </div>
              )}
              <div className="flex justify-between border-t pt-2 text-lg font-extrabold text-slate-800"><span>الإجمالي</span><span className="text-teal-700">{formatCurrency(total)}</span></div>
            </div>
            <button
              onClick={() => setShowCheckout(true)}
              disabled={cart.length === 0}
              className="mi-btn-primary w-full py-3 text-lg shadow-lg shadow-teal-100 disabled:opacity-50"
            >
              دفع (F10)
            </button>
          </div>
        </div>
      </main>

      {showShift && <OpenShiftModal onConfirm={openShift} onCancel={() => navigate('/dashboard')} />}
      {showCheckout && <CheckoutModal total={total} onConfirm={completeSale} onCancel={() => setShowCheckout(false)} />}
      {showReceipt && lastInvoice && <ReceiptModal invoice={lastInvoice} onClose={() => setShowReceipt(false)} />}
    </div>
  );
}

function OpenShiftModal({ onConfirm, onCancel }: { onConfirm: (cash: number) => void; onCancel: () => void }) {
  const [cash, setCash] = useState(0);
  return (
    <Modal open onClose={onCancel} title="فتح شفت جديد" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-slate-500">أدخل مبلغ عهدة الكاشير الافتتاحية في الدرج:</p>
        <div>
          <label className="mi-label">المبلغ الافتتاحي</label>
          <input type="number" value={cash} onChange={(e) => setCash(parseFloat(e.target.value) || 0)} className="mi-input text-lg font-bold" autoFocus />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={() => onConfirm(cash)} className="mi-btn-primary flex-1 py-2.5">بدء الشفت</button>
          <button onClick={onCancel} className="mi-btn-secondary px-4">إلغاء</button>
        </div>
      </div>
    </Modal>
  );
}

function CheckoutModal({ total, onConfirm, onCancel }: { total: number; onConfirm: (method: PaymentMethod, paid: number) => void; onCancel: () => void }) {
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [paid, setPaid] = useState(total);
  const change = Math.max(0, paid - total);

  return (
    <Modal open onClose={onCancel} title="إتمام عملية الدفع" size="md">
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-sm text-slate-400">المبلغ المطلوب</p>
          <p className="text-4xl font-black text-teal-700">{formatCurrency(total)}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { id: 'cash' as PaymentMethod, label: 'نقدي', icon: <Banknote size={20} /> },
            { id: 'card' as PaymentMethod, label: 'بطاقة', icon: <CreditCard size={20} /> },
            { id: 'bank' as PaymentMethod, label: 'تحويل', icon: <ArrowLeft size={20} /> },
            { id: 'e_wallet' as PaymentMethod, label: 'محفظة', icon: <Wallet size={20} /> },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition ${method === m.id ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
            >
              {m.icon}
              <span className="text-xs font-bold">{m.label}</span>
            </button>
          ))}
        </div>

        {method === 'cash' && (
          <div className="space-y-4">
            <div>
              <label className="mi-label">المبلغ المدفوع</label>
              <input type="number" value={paid} onChange={(e) => setPaid(parseFloat(e.target.value) || 0)} className="mi-input text-2xl font-black text-slate-700" autoFocus />
            </div>
            <div className="flex items-center justify-between rounded-xl bg-amber-50 p-4 text-amber-700">
              <span className="font-bold">المتبقي (الفكة)</span>
              <span className="text-2xl font-black">{formatCurrency(change)}</span>
            </div>
          </div>
        )}

        <button onClick={() => onConfirm(method, paid)} className="mi-btn-primary w-full py-4 text-xl font-bold shadow-xl shadow-teal-100">تأكيد العملية</button>
      </div>
    </Modal>
  );
}

function ReceiptModal({ invoice, onClose }: { invoice: LastInvoice; onClose: () => void }) {
  const print = () => window.print();
  return (
    <Modal open onClose={onClose} title="فاتورة مبيعات" size="sm">
      <div id="receipt" className="receipt-content space-y-4 p-2 text-right">
        <div className="text-center border-b pb-4">
          <Logo size={40} className="mx-auto mb-2" />
          <h3 className="text-lg font-black uppercase">MiySara Ahmed</h3>
          <p className="text-[10px] text-slate-500">نظام إدارة محلات الملابس</p>
        </div>

        <div className="space-y-1 text-xs text-slate-500">
          <div className="flex justify-between"><span>رقم الفاتورة:</span><span className="font-bold text-slate-700" dir="ltr">{invoice.invoice_number}</span></div>
          <div className="flex justify-between"><span>التاريخ:</span><span className="font-bold text-slate-700">{new Date().toLocaleString('ar-EG')}</span></div>
        </div>

        <table className="w-full text-xs">
          <thead className="border-b-2 border-slate-100">
            <tr><th className="py-2 text-right">الصنف</th><th className="py-2 text-center">ق</th><th className="py-2 text-left">الإجمالي</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {invoice.items.map((it, i) => (
              <tr key={i}>
                <td className="py-2">
                  <p className="font-bold">{it.name}</p>
                  <p className="text-[10px] text-slate-400">{it.sizeName} {it.colorName}</p>
                </td>
                <td className="py-2 text-center">{it.qty}</td>
                <td className="py-2 text-left">{formatCurrency(it.price * it.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between"><span>المجموع:</span><span>{formatCurrency(invoice.subtotal)}</span></div>
          {invoice.discount_amount > 0 && <div className="flex justify-between text-red-500"><span>الخصم:</span><span>-{formatCurrency(invoice.discount_amount)}</span></div>}
          <div className="flex justify-between text-lg font-black"><span>الإجمالي:</span><span>{formatCurrency(invoice.total)}</span></div>
        </div>

        <div className="space-y-1 border-t border-dashed pt-3 text-xs text-slate-500">
          <div className="flex justify-between"><span>طريقة الدفع:</span><span>{invoice.method === 'cash' ? 'نقدي' : invoice.method === 'card' ? 'بطاقة' : 'إلكتروني'}</span></div>
          {invoice.method === 'cash' && (
            <>
              <div className="flex justify-between"><span>المدفوع:</span><span>{formatCurrency(invoice.paid_amount)}</span></div>
              <div className="flex justify-between font-bold text-slate-700"><span>المتبقي:</span><span>{formatCurrency(invoice.change)}</span></div>
            </>
          )}
        </div>

        <div className="pt-6 text-center">
          <div className="mb-2 flex justify-center"><CheckCircle2 size={32} className="text-teal-600" /></div>
          <p className="text-sm font-bold">شكراً لزيارتكم!</p>
          <p className="text-[10px] text-slate-400">لا يتم الاستبدال أو الاسترجاع بدون الفاتورة</p>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <button onClick={print} className="mi-btn-primary flex-1"><Printer size={18} /> طباعة</button>
        <button onClick={onClose} className="mi-btn-secondary px-6">إغلاق</button>
      </div>
    </Modal>
  );
}

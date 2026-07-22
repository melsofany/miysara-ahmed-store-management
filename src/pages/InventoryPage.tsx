import { useEffect, useState, useCallback } from 'react';
import {
  Package,
  ArrowRightLeft,
  Plus,
  Loader2,
  PackageCheck,
  PackageMinus,
  RefreshCw,
  Warehouse as WhIcon,
  Store,
  History,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { EmptyState } from '@/components/EmptyState';
import { SearchInput } from '@/components/Form';
import { toast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import { useCan, useAuth } from '@/lib/auth';
import { useCatalog, sizeName, colorName } from '@/lib/catalog';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { Warehouse, PosLocation, Inventory, ProductVariant, Product, StockMovement, MovementType } from '@/lib/types';

type View = 'inventory' | 'movements';

const movementLabels: Record<MovementType, string> = {
  stock_in: 'إضافة مخزون',
  issue_to_pos: 'صرف لنقطة بيع',
  transfer_wh: 'تحويل بين المخازن',
  transfer_to_pos: 'تحويل لنقطة بيع',
  pos_receive: 'استلام نقطة بيع',
  return_to_wh: 'مرتجع للمخزن',
  adjustment: 'تسوية مخزون',
  sale: 'بيع',
  sale_return: 'مرتجع بيع',
};

export function InventoryPage() {
  const { can } = useCan();
  const { profile } = useAuth();
  const canManage = can('manage_inventory');
  const canViewCost = can('view_cost');
  const cat = useCatalog();
  const [view, setView] = useState<View>('inventory');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [posList, setPosList] = useState<PosLocation[]>([]);
  const [inventory, setInventory] = useState<(Inventory & { product_variant?: ProductVariant & { product?: Product } })[]>([]);
  const [movements, setMovements] = useState<(StockMovement & { product_variant?: ProductVariant })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [locFilter, setLocFilter] = useState('');
  const [showMovement, setShowMovement] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: wh }, { data: pos }] = await Promise.all([
      supabase.from('warehouses').select('*').eq('is_active', true),
      supabase.from('pos_locations').select('*').eq('is_active', true),
    ]);
    setWarehouses((wh as Warehouse[]) ?? []);
    setPosList((pos as PosLocation[]) ?? []);

    if (view === 'inventory') {
      let q = supabase
        .from('inventory')
        .select('*, product_variant:product_variants(*, product:products(*))')
        .order('updated_at', { ascending: false });
      if (locFilter) q = q.eq('location_id', locFilter);
      const { data } = await q;
      setInventory((data as any) ?? []);
    } else {
      let q = supabase
        .from('stock_movements')
        .select('*, product_variant:product_variants(*)')
        .order('created_at', { ascending: false })
        .limit(200);
      if (locFilter) q = q.or(`from_location_id.eq.${locFilter},to_location_id.eq.${locFilter}`);
      const { data } = await q;
      setMovements((data as any) ?? []);
    }
    setLoading(false);
  }, [view, locFilter]);

  useEffect(() => { load(); }, [load]);

  const locName = (id: string | null, type: string | null) => {
    if (!id) return '—';
    if (type === 'warehouse') return warehouses.find((w) => w.id === id)?.name_ar ?? 'مخزن';
    return posList.find((p) => p.id === id)?.name_ar ?? 'نقطة بيع';
  };

  const filteredInventory = inventory.filter((inv) => {
    if (!search) return true;
    const p = inv.product_variant?.product;
    const v = inv.product_variant;
    const s = search.toLowerCase();
    return (
      (p?.name_ar ?? '').includes(search) ||
      (p?.name ?? '').toLowerCase().includes(s) ||
      (v?.barcode ?? '').includes(s) ||
      (p?.sku ?? '').toLowerCase().includes(s)
    );
  });

  return (
    <div>
      <PageHeader
        title="المخزون والحركات"
        subtitle="عرض المخزون الحالي وسجل حركات المخزون"
        icon={<Package size={22} />}
        actions={canManage && <button onClick={() => setShowMovement(true)} className="mi-btn-primary"><Plus size={18} /> حركة مخزون</button>}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setView('inventory')} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${view === 'inventory' ? 'bg-teal-700 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
          <PackageCheck size={18} /> المخزون الحالي
        </button>
        <button onClick={() => setView('movements')} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${view === 'movements' ? 'bg-teal-700 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
          <History size={18} /> سجل الحركات
        </button>
      </div>

      <div className="mi-card mb-4 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[240px] flex-1"><SearchInput value={search} onChange={setSearch} placeholder="ابحث بالاسم، الباركود، SKU..." /></div>
        <div className="min-w-[180px]">
          <label className="mi-label">الموقع</label>
          <select value={locFilter} onChange={(e) => setLocFilter(e.target.value)} className="mi-input">
            <option value="">الكل</option>
            <optgroup label="المخازن">
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name_ar ?? w.name}</option>)}
            </optgroup>
            <optgroup label="نقاط البيع">
              {posList.map((p) => <option key={p.id} value={p.id}>{p.name_ar ?? p.name}</option>)}
            </optgroup>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-teal-600" /></div>
      ) : view === 'inventory' ? (
        filteredInventory.length === 0 ? (
          <EmptyState icon={<Package size={48} />} title="لا يوجد مخزون" description="لا توجد أصناف في هذا الموقع." />
        ) : (
          <div className="mi-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-right text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">المنتج</th>
                  <th className="px-4 py-3 font-semibold">المتغير</th>
                  <th className="px-4 py-3 font-semibold">الموقع</th>
                  <th className="px-4 py-3 font-semibold">الكمية</th>
                  {canViewCost && <th className="px-4 py-3 font-semibold">التكلفة</th>}
                  <th className="px-4 py-3 font-semibold">سعر البيع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventory.map((inv) => {
                  const p = inv.product_variant?.product;
                  const v = inv.product_variant;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-700">{p?.name_ar ?? p?.name}</p>
                        <p className="text-xs text-slate-400">SKU: {p?.sku}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {v?.size_id && <span>{sizeName(v.size_id, cat.sizes)} </span>}
                        {v?.color_id && <span>· {colorName(v.color_id, cat.colors)}</span>}
                        {!v?.size_id && !v?.color_id && <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`mi-badge ${inv.location_type === 'warehouse' ? 'bg-blue-50 text-blue-600' : 'bg-teal-50 text-teal-700'}`}>
                          {inv.location_type === 'warehouse' ? <WhIcon size={11} /> : <Store size={11} />}
                          {locName(inv.location_id, inv.location_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${inv.quantity <= 0 ? 'text-red-600' : inv.quantity <= 5 ? 'text-amber-600' : 'text-slate-700'}`}>
                          {inv.quantity}
                        </span>
                      </td>
                      {canViewCost && <td className="px-4 py-3 text-slate-600">{formatCurrency(v?.last_cost_price ?? 0)}</td>}
                      <td className="px-4 py-3 text-slate-600">{formatCurrency(v?.selling_price ?? p?.default_selling_price ?? 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : movements.length === 0 ? (
        <EmptyState icon={<History size={48} />} title="لا توجد حركات" description="لم تسجل أي حركات مخزون بعد." action={canManage && <button onClick={() => setShowMovement(true)} className="mi-btn-primary"><Plus size={18} /> حركة جديدة</button>} />
      ) : (
        <div className="mi-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-right text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">النوع</th>
                <th className="px-4 py-3 font-semibold">المنتج</th>
                <th className="px-4 py-3 font-semibold">من</th>
                <th className="px-4 py-3 font-semibold">إلى</th>
                <th className="px-4 py-3 font-semibold">الكمية</th>
                {canViewCost && <th className="px-4 py-3 font-semibold">التكلفة</th>}
                <th className="px-4 py-3 font-semibold">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3"><span className="mi-badge bg-slate-100 text-slate-600">{movementLabels[m.movement_type]}</span></td>
                  <td className="px-4 py-3 text-slate-700">{m.product_variant?.barcode ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{locName(m.from_location_id, m.from_location_type)}</td>
                  <td className="px-4 py-3 text-slate-500">{locName(m.to_location_id, m.to_location_type)}</td>
                  <td className="px-4 py-3 font-bold text-slate-700">{m.quantity}</td>
                  {canViewCost && <td className="px-4 py-3 text-slate-600">{formatCurrency(m.unit_cost_price)}</td>}
                  <td className="px-4 py-3 text-xs text-slate-400">{formatDateTime(m.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showMovement && (
        <MovementModal
          warehouses={warehouses}
          posList={posList}
          userId={profile?.id ?? null}
          onClose={() => setShowMovement(false)}
          onSaved={() => { setShowMovement(false); load(); }}
        />
      )}
    </div>
  );
}

function MovementModal({
  warehouses,
  posList,
  userId,
  onClose,
  onSaved,
}: {
  warehouses: Warehouse[];
  posList: PosLocation[];
  userId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const cat = useCatalog();
  const [type, setType] = useState<MovementType>('stock_in');
  const [variantId, setVariantId] = useState('');
  const [qty, setQty] = useState(1);
  const [cost, setCost] = useState(0);
  const [fromLoc, setFromLoc] = useState('');
  const [toLoc, setToLoc] = useState('');
  const [docRef, setDocRef] = useState('');
  const [notes, setNotes] = useState('');
  const [variants, setVariants] = useState<(ProductVariant & { product?: Product })[]>([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      let q = supabase.from('product_variants').select('*, product:products(*)').limit(50);
      if (search) q = q.or(`barcode.ilike.%${search}%,sku.ilike.%${search}%`);
      const { data } = await q;
      setVariants((data as any) ?? []);
    }, 200);
    return () => clearTimeout(t);
  }, [search]);

  const typeOptions: { key: MovementType; label: string; from: 'warehouse' | 'pos' | 'none'; to: 'warehouse' | 'pos' | 'none' }[] = [
    { key: 'stock_in', label: 'إضافة مخزون', from: 'none', to: 'warehouse' },
    { key: 'transfer_wh', label: 'تحويل بين المخازن', from: 'warehouse', to: 'warehouse' },
    { key: 'transfer_to_pos', label: 'تحويل لنقطة بيع', from: 'warehouse', to: 'pos' },
    { key: 'return_to_wh', label: 'مرتجع للمخزن', from: 'pos', to: 'warehouse' },
    { key: 'adjustment', label: 'تسوية مخزون', from: 'none', to: 'none' },
  ];

  const selected = typeOptions.find((t) => t.key === type)!;

  async function save() {
    setSaving(true);
    try {
      if (!variantId || qty <= 0) { toast('اختر المنتج والكمية', 'error'); setSaving(false); return; }
      const movement: any = {
        movement_type: type,
        product_variant_id: variantId,
        quantity: qty,
        unit_cost_price: cost,
        document_ref: docRef || null,
        notes: notes || null,
        user_id: userId,
      };
      if (selected.from !== 'none' && fromLoc) { movement.from_location_id = fromLoc; movement.from_location_type = selected.from; }
      if (selected.to !== 'none' && toLoc) { movement.to_location_id = toLoc; movement.to_location_type = selected.to; }
      if (selected.from === 'none' && selected.to === 'none') {
        // adjustment: use fromLoc as the target
        movement.to_location_id = fromLoc || toLoc;
        movement.to_location_type = 'warehouse';
      }

      const { error } = await supabase.from('stock_movements').insert(movement);
      if (error) throw error;

      // update inventory
      const targetLocId = movement.to_location_id ?? movement.from_location_id;
      const targetLocType = movement.to_location_type ?? movement.from_location_type;
      if (targetLocId && targetLocType) {
        const delta = ['return_to_wh', 'stock_in', 'adjustment', 'transfer_to_pos', 'transfer_wh', 'pos_receive'].includes(type) ? qty : -qty;
        const { data: existing } = await supabase.from('inventory').select('*').eq('product_variant_id', variantId).eq('location_id', targetLocId).eq('location_type', targetLocType).maybeSingle();
        if (existing) {
          await supabase.from('inventory').update({ quantity: (existing as Inventory).quantity + delta, updated_at: new Date().toISOString() }).eq('id', (existing as Inventory).id);
        } else {
          await supabase.from('inventory').insert({ product_variant_id: variantId, location_id: targetLocId, location_type: targetLocType, quantity: delta });
        }
        // deduct from source for transfers
        if (movement.from_location_id && movement.from_location_type && (type === 'transfer_wh' || type === 'transfer_to_pos' || type === 'return_to_wh')) {
          const { data: src } = await supabase.from('inventory').select('*').eq('product_variant_id', variantId).eq('location_id', movement.from_location_id).eq('location_type', movement.from_location_type).maybeSingle();
          if (src) {
            await supabase.from('inventory').update({ quantity: Math.max(0, (src as Inventory).quantity - qty), updated_at: new Date().toISOString() }).eq('id', (src as Inventory).id);
          }
        }
      }
      toast('تم تسجيل الحركة وتحديث المخزون');
      onSaved();
    } catch (e: any) { toast(e.message, 'error'); } finally { setSaving(false); }
  }

  return (
    <Modal open onClose={onClose} title="حركة مخزون جديدة" size="lg">
      <div className="space-y-4">
        <div>
          <label className="mi-label">نوع الحركة</label>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {typeOptions.map((t) => (
              <button key={t.key} onClick={() => { setType(t.key); setFromLoc(''); setToLoc(''); }} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold ${type === t.key ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                <ArrowRightLeft size={15} /> {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mi-label">المنتج</label>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث بالباركود أو SKU..." className="mi-input mb-2" dir="ltr" />
          {variants.length > 0 && (
            <select value={variantId} onChange={(e) => { setVariantId(e.target.value); const v = variants.find((x) => x.id === e.target.value); if (v) setCost(Number(v.last_cost_price)); }} className="mi-input">
              <option value="">اختر المنتج</option>
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.product?.name_ar ?? v.product?.name} — {v.barcode ?? v.sku} ({sizeName(v.size_id, cat.sizes)} {colorName(v.color_id, cat.colors)})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div><label className="mi-label">الكمية</label><input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} className="mi-input" dir="ltr" /></div>
          <div><label className="mi-label">سعر التكلفة</label><input type="number" step="0.01" value={cost} onChange={(e) => setCost(Number(e.target.value))} className="mi-input" dir="ltr" /></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {selected.from !== 'none' && (
            <div>
              <label className="mi-label">المصدر ({selected.from === 'warehouse' ? 'مخزن' : 'نقطة بيع'})</label>
              <select value={fromLoc} onChange={(e) => setFromLoc(e.target.value)} className="mi-input">
                <option value="">اختر</option>
                {selected.from === 'warehouse' ? warehouses.map((w) => <option key={w.id} value={w.id}>{w.name_ar ?? w.name}</option>) : posList.map((p) => <option key={p.id} value={p.id}>{p.name_ar ?? p.name}</option>)}
              </select>
            </div>
          )}
          {selected.to !== 'none' && (
            <div>
              <label className="mi-label">الوجهة ({selected.to === 'warehouse' ? 'مخزن' : 'نقطة بيع'})</label>
              <select value={toLoc} onChange={(e) => setToLoc(e.target.value)} className="mi-input">
                <option value="">اختر</option>
                {selected.to === 'warehouse' ? warehouses.map((w) => <option key={w.id} value={w.id}>{w.name_ar ?? w.name}</option>) : posList.map((p) => <option key={p.id} value={p.id}>{p.name_ar ?? p.name}</option>)}
              </select>
            </div>
          )}
          {selected.from === 'none' && selected.to === 'none' && (
            <div className="col-span-2">
              <label className="mi-label">الموقع (للتسوية)</label>
              <select value={fromLoc} onChange={(e) => setFromLoc(e.target.value)} className="mi-input">
                <option value="">اختر</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>مخزن: {w.name_ar ?? w.name}</option>)}
                {posList.map((p) => <option key={p.id} value={p.id}>نقطة بيع: {p.name_ar ?? p.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div><label className="mi-label">رقم المستند</label><input value={docRef} onChange={(e) => setDocRef(e.target.value)} className="mi-input" dir="ltr" /></div>
        <div><label className="mi-label">ملاحظات</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mi-input" rows={2} /></div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} className="mi-btn-secondary">إلغاء</button>
        <button onClick={save} disabled={saving} className="mi-btn-primary">{saving ? <Loader2 size={16} className="animate-spin" /> : <PackageCheck size={16} />} تسجيل</button>
      </div>
    </Modal>
  );
}

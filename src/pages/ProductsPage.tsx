import { useEffect, useState, useCallback } from 'react';
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Layers,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { toast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import { useCatalog, clearCatalogCache, categoryName } from '@/lib/catalog';
import { useCan } from '@/lib/auth';
import { formatCurrency } from '@/lib/format';
import type { Product, ProductVariant } from '@/lib/types';

type ProductWithVariants = Product & { variants?: ProductVariant[] };

export function ProductsPage() {
  const { can } = useCan();
  const canManage = can('manage_products');
  const canViewCost = can('view_cost');
  const cat = useCatalog();

  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    category_id: '',
    season_id: '',
    supplier_id: '',
    manufacturer_id: '',
  });
  const [editing, setEditing] = useState<ProductWithVariants | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('products').select('*, variants:product_variants(*)').order('created_at', { ascending: false });
    if (filters.category_id) q = q.eq('category_id', filters.category_id);
    if (filters.season_id) q = q.eq('season_id', filters.season_id);
    if (filters.supplier_id) q = q.eq('supplier_id', filters.supplier_id);
    if (filters.manufacturer_id) q = q.eq('manufacturer_id', filters.manufacturer_id);
    if (search) q = q.or(`name.ilike.%${search}%,name_ar.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%,description.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) toast(error.message, 'error');
    setProducts((data as ProductWithVariants[]) ?? []);
    setLoading(false);
  }, [filters, search]);

  useEffect(() => {
    const t = setTimeout(loadProducts, 250);
    return () => clearTimeout(t);
  }, [loadProducts]);

  function openNew() {
    setEditing(null);
    setShowModal(true);
  }
  function openEdit(p: ProductWithVariants) {
    setEditing(p);
    setShowModal(true);
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    const { error } = await supabase.from('products').delete().eq('id', confirmDelete.id);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    toast('تم حذف المنتج');
    loadProducts();
  }

  return (
    <div>
      <PageHeader
        title="المنتجات"
        subtitle="إدارة المنتجات والموديلات والمتغيرات (المقاسات والألوان)"
        icon={<Package size={22} />}
        actions={
          canManage && (
            <button onClick={openNew} className="mi-btn-primary">
              <Plus size={18} /> منتج جديد
            </button>
          )
        }
      />

      <div className="mi-card mb-4 p-4">
        <div className="relative mb-3">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم، SKU، الباركود، الوصف، رقم الموديل..."
            className="mi-input pr-10"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <select value={filters.category_id} onChange={(e) => setFilters((f) => ({ ...f, category_id: e.target.value }))} className="mi-input">
            <option value="">كل التصنيفات</option>
            {cat.categories.map((c) => <option key={c.id} value={c.id}>{c.name_ar ?? c.name}</option>)}
          </select>
          <select value={filters.season_id} onChange={(e) => setFilters((f) => ({ ...f, season_id: e.target.value }))} className="mi-input">
            <option value="">كل المواسم</option>
            {cat.seasons.map((s) => <option key={s.id} value={s.id}>{s.name_ar ?? s.name}</option>)}
          </select>
          <select value={filters.supplier_id} onChange={(e) => setFilters((f) => ({ ...f, supplier_id: e.target.value }))} className="mi-input">
            <option value="">كل الموردين</option>
            {cat.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={filters.manufacturer_id} onChange={(e) => setFilters((f) => ({ ...f, manufacturer_id: e.target.value }))} className="mi-input">
            <option value="">كل المصنعين</option>
            {cat.manufacturers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-teal-600" />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package size={48} />}
          title="لا توجد منتجات"
          description="ابدأ بإضافة منتجاتك لإدارتها وبيعها."
          action={canManage && <button onClick={openNew} className="mi-btn-primary"><Plus size={18} /> إضافة منتج</button>}
        />
      ) : (
        <div className="mi-card divide-y divide-slate-100">
          {products.map((p) => (
            <div key={p.id}>
              <div
                className="flex cursor-pointer items-center gap-4 px-5 py-4 hover:bg-slate-50"
                onClick={() => setExpanded(expanded === p.id ? null : p.id)}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <Package size={22} className="text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-bold text-slate-800">{p.name_ar ?? p.name}</p>
                    {p.has_variants && (
                      <span className="mi-badge bg-teal-50 text-teal-700"><Layers size={11} /> متغيرات</span>
                    )}
                  </div>
                  <p className="truncate text-xs text-slate-400">
                    SKU: {p.sku} {p.barcode && `| باركود: ${p.barcode}`} | {categoryName(p.category_id, cat.categories)}
                  </p>
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-bold text-teal-700">{formatCurrency(p.default_selling_price)}</p>
                  <p className="text-xs text-slate-400">{p.variants?.length ?? 0} متغير</p>
                </div>
                {canManage && (
                  <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openEdit(p)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-teal-600">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => setConfirmDelete(p)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              {expanded === p.id && p.variants && (
                <div className="bg-slate-50 px-5 py-3">
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {p.variants.map((v) => (
                      <div key={v.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-700">{v.barcode || v.sku || 'بدون كود'}</span>
                          <span className="text-xs text-slate-400">
                            {v.size_id && getSizeName(v.size_id, cat)} {v.color_id && `· ${getColorName(v.color_id, cat)}`}
                          </span>
                        </div>
                        <div className="text-left">
                          <span className="font-bold text-teal-700">{formatCurrency(v.selling_price)}</span>
                          {canViewCost && <span className="ml-2 text-xs text-slate-400">تكلفة: {formatCurrency(v.last_cost_price)}</span>}
                        </div>
                      </div>
                    ))}
                    {p.variants.length === 0 && <p className="text-sm text-slate-400">لا توجد متغيرات. السعر الافتراضي مستخدم.</p>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ProductModal
          product={editing}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            clearCatalogCache();
            loadProducts();
          }}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="حذف المنتج"
        message={`هل تريد حذف "${confirmDelete?.name_ar ?? confirmDelete?.name}"؟`}
        danger
        confirmText="حذف"
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function getSizeName(id: string, cat: ReturnType<typeof useCatalog>): string {
  return cat.sizes.find((s) => s.id === id)?.name_ar ?? cat.sizes.find((s) => s.id === id)?.name ?? '—';
}
function getColorName(id: string, cat: ReturnType<typeof useCatalog>): string {
  return cat.colors.find((c) => c.id === id)?.name_ar ?? cat.colors.find((c) => c.id === id)?.name ?? '—';
}

function ProductModal({
  product,
  onClose,
  onSaved,
}: {
  product: ProductWithVariants | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const cat = useCatalog();
  const isNew = !product;
  const [form, setForm] = useState<Partial<Product>>(() =>
    product ?? {
      sku: '',
      barcode: '',
      name: '',
      name_ar: '',
      description: '',
      category_id: '',
      season_id: '',
      supplier_id: '',
      manufacturer_id: '',
      model_number: '',
      unit: 'piece',
      default_selling_price: 0,
      min_stock_level: 0,
      has_variants: false,
      is_active: true,
    }
  );
  const [variants, setVariants] = useState<ProductVariant[]>(product?.variants ?? []);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof Product, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    setSaving(true);
    try {
      if (!form.sku || (!form.name && !form.name_ar)) {
        toast('يجب إدخال اسم المنتج (عربي أو إنجليزي) ورمز SKU', 'error');
        setSaving(false);
        return;
      }
      const payload = {
        ...form,
        category_id: form.category_id || null,
        season_id: form.season_id || null,
        supplier_id: form.supplier_id || null,
        manufacturer_id: form.manufacturer_id || null,
        default_selling_price: Number(form.default_selling_price),
        min_stock_level: Number(form.min_stock_level),
      };
      let productId = product?.id;
      if (isNew) {
        const { data, error } = await supabase.from('products').insert(payload).select().single();
        if (error) throw error;
        productId = data.id;
      } else {
        const { error } = await supabase.from('products').update(payload).eq('id', product!.id);
        if (error) throw error;
      }
      if (productId && variants.length > 0) {
        const rows = variants.map((v) => ({
          product_id: productId,
          size_id: v.size_id || null,
          color_id: v.color_id || null,
          barcode: v.barcode,
          sku: v.sku,
          cost_price: Number(v.cost_price),
          selling_price: Number(v.selling_price),
          last_cost_price: Number(v.cost_price),
          is_active: true,
          ...(v.id ? { id: v.id } : {}),
        }));
        const { error: vErr } = await supabase.from('product_variants').upsert(rows);
        if (vErr) throw vErr;
      }
      toast(isNew ? 'تم إضافة المنتج' : 'تم تحديث المنتج');
      onSaved();
    } catch (e: any) {
      toast(e.message || 'حدث خطأ', 'error');
    } finally {
      setSaving(false);
    }
  }

  function addVariant() {
    setVariants((v) => [
      ...v,
      {
        id: '',
        product_id: product?.id ?? '',
        size_id: null,
        color_id: null,
        barcode: '',
        sku: '',
        cost_price: 0,
        selling_price: Number(form.default_selling_price),
        last_cost_price: 0,
        is_active: true,
      },
    ]);
  }

  function updateVariant(idx: number, key: keyof ProductVariant, value: any) {
    setVariants((vs) => vs.map((v, i) => (i === idx ? { ...v, [key]: value } : v)));
  }

  function removeVariant(idx: number) {
    setVariants((vs) => vs.filter((_, i) => i !== idx));
  }

  return (
    <Modal open onClose={onClose} title={isNew ? 'إضافة منتج جديد' : 'تعديل المنتج'} size="xl">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mi-label">اسم المنتج (عربي) *</label>
          <input value={form.name_ar ?? ''} onChange={(e) => set('name_ar', e.target.value)} className="mi-input" />
        </div>
        <div>
          <label className="mi-label">Name (EN) *</label>
          <input value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} className="mi-input" dir="ltr" />
        </div>
        <div>
          <label className="mi-label">SKU (رمز الصنف) *</label>
          <input value={form.sku ?? ''} onChange={(e) => set('sku', e.target.value)} className="mi-input" dir="ltr" />
        </div>
        <div>
          <label className="mi-label">باركود افتراضي</label>
          <input value={form.barcode ?? ''} onChange={(e) => set('barcode', e.target.value)} className="mi-input" dir="ltr" />
        </div>
        <div>
          <label className="mi-label">التصنيف</label>
          <select value={form.category_id ?? ''} onChange={(e) => set('category_id', e.target.value)} className="mi-input">
            <option value="">اختر التصنيف...</option>
            {cat.categories.map((c) => <option key={c.id} value={c.id}>{c.name_ar ?? c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mi-label">الموسم</label>
          <select value={form.season_id ?? ''} onChange={(e) => set('season_id', e.target.value)} className="mi-input">
            <option value="">اختر الموسم...</option>
            {cat.seasons.map((s) => <option key={s.id} value={s.id}>{s.name_ar ?? s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mi-label">المورد</label>
          <select value={form.supplier_id ?? ''} onChange={(e) => set('supplier_id', e.target.value)} className="mi-input">
            <option value="">اختر المورد...</option>
            {cat.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mi-label">المصنع</label>
          <select value={form.manufacturer_id ?? ''} onChange={(e) => set('manufacturer_id', e.target.value)} className="mi-input">
            <option value="">اختر المصنع...</option>
            {cat.manufacturers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mi-label">رقم الموديل</label>
          <input value={form.model_number ?? ''} onChange={(e) => set('model_number', e.target.value)} className="mi-input" />
        </div>
        <div>
          <label className="mi-label">سعر البيع الافتراضي</label>
          <input type="number" value={form.default_selling_price ?? 0} onChange={(e) => set('default_selling_price', e.target.value)} className="mi-input" />
        </div>
      </div>

      <div className="mt-6 border-t pt-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-bold text-slate-700">المتغيرات (المقاسات والألوان)</h4>
          <button onClick={addVariant} className="mi-btn-secondary py-1 text-xs"><Plus size={14} /> إضافة متغير</button>
        </div>
        <div className="space-y-3">
          {variants.map((v, i) => (
            <div key={i} className="flex flex-wrap items-end gap-3 rounded-xl bg-slate-50 p-3">
              <div className="flex-1 min-w-[120px]">
                <label className="text-[10px] font-bold text-slate-400">المقاس</label>
                <select value={v.size_id ?? ''} onChange={(e) => updateVariant(i, 'size_id', e.target.value)} className="mi-input py-1 text-xs">
                  <option value="">—</option>
                  {cat.sizes.map((s) => <option key={s.id} value={s.id}>{s.name_ar ?? s.name}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="text-[10px] font-bold text-slate-400">اللون</label>
                <select value={v.color_id ?? ''} onChange={(e) => updateVariant(i, 'color_id', e.target.value)} className="mi-input py-1 text-xs">
                  <option value="">—</option>
                  {cat.colors.map((c) => <option key={c.id} value={c.id}>{c.name_ar ?? c.name}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[100px]">
                <label className="text-[10px] font-bold text-slate-400">الباركود</label>
                <input value={v.barcode ?? ''} onChange={(e) => updateVariant(i, 'barcode', e.target.value)} className="mi-input py-1 text-xs" />
              </div>
              <div className="w-24">
                <label className="text-[10px] font-bold text-slate-400">سعر البيع</label>
                <input type="number" value={v.selling_price} onChange={(e) => updateVariant(i, 'selling_price', e.target.value)} className="mi-input py-1 text-xs" />
              </div>
              <button onClick={() => removeVariant(i)} className="mb-1 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><X size={16} /></button>
            </div>
          ))}
          {variants.length === 0 && <p className="py-4 text-center text-sm text-slate-400 italic">لا توجد متغيرات لهذا المنتج. سيتم استخدام البيانات الافتراضية.</p>}
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button onClick={onClose} className="mi-btn-secondary">إلغاء</button>
        <button onClick={handleSave} disabled={saving} className="mi-btn-primary min-w-[140px]">
          {saving ? <Loader2 size={18} className="animate-spin" /> : isNew ? 'إضافة المنتج' : 'حفظ التعديلات'}
        </button>
      </div>
    </Modal>
  );
}

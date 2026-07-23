import { useEffect, useState, useCallback } from 'react';
import { Warehouse as WarehouseIcon, Plus, Pencil, Trash2, Loader2, MapPin, Phone } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { toast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import { useCan } from '@/lib/auth';
import type { Warehouse } from '@/lib/types';

export function WarehousesPage() {
  const { can } = useCan();
  const canManage = can('manage_warehouses');
  const [items, setItems] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Warehouse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('warehouses').select('*').order('created_at', { ascending: false });
    setItems((data as Warehouse[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    if (!confirmDelete) return;
    const { error } = await supabase.from('warehouses').delete().eq('id', confirmDelete.id);
    if (error) { toast(error.message, 'error'); return; }
    toast('تم حذف المخزن');
    load();
  }

  return (
    <div>
      <PageHeader
        title="المخازن"
        subtitle="إدارة المخازن المركزية — مصدر تسجيل المنتجات والتكلفة"
        icon={<WarehouseIcon size={22} />}
        actions={canManage && <button onClick={() => { setEditing(null); setShowModal(true); }} className="mi-btn-primary"><Plus size={18} /> مخزن جديد</button>}
      />

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-teal-600" /></div>
      ) : items.length === 0 ? (
        <EmptyState icon={<WarehouseIcon size={48} />} title="لا توجد مخازن" description="أضف مخزنك الأول لبدء إدارة المخزون." action={canManage && <button onClick={() => { setEditing(null); setShowModal(true); }} className="mi-btn-primary"><Plus size={18} /> إضافة مخزن</button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((w) => (
            <div key={w.id} className="mi-card p-5 animate-in">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <WarehouseIcon size={24} />
                </div>
                {canManage && (
                  <div className="flex gap-1.5">
                    <button onClick={() => { setEditing(w); setShowModal(true); }} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-teal-600"><Pencil size={16} /></button>
                    <button onClick={() => setConfirmDelete(w)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                )}
              </div>
              <h3 className="mt-3 font-bold text-slate-800">{w.name_ar ?? w.name}</h3>
              <p className="text-xs text-slate-400">كود: {w.code}</p>
              <div className="mt-3 space-y-1.5 text-sm text-slate-500">
                {w.address && <p className="flex items-center gap-2"><MapPin size={14} className="text-slate-400" /> {w.address}</p>}
                {w.phone && <p className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {w.phone}</p>}
              </div>
              <span className={`mi-badge mt-3 ${w.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {w.is_active ? 'نشط' : 'غير نشط'}
              </span>
            </div>
          ))}
        </div>
      )}

      {showModal && <WarehouseModal item={editing} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
      <ConfirmDialog open={!!confirmDelete} title="حذف المخزن" message={`حذف "${confirmDelete?.name_ar ?? confirmDelete?.name}"؟`} danger confirmText="حذف" onConfirm={handleDelete} onClose={() => setConfirmDelete(null)} />
    </div>
  );
}

function WarehouseModal({ item, onClose, onSaved }: { item: Warehouse | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Record<string, any>>(item ?? { name: '', name_ar: '', code: '', address: '', phone: '', is_active: true });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    try {
      if (!form.name || !form.code) { toast('الاسم والكود مطلوبان', 'error'); setSaving(false); return; }
      if (item) {
        const { error } = await supabase.from('warehouses').update(form).eq('id', item.id);
        if (error) throw error;
      } else {
        // Fetch company_id dynamically instead of hardcoding it
        const { data: company } = await supabase.from('companies').select('id').limit(1).maybeSingle();
        const { error } = await supabase.from('warehouses').insert({ ...form, company_id: company?.id ?? null });
        if (error) throw error;
      }
      toast(item ? 'تم التحديث' : 'تم الإضافة');
      onSaved();
    } catch (e: unknown) { toast(e instanceof Error ? e.message : 'حدث خطأ', 'error'); } finally { setSaving(false); }
  }

  return (
    <Modal open onClose={onClose} title={item ? 'تعديل مخزن' : 'مخزن جديد'}>
      <div className="space-y-4">
        <div><label className="mi-label">الاسم (عربي)</label><input value={form.name_ar ?? ''} onChange={(e) => set('name_ar', e.target.value)} className="mi-input" /></div>
        <div><label className="mi-label">Name (EN)</label><input value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} className="mi-input" dir="ltr" /></div>
        <div><label className="mi-label">الكود *</label><input value={form.code ?? ''} onChange={(e) => set('code', e.target.value)} className="mi-input" dir="ltr" /></div>
        <div><label className="mi-label">العنوان</label><input value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} className="mi-input" /></div>
        <div><label className="mi-label">الهاتف</label><input value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} className="mi-input" dir="ltr" /></div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="h-4 w-4 rounded text-teal-600" /> نشط</label>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} className="mi-btn-secondary">إلغاء</button>
        <button onClick={save} disabled={saving} className="mi-btn-primary">{saving ? <Loader2 size={16} className="animate-spin" /> : null} حفظ</button>
      </div>
    </Modal>
  );
}

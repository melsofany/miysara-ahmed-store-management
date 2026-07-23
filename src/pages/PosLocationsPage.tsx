import { useEffect, useState, useCallback } from 'react';
import { Store, Plus, Pencil, Trash2, Loader2, Link2, Users } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { toast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import { useCan } from '@/lib/auth';
import type { PosLocation, Warehouse, Profile } from '@/lib/types';

export function PosLocationsPage() {
  const { can } = useCan();
  const canManage = can('manage_pos');
  const [items, setItems] = useState<(PosLocation & { warehouse?: Warehouse })[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PosLocation | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<PosLocation | null>(null);
  const [manageUsers, setManageUsers] = useState<PosLocation | null>(null);
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data }, { data: wh }, { data: us }] = await Promise.all([
      supabase.from('pos_locations').select('*, warehouse:warehouses(*)').order('created_at', { ascending: false }),
      supabase.from('warehouses').select('*').eq('is_active', true),
      supabase.from('profiles').select('*').eq('is_active', true),
    ]);
    setItems((data as (PosLocation & { warehouse?: Warehouse })[]) ?? []);
    setWarehouses((wh as Warehouse[]) ?? []);
    setUsers((us as Profile[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    if (!confirmDelete) return;
    const { error } = await supabase.from('pos_locations').delete().eq('id', confirmDelete.id);
    if (error) { toast(error.message, 'error'); return; }
    toast('تم حذف نقطة البيع');
    load();
  }

  async function openManageUsers(pos: PosLocation) {
    setManageUsers(pos);
    const { data } = await supabase.from('user_pos_locations').select('user_id').eq('pos_location_id', pos.id);
    setAssignedUserIds((data ?? []).map((d: any) => d.user_id));
  }

  async function toggleUser(userId: string) {
    if (!manageUsers) return;
    if (assignedUserIds.includes(userId)) {
      await supabase.from('user_pos_locations').delete().eq('user_id', userId).eq('pos_location_id', manageUsers.id);
      setAssignedUserIds((ids) => ids.filter((id) => id !== userId));
    } else {
      await supabase.from('user_pos_locations').insert({ user_id: userId, pos_location_id: manageUsers.id });
      setAssignedUserIds((ids) => [...ids, userId]);
    }
  }

  return (
    <div>
      <PageHeader
        title="نقاط البيع"
        subtitle="إنشاء وإدارة نقاط البيع (الكاشير) وربطها بالمخازن والمستخدمين"
        icon={<Store size={22} />}
        actions={canManage && <button onClick={() => { setEditing(null); setShowModal(true); }} className="mi-btn-primary"><Plus size={18} /> نقطة بيع جديدة</button>}
      />

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-teal-600" /></div>
      ) : items.length === 0 ? (
        <EmptyState icon={<Store size={48} />} title="لا توجد نقاط بيع" description="أنشئ نقطة بيع لبدء عمليات البيع." action={canManage && <button onClick={() => { setEditing(null); setShowModal(true); }} className="mi-btn-primary"><Plus size={18} /> إنشاء نقطة بيع</button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <div key={p.id} className="mi-card p-5 animate-in">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><Store size={24} /></div>
                {canManage && (
                  <div className="flex gap-1.5">
                    <button onClick={() => openManageUsers(p)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600" title="المستخدمون"><Users size={16} /></button>
                    <button onClick={() => { setEditing(p); setShowModal(true); }} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-teal-600"><Pencil size={16} /></button>
                    <button onClick={() => setConfirmDelete(p)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                )}
              </div>
              <h3 className="mt-3 font-bold text-slate-800">{p.name_ar ?? p.name}</h3>
              <p className="text-xs text-slate-400">كود: {p.code}</p>
              <div className="mt-3 space-y-1.5 text-sm text-slate-500">
                <p className="flex items-center gap-2"><Link2 size={14} className="text-slate-400" /> المخزن: {p.warehouse?.name_ar ?? p.warehouse?.name ?? 'غير محدد'}</p>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className={`mi-badge ${p.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{p.is_active ? 'نشط' : 'غير نشط'}</span>
                {p.allow_sell_out_of_stock && <span className="mi-badge bg-amber-50 text-amber-600">بيع بدون مخزون</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <PosModal item={editing} warehouses={warehouses} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}

      <ConfirmDialog open={!!confirmDelete} title="حذف نقطة البيع" message={`حذف "${confirmDelete?.name_ar ?? confirmDelete?.name}"؟`} danger confirmText="حذف" onConfirm={handleDelete} onClose={() => setConfirmDelete(null)} />

      <Modal open={!!manageUsers} onClose={() => setManageUsers(null)} title={`مستخدمو: ${manageUsers?.name_ar ?? manageUsers?.name}`} size="md">
        <div className="space-y-2">
          {users.map((u) => (
            <label key={u.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50">
              <input type="checkbox" checked={assignedUserIds.includes(u.id)} onChange={() => toggleUser(u.id)} className="h-4 w-4 rounded text-teal-600" />
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">{u.full_name.charAt(0)}</div>
              <div><p className="text-sm font-semibold text-slate-700">{u.full_name}</p><p className="text-xs text-slate-400">{u.email}</p></div>
            </label>
          ))}
          {users.length === 0 && <p className="py-6 text-center text-sm text-slate-400">لا يوجد مستخدمون.</p>}
        </div>
      </Modal>
    </div>
  );
}

function PosModal({ item, warehouses, onClose, onSaved }: { item: PosLocation | null; warehouses: Warehouse[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Record<string, any>>(item ?? { name: '', name_ar: '', code: '', warehouse_id: '', allow_sell_out_of_stock: false, is_active: true });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    try {
      if (!form.name || !form.code) { toast('الاسم والكود مطلوبان', 'error'); setSaving(false); return; }
      const payload = { ...form, warehouse_id: form.warehouse_id || null };
      if (item) {
        const { error } = await supabase.from('pos_locations').update(payload).eq('id', item.id);
        if (error) throw error;
      } else {
        // Fetch company_id dynamically instead of hardcoding it
        const { data: company } = await supabase.from('companies').select('id').limit(1).maybeSingle();
        const { error } = await supabase.from('pos_locations').insert({ ...payload, company_id: company?.id ?? null });
        if (error) throw error;
      }
      toast(item ? 'تم التحديث' : 'تم الإضافة');
      onSaved();
    } catch (e: unknown) { toast(e instanceof Error ? e.message : 'حدث خطأ', 'error'); } finally { setSaving(false); }
  }

  return (
    <Modal open onClose={onClose} title={item ? 'تعديل نقطة بيع' : 'نقطة بيع جديدة'}>
      <div className="space-y-4">
        <div><label className="mi-label">الاسم (عربي)</label><input value={form.name_ar ?? ''} onChange={(e) => set('name_ar', e.target.value)} className="mi-input" /></div>
        <div><label className="mi-label">Name (EN)</label><input value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} className="mi-input" dir="ltr" /></div>
        <div><label className="mi-label">الكود *</label><input value={form.code ?? ''} onChange={(e) => set('code', e.target.value)} className="mi-input" dir="ltr" /></div>
        <div><label className="mi-label">المخزن المرتبط</label><select value={form.warehouse_id ?? ''} onChange={(e) => set('warehouse_id', e.target.value)} className="mi-input"><option value="">—</option>{warehouses.map((w) => <option key={w.id} value={w.id}>{w.name_ar ?? w.name}</option>)}</select></div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.allow_sell_out_of_stock} onChange={(e) => set('allow_sell_out_of_stock', e.target.checked)} className="h-4 w-4 rounded text-teal-600" /> السماح بالبيع بدون مخزون</label>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="h-4 w-4 rounded text-teal-600" /> نشط</label>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} className="mi-btn-secondary">إلغاء</button>
        <button onClick={save} disabled={saving} className="mi-btn-primary">{saving ? <Loader2 size={16} className="animate-spin" /> : null} حفظ</button>
      </div>
    </Modal>
  );
}

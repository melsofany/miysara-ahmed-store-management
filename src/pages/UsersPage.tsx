import { useEffect, useState, useCallback } from 'react';
import { Users as UsersIcon, Plus, Loader2, Shield, KeyRound } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { EmptyState } from '@/components/EmptyState';
import { toast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import { useCan } from '@/lib/auth';
import type { Profile, Role } from '@/lib/types';

export function UsersPage() {
  const { can } = useCan();
  const canManage = can('manage_users');
  const [users, setUsers] = useState<(Profile & { role?: Role })[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: us }, { data: rs }] = await Promise.all([
      supabase.from('profiles').select('*, role:roles(*)').order('created_at', { ascending: false }),
      supabase.from('roles').select('*').order('name'),
    ]);
    setUsers((us as (Profile & { role?: Role })[]) ?? []);
    setRoles((rs as Role[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const roleLabel: Record<string, string> = {
    super_admin: 'مدير عام', system_manager: 'مدير النظام', warehouse_manager: 'مدير مخزن',
    warehouse_user: 'مستخدم مخزن', pos_manager: 'مدير نقطة بيع', cashier: 'كاشير',
  };

  async function handleUpdateRole(userId: string, roleId: string, canViewCost: boolean, isActive: boolean) {
    const { error } = await supabase.from('profiles').update({ role_id: roleId || null, can_view_cost: canViewCost, is_active: isActive }).eq('id', userId);
    if (error) { toast(error.message, 'error'); return; }
    toast('تم تحديث المستخدم');
    load();
  }

  return (
    <div>
      <PageHeader title="المستخدمون" subtitle="إدارة مستخدمي النظام وأدوارهم" icon={<UsersIcon size={22} />} actions={canManage && <button onClick={() => setShowCreate(true)} className="mi-btn-primary"><Plus size={18} /> مستخدم جديد</button>} />

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-teal-600" /></div>
      ) : users.length === 0 ? (
        <EmptyState icon={<UsersIcon size={48} />} title="لا يوجد مستخدمون" />
      ) : (
        <div className="mi-card divide-y divide-slate-100">
          {users.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-4 hover:bg-slate-50">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-100 font-bold text-teal-700">{u.full_name.charAt(0)}</div>
              <div className="flex-1">
                <p className="font-bold text-slate-800">{u.full_name}</p>
                <p className="text-xs text-slate-400" dir="ltr">{u.email}</p>
              </div>
              {canManage ? (
                <div className="flex flex-wrap items-center gap-2">
                  <select value={u.role_id ?? ''} onChange={(e) => handleUpdateRole(u.id, e.target.value, u.can_view_cost, u.is_active)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm">
                    <option value="">بدون دور</option>
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.name_ar ?? r.name}</option>)}
                  </select>
                  <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <input type="checkbox" checked={u.can_view_cost} onChange={(e) => handleUpdateRole(u.id, u.role_id ?? '', e.target.checked, u.is_active)} className="h-4 w-4 rounded text-teal-600" /> رؤية التكلفة
                  </label>
                  <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <input type="checkbox" checked={u.is_active} onChange={(e) => handleUpdateRole(u.id, u.role_id ?? '', u.can_view_cost, e.target.checked)} className="h-4 w-4 rounded text-teal-600" /> نشط
                  </label>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className={`mi-badge ${u.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {u.is_active ? 'نشط' : 'موقوف'}
                  </span>
                  <span className="mi-badge bg-slate-100 text-slate-600 flex items-center gap-1">
                    <Shield size={12} />
                    {u.role ? (roleLabel[u.role.key] ?? u.role.name_ar ?? u.role.name) : 'بدون دور'}
                  </span>
                </div>
              )}
              {canManage && (
                <span className="mi-badge bg-slate-100 text-slate-600 flex items-center gap-1">
                  <KeyRound size={12} />
                  {u.role ? (roleLabel[u.role.key] ?? u.role.name_ar ?? u.role.name) : 'بدون دور'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateUserModal
          roles={roles}
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); load(); }}
        />
      )}
    </div>
  );
}

function CreateUserModal({ roles, onClose, onSaved }: { roles: Role[]; onClose: () => void; onSaved: () => void }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [canViewCost, setCanViewCost] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!fullName || !email || !password) {
      toast('جميع الحقول مطلوبة', 'error');
      return;
    }
    setSaving(true);
    try {
      const { data: company } = await supabase.from('companies').select('id').limit(1).maybeSingle();
      const companyId = company?.id ?? null;

      const { error } = await supabase.auth.createEmployee({
        email,
        password,
        fullName,
        roleId: roleId || null,
        companyId,
        canViewCost,
      });
      if (error) throw error;

      toast('تم إنشاء المستخدم بنجاح. أرسل له بيانات الدخول.');
      onSaved();
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'حدث خطأ', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="مستخدم جديد">
      <div className="space-y-4">
        <div><label className="mi-label">الاسم الكامل</label><input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mi-input" /></div>
        <div><label className="mi-label">البريد الإلكتروني</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mi-input" dir="ltr" /></div>
        <div><label className="mi-label">كلمة المرور</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mi-input" dir="ltr" /></div>
        <div><label className="mi-label">الدور</label>
          <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="mi-input">
            <option value="">بدون دور</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name_ar ?? r.name}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input type="checkbox" checked={canViewCost} onChange={(e) => setCanViewCost(e.target.checked)} className="h-4 w-4 rounded text-teal-600" />
          صلاحية رؤية أسعار التكلفة
        </label>
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
          سيتمكن الموظف من الدخول بالحساب الذي تنشئه الإدارة فقط.
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} className="mi-btn-secondary">إلغاء</button>
        <button onClick={save} disabled={saving} className="mi-btn-primary">
          {saving ? <Loader2 size={16} className="animate-spin" /> : null} إنشاء
        </button>
      </div>
    </Modal>
  );
}

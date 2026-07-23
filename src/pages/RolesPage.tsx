import { useEffect, useState, useCallback, Fragment } from 'react';
import { ShieldCheck, Loader2, Check, X } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { toast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import { useCan } from '@/lib/auth';
import type { Role, Permission } from '@/lib/types';

interface RolePermissionJoin {
  role_id: string;
  permission_id: string;
}

export function RolesPage() {
  const { can } = useCan();
  const canManage = can('manage_roles');
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePerms, setRolePerms] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: rs }, { data: ps }, { data: rp }] = await Promise.all([
      supabase.from('roles').select('*').order('name'),
      supabase.from('permissions').select('*').order('module'),
      supabase.from('role_permissions').select('role_id, permission_id'),
    ]);
    const rolesList = (rs as Role[]) ?? [];
    const permsList = (ps as Permission[]) ?? [];
    setRoles(rolesList);
    setPermissions(permsList);
    const permIdMap = new Map(permsList.map((p) => [p.id, p.key]));
    const map: Record<string, Set<string>> = {};
    ((rp as RolePermissionJoin[]) ?? []).forEach((r) => {
      if (!map[r.role_id]) map[r.role_id] = new Set();
      const key = permIdMap.get(r.permission_id);
      if (key) map[r.role_id].add(key);
    });
    setRolePerms(map);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function togglePerm(roleId: string, permId: string, permKey: string, enable: boolean) {
    if (enable) {
      const { error } = await supabase.from('role_permissions').insert({ role_id: roleId, permission_id: permId });
      if (error) { toast(error.message, 'error'); return; }
      setRolePerms((m) => ({ ...m, [roleId]: new Set([...(m[roleId] ?? []), permKey]) }));
    } else {
      const { error } = await supabase.from('role_permissions').delete().eq('role_id', roleId).eq('permission_id', permId);
      if (error) { toast(error.message, 'error'); return; }
      setRolePerms((m) => { const s = new Set(m[roleId] ?? []); s.delete(permKey); return { ...m, [roleId]: s }; });
    }
  }

  const modules = [...new Set(permissions.map((p) => p.module))];

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-teal-600" /></div>;

  return (
    <div>
      <PageHeader title="الأدوار والصلاحيات" subtitle="مصفوفة الصلاحيات — حدد ما يمكن لكل دور فعله" icon={<ShieldCheck size={22} />} />

      <div className="mi-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-right text-xs text-slate-500">
            <tr>
              <th className="sticky right-0 bg-slate-50 px-4 py-3 font-semibold">الصلاحية</th>
              {roles.map((r) => (
                <th key={r.id} className="px-3 py-3 text-center font-semibold">
                  <p>{r.name_ar ?? r.name}</p>
                  {r.is_system && <span className="text-[10px] text-slate-400">نظام</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {modules.map((mod) => (
              <Fragment key={mod}>
                <tr className="bg-slate-50/50">
                  <td colSpan={roles.length + 1} className="px-4 py-2 text-xs font-bold text-slate-500 uppercase">{mod}</td>
                </tr>
                {permissions.filter((p) => p.module === mod).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="sticky right-0 bg-white px-4 py-3 font-semibold text-slate-700">{p.name_ar ?? p.name}</td>
                    {roles.map((r) => {
                      const has = r.key === 'super_admin' || (rolePerms[r.id]?.has(p.key) ?? false);
                      const canEdit = canManage && r.key !== 'super_admin';
                      return (
                        <td key={r.id} className="px-3 py-3 text-center">
                          {r.key === 'super_admin' ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-teal-700"><Check size={14} /></span>
                          ) : canEdit ? (
                            <button onClick={() => togglePerm(r.id, p.id, p.key, !has)} className={`inline-flex h-6 w-6 items-center justify-center rounded-full transition ${has ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'}`}>
                              {has ? <Check size={14} /> : <X size={14} />}
                            </button>
                          ) : (
                            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${has ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-300'}`}>{has ? <Check size={14} /> : <X size={14} />}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

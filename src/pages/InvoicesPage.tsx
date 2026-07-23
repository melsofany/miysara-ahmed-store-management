import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, Loader2, Eye, Ban } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { SearchInput, FilterBar, Field } from '@/components/Form';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { toast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import { useCan, useAuth } from '@/lib/auth';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { Invoice, PosLocation, Profile, Payment } from '@/lib/types';

const statusLabels: Record<string, string> = {
  open: 'مفتوحة',
  paid: 'مدفوعة',
  cancelled: 'ملغاة',
  partially_returned: 'مرتجع جزئي',
  returned: 'مرتجعة',
};
const statusColors: Record<string, string> = {
  open: 'bg-slate-100 text-slate-600',
  paid: 'bg-green-50 text-green-600',
  cancelled: 'bg-red-50 text-red-600',
  partially_returned: 'bg-amber-50 text-amber-600',
  returned: 'bg-rose-50 text-rose-600',
};

export function InvoicesPage() {
  const navigate = useNavigate();
  const { can } = useCan();
  const { profile } = useAuth();
  const canCancel = can('cancel_invoices');
  const [invoices, setInvoices] = useState<(Invoice & { pos_location?: PosLocation; cashier?: Profile; payments?: Payment[] })[]>([]);
  const [posList, setPosList] = useState<PosLocation[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ pos: '', cashier: '', status: '', method: '', from: '', to: '' });
  const [cancelTarget, setCancelTarget] = useState<Invoice | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('invoices')
      .select('*, pos_location:pos_locations(*), cashier:profiles(*), payments(*)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (filters.pos) q = q.eq('pos_location_id', filters.pos);
    if (filters.cashier) q = q.eq('cashier_id', filters.cashier);
    if (filters.status) q = q.eq('status', filters.status);
    if (filters.from) q = q.gte('created_at', filters.from);
    if (filters.to) q = q.lte('created_at', filters.to + 'T23:59:59');
    if (search) q = q.or(`invoice_number.ilike.%${search}%`);
    const { data } = await q;
    setInvoices((data as (Invoice & { pos_location?: PosLocation; cashier?: Profile; payments?: Payment[] })[]) ?? []);

    const [{ data: pos }, { data: us }] = await Promise.all([
      supabase.from('pos_locations').select('*'),
      supabase.from('profiles').select('*'),
    ]);
    setPosList((pos as PosLocation[]) ?? []);
    setUsers((us as Profile[]) ?? []);
    setLoading(false);
  }, [filters, search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function handleCancel() {
    if (!cancelTarget || !profile) return;
    const { error } = await supabase.from('invoices').update({ status: 'cancelled' }).eq('id', cancelTarget.id);
    if (error) { toast(error.message, 'error'); return; }
    await supabase.from('audit_logs').insert({
      user_id: profile.id,
      action: 'cancel_invoice',
      entity: 'invoices',
      entity_id: cancelTarget.id,
      old_values: { status: cancelTarget.status },
      new_values: { status: 'cancelled' },
    });
    toast('تم إلغاء الفاتورة');
    load();
  }

  return (
    <div>
      <PageHeader title="الفواتير" subtitle="بحث وعرض جميع الفواتير" icon={<Receipt size={22} />} />

      <FilterBar>
        <div className="flex-1 min-w-[200px]"><SearchInput value={search} onChange={setSearch} placeholder="رقم الفاتورة..." /></div>
        <Field label="نقطة البيع"><select value={filters.pos} onChange={(e) => setFilters((f) => ({ ...f, pos: e.target.value }))} className="mi-input"><option value="">الكل</option>{posList.map((p) => <option key={p.id} value={p.id}>{p.name_ar ?? p.name}</option>)}</select></Field>
        <Field label="الكاشير"><select value={filters.cashier} onChange={(e) => setFilters((f) => ({ ...f, cashier: e.target.value }))} className="mi-input"><option value="">الكل</option>{users.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}</select></Field>
        <Field label="الحالة"><select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className="mi-input"><option value="">الكل</option>{Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <Field label="طريقة الدفع"><select value={filters.method} onChange={(e) => setFilters((f) => ({ ...f, method: e.target.value }))} className="mi-input"><option value="">الكل</option><option value="cash">نقدي</option><option value="card">بطاقة</option><option value="bank">تحويل</option><option value="e_wallet">محفظة</option></select></Field>
        <Field label="من"><input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} className="mi-input" /></Field>
        <Field label="إلى"><input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} className="mi-input" /></Field>
      </FilterBar>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-teal-600" /></div>
      ) : invoices.length === 0 ? (
        <EmptyState icon={<Receipt size={48} />} title="لا توجد فواتير" description="لم يتم العثور على فواتير مطابقة." />
      ) : (
        <div className="mi-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-right text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">رقم الفاتورة</th>
                <th className="px-4 py-3 font-semibold">نقطة البيع</th>
                <th className="px-4 py-3 font-semibold">الكاشير</th>
                <th className="px-4 py-3 font-semibold">الإجمالي</th>
                <th className="px-4 py-3 font-semibold">الحالة</th>
                <th className="px-4 py-3 font-semibold">التاريخ</th>
                <th className="px-4 py-3 font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.filter((inv) => !filters.method || (inv.payments ?? []).some((p) => p.method === filters.method)).map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-700" dir="ltr">{inv.invoice_number}</td>
                  <td className="px-4 py-3 text-slate-600">{inv.pos_location?.name_ar ?? inv.pos_location?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{inv.cashier?.full_name ?? '—'}</td>
                  <td className="px-4 py-3 font-bold text-teal-700">{formatCurrency(inv.total)}</td>
                  <td className="px-4 py-3"><span className={`mi-badge ${statusColors[inv.status]}`}>{statusLabels[inv.status]}</span></td>
                  <td className="px-4 py-3 text-xs text-slate-400">{formatDateTime(inv.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => navigate(`/invoices/${inv.id}`)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-teal-600" title="عرض"><Eye size={16} /></button>
                      {canCancel && inv.status === 'paid' && (
                        <button onClick={() => setCancelTarget(inv)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" title="إلغاء"><Ban size={16} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog open={!!cancelTarget} title="إلغاء الفاتورة" message={`إلغاء الفاتورة ${cancelTarget?.invoice_number}؟ سيتم تسجيل العملية في سجل التدقيق.`} danger confirmText="إلغاء الفاتورة" onConfirm={handleCancel} onClose={() => setCancelTarget(null)} />
    </div>
  );
}

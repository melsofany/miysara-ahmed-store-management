import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Undo2, Loader2, Eye } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { SearchInput } from '@/components/Form';
import { EmptyState } from '@/components/EmptyState';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { InvoiceReturn, Invoice, Profile, PosLocation } from '@/lib/types';

export function ReturnsPage() {
  const navigate = useNavigate();
  const [returns, setReturns] = useState<(InvoiceReturn & { original_invoice?: Invoice; user?: Profile; pos_location?: PosLocation })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('invoice_returns')
      .select('*, original_invoice:invoices(*), user:profiles(*), pos_location:pos_locations(*)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (search) q = q.or(`return_number.ilike.%${search}%`);
    const { data } = await q;
    setReturns((data as (InvoiceReturn & { original_invoice?: Invoice; user?: Profile; pos_location?: PosLocation })[]) ?? []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <PageHeader title="المرتجعات" subtitle="سجل جميع مرتجعات الفواتير" icon={<Undo2 size={22} />} />

      <div className="mb-4 max-w-md"><SearchInput value={search} onChange={setSearch} placeholder="رقم المرتجع..." /></div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-teal-600" /></div>
      ) : returns.length === 0 ? (
        <EmptyState icon={<Undo2 size={48} />} title="لا توجد مرتجعات" description="لم يتم تسجيل أي مرتجعات بعد." />
      ) : (
        <div className="mi-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-right text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">رقم المرتجع</th>
                <th className="px-4 py-3 font-semibold">الفاتورة الأصلية</th>
                <th className="px-4 py-3 font-semibold">النوع</th>
                <th className="px-4 py-3 font-semibold">المبلغ</th>
                <th className="px-4 py-3 font-semibold">المستخدم</th>
                <th className="px-4 py-3 font-semibold">السبب</th>
                <th className="px-4 py-3 font-semibold">التاريخ</th>
                <th className="px-4 py-3 font-semibold">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {returns.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-700" dir="ltr">{r.return_number}</td>
                  <td className="px-4 py-3 text-slate-600" dir="ltr">{r.original_invoice?.invoice_number ?? '—'}</td>
                  <td className="px-4 py-3"><span className={`mi-badge ${r.type === 'full' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>{r.type === 'full' ? 'كامل' : 'جزئي'}</span></td>
                  <td className="px-4 py-3 font-bold text-red-600">{formatCurrency(r.total)}</td>
                  <td className="px-4 py-3 text-slate-600">{r.user?.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{r.reason ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{formatDateTime(r.created_at)}</td>
                  <td className="px-4 py-3">
                    {r.original_invoice_id && (
                      <button onClick={() => navigate(`/invoices/${r.original_invoice_id}`)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-teal-600"><Eye size={16} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

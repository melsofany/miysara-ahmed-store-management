import { useEffect, useState, useCallback } from 'react';
import { Banknote, Loader2, Wallet, TrendingDown, TrendingUp, Clock } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { EmptyState } from '@/components/EmptyState';
import { toast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import { useCan, useAuth } from '@/lib/auth';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { StatCard } from '@/components/StatCard';
import type { CashShift, PosLocation, Profile } from '@/lib/types';

type CashShiftWithRelations = CashShift & { pos_location: PosLocation | null; user: Profile | null };

export function ShiftsPage() {
  const { can } = useCan();
  const { profile } = useAuth();
  const canManage = can('manage_shifts');
  const [shifts, setShifts] = useState<CashShiftWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [closeTarget, setCloseTarget] = useState<CashShift | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('cash_shifts')
      .select('*, pos_location:pos_locations(*), user:profiles(*)')
      .order('opened_at', { ascending: false })
      .limit(100);
    setShifts((data as CashShiftWithRelations[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleClose(actualCash: number, notes: string) {
    if (!closeTarget) return;
    const expected = Number(closeTarget.opening_cash) + Number(closeTarget.cash_sales) - Number(closeTarget.cash_refunds) - Number(closeTarget.cash_expenses);
    const diff = actualCash - expected;
    const { error } = await supabase.from('cash_shifts').update({
      actual_cash: actualCash,
      expected_cash: expected,
      difference: diff,
      status: 'closed',
      closed_at: new Date().toISOString(),
      notes,
    }).eq('id', closeTarget.id);
    if (error) { toast(error.message, 'error'); return; }
    await supabase.from('audit_logs').insert({
      user_id: profile?.id ?? null,
      action: 'close_shift',
      entity: 'cash_shifts',
      entity_id: closeTarget.id,
      new_values: { expected_cash: expected, actual_cash: actualCash, difference: diff },
    });
    toast(diff === 0 ? 'تم إغلاق الشفت — لا يوجد فرق' : diff > 0 ? `تم الإغلاق — زيادة ${formatCurrency(diff)}` : `تم الإغلاق — عجز ${formatCurrency(Math.abs(diff))}`);
    setCloseTarget(null);
    load();
  }

  const openShifts = shifts.filter((s) => s.status === 'open');

  return (
    <div>
      <PageHeader title="الشفتات والدرج" subtitle="إدارة شفتات الكاشير والدرج النقدي" icon={<Banknote size={22} />} />

      {openShifts.length > 0 && (
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {openShifts.map((s) => (
            <div key={s.id} className="mi-card border-green-200 p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="mi-badge bg-green-50 text-green-600"><Clock size={11} /> شفت مفتوح</span>
                {canManage && <button onClick={() => setCloseTarget(s)} className="mi-btn-primary text-xs">إغلاق الشفت</button>}
              </div>
              <p className="font-bold text-slate-700">{s.pos_location?.name_ar ?? s.pos_location?.name}</p>
              <p className="text-sm text-slate-400">{s.user?.full_name}</p>
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">افتتاح</span><span className="font-semibold">{formatCurrency(s.opening_cash)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">مبيعات نقدية</span><span className="font-semibold text-green-600">{formatCurrency(s.cash_sales)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">مبيعات بطاقات</span><span className="font-semibold">{formatCurrency(s.card_sales)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">مرتجعات</span><span className="font-semibold text-red-600">{formatCurrency(s.cash_refunds)}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 className="mb-3 text-lg font-bold text-slate-700">جميع الشفتات</h3>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-teal-600" /></div>
      ) : shifts.length === 0 ? (
        <EmptyState icon={<Banknote size={48} />} title="لا توجد شفتات" description="لم يتم فتح أي شفتات بعد." />
      ) : (
        <div className="mi-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-right text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">رقم الشفت</th>
                <th className="px-4 py-3 font-semibold">نقطة البيع</th>
                <th className="px-4 py-3 font-semibold">المستخدم</th>
                <th className="px-4 py-3 font-semibold">افتتاح</th>
                <th className="px-4 py-3 font-semibold">نقدي</th>
                <th className="px-4 py-3 font-semibold">بطاقة</th>
                <th className="px-4 py-3 font-semibold">متوقع</th>
                <th className="px-4 py-3 font-semibold">فعلي</th>
                <th className="px-4 py-3 font-semibold">الفرق</th>
                <th className="px-4 py-3 font-semibold">الحالة</th>
                <th className="px-4 py-3 font-semibold">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shifts.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-700" dir="ltr">{s.shift_number}</td>
                  <td className="px-4 py-3 text-slate-600">{s.pos_location?.name_ar ?? s.pos_location?.name}</td>
                  <td className="px-4 py-3 text-slate-600">{s.user?.full_name}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(s.opening_cash)}</td>
                  <td className="px-4 py-3 text-green-600">{formatCurrency(s.cash_sales)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(s.card_sales)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(s.expected_cash)}</td>
                  <td className="px-4 py-3 text-slate-600">{s.actual_cash !== null ? formatCurrency(s.actual_cash) : '—'}</td>
                  <td className="px-4 py-3">
                    {s.status === 'closed' ? (
                      <span className={s.difference === 0 ? 'text-green-600' : s.difference > 0 ? 'text-blue-600' : 'text-red-600'}>
                        {s.difference > 0 ? '+' : ''}{formatCurrency(s.difference)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3"><span className={`mi-badge ${s.status === 'open' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-600'}`}>{s.status === 'open' ? 'مفتوح' : 'مغلق'}</span></td>
                  <td className="px-4 py-3 text-xs text-slate-400">{formatDateTime(s.opened_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {closeTarget && <CloseShiftModal shift={closeTarget} onClose={() => setCloseTarget(null)} onConfirm={handleClose} />}
    </div>
  );
}

function CloseShiftModal({ shift, onClose, onConfirm }: { shift: CashShift; onClose: () => void; onConfirm: (actual: number, notes: string) => void }) {
  const expected = Number(shift.opening_cash) + Number(shift.cash_sales) - Number(shift.cash_refunds) - Number(shift.cash_expenses);
  const [actual, setActual] = useState(expected);
  const [notes, setNotes] = useState('');
  const diff = actual - expected;

  return (
    <Modal open onClose={onClose} title="إغلاق الشفت" size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="افتتاح الشفت" value={formatCurrency(shift.opening_cash)} icon={<Wallet size={18} />} accent="slate" />
          <StatCard label="مبيعات نقدية" value={formatCurrency(shift.cash_sales)} icon={<Banknote size={18} />} accent="teal" />
          <StatCard label="مبيعات بطاقات" value={formatCurrency(shift.card_sales)} icon={<Banknote size={18} />} accent="blue" />
          <StatCard label="مرتجعات نقدية" value={formatCurrency(shift.cash_refunds)} icon={<TrendingDown size={18} />} accent="rose" />
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <div className="flex justify-between text-sm"><span className="text-slate-500">النقدية المتوقعة</span><span className="font-bold text-slate-700">{formatCurrency(expected)}</span></div>
        </div>

        <div>
          <label className="mi-label">النقدية الفعلية (عدّ الكاشير)</label>
          <input type="number" step="0.01" value={actual} onChange={(e) => setActual(Number(e.target.value))} className="mi-input text-lg font-bold" dir="ltr" autoFocus />
        </div>

        <div className={`rounded-xl p-4 ${diff === 0 ? 'bg-green-50' : diff > 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold">
              {diff > 0 ? <TrendingUp size={16} className="text-blue-600" /> : diff < 0 ? <TrendingDown size={16} className="text-red-600" /> : <Banknote size={16} className="text-green-600" />}
              الفرق
            </span>
            <span className={`text-lg font-extrabold ${diff === 0 ? 'text-green-600' : diff > 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {diff > 0 ? 'زيادة ' : diff < 0 ? 'عجز ' : ''}{formatCurrency(Math.abs(diff))}
            </span>
          </div>
        </div>

        <div><label className="mi-label">ملاحظات</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mi-input" rows={2} /></div>

        <button onClick={() => onConfirm(actual, notes)} className="mi-btn-primary w-full">تأكيد إغلاق الشفت</button>
      </div>
    </Modal>
  );
}

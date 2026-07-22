import { useEffect, useState } from 'react';
import { BarChart3, Loader2, TrendingUp, Package, DollarSign, Users, Download } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar, Field } from '@/components/Form';
import { StatCard } from '@/components/StatCard';
import { EmptyState } from '@/components/EmptyState';
import { supabase } from '@/lib/supabase';
import { useCan } from '@/lib/auth';
import { rangePreset } from '@/lib/reporting';
import { formatCurrency, formatNumber } from '@/lib/format';
import type { PosLocation, Profile } from '@/lib/types';

type ReportType = 'sales' | 'products' | 'profit' | 'cashier';

export function ReportsPage() {
  const { can } = useCan();
  const canViewProfit = can('view_profit_reports');
  const [type, setType] = useState<ReportType>('sales');
  const [preset, setPreset] = useState('month');
  const [posId, setPosId] = useState('');
  const [posList, setPosList] = useState<PosLocation[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total: 0, count: 0, profit: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('pos_locations').select('*').then(({ data }) => setPosList((data as PosLocation[]) ?? []));
    supabase.from('profiles').select('*').then(({ data }) => setUsers((data as Profile[]) ?? []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const range = rangePreset(preset);
    (async () => {
      let q = supabase
        .from('invoices')
        .select('id, pos_location_id, cashier_id, total, discount_amount, status, created_at')
        .gte('created_at', range.from)
        .lte('created_at', range.to)
        .in('status', ['paid', 'partially_returned']);
      if (posId) q = q.eq('pos_location_id', posId);
      const { data: invoices } = await q;

      const invoiceIds = (invoices ?? []).map((i) => i.id);
      const { data: items } = await supabase
        .from('invoice_items')
        .select('product_name, quantity, unit_price, unit_cost_price, line_total, invoice_id, product_variant_id')
        .in('invoice_id', invoiceIds.length ? invoiceIds : ['00000000-0000-0000-0000-000000000000']);

      const posMap = new Map(posList.map((p) => [p.id, p]));
      const userMap = new Map(users.map((u) => [u.id, u]));

      const totalSales = (invoices ?? []).reduce((s, i) => s + Number(i.total), 0);
      const profit = (items ?? []).reduce((s, it) => s + (Number(it.unit_price) - Number(it.unit_cost_price)) * Number(it.quantity), 0);
      setSummary({ total: totalSales, count: invoices?.length ?? 0, profit });

      let rows: any[] = [];
      if (type === 'sales') {
        const agg = new Map<string, { name: string; total: number; count: number }>();
        (invoices ?? []).forEach((inv) => {
          const name = posMap.get(inv.pos_location_id)?.name_ar ?? '—';
          const cur = agg.get(inv.pos_location_id) ?? { name, total: 0, count: 0 };
          cur.total += Number(inv.total); cur.count += 1;
          agg.set(inv.pos_location_id, cur);
        });
        rows = Array.from(agg.values()).sort((a, b) => b.total - a.total);
      } else if (type === 'products') {
        const agg = new Map<string, { name: string; qty: number; total: number }>();
        (items ?? []).forEach((it) => {
          const cur = agg.get(it.product_name) ?? { name: it.product_name, qty: 0, total: 0 };
          cur.qty += Number(it.quantity); cur.total += Number(it.line_total);
          agg.set(it.product_name, cur);
        });
        rows = Array.from(agg.values()).sort((a, b) => b.qty - a.qty);
      } else if (type === 'profit') {
        const agg = new Map<string, { name: string; revenue: number; cost: number; profit: number; qty: number }>();
        (items ?? []).forEach((it) => {
          const revenue = Number(it.unit_price) * Number(it.quantity);
          const cost = Number(it.unit_cost_price) * Number(it.quantity);
          const cur = agg.get(it.product_name) ?? { name: it.product_name, revenue: 0, cost: 0, profit: 0, qty: 0 };
          cur.revenue += revenue; cur.cost += cost; cur.profit += revenue - cost; cur.qty += Number(it.quantity);
          agg.set(it.product_name, cur);
        });
        rows = Array.from(agg.values()).sort((a, b) => b.profit - a.profit);
      } else if (type === 'cashier') {
        const agg = new Map<string, { name: string; total: number; count: number }>();
        (invoices ?? []).forEach((inv) => {
          const name = userMap.get(inv.cashier_id)?.full_name ?? '—';
          const cur = agg.get(inv.cashier_id) ?? { name, total: 0, count: 0 };
          cur.total += Number(inv.total); cur.count += 1;
          agg.set(inv.cashier_id, cur);
        });
        rows = Array.from(agg.values()).sort((a, b) => b.total - a.total);
      }
      setData(rows);
      setLoading(false);
    })();
  }, [type, preset, posId, posList, users]);

  const tabs = [
    { key: 'sales' as ReportType, label: 'المبيعات', icon: <BarChart3 size={18} /> },
    { key: 'products' as ReportType, label: 'المنتجات', icon: <Package size={18} /> },
    ...(canViewProfit ? [{ key: 'profit' as ReportType, label: 'الأرباح', icon: <TrendingUp size={18} /> }] : []),
    { key: 'cashier' as ReportType, label: 'الكاشير', icon: <Users size={18} /> },
  ];

  const presets = [
    { key: 'today', label: 'اليوم' }, { key: 'yesterday', label: 'أمس' },
    { key: 'week', label: 'الأسبوع' }, { key: 'month', label: 'الشهر' },
  ];

  return (
    <div>
      <PageHeader title="التقارير" subtitle="تقارير المبيعات، المنتجات، الأرباح والكاشير" icon={<BarChart3 size={22} />} actions={<button onClick={() => window.print()} className="mi-btn-secondary"><Download size={18} /> طباعة</button>} />

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setType(t.key)} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${type === t.key ? 'bg-teal-700 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>{t.icon} {t.label}</button>
        ))}
      </div>

      <FilterBar>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button key={p.key} onClick={() => setPreset(p.key)} className={`rounded-lg px-3.5 py-2 text-sm font-semibold ${preset === p.key ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'}`}>{p.label}</button>
          ))}
        </div>
        <Field label="نقطة البيع" className="min-w-[180px]"><select value={posId} onChange={(e) => setPosId(e.target.value)} className="mi-input"><option value="">الكل</option>{posList.map((p) => <option key={p.id} value={p.id}>{p.name_ar ?? p.name}</option>)}</select></Field>
      </FilterBar>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="إجمالي المبيعات" value={formatCurrency(summary.total)} icon={<DollarSign size={20} />} accent="teal" />
        <StatCard label="عدد الفواتير" value={formatNumber(summary.count)} icon={<BarChart3 size={20} />} accent="blue" />
        {canViewProfit && <StatCard label="صافي الربح" value={formatCurrency(summary.profit)} icon={<TrendingUp size={20} />} accent="green" />}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-teal-600" /></div>
      ) : data.length === 0 ? (
        <EmptyState icon={<BarChart3 size={48} />} title="لا توجد بيانات" description="لا توجد بيانات للفترة المحددة." />
      ) : (
        <div className="mi-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-right text-xs text-slate-500">
              <tr>
                {type === 'sales' && <><th className="px-4 py-3 font-semibold">نقطة البيع</th><th className="px-4 py-3 font-semibold">عدد الفواتير</th><th className="px-4 py-3 font-semibold">الإجمالي</th></>}
                {type === 'products' && <><th className="px-4 py-3 font-semibold">المنتج</th><th className="px-4 py-3 font-semibold">الكمية</th><th className="px-4 py-3 font-semibold">الإجمالي</th></>}
                {type === 'profit' && <><th className="px-4 py-3 font-semibold">المنتج</th><th className="px-4 py-3 font-semibold">الكمية</th><th className="px-4 py-3 font-semibold">الإيراد</th><th className="px-4 py-3 font-semibold">التكلفة</th><th className="px-4 py-3 font-semibold">الربح</th></>}
                {type === 'cashier' && <><th className="px-4 py-3 font-semibold">الكاشير</th><th className="px-4 py-3 font-semibold">عدد الفواتير</th><th className="px-4 py-3 font-semibold">الإجمالي</th></>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  {type === 'sales' && <><td className="px-4 py-3 font-semibold text-slate-700">{r.name}</td><td className="px-4 py-3 text-slate-600">{formatNumber(r.count)}</td><td className="px-4 py-3 font-bold text-teal-700">{formatCurrency(r.total)}</td></>}
                  {type === 'products' && <><td className="px-4 py-3 font-semibold text-slate-700">{r.name}</td><td className="px-4 py-3 text-slate-600">{formatNumber(r.qty)}</td><td className="px-4 py-3 font-bold text-teal-700">{formatCurrency(r.total)}</td></>}
                  {type === 'profit' && <><td className="px-4 py-3 font-semibold text-slate-700">{r.name}</td><td className="px-4 py-3 text-slate-600">{formatNumber(r.qty)}</td><td className="px-4 py-3 text-slate-600">{formatCurrency(r.revenue)}</td><td className="px-4 py-3 text-slate-500">{formatCurrency(r.cost)}</td><td className="px-4 py-3 font-bold text-green-600">{formatCurrency(r.profit)}</td></>}
                  {type === 'cashier' && <><td className="px-4 py-3 font-semibold text-slate-700">{r.name}</td><td className="px-4 py-3 text-slate-600">{formatNumber(r.count)}</td><td className="px-4 py-3 font-bold text-teal-700">{formatCurrency(r.total)}</td></>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

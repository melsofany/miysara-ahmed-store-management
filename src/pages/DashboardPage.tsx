import { useEffect, useState } from 'react';
import {
  Wallet,
  Receipt,
  TrendingUp,
  Package,
  AlertTriangle,
  Banknote,
  Undo2,
  Tag,
  Users,
  Loader2,
  Store,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { FilterBar, Field } from '@/components/Form';
import { fetchDashboard, rangePreset, type DashboardMetrics } from '@/lib/reporting';
import { formatCurrency, formatNumber } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { PosLocation } from '@/lib/types';
import { useAuth, useCan } from '@/lib/auth';

const presets = [
  { key: 'today', label: 'اليوم' },
  { key: 'yesterday', label: 'أمس' },
  { key: 'week', label: 'هذا الأسبوع' },
  { key: 'month', label: 'هذا الشهر' },
];

const empty: DashboardMetrics = {
  totalSales: 0, invoiceCount: 0, avgInvoice: 0, totalReturns: 0, totalDiscount: 0,
  estimatedProfit: 0, stockCostValue: 0, stockSellValue: 0, posBreakdown: [], topProducts: [],
  lowProducts: [], categorySales: [], userSales: [],
};

export function DashboardPage() {
  const { profile } = useAuth();
  const { can } = useCan();
  const [preset, setPreset] = useState('today');
  const [posId, setPosId] = useState('');
  const [posList, setPosList] = useState<PosLocation[]>([]);
  const [data, setData] = useState<DashboardMetrics>(empty);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('pos_locations').select('*').eq('is_active', true).then(({ data }) => {
      setPosList((data as PosLocation[]) ?? []);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const range = rangePreset(preset);
    fetchDashboard(range, posId || undefined)
      .then(setData)
      .finally(() => setLoading(false));
  }, [preset, posId]);

  const profitMargin = data.totalSales > 0 ? (data.estimatedProfit / data.totalSales) * 100 : 0;

  return (
    <div>
      <PageHeader
        title="لوحة التحكم"
        subtitle={`نظرة شاملة على أداء المتجر — ${profile?.full_name}`}
        icon={<Wallet size={22} />}
      />

      <FilterBar>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                preset === p.key
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <Field label="نقطة البيع" className="min-w-[180px]">
          <select value={posId} onChange={(e) => setPosId(e.target.value)} className="mi-input">
            <option value="">الكل</option>
            {posList.map((p) => (
              <option key={p.id} value={p.id}>{p.name_ar ?? p.name}</option>
            ))}
          </select>
        </Field>
      </FilterBar>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-teal-600" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="إجمالي المبيعات"
              value={formatCurrency(data.totalSales)}
              icon={<Banknote size={20} />}
              accent="teal"
            />
            <StatCard
              label="عدد الفواتير"
              value={formatNumber(data.invoiceCount)}
              icon={<Receipt size={20} />}
              accent="blue"
            />
            <StatCard
              label="متوسط الفاتورة"
              value={formatCurrency(data.avgInvoice)}
              icon={<TrendingUp size={20} />}
              accent="amber"
            />
            <StatCard
              label="المرتجعات"
              value={formatCurrency(data.totalReturns)}
              icon={<Undo2 size={20} />}
              accent="rose"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="إجمالي الخصومات"
              value={formatCurrency(data.totalDiscount)}
              icon={<Tag size={20} />}
              accent="slate"
            />
            {can('view_profit_reports') && (
              <StatCard
                label="الأرباح التقديرية"
                value={formatCurrency(data.estimatedProfit)}
                trend={`هامش ${profitMargin.toFixed(1)}%`}
                icon={<TrendingUp size={20} />}
                accent="green"
              />
            )}
            {can('view_stock_value') && (
              <StatCard
                label="المخزون بالتكلفة"
                value={formatCurrency(data.stockCostValue)}
                icon={<Package size={20} />}
                accent="slate"
              />
            )}
            {can('view_stock_value') && (
              <StatCard
                label="المخزون بسعر البيع"
                value={formatCurrency(data.stockSellValue)}
                icon={<Package size={20} />}
                accent="teal"
              />
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="mi-card p-5">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-700">
                <Store size={18} className="text-teal-600" /> المبيعات حسب نقطة البيع
              </h3>
              {data.posBreakdown.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">لا توجد بيانات</p>
              ) : (
                <div className="space-y-3">
                  {data.posBreakdown.map((p) => (
                    <div key={p.posId} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{p.posName}</p>
                        <p className="text-xs text-slate-400">{p.count} فاتورة</p>
                      </div>
                      <span className="font-bold text-teal-700">{formatCurrency(p.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mi-card p-5">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-700">
                <Users size={18} className="text-teal-600" /> المبيعات حسب الكاشير
              </h3>
              {data.userSales.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">لا توجد بيانات</p>
              ) : (
                <div className="space-y-3">
                  {data.userSales.map((u) => (
                    <div key={u.name} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.count} فاتورة</p>
                      </div>
                      <span className="font-bold text-teal-700">{formatCurrency(u.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="mi-card p-5">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-700">
                <TrendingUp size={18} className="text-teal-600" /> أفضل المنتجات مبيعًا
              </h3>
              {data.topProducts.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">لا توجد بيانات</p>
              ) : (
                <div className="space-y-2.5">
                  {data.topProducts.map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-xs font-bold text-teal-700">
                        {i + 1}
                      </span>
                      <span className="flex-1 truncate text-sm text-slate-700">{p.name}</span>
                      <span className="text-sm font-bold text-slate-600">{formatNumber(p.qty)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mi-card p-5">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-700">
                <AlertTriangle size={18} className="text-amber-500" /> منتجات وصلت لحد إعادة الطلب
              </h3>
              {data.lowProducts.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">كل المنتجات متوفرة</p>
              ) : (
                <div className="space-y-2.5">
                  {data.lowProducts.map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-xs font-bold text-amber-600">
                        !
                      </span>
                      <span className="flex-1 truncate text-sm text-slate-700">{p.name}</span>
                      <span className="text-sm font-bold text-amber-600">{formatNumber(p.qty)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mi-card p-5">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-700">
                <Tag size={18} className="text-teal-600" /> المبيعات حسب التصنيف
              </h3>
              {data.categorySales.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">لا توجد بيانات</p>
              ) : (
                <div className="space-y-2.5">
                  {data.categorySales.map((c, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">{c.name}</span>
                      <span className="text-sm font-bold text-slate-600">{formatCurrency(c.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}



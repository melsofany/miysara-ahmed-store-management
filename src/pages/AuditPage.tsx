import { useEffect, useState, useCallback } from 'react';
import { ScrollText, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { SearchInput } from '@/components/Form';
import { EmptyState } from '@/components/EmptyState';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/format';
import type { AuditLog, Profile } from '@/lib/types';

export function AuditPage() {
  const [logs, setLogs] = useState<(AuditLog & { user?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('audit_logs')
      .select('*, user:profiles(*)')
      .order('created_at', { ascending: false })
      .limit(300);
    if (search) q = q.or(`action.ilike.%${search}%,entity.ilike.%${search}%`);
    const { data } = await q;
    setLogs((data as (AuditLog & { user?: Profile })[]) ?? []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <PageHeader title="سجل التدقيق" subtitle="سجل كامل لكل التعديلات والإجراءات الحساسة" icon={<ScrollText size={22} />} />

      <div className="mb-4 max-w-md"><SearchInput value={search} onChange={setSearch} placeholder="بحث في السجل..." /></div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-teal-600" /></div>
      ) : logs.length === 0 ? (
        <EmptyState icon={<ScrollText size={48} />} title="لا توجد سجلات" description="لم يتم تسجيل أي عمليات بعد." />
      ) : (
        <div className="mi-card divide-y divide-slate-100">
          {logs.map((log) => (
            <div key={log.id} className="px-5 py-3.5 hover:bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="mi-badge bg-slate-100 text-slate-600">{log.action}</span>
                  <span className="text-sm font-semibold text-slate-700">{log.entity}</span>
                  {log.reason && <span className="text-xs text-slate-400">— {log.reason}</span>}
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-slate-600">{log.user?.full_name ?? 'النظام'}</p>
                  <p className="text-xs text-slate-400">{formatDateTime(log.created_at)}</p>
                </div>
              </div>
              {(log.old_values || log.new_values) && (
                <div className="mt-2 flex gap-2 text-xs">
                  {log.old_values && (
                    <pre className="flex-1 overflow-x-auto rounded-lg bg-red-50 p-2 text-red-700" dir="ltr">
                      {JSON.stringify(log.old_values, null, 2)}
                    </pre>
                  )}
                  {log.new_values && (
                    <pre className="flex-1 overflow-x-auto rounded-lg bg-green-50 p-2 text-green-700" dir="ltr">
                      {JSON.stringify(log.new_values, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

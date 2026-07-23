import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Printer, Loader2, Undo2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { toast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import { useCan, useAuth } from '@/lib/auth';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { Invoice, InvoiceItem, Payment, PosLocation, Profile } from '@/lib/types';

const statusLabels: Record<string, string> = {
  open: 'مفتوحة', paid: 'مدفوعة', cancelled: 'ملغاة',
  partially_returned: 'مرتجع جزئي', returned: 'مرتجعة',
};
const methodLabels: Record<string, string> = { cash: 'نقدي', card: 'بطاقة', bank: 'تحويل', e_wallet: 'محفظة' };

export function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useCan();
  const { profile } = useAuth();
  const canReturn = can('process_returns');
  const [invoice, setInvoice] = useState<(Invoice & { pos_location?: PosLocation; cashier?: Profile; invoice_items?: InvoiceItem[]; payments?: Payment[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReturn, setShowReturn] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from('invoices')
        .select('*, pos_location:pos_locations(*), cashier:profiles(*), invoice_items(*), payments(*)')
        .eq('id', id)
        .maybeSingle();
      setInvoice(data as any);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-teal-600" /></div>;
  if (!invoice) return <div className="py-16 text-center text-slate-400">الفاتورة غير موجودة</div>;

  return (
    <div>
      <PageHeader
        title={`فاتورة ${invoice.invoice_number}`}
        subtitle={formatDateTime(invoice.created_at)}
        actions={
          <>
            <button onClick={() => navigate('/invoices')} className="mi-btn-secondary"><ArrowRight size={18} /> رجوع</button>
            <button onClick={() => window.print()} className="mi-btn-secondary"><Printer size={18} /> طباعة</button>
            {canReturn && invoice.status === 'paid' && (
              <button onClick={() => setShowReturn(true)} className="mi-btn-danger"><Undo2 size={18} /> مرتجع</button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="receipt-print mi-card p-6 lg:col-span-2">
          <div className="mb-6 flex items-start justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">MIYSARA Ahmed</h2>
              <p className="text-sm text-slate-500">ميسرة أحمد</p>
              <p className="text-sm text-slate-500">{invoice.pos_location?.name_ar ?? invoice.pos_location?.name}</p>
            </div>
            <div className="text-left">
              <p className="font-bold text-slate-700" dir="ltr">{invoice.invoice_number}</p>
              <p className="text-xs text-slate-400">{formatDateTime(invoice.created_at)}</p>
              <span className={`mi-badge mt-1 ${invoice.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{statusLabels[invoice.status]}</span>
            </div>
          </div>

          <div className="mb-4 flex justify-between text-sm">
            <span className="text-slate-500">الكاشير: <span className="font-semibold text-slate-700">{invoice.cashier?.full_name}</span></span>
          </div>

          <table className="mb-4 w-full text-sm">
            <thead className="border-b border-slate-200 text-right text-xs text-slate-500">
              <tr>
                <th className="py-2 font-semibold">المنتج</th>
                <th className="py-2 font-semibold">الكمية</th>
                <th className="py-2 font-semibold">السعر</th>
                <th className="py-2 font-semibold">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.invoice_items?.map((it) => (
                <tr key={it.id}>
                  <td className="py-2.5 font-semibold text-slate-700">{it.product_name}</td>
                  <td className="py-2.5 text-slate-600">{it.quantity}</td>
                  <td className="py-2.5 text-slate-600">{formatCurrency(it.unit_price)}</td>
                  <td className="py-2.5 font-bold text-slate-700">{formatCurrency(it.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="ms-auto max-w-xs space-y-2">
            <div className="flex justify-between text-sm"><span className="text-slate-500">الإجمالي الفرعي</span><span className="font-semibold">{formatCurrency(invoice.subtotal)}</span></div>
            {invoice.discount_amount > 0 && <div className="flex justify-between text-sm"><span className="text-slate-500">خصم</span><span className="font-semibold text-red-600">-{formatCurrency(invoice.discount_amount)}</span></div>}
            {invoice.tax_amount > 0 && <div className="flex justify-between text-sm"><span className="text-slate-500">ضريبة</span><span className="font-semibold">{formatCurrency(invoice.tax_amount)}</span></div>}
            <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-extrabold"><span>الإجمالي</span><span className="text-teal-700">{formatCurrency(invoice.total)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">المدفوع</span><span>{formatCurrency(invoice.paid_amount)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">الباقي</span><span>{formatCurrency(invoice.change_amount)}</span></div>
          </div>

          {invoice.payments && invoice.payments.length > 0 && (
            <div className="mt-4 border-t border-slate-200 pt-4">
              <p className="mb-2 text-sm font-semibold text-slate-600">طرق الدفع:</p>
              {invoice.payments.map((p) => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span className="text-slate-500">{methodLabels[p.method]}</span>
                  <span className="font-semibold">{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mi-card p-5">
          <h3 className="mb-3 font-bold text-slate-700">تفاصيل</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">نقطة البيع</span><span className="font-semibold">{invoice.pos_location?.name_ar ?? invoice.pos_location?.name}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">الكاشير</span><span className="font-semibold">{invoice.cashier?.full_name}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">التاريخ</span><span className="font-semibold">{formatDateTime(invoice.created_at)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">الحالة</span><span className="font-semibold">{statusLabels[invoice.status]}</span></div>
            {invoice.note && <div className="flex justify-between"><span className="text-slate-500">ملاحظة</span><span className="font-semibold">{invoice.note}</span></div>}
          </div>
        </div>
      </div>

      {showReturn && (
        <ReturnModal
          invoice={invoice}
          userId={profile?.id ?? null}
          onClose={() => setShowReturn(false)}
          onSaved={() => { setShowReturn(false); navigate('/returns'); }}
        />
      )}
    </div>
  );
}

function ReturnModal({ invoice, userId, onClose, onSaved }: { invoice: Invoice & { invoice_items?: InvoiceItem[]; pos_location?: PosLocation }; userId: string | null; onClose: () => void; onSaved: () => void }) {
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');
  const [type, setType] = useState<'full' | 'partial'>('full');
  const [saving, setSaving] = useState(false);

  const items = invoice.invoice_items ?? [];
  const refundTotal = type === 'full'
    ? invoice.total
    : items.reduce((s, it) => s + (selected[it.id] ?? 0) * Number(it.unit_price), 0);

  async function handleReturn() {
    setSaving(true);
    try {
      const returnNumber = `RET-${Date.now()}`;
      const returnItems = type === 'full'
        ? items.map((it) => ({ invoice_item_id: it.id, product_variant_id: it.product_variant_id, quantity: it.quantity, unit_price: it.unit_price, refund_amount: it.line_total }))
        : items.filter((it) => (selected[it.id] ?? 0) > 0).map((it) => ({ invoice_item_id: it.id, product_variant_id: it.product_variant_id, quantity: selected[it.id], unit_price: it.unit_price, refund_amount: selected[it.id] * Number(it.unit_price) }));

      if (returnItems.length === 0) { toast('اختر أصنافًا للمرتجع', 'error'); setSaving(false); return; }

      const { data: ret, error: retErr } = await supabase.from('invoice_returns').insert({
        return_number: returnNumber,
        original_invoice_id: invoice.id,
        pos_location_id: invoice.pos_location_id,
        user_id: userId,
        type,
        total: refundTotal,
        reason: reason || null,
      }).select().single();
      if (retErr) throw retErr;

      await supabase.from('invoice_return_items').insert(returnItems.map((ri) => ({ ...ri, return_id: ret.id })));

      // Update invoice status
      const newStatus = type === 'full' ? 'returned' : 'partially_returned';
      await supabase.from('invoices').update({ status: newStatus }).eq('id', invoice.id);

      // Restore inventory + movements
      for (const ri of returnItems) {
        await supabase.from('stock_movements').insert({
          movement_type: 'sale_return',
          product_variant_id: ri.product_variant_id,
          to_location_id: invoice.pos_location_id,
          to_location_type: 'pos',
          quantity: ri.quantity,
          unit_cost_price: 0,
          document_ref: returnNumber,
          user_id: userId,
        });
        // Upsert inventory: restore returned qty, or create row if missing
        const { data: inv } = await supabase
          .from('inventory')
          .select('id, quantity')
          .eq('product_variant_id', ri.product_variant_id)
          .eq('location_id', invoice.pos_location_id)
          .eq('location_type', 'pos')
          .maybeSingle();
        if (inv) {
          await supabase
            .from('inventory')
            .update({ quantity: (inv as any).quantity + ri.quantity, updated_at: new Date().toISOString() })
            .eq('id', (inv as any).id);
        } else {
          // No inventory row — create one with the returned quantity
          await supabase.from('inventory').insert({
            product_variant_id: ri.product_variant_id,
            location_id: invoice.pos_location_id,
            location_type: 'pos',
            quantity: ri.quantity,
          });
        }
      }

      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'process_return',
        entity: 'invoices',
        entity_id: invoice.id,
        new_values: { type, total: refundTotal, reason },
      });

      toast('تم معالجة المرتجع بنجاح');
      onSaved();
    } catch (e: any) { toast(e.message, 'error'); } finally { setSaving(false); }
  }

  return (
    <Modal open onClose={onClose} title="مرتجع فاتورة" size="lg">
      <div className="space-y-4">
        <div className="flex gap-2">
          <button onClick={() => setType('full')} className={`flex-1 rounded-xl border p-3 text-sm font-semibold ${type === 'full' ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-slate-200'}`}>مرتجع كامل</button>
          <button onClick={() => setType('partial')} className={`flex-1 rounded-xl border p-3 text-sm font-semibold ${type === 'partial' ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-slate-200'}`}>مرتجع جزئي</button>
        </div>

        {type === 'partial' && (
          <div className="space-y-2">
            {items.map((it) => (
              <div key={it.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">{it.product_name}</p>
                  <p className="text-xs text-slate-400">الكمية: {it.quantity} · {formatCurrency(it.unit_price)}</p>
                </div>
                <input type="number" min={0} max={it.quantity} placeholder="0" value={selected[it.id] ?? ''} onChange={(e) => setSelected((s) => ({ ...s, [it.id]: Math.min(it.quantity, Number(e.target.value)) }))} className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-sm" dir="ltr" />
              </div>
            ))}
          </div>
        )}

        <div><label className="mi-label">سبب المرتجع</label><textarea value={reason} onChange={(e) => setReason(e.target.value)} className="mi-input" rows={2} placeholder="اكتب سبب المرتجع..." /></div>

        <div className="rounded-xl bg-slate-50 p-4">
          <div className="flex justify-between text-lg font-bold"><span>إجمالي المرتجع</span><span className="text-red-600">{formatCurrency(refundTotal)}</span></div>
        </div>

        <button onClick={handleReturn} disabled={saving} className="mi-btn-danger w-full">{saving ? <Loader2 size={18} className="animate-spin" /> : <Undo2 size={18} />} تأكيد المرتجع</button>
      </div>
    </Modal>
  );
}

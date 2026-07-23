import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Loader2, Save } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Field } from '@/components/Form';
import { toast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import type { Company } from '@/lib/types';

export function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    supabase.from('companies').select('*').limit(1).maybeSingle().then(({ data }) => {
      setForm((data as Record<string, string | number | boolean | null>) ?? {});
      setLoading(false);
    });
  }, []);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    try {
      const { error } = await supabase.from('companies').update({
        name: form.name, name_ar: form.name_ar, currency: form.currency,
        tax_enabled: form.tax_enabled, tax_rate: Number(form.tax_rate),
        phone: form.phone, address: form.address, logo_url: form.logo_url,
        updated_at: new Date().toISOString(),
      }).eq('id', form.id);
      if (error) throw error;
      toast('تم حفظ الإعدادات');
    } catch (e: any) { toast(e.message, 'error'); } finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-teal-600" /></div>;

  return (
    <div>
      <PageHeader title="الإعدادات" subtitle="إعدادات الشركة والنظام" icon={<SettingsIcon size={22} />} actions={<button onClick={save} disabled={saving} className="mi-btn-primary">{saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} حفظ</button>} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="mi-card p-5">
          <h3 className="mb-4 font-bold text-slate-700">بيانات الشركة</h3>
          <div className="space-y-4">
            <Field label="اسم الشركة (عربي)"><input value={form.name_ar ?? ''} onChange={(e) => set('name_ar', e.target.value)} className="mi-input" /></Field>
            <Field label="Name (EN)"><input value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} className="mi-input" dir="ltr" /></Field>
            <Field label="العملة"><input value={form.currency ?? 'EGP'} onChange={(e) => set('currency', e.target.value)} className="mi-input" dir="ltr" /></Field>
            <Field label="الهاتف"><input value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} className="mi-input" dir="ltr" /></Field>
            <Field label="العنوان"><input value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} className="mi-input" /></Field>
            <Field label="رابط الشعار"><input value={form.logo_url ?? ''} onChange={(e) => set('logo_url', e.target.value)} className="mi-input" dir="ltr" /></Field>
          </div>
        </div>

        <div className="mi-card p-5">
          <h3 className="mb-4 font-bold text-slate-700">إعدادات الضريبة</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={form.tax_enabled ?? false} onChange={(e) => set('tax_enabled', e.target.checked)} className="h-4 w-4 rounded text-teal-600" />
              تفعيل الضريبة
            </label>
            {form.tax_enabled && (
              <Field label="نسبة الضريبة (%)"><input type="number" step="0.01" value={form.tax_rate ?? 0} onChange={(e) => set('tax_rate', e.target.value)} className="mi-input" dir="ltr" /></Field>
            )}
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              <p className="font-semibold text-slate-600">ملاحظة:</p>
              <p className="mt-1">عند تفعيل الضريبة، ستُضاف تلقائيًا إلى الفواتير في نقاط البيع بناءً على النسبة المحددة.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Shirt, Plus, Pencil, Trash2, Building2, Tag, Palette, Ruler, Snowflake } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SearchInput } from '@/components/Form';
import { EmptyState } from '@/components/EmptyState';
import { toast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import { useCatalog, clearCatalogCache } from '@/lib/catalog';
import { useCan } from '@/lib/auth';
import type { Category, Supplier, Manufacturer, Season, Size, Color } from '@/lib/types';

type Tab = 'categories' | 'suppliers' | 'manufacturers' | 'seasons' | 'sizes' | 'colors';

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'categories', label: 'التصنيفات', icon: <Shirt size={18} /> },
  { key: 'suppliers', label: 'الموردون', icon: <Building2 size={18} /> },
  { key: 'manufacturers', label: 'المصنعون', icon: <Tag size={18} /> },
  { key: 'seasons', label: 'المواسم', icon: <Snowflake size={18} /> },
  { key: 'sizes', label: 'المقاسات', icon: <Ruler size={18} /> },
  { key: 'colors', label: 'الألوان', icon: <Palette size={18} /> },
];

type CatalogItem = Category | Supplier | Manufacturer | Season | Size | Color;
type CatalogDraft = Partial<CatalogItem> & { _new?: boolean };

interface CatalogFormData {
  id?: string;
  name?: string;
  name_ar?: string | null;
  is_active?: boolean;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  country?: string | null;
  hex_code?: string | null;
  category_id?: string | null;
  sort_order?: number;
  parent_id?: string | null;
}

export function CatalogPage() {
  const { can } = useCan();
  const canManage = can('manage_categories');
  const [tab, setTab] = useState<Tab>('categories');
  const cat = useCatalog();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<CatalogDraft | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<CatalogItem | null>(null);

  const filter = (list: { name: string; name_ar: string | null }[]) =>
    list.filter((x) =>
      !search ||
      x.name.toLowerCase().includes(search.toLowerCase()) ||
      (x.name_ar ?? '').includes(search)
    );

  function openNew() {
    setEditing({ _new: true });
    setShowModal(true);
  }
  function openEdit(item: CatalogItem) {
    setEditing(item);
    setShowModal(true);
  }

  async function handleSave(values: CatalogFormData) {
    const isNew = editing._new;
    const table = tab;
    const { error } = isNew
      ? await supabase.from(table).insert(values)
      : await supabase.from(table).update(values).eq('id', editing!.id as string);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    clearCatalogCache();
    toast(isNew ? 'تم الإضافة بنجاح' : 'تم التحديث بنجاح');
    setShowModal(false);
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    const { error } = await supabase.from(tab).delete().eq('id', confirmDelete.id);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    clearCatalogCache();
    toast('تم الحذف');
  }

  const renderList = () => {
    switch (tab) {
      case 'categories':
        return (
          <EntityList
            items={filter(cat.categories) as Category[]}
            onEdit={openEdit}
            onDelete={setConfirmDelete}
            canManage={canManage}
            render={(c) => <span>{c.name_ar ?? c.name}</span>}
          />
        );
      case 'suppliers':
        return (
          <EntityList
            items={filter(cat.suppliers) as Supplier[]}
            onEdit={openEdit}
            onDelete={setConfirmDelete}
            canManage={canManage}
            render={(s) => (
              <div>
                <p className="font-semibold text-slate-700">{s.name}</p>
                {s.phone && <p className="text-xs text-slate-400">{s.phone}</p>}
              </div>
            )}
          />
        );
      case 'manufacturers':
        return (
          <EntityList
            items={filter(cat.manufacturers) as Manufacturer[]}
            onEdit={openEdit}
            onDelete={setConfirmDelete}
            canManage={canManage}
            render={(m) => (
              <div>
                <p className="font-semibold text-slate-700">{m.name}</p>
                {m.country && <p className="text-xs text-slate-400">{m.country}</p>}
              </div>
            )}
          />
        );
      case 'seasons':
        return (
          <EntityList
            items={filter(cat.seasons) as Season[]}
            onEdit={openEdit}
            onDelete={setConfirmDelete}
            canManage={canManage}
            render={(s) => <span>{s.name_ar ?? s.name}</span>}
          />
        );
      case 'sizes':
        return (
          <EntityList
            items={filter(cat.sizes) as Size[]}
            onEdit={openEdit}
            onDelete={setConfirmDelete}
            canManage={canManage}
            render={(s) => (
              <div className="flex items-center gap-2">
                <span>{s.name_ar ?? s.name}</span>
                {s.category_id && (
                  <span className="mi-badge bg-slate-100 text-slate-500">
                    {cat.categories.find((c) => c.id === s.category_id)?.name_ar ?? 'تصنيف'}
                  </span>
                )}
              </div>
            )}
          />
        );
      case 'colors':
        return (
          <EntityList
            items={filter(cat.colors) as Color[]}
            onEdit={openEdit}
            onDelete={setConfirmDelete}
            canManage={canManage}
            render={(c) => (
              <div className="flex items-center gap-2">
                {c.hex_code && (
                  <span
                    className="h-5 w-5 rounded-full border border-slate-200"
                    style={{ backgroundColor: c.hex_code }}
                  />
                )}
                <span>{c.name_ar ?? c.name}</span>
              </div>
            )}
          />
        );
    }
  };

  return (
    <div>
      <PageHeader
        title="التصنيفات والموردين"
        subtitle="إدارة التصنيفات، الموردين، المصنعين، المواسم، المقاسات والألوان"
        icon={<Shirt size={22} />}
        actions={
          canManage && (
            <button onClick={openNew} className="mi-btn-primary">
              <Plus size={18} /> إضافة جديد
            </button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              setSearch('');
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              tab === t.key ? 'bg-teal-700 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-4 max-w-md">
        <SearchInput value={search} onChange={setSearch} placeholder="بحث..." />
      </div>

      {cat.loading ? (
        <p className="py-12 text-center text-slate-400">جاري التحميل...</p>
      ) : renderList()}

      {showModal && (
        <EntityModal
          tab={tab}
          entity={editing}
          categories={cat.categories}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="تأكيد الحذف"
        message={`هل تريد حذف "${confirmDelete?.name_ar ?? confirmDelete?.name}"؟`}
        danger
        confirmText="حذف"
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function EntityList<T extends { id: string; is_active: boolean }>({
  items,
  onEdit,
  onDelete,
  canManage,
  render,
}: {
  items: T[];
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  canManage: boolean;
  render: (item: T) => React.ReactNode;
}) {
  if (items.length === 0)
    return (
      <EmptyState
        icon={<Shirt size={48} />}
        title="لا توجد عناصر"
        description="لم يتم العثور على نتائج مطابقة."
      />
    );
  return (
    <div className="mi-card divide-y divide-slate-100">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50">
          <div className="flex flex-1 items-center gap-3">
            {render(item)}
            {!item.is_active && <span className="mi-badge bg-red-50 text-red-600">غير نشط</span>}
          </div>
          {canManage && (
            <div className="flex gap-1.5">
              <button
                onClick={() => onEdit(item)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-teal-600"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => onDelete(item)}
                className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function EntityModal({
  tab,
  entity,
  categories,
  onClose,
  onSave,
}: {
  tab: Tab;
  entity: CatalogDraft;
  categories: Category[];
  onClose: () => void;
  onSave: (values: CatalogFormData) => void;
}) {
  const isNew = entity._new;
  const [form, setForm] = useState<CatalogFormData>(() => {
    if (isNew) return { is_active: true, sort_order: 0 };
    const { _new: _, ...rest } = entity;
    return rest as CatalogFormData;
  });

  const set = <K extends keyof CatalogFormData>(k: K, v: CatalogFormData[K]) => setForm((f) => ({ ...f, [k]: v }));

  const fields = (() => {
    switch (tab) {
      case 'categories':
        return (
          <>
            <Input label="الاسم (عربي)" value={form.name_ar ?? ''} onChange={(v) => set('name_ar', v)} />
            <Input label="Name (EN)" value={form.name ?? ''} onChange={(v) => set('name', v)} />
          </>
        );
      case 'suppliers':
        return (
          <>
            <Input label="الاسم" value={form.name ?? ''} onChange={(v) => set('name', v)} />
            <Input label="الاسم (عربي)" value={form.name_ar ?? ''} onChange={(v) => set('name_ar', v)} />
            <Input label="الهاتف" value={form.phone ?? ''} onChange={(v) => set('phone', v)} />
            <Input label="البريد" value={form.email ?? ''} onChange={(v) => set('email', v)} />
            <Input label="العنوان" value={form.address ?? ''} onChange={(v) => set('address', v)} />
          </>
        );
      case 'manufacturers':
        return (
          <>
            <Input label="الاسم" value={form.name ?? ''} onChange={(v) => set('name', v)} />
            <Input label="الاسم (عربي)" value={form.name_ar ?? ''} onChange={(v) => set('name_ar', v)} />
            <Input label="الدولة" value={form.country ?? ''} onChange={(v) => set('country', v)} />
          </>
        );
      case 'seasons':
        return (
          <>
            <Input label="الاسم (عربي)" value={form.name_ar ?? ''} onChange={(v) => set('name_ar', v)} />
            <Input label="Name (EN)" value={form.name ?? ''} onChange={(v) => set('name', v)} />
          </>
        );
      case 'sizes':
        return (
          <>
            <Input label="الاسم (عربي)" value={form.name_ar ?? ''} onChange={(v) => set('name_ar', v)} />
            <Input label="Name (EN)" value={form.name ?? ''} onChange={(v) => set('name', v)} />
            <div>
              <label className="mi-label">التصنيف (اختياري)</label>
              <select value={form.category_id ?? ''} onChange={(e) => set('category_id', e.target.value || null)} className="mi-input">
                <option value="">عام</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name_ar ?? c.name}</option>
                ))}
              </select>
            </div>
            <Input label="ترتيب" type="number" value={String(form.sort_order ?? 0)} onChange={(v) => set('sort_order', Number(v))} />
          </>
        );
      case 'colors':
        return (
          <>
            <Input label="الاسم (عربي)" value={form.name_ar ?? ''} onChange={(v) => set('name_ar', v)} />
            <Input label="Name (EN)" value={form.name ?? ''} onChange={(v) => set('name', v)} />
            <Input label="رمز اللون (Hex)" value={form.hex_code ?? ''} onChange={(v) => set('hex_code', v)} />
          </>
        );
    }
  })();

  return (
    <Modal open onClose={onClose} title={isNew ? 'إضافة جديد' : 'تعديل'} size="md">
      <div className="space-y-4">{fields}</div>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} className="mi-btn-secondary">إلغاء</button>
        <button onClick={() => onSave(form)} className="mi-btn-primary">حفظ</button>
      </div>
    </Modal>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mi-label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mi-input"
      />
    </div>
  );
}

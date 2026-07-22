import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Warehouse as WarehouseIcon,
  Store,
  ShoppingCart,
  Receipt,
  Users,
  ShieldCheck,
  ScrollText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Shirt,
  Banknote,
  Undo2,
} from 'lucide-react';
import { useAuth, useCan } from '@/lib/auth';
import { Logo } from '@/components/Logo';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  perm: string;
}

const navItems: NavItem[] = [
  { to: '/', label: 'لوحة التحكم', icon: <LayoutDashboard size={20} />, perm: 'view_dashboard' },
  { to: '/products', label: 'المنتجات', icon: <Package size={20} />, perm: 'view_products' },
  { to: '/catalog', label: 'التصنيفات والموردين', icon: <Shirt size={20} />, perm: 'view_categories' },
  { to: '/warehouses', label: 'المخازن', icon: <WarehouseIcon size={20} />, perm: 'view_warehouses' },
  { to: '/inventory', label: 'المخزون والحركات', icon: <Package size={20} />, perm: 'view_inventory' },
  { to: '/pos-locations', label: 'نقاط البيع', icon: <Store size={20} />, perm: 'view_pos' },
  { to: '/pos', label: 'واجهة الكاشير', icon: <ShoppingCart size={20} />, perm: 'use_pos' },
  { to: '/invoices', label: 'الفواتير', icon: <Receipt size={20} />, perm: 'view_invoices' },
  { to: '/returns', label: 'المرتجعات', icon: <Undo2 size={20} />, perm: 'view_returns' },
  { to: '/shifts', label: 'الشفتات والدرج', icon: <Banknote size={20} />, perm: 'view_shifts' },
  { to: '/reports', label: 'التقارير', icon: <BarChart3 size={20} />, perm: 'view_reports' },
  { to: '/users', label: 'المستخدمون', icon: <Users size={20} />, perm: 'view_users' },
  { to: '/roles', label: 'الأدوار والصلاحيات', icon: <ShieldCheck size={20} />, perm: 'view_roles' },
  { to: '/audit', label: 'سجل التدقيق', icon: <ScrollText size={20} />, perm: 'view_audit_logs' },
  { to: '/settings', label: 'الإعدادات', icon: <Settings size={20} />, perm: 'manage_settings' },
];

const roleLabel: Record<string, string> = {
  super_admin: 'مدير عام',
  system_manager: 'مدير النظام',
  warehouse_manager: 'مدير مخزن',
  warehouse_user: 'مستخدم مخزن',
  pos_manager: 'مدير نقطة بيع',
  cashier: 'كاشير',
};

export function AdminLayout({ children }: { children: ReactNode }) {
  const { profile, role, signOut } = useAuth();
  const { can } = useCan();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const visibleItems = navItems.filter((item) => can(item.perm));

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside
        className={`fixed inset-y-0 right-0 z-40 w-72 transform border-l border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <Logo size={40} />
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {visibleItems.map((item) => {
              const active =
                item.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className={active ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 p-3">
            <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">
                {(profile?.full_name || '?').charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-700">{profile?.full_name}</p>
                <p className="truncate text-xs text-slate-400">
                  {role ? roleLabel[role.key] : 'بدون دور'}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                title="خروج"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-5 py-3 backdrop-blur lg:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-semibold text-slate-500 sm:block">
              مرحبًا، {profile?.full_name?.split(' ')[0]}
            </span>
            <div className="h-8 w-px bg-slate-200" />
            <span className="mi-badge bg-teal-50 text-teal-700">
              {new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

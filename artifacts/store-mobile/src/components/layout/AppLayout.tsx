import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  Building2, 
  Warehouse, 
  MapPin, 
  Monitor, 
  FileText, 
  Undo2, 
  Clock, 
  BarChart3, 
  Users, 
  Shield, 
  History, 
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const allNavigation = [
  { name: 'لوحة التحكم', href: '/', icon: LayoutDashboard, cashierOnly: false },
  { name: 'المنتجات', href: '/products', icon: Package, cashierOnly: false },
  { name: 'الكتالوج', href: '/catalog', icon: Layers, cashierOnly: false },
  { name: 'المخازن', href: '/warehouses', icon: Building2, cashierOnly: false },
  { name: 'المخزون', href: '/inventory', icon: Warehouse, cashierOnly: false },
  { name: 'نقاط البيع', href: '/pos-locations', icon: MapPin, cashierOnly: false },
  { name: 'واجهة الكاشير', href: '/pos', icon: Monitor, cashierOnly: false },
  { name: 'الفواتير', href: '/invoices', icon: FileText, cashierOnly: false },
  { name: 'المرتجعات', href: '/returns', icon: Undo2, cashierOnly: false },
  { name: 'الشفتات', href: '/shifts', icon: Clock, cashierOnly: false },
  { name: 'التقارير', href: '/reports', icon: BarChart3, cashierOnly: false },
  { name: 'المستخدمين', href: '/users', icon: Users, cashierOnly: false },
  { name: 'الأدوار', href: '/roles', icon: Shield, cashierOnly: false },
  { name: 'سجل التدقيق', href: '/audit', icon: History, cashierOnly: false },
  { name: 'الإعدادات', href: '/settings', icon: Settings, cashierOnly: false },
];

// Cashiers only see POS-related pages
const cashierNavigation = [
  { name: 'واجهة الكاشير', href: '/pos', icon: Monitor, cashierOnly: true },
  { name: 'الفواتير', href: '/invoices', icon: FileText, cashierOnly: true },
  { name: 'المرتجعات', href: '/returns', icon: Undo2, cashierOnly: true },
  { name: 'الشفتات', href: '/shifts', icon: Clock, cashierOnly: true },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, user, isCashier } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = isCashier ? cashierNavigation : allNavigation;

  // Exclude AppLayout on login page and POS page (POS usually needs full screen)
  if (location === '/login') {
    return <>{children}</>;
  }

  const isPos = location === '/pos';

  if (isPos) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      {/* Sidebar for desktop */}
      <aside className="hidden w-64 flex-col border-l border-border bg-card md:flex">
        <div className="flex h-14 items-center justify-center border-b border-border px-4">
          <h1 className="text-xl font-bold text-primary">ميسرة أحمد</h1>
        </div>
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'م'}
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium">{user?.full_name || 'مستخدم'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={logout}>
            <LogOut className="h-4 w-4 me-2" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative flex w-64 max-w-[80%] flex-col bg-card">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <h1 className="text-xl font-bold text-primary">ميسرة أحمد</h1>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <ScrollArea className="flex-1 py-4">
              <nav className="space-y-1 px-2">
                {navigation.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </ScrollArea>
            <div className="border-t border-border p-4">
              <Button variant="outline" className="w-full justify-start text-destructive" onClick={logout}>
                <LogOut className="h-4 w-4 me-2" />
                تسجيل الخروج
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-bold text-lg text-primary">ميسرة أحمد</span>
          </div>
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'م'}
          </div>
        </header>
        
        <ScrollArea className="flex-1">
          <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
            {children}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ToastContainer } from '@/components/Toast';
import { AdminLayout } from '@/components/AdminLayout';
import { AuthPage } from '@/pages/AuthPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { CatalogPage } from '@/pages/CatalogPage';
import { WarehousesPage } from '@/pages/WarehousesPage';
import { InventoryPage } from '@/pages/InventoryPage';
import { PosLocationsPage } from '@/pages/PosLocationsPage';
import { PosPage } from '@/pages/PosPage';
import { InvoicesPage } from '@/pages/InvoicesPage';
import { InvoiceDetailPage } from '@/pages/InvoiceDetailPage';
import { ReturnsPage } from '@/pages/ReturnsPage';
import { ShiftsPage } from '@/pages/ShiftsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { UsersPage } from '@/pages/UsersPage';
import { RolesPage } from '@/pages/RolesPage';
import { AuditPage } from '@/pages/AuditPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { Loader2 } from 'lucide-react';

function LoginRoute() {
  const { session, loading } = useAuth();
  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={32} className="animate-spin text-teal-600" />
      </div>
    );
  if (session) return <Navigate to="/" replace />;
  return <AuthPage />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route
        path="/"
        element={
          <ProtectedRoute perm="view_dashboard">
            <AdminLayout>
              <DashboardPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute perm="view_products">
            <AdminLayout>
              <ProductsPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/catalog"
        element={
          <ProtectedRoute perm="view_categories">
            <AdminLayout>
              <CatalogPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/warehouses"
        element={
          <ProtectedRoute perm="view_warehouses">
            <AdminLayout>
              <WarehousesPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute perm="view_inventory">
            <AdminLayout>
              <InventoryPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pos-locations"
        element={
          <ProtectedRoute perm="view_pos">
            <AdminLayout>
              <PosLocationsPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pos"
        element={
          <ProtectedRoute perm="use_pos">
            <PosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoices"
        element={
          <ProtectedRoute perm="view_invoices">
            <AdminLayout>
              <InvoicesPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoices/:id"
        element={
          <ProtectedRoute perm="view_invoices">
            <AdminLayout>
              <InvoiceDetailPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/returns"
        element={
          <ProtectedRoute perm="view_returns">
            <AdminLayout>
              <ReturnsPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/shifts"
        element={
          <ProtectedRoute perm="view_shifts">
            <AdminLayout>
              <ShiftsPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute perm="view_reports">
            <AdminLayout>
              <ReportsPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute perm="view_users">
            <AdminLayout>
              <UsersPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/roles"
        element={
          <ProtectedRoute perm="view_roles">
            <AdminLayout>
              <RolesPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit"
        element={
          <ProtectedRoute perm="view_audit_logs">
            <AdminLayout>
              <AuditPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute perm="manage_settings">
            <AdminLayout>
              <SettingsPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer />
      </BrowserRouter>
    </AuthProvider>
  );
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Login from '@/pages/login';
import Dashboard from '@/pages/dashboard';
import Products from '@/pages/products';
import Catalog from '@/pages/catalog';
import Warehouses from '@/pages/warehouses';
import Inventory from '@/pages/inventory';
import POSLocations from '@/pages/pos-locations';
import POS from '@/pages/pos';
import Invoices from '@/pages/invoices';
import InvoiceDetail from '@/pages/invoice-detail';
import Returns from '@/pages/returns';
import Shifts from '@/pages/shifts';
import Reports from '@/pages/reports';
import UsersPage from '@/pages/users';
import Roles from '@/pages/roles';
import Audit from '@/pages/audit';
import Settings from '@/pages/settings';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Route, Switch, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/login" component={Login} />
        
        <Route path="/">
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </Route>
        
        <Route path="/products">
          <ProtectedRoute>
            <Products />
          </ProtectedRoute>
        </Route>
        
        <Route path="/catalog">
          <ProtectedRoute>
            <Catalog />
          </ProtectedRoute>
        </Route>
        
        <Route path="/warehouses">
          <ProtectedRoute>
            <Warehouses />
          </ProtectedRoute>
        </Route>
        
        <Route path="/inventory">
          <ProtectedRoute>
            <Inventory />
          </ProtectedRoute>
        </Route>
        
        <Route path="/pos-locations">
          <ProtectedRoute>
            <POSLocations />
          </ProtectedRoute>
        </Route>
        
        <Route path="/pos">
          <ProtectedRoute>
            <POS />
          </ProtectedRoute>
        </Route>
        
        <Route path="/invoices">
          <ProtectedRoute>
            <Invoices />
          </ProtectedRoute>
        </Route>
        
        <Route path="/invoices/:id">
          <ProtectedRoute>
            <InvoiceDetail />
          </ProtectedRoute>
        </Route>
        
        <Route path="/returns">
          <ProtectedRoute>
            <Returns />
          </ProtectedRoute>
        </Route>
        
        <Route path="/shifts">
          <ProtectedRoute>
            <Shifts />
          </ProtectedRoute>
        </Route>
        
        <Route path="/reports">
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        </Route>
        
        <Route path="/users">
          <ProtectedRoute>
            <UsersPage />
          </ProtectedRoute>
        </Route>
        
        <Route path="/roles">
          <ProtectedRoute>
            <Roles />
          </ProtectedRoute>
        </Route>
        
        <Route path="/audit">
          <ProtectedRoute>
            <Audit />
          </ProtectedRoute>
        </Route>
        
        <Route path="/settings">
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        </Route>
        
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

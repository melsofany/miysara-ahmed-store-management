import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, useCan } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  perm?: string;
}

export function ProtectedRoute({ children, perm }: ProtectedRouteProps) {
  const { session, loading } = useAuth();
  const { can } = useCan();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={32} className="animate-spin text-teal-600" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  if (perm && !can(perm)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center">
        <p className="text-lg font-bold text-slate-700">لا تملك صلاحية الوصول لهذه الصفحة</p>
        <p className="text-sm text-slate-400">تواصل مع مدير النظام لمنحك الصلاحية المطلوبة.</p>
        <a href="/" className="mi-btn-primary mt-2">العودة للرئيسية</a>
      </div>
    );
  }

  return <>{children}</>;
}

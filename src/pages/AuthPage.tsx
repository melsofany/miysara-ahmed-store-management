import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shirt, LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Logo } from '@/components/Logo';
import { toast } from '@/components/Toast';

export function AuthPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) toast(error, 'error');
      else {
        toast('تم تسجيل الدخول بنجاح', 'success');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left visual panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative">
          <Logo size={48} />
        </div>

        <div className="relative">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
            <Shirt size={28} className="text-amber-300" />
          </div>
          <h1 className="text-4xl font-extrabold leading-tight">
            نظام إدارة سلسلة محلات الملابس
          </h1>
          <p className="mt-4 max-w-md text-lg text-teal-100/80">
            منصة متكاملة لإدارة المخازن، نقاط البيع، الكاشير، المخزون، الفواتير،
            التقارير والشفتات — كل ذلك في مكان واحد.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
            {[
              'إدارة متعددة المخازن',
              'نقاط بيع غير محدودة',
              'متابعة المخزون والحركات',
              'فواتير ومرتجعات',
              'إدارة الشفتات والدرج',
              'تقارير وأرباح لحظية',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-teal-200/60">
          © {new Date().getFullYear()} MIYSARA Ahmed — جميع الحقوق محفوظة
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo size={44} />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-800">
            تسجيل دخول الموظفين
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            أدخل بيانات الحساب المعتمد من إدارة المؤسسة
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mi-label">البريد الإلكتروني</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="mi-input"
                dir="ltr"
              />
            </div>
            <div>
              <label className="mi-label">كلمة المرور</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mi-input"
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mi-btn-primary w-full"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <LogIn size={18} />
              )}
              دخول
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            إنشاء حسابات الموظفين متاح فقط من إدارة المستخدمين للمشرفين المخولين.
          </p>
        </div>
      </div>
    </div>
  );
}

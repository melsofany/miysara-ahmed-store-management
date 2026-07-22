import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Validate environment variables
const validateEnv = () => {
  const missing = [];
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');
  
  if (missing.length > 0) {
    const missingVars = missing.join(' و ');
    document.body.style.cssText =
      'display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f1f5f9;font-family:Cairo,sans-serif;direction:rtl';
    document.body.innerHTML = `
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;max-width:500px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <p style="font-size:48px;margin:0 0 16px">⚙️</p>
        <h2 style="color:#0f172a;margin:0 0 12px;font-size:20px;font-weight:bold">متغيرات البيئة مفقودة</h2>
        <p style="color:#64748b;font-size:14px;margin:0 0 20px;line-height:1.6">
          يجب ضبط <strong>${missingVars}</strong> في إعدادات Render قبل النشر.
        </p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:0 0 20px;text-align:left">
          <p style="color:#0f172a;font-size:12px;font-weight:bold;margin:0 0 8px">الخطوات:</p>
          <ol style="color:#64748b;font-size:12px;margin:0;padding-left:20px;line-height:1.8">
            <li>ادخل إلى Render Dashboard</li>
            <li>اختر هذا المشروع</li>
            <li>انقر على Settings</li>
            <li>اختر Environment</li>
            <li>أضف المتغيرات المفقودة</li>
            <li>انقر Redeploy</li>
          </ol>
        </div>
        <p style="color:#94a3b8;font-size:11px;margin:0">
          أو اقرأ: <strong>RENDER_SETUP.md</strong> للتعليمات الكاملة
        </p>
      </div>`;
    throw new Error(`Missing environment variables: ${missingVars}`);
  }
};

validateEnv();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

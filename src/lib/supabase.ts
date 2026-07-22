import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // Show a visible error in the page instead of a silent blank screen
  document.body.style.cssText =
    'display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f1f5f9;font-family:Cairo,sans-serif;direction:rtl';
  document.body.innerHTML = `
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;max-width:480px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.08)">
      <p style="font-size:32px;margin:0 0 12px">⚙️</p>
      <h2 style="color:#0f172a;margin:0 0 8px;font-size:18px">متغيرات البيئة مفقودة</h2>
      <p style="color:#64748b;font-size:14px;margin:0 0 16px">
        يجب ضبط <code>VITE_SUPABASE_URL</code> و <code>VITE_SUPABASE_ANON_KEY</code>
        في إعدادات Render قبل النشر.
      </p>
      <p style="color:#94a3b8;font-size:12px;margin:0">
        Environment → Add Environment Variable
      </p>
    </div>`;
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

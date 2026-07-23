import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Profile, Role, Permission } from './types';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  role: Role | null;
  permissions: string[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadProfile(uid: string) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('*, role:roles(*)')
      .eq('id', uid)
      .maybeSingle();

    if (prof) {
      setProfile(prof as Profile);
      const roleData = (prof as Profile & { role: Role }).role ?? null;
      setRole(roleData);
      if (roleData) {
        const { data: rp } = await supabase
          .from('role_permissions')
          .select('permission:permissions(key)')
          .eq('role_id', roleData.id);
        const keys = ((rp ?? []) as unknown as { permission: { key: string } }[])
          .map((r) => r.permission?.key)
          .filter((k): k is string => Boolean(k));
        setPermissions(keys);
      } else {
        setPermissions([]);
      }
    } else {
      setProfile(null);
      setRole(null);
      setPermissions([]);
    }
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) {
        loadProfile(data.session.user.id).finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess) {
        (async () => {
          await loadProfile(sess.user.id);
          if (mounted) setLoading(false);
        })();
      } else {
        setProfile(null);
        setRole(null);
        setPermissions([]);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  }

  async function signUp(email: string, password: string, fullName: string) {
    // Fetch the company ID dynamically instead of hardcoding it
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .limit(1)
      .maybeSingle();
    const companyId = company?.id ?? null;

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (data.user) {
      const { error: profErr } = await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        role_id: null,
        company_id: companyId,
        can_view_cost: false,
      });
      if (profErr) return { error: profErr.message };
    }
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setRole(null);
    setPermissions([]);
  }

  async function refreshProfile() {
    if (session) await loadProfile(session.user.id);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        role,
        permissions,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCan() {
  const { permissions, role } = useAuth();
  return {
    can: (perm: string) => role?.key === 'super_admin' || permissions.includes(perm),
    isSuperAdmin: role?.key === 'super_admin',
  };
}

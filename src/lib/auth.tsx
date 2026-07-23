import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { supabase, type LocalSession } from './supabase';
import type { Profile, Role } from './types';

// Use the local session type — no longer depends on @supabase/supabase-js
type Session = LocalSession;

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  role: Role | null;
  permissions: string[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
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

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!mounted) return;
      setSession(sess);
      if (sess) {
        loadProfile(sess.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
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

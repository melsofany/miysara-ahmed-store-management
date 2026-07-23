/**
 * Custom API client — replaces @supabase/supabase-js.
 * Translates the Supabase query-builder API into REST calls to the Express backend.
 */

const API_BASE = '/api';

// ── Token helpers ────────────────────────────────────────────────────────────

function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface LocalSession {
  user: { id: string; email: string };
  access_token: string;
}

type AuthEvent = 'INITIAL_SESSION' | 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED';
type AuthCallback = (event: AuthEvent, session: LocalSession | null) => void;

type FilterType =
  | { type: 'eq'; column: string; value: unknown }
  | { type: 'neq'; column: string; value: unknown }
  | { type: 'gte'; column: string; value: unknown }
  | { type: 'lte'; column: string; value: unknown }
  | { type: 'ilike'; column: string; value: string }
  | { type: 'in'; column: string; value: unknown[] }
  | { type: 'is'; column: string; value: null | boolean }
  | { type: 'or'; value: string };

interface OrderDef { column: string; ascending: boolean }

// ── Auth state ────────────────────────────────────────────────────────────────

const listeners = new Set<AuthCallback>();
let currentSession: LocalSession | null = null;

function setSession(session: LocalSession | null) {
  currentSession = session;
  listeners.forEach((l) => l(session ? 'SIGNED_IN' : 'SIGNED_OUT', session));
}

// Restore from localStorage on module load
const _storedToken = localStorage.getItem('auth_token');
const _storedUserId = localStorage.getItem('auth_user_id');
const _storedEmail = localStorage.getItem('auth_email');
if (_storedToken && _storedUserId) {
  currentSession = {
    user: { id: _storedUserId, email: _storedEmail || '' },
    access_token: _storedToken,
  };
}

// ── Query builder ─────────────────────────────────────────────────────────────

class QueryBuilder {
  private _table: string;
  private _selectStr = '*';
  private _filters: FilterType[] = [];
  private _orderList: OrderDef[] = [];
  private _limitVal?: number;
  private _singleRow = false;

  constructor(table: string) { this._table = table; }

  select(cols: string) { this._selectStr = cols; return this; }

  eq(column: string, value: unknown)  { this._filters.push({ type: 'eq', column, value }); return this; }
  neq(column: string, value: unknown) { this._filters.push({ type: 'neq', column, value }); return this; }
  gte(column: string, value: unknown) { this._filters.push({ type: 'gte', column, value }); return this; }
  lte(column: string, value: unknown) { this._filters.push({ type: 'lte', column, value }); return this; }
  ilike(column: string, value: string){ this._filters.push({ type: 'ilike', column, value }); return this; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  in(column: string, values: any[])   { this._filters.push({ type: 'in', column, value: values }); return this; }
  is(column: string, value: null | boolean) { this._filters.push({ type: 'is', column, value }); return this; }
  or(query: string)                   { this._filters.push({ type: 'or', value: query }); return this; }

  order(column: string, options?: { ascending?: boolean }) {
    this._orderList.push({ column, ascending: options?.ascending ?? true });
    return this;
  }

  limit(n: number) { this._limitVal = n; return this; }

  single()      { this._singleRow = true; return this; }
  maybeSingle() { this._singleRow = true; return this; }

  async _run(): Promise<{ data: unknown; error: { message: string } | null }> {
    try {
      const res = await fetch(`${API_BASE}/query`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          table: this._table,
          select: this._selectStr,
          filters: this._filters,
          order: this._orderList,
          limit: this._limitVal,
          single: this._singleRow,
        }),
      });
      const json = await res.json();
      if (!res.ok) return { data: null, error: { message: json.error || 'Error' } };
      return json;
    } catch (e) {
      return { data: null, error: { message: (e as Error).message } };
    }
  }

  then(
    resolve: (v: { data: unknown; error: unknown }) => void,
    reject: (e: unknown) => void
  ) {
    return this._run().then(resolve, reject);
  }
}

// ── Mutation builder ──────────────────────────────────────────────────────────

type MutationOp = 'insert' | 'update' | 'delete' | 'upsert';

class MutationBuilder {
  private _table: string;
  private _op: MutationOp;
  private _data: unknown;
  private _filters: FilterType[] = [];

  constructor(table: string, op: MutationOp, data?: unknown) {
    this._table = table;
    this._op = op;
    this._data = data;
  }

  eq(column: string, value: unknown) { this._filters.push({ type: 'eq', column, value }); return this; }
  // no-ops for compatibility
  select(_cols?: string) { return this; }

  async _run(): Promise<{ data: unknown; error: { message: string } | null }> {
    try {
      const res = await fetch(`${API_BASE}/mutate`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          table: this._table,
          operation: this._op,
          data: this._data,
          filters: this._filters,
        }),
      });
      const json = await res.json();
      if (!res.ok) return { data: null, error: { message: json.error || 'Error' } };
      return json;
    } catch (e) {
      return { data: null, error: { message: (e as Error).message } };
    }
  }

  then(
    resolve: (v: { data: unknown; error: unknown }) => void,
    reject: (e: unknown) => void
  ) {
    return this._run().then(resolve, reject);
  }
}

// ── Table interface ────────────────────────────────────────────────────────────

function makeTableInterface(table: string) {
  return {
    select(cols?: string) { return new QueryBuilder(table).select(cols || '*'); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    insert(data: any) { return new MutationBuilder(table, 'insert', data); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update(data: any) { return new MutationBuilder(table, 'update', data); },
    delete()          { return new MutationBuilder(table, 'delete'); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    upsert(data: any) { return new MutationBuilder(table, 'upsert', data); },
  };
}

// ── Auth interface ─────────────────────────────────────────────────────────────

const auth = {
  onAuthStateChange(callback: AuthCallback) {
    listeners.add(callback);
    // Fire immediately (async) so caller can set up state before it fires
    setTimeout(() => callback('INITIAL_SESSION', currentSession), 0);
    return {
      data: {
        subscription: { unsubscribe() { listeners.delete(callback); } },
      },
    };
  },

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) return { data: null, error: { message: json.error } };
      const session: LocalSession = {
        user: { id: json.userId, email },
        access_token: json.token,
      };
      localStorage.setItem('auth_token', json.token);
      localStorage.setItem('auth_user_id', json.userId);
      localStorage.setItem('auth_email', email);
      setSession(session);
      return { data: { session, user: session.user }, error: null };
    } catch (e) {
      return { data: null, error: { message: (e as Error).message } };
    }
  },

  async createEmployee({
    email,
    password,
    fullName,
    roleId,
    companyId,
    canViewCost,
  }: {
    email: string;
    password: string;
    fullName: string;
    roleId: string | null;
    companyId: string | null;
    canViewCost: boolean;
  }) {
    try {
      const res = await fetch(`${API_BASE}/auth/employees`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ email, password, fullName, roleId, companyId, canViewCost }),
      });
      const json = await res.json();
      if (!res.ok) return { data: null, error: { message: json.error || 'حدث خطأ أثناء إنشاء الموظف' } };
      return { data: json, error: null };
    } catch (e) {
      return { data: null, error: { message: (e as Error).message } };
    }
  },

  async signOut() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user_id');
    localStorage.removeItem('auth_email');
    setSession(null);
    return { error: null };
  },

  getSession() {
    return { data: { session: currentSession }, error: null };
  },
};

// ── Main export ────────────────────────────────────────────────────────────────

export const supabase = {
  from: (table: string) => makeTableInterface(table),
  auth,
};

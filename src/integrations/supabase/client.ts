// PHP Backend API Wrapper — drop-in replacement for Supabase client
// All calls route to /api/*.php on the same domain

import type { Database } from './types';

const API_BASE = '/api';

// Session management via localStorage
function getToken(): string | null {
  try {
    const raw = localStorage.getItem('auth_session');
    if (raw) {
      const session = JSON.parse(raw);
      return session?.access_token || null;
    }
  } catch {}
  return null;
}

function getSession(): any {
  try {
    const raw = localStorage.getItem('auth_session');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function setSession(session: any) {
  if (session) {
    localStorage.setItem('auth_session', JSON.stringify(session));
  } else {
    localStorage.removeItem('auth_session');
  }
}

// Auth state change listeners
type AuthListener = (event: string, session: any) => void;
const authListeners: Set<AuthListener> = new Set();

function notifyAuthListeners(event: string, session: any) {
  authListeners.forEach(listener => {
    try { listener(event, session); } catch(e) { console.error('Auth listener error:', e); }
  });
}

// Helper to make API requests
async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}/${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Detect non-JSON responses (e.g. HTML 404 pages)
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    if (text.trim().startsWith('<')) {
      throw new Error(`API endpoint not reachable at ${url} — server returned HTML instead of JSON. Check that PHP files exist in /api/ folder.`);
    }
    // Try parsing anyway in case content-type header is missing but body is JSON
    try {
      const data = JSON.parse(text);
      return { response, data };
    } catch {
      throw new Error(`API endpoint ${url} returned invalid response: ${text.substring(0, 100)}`);
    }
  }

  const data = await response.json();
  return { response, data };
}

// Query builder that mimics Supabase's chainable API
class QueryBuilder {
  private table: string;
  private action: string;
  private _filters: Array<{ type: string; column?: string; value?: any }> = [];
  private _options: {
    select?: string;
    order_by?: string;
    order_asc?: boolean;
    limit?: number;
    count?: string;
    head?: boolean;
    onConflict?: string;
    body?: any;
    range_from?: number;
    range_to?: number;
  } = {};

  constructor(table: string, action: string, body?: any) {
    this.table = table;
    this.action = action;
    if (body !== undefined) this._options.body = body;
  }

  select(columns = '*', opts?: { count?: string; head?: boolean }) {
    this._options.select = columns;
    if (opts?.count) this._options.count = opts.count;
    if (opts?.head) this._options.head = opts.head;
    return this;
  }

  eq(column: string, value: any) {
    this._filters.push({ type: 'eq', column, value });
    return this;
  }

  neq(column: string, value: any) {
    this._filters.push({ type: 'neq', column, value });
    return this;
  }

  gt(column: string, value: any) {
    this._filters.push({ type: 'gt', column, value });
    return this;
  }

  gte(column: string, value: any) {
    this._filters.push({ type: 'gte', column, value });
    return this;
  }

  lt(column: string, value: any) {
    this._filters.push({ type: 'lt', column, value });
    return this;
  }

  lte(column: string, value: any) {
    this._filters.push({ type: 'lte', column, value });
    return this;
  }

  like(column: string, value: any) {
    this._filters.push({ type: 'like', column, value });
    return this;
  }

  ilike(column: string, value: any) {
    this._filters.push({ type: 'ilike', column, value });
    return this;
  }

  is(column: string, value: any) {
    this._filters.push({ type: 'is', column, value });
    return this;
  }

  in(column: string, values: any[]) {
    this._filters.push({ type: 'in', column, value: values });
    return this;
  }

  not(column: string, operator: string, value: any) {
    this._filters.push({ type: 'not', column, value: { operator, value } });
    return this;
  }

  or(filterString: string) {
    this._filters.push({ type: 'or', value: filterString });
    return this;
  }

  contains(column: string, value: any) {
    this._filters.push({ type: 'contains', column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this._options.order_by = column;
    this._options.order_asc = options?.ascending ?? true;
    return this;
  }

  limit(count: number) {
    this._options.limit = count;
    return this;
  }

  range(from: number, to: number) {
    this._options.range_from = from;
    this._options.range_to = to;
    return this;
  }

  async maybeSingle(): Promise<{ data: any; error: any; count?: number }> {
    this._options.limit = 1;
    const result = await this._execute();
    return {
      data: Array.isArray(result.data) ? (result.data[0] || null) : result.data,
      error: result.error,
      count: result.count,
    };
  }

  async single(): Promise<{ data: any; error: any }> {
    this._options.limit = 1;
    const result = await this._execute();
    const row = Array.isArray(result.data) ? result.data[0] : result.data;
    if (!row && !result.error) {
      return { data: null, error: { message: 'Row not found', code: 'PGRST116' } };
    }
    return { data: row || null, error: result.error };
  }

  private async _execute(): Promise<{ data: any; error: any; count?: number }> {
    try {
      const payload: any = {
        table: this.table,
        action: this.action,
        filters: this._filters,
        ...this._options,
      };

      const { data } = await apiRequest('data.php', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (data?.error) {
        return { data: null, error: { message: data.error } };
      }

      return {
        data: data?.data ?? data,
        error: null,
        count: data?.count ?? undefined,
      };
    } catch (err: any) {
      return { data: null, error: { message: err.message } };
    }
  }

  then(resolve: (value: any) => any, reject?: (error: any) => any) {
    return this._execute().then(resolve, reject);
  }
}

// Storage wrapper
function createStorageBucket(bucketName: string) {
  return {
    upload: async (path: string, file: File, options?: any) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucketName);
      formData.append('path', path);
      if (options?.cacheControl) formData.append('cacheControl', options.cacheControl);

      try {
        const token = getToken();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE}/upload.php`, {
          method: 'POST',
          headers,
          body: formData,
        });
        const data = await response.json();
        if (data.error) return { data: null, error: { message: data.error } };
        return { data: data.data || { path }, error: null };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    },
    getPublicUrl: (path: string) => {
      return {
        data: { publicUrl: `/uploads/${bucketName}/${path}` },
      };
    },
    remove: async (paths: string[]) => {
      try {
        const { data } = await apiRequest('upload.php', {
          method: 'POST',
          body: JSON.stringify({ action: 'delete', bucket: bucketName, paths }),
        });
        return { data, error: data?.error ? { message: data.error } : null };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    },
  };
}

// Main supabase-compatible client export
export const supabase = {
  from: (table: string) => ({
    select: (columns = '*', opts?: { count?: string; head?: boolean }) => {
      const qb = new QueryBuilder(table, 'select');
      return qb.select(columns, opts);
    },
    insert: (data: any) => {
      return new QueryBuilder(table, 'insert', Array.isArray(data) ? data : [data]);
    },
    update: (data: any) => {
      return new QueryBuilder(table, 'update', data);
    },
    delete: () => {
      return new QueryBuilder(table, 'delete');
    },
    upsert: (data: any, options?: { onConflict?: string }) => {
      const qb = new QueryBuilder(table, 'upsert', Array.isArray(data) ? data : [data]);
      if (options?.onConflict) {
        (qb as any)._options.onConflict = options.onConflict;
      }
      return qb;
    },
  }),

  auth: {
    signUp: async ({ email, password, options }: any) => {
      try {
        const { data } = await apiRequest('auth.php?action=signup', {
          method: 'POST',
          body: JSON.stringify({
            email, password,
            full_name: options?.data?.full_name,
            redirect_to: options?.emailRedirectTo,
          }),
        });
        if (data?.error) return { data: { user: null, session: null }, error: { message: data.error } };
        if (data?.session) { setSession(data.session); notifyAuthListeners('SIGNED_IN', data.session); }
        return { data: { user: data?.user || null, session: data?.session || null }, error: null };
      } catch (err: any) {
        return { data: { user: null, session: null }, error: { message: err.message } };
      }
    },

    signInWithPassword: async ({ email, password }: any) => {
      try {
        const { data } = await apiRequest('auth.php?action=login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        if (data?.error) return { data: { user: null, session: null }, error: { message: data.error } };
        if (data?.session) { setSession(data.session); notifyAuthListeners('SIGNED_IN', data.session); }
        return { data: { user: data?.user || null, session: data?.session || null }, error: null };
      } catch (err: any) {
        return { data: { user: null, session: null }, error: { message: err.message } };
      }
    },

    signOut: async () => {
      try { await apiRequest('auth.php?action=logout', { method: 'POST' }); } catch {}
      setSession(null);
      notifyAuthListeners('SIGNED_OUT', null);
      return { error: null };
    },

    getSession: async () => {
      const session = getSession();
      if (!session) return { data: { session: null }, error: null };
      try {
        const { data } = await apiRequest('auth.php?action=session', { method: 'POST' });
        if (data?.session) { setSession(data.session); return { data: { session: data.session }, error: null }; }
        setSession(null);
        return { data: { session: null }, error: null };
      } catch {
        return { data: { session }, error: null };
      }
    },

    refreshSession: async () => {
      try {
        const { data } = await apiRequest('auth.php?action=refresh', { method: 'POST' });
        if (data?.session) { setSession(data.session); return { data: { session: data.session }, error: null }; }
        return { data: { session: null }, error: { message: 'Failed to refresh' } };
      } catch (err: any) {
        return { data: { session: null }, error: { message: err.message } };
      }
    },

    getUser: async () => {
      const session = getSession();
      return { data: { user: session?.user || null }, error: null };
    },

    onAuthStateChange: (callback: AuthListener) => {
      authListeners.add(callback);
      const session = getSession();
      if (session) {
        setTimeout(() => callback('INITIAL_SESSION', session), 0);
      }
      return {
        data: {
          subscription: {
            unsubscribe: () => { authListeners.delete(callback); },
          },
        },
      };
    },

    verifyOtp: async (params: any) => {
      try {
        const { data } = await apiRequest('auth.php?action=verify-otp', {
          method: 'POST',
          body: JSON.stringify(params),
        });
        if (data?.error) return { data: null, error: { message: data.error } };
        if (data?.session) { setSession(data.session); notifyAuthListeners('SIGNED_IN', data.session); }
        return { data, error: null };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    },
  },

  functions: {
    invoke: async (functionName: string, options?: { body?: any }) => {
      try {
        const { data } = await apiRequest(`${functionName}.php`, {
          method: 'POST',
          body: options?.body ? JSON.stringify(options.body) : '{}',
        });
        if (data?.error && typeof data.error === 'string') {
          return { data, error: { message: data.error } };
        }
        return { data, error: null };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    },
  },

  storage: {
    from: (bucketName: string) => createStorageBucket(bucketName),
  },

  channel: (_name: string) => ({
    on: (_type: string, _filter: any, _callback: any) => ({
      subscribe: () => {
        console.warn('Realtime channels not supported in PHP backend');
        return { unsubscribe: () => {} };
      },
    }),
  }),
};

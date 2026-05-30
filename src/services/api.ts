const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface TokenPair {
  access: string;
  refresh: string;
}

export function getTokens(): TokenPair | null {
  const access = localStorage.getItem('access_token');
  const refresh = localStorage.getItem('refresh_token');
  if (!access || !refresh) return null;
  return { access, refresh };
}

export function setTokens(tokens: TokenPair) {
  localStorage.setItem('access_token', tokens.access);
  localStorage.setItem('refresh_token', tokens.refresh);
}

export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

async function refreshAccessToken(): Promise<string | null> {
  const tokens = getTokens();
  if (!tokens?.refresh) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: tokens.refresh }),
    });
    if (!res.ok) {
      clearTokens();
      return null;
    }
    const data = await res.json();
    localStorage.setItem('access_token', data.access);
    return data.access;
  } catch {
    clearTokens();
    return null;
  }
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const tokens = getTokens();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (tokens?.access) {
    headers['Authorization'] = `Bearer ${tokens.access}`;
  }

  let res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // If 401, try refreshing the token
  if (res.status === 401 && tokens?.refresh) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      headers['Authorization'] = `Bearer ${newAccess}`;
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || error.message || JSON.stringify(error));
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

// Auth endpoints
export async function login(username: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(error.detail || 'Invalid credentials');
  }
  const data = await res.json();
  // The dashboard is for administrators only. Reject non-admin accounts BEFORE
  // persisting any tokens — a self-registered trainee must never get a session.
  const user = data.user;
  if (!user?.is_institution_admin && !user?.is_platform_admin) {
    throw new Error('This dashboard is for administrators only.');
  }
  setTokens({ access: data.access, refresh: data.refresh });
  return user;
}

// --- Public self-registration (no auth) -----------------------------------
// These power the standalone /signup page. They intentionally do NOT store
// tokens: registering creates a trainee account for the DHRT training app,
// it does not grant dashboard access.

export interface ValidateCodeDepartment {
  id: number;
  name: string;
}

export interface ValidateCodeResponse {
  valid: boolean;
  institution?: { id: number; name: string; slug: string };
  departments?: ValidateCodeDepartment[];
  detail?: string;
}

export async function validateCode(code: string): Promise<ValidateCodeResponse> {
  const res = await fetch(`${API_BASE}/auth/validate-code/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registration_code: code.trim().toUpperCase() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { valid: false, detail: data.detail || 'Invalid registration code.' };
  }
  return data;
}

export interface RegisterPayload {
  email: string;
  full_name: string;
  password: string;
  registration_code: string;
  department_id: number;
  unit: string;
}

export async function registerAccount(payload: RegisterPayload): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      registration_code: payload.registration_code.trim().toUpperCase(),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const firstField = (v: unknown) =>
      Array.isArray(v) ? String(v[0]) : typeof v === 'string' ? v : null;
    const msg =
      firstField(err.detail) ||
      firstField(err.registration_code) ||
      firstField(err.email) ||
      firstField(err.password) ||
      firstField(err.department_id) ||
      firstField(err.unit) ||
      firstField(err.non_field_errors) ||
      'Registration failed. Please check your details and try again.';
    throw new Error(msg);
  }
  // NOTE: /auth/register/ returns access + refresh tokens. We deliberately
  // discard them — self-signup must not produce a dashboard session.
}

export async function logout() {
  const tokens = getTokens();
  if (tokens?.refresh) {
    try {
      await apiFetch('/auth/logout/', {
        method: 'POST',
        body: JSON.stringify({ refresh: tokens.refresh }),
      });
    } catch {
      // Ignore logout errors
    }
  }
  clearTokens();
}

export async function getProfile() {
  return apiFetch('/auth/profile/');
}

// Paginated response type
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

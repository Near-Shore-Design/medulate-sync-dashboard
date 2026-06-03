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

// --- Superadmin institution filter -----------------------------------------
// Platform admins see every institution's data merged; the header dropdown
// narrows to one institution. The backend only honors ?institution= for
// superusers, so appending it globally to GETs is harmless for everyone else.
let institutionFilter: number | null = null;

export function setApiInstitutionFilter(id: number | null) {
  institutionFilter = id;
}

function withInstitutionFilter(path: string, method: string): string {
  if (method !== 'GET' || institutionFilter == null) return path;
  return `${path}${path.includes('?') ? '&' : '?'}institution=${institutionFilter}`;
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

  const method = (options.method || 'GET').toUpperCase();
  const url = `${API_BASE}${withInstitutionFilter(path, method)}`;
  let res = await fetch(url, { ...options, headers });

  // If 401, try refreshing the token
  if (res.status === 401 && tokens?.refresh) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      headers['Authorization'] = `Bearer ${newAccess}`;
      res = await fetch(url, { ...options, headers });
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

// Trainee self-registration happens inside the DHRT (Unity) app using a
// registration code handed out by an instructor/admin — see the
// Registration Codes page. The dashboard has no public signup.

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

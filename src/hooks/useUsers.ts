import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiFetch, type PaginatedResponse } from '@/services/api';

// Admin user management — /api/users/ (institution admins: own institution;
// platform admins: every institution, narrowed by the header institution filter).

export type AccountType = 'trainee' | 'instructor' | 'institution_admin' | 'platform_admin';

export const ACCOUNT_TYPE_LABELS: Record<AccountType | 'user', string> = {
  trainee: 'Trainee',
  instructor: 'Instructor',
  institution_admin: 'Institution admin',
  platform_admin: 'Platform admin',
  user: 'No role',
};

export const UNIT_OPTIONS = [
  { value: 'anesthesia', label: 'Anesthesia' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'internal_medicine', label: 'Internal Medicine' },
  { value: 'app', label: 'Advanced Practice Providers' },
];

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
  institution: { id: number; name: string; slug: string; is_active: boolean } | null;
  department: { id: number; name: string } | null;
  account_types: AccountType[];
  account_type: AccountType | 'user';
  is_institution_admin: boolean;
  is_platform_admin: boolean;
  trainee: {
    id: number;
    unit: string;
    cohort: string;
    deadline: string | null;
    verification_status: string;
  } | null;
  instructor: { id: number; assigned_areas: string[] } | null;
  role_names: string[];
}

export interface UserFilters {
  search?: string;
  accountType?: AccountType | 'user' | 'all';
  status?: 'all' | 'active' | 'inactive';
  department?: number | null;
  page?: number;
  pageSize?: number;
}

export function buildUsersQuery(filters: UserFilters): string {
  const params = new URLSearchParams();
  const search = filters.search?.trim();
  if (search) params.set('search', search);
  if (filters.accountType && filters.accountType !== 'all') params.set('account_type', filters.accountType);
  if (filters.status === 'active') params.set('is_active', 'true');
  if (filters.status === 'inactive') params.set('is_active', 'false');
  if (filters.department != null) params.set('department', String(filters.department));
  params.set('page', String(filters.page ?? 1));
  params.set('page_size', String(filters.pageSize ?? 50));
  return `/users/?${params.toString()}`;
}

export interface UserWritePayload {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  account_types?: AccountType[];
  institution?: number | null;
  department?: number | null;
  unit?: string;
  cohort?: string;
  deadline?: string | null;
  is_active?: boolean;
}

export type CreatedUser = AdminUser & { temporary_password: string | null };

export function useUsers(filters: UserFilters) {
  return useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () => apiFetch<PaginatedResponse<AdminUser>>(buildUsersQuery(filters)),
    placeholderData: keepPreviousData,
  });
}

// Everything a user change can affect elsewhere in the portal.
function useInvalidateUserData() {
  const queryClient = useQueryClient();
  return () => {
    for (const key of ['admin-users', 'trainees', 'coordinators', 'institution-admins', 'institutions', 'admin-departments']) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  };
}

export function useCreateUser() {
  const invalidate = useInvalidateUserData();
  return useMutation({
    mutationFn: (payload: UserWritePayload) =>
      apiFetch<CreatedUser>('/users/', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: invalidate,
  });
}

export function useUpdateUser() {
  const invalidate = useInvalidateUserData();
  return useMutation({
    mutationFn: ({ id, ...payload }: UserWritePayload & { id: number }) =>
      apiFetch<AdminUser>(`/users/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: invalidate,
  });
}

export function useSetUserActive() {
  const invalidate = useInvalidateUserData();
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      apiFetch<AdminUser>(`/users/${id}/${active ? 'reactivate' : 'deactivate'}/`, { method: 'POST' }),
    onSuccess: invalidate,
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidateUserData();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/users/${id}/`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}

export function useSetUserPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: number; password?: string }) =>
      apiFetch<{ detail: string; temporary_password: string | null }>(`/users/${id}/set-password/`, {
        method: 'POST',
        body: JSON.stringify({ password: password ?? '' }),
      }),
  });
}

export function useSendPasswordReset() {
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<{ detail: string }>(`/users/${id}/send-password-reset/`, { method: 'POST' }),
  });
}

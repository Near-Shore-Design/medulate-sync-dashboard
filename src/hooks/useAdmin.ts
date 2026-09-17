import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, type PaginatedResponse } from '@/services/api';

export interface Institution {
  id: number;
  name: string;
  slug: string;
  contact_email: string;
  registration_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_count?: number;
  admin_count?: number;
  trainee_count?: number;
  department_count?: number;
}

export interface InstitutionAdmin {
  id: number;
  email: string;
  full_name: string;
  institution: { id: number; name: string; slug: string } | null;
  is_institution_admin: boolean;
  date_joined: string;
}

export interface CreateInstitutionPayload {
  name: string;
  slug: string;
  contact_email?: string;
  // Optional first institution admin, provisioned in the same transaction.
  admin_email?: string;
  admin_full_name?: string;
  admin_password?: string;
}

export type CreatedInstitution = Institution & {
  admin: InstitutionAdmin | null;
  temporary_password: string | null;
};

export interface UpdateInstitutionPayload {
  id: number;
  name?: string;
  slug?: string;
  contact_email?: string;
}

export interface CreateAdminPayload {
  institutionId: number;
  email: string;
  full_name: string;
  // Blank => the API generates a temporary password and returns it once.
  password: string;
}

// Platform-admin-only endpoint — gate with `enabled` so institution admins
// never fire a request that would 403.
export function useInstitutions(enabled = true) {
  return useQuery({
    queryKey: ['institutions'],
    queryFn: async () => {
      const data = await apiFetch<PaginatedResponse<Institution>>('/tenants/institutions/?page_size=500');
      return data.results;
    },
    enabled,
  });
}

export function useCreateInstitution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInstitutionPayload) =>
      apiFetch<CreatedInstitution>('/tenants/institutions/', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

export function useUpdateInstitution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateInstitutionPayload) =>
      apiFetch<Institution>(`/tenants/institutions/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
    },
  });
}

export function useSetInstitutionActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      apiFetch<Institution>(`/tenants/institutions/${id}/${active ? 'reactivate' : 'deactivate'}/`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

export function useDeleteInstitution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/tenants/institutions/${id}/`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
    },
  });
}

export function useInstitutionAdmins(institutionId: number | null) {
  return useQuery({
    queryKey: ['institution-admins', institutionId],
    queryFn: () =>
      apiFetch<InstitutionAdmin[]>(`/tenants/institutions/${institutionId}/admins/`),
    enabled: institutionId != null,
  });
}

export function useCreateInstitutionAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ institutionId, ...payload }: CreateAdminPayload) =>
      apiFetch<InstitutionAdmin & { temporary_password: string | null }>(
        `/tenants/institutions/${institutionId}/admins/`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['institution-admins', variables.institutionId] });
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

export function useRemoveInstitutionAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ institutionId, userId }: { institutionId: number; userId: number }) =>
      apiFetch(`/tenants/institutions/${institutionId}/admins/${userId}/`, { method: 'DELETE' }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['institution-admins', variables.institutionId] });
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

// --- Departments (institution admins: own institution; platform admins: any) ---

export interface AdminDepartment {
  id: number;
  name: string;
  institution: number | null;
  institution_name: string | null;
  user_count: number;
  created_at: string;
}

export function useAdminDepartments() {
  return useQuery({
    queryKey: ['admin-departments'],
    queryFn: async () => {
      const data = await apiFetch<PaginatedResponse<AdminDepartment>>(
        '/coordinators/departments/?page_size=500',
      );
      return data.results;
    },
  });
}

function useInvalidateDepartments() {
  const queryClient = useQueryClient();
  return () => {
    for (const key of ['admin-departments', 'departments', 'department-options', 'institutions']) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  };
}

export function useCreateDepartment() {
  const invalidate = useInvalidateDepartments();
  return useMutation({
    mutationFn: (payload: { name: string; institution?: number }) =>
      apiFetch<AdminDepartment>('/coordinators/departments/', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: invalidate,
  });
}

export function useRenameDepartment() {
  const invalidate = useInvalidateDepartments();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      apiFetch<AdminDepartment>(`/coordinators/departments/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteDepartment() {
  const invalidate = useInvalidateDepartments();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/coordinators/departments/${id}/`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}

// --- Feature flags (platform admins) ---

export interface FeatureFlag {
  id: number;
  key: string;
  enabled: boolean;
  note: string;
  updated_at: string;
}

export function useFeatureFlags(enabled = true) {
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: () => apiFetch<FeatureFlag[]>('/tenants/feature-flags/'),
    enabled,
  });
}

export function useSaveFeatureFlag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id?: number; key?: string; enabled: boolean; note?: string }) =>
      apiFetch<FeatureFlag>(id ? `/tenants/feature-flags/${id}/` : '/tenants/feature-flags/', {
        method: id ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
    },
  });
}

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
}

export interface CreateAdminPayload {
  institutionId: number;
  email: string;
  full_name: string;
  password: string;
}

// Platform-admin-only endpoint — gate with `enabled` so institution admins
// never fire a request that would 403.
export function useInstitutions(enabled = true) {
  return useQuery({
    queryKey: ['institutions'],
    queryFn: async () => {
      const data = await apiFetch<PaginatedResponse<Institution>>('/tenants/institutions/');
      return data.results;
    },
    enabled,
  });
}

export function useCreateInstitution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInstitutionPayload) =>
      apiFetch<Institution>('/tenants/institutions/', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
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
      apiFetch<InstitutionAdmin>(`/tenants/institutions/${institutionId}/admins/`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['institution-admins', variables.institutionId] });
    },
  });
}

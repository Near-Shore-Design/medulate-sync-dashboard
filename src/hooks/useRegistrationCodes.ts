import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, type PaginatedResponse } from '@/services/api';

export interface RegistrationCode {
  id: number;
  institution: number;
  institution_name: string;
  department: number | null;
  department_name: string | null;
  code: string;
  label: string;
  is_active: boolean;
  created_by: number | null;
  created_by_username: string | null;
  trainee_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCodePayload {
  label: string;
  department?: number | null;
  // Required for platform admins, ignored for institution admins.
  institution?: number;
}

export interface DepartmentOption {
  id: number;
  name: string;
}

export function useRegistrationCodes() {
  return useQuery({
    queryKey: ['registration-codes'],
    queryFn: async () => {
      const data = await apiFetch<PaginatedResponse<RegistrationCode>>(
        '/tenants/registration-codes/'
      );
      return data.results;
    },
  });
}

// Departments with ids for the create-code form (useCoordinators' variant
// only returns names). Tenant-scoped; follows the superadmin header filter.
export function useDepartmentOptions() {
  return useQuery({
    queryKey: ['department-options'],
    queryFn: async () => {
      const data = await apiFetch<PaginatedResponse<DepartmentOption>>(
        '/coordinators/departments/'
      );
      return data.results.map((d) => ({ id: d.id, name: d.name }));
    },
  });
}

export function useCreateRegistrationCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCodePayload) =>
      apiFetch<RegistrationCode>('/tenants/registration-codes/', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registration-codes'] });
    },
  });
}

export function useDeactivateRegistrationCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (codeId: number) =>
      apiFetch<RegistrationCode>(`/tenants/registration-codes/${codeId}/deactivate/`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registration-codes'] });
    },
  });
}

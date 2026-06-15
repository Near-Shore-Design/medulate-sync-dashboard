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
  // Default "assignments" inherited by trainees who register with this code.
  default_cohort: string;
  default_deadline: string | null; // 'YYYY-MM-DD'
  default_modules: string[];        // module names
}

export interface CreateCodePayload {
  label: string;
  department?: number | null;
  // Required for platform admins, ignored for institution admins.
  institution?: number;
  // Optional custom code. Leave blank to let the backend auto-generate.
  code?: string;
  // Default assignments applied to trainees who register with the code.
  default_cohort?: string;
  default_deadline?: string | null;
  default_modules?: string[];
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

// Edit an existing code (label, department, and the default assignments). The
// RegistrationCode viewset is a ModelViewSet, so PATCH is supported server-side.
export type UpdateCodePayload = Partial<
  Pick<CreateCodePayload, 'label' | 'department' | 'default_cohort' | 'default_deadline' | 'default_modules'>
>;

export function useUpdateRegistrationCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateCodePayload & { id: number }) =>
      apiFetch<RegistrationCode>(`/tenants/registration-codes/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registration-codes'] });
    },
  });
}

// Curriculum module catalog (/trainees/modules/) for the assignment multi-select.
export function useModuleOptions() {
  return useQuery({
    queryKey: ['module-options'],
    queryFn: async () => {
      const data = await apiFetch<PaginatedResponse<{ id: number; name: string; order: number }>>(
        '/trainees/modules/'
      );
      return data.results.map((m) => ({ id: m.id, name: m.name }));
    },
  });
}

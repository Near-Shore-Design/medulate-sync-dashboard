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
  default_cases: number[];          // case numbers (1-17)
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
  default_cases?: number[];
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
  Pick<CreateCodePayload, 'label' | 'department' | 'default_cohort' | 'default_deadline' | 'default_cases'>
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

// Patient cases (1-17) for the assignment multi-select — these are what the experience
// actually uses (not the 5 global Skill-Mastery modules). Scoped to the header institution
// filter via apiFetch, but every institution has the same case_numbers 1-17.
export function useCaseOptions() {
  return useQuery({
    queryKey: ['case-options'],
    queryFn: async () => {
      const data = await apiFetch<
        | PaginatedResponse<{ id: number; case_number: number; case_name: string }>
        | { id: number; case_number: number; case_name: string }[]
      >('/cases/patient-cases/?page_size=100');
      const list = Array.isArray(data) ? data : data.results;
      return list
        .filter((c) => c.case_number != null)
        .sort((a, b) => a.case_number - b.case_number)
        .map((c) => ({ case_number: c.case_number, case_name: c.case_name }));
    },
  });
}

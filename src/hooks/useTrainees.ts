import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, type PaginatedResponse } from '@/services/api';
import type { Student } from '@/data/mockData';

// API response shape — scores are now computed from CaseAttempt
interface TraineeAPI {
  id: number;
  user: number;
  name: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  unit: string;
  verification_status: string;
  deadline: string | null;
  days_remaining: number | null;
  current_module: string;
  cohort: string;
  last_activity: string | null;
  // Computed from CaseAttempt
  latest_score: number;
  avg_score: number;
  total_attempts: number;
  cases_passed: number;
  error_count: number;
  needs_practice: boolean;
  walkthrough_complete: number;
  created_at: string;
  updated_at: string;
}

const UNIT_MAP: Record<string, Student['unit']> = {
  anesthesia: 'Anesthesia',
  surgery: 'Surgery',
  internal_medicine: 'Internal Medicine',
  app: 'Advanced Practice Providers',
};

const UNIT_REVERSE_MAP: Record<string, string> = {
  'Anesthesia': 'anesthesia',
  'Surgery': 'surgery',
  'Internal Medicine': 'internal_medicine',
  'Advanced Practice Providers': 'app',
};

const VERIFICATION_MAP: Record<string, Student['verificationStatus']> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  verified: 'Verified',
};

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function transformTrainee(t: TraineeAPI): Student {
  const fullName = t.name || `${t.first_name} ${t.last_name}`.trim() || t.username;
  return {
    id: String(t.id),
    userId: String(t.user),
    casesPassed: t.cases_passed,
    totalAttempts: t.total_attempts,
    name: fullName,
    avatar: getInitials(fullName),
    unit: UNIT_MAP[t.unit] || t.unit as Student['unit'],
    walkthroughComplete: t.walkthrough_complete,
    verificationStatus: VERIFICATION_MAP[t.verification_status] || t.verification_status as Student['verificationStatus'],
    latestScore: t.latest_score,
    lastActivity: formatTimeAgo(t.last_activity),
    deadline: t.deadline || '',
    daysRemaining: t.days_remaining ?? 0,
    needsPractice: t.needs_practice,
    currentModule: t.current_module,
    cohort: t.cohort,
  };
}

export function useTrainees(filters?: { unit?: string; verification_status?: string; cohort?: string }) {
  const params = new URLSearchParams();
  if (filters?.unit && filters.unit !== 'All') {
    params.set('unit', UNIT_REVERSE_MAP[filters.unit] || filters.unit);
  }
  if (filters?.verification_status) params.set('verification_status', filters.verification_status);
  if (filters?.cohort) params.set('cohort', filters.cohort);

  const query = params.toString();
  const path = `/trainees/${query ? `?${query}` : ''}`;

  return useQuery({
    queryKey: ['trainees', filters],
    queryFn: async () => {
      const data = await apiFetch<PaginatedResponse<TraineeAPI>>(path);
      return data.results.map(transformTrainee);
    },
  });
}

export function useTraineeSummary() {
  return useQuery({
    queryKey: ['trainees', 'summary'],
    queryFn: () => apiFetch('/trainees/summary/'),
  });
}

export function useCreateTrainee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      user: number;
      unit: string;
      deadline?: string;
      cohort?: string;
    }) => apiFetch('/trainees/', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        unit: UNIT_REVERSE_MAP[data.unit] || data.unit,
      }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainees'] });
    },
  });
}

export function useRegisterTrainee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      first_name: string;
      last_name: string;
      email: string;
      unit: string;
      deadline?: string;
      cohort?: string;
      current_module?: string;
    }) => apiFetch('/trainees/register/', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        unit: UNIT_REVERSE_MAP[data.unit] || data.unit,
      }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainees'] });
    },
  });
}

export function useBatchImportTrainees() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (trainees: Array<{
      username: string;
      email: string;
      first_name?: string;
      last_name?: string;
      unit: string;
      cohort?: string;
      deadline?: string;
    }>) => apiFetch('/trainees/batch-import/', {
      method: 'POST',
      body: JSON.stringify({ trainees: trainees.map(t => ({
        ...t,
        unit: UNIT_REVERSE_MAP[t.unit] || t.unit,
      })) }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainees'] });
    },
  });
}

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/services/api';
import type { ErrorType } from '@/data/mockData';

interface ErrorSummaryItem {
  name: string;
  count: number;
}

// Error catalog metadata (severity/description/tip) from /rating/error-types/.
interface ErrorTypeMeta {
  id: number;
  name: string;
  severity: 'critical' | 'moderate' | 'minor';
  description: string;
  tip: string;
  legacy_fail_type: number | null;
}

// A single graded needle attempt as returned by /rating/needle-feedback/.
export interface NeedleFeedbackAPI {
  id: number;
  user: number;
  case: number | null;
  percent_score: number; // 0..1
  aspiration_rate: number;
  insert_attempts: number;
  tip_tracking_rate: number;
  needle_angle: number;
  vein_centered_state: boolean;
  fail_type: number;
  errors: string[];
  rubric_version: number | null;
  passed: boolean;
  created_at: string;
}

/**
 * Global error summary (name + count) across the tenant's graded attempts, joined
 * with the ErrorType catalog so the real severity is used (not a hardcoded value).
 *
 * NOTE: the rating data lives under /rating/needle-feedback/ — the old
 * /cases/attempts/ routes this hook used to call were removed when scoring moved
 * to the NeedleFeedback model, so every error display was silently 404ing and
 * falling back to mock. These are the live endpoints.
 */
export function useErrorTypes() {
  return useQuery({
    queryKey: ['errorTypes'],
    queryFn: async () => {
      const [summary, meta] = await Promise.all([
        apiFetch<ErrorSummaryItem[]>('/rating/needle-feedback/error-summary/'),
        apiFetch<ErrorTypeMeta[]>('/rating/error-types/').catch(() => [] as ErrorTypeMeta[]),
      ]);
      const severityByName = new Map(meta.map((m) => [m.name, m.severity]));
      return summary.map((e): ErrorType => ({
        name: e.name,
        count: e.count,
        severity: severityByName.get(e.name) ?? 'moderate',
      }));
    },
  });
}

/**
 * Map of trainee USER id -> distinct error names, from their NeedleFeedback history.
 * Keyed by user id (Student.userId), NOT trainee id.
 */
export function useStudentErrorMap() {
  return useQuery({
    queryKey: ['studentErrorMap'],
    queryFn: () => apiFetch<Record<string, string[]>>('/rating/needle-feedback/student-errors/'),
  });
}

/**
 * All graded needle attempts for one trainee, by their USER id (Student.userId).
 * The by-user action returns a bare array (not paginated).
 */
export function useTraineeAttempts(userId?: string) {
  return useQuery({
    queryKey: ['traineeAttempts', userId],
    queryFn: () => apiFetch<NeedleFeedbackAPI[]>(`/rating/needle-feedback/by-user/${userId}/`),
    enabled: !!userId,
  });
}

// A single catheter-phase outcome as returned by /rating/catheter-feedback/.
export interface CatheterFeedbackAPI {
  id: number;
  user: number;
  case: number | null;
  catheter_used: boolean;
  guide_wire_used: boolean;
  scalpel_used: boolean;
  scalpel_used_unsafely: boolean;
  dilator_used: boolean;
  arrhythmia_ever: boolean;
  arrhythmia_too_long: boolean;
  fail_state: boolean;
  errors: string[];
  passed: boolean;
  created_at: string;
}

/** All catheter-phase outcomes for one trainee, by their USER id (bare array). */
export function useCatheterFeedbackByUser(userId?: string) {
  return useQuery({
    queryKey: ['catheterFeedback', userId],
    queryFn: () => apiFetch<CatheterFeedbackAPI[]>(`/rating/catheter-feedback/by-user/${userId}/`),
    enabled: !!userId,
  });
}

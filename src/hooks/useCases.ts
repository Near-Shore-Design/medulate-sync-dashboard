import { useQuery } from '@tanstack/react-query';
import { apiFetch, type PaginatedResponse } from '@/services/api';
import type { PatientCase } from '@/data/mockData';

interface PatientCaseAPI {
  id: number;
  case_number: number | null;
  case_name: string;
  patient_name: string;
  race: string;
  sex: string;
  age: number | null;
  preexisting_conditions: string;
  symptoms: string;
  difficulty: string;
  error_rate: number;
  avg_score: number;
  attempts: number;
  completions: number;
  top_errors: string[];
  created_at: string;
  updated_at: string;
}

const DIFFICULTY_MAP: Record<string, PatientCase['difficulty']> = {
  easy: 'Easy',
  moderate: 'Moderate',
  hard: 'Hard',
};

function transformCase(c: PatientCaseAPI): PatientCase {
  return {
    id: c.id,
    caseName: c.case_name,
    patientName: c.patient_name,
    race: c.race,
    sex: c.sex,
    age: c.age ?? 0,
    preexistingConditions: c.preexisting_conditions,
    symptoms: c.symptoms,
    difficulty: DIFFICULTY_MAP[c.difficulty] || c.difficulty as PatientCase['difficulty'],
    errorRate: c.error_rate,
    avgScore: c.avg_score,
    attempts: c.attempts,
    completions: c.completions,
    topErrors: c.top_errors,
  };
}

// The case catalog is identical across institutions (each institution owns its own
// copy of the 17 canonical cases). A platform admin viewing "All institutions" gets
// every copy merged — so each case shows up once per institution (e.g. 4x "Case 1").
// Collapse to one row per canonical case, aggregating the usage stats across
// institutions (total attempts/completions, attempt-weighted avg score & error rate,
// unioned top errors). Single-institution responses are returned untouched.
function dedupeAcrossInstitutions(rows: PatientCaseAPI[]): PatientCaseAPI[] {
  const groups = new Map<string, PatientCaseAPI[]>();
  for (const r of rows) {
    const key = r.case_number != null ? `n${r.case_number}` : `name:${r.case_name}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(r);
  }
  // No institution has more than one copy of any case → nothing merged, leave as-is.
  if ([...groups.values()].every((g) => g.length === 1)) return rows;

  const merged: PatientCaseAPI[] = [];
  for (const group of groups.values()) {
    if (group.length === 1) { merged.push(group[0]); continue; }
    const attempts = group.reduce((s, c) => s + c.attempts, 0);
    const wavg = (sel: (c: PatientCaseAPI) => number) =>
      attempts > 0
        ? group.reduce((s, c) => s + sel(c) * c.attempts, 0) / attempts
        : group.reduce((s, c) => s + sel(c), 0) / group.length;
    merged.push({
      ...group[0],
      attempts,
      completions: group.reduce((s, c) => s + c.completions, 0),
      avg_score: Math.round(wavg((c) => c.avg_score)),
      error_rate: Math.round(wavg((c) => c.error_rate)),
      top_errors: Array.from(new Set(group.flatMap((c) => c.top_errors))).slice(0, 5),
    });
  }
  merged.sort((a, b) => (a.case_number ?? 0) - (b.case_number ?? 0));
  return merged;
}

export function usePatientCases(filters?: { difficulty?: string }) {
  const params = new URLSearchParams();
  if (filters?.difficulty && filters.difficulty !== 'All') {
    params.set('difficulty', filters.difficulty.toLowerCase());
  }
  // Large page size so the "All institutions" response (up to ~17 cases x N
  // institutions) isn't truncated before we dedupe it.
  params.set('page_size', '200');
  const path = `/cases/patient-cases/?${params.toString()}`;

  return useQuery({
    queryKey: ['cases', filters],
    queryFn: async () => {
      const data = await apiFetch<PaginatedResponse<PatientCaseAPI>>(path);
      return dedupeAcrossInstitutions(data.results).map(transformCase);
    },
  });
}

export function useCaseAnalytics(caseId: number | null) {
  return useQuery({
    queryKey: ['cases', caseId, 'analytics'],
    queryFn: () => apiFetch(`/cases/patient-cases/${caseId}/analytics/`),
    enabled: !!caseId,
  });
}

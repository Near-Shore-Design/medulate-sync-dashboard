import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setApiInstitutionFilter } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Platform-admin institution filter.
 *
 * null = "All institutions" (the backend's merged default for superusers).
 * Selecting an institution makes apiFetch append ?institution=<id> to every
 * GET, and invalidates the React Query cache so all pages refetch scoped data.
 */
interface InstitutionFilterContextType {
  institutionId: number | null;
  setInstitutionId: (id: number | null) => void;
}

const InstitutionFilterContext = createContext<InstitutionFilterContextType | null>(null);

export function InstitutionFilterProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [institutionId, setInstitutionIdState] = useState<number | null>(null);

  const setInstitutionId = (id: number | null) => {
    setInstitutionIdState(id);
    setApiInstitutionFilter(id);
    queryClient.invalidateQueries();
  };

  // Only platform admins get to filter; clear any stale selection when a
  // non-platform-admin (or nobody) is signed in.
  useEffect(() => {
    if (!user?.is_platform_admin && institutionId !== null) {
      setInstitutionId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.is_platform_admin]);

  return (
    <InstitutionFilterContext.Provider value={{ institutionId, setInstitutionId }}>
      {children}
    </InstitutionFilterContext.Provider>
  );
}

export function useInstitutionFilter() {
  const context = useContext(InstitutionFilterContext);
  if (!context) throw new Error('useInstitutionFilter must be used within InstitutionFilterProvider');
  return context;
}

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getTokens, login as apiLogin, logout as apiLogout, getProfile, clearTokens } from '@/services/api';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_institution_admin?: boolean;
  is_platform_admin?: boolean;
}

function isAdmin(user: User | null | undefined): boolean {
  return !!(user?.is_institution_admin || user?.is_platform_admin);
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const tokens = getTokens();
    if (tokens?.access) {
      getProfile()
        .then((profile: User) => {
          // Re-assert the admins-only rule on every reload, not just at login.
          if (isAdmin(profile)) {
            setUser(profile);
          } else {
            clearTokens();
            setUser(null);
          }
        })
        .catch(() => setUser(null))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const userData = await apiLogin(username, password);
    setUser(userData);
  };

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

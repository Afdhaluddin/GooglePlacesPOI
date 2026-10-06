import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { clearToken, getToken, setToken, setUnauthorizedHandler } from '../api/client';

interface AuthContextValue {
  /** Whether a token is currently stored (user is "logged in"). */
  isAuthenticated: boolean;
  /** Persist a freshly-issued token and mark the session authenticated. */
  login: (token: string) => void;
  /** Clear the token, reset all cached server data, return to login screen. */
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // If a token already exists in localStorage on load, go straight to the app.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => getToken() !== null);
  const queryClient = useQueryClient();

  const logout = useCallback(() => {
    clearToken();
    queryClient.clear(); // drop all cached server state tied to the old session
    setIsAuthenticated(false);
  }, [queryClient]);

  const login = useCallback((token: string) => {
    setToken(token);
    setIsAuthenticated(true);
  }, []);

  // Any API call that answers 401 forces a logout (expired/invalid token).
  useEffect(() => {
    setUnauthorizedHandler(() => logout());
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const value = useMemo(
    () => ({ isAuthenticated, login, logout }),
    [isAuthenticated, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

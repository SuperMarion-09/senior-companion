import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

/**
 * Wrap the app in <AuthProvider> (see index.js) so any component can call
 * useAuth() to read the logged-in admin or to log in / out.
 */
export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [isChecking, setIsChecking] = useState(true); // true while we ask the API who is logged in

  useEffect(() => {
    authService
      .getCurrentAdmin()
      .then(setAdmin)
      .catch(() => setAdmin(null))
      .finally(() => setIsChecking(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const loggedInAdmin = await authService.login(email, password);
    setAdmin(loggedInAdmin);
    return loggedInAdmin;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setAdmin(null);
    }
  }, []);

  // The API answered 401 (session ended): forget the admin so ProtectedRoute
  // sends them to the login page.
  const sessionExpired = useCallback(() => setAdmin(null), []);

  const value = useMemo(
    () => ({ admin, isAuthenticated: admin !== null, isChecking, login, logout, sessionExpired }),
    [admin, isChecking, login, logout, sessionExpired]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return context;
}

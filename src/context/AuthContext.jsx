import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { authApi } from '../api/endpoints.js';
import { setAccessToken } from '../api/client.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  // On a hard refresh the in-memory access token is gone, but the httpOnly
  // refresh cookie is not — so try to restore the session silently.
  useEffect(() => {
    let cancelled = false;
    authApi.refresh()
      .then(({ user: u, accessToken }) => {
        if (cancelled) return;
        setAccessToken(accessToken);
        setUser(u);
      })
      .catch(() => {})
      .finally(() => !cancelled && setBooting(false));
    return () => { cancelled = true; };
  }, []);

  // The api client fires this when refreshing fails, e.g. the account was disabled.
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const login = useCallback(async (username, password) => {
    const { user: u, accessToken } = await authApi.login({ username, password });
    setAccessToken(accessToken);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({
    user, booting, login, logout,
    isAdmin: user?.role === 'admin',
    isHead: user?.role === 'head',
    isTech: user?.role === 'tech',
  }), [user, booting, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

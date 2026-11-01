'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  getMe, getToken, login as apiLogin, logout as apiLogout, register as apiRegister,
  setToken, LOGOUT_EVENT, type User,
} from '@/lib/api';
import { useLanguage } from './LanguageProvider';

type AuthContextType = {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Pages that don't require login
const PUBLIC_PAGES = ['/login'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  // ready = finished checking the saved token (avoids redirecting before we know)
  const [ready, setReady] = useState(false);

  // On startup, if a token is saved, ask Django whether it's still valid
  useEffect(() => {
    if (!getToken()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- no token, nothing to check
      setReady(true);
      return;
    }
    getMe()
      .then(setUser)
      .catch(() => setToken(null)) // Stale or revoked token: forget it
      .finally(() => setReady(true));
  }, []);

  // If any request returns 401 (invalid token), log the user out
  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener(LOGOUT_EVENT, onLogout);
    return () => window.removeEventListener(LOGOUT_EVENT, onLogout);
  }, []);

  // Route guard: logged out goes to /login, logged in on /login goes to /
  const isPublic = PUBLIC_PAGES.includes(pathname);
  useEffect(() => {
    if (!ready) return;
    if (!user && !isPublic) router.replace('/login');
    if (user && isPublic) router.replace('/');
  }, [ready, user, isPublic, router]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await apiLogin(username, password);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const res = await apiRegister(username, password);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout(); // Revokes the token on the server
    } catch {
      // Log out locally even if the server is unreachable
    }
    setToken(null);
    setUser(null);
  }, []);

  // Show a loading state until auth is resolved or the redirect happens.
  // This keeps protected pages from flashing or firing requests without a token.
  const waiting = !ready || (!user && !isPublic) || (user && isPublic);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {waiting ? (
        <p className="text-center text-gray-500 py-24">{t.loading}</p>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

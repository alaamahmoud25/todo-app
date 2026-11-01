'use client';

import { useState } from 'react';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { useTheme } from '@/components/ThemeProvider';

type Mode = 'login' | 'register';
// Error keys available in the dictionary
type ErrorKey = keyof ReturnType<typeof useLanguage>['t']['auth']['errors'];

const inputCls =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700';

export default function LoginPage() {
  const { t, lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<ErrorKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [serverDown, setServerDown] = useState(false);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setServerDown(false);

    // Basic validation before submitting
    if (!username.trim() || !password) return setError('required');
    if (mode === 'register' && password !== confirm) return setError('password_mismatch');

    setLoading(true);
    try {
      if (mode === 'login') await login(username, password);
      else await register(username, password);
      // On success, AuthProvider redirects to the tasks page
    } catch (err) {
      // Django returns an error code in detail; the dictionary holds its translation
      const code = err instanceof ApiError && (err.data as { detail?: string })?.detail;
      if (code && code in t.auth.errors) setError(code as ErrorKey);
      else setServerDown(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      {/* Language and theme toggles */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? t.lightMode : t.darkMode}
          className="h-9 w-9 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          className="h-9 rounded-full border border-gray-200 dark:border-gray-700 px-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          🌐 {t.switchLang}
        </button>
      </div>

      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6">
        <div className="text-center mb-6">
          <p className="text-4xl mb-2">✅</p>
          <h1 className="text-2xl font-bold">{t.appTitle}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.auth.subtitle}</p>
        </div>

        {/* Two tabs: log in / sign up */}
        <div className="grid grid-cols-2 gap-1 rounded-full bg-gray-100 dark:bg-gray-800 p-1 mb-5">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`rounded-full py-1.5 text-sm transition ${
                mode === m
                  ? 'bg-white dark:bg-gray-950 shadow-sm font-semibold'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {m === 'login' ? t.auth.login : t.auth.register}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1">{t.auth.username}</label>
            <input
              id="username"
              autoFocus
              // autoComplete lets the browser offer to save the password
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputCls}
              dir="ltr"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">{t.auth.password}</label>
            <input
              id="password"
              type="password" // Masks the characters
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              dir="ltr"
            />
            {mode === 'register' && (
              <p className="text-xs text-gray-500 mt-1">{t.auth.passwordHint}</p>
            )}
          </div>

          {mode === 'register' && (
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium mb-1">{t.auth.confirmPassword}</label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputCls}
                dir="ltr"
              />
            </div>
          )}

          {(error || serverDown) && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 rounded-lg p-2">
              {error ? t.auth.errors[error] : t.serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2.5 font-semibold transition"
          >
            {loading ? t.loading : mode === 'login' ? t.auth.submitLogin : t.auth.submitRegister}
          </button>
        </form>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
// usePathname returns the current route, used to highlight the active link
import { usePathname } from 'next/navigation';
import { useLanguage } from './LanguageProvider';
import { useTheme } from './ThemeProvider';
import NotificationButton from './NotificationButton';
import { useAuth } from './AuthProvider';

// Shared classes for the round icon buttons
const iconBtn =
  'h-9 w-9 shrink-0 rounded-full border border-gray-200 flex items-center justify-center text-lg ' +
  'hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800 transition';

export default function Header() {
  const { t, lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const isDark = theme === 'dark';

  const links = [
    { href: '/', label: t.nav.tasks },
    { href: '/stats', label: t.nav.stats },
  ];

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">{t.appTitle} ✅</h1>
        <nav className="flex gap-1 rounded-full bg-gray-200/60 dark:bg-gray-800 p-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1 rounded-full text-sm transition ${
                pathname === link.href
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-950 dark:text-white'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <NotificationButton className={iconBtn} />
        <button
          onClick={toggleTheme}
          aria-label={isDark ? t.lightMode : t.darkMode}
          title={isDark ? t.lightMode : t.darkMode}
          className={iconBtn}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
        <button
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          className="h-9 rounded-full border border-gray-200 px-4 text-sm hover:bg-gray-100
                     dark:border-gray-700 dark:hover:bg-gray-800 transition"
        >
          🌐 {t.switchLang}
        </button>
        {/* Current user + log out button */}
        <button
          onClick={logout}
          title={t.auth.logout}
          className="h-9 rounded-full border border-gray-200 px-3 text-sm flex items-center gap-2
                     hover:bg-red-50 hover:border-red-200 hover:text-red-700
                     dark:border-gray-700 dark:hover:bg-red-950 dark:hover:border-red-900 dark:hover:text-red-300 transition"
        >
          <span className="h-6 w-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center uppercase">
            {user?.username.charAt(0)}
          </span>
          <span className="max-w-24 truncate">{user?.username}</span>
          <span className="text-gray-400">·</span>
          <span>{t.auth.logout}</span>
        </button>
      </div>
    </header>
  );
}

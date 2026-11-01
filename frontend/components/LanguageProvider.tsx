'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { dictionaries, directions, type Dictionary, type Lang } from '@/lib/i18n';

type LanguageContextType = {
  lang: Lang;
  t: Dictionary; // Dictionary for the current language
  setLang: (lang: Lang) => void;
};

// Shared context any component can read the language from
const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = 'lang';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Start with Arabic so server and client render the same markup on first load
  const [lang, setLangState] = useState<Lang>('ar');

  // On mount, restore the language the user picked last time
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a saved preference
      if (saved === 'ar' || saved === 'en') setLangState(saved);
    } catch {
      // localStorage can be unavailable; fall back to Arabic
    }
  }, []);

  // Whenever the language changes, update the page language and direction
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = directions[lang];
  }, [lang]);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // If saving fails, the language still changes but won't persist
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, t: dictionaries[lang], setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}

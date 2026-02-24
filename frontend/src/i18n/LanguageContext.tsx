// Supports English and Polish with localStorage persistence

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import en, { type TranslationKeys } from './en';
import pl from './pl';

// Supported locale codes
export type Locale = 'en' | 'pl';

// Map of locale codes to translation objects 
const translations: Record<Locale, TranslationKeys> = { en, pl };

// Locale display labels
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'EN',
  pl: 'PL',
};

// LocalStorage key for persisting language preference
const STORAGE_KEY = 'surveyforge-locale';

// Read stored locale or fall back to browser language
function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'pl') return stored;
  } catch { /* SSR / privacy mode */ }
  
  // Detect from browser
  const browserLang = navigator.language?.toLowerCase() ?? '';
  if (browserLang.startsWith('pl')) return 'pl';
  return 'en';
}

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Provider
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch { /* quota */ }
  }, []);

  const t = translations[locale];

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook
export function useTranslation(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageProvider;

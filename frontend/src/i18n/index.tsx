'use client';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import en from './en.json';
import nl from './nl.json';
import ar from './ar.json';

export type Language = 'en' | 'nl' | 'ar';
type Messages = typeof en;
type Params = Record<string, string | number | null | undefined>;

const dictionaries: Record<Language, Messages> = { en, nl, ar };
const LANGUAGE_STORAGE_KEY = 'ump-language';
const RTL_LANGUAGES: Language[] = ['ar'];

interface I18nContextValue {
  language: Language;
  direction: 'ltr' | 'rtl';
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Params, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getValue(source: unknown, path: string): string | undefined {
  return path.split('.').reduce<unknown>((current, part) => {
    if (!current || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[part];
  }, source) as string | undefined;
}

function interpolate(template: string, params?: Params) {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => String(params[key] ?? ''));
}

function initialLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
  return saved && saved in dictionaries ? saved : 'en';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    setLanguageState(initialLanguage());
  }, []);

  const direction = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [direction, language]);

  const value = useMemo<I18nContextValue>(() => ({
    language,
    direction,
    setLanguage: setLanguageState,
    t: (key, params, fallback) => {
      const translated = getValue(dictionaries[language], key) ?? getValue(dictionaries.en, key) ?? fallback ?? key;
      return interpolate(translated, params);
    },
  }), [direction, language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useTranslation must be used inside I18nProvider');
  return context;
}

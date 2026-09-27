import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import en, { type Dictionary } from './en';
import yo from './yo';

export type Lang = 'en' | 'yo';
export const LANGS: Lang[] = ['en', 'yo'];
const dictionaries: Record<Lang, Dictionary> = { en, yo };
const STORAGE_KEY = 'cn.lang'; // not sensitive, so plain storage

/** Replaces {name} placeholders. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));
}

function deviceLang(): Lang {
  try {
    return getLocales().some((l) => l.languageCode === 'yo') ? 'yo' : 'en';
  } catch {
    return 'en';
  }
}

type I18n = { lang: Lang; t: Dictionary; setLang: (lang: Lang) => void };

const I18nContext = createContext<I18n>({ lang: 'en', t: en, setLang: () => undefined });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(deviceLang);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'en' || saved === 'yo') setLangState(saved);
      })
      .catch(() => undefined);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const value = useMemo(() => ({ lang, t: dictionaries[lang], setLang }), [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);

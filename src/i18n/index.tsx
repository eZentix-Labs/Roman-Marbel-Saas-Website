import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { KEYS, read, write } from '@/lib/storage';
import { track } from '@/lib/analytics';
import { STRINGS, type Lang, type StringKey } from './strings';

interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: StringKey) => string;
  /** Picks the right field off a record that carries both languages. */
  pick: <T>(en: T, bn: T | null | undefined) => T;
}

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => read<Lang>(KEYS.lang, 'en'));

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    write(KEYS.lang, l);
    document.documentElement.lang = l;
    track('language_switch', { lang: l });
  }, []);

  const value = useMemo<I18n>(() => ({
    lang,
    setLang,
    t: (key) => STRINGS[key][lang] ?? STRINGS[key].en,
    pick: (en, bn) => (lang === 'bn' && bn ? bn : en),
  }), [lang, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}

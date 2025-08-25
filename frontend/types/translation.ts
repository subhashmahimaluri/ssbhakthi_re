import { Dictionary, Locale } from '@/locales';

export interface TranslationContextType {
  t: Dictionary;
  locale: Locale;
  switchLanguage: (locale: Locale) => void;
  getLanguageUrl: (locale: Locale) => string;
  isLoading: boolean;
  availableLocales: Locale[];
}

export interface LanguageConfigType {
  locale: Locale;
  instanceType: string;
  availableLocales: string[];
  isMainInstance: boolean;
}

// hooks/useTranslation.ts - Updated for multi-instance
import { useRouter } from 'next/router';
import { dictionaries, type Dictionary, type Locale } from '@/locales';

// Domain/port mapping for each language
const LANGUAGE_DOMAINS = {
  te: 'http://localhost:3000',
  en: 'http://localhost:3000/en',
  hi: 'http://localhost:3001',
  kn: 'http://localhost:3002',
};

export function useTranslation() {
  const router = useRouter();
  const locale = (router.locale as Locale) || 'te';
  const t = dictionaries[locale];

  const switchLanguage = (newLocale: Locale) => {
    const { pathname, query } = router;

    // If switching to te or en (same domain)
    if ((newLocale === 'te' || newLocale === 'en') && (locale === 'te' || locale === 'en')) {
      router.push({ pathname, query }, router.asPath, { locale: newLocale });
    } else {
      // Cross-domain switch - redirect to different port/domain
      const targetDomain = LANGUAGE_DOMAINS[newLocale];
      const currentPath = pathname === '/' ? '' : pathname;
      const queryString =
        Object.keys(query).length > 0
          ? '?' + new URLSearchParams(query as Record<string, string>).toString()
          : '';

      window.location.href = `${targetDomain}${currentPath}${queryString}`;
    }
  };

  const getLanguageUrl = (targetLocale: Locale) => {
    const { pathname, query } = router;
    const currentPath = pathname === '/' ? '' : pathname;
    const queryString =
      Object.keys(query).length > 0
        ? '?' + new URLSearchParams(query as Record<string, string>).toString()
        : '';

    return `${LANGUAGE_DOMAINS[targetLocale]}${currentPath}${queryString}`;
  };

  return {
    t,
    locale,
    switchLanguage,
    getLanguageUrl,
    isLoading: router.isFallback,
    availableLocales: Object.keys(LANGUAGE_DOMAINS) as Locale[],
  };
}

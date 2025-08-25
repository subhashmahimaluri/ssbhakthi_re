// hooks/useTranslation.ts - Updated for multi-instance
import { dictionaries, type Locale } from '@/locales';
import { useRouter } from 'next/router';

// Domain/port mapping for each language
const LANGUAGE_DOMAINS = {
  te: 'http://localhost:3000',
  en: 'http://localhost:3000',
  hi: 'http://localhost:3001',
  kn: 'http://localhost:3002',
};

export function useTranslation() {
  const router = useRouter();
  const locale = (router.locale as Locale) || 'te';
  const t = dictionaries[locale];

  const switchLanguage = (newLocale: Locale) => {
    const { pathname, query } = router;

    // Check if both current and target locales are on the same domain (port 3000 for te/en)
    const currentDomain = LANGUAGE_DOMAINS[locale];
    const targetDomain = LANGUAGE_DOMAINS[newLocale];

    if (currentDomain === targetDomain) {
      // Same domain switch - use Next.js router
      router.push({ pathname, query }, router.asPath, { locale: newLocale });
    } else {
      // Cross-domain switch - redirect to different port/domain
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

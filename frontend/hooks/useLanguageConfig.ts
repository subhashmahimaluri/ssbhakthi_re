import { Locale } from '@/locales';
import { useRouter } from 'next/router';

export function useLanguageConfig() {
  const router = useRouter();
  const locale = router.locale as Locale;

  // Determine current instance type based on available locales
  const getInstanceType = () => {
    const availableLocales = router.locales || [];

    if (availableLocales.includes('te') && availableLocales.includes('en')) {
      return 'te-en'; // Main instance
    } else if (availableLocales.includes('hi')) {
      return 'hi'; // Hindi instance
    } else if (availableLocales.includes('kn')) {
      return 'kn'; // Kannada instance
    }

    return 'te-en'; // Default
  };

  return {
    locale,
    instanceType: getInstanceType(),
    availableLocales: router.locales || [],
    isMainInstance: getInstanceType() === 'te-en',
  };
}

'use client';

import { useAvailableLanguages } from '@/context/AvailableLanguagesContext';
import { useLanguageConfig } from '@/hooks/useLanguageConfig';
import { useTranslation } from '@/hooks/useTranslation';
import { Locale } from '@/locales';
import { SessionProvider } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MyAccount from './MyAccount';

export default function TopBar() {
  const { t, locale, switchLanguage } = useTranslation();
  const { availableLanguages } = useAvailableLanguages();
  const { availableLocales } = useLanguageConfig();
  const pathname = usePathname();

  // All supported languages with display names
  const allLanguages = [
    { code: 'te' as Locale, name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'en' as Locale, name: 'English', flag: '🇺🇸' },
    { code: 'hi' as Locale, name: 'हिंदी', flag: '🇮🇳' },
    { code: 'kn' as Locale, name: 'ಕನ್ನಡ', flag: '🇮🇳' },
  ];

  // First filter by instance availability, then by content availability
  const instanceLanguages = allLanguages.filter(lang => availableLocales.includes(lang.code));
  const contentFilteredLanguages = instanceLanguages.filter(lang =>
    availableLanguages.includes(lang.code)
  );

  // If content filtering results in empty list, fall back to instance languages
  const languages =
    contentFilteredLanguages.length > 0 ? contentFilteredLanguages : instanceLanguages;

  const iconClassName = 'text-storm gr-hover-text-white';
  const currentLanguage = languages.find(lang => lang.code === locale);

  return (
    <div className="row top-bar">
      {/* Left: Language Links */}
      <div className="col-6 topbar-call text-start">
        <ul className="contact gr-text-10 gr-text-color gr-hover-text-orange mb-1 mt-1 py-1">
          {languages.map((language, index) => {
            const isSameDomain =
              (language.code === 'te' || language.code === 'en') &&
              (locale === 'te' || locale === 'en');

            return (
              <li key={index}>
                {isSameDomain ? (
                  // Same domain - use Next.js Link with proper language path
                  <Link
                    href={pathname || '/'}
                    locale={language.code}
                    className={locale === language.code ? 'lang-active' : ''}
                  >
                    {language.name}
                  </Link>
                ) : (
                  // Cross domain - use button with switchLanguage
                  <a
                    href="#"
                    onClick={e => {
                      e.preventDefault();
                      switchLanguage(language.code);
                    }}
                    className={locale === language.code ? 'lang-active' : ''}
                  >
                    {language.name}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Right: Social Icons and MyAccount */}
      <div className="col-6 topbar-social text-end">
        <SessionProvider>
          <MyAccount />
        </SessionProvider>
      </div>
    </div>
  );
}

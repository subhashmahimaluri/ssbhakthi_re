import { useLanguageConfig } from '@/hooks/useLanguageConfig';
import { Locale } from '@/locales';
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

interface AvailableLanguagesContextType {
  availableLanguages: Locale[];
  setAvailableLanguages: (languages: Locale[]) => void;
  resetAvailableLanguages: () => void;
}

const AvailableLanguagesContext = createContext<AvailableLanguagesContextType | undefined>(
  undefined
);

export function AvailableLanguagesProvider({ children }: { children: ReactNode }) {
  const { availableLocales } = useLanguageConfig();

  // Use instance-specific languages instead of all 4 languages
  const instanceLanguages = availableLocales as Locale[];

  const [availableLanguages, setAvailableLanguagesState] = useState<Locale[]>(instanceLanguages);

  const setAvailableLanguages = useCallback(
    (languages: Locale[]) => {
      // Filter to only include languages supported by this instance
      const filteredLanguages = languages.filter(lang => instanceLanguages.includes(lang));
      // Ensure we always have at least the current instance languages available
      setAvailableLanguagesState(
        filteredLanguages.length > 0 ? filteredLanguages : instanceLanguages
      );
    },
    [instanceLanguages]
  );

  const resetAvailableLanguages = useCallback(() => {
    setAvailableLanguagesState(instanceLanguages);
  }, [instanceLanguages]);

  const value = useMemo(
    () => ({
      availableLanguages,
      setAvailableLanguages,
      resetAvailableLanguages,
    }),
    [availableLanguages, setAvailableLanguages, resetAvailableLanguages]
  );

  return (
    <AvailableLanguagesContext.Provider value={value}>
      {children}
    </AvailableLanguagesContext.Provider>
  );
}

export function useAvailableLanguages() {
  const context = useContext(AvailableLanguagesContext);
  if (context === undefined) {
    throw new Error('useAvailableLanguages must be used within an AvailableLanguagesProvider');
  }
  return context;
}

import { useTranslation } from './useTranslation';

export function useTranslationValue(key: string) {
  const { t } = useTranslation();

  const getValue = (obj: any, path: string): string => {
    return path.split('.').reduce((current, key) => current?.[key], obj) || key;
  };

  return getValue(t, key);
}

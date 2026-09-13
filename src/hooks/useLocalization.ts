import { useState, useCallback } from 'react';
import { LanguageCode } from '../types/i18n';
import { getTranslation } from '../i18n';

let globalLanguage: LanguageCode = 'en';

export function useLocalization() {
  const [currentLanguage, setCurrentLanguageState] = useState<LanguageCode>(globalLanguage);

  const setLanguage = useCallback((lang: LanguageCode) => {
    globalLanguage = lang;
    setCurrentLanguageState(lang);
  }, []);

  const t = getTranslation(currentLanguage);

  return {
    currentLanguage,
    setLanguage,
    t,
  };
}

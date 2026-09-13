import { en } from './en';
import { hi } from './hi';
import { hinglish } from './hinglish';
import { mr } from './mr';
import { LanguageCode, TranslationDictionary } from '../types/i18n';

export const dictionaries: Record<string, TranslationDictionary> = {
  en,
  hi,
  hinglish,
  mr,
  bn: hi, // Fallbacks for additional languages
  ta: en,
  te: en,
};

export function getTranslation(lang: LanguageCode | string): TranslationDictionary {
  const code = typeof lang === 'string' ? lang : (lang as any)?.code || 'en';
  return dictionaries[code] || dictionaries.en;
}

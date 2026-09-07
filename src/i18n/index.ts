import { en } from './en';
import { hi } from './hi';
import { hinglish } from './hinglish';
import { LanguageCode, TranslationDictionary } from '../types/i18n';

export const dictionaries: Record<LanguageCode, TranslationDictionary> = {
  en,
  hi,
  hinglish,
};

export function getTranslation(lang: LanguageCode): TranslationDictionary {
  return dictionaries[lang] || dictionaries.en;
}

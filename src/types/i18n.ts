export type LanguageCode = 'en' | 'hi' | 'hinglish' | 'mr' | 'bn' | 'ta' | 'te';

export interface CaseLanguage {
  code: LanguageCode;
  name: string;
  nativeName: string;
  source: 'detected' | 'user_selected';
}

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag?: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'hinglish', name: 'Hinglish', nativeName: 'Hinglish' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
];

export interface TranslationDictionary {
  appName: string;
  tagline: string;
  home: {
    heroTitle: string;
    heroSubtitle: string;
    tellStoryButton: string;
    scanDocumentButton: string;
    uploadDocumentButton: string;
    myCasesHeader: string;
    noCasesMessage: string;
  };
  intake: {
    title: string;
    disclaimerBanner: string;
    inputPlaceholder: string;
    listening: string;
    tapToTalk: string;
    processing: string;
    submitButton: string;
  };
  actionPlan: {
    title: string;
    contextHeader: string;
    evidenceChecklist: string;
    reviewDraft: string;
    viewProcess: string;
    viewOptions: string;
  };
  cases: {
    title: string;
    filterAll: string;
    filterActive: string;
    filterResolved: string;
  };
  explore: {
    title: string;
    knowYourRights: string;
  };
  profile: {
    title: string;
    languageSection: string;
    legalNotice: string;
  };
}

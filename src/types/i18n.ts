export type LanguageCode = 'en' | 'hi' | 'hinglish';

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

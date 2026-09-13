import { CaseLanguage, LanguageCode, SUPPORTED_LANGUAGES } from '../../types/i18n';

/**
 * Deterministic + Heuristic Language Detection Engine for Nyaya Flow.
 * Detects Hindi, Marathi, Hinglish, and English inputs cleanly.
 */
export function detectLanguage(text: string): CaseLanguage {
  if (!text || !text.trim()) {
    return { code: 'en', name: 'English', nativeName: 'English', source: 'detected' };
  }

  const cleanText = text.trim();
  const devanagariCount = (cleanText.match(/[\u0900-\u097F]/g) || []).length;
  const totalChars = cleanText.replace(/\s+/g, '').length;

  // 1. Devanagari Script Detection (Hindi vs Marathi)
  if (devanagariCount > 2 || (totalChars > 0 && devanagariCount / totalChars > 0.15)) {
    const marathiKeywords = [
      'माझ्या', 'आहे', 'होते', 'केले', 'करा', 'भाडेकरू', 'भाडेकरार', 'नाही',
      'पैसे', 'झाले', 'माझ्यासोबत', 'ठेव', 'रक्कम', 'माझा', 'माझी', 'घेतले',
      'दिले', 'संपला', 'काढले', 'तक्रार', 'न्याय', 'पोलिस', 'कायदा'
    ];
    const isMarathi = marathiKeywords.some((word) => cleanText.includes(word));

    if (isMarathi) {
      return { code: 'mr', name: 'Marathi', nativeName: 'मराठी', source: 'detected' };
    }
    return { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', source: 'detected' };
  }

  // 2. Hinglish vs Standard English Detection (Latin Script)
  const lowerText = cleanText.toLowerCase();
  const hinglishGrammarTokens = [
    'mere', 'mera', 'meri', 'ne', 'nhi', 'nahi', 'kya', 'de', 'diya', 'hai',
    'ho', 'rha', 'raha', 'ka', 'ke', 'ki', 'se', 'ko', 'paise', 'paisa', 'wapas',
    'bhai', 'makan', 'malik', 'kiraya', 'pesa', 'karo', 'kar', 'sab', 'aaj', 'kal'
  ];

  const words = lowerText.split(/\W+/);
  const matchedGrammarCount = words.filter((w) => hinglishGrammarTokens.includes(w)).length;

  if (matchedGrammarCount >= 2 || (words.length <= 6 && matchedGrammarCount >= 1)) {
    return { code: 'hinglish', name: 'Hinglish', nativeName: 'Hinglish', source: 'detected' };
  }

  // 3. Default to English for other Latin input
  return { code: 'en', name: 'English', nativeName: 'English', source: 'detected' };
}

/**
 * Normalizes any language value (string code or CaseLanguage object) into a validated CaseLanguage object.
 */
export function normalizeCaseLanguage(
  input: string | CaseLanguage | undefined | null,
  fallbackCode: LanguageCode = 'en'
): CaseLanguage {
  if (input && typeof input === 'object' && input.code) {
    const matched = SUPPORTED_LANGUAGES.find((l) => l.code === input.code);
    return {
      code: (matched?.code || input.code) as LanguageCode,
      name: matched?.name || input.name || 'English',
      nativeName: matched?.nativeName || input.nativeName || 'English',
      source: input.source || 'detected',
    };
  }

  const codeStr = typeof input === 'string' ? input : fallbackCode;
  const matched = SUPPORTED_LANGUAGES.find((l) => l.code === codeStr) || SUPPORTED_LANGUAGES[0];

  return {
    code: matched.code,
    name: matched.name,
    nativeName: matched.nativeName,
    source: 'detected',
  };
}

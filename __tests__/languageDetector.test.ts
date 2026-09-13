import { detectLanguage, normalizeCaseLanguage } from '../src/services/language/languageDetectorService';

describe('LanguageDetectorService', () => {
  it('should detect Devanagari Hindi input correctly', () => {
    const text = 'मेरे मकान मालिक ने मेरा ₹75,000 का सिक्योरिटी डिपॉज़िट वापस नहीं किया।';
    const lang = detectLanguage(text);
    expect(lang.code).toBe('hi');
    expect(lang.nativeName).toBe('हिन्दी');
    expect(lang.source).toBe('detected');
  });

  it('should detect Devanagari Marathi input correctly', () => {
    const text = 'माझ्या भाडेकरूने पैसे दिले नाहीत आणि भाडेकरार संपला आहे.';
    const lang = detectLanguage(text);
    expect(lang.code).toBe('mr');
    expect(lang.nativeName).toBe('मराठी');
    expect(lang.source).toBe('detected');
  });

  it('should detect Hinglish input correctly', () => {
    const text = 'mere landlord ne deposit return nahi kiya';
    const lang = detectLanguage(text);
    expect(lang.code).toBe('hinglish');
    expect(lang.nativeName).toBe('Hinglish');
    expect(lang.source).toBe('detected');
  });

  it('should detect standard English input correctly', () => {
    const text = 'My landlord refuses to refund my security deposit of $1000.';
    const lang = detectLanguage(text);
    expect(lang.code).toBe('en');
    expect(lang.nativeName).toBe('English');
    expect(lang.source).toBe('detected');
  });

  it('should normalize string code or CaseLanguage object cleanly', () => {
    const normObj = normalizeCaseLanguage({ code: 'mr', name: 'Marathi', nativeName: 'मराठी', source: 'user_selected' });
    expect(normObj.code).toBe('mr');
    expect(normObj.source).toBe('user_selected');

    const normStr = normalizeCaseLanguage('hi');
    expect(normStr.code).toBe('hi');
    expect(normStr.nativeName).toBe('हिन्दी');
  });
});

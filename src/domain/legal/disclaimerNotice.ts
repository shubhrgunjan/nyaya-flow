export const LEGAL_DISCLAIMER_TEXT =
  'Nyaya Flow provides AI-assisted legal navigation and informational guidance based on Indian law principles. It does not constitute formal legal advice, representation, or an attorney-client relationship. For high-risk or binding court proceedings, always consult a qualified advocate.';

export const LEGAL_SAFETY_PHRASES = {
  confidentClaimForbidden: ['You definitely have a case', 'This is legally guaranteed', 'You will win'],
  recommendedAlternative: [
    'Based on the information provided...',
    'Possible next steps available under Indian law...',
    'This framework may apply to your situation...',
    'For important or high-risk matters, consider consulting a qualified advocate.',
  ],
};

export function getSanitizedDisclaimerNotice(): string {
  return LEGAL_DISCLAIMER_TEXT;
}

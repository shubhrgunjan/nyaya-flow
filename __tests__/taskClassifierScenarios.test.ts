import { TaskClassifier } from '../server/src/ai/taskClassifier';
import { VERIFIED_PORTAL_REGISTRY } from '../server/src/legal/providerRegistry';

describe('TaskClassifier & Legal Provider Scenarios', () => {
  const classifier = new TaskClassifier();

  it('Scenario C: Complex FIR / firearm query must trigger model AI reasoning and NOT match emergency 112 helpline', () => {
    const input = 'How can I get a FIR removed if it is there because of illegal use of firearm?';
    const classification = classifier.classifyRequest(input);

    expect(classification.aiRequired).toBe(true);
    expect(classification.intent).toBe('COMPLEX_SYNTHESIS');
    expect(classification.matchedProviderId).toBeUndefined();

    // Verify 112 helpline provider keywords do NOT include 'fir'
    const helpline = VERIFIED_PORTAL_REGISTRY.find(p => p.id === 'src_police_helpline');
    expect(helpline?.keywords).not.toContain('fir');
    expect(helpline?.keywords).toContain('112');
  });


  it('Scenario A & B: RTI queries require proper AI legal synthesis or authoritative portal', () => {
    const whatIsRTI = classifier.classifyRequest('What is RTI?');
    expect(whatIsRTI.aiRequired).toBe(true);

    const whereToFileRTI = classifier.classifyRequest('Where do I file an RTI?');
    expect(whereToFileRTI.aiRequired).toBe(true);
  });

  it('Scenario D: Bicycle refund dispute is recognized as requiring AI synthesis', () => {
    const refundQuery = classifier.classifyRequest('I returned a bicycle to the shop. They promised a 50% refund but only gave ₹800 instead of ₹1,000. How can I get my money back?');
    expect(refundQuery.aiRequired).toBe(true);
    expect(refundQuery.intent).toBe('COMPLEX_SYNTHESIS');
  });

  it('Direct system actions bypass LLM calls', () => {
    const mutation = classifier.classifyRequest('mark step 1 complete');
    expect(mutation.aiRequired).toBe(false);
    expect(mutation.intent).toBe('CASE_MUTATION');
  });
});

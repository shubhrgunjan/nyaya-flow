import { GeminiRealService } from '../src/services/ai/geminiRealService';
import { indiaLawProvider } from '../src/services/legal/indiaLawProvider';
import { officialResourceProvider } from '../src/services/legal/officialResourceProvider';
import * as apiClient from '../src/lib/apiClient';

describe('GeminiRealService & Legal Providers', () => {
  const service = new GeminiRealService();

  beforeEach(() => {
    jest.spyOn(apiClient, 'checkServerHealth').mockResolvedValue({
      ok: true,
      geminiConfigured: true,
      youtubeConfigured: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should analyze landlord deposit dispute with real legal sources & official portals', async () => {
    jest.spyOn(apiClient, 'apiCall').mockResolvedValue({
      success: true,
      analysis: {
        category: 'tenant_dispute',
        subcategory: 'Tenant Deposit Refund',
        summary: 'Landlord deposit dispute in Noida',
        jurisdiction: { country: 'India', state: 'Uttar Pradesh', district: 'Gautam Buddha Nagar', forumOrCourt: 'Rent Authority' },
        facts: { amount: '₹50,000' },
        actions: [{ title: 'Send Demand Notice', purpose: '15-day notice period', priority: 'high' }],
        sources: [
          {
            id: 'src_act_tpa',
            title: 'Transfer of Property Act, 1882 (Section 108)',
            publisher: 'India Code',
            url: 'https://edaakhil.nic.in',
            sourceType: 'primary_law',
            provider: 'India Code',
            relevance: 'Governs tenant lease rights and deposit return',
            category: 'tenant_dispute',
            keywords: ['tenant', 'rent'],
            description: 'Tenant rights on lease termination',
          },
        ],
        confidence: 0.95,
      },
    });

    const analysis = await service.analyzeProblem('Mere landlord ne mera security deposit wapas nahi kiya. Main Noida mein rehta hoon.', 'hinglish');

    expect(analysis.category).toBe('tenant_dispute');
    expect(analysis.jurisdiction.country).toBe('India');
    expect(analysis.legalSources.length).toBeGreaterThan(0);
    expect(analysis.legalSources[0].actName).toContain('India Code');
    expect(analysis.officialResources.length).toBeGreaterThan(0);
    expect(analysis.officialResources[0].url).toContain('edaakhil');
  });

  it('should analyze cyber UPI fraud with emergency 1930 helpline & cybercrime portal', async () => {
    jest.spyOn(apiClient, 'apiCall').mockResolvedValue({
      success: true,
      analysis: {
        category: 'cyber_crime',
        subcategory: 'UPI Financial Fraud',
        summary: 'UPI cyber fraud complaint',
        jurisdiction: { country: 'India', state: '', district: '', forumOrCourt: 'National Cyber Crime Portal' },
        urgency: 'critical',
        facts: {},
        actions: [{ title: 'Report on Cybercrime Portal', purpose: 'Freeze bank transaction', priority: 'high' }],
        sources: [
          {
            id: 'src_cybercrime',
            title: 'National Cyber Crime Reporting Portal',
            publisher: 'MHA India',
            url: 'https://cybercrime.gov.in',
            sourceType: 'official_portal',
            provider: 'I4C',
            relevance: 'Official cyber crime reporting',
            category: 'cyber_crime',
            keywords: ['cyber', '1930'],
            description: 'Report financial cyber fraud',
          },
        ],
        confidence: 1.0,
      },
    });

    const analysis = await service.analyzeProblem('Mere UPI se paise fraud se nikal gaye.', 'hinglish');

    expect(analysis.category).toBe('cyber_crime');
    expect(analysis.urgency).toBe('critical');
    expect(analysis.officialResources.some((r) => r.url.includes('cybercrime.gov.in'))).toBe(true);
  });

  it('should retrieve authentic Indian legal provisions from IndiaLawProvider', async () => {
    const laws = await indiaLawProvider.searchLaw('rent tenant deposit', 'tenant_dispute');
    expect(laws.length).toBeGreaterThan(0);
    expect(laws[0].sectionNumber).toBe('108');
  });

  it('should retrieve official government portals from OfficialResourceProvider', async () => {
    const resources = await officialResourceProvider.getOfficialResources('cyber_crime');
    expect(resources.some((r) => r.helplinePhone === '1930')).toBe(true);
  });
});



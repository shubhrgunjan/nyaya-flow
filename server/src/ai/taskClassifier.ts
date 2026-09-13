export interface ClassificationResult {
  aiRequired: boolean;
  intent: 'DIRECT_LOOKUP' | 'CASE_MUTATION' | 'SIMPLE_EXTRACTION' | 'COMPLEX_SYNTHESIS';
  matchedProviderId?: string;
  directAnswer?: string;
  category?: string;
  subcategory?: string;
  reason: string;
}

export class TaskClassifier {
  /**
   * Deterministic first-stage request classifier.
   * Runs BEFORE any LLM invocation to determine if AI is even necessary.
   */
  classifyRequest(input: string, caseState?: any): ClassificationResult {
    const text = input.trim().toLowerCase();

    // 1. Substantive & Informational Legal Questions (ALWAYS require AI model legal reasoning!)
    const isSubstantiveQuery =
      text.includes('what is') ||
      text.includes('where do') ||
      text.includes('where to') ||
      text.includes('how can i') ||
      text.includes('how to') ||
      text.includes('rti') ||
      text.includes('remove fir') ||
      text.includes('quash') ||
      text.includes('fir') ||
      text.includes('firearm') ||
      text.includes('illegal') ||
      text.includes('deposit') ||
      text.includes('refund') ||
      text.includes('dispute') ||
      text.includes('withheld') ||
      text.includes('notice') ||
      text.includes('remedy') ||
      text.includes('procedure') ||
      text.includes('rights') ||
      text.includes('can i') ||
      text.includes('is it legal');

    if (isSubstantiveQuery) {
      return {
        aiRequired: true,
        intent: 'COMPLEX_SYNTHESIS',
        reason: 'Substantive legal analysis requested. Requires model-first legal reasoning under Indian Law.',
      };
    }

    // 2. Direct Case Mutation / UI Actions (0 LLM Calls)
    if (
      text.includes('mark step') ||
      text.includes('mark action') ||
      text.includes('step done') ||
      text.includes('mark complete') ||
      text.includes('show my cases') ||
      text.includes('open the source') ||
      text.includes('change my state') ||
      text.includes('how many actions') ||
      text.includes('add this document') ||
      text.includes('delete case')
    ) {
      return {
        aiRequired: false,
        intent: 'CASE_MUTATION',
        reason: 'Matched UI state / case mutation action (solved deterministically with 0 AI calls).',
      };
    }

    // 2. Direct Official Portal & Emergency Helpline Lookups (0 LLM Calls)

    // Police / Emergency Helpline lookups
    if (
      text.includes('police helpline') ||
      text.includes('police number') ||
      text.includes('emergency number') ||
      text.includes('police no') ||
      text.includes('112') ||
      text.includes('100')
    ) {
      return {
        aiRequired: false,
        intent: 'DIRECT_LOOKUP',
        matchedProviderId: 'src_police_helpline',
        category: 'general_legal',
        subcategory: 'Emergency Police Helpline',
        directAnswer:
          'In India, the National Emergency Helpline Number for Police, Fire, and Ambulance is 112 (or 100 for Police emergency).',
        reason: 'Matched direct verified official lookup for National Emergency Police Helpline (112 / 100).',
      };
    }

    // Cyber crime lookups
    if (
      text.includes('cyber crime') ||
      text.includes('cybercrime') ||
      text.includes('cyber fraud') ||
      text.includes('online fraud portal') ||
      text.includes('1930') ||
      text.includes('report cyber') ||
      text.includes('online scam')
    ) {
      return {
        aiRequired: false,
        intent: 'DIRECT_LOOKUP',
        matchedProviderId: 'src_cybercrime',
        category: 'cyber_crime',
        subcategory: 'Cyber Fraud & Portal',
        directAnswer:
          'Cybercrime complaints in India can be filed on the National Cyber Crime Reporting Portal at https://cybercrime.gov.in or by calling emergency financial fraud helpline 1930.',
        reason: 'Matched direct verified official portal lookup for National Cyber Crime Reporting Portal.',
      };
    }

    // RTI Online lookups
    if (
      text.includes('file rti') ||
      text.includes('rti portal') ||
      text.includes('right to information') ||
      text.includes('file an rti') ||
      text.includes('where is rti') ||
      text.includes('what is rti')
    ) {
      return {
        aiRequired: false,
        intent: 'DIRECT_LOOKUP',
        matchedProviderId: 'src_rti_online',
        category: 'general_legal',
        subcategory: 'Right to Information',
        directAnswer:
          'Central Government RTI applications can be filed online at the official RTI Online Portal: https://rtionline.gov.in with a statutory fee of ₹10.',
        reason: 'Matched direct verified official portal lookup for RTI Online Portal.',
      };
    }

    // Free Legal Aid / NALSA lookups
    if (
      text.includes('legal aid') ||
      text.includes('nalsa') ||
      text.includes('free lawyer') ||
      text.includes('free legal assistance') ||
      text.includes('what is nalsa')
    ) {
      return {
        aiRequired: false,
        intent: 'DIRECT_LOOKUP',
        matchedProviderId: 'src_nalsa',
        category: 'general_legal',
        subcategory: 'Free Legal Aid',
        directAnswer:
          'Free legal aid and lawyer representation under the Legal Services Authorities Act can be requested via National Legal Services Authority (NALSA) at https://nalsa.gov.in or through District Legal Services Authorities (DLSA).',
        reason: 'Matched direct verified official lookup for NALSA Legal Aid Portal.',
      };
    }

    // Consumer Grievance / e-Daakhil / NCH lookups
    if (
      text.includes('consumer complaint portal') ||
      text.includes('edaakhil') ||
      text.includes('consumer helpline') ||
      text.includes('e-daakhil') ||
      text.includes('1915')
    ) {
      return {
        aiRequired: false,
        intent: 'DIRECT_LOOKUP',
        matchedProviderId: 'src_consumer_edaakhil',
        category: 'consumer_rights',
        subcategory: 'Consumer Forum E-Filing',
        directAnswer:
          'Online consumer court complaints can be filed on the e-Daakhil Portal at https://edaakhil.nic.in. For pre-litigation company grievances, call 1915 or visit https://consumerhelpline.gov.in.',
        reason: 'Matched direct verified official portal lookup for e-Daakhil & National Consumer Helpline.',
      };
    }

    // eCourts status lookups
    if (
      text.includes('ecourts') ||
      text.includes('court status') ||
      text.includes('cnr number') ||
      text.includes('cause list')
    ) {
      return {
        aiRequired: false,
        intent: 'DIRECT_LOOKUP',
        matchedProviderId: 'src_ecourts',
        category: 'general_legal',
        subcategory: 'eCourts Case Tracking',
        directAnswer:
          'District Court and High Court case status, cause lists, and orders can be searched on the official eCourts portal at https://ecourts.gov.in.',
        reason: 'Matched direct verified official court lookup for eCourts Portal.',
      };
    }

    // CPGRAMS public grievance lookups
    if (
      text.includes('cpgrams') ||
      text.includes('public grievance portal') ||
      text.includes('complain against government department')
    ) {
      return {
        aiRequired: false,
        intent: 'DIRECT_LOOKUP',
        matchedProviderId: 'src_cpgrams',
        category: 'general_legal',
        subcategory: 'Public Grievances',
        directAnswer:
          'Grievances against Central or State Government ministries and departments can be lodged on CPGRAMS at https://pgportal.gov.in.',
        reason: 'Matched direct verified official portal lookup for CPGRAMS.',
      };
    }

    // 3. Simple Natural Language Legal Statements (Requires Low-Cost Model)
    if (text.length < 300 && !text.includes('conflict') && !text.includes('appeal')) {
      return {
        aiRequired: true,
        intent: 'SIMPLE_EXTRACTION',
        reason: 'Standard legal problem description requiring low-cost NLP fact extraction.',
      };
    }

    // 4. Complex Legal Disagreements / Multi-Route Synthesis
    return {
      aiRequired: true,
      intent: 'COMPLEX_SYNTHESIS',
      reason: 'Complex legal dispute with potential multi-source route synthesis.',
    };
  }
}

export const taskClassifier = new TaskClassifier();

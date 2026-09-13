export interface OfficialLegalSource {
  id: string;
  title: string;
  publisher: string;
  sourceType: 'official_government' | 'official_court' | 'primary_law' | 'official_portal' | 'institutional' | 'legal_database' | 'educational';
  url: string;
  provider: string;
  relevance: string;
  category: string;
  keywords: string[];
  description: string;
  actionButtonText?: string;
  instructions?: string[];
}

export const VERIFIED_PORTAL_REGISTRY: OfficialLegalSource[] = [
  {
    id: 'src_police_helpline',
    title: 'National Emergency Helpline 112 (Police / Fire / Ambulance)',
    publisher: 'Ministry of Home Affairs, Government of India',
    sourceType: 'official_government',
    url: 'https://112.gov.in',
    provider: 'National Emergency Response System (NERS)',
    relevance: 'Single unified emergency helpline number across India for immediate police assistance, crime reporting, and emergency dispatch.',
    category: 'general_legal',
    keywords: ['police helpline', 'emergency dispatch', '112', '100', 'police number', 'dial 112'],
    description: 'Dial 112 (or 100) for immediate police emergency response or report via National Emergency Response Support System.',
    actionButtonText: 'Visit Emergency Services Portal ↗',
    instructions: [
      'Dial 112 or 100 directly from any phone in India for immediate emergency assistance',
      'For non-emergency police complaints, visit your local police station or state police e-FIR portal',
    ],
  },
  {
    id: 'src_act_crpc_bnss',
    title: 'Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS Section 528 / CrPC 482)',
    publisher: 'Legislative Department, Ministry of Law and Justice, India',
    sourceType: 'primary_law',
    url: 'https://www.indiacode.nic.in/handle/123456789/20000',
    provider: 'India Code',
    relevance: 'Statutory framework governing FIR investigation, police powers, and High Court inherent jurisdiction to quash illegal or false FIRs.',
    category: 'general_legal',
    keywords: ['fir', 'quashing', 'quash fir', 'firearm', 'criminal', 'bnss', 'crpc', 'police investigation', 'charge sheet'],
    description: 'Provides procedural rules for criminal investigation, e-FIR, and filing quashing petitions before the High Court.',
    actionButtonText: 'Read Criminal Procedure on India Code ↗',
  },
  {
    id: 'src_cybercrime',
    title: 'National Cyber Crime Reporting Portal',
    publisher: 'Ministry of Home Affairs, Government of India',
    sourceType: 'official_portal',
    url: 'https://cybercrime.gov.in',
    provider: 'Indian Cyber Crime Coordination Centre (I4C)',
    relevance: 'Official portal for reporting online financial cyber fraud, identity theft, and digital scams.',
    category: 'cyber_crime',
    keywords: ['cyber', 'cybercrime', 'fraud', 'scam', '1930', 'hacked', 'phishing', 'upi fraud', 'bank fraud'],
    description: 'Report cyber financial fraud immediately or call helpline 1930 to freeze fraudulent bank transactions.',
    actionButtonText: 'Report Cyber Crime Online ↗',
    instructions: [
      'Visit cybercrime.gov.in or dial 1930 immediately within the golden hour of financial fraud',
      'Select "Report Cyber Crime" and upload bank statement / transaction UTR',
    ],
  },
  {
    id: 'src_rti_online',
    title: 'RTI Online Portal',
    publisher: 'Department of Personnel and Training, Government of India',
    sourceType: 'official_portal',
    url: 'https://rtionline.gov.in',
    provider: 'Government of India',
    relevance: 'File online Right to Information applications to obtain public documents and government records under RTI Act, 2005.',
    category: 'general_legal',
    keywords: ['rti', 'information', 'public record', 'right to information', 'government record'],
    description: 'Enables citizens to file RTI applications online for Central Public Authorities.',
    actionButtonText: 'Submit RTI Request Online ↗',
    instructions: [
      'Submit RTI request on rtionline.gov.in with ₹10 application fee',
      'Public Information Officer (PIO) is mandated to reply within 30 days',
    ],
  },
  {
    id: 'src_consumer_edaakhil',
    title: 'e-Daakhil Portal (National Consumer Disputes Redressal Commission)',
    publisher: 'Department of Consumer Affairs, Government of India',
    sourceType: 'official_portal',
    url: 'https://edaakhil.nic.in',
    provider: 'National Consumer Disputes Redressal Commission',
    relevance: 'Official online portal to file consumer complaints before District, State, and National Consumer Commissions.',
    category: 'consumer_rights',
    keywords: ['consumer', 'defective', 'product', 'refund', 'e-commerce', 'edaakhil', 'consumer court'],
    description: 'Allows Indian citizens to file consumer complaints online without physically visiting the commission.',
    actionButtonText: 'File Consumer Case on e-Daakhil ↗',
    instructions: [
      'Register with Aadhaar or mobile number on edaakhil.nic.in',
      'Upload purchase invoice, demand notice, and proof of non-resolution',
      'Pay prescribed court fee online based on claim value',
    ],
  },
  {
    id: 'src_consumer_nch',
    title: 'National Consumer Helpline (NCH / INGRAM)',
    publisher: 'Department of Consumer Affairs, Government of India',
    sourceType: 'official_portal',
    url: 'https://consumerhelpline.gov.in',
    provider: 'National Consumer Helpline',
    relevance: 'Pre-litigation grievance redressal mechanism for e-commerce, defective goods, and service deficiency.',
    category: 'consumer_rights',
    keywords: ['nch', '1915', 'ingram', 'defective', 'refund', 'pre-litigation'],
    description: 'Register pre-court consumer grievances or call toll-free 1915 for immediate mediation with registered companies.',
    actionButtonText: 'Lodge NCH Grievance ↗',
    instructions: [
      'Call 1915 or lodge grievance online at consumerhelpline.gov.in',
      'Provide company name, transaction ID, and clear relief requested',
    ],
  },
  {
    id: 'src_nalsa',
    title: 'NALSA Legal Aid Portal',
    publisher: 'National Legal Services Authority',
    sourceType: 'official_portal',
    url: 'https://nalsa.gov.in',
    provider: 'National Legal Services Authority',
    relevance: 'Constitutional entitlement to free legal services under Legal Services Authorities Act, 1987.',
    category: 'general_legal',
    keywords: ['legal aid', 'free lawyer', 'nalsa', 'dlsa', 'indigent', 'free legal assistance'],
    description: 'Provides free legal representation, advice, and Lok Adalat dispute resolution for eligible citizens.',
    actionButtonText: 'Apply for Free Legal Aid ↗',
    instructions: [
      'Apply online at nalsa.gov.in or visit District Legal Services Authority (DLSA)',
    ],
  },
  {
    id: 'src_ecourts',
    title: 'eCourts Services Portal',
    publisher: 'eCommittee, Supreme Court of India',
    sourceType: 'official_court',
    url: 'https://ecourts.gov.in',
    provider: 'eCommittee, Supreme Court of India',
    relevance: 'Case status, cause lists, court orders, and e-filing for High Courts and District Courts across India.',
    category: 'general_legal',
    keywords: ['ecourts', 'cnr', 'court status', 'cause list', 'district court'],
    description: 'Access live court records, case numbers, and judgment transcripts.',
    actionButtonText: 'Check Court Case Status ↗',
    instructions: [
      'Search case status using CNR number or party name on ecourts.gov.in',
    ],
  },
  {
    id: 'src_cpgrams',
    title: 'CPGRAMS (Centralized Public Grievance Redress and Monitoring System)',
    publisher: 'Department of Administrative Reforms and Public Grievances',
    sourceType: 'official_portal',
    url: 'https://pgportal.gov.in',
    provider: 'CPGRAMS, Government of India',
    relevance: 'Official portal for grievances against Central/State government departments, public utilities, and ministries.',
    category: 'general_legal',
    keywords: ['cpgrams', 'public grievance', 'pgportal', 'government complaint'],
    description: 'Online platform for Indian citizens to log grievances against public service delays and statutory duty failures.',
    actionButtonText: 'Lodge Public Grievance ↗',
    instructions: [
      'Log in to pgportal.gov.in using digital credentials',
      'Select relevant Ministry / Department and attach supporting correspondence',
    ],
  },
  {
    id: 'src_parivahan',
    title: 'Parivahan Sewa & eChallan Portal',
    publisher: 'Ministry of Road Transport and Highways, Government of India',
    sourceType: 'official_portal',
    url: 'https://echallan.parivahan.gov.in',
    provider: 'Parivahan, Government of India',
    relevance: 'Official portal for checking traffic challans, driver license details, and vehicle registration records.',
    category: 'general_legal',
    keywords: ['parivahan', 'challan', 'traffic', 'driving license', 'vehicle'],
    description: 'Pay or dispute traffic challans and verify vehicle registration records online.',
    actionButtonText: 'Check Traffic Challan Status ↗',
    instructions: [
      'Visit echallan.parivahan.gov.in and enter Challan Number or Vehicle Registration',
    ],
  },
  {
    id: 'src_act_tpa',
    title: 'Transfer of Property Act, 1882 (Section 108 - Tenant Rights & Deposit)',
    publisher: 'Legislative Department, Ministry of Law and Justice, India',
    sourceType: 'primary_law',
    url: 'https://www.indiacode.nic.in/handle/123456789/2338',
    provider: 'India Code',
    relevance: 'Governs lease obligations, quiet enjoyment, and security deposit return principles.',
    category: 'tenant_dispute',
    keywords: ['tenant', 'landlord', 'rent', 'lease', 'deposit', 'security deposit', 'rental agreement'],
    description: 'Mandates landlord duties upon determination of tenancy and vacant possession handover.',
    actionButtonText: 'Read Law on India Code ↗',
  },
  {
    id: 'src_act_cpa',
    title: 'Consumer Protection Act, 2019 (Section 2 - Defective Goods & Services)',
    publisher: 'Legislative Department, Ministry of Law and Justice, India',
    sourceType: 'primary_law',
    url: 'https://www.indiacode.nic.in/handle/123456789/15256',
    provider: 'India Code',
    relevance: 'Defines unfair trade practices, product liability, and consumer forum jurisdiction.',
    category: 'consumer_rights',
    keywords: ['consumer', 'defective', 'e-commerce', 'unfair trade', 'refund'],
    description: 'Statutory basis for claiming full refund, replacement, or compensation for deficient services.',
    actionButtonText: 'Read Consumer Law on India Code ↗',
  },
];

const STOP_WORDS = new Set(['where', 'do', 'i', 'my', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'from', 'is', 'it', 'what', 'how', 'received', 'online', 'store', 'hasnt', 'returned']);

export class ProviderRegistry {
  findRelevantSources(queryOptions: {
    category?: string;
    subcategory?: string;
    keywords?: string[];
    matchedProviderId?: string;
  }): OfficialLegalSource[] {
    const { category, keywords = [], matchedProviderId } = queryOptions;

    // 1. Exact Provider ID Match
    if (matchedProviderId) {
      const exact = VERIFIED_PORTAL_REGISTRY.find((s) => s.id === matchedProviderId);
      if (exact) return [exact];
    }

    // 2. Keyword & Specific Intent Matching
    const cleanKeywords = keywords
      .map((k) => k.toLowerCase().trim())
      .filter((k) => k.length > 3 && !STOP_WORDS.has(k));

    const keywordMatches = VERIFIED_PORTAL_REGISTRY.filter((src) => {
      return cleanKeywords.some((kw) =>
        src.keywords.some((skw) => skw.includes(kw) || kw.includes(skw))
      );
    });

    if (keywordMatches.length > 0) {
      // Filter out irrelevant categories if category specified
      if (category && category !== 'general_legal') {
        const strictCatMatches = keywordMatches.filter(
          (src) => src.category === category || src.category === 'general_legal'
        );
        if (strictCatMatches.length > 0) return strictCatMatches;
      }
      return keywordMatches;
    }

    // 3. Category Fallback
    if (category && category !== 'general_legal') {
      const catMatches = VERIFIED_PORTAL_REGISTRY.filter((src) => src.category === category);
      if (catMatches.length > 0) return catMatches;
    }

    // 4. Default General Legal Fallback
    return VERIFIED_PORTAL_REGISTRY.filter(
      (s) => s.id === 'src_cpgrams' || s.id === 'src_rti_online' || s.id === 'src_nalsa'
    );
  }

  getSourceById(id: string): OfficialLegalSource | undefined {
    return VERIFIED_PORTAL_REGISTRY.find((s) => s.id === id);
  }
}

export const providerRegistry = new ProviderRegistry();


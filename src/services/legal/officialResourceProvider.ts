export interface OfficialResource {
  id: string;
  name: string;
  category: string;
  description: string;
  officialUrl: string;
  jurisdiction: string;
  actionsSupported: string[];
  helplinePhone?: string;
  isEmergency?: boolean;
  instructions?: string;
  sourceType: 'OFFICIAL_GOVERNMENT_PORTAL' | 'NATIONAL_HELPLINE' | 'STATE_PORTAL' | 'STATUTORY_AUTHORITY';
}

export class OfficialResourceProvider {
  private registry: OfficialResource[] = [
    {
      id: 'cybercrime_portal',
      name: 'National Cyber Crime Reporting Portal & Helpline 1930',
      category: 'cyber_crime',
      description: 'Official Ministry of Home Affairs portal to report financial cyber fraud, UPI scams, and online crimes in India.',
      officialUrl: 'https://cybercrime.gov.in',
      jurisdiction: 'India',
      actionsSupported: ['Report Financial Fraud', 'Report UPI Scam', 'File Cyber Complaint'],
      helplinePhone: '1930',
      isEmergency: true,
      instructions: 'For financial fraud, call 1930 immediately to freeze fraudulent money transfers within 2 hours of the transaction.',
      sourceType: 'NATIONAL_HELPLINE',
    },
    {
      id: 'edaakhil_consumer',
      name: 'e-Daakhil Portal (Consumer Dispute Online Filing)',
      category: 'tenant_dispute',
      description: 'Official portal established by National Consumer Disputes Redressal Commission (NCDRC) for online filing of consumer & service deficiency complaints.',
      officialUrl: 'https://edaakhil.nic.in',
      jurisdiction: 'India / All States',
      actionsSupported: ['File Consumer Complaint Online', 'Track Case Status', 'Upload Evidence'],
      sourceType: 'OFFICIAL_GOVERNMENT_PORTAL',
    },
    {
      id: 'nch_consumer',
      name: 'National Consumer Helpline (NCH)',
      category: 'consumer_rights',
      description: 'Department of Consumer Affairs grievance portal & toll-free helpline 1915.',
      officialUrl: 'https://consumerhelpline.gov.in',
      jurisdiction: 'India',
      actionsSupported: ['Lodge Consumer Grievance', 'Track Grievance Status'],
      helplinePhone: '1915',
      sourceType: 'OFFICIAL_GOVERNMENT_PORTAL',
    },
    {
      id: 'cpgrams_portal',
      name: 'CPGRAMS (Centralised Public Grievance Redress and Monitoring System)',
      category: 'general_legal',
      description: 'Official Government of India portal for filing grievances against central ministries, government departments, and public authorities.',
      officialUrl: 'https://pgportal.gov.in',
      jurisdiction: 'India',
      actionsSupported: ['File Public Grievance', 'Track Appeal', 'Send Reminder'],
      sourceType: 'OFFICIAL_GOVERNMENT_PORTAL',
    },
    {
      id: 'rti_central',
      name: 'RTI Online Portal (Central Government)',
      category: 'general_legal',
      description: 'Official Department of Personnel and Training (DoPT) portal for filing Right to Information (RTI) applications to Central Ministries.',
      officialUrl: 'https://rtionline.gov.in',
      jurisdiction: 'Central Government of India',
      actionsSupported: ['File First RTI Application', 'Submit First Appeal', 'Track RTI Status'],
      instructions: 'For State government RTI requests (e.g. UP, Delhi, Maharashtra), use the respective State RTI portal.',
      sourceType: 'OFFICIAL_GOVERNMENT_PORTAL',
    },
    {
      id: 'up_rti_online',
      name: 'Uttar Pradesh State RTI Online Portal',
      category: 'general_legal',
      description: 'Official portal for filing RTI applications to Government of Uttar Pradesh departments (including Noida Authority, Police, Revenue).',
      officialUrl: 'https://rtionline.up.gov.in',
      jurisdiction: 'Uttar Pradesh',
      actionsSupported: ['File UP State RTI Application', 'Track UP RTI Status'],
      sourceType: 'STATE_PORTAL',
    },
    {
      id: 'nalsa_legalaid',
      name: 'National Legal Services Authority (NALSA) & State Legal Aid',
      category: 'general_legal',
      description: 'Statutory body providing free, competent legal services to eligible citizens (women, SC/ST, low income, victims of disaster).',
      officialUrl: 'https://nalsa.gov.in',
      jurisdiction: 'India',
      actionsSupported: ['Apply for Free Legal Aid Lawyer', 'Locate District Legal Services Authority (DLSA)'],
      helplinePhone: '15100',
      sourceType: 'STATUTORY_AUTHORITY',
    },
    {
      id: 'ecourts_services',
      name: 'eCourts Services Portal',
      category: 'general_legal',
      description: 'Official case status and CNR search service for District Courts and High Courts across India.',
      officialUrl: 'https://services.ecourts.gov.in',
      jurisdiction: 'India',
      actionsSupported: ['Search Case Status by CNR Number', 'View Cause Lists', 'Check Court Orders'],
      instructions: 'Enter your 16-digit Case Number Record (CNR) to fetch real-time court listings and hearing dates.',
      sourceType: 'OFFICIAL_GOVERNMENT_PORTAL',
    },
    {
      id: 'samadhan_labour',
      name: 'SAMADHAN Labour Grievance Portal',
      category: 'employment',
      description: 'Ministry of Labour and Employment portal for industrial disputes, delayed wage claims, and conciliation.',
      officialUrl: 'https://samadhan.labour.gov.in',
      jurisdiction: 'India',
      actionsSupported: ['Register Labour Dispute', 'File Conciliation Application'],
      sourceType: 'OFFICIAL_GOVERNMENT_PORTAL',
    },
  ];

  async getOfficialResources(category?: string, state?: string): Promise<OfficialResource[]> {
    return this.registry.filter((r) => {
      if (category && r.category === category) return true;
      if (state && r.jurisdiction.toLowerCase().includes(state.toLowerCase())) return true;
      if (!category) return true;
      return r.category === 'general_legal';
    });
  }

  async getResourceById(id: string): Promise<OfficialResource | null> {
    return this.registry.find((r) => r.id === id) || null;
  }
}

export const officialResourceProvider = new OfficialResourceProvider();

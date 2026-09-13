export interface LegalGuide {
  id: string;
  category: string;
  title: string;
  summary: string;
  keyRights: string[];
  applicableAct: string;
  officialPortalUrl: string;
}

export const LEGAL_KNOWLEDGE_GUIDES: LegalGuide[] = [
  {
    id: 'tenant-rights-101',
    category: 'Tenant Rights',
    title: 'Security Deposit Refund Rules in India',
    summary: 'Landlords in India are legally obligated to return security deposits after deducting legitimate rent arrears or damages backed by invoices.',
    keyRights: [
      'Right to itemized deduction receipt',
      'Refund within agreed lease timeline (typically 7-15 days)',
      'Protection against unlawful eviction without 30-day notice',
    ],
    applicableAct: 'Model Tenancy Act / State Rent Control Act',
    officialPortalUrl: 'https://mohua.gov.in/mta',
  },
  {
    id: 'consumer-rights-101',
    category: 'Consumer Protection',
    title: 'E-Commerce & Product Defect Rights',
    summary: 'Consumers can claim full refunds for defective items, non-delivery, or deceptive services via National Consumer Helpline or e-Daakhil.',
    keyRights: [
      'Right to replacement or full refund',
      'Right to compensation for hardship',
      'Filing online via e-Daakhil without hiring expensive lawyers',
    ],
    applicableAct: 'Consumer Protection Act 2019',
    officialPortalUrl: 'https://consumerhelpline.gov.in',
  },
  {
    id: 'labor-rights-101',
    category: 'Employment Rights',
    title: 'Unpaid Salary & Illegal Termination Rights',
    summary: 'Employees can issue demand notices for withheld salary or gratuity and file grievances with the District Labor Commissioner.',
    keyRights: [
      'Payment of wages within 7 days of salary cycle',
      'Mandatory notice period or pay in lieu of notice',
      'Gratuity entitlement after 5 years continuous service',
    ],
    applicableAct: 'Payment of Wages Act / Industrial Disputes Act',
    officialPortalUrl: 'https://samadhan.labour.gov.in',
  },
];

export class LegalKnowledgeService {
  getGuides(): LegalGuide[] {
    return LEGAL_KNOWLEDGE_GUIDES;
  }
}

export const legalKnowledgeService = new LegalKnowledgeService();

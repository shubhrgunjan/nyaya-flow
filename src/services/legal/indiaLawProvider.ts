export interface LegalProvision {
  actId: string;
  actName: string;
  sectionNumber: string;
  sectionTitle: string;
  summary: string;
  fullText?: string;
  applicableJurisdiction: string;
  officialSourceUrl: string;
  retrievedAt: string;
}

export class IndiaLawProvider {
  private corpus: LegalProvision[] = [
    {
      actId: 'tpa_1882',
      actName: 'Transfer of Property Act, 1882',
      sectionNumber: '108',
      sectionTitle: 'Rights and Liabilities of Lessor and Lessee',
      summary: 'Lessor is bound to disclose material defects and return security deposits/advance payments upon vacant possession minus reasonable damages.',
      applicableJurisdiction: 'India (and State Rent Control Acts)',
      officialSourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2338',
      retrievedAt: new Date().toISOString(),
    },
    {
      actId: 'cpa_2019',
      actName: 'Consumer Protection Act, 2019',
      sectionNumber: '35',
      sectionTitle: 'Manner in which complaint shall be made to District Commission',
      summary: 'A consumer or tenant (where service is hired for consideration) can file a complaint before the District Consumer Disputes Redressal Commission.',
      applicableJurisdiction: 'India',
      officialSourceUrl: 'https://www.indiacode.nic.in/handle/123456789/15256',
      retrievedAt: new Date().toISOString(),
    },
    {
      actId: 'it_2000',
      actName: 'Information Technology Act, 2000',
      sectionNumber: '66D',
      sectionTitle: 'Punishment for cheating by personation by using computer resource',
      summary: 'Covers UPI fraud, phishing, OTP scams, and fraudulent money transfers using online payment systems or electronic devices.',
      applicableJurisdiction: 'India',
      officialSourceUrl: 'https://www.indiacode.nic.in/handle/123456789/1999',
      retrievedAt: new Date().toISOString(),
    },
    {
      actId: 'bns_2023',
      actName: 'Bharatiya Nyaya Sanhita, 2023',
      sectionNumber: '318',
      sectionTitle: 'Cheating and Dishonestly Inducing Delivery of Property',
      summary: 'Punishes fraudulent inducement and digital financial deception causing wrongful loss.',
      applicableJurisdiction: 'India',
      officialSourceUrl: 'https://www.indiacode.nic.in/handle/123456789/20002',
      retrievedAt: new Date().toISOString(),
    },
    {
      actId: 'pwa_1936',
      actName: 'Payment of Wages Act, 1936',
      sectionNumber: '15',
      sectionTitle: 'Claims arising out of deductions from wages or delay in payment',
      summary: 'Employees can apply to the Labour Commissioner / Authority for delayed or withheld wages along with compensation.',
      applicableJurisdiction: 'India',
      officialSourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2362',
      retrievedAt: new Date().toISOString(),
    },
    {
      actId: 'ida_1947',
      actName: 'Industrial Disputes Act, 1947',
      sectionNumber: '33C',
      sectionTitle: 'Recovery of money due from an employer',
      summary: 'Workmen can apply for recovery of dues from an employer through the Labour Court.',
      applicableJurisdiction: 'India',
      officialSourceUrl: 'https://www.indiacode.nic.in/handle/123456789/2365',
      retrievedAt: new Date().toISOString(),
    },
    {
      actId: 'rti_2005',
      actName: 'Right to Information Act, 2005',
      sectionNumber: '6',
      sectionTitle: 'Request for obtaining information',
      summary: 'Citizens can request information from public authorities regarding government files, schemes, or public actions.',
      applicableJurisdiction: 'India',
      officialSourceUrl: 'https://rtionline.gov.in',
      retrievedAt: new Date().toISOString(),
    },
  ];

  async searchLaw(query: string, category?: string): Promise<LegalProvision[]> {
    const q = query.toLowerCase();
    return this.corpus.filter((p) => {
      if (category && category.includes('tenant') && (p.actId.includes('tpa') || p.actId.includes('cpa'))) {
        return true;
      }
      if (category && category.includes('cyber') && (p.actId.includes('it') || p.actId.includes('bns'))) {
        return true;
      }
      if (category && category.includes('employment') && (p.actId.includes('pwa') || p.actId.includes('ida'))) {
        return true;
      }
      return (
        p.actName.toLowerCase().includes(q) ||
        p.sectionTitle.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q)
      );
    });
  }

  async getProvision(actId: string, sectionNumber: string): Promise<LegalProvision | null> {
    return this.corpus.find((p) => p.actId === actId && p.sectionNumber === sectionNumber) || null;
  }
}

export const indiaLawProvider = new IndiaLawProvider();

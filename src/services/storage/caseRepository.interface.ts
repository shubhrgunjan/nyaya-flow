import { CaseModel } from '../../types/case';

export interface ICaseRepository {
  getAllCases(): Promise<CaseModel[]>;
  getCaseById(id: string): Promise<CaseModel | null>;
  saveCase(caseItem: CaseModel): Promise<void>;
  deleteCase(id: string): Promise<void>;
}

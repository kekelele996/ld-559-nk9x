import { ClaimStatus, InsuranceStatus, PolicyType } from '../constants/enums';
import { MedicalRecord } from './medical';
import { Pet } from './pet';

export interface InsurancePolicy {
  id: string;
  petId: string;
  provider: string;
  planType: PolicyType;
  premium: number;
  coverage: number;
  startDate: string;
  endDate: string;
  status: InsuranceStatus;
  pet?: Pet;
}

export interface ClaimItem {
  id: string;
  claimId: string;
  medicalRecordId: string;
  cost: number;
  medicalRecord?: MedicalRecord;
}

export interface InsuranceClaim {
  id: string;
  policyId: string;
  amount: number;
  status: ClaimStatus;
  submittedAt: string;
  items: ClaimItem[];
  policy?: InsurancePolicy;
}

export interface ClaimableRecord extends MedicalRecord {
  claimItem?: ClaimItem | null;
  clinic?: { id: string; name: string };
}

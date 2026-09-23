import { ClaimStatus, InsuranceStatus, PolicyType } from '../constants/enums';
import type { MedicalRecord } from './medical';
import type { Pet } from './pet';

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

export interface InsuranceClaimItem {
  id: string;
  claimId: string;
  medicalRecordId: string;
  cost: number;
  record?: MedicalRecord;
}

export interface InsuranceClaim {
  id: string;
  policyId: string;
  petId: string;
  claimNo: string;
  amount: number;
  status: ClaimStatus;
  progress: number;
  submittedAt: string;
  items: InsuranceClaimItem[];
  policy?: InsurancePolicy;
}

export interface CreateClaimPayload {
  policyId: string;
  petId: string;
  recordIds: string[];
}

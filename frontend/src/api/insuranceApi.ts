import { request, unwrap } from '../utils/request';
import type { CreateClaimPayload, InsuranceClaim, InsurancePolicy } from '../types/insurance';
import type { MedicalRecord } from '../types/medical';
import { mockClaims, mockInsurance, mockMedical } from '../utils/mockData';

function mockClaimableRecords(policyId: string): MedicalRecord[] {
  const policy = mockInsurance.find((item) => item.id === policyId);
  if (!policy) return [];
  const claimed = new Set(mockClaims.flatMap((claim) => claim.items.map((item) => item.medicalRecordId)));
  return mockMedical.filter(
    (record) =>
      record.petId === policy.petId &&
      record.visitDate >= policy.startDate &&
      record.visitDate <= policy.endDate &&
      !claimed.has(record.id),
  );
}

export const insuranceApi = {
  list: (params?: { petId?: string }) => unwrap<InsurancePolicy[]>(request.get('/insurance', { params }), mockInsurance),
  claimableRecords: (policyId: string) =>
    unwrap<MedicalRecord[]>(request.get(`/insurance/${policyId}/claimable-records`), mockClaimableRecords(policyId)),
  listClaims: (params?: { policyId?: string }) => unwrap<InsuranceClaim[]>(request.get('/insurance/claims', { params }), mockClaims),
  createClaim: (payload: CreateClaimPayload) => request.post('/insurance/claims', payload),
};

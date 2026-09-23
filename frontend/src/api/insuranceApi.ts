import { request, unwrap } from '../utils/request';
import type { ClaimableRecord, InsuranceClaim, InsurancePolicy } from '../types/insurance';
import { mockClaimableRecords, mockClaims, mockInsurance } from '../utils/mockData';

export const insuranceApi = {
  list: (params?: { petId?: string }) => unwrap<InsurancePolicy[]>(request.get('/insurance', { params }), mockInsurance),
  claims: (params?: { policyId?: string }) =>
    unwrap<InsuranceClaim[]>(request.get('/insurance/claims', { params }), mockClaims),
  claimableRecords: (policyId: string) =>
    unwrap<ClaimableRecord[]>(request.get(`/insurance/${policyId}/claimable-records`), mockClaimableRecords),
  submitClaim: async (policyId: string, recordIds: string[]) => {
    const res = await request.post(`/insurance/${policyId}/claims`, { recordIds });
    return res.data.data as InsuranceClaim;
  },
};

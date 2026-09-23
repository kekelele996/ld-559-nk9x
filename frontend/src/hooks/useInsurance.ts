import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { insuranceApi } from '../api/insuranceApi';
import type { CreateClaimPayload } from '../types/insurance';

export const useClaims = (policyId?: string) =>
  useQuery({
    queryKey: ['claims', policyId ?? 'all'],
    queryFn: () => insuranceApi.listClaims(policyId ? { policyId } : undefined),
  });

export const useClaimableRecords = (policyId?: string, enabled = true) =>
  useQuery({
    queryKey: ['claimable-records', policyId],
    queryFn: () => insuranceApi.claimableRecords(policyId as string),
    enabled: enabled && Boolean(policyId),
  });

export const useCreateClaim = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClaimPayload) => insuranceApi.createClaim(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['insurance'] });
      void queryClient.invalidateQueries({ queryKey: ['claims'] });
      void queryClient.invalidateQueries({ queryKey: ['claimable-records'] });
    },
  });
};

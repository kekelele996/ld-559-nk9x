import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { insuranceApi } from '../api/insuranceApi';

export const useInsurancePolicies = () => useQuery({ queryKey: ['insurance'], queryFn: () => insuranceApi.list() });

export const useClaims = () => useQuery({ queryKey: ['claims'], queryFn: () => insuranceApi.claims() });

export const useClaimableRecords = (policyId?: string) =>
  useQuery({
    queryKey: ['claimable-records', policyId],
    queryFn: () => insuranceApi.claimableRecords(policyId as string),
    enabled: Boolean(policyId),
  });

export const useSubmitClaim = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ policyId, recordIds }: { policyId: string; recordIds: string[] }) =>
      insuranceApi.submitClaim(policyId, recordIds),
    onSuccess: () => {
      message.success('理赔单已提交，正在处理中');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['insurance'] });
      queryClient.invalidateQueries({ queryKey: ['claimable-records'] });
    },
  });
};

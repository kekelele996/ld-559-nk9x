import { InsuranceStatus } from '../../constants/enums';
import { BusinessException } from '../../exceptions/business.exception';

export function validatePolicyDates(startDate: string, endDate: string) {
  if (new Date(endDate) <= new Date(startDate)) throw new BusinessException('保单结束日期必须晚于开始日期');
}

interface ClaimablePolicy {
  status: string;
  startDate: Date;
  endDate: Date;
}

export function validatePolicyClaimable(policy: ClaimablePolicy | null, now = new Date()): asserts policy is ClaimablePolicy {
  if (!policy) throw new BusinessException('保单不存在');
  if (policy.status === InsuranceStatus.EXPIRED || now < policy.startDate || now > policy.endDate) {
    throw new BusinessException('保单未生效或已过期，无法提交理赔');
  }
}

interface ClaimRecord {
  petId: string;
  visitDate: Date;
  claimItem?: unknown;
}

export function validateClaimRecords(records: ClaimRecord[], policyPetId: string, policy: ClaimablePolicy) {
  for (const record of records) {
    if (record.petId !== policyPetId) throw new BusinessException('就诊记录与保单宠物不匹配，无法提交理赔');
    if (record.visitDate < policy.startDate || record.visitDate > policy.endDate) {
      throw new BusinessException('就诊日期不在保障期内，无法提交理赔');
    }
    if (record.claimItem) throw new BusinessException('所选就诊记录已存在理赔，无法重复提交');
  }
}

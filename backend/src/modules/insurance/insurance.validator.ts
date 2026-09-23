import { InsuranceStatus } from '../../constants/enums';
import { BusinessException } from '../../exceptions/business.exception';

export function validatePolicyDates(startDate: string, endDate: string) {
  if (new Date(endDate) <= new Date(startDate)) throw new BusinessException('保单结束日期必须晚于开始日期');
}

interface ClaimPolicyWindow {
  status: string;
  startDate: Date;
  endDate: Date;
}

/** 保单未生效、已过期或不在保障期内时拒绝理赔 */
export function validatePolicyClaimable(policy: ClaimPolicyWindow, now = new Date()) {
  if (policy.status === InsuranceStatus.PENDING_RENEWAL) throw new BusinessException('保单待续保，尚未生效，无法提交理赔');
  if (policy.status === InsuranceStatus.EXPIRED) throw new BusinessException('保单已过期，无法提交理赔');
  if (now < policy.startDate) throw new BusinessException('保单尚未生效，无法提交理赔');
  if (now > policy.endDate) throw new BusinessException('保单已过保障期，无法提交理赔');
}

interface ClaimRecord {
  id: string;
  petId: string;
  visitDate: Date;
}

/** 就诊记录必须真实存在、属于保单关联的宠物且就诊日期在保障期内 */
export function validateClaimRecords(records: ClaimRecord[], requestedIds: string[], policy: { petId: string; startDate: Date; endDate: Date }) {
  if (records.length !== requestedIds.length) throw new BusinessException('部分就诊记录不存在，请刷新后重试');
  for (const record of records) {
    if (record.petId !== policy.petId) throw new BusinessException('就诊记录与保单关联的宠物不匹配，无法提交理赔');
    if (record.visitDate < policy.startDate || record.visitDate > policy.endDate) {
      throw new BusinessException('就诊日期超出保障期，无法提交理赔');
    }
  }
}

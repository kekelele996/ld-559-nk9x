import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRole } from '../../constants/enums';
import { BusinessException } from '../../exceptions/business.exception';
import { CreateClaimDto } from './insurance.dto';
import { ClaimRepository } from './claim.repository';
import { validateClaimRecords, validatePolicyClaimable } from './insurance.validator';

function generateClaimNo(now = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `CL${stamp}${Math.floor(Math.random() * 900 + 100)}`;
}

@Injectable()
export class ClaimService {
  constructor(private readonly repo: ClaimRepository) {}

  list(user: { sub: string; role: UserRole }, policyId?: string) {
    return this.repo.findClaims(user, policyId);
  }

  async claimableRecords(user: { sub: string; role: UserRole }, policyId: string) {
    const policy = await this.repo.findPolicyById(policyId);
    if (!policy) throw new BusinessException('保单不存在');
    this.assertOwnership(user, policy.pet.ownerId);
    return this.repo.findClaimableRecords(policy.petId, policy.startDate, policy.endDate);
  }

  async submit(user: { sub: string; role: UserRole }, dto: CreateClaimDto) {
    const recordIds = [...new Set(dto.recordIds)];
    const policy = await this.repo.findPolicyById(dto.policyId);
    if (!policy) throw new BusinessException('保单不存在');
    this.assertOwnership(user, policy.pet.ownerId);
    if (policy.petId !== dto.petId) throw new BusinessException('就诊宠物与保单关联的宠物不匹配，无法提交理赔');
    validatePolicyClaimable(policy);

    const records = await this.repo.findRecordsByIds(recordIds);
    validateClaimRecords(records, recordIds, policy);

    const claimed = await this.repo.findClaimItemsByRecordIds(recordIds);
    if (claimed.length > 0) throw new BusinessException('所选就诊记录已存在理赔，请勿重复提交');

    const amount = records.reduce((sum, record) => sum.add(record.cost), new Prisma.Decimal(0));
    return this.repo.createClaimWithItems({
      policyId: policy.id,
      petId: policy.petId,
      claimNo: generateClaimNo(),
      amount,
      records: records.map((record) => ({ id: record.id, cost: record.cost })),
    });
  }

  private assertOwnership(user: { sub: string; role: UserRole }, ownerId: string) {
    if (user.role === UserRole.PET_OWNER && ownerId !== user.sub) throw new BusinessException('无权操作他人的保单');
  }
}

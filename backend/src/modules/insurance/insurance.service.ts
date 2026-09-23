import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRole } from '../../constants/enums';
import { BusinessException } from '../../exceptions/business.exception';
import { CreateClaimDto, CreateInsuranceDto, UpdateInsuranceDto } from './insurance.dto';
import { InsuranceRepository } from './insurance.repository';
import { validateClaimRecords, validatePolicyClaimable, validatePolicyDates } from './insurance.validator';

@Injectable()
export class InsuranceService {
  constructor(private readonly repo: InsuranceRepository) {}

  list(user: { sub: string; role: UserRole }, petId?: string) {
    return this.repo.findMany(user, petId);
  }

  create(dto: CreateInsuranceDto) {
    validatePolicyDates(dto.startDate, dto.endDate);
    return this.repo.create({ ...dto, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate) });
  }

  update(id: string, dto: UpdateInsuranceDto) {
    validatePolicyDates(dto.startDate, dto.endDate);
    return this.repo.update(id, { ...dto, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate) });
  }

  async listClaimableRecords(user: { sub: string; role: UserRole }, policyId: string) {
    const policy = await this.repo.findPolicyById(policyId, user);
    validatePolicyClaimable(policy);
    return this.repo.findClaimableRecords(policy.petId);
  }

  async submitClaim(user: { sub: string; role: UserRole }, policyId: string, dto: CreateClaimDto) {
    const policy = await this.repo.findPolicyById(policyId, user);
    validatePolicyClaimable(policy);
    const recordIds = [...new Set(dto.recordIds)];
    const records = await this.repo.findRecordsByIds(recordIds);
    if (records.length !== recordIds.length) throw new BusinessException('就诊记录不存在，无法提交理赔');
    validateClaimRecords(records, policy.petId, policy);
    const amount = records.reduce((sum, record) => sum.plus(record.cost), new Prisma.Decimal(0));
    return this.repo.createClaim(
      policyId,
      records.map((record) => ({ medicalRecordId: record.id, cost: record.cost })),
      amount,
    );
  }

  listClaims(user: { sub: string; role: UserRole }, policyId?: string) {
    return this.repo.findClaims(user, policyId);
  }
}

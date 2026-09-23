import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClaimStatus, InsuranceStatus, UserRole } from '../../constants/enums';
import { BusinessException } from '../../exceptions/business.exception';
import { PrismaService } from '../../prisma/prisma.service';

const CLAIMED_RECORD_MESSAGE = '所选就诊记录已存在理赔，请勿重复提交';

@Injectable()
export class ClaimRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPolicyById(id: string) {
    return this.prisma.insurancePolicy.findUnique({ where: { id }, include: { pet: true } });
  }

  /** 保障期内且尚未进入任何理赔单的就诊记录 */
  findClaimableRecords(petId: string, startDate: Date, endDate: Date) {
    return this.prisma.medicalRecord.findMany({
      where: { petId, visitDate: { gte: startDate, lte: endDate }, claimItem: null },
      include: { clinic: true, vet: true },
      orderBy: { visitDate: 'desc' },
    });
  }

  findRecordsByIds(ids: string[]) {
    return this.prisma.medicalRecord.findMany({ where: { id: { in: ids } } });
  }

  findClaimItemsByRecordIds(recordIds: string[]) {
    return this.prisma.insuranceClaimItem.findMany({
      where: { medicalRecordId: { in: recordIds } },
      select: { medicalRecordId: true },
    });
  }

  findClaims(user: { sub: string; role: UserRole }, policyId?: string) {
    const where: Prisma.InsuranceClaimWhereInput = {
      ...(user.role === UserRole.PET_OWNER ? { policy: { pet: { ownerId: user.sub } } } : {}),
      ...(policyId ? { policyId } : {}),
    };
    return this.prisma.insuranceClaim.findMany({
      where,
      include: { policy: { include: { pet: true } }, items: { include: { record: true } } },
      orderBy: { submittedAt: 'desc' },
    });
  }

  /**
   * 在事务内先锁定保单行，再复查就诊记录是否已被理赔，
   * 保证并发提交时同一批记录只有一笔理赔单能成立。
   */
  async createClaimWithItems(input: {
    policyId: string;
    petId: string;
    claimNo: string;
    amount: Prisma.Decimal;
    records: { id: string; cost: Prisma.Decimal }[];
  }) {
    // 按记录 ID 排序后插入，避免并发事务以不同顺序写唯一索引造成死锁
    const records = [...input.records].sort((a, b) => (a.id < b.id ? -1 : 1));
    const recordIds = records.map((record) => record.id);
    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "InsurancePolicy" WHERE id = ${input.policyId} FOR UPDATE`;
        const claimed = await tx.insuranceClaimItem.findMany({
          where: { medicalRecordId: { in: recordIds } },
          select: { medicalRecordId: true },
        });
        if (claimed.length > 0) throw new BusinessException(CLAIMED_RECORD_MESSAGE);
        const claim = await tx.insuranceClaim.create({
          data: {
            policyId: input.policyId,
            petId: input.petId,
            claimNo: input.claimNo,
            amount: input.amount,
            status: ClaimStatus.REVIEWING,
            progress: 1,
            items: { create: records.map((record) => ({ medicalRecordId: record.id, cost: record.cost })) },
          },
          include: { items: true },
        });
        await tx.insurancePolicy.update({ where: { id: input.policyId }, data: { status: InsuranceStatus.CLAIMING } });
        return claim;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BusinessException(CLAIMED_RECORD_MESSAGE);
      }
      throw error;
    }
  }
}

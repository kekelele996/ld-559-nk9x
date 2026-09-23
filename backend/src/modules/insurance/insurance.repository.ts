import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ClaimStatus, InsuranceStatus, UserRole } from '../../constants/enums';
import { BusinessException } from '../../exceptions/business.exception';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InsuranceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(user: { sub: string; role: UserRole }, petId?: string) {
    const where: Prisma.InsurancePolicyWhereInput = {
      ...(user.role === UserRole.PET_OWNER ? { pet: { ownerId: user.sub } } : {}),
      ...(petId ? { petId } : {}),
    };
    return this.prisma.insurancePolicy.findMany({ where, include: { pet: true }, orderBy: { endDate: 'asc' } });
  }

  create(data: Prisma.InsurancePolicyUncheckedCreateInput) {
    return this.prisma.insurancePolicy.create({ data });
  }

  update(id: string, data: Prisma.InsurancePolicyUncheckedUpdateInput) {
    return this.prisma.insurancePolicy.update({ where: { id }, data });
  }

  findPolicyById(id: string, user: { sub: string; role: UserRole }) {
    return this.prisma.insurancePolicy.findFirst({
      where: { id, ...(user.role === UserRole.PET_OWNER ? { pet: { ownerId: user.sub } } : {}) },
      include: { pet: true },
    });
  }

  findClaimableRecords(petId: string) {
    return this.prisma.medicalRecord.findMany({
      where: { petId },
      include: { claimItem: true, clinic: true },
      orderBy: { visitDate: 'desc' },
    });
  }

  findRecordsByIds(ids: string[]) {
    return this.prisma.medicalRecord.findMany({ where: { id: { in: ids } }, include: { claimItem: true } });
  }

  async createClaim(policyId: string, items: { medicalRecordId: string; cost: Prisma.Decimal }[], amount: Prisma.Decimal) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const claim = await tx.insuranceClaim.create({
          data: {
            policyId,
            amount,
            status: ClaimStatus.PROCESSING,
            items: { create: items },
          },
          include: { items: true },
        });
        await tx.insurancePolicy.update({ where: { id: policyId }, data: { status: InsuranceStatus.CLAIMING } });
        return claim;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BusinessException('所选就诊记录已存在理赔，无法重复提交');
      }
      throw error;
    }
  }

  findClaims(user: { sub: string; role: UserRole }, policyId?: string) {
    const where: Prisma.InsuranceClaimWhereInput = {
      ...(policyId ? { policyId } : {}),
      ...(user.role === UserRole.PET_OWNER ? { policy: { pet: { ownerId: user.sub } } } : {}),
    };
    return this.prisma.insuranceClaim.findMany({
      where,
      include: { items: { include: { medicalRecord: true } }, policy: { include: { pet: true } } },
      orderBy: { submittedAt: 'desc' },
    });
  }
}

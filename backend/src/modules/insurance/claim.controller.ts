import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuditLog } from '../../middleware/audit-log';
import { AuthGuard } from '../auth/auth.guard';
import { ClaimService } from './claim.service';
import { CreateClaimDto } from './insurance.dto';

@Controller('insurance')
@UseGuards(AuthGuard)
export class ClaimController {
  constructor(private readonly service: ClaimService) {}

  @Get('claims')
  async listClaims(@Req() req: any, @Query('policyId') policyId?: string) {
    return { code: 0, message: 'ok', data: await this.service.list(req.user, policyId) };
  }

  @Get(':id/claimable-records')
  async claimableRecords(@Req() req: any, @Param('id') id: string) {
    return { code: 0, message: 'ok', data: await this.service.claimableRecords(req.user, id) };
  }

  @Post('claims')
  @AuditLog('提交理赔')
  async create(@Req() req: any, @Body() dto: CreateClaimDto) {
    return { code: 0, message: 'ok', data: await this.service.submit(req.user, dto) };
  }
}

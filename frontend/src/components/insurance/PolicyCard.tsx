import { Button, Card, Space, Tooltip, Typography } from 'antd';
import type { InsuranceClaim, InsurancePolicy } from '../../types/insurance';
import { ClaimStatus, InsuranceStatus, enumLabels } from '../../constants/enums';
import { StatusBadge } from '../common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/format';

interface Props {
  policy: InsurancePolicy;
  claims: InsuranceClaim[];
  onClaim: (policy: InsurancePolicy) => void;
}

function inactiveReason(policy: InsurancePolicy): string | null {
  const now = Date.now();
  if (policy.status === InsuranceStatus.EXPIRED || now > new Date(policy.endDate).getTime()) {
    return '保单已过期，无法提交理赔';
  }
  if (now < new Date(policy.startDate).getTime()) {
    return '保单未生效，无法提交理赔';
  }
  return null;
}

export function PolicyCard({ policy, claims, onClaim }: Props) {
  const processing = claims.some((claim) => claim.policyId === policy.id && claim.status === ClaimStatus.PROCESSING);
  const blocked = inactiveReason(policy);
  const label = processing ? '处理中' : '提交理赔';
  const button = (
    <Button key="claim" type="link" disabled={processing || Boolean(blocked)} loading={processing} onClick={() => onClaim(policy)}>
      {label}
    </Button>
  );
  return (
    <Card actions={[blocked ? <Tooltip key="claim" title={blocked}>{button}</Tooltip> : button]}>
      <Space direction="vertical">
        <Space>
          <Typography.Title level={4}>{policy.provider}</Typography.Title>
          <StatusBadge status={policy.status} />
        </Space>
        <Typography.Text>
          {policy.pet?.name} · {enumLabels[policy.planType]}计划
        </Typography.Text>
        <Typography.Text>
          保费 {formatCurrency(policy.premium)}，保障 {formatCurrency(policy.coverage)}
        </Typography.Text>
        <Typography.Text type="secondary">
          {formatDate(policy.startDate)} 至 {formatDate(policy.endDate)}
        </Typography.Text>
      </Space>
    </Card>
  );
}

import { Card, Empty, List, Space, Steps, Tag, Typography } from 'antd';
import type { InsuranceClaim } from '../../types/insurance';
import { ClaimStatus, enumLabels } from '../../constants/enums';
import { formatCurrency, formatDate } from '../../utils/format';

const stepItems = [{ title: '提交' }, { title: '审核' }, { title: '赔付' }];

function stepProps(status: ClaimStatus): { current: number; status?: 'process' | 'error' } {
  if (status === ClaimStatus.APPROVED) return { current: 3 };
  if (status === ClaimStatus.REJECTED) return { current: 1, status: 'error' };
  return { current: 1 };
}

export function ClaimList({ claims }: { claims: InsuranceClaim[] }) {
  if (claims.length === 0) return <Empty description="暂无理赔记录" />;
  return (
    <List
      dataSource={claims}
      renderItem={(claim) => (
        <Card size="small" className="claim-card" key={claim.id}>
          <Space direction="vertical" size={12} className="page-block">
            <Space wrap>
              <Typography.Text strong>
                {claim.policy?.provider ?? '保单'} · {claim.policy?.pet?.name ?? ''}
              </Typography.Text>
              <Tag color={claim.status === ClaimStatus.APPROVED ? 'green' : claim.status === ClaimStatus.REJECTED ? 'red' : 'processing'}>
                {enumLabels[claim.status]}
              </Tag>
              <Typography.Text type="secondary">提交于 {formatDate(claim.submittedAt)}</Typography.Text>
            </Space>
            <Typography.Text>
              理赔金额 <Typography.Text strong>{formatCurrency(Number(claim.amount))}</Typography.Text>
              <Typography.Text type="secondary">（{claim.items.length} 笔就诊记录）</Typography.Text>
            </Typography.Text>
            <Steps size="small" items={stepItems} {...stepProps(claim.status)} />
          </Space>
        </Card>
      )}
    />
  );
}

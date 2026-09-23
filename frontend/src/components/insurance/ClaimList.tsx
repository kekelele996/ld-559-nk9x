import { Card, Empty, List, Space, Steps, Typography } from 'antd';
import { ClaimStatus } from '../../constants/enums';
import { useClaims } from '../../hooks/useInsurance';
import { StatusBadge } from '../common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/format';

export function ClaimList() {
  const { data: claims = [], isLoading } = useClaims();
  return (
    <Card title="理赔进度" loading={isLoading}>
      {claims.length === 0 ? (
        <Empty description="暂无理赔记录" />
      ) : (
        <List
          dataSource={claims}
          renderItem={(claim) => (
            <List.Item>
              <Space direction="vertical" size={8} className="claim-item">
                <Space>
                  <Typography.Text strong>{claim.claimNo}</Typography.Text>
                  <StatusBadge status={claim.status} />
                </Space>
                <Typography.Text type="secondary">
                  {claim.policy?.provider} · {claim.policy?.pet?.name} · 理赔金额 {formatCurrency(claim.amount)} · 提交于{' '}
                  {formatDate(claim.submittedAt)}
                </Typography.Text>
                <Steps
                  size="small"
                  current={claim.progress}
                  status={claim.status === ClaimStatus.REJECTED ? 'error' : 'process'}
                  items={[{ title: '提交' }, { title: '审核' }, { title: '赔付' }]}
                />
              </Space>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}

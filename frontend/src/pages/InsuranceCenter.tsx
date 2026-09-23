import { useState } from 'react';
import { Button, Card, Col, Row, Space, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { insuranceApi } from '../api/insuranceApi';
import { InsurancePieChart } from '../components/charts/InsurancePieChart';
import { ClaimList } from '../components/insurance/ClaimList';
import { ClaimSubmitModal } from '../components/insurance/ClaimSubmitModal';
import { StatusBadge } from '../components/common/StatusBadge';
import { enumLabels } from '../constants/enums';
import type { InsurancePolicy } from '../types/insurance';
import { formatCurrency, formatDate } from '../utils/format';

export default function InsuranceCenter() {
  const [claimPolicy, setClaimPolicy] = useState<InsurancePolicy | null>(null);
  const { data = [] } = useQuery({ queryKey: ['insurance'], queryFn: () => insuranceApi.list() });
  return (
    <Space direction="vertical" size={20} className="page-block">
      <Typography.Title level={2}>保险中心</Typography.Title>
      <Row gutter={[16, 16]}>
        {data.map((policy) => (
          <Col xs={24} lg={12} key={policy.id}>
            <Card
              actions={[
                <Button key="claim" type="link" onClick={() => setClaimPolicy(policy)}>
                  提交理赔
                </Button>,
              ]}
            >
              <Space direction="vertical">
                <Space><Typography.Title level={4}>{policy.provider}</Typography.Title><StatusBadge status={policy.status} /></Space>
                <Typography.Text>{policy.pet?.name} · {enumLabels[policy.planType]}计划</Typography.Text>
                <Typography.Text>保费 {formatCurrency(policy.premium)}，保障 {formatCurrency(policy.coverage)}</Typography.Text>
                <Typography.Text type="secondary">{formatDate(policy.startDate)} 至 {formatDate(policy.endDate)}</Typography.Text>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}><ClaimList /></Col>
        <Col xs={24} lg={12}><Card title="年度保费分析"><InsurancePieChart policies={data} /></Card></Col>
      </Row>
      <ClaimSubmitModal policy={claimPolicy} open={Boolean(claimPolicy)} onClose={() => setClaimPolicy(null)} />
    </Space>
  );
}

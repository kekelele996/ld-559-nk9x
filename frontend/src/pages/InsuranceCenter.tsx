import { useState } from 'react';
import { Card, Col, Row, Space, Typography } from 'antd';
import type { InsurancePolicy } from '../types/insurance';
import { InsurancePieChart } from '../components/charts/InsurancePieChart';
import { ClaimList } from '../components/insurance/ClaimList';
import { ClaimModal } from '../components/insurance/ClaimModal';
import { PolicyCard } from '../components/insurance/PolicyCard';
import { useClaims, useInsurancePolicies } from '../hooks/useInsurance';

export default function InsuranceCenter() {
  const { data: policies = [] } = useInsurancePolicies();
  const { data: claims = [] } = useClaims();
  const [claimPolicy, setClaimPolicy] = useState<InsurancePolicy | null>(null);

  return (
    <Space direction="vertical" size={20} className="page-block">
      <Typography.Title level={2}>保险中心</Typography.Title>
      <Row gutter={[16, 16]}>
        {policies.map((policy) => (
          <Col xs={24} lg={12} key={policy.id}>
            <PolicyCard policy={policy} claims={claims} onClaim={setClaimPolicy} />
          </Col>
        ))}
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="理赔进度">
            <ClaimList claims={claims} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="年度保费分析">
            <InsurancePieChart policies={policies} />
          </Card>
        </Col>
      </Row>
      <ClaimModal policy={claimPolicy} onClose={() => setClaimPolicy(null)} />
    </Space>
  );
}

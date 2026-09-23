import { useMemo, useState } from 'react';
import { Alert, Checkbox, Empty, List, Modal, Space, Tag, Typography } from 'antd';
import type { ClaimableRecord, InsurancePolicy } from '../../types/insurance';
import { enumLabels } from '../../constants/enums';
import { useClaimableRecords, useSubmitClaim } from '../../hooks/useInsurance';
import { formatCurrency, formatDate } from '../../utils/format';

interface Props {
  policy: InsurancePolicy | null;
  onClose: () => void;
}

function ineligibilityReason(record: ClaimableRecord, policy: InsurancePolicy): string | null {
  if (record.claimItem) return '已存在理赔';
  const visit = new Date(record.visitDate).getTime();
  if (visit < new Date(policy.startDate).getTime() || visit > new Date(policy.endDate).getTime()) {
    return '就诊日期不在保障期内';
  }
  return null;
}

export function ClaimModal({ policy, onClose }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const { data: records = [], isLoading } = useClaimableRecords(policy?.id);
  const submitClaim = useSubmitClaim();

  const items = useMemo(
    () => records.map((record) => ({ record, reason: policy ? ineligibilityReason(record, policy) : null })),
    [records, policy],
  );
  const eligibleIds = items.filter((item) => !item.reason).map((item) => item.record.id);
  const total = items
    .filter((item) => selected.includes(item.record.id))
    .reduce((sum, item) => sum + Number(item.record.cost), 0);

  const close = () => {
    setSelected([]);
    onClose();
  };

  const submit = () => {
    if (!policy) return;
    submitClaim.mutate(
      { policyId: policy.id, recordIds: selected },
      { onSuccess: close },
    );
  };

  return (
    <Modal
      title={`提交理赔 · ${policy?.provider ?? ''}`}
      open={Boolean(policy)}
      onCancel={close}
      onOk={submit}
      okText={`生成理赔单（${formatCurrency(total)}）`}
      cancelText="取消"
      confirmLoading={submitClaim.isPending}
      okButtonProps={{ disabled: selected.length === 0 }}
      destroyOnClose
    >
      <Space direction="vertical" size={12} className="page-block">
        <Typography.Text type="secondary">
          勾选 {policy?.pet?.name ?? '该宠物'} 在保障期内且尚未理赔的就诊记录，将按费用合计生成一笔理赔单。
        </Typography.Text>
        {items.length > 0 && eligibleIds.length > 1 && (
          <Checkbox
            indeterminate={selected.length > 0 && selected.length < eligibleIds.length}
            checked={selected.length === eligibleIds.length}
            onChange={(event) => setSelected(event.target.checked ? eligibleIds : [])}
          >
            全选可理赔记录
          </Checkbox>
        )}
        {items.length === 0 && !isLoading && <Empty description="暂无就诊记录" />}
        <List
          loading={isLoading}
          dataSource={items}
          renderItem={({ record, reason }) => (
            <List.Item>
              <Space direction="vertical" size={2} className="page-block">
                <Space wrap>
                  <Checkbox
                    checked={selected.includes(record.id)}
                    disabled={Boolean(reason)}
                    onChange={(event) =>
                      setSelected((prev) =>
                        event.target.checked ? [...prev, record.id] : prev.filter((id) => id !== record.id),
                      )
                    }
                  >
                    {formatDate(record.visitDate)} · {enumLabels[record.type]} · {record.diagnosis}
                  </Checkbox>
                  {reason && <Tag color="orange">{reason}</Tag>}
                </Space>
                <Typography.Text type="secondary">
                  {record.clinic?.name ?? '就诊机构'} · 费用 {formatCurrency(Number(record.cost))}
                </Typography.Text>
              </Space>
            </List.Item>
          )}
        />
        {items.length > 0 && eligibleIds.length === 0 && (
          <Alert type="warning" showIcon message="没有可理赔的就诊记录" description="保障期内且尚未理赔的就诊记录才能生成理赔单。" />
        )}
      </Space>
    </Modal>
  );
}

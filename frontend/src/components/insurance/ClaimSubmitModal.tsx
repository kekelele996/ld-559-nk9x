import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Empty, Modal, Space, Table, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { InsuranceStatus, enumLabels } from '../../constants/enums';
import type { InsurancePolicy } from '../../types/insurance';
import type { MedicalRecord } from '../../types/medical';
import { useClaimableRecords, useCreateClaim } from '../../hooks/useInsurance';
import { formatCurrency, formatDate } from '../../utils/format';

interface ClaimSubmitModalProps {
  policy: InsurancePolicy | null;
  open: boolean;
  onClose: () => void;
}

/** 保单未生效、已过期或不在保障期内时给出原因并阻止提交 */
function policyBlockReason(policy: InsurancePolicy): string | null {
  if (policy.status === InsuranceStatus.PENDING_RENEWAL) return '保单待续保，尚未生效，暂时无法提交理赔。';
  if (policy.status === InsuranceStatus.EXPIRED) return '保单已过期，无法提交理赔。';
  if (dayjs().isBefore(dayjs(policy.startDate), 'day')) return `保单尚未生效（${formatDate(policy.startDate)} 起保），无法提交理赔。`;
  if (dayjs().isAfter(dayjs(policy.endDate), 'day')) return '保单已过保障期，无法提交理赔。';
  return null;
}

export function ClaimSubmitModal({ policy, open, onClose }: ClaimSubmitModalProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [errorText, setErrorText] = useState('');
  const { data: records = [], isLoading } = useClaimableRecords(policy?.id, open);
  const submit = useCreateClaim();

  useEffect(() => {
    if (open) {
      setSelected([]);
      setErrorText('');
    }
  }, [open, policy?.id]);

  const eligible = useMemo(() => {
    if (!policy) return [];
    return records.filter(
      (record) =>
        record.petId === policy.petId &&
        !dayjs(record.visitDate).isBefore(dayjs(policy.startDate), 'day') &&
        !dayjs(record.visitDate).isAfter(dayjs(policy.endDate), 'day'),
    );
  }, [records, policy]);

  const total = eligible.filter((record) => selected.includes(record.id)).reduce((sum, record) => sum + Number(record.cost), 0);
  const blockReason = policy ? policyBlockReason(policy) : null;

  const handleSubmit = () => {
    if (!policy || selected.length === 0) return;
    setErrorText('');
    submit.mutate(
      { policyId: policy.id, petId: policy.petId, recordIds: selected },
      {
        onSuccess: () => {
          message.success('理赔单已提交，正在处理中');
          onClose();
        },
        onError: (error) => setErrorText(error.message || '提交失败，请稍后重试'),
      },
    );
  };

  return (
    <Modal
      title={`提交理赔${policy ? ` · ${policy.provider}` : ''}`}
      open={open}
      onCancel={onClose}
      width={680}
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          disabled={Boolean(blockReason) || selected.length === 0}
          loading={submit.isPending}
          onClick={handleSubmit}
        >
          {submit.isPending ? '处理中' : '提交理赔'}
        </Button>,
      ]}
    >
      {policy && (
        <Space direction="vertical" size={12} className="claim-modal-body">
          <Typography.Text type="secondary">
            宠物：{policy.pet?.name ?? policy.petId} · 保障期 {formatDate(policy.startDate)} 至 {formatDate(policy.endDate)} · 保障额度{' '}
            {formatCurrency(policy.coverage)}
          </Typography.Text>
          {blockReason && <Alert type="warning" showIcon message={blockReason} />}
          {errorText && <Alert type="error" showIcon message={errorText} />}
          <Table<MedicalRecord>
            rowKey="id"
            size="small"
            loading={isLoading}
            dataSource={eligible}
            pagination={false}
            locale={{ emptyText: <Empty description="保障期内暂无未理赔的就诊记录" /> }}
            rowSelection={{
              selectedRowKeys: selected,
              onChange: (keys) => setSelected(keys.map(String)),
              getCheckboxProps: () => ({ disabled: Boolean(blockReason) || submit.isPending }),
            }}
            columns={[
              { title: '就诊日期', dataIndex: 'visitDate', render: (value: string) => formatDate(value) },
              { title: '类型', dataIndex: 'type', render: (value: keyof typeof enumLabels) => enumLabels[value] },
              { title: '诊断', dataIndex: 'diagnosis' },
              { title: '费用', dataIndex: 'cost', align: 'right', render: (value: number) => formatCurrency(value) },
            ]}
          />
          <Typography.Text strong>
            已选 {selected.length} 条就诊记录，费用合计 {formatCurrency(total)}
          </Typography.Text>
        </Space>
      )}
    </Modal>
  );
}

import { Tag } from 'antd';
import { ClaimStatus, InsuranceStatus, VaccineStatus, enumLabels } from '../../constants/enums';

type Status = VaccineStatus | InsuranceStatus | ClaimStatus | string;

const colors: Record<string, string> = {
  [VaccineStatus.COMPLETED]: 'green',
  [VaccineStatus.PENDING]: 'gold',
  [VaccineStatus.OVERDUE]: 'red',
  [InsuranceStatus.ACTIVE]: 'green',
  [InsuranceStatus.PENDING_RENEWAL]: 'orange',
  [InsuranceStatus.EXPIRED]: 'red',
  [InsuranceStatus.CLAIMING]: 'blue',
  [ClaimStatus.REVIEWING]: 'processing',
  [ClaimStatus.APPROVED]: 'green',
  [ClaimStatus.REJECTED]: 'red',
};

export function StatusBadge({ status }: { status: Status }) {
  return <Tag color={colors[status] || 'default'}>{enumLabels[status as keyof typeof enumLabels] || status}</Tag>;
}

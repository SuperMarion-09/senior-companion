import { ADMIN_STATUSES } from '../utils/admin';
import Badge from './Badge';

/**
 * A booking's status as admins see it: Pending, Confirmed, Completed,
 * Cancelled or Rejected, each with its own colour.
 */
export default function StatusBadge({ status }) {
  const { label, tone } = ADMIN_STATUSES[status] || { label: status, tone: 'neutral' };
  return <Badge tone={tone}>{label}</Badge>;
}

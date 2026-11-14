import { ADMIN_STATUSES, formatDateTime } from '../utils/admin';
import Icon from './Icon';

const ICONS = { created: 'plus-circle', status: 'refresh', note: 'file-text', update: 'clipboard' };

function title(activity) {
  const by = activity.admin_name || 'An administrator';
  switch (activity.type) {
    case 'created':
      // admin_id is only set when staff entered the booking themselves.
      return activity.admin_name ? `${by} entered the booking` : 'Booking requested by the family';
    case 'status':
      return `${by} changed the status to ${ADMIN_STATUSES[activity.to_status]?.label || activity.to_status}`;
    case 'note':
      return `${by} added a note`;
    default:
      return `${by} edited the booking`;
  }
}

/**
 * The booking's history, newest first: status changes, internal notes and edits.
 */
export default function ActivityTimeline({ activities }) {
  return (
    <ol className="timeline">
      {activities.map((activity) => (
        <li key={activity.id} className={`timeline__item timeline__item--${activity.type}`}>
          <span className="timeline__icon">
            <Icon name={ICONS[activity.type] || 'info'} size={18} />
          </span>
          <div className="timeline__content">
            <p className="timeline__title">{title(activity)}</p>
            <p className="timeline__time">{formatDateTime(activity.created_at)}</p>
            {activity.body && <p className="timeline__body">{activity.body}</p>}
            {activity.notification === 'sent' && <p className="timeline__meta">Email sent to the family.</p>}
            {activity.notification === 'failed' && (
              <p className="timeline__meta timeline__meta--error">The email to the family could not be sent.</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

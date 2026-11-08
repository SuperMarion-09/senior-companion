import { Link } from 'react-router-dom';
import Icon from './Icon';

/**
 * One number on the dashboard, e.g. "Pending requests: 4". With `to`, the
 * whole card links to the matching list. `highlight` draws attention to it
 * (used for pending requests waiting for review).
 * tone: 'neutral' | 'info' | 'success' | 'warning' | 'error' | 'muted'
 */
export default function StatCard({ label, value, icon, tone = 'neutral', hint, to, highlight = false }) {
  const content = (
    <>
      <span className="stat-card__top">
        <span className="stat-card__label">{label}</span>
        <span className="stat-card__icon">
          <Icon name={icon} size={20} />
        </span>
      </span>
      <span className="stat-card__value">{value.toLocaleString('en-PH')}</span>
      {hint && <span className="stat-card__hint">{hint}</span>}
    </>
  );

  const className = ['stat-card', `tone-${tone}`, to && 'stat-card--link', highlight && 'stat-card--highlight']
    .filter(Boolean)
    .join(' ');

  return to ? (
    <Link to={to} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

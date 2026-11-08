import { Link } from 'react-router-dom';

/**
 * Logo mark + name. `subtitle` adds a small second line (e.g. "Admin").
 */
export default function Brand({ to = '/', subtitle }) {
  return (
    <Link to={to} className="brand">
      <span className="brand__mark" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 20.5s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.4a4.5 4.5 0 0 1 7.5 3.1c0 5.4-7.5 10-7.5 10z" />
        </svg>
      </span>
      <span className="brand__text">
        <span className="brand__name">Senior Companion</span>
        {subtitle && <span className="brand__sub">{subtitle}</span>}
      </span>
    </Link>
  );
}

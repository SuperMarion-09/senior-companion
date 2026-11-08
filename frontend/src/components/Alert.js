import Icon, { TONE_ICONS } from './Icon';

/**
 * A coloured message box inside the page.
 * type: 'info' | 'success' | 'warning' | 'error'
 */
export default function Alert({ type = 'info', title, children }) {
  return (
    <div className={`alert alert--${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon name={TONE_ICONS[type]} className="alert__icon" />
      <div className="alert__content">
        {title && <p className="alert__title">{title}</p>}
        {children}
      </div>
    </div>
  );
}

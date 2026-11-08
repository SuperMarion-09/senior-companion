import { Link } from 'react-router-dom';
import Icon from './Icon';

/**
 * Reusable button.
 * variant: 'primary' | 'secondary' | 'ghost' | 'danger'
 * size:    'sm' | 'md' | 'lg'
 * Pass `to` to get a link that looks like a button (for navigation).
 * While isLoading is true the button is disabled and shows loadingText.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  to,
  type = 'button',
  isLoading = false,
  loadingText = 'Please wait…',
  disabled,
  className,
  ...props
}) {
  const classes = [
    'button',
    `button--${variant}`,
    size !== 'md' && `button--${size}`,
    fullWidth && 'button--full',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {isLoading ? <span className="button__spinner" aria-hidden="true" /> : icon && <Icon name={icon} size={20} />}
      <span>{isLoading ? loadingText : children}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled || isLoading} aria-busy={isLoading} {...props}>
      {content}
    </button>
  );
}

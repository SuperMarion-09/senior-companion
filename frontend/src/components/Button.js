/**
 * Reusable button. variant: 'primary' | 'secondary'
 * While isLoading is true the button is disabled and shows loadingText.
 */
export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  isLoading = false,
  loadingText = 'Please wait…',
  disabled,
  ...props
}) {
  return (
    <button
      type={type}
      className={`button button--${variant}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? loadingText : children}
    </button>
  );
}

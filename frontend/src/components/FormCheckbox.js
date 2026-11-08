import Icon from './Icon';

/**
 * A large, easy-to-tap checkbox with its label, an optional extra block
 * underneath (e.g. "Read the guideline") and an error message.
 */
export default function FormCheckbox({ id, label, error, children, ...props }) {
  const message = Array.isArray(error) ? error[0] : error;
  const errorId = `${id}-error`;

  return (
    <div className={message ? 'checkbox-field checkbox-field--invalid' : 'checkbox-field'}>
      <label className="checkbox-field__label" htmlFor={id}>
        <input
          id={id}
          name={id}
          type="checkbox"
          className="checkbox-field__input"
          aria-invalid={Boolean(message)}
          aria-describedby={message ? errorId : undefined}
          {...props}
        />
        <span className="checkbox-field__box" aria-hidden="true">
          <Icon name="check" size={20} strokeWidth="3" />
        </span>
        <span>{label}</span>
      </label>
      {children && <div className="checkbox-field__extra">{children}</div>}
      {message && (
        <p id={errorId} className="form-field__error">
          <Icon name="alert-circle" size={18} />
          {message}
        </p>
      )}
    </div>
  );
}

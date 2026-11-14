import Icon from './Icon';

/**
 * The label, hint and error message shared by every form control
 * (FormInput, FormSelect, FormTextarea).
 *
 * `children` is a function that receives the props the control needs
 * (id, name, aria-invalid, aria-describedby) so screen readers read the
 * hint and the error together with the label.
 * `error` can be a string or the array of messages Laravel returns for a field.
 */
export default function FormField({ id, label, hint, error, optional = false, children }) {
  const message = Array.isArray(error) ? error[0] : error;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, message && errorId].filter(Boolean).join(' ');

  return (
    <div className="form-field">
      <label htmlFor={id} className="form-field__label">
        {label}
        {optional && <span className="form-field__optional"> (optional)</span>}
      </label>
      {children({
        id,
        name: id,
        'aria-invalid': Boolean(message),
        'aria-describedby': describedBy || undefined,
      })}
      {hint && (
        <p id={hintId} className="form-field__hint">
          {hint}
        </p>
      )}
      {message && (
        <p id={errorId} className="form-field__error">
          <Icon name="alert-circle" size={18} />
          {message}
        </p>
      )}
    </div>
  );
}

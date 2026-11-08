/**
 * A labelled text input with an optional error message underneath.
 * `error` can be a string or the array of messages Laravel returns for a field.
 */
export default function FormInput({ id, label, error, ...props }) {
  const message = Array.isArray(error) ? error[0] : error;
  const errorId = `${id}-error`;

  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={id}
        aria-invalid={Boolean(message)}
        aria-describedby={message ? errorId : undefined}
        {...props}
      />
      {message && (
        <p id={errorId} className="form-field__error">
          {message}
        </p>
      )}
    </div>
  );
}

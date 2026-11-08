import FormField from './FormField';

/**
 * A labelled multi-line text box (for notes, special requests, etc.).
 */
export default function FormTextarea({ id, label, hint, error, optional, rows = 5, ...props }) {
  return (
    <FormField id={id} label={label} hint={hint} error={error} optional={optional}>
      {(fieldProps) => <textarea {...fieldProps} className="input" rows={rows} {...props} />}
    </FormField>
  );
}

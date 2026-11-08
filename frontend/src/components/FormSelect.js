import FormField from './FormField';

/**
 * A labelled drop-down list.
 * options: [{ value: 'walk', label: 'Walking companion' }, ...]
 */
export default function FormSelect({ id, label, hint, error, optional, options, placeholder = 'Please choose…', ...props }) {
  return (
    <FormField id={id} label={label} hint={hint} error={error} optional={optional}>
      {(fieldProps) => (
        <select {...fieldProps} className="input" {...props}>
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FormField>
  );
}

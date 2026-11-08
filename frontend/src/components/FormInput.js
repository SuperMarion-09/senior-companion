import { useState } from 'react';
import FormField from './FormField';
import Icon from './Icon';

/**
 * A labelled text input with an optional hint and error message.
 * Password inputs get a "Show / Hide" button so people can check what they typed.
 */
export default function FormInput({ id, label, hint, error, optional, type = 'text', ...props }) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <FormField id={id} label={label} hint={hint} error={error} optional={optional}>
      {(fieldProps) =>
        type === 'password' ? (
          <div className="input-group">
            <input {...fieldProps} type={isPasswordVisible ? 'text' : 'password'} className="input" {...props} />
            <button
              type="button"
              className="input-group__toggle"
              onClick={() => setIsPasswordVisible((visible) => !visible)}
              aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
              aria-controls={id}
            >
              <Icon name={isPasswordVisible ? 'eye-off' : 'eye'} size={20} />
              {isPasswordVisible ? 'Hide' : 'Show'}
            </button>
          </div>
        ) : (
          <input {...fieldProps} type={type} className="input" {...props} />
        )
      }
    </FormField>
  );
}

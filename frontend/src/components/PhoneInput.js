import FormInput from './FormInput';
import { sanitizePhoneInput } from '../utils/booking';

/**
 * A Philippine mobile number field (09XX XXX XXXX). Only digits can be typed,
 * up to 11, and phones show the number keypad. A pasted "+63 917 123 4567"
 * becomes "09171234567".
 *
 * It is a "tel" input with a numeric keypad rather than type="number", which
 * would drop the leading 0, show spinner arrows and accept "e" or "-".
 */
export default function PhoneInput({ onChange, ...props }) {
  const handleChange = (event) => {
    event.target.value = sanitizePhoneInput(event.target.value);
    onChange?.(event);
  };

  return (
    <FormInput
      type="tel"
      inputMode="numeric"
      pattern="09[0-9]{9}"
      placeholder="09XXXXXXXXX"
      autoComplete="tel"
      {...props}
      // Length is capped in sanitizePhoneInput: a maxLength would cut a pasted "+63 …" short.
      onChange={handleChange}
    />
  );
}

/**
 * Loading indicator with a text label. Use `center` for a whole page or section.
 */
export default function Spinner({ label = 'Loading…', center = false }) {
  return (
    <div className={center ? 'spinner spinner--center' : 'spinner'} role="status">
      <span className="spinner__circle" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

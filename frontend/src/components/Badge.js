/**
 * A small coloured label, e.g. for a booking status.
 * tone: 'neutral' | 'info' | 'success' | 'warning' | 'error'
 */
export default function Badge({ tone = 'neutral', children }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

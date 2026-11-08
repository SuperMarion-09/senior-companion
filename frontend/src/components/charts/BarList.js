/**
 * Horizontal bars for a ranked list (e.g. most requested services). One
 * colour for every bar: the length shows the number, which is also printed
 * at the bar's tip.
 *
 * rows: [{ key, label, value }]
 */
export default function BarList({ rows, unit = 'booking' }) {
  const max = Math.max(1, ...rows.map((row) => row.value));

  return (
    <ul className="bar-list">
      {rows.map((row) => (
        <li key={row.key} className="bar-list__row">
          <span className="bar-list__label">{row.label}</span>
          <span className="bar-list__track">
            <span
              className="bar-list__bar"
              style={{ width: row.value > 0 ? `max(6px, ${(row.value / max) * 100}%)` : 0 }}
              aria-hidden="true"
            />
            <span className="bar-list__value">
              {row.value}
              <span className="visually-hidden"> {row.value === 1 ? unit : `${unit}s`}</span>
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

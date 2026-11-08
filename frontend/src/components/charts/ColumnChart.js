import { niceTicks } from './chartUtils';

/**
 * Vertical columns for a short fixed sequence (days of the week). The value
 * sits on each column's cap; the tallest column is highlighted so the
 * busiest day stands out.
 *
 * columns: [{ key, label, shortLabel, value }]
 */
export default function ColumnChart({ columns, ariaLabel }) {
  const ticks = niceTicks(Math.max(...columns.map((column) => column.value)));
  const top = ticks[ticks.length - 1];
  const max = Math.max(...columns.map((column) => column.value));

  return (
    <div className="columns" role="img" aria-label={ariaLabel}>
      <div className="columns__plot">
        {ticks.map((tick) => (
          <span key={tick} className="columns__grid" style={{ bottom: `${(tick / top) * 100}%` }} aria-hidden="true" />
        ))}
        {columns.map((column) => (
          <div key={column.key} className="columns__slot" title={`${column.label}: ${column.value}`}>
            <span className="columns__value">{column.value}</span>
            <span
              className={column.value === max && max > 0 ? 'columns__bar columns__bar--peak' : 'columns__bar'}
              style={{ height: `${(column.value / top) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="columns__labels" aria-hidden="true">
        {columns.map((column) => (
          <span key={column.key}>{column.shortLabel}</span>
        ))}
      </div>
    </div>
  );
}

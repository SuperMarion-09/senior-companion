import { useState } from 'react';

const SIZE = 180;
const STROKE = 26;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 2; // px of surface between segments

/**
 * Part-to-whole for a handful of categories (here: booking statuses). The
 * legend beside it always shows each label, count and share, so the chart
 * never relies on colour alone. Hover or focus a legend row to highlight
 * its segment.
 *
 * segments: [{ key, label, value, color }]
 */
export default function DonutChart({ segments, total, centerLabel, ariaLabel }) {
  const [active, setActive] = useState(null);
  const visible = segments.filter((segment) => segment.value > 0);
  const gap = visible.length > 1 ? GAP : 0;

  let offset = 0;
  const arcs = visible.map((segment) => {
    const length = (segment.value / total) * CIRCUMFERENCE;
    const arc = { ...segment, dash: Math.max(0, length - gap), offset };
    offset += length;
    return arc;
  });

  const activeSegment = segments.find((segment) => segment.key === active);
  const share = (value) => (total > 0 ? Math.round((value / total) * 100) : 0);

  return (
    <div className="donut">
      <div className="donut__figure">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={ariaLabel}>
          <circle className="donut__track" cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} strokeWidth={STROKE} />
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            {arcs.map((arc) => (
              <circle
                key={arc.key}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={arc.color}
                strokeWidth={STROKE}
                strokeDasharray={`${arc.dash} ${CIRCUMFERENCE}`}
                strokeDashoffset={-arc.offset}
                className={active && active !== arc.key ? 'donut__arc donut__arc--dim' : 'donut__arc'}
                onPointerEnter={() => setActive(arc.key)}
                onPointerLeave={() => setActive(null)}
              />
            ))}
          </g>
        </svg>
        <div className="donut__center" aria-hidden="true">
          <span className="donut__total">{activeSegment ? activeSegment.value : total}</span>
          <span className="donut__caption">{activeSegment ? activeSegment.label : centerLabel}</span>
        </div>
      </div>

      <ul className="chart-legend">
        {segments.map((segment) => (
          <li
            key={segment.key}
            className={active === segment.key ? 'chart-legend__item chart-legend__item--active' : 'chart-legend__item'}
            tabIndex={0}
            onPointerEnter={() => setActive(segment.key)}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(segment.key)}
            onBlur={() => setActive(null)}
          >
            <span className="chart-legend__swatch" style={{ background: segment.color }} aria-hidden="true" />
            <span className="chart-legend__label">{segment.label}</span>
            <span className="chart-legend__value">
              {segment.value}
              <span className="chart-legend__share"> · {share(segment.value)}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

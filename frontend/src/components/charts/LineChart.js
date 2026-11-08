import { useState } from 'react';
import { useElementWidth } from '../../hooks/useElementWidth';
import { niceTicks } from './chartUtils';

const HEIGHT = 240;
const PAD = { top: 16, right: 20, bottom: 32, left: 36 };

/**
 * One series over time: a 2px line with a light area wash, a dot on the
 * latest point, and a crosshair + tooltip that snaps to the nearest point.
 * Keyboard: focus the chart, then use the arrow keys.
 *
 * points: [{ label, value, tooltipTitle, tooltipValue }]
 */
export default function LineChart({ points, ariaLabel }) {
  const [ref, width] = useElementWidth();
  const [active, setActive] = useState(null);

  const ticks = niceTicks(Math.max(...points.map((point) => point.value)));
  const top = ticks[ticks.length - 1];
  const plotWidth = Math.max(0, width - PAD.left - PAD.right);
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const x = (index) => PAD.left + (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
  const y = (value) => PAD.top + plotHeight - (value / top) * plotHeight;

  const line = points.map((point, index) => `${index ? 'L' : 'M'}${x(index)},${y(point.value)}`).join(' ');
  const area = `${line} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  // Show every label when there is room, otherwise every other one.
  const labelEvery = plotWidth / points.length < 56 ? 2 : 1;
  const last = points.length - 1;

  const nearest = (clientX, rect) => {
    const ratio = (clientX - rect.left - PAD.left) / (plotWidth || 1);
    return Math.min(last, Math.max(0, Math.round(ratio * last)));
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const step = event.key === 'ArrowRight' ? 1 : -1;
      setActive((current) => Math.min(last, Math.max(0, (current ?? last) + step)));
    }
  };

  const activePoint = active !== null ? points[active] : null;
  const tooltipLeft = active !== null ? Math.min(Math.max(x(active), 80), width - 80) : 0;

  return (
    <div className="chart" ref={ref}>
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={ariaLabel}
          tabIndex={0}
          className="chart__svg"
          onKeyDown={handleKeyDown}
          onFocus={() => setActive((current) => current ?? last)}
          onBlur={() => setActive(null)}
          onPointerMove={(event) => setActive(nearest(event.clientX, event.currentTarget.getBoundingClientRect()))}
          onPointerLeave={() => setActive(null)}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line className="chart__grid" x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} />
              <text className="chart__tick" x={PAD.left - 8} y={y(tick)} dy="0.32em" textAnchor="end">
                {tick}
              </text>
            </g>
          ))}
          {points.map((point, index) =>
            index % labelEvery === (last % labelEvery) ? (
              <text key={point.label} className="chart__tick" x={x(index)} y={HEIGHT - 8} textAnchor="middle">
                {point.label}
              </text>
            ) : null
          )}

          <path className="chart__area" d={area} />
          <path className="chart__line" d={line} />

          {activePoint && (
            <g>
              <line className="chart__crosshair" x1={x(active)} x2={x(active)} y1={PAD.top} y2={y(0)} />
              <circle className="chart__dot" cx={x(active)} cy={y(activePoint.value)} r={5} />
            </g>
          )}
          {active !== last && <circle className="chart__dot" cx={x(last)} cy={y(points[last].value)} r={5} />}
        </svg>
      )}

      {activePoint && (
        <div className="chart-tooltip" style={{ left: tooltipLeft, top: 0 }} aria-live="polite">
          <span className="chart-tooltip__value">{activePoint.tooltipValue}</span>
          <span className="chart-tooltip__label">{activePoint.tooltipTitle}</span>
        </div>
      )}
    </div>
  );
}

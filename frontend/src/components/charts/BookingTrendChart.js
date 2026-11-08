import { useState } from 'react';
import ChartTable from './ChartTable';
import LineChart from './LineChart';
import { plural } from './chartUtils';

const SHORT_MONTH = { month: 'short' };

function parse(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

const fmt = (isoDate, options) => parse(isoDate).toLocaleDateString('en-PH', options);

// How each period is labelled on the axis and in the tooltip.
const PERIODS = {
  daily: {
    option: '7 days',
    window: 'the last 7 days',
    axis: (point) => fmt(point.start, { weekday: 'short' }),
    title: (point) => `${fmt(point.start, { weekday: 'long', day: 'numeric', month: 'long' })}${point.partial ? ' (today so far)' : ''}`,
  },
  weekly: {
    option: '8 weeks',
    window: 'the last 8 weeks',
    axis: (point) => fmt(point.start, { day: 'numeric', ...SHORT_MONTH }),
    title: (point) =>
      `Week of ${fmt(point.start, { day: 'numeric', ...SHORT_MONTH })} – ${fmt(point.end, { day: 'numeric', ...SHORT_MONTH })}${
        point.partial ? ' (this week so far)' : ''
      }`,
  },
  monthly: {
    option: '6 months',
    window: 'the last 6 months',
    axis: (point) => fmt(point.start, SHORT_MONTH),
    title: (point) => `${fmt(point.start, { month: 'long', year: 'numeric' })}${point.partial ? ' (so far)' : ''}`,
  },
};

/** "3 more than the 7 days before", or null when there is nothing fair to compare. */
function comparison(total, previous, window) {
  if (previous === 0 && total === 0) return null;
  const before = window.replace('the last', 'the');
  if (previous === 0) return `None in ${before} before`;
  const difference = total - previous;
  if (difference === 0) return `Same as ${before} before`;
  return `${Math.abs(difference)} ${difference > 0 ? 'more' : 'fewer'} than ${before} before`;
}

/**
 * Booking requests received over time, with a 7 days / 8 weeks / 6 months
 * switch. Counts come from the dashboard API (grouped in Manila time).
 */
export default function BookingTrendChart({ trends }) {
  const [period, setPeriod] = useState('weekly');
  const config = PERIODS[period];
  const series = trends[period];
  const compare = comparison(series.total, series.previous_total, config.window);

  const points = series.points.map((point) => ({
    label: config.axis(point),
    value: point.count,
    tooltipTitle: config.title(point),
    tooltipValue: plural(point.count, 'request'),
  }));

  return (
    <>
      <div className="chart-card__header">
        <div>
          <h2 className="chart-card__title">Booking requests</h2>
          <p className="chart-card__subtitle">
            <strong>{plural(series.total, 'request')}</strong> in {config.window}
            {compare && <span className="chart-card__compare"> · {compare}</span>}
          </p>
        </div>
        <div className="segmented" role="radiogroup" aria-label="Period">
          {Object.entries(PERIODS).map(([key, { option }]) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={period === key}
              className={period === key ? 'segmented__option segmented__option--active' : 'segmented__option'}
              onClick={() => setPeriod(key)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {series.total === 0 ? (
        <p className="chart-empty">No booking requests were received in {config.window}.</p>
      ) : (
        <LineChart
          points={points}
          ariaLabel={`Booking requests per ${period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month'}, ${config.window}: ${series.total} in total. Use the arrow keys to read each value, or open the table below.`}
        />
      )}

      <ChartTable
        caption={`Booking requests, ${config.window}`}
        columns={['Period', 'Requests']}
        rows={series.points.map((point) => [config.title(point), point.count])}
      />
    </>
  );
}

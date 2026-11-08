/*
  Shared helpers for the dashboard charts. Colours live in index.css
  (--chart-* tokens); the status colours were checked with a colour-blindness
  validator, and every chart also shows its numbers as text or a table, so
  colour is never the only way to read a value.
*/

export const STATUS_CHART_COLORS = {
  pending: 'var(--chart-pending)',
  confirmed: 'var(--chart-confirmed)',
  completed: 'var(--chart-completed)',
  cancelled: 'var(--chart-cancelled)',
  rejected: 'var(--chart-rejected)',
};

/**
 * Round axis ticks for whole-number counts: [0, 2, 4, 6] rather than
 * [0, 1.75, 3.5, …]. Returns at most `count` + 1 ticks.
 */
export function niceTicks(maxValue, count = 4) {
  if (maxValue <= 0) return [0, 1];
  const rough = maxValue / count;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = Math.max(1, [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= rough));
  const top = Math.ceil(maxValue / step) * step;
  const ticks = [];
  for (let value = 0; value <= top; value += step) ticks.push(value);
  return ticks;
}

export function plural(count, word, plural = `${word}s`) {
  return `${count.toLocaleString('en-PH')} ${count === 1 ? word : plural}`;
}

import { useEffect, useId, useRef, useState } from 'react';
import FormField from './FormField';
import Icon from './Icon';
import { toIsoDate } from '../utils/booking';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parse(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

// Keeps the day where it can: 31 March + 1 month → 30 April.
function addMonths(date, months) {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return target;
}

const shortLabel = (date) =>
  date.toLocaleDateString('en-PH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const fullLabel = (date) =>
  date.toLocaleDateString('en-PH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const monthLabel = (date) => date.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });

/**
 * A labelled date field with a calendar that opens below it. It replaces the
 * browser's own date input, which looks different in every browser and is
 * hard to use for older visitors.
 *
 * The value is "YYYY-MM-DD" (or ''), the same as <input type="date">, and
 * onChange receives { target: { name, value } } so the existing form handlers
 * keep working. `min` and `max` (also "YYYY-MM-DD") grey out days outside the
 * range. `clearable` adds a "Clear" button, for filters.
 *
 * Keyboard: arrows move by a day or a week, Page Up / Page Down by a month,
 * Home / End to the start or end of the week, Enter picks, Escape closes.
 */
export default function DateInput({
  id,
  label,
  hint,
  error,
  optional,
  name,
  value,
  onChange,
  min,
  max,
  clearable = false,
  placeholder = 'Choose a date…',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [focused, setFocused] = useState(() => parse(value) || new Date());
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const gridRef = useRef(null);
  const headingId = useId();

  const selected = parse(value);
  const today = toIsoDate(new Date());
  const isDisabled = (iso) => (min && iso < min) || (max && iso > max);

  const clampToRange = (date) => {
    const iso = toIsoDate(date);
    if (min && iso < min) return parse(min);
    if (max && iso > max) return parse(max);
    return date;
  };

  const open = () => {
    setFocused(clampToRange(selected || new Date()));
    setIsOpen(true);
  };

  const close = (returnFocus = true) => {
    setIsOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  const pick = (iso) => {
    onChange?.({ target: { name: name || id, value: iso, type: 'date' } });
    close();
  };

  // Close when clicking or tabbing outside.
  useEffect(() => {
    if (!isOpen) return undefined;
    const handlePointer = (event) => {
      if (!wrapperRef.current?.contains(event.target)) close(false);
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('focusin', handlePointer);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('focusin', handlePointer);
    };
  }, [isOpen]);

  // Keep keyboard focus on the highlighted day as it moves.
  useEffect(() => {
    if (!isOpen) return;
    gridRef.current?.querySelector(`[data-date="${toIsoDate(focused)}"]`)?.focus();
  }, [isOpen, focused]);

  // Bring the whole calendar into view when it opens near the bottom of the screen.
  useEffect(() => {
    if (isOpen) wrapperRef.current?.querySelector('.date-picker__popover')?.scrollIntoView?.({ block: 'nearest' });
  }, [isOpen]);

  const handleGridKey = (event) => {
    const moves = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      PageUp: () => addMonths(focused, -1),
      PageDown: () => addMonths(focused, 1),
      Home: () => addDays(focused, -focused.getDay()),
      End: () => addDays(focused, 6 - focused.getDay()),
    };
    if (moves[event.key]) {
      event.preventDefault();
      setFocused(clampToRange(moves[event.key]()));
    }
  };

  const handlePopoverKey = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  };

  // Six weeks starting on the Sunday on or before the 1st of the month.
  const firstOfMonth = new Date(focused.getFullYear(), focused.getMonth(), 1);
  const gridStart = addDays(firstOfMonth, -firstOfMonth.getDay());
  const weeks = Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(gridStart, week * 7 + day)),
  );

  const prevMonthEnd = toIsoDate(addDays(firstOfMonth, -1));
  const nextMonthStart = toIsoDate(addMonths(firstOfMonth, 1));
  const canGoBack = !min || prevMonthEnd >= min;
  const canGoForward = !max || nextMonthStart <= max;
  const goToMonth = (months) => setFocused(clampToRange(addMonths(focused, months)));

  return (
    <FormField id={id} label={label} hint={hint} error={error} optional={optional}>
      {(fieldProps) => (
        <div className="date-picker" ref={wrapperRef}>
          <button
            {...fieldProps}
            ref={triggerRef}
            type="button"
            className={`input date-picker__trigger${selected ? '' : ' date-picker__trigger--empty'}`}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            onClick={() => (isOpen ? close() : open())}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown' && !isOpen) {
                event.preventDefault();
                open();
              }
            }}
          >
            <span className="date-picker__value">
              {selected ? shortLabel(selected) : placeholder}
              {selected && <span className="visually-hidden">, {fullLabel(selected)}. Change date</span>}
            </span>
            <Icon name="calendar" size={22} className="date-picker__icon" />
          </button>

          {isOpen && (
            <div className="date-picker__popover" role="dialog" aria-modal="false" aria-labelledby={headingId} onKeyDown={handlePopoverKey}>
              <div className="date-picker__header">
                <button
                  type="button"
                  className="date-picker__nav"
                  onClick={() => goToMonth(-1)}
                  disabled={!canGoBack}
                  aria-label="Previous month"
                >
                  <Icon name="arrow-left" size={20} />
                </button>
                <h2 id={headingId} className="date-picker__month" aria-live="polite">
                  {monthLabel(focused)}
                </h2>
                <button
                  type="button"
                  className="date-picker__nav"
                  onClick={() => goToMonth(1)}
                  disabled={!canGoForward}
                  aria-label="Next month"
                >
                  <Icon name="arrow-right" size={20} />
                </button>
              </div>

              <table className="date-picker__grid" role="grid" aria-labelledby={headingId} ref={gridRef} onKeyDown={handleGridKey}>
                <thead>
                  <tr>
                    {WEEKDAYS.map((day) => (
                      <th key={day} scope="col" className="date-picker__weekday">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weeks.map((week) => (
                    <tr key={toIsoDate(week[0])}>
                      {week.map((date) => {
                        const iso = toIsoDate(date);
                        const disabled = isDisabled(iso);
                        const isSelected = value === iso;
                        const isFocused = toIsoDate(focused) === iso;
                        const outside = date.getMonth() !== focused.getMonth();
                        const classes = [
                          'date-picker__day',
                          outside && 'date-picker__day--outside',
                          iso === today && 'date-picker__day--today',
                          isSelected && 'date-picker__day--selected',
                        ]
                          .filter(Boolean)
                          .join(' ');
                        return (
                          <td key={iso} role="gridcell" aria-selected={isSelected}>
                            <button
                              type="button"
                              className={classes}
                              data-date={iso}
                              tabIndex={isFocused ? 0 : -1}
                              disabled={disabled}
                              aria-label={fullLabel(date)}
                              aria-current={iso === today ? 'date' : undefined}
                              onClick={() => pick(iso)}
                              onFocus={() => !isFocused && setFocused(date)}
                            >
                              {date.getDate()}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="date-picker__footer">
                <button type="button" className="date-picker__action" onClick={() => pick(today)} disabled={isDisabled(today)}>
                  Today
                </button>
                {clearable && value && (
                  <button type="button" className="date-picker__action" onClick={() => pick('')}>
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </FormField>
  );
}

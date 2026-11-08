/*
  Labels and helpers for the admin pages. Booking statuses and which
  changes are allowed are decided by Laravel (Booking::TRANSITIONS); this
  file only describes how they look.
*/

// tone: the Badge colour. Each status has its own colour and its own word.
export const ADMIN_STATUSES = {
  pending: { label: 'Pending', tone: 'warning' },
  confirmed: { label: 'Confirmed', tone: 'success' },
  completed: { label: 'Completed', tone: 'info' },
  cancelled: { label: 'Cancelled', tone: 'muted' },
  rejected: { label: 'Rejected', tone: 'error' },
};

export const STATUS_FILTER_OPTIONS = Object.entries(ADMIN_STATUSES).map(([value, { label }]) => ({ value, label }));

/*
  The buttons that change a booking's status, and the "Are you sure?" text.
  notify: whether the family can be emailed about this change.
*/
export const STATUS_ACTIONS = {
  confirmed: {
    label: 'Confirm booking',
    icon: 'check-circle',
    variant: 'primary',
    tone: 'primary',
    title: 'Confirm this booking?',
    text: 'Only confirm once a companion is assigned and the family has been told.',
    reasonLabel: 'Message to the family',
    notify: true,
  },
  completed: {
    label: 'Mark as completed',
    icon: 'calendar-check',
    variant: 'secondary',
    tone: 'primary',
    title: 'Mark this booking as completed?',
    text: 'Do this after the companion has finished the service. It cannot be undone.',
    reasonLabel: 'Note about the visit',
    notify: false,
  },
  rejected: {
    label: 'Reject request',
    icon: 'close',
    variant: 'danger',
    tone: 'danger',
    title: 'Reject this booking request?',
    text: 'Use this when no companion is available. The request is closed and cannot be reopened.',
    reasonLabel: 'Reason for rejecting',
    notify: true,
  },
  cancelled: {
    label: 'Cancel booking',
    icon: 'alert-triangle',
    variant: 'danger',
    tone: 'danger',
    title: 'Cancel this booking?',
    text: 'The booking is closed and cannot be reopened. The family will need to book again.',
    reasonLabel: 'Reason for cancelling',
    notify: true,
  },
};

// Show the positive action first, the destructive ones last.
const ACTION_ORDER = ['confirmed', 'completed', 'rejected', 'cancelled'];

export function sortActions(actions) {
  return [...actions].sort((a, b) => ACTION_ORDER.indexOf(a.status) - ACTION_ORDER.indexOf(b.status));
}

/** "2026-11-10" → "Tue, 10 Nov 2026" (short, for tables). */
export function formatShortDate(value) {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-PH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** ISO timestamp → "8 Nov 2026, 3:15 PM" in the admin's own time zone. */
export function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('en-PH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** "09171234567" → "tel:09171234567", for click-to-call links. */
export function phoneHref(value) {
  return `tel:${String(value || '').replace(/[^\d+]/g, '')}`;
}

/** "Sunday, 8 November 2026" for an ISO date (YYYY-MM-DD). */
export function formatLongDate(value) {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-PH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** "just now", "5 minutes ago", "3 hours ago", "2 days ago", then the date. */
export function formatRelative(value, now = new Date()) {
  if (!value) return '';
  const seconds = Math.round((now - new Date(value)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  return formatDateTime(value);
}

/** Adds days to an ISO date (YYYY-MM-DD) without time-zone surprises. */
export function addDays(isoDate, days) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day + days);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

import { serviceTitle } from '../content/siteContent';
import { formatDate, formatDuration, formatTime } from '../utils/booking';

/**
 * The key facts of one booking as a label / value list. Used on the
 * confirmation and booking status pages.
 */
export default function BookingDetails({ booking, showReference = false, showClient = false, status }) {
  const rows = [
    showReference && ['Booking reference', booking.reference],
    showClient && ['Client name', booking.clientName],
    ['Service type', serviceTitle(booking.serviceType)],
    ['Booking date', formatDate(booking.bookingDate)],
    ['Start time', formatTime(booking.startTime)],
    ['Duration', formatDuration(booking.durationHours)],
    status && ['Status', status],
  ].filter(Boolean);

  return (
    <dl className="summary-list summary-list--boxed">
      {rows.map(([label, value]) => (
        <div key={label} className="summary-list__row">
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

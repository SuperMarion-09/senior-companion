import { Link } from 'react-router-dom';
import { serviceTitle } from '../content/siteContent';
import { formatDateTime, formatShortDate } from '../utils/admin';
import { formatDuration, formatTime } from '../utils/booking';
import StatusBadge from './StatusBadge';

/**
 * The admin bookings table. On small screens each row becomes a card
 * (the data-label attributes provide the labels, see index.css). Cells
 * with more than one line wrap them in a <div> so they stay together.
 *
 * columns: which optional columns to show ('client', 'contact', 'created').
 */
export default function BookingTable({ bookings, caption, columns = ['client', 'contact', 'created'] }) {
  const show = (column) => columns.includes(column);

  return (
    <div className="table-wrap">
      <table className="data-table">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Reference</th>
            {show('client') && <th scope="col">Client</th>}
            {show('contact') && <th scope="col">Family contact</th>}
            <th scope="col">Service</th>
            <th scope="col">Schedule</th>
            <th scope="col">Status</th>
            {show('created') && (
              <th scope="col" className="data-table__optional">
                Requested
              </th>
            )}
            <th scope="col">
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.reference}>
              <td data-label="Reference">
                <span className="data-table__reference">{booking.reference}</span>
              </td>
              {show('client') && (
                <td data-label="Client" className="data-table__strong">
                  {booking.client_name}
                </td>
              )}
              {show('contact') && (
                <td data-label="Family contact">
                  <div>
                    {booking.contact_person_name}
                    <span className="data-table__sub">{booking.contact_number}</span>
                  </div>
                </td>
              )}
              <td data-label="Service">{serviceTitle(booking.service_type)}</td>
              <td data-label="Schedule">
                <div>
                  {formatShortDate(booking.booking_date)}
                  <span className="data-table__sub">
                    {formatTime(booking.start_time)} · {formatDuration(booking.duration_hours)}
                  </span>
                </div>
              </td>
              <td data-label="Status">
                <StatusBadge status={booking.status} />
              </td>
              {show('created') && (
                <td data-label="Requested" className="data-table__muted data-table__optional">
                  {formatDateTime(booking.created_at)}
                </td>
              )}
              <td className="data-table__actions">
                <Link to={`/admin/bookings/${booking.reference}`} className="button button--secondary button--sm">
                  View<span className="visually-hidden"> booking {booking.reference}</span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

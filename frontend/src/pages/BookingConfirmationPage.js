import { useLocation } from 'react-router-dom';
import Badge from '../components/Badge';
import BookingDetails from '../components/BookingDetails';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import { BOOKING_STATUSES, CONTACT } from '../content/siteContent';

/**
 * Shown right after a booking is sent. The booking comes from the booking
 * page through router state, so it is never put in the URL.
 */
export default function BookingConfirmationPage() {
  const booking = useLocation().state?.booking;

  if (!booking) {
    return (
      <div className="page">
        <section className="card">
          <EmptyState
            icon="calendar"
            title="No booking to show"
            titleAs="h1"
            action={
              <div className="cluster cluster--center">
                <Button to="/booking-status" icon="search">
                  Check My Booking
                </Button>
                <Button to="/book" variant="secondary">
                  Book a Companion
                </Button>
              </div>
            }
          >
            This page only shows a booking right after it is sent. To see an existing booking, use your reference number.
          </EmptyState>
        </section>
      </div>
    );
  }

  const status = BOOKING_STATUSES[booking.status] || BOOKING_STATUSES.pending;

  return (
    <div className="page">
      <section className="card confirmation">
        <div className="confirmation__header">
          <span className="confirmation__icon">
            <Icon name="check-circle" size={40} />
          </span>
          <p className="eyebrow">Booking request received</p>
          <h1>Salamat po! We have received your booking.</h1>
          <p className="text-muted">
            Your booking is <strong>awaiting administrator approval</strong>. Our team will review it, assign a companion
            and call the family contact person to confirm. This usually takes up to one working day.
          </p>
        </div>

        <div className="reference">
          <span className="reference__label">Your booking reference number</span>
          <span className="reference__value">{booking.reference}</span>
          <span className="reference__hint">
            Please write this down. You will need it, together with your contact number, to check your booking.
          </span>
        </div>

        <BookingDetails booking={booking} showClient status={<Badge tone={status.tone}>{status.label}</Badge>} />

        <div className="confirmation__next">
          <h2 className="confirmation__next-title">What happens next?</h2>
          <ol className="numbered-list">
            <li>An administrator reviews your request.</li>
            <li>We call you to confirm the booking and introduce your companion.</li>
            <li>The status changes to “Confirmed”. You can check it any time online.</li>
          </ol>
          <p className="text-muted">
            Need to change or cancel? Call us at <a href={CONTACT.phoneHref}>{CONTACT.phone}</a> at least 12 to 24 hours
            before the start time.
          </p>
        </div>

        <div className="actions actions--split">
          <Button to="/booking-status" icon="search" state={{ reference: booking.reference }}>
            Check booking status
          </Button>
          <Button to="/" variant="secondary" icon="home">
            Return to home
          </Button>
          <Button variant="ghost" icon="printer" onClick={() => window.print()} className="no-print">
            Print this page
          </Button>
        </div>
      </section>
    </div>
  );
}

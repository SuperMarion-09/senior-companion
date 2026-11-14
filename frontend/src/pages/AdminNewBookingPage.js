import { Link, useNavigate } from 'react-router-dom';
import BookingEditForm from '../components/BookingEditForm';
import Icon from '../components/Icon';
import PageHeader from '../components/PageHeader';

/**
 * Lets an admin book a companion for a family, e.g. after a phone call or
 * a visit to the office. Opens the new booking once it is saved.
 */
export default function AdminNewBookingPage() {
  const navigate = useNavigate();

  return (
    <>
      <p className="back-link">
        <Link to="/admin/bookings">
          <Icon name="arrow-left" size={20} />
          All bookings
        </Link>
      </p>

      <PageHeader
        eyebrow="Bookings"
        title="New booking"
        description="Book a companion on behalf of a family, for example when they call or visit."
      />

      <BookingEditForm
        onSaved={(booking) => navigate(`/admin/bookings/${encodeURIComponent(booking.reference)}`, { replace: true })}
        onCancel={() => navigate('/admin/bookings')}
      />
    </>
  );
}

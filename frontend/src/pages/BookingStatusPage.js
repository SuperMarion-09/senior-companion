import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import BookingDetails from '../components/BookingDetails';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import PhoneInput from '../components/PhoneInput';
import Icon from '../components/Icon';
import MockModeNotice from '../components/MockModeNotice';
import PageHeader from '../components/PageHeader';
import { BOOKING_STATUSES, CONTACT } from '../content/siteContent';
import { findBooking } from '../services/bookingService';
import { isValidPhone } from '../utils/booking';

function validate(form) {
  const errors = {};
  if (!form.reference.trim()) {
    errors.reference = 'Please enter your booking reference number.';
  } else if (form.reference.replace(/[^a-z0-9]/gi, '').length < 6) {
    errors.reference = 'This reference number looks too short. It looks like KGP-7H3K9Q.';
  }
  if (!form.contactNumber.trim()) {
    errors.contactNumber = 'Please enter the contact number you used when booking.';
  } else if (!isValidPhone(form.contactNumber)) {
    errors.contactNumber = 'Please enter a valid Philippine mobile number: 11 digits starting with 09, for example 09171234567.';
  }
  return errors;
}

/**
 * Lets a family look up one booking. A booking is only shown when BOTH the
 * reference number and the contact number match, so nobody can see another
 * client's booking by guessing a reference.
 */
export default function BookingStatusPage() {
  const location = useLocation();
  const resultRef = useRef(null);
  // The confirmation page passes the reference along so the family only types their number.
  const [form, setForm] = useState({ reference: location.state?.reference || '', contactNumber: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [booking, setBooking] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (booking) resultRef.current?.focus();
  }, [booking]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setBooking(null);

    const problems = validate(form);
    setErrors(problems);
    if (Object.keys(problems).length > 0) {
      document.getElementById(Object.keys(problems)[0])?.focus();
      return;
    }

    setIsSearching(true);
    try {
      setBooking(await findBooking(form.reference, form.contactNumber));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const status = booking && (BOOKING_STATUSES[booking.status] || BOOKING_STATUSES.pending);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Check my booking"
        title="Check your booking status"
        description="Enter the reference number you received after booking and the contact number you used on the form."
      />

      <MockModeNotice>
        Online booking is not connected yet. Only bookings made on this device in preview mode can be found.
      </MockModeNotice>

      <section className="card">
        <form onSubmit={handleSubmit} noValidate>
          {message && (
            <Alert type="error" title="Booking not found">
              {message}
            </Alert>
          )}
          <div className="form-row">
            <FormInput
              id="reference"
              label="Booking reference number"
              hint="For example KGP-7H3K9Q"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck="false"
              value={form.reference}
              onChange={handleChange}
              error={errors.reference}
            />
            <PhoneInput
              id="contactNumber"
              label="Contact number used for booking"
              hint="For example 09171234567"
              value={form.contactNumber}
              onChange={handleChange}
              error={errors.contactNumber}
            />
          </div>
          <Button type="submit" size="lg" icon="search" isLoading={isSearching} loadingText="Searching…">
            Check status
          </Button>
        </form>
        <p className="privacy-note">
          <Icon name="lock" size={20} />
          For your privacy, we only show a booking when both the reference number and the contact number match.
        </p>
      </section>

      {booking && (
        <section className="card status-result" aria-labelledby="status-result-title" ref={resultRef} tabIndex={-1}>
          <div className="status-result__header">
            <h2 id="status-result-title">Your booking</h2>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <Alert type={status.tone === 'success' ? 'success' : 'info'}>{status.description}</Alert>
          <BookingDetails booking={booking} showReference />
          <p className="text-muted status-result__help">
            Need to change or cancel this booking? Call us at <a href={CONTACT.phoneHref}>{CONTACT.phone}</a> at least 12
            to 24 hours before the start time.
          </p>
        </section>
      )}
    </div>
  );
}

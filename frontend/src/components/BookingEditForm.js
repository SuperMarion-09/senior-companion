import { useState } from 'react';
import { SERVICE_OPTIONS } from '../content/siteContent';
import { useToast } from '../hooks/useToast';
import { createBooking, updateBooking } from '../services/adminService';
import { DURATION_OPTIONS, START_TIME_OPTIONS } from '../utils/booking';
import Alert from './Alert';
import Button from './Button';
import DateInput from './DateInput';
import FormCheckbox from './FormCheckbox';
import FormInput from './FormInput';
import PhoneInput from './PhoneInput';
import FormSelect from './FormSelect';
import FormTextarea from './FormTextarea';

const FIELDS = [
  'client_name',
  'contact_person_name',
  'contact_number',
  'email',
  'emergency_contact_name',
  'emergency_contact_number',
  'service_type',
  'booking_date',
  'start_time',
  'duration_hours',
  'pickup_location',
  'destination',
  'planned_activity',
  'special_instructions',
];

function toForm(booking) {
  return Object.fromEntries(FIELDS.map((field) => [field, booking?.[field] == null ? '' : String(booking[field])]));
}

/**
 * Lets an admin correct a booking's details (e.g. after a call with the
 * family), or enter a new booking when no `booking` is given (e.g. one taken
 * over the phone). Laravel checks every rule again, including the 3-hour minimum.
 */
export default function BookingEditForm({ booking, onSaved, onCancel }) {
  const isNew = !booking;
  const toast = useToast();
  const [form, setForm] = useState(() => toForm(booking));
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [confirmNow, setConfirmNow] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const field = (name) => ({
    id: `edit-${name}`,
    name,
    value: form[name],
    error: errors[name],
    onChange: (event) => {
      setForm((current) => ({ ...current, [name]: event.target.value }));
      if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
    },
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setErrors({});
    setMessage('');

    try {
      const payload = {
        ...form,
        email: form.email.trim() || null,
        planned_activity: form.planned_activity.trim() || null,
        special_instructions: form.special_instructions.trim() || null,
        // Empty (a new booking with no duration chosen yet) stays empty, so Laravel says it is required.
        duration_hours: form.duration_hours ? Number(form.duration_hours) : null,
      };
      const result = isNew
        ? await createBooking({ ...payload, agreed_to_terms: agreedToTerms, confirm: confirmNow })
        : await updateBooking(booking.reference, { ...payload, updated_at: booking.updated_at });
      toast.success(result.message);
      onSaved(result.booking);
    } catch (error) {
      const fieldErrors = error.errors || {};
      setErrors(fieldErrors);
      const count = Object.keys(fieldErrors).length;
      setMessage(count > 0 ? `Please fix ${count === 1 ? '1 problem' : `${count} problems`} below.` : error.message);
      setIsSaving(false);
      window.requestAnimationFrame(() => {
        const first = Object.keys(fieldErrors)[0];
        (first ? document.getElementById(`edit-${first}`) : document.querySelector('.edit-form .alert'))?.focus?.();
      });
    }
  };

  return (
    <form className="card admin-section edit-form" onSubmit={handleSubmit} noValidate aria-labelledby="edit-title">
      <h2 id="edit-title">{isNew ? 'Booking details' : 'Edit booking details'}</h2>
      <p className="text-muted">
        {isNew
          ? 'Enter the booking as the family gave it. Every field is required unless marked optional.'
          : 'Changes are saved to the booking and noted on its activity timeline.'}
      </p>
      {message && <Alert type="error">{message}</Alert>}

      <fieldset className="form-section">
        <legend className="form-section__legend">Client and family</legend>
        <div className="form-row">
          <FormInput {...field('client_name')} label="Senior / client name" />
          <FormInput {...field('contact_person_name')} label="Family contact name" />
          <PhoneInput {...field('contact_number')} label="Contact number" />
          <FormInput {...field('email')} label="Email address" type="email" optional />
          <FormInput {...field('emergency_contact_name')} label="Emergency contact name" />
          <PhoneInput {...field('emergency_contact_number')} label="Emergency contact number" autoComplete="off" />
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend className="form-section__legend">Service</legend>
        <div className="form-row">
          <FormSelect {...field('service_type')} label="Service type" options={SERVICE_OPTIONS} placeholder="Choose…" />
          <DateInput {...field('booking_date')} label="Booking date" />
          <FormSelect {...field('start_time')} label="Start time" options={START_TIME_OPTIONS} placeholder="Choose…" />
          <FormSelect
            {...field('duration_hours')}
            label="Duration"
            options={DURATION_OPTIONS}
            placeholder="Choose…"
            hint="Minimum 3 hours. Only extend after the family has agreed."
          />
        </div>
        <FormInput {...field('pickup_location')} label="Pickup or meeting location" />
        <div className="form-row">
          <FormInput {...field('destination')} label="Destination" />
          <FormInput {...field('planned_activity')} label="Planned activity" optional />
        </div>
        <FormTextarea {...field('special_instructions')} label="Special instructions" optional rows={4} />
      </fieldset>

      {isNew && (
        <fieldset className="form-section">
          <legend className="form-section__legend">Agreement and status</legend>
          <FormCheckbox
            id="edit-agreed_to_terms"
            label="The family has agreed to the service guidelines and booking policies."
            checked={agreedToTerms}
            error={errors.agreed_to_terms}
            onChange={(event) => {
              setAgreedToTerms(event.target.checked);
              if (errors.agreed_to_terms) setErrors((current) => ({ ...current, agreed_to_terms: undefined }));
            }}
          />
          <FormCheckbox
            id="edit-confirm"
            label="Mark it as confirmed now (otherwise it is saved as pending). No email is sent."
            checked={confirmNow}
            onChange={(event) => setConfirmNow(event.target.checked)}
          />
        </fieldset>
      )}

      <div className="actions">
        <Button type="submit" icon="check" isLoading={isSaving} loadingText="Saving…">
          {isNew ? 'Create booking' : 'Save changes'}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

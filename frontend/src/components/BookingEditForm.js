import { useState } from 'react';
import { SERVICE_OPTIONS } from '../content/siteContent';
import { useToast } from '../hooks/useToast';
import { updateBooking } from '../services/adminService';
import { DURATION_OPTIONS, START_TIME_OPTIONS } from '../utils/booking';
import Alert from './Alert';
import Button from './Button';
import FormInput from './FormInput';
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
  return Object.fromEntries(FIELDS.map((field) => [field, booking[field] == null ? '' : String(booking[field])]));
}

/**
 * Lets an admin correct a booking's details (e.g. after a call with the
 * family). Laravel checks every rule again, including the 3-hour minimum.
 */
export default function BookingEditForm({ booking, onSaved, onCancel }) {
  const toast = useToast();
  const [form, setForm] = useState(() => toForm(booking));
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
        duration_hours: Number(form.duration_hours),
        updated_at: booking.updated_at,
      };
      const result = await updateBooking(booking.reference, payload);
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
      <h2 id="edit-title">Edit booking details</h2>
      <p className="text-muted">Changes are saved to the booking and noted on its activity timeline.</p>
      {message && <Alert type="error">{message}</Alert>}

      <fieldset className="form-section">
        <legend className="form-section__legend">Client and family</legend>
        <div className="form-row">
          <FormInput {...field('client_name')} label="Senior / client name" />
          <FormInput {...field('contact_person_name')} label="Family contact name" />
          <FormInput {...field('contact_number')} label="Contact number" type="tel" />
          <FormInput {...field('email')} label="Email address" type="email" optional />
          <FormInput {...field('emergency_contact_name')} label="Emergency contact name" />
          <FormInput {...field('emergency_contact_number')} label="Emergency contact number" type="tel" />
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend className="form-section__legend">Service</legend>
        <div className="form-row">
          <FormSelect {...field('service_type')} label="Service type" options={SERVICE_OPTIONS} />
          <FormInput {...field('booking_date')} label="Booking date" type="date" />
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

      <div className="actions">
        <Button type="submit" icon="check" isLoading={isSaving} loadingText="Saving…">
          Save changes
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

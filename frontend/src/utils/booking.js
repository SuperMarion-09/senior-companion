import { SERVICES } from '../content/siteContent';

/*
  Rules and helpers for the booking form, shared by the booking pages and the
  booking service. The backend must check the same rules again: anything in
  the browser can be bypassed.
*/

export const MIN_DURATION_HOURS = 3;
export const MAX_DURATION_HOURS = 10;
export const MAX_DAYS_AHEAD = 180;

// Earliest and latest start time a family can pick (24-hour clock).
const FIRST_START_HOUR = 7;
const LAST_START_HOUR = 17;

export const DURATION_OPTIONS = Array.from({ length: MAX_DURATION_HOURS - MIN_DURATION_HOURS + 1 }, (_, index) => {
  const hours = MIN_DURATION_HOURS + index;
  return { value: String(hours), label: `${hours} hours` };
});

export const START_TIME_OPTIONS = [];
for (let hour = FIRST_START_HOUR; hour <= LAST_START_HOUR; hour++) {
  for (const minutes of ['00', '30']) {
    if (hour === LAST_START_HOUR && minutes === '30') break;
    const value = `${String(hour).padStart(2, '0')}:${minutes}`;
    START_TIME_OPTIONS.push({ value, label: formatTime(value) });
  }
}

// The service agreement checkboxes on the last step. `guideline` points to
// GUIDELINES in siteContent (or 'booking-policies' for BOOKING_POLICIES).
export const AGREEMENTS = [
  {
    id: 'agreeNonMedical',
    guideline: 'non-medical',
    label: 'I understand that Kaagapay provides non-medical companionship and assistance only.',
  },
  {
    id: 'agreePolicies',
    guideline: 'booking-policies',
    label: 'I agree to the booking and cancellation policies.',
  },
  {
    id: 'agreeFinancial',
    guideline: 'financial',
    label: 'I agree to the financial guidelines, including separate billing for transportation.',
  },
  {
    id: 'agreePrivacy',
    guideline: 'privacy',
    label: 'I agree to the privacy policy and allow Kaagapay to use these details for this booking.',
  },
  {
    id: 'agreeEmergency',
    guideline: 'emergencies',
    label: 'I understand the emergency procedures and confirm the emergency contact is correct.',
  },
];

export const EMPTY_BOOKING = {
  clientName: '',
  contactPersonName: '',
  contactNumber: '',
  email: '',
  emergencyContactName: '',
  emergencyContactNumber: '',
  serviceType: '',
  bookingDate: '',
  startTime: '',
  durationHours: String(MIN_DURATION_HOURS),
  pickupLocation: '',
  destination: '',
  plannedActivity: '',
  specialInstructions: '',
  ...Object.fromEntries(AGREEMENTS.map((agreement) => [agreement.id, false])),
};

// The fields on each step of the booking form, in the order they appear.
export const BOOKING_STEPS = [
  {
    title: 'Client details',
    fields: ['clientName', 'contactPersonName', 'contactNumber', 'email', 'emergencyContactName', 'emergencyContactNumber'],
  },
  {
    title: 'Service details',
    fields: [
      'serviceType',
      'bookingDate',
      'startTime',
      'durationHours',
      'pickupLocation',
      'destination',
      'plannedActivity',
      'specialInstructions',
    ],
  },
  {
    title: 'Review and agree',
    fields: AGREEMENTS.map((agreement) => agreement.id),
  },
];

/* ----------------------------------------------------------------- Phones */

/**
 * Turns "+63 917-123 4567" or "(0917) 123 4567" into "09171234567",
 * so numbers typed in different ways can be compared.
 */
export function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.startsWith('63') ? `0${digits.slice(2)}` : digits;
}

/** Philippine mobile (09XX XXX XXXX) or landline with area code (e.g. 02 8123 4567). */
export function isValidPhone(value) {
  return /^(09\d{9}|0[2-8]\d{7,9})$/.test(normalizePhone(value));
}

/* ------------------------------------------------------------ Date & time */

/** "YYYY-MM-DD" for a Date, in the visitor's own time zone. */
export function toIsoDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function parseIsoDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** "2026-11-10" → "Tuesday, 10 November 2026" */
export function formatDate(value) {
  if (!value) return '';
  return parseIsoDate(value).toLocaleDateString('en-PH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** "14:30" → "2:30 PM" */
export function formatTime(value) {
  if (!value) return '';
  const [hours, minutes] = value.split(':').map(Number);
  const suffix = hours < 12 ? 'AM' : 'PM';
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

export function formatDuration(hours) {
  return `${hours} ${Number(hours) === 1 ? 'hour' : 'hours'}`;
}

/* ------------------------------------------------------------- Validation */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_ERROR = 'Please enter a valid Philippine phone number, for example 0917 123 4567.';

function requiredText(value, message, maxLength = 150) {
  const text = String(value || '').trim();
  if (!text) return message;
  if (text.length > maxLength) return `Please keep this under ${maxLength} characters.`;
  return null;
}

const RULES = {
  clientName: (form) => requiredText(form.clientName, 'Please enter the full name of the senior or client.', 100),
  contactPersonName: (form) => requiredText(form.contactPersonName, 'Please enter the name of the family contact person.', 100),
  contactNumber: (form) => {
    if (!form.contactNumber.trim()) return 'Please enter a contact number so we can confirm the booking.';
    return isValidPhone(form.contactNumber) ? null : PHONE_ERROR;
  },
  email: (form) => {
    const email = form.email.trim();
    if (!email) return null;
    return EMAIL_PATTERN.test(email) ? null : 'Please enter a valid email address, for example juan@example.com, or leave it empty.';
  },
  emergencyContactName: (form) => requiredText(form.emergencyContactName, 'Please enter the name of an emergency contact.', 100),
  emergencyContactNumber: (form) => {
    if (!form.emergencyContactNumber.trim()) return 'Please enter the emergency contact’s phone number.';
    return isValidPhone(form.emergencyContactNumber) ? null : PHONE_ERROR;
  },
  serviceType: (form) =>
    SERVICES.some((service) => service.value === form.serviceType) ? null : 'Please choose the type of service.',
  bookingDate: (form, now) => {
    if (!form.bookingDate) return 'Please choose the date of the service.';
    const today = toIsoDate(now);
    if (form.bookingDate < today) return 'This date has already passed. Please choose today or a later date.';
    const latest = new Date(now);
    latest.setDate(latest.getDate() + MAX_DAYS_AHEAD);
    if (form.bookingDate > toIsoDate(latest)) return 'Bookings can be made up to 6 months ahead. Please choose an earlier date.';
    return null;
  },
  startTime: (form, now) => {
    if (!START_TIME_OPTIONS.some((option) => option.value === form.startTime)) return 'Please choose a start time.';
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (form.bookingDate === toIsoDate(now) && form.startTime <= currentTime) {
      return 'This time has already passed today. Please choose a later time or another date.';
    }
    return null;
  },
  durationHours: (form) => {
    const hours = Number(form.durationHours);
    if (!Number.isInteger(hours) || hours < MIN_DURATION_HOURS) return `The minimum booking is ${MIN_DURATION_HOURS} hours.`;
    if (hours > MAX_DURATION_HOURS) return `For bookings longer than ${MAX_DURATION_HOURS} hours, please contact us.`;
    return null;
  },
  pickupLocation: (form) => requiredText(form.pickupLocation, 'Please enter where the companion should meet the client.', 255),
  destination: (form) => requiredText(form.destination, 'Please tell us where the companion and client will go.', 255),
  plannedActivity: (form) =>
    form.plannedActivity.trim().length > 255 ? 'Please keep the planned activity under 255 characters.' : null,
  specialInstructions: (form) =>
    form.specialInstructions.trim().length > 1000 ? 'Please keep special instructions under 1,000 characters.' : null,
  ...Object.fromEntries(
    AGREEMENTS.map((agreement) => [agreement.id, (form) => (form[agreement.id] ? null : 'Please tick this box to continue.')])
  ),
};

/**
 * Checks the fields of one step. Returns { fieldName: 'message' } for every
 * field with a problem, or {} when the step is fine.
 */
export function validateBookingStep(stepIndex, form, now = new Date()) {
  const errors = {};
  for (const field of BOOKING_STEPS[stepIndex].fields) {
    const message = RULES[field](form, now);
    if (message) errors[field] = message;
  }
  return errors;
}

export function validateBooking(form, now = new Date()) {
  return BOOKING_STEPS.reduce((errors, _, index) => ({ ...errors, ...validateBookingStep(index, form, now) }), {});
}

import { normalizePhone } from '../utils/booking';
import api, { ApiError, toFieldErrors } from './api';

/*
  ─── BACKEND INTEGRATION POINT ───────────────────────────────────────────

  The Laravel booking endpoints do not exist yet. Until they do, this file
  runs in MOCK MODE: bookings are saved in this browser's localStorage, so
  the public booking pages can be built and tried out end to end. Mock
  bookings are only visible in the browser that made them.

  When the API is ready, set REACT_APP_USE_MOCK_BOOKINGS=false in
  frontend/.env and restart `npm start`. The real calls below expect:

    POST /api/bookings
      body:  the booking form in snake_case (see toApiPayload)
      201 →  { success, message, data: { booking } }
      422 →  { success: false, message, errors: { field_name: ['…'] } }

    POST /api/bookings/lookup
      body:  { reference, contact_number }
      200 →  { success, message, data: { booking } }
      404 →  when no booking matches BOTH values

  `booking` in both responses contains only: reference, client_name,
  service_type, booking_date (YYYY-MM-DD), start_time (HH:MM),
  duration_hours, status. Never return phone numbers, addresses or other
  clients' data from these public endpoints.

  Privacy rules for the lookup endpoint:
  - It is a POST so the phone number never appears in a URL or server log.
  - Answer with the same 404 message whether the reference or the phone
    number is wrong, so nobody can find out which references exist.
  - Rate-limit it (like the admin login), so references cannot be guessed.
  ──────────────────────────────────────────────────────────────────────── */

export const USE_MOCK_BOOKINGS = process.env.REACT_APP_USE_MOCK_BOOKINGS !== 'false';

const NOT_FOUND_MESSAGE =
  'We could not find a booking with that reference number and contact number. Please check both and try again.';

/** Form fields (camelCase) → request body (snake_case, Laravel's style). */
function toApiPayload(form) {
  return {
    client_name: form.clientName.trim(),
    contact_person_name: form.contactPersonName.trim(),
    contact_number: form.contactNumber.trim(),
    email: form.email.trim() || null,
    emergency_contact_name: form.emergencyContactName.trim(),
    emergency_contact_number: form.emergencyContactNumber.trim(),
    service_type: form.serviceType,
    booking_date: form.bookingDate,
    start_time: form.startTime,
    duration_hours: Number(form.durationHours),
    pickup_location: form.pickupLocation.trim(),
    destination: form.destination.trim(),
    special_instructions: form.specialInstructions.trim() || null,
    agreed_to_terms: true,
  };
}

/** API booking (snake_case) → what the pages use (camelCase). */
function fromApiBooking(booking) {
  return {
    reference: booking.reference,
    clientName: booking.client_name,
    serviceType: booking.service_type,
    bookingDate: booking.booking_date,
    startTime: booking.start_time,
    durationHours: booking.duration_hours,
    status: booking.status,
  };
}

/** "kgp 7h3-k9q" → "KGP7H3K9Q", so references typed differently still match. */
function normalizeReference(value) {
  return String(value || '').replace(/[^a-z0-9]/gi, '').toUpperCase();
}

/**
 * Sends a new booking request. Resolves with the saved booking
 * (status 'pending'). Rejects with an ApiError; for invalid fields,
 * error.errors uses the form's field names.
 */
export async function createBooking(form) {
  if (USE_MOCK_BOOKINGS) {
    return mockCreateBooking(form);
  }

  try {
    const response = await api.post('/bookings', toApiPayload(form));
    return fromApiBooking(response.data.data.booking);
  } catch (error) {
    if (error instanceof ApiError) {
      error.errors = toFieldErrors(error.errors);
    }
    throw error;
  }
}

/**
 * Finds a booking by its reference number AND the contact number used when
 * booking. Rejects with an ApiError (status 404) when they do not match.
 */
export async function findBooking(reference, contactNumber) {
  if (USE_MOCK_BOOKINGS) {
    return mockFindBooking(reference, contactNumber);
  }

  try {
    const response = await api.post('/bookings/lookup', { reference: reference.trim(), contact_number: contactNumber.trim() });
    return fromApiBooking(response.data.data.booking);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new ApiError(NOT_FOUND_MESSAGE, 404);
    }
    throw error;
  }
}

/* ------------------------------------------------- Mock mode (temporary) */

const MOCK_STORAGE_KEY = 'kaagapay.mockBookings';
const MOCK_DELAY_MS = 900;
const REFERENCE_CHARACTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I/L, which are easy to mix up

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function readMockBookings() {
  try {
    return JSON.parse(window.localStorage.getItem(MOCK_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function writeMockBookings(bookings) {
  try {
    window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(bookings));
  } catch {
    // Storage is full or blocked (private window). The booking still shows on
    // the confirmation page; it just cannot be looked up later.
  }
}

function generateReference() {
  const values = new Uint32Array(6);
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(values);
  } else {
    values.forEach((_, index) => (values[index] = Math.floor(Math.random() * 2 ** 32)));
  }
  const code = Array.from(values, (value) => REFERENCE_CHARACTERS[value % REFERENCE_CHARACTERS.length]).join('');
  return `KGP-${code}`;
}

async function mockCreateBooking(form) {
  await wait(MOCK_DELAY_MS);
  const record = { ...toApiPayload(form), reference: generateReference(), status: 'pending', created_at: new Date().toISOString() };
  writeMockBookings([...readMockBookings(), record]);
  return fromApiBooking(record);
}

async function mockFindBooking(reference, contactNumber) {
  await wait(MOCK_DELAY_MS);
  const match = readMockBookings().find(
    (record) =>
      normalizeReference(record.reference) === normalizeReference(reference) &&
      normalizePhone(record.contact_number) === normalizePhone(contactNumber)
  );
  if (!match) {
    throw new ApiError(NOT_FOUND_MESSAGE, 404);
  }
  // Only the public fields leave this function, just like the real API.
  return fromApiBooking(match);
}

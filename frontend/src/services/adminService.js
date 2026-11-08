import api from './api';

/*
  Admin-only API calls. Every endpoint here needs a logged-in admin (Laravel
  answers 401 otherwise) and works with real database records. Data and
  form field errors stay in Laravel's snake_case; the admin pages use it as it comes.
*/

/** Drops empty filters so the request (and the page URL) stays tidy. */
function cleanParams(params) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value != null));
}

export async function getDashboard() {
  const response = await api.get('/admin/dashboard');
  return response.data.data;
}

/**
 * params: { search, status, date_from, date_to, sort, direction, page, per_page }
 * Resolves with { bookings, pagination }.
 */
export async function listBookings(params = {}) {
  const response = await api.get('/admin/bookings', { params: cleanParams(params) });
  return response.data.data;
}

export async function getBooking(reference) {
  const response = await api.get(`/admin/bookings/${encodeURIComponent(reference)}`);
  return response.data.data.booking;
}

/** Saves the edit form. `form` uses the API's snake_case field names. */
export async function updateBooking(reference, form) {
  const response = await api.put(`/admin/bookings/${encodeURIComponent(reference)}`, form);
  return { booking: response.data.data.booking, message: response.data.message };
}

/**
 * status: 'confirmed' | 'rejected' | 'cancelled' | 'completed'
 * Resolves with { booking, notification ('sent' | 'failed' | null), message }.
 */
export async function changeBookingStatus(reference, { status, reason, notifyClient }) {
  const response = await api.post(`/admin/bookings/${encodeURIComponent(reference)}/status`, {
    status,
    reason: reason?.trim() || null,
    notify_client: Boolean(notifyClient),
  });
  const { booking, notification } = response.data.data;
  return { booking, notification, message: response.data.message };
}

export async function addBookingNote(reference, body) {
  const response = await api.post(`/admin/bookings/${encodeURIComponent(reference)}/notes`, { body });
  return response.data.data.booking;
}

/** params: { search, page }. Resolves with { clients, pagination }. */
export async function listClients(params = {}) {
  const response = await api.get('/admin/clients', { params: cleanParams(params) });
  return response.data.data;
}

/** Resolves with { client, upcoming, previous }. */
export async function getClient(clientKey) {
  const response = await api.get(`/admin/clients/${encodeURIComponent(clientKey)}`);
  return response.data.data;
}

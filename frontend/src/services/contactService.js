import api, { ApiError, toFieldErrors } from './api';
import { USE_MOCK_BOOKINGS } from './bookingService';

/*
  BACKEND INTEGRATION POINT: there is no contact endpoint yet. In mock mode
  (the same switch as bookings, REACT_APP_USE_MOCK_BOOKINGS) the message is
  not sent anywhere; the form only shows that it would have been.

  Expected endpoint: POST /api/contact-messages
    body: { name, contact_number, email, message }
    201 → { success, message }   422 → { errors: { field: ['…'] } }
*/
export async function sendContactMessage(form) {
  if (USE_MOCK_BOOKINGS) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    return;
  }

  try {
    await api.post('/contact-messages', {
      name: form.name.trim(),
      contact_number: form.contactNumber.trim(),
      email: form.email.trim() || null,
      message: form.message.trim(),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      error.errors = toFieldErrors(error.errors);
    }
    throw error;
  }
}

import api, { ApiError, toFieldErrors } from './api';

/*
  BACKEND INTEGRATION POINT: there is no contact endpoint yet. Until
  REACT_APP_USE_MOCK_CONTACT=false, the message is not sent anywhere; the
  form only shows that it would have been.

  Expected endpoint: POST /api/contact-messages
    body: { name, contact_number, email, message }
    201 → { success, message }   422 → { errors: { field: ['…'] } }
*/
export const USE_MOCK_CONTACT = process.env.REACT_APP_USE_MOCK_CONTACT !== 'false';

export async function sendContactMessage(form) {
  if (USE_MOCK_CONTACT) {
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

import axios from 'axios';

// Comes from frontend/.env (restart `npm start` after changing it).
export const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

/**
 * Every error from the API is turned into an ApiError, so components can
 * always use error.message (text to show) and error.errors (form field errors).
 */
export class ApiError extends Error {
  constructor(message, status = 0, errors = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status; // HTTP status code, or 0 when the server could not be reached
    this.errors = errors; // e.g. { email: ['The email field is required.'] }
  }
}

export function toApiError(error) {
  if (error.response) {
    const { status, data } = error.response;
    return new ApiError(
      data?.message || 'Something went wrong. Please try again.',
      status,
      data?.errors || {}
    );
  }

  if (error.code === 'ECONNABORTED') {
    return new ApiError('The server took too long to respond. Please try again.');
  }

  return new ApiError('Cannot reach the server. Please check that the backend is running.');
}

// Shared Axios instance. Import this (not axios itself) in every service file.
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
  headers: { Accept: 'application/json' },
  // Send and receive Laravel's session cookie (needed for admin login).
  withCredentials: true,
  // Copy Laravel's XSRF-TOKEN cookie into the X-XSRF-TOKEN header (CSRF protection).
  withXSRFToken: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error))
);

/**
 * Asks Laravel to set the CSRF cookie. Must be called before logging in.
 * This route lives at /sanctum/csrf-cookie (not under /api).
 */
export function getCsrfCookie() {
  return api.get('/sanctum/csrf-cookie', { baseURL: API_BASE_URL });
}

export default api;

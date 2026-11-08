import api, { getCsrfCookie } from './api';

export async function login(email, password) {
  await getCsrfCookie();
  const response = await api.post('/admin/login', { email, password });
  return response.data.data.admin;
}

export async function logout() {
  await api.post('/admin/logout');
}

/**
 * Returns the logged-in admin, or null if nobody is logged in.
 */
export async function getCurrentAdmin() {
  try {
    const response = await api.get('/admin/me');
    return response.data.data.admin;
  } catch (error) {
    if (error.status === 401) {
      return null;
    }
    throw error;
  }
}

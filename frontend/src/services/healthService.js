import api from './api';

/**
 * Calls GET /api/health on the Laravel backend.
 * Resolves with { success, message, data: { status, app, database, timestamp } }.
 */
export async function checkHealth() {
  const response = await api.get('/health');
  return response.data;
}

import { ApiError, toApiError } from './api';

describe('toApiError', () => {
  it('uses the message and field errors from a Laravel error response', () => {
    const error = toApiError({
      response: {
        status: 422,
        data: {
          success: false,
          message: 'These credentials do not match our records.',
          errors: { email: ['These credentials do not match our records.'] },
        },
      },
    });

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(422);
    expect(error.message).toBe('These credentials do not match our records.');
    expect(error.errors.email).toHaveLength(1);
  });

  it('explains when the server cannot be reached', () => {
    const error = toApiError({ message: 'Network Error' });

    expect(error.status).toBe(0);
    expect(error.message).toMatch(/cannot reach the server/i);
  });
});

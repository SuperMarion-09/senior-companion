import {
  EMPTY_BOOKING,
  firstBookableDate,
  formatTime,
  startTimeOptionsFor,
  isValidPhone, normalizePhone, sanitizePhoneInput, validateBooking, validateBookingStep } from './booking';

// Saturday 7 November 2026, 10:15 AM
const NOW = new Date(2026, 10, 7, 10, 15);

const VALID_BOOKING = {
  ...EMPTY_BOOKING,
  clientName: 'Lourdes Santos',
  contactPersonName: 'Maria Santos',
  contactNumber: '0917 123 4567',
  emergencyContactName: 'Jose Santos',
  emergencyContactNumber: '0918 765 4321',
  serviceType: 'walking',
  bookingDate: '2026-11-10',
  startTime: '09:00',
  durationHours: '3',
  pickupLocation: '12 Mabini St., Pasig City',
  destination: 'Rizal Park',
  plannedActivity: 'Morning walk',
  agreeNonMedical: true,
  agreePolicies: true,
  agreeFinancial: true,
  agreePrivacy: true,
  agreeEmergency: true,
};

describe('phone numbers', () => {
  it('treats the same number typed in different ways as equal', () => {
    expect(normalizePhone('+63 917-123-4567')).toBe('09171234567');
    expect(normalizePhone('(0917) 123 4567')).toBe('09171234567');
  });

  it('accepts Philippine mobile numbers only (09 + 9 digits)', () => {
    expect(isValidPhone('09171234567')).toBe(true);
    expect(isValidPhone('0917 123 4567')).toBe(true);
    expect(isValidPhone('+639171234567')).toBe(true);
    expect(isValidPhone('02 8123 4567')).toBe(false);
    expect(isValidPhone('08171234567')).toBe(false);
    expect(isValidPhone('091712345678')).toBe(false);
    expect(isValidPhone('12345')).toBe(false);
    expect(isValidPhone('0917 123 456')).toBe(false);
  });

  it('keeps only digits in a phone field, at most 11', () => {
    expect(sanitizePhoneInput('0917-abc-123')).toBe('0917123');
    expect(sanitizePhoneInput('+63 917 123 4567')).toBe('09171234567');
    expect(sanitizePhoneInput('0917123456789')).toBe('09171234567');
    expect(sanitizePhoneInput('')).toBe('');
  });
});

test('formats times on the 12-hour clock', () => {
  expect(formatTime('07:00')).toBe('7:00 AM');
  expect(formatTime('12:30')).toBe('12:30 PM');
  expect(formatTime('17:00')).toBe('5:00 PM');
});

test('a complete booking has no errors', () => {
  expect(validateBooking(VALID_BOOKING, NOW)).toEqual({});
});

test('each step only reports its own missing fields', () => {
  expect(Object.keys(validateBookingStep(0, EMPTY_BOOKING, NOW))).toEqual([
    'clientName',
    'contactPersonName',
    'contactNumber',
    'emergencyContactName',
    'emergencyContactNumber',
  ]);
  expect(Object.keys(validateBookingStep(1, EMPTY_BOOKING, NOW))).toEqual([
    'serviceType',
    'bookingDate',
    'startTime',
    'pickupLocation',
    'destination',
  ]);
  expect(Object.keys(validateBookingStep(2, EMPTY_BOOKING, NOW))).toHaveLength(5);
});

test('email is optional but must look like an email when given', () => {
  expect(validateBookingStep(0, { ...VALID_BOOKING, email: '' }, NOW).email).toBeUndefined();
  expect(validateBookingStep(0, { ...VALID_BOOKING, email: 'maria@' }, NOW).email).toMatch(/valid email/);
});

test('rejects past dates, past times today and bookings shorter than 3 hours', () => {
  expect(validateBookingStep(1, { ...VALID_BOOKING, bookingDate: '2026-11-06' }, NOW).bookingDate).toMatch(/already passed/);
  expect(validateBookingStep(1, { ...VALID_BOOKING, bookingDate: '2026-11-07', startTime: '09:00' }, NOW).startTime).toMatch(
    /already passed/
  );
  expect(validateBookingStep(1, { ...VALID_BOOKING, bookingDate: '2026-11-07', startTime: '16:30' }, NOW)).toEqual({});
  expect(validateBookingStep(1, { ...VALID_BOOKING, durationHours: '2' }, NOW).durationHours).toMatch(/minimum booking is 3 hours/);
});

test('same-day bookings need at least 6 hours’ notice', () => {
  // NOW is 10:15 AM, so 4:15 PM is the earliest start.
  expect(validateBookingStep(1, { ...VALID_BOOKING, bookingDate: '2026-11-07', startTime: '13:00' }, NOW).startTime).toMatch(
    /6 hours’ notice/
  );
  expect(validateBookingStep(1, { ...VALID_BOOKING, bookingDate: '2026-11-07', startTime: '16:00' }, NOW).startTime).toMatch(
    /6 hours’ notice/
  );
  expect(startTimeOptionsFor('2026-11-07', NOW).map((option) => option.value)).toEqual(['16:30', '17:00']);
  expect(startTimeOptionsFor('2026-11-08', NOW)).toHaveLength(21);
});

test('the first bookable date moves to tomorrow once today is too late', () => {
  expect(firstBookableDate(NOW)).toBe('2026-11-07');
  expect(firstBookableDate(new Date(2026, 10, 7, 11, 1))).toBe('2026-11-08');
  expect(validateBookingStep(1, { ...VALID_BOOKING, bookingDate: '2026-11-07', startTime: '17:00' }, new Date(2026, 10, 7, 11, 1)).startTime).toMatch(
    /6 hours’ notice/
  );
});

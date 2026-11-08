import { EMPTY_BOOKING, formatTime, isValidPhone, normalizePhone, validateBooking, validateBookingStep } from './booking';

// Saturday 7 November 2026, 10:15 AM
const NOW = new Date(2026, 10, 7, 10, 15);

const VALID_BOOKING = {
  ...EMPTY_BOOKING,
  clientName: 'Lourdes Santos',
  contactPersonName: 'Maria Santos',
  contactNumber: '0917 123 4567',
  emergencyContactName: 'Jose Santos',
  emergencyContactNumber: '(02) 8123 4567',
  serviceType: 'walking',
  bookingDate: '2026-11-10',
  startTime: '09:00',
  durationHours: '3',
  pickupLocation: '12 Mabini St., Pasig City',
  destination: 'Morning walk at the park',
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

  it('accepts Philippine mobiles and landlines only', () => {
    expect(isValidPhone('0917 123 4567')).toBe(true);
    expect(isValidPhone('+639171234567')).toBe(true);
    expect(isValidPhone('02 8123 4567')).toBe(true);
    expect(isValidPhone('12345')).toBe(false);
    expect(isValidPhone('0917 123 456')).toBe(false);
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
  expect(validateBookingStep(1, { ...VALID_BOOKING, bookingDate: '2026-11-07', startTime: '13:00' }, NOW)).toEqual({});
  expect(validateBookingStep(1, { ...VALID_BOOKING, durationHours: '2' }, NOW).durationHours).toMatch(/minimum booking is 3 hours/);
});

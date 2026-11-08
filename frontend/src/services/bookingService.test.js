import { createBooking, findBooking } from './bookingService';

// These tests run in mock mode (REACT_APP_USE_MOCK_BOOKINGS is not set).
const FORM = {
  clientName: 'Lourdes Santos',
  contactPersonName: 'Maria Santos',
  contactNumber: '0917 123 4567',
  email: '',
  emergencyContactName: 'Jose Santos',
  emergencyContactNumber: '0918 765 4321',
  serviceType: 'walking',
  bookingDate: '2026-11-10',
  startTime: '09:00',
  durationHours: '4',
  pickupLocation: '12 Mabini St., Pasig City',
  destination: 'Morning walk',
  specialInstructions: '',
};

beforeEach(() => window.localStorage.clear());

test('a new booking gets a reference number and starts as pending', async () => {
  const booking = await createBooking(FORM);

  expect(booking.reference).toMatch(/^KGP-[A-Z2-9]{6}$/);
  expect(booking).toMatchObject({ clientName: 'Lourdes Santos', serviceType: 'walking', durationHours: 4, status: 'pending' });
});

test('a booking is found only with the matching contact number, and without private details', async () => {
  const { reference } = await createBooking(FORM);

  await expect(findBooking(reference, '0917 000 0000')).rejects.toMatchObject({ status: 404 });

  // Same reference and number, typed differently.
  const found = await findBooking(reference.toLowerCase().replace('-', ' '), '+63 917-123-4567');
  expect(found.reference).toBe(reference);
  expect(Object.keys(found).sort()).toEqual(
    ['bookingDate', 'clientName', 'durationHours', 'reference', 'serviceType', 'startTime', 'status'].sort()
  );
});

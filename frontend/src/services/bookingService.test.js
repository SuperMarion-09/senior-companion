// Most tests run in mock mode, whatever frontend/.env says.
process.env.REACT_APP_USE_MOCK_BOOKINGS = 'true';
const { createBooking, findBooking } = require('./bookingService');
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
  destination: 'Rizal Park',
  plannedActivity: 'Morning walk',
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

test('with the API connected, the form is sent in snake_case and only public fields come back', async () => {
  process.env.REACT_APP_USE_MOCK_BOOKINGS = 'false';
  let realService;
  let api;
  // A fresh copy of the module, so it reads the changed setting.
  jest.isolateModules(() => {
    api = require('./api').default;
    realService = require('./bookingService');
  });
  const post = jest.spyOn(api, 'post').mockResolvedValue({
    data: {
      data: {
        booking: {
          reference: 'KGP-7H3K9Q',
          client_name: 'Lourdes Santos',
          service_type: 'walking',
          booking_date: '2026-11-10',
          start_time: '09:00',
          duration_hours: 4,
          status: 'pending',
        },
      },
    },
  });

  const booking = await realService.createBooking(FORM);

  expect(post).toHaveBeenCalledWith(
    '/bookings',
    expect.objectContaining({ client_name: 'Lourdes Santos', destination: 'Rizal Park', planned_activity: 'Morning walk', duration_hours: 4 })
  );
  expect(booking).toMatchObject({ reference: 'KGP-7H3K9Q', status: 'pending', durationHours: 4 });

  post.mockRestore();
  process.env.REACT_APP_USE_MOCK_BOOKINGS = 'true';
});

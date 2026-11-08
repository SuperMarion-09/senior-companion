import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './hooks/useAuth';
import { ToastProvider } from './hooks/useToast';
import * as adminService from './services/adminService';
import * as authService from './services/authService';

jest.mock('./services/authService');
jest.mock('./services/adminService');

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
}

test('a logged-in admin sees the dashboard with counts from the API', async () => {
  authService.getCurrentAdmin.mockResolvedValue({ name: 'Ana Reyes', email: 'ana@example.com' });
  const trend = (count) => ({
    points: Array.from({ length: count }, (_, i) => ({ start: '2026-11-02', end: '2026-11-08', count: i, partial: i === count - 1 })),
    total: (count * (count - 1)) / 2,
    previous_total: 0,
  });
  adminService.getDashboard.mockResolvedValue({
    today: '2026-11-08',
    counts: {
      total: 7, pending: 2, confirmed: 3, completed: 1, cancelled: 1, rejected: 0, upcoming: 3,
      new_last_7_days: 4, new_previous_7_days: 1,
    },
    trends: { daily: trend(7), weekly: trend(8), monthly: trend(6) },
    services: [{ service_type: 'walking', count: 5 }, { service_type: 'errand', count: 2 }],
    weekdays: {
      since: '2025-11-08',
      requested: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => ({ day, count: 1 })),
      scheduled: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => ({ day, count: 0 })),
    },
    pending: [],
    upcoming: [],
    recent: [],
    activity: [],
  });
  renderAt('/admin');

  expect(await screen.findByRole('heading', { level: 1, name: /, Ana$/ })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveClass('active');
  expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  expect(await screen.findByRole('link', { name: /Total bookings\s*7/ })).toHaveAttribute('href', '/admin/bookings');
  expect(screen.getByRole('link', { name: /Pending requests\s*2/ })).toBeInTheDocument();
  expect(screen.getByText('All caught up')).toBeInTheDocument();
  expect(screen.getByText(/2 booking requests waiting for review/)).toBeInTheDocument();
  // Chart headlines come from the API data, and empty data gets a message instead of a chart.
  expect(screen.getByText('Walking Companion', { selector: 'strong' })).toBeInTheDocument();
  expect(screen.getByText('No admin activity yet')).toBeInTheDocument();
});

test('the admin bookings page shows a helpful message when there are no bookings', async () => {
  authService.getCurrentAdmin.mockResolvedValue({ name: 'Ana Reyes', email: 'ana@example.com' });
  adminService.listBookings.mockResolvedValue({ bookings: [], pagination: { total: 0 } });
  renderAt('/admin/bookings?status=pending');

  expect(await screen.findByText('No bookings match')).toBeInTheDocument();
  expect(screen.getByLabelText('Status')).toHaveValue('pending');
  expect(adminService.listBookings).toHaveBeenCalledWith({ status: 'pending' });
});

test('visitors who are not logged in are sent to the login page', async () => {
  authService.getCurrentAdmin.mockResolvedValue(null);
  renderAt('/admin');

  expect(await screen.findByRole('heading', { name: 'Administrator login' })).toBeInTheDocument();
});

test('the homepage shows the tagline and links to booking', async () => {
  authService.getCurrentAdmin.mockResolvedValue(null);
  renderAt('/');

  expect(screen.getByRole('heading', { level: 1, name: 'May kasama ka, may kaagapay ka.' })).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: 'Main' })).toHaveTextContent('Service Guidelines');
  expect(screen.getAllByRole('link', { name: /Book a Companion/ })[0]).toHaveAttribute('href', '/book');
  expect(await screen.findByRole('link', { name: /Book this service.*Walking Companion/ })).toHaveAttribute(
    'href',
    '/book?service=walking'
  );
});

test('the booking form starts with the service chosen on the homepage and checks required fields', async () => {
  authService.getCurrentAdmin.mockResolvedValue(null);
  renderAt('/book?service=walking');

  userEvent.click(screen.getByRole('button', { name: /Continue/ }));
  expect(await screen.findByText('Please fix 5 problems below.')).toBeInTheDocument();
  expect(screen.getByLabelText('Full name of the senior or client')).toHaveAttribute('aria-invalid', 'true');

  userEvent.type(screen.getByLabelText('Full name of the senior or client'), 'Lourdes Santos');
  userEvent.type(screen.getByLabelText('Contact person’s full name'), 'Maria Santos');
  userEvent.type(screen.getByLabelText('Contact number'), '0917 123 4567');
  userEvent.type(screen.getByLabelText('Emergency contact’s full name'), 'Jose Santos');
  userEvent.type(screen.getByLabelText('Emergency contact number'), '0918 765 4321');
  userEvent.click(screen.getByRole('button', { name: /Continue/ }));

  expect(await screen.findByText('Step 2 of 3')).toBeInTheDocument();
  expect(screen.getByLabelText('Type of service')).toHaveValue('walking');
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './hooks/useAuth';
import { ToastProvider } from './hooks/useToast';
import * as authService from './services/authService';

jest.mock('./services/authService');

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

test('a logged-in admin sees the dashboard inside the admin layout', async () => {
  authService.getCurrentAdmin.mockResolvedValue({ name: 'Ana Reyes', email: 'ana@example.com' });
  renderAt('/admin');

  expect(await screen.findByRole('heading', { level: 1, name: /, Ana$/ })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveClass('active');
  expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  expect(screen.getByText('No bookings yet')).toBeInTheDocument();
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

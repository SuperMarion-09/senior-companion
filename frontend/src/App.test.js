import { render, screen } from '@testing-library/react';
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

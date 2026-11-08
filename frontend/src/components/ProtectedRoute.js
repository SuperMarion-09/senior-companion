import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Spinner from './Spinner';

/**
 * Only shows its child routes to a logged-in admin.
 * Everyone else is sent to the admin login page.
 *
 * Note: this only hides pages in the browser. The real protection is the
 * `auth:sanctum` middleware on the Laravel routes.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isChecking } = useAuth();
  const location = useLocation();

  if (isChecking) {
    return <Spinner label="Checking your login…" center />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

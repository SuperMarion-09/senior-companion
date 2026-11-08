import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Brand from '../components/Brand';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

/**
 * The frame around every admin page: a sidebar with navigation and the
 * logged-in admin on large screens, a compact top bar on small screens.
 * Uses the same colours and components as the public site.
 */
export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout().catch(() => {});
    toast.success('You have been logged out.');
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="admin">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <aside className="admin__sidebar">
        <Brand to="/admin" subtitle="Administration" />

        <nav className="admin-nav" aria-label="Admin">
          <NavLink to="/admin" end className="admin-nav__link">
            <Icon name="home" />
            Dashboard
          </NavLink>
        </nav>

        <div className="admin__account">
          <div className="admin__account-info">
            <span className="admin__account-name">{admin.name}</span>
            <span className="admin__account-email">{admin.email}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon="log-out"
            onClick={handleLogout}
            isLoading={isLoggingOut}
            loadingText="Logging out…"
          >
            Log out
          </Button>
        </div>
      </aside>

      <main id="main-content" className="admin__main" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}

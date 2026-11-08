import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Brand from '../components/Brand';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: 'home', end: true },
  { to: '/admin/bookings', label: 'Bookings', icon: 'calendar' },
  { to: '/admin/clients', label: 'Clients', icon: 'users' },
];

/**
 * The frame around every admin page: a sidebar with navigation and the
 * logged-in admin on large screens, a top bar with a Menu button on small
 * screens. Uses the same colours and components as the public site.
 */
export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close the mobile menu after moving to another page.
  useEffect(() => setIsMenuOpen(false), [location.pathname]);

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

      <aside className={isMenuOpen ? 'admin__sidebar admin__sidebar--open' : 'admin__sidebar'}>
        <div className="admin__topbar">
          <Brand to="/admin" subtitle="Administration" />
          <button
            type="button"
            className="admin__menu-button"
            aria-expanded={isMenuOpen}
            aria-controls="admin-menu"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <Icon name={isMenuOpen ? 'close' : 'menu'} />
            {isMenuOpen ? 'Close' : 'Menu'}
          </button>
        </div>

        <div id="admin-menu" className="admin__menu">
          <nav className="admin-nav" aria-label="Admin">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className="admin-nav__link">
                <Icon name={item.icon} />
                {item.label}
              </NavLink>
            ))}
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
        </div>
      </aside>

      <main id="main-content" className="admin__main" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}

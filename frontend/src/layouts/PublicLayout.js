import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Brand from '../components/Brand';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { BRAND, CONTACT } from '../content/siteContent';

// Homepage sections, in page order. Links go to "/#id" so they work from any page.
const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Our Services', to: '/#services' },
  { label: 'How It Works', to: '/#how-it-works' },
  { label: 'About Us', to: '/#about' },
  { label: 'Service Guidelines', to: '/#guidelines' },
  { label: 'Contact Us', to: '/#contact' },
];

const POLICY_LINKS = [
  { label: 'Service guidelines', to: '/#guidelines' },
  { label: 'Booking policies', to: '/#booking-policies' },
  { label: 'Privacy policy', to: '/#privacy' },
  { label: 'Frequently asked questions', to: '/#faq' },
];

/**
 * React Router does not scroll on its own. Go to the top of each new page,
 * or to the section named in the link ("/#services"), and move keyboard
 * focus there so screen-reader users hear where they landed.
 */
function useScrollOnNavigate() {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (!target) return;
      target.scrollIntoView();
      target.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, hash, key]);
}

/**
 * The frame around every public page: header with navigation, main content
 * area, footer. <Outlet /> is where React Router renders the current page.
 */
export default function PublicLayout() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  useScrollOnNavigate();

  // Close the mobile menu after following a link.
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.key]);

  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const closeOnEscape = (event) => event.key === 'Escape' && setIsMenuOpen(false);
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isMenuOpen]);

  const isCurrent = (to) => (to === '/' ? location.pathname === '/' && !location.hash : `${location.pathname}${location.hash}` === to);

  return (
    <div className="site">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="site-header">
        <div className="container site-header__inner">
          <Brand />

          <div className="site-header__actions">
            <Button to="/booking-status" variant="secondary" icon="search">
              Check My Booking
            </Button>
            <Button to="/book" icon="calendar">
              Book a Companion
            </Button>
          </div>

          <button
            type="button"
            className="site-header__menu-button"
            aria-expanded={isMenuOpen}
            aria-controls="site-nav"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <Icon name={isMenuOpen ? 'close' : 'menu'} />
            {isMenuOpen ? 'Close' : 'Menu'}
          </button>
        </div>

        <div id="site-nav" className={isMenuOpen ? 'site-nav site-nav--open' : 'site-nav'}>
          <nav className="container" aria-label="Main">
            <ul className="site-nav__list">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="site-nav__link" aria-current={isCurrent(link.to) ? 'page' : undefined}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="site-nav__actions">
              <Button to="/book" icon="calendar" fullWidth>
                Book a Companion
              </Button>
              <Button to="/booking-status" variant="secondary" icon="search" fullWidth>
                Check My Booking
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <main id="main-content" className="site-main" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container site-footer__grid">
          <div className="site-footer__about">
            <Brand />
            <p className="site-footer__tagline">{BRAND.tagline}</p>
            <p>Compassionate, non-medical companionship and assistance for senior citizens and their families.</p>
          </div>

          <nav aria-label="Footer">
            <h2 className="site-footer__heading">Explore</h2>
            <ul className="site-footer__list">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
              <li>
                <Link to="/book">Book a Companion</Link>
              </li>
              <li>
                <Link to="/booking-status">Check My Booking</Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Policies">
            <h2 className="site-footer__heading">Service policies</h2>
            <ul className="site-footer__list">
              {POLICY_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="site-footer__heading">Contact us</h2>
            <ul className="site-footer__list site-footer__contact">
              <li>
                <Icon name="phone" size={20} />
                <a href={CONTACT.phoneHref}>{CONTACT.phone}</a>
              </li>
              <li>
                <Icon name="mail" size={20} />
                <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
              </li>
              <li>
                <Icon name="clock" size={20} />
                <span>{CONTACT.hours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="site-footer__bottom">
          <div className="container site-footer__bottom-inner">
            <p>
              © {new Date().getFullYear()} {BRAND.name}. Non-medical companionship services only. In an emergency, call 911.
            </p>
            <Link to="/admin/login">Staff login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Wraps ordinary public pages (booking form, login, …) in the centred
 * container with page spacing. The homepage uses full-width sections instead.
 */
export function PageContainer() {
  return (
    <div className="container page-container">
      <Outlet />
    </div>
  );
}

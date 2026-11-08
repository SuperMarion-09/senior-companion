import { Link, Outlet } from 'react-router-dom';
import Brand from '../components/Brand';

/**
 * The frame around every public page: header, main content area, footer.
 * <Outlet /> is where React Router renders the current page.
 */
export default function PublicLayout() {
  return (
    <div className="site">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="site-header">
        <div className="container site-header__inner">
          <Brand />
        </div>
      </header>

      <main id="main-content" className="site-main" tabIndex={-1}>
        <div className="container">
          <Outlet />
        </div>
      </main>

      <footer className="site-footer">
        <div className="container site-footer__inner">
          <p>
            Friendly, non-medical companionship and chaperone services for seniors.
            <br />© {new Date().getFullYear()} Senior Companion
          </p>
          <nav className="site-footer__links" aria-label="Footer">
            <Link to="/admin/login">Staff login</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

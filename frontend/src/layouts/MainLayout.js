import { Link, Outlet } from 'react-router-dom';

/**
 * The frame around every page: header, main content area, footer.
 * <Outlet /> is where React Router renders the current page.
 */
export default function MainLayout() {
  return (
    <div className="layout">
      <header className="layout__header">
        <Link to="/" className="layout__brand">
          Senior Companion
        </Link>
      </header>

      <main className="layout__main">
        <Outlet />
      </main>

      <footer className="layout__footer">
        Non-medical companionship and chaperone services for seniors.
      </footer>
    </div>
  );
}

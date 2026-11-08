import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="card">
      <h1>Page not found</h1>
      <p>Sorry, we couldn't find that page.</p>
      <Link to="/" className="link">
        Go back to the start
      </Link>
    </section>
  );
}

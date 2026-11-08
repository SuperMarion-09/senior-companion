import Button from '../components/Button';
import EmptyState from '../components/EmptyState';

export default function NotFoundPage() {
  return (
    <div className="page">
      <section className="card">
        <EmptyState
          icon="search"
          title="We couldn't find that page"
          titleAs="h1"
          action={
            <Button to="/" icon="arrow-left">
              Go to the homepage
            </Button>
          }
        >
          The link may be broken, or the page may have moved.
        </EmptyState>
      </section>
    </div>
  );
}

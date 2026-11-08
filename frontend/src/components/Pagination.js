import Button from './Button';

/**
 * "Showing 1–15 of 42" with Previous / Next buttons.
 * pagination: { current_page, last_page, total, from, to } from the API.
 */
export default function Pagination({ pagination, onPageChange, noun = 'bookings' }) {
  if (!pagination || pagination.total === 0) return null;

  const { current_page: page, last_page: lastPage, total, from, to } = pagination;

  return (
    <nav className="pagination" aria-label="Pages">
      <p className="pagination__summary" aria-live="polite">
        Showing <strong>{from}</strong>–<strong>{to}</strong> of <strong>{total}</strong> {noun}
      </p>
      {lastPage > 1 && (
        <div className="pagination__buttons">
          <Button variant="secondary" size="sm" icon="arrow-left" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
            Previous
          </Button>
          <span className="pagination__page">
            Page {page} of {lastPage}
          </span>
          <Button variant="secondary" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= lastPage}>
            Next
            <span className="visually-hidden"> page</span>
          </Button>
        </div>
      )}
    </nav>
  );
}

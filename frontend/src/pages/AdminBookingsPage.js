import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import BookingTable from '../components/BookingTable';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import DateInput from '../components/DateInput';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import LoadError from '../components/LoadError';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import Spinner from '../components/Spinner';
import { useApiData } from '../hooks/useApiData';
import { listBookings } from '../services/adminService';
import { STATUS_FILTER_OPTIONS } from '../utils/admin';

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Newest requests first' },
  { value: 'booking_date:asc', label: 'Booking date, soonest first' },
  { value: 'booking_date:desc', label: 'Booking date, latest first' },
];

const FILTER_KEYS = ['search', 'status', 'date_from', 'date_to'];

/**
 * All bookings with search, filters, sorting and pages. The filters live in
 * the page address (?status=pending&…), so Back and bookmarks keep them.
 */
export default function AdminBookingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = Object.fromEntries(searchParams);
  const sort = `${params.sort || 'created_at'}:${params.direction || 'desc'}`;
  const [searchText, setSearchText] = useState(params.search || '');

  // Keep the box in step when the address changes (Back button, dashboard links).
  useEffect(() => setSearchText(params.search || ''), [params.search]);

  const queryKey = searchParams.toString();
  const { data, error, isLoading, reload } = useApiData(() => listBookings(Object.fromEntries(new URLSearchParams(queryKey))), [queryKey]);

  // Changing any filter goes back to page 1.
  const update = (changes) => {
    const next = { ...params, ...changes };
    if (!('page' in changes)) delete next.page;
    setSearchParams(Object.fromEntries(Object.entries(next).filter(([, value]) => value)));
  };

  const handleSearch = (event) => {
    event.preventDefault();
    update({ search: searchText.trim() });
  };

  const handleSort = (event) => {
    const [column, direction] = event.target.value.split(':');
    update({ sort: column, direction });
  };

  const hasFilters = FILTER_KEYS.some((key) => params[key]);
  const clearFilters = () => {
    setSearchText('');
    setSearchParams({});
  };

  const changePage = (page) => {
    update({ page: String(page) });
    document.getElementById('main-content')?.focus();
    window.scrollTo({ top: 0 });
  };

  return (
    <>
      <PageHeader
        eyebrow="Bookings"
        title="Bookings"
        description="Every booking request, from the website or entered by staff. Open one to review, confirm or update it."
        actions={
          <Button to="/admin/bookings/new" icon="plus-circle">
            New booking
          </Button>
        }
      />

      <section className="card admin-section filters" aria-label="Search and filters">
        <form className="filters__search" onSubmit={handleSearch} role="search">
          <FormInput
            id="search"
            label="Search"
            hint="Booking reference, client or contact name, or phone number"
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
          <Button type="submit" icon="search">
            Search
          </Button>
        </form>

        <div className="filters__row">
          <FormSelect
            id="status"
            label="Status"
            options={STATUS_FILTER_OPTIONS}
            placeholder="All statuses"
            value={params.status || ''}
            onChange={(event) => update({ status: event.target.value })}
          />
          <DateInput
            id="date_from"
            label="Booking date from"
            clearable
            value={params.date_from || ''}
            onChange={(event) => update({ date_from: event.target.value })}
          />
          <DateInput
            id="date_to"
            label="Booking date to"
            clearable
            min={params.date_from || undefined}
            value={params.date_to || ''}
            onChange={(event) => update({ date_to: event.target.value })}
          />
          <FormSelect id="sort" label="Sort by" options={SORT_OPTIONS} placeholder="Sort by…" value={sort} onChange={handleSort} />
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" icon="close" onClick={clearFilters}>
            Clear search and filters
          </Button>
        )}
      </section>

      <section className="card admin-section" aria-labelledby="results-title" aria-busy={isLoading}>
        <h2 id="results-title" className="visually-hidden">
          Results
        </h2>

        {error ? (
          <LoadError error={error} onRetry={reload} title="Could not load bookings" />
        ) : !data ? (
          <Spinner label="Loading bookings…" center />
        ) : data.bookings.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon="search"
              title="No bookings match"
              titleAs="h3"
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  Clear search and filters
                </Button>
              }
            >
              Try a different search, or remove some filters.
            </EmptyState>
          ) : (
            <EmptyState icon="calendar" title="No bookings yet" titleAs="h3">
              When families request a companion through the website, their bookings will appear here.
            </EmptyState>
          )
        ) : (
          <div className={isLoading ? 'is-refreshing' : undefined}>
            <BookingTable bookings={data.bookings} caption="Bookings" />
            <Pagination pagination={data.pagination} onPageChange={changePage} />
          </div>
        )}
      </section>
    </>
  );
}

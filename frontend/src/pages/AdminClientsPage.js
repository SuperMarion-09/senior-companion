import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import FormInput from '../components/FormInput';
import LoadError from '../components/LoadError';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import Spinner from '../components/Spinner';
import { useApiData } from '../hooks/useApiData';
import { listClients } from '../services/adminService';
import { formatDateTime, phoneHref } from '../utils/admin';

/**
 * Everyone who has booked, worked out from the bookings themselves (one
 * client = the same senior's name and family contact number).
 */
export default function AdminClientsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const page = searchParams.get('page') || '';
  const [searchText, setSearchText] = useState(search);

  useEffect(() => setSearchText(search), [search]);

  const { data, error, isLoading, reload } = useApiData(() => listClients({ search, page }), [search, page]);

  const handleSearch = (event) => {
    event.preventDefault();
    setSearchParams(searchText.trim() ? { search: searchText.trim() } : {});
  };

  const changePage = (next) => {
    setSearchParams({ ...(search && { search }), page: String(next) });
    document.getElementById('main-content')?.focus();
    window.scrollTo({ top: 0 });
  };

  return (
    <>
      <PageHeader
        eyebrow="Clients"
        title="Clients"
        description="Seniors and families who have booked with Kaagapay, with their booking history."
      />

      <section className="card admin-section filters" aria-label="Search clients">
        <form className="filters__search" onSubmit={handleSearch} role="search">
          <FormInput
            id="client-search"
            label="Search"
            hint="Client or family contact name, or phone number"
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
          <Button type="submit" icon="search">
            Search
          </Button>
        </form>
        {search && (
          <Button variant="ghost" size="sm" icon="close" onClick={() => setSearchParams({})}>
            Clear search
          </Button>
        )}
      </section>

      <section className="card admin-section" aria-labelledby="clients-title" aria-busy={isLoading}>
        <h2 id="clients-title" className="visually-hidden">
          Clients
        </h2>
        {error ? (
          <LoadError error={error} onRetry={reload} title="Could not load clients" />
        ) : !data ? (
          <Spinner label="Loading clients…" center />
        ) : data.clients.length === 0 ? (
          <EmptyState icon="users" title={search ? 'No clients match' : 'No clients yet'} titleAs="h3">
            {search
              ? 'Try a different name or phone number.'
              : 'Clients appear here after their family sends a booking request.'}
          </EmptyState>
        ) : (
          <div className={isLoading ? 'is-refreshing' : undefined}>
            <div className="table-wrap">
              <table className="data-table">
                <caption className="visually-hidden">Clients</caption>
                <thead>
                  <tr>
                    <th scope="col">Client</th>
                    <th scope="col">Family contact</th>
                    <th scope="col">Bookings</th>
                    <th scope="col">Upcoming</th>
                    <th scope="col">Last request</th>
                    <th scope="col">
                      <span className="visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.clients.map((client) => (
                    <tr key={client.client_key}>
                      <td data-label="Client" className="data-table__strong">
                        {client.client_name}
                      </td>
                      <td data-label="Family contact">
                        <div>
                          {client.contact_person_name}
                          <a className="data-table__sub" href={phoneHref(client.contact_number)}>
                            {client.contact_number}
                          </a>
                        </div>
                      </td>
                      <td data-label="Bookings">{client.total_bookings}</td>
                      <td data-label="Upcoming">{client.upcoming_bookings}</td>
                      <td data-label="Last request" className="data-table__muted">
                        {formatDateTime(client.last_booked_at)}
                      </td>
                      <td className="data-table__actions">
                        <Link to={`/admin/clients/${client.client_key}`} className="button button--secondary button--sm">
                          View<span className="visually-hidden"> {client.client_name}</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagination={data.pagination} onPageChange={changePage} noun="clients" />
          </div>
        )}
      </section>
    </>
  );
}

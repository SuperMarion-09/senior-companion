import { Link, useParams } from 'react-router-dom';
import BookingTable from '../components/BookingTable';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import LoadError from '../components/LoadError';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import { useApiData } from '../hooks/useApiData';
import { getClient } from '../services/adminService';
import { formatDateTime, phoneHref } from '../utils/admin';

function BackLink() {
  return (
    <p className="back-link">
      <Link to="/admin/clients">
        <Icon name="arrow-left" size={20} />
        All clients
      </Link>
    </p>
  );
}

/**
 * One client: contact details from their latest booking, then upcoming
 * and previous bookings.
 */
export default function AdminClientDetailPage() {
  const { clientKey } = useParams();
  const { data, error, reload } = useApiData(() => getClient(clientKey), [clientKey]);

  if (!data) {
    return (
      <>
        <BackLink />
        {error ? <LoadError error={error} onRetry={reload} title="Could not load this client" /> : <Spinner label="Loading the client…" center />}
      </>
    );
  }

  const { client, upcoming, previous } = data;
  const contact = (number) => <a href={phoneHref(number)}>{number}</a>;

  return (
    <>
      <BackLink />
      <PageHeader
        eyebrow="Client"
        title={client.client_name}
        description={`${client.total_bookings} ${client.total_bookings === 1 ? 'booking' : 'bookings'}, ${client.completed_bookings} completed. First request ${formatDateTime(client.first_booked_at)}.`}
      />

      <section className="card admin-section" aria-labelledby="contact-title">
        <h2 id="contact-title">Contact information</h2>
        <p className="text-muted">From the most recent booking request.</p>
        <dl className="summary-list">
          {[
            ['Family contact', client.contact_person_name],
            ['Contact number', contact(client.contact_number)],
            ['Email address', client.email ? <a href={`mailto:${client.email}`}>{client.email}</a> : null],
            ['Emergency contact', <>{client.emergency_contact_name} · {contact(client.emergency_contact_number)}</>],
            ['Usual pickup place', client.pickup_location],
          ].map(([label, value]) => (
            <div key={label} className="summary-list__row">
              <dt>{label}</dt>
              <dd>{value || <span className="text-muted summary-list__empty">Not provided</span>}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card admin-section" aria-labelledby="client-upcoming-title">
        <h2 id="client-upcoming-title">Upcoming bookings</h2>
        {upcoming.length > 0 ? (
          <BookingTable bookings={upcoming} caption="Upcoming bookings" columns={['created']} />
        ) : (
          <EmptyState icon="calendar" title="No upcoming bookings" titleAs="h3" />
        )}
      </section>

      <section className="card admin-section" aria-labelledby="client-previous-title">
        <h2 id="client-previous-title">Previous bookings</h2>
        <p className="text-muted">Past dates, and bookings that were completed, cancelled or rejected.</p>
        {previous.length > 0 ? (
          <BookingTable bookings={previous} caption="Previous bookings" columns={['created']} />
        ) : (
          <EmptyState icon="clipboard" title="No previous bookings" titleAs="h3" />
        )}
      </section>
    </>
  );
}

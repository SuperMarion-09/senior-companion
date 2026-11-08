import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import BarList from '../components/charts/BarList';
import BookingTrendChart from '../components/charts/BookingTrendChart';
import ChartTable from '../components/charts/ChartTable';
import ColumnChart from '../components/charts/ColumnChart';
import DonutChart from '../components/charts/DonutChart';
import { STATUS_CHART_COLORS, plural } from '../components/charts/chartUtils';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import LoadError from '../components/LoadError';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import StatusChangeDialog from '../components/StatusChangeDialog';
import { serviceTitle } from '../content/siteContent';
import { useApiData } from '../hooks/useApiData';
import { useAuth } from '../hooks/useAuth';
import { getDashboard } from '../services/adminService';
import { ADMIN_STATUSES, addDays, formatLongDate, formatRelative, formatShortDate } from '../utils/admin';
import { formatDuration, formatTime } from '../utils/booking';

// The donut's order: open requests first, then how bookings ended.
const STATUS_ORDER = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Admin start page: what needs attention, how bookings are going and what
 * is coming up. Every number and chart comes from GET /api/admin/dashboard.
 */
export default function AdminHomePage() {
  const { admin } = useAuth();
  const firstName = admin.name.split(' ')[0];
  const { data, error, isLoading, reload } = useApiData(getDashboard, []);

  if (!data) {
    return error ? (
      <>
        <DashboardHeader firstName={firstName} />
        <LoadError error={error} onRetry={reload} title="Could not load the dashboard" />
      </>
    ) : (
      <DashboardSkeleton firstName={firstName} />
    );
  }

  const { counts } = data;
  const pendingLink = '/admin/bookings?status=pending&sort=booking_date&direction=asc';

  return (
    <div className={isLoading ? 'dashboard is-refreshing' : 'dashboard'}>
      <DashboardHeader firstName={firstName} data={data} onRefresh={reload} isRefreshing={isLoading} />
      {error && <LoadError error={error} onRetry={reload} title="Could not refresh the dashboard" />}

      {counts.pending > 0 && (
        <div className="attention" role="status">
          <span className="attention__icon">
            <Icon name="clock" />
          </span>
          <p className="attention__text">
            <strong>{plural(counts.pending, 'booking request')} waiting for review.</strong> Families are waiting for a call
            to confirm.
          </p>
          <a href="#pending-title" className="button button--secondary button--sm">
            Review now
          </a>
        </div>
      )}

      <section aria-labelledby="summary-title" className="dash-section">
        <h2 id="summary-title" className="visually-hidden">
          Booking summary
        </h2>
        <div className="stat-grid">
          <StatCard
            label="Total bookings"
            value={counts.total}
            icon="clipboard"
            to="/admin/bookings"
            hint={newThisWeek(counts.new_last_7_days, counts.new_previous_7_days)}
          />
          <StatCard
            label="Pending requests"
            value={counts.pending}
            icon="clock"
            tone="warning"
            hint="Waiting for review"
            to={pendingLink}
            highlight={counts.pending > 0}
          />
          <StatCard label="Confirmed" value={counts.confirmed} icon="check-circle" tone="success" hint="Any date" to="/admin/bookings?status=confirmed" />
          <StatCard
            label="Upcoming"
            value={counts.upcoming}
            icon="calendar"
            tone="neutral"
            hint="Confirmed, from today"
            to={`/admin/bookings?status=confirmed&date_from=${data.today}&sort=booking_date&direction=asc`}
          />
          <StatCard label="Completed" value={counts.completed} icon="calendar-check" tone="info" hint="Services done" to="/admin/bookings?status=completed" />
          <StatCard label="Cancelled" value={counts.cancelled} icon="close" tone="muted" hint="By family or admin" to="/admin/bookings?status=cancelled" />
        </div>
      </section>

      <div className="dash-grid dash-grid--wide-left">
        <section className="card chart-card" aria-labelledby="trend-title">
          <span id="trend-title" className="visually-hidden">
            Booking requests over time
          </span>
          <BookingTrendChart trends={data.trends} />
        </section>
        <StatusChart counts={counts} />
      </div>

      <div className="dash-grid">
        <ServicesChart services={data.services} total={counts.total} />
        <WeekdayChart weekdays={data.weekdays} />
      </div>

      <div className="dash-grid dash-grid--wide-left">
        <PendingRequests bookings={data.pending} total={counts.pending} link={pendingLink} onChanged={reload} />
        <UpcomingBookings bookings={data.upcoming} total={counts.upcoming} today={data.today} />
      </div>

      <div className="dash-grid">
        <section className="card dash-card" aria-labelledby="recent-title">
          <div className="section-heading">
            <div>
              <h2 id="recent-title">Recent booking requests</h2>
              <p className="text-muted">The newest requests from the website.</p>
            </div>
            <Button to="/admin/bookings" variant="ghost" size="sm" icon="arrow-right">
              All bookings
            </Button>
          </div>
          {data.recent.length > 0 ? (
            <ul className="recent-list">
              {data.recent.map((booking) => (
                <li key={booking.reference} className="recent-list__item">
                  <div className="recent-list__main">
                    <p className="request__title">
                      <Link to={`/admin/bookings/${booking.reference}`}>{booking.client_name}</Link>
                      <span className="request__reference">{booking.reference}</span>
                    </p>
                    <p className="request__meta request__meta--muted">
                      {serviceTitle(booking.service_type)} · {formatShortDate(booking.booking_date)}, {formatTime(booking.start_time)} ·
                      requested {formatRelative(booking.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                  <Button to={`/admin/bookings/${booking.reference}`} variant="secondary" size="sm">
                    View<span className="visually-hidden"> {booking.reference}</span>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon="calendar" title="No booking requests yet" titleAs="h3">
              Requests sent through the website will appear here.
            </EmptyState>
          )}
        </section>
        <RecentActivity activity={data.activity} />
      </div>
    </div>
  );
}

function newThisWeek(current, previous) {
  if (current === 0 && previous === 0) return 'None new in the last 7 days';
  const compare = previous === current ? 'same as the week before' : `${previous} the week before`;
  return `${current} new in the last 7 days · ${compare}`;
}

function DashboardHeader({ firstName, data, onRefresh, isRefreshing }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const pending = data?.counts.pending || 0;
  const upcoming = data?.counts.upcoming || 0;

  const handleSearch = (event) => {
    event.preventDefault();
    navigate(search.trim() ? `/admin/bookings?search=${encodeURIComponent(search.trim())}` : '/admin/bookings');
  };

  return (
    <header className="dash-header">
      <div className="dash-header__intro">
        <p className="eyebrow">{data ? formatLongDate(data.today) : 'Dashboard'}</p>
        <h1>
          {greeting()}, {firstName}
        </h1>
        <p className="dash-header__summary">
          {data
            ? `${pending === 0 ? 'No requests are waiting for review' : `${plural(pending, 'request')} ${pending === 1 ? 'is' : 'are'} waiting for review`}, and ${plural(upcoming, 'confirmed booking')} ${upcoming === 1 ? 'is' : 'are'} coming up.`
            : 'Loading today’s booking overview…'}
        </p>
      </div>
      <div className="dash-header__actions">
        <Button to="/admin/bookings" icon="calendar">
          Manage bookings
        </Button>
        {onRefresh && (
          <Button variant="secondary" icon="refresh" onClick={onRefresh} isLoading={isRefreshing} loadingText="Refreshing…">
            Refresh
          </Button>
        )}
      </div>

      {data && (
        <div className="dash-header__tools">
          <form className="quick-search" role="search" onSubmit={handleSearch}>
            <label htmlFor="dashboard-search" className="visually-hidden">
              Search bookings
            </label>
            <Icon name="search" className="quick-search__icon" />
            <input
              id="dashboard-search"
              type="search"
              className="input quick-search__input"
              placeholder="Reference, name or phone number"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Button type="submit" size="sm">
              Search
            </Button>
          </form>
          <nav className="shortcuts" aria-label="Booking shortcuts">
            <Link className="shortcut" to={`/admin/bookings?date_from=${data.today}&date_to=${data.today}&sort=booking_date&direction=asc`}>
              Today’s bookings
            </Link>
            <Link
              className="shortcut"
              to={`/admin/bookings?date_from=${data.today}&date_to=${addDays(data.today, 6)}&sort=booking_date&direction=asc`}
            >
              Next 7 days
            </Link>
            <Link className="shortcut" to="/admin/bookings?status=pending&sort=booking_date&direction=asc">
              Pending review
            </Link>
            <Link className="shortcut" to="/admin/clients">
              Clients
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

function StatusChart({ counts }) {
  const segments = STATUS_ORDER.map((status) => ({
    key: status,
    label: ADMIN_STATUSES[status].label,
    value: counts[status],
    color: STATUS_CHART_COLORS[status],
  }));

  return (
    <section className="card chart-card" aria-labelledby="status-chart-title">
      <div className="chart-card__header">
        <div>
          <h2 id="status-chart-title" className="chart-card__title">
            Bookings by status
          </h2>
          <p className="chart-card__subtitle">All {plural(counts.total, 'booking')}</p>
        </div>
      </div>
      {counts.total === 0 ? (
        <p className="chart-empty">No bookings yet. The status breakdown appears after the first request.</p>
      ) : (
        <DonutChart
          segments={segments}
          total={counts.total}
          centerLabel="bookings"
          ariaLabel={`Bookings by status: ${segments.map((segment) => `${segment.label} ${segment.value}`).join(', ')}.`}
        />
      )}
    </section>
  );
}

function ServicesChart({ services, total }) {
  const rows = services.map((service) => ({ key: service.service_type, label: serviceTitle(service.service_type), value: service.count }));
  const top = rows[0];
  const tied = rows.filter((row) => row.value === top.value).length;

  return (
    <section className="card chart-card" aria-labelledby="services-title">
      <div className="chart-card__header">
        <div>
          <h2 id="services-title" className="chart-card__title">
            Most requested services
          </h2>
          <p className="chart-card__subtitle">
            {total > 0 && tied > 1 ? (
              `${tied} services are tied for first place with ${plural(top.value, 'booking')} each`
            ) : total > 0 ? (
              <>
                <strong>{top.label}</strong> leads with {Math.round((top.value / total) * 100)}% of all bookings
              </>
            ) : (
              'All bookings, by service'
            )}
          </p>
        </div>
      </div>
      {total === 0 ? (
        <p className="chart-empty">No bookings yet, so there is nothing to compare.</p>
      ) : (
        <>
          <BarList rows={rows} />
          <ChartTable caption="Bookings by service" columns={['Service', 'Bookings']} rows={rows.map((row) => [row.label, row.value])} />
        </>
      )}
    </section>
  );
}

const WEEKDAY_VIEWS = {
  scheduled: { option: 'Service day', subtitle: 'Days the services take place', note: 'Rejected and cancelled bookings are left out.' },
  requested: { option: 'Request day', subtitle: 'Days families send their requests', note: 'Counted in Philippine time.' },
};

function WeekdayChart({ weekdays }) {
  const [view, setView] = useState('scheduled');
  const days = weekdays[view];
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const most = Math.max(...days.map((day) => day.count));
  const busiest = days.filter((day) => day.count === most).map((day) => day.day);

  return (
    <section className="card chart-card" aria-labelledby="weekday-title">
      <div className="chart-card__header">
        <div>
          <h2 id="weekday-title" className="chart-card__title">
            Busiest days
          </h2>
          <p className="chart-card__subtitle">
            {total > 0 ? (
              <>
                <strong>{busiest.join(' and ')}</strong> {busiest.length > 1 ? 'are' : 'is'} the busiest · last 12 months
              </>
            ) : (
              `${WEEKDAY_VIEWS[view].subtitle} · last 12 months`
            )}
          </p>
        </div>
        <div className="segmented" role="radiogroup" aria-label="Count bookings by">
          {Object.entries(WEEKDAY_VIEWS).map(([key, { option }]) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={view === key}
              className={view === key ? 'segmented__option segmented__option--active' : 'segmented__option'}
              onClick={() => setView(key)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      {total === 0 ? (
        <p className="chart-empty">No bookings in the last 12 months yet.</p>
      ) : (
        <>
          <ColumnChart
            columns={days.map((day) => ({ key: day.day, label: day.day, shortLabel: day.day.slice(0, 3), value: day.count }))}
            ariaLabel={`${WEEKDAY_VIEWS[view].subtitle}: ${days.map((day) => `${day.day} ${day.count}`).join(', ')}.`}
          />
          <p className="chart-note">
            {WEEKDAY_VIEWS[view].subtitle}. {WEEKDAY_VIEWS[view].note}
          </p>
          <ChartTable caption={WEEKDAY_VIEWS[view].subtitle} columns={['Day', 'Bookings']} rows={days.map((day) => [day.day, day.count])} />
        </>
      )}
    </section>
  );
}

function PendingRequests({ bookings, total, link, onChanged }) {
  const [dialog, setDialog] = useState(null); // { booking, status }

  return (
    <section className="card dash-card dash-card--attention" aria-labelledby="pending-title" id="pending-requests">
      <div className="section-heading">
        <div>
          <h2 id="pending-title" tabIndex={-1}>
            Needs your review
          </h2>
          <p className="text-muted">Pending requests, soonest booking date first.</p>
        </div>
        {total > bookings.length && (
          <Button to={link} variant="ghost" size="sm" icon="arrow-right">
            See all {total}
          </Button>
        )}
      </div>

      {bookings.length === 0 ? (
        <EmptyState icon="check-circle" title="All caught up" titleAs="h3">
          There are no booking requests waiting for review.
        </EmptyState>
      ) : (
        <ul className="request-list">
          {bookings.map((booking) => {
            const confirm = booking.actions.find((action) => action.status === 'confirmed');
            const reject = booking.actions.find((action) => action.status === 'rejected');
            return (
              <li key={booking.reference} className="request">
                <div className="request__main">
                  <p className="request__title">
                    <Link to={`/admin/bookings/${booking.reference}`}>{booking.client_name}</Link>
                    <span className="request__reference">{booking.reference}</span>
                  </p>
                  <p className="request__meta">
                    {serviceTitle(booking.service_type)} · {formatShortDate(booking.booking_date)}, {formatTime(booking.start_time)} ·{' '}
                    {formatDuration(booking.duration_hours)}
                  </p>
                  <p className="request__meta request__meta--muted">
                    {booking.contact_person_name} · {booking.contact_number} · requested {formatRelative(booking.created_at)}
                  </p>
                  {confirm && !confirm.allowed && <p className="request__warning">{confirm.reason}</p>}
                </div>
                <div className="request__actions">
                  {confirm?.allowed && (
                    <Button size="sm" icon="check" onClick={() => setDialog({ booking, status: 'confirmed' })}>
                      Confirm
                    </Button>
                  )}
                  {reject?.allowed && (
                    <Button size="sm" variant="secondary" onClick={() => setDialog({ booking, status: 'rejected' })}>
                      Reject
                      <span className="visually-hidden"> {booking.reference}</span>
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" to={`/admin/bookings/${booking.reference}`}>
                    Review<span className="visually-hidden"> {booking.reference}</span>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <StatusChangeDialog
        booking={dialog?.booking}
        status={dialog?.status || null}
        onClose={() => setDialog(null)}
        onChanged={onChanged}
        onFailed={onChanged}
      />
    </section>
  );
}

function UpcomingBookings({ bookings, total, today }) {
  return (
    <section className="card dash-card" aria-labelledby="upcoming-title">
      <div className="section-heading">
        <div>
          <h2 id="upcoming-title">Coming up</h2>
          <p className="text-muted">The next confirmed bookings.</p>
        </div>
        {total > bookings.length && (
          <Button to={`/admin/bookings?status=confirmed&date_from=${today}&sort=booking_date&direction=asc`} variant="ghost" size="sm" icon="arrow-right">
            See all {total}
          </Button>
        )}
      </div>
      {bookings.length === 0 ? (
        <EmptyState icon="calendar" title="Nothing scheduled yet" titleAs="h3">
          Confirmed bookings from today onward will appear here.
        </EmptyState>
      ) : (
        <ul className="agenda">
          {bookings.map((booking) => {
            const [year, month, day] = booking.booking_date.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            return (
              <li key={booking.reference}>
                <Link to={`/admin/bookings/${booking.reference}`} className="agenda__item">
                  <span className={booking.booking_date === today ? 'agenda__date agenda__date--today' : 'agenda__date'}>
                    <span className="agenda__month">{date.toLocaleDateString('en-PH', { month: 'short' })}</span>
                    <span className="agenda__day">{day}</span>
                  </span>
                  <span className="agenda__body">
                    <span className="agenda__title">
                      {booking.client_name} <StatusBadge status={booking.status} />
                    </span>
                    <span className="agenda__meta">
                      {booking.booking_date === today ? 'Today' : date.toLocaleDateString('en-PH', { weekday: 'long' })},{' '}
                      {formatTime(booking.start_time)} · {formatDuration(booking.duration_hours)}
                    </span>
                    <span className="agenda__meta">{serviceTitle(booking.service_type)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

const ACTIVITY_VERBS = {
  confirmed: 'confirmed',
  completed: 'marked as completed',
  cancelled: 'cancelled',
  rejected: 'rejected',
};

const ACTIVITY_ICONS = { status: 'refresh', note: 'file-text', update: 'clipboard' };

function activityText(item) {
  if (item.type === 'status') return `${ACTIVITY_VERBS[item.to_status] || `changed the status of`}`;
  if (item.type === 'note') return 'added a note to';
  return 'updated the details of';
}

function RecentActivity({ activity }) {
  return (
    <section className="card dash-card" aria-labelledby="activity-title">
      <div className="section-heading">
        <div>
          <h2 id="activity-title">Recent activity</h2>
          <p className="text-muted">What administrators did lately.</p>
        </div>
      </div>
      {activity.length === 0 ? (
        <EmptyState icon="users" title="No admin activity yet" titleAs="h3">
          Confirmations, cancellations, edits and notes will be listed here.
        </EmptyState>
      ) : (
        <ol className="activity-feed">
          {activity.map((item) => (
            <li key={item.id} className={`activity-feed__item activity-feed__item--${item.type}`}>
              <span className="activity-feed__icon">
                <Icon name={ACTIVITY_ICONS[item.type] || 'info'} size={16} />
              </span>
              <div className="activity-feed__body">
                <p className="activity-feed__text">
                  <strong>{item.admin_name || 'An administrator'}</strong> {activityText(item)}{' '}
                  <Link to={`/admin/bookings/${item.reference}`}>{item.client_name}</Link>
                  {item.type === 'status' && item.to_status && (
                    <>
                      {' '}
                      <StatusBadge status={item.to_status} />
                    </>
                  )}
                </p>
                <p className="activity-feed__time">
                  {formatRelative(item.created_at)} · {item.reference}
                  {item.notification === 'sent' && ' · family emailed'}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function DashboardSkeleton({ firstName }) {
  return (
    <div className="dashboard" aria-busy="true">
      <DashboardHeader firstName={firstName} />
      <p className="visually-hidden" role="status">
        Loading the dashboard…
      </p>
      <div className="stat-grid dash-section" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="stat-card skeleton-card">
            <span className="skeleton skeleton--text" />
            <span className="skeleton skeleton--number" />
            <span className="skeleton skeleton--text skeleton--short" />
          </div>
        ))}
      </div>
      <div className="dash-grid dash-grid--wide-left" aria-hidden="true">
        <div className="card chart-card">
          <span className="skeleton skeleton--text" />
          <span className="skeleton skeleton--chart" />
        </div>
        <div className="card chart-card">
          <span className="skeleton skeleton--text" />
          <span className="skeleton skeleton--chart" />
        </div>
      </div>
    </div>
  );
}

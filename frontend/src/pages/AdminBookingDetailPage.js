import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ActivityTimeline from '../components/ActivityTimeline';
import BookingEditForm from '../components/BookingEditForm';
import Button from '../components/Button';
import FormTextarea from '../components/FormTextarea';
import Icon from '../components/Icon';
import LoadError from '../components/LoadError';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import StatusChangeDialog from '../components/StatusChangeDialog';
import { serviceTitle } from '../content/siteContent';
import { useApiData } from '../hooks/useApiData';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { addBookingNote, getBooking } from '../services/adminService';
import { ADMIN_STATUSES, STATUS_ACTIONS, formatDateTime, phoneHref, sortActions } from '../utils/admin';
import { formatDate, formatDuration, formatTime } from '../utils/booking';

function DetailList({ rows }) {
  return (
    <dl className="summary-list">
      {rows.map(([label, value]) => (
        <div key={label} className="summary-list__row">
          <dt>{label}</dt>
          <dd>{value || <span className="text-muted summary-list__empty">Not provided</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

const Phone = ({ number }) => <a href={phoneHref(number)}>{number}</a>;

/**
 * One booking, for administrators: all details, the status buttons the
 * workflow allows right now, editing, internal notes and the history.
 */
export default function AdminBookingDetailPage() {
  const { reference } = useParams();
  const toast = useToast();
  const { sessionExpired } = useAuth();
  const { data: booking, error, isLoading, reload, setData: setBooking } = useApiData(() => getBooking(reference), [reference]);

  const [isEditing, setIsEditing] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // the status the admin clicked
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const handleActionError = (err) => {
    if (err.status === 401) sessionExpired();
    toast.error(err.errors?.status?.[0] || err.message);
  };

  if (!booking) {
    return (
      <>
        <BackLink />
        {error ? <LoadError error={error} onRetry={reload} title="Could not load this booking" /> : <Spinner label="Loading the booking…" center />}
      </>
    );
  }

  const saveNote = async (event) => {
    event.preventDefault();
    if (!note.trim()) {
      setNoteError('Please write a note before saving.');
      document.getElementById('note')?.focus();
      return;
    }
    setIsSavingNote(true);
    setNoteError('');
    try {
      setBooking(await addBookingNote(booking.reference, note.trim()));
      setNote('');
      toast.success('Note added.');
    } catch (err) {
      if (err.errors?.body) setNoteError(err.errors.body);
      else handleActionError(err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const actions = sortActions(booking.actions);
  const blocked = actions.filter((item) => !item.allowed);

  return (
    <>
      <BackLink />
      <PageHeader
        eyebrow={`Booking ${booking.reference}`}
        title={booking.client_name}
        description={`${serviceTitle(booking.service_type)} · ${formatDate(booking.booking_date)}, ${formatTime(booking.start_time)}`}
        actions={
          !booking.is_final &&
          !isEditing && (
            <Button variant="secondary" icon="clipboard" onClick={() => setIsEditing(true)}>
              Edit details
            </Button>
          )
        }
      />

      {error && <LoadError error={error} onRetry={reload} title="Could not refresh this booking" />}

      <section className="card admin-section status-panel" aria-labelledby="status-title">
        <div className="status-panel__current">
          <h2 id="status-title" className="status-panel__title">
            Status
          </h2>
          <StatusBadge status={booking.status} />
        </div>
        {booking.is_final ? (
          <p className="text-muted status-panel__text">
            This booking is {ADMIN_STATUSES[booking.status].label.toLowerCase()} and can no longer be changed. You can still add internal notes.
          </p>
        ) : (
          <>
            <div className="cluster">
              {actions.map((item) => {
                const config = STATUS_ACTIONS[item.status];
                return (
                  <Button
                    key={item.status}
                    variant={config.variant}
                    icon={config.icon}
                    disabled={!item.allowed || isLoading}
                    onClick={() => setPendingAction(item.status)}
                  >
                    {config.label}
                  </Button>
                );
              })}
            </div>
            {blocked.map((item) => (
              <p key={item.status} className="status-panel__note">
                <Icon name="info" size={18} />
                <span>
                  <strong>{STATUS_ACTIONS[item.status].label}:</strong> {item.reason}
                </span>
              </p>
            ))}
          </>
        )}
      </section>

      <div className="detail-layout">
        <div className="detail-layout__main">
          {isEditing ? (
            <BookingEditForm
              booking={booking}
              onCancel={() => setIsEditing(false)}
              onSaved={(saved) => {
                setBooking(saved);
                setIsEditing(false);
              }}
            />
          ) : (
            <>
              <section className="card admin-section" aria-labelledby="client-title">
                <div className="section-heading">
                  <h2 id="client-title">Client information</h2>
                  <Button to={`/admin/clients/${booking.client_key}`} variant="ghost" size="sm" icon="user">
                    Client history
                  </Button>
                </div>
                <DetailList
                  rows={[
                    ['Senior / client', booking.client_name],
                    ['Family contact', booking.contact_person_name],
                    ['Contact number', <Phone number={booking.contact_number} />],
                    ['Email address', booking.email && <a href={`mailto:${booking.email}`}>{booking.email}</a>],
                  ]}
                />
              </section>

              <section className="card admin-section" aria-labelledby="booking-title">
                <h2 id="booking-title">Booking information</h2>
                <DetailList
                  rows={[
                    ['Booking reference', booking.reference],
                    ['Service type', serviceTitle(booking.service_type)],
                    ['Booking date', formatDate(booking.booking_date)],
                    ['Start time', formatTime(booking.start_time)],
                    ['Requested duration', formatDuration(booking.duration_hours)],
                    ['Pickup / meeting place', booking.pickup_location],
                    ['Destination', booking.destination],
                    ['Planned activity', booking.planned_activity],
                    ['Special instructions', booking.special_instructions],
                  ]}
                />
              </section>

              <section className="card admin-section emergency" aria-labelledby="emergency-title">
                <h2 id="emergency-title">
                  <Icon name="phone" /> Emergency contact
                </h2>
                <DetailList
                  rows={[
                    ['Name', booking.emergency_contact_name],
                    ['Phone number', <Phone number={booking.emergency_contact_number} />],
                  ]}
                />
                <p className="text-muted emergency__note">
                  In a medical emergency, companions call 911 (or the local emergency number) first, then this contact.
                </p>
              </section>
            </>
          )}

          <section className="card admin-section" aria-labelledby="notes-title">
            <h2 id="notes-title">Notes and activity</h2>
            <p className="text-muted">Internal notes are only visible to administrators, never to the family.</p>
            <form onSubmit={saveNote} noValidate className="note-form">
              <FormTextarea
                id="note"
                label="Add an internal note"
                rows={3}
                value={note}
                error={noteError}
                maxLength={2000}
                onChange={(event) => {
                  setNote(event.target.value);
                  if (noteError) setNoteError('');
                }}
                hint="For example: called the family, companion assigned, extension approved."
              />
              <Button type="submit" variant="secondary" icon="plus-circle" isLoading={isSavingNote} loadingText="Saving…">
                Add note
              </Button>
            </form>
            <ActivityTimeline activities={booking.activities} />
          </section>
        </div>

        <aside className="detail-layout__aside">
          <section className="card admin-section" aria-labelledby="admin-info-title">
            <h2 id="admin-info-title">Administrative</h2>
            <DetailList
              rows={[
                ['Status', <StatusBadge status={booking.status} />],
                ['Requested', formatDateTime(booking.created_at)],
                ['Last updated', formatDateTime(booking.updated_at)],
                ['Terms accepted', formatDateTime(booking.terms_accepted_at)],
              ]}
            />
          </section>

          <section className="card admin-section rules-panel" aria-labelledby="rules-title">
            <h2 id="rules-title">Service rules</h2>
            <ul className="check-list">
              <li>Non-medical companionship only: no nursing, medical treatment or physical therapy.</li>
              <li>Minimum booking is 3 hours. Extensions need approval first.</li>
              <li>Transportation, parking and incidental expenses are billed separately.</li>
              <li>Client expenses follow the reimbursement policy (receipts required).</li>
              <li>Emergencies: call local emergency services first, then the family.</li>
            </ul>
          </section>
        </aside>
      </div>

      <StatusChangeDialog
        booking={booking}
        status={pendingAction}
        onClose={() => setPendingAction(null)}
        onChanged={(result) => setBooking(result.booking)}
        // The booking may have been changed by someone else: show its real state.
        onFailed={reload}
      />
    </>
  );
}

function BackLink() {
  return (
    <p className="back-link">
      <Link to="/admin/bookings">
        <Icon name="arrow-left" size={20} />
        All bookings
      </Link>
    </p>
  );
}

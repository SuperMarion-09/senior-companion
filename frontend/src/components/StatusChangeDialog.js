import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { changeBookingStatus } from '../services/adminService';
import { STATUS_ACTIONS } from '../utils/admin';
import { formatDate, formatTime } from '../utils/booking';
import Alert from './Alert';
import ConfirmDialog from './ConfirmDialog';
import FormCheckbox from './FormCheckbox';
import FormTextarea from './FormTextarea';

/**
 * "Are you sure?" before changing a booking's status, with an optional
 * reason and "Email the family" (only offered when the booking has an email
 * address). Used on the booking page and the dashboard.
 *
 * booking: needs reference, client_name, booking_date, start_time, email,
 *          contact_person_name, contact_number
 * status:  the status to change to, or null when closed
 * onChanged(result): called after Laravel saved the change
 * onFailed(): called after an error (e.g. to reload the booking)
 */
export default function StatusChangeDialog({ booking, status, onClose, onChanged, onFailed }) {
  const toast = useToast();
  const { sessionExpired } = useAuth();
  const [reason, setReason] = useState('');
  const [notifyClient, setNotifyClient] = useState(true);
  const [isChanging, setIsChanging] = useState(false);

  // Start fresh each time the dialog opens.
  useEffect(() => {
    if (status) {
      setReason('');
      setNotifyClient(true);
    }
  }, [status]);

  const action = status && STATUS_ACTIONS[status];
  const canEmail = Boolean(action?.notify && booking?.email);

  const confirm = async () => {
    setIsChanging(true);
    try {
      const result = await changeBookingStatus(booking.reference, {
        status,
        reason,
        notifyClient: canEmail && notifyClient,
      });
      (result.notification === 'failed' ? toast.warning : toast.success)(result.message);
      onChanged(result);
    } catch (error) {
      if (error.status === 401) sessionExpired();
      toast.error(error.errors?.status?.[0] || error.message);
      onFailed?.();
    } finally {
      setIsChanging(false);
      onClose();
    }
  };

  return (
    <ConfirmDialog
      open={Boolean(action)}
      title={action?.title || ''}
      tone={action?.tone}
      confirmLabel={action?.label}
      cancelLabel="Go back"
      isLoading={isChanging}
      onConfirm={confirm}
      onCancel={onClose}
    >
      {action && booking && (
        <>
          <p>
            <strong>
              {booking.reference} · {booking.client_name}
            </strong>
            <br />
            {formatDate(booking.booking_date)}, {formatTime(booking.start_time)}
          </p>
          <p>{action.text}</p>
          <div className="dialog__form">
            <FormTextarea
              id="status-reason"
              label={action.reasonLabel}
              optional
              rows={3}
              maxLength={1000}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              hint={canEmail && notifyClient ? 'Included in the email to the family.' : 'Saved on the booking timeline.'}
            />
            {canEmail ? (
              <FormCheckbox
                id="notify-client"
                label={`Email the family at ${booking.email}`}
                checked={notifyClient}
                onChange={(event) => setNotifyClient(event.target.checked)}
              />
            ) : (
              action.notify && (
                <Alert type="info">
                  No email address on file. Please call {booking.contact_person_name} at {booking.contact_number}.
                </Alert>
              )
            )}
          </div>
        </>
      )}
    </ConfirmDialog>
  );
}

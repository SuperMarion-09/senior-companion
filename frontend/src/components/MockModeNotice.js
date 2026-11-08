import { USE_MOCK_BOOKINGS } from '../services/bookingService';
import Alert from './Alert';

/**
 * Warns visitors while the booking API is not connected yet (mock mode, see
 * services/bookingService.js), so nobody thinks a real request was sent.
 * Disappears by itself once REACT_APP_USE_MOCK_BOOKINGS=false.
 */
export default function MockModeNotice({ children }) {
  if (!USE_MOCK_BOOKINGS) return null;

  return (
    <Alert type="info" title="Preview mode">
      {children || 'Online booking is not connected yet. Requests are saved on this device only and are not sent to Kaagapay.'}
    </Alert>
  );
}

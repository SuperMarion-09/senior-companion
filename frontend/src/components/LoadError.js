import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Alert from './Alert';
import Button from './Button';

/**
 * Shown when an admin page could not load its data. If the login session
 * has ended (401), sends the admin back to the login page instead.
 */
export default function LoadError({ error, onRetry, title = 'Could not load this page' }) {
  const { sessionExpired } = useAuth();
  const isLoggedOut = error?.status === 401;

  useEffect(() => {
    if (isLoggedOut) sessionExpired();
  }, [isLoggedOut, sessionExpired]);

  return (
    <Alert type="error" title={error?.status === 404 ? 'Not found' : title}>
      <p>{error?.message || 'Something went wrong. Please try again.'}</p>
      {onRetry && error?.status !== 404 && (
        <Button variant="secondary" size="sm" icon="refresh" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Alert>
  );
}

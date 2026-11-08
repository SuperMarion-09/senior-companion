import { Link } from 'react-router-dom';
import Alert from '../components/Alert';
import Button from '../components/Button';
import Spinner from '../components/Spinner';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { API_BASE_URL } from '../services/api';

/**
 * Phase 1 developer page: confirms React can talk to Laravel.
 * The real public homepage replaces this in a later phase.
 */
export default function SystemStatusPage() {
  const { status, result, error, refresh } = useHealthCheck();

  return (
    <section className="card">
      <h1>System status</h1>
      <p>
        This page checks that the React frontend can reach the Laravel API at <code>{API_BASE_URL}</code>.
      </p>

      {status === 'checking' && <Spinner label="Contacting the backend…" />}

      {status === 'online' && (
        <Alert type="success">
          <strong>Connected.</strong> {result.message}
          <dl className="details">
            <dt>Application</dt>
            <dd>{result.data.app}</dd>
            <dt>Database</dt>
            <dd>{result.data.database}</dd>
            <dt>Server time</dt>
            <dd>{new Date(result.data.timestamp).toLocaleString()}</dd>
          </dl>
        </Alert>
      )}

      {status === 'offline' && (
        <Alert type="error">
          <strong>Not connected.</strong> {error.message}
        </Alert>
      )}

      <div className="actions">
        <Button variant="secondary" onClick={refresh} isLoading={status === 'checking'} loadingText="Checking…">
          Check again
        </Button>
        <Link to="/admin/login" className="link">
          Administrator login
        </Link>
      </div>
    </section>
  );
}

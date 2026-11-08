import { Link } from 'react-router-dom';
import Alert from '../components/Alert';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { API_BASE_URL } from '../services/api';

/**
 * Developer page at /system-status: confirms React can talk to Laravel.
 */
export default function SystemStatusPage() {
  const { status, result, error, refresh } = useHealthCheck();

  return (
    <div className="page">
      <PageHeader
        eyebrow="For developers"
        title="System status"
        description={
          <>
            This page checks that the website can reach the Laravel API at <code>{API_BASE_URL}</code>.
          </>
        }
      />

      <section className="card">
        {status === 'checking' && <Spinner label="Contacting the backend…" />}

        {status === 'online' && (
          <Alert type="success" title="Connected">
            {result.message}
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
          <Alert type="error" title="Not connected">
            {error.message}
          </Alert>
        )}

        <div className="actions">
          <Button
            variant="secondary"
            icon="refresh"
            onClick={refresh}
            isLoading={status === 'checking'}
            loadingText="Checking…"
          >
            Check again
          </Button>
          <Link to="/admin/login">Administrator login</Link>
        </div>
      </section>
    </div>
  );
}

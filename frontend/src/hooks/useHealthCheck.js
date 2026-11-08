import { useCallback, useEffect, useState } from 'react';
import { checkHealth } from '../services/healthService';

/**
 * Checks whether the Laravel API is reachable.
 * status is one of: 'checking', 'online', 'offline'.
 */
export function useHealthCheck() {
  const [status, setStatus] = useState('checking');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setStatus('checking');
    setError(null);
    try {
      const body = await checkHealth();
      setResult(body);
      setStatus('online');
    } catch (err) {
      setResult(null);
      setError(err);
      setStatus('offline');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, result, error, refresh };
}

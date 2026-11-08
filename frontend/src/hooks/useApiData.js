import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Loads data from the API and tracks loading and error states:
 *
 *   const { data, error, isLoading, reload, setData } = useApiData(() => getBooking(ref), [ref]);
 *
 * Re-runs when `deps` change. A slow, older request never overwrites the
 * result of a newer one (e.g. when typing a search quickly).
 */
export function useApiData(load, deps) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const requestId = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(load, deps);

  const reload = useCallback(() => {
    const id = ++requestId.current;
    setIsLoading(true);
    setError(null);
    return run()
      .then((result) => {
        if (id === requestId.current) setData(result);
      })
      .catch((err) => {
        if (id === requestId.current) setError(err);
      })
      .finally(() => {
        if (id === requestId.current) setIsLoading(false);
      });
  }, [run]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, isLoading, reload, setData };
}

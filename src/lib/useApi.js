import { useCallback, useEffect, useState } from 'react';

/**
 * Minimal data-fetching hook: run an async function, expose {data, loading,
 * error, reload}. Guards against setting state after unmount.
 *
 * For a larger app, swap this for TanStack Query — it gives caching,
 * deduplication and background refetching that this deliberately does not.
 */
export function useApi(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.resolve(fn())
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { data, loading, error, reload, setData };
}

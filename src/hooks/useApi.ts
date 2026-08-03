import { useState, useEffect, useCallback, useRef } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiResult<T> extends UseApiState<T> {
  refetch: () => void;
}

/**
 * Generic data-fetching hook with loading, error, and refetch support.
 * Automatically cancels in-flight requests on unmount.
 *
 * @param fetcher  Async function that returns the data
 * @param deps     Dependencies that trigger a re-fetch (like useEffect)
 * @param skip     If true, the fetch is skipped (e.g. when userId is null)
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  skip = false
): UseApiResult<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: !skip,
    error: null,
  });

  const mountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const execute = useCallback(async () => {
    if (skip) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const result = await fetcherRef.current();
      if (mountedRef.current) {
        setState({ data: result, loading: false, error: null });
      }
    } catch (err: any) {
      if (mountedRef.current) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'An unexpected error occurred.';
        setState({ data: null, loading: false, error: msg });
      }
    }
  }, [skip, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mountedRef.current = true;
    execute();
    return () => {
      mountedRef.current = false;
    };
  }, [execute]);

  return { ...state, refetch: execute };
}

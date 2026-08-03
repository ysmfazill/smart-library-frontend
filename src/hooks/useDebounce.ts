import { useState, useEffect } from 'react';

/**
 * Delays updating a value until it stops changing for `delay` milliseconds.
 * Use for search inputs to avoid hammering the API on every keystroke.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

import { useCallback, useEffect, useState } from 'react';

// Remplace `nuqs` (adaptateur Next) : état synchronisé avec un paramètre de la query string, sans toucher au chemin.
interface Options {
  defaultValue?: any;
  parse?: (value: string) => any;
  serialize?: (value: any) => string;
  [key: string]: any;
}

const listeners = new Set<() => void>();
const read = (key: string) => new URLSearchParams(window.location.search).get(key);

export function useQueryState(key: string, options: Options = {}): [any, (next: any) => Promise<void>] {
  const [raw, setRaw] = useState<string | null>(() => read(key));

  useEffect(() => {
    const update = () => setRaw(read(key));
    listeners.add(update);
    window.addEventListener('popstate', update);
    return () => {
      listeners.delete(update);
      window.removeEventListener('popstate', update);
    };
  }, [key]);

  const parsed = raw === null ? null : options.parse ? options.parse(raw) : raw;
  const value = parsed ?? options.defaultValue ?? null;

  const setValue = useCallback(
    async (next: any) => {
      const resolved = typeof next === 'function' ? next(value) : next;
      const params = new URLSearchParams(window.location.search);
      if (resolved === null || resolved === undefined) params.delete(key);
      else params.set(key, options.serialize ? options.serialize(resolved) : String(resolved));
      const qs = params.toString();
      window.history.replaceState(
        window.history.state,
        '',
        `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`,
      );
      listeners.forEach((l) => l());
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, value],
  );

  return [value, setValue];
}

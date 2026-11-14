import { useEffect, useMemo, useState } from 'react';
import { navigate } from '@egen-civitas/esm-framework';

/** Remplace `next/navigation` : ne touche que l'URL (le routage reste celui du shell EGEN). */
export function useRouter() {
  return useMemo(
    () => ({
      push: (to: string) => navigate({ to }),
      replace: (to: string) => window.history.replaceState(window.history.state, '', to),
      back: () => window.history.back(),
      forward: () => window.history.forward(),
      refresh: () => undefined,
      prefetch: () => undefined,
    }),
    [],
  );
}

function useLocationValue<T>(read: () => T): T {
  const [value, setValue] = useState<T>(read);
  useEffect(() => {
    const update = () => setValue(read());
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}

export const usePathname = () => useLocationValue(() => window.location.pathname);
export const useSearchParams = () => new URLSearchParams(useLocationValue(() => window.location.search));
export const useParams = () => ({}) as Record<string, string | string[]>;
export const redirect = (to: string) => navigate({ to });
export const notFound = () => {
  throw new Error('NOT_FOUND');
};

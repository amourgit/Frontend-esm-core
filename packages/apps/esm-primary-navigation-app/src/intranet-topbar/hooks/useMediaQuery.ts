import { useEffect, useState } from 'react';

/** Suit une media query CSS (ex. `(min-width: 1024px)`). Renvoie `false` hors navigateur. */
export function useMediaQuery(query: string): boolean {
  const getMatch = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState<boolean>(getMatch);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener?.('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, [query]);

  return matches;
}

/** Points de rupture de la TopBar (identiques à Tailwind : sm = 640px, lg = 1024px). */
export const useIsMobile = () => !useMediaQuery('(min-width: 640px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');

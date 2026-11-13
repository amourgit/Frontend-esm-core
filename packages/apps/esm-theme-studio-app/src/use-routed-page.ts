import { useEffect, useState } from 'react';
import { pageFromPath, type StudioPage } from './pages';

/** Page d'édition courante, synchronisée avec l'URL du shell (single-spa) — navigation via rail, TopBar ou historique. */
export function useRoutedPage(): StudioPage {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    window.addEventListener('single-spa:routing-event', sync);
    window.addEventListener('popstate', sync);
    sync();
    return () => {
      window.removeEventListener('single-spa:routing-event', sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);
  return pageFromPath(path);
}

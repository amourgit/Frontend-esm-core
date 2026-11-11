import { useEffect } from 'react';
import { interpolateUrl, navigate } from '@egen-civitas/esm-framework';
import { setActiveSite } from '../store/spaces-sites.store';
import { findSiteInPathname, type SiteTree } from './site-tree';

const SITE_ID = '{siteId}';

/** Adresse d'un site d'après le modèle de route de la config (`{siteId}` remplacé) ; `null` si le modèle est vide. */
export function siteHref(template: string | undefined, siteId: string): string | null {
  return template ? interpolateUrl(template.replace(SITE_ID, encodeURIComponent(siteId))) : null;
}

/** Navigue vers l'adresse d'un site, si un modèle de route est configuré. */
export function goToSite(template: string | undefined, siteId: string): void {
  const href = siteHref(template, siteId);
  if (href) navigate({ to: href });
}

/** Navigue vers une adresse de la config (retour à « tous les sites »), si elle est renseignée. */
export function goTo(route: string | undefined): void {
  if (route) navigate({ to: interpolateUrl(route) });
}

/**
 * Garde le site actif en phase avec l'URL : sur `…/sites/<id>/…`, le site (de n'importe quel niveau) dont l'identifiant
 * figure dans le chemin devient actif. Un chemin sans site ne change rien (le choix fait dans la TopBar est conservé).
 * Reconnaît les changements de route de single-spa, sans dépendre du routeur d'aucune app.
 */
export function useSiteFromUrl(tree: SiteTree): void {
  useEffect(() => {
    const sync = () => {
      const site = findSiteInPathname(tree, window.location.pathname);
      if (site) setActiveSite(site.id);
    };
    sync();
    window.addEventListener('single-spa:routing-event', sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('single-spa:routing-event', sync);
      window.removeEventListener('popstate', sync);
    };
  }, [tree]);
}

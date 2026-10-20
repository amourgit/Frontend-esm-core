import { useOutletContext } from 'react-router-dom';
import type { SiteSummary } from '@egen-civitas/esm-framework';

/** Contexte fourni par `SiteLayoutPage` à ses pages enfants (onglets). */
export interface SiteOutletContext {
  site: SiteSummary;
}

export const useSiteOutlet = () => useOutletContext<SiteOutletContext>();

import React from 'react';
import { useConfig } from '@egen-civitas/esm-framework';
import { type ConfigSchema } from '../config-schema';
import { SpaceSelector } from '../spaces/space-selector.component';
import { useSpacesFromConfig } from '../spaces/use-spaces-config';
import { SiteCascade } from '../sites/site-cascade.component';
import { useSiteRegistry } from '../sites/site-registry';
import { useSiteFromUrl } from '../sites/site-route';
import styles from './context-selectors.scss';

/**
 * Sélecteurs d'Espace et de Site, injectés dans la TopBar comme UNE extension (voir routes.json) : la mise en page
 * (rangée sur grand écran, pile sur petit écran) est celle des deux champs ensemble. Chaque sélecteur peut être masqué
 * par la configuration (`selectors.showSpaces` / `selectors.showSites`).
 */
const ContextSelectors: React.FC = () => {
  const { selectors } = useConfig<ConfigSchema>();
  useSpacesFromConfig();
  // Le registre est publié (et l'URL suivie) même si la cascade est masquée : d'autres apps lisent les sites dans le store.
  const { tree } = useSiteRegistry();
  useSiteFromUrl(tree);

  return (
    <div className={styles.selectors}>
      {selectors?.showSpaces !== false && <SpaceSelector />}
      {selectors?.showSites !== false && <SiteCascade tree={tree} />}
    </div>
  );
};

export default ContextSelectors;

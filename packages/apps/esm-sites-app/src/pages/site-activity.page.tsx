import React from 'react';
import { playXboxSound, SiteActivityPanel } from '@egen-civitas/esm-framework';
import { SITE_ACTIVITIES } from '../data/sites-data';
import { useSiteOutlet } from './site-context';

/** `/sites/:siteId/activite` */
const SiteActivityPage: React.FC = () => {
  const { site } = useSiteOutlet();
  return (
    <SiteActivityPanel
      siteName={site.name}
      activities={SITE_ACTIVITIES}
      onRefresh={() => {
        playXboxSound('select');
        return new Promise<void>((resolve) => setTimeout(resolve, 600));
      }}
    />
  );
};

export default SiteActivityPage;

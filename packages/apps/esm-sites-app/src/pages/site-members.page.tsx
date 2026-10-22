import React from 'react';
import { SiteMembersPanel } from '@egen-civitas/esm-framework';
import { SITE_MEMBERS, SITE_TEAMS } from '../data/sites-data';
import { useSiteOutlet } from './site-context';

/** `/sites/:siteId/membres` */
const SiteMembersPage: React.FC = () => {
  const { site } = useSiteOutlet();
  return <SiteMembersPanel siteName={site.name} members={SITE_MEMBERS} teams={SITE_TEAMS} />;
};

export default SiteMembersPage;

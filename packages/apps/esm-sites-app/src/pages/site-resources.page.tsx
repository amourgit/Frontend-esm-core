import React from 'react';
import { SiteResourcesPanel } from '@egen-civitas/esm-framework';
import { SITE_RESOURCES } from '../data/sites-data';

/** `/sites/:siteId/ressources` */
const SiteResourcesPage: React.FC = () => <SiteResourcesPanel resources={SITE_RESOURCES} />;

export default SiteResourcesPage;

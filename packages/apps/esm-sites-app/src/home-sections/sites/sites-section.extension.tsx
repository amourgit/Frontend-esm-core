import React from 'react';
import { go } from '../shared/go';
import { SitesSection } from './sites-section.component';
import { directorySites } from './sites.data';

// Extension du slot `home-sections` : Nos sites.
export default function SitesSectionExtension() {
  return <SitesSection sites={directorySites} onSelectSite={() => go('/sites')} onSeeAll={() => go('/sites')} />;
}

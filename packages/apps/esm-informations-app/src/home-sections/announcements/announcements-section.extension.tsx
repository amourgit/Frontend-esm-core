import React from 'react';
import { go } from '../shared/go';
import { AnnouncementsSection } from './announcements-section.component';
import { announcements } from './announcements.data';

// Extension du slot `home-sections` : Annonces.
export default function AnnouncementsSectionExtension() {
  return (
    <AnnouncementsSection
      items={announcements}
      onSelect={(item) => go(`/informations/annonces?announcement=${item.id}`)}
      onSeeAll={() => go('/informations/annonces')}
    />
  );
}

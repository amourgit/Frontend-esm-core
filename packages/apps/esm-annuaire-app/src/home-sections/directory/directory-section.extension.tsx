import React from 'react';
import { go } from '../shared/go';
import { DirectorySection } from './directory-section.component';
import { directoryFilters, directoryMembers, directoryTotalCount } from './directory.data';

// Extension du slot `home-sections` : Annuaire.
export default function DirectorySectionExtension() {
  return (
    <DirectorySection
      members={directoryMembers}
      filters={directoryFilters}
      totalCount={directoryTotalCount}
      onSelectMember={() => go('/annuaire')}
      onOpenProfile={() => go('/annuaire')}
      onSeeAll={() => go('/annuaire')}
    />
  );
}

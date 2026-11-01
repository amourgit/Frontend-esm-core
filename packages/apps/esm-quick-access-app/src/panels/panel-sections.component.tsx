import React from 'react';
import { interpolateUrl, navigate, showToast } from '@egen-civitas/esm-framework';
import { ProfileCard } from './profile-card/profile-card.component';
import { TeamCalendar } from './team-calendar/team-calendar.component';
import { Documents } from './documents/documents.component';
import { defaultProfile, recentDocuments, upcomingCalendarEvents } from './sample-data';

// Sections portées depuis la colonne latérale de l'accueil : mêmes composants, désormais dans le rail droit.
// Les données viennent de `sample-data.ts` — seul fichier à modifier pour brancher une vraie source.

const go = (path: string) => navigate({ to: interpolateUrl(`\${egenSpaBase}${path}`) });
const toast = (description: string, kind: 'info' | 'success' | 'warning') => showToast({ kind, description });

export const ProfileSection: React.FC = () => <ProfileCard profile={defaultProfile} onShowToast={toast} />;

export const CalendarSection: React.FC = () => (
  <TeamCalendar
    upcomingEvents={upcomingCalendarEvents}
    onSelectEvent={(ev) => go(`/informations/agenda?event=${ev.id}`)}
    onRefresh={() => toast('Calendrier synchronisé.', 'info')}
  />
);

export const DocumentsSection: React.FC = () => (
  <Documents
    items={recentDocuments}
    onOpenDocument={(doc) => (doc.type === 'folder' ? go('/ged') : toast(`Ouverture de ${doc.name}`, 'info'))}
    onSeeAll={() => go('/ged')}
    onCreateFolder={() => go('/ged/ingestion')}
    onUploadFile={() => go('/ged/ingestion')}
  />
);

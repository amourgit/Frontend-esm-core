import type { CalendarEventItem } from './team-calendar/team-calendar.component';
import type { DocumentItem } from './documents/documents.component';
import type { UserProfile } from './profile-card/profile-card.component';

// Données d'exemple du panneau Accès rapide (à remplacer par de vraies sources : agenda, GED, profil).
export const upcomingCalendarEvents: CalendarEventItem[] = [
  {
    id: 'ev-1',
    month: 'Sep',
    day: '22',
    weekday: 'Lun',
    title: 'Comité de pilotage DSI & Archivage',
    time: '09:30 - 11:00',
    location: 'Salle polyvalente & visioconférence',
  },
  {
    id: 'ev-2',
    month: 'Sep',
    day: '24',
    weekday: 'Mer',
    title: 'Atelier de prise en main : droits IAM',
    time: '14:00 - 16:30',
    location: 'Centre de formation numérique',
  },
  {
    id: 'ev-3',
    month: 'Sep',
    day: '28',
    weekday: 'Dim',
    title: 'Revue trimestrielle des publications',
    time: '10:00 - 12:30',
    location: 'Grand auditorium',
  },
];

export const recentDocuments: DocumentItem[] = [
  { id: 'doc-1', name: 'Charte_Gouvernance_2026.pdf', type: 'other', modifiedDate: "Aujourd'hui à 11:20" },
  { id: 'doc-2', name: 'Guide_Sites_Membres_Applications.docx', type: 'docx', modifiedDate: 'Hier à 16:45' },
  { id: 'doc-3', name: 'Matrice_Droits_Permissions_IAM.xlsx', type: 'xlsx', modifiedDate: '19 sept. 2026' },
  { id: 'doc-4', name: 'Rapport_Administration_Systeme.docx', type: 'docx', modifiedDate: '15 sept. 2026' },
];

// Profil par défaut — informations réelles du fondateur de CIVITAS, déjà
// présentes telles quelles dans Civitas-GED. À remplacer par le profil de
// l'utilisateur connecté une fois la session/API de profil branchée.
export const defaultProfile: UserProfile = {
  name: 'Amour Samuel NZILA NGALA',
  title: 'Directeur Général de CIVITAS Gabon',
  department: 'Direction Générale • CIVITAS Gabon',
  followers: 312,
  following: 48,
  verified: true,
  avatarUrl: '/assets/moi-assis.jpg',
  coverUrl: '/assets/moi-reunion.png',
};

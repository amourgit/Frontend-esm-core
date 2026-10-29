import type { AnnouncementItem } from './announcements-section.component';

// Source : esm-informations-app (announcements-data.ts).
export const announcements: AnnouncementItem[] = [
  {
    id: 'ann-1',
    title: 'Maintenance préventive des serveurs centraux GED ce samedi',
    category: 'Flash Info Entreprise',
    level: 'Alerte',
    date: 'Samedi 26 Septembre • 22h00 - 02h00',
    author: 'Direction des Systèmes d’Information',
    body: 'Les services GED, recherche et archivage seront indisponibles pendant la fenêtre de maintenance. Enregistrez vos travaux en cours avant 21h45.',
  },
  {
    id: 'ann-2',
    title: 'Circulaire N° 2026/04 : Simplification des visas électroniques interservices',
    category: 'Directives & Circulaires',
    level: 'Officiel',
    date: 'Applicable dès le 1er Octobre 2026',
    author: 'Secrétariat Général',
    body: 'Le circuit de visa est ramené à deux niveaux de validation. Les bordereaux en cours restent soumis à l’ancienne procédure jusqu’à leur clôture.',
  },
  {
    id: 'ann-3',
    title: 'Ouverture de la campagne de formation continue aux outils numériques',
    category: 'Salle des Annonces',
    level: 'Info',
    date: 'Inscriptions ouvertes jusqu’au 15 Octobre',
    author: 'Ressources Humaines',
    body: 'Sessions en présentiel et à distance : recherche sémantique, gestion des versements, signature électronique. Inscription depuis votre espace personnel.',
  },
  {
    id: 'ann-4',
    title: 'Nouvelle procédure de dépôt des dossiers pour les prestataires agréés',
    category: 'Communiqués Officiels',
    level: 'Officiel',
    date: 'En vigueur dès le 5 Octobre 2026',
    author: 'Direction des Achats & Partenariats',
    body: 'Les prestataires déposent désormais leurs pièces via le portail extranet, avec accusé de réception horodaté et suivi d’instruction en ligne.',
  },
  {
    id: 'ann-5',
    title: 'Ouverture du portail public des démarches en ligne',
    category: 'Communiqués Officiels',
    level: 'Info',
    date: 'Disponible dès maintenant',
    author: 'Direction de la Communication',
    body: 'Les usagers peuvent suivre l’avancement de leurs demandes et télécharger leurs documents officiels sans se déplacer.',
  },
  {
    id: 'ann-6',
    title: 'Alerte : tentatives d’hameçonnage au nom de l’administration',
    category: 'Flash Info Entreprise',
    level: 'Alerte',
    date: 'Diffusé aujourd’hui',
    author: 'Cellule Cybersécurité',
    body: 'Des courriels frauduleux demandent de « confirmer » vos identifiants. L’administration ne demande jamais vos mots de passe par message.',
  },
];

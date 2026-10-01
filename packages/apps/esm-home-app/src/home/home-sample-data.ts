import { Megaphone, GraduationCap, Briefcase, Files, User, Calendar as CalendarIcon, Presentation } from 'lucide-react';
import type { HeroTile } from './hero-mosaic/hero-tile-card.component';
import type { BlogArticle } from './blog-section/blog-post-card.component';
import type { QuickLinkItem } from './quick-links/quick-links.component';
import type { CalendarEventItem } from './team-calendar/team-calendar.component';
import type { DocumentItem } from './documents/documents.component';
import type { UserProfile } from './profile-card/profile-card.component';
import type { SocialLinkItem } from './social-links/social-links.component';

// =============================================================================
//  DONNÉES D'EXEMPLE — Page d'accueil
//
//  Contenu de démonstration, sur le même thème que Civitas-GED (GED,
//  gouvernance IAM, agenda, sites) mais volontairement générique — CE N'EST
//  PAS UNE SOURCE DE DONNÉES RÉELLE. À remplacer par un vrai appel API / une
//  vraie config à mesure que les apps de contenu correspondantes
//  (actualités, GED, IAM, calendrier...) existeront dans ce monorepo.
//
//  home.component.tsx importe ce fichier UNIQUEMENT : c'est le seul endroit
//  à modifier pour brancher une vraie source de données, sans toucher aux
//  composants eux-mêmes (qui ne connaissent que leurs props).
// =============================================================================

export const heroMainTile: HeroTile = {
  id: 'hero-main',
  title: 'Modernisation de la GED et de l’archivage électronique',
  imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=85',
  linkText: 'Consulter le dossier →',
};

export const heroSecondaryTiles: HeroTile[] = [
  {
    id: 'hero-2fa',
    title: 'Déploiement du nouveau protocole 2FA',
    imageUrl: 'https://images.unsplash.com/photo-1579389083078-4e7018379f7e?w=600&auto=format&fit=crop&q=85',
  },
  {
    id: 'hero-recherche',
    title: 'Recherche globale & indexation par métadonnées',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=85',
  },
  {
    id: 'hero-sites',
    title: 'Guide des sites & catalogue des applications',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=85',
  },
  {
    id: 'hero-iam',
    title: 'Gouvernance IAM : attribution des droits',
    imageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600&auto=format&fit=crop&q=85',
  },
];

// Contenu d'exemple sur le thème de l'écosystème (à remplacer par une vraie
// source d'actualités) — délibérément différent du contenu générique hors
// sujet trouvé dans la version d'origine (voir blog-section.component.tsx).
export const blogArticles: BlogArticle[] = [
  {
    id: 'article-ged',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop&q=80',
    author: 'Direction des Systèmes d’Information',
    date: '3 sept. 2026',
    readTime: '4 min',
    category: 'GED',
    title: 'La modernisation de la GED entre dans sa phase pilote',
    description:
      'Retour sur les premières salles migrées vers le nouvel archivage électronique et les prochaines étapes.',
    content: [
      'La direction des systèmes d’information a lancé la phase pilote de modernisation de la gestion électronique des documents.',
      'Les premières salles concernées bénéficient déjà d’un archivage plus rapide et d’une recherche par métadonnées.',
    ],
  },
  {
    id: 'article-iam',
    image: 'https://images.unsplash.com/photo-1614064548237-096d5ec9a9a5?w=800&auto=format&fit=crop&q=80',
    author: 'Pôle Sécurité & IAM',
    date: '1 sept. 2026',
    readTime: '3 min',
    category: 'Sécurité',
    title: 'Nouveau protocole de double authentification',
    description: 'Le protocole 2FA est désormais actif pour l’ensemble des comptes administrateurs.',
    content: ['Le pôle Sécurité & IAM déploie progressivement la double authentification sur les comptes sensibles.'],
  },
];

export const quickLinks: QuickLinkItem[] = [
  { id: 'ql-1', title: 'News & Publications', icon: Megaphone, target: '/informations/news' },
  { id: 'ql-2', title: 'Salle des Annonces', icon: Files, target: '/informations/annonces' },
  { id: 'ql-3', title: 'Agenda & Réunions', icon: CalendarIcon, target: '/informations/agenda' },
  { id: 'ql-4', title: 'Catalogue Applications', icon: Presentation, target: '/applications' },
  { id: 'ql-5', title: 'Recherche Globale', icon: Briefcase, target: '/ged/recherche' },
  { id: 'ql-6', title: 'Droits & Permissions', icon: User, target: '/iam' },
  { id: 'ql-7', title: 'GED & Ressources', icon: Files, target: '/ged' },
  { id: 'ql-8', title: 'Administration Système', icon: GraduationCap, target: '/ged/administration' },
];

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

// Aucun lien par défaut : la version d'origine (ClipPathLinks) pointait vers
// les comptes personnels d'un tiers, sans rapport avec CIVITAS (voir
// social-links.component.tsx). À renseigner avec les vrais liens CIVITAS.
export const socialLinkRows: SocialLinkItem[][] = [];

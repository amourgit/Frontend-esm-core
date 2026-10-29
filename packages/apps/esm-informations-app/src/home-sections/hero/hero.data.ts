import type { HeroTile } from './hero-tile-card.component';

// Contenu d'exemple de la mosaïque « À la une » — à remplacer par une vraie source éditoriale.
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

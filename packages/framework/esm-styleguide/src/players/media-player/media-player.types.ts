/** @category MediaPlayer */
import type React from 'react';

export interface MediaPlayerTrack {
  id: string | number;
  title: React.ReactNode;
  /** Durée affichée telle quelle (ex. "5:25") — format libre, non calculé. */
  duration: React.ReactNode;
  /** Crédits affichés en tête du panneau de détail (ex. icônes + noms). ReactNode libre. */
  credits?: React.ReactNode;
  /** Contenu du panneau de détail (notes, paroles, texte...). Si omis, le morceau n'ouvre aucun détail au clic. */
  detail?: React.ReactNode;
}

export interface MediaPlayerAuthor {
  name: React.ReactNode;
  photoUrl: string;
  genre?: React.ReactNode;
  trackCountLabel?: React.ReactNode;
  listenerCountLabel?: React.ReactNode;
  bio?: React.ReactNode;
}

export interface MediaPlayerProps {
  /** Titre de l'album/de la collection. */
  title: React.ReactNode;
  coverImageUrl: string;
  genre?: React.ReactNode;
  trackCountLabel?: React.ReactNode;
  year?: React.ReactNode;
  /** Liste des morceaux — aucune donnée statique, tout vient d'ici. */
  tracks: MediaPlayerTrack[];
  /** Informations de l'artiste/auteur — le bouton bascule ce panneau si fourni. */
  author?: MediaPlayerAuthor;
  /** Appelé au clic sur le bouton "options" (trois points) d'un morceau. */
  onTrackOptionsClick?: (track: MediaPlayerTrack) => void;
  className?: string;
  style?: React.CSSProperties;
}

/** @category CardModal */
import type React from 'react';
import type { Transition, Variants } from 'framer-motion';
import type { CardProps, CardVariant } from '../../cards/decorated-card';

/** Préréglages d'animation d'ouverture/fermeture prêts à l'emploi. */
export type CardModalAnimationPreset =
  | 'fade'
  | 'scale'
  | 'zoom'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'none';

/** Configuration d'animation complète — surcharge totale possible via `variants`/`transition` (framer-motion natif). */
export interface CardModalAnimationConfig {
  /** Préréglage de base. Ignoré si `variants` est fourni. Défaut : 'scale'. */
  preset?: CardModalAnimationPreset;
  /** Durée en secondes. Défaut : 0.25. */
  duration?: number;
  /** Easing framer-motion (nom ou courbe de Bézier). */
  ease?: Transition['ease'];
  /** Remplace entièrement le préréglage par des variants framer-motion (initial/animate/exit) personnalisés. */
  variants?: Variants;
}

export interface CardModalProps {
  // ── Ouverture — contrôlée ou non contrôlée (même pattern que Sheet) ────────
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  /** Élément déclencheur optionnel — si fourni, un clic dessus ouvre le modal (zéro code de gestion d'état nécessaire côté appelant). */
  trigger?: React.ReactNode;

  // ── Contenu du modal (ce qui le concerne directement) ──────────────────────
  /** Contenu affiché à l'intérieur de la carte. */
  children?: React.ReactNode;
  /** Bouton de fermeture (×) affiché en coin. Défaut : true. */
  showCloseButton?: boolean;
  /** Remplace entièrement le bouton de fermeture par défaut. Reçoit la fonction de fermeture. */
  renderCloseButton?: (close: () => void) => React.ReactNode;

  // ── La carte — transmis "naturellement" à DecoratedCard, comme le ferait une app ──
  /** Variante de DecoratedCard à utiliser comme conteneur. Défaut : 'default'. */
  cardVariant?: CardVariant;
  /** Reste des props DecoratedCard (size, title, description, dotsColor, contentClassName, contentStyle, className, style...), passées telles quelles au DecoratedCard interne. */
  cardProps?: Omit<CardProps, 'variant' | 'children'>;

  // ── Comportement ─────────────────────────────────────────────────────────────
  /** Autorise à attraper la carte et la déplacer à la souris. Défaut : false. */
  draggable?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showOverlay?: boolean;
  /** Verrouille le défilement de la page tant que le modal est ouvert. Défaut : true. */
  lockScroll?: boolean;

  // ── Animation déclarative ────────────────────────────────────────────────────
  /** Préréglage simple (string) ou configuration complète. Défaut : 'scale'. */
  animation?: CardModalAnimationPreset | CardModalAnimationConfig;
  overlayAnimation?: Pick<CardModalAnimationConfig, 'duration' | 'ease'>;

  // ── Apparence du conteneur modal (pas de la carte elle-même) ────────────────
  className?: string;
  style?: React.CSSProperties;
  overlayClassName?: string;
  /** Largeur maximale du modal. Défaut : '32rem'. */
  width?: string;
}

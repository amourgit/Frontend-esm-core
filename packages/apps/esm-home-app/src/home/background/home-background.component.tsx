import React from 'react';
import { GradientWave } from './gradient-wave.component';
import styles from './home-background.scss';

// =============================================================================
//  HOME BACKGROUND — Arrière-plan de la page d'accueil
//
//  Copié/adapté depuis Civitas-GED (IntranetPortalPage.tsx, bloc
//  "backgroundComponent") : fond WebGL animé (GradientWave) + voile de
//  contraste en dégradé, pour garder le texte et les cartes lisibles
//  au-dessus. Contrairement à GED (qui a un système PageBackground global
//  monté une fois pour toute l'appli), esm-home-app ne rend qu'une seule
//  route : le fond est donc posé directement ici, localement.
//
//  Entièrement piloté par props — aucune couleur en dur imposée à l'appelant.
// =============================================================================

export interface HomeBackgroundProps {
  /** Dégradé de couleurs du fond animé. */
  colors?: string[];
  /** Coupe l'animation (rendu figé sur la première frame). */
  isPlaying?: boolean;
}

const DEFAULT_COLORS = ['#008080', '#0b192c', '#0ea5e9', '#042f2e', '#0284c7', '#064e3b'];

export function HomeBackground({ colors = DEFAULT_COLORS, isPlaying = true }: HomeBackgroundProps) {
  return (
    <div className={styles.root} aria-hidden>
      <GradientWave
        colors={colors}
        isPlaying={isPlaying}
        shadowPower={8}
        darkenTop={false}
        noiseSpeed={0.00001}
        noiseFrequency={[0.0001, 0.0009]}
        deform={{ incline: 0.5, noiseAmp: 250, noiseFlow: 5 }}
      />
      <div className={styles.contrastVeil} />
    </div>
  );
}

export default HomeBackground;

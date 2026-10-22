import React from 'react';
import { AnimatedHomeBackground, PageBackground } from '@egen-civitas/esm-framework';

// =============================================================================
//  HOME BACKGROUND — Arrière-plan de la page d'accueil
//
//  Le fond n'est plus rendu ici : le shell monte UN SEUL hôte d'arrière-plan
//  (#egen-page-background-container) et la page ne fait que DÉCLARER ce
//  qu'elle veut y afficher, avec <PageBackground>. Ici : le fond animé par
//  défaut du framework (GradientWave WebGL + voile de contraste), identique à
//  celui de GED (IntranetPortalPage, `backgroundComponent`).
//
//  Le shell monte l'hôte en `fallback="none"` : une page sans <PageBackground>
//  n'a AUCUN fond. Pour obtenir le fond animé, il faut donc le déclarer
//  explicitement, comme ci-dessous.
//
//  Référence de module (et non JSX inline dans le rendu) : <PageBackground>
//  ré-enregistre son fond à chaque changement de `customComponent` ; une
//  référence stable évite de le redéclarer à chaque rendu de la page.
// =============================================================================

const HOME_BACKGROUND = <AnimatedHomeBackground />;

export function HomeBackground() {
  return <PageBackground customComponent={HOME_BACKGROUND} />;
}

export default HomeBackground;

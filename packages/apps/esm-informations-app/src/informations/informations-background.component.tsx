import React from 'react';
import { AnimatedHomeBackground, PageBackground } from '@egen-civitas/esm-framework';

// Fond de page de l'app Informations (rendu par l'unique arrière-plan global du shell).
//
// Les cartes et le texte de cette app (`text-slate-100`, `bg-slate-900/60`…) sont conçus
// pour un fond sombre. Le shell monte l'hôte en `fallback="none"` : sans déclaration, la
// page n'aurait AUCUN fond (texte clair illisible en thème clair). On déclare donc le fond
// animé par défaut du framework.
//
// Référence de module : évite de ré-enregistrer le fond à chaque rendu (voir <PageBackground>).
const INFORMATIONS_BACKGROUND = <AnimatedHomeBackground />;

export const InformationsBackground: React.FC = () => <PageBackground customComponent={INFORMATIONS_BACKGROUND} />;

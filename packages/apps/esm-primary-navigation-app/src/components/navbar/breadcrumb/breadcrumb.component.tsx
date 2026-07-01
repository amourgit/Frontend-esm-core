import React from 'react';
import { ExtensionSlot } from '@igen/esm-framework';
import styles from './breadcrumb.scss';

// =============================================================================
//  BREADCRUMB NAV — Deuxième niveau de la topbar
//
//  Affiche le chemin de navigation courant dans l'app active.
//  Entièrement piloté par les extensions : chaque app peut injecter
//  ses propres éléments de fil d'Ariane via le slot "top-nav-breadcrumb-slot".
//
//  Au repos (aucune extension) : le niveau est invisible (hauteur 0).
//  Quand des extensions sont présentes : s'affiche avec la hauteur configurée.
//
//  Le slot "top-nav-breadcrumb-slot" est le point d'injection standard.
//  Les apps qui veulent afficher leur fil d'Ariane y enregistrent
//  une extension qui rend leur composant de breadcrumb.
// =============================================================================

const BreadcrumbNav: React.FC = () => {
  return (
    <div className={styles.breadcrumbBar} role="navigation" aria-label="Fil d'Ariane">
      {/*
        Slot d'injection pour le fil d'Ariane.
        Chaque app enregistre une extension sur ce slot pour afficher
        son chemin de navigation courant.
        Ex: "Tableau de bord > Notes > Semestre 1 > Module Informatique"
      */}
      <ExtensionSlot name="top-nav-breadcrumb-slot" className={styles.breadcrumbSlot} />
    </div>
  );
};

export default BreadcrumbNav;

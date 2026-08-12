import React from 'react';
import { ExtensionSlot } from '@egen-civitas/esm-framework';
import styles from './breadcrumb.scss';

// =============================================================================
//  BREADCRUMB NAV — Deuxième niveau de la topbar
//
//  Entièrement piloté par les extensions : chaque app injecte ses propres
//  éléments de fil d'Ariane via le slot "top-nav-breadcrumb-slot".
//  Invisible (hauteur 0) si aucune extension n'est enregistrée.
// =============================================================================

const BreadcrumbNav: React.FC = () => (
  <div className={styles.breadcrumbBar} role="navigation" aria-label="Fil d'Ariane">
    <ExtensionSlot name="top-nav-breadcrumb-slot" className={styles.breadcrumbSlot} />
  </div>
);

export default BreadcrumbNav;

import React from 'react';
import { SectionSlot } from '@egen-civitas/esm-framework';
import { HomeBackground } from './background/home-background.component';
import styles from './home.scss';

// =============================================================================
//  HOME PAGE — Page d'accueil de l'espace authentifié (colonne unique)
//
//  La page ne connaît AUCUNE section : elle déclare le fond animé (HomeBackground) et
//  expose le slot d'extensions `home-sections`. Chaque app contributrice y branche sa
//  propre section via son routes.json (`"slot": "home-sections"`, `"order": n`) :
//
//    10-40  esm-informations-app   À la une · Actualités · Annonces · Événements à venir
//    50     esm-annuaire-app       Annuaire
//    60     esm-sites-app          Nos sites
//    90     esm-home-app           Nous suivre
//
//  Toutes reposent sur le squelette `Section` du framework. `SectionSlot` active les
//  en-têtes collants : l'en-tête d'une section reste en haut de la zone de défilement
//  tant que son corps est visible, puis passe le relais à la section suivante.
//
//  Le contenu latéral (profil, raccourcis, agenda, documents) vit dans le rail droit
//  (esm-quick-access-app).
// =============================================================================

export const HOME_SECTIONS_SLOT = 'home-sections';

export function HomePage() {
  return (
    <div className={styles.root}>
      <HomeBackground />

      <div className={styles.layout}>
        <SectionSlot name={HOME_SECTIONS_SLOT} gap="lg" />
      </div>
    </div>
  );
}

export default HomePage;

import React, { useCallback } from 'react';
import { showToast } from '@egen-civitas/esm-styleguide';
import { HomeBackground } from './background/home-background.component';
import { HomeSection } from './section/home-section.component';
import { HeroMosaic } from './hero-mosaic/hero-mosaic.component';
import { BlogSection } from './blog-section/blog-section.component';
import { SocialLinks } from './social-links/social-links.component';
import type { HeroTile } from './hero-mosaic/hero-tile-card.component';
import {
  heroMainTile,
  heroSecondaryTiles,
  blogArticles,
  socialLinkRows,
} from './home-sample-data';
import styles from './home.scss';

// =============================================================================
//  HOME PAGE — Page d'accueil de l'espace authentifié
//
//  Assemble les sections portées depuis Civitas-GED (voir les sous-dossiers
//  de home/), chacune extraite en composants séparés, props-driven,
//  au-dessus du fond animé déclaré par HomeBackground (rendu par l'hôte global du shell). Remplace l'ancienne vitrine de
//  test des composants, mise de côté sous 'home/showcase'.
//
//  Les données affichées viennent de home-sample-data.ts — SEUL fichier à
//  modifier pour brancher une vraie source (API, config) sans toucher aux
//  composants de section eux-mêmes.
//
//  Non porté dans cette passe : la section "Événements" de GED
//  (EventsSection.tsx), qui dépend d'un sous-système de filtres complet
//  (FilterBar, types/events.ts) absent de ce monorepo — à traiter comme une
//  tâche dédiée plutôt que d'être improvisée ici.
// =============================================================================

function handleShowToast(description: string, kind: 'info' | 'success' | 'warning') {
  showToast({ kind, description });
}

export function HomePage() {
  const handleSelectHeroTile = useCallback(
    (tile: HeroTile) => handleShowToast(`Ouverture de « ${tile.title} »`, 'info'),
    [],
  );

  return (
    <div className={styles.root}>
      <HomeBackground />

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <HomeSection title="À la une">
            <HeroMosaic
              mainTile={heroMainTile}
              secondaryTiles={heroSecondaryTiles}
              onSelectTile={handleSelectHeroTile}
            />
          </HomeSection>

          <HomeSection title="Actualités" description="Les dernières publications de l'organisation.">
            <BlogSection articles={blogArticles} onShowToast={handleShowToast} />
          </HomeSection>

          {socialLinkRows.length > 0 && (
            <HomeSection title="Nous suivre">
              <SocialLinks rows={socialLinkRows} />
            </HomeSection>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;

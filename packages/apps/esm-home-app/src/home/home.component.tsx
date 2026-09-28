import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '@egen-civitas/esm-styleguide';
import { HomeBackground } from './background/home-background.component';
import { HomeSection } from './section/home-section.component';
import { HeroMosaic } from './hero-mosaic/hero-mosaic.component';
import { BlogSection } from './blog-section/blog-section.component';
import { SocialLinks } from './social-links/social-links.component';
import { ProfileCard } from './profile-card/profile-card.component';
import { QuickLinks } from './quick-links/quick-links.component';
import { TeamCalendar } from './team-calendar/team-calendar.component';
import { Documents } from './documents/documents.component';
import type { HeroTile } from './hero-mosaic/hero-tile-card.component';
import {
  heroMainTile,
  heroSecondaryTiles,
  blogArticles,
  quickLinks,
  upcomingCalendarEvents,
  recentDocuments,
  defaultProfile,
  socialLinkRows,
} from './home-sample-data';
import styles from './home.scss';

// =============================================================================
//  HOME PAGE — Page d'accueil de l'espace authentifié
//
//  Assemble les sections portées depuis Civitas-GED (voir les sous-dossiers
//  de home/), chacune extraite en composants séparés, props-driven,
//  au-dessus du fond animé HomeBackground. Remplace l'ancienne vitrine de
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
  const navigate = useNavigate();

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
            <HeroMosaic mainTile={heroMainTile} secondaryTiles={heroSecondaryTiles} onSelectTile={handleSelectHeroTile} />
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

        <aside className={styles.sideColumn}>
          <ProfileCard profile={defaultProfile} onShowToast={handleShowToast} />

          <HomeSection as="div" variant="panel" title="Raccourcis" bare>
            <QuickLinks
              items={quickLinks}
              onSelectItem={(item) => (item.target ? navigate(item.target) : handleShowToast(`Ouverture de ${item.title}`, 'info'))}
            />
          </HomeSection>

          <HomeSection as="div" variant="panel" bare>
            <TeamCalendar
              upcomingEvents={upcomingCalendarEvents}
              onSelectEvent={(ev) => navigate(`/calendrier?event=${ev.id}`)}
              onRefresh={() => handleShowToast('Calendrier synchronisé.', 'info')}
            />
          </HomeSection>

          <HomeSection as="div" variant="panel" bare>
            <Documents
              items={recentDocuments}
              onOpenDocument={(doc) => (doc.type === 'folder' ? navigate('/ged') : handleShowToast(`Ouverture de ${doc.name}`, 'info'))}
              onSeeAll={() => navigate('/ged')}
              onCreateFolder={() => navigate('/ged/ingestion')}
              onUploadFile={() => navigate('/ged/ingestion')}
            />
          </HomeSection>
        </aside>
      </div>
    </div>
  );
}

export default HomePage;

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Section, showToast } from '@egen-civitas/esm-framework';
import { HomeBackground } from './background/home-background.component';
import { HeroMosaic } from './hero-mosaic/hero-mosaic.component';
import { BlogSection } from './blog-section/blog-section.component';
import { AnnouncementsSection } from './announcements/announcements-section.component';
import { EventsSection } from './events/events-section.component';
import { DirectorySection } from './directory/directory-section.component';
import { SitesSection } from './directory/sites-section.component';
import { SocialLinks } from './social-links/social-links.component';
import type { HeroTile } from './hero-mosaic/hero-tile-card.component';
import {
  heroMainTile,
  heroSecondaryTiles,
  blogArticles,
  announcements,
  upcomingEvents,
  directoryMembers,
  directoryFilters,
  directoryTotalCount,
  directorySites,
  socialLinkRows,
} from './home-sample-data';
import styles from './home.scss';

// =============================================================================
//  HOME PAGE — Page d'accueil de l'espace authentifié (colonne unique)
//
//  Assemble les sections de l'accueil au-dessus du fond animé déclaré par
//  HomeBackground (rendu par l'hôte global du shell). Le contenu latéral
//  (profil, raccourcis, agenda, documents) vit dans le rail droit
//  (esm-quick-access-app) : l'accueil ne garde que le contenu principal.
//
//  TOUTES les sections reposent sur le même squelette `Section` du framework
//  (en-tête : titre + options · trait fin · corps : grille responsive · pied) :
//
//    À la une · Actualités · Annonces · Événements à venir · Annuaire ·
//    Nos sites · Nous suivre
//
//  Les données viennent de home-sample-data.ts (qui ré-exporte ./data/ : mocks
//  adaptés de esm-informations-app et esm-annuaire-app) — SEUL fichier à
//  modifier pour brancher une vraie source (API, config) sans toucher aux
//  composants de section eux-mêmes.
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
          <Section title="À la une">
            <HeroMosaic
              mainTile={heroMainTile}
              secondaryTiles={heroSecondaryTiles}
              onSelectTile={handleSelectHeroTile}
            />
          </Section>

          <BlogSection
            articles={blogArticles}
            onShowToast={handleShowToast}
            onSeeAll={() => navigate('/informations/news')}
          />

          <AnnouncementsSection
            items={announcements}
            onSelect={(item) => navigate(`/informations/annonces?announcement=${item.id}`)}
            onSeeAll={() => navigate('/informations/annonces')}
          />

          <EventsSection
            events={upcomingEvents}
            onSelect={(event) => navigate(`/informations/agenda?event=${event.id}`)}
            onSeeAll={() => navigate('/informations/agenda')}
          />

          <DirectorySection
            members={directoryMembers}
            filters={directoryFilters}
            totalCount={directoryTotalCount}
            onSelectMember={() => navigate('/annuaire')}
            onOpenProfile={() => navigate('/annuaire')}
            onSeeAll={() => navigate('/annuaire')}
          />

          <SitesSection
            sites={directorySites}
            onSelectSite={() => navigate('/sites')}
            onSeeAll={() => navigate('/sites')}
          />

          {socialLinkRows.length > 0 && (
            <Section title="Nous suivre">
              <SocialLinks rows={socialLinkRows} />
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;

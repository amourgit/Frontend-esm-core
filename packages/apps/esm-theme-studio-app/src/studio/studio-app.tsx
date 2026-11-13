import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { InlineNotification } from '@carbon/react';
import type { StudioPage } from '../pages';
import { CategoryPage, ComponentsPage } from './controls-panel';
import { StudioErrorBoundary } from './error-boundary';
import { JsonPanel } from './json-panel';
import { LibraryPage } from './library-page';
import { Preview } from './preview';
import { StudioProvider, type StudioServices } from './studio-context';
import { Toolbar } from './toolbar';
import styles from './studio.scss';

const PageContent: React.FC<{ page: StudioPage }> = ({ page }) => {
  switch (page.kind) {
    case 'components':
      return <ComponentsPage />;
    case 'library':
      return <LibraryPage />;
    case 'json':
      return <JsonPanel />;
    default:
      return <CategoryPage page={page} />;
  }
};

/** Mise en page d'édition (UX TweakCN) : barre d'actions, panneau de contrôles à gauche, prévisualisation à droite.
 *  La navigation entre pages est assurée par le shell EGEN (rail gauche + TopBar), pas par un menu propre au Studio. */
export const StudioApp: React.FC<{ services: StudioServices; page: StudioPage; notice?: string }> = ({ services, page, notice }) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const wide = page.kind === 'library' || page.kind === 'json';
  return (
    <StudioProvider services={services} notify={setMessage}>
      <StudioErrorBoundary>
        <div className={styles.studio} data-testid="theme-studio" data-page={page.id}>
          <Toolbar />
          {notice && <InlineNotification kind="info" lowContrast hideCloseButton title={notice} />}
          <div className={styles.status} data-testid="studio-message" aria-live="polite">{message}</div>
          <div className={wide ? styles.bodyWide : styles.body}>
            <main className={styles.controls} aria-label={page.label}>
              <h2 className={styles.pageTitle}>{t(`page_${page.id}`, page.label)}</h2>
              <p className={styles.hint}>{page.description}</p>
              <PageContent page={page} />
            </main>
            {!wide && (
              <aside className={styles.previewPane} aria-label={t('preview', 'Prévisualisation')}>
                <Preview />
              </aside>
            )}
          </div>
        </div>
      </StudioErrorBoundary>
    </StudioProvider>
  );
};

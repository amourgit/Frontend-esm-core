import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DynamicField,
  MenuToggleButton,
  StaggeredMenuPanel,
  useConfig,
} from '@egen/esm-framework';
import type { ConfigSchema } from '../config-schema';
import styles from './home.scss';

// =============================================================================
//  HOME PAGE — Écran d'accueil authentifié
//
//  Cette page n'a plus de navigation propre : elle est rendue par la SPA
//  DANS l'espace authentifié (la TopBar de @egen/esm-primary-navigation-app
//  s'affiche naturellement au-dessus, comme pour n'importe quelle autre
//  route du tenant — voir routes.json de esm-primary-navigation-app).
//
//  Rôle actuel : vitrine de test des composants de base en cours de
//  construction dans @egen/esm-styleguide, avant leur diffusion dans les
//  vraies apps. Chaque composant testé ici est ajouté dans une section
//  dédiée, avec ses variantes.
// =============================================================================

const ComponentShowcasePage: React.FC = () => {
  const { t } = useTranslation();
  const config = useConfig<ConfigSchema>();

  // ── Démo : DynamicField (@egen/esm-styleguide/fields) ──────────────────────
  const [outlinedValue, setOutlinedValue] = useState('');
  const [filledValue, setFilledValue] = useState('');
  const [standardValue, setStandardValue] = useState('');

  // ── Démo : StaggeredMenuPanel / MenuToggleButton (@egen/esm-styleguide/staggered-menu) ──
  const [staggeredMenuOpen, setStaggeredMenuOpen] = useState(false);
  const staggeredMenuPosition = config.staggeredMenu.position;
  const demoStaggeredItems = [
    { label: 'Accueil', ariaLabel: "Aller à l'accueil", link: '#' },
    { label: 'Applications', ariaLabel: 'Voir les applications', link: '#' },
    { label: 'Paramètres', ariaLabel: 'Ouvrir les paramètres', link: '#' },
  ];
  const demoStaggeredSocials = [
    { label: 'GitHub', link: 'https://github.com/amourgit' },
    { label: 'LinkedIn', link: 'https://linkedin.com' },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{config.pageTitle}</h1>
        <p className={styles.pageSubtitle}>
          {t('showcaseSubtitle', 'Composants @egen/esm-styleguide en cours de validation visuelle.')}
        </p>
      </header>

      <main className={styles.sections}>
        {/* ── Section : DynamicField ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>DynamicField</h2>
          <p className={styles.sectionDescription}>
            {t('showcaseFieldsDescription', 'Champ de saisie unique, multi-variante (outlined / filled / standard).')}
          </p>
          <div className={styles.fieldsGrid}>
            <DynamicField
              variant="outlined"
              label="Outlined"
              value={outlinedValue}
              onChange={setOutlinedValue}
            />
            <DynamicField
              variant="filled"
              label="Filled"
              value={filledValue}
              onChange={setFilledValue}
            />
            <DynamicField
              variant="standard"
              label="Standard"
              value={standardValue}
              onChange={setStandardValue}
            />
          </div>
        </section>

        {/* ── Section : StaggeredMenu ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>StaggeredMenuPanel</h2>
          <p className={styles.sectionDescription}>
            {t(
              'showcaseMenuDescription',
              "Panneau de navigation latéral animé (GSAP), côté piloté par config.staggeredMenu.position.",
            )}
          </p>
          <div className={styles.menuTrigger}>
            <MenuToggleButton
              isOpen={staggeredMenuOpen}
              onToggle={() => setStaggeredMenuOpen((prev) => !prev)}
              menuButtonColor="var(--colors-surface-foreground)"
              openMenuButtonColor="var(--colors-surface-foreground)"
              changeMenuColorOnOpen
            />
          </div>
        </section>
      </main>

      <StaggeredMenuPanel
        isOpen={staggeredMenuOpen}
        onClose={() => setStaggeredMenuOpen(false)}
        position={staggeredMenuPosition}
        items={demoStaggeredItems}
        socialItems={demoStaggeredSocials}
        displaySocials
        displayItemNumbering
        colors={['var(--colors-secondary-300)', 'var(--colors-primary-600)']}
        accentColor="var(--colors-primary-600)"
        closeOnClickAway
      />
    </div>
  );
};

export default ComponentShowcasePage;

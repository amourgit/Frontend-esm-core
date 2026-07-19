import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CascadingNavDropdown,
  DynamicField,
  MenuToggleButton,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  StaggeredMenuPanel,
  useConfig,
  type NavigationItem,
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

  // ── Démo : CascadingNavDropdown (@egen/esm-styleguide/cascading-nav-dropdown) ──
  const demoNavigationTree: NavigationItem[] = [
    {
      id: 'education',
      label: 'Éducation',
      children: [
        { id: 'eigen', label: 'EIGEN', path: '#' },
        { id: 'iam-central', label: 'IAM Central', path: '#' },
        {
          id: 'egen-suite',
          label: 'Suite EGEN',
          children: [
            { id: 'esm-styleguide', label: 'esm-styleguide', path: '#' },
            { id: 'esm-tenant', label: 'esm-tenant', path: '#' },
          ],
        },
      ],
    },
    {
      id: 'civitas',
      label: 'CIVITAS',
      children: [
        { id: 'civitas-site', label: 'Site CIVITAS', path: '#' },
        { id: 'cae', label: 'CIVITAS Acquisition Engine', path: '#' },
      ],
    },
    { id: 'edugabon', label: 'EDUGABON', path: '#' },
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

        {/* ── Section : CascadingNavDropdown ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>CascadingNavDropdown</h2>
          <p className={styles.sectionDescription}>
            {t(
              'showcaseCascadingNavDescription',
              'Dropdown de navigation en cascade, ouverture vers le bas ou vers le haut selon la prop direction.',
            )}
          </p>
          <div className={styles.demoRow}>
            <CascadingNavDropdown
              items={demoNavigationTree}
              triggerLabel="Direction: bas"
              direction="down"
              searchable
              onNavigate={(path) => window.alert(`Navigate: ${path}`)}
            />
            <CascadingNavDropdown
              items={demoNavigationTree}
              triggerLabel="Direction: haut"
              direction="up"
              searchable
              onNavigate={(path) => window.alert(`Navigate: ${path}`)}
            />
          </div>
        </section>

        {/* ── Section : Sheet ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Sheet</h2>
          <p className={styles.sectionDescription}>
            {t(
              'showcaseSheetDescription',
              'Panneau modal glissable (drag), ancré en haut ou en bas selon la prop side.',
            )}
          </p>
          <div className={styles.demoRow}>
            <Sheet side="top">
              <SheetTrigger className={styles.demoButton}>Ouvrir (haut)</SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Sheet — side=&quot;top&quot;</SheetTitle>
                  <SheetDescription>Glisse depuis le haut de l'écran. Fermeture en glissant vers le haut.</SheetDescription>
                </SheetHeader>
                <p>Contenu de démonstration.</p>
                <SheetFooter>
                  <SheetClose className={styles.demoButton}>Fermer</SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <Sheet side="bottom">
              <SheetTrigger className={styles.demoButton}>Ouvrir (bas)</SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Sheet — side=&quot;bottom&quot;</SheetTitle>
                  <SheetDescription>Glisse depuis le bas de l'écran. Fermeture en glissant vers le bas.</SheetDescription>
                </SheetHeader>
                <p>Contenu de démonstration.</p>
                <SheetFooter>
                  <SheetClose className={styles.demoButton}>Fermer</SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
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

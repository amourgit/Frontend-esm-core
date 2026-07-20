import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CascadingNavDropdown,
  DynamicField,
  LiquidGlassCard,
  MenuToggleButton,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  showToast,
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
  // Défaut = config.staggeredMenu.position, mais surchargeable en direct dans
  // la vitrine via le contrôle gauche/droite ci-dessous — pour tester les deux
  // sens sans devoir changer la config à chaque fois.
  const [staggeredMenuPosition, setStaggeredMenuPosition] = useState<'left' | 'right'>(config.staggeredMenu.position);
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

  // ── Démo : Toast (@egen/esm-styleguide/toasts) ──────────────────────────────
  const handleTransferDemo = () => {
    const toastKey = `demo-transfer-${Date.now()}`;
    let progress = 0;
    showToast({
      toastKey,
      variant: 'transfer',
      kind: 'info',
      title: 'rapport-annuel.pdf',
      description: 'Téléversement en cours…',
      progress,
    });
    const interval = setInterval(() => {
      progress += 10;
      showToast({
        toastKey,
        variant: 'transfer',
        kind: 'info',
        title: 'rapport-annuel.pdf',
        description: progress >= 100 ? 'Terminé.' : 'Téléversement en cours…',
        progress,
      });
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 400);
  };

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
              'Panneau de navigation latéral animé (GSAP) — côté configurable : gauche ou droite.',
            )}
          </p>
          <div className={styles.demoRow}>
            <div className={styles.sideToggle} role="group" aria-label="Côté d'ouverture">
              <button
                type="button"
                className={styles.sideToggleButton}
                data-active={staggeredMenuPosition === 'left' || undefined}
                onClick={() => setStaggeredMenuPosition('left')}
              >
                ◀ Gauche
              </button>
              <button
                type="button"
                className={styles.sideToggleButton}
                data-active={staggeredMenuPosition === 'right' || undefined}
                onClick={() => setStaggeredMenuPosition('right')}
              >
                Droite ▶
              </button>
            </div>

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

        {/* ── Section : Toast ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Toast</h2>
          <p className={styles.sectionDescription}>
            {t(
              'showcaseToastDescription',
              "Notification 'verre liquide', 3 variantes : default (compte à rebours), transfer (progression réelle), actions (commandes personnalisables).",
            )}
          </p>
          <div className={styles.demoRow}>
            <button
              type="button"
              className={styles.demoButton}
              onClick={() =>
                showToast({
                  kind: 'success',
                  title: 'Enregistré',
                  description: 'Les modifications ont bien été sauvegardées.',
                })
              }
            >
              Toast: default
            </button>
            <button type="button" className={styles.demoButton} onClick={handleTransferDemo}>
              Toast: transfer
            </button>
            <button
              type="button"
              className={styles.demoButton}
              onClick={() =>
                showToast({
                  kind: 'info',
                  variant: 'actions',
                  duration: 0,
                  title: 'Nouvelle demande de rôle',
                  description: 'Amour Ngoua demande le rôle « Administrateur tenant ».',
                  actions: [
                    { label: 'Refuser', kind: 'danger', onClick: () => showToast({ kind: 'error', description: 'Demande refusée.' }) },
                    { label: 'Approuver', kind: 'primary', onClick: () => showToast({ kind: 'success', description: 'Demande approuvée.' }) },
                  ],
                })
              }
            >
              Toast: actions
            </button>
            <button
              type="button"
              className={styles.demoButton}
              onClick={() =>
                showToast({
                  kind: 'error',
                  critical: true,
                  title: 'Échec de la synchronisation',
                  description: 'Le serveur EDUNET_GABON_BACKEND est injoignable.',
                })
              }
            >
              Toast: error
            </button>
          </div>
        </section>

        {/* ── Section : LiquidGlassCard ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>LiquidGlassCard</h2>
          <p className={styles.sectionDescription}>
            {t(
              'showcaseGlassCardDescription',
              'Effet de verre liquide autonome (flou + distorsion + reflets), utilisé en interne par Toast.',
            )}
          </p>
          <LiquidGlassCard
            blurIntensity="lg"
            shadowIntensity="md"
            glowIntensity="md"
            borderRadius="var(--border-radius-lg)"
            className={styles.glassCardDemo}
          >
            <p className={styles.glassCardDemoText}>Contenu affiché à travers le verre.</p>
          </LiquidGlassCard>
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

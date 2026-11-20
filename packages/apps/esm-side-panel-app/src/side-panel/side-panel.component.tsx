import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { MenuToggleButton, StaggeredMenuPanel } from '@egen-civitas/esm-framework';
import styles from './side-panel.module.css';
import closeStyles from './side-panel-close.module.css';

// =============================================================================
//  PANNEAU LATÉRAL — extension de la TopBar (StaggeredMenuPanel) + son bouton déclencheur
//
//   • Le bouton, petit, est à l'extrême droite du niveau `main` (placement déclaré dans `routes.json`).
//   • Le panneau s'ouvre à DROITE ; il se ferme par le bouton de fermeture de son coin haut-droite, par un
//     clic à côté ou par Échap. Ce bouton est fourni ICI (`PanelCloseButton`) et non par le panneau du shell :
//     il reste donc présent quel que soit le panneau que le shell exécute (`showCloseButton={false}` évite le
//     doublon avec celui des versions récentes).
//   • Son contenu est entièrement fourni par les apps (slot `staggered-menu-slot`) : les Espaces y sont posés par
//     `space-selector-menu` (esm-spaces-sites-app).
//
//  Le panneau est monté dans `document.body` (portail) : la TopBar a un fond « verre » (backdrop-filter),
//  qui deviendrait le repère de son `position: fixed` et le ferait sortir de l'écran.
// =============================================================================

/** Couleur du bouton, calée sur le texte des options de la TopBar (slate-100). */
const TOGGLE_COLOR = '#f1f5f9';

/**
 * Couches de couleur qui s'animent derrière le panneau à l'ouverture, avant que le panneau blanc n'apparaisse.
 * Mêmes teintes que la vitrine des composants (esm-home-app) : sans `colors`, le panneau s'ouvre sans l'animation.
 */
const PANEL_LAYER_COLORS = ['var(--colors-secondary-300)', 'var(--colors-primary-600)'];

/** Bouton de fermeture, dans le coin haut-droite du panneau, au-dessus de lui. */
function PanelCloseButton({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <div className={closeStyles.closeFrame} data-testid="menu-panel-close-frame" data-open={isOpen ? 'true' : 'false'}>
      <button type="button" className={closeStyles.closeButton} aria-label={t('closeMenu', 'Fermer le menu')} onClick={onClose}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}

/** État de la TopBar reçu en props (facultatif : l'extension marche aussi hors d'une TopBar). */
interface SidePanelProps {
  /** Classe du bouton. */
  className?: string;
  searchOpen?: boolean;
  isDesktop?: boolean;
}

export function SidePanel({ className, searchOpen, isDesktop }: SidePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((open) => !open), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, close]);

  // Recherche ouverte sur un écran tactile : la place revient à la recherche.
  if (searchOpen && isDesktop === false) return null;

  return (
    <>
      <MenuToggleButton
        className={[styles.menuToggle, className].filter(Boolean).join(' ')}
        isOpen={isOpen}
        onToggle={toggle}
        menuButtonColor={TOGGLE_COLOR}
        openMenuButtonColor={TOGGLE_COLOR}
        changeMenuColorOnOpen={false}
      />
      {createPortal(
        <>
          <StaggeredMenuPanel
            isOpen={isOpen}
            onClose={close}
            position="right"
            colors={PANEL_LAYER_COLORS}
            accentColor="var(--colors-primary-600)"
            closeOnClickAway
            showCloseButton={false}
          />
          <PanelCloseButton isOpen={isOpen} onClose={close} />
        </>,
        document.body,
      )}
    </>
  );
}

export default SidePanel;

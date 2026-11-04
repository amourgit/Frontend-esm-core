import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MenuToggleButton, StaggeredMenuPanel } from '@egen-civitas/esm-framework';
import styles from './topbar-level1.scss';

// =============================================================================
//  Panneau latéral de la TopBar (StaggeredMenuPanel) + son bouton déclencheur
//
//   • Le bouton, petit, est à l'extrême droite du niveau 1.
//   • Le panneau s'ouvre à DROITE ; il se ferme par le bouton de fermeture de son coin haut-droite, par un
//     clic à côté ou par Échap.
//   • Son contenu est entièrement fourni par les apps (slot `staggered-menu-slot`) : l'Espace y est posé en
//     permanence par `workspace-selector-menu` (routes.json de cette app).
//
//  Le panneau est monté dans `document.body` (portail) : la TopBar a un fond « verre » (backdrop-filter),
//  qui deviendrait le repère de son `position: fixed` et le ferait sortir de l'écran.
// =============================================================================

/** Couleur du bouton, calée sur le texte des options de la TopBar (slate-100). */
const TOGGLE_COLOR = '#f1f5f9';

interface TopBarMenuPanelProps {
  /** Classe du bouton (ex. masquage quand la recherche est ouverte en mobile). */
  className?: string;
}

export function TopBarMenuPanel({ className }: TopBarMenuPanelProps) {
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
        <StaggeredMenuPanel
          isOpen={isOpen}
          onClose={close}
          position="right"
          accentColor="var(--colors-primary-500)"
          closeOnClickAway
        />,
        document.body,
      )}
    </>
  );
}

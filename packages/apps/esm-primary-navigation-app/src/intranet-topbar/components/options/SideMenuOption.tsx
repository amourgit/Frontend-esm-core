import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Menu } from 'lucide-react';
import {
  isDesktop,
  LeftNavMenu,
  useAssignedExtensions,
  useLayoutType,
  useLeftNavStore,
  useOnClickOutside,
} from '@egen-civitas/esm-framework';
import { TopBarOptionButton } from './TopBarOptionButton';

// Menu latéral (hamburger) — service réel : navigation gauche du framework
// (`LeftNavMenu`), en overlay (mobile / mode replié) ou en portail vers
// `#egen-left-nav-container` (desktop, mode normal).

/** Bouton hamburger : visible en mobile ou quand la nav gauche est repliée. */
export const SideMenuButton: React.FC<{ active: boolean; onToggle: () => void }> = ({ active, onToggle }) => {
  const { t } = useTranslation();
  const layout = useLayoutType();
  const { slotName, mode } = useLeftNavStore();
  const navMenuItems = useAssignedExtensions(slotName);

  const visible = (!isDesktop(layout) || mode === 'collapsed') && mode !== 'hidden' && navMenuItems.length > 0;
  if (!visible) return null;

  return (
    <TopBarOptionButton
      label={t('openMenu', 'Ouvrir le menu')}
      icon={<Menu className="w-5 h-5" />}
      active={active}
      onClick={onToggle}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    />
  );
};

interface SideMenuPanelProps {
  expanded: boolean;
  hidePanel: Parameters<typeof useOnClickOutside>[0];
}

/** Toujours monté : assure aussi le rendu de la nav latérale desktop via portail. */
export const SideMenuPanel: React.FC<SideMenuPanelProps> = ({ expanded, hidePanel }) => {
  const menuRef = useOnClickOutside(hidePanel, expanded);
  const layout = useLayoutType();
  const { mode } = useLeftNavStore();

  useEffect(() => {
    window.addEventListener('popstate', hidePanel);
    return () => window.removeEventListener('popstate', hidePanel);
  }, [hidePanel]);

  const leftNavContainer = window.document.getElementById('egen-left-nav-container');

  return (
    <>
      {(!isDesktop(layout) || mode === 'collapsed') && expanded && <LeftNavMenu ref={menuRef} isChildOfHeader />}
      {isDesktop(layout) &&
        mode === 'normal' &&
        leftNavContainer &&
        createPortal(<LeftNavMenu ref={menuRef} isChildOfHeader />, leftNavContainer)}
    </>
  );
};

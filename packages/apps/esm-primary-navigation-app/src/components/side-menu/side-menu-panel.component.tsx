import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { isDesktop, LeftNavMenu, useLayoutType, useLeftNavStore, useOnClickOutside } from '@egen/esm-framework';

interface SideMenuPanelProps {
  expanded: boolean;
  hidePanel: Parameters<typeof useOnClickOutside>[0];
}

/**
 * Menu qui s'ouvre au clic sur le bouton hamburger de la topbar.
 * Responsable également du rendu de la nav latérale en mode desktop
 * (via portail React vers le conteneur dédié).
 */
const SideMenuPanel: React.FC<SideMenuPanelProps> = ({ expanded, hidePanel }) => {
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

export default SideMenuPanel;

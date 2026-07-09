// =============================================================================
//  TOPBAR — Types partagés
// =============================================================================

/** Props communes à tous les boutons qui pilotent un panneau de la topbar. */
export interface MenuButtonProps {
  isActivePanel: (panelName: string) => boolean;
  togglePanel: (panelName: string) => void;
  hidePanel: (panelName: string) => () => void;
}

import * as React from 'react';

// Les portails Radix (dialogues, menus, tooltips…) sont rendus DANS la racine du Studio pour hériter du thème édité.
const PortalContainerContext = React.createContext<HTMLElement | null>(null);

export const PortalContainerProvider = PortalContainerContext.Provider;
export const usePortalContainer = (): HTMLElement | undefined => React.useContext(PortalContainerContext) ?? undefined;

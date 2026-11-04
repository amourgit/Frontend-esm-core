import React from 'react';
import {
  MorphSelect,
  MorphSelectContent,
  MorphSelectItem,
  MorphSelectTrigger,
  MorphSelectValue,
} from '@egen-civitas/esm-framework';
import { WORKSPACES_MOCK_DATA } from '../../intranet-topbar/data/workspaceMockData';
import { setWorkspaceIdInStore, useWorkspaceId } from '../../intranet-topbar/context/workspaceStore';
import { playXboxSound } from '../../intranet-topbar/utils/xboxAudio';
import { type WorkspaceId } from '../../intranet-topbar/types/workspace';

/** Props transmises par le StaggeredMenuPanel à ses extensions (voir `StaggeredMenuExtensionState`). */
interface WorkspaceSelectorMenuProps {
  closeMenu?: () => void;
}

/**
 * Choix de l'ESPACE (Intranet, Extranet…) dans le StaggeredMenuPanel — le sélecteur retiré de la TopBar en
 * mobile. Extension permanente du panneau (`global: true`, voir routes.json) : présente quelle que soit
 * l'app active. L'Espace choisi est partagé avec la TopBar via `workspaceStore`.
 */
export default function WorkspaceSelectorMenu({ closeMenu }: WorkspaceSelectorMenuProps) {
  const workspaceId = useWorkspaceId();

  const handleChange = (id: string) => {
    if (id === workspaceId) return;
    playXboxSound('select');
    setWorkspaceIdInStore(id as WorkspaceId);
    // Le panneau recouvre la page en mobile : on le referme pour montrer l'Espace activé.
    closeMenu?.();
  };

  return (
    <MorphSelect value={workspaceId} onValueChange={handleChange} className="w-full">
      <MorphSelectTrigger>
        <MorphSelectValue placeholder="Espace" />
      </MorphSelectTrigger>
      <MorphSelectContent>
        {WORKSPACES_MOCK_DATA.map((ws) => (
          <MorphSelectItem key={ws.id} value={ws.id} label={ws.name}>
            {ws.name}
          </MorphSelectItem>
        ))}
      </MorphSelectContent>
    </MorphSelect>
  );
}

import { useSyncExternalStore } from 'react';
import { type WorkspaceId } from '../types/workspace';
import { WORKSPACES_MOCK_DATA } from '../data/workspaceMockData';

// =============================================================================
//  Store de l'ESPACE actif
//
//  Les composants posés dans le StaggeredMenuPanel (extensions) vivent dans leur propre racine React :
//  le contexte `WorkspaceProvider` ne les traverse pas. L'Espace actif est donc porté par ce petit store
//  (un singleton du module de l'app) que lisent à la fois le `WorkspaceProvider` et ces extensions —
//  changer d'Espace depuis le panneau met à jour la TopBar, et inversement.
// =============================================================================

export const DEFAULT_WORKSPACE_ID: WorkspaceId = 'intranet';

let currentId: WorkspaceId = DEFAULT_WORKSPACE_ID;
const listeners = new Set<() => void>();

export function getWorkspaceId(): WorkspaceId {
  return currentId;
}

/** Change d'Espace. Un identifiant inconnu ou déjà actif est ignoré. */
export function setWorkspaceIdInStore(id: WorkspaceId): void {
  if (id === currentId || !WORKSPACES_MOCK_DATA.some((w) => w.id === id)) return;
  currentId = id;
  listeners.forEach((listener) => listener());
}

export function subscribeWorkspaceId(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Remet l'Espace par défaut (tests). */
export function resetWorkspaceStore(): void {
  currentId = DEFAULT_WORKSPACE_ID;
  listeners.forEach((listener) => listener());
}

export function useWorkspaceId(): WorkspaceId {
  return useSyncExternalStore(subscribeWorkspaceId, getWorkspaceId, getWorkspaceId);
}

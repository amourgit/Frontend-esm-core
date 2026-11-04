import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_WORKSPACE_ID,
  getWorkspaceId,
  resetWorkspaceStore,
  setWorkspaceIdInStore,
  subscribeWorkspaceId,
} from './workspaceStore';
import { type WorkspaceId } from '../types/workspace';

afterEach(resetWorkspaceStore);

describe('workspaceStore', () => {
  it("démarre sur l'Espace par défaut (Intranet)", () => {
    expect(DEFAULT_WORKSPACE_ID).toBe('intranet');
    expect(getWorkspaceId()).toBe('intranet');
  });

  it("change d'Espace et prévient les abonnés", () => {
    const listener = vi.fn();
    subscribeWorkspaceId(listener);
    setWorkspaceIdInStore('extranet');
    expect(getWorkspaceId()).toBe('extranet');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('ignore un Espace inconnu ou déjà actif', () => {
    const listener = vi.fn();
    subscribeWorkspaceId(listener);
    setWorkspaceIdInStore('inconnu' as WorkspaceId);
    setWorkspaceIdInStore('intranet');
    expect(getWorkspaceId()).toBe('intranet');
    expect(listener).not.toHaveBeenCalled();
  });

  it('un abonné désabonné ne reçoit plus rien', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeWorkspaceId(listener);
    unsubscribe();
    setWorkspaceIdInStore('extranet');
    expect(listener).not.toHaveBeenCalled();
  });
});

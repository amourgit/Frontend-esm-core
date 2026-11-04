import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import WorkspaceSelectorMenu from './workspace-selector-menu.extension';
import {
  getWorkspaceId,
  resetWorkspaceStore,
  setWorkspaceIdInStore,
} from '../../intranet-topbar/context/workspaceStore';

// Doublures simples du MorphSelect : on teste la logique de l'extension, pas le composant du framework.
vi.mock('@egen-civitas/esm-framework', () => ({
  MorphSelect: ({ value, onValueChange, children }: any) => (
    <div data-testid="select" data-value={value}>
      {React.Children.map(children, (child: any) =>
        child?.type?.displayName === 'Content' ? React.cloneElement(child, { onValueChange }) : child,
      )}
    </div>
  ),
  MorphSelectTrigger: ({ children }: any) => <div>{children}</div>,
  MorphSelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  MorphSelectContent: Object.assign(
    ({ children, onValueChange }: any) => (
      <ul>
        {React.Children.map(children, (item: any) =>
          React.cloneElement(item, { onPick: () => onValueChange(item.props.value) }),
        )}
      </ul>
    ),
    { displayName: 'Content' },
  ),
  MorphSelectItem: ({ label, onPick }: any) => (
    <li>
      <button type="button" onClick={onPick}>
        {label}
      </button>
    </li>
  ),
}));
vi.mock('../../intranet-topbar/utils/xboxAudio', () => ({ playXboxSound: vi.fn() }));

afterEach(resetWorkspaceStore);

describe('WorkspaceSelectorMenu', () => {
  it("affiche l'Espace actif et la liste des Espaces", () => {
    render(<WorkspaceSelectorMenu />);
    expect(screen.getByTestId('select')).toHaveAttribute('data-value', 'intranet');
    expect(screen.getByRole('button', { name: 'Intranet' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Extranet' })).toBeInTheDocument();
  });

  it("change l'Espace dans le store partagé puis referme le panneau", () => {
    const closeMenu = vi.fn();
    render(<WorkspaceSelectorMenu closeMenu={closeMenu} />);
    fireEvent.click(screen.getByRole('button', { name: 'Extranet' }));
    expect(getWorkspaceId()).toBe('extranet');
    expect(closeMenu).toHaveBeenCalledTimes(1);
  });

  it("ne referme pas le panneau quand on re-choisit l'Espace déjà actif", () => {
    const closeMenu = vi.fn();
    render(<WorkspaceSelectorMenu closeMenu={closeMenu} />);
    fireEvent.click(screen.getByRole('button', { name: 'Intranet' }));
    expect(closeMenu).not.toHaveBeenCalled();
  });

  it("suit un changement d'Espace fait ailleurs (la TopBar)", () => {
    render(<WorkspaceSelectorMenu />);
    act(() => setWorkspaceIdInStore('extranet'));
    expect(screen.getByTestId('select')).toHaveAttribute('data-value', 'extranet');
  });
});

import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { TopBarMenuPanel } from './TopBarMenuPanel';

const panelProps = vi.hoisted(() => ({ last: {} as Record<string, unknown> }));

vi.mock('@egen-civitas/esm-framework', () => ({
  MenuToggleButton: ({ isOpen, onToggle, className }: any) => (
    <button type="button" className={className} aria-expanded={isOpen} onClick={onToggle}>
      toggle
    </button>
  ),
  StaggeredMenuPanel: (props: any) => {
    panelProps.last = props;
    return (
      <aside data-testid="panel" data-open={props.isOpen} data-position={props.position}>
        <button type="button" onClick={props.onClose}>
          fermer
        </button>
      </aside>
    );
  },
}));

describe('TopBarMenuPanel', () => {
  it('ouvre le panneau à droite depuis le bouton, et le referme par son bouton de fermeture', () => {
    render(<TopBarMenuPanel />);
    const panel = screen.getByTestId('panel');
    expect(panel).toHaveAttribute('data-position', 'right');
    expect(panel).toHaveAttribute('data-open', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
    expect(panel).toHaveAttribute('data-open', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'fermer' }));
    expect(panel).toHaveAttribute('data-open', 'false');
  });

  it('se referme avec Échap, mais pas avec une autre touche', () => {
    render(<TopBarMenuPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(screen.getByTestId('panel')).toHaveAttribute('data-open', 'true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByTestId('panel')).toHaveAttribute('data-open', 'false');
  });

  it('monte le panneau dans document.body (portail), hors de la TopBar', () => {
    const { container } = render(<TopBarMenuPanel />);
    expect(within(container).queryByTestId('panel')).not.toBeInTheDocument();
    expect(within(document.body).getByTestId('panel')).toBeInTheDocument();
  });

  it("restaure l'animation de couleurs d'ouverture, comme la vitrine des composants", () => {
    render(<TopBarMenuPanel />);
    expect(panelProps.last.colors).toEqual(['var(--colors-secondary-300)', 'var(--colors-primary-600)']);
    expect(panelProps.last.accentColor).toBe('var(--colors-primary-600)');
  });

  it('active le clic à côté et transmet la classe au bouton', () => {
    render(<TopBarMenuPanel className="hidden" />);
    expect(panelProps.last.closeOnClickAway).toBe(true);
    expect(screen.getByRole('button', { name: 'toggle' })).toHaveClass('hidden');
  });
});

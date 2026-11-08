import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useSession } from '@egen-civitas/esm-framework';
import UserPanel from './user-panel.component';

describe('UserPanel', () => {
  it("affiche le nom de la personne de la session", () => {
    vi.mocked(useSession).mockReturnValue({ user: { person: { display: 'Awa Ndong' } } } as never);
    render(<UserPanel />);

    expect(screen.getByText('Awa Ndong')).toBeInTheDocument();
  });

  it('ne plante pas sans session', () => {
    vi.mocked(useSession).mockReturnValue(null as never);
    render(<UserPanel />);

    expect(screen.getByLabelText('User')).toBeInTheDocument();
  });
});

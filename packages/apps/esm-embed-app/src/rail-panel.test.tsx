import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@egen-civitas/esm-framework', async () => {
  const react = await import('react');
  return {
    ComponentContext: react.createContext({ moduleName: 'm', featureName: 'f' }),
    getExtensionRegistration: vi.fn(),
    SectionNavPanel: ({ section }: { section: string }) => <div data-testid="section-nav">{section}</div>,
  };
});

import { ComponentContext, getExtensionRegistration } from '@egen-civitas/esm-framework';
import RailPanel from './rail-panel.component';

function renderWith(meta: unknown, withExt = true) {
  vi.mocked(getExtensionRegistration).mockReturnValue(meta === undefined ? undefined : ({ meta } as never));
  return render(
    <ComponentContext.Provider value={{ moduleName: 'm', featureName: 'f', ...(withExt ? { extension: { extensionId: 'rail-1', extensionSlotName: 's', extensionSlotModuleName: 'sm' } } : {}) }}>
      <RailPanel />
    </ComponentContext.Provider>,
  );
}

describe('RailPanel', () => {
  it('affiche les sous-options de la section déclarée dans la meta de sa propre extension', () => {
    renderWith({ section: 'studio', title: 'Studio' });
    expect(screen.getByTestId('section-nav')).toHaveTextContent('studio');
  });
  it('sans section, sans enregistrement ou hors extension : rien', () => {
    expect(renderWith({ title: 'x' }).container).toBeEmptyDOMElement();
    expect(renderWith(undefined).container).toBeEmptyDOMElement();
    expect(renderWith({ section: 'studio' }, false).container).toBeEmptyDOMElement();
  });
});

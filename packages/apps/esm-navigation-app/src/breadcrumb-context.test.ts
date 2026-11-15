import { describe, expect, it } from 'vitest';
import { EMPTY_BREADCRUMB_CONTEXT, selectBreadcrumbContext, type BreadcrumbContextState } from './breadcrumb-context';

const published: BreadcrumbContextState = {
  pathname: '/annuaire/42/details',
  crumbs: [{ key: 'collab-42', label: 'Awa Ndong', copyText: '42' }],
  entryTitle: 'Détails',
};

describe('selectBreadcrumbContext', () => {
  it('retourne le contexte publié pour la page affichée (barre finale ignorée)', () => {
    expect(selectBreadcrumbContext(published, '/annuaire/42/details')).toBe(published);
    expect(selectBreadcrumbContext(published, '/annuaire/42/details/')).toBe(published);
  });

  it("ignore un contexte publié par une autre page : pas de maillon périmé pendant une navigation", () => {
    expect(selectBreadcrumbContext(published, '/home')).toBe(EMPTY_BREADCRUMB_CONTEXT);
    expect(selectBreadcrumbContext(published, '/annuaire/43/details')).toBe(EMPTY_BREADCRUMB_CONTEXT);
  });

  it("rien de publié : contexte vide", () => {
    expect(selectBreadcrumbContext(EMPTY_BREADCRUMB_CONTEXT, '/home')).toBe(EMPTY_BREADCRUMB_CONTEXT);
  });
});

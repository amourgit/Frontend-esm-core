import { describe, it, expect, vi, beforeEach } from 'vitest';
import { navigateTool, clickElementTool, fillFieldTool } from './index';
import { registerUIAction, _clearUIActionRegistry } from '../ui-actions';

const mockNavigate = vi.fn();

vi.mock('@egen/esm-navigation', () => ({
  navigate: (...args: unknown[]) => mockNavigate(...args),
}));

vi.mock('@egen/esm-styleguide/src/public', () => ({
  showNotification: vi.fn(),
  showSnackbar: vi.fn(),
  showModal: vi.fn(),
}));

vi.mock('@egen/esm-api', () => ({
  egenFetch: vi.fn(),
}));

describe('navigateTool', () => {
  it('préfixe une route logique avec ${egenSpaBase} pour déclencher une vraie navigation SPA', async () => {
    mockNavigate.mockClear();

    await navigateTool.execute({ args: { route: '/login' } } as any);

    expect(mockNavigate).toHaveBeenCalledWith({ to: '${egenSpaBase}/login' });
  });

  it('ne double pas le préfixe si le LLM le fournit déjà', async () => {
    mockNavigate.mockClear();

    await navigateTool.execute({ args: { route: '${egenSpaBase}/home' } } as any);

    expect(mockNavigate).toHaveBeenCalledWith({ to: '${egenSpaBase}/home' });
  });

  it('laisse une URL absolue inchangée', async () => {
    mockNavigate.mockClear();

    await navigateTool.execute({ args: { route: 'https://example.com/page' } } as any);

    expect(mockNavigate).toHaveBeenCalledWith({ to: 'https://example.com/page' });
  });
});

describe('clickElementTool', () => {
  beforeEach(() => {
    _clearUIActionRegistry();
    document.body.innerHTML = '';
  });

  it('clique sur un élément enregistré et visible', async () => {
    const button = document.createElement('button');
    document.body.appendChild(button);
    let clicked = false;
    button.addEventListener('click', () => (clicked = true));
    registerUIAction({ id: 'submit-btn', kind: 'click', label: 'Valider', description: '...' }, button);

    const result = await clickElementTool.execute({ args: { actionId: 'submit-btn' } } as any);

    expect(clicked).toBe(true);
    expect(result.success).toBe(true);
  });

  it("échoue proprement si l'id ne correspond à rien de visible — jamais deviné", async () => {
    const result = await clickElementTool.execute({ args: { actionId: 'inexistant' } } as any);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/inexistant/);
  });
});

describe('fillFieldTool', () => {
  beforeEach(() => {
    _clearUIActionRegistry();
    document.body.innerHTML = '';
  });

  it('renseigne la valeur d’un champ enregistré et déclenche son évènement input', async () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    let changedValue = '';
    input.addEventListener('input', (e) => (changedValue = (e.target as HTMLInputElement).value));
    registerUIAction({ id: 'new-password', kind: 'fill', label: 'Nouveau mot de passe', description: '...' }, input);

    const result = await fillFieldTool.execute({ args: { actionId: 'new-password', value: 'S3cret!' } } as any);

    expect(result.success).toBe(true);
    expect(input.value).toBe('S3cret!');
    expect(changedValue).toBe('S3cret!');
  });

  it("échoue proprement si l'élément n'est pas un champ de formulaire", async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    registerUIAction({ id: 'not-a-field', kind: 'fill', label: '...', description: '...' }, div);

    const result = await fillFieldTool.execute({ args: { actionId: 'not-a-field', value: 'x' } } as any);

    expect(result.success).toBe(false);
  });
});

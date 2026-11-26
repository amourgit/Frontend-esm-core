import { afterEach, describe, expect, it } from 'vitest';
import { confirmDialog } from './confirm';

afterEach(() => document.body.replaceChildren());
const buttons = () => Array.from(document.querySelectorAll<HTMLButtonElement>('dialog[data-egen-embed-confirm] button'));

describe('confirmDialog', () => {
  it('Confirmer → true, le dialogue est retiré du DOM', async () => {
    const p = confirmDialog({ title: 'Supprimer ?', message: 'Irréversible' });
    expect(document.querySelector('dialog')).not.toBeNull();
    expect(document.body).toHaveTextContent('Supprimer ?');
    buttons().find((b) => b.textContent === 'Confirmer')!.click();
    await expect(p).resolves.toBe(true);
    expect(document.querySelector('dialog')).toBeNull();
  });
  it('Annuler → false', async () => {
    const p = confirmDialog({ title: 't', message: 'm', danger: true });
    buttons().find((b) => b.textContent === 'Annuler')!.click();
    await expect(p).resolves.toBe(false);
  });
  it('Échap (cancel) → false', async () => {
    const p = confirmDialog({ title: 't', message: 'm' });
    const d = document.querySelector('dialog')!;
    d.dispatchEvent(new Event('cancel'));
    d.dispatchEvent(new Event('close'));
    await expect(p).resolves.toBe(false);
  });
  it('le texte d’une app tierce n’est jamais interprété comme du HTML', async () => {
    const p = confirmDialog({ title: '<img src=x onerror=alert(1)>', message: '<script>alert(2)</script>' });
    expect(document.querySelector('dialog img')).toBeNull();
    expect(document.querySelector('dialog script')).toBeNull();
    expect(document.querySelector('dialog')).toHaveTextContent('<script>alert(2)</script>');
    buttons()[0].click();
    await p;
  });
});

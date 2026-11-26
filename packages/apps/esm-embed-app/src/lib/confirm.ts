/**
 * Dialogue de confirmation du Core, sans dépendance : élément natif `<dialog>` (focus piégé, Échap, accessibilité gérés par le navigateur),
 * couleurs système (`Canvas`, `CanvasText`) donc cohérent en clair comme en sombre sans dépendre des jetons du design system.
 * Le texte est inséré en `textContent` : aucun HTML d'une app tierce n'est jamais interprété.
 */
export function confirmDialog(d: { title: string; message: string; danger?: boolean }, doc: Document = document): Promise<boolean> {
  return new Promise((resolve) => {
    const dialog = doc.createElement('dialog');
    dialog.setAttribute('aria-labelledby', 'egen-embed-confirm-title');
    dialog.setAttribute('data-egen-embed-confirm', '');
    dialog.style.cssText = 'max-width:28rem;padding:1.25rem;border:1px solid GrayText;border-radius:.5rem;color:CanvasText;background:Canvas';
    const title = doc.createElement('h2');
    title.id = 'egen-embed-confirm-title';
    title.textContent = d.title;
    title.style.cssText = 'margin:0 0 .5rem;font-size:1.05rem';
    const msg = doc.createElement('p');
    msg.textContent = d.message;
    msg.style.cssText = 'margin:0 0 1rem;white-space:pre-wrap';
    const row = doc.createElement('div');
    row.style.cssText = 'display:flex;gap:.5rem;justify-content:flex-end';
    const cancel = doc.createElement('button');
    cancel.type = 'button';
    cancel.textContent = 'Annuler';
    const ok = doc.createElement('button');
    ok.type = 'button';
    ok.textContent = 'Confirmer';
    if (d.danger) ok.style.cssText = 'color:#b00020;font-weight:600';
    row.append(cancel, ok);
    dialog.append(title, msg, row);

    let result = false;
    const finish = (value: boolean) => {
      result = value;
      if (dialog.open) dialog.close();
      else dialog.dispatchEvent(new Event('close'));
    };
    cancel.addEventListener('click', () => finish(false));
    ok.addEventListener('click', () => finish(true));
    dialog.addEventListener('cancel', () => (result = false)); // Échap
    dialog.addEventListener('close', () => {
      dialog.remove();
      resolve(result);
    });
    doc.body.appendChild(dialog);
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    (d.danger ? cancel : ok).focus();
  });
}

// Élément racine du Studio : TOUT le thème édité (variables CSS, classe `dark`) est appliqué ici,
// jamais sur <html>, pour ne pas contaminer le shell EGEN.
let root: HTMLElement | null = null;
export const setThemeRoot = (el: HTMLElement | null) => {
  root = el;
};
export const getThemeRoot = (): HTMLElement => root ?? document.documentElement;

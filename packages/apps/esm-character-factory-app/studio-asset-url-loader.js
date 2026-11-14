// Le code hérité de CharacterStudio référence des assets par des chaînes relatives à la racine du site
// ("./assets/icons/x.svg", "./hdr/y.hdr", "/assets/media/z.png"…). Dans le shell EGEN, ces chemins
// seraient résolus contre l'URL de la page et non contre l'application. On les réécrit au build vers
// la base d'assets de l'app (import.meta.env.VITE_ASSET_PATH, résolu à l'exécution), sans modifier
// les sources héritées (synchronisation upstream facilitée).
const DIRS = 'assets|hdr|ui|3d|textures|ktx2|fonts|sound|icons|lora-assets|thumbnail-assets|sprite-atlas-assets';
const RE = new RegExp(`(['"])\\.?\\/((?:${DIRS})\\/[^'"\\n]*)\\1`, 'g');

module.exports = function studioAssetUrlLoader(source) {
  return source.replace(RE, (_m, q, rest, offset, whole) => {
    const expr = `(import.meta.env.VITE_ASSET_PATH + ${q}/${rest}${q})`;
    // Attribut JSX (src='...') : l'expression doit être entre accolades
    return whole[offset - 1] === '=' && whole[offset - 2] !== '=' && /[A-Za-z]/.test(whole[offset - 2] || '')
      ? `{${expr}}`
      : expr;
  });
};

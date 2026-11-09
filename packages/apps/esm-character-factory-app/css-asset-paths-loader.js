// Les CSS hérités de CharacterStudio référencent des assets via `url(./ui/...)`, `url(./assets/...)`…
// qui, sous Vite, pointaient vers le dossier public/. On les réécrit en chemin relatif vers
// src/public pour que rspack les résolve et les embarque (indépendant de l'URL du shell).
// Les références mortes (fichier absent d'origine) sont laissées telles quelles, comme sous Vite.
const fs = require('fs');
const path = require('path');

// Pixel transparent : même rendu qu'une image 404 sous Vite, sans casser le build.
const DEAD_REF = 'url("data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==")';

module.exports = function cssAssetPathsLoader(source) {
  const publicDir = path.resolve(__dirname, 'src/public');
  const cssDir = path.dirname(this.resourcePath);
  return source.replace(
    /url\(\s*(['"]?)\.?\/?((?:ui|assets|fonts|textures|hdr|icons|3d|sound)\/[^'")]+)\1\s*\)/g,
    (match, q, file) => {
      if (!fs.existsSync(path.join(publicDir, file))) return DEAD_REF;
      const rel = path.relative(cssDir, path.join(publicDir, file)).split(path.sep).join('/');
      return `url(${q}${rel}${q})`;
    },
  );
};

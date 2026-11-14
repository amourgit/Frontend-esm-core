const path = require('path');
const { DefinePlugin, CopyRspackPlugin, ProvidePlugin } = require('@rspack/core');
const baseConfig = require('@egen-civitas/egen/default-rspack-config');

// Adaptations propres à Character Factory, SANS modifier la config partagée du Core :
//  - le code hérité de CharacterStudio est en .jsx
//  - import.meta.env.* (Vite) est remplacé au build ; VITE_ASSET_PATH est résolu à l'exécution
//    depuis l'URL de chargement du module (publicPath 'auto') pour que les assets suivent l'app
//  - assets audio/polices en asset/resource ; assets statiques copiés dans dist/character-factory-assets
module.exports = (env, argv) => {
  const config = baseConfig(env, argv);

  config.module.rules[0].test = /\.m?(js|jsx|ts|tsx)$/;
  config.module.rules.push({ test: /\.(mp3|wav|otf|ttf|woff2?)$/i, type: 'asset/resource' });

  const studioDir = path.resolve(__dirname, 'src/studio');
  // CSS hérités : réécriture des url() vers src/public (voir css-asset-paths-loader.js)
  config.module.rules.push({
    test: /\.css$/,
    include: studioDir,
    enforce: 'pre',
    use: [{ loader: path.resolve(__dirname, 'css-asset-paths-loader.js') }],
  });
  // Les SVG référencés depuis du CSS doivent être des URLs (la règle du Core les charge en texte brut)
  config.module.rules.push({ test: /\.svg$/i, issuer: /\.css$/, type: 'asset/resource' });
  // CharacterStudio utilise zustand 3 ; le Core en utilise une autre version (framework).
  // On isole la v3 sous le nom `zustand-legacy`, aliasée uniquement pour le code de src/studio.
  config.module.rules.push({
    test: /\.m?(js|jsx|ts|tsx)$/,
    include: studioDir,
    resolve: { alias: { zustand: path.dirname(require.resolve('zustand-legacy/package.json')) } },
  });

  // Chemins d'assets relatifs hérités -> base d'assets de l'app (voir studio-asset-url-loader.js)
  config.module.rules.push({
    test: /\.m?(js|jsx)$/,
    include: studioDir,
    enforce: 'pre',
    use: [{ loader: path.resolve(__dirname, 'studio-asset-url-loader.js') }],
  });

  const viteEnv = {};
  for (const [k, v] of Object.entries(process.env)) if (k.startsWith('VITE_')) viteEnv[k] = v;

  config.resolve.alias = { ...config.resolve.alias, buffer: require.resolve('buffer/') };
  config.plugins.push(
    new DefinePlugin({
      'import.meta.env': JSON.stringify(viteEnv),
      // valorisée à l'exécution par src/asset-base.ts (chargé en premier par root.component)
      'import.meta.env.VITE_ASSET_PATH': 'globalThis.__EGEN_CHARACTER_FACTORY_ASSETS__',
    }),
    new ProvidePlugin({ Buffer: [require.resolve('buffer/'), 'Buffer'] }),
    new CopyRspackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src/public'),
          to: 'character-factory-assets',
          globOptions: { ignore: ['**/scripts/**'] },
        },
      ],
    }),
  );
  return config;
};

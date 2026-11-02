const createConfig = require('@egen-civitas/egen/default-rspack-config');

/**
 * Chemin de la build de PRODUCTION de `react-reconciler`, le moteur interne de `@react-three/fiber`
 * (R3F). On le cherche depuis R3F lui-même pour fonctionner même si le paquet n'est pas remonté
 * à la racine de node_modules.
 */
function resolveProductionReconciler() {
  try {
    const fromR3F = { paths: [require.resolve('@react-three/fiber')] };
    return require.resolve('react-reconciler/cjs/react-reconciler.production.min.js', fromR3F);
  } catch {
    return null;
  }
}

/**
 * Pourquoi cet alias ?
 *
 * React est fourni par le shell (partagé via Module Federation) et fait donc partie de SON build,
 * en production. Le code de cette app, lui, est compilé selon le mode du serveur de développement.
 * Or `react-reconciler` choisit sa build d'après NODE_ENV : en développement il charge la build
 * « development », qui lit `React.__SECRET_INTERNALS…ReactCurrentActQueue`. Cette propriété n'existe
 * que dans le React de développement ; avec le React de production du shell elle vaut `undefined` et
 * le robot 3D plante avec « Cannot read properties of undefined (reading 'current') ».
 *
 * La build de production du reconciler n'utilise pas cette propriété : elle fonctionne avec le React
 * de production comme avec celui de développement. On la force donc, quel que soit le mode.
 * (`react-reconciler/constants` n'est pas concerné : il ne dépend pas de NODE_ENV.)
 */
module.exports = (env, argv) => {
  const config = createConfig(env, argv);
  const reconciler = resolveProductionReconciler();
  if (reconciler) {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = { ...config.resolve.alias, 'react-reconciler$': reconciler };
  }
  return config;
};

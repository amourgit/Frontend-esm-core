const config = require('@egen-civitas/egen/default-rspack-config');

// Le code de l'éditeur (TweakCN, src/tweakcn) est écrit pour le runtime JSX automatique (pas d'`import React`).
// Réglage limité à cette app : les autres apps du core gardent leur configuration.
config.scriptRuleConfig.options = { jsc: { transform: { react: { runtime: 'automatic' } } } };

module.exports = config;

# Code tiers : TweakCN

Ce dossier contient l'éditeur de thèmes **TweakCN** (https://github.com/jnsahaj/tweakcn, licence Apache-2.0, voir `LICENSE`),
intégré via le fork `amourgit/Frontend-esm-tweakcn-fork`.

Le code d'origine est conservé tel quel ; seules les adaptations nécessaires à l'intégration dans le core EGEN ont été faites
(voir `docs/theme-studio/INTEGRATION-TWEAKCN.md`) : retrait de l'authentification, de la base de données, du paiement, des analytics,
de l'IA et des pages marketing ; shims `next/*` ; compatibilité React 18 (`lib/with-ref.ts`) ; thème et portails isolés
dans `.tweakcn-root`. Ce dossier est exclu du lint.

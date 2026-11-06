---
"@egen/esm-primary-navigation-app": patch
"@egen/esm-ai-assistant-app": patch
"@egen/esm-home-app": patch
"@egen/esm-annuaire-app": patch
"@egen/esm-informations-app": patch
"@egen/esm-sites-app": patch
"@egen/esm-offline-tools-app": patch
---

Slots sans numéro de niveau, sur les versions publiées du framework (`esm-framework` 3.1, `esm-extensions` 2.4, `esm-styleguide` 3.3, `esm-app-shell` 2.8.2). Les apps déclarent leurs entrées de navigation sur `topbar-nav-slot` (au lieu de `topbar-level2-nav`, toujours lu par la TopBar et par le rail pour les apps déjà déployées ; `tools/check-nav-routes.mjs` accepte les deux). `esm-ai-assistant-app` et `esm-home-app` passent des anciens slots de région (`top-nav-level2-end-slot`, `top-nav-app-slot`) aux slots officiels `topbar-l2-right-slot` / `topbar-l2-left-slot` (même région, même rendu). La TopBar importe désormais `TOPBAR_NAV_SLOT` / `TOPBAR_LEVEL2_NAV_SLOT` du framework.

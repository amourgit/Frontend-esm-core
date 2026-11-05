---
"@egen/esm-primary-navigation-app": patch
"@egen/esm-ai-assistant-app": patch
"@egen/esm-home-app": patch
---

Slots sans numéro de niveau. La TopBar lit les entrées de navigation sur `topbar-nav-slot` ET sur l'ancien `topbar-level2-nav` (les deux restent valides ; `tools/check-nav-routes.mjs` accepte les deux). `esm-ai-assistant-app` et `esm-home-app` passent des anciens slots de région (`top-nav-level2-end-slot`, `top-nav-app-slot`) aux slots officiels `topbar-l2-right-slot` / `topbar-l2-left-slot` (même région, même rendu). Les `routes.json` de navigation des autres apps ne sont pas migrés : ils le seront une fois la version du framework qui expose `TOPBAR_NAV_SLOT` publiée et embarquée dans le shell.

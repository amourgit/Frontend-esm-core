---
'@egen/esm-primary-navigation-app': patch
'@egen/esm-login-app': patch
---

Nouveau logo EGEN (mascotte) : deux variantes — logo seul et logo + « EGEN » — centralisées dans `branding/` (source unique, avec masters, dérivés web, favicon et icône PWA). La topbar niveau 1, la page de connexion, « changer le mot de passe » et le pied de page de connexion utilisent désormais ces fichiers ; l'ancien sprite SVG fourni par le framework n'est plus utilisé et les filtres `brightness(0) invert(1)` (prévus pour un logo monochrome) sont retirés.

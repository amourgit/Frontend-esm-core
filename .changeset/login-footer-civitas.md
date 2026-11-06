---
'@egen/esm-login-app': minor
---

Pied de page de la connexion : il crédite désormais CIVITAS (l'entreprise qui a créé EGEN) à la place d'EGEN (le produit). Le logo CIVITAS (nom seul, sur pastille sombre car argenté) renvoie vers https://civitas-africa.vercel.app/ (nouvel onglet, `noopener noreferrer`). Le lien « En savoir plus » vers le site d'EGEN est retiré, ainsi que les clés de traduction `builtWith` et `learnMore` ; nouvelles clés `builtBy`, `civitasLogo`, `civitasLinkLabel` (en, fr ; les autres langues retombent sur l'anglais).

Branding : ajout des logos CIVITAS dans `branding/` (master, lockup complet, nom seul), régénérables par `generate-derivatives.py` (les dérivés EGEN sont reproduits à l'identique) ; README mis à jour (EGEN = produit, CIVITAS = éditeur).

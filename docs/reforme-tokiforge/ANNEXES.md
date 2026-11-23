# Annexes

## A. Licence de TokiForge (décision prise)

- `@tokiforge/core` est sous **MIT jusqu'à la version 1.1.2** (publiée le 11/11/2025) et sous **AGPL-3.0 à partir de 1.2.0** (10/12/2025). Le dépôt amont n'affiche plus de licence claire.
- L'AGPL imposerait de publier le code de tout ce qui l'embarque, y compris pour un usage via le réseau.
- **Décision** : le projet EGEN repose sur l'**état MIT** du dépôt amont (commit `70ea8b2`, 12/11/2025). **Ne jamais fusionner de commit postérieur** ni utiliser une version ≥ 1.2.0 de `@tokiforge/*`.
- Le dépôt `egen-tokiforge` ne contient que l'historique jusqu'à ce commit (vérifié : le commit de relicenciement `ee45e492` n'y figure pas). `NOTICE` conserve les attributions (MIT TokiForge, Apache-2.0 Tweakcn pour le code porté).

## B. Migration de l'ancien contrat de variables (étape P2.4)

Mesure faite sur `main` du framework le 19/11 : **816 occurrences, 134 variables distinctes, 42 fichiers** hors `esm-theme`. **À refaire au début de P2** (le framework évolue).

| Classe | Part | Traitement décidé |
|---|---|---|
| A — équivalent direct ou dérivé : `colors-surface-foreground`→`foreground`, `colors-surface-background`→`background`, `colors-surface-card`→`card`, `colors-surface-muted(-foreground)`→`muted(-foreground)`, `colors-surface-accent`→`accent`, `colors-border-default`→`border`, `colors-border-input`→`input`, `colors-border-ring`→`ring`, `colors-on-primary`→`primary-foreground`, `colors-primary-500`→`primary`, `border-radius-*`→dérivés de `--radius`, `shadows-*`→ombres Tweakcn (`--shadow-*`), `typography-font-family-sans`→`font-sans` | 51 % | remplacement par règles |
| B — `colors-error-*` | 4 % | → `destructive` (nuances dérivées) |
| C — échelles `primary-50…950`, `neutral-50…950` | 14 % | **calculées** par `color-mix` depuis les clés du thème (`neutral` depuis `background`/`foreground`) |
| E — constantes : typographie (tailles, graisses), transitions, animations, z-index | 16 % | sorties du thème dynamique, déclarées **une fois** dans le preset Tailwind |
| D — verre/translucide/panneaux (`surface-translucent*`, `panel-*`) | 8 % | **supprimés** (décision du 22/11) |
| D — `success` / `warning` / `info` | 3 % | **constantes statiques** du preset, hors thème dynamique (D2, acceptée) |
| F — divers (`surface-overlay`, `skeleton`, `secondary-*`) | 1 % | cas par cas, à questionner si ambigu |

Classes Tailwind à échelle (`bg-primary-500`, `text-neutral-950`…) : 13 occurrences dans 4 fichiers (mesure du 19/11) : mêmes règles.
Le mode sombre passe de l'attribut `data-theme` (ancien moteur, utilisé par `esm-login-app`) à la **classe `.dark`** (runtime TokiForge).

## C. Conventions des documents d'état

Modèle repris du Kernel (`Civitas-EGEN-Kernel`, `docs/00-etat-et-reprise.md`) : un seul document porte le statut ; chaque fin de travail rappelle ce qui est **vérifié ici** et ce qui **ne l'est pas** ;
chaque incohérence rencontrée est inscrite au registre avec sa gravité ; les vérifications non faites sont consignées (qui peut les faire, résultat attendu).
Voir `SUIVI.md` §9 et §10.

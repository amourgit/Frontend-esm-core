# @egen/esm-quick-access-app

App **Accès rapide** : elle possède le panneau des raccourcis / informations rapides et son option dans le **rail droit** (zone droite du plan de travail), visible quelle que soit l'app active — comme `esm-notifications-app` et `esm-settings-app`.

| Élément | Rôle |
|---|---|
| Extension `quick-access` (`shell-rail-right-slot`) | Bouton du rail droit (icône `Zap`) ; son composant est le contenu de la zone droite |
| Slot `quick-access-section-slot` | Contrat public : chaque app y injecte sa propre section d'accès rapide |
| Sections `quick-access-shortcuts`, `quick-access-glance` | Sections par défaut (raccourcis configurables, date/heure et état de connexion) |

Les raccourcis se surchargent via la config EGEN (clé `shortcuts` du module `@egen-civitas/esm-quick-access-app`).

Une app qui a du contenu à acces rapide n'édite jamais cette app : elle déclare une extension dans son propre `routes.json`, et c'est elle qui implémente sa section :

```json
{ "name": "mon-app-acces-rapide", "slot": "quick-access-section-slot", "component": "maSection", "order": 50 }
```

# @egen/esm-settings-app

App **Paramètres** : elle possède le panneau des paramètres et son option dans le **rail droit** (zone droite du plan de travail), visible quelle que soit l'app active.

| Élément | Rôle |
|---|---|
| Extension `settings` (`shell-rail-right-slot`) | Bouton du rail droit ; son composant est le contenu de la zone droite |
| Slot `global-settings-slot` | Contrat public : chaque app y injecte sa propre section de paramètres |
| Sections `settings-appearance`, `settings-language` | Sections par défaut (thème clair/sombre, langue) |

Une app qui a des réglages n'édite jamais cette app : elle déclare une extension dans son propre `routes.json`, et c'est elle qui implémente sa section :

```json
{ "name": "mon-app-parametres", "slot": "global-settings-slot", "component": "maSection", "order": 50 }
```

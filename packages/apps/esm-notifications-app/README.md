# @egen/esm-notifications-app

App **Notifications** : elle possède toute la logique des notifications et son option dans le **rail droit** (zone droite du plan de travail), visible quelle que soit l'app active.

| Élément | Rôle |
|---|---|
| Extension `notifications` (`shell-rail-right-slot`) | Bouton du rail droit ; son composant est le contenu de la zone droite |
| Slot `notifications-nav-menu-slot` | Contrat public : les autres apps y injectent leurs entrées de notification |
| Page `root` (permanente, sans rendu) | Publie la pastille du bouton (`setToolWindowBadge`) = nombre d'entrées du slot |

Une app qui produit des notifications n'édite jamais cette app : elle déclare simplement une extension dans son propre `routes.json` :

```json
{ "name": "mon-app-notification", "slot": "notifications-nav-menu-slot", "component": "maNotification" }
```

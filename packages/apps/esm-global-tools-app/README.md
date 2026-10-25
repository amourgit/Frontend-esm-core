# @egen/esm-global-tools-app

Outils **globaux** du shell, portés par le **rail droit** et affichés dans la **zone droite** (plan de travail façon IntelliJ). Ils sont visibles quelle que soit l'app active.

| Fenêtre d'outils | Extension (rail droit)  | Contenu de la zone                                                       |
|------------------|-------------------------|---------------------------------------------------------------------------|
| Notifications    | `global-notifications`  | slot `notifications-nav-menu-slot` (+ pastille = nombre d'entrées)        |
| Paramètres       | `global-settings`       | slot `global-settings-slot` (sections : Apparence, Langue, + celles des apps) |

## Principe (valable pour toutes les apps)

Une option de rail est une **extension** dont le `meta` (`ToolWindowMeta`) décrit le bouton et dont le composant est le contenu de la zone :

```json
{
  "name": "mon-outil",
  "slot": "shell-rail-right-slot",
  "component": "monPanneau",
  "meta": { "title": "Mon outil", "titleKey": "monOutil", "icon": "Bell", "order": 50 }
}
```

- `shell-rail-left-slot` → zone gauche (sidebar de l'app), `shell-rail-bottom-slot` → zone basse, `shell-rail-right-slot` → zone droite (global).
- Compteur sur le bouton : `setToolWindowBadge('mon-outil', 3)` (retiré avec `null` / `0`).
- Ajouter une section aux Paramètres : extension dans le slot `global-settings-slot` (`order` pour la place).

## Racine permanente

La page `root` est montée sur toutes les routes authentifiées (comme la TopBar et le footer) ; elle ne dessine rien et publie la pastille Notifications, même panneau fermé.

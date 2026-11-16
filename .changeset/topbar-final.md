---
'@egen/esm-primary-navigation-app': major
---

Fin de la réforme : la TopBar est un squelette neutre. Le registre d'éléments du kit (`registerTopBarItem`, `TopBarItem`, `useTopBarItems`, `hideOnSearch`, `visibleFrom`) est supprimé : tout ce qui s'affiche est une extension d'app du slot `topbar-slot`, placée par `meta.topbar`. Le module de sons d'interface (`xboxAudio.ts`, 822 lignes) et le son d'ouverture des panneaux disparaissent. Les règles `only` / `hide` / `hideGlobal` du layout-store portent désormais uniquement sur les noms d'extensions. Dépendances inutilisées retirées (`lucide-react`, `motion`, `@carbon/react`).

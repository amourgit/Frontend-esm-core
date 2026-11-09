# @egen/esm-branding-app

Identité de l'entreprise qui déploie la solution : logo, nom, description. C'est l'app qui **injecte ces éléments dans
la TopBar** ; la TopBar elle-même ne contient ni logo ni nom d'entreprise.

À ne pas confondre avec les **préférences utilisateur** (langue, thème…) : ici, ce que l'*entreprise* renseigne.

## Principe

La TopBar est un squelette neutre : des niveaux que les apps déclarent, des régions (`left`, `center`, `right`, `background`) et un seul slot
d'extension (`topbar-slot`). Elle ne sait pas ce qu'on y monte. Cette app attache simplement une extension
au slot et déclare son niveau et son emplacement dans `meta.topbar` ; changer d'endroit, de logo ou de nom n'a jamais besoin de modifier la TopBar.

| Extension | Slot par défaut | Contenu |
| --- | --- | --- |
| `brand-logo` | `topbar-slot` — `meta.topbar` : niveau `main`, région `left`, ordre 0 (globale) | Logo de l'entreprise, cliquable |

`meta.global: true` : le logo est présent quelle que soit l'app active.

## Configuration

Clé de config : `@egen-civitas/esm-branding-app`.

| Clé | Défaut | Rôle |
| --- | --- | --- |
| `organization.name` | `EGEN` | Nom de l'entreprise (infobulle et texte alternatif) |
| `organization.description` | `Écosystème Gouvernemental de l’Économie Numérique` | Slogan, après le nom dans l'infobulle ; vide : le nom seul |
| `logo.src` | *(vide)* | Chemin, URL ou `data:` du logo ; vide : logo EGEN fourni (`branding/`) |
| `logo.alt` | *(vide)* | Texte alternatif ; vide : nom + description |
| `logo.link` | `${egenSpaBase}/home` | Destination du clic ; vide : logo non cliquable |
| `logo.height` | `44` | Hauteur en px dès 640 px de large (16 à 96) |
| `logo.compactHeight` | `36` | Hauteur en px sous 640 px de large (16 à 96) |

```json
{
  "@egen-civitas/esm-branding-app": {
    "organization": { "name": "Acme", "description": "Gouvernance numérique" },
    "logo": { "src": "https://cdn.acme.org/logo.svg", "link": "${egenSpaBase}/home", "height": 48 }
  }
}
```

**À chaud** : le composant lit sa config par `useConfig`, qui est réactif. Modifier ces valeurs (config du déploiement,
éditeur de config des implementer tools) met le logo à jour sans recharger la page.

## Changer l'endroit

Le logo n'est pas figé à gauche : c'est le choix par défaut de cette app (`routes.json`). Pour le placer ailleurs (centre,
droite, un autre niveau), modifier `meta.topbar` de l'extension `brand-logo` dans `routes.json` (niveau, région, ordre, ou `before` / `after` une autre extension), ou utiliser la configuration
d'extensions du framework (`extensionSlots`, `add` / `remove` / `order`). La TopBar n'est jamais modifiée.

## Ajouter d'autres éléments d'identité

Chaque élément de la TopBar relevant de l'identité (nom affiché, slogan, pied de page…) devient une extension de cette
app, avec sa propre entrée dans `routes.json` et les clés de config nécessaires.

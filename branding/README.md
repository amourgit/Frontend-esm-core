# Branding EGEN — source unique des logos

Ce dossier est **l'unique endroit** où vivent les logos du projet. Le framework
(`Frontend-esm-framework`) est générique et neutre : il ne contient aucun logo
ni aucune identité visuelle, il les reçoit d'ici.

## Les deux variantes

| Variante | Fichier | Usage |
| --- | --- | --- |
| **Logo seul** (mascotte) | `egen-logo-icon.png` (256 × 256) | favicon, icône PWA, avatar, emplacements carrés ou très petits |
| **Logo + « EGEN »** | `egen-logo-full.png` (640 × 260) | topbar, page de connexion, pied de page, en-têtes |

Les deux sont en PNG RGBA (fond transparent) et lisibles sur fond clair comme sombre.
**Ne pas leur appliquer de filtre CSS** (`brightness(0) invert(1)` etc.) : ce sont des
logos en couleurs.

## Arborescence

```
branding/
├── source/                       Originaux (masters) — NE JAMAIS importer dans une app
│   ├── egen-logo-icon-master.png     500 × 500
│   └── egen-logo-full-master.png     1983 × 793
├── egen-logo-icon.png            Version web du logo seul   (dérivée du master)
├── egen-logo-full.png            Version web du logo complet (dérivée du master)
├── generate-derivatives.py       Régénère les 4 dérivés depuis les masters
└── shell/                        Surcouche fournie à l'app-shell du framework
    ├── favicon.ico                   16/32/48/64 px — LOGO SEUL
    └── icon-512.png                  icône PWA 512 px — LOGO SEUL
```

Les masters sont volumineux (1,2 Mo pour le logo complet) : ils sont conservés pour
régénérer les dérivés, mais ne doivent pas finir dans un bundle.

## Utiliser un logo dans une app du core

Chaque app qui affiche un logo a un petit module `src/brand.ts` qui ré-exporte les
fichiers de ce dossier. Importer **toujours** depuis ce module, jamais le PNG
directement, et ne jamais en copier un dans une app :

```ts
import { egenLogoFull, egenLogoIcon } from '../brand'; // chemin relatif au fichier

<img src={egenLogoFull} alt="EGEN" className="h-11 w-auto" />
```

Apps concernées aujourd'hui : `esm-primary-navigation-app` (les deux variantes) et
`esm-login-app` (logo complet uniquement). Pour en ajouter une, créer son `src/brand.ts`
en ne ré-exportant **que les variantes utilisées** (chaque import est embarqué dans le
bundle de l'app). Le chemin relatif vers `branding/` est toujours `../../../../branding/`
depuis `packages/apps/<app>/src/`. L'app doit aussi déclarer `*.png` dans son
`src/declarations.d.ts`.

## Favicon et icône PWA (app-shell du framework)

L'app-shell ne connaît aucune identité : il livre un favicon et une icône **neutres**
par défaut. Le core les remplace en pointant `EGEN_BRAND_DIR` vers `branding/shell`
(déjà fait dans `.env.development` et `example.env`). Les fichiers de ce dossier
doivent garder exactement ces noms : `favicon.ico` et `icon-512.png`.

> Nécessite `@egen-civitas/egen` et `@egen-civitas/esm-app-shell` dans une version
> qui supporte `EGEN_BRAND_DIR`. Avec une version plus ancienne, la variable est
> simplement ignorée (aucun effet, aucune erreur).

## Régénérer les dérivés

`python3 branding/generate-derivatives.py` (Pillow + numpy). Les dérivés se recalculent
depuis les masters : recadrage sur le contenu réel,
suppression du voile alpha résiduel du détourage, redimensionnement (alpha
prémultiplié), puis export. Si un master change, régénérer **les quatre** fichiers
(`egen-logo-icon.png`, `egen-logo-full.png`, `shell/favicon.ico`, `shell/icon-512.png`)
pour qu'ils restent cohérents.

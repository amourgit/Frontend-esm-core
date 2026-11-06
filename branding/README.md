# Branding — source unique des logos (EGEN, produit · CIVITAS, éditeur)

Ce dossier est **l'unique endroit** où vivent les logos du projet. Le framework
(`Frontend-esm-framework`) est générique et neutre : il ne contient aucun logo
ni aucune identité visuelle, il les reçoit d'ici.

## Deux marques : qui est qui

- **EGEN** est le **produit** (la plateforme). Son logo est celui des écrans de l'application
  (topbar, page de connexion).
- **CIVITAS** est l'**entreprise qui l'a créé**. Son logo est celui des mentions d'éditeur
  (pied de page de la connexion, avec le lien vers <https://civitas-africa.vercel.app/>).

Ne pas les confondre : un crédit « créé par » montre CIVITAS, jamais EGEN.

## Les variantes EGEN

| Variante | Fichier | Usage |
| --- | --- | --- |
| **Logo seul** (mascotte) | `egen-logo-icon.png` (256 × 256) | favicon, icône PWA, avatar, emplacements carrés ou très petits |
| **Logo + « EGEN »** | `egen-logo-full.png` (640 × 260) | topbar, page de connexion, en-têtes |

Les deux sont en PNG RGBA (fond transparent) et lisibles sur fond clair comme sombre.
**Ne pas leur appliquer de filtre CSS** (`brightness(0) invert(1)` etc.) : ce sont des
logos en couleurs.

## Les variantes CIVITAS

| Variante | Fichier | Usage |
| --- | --- | --- |
| **Lockup complet** (tête + « CIVITAS » + signature) | `civitas-logo-full.png` (392 × 422) | emplacements hauts : page de présentation, document, écran d'accueil |
| **Nom seul** « CIVITAS » | `civitas-logo-wordmark.png` (374 × 67) | emplacements bas et larges : pied de page, signature |

Le lockup est **vertical** : réduit à la hauteur d'un pied de page, le nom y devient illisible ;
c'est pourquoi le nom seul existe (il en est la 2e bande, extraite telle quelle, sans retouche).
Les masters ne font que 500 px : les dérivés gardent cette résolution (aucun agrandissement).

**Le logo CIVITAS est argenté/blanc** : lisible sur fond sombre, très pâle sur fond clair. Toujours
le poser sur un **fond sombre** (pastille, bandeau), jamais directement sur un fond clair ni avec un
filtre CSS. Voir le pied de page de la connexion.

## Arborescence

```
branding/
├── source/                       Originaux (masters) — NE JAMAIS importer dans une app
│   ├── egen-logo-icon-master.png     500 × 500
│   ├── egen-logo-full-master.png     1983 × 793
│   └── civitas-logo-full-master.png  500 × 500
├── egen-logo-icon.png            Version web du logo seul   (dérivée du master)
├── egen-logo-full.png            Version web du logo complet (dérivée du master)
├── civitas-logo-full.png         CIVITAS, lockup complet (dérivé du master)
├── civitas-logo-wordmark.png     CIVITAS, nom seul        (dérivé du master)
├── generate-derivatives.py       Régénère les 6 dérivés depuis les masters
└── shell/                        Surcouche fournie à l'app-shell du framework
    ├── favicon.ico                   16/32/48/64 px — LOGO SEUL
    └── icon-512.png                  icône PWA 512 px — LOGO SEUL
```

Les masters sont volumineux (1,2 Mo pour le logo EGEN complet) : ils sont conservés pour
régénérer les dérivés, mais ne doivent pas finir dans un bundle.

## Utiliser un logo dans une app du core

Chaque app qui affiche un logo a un petit module `src/brand.ts` qui ré-exporte les
fichiers de ce dossier. Importer **toujours** depuis ce module, jamais le PNG
directement, et ne jamais en copier un dans une app :

```ts
import { egenLogoFull, egenLogoIcon, civitasLogoWordmark, civitasWebsite } from '../brand'; // chemin relatif au fichier

<img src={egenLogoFull} alt="EGEN" className="h-11 w-auto" />
```

Apps concernées aujourd'hui : `esm-primary-navigation-app` (les deux variantes EGEN) et
`esm-login-app` (logo EGEN complet, et CIVITAS nom seul + `civitasWebsite` pour le pied de page). Pour en ajouter une, créer son `src/brand.ts`
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

`python3 branding/generate-derivatives.py` (Pillow + numpy ; les dérivés EGEN sont reproduits à l'identique). Les dérivés se recalculent
depuis les masters : recadrage sur le contenu réel,
suppression du voile alpha résiduel du détourage, redimensionnement (alpha
prémultiplié), puis export. Si un master change, régénérer **les quatre** fichiers
(`egen-logo-icon.png`, `egen-logo-full.png`, `shell/favicon.ico`, `shell/icon-512.png`)
pour qu'ils restent cohérents. Les deux dérivés CIVITAS (`civitas-logo-full.png`,
`civitas-logo-wordmark.png`) ne dépendent que de `source/civitas-logo-full-master.png`.

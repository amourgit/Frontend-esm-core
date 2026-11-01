# Robot assistant 3D (EGEN)

Corps complet, articulé et animable, dont la tête reprend celle de `LiveOrb`.
Cette copie vit dans l'app assistant pour fonctionner SANS attendre une nouvelle version publiée du
styleguide ; la même bibliothèque existe dans `Frontend-esm-framework`
(`esm-styleguide/src/assistant/robot`, branche `feat/assistant-robot-3d`). Quand le styleguide sera publié,
on pourra supprimer cette copie et importer depuis `@egen-civitas/esm-styleguide`.

| Fichier | Rôle |
| --- | --- |
| `skeleton.ts` | Source unique du corps : 37 articulations, parent, position, butées, repos. |
| `gestures.ts`, `clips.ts`, `hands.ts` | 17 gestes à base de poses clés, formes de main. |
| `ik.ts` | Cinématique inverse d'un bras (« mets ta main là »). |
| `controller.ts` | Décide des angles à chaque image : gestes, marche, regard, clignement, états. Sans WebGL. |
| `Robot.tsx`, `parts/` | Arbre d'articulations et une pièce de corps par articulation. |
| `RobotStage.tsx`, `lazy.tsx` | Canvas prêt à l'emploi ; version chargée à la demande. |

Exemple : `controller.play('wave')`, `await controller.walkTo(1, 0.5)`, `controller.pointAt('L', point)`.
Ajouter un geste : décrire des poses clés dans `gestures.ts` (conventions de signe en tête de `skeleton.ts`).

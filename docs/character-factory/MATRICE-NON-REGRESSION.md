# Character Factory — Matrice de non-régression (F6.3)

Objectif : prouver que le projet « fait toujours ce qu'il faisait » dans le shell EGEN.
Prérequis : personnage utilisable (voir `ASSETS-EXTERNES.md` §2.1). **Statut « À valider »** = vérification manuelle en navigateur, non réalisée à ce jour (aucun navigateur dans l'environnement de développement).

| ID | Fonction | Procédure | Résultat attendu | Couverture auto | Statut |
|---|---|---|---|---|---|
| R1 | Accueil | Ouvrir `character-factory` | Accueil affiché, 3D visible, titre « EGEN Character Factory » | `routes.test.js` (route) | À valider |
| R2 | Création | Accueil → Créer → choisir une classe | Personnage chargé, vue Apparence | — | À valider |
| R3 | Changer un vêtement | Apparence → choisir un trait | Remplacé en temps réel, sans rechargement | — | À valider |
| R4 | Accessoires | Ajouter puis retirer un accessoire | Ajouté / retiré | — | À valider |
| R5 | Couleurs | Changer une couleur de trait | Couleur appliquée | — | À valider |
| R6 | Textures | Changer une texture | Texture appliquée | — | À valider |
| R7 | Morphologie | Modifier un blendshape | Forme modifiée | — | À valider |
| R8 | Aléatoire | Bouton aléatoire | Combinaison respectant les restrictions | — | À valider |
| R9 | Aperçu 3D | Rotation, zoom | Contrôles fluides, cadre dans la zone | — | À valider |
| R10 | Animations | Lancer / changer d'animation | Animation jouée sur le personnage | — | À valider |
| R11 | Expressions / regard / clignement | Observer le personnage au repos | Clignement ; regard suit la souris dans la zone | `lifecycle.test.js` (LookAtManager) | À valider |
| R12 | Chargement d'un personnage | Accueil → Charger → fichier VRM | Personnage chargé | — | À valider |
| R13 | Sauvegarde | Enregistrer puis recharger | Avatar retrouvé | — | À valider |
| R14 | Export VRM / GLB | Télécharger | Fichier valide | — | À valider |
| R15 | Export par lot, manifestes par lot | Sous-options du rail | Vues ouvertes, export OK | — | À valider |
| R16 | Navigation shell | Rail / TopBar / grille d'apps | Bonne vue ; option active suit la vue | `routes.test.js` | À valider |
| R17 | Cohérence vue ↔ scène | Apparence → Accueil via le rail | Scène vide, pas d'avatar résiduel | `lifecycle.test.js` | À valider |
| R18 | Démontage | Quitter l'app, revenir, ×10 | Aucun avatar résiduel, musique arrêtée, 1 seul contexte WebGL (`chrome://gpu`) | `lifecycle.test.js` (audio, listeners) | À valider |
| R19 | Zone | Redimensionner, ouvrir/fermer les rails | Interface dans la zone, options du bas visibles | `layout-isolation.test.js` | À valider |
| R20 | Isolation du shell | Observer polices / scrollbars du shell | Inchangées | `layout-isolation.test.js` | À valider |
| R21 | WebGL indisponible | Désactiver l'accélération matérielle | Message clair, pas d'écran vide | `runtime-support.test.js` | À valider |
| R22 | Échec réseau | Bloquer `m3-org.github.io` | Message d'erreur / personnage non chargé sans plantage du shell | — | À valider |
| R23 | Langue | Changer la langue du shell | Textes de l'app suivent (en / fr) | — | À valider |

Règle : la phase 6 n'est « terminée » que lorsque toutes les lignes sont **Validé**. Reporter ici la date et l'auteur de chaque validation.

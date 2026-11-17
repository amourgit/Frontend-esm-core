# Réforme du projet Character et de son intégration dans l'écosystème

## 1. Changement fondamental

Le projet Character ne doit plus être considéré comme une application du Core Frontend d'EGEN.

La première approche consistait à intégrer une **Character Factory** directement dans EGEN Core, comme une application parmi les autres.

Cette approche est désormais abandonnée.

La nouvelle vision consiste à faire de **Character un projet autonome de l'écosystème**, indépendant d'EGEN, avec sa propre évolution, son propre cycle de développement et sa propre responsabilité.

EGEN pourra utiliser Character, mais Character ne sera pas une partie interne d'EGEN.

Le changement est donc fondamental :

**Avant :**

EGEN Core → Character Factory

**Après :**

Écosystème → Character

EGEN → utilise Character

---

# 2. Character devient un domaine autonome

Character doit être considéré comme le domaine spécialisé de l'écosystème consacré aux personnages numériques et à leur univers.

Son ambition dépasse largement la simple création d'un avatar.

Character doit pouvoir progressivement couvrir tout ce qui concerne :

- la création de personnages ;
- leur personnalisation ;
- leur apparence ;
- leurs modèles ;
- leurs vêtements ;
- leurs accessoires ;
- leurs expressions ;
- leurs animations ;
- leurs comportements ;
- leur identité ;
- leurs ressources ;
- leur évolution ;
- leur utilisation dans différents produits et contextes.

Mais ces possibilités ne doivent pas nécessairement être toutes présentes dès le début.

Character doit pouvoir évoluer progressivement autour de ce domaine sans que cette évolution impose des changements profonds à EGEN.

---

# 3. CharacterStudio M3-org est le point de départ, pas la définition de Character

Le choix actuel est de partir de **CharacterStudio de M3-org**, qui est un projet open source dédié à la création et à la personnalisation d'avatars 3D VRM/glTF.

Le projet possède déjà plusieurs caractéristiques particulièrement intéressantes pour cette ambition :

- création d'avatars ;
- personnalisation par assemblage d'assets ;
- utilisation de ressources personnalisées ;
- animations ;
- optimisation ;
- export ;
- fonctionnement web ;
- séparation du programme et des packs d'assets ;
- logique interne déjà partiellement séparée de l'interface ;
- licence MIT.

Cette base est donc suffisamment intéressante pour servir de **première implémentation de Character**.

Mais il faut éviter une erreur fondamentale :

> Character ne doit pas devenir « le projet M3-org ».

Character est le projet.

**M3-org CharacterStudio est le composant ou le socle actuellement choisi pour répondre à une partie des besoins de Character.**

---

# 4. M3-org CharacterStudio doit rester remplaçable

C'est l'un des principes les plus importants de la réforme.

Aujourd'hui :

**Character utilise CharacterStudio M3-org.**

Demain, si un autre projet devient plus adapté :

**Character pourra utiliser un autre concepteur ou éditeur.**

Le changement de solution ne doit pas obliger à reconstruire tout Character ni à modifier EGEN.

CharacterStudio est donc une **implémentation remplaçable**, et non une dépendance conceptuelle absolue.

Le fait de choisir M3-org aujourd'hui signifie simplement :

> « Nous avons trouvé une base open source pertinente sur laquelle construire la première génération de Character. »

Cela ne signifie pas :

> « Character sera définitivement construit autour de M3-org. »

---

# 5. Pourquoi cette séparation est importante

Le domaine du personnage peut évoluer très rapidement.

Un outil peut aujourd'hui être excellent pour :

- créer les modèles ;
- assembler les vêtements ;
- gérer les assets ;
- personnaliser les personnages.

Mais demain, un autre projet pourra offrir :

- une meilleure qualité ;
- une meilleure personnalisation ;
- un meilleur système de morphologie ;
- de meilleurs outils artistiques ;
- une meilleure compatibilité ;
- une meilleure optimisation ;
- de nouvelles capacités de création.

Character doit pouvoir profiter de ces évolutions.

Il ne faut donc jamais enfermer Character dans son premier outil.

---

# 6. Character devient un écosystème : Character Factory 3D

Le concept central devient **Character Factory 3D**.

Character Factory 3D n'est pas simplement un éditeur.

C'est l'environnement global permettant de créer et de préparer les personnages destinés à l'écosystème.

Il peut évoluer progressivement autour de plusieurs domaines :

### Création

Création et assemblage des personnages.

### Personnalisation

Modification de leur apparence, de leurs vêtements, accessoires, couleurs, caractéristiques, etc.

### Assets

Gestion et intégration des ressources nécessaires à la création.

### Design avancé

Possibilité d'intégrer ultérieurement d'autres projets spécialisés pour aller beaucoup plus loin dans la conception.

### Animation

Possibilité d'enrichir progressivement les personnages avec différentes formes d'animation.

### Expression

Possibilité d'améliorer les expressions et les réactions des personnages.

### Comportement

Possibilité d'ajouter progressivement des comportements plus complexes.

### Interaction

Possibilité de faire évoluer les personnages vers des expériences interactives.

### Intelligence

À terme, possibilité d'intégrer des capacités intelligentes ou conversationnelles.

Toutes ces capacités peuvent évoluer indépendamment les unes des autres.

---

# 7. Character Factory 3D ne doit pas être limitée à M3-org

M3-org CharacterStudio constitue la base actuelle de la Factory.

Mais la Factory doit pouvoir accueillir progressivement d'autres projets.

Par exemple, un projet peut être excellent pour la création générale du personnage, tandis qu'un autre peut être meilleur pour :

- la sculpture ;
- la génération de modèles ;
- les vêtements ;
- les cheveux ;
- les expressions ;
- les animations ;
- le rigging ;
- les mouvements ;
- les textures ;
- les matériaux ;
- les accessoires.

Il ne faut donc pas chercher à faire de M3-org l'outil qui fait absolument tout.

La philosophie est plutôt :

> **Character Factory 3D orchestre un ensemble de capacités spécialisées autour d'un même domaine : le personnage.**

---

# 8. La séparation des responsabilités devient une priorité

Chaque composant doit avoir une responsabilité clairement définie.

Un outil de création doit s'occuper de la création.

Un outil spécialisé dans l'animation doit s'occuper de l'animation.

Un outil spécialisé dans les assets doit s'occuper des assets.

Character doit s'occuper du domaine global du personnage et de la cohérence entre ces différents éléments.

EGEN, quant à lui, doit rester responsable de son propre domaine.

Cette séparation permet d'éviter qu'un outil particulier devienne progressivement responsable de tout le système.

---

# 9. Les contrats sont plus importants que les outils

La modularité recherchée ne signifie pas simplement :

« pouvoir remplacer un logiciel ».

Elle signifie surtout :

> **pouvoir remplacer une implémentation sans casser le reste du système.**

Pour cela, les relations entre les différentes parties doivent être fondées sur des contrats clairs.

Les outils doivent respecter les attentes de Character.

Character doit fournir des garanties claires aux applications qui l'utilisent.

EGEN doit connaître les capacités de Character sans avoir besoin de connaître son fonctionnement interne.

Ainsi, une modification interne peut rester interne.

---

# 10. EGEN ne doit plus connaître la fabrication du personnage

EGEN ne doit pas savoir comment un personnage a été conçu.

Il ne doit pas dépendre :

- du logiciel utilisé pour le créer ;
- du concepteur du modèle ;
- du processus de création ;
- du fournisseur d'assets ;
- de l'outil d'animation ;
- du processus de personnalisation.

EGEN doit seulement savoir qu'un personnage Character existe et qu'il peut l'utiliser.

Cette séparation permet à EGEN de rester propre et indépendant.

---

# 11. EGEN devient un consommateur de Character

EGEN pourra utiliser les personnages produits par Character.

Mais EGEN ne doit pas devenir leur gestionnaire principal.

Un personnage appartient au domaine Character.

EGEN peut :

- l'utiliser ;
- l'afficher ;
- l'associer à un contexte ;
- l'utiliser dans une interface ;
- éventuellement lui demander certaines actions selon les capacités disponibles.

Mais la définition fondamentale du personnage reste dans Character.

---

# 12. Le Core EGEN doit donc être nettoyé

La conséquence immédiate de cette réforme est claire :

**Character Factory ne doit plus être une application du Core Frontend EGEN.**

Il faut retirer du Core tout ce qui donne l'impression que Character est une fonctionnalité native et interne d'EGEN.

Le Core EGEN doit rester centré sur ses propres responsabilités.

Character doit sortir du périmètre du Core.

Cela ne signifie pas que Character disparaît de l'expérience EGEN.

Cela signifie simplement que son intégration sera désormais une relation entre deux domaines indépendants.

---

# 13. Ce qui reste dans EGEN

EGEN peut conserver uniquement ce qui est nécessaire pour **utiliser Character**.

Autrement dit, EGEN peut connaître l'existence de Character et proposer des points d'utilisation de ses capacités.

Mais il ne doit pas embarquer la totalité de Character Factory.

La création et la gestion profonde des personnages doivent rester dans Character.

---

# 14. Ce qui appartient désormais à Character

Tout ce qui concerne directement la conception et l'évolution du personnage doit progressivement être déplacé vers Character.

Cela inclut notamment :

- Character Factory 3D ;
- création ;
- édition ;
- personnalisation ;
- gestion des assets ;
- conception des personnages ;
- évolution des modèles ;
- préparation des personnages ;
- capacités propres aux personnages ;
- extensions futures liées au personnage.

Le périmètre exact pourra évoluer avec le projet, mais la règle générale reste :

> **Ce qui concerne le personnage appartient à Character.**

---

# 15. Character doit pouvoir évoluer indépendamment d'EGEN

C'est une conséquence majeure de cette réforme.

Character pourra évoluer sans attendre une nouvelle version d'EGEN.

Une nouvelle fonctionnalité de Character pourra être développée, testée et publiée indépendamment.

De même, EGEN pourra évoluer sans devoir modifier Character à chaque changement interne.

Les deux projets doivent donc pouvoir avoir :

- leur propre rythme ;
- leurs propres versions ;
- leurs propres évolutions ;
- leurs propres dépendances ;
- leurs propres équipes ou contributeurs ;
- leurs propres choix internes.

---

# 16. Plusieurs solutions peuvent coexister

La modularité recherchée ne signifie même pas nécessairement qu'il n'y aura qu'un seul outil.

Character pourrait éventuellement utiliser plusieurs solutions selon les besoins.

Par exemple :

- un outil pour créer certains modèles ;
- un autre pour certains types de personnages ;
- un autre pour certains assets ;
- un autre pour certaines animations.

La Factory devient alors un environnement capable de réunir différentes capacités sans perdre son identité.

---

# 17. Le principe de remplacement

La règle fondamentale est :

> **Remplacer un composant spécialisé ne doit pas nécessiter de reconstruire Character.**

Et surtout :

> **Remplacer un composant de Character ne doit pas nécessiter de modifier EGEN.**

C'est cette règle qui donne une véritable valeur à la modularité.

---

# 18. Character n'est donc pas une simple application

Il faut abandonner mentalement le modèle :

**EGEN Core → Applications → Character Factory**

et adopter :

**Écosystème → Domaines autonomes → Character**

Character devient un domaine à part entière.

Il possède sa propre identité et son propre cycle d'évolution.

---

# 19. La relation finale avec EGEN

La relation souhaitée peut être résumée ainsi :

**Character**

crée, gère et fait évoluer les personnages.

**EGEN**

utilise ces personnages dans ses propres expériences.

**EGEN Core**

ne connaît que ce qui est nécessaire pour permettre cette utilisation.

**Character Factory 3D**

reste dans Character et peut évoluer indépendamment.

**M3-org CharacterStudio**

est aujourd'hui le socle open source choisi pour la partie création/édition, mais reste remplaçable.

**D'autres projets**

pourront être intégrés progressivement lorsque cela apporte une meilleure capacité de conception ou de personnalisation.

---

# 20. La vision à long terme

La vision n'est donc pas :

> « Nous avons intégré CharacterStudio dans EGEN. »

La vision est :

> **« Nous avons créé une plateforme Character autonome, dont CharacterStudio M3-org constitue aujourd'hui une première brique open source, et qui pourra progressivement intégrer d'autres solutions spécialisées pour former une véritable Character Factory 3D. »**

Cette Factory pourra évoluer indépendamment, accueillir de nouveaux outils, remplacer les anciens, améliorer progressivement la qualité des personnages et développer de nouvelles capacités sans remettre en cause EGEN.

---

# 21. Principe directeur de la réforme

La réforme peut finalement être résumée en six règles :

**1. Character est autonome.**

Il ne fait plus partie du Core EGEN.

**2. CharacterStudio M3-org est une implémentation initiale.**

Il est utilisé parce qu'il constitue aujourd'hui une base open source pertinente, pas parce qu'il définit Character.

**3. Les outils sont remplaçables.**

Un autre concepteur ou éditeur pourra remplacer M3-org si une meilleure solution est trouvée.

**4. Les responsabilités sont séparées.**

Chaque solution spécialisée doit rester responsable de son propre domaine.

**5. Les contrats doivent rester stables.**

Les composants communiquent à travers des responsabilités et des contrats clairement définis, et non à travers leurs implémentations internes.

**6. EGEN consomme Character, mais ne le possède pas.**

EGEN peut utiliser les personnages et leurs capacités, sans absorber Character Factory dans son Core.

---

# 22. Résultat attendu après le nettoyage du Core

Après la réforme, le Core EGEN doit pouvoir être regardé sans y trouver :

- un éditeur de personnages ;
- une Character Factory ;
- une gestion interne des modèles 3D ;
- une dépendance directe au concepteur M3-org ;
- des fonctionnalités qui devraient appartenir à Character.

Le Core doit seulement être préparé à **collaborer avec des domaines externes autonomes**.

Character devient alors l'un de ces domaines.

Et son développement peut continuer séparément, avec M3-org comme point de départ, puis avec d'autres projets et outils au fur et à mesure que les besoins de Character Factory 3D deviennent plus ambitieux.

## Formule synthétique

**EGEN est l'écosystème métier.**

**Character est le domaine autonome du personnage.**

**Character Factory 3D est l'espace de création et d'évolution des personnages.**

**M3-org CharacterStudio est la première solution utilisée pour construire cette Factory.**

**Les autres solutions peuvent venir compléter ou remplacer certaines capacités.**

**Les contrats et responsabilités restent stables alors que les outils peuvent évoluer.**

**EGEN utilise Character sans devenir dépendant de son implémentation.**

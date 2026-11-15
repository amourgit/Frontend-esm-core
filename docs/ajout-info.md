# CONTEXTE ET OBJECTIF : INTÉGRATION ET PERSONNALISATION COMPLÈTE DE CHARACTERSTUDIO DANS EGEN

## 1. Comprendre la vision générale du projet

Nous souhaitons intégrer et personnaliser complètement **CharacterStudio** afin qu'il devienne pleinement compatible avec notre environnement EGEN, notamment avec son Core Frontend.

L'objectif n'est pas simplement d'intégrer un visualiseur 3D ou de permettre l'affichage d'un personnage dans une page web.

Nous voulons disposer d'un véritable environnement de gestion, de personnalisation, de composition et d'exploitation de personnages et de ressources 3D, utilisable dans différentes applications de l'écosystème EGEN.

CharacterStudio doit constituer une base fonctionnelle que nous allons adapter et enrichir pour répondre à nos besoins.

Nous voulons notamment pouvoir gérer indépendamment les personnages, les vêtements, les accessoires, les animations, les expressions et les autres ressources nécessaires à la création d'expériences 3D personnalisées.

Ces ressources doivent pouvoir être réutilisées librement dans différentes compositions et différents contextes de l'environnement EGEN.

Il est important de comprendre que nous ne souhaitons pas développer immédiatement un système universel d'animation ou de comportement, ni intégrer d'autres projets pour étendre ces fonctionnalités. Nous voulons d'abord nous concentrer sur l'intégration et la personnalisation complète de CharacterStudio, tout en conservant la possibilité de faire évoluer ses capacités ultérieurement.

## 2. Ce que nous voulons pouvoir faire avec les ressources 3D

Nous voulons dépasser le fonctionnement dans lequel un personnage est nécessairement associé à l'ensemble de ses éléments.

Par exemple, nous devons pouvoir disposer séparément de plusieurs ressources :

- Des personnages de différentes formes et apparences.
- Des vêtements : chemises, pantalons, vestes, robes, chaussures, etc.
- Des accessoires : lunettes, chapeaux, sacs, bijoux, etc.
- Des éléments complémentaires permettant de personnaliser les personnages.
- Des animations disponibles indépendamment des personnages, lorsque leur compatibilité le permet.
- Des expressions faciales et autres éléments de personnalisation.
- Des environnements et éléments visuels complémentaires, si leur prise en charge entre dans le périmètre de CharacterStudio.

Chaque ressource doit pouvoir être gérée indépendamment, avec ses propres informations, caractéristiques, fichiers, prévisualisations et éventuelles contraintes de compatibilité.

Nous souhaitons pouvoir importer de nouvelles ressources provenant de différentes sources, notamment de bibliothèques 3D et de projets comme Blender Studio.

Nous devons pouvoir étudier les formats pris en charge, les possibilités de conversion, les contraintes techniques et les conditions nécessaires pour rendre ces ressources exploitables dans CharacterStudio.

L'importation ne doit pas être considérée comme un simple dépôt de fichier. Nous voulons pouvoir organiser, identifier, vérifier, prévisualiser et exploiter correctement les ressources importées.

## 3. Personnalisation et composition des personnages

Nous voulons pouvoir créer des personnages personnalisés à partir des ressources disponibles.

Prenons un premier scénario :

Un administrateur ouvre l'environnement de gestion des personnages. Il dispose d'une bibliothèque contenant plusieurs personnages, vêtements, accessoires et autres éléments.

Il sélectionne un personnage, lui associe une tenue, ajoute des accessoires et personnalise son apparence.

Il doit pouvoir visualiser les modifications en temps réel, essayer différentes combinaisons et obtenir le résultat souhaité avant de l'enregistrer.

Autre scénario :

Un utilisateur souhaite créer plusieurs variantes à partir du même personnage.

Il crée :
- Un personnage avec une tenue professionnelle.
- Une autre variante avec une tenue décontractée.
- Une troisième variante avec une apparence différente.

Ces variantes doivent pouvoir être enregistrées indépendamment sans nécessiter la duplication de tous les fichiers 3D utilisés.

Nous voulons donc que les compositions puissent référencer les ressources existantes plutôt que de recréer systématiquement des fichiers complets.

La compatibilité entre les ressources est importante. Il faudra notamment prendre en considération les squelettes, les systèmes de rigging, les points d'attachement, les matériaux, les textures et les éventuelles contraintes entre les modèles.

L'expérience de composition doit permettre de comprendre facilement les éléments compatibles, incompatibles ou nécessitant une adaptation.

## 4. Enregistrement et réutilisation des compositions

Une composition créée doit pouvoir être enregistrée et réutilisée dans plusieurs applications EGEN.

Prenons un scénario concret :

Nous créons un personnage nommé « EGEN Assistant ».

Nous lui associons :
- Un modèle de personnage.
- Une tenue professionnelle.
- Des accessoires.
- Une apparence faciale.
- Les animations et expressions disponibles pour ce personnage.

Nous enregistrons cette composition.

Nous souhaitons ensuite pouvoir utiliser ce même personnage dans plusieurs contextes :

**Dans la page de connexion :**

Le personnage accueille l'utilisateur avec une apparence et une animation adaptées à cette page.

**Dans le tableau de bord :**

Le même personnage est utilisé avec une présentation différente, sans devoir reconstruire toute sa composition.

**Dans l'application EGEN AI :**

Le personnage devient l'interface visuelle de l'agent IA.

**Dans une autre application EGEN :**

La même composition peut être réutilisée, éventuellement avec d'autres paramètres de présentation.

Il faut donc distinguer les ressources utilisées, la composition enregistrée et son utilisation dans chaque contexte.

Nous voulons également pouvoir créer plusieurs compositions indépendantes à partir des mêmes ressources.

Une modification apportée à une composition ne doit pas automatiquement modifier toutes les autres compositions qui utilisent les mêmes ressources.

Nous devons pouvoir gérer les versions, les variantes et les réutilisations de manière maîtrisée.

## 5. Exploitation dynamique des personnages

L'un des objectifs importants est de pouvoir exploiter les personnages de manière dynamique, notamment pour les futurs agents IA intégrés dans EGEN.

Nous ne voulons pas uniquement afficher un personnage avec une animation définie à l'avance.

Nous voulons pouvoir faire évoluer son état pendant son utilisation, sans devoir le détruire et le recréer à chaque changement.

Scénario :

Un utilisateur ouvre une application EGEN dans laquelle apparaît un personnage représentant un agent IA.

Au départ, le personnage est dans son état de repos.

Lorsque l'utilisateur commence à parler :
- Le personnage peut orienter son regard vers l'utilisateur.
- Il peut adopter une expression appropriée.
- Il peut déclencher une animation d'écoute, si elle est disponible.
- Son comportement visuel peut évoluer en fonction de la situation.

Lorsque l'agent IA répond :
- Le personnage peut déclencher une animation de parole.
- La synchronisation labiale peut être activée si elle est prise en charge.
- Son expression peut évoluer selon le contexte.
- Son regard et sa posture peuvent être adaptés.

Lorsque l'agent termine sa réponse, le personnage peut revenir à un état de repos ou adopter un autre état approprié.

Nous souhaitons pouvoir gérer séparément les différents aspects de cette expérience :

- Les animations corporelles.
- Les expressions faciales.
- Les émotions.
- Le regard et l'orientation de la tête.
- Le clignement des yeux.
- La synchronisation labiale.
- Les états de repos, d'écoute, de parole et autres états utiles.

Ces éléments ne doivent pas être nécessairement liés les uns aux autres.

Par exemple, le personnage doit pouvoir parler tout en affichant une expression particulière et en orientant son regard vers l'utilisateur.

Nous voulons donc pouvoir combiner les éléments compatibles, gérer leurs interactions et éviter les conflits entre animations ou expressions.

Il faut également pouvoir changer certains éléments de la composition pendant l'exécution lorsque cela est pertinent, sans recharger inutilement l'ensemble du personnage.

**Important :** À ce stade, nous ne demandons pas d'intégrer un moteur externe de comportement ou un système universel d'animation. Nous voulons d'abord exploiter et personnaliser correctement les possibilités existantes de CharacterStudio, tout en prévoyant une évolution future.

## 6. Répartition des possibilités entre frontend et backend

Nous voulons que les possibilités offertes par le système soient clairement identifiées selon leur destination : frontend ou backend.

Cette distinction doit être faite à partir des besoins fonctionnels, et non en imposant dès maintenant une architecture technique.

### A. Tout ce qui peut être proposé côté frontend

Nous souhaitons disposer d'une interface complète permettant de gérer et d'exploiter les personnages et les ressources 3D.

Étudier notamment les fonctionnalités suivantes :

**Exploration des ressources**
- Consulter les bibliothèques de ressources.
- Parcourir les personnages, vêtements, accessoires, animations et autres éléments.
- Rechercher, filtrer et classer les ressources.
- Consulter leurs informations et caractéristiques.
- Visualiser les ressources avant de les utiliser.

**Personnalisation des personnages**
- Sélectionner un personnage.
- Ajouter, retirer ou remplacer des vêtements et accessoires.
- Modifier les éléments de personnalisation disponibles.
- Visualiser les changements en temps réel.
- Comparer différentes variantes.
- Vérifier les compatibilités.

**Composition et édition**
- Créer une nouvelle composition.
- Modifier une composition existante.
- Associer plusieurs ressources.
- Réorganiser les éléments lorsque cela est nécessaire.
- Prévisualiser le résultat final.
- Enregistrer et réutiliser les compositions.

**Gestion des animations et expressions**
- Consulter les animations disponibles.
- Prévisualiser les animations.
- Sélectionner les expressions.
- Tester les combinaisons possibles.
- Configurer les états visuels disponibles.
- Vérifier les interactions entre les différents éléments.

**Importation et exportation**
- Importer des ressources.
- Visualiser les résultats de l'importation.
- Consulter les erreurs et avertissements.
- Exporter les éléments ou compositions lorsque cela est nécessaire.
- Récupérer les fichiers et configurations autorisés.

**Prévisualisation et exploitation**
- Afficher les personnages dans un environnement de prévisualisation.
- Tester une composition avant sa publication.
- Visualiser les changements dynamiques.
- Exécuter une composition dans les pages EGEN.
- Recevoir et appliquer les instructions destinées à modifier l'état du personnage pendant son utilisation.

Nous ne voulons pas limiter le frontend à un simple panneau d'administration. Il doit également permettre de visualiser et d'exploiter concrètement les compositions créées.

### B. Tout ce qui peut être proposé côté backend

Le backend doit prendre en charge les responsabilités de gestion, de traitement, de conservation et de contrôle des données et ressources.

Étudier notamment les possibilités suivantes :

**Gestion des ressources**
- Enregistrer les ressources.
- Conserver les fichiers originaux et leurs éventuelles versions optimisées.
- Gérer les métadonnées.
- Classer les ressources.
- Gérer les catégories et les collections.
- Conserver les prévisualisations et informations associées.
- Gérer les versions et les mises à jour.

**Importation et traitement**
- Recevoir les ressources importées.
- Vérifier les formats.
- Contrôler les caractéristiques techniques.
- Identifier les problèmes de compatibilité.
- Effectuer les traitements ou conversions nécessaires, lorsque cela est possible.
- Générer les informations utiles à l'exploitation des ressources.
- Signaler les erreurs et les avertissements.

**Gestion des personnages et compositions**
- Enregistrer les personnages.
- Conserver les compositions créées.
- Gérer les variantes.
- Gérer les versions.
- Conserver les relations entre les compositions et les ressources utilisées.
- Permettre la réutilisation des compositions dans plusieurs applications.

**Gestion des animations et expressions**
- Référencer les animations disponibles.
- Gérer les expressions et autres éléments visuels.
- Conserver leurs caractéristiques et leurs contraintes.
- Contrôler les éléments compatibles avec chaque personnage.

**Gestion de l'exploitation**
- Mettre à disposition les compositions et ressources nécessaires aux applications EGEN.
- Recevoir les demandes de modification de l'état des personnages.
- Contrôler les actions autorisées.
- Transmettre les instructions nécessaires aux interfaces frontend connectées.
- Gérer les événements et les échanges en temps réel lorsque cela est nécessaire.
- Suivre les états d'exécution et les éventuelles erreurs remontées par le frontend.

**Gestion des accès**
- Gérer les droits d'accès aux ressources et aux compositions.
- Prendre en compte les organisations et les tenants EGEN.
- Déterminer les ressources accessibles selon les autorisations.
- Contrôler les opérations de création, modification, importation et suppression.

**Intelligence et orchestration**

Nous voulons que toute la logique de décision et d'orchestration métier soit prise en charge côté backend.

Par exemple, un agent IA doit pouvoir demander qu'un personnage affiche une expression, déclenche une animation ou change d'état.

Le backend doit pouvoir interpréter cette demande, vérifier qu'elle est autorisée et qu'elle correspond à une capacité disponible, puis transmettre une instruction exploitable par le frontend.

Le frontend doit se charger de l'exécution visuelle dans l'environnement où le personnage est affiché.

Il ne faut donc pas confondre la logique de décision avec le rendu 3D : l'intelligence et la gestion des décisions doivent rester côté backend, tandis que l'affichage et l'exécution graphique doivent être assurés par le frontend.

## 7. Scénarios d'utilisation complets à étudier

Nous voulons que tu approfondisses les fonctionnalités à travers des situations concrètes.

### Scénario 1 : Création d'une bibliothèque de ressources

Un administrateur importe plusieurs personnages, vêtements et accessoires provenant de différentes sources.

Il souhaite les retrouver facilement, consulter leurs informations, vérifier leur compatibilité et les utiliser dans ses futures créations.

Décris tout ce qui doit être possible côté frontend et backend pour rendre cette expérience complète.

### Scénario 2 : Création d'un personnage personnalisé

Un administrateur choisit un personnage, lui associe plusieurs vêtements et accessoires, personnalise son apparence et enregistre le résultat.

Il souhaite pouvoir revenir ultérieurement sur cette composition et la modifier.

Décris les possibilités nécessaires pour réaliser cette opération.

### Scénario 3 : Création de plusieurs variantes

Un administrateur utilise les mêmes ressources pour créer plusieurs compositions différentes.

Il souhaite pouvoir les enregistrer, les comparer, les modifier indépendamment et les réutiliser dans différentes applications.

Explique comment cette expérience doit fonctionner du point de vue des fonctionnalités attendues.

### Scénario 4 : Utilisation d'un personnage dans plusieurs applications EGEN

Un personnage est créé et enregistré.

Il est ensuite utilisé dans la page de connexion, le tableau de bord et l'application EGEN AI.

Chaque application doit pouvoir utiliser la composition souhaitée et disposer de ses propres paramètres d'utilisation, sans reconstruire le personnage.

Décris les possibilités attendues pour faciliter cette réutilisation.

### Scénario 5 : Interaction dynamique avec un agent IA

Un utilisateur échange avec un agent IA représenté par un personnage 3D.

L'agent doit pouvoir faire évoluer l'expression, le regard, les animations et les autres éléments visuels du personnage pendant la conversation.

Décris précisément les opérations qui doivent être possibles, les instructions que le backend doit pouvoir transmettre et les capacités d'exécution attendues côté frontend.

### Scénario 6 : Gestion des ressources et compositions dans le temps

Un administrateur met à jour une ressource, ajoute une nouvelle animation ou modifie une composition déjà utilisée dans plusieurs applications.

Il faut pouvoir maîtriser les versions, les dépendances, les compatibilités et les conséquences de ces modifications.

Décris les fonctionnalités nécessaires pour éviter les modifications involontaires et garantir une gestion cohérente des ressources.

## 8. Méthode de travail attendue

Avant de proposer des fonctionnalités, étudie réellement CharacterStudio et sa documentation.

Tu dois connaître :
- Ce qui existe déjà.
- Ce qui fonctionne réellement.
- Ce qui est configurable.
- Ce qui est extensible.
- Ce qui nécessite une adaptation.
- Ce qui n'existe pas encore et devrait être développé pour répondre à nos attentes.

Ne présente jamais une fonctionnalité souhaitée comme une fonctionnalité déjà disponible dans CharacterStudio.

Ne suppose pas non plus que tu connais déjà parfaitement le Core Frontend EGEN. Ses composants, ses conventions, ses mécanismes d'intégration et ses contraintes devront être étudiés avant toute proposition d'intégration détaillée.

Nous ne te demandons pas de définir une architecture technique, de choisir des technologies supplémentaires ou de proposer immédiatement une organisation interne des services.

Nous te demandons d'abord de comprendre notre vision et d'établir un inventaire fonctionnel complet de ce que nous souhaitons obtenir.

Pour chaque fonctionnalité proposée, précise :

1. **L'objectif :** pourquoi cette fonctionnalité est nécessaire.
2. **Le résultat attendu :** ce que l'utilisateur ou l'application doit pouvoir faire.
3. **Le côté concerné :** frontend, backend ou les deux.
4. **L'existant :** ce que CharacterStudio permet déjà de faire.
5. **Les adaptations :** ce qu'il faudra personnaliser ou améliorer.
6. **Les développements complémentaires :** ce qui devra être créé pour atteindre le résultat attendu.
7. **Les interactions :** les relations avec les autres fonctionnalités.
8. **Les limites et contraintes :** les points techniques à prendre en considération.

Distingue clairement les fonctionnalités indispensables au premier objectif de celles qui pourront être ajoutées ultérieurement.

## 9. Résultat final attendu

Nous voulons obtenir un système complet dans lequel :

- Les ressources 3D sont indépendantes, organisées et réutilisables.
- Les personnages peuvent être personnalisés à partir de plusieurs ressources.
- Les compositions peuvent être enregistrées et réutilisées.
- Plusieurs variantes peuvent exister sans duplication inutile.
- Les compositions peuvent être utilisées dans différentes applications EGEN.
- Les personnages peuvent être exploités dynamiquement.
- Les animations, expressions, regards et autres éléments visuels peuvent être gérés de manière indépendante et combinée lorsque cela est compatible.
- Le backend conserve et gère les ressources, les données, les compositions, les autorisations et les décisions.
- Le frontend permet de configurer, personnaliser, visualiser et exécuter les compositions.
- Les applications EGEN peuvent exploiter ces capacités sans devoir reconstruire leur propre système de gestion des personnages.

**Notre ambition est de disposer d'un véritable environnement de création et d'exploitation de personnages 3D réutilisables dans tout l'écosystème EGEN, et non d'un simple composant d'affichage de personnages.**

Garde cette vision comme fil conducteur de toute ton étude.

Ne commence pas par nous imposer une architecture. Commence par comprendre précisément le résultat que nous voulons atteindre, identifier toutes les fonctionnalités nécessaires et expliquer clairement ce qui doit être proposé côté frontend et côté backend.

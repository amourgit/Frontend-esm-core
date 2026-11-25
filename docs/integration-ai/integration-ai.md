# MISSION D'ÉTUDE ET DE CADRAGE
# Intégration d'un système de Browser Interaction dans EGEN

**Projet :** EGEN — Frontend Core / Backend / AI Kernel  
**Composant concerné :** Browser Interaction  
**Orientation :** Interaction autonome avec les interfaces Web et visualisation des opérations  
**Nature de la mission :** Étude préalable, analyse de l'existant et proposition d'architecture d'intégration  
**Statut :** Phase d'étude — aucune implémentation ne doit commencer avant validation du cadrage.

---

# 1. CONTEXTE GÉNÉRAL

EGEN est un écosystème numérique modulaire dont le frontend Core constitue un environnement applicatif commun, capable d'accueillir différentes applications métier et fonctionnelles.

Le projet dispose également d'une infrastructure backend et d'un environnement d'intelligence artificielle destinés à gérer les agents, leurs capacités, leurs outils, leurs configurations et leurs interactions avec les différents services de l'écosystème.

Dans le cadre de l'évolution de cet environnement IA, nous souhaitons lui donner une nouvelle capacité : **la possibilité d'interagir directement avec les interfaces Web des applications, comme le ferait un utilisateur humain devant son navigateur.**

Cette capacité doit permettre à un agent IA de naviguer dans une application, de comprendre les éléments affichés, d'effectuer des opérations et de vérifier les résultats obtenus.

Il ne s'agit donc pas simplement de permettre à un agent d'appeler des API ou d'exécuter des commandes métier.

Nous voulons lui donner la capacité d'utiliser réellement une interface graphique Web.

À titre d'exemple, un agent doit pouvoir :

- Ouvrir une application Web.
- Parcourir ses différentes pages.
- Comprendre la structure et le contenu de l'interface affichée.
- Ouvrir et fermer des menus.
- Cliquer sur des boutons et des liens.
- Remplir des formulaires.
- Sélectionner des options.
- Faire défiler les pages.
- Survoler des éléments.
- Effectuer des opérations de glisser-déposer.
- Interagir avec des tableaux, des fenêtres modales et des composants dynamiques.
- Naviguer entre les différentes vues d'une application SPA.
- Attendre les chargements et les changements d'état.
- Vérifier que les actions ont produit les résultats attendus.

L'agent doit être capable de réaliser des séquences d'interactions complexes, en observant les conséquences de ses actions et en adaptant son comportement lorsque l'interface évolue.

Pour étudier cette capacité, le projet **AgentCursor** a été retenu comme candidat initial.

Dépôt de référence : https://github.com/kumard3/agentcursor

Ce choix constitue une orientation de départ et non une décision définitive sur l'ensemble de l'architecture. L'étude devra notamment vérifier les capacités réelles du projet, ses contraintes, ses possibilités d'intégration et sa compatibilité avec l'environnement EGEN.

---

# 2. VISION ET OBJECTIF PRINCIPAL

Nous souhaitons intégrer dans EGEN une capacité de navigation et d'interaction Web utilisable par les différents agents de notre écosystème.

Cette capacité devra être gérée entièrement côté backend.

Le frontend Core devra uniquement permettre de visualiser les opérations en cours et de suivre leur déroulement.

La séparation des responsabilités est fondamentale.

Nous ne souhaitons pas construire un système dans lequel le frontend Core devient responsable de l'automatisation, de la gestion des navigateurs ou de l'orchestration des agents.

Nous souhaitons obtenir deux environnements clairement distincts :

**A. Un environnement de contrôle et d'exécution côté backend.**

Il contient toutes les responsabilités liées au fonctionnement du système Browser Interaction.

**B. Un environnement de visualisation côté frontend Core.**

Il permet aux utilisateurs autorisés de voir ce que fait un agent dans son navigateur, de suivre les opérations et de contrôler les actions générales de supervision mises à leur disposition.

Le frontend est donc un terminal de visualisation et de supervision, et non le centre de fonctionnement du système.

---

# 3. PÉRIMÈTRE ET RESPONSABILITÉS DU FRONTEND CORE

Cette partie constitue un cadrage strict.

Le travail demandé sur le frontend Core doit se limiter à la création d'une expérience utilisateur permettant de visualiser et de superviser les sessions Browser Interaction.

Il faut considérer cette fonctionnalité comme une application ou une capacité intégrée au Core, et non comme une nouvelle responsabilité fondamentale du framework.

## 3.1. Visualisation du navigateur

Le frontend doit permettre à l'utilisateur de voir le navigateur dans lequel travaille l'agent.

Il ne s'agit pas de présenter uniquement des captures d'écran isolées ou une représentation simplifiée de la page.

Nous voulons une visualisation suffisamment fidèle et fluide pour que l'utilisateur puisse suivre le travail de l'agent presque comme s'il regardait un écran physique.

L'utilisateur doit pouvoir observer :

- La page Web actuellement ouverte.
- Les changements de pages et de vues.
- Les chargements.
- Les déplacements dans la page.
- Les ouvertures et fermetures de menus.
- Les interactions avec les différents composants.
- Les changements de contenu.
- Les résultats des opérations réalisées.

La visualisation doit refléter aussi fidèlement que possible l'état réel du navigateur distant.

## 3.2. Visualisation du curseur et des interactions

C'est une exigence particulièrement importante.

Nous voulons que l'utilisateur puisse voir le curseur utilisé par l'agent.

Il doit pouvoir observer visuellement :

- Le déplacement du curseur.
- Son arrivée sur un élément.
- Les survols.
- Les clics.
- Les doubles-clics.
- Les interactions avec les champs.
- Les opérations de glisser-déposer.
- Les déplacements associés au défilement lorsque ceux-ci sont visibles.

Le comportement doit être suffisamment fluide pour rendre les opérations compréhensibles.

L'objectif n'est pas de produire une animation décorative du curseur.

Nous voulons représenter les interactions réellement réalisées dans le navigateur.

Si une action est exécutée par le moteur sans mouvement visible du curseur, la visualisation devra rester cohérente avec cette réalité et ne pas simuler une action qui n'a pas eu lieu.

## 3.3. Suivi de l'exécution

L'utilisateur doit pouvoir comprendre ce que l'agent est en train de faire.

L'interface devra notamment permettre de consulter :

- L'état général de la session.
- L'identifiant de la session.
- L'agent responsable de l'exécution.
- L'application actuellement visitée.
- L'adresse de la page active.
- L'opération en cours.
- Les dernières opérations réalisées.
- Les éventuelles erreurs.
- Le résultat ou l'état de vérification d'une opération.

Les informations doivent être présentées clairement, sans surcharger l'espace de visualisation.

L'utilisateur ne doit pas être obligé de comprendre le fonctionnement interne du moteur pour suivre une session.

## 3.4. Supervision des sessions

Le frontend devra offrir les moyens de supervision nécessaires à l'utilisateur autorisé.

Nous souhaitons notamment pouvoir :

- Consulter une session en cours.
- Identifier si une session est active, en attente, suspendue ou terminée.
- Mettre en pause une session lorsque cela est autorisé.
- Reprendre une session suspendue.
- Demander l'arrêt d'une session.
- Consulter les événements récents.
- Identifier les erreurs rencontrées.

Ces commandes sont des demandes adressées au backend.

Le frontend ne doit pas exécuter lui-même les opérations correspondantes.

Le backend reste responsable de leur validation et de leur exécution.

## 3.5. Expérience utilisateur

L'interface doit s'intégrer naturellement dans l'environnement ESM Core.

Elle doit respecter :

- Les conventions visuelles du Core.
- Son système de navigation.
- Son organisation applicative.
- Ses mécanismes d'authentification.
- Ses mécanismes d'autorisation.
- Ses principes de modularité.
- Ses conventions de développement et d'intégration.

Il ne faut pas créer une interface indépendante qui donne l'impression d'utiliser un produit externe.

L'utilisateur doit avoir le sentiment d'utiliser une fonctionnalité native de l'écosystème EGEN.

La visualisation doit également s'adapter aux différentes dimensions d'écran, dans la mesure où cela est pertinent pour ce type d'interface.

---

# 4. CE QUE LE FRONTEND CORE NE DOIT PAS FAIRE

Cette partie est aussi importante que la précédente.

Nous voulons éviter que le développement de cette fonctionnalité introduise des responsabilités qui ne lui appartiennent pas.

Le frontend Core ne doit en aucun cas devenir le lieu de configuration ou d'exécution du système Browser Interaction.

Il ne doit donc pas :

1. Installer, configurer ou administrer AgentCursor.
2. Gérer directement les extensions du navigateur.
3. Configurer les instances Chromium.
4. Créer ou administrer les environnements d'exécution.
5. Gérer les profils de navigateur.
6. Définir les paramètres internes des moteurs d'interaction.
7. Déterminer les stratégies d'exécution des agents.
8. Gérer les outils disponibles pour les agents.
9. Définir les instructions ou comportements des agents.
10. Gérer les modèles d'intelligence artificielle.
11. Effectuer la planification des actions.
12. Interpréter les captures d'écran pour prendre des décisions.
13. Déterminer les éléments sur lesquels l'agent doit cliquer.
14. Exécuter directement les actions de navigation.
15. Gérer les permissions internes des moteurs.
16. Gérer les mécanismes d'isolation des navigateurs.
17. Administrer les sessions techniques des fournisseurs.
18. Stocker les configurations opérationnelles du système.
19. Exécuter des scripts d'automatisation.
20. Contenir la logique métier du Browser Interaction Service.

Le frontend ne doit pas non plus devenir un outil permettant à l'utilisateur de piloter librement le navigateur distant comme s'il s'agissait d'un navigateur personnel.

Sa responsabilité est la visualisation et la supervision des opérations effectuées par les agents.

Toute autre capacité devra être justifiée et validée séparément.

**Principe directeur : le frontend observe et transmet les demandes de supervision ; le backend décide, contrôle et exécute.**

---

# 5. RESPONSABILITÉS DU BACKEND

Le backend doit porter l'intégralité du système Browser Interaction.

Il constitue le véritable environnement de fonctionnement de cette capacité.

Nous voulons une solution centralisée, modulaire, configurable et réutilisable par les différents agents de l'écosystème EGEN.

## 5.1. Gestion des fournisseurs et des moteurs

Le backend doit être responsable de l'intégration et de l'administration des moteurs d'interaction.

AgentCursor est le premier candidat retenu pour l'étude.

Le système devra permettre de gérer :

- L'installation et la disponibilité du fournisseur.
- Sa configuration.
- Ses paramètres de fonctionnement.
- Ses dépendances.
- Ses versions.
- Son état de santé.
- Ses éventuelles erreurs.
- Ses mises à jour.
- Ses capacités disponibles.

L'architecture devra éviter de rendre le reste du système dépendant directement des particularités d'AgentCursor.

Nous souhaitons conserver la possibilité d'intégrer d'autres moteurs à l'avenir.

Le fournisseur doit être considéré comme un composant remplaçable.

## 5.2. Gestion des environnements de navigation

Le backend doit gérer les environnements dans lesquels les agents vont travailler.

Il doit notamment prendre en charge :

- Le démarrage des navigateurs.
- Leur arrêt.
- Leur redémarrage.
- La gestion des instances.
- Les profils de navigation.
- Les contextes de session.
- Les paramètres du navigateur.
- Les ressources nécessaires à leur fonctionnement.
- L'isolation entre les différentes sessions.

L'environnement doit être capable d'ouvrir les applications Web autorisées et de permettre aux agents de les utiliser.

Il faut également prévoir une gestion des environnements de navigation simultanés.

Plusieurs agents ou utilisateurs pourront potentiellement avoir besoin de sessions différentes.

Ces sessions ne doivent pas partager leurs données privées, leurs contextes de navigation ou leurs permissions sans autorisation explicite.

## 5.3. Gestion centralisée des sessions

Le backend doit être responsable de tout le cycle de vie des sessions.

Une session doit notamment pouvoir être :

- Créée.
- Initialisée.
- Associée à un agent.
- Associée à un utilisateur et à son contexte organisationnel.
- Configurée selon les autorisations applicables.
- Démarrée.
- Suspendue.
- Reprise.
- Terminée.
- Nettoyée.

Le système doit pouvoir retrouver l'état d'une session et connaître les ressources qui lui sont associées.

Il faudra également définir les mécanismes de conservation des informations utiles après la fermeture d'une session.

## 5.4. Exécution des interactions

Le backend doit exposer aux agents les capacités nécessaires pour utiliser les interfaces Web.

Nous voulons notamment couvrir les catégories d'opérations suivantes :

**Navigation**
- Ouvrir une adresse.
- Accéder à une page.
- Naviguer entre différentes vues.
- Revenir en arrière.
- Avancer.
- Actualiser.
- Gérer les changements de routes des applications SPA.

**Interactions**
- Cliquer.
- Double-cliquer.
- Faire un clic droit.
- Survoler.
- Déplacer le curseur.
- Faire glisser des éléments.
- Sélectionner des éléments.

**Saisie**
- Remplir des champs.
- Modifier des valeurs.
- Saisir du texte.
- Utiliser les raccourcis clavier.
- Sélectionner des options.
- Interagir avec des formulaires.

**Défilement et affichage**
- Faire défiler les pages.
- Atteindre des éléments.
- Gérer les zones de défilement internes.
- Observer les changements de contenu.
- Prendre des captures d'écran.

**Observation et vérification**
- Lire le contenu affiché.
- Identifier les éléments interactifs.
- Comprendre les états des composants.
- Attendre les changements d'état.
- Vérifier les résultats des actions.
- Détecter les erreurs et les blocages.

Il faut également étudier les cas particuliers des fenêtres modales, menus dynamiques, tableaux, composants complexes, téléchargements et téléversements de fichiers.

L'objectif est de disposer d'une capacité d'interaction aussi complète que raisonnablement possible dans le périmètre des applications Web.

## 5.5. Orchestration et utilisation par les agents IA

Le Browser Interaction ne doit pas être un outil isolé réservé à un seul agent.

Il doit pouvoir être utilisé par les agents autorisés du système IA.

Le backend doit donc prendre en charge :

- La mise à disposition des capacités d'interaction.
- Leur exposition aux agents.
- La gestion des appels et des résultats.
- La coordination entre les agents et les sessions.
- La transmission des observations.
- Le suivi des opérations.
- La gestion des erreurs.
- La vérification des résultats.

L'intégration devra être étudiée en tenant compte de l'architecture IA existante d'EGEN, notamment de LangGraph, du système d'outils et de MCP.

Nous ne voulons pas créer une deuxième infrastructure d'orchestration des agents indépendante de celle qui existe déjà.

Le Browser Interaction doit devenir une capacité exploitable dans l'environnement IA existant.

## 5.6. Sécurité et autorisations

Le système devra respecter les mécanismes de sécurité d'EGEN.

Il faudra notamment étudier :

- L'identification de l'agent qui demande une interaction.
- L'identification de l'utilisateur auquel la session est rattachée.
- Le respect du contexte organisationnel et du tenant.
- Les permissions associées aux applications accessibles.
- La restriction des domaines autorisés.
- L'isolation des sessions.
- La protection des informations d'authentification.
- La gestion des données sensibles.
- La traçabilité des actions.
- La limitation des opérations dangereuses.
- La gestion des validations humaines lorsque cela est nécessaire.

Une session ne doit jamais permettre à un agent de contourner les permissions de l'utilisateur ou celles de l'application visitée.

Il faudra aussi empêcher qu'une instruction rencontrée dans une page Web puisse modifier les autorisations ou les règles de sécurité du système.

## 5.7. Communication avec le frontend

Le backend doit fournir les informations nécessaires à la visualisation des sessions.

Il devra notamment permettre :

- La récupération des informations d'une session.
- La transmission des états.
- La transmission des événements.
- La diffusion de la visualisation du navigateur.
- La remontée des erreurs.
- La réception des demandes de supervision.

La diffusion doit permettre de voir réellement les opérations effectuées dans le navigateur distant.

Nous voulons notamment rendre visibles les déplacements du curseur et les interactions.

La solution devra donc étudier les moyens appropriés de diffusion visuelle, avec une attention particulière à la fluidité, à la latence et à la fidélité de représentation.

Le système doit séparer les informations de supervision de la diffusion visuelle.

---

# 6. EXIGENCE PARTICULIÈRE : FIDÉLITÉ DE LA VISUALISATION

Il s'agit d'une exigence centrale du projet.

Nous ne voulons pas que l'utilisateur voie simplement une suite de captures d'écran prises après chaque action.

Nous souhaitons une expérience de visualisation continue ou suffisamment fluide pour suivre le travail de l'agent.

L'utilisateur doit pouvoir comprendre comment l'agent interagit avec l'interface.

Exemple de scénario :

1. L'agent ouvre l'application EGEN.
2. L'utilisateur voit le navigateur distant.
3. Le curseur se déplace vers le menu.
4. Le menu s'ouvre.
5. L'agent choisit une rubrique.
6. La nouvelle vue apparaît.
7. Le curseur se déplace vers un bouton.
8. L'agent ouvre un formulaire.
9. Les champs sont remplis.
10. L'agent valide l'opération.
11. L'interface affiche le résultat.
12. L'agent vérifie que l'opération est terminée.

L'utilisateur doit pouvoir suivre l'ensemble de cette séquence dans le frontend Core.

La représentation visuelle doit correspondre aux opérations réellement exécutées.

Nous souhaitons également que le système puisse conserver un historique exploitable des opérations, selon les règles de conservation qui seront définies.

---

# 7. MODULARITÉ ET ÉVOLUTIVITÉ

Cette capacité doit être conçue comme un composant réutilisable de l'écosystème EGEN.

Nous ne voulons pas d'une intégration spécifique uniquement destinée à une application ou à un agent.

Elle doit pouvoir être utilisée dans différents contextes :

- Agents de gestion administrative.
- Agents de gestion académique.
- Agents de gestion des ressources.
- Agents de gestion des organisations.
- Agents d'assistance aux utilisateurs.
- Agents d'automatisation de processus.
- Autres agents futurs.

Elle doit également pouvoir fonctionner avec différentes applications Web, sous réserve des permissions et des compatibilités nécessaires.

L'architecture devra donc permettre de faire évoluer les fournisseurs, les environnements de navigation, les mécanismes d'observation et les capacités d'interaction sans remettre en cause l'ensemble du système.

Le frontend Viewer doit également rester indépendant du fournisseur utilisé.

Il doit afficher une session Browser Interaction, qu'elle soit exécutée par AgentCursor ou par un autre fournisseur compatible à l'avenir.

---

# 8. TRAVAIL D'ÉTUDE DEMANDÉ AUX AGENTS

Avant toute modification du code, vous devez réaliser une étude approfondie.

Cette étude comporte deux obligations majeures :

**A. Étudier le projet AgentCursor et ses possibilités réelles d'intégration.**

**B. Étudier le frontend EGEN Core existant afin de déterminer comment cette fonctionnalité doit y être intégrée proprement.**

Il ne faut pas proposer une architecture générique sans avoir examiné le projet existant.

Vos conclusions doivent être fondées sur l'analyse réelle du code, des conventions, des composants, des applications et de l'organisation actuelle du frontend Core.

## 8.1. Étude du projet AgentCursor

Examiner le dépôt officiel et déterminer :

- Son fonctionnement général.
- Son architecture.
- Ses composants.
- Ses dépendances.
- Ses capacités réelles.
- Ses possibilités de contrôle du navigateur.
- Son mécanisme de déplacement visible du curseur.
- Son fonctionnement avec Chrome et Chromium.
- Ses possibilités de communication avec un backend distant.
- Ses interfaces d'intégration.
- Ses capacités MCP.
- Ses possibilités de gestion de sessions.
- Ses limites.
- Ses contraintes de déploiement.
- Ses conditions de licence.
- Ses éventuelles contraintes de sécurité.

Il faut également vérifier les fonctionnalités annoncées directement dans le code et les exemples exécutables, et ne pas se limiter à la description du dépôt.

Nous voulons savoir précisément ce qui peut être réutilisé et ce qui devra être développé autour du projet.

## 8.2. Étude approfondie du frontend EGEN Core

Vous devez examiner le frontend Core existant avant de proposer une intégration.

L'objectif est de comprendre son organisation réelle et d'identifier les possibilités d'intégration les plus appropriées.

Étudier notamment :

- L'organisation générale du monorepo.
- La structure du framework.
- Le fonctionnement des applications ESM.
- Le système d'enregistrement et de découverte des applications.
- Les conventions de développement des applications.
- Le système de navigation.
- La gestion des routes.
- Le système d'authentification.
- Les mécanismes d'autorisation.
- La gestion du contexte tenant.
- Les conventions UI et les composants réutilisables.
- Les mécanismes de communication avec le backend.
- Les possibilités de communication temps réel.
- Les mécanismes de gestion des événements.
- Les conventions de configuration.
- Les mécanismes d'extension du Core.

Il faudra notamment identifier les applications ou composants existants qui peuvent servir de référence pour développer cette nouvelle capacité.

L'étude doit permettre de répondre à ces questions :

1. Sous quelle forme la fonctionnalité doit-elle être intégrée au Core ?
2. Doit-elle être une application ESM indépendante ?
3. Quels mécanismes existants doivent être réutilisés ?
4. Où doit se situer son point d'entrée dans le système ?
5. Comment doit-elle accéder aux sessions distantes ?
6. Comment doit-elle afficher le navigateur ?
7. Comment doit-elle afficher les événements et les états ?
8. Comment doit-elle respecter les permissions existantes ?
9. Comment éviter de créer une dépendance directe entre le frontend et AgentCursor ?
10. Comment garantir que cette intégration ne perturbe pas les autres applications ESM ?

Vous devez vous appuyer sur les éléments réellement présents dans le dépôt.

Ne proposez pas de réorganisation générale du frontend si elle n'est pas nécessaire à cette fonctionnalité.

## 8.3. Étude de l'architecture backend

Il faut également examiner l'architecture backend et l'environnement IA déjà disponibles.

Identifier :

- Les services existants pouvant accueillir cette capacité.
- Les mécanismes de communication interservices.
- Le système d'agents et d'outils.
- L'intégration LangGraph.
- L'utilisation de MCP.
- Les mécanismes de gestion des sessions.
- Les mécanismes d'authentification et d'autorisation.
- Les possibilités d'hébergement de navigateurs distants.
- Les infrastructures disponibles pour la diffusion vidéo.
- Les possibilités de journalisation et de supervision.

L'objectif est de déterminer où et comment le Browser Interaction doit être rattaché à l'infrastructure existante, sans créer inutilement un nouvel écosystème indépendant.

---

# 9. LIVRABLE ATTENDU : PROPOSITION DE RÉALISATION

À l'issue de l'étude, vous devez produire un document de cadrage technique et fonctionnel.

Ce document doit être clair, structuré et suffisamment précis pour permettre de lancer ensuite le développement sans ambiguïté.

Il devra contenir les éléments suivants.

## 9.1. Synthèse de l'étude

Présenter :

- Les conclusions sur AgentCursor.
- Les conclusions sur le frontend EGEN Core.
- Les conclusions sur le backend existant.
- Les possibilités d'intégration.
- Les contraintes identifiées.
- Les risques.
- Les décisions qui doivent être prises.

## 9.2. Architecture cible proposée

Présenter une architecture globale montrant clairement :

- Le frontend Core.
- Le backend Browser Interaction.
- Le moteur AgentCursor.
- Le système de gestion des navigateurs.
- L'environnement IA.
- Les mécanismes de communication.
- Le système de visualisation.
- Les responsabilités de chaque partie.

L'architecture devra montrer les relations entre les composants et les flux d'information.

Il faudra distinguer les composants existants des composants à créer ou à adapter.

## 9.3. Plan de réalisation organisé en phases

Proposer un plan de réalisation progressif.

**Chaque phase doit être divisée en plusieurs étapes numérotées.**

Une phase représente un grand objectif de réalisation.

Une étape représente un travail précis permettant d'atteindre cet objectif.

Pour chaque phase, préciser :

- Son objectif.
- Les étapes à réaliser.
- Les composants concernés.
- Les résultats attendus.
- Les critères permettant de considérer la phase comme terminée.
- Les éventuelles dépendances avec les phases précédentes.

Le plan doit être suffisamment précis pour servir de feuille de route aux développeurs.

Il ne faut pas simplement écrire des intitulés génériques tels que « développer le backend » ou « créer le frontend ».

Il faut expliquer brièvement ce qui sera effectivement réalisé dans chaque étape.

Le plan devra au minimum couvrir :

**Phase 1 — Étude et validation des solutions**

Étudier AgentCursor, ses possibilités, ses limites et son intégration dans l'environnement existant.

**Phase 2 — Conception du système Browser Interaction**

Définir les responsabilités, les composants, les échanges, les sessions et les mécanismes de sécurité.

**Phase 3 — Mise en place du moteur d'interaction côté backend**

Préparer l'intégration du fournisseur, l'exécution des navigateurs et la gestion des sessions.

**Phase 4 — Mise en place de la communication et de la visualisation**

Permettre la transmission des états, des événements et de la représentation visuelle du navigateur.

**Phase 5 — Intégration dans EGEN Core**

Développer l'application de visualisation et de supervision en respectant les conventions du frontend existant.

**Phase 6 — Intégration dans l'environnement IA**

Permettre aux agents autorisés d'utiliser les capacités Browser Interaction.

**Phase 7 — Tests, sécurité et validation**

Vérifier les interactions, les sessions simultanées, la fidélité de la visualisation, les autorisations et la stabilité globale.

Vous pouvez modifier, fusionner ou subdiviser ces phases si votre étude démontre qu'une autre organisation est plus appropriée. Toute modification devra être justifiée.

## 9.4. Scénarios de validation

Proposer des scénarios concrets permettant de vérifier que le système répond aux objectifs.

Au minimum :

1. Un agent ouvre une application EGEN.
2. Il navigue dans plusieurs pages d'une SPA.
3. Il ouvre des menus et interagit avec des composants dynamiques.
4. Il remplit et soumet un formulaire.
5. Il réalise une opération de glisser-déposer.
6. Il vérifie le résultat d'une opération.
7. Un utilisateur visualise l'ensemble des actions dans ESM Core.
8. Un utilisateur suspend puis reprend une session.
9. Une session est arrêtée et ses ressources sont correctement libérées.
10. Plusieurs sessions fonctionnent simultanément sans interférer.
11. Une tentative d'accès à une ressource non autorisée est bloquée.

## 9.5. Inventaire des modifications nécessaires

Présenter les éléments qui devront être :

- Créés.
- Adaptés.
- Réutilisés.
- Configurés.
- Déployés.

Pour le frontend, identifier précisément les applications, modules, points d'entrée et composants concernés dans le dépôt existant.

Pour le backend, identifier les services et responsabilités concernés.

Ne créez pas artificiellement des noms de fichiers, des répertoires ou des services en prétendant qu'ils existent déjà. Distinguez clairement les propositions des éléments constatés.

---

# 10. RÈGLES DE CONDUITE DE LA MISSION

Durant cette étude, vous devez respecter les règles suivantes :

1. Ne commencez pas l'implémentation avant d'avoir terminé l'étude et présenté vos conclusions.
2. Ne partez pas du principe que l'architecture idéale est nécessairement celle que vous connaissez déjà.
3. Examinez le code réellement présent avant de formuler vos propositions.
4. Respectez les conventions architecturales et de développement d'EGEN.
5. Évitez les dépendances inutiles.
6. Ne dupliquez pas les mécanismes déjà disponibles dans l'écosystème.
7. Ne déplacez pas dans le frontend des responsabilités qui appartiennent au backend.
8. Ne transformez pas AgentCursor en dépendance directe du frontend.
9. Privilégiez une architecture modulaire et remplaçable.
10. Justifiez les choix importants.
11. Identifiez clairement les limites techniques qui ne peuvent pas être garanties.
12. Ne confondez pas les fonctionnalités annoncées par un projet avec celles qui ont été effectivement vérifiées.

Si une fonctionnalité demandée ne peut pas être obtenue avec AgentCursor seul, expliquez ce qui manque et proposez les éléments complémentaires nécessaires.

---

# 11. RÉSULTAT FINAL ATTENDU

À la fin de cette mission, nous devons disposer d'une vision claire et validée du système à construire.

Nous devons savoir précisément :

- Comment AgentCursor sera intégré.
- Comment les navigateurs seront exécutés et administrés.
- Comment les agents utiliseront les capacités d'interaction.
- Comment les sessions seront gérées.
- Comment les opérations seront diffusées et visualisées.
- Comment le frontend Core sera intégré sans porter de responsabilités backend.
- Comment l'ensemble respectera l'architecture existante d'EGEN.
- Quelles modifications seront nécessaires.
- Dans quel ordre les réaliser.
- Quels résultats seront attendus à chaque phase et à chaque étape.

**Le résultat recherché est un système Browser Interaction centralisé côté backend, réutilisable par les agents EGEN, dont le frontend Core constitue uniquement l'interface de visualisation et de supervision.**

Le système doit permettre à un agent IA d'utiliser une application Web comme un utilisateur humain, tout en permettant à un utilisateur autorisé de suivre visuellement son travail depuis l'environnement ESM Core.

Votre mission immédiate est donc de réaliser cette étude, d'examiner les dépôts et l'architecture existante, de confronter les objectifs aux possibilités réelles des solutions retenues et de produire une proposition de réalisation structurée en phases et en étapes.

**Ne commencez aucun développement à ce stade. Nous attendons d'abord votre rapport d'étude, vos conclusions et votre feuille de route détaillée.**










Je vais prendre deux scénarios qui démontrent deux intérêts très différents du Browser Interaction dans EGEN :

1. **Scénario administratif :** un agent IA accompagne un responsable dans la création et la gestion d'un dossier administratif à travers plusieurs modules EGEN.
2. **Scénario d'interopérabilité :** un agent IA travaille avec plusieurs applications Web différentes, dont certaines ne disposent pas d'intégration API avec EGEN.

Le premier démontre l'intérêt pour les utilisateurs internes d'EGEN. Le deuxième démontre l'intérêt stratégique de cette capacité : permettre aux agents de travailler avec des systèmes numériques hétérogènes sans devoir développer une intégration spécifique pour chaque application.

# **Scénario 1 — Un agent IA devient l'assistant opérationnel d'un responsable administratif**

Cas d'usage métier EGEN

## **1. Contexte**

Imaginons une université utilisant EGEN pour gérer ses activités administratives et académiques.

Un responsable administratif doit inscrire un nouvel enseignant vacataire dans le système.

Cette opération nécessite normalement plusieurs manipulations :

- Vérifier les informations de l'enseignant.
- Accéder au module de gestion des personnes.
- Créer ou retrouver son identité.
- L'associer à l'organisation concernée.
- Lui attribuer une fonction.
- Compléter son dossier administratif.
- Vérifier son affectation.
- Contrôler que les informations sont correctement enregistrées.

Ces opérations sont réparties dans plusieurs interfaces et peuvent nécessiter plusieurs minutes de navigation.

Le responsable décide de solliciter son agent IA EGEN.

**Son objectif : déléguer une opération administrative complète sans avoir à parcourir lui-même tous les modules.**

## **2. Situation de départ**

Le responsable est connecté à son environnement EGEN.

[BUKSU SIAS: Modern Student Information & · Built with Blink](https://images.openai.com/static-rsc-4/WazYY3fvn8FS0xOdFIzJ8DaQs9y7dONIBL0eCqqk1iKkcFillZs_y5fQ8B2rGFNuxLy6mPzDYSuBWcgn7o1OQ0BKvrUwKnAiV_DE_z0gGW_SBHC-NGEmEPYY9f-yz2bCERypUo6WX5mAkrOri2zJ-342IeIk6iDBeGtCvFUHdfQ?purpose=inline)

[blink.new](https://blink.new/p/buksu-sias-modern-student-academic-system-7h5em9cf?utm_source=chatgpt.com)

Il ouvre son assistant IA et formule sa demande :

> Je souhaite enregistrer un nouvel enseignant vacataire dans l'établissement. Voici ses informations : nom, prénom, adresse électronique, numéro de téléphone, spécialité et département d'affectation. Crée son dossier, associe-le à notre organisation et prépare son affectation. Ne valide aucune opération définitive nécessitant mon approbation sans me consulter.

L'agent reçoit la demande.

Il comprend qu'il doit réaliser plusieurs opérations dans différentes parties de l'application.

Il identifie :

- L'organisation concernée.
- Les données nécessaires.
- Les opérations à effectuer.
- Les autorisations disponibles.
- Les éventuelles validations humaines requises.

Il construit son plan d'exécution.

## **3. Déroulement de l'opération**

### **Étape 1 — Préparation de la session Browser Interaction**

L'agent décide qu'une interaction avec l'interface est nécessaire.

Il demande au backend de créer une session Browser Interaction.

Le backend :

1. Vérifie l'identité de l'agent.
2. Vérifie les autorisations associées à l'utilisateur.
3. Identifie l'application EGEN autorisée.
4. Prépare un environnement de navigation.
5. Démarre le navigateur.
6. Ouvre l'application EGEN.
7. Initialise la session d'interaction.
8. Rend la session disponible à l'agent.

Dans le frontend Core, le responsable voit apparaître une nouvelle session.

[Browser Automation for AI agents — AgentsRoom Browser MCP, Chromium control, Claude QA agent end-to-end testing | AgentsRoom](https://images.openai.com/static-rsc-4/vsmr5hnBygfoMU_fd9Tya7LV-NKuUMhb8tqqXfVKhpSkG2IrdY9HTJyFIWHfMqDf856ZvRFuEWw-AwVWLLSIlet-v7NMqhmPT97DvmxsEZuQT42IHX17jhkiC8KZcJk_7V-0dymFVMxNUicty7YRwz7R8EwT0A87XguP3-OlXRo?purpose=inline)

[agentsroom.dev](https://agentsroom.dev/features/browser-automation?utm_source=chatgpt.com)

Il peut constater :

- L'agent qui travaille.
- L'application concernée.
- L'état de la session.
- La page actuellement ouverte.
- Les opérations en cours.

Il n'a rien à configurer. Le navigateur est entièrement préparé côté backend.

### **Étape 2 — Exploration de l'interface**

L'agent arrive sur le tableau de bord EGEN.

Il observe l'interface.

Il identifie les éléments disponibles :

- Le menu des organisations.
- Le module des personnes.
- Le module des affectations.
- Le module des dossiers administratifs.

Il décide de commencer par le module des personnes.

Dans la visualisation ESM Core, le responsable voit :

[Targetym AI - Plateforme RH & Performance augmentée par l'IA](https://images.openai.com/static-rsc-4/5Qmqyxn42UIDLBSkpRAsK6iilvp-xi-jBXWd8duJODd1Ma25IYf3YDJNXdiTKyE8mWNqNgwUMuGnzZza8dz8-j_D0DTWprXCsZPkBDQPSAn1ShX2YiN0QbLETQZ-2_A1d32w187BOumd4RQo2pn9KhKK-Obw9KBDmGuqdcIxrRw?purpose=inline)

[targetym.ai](https://www.targetym.ai/?utm_source=chatgpt.com)

Le curseur se déplace vers le menu correspondant.

Il survole l'élément, ouvre le menu et sélectionne la rubrique.

La page change.

L'agent observe le nouvel écran et identifie le bouton de création d'une personne.

Il ne se contente pas de suivre un chemin préprogrammé : il observe l'état réel de l'interface pour déterminer la prochaine action.

### **Étape 3 — Vérification de l'existence de la personne**

L'agent ouvre le répertoire des personnes.

Il recherche l'enseignant à partir des informations disponibles.

Il examine les résultats.

Deux situations sont possibles :

- La personne existe déjà : il ne crée pas un doublon et vérifie son dossier.
- La personne n'existe pas : il poursuit la création.

Dans notre scénario, la personne n'existe pas.

L'agent clique sur « Créer une personne ».

Une fenêtre de création apparaît.

### **Étape 4 — Remplissage du formulaire**

[Set Up Employees](https://images.openai.com/static-rsc-4/uIJdKwg7gfVFYUSsTL3Lc_A8G-Oq-BLkHrjNww7s0wYk4YmQaD5Pmi75Fat4trElis149e9zu0nzF2VAyZ6GgA_kyQt6VPR1efx2vUCxSS3m9lEgW0EGX9xrKCEekkTwowSnuRTijPTBekXuVBBtnfyg87qE6yTKBrMb3kp2-Oo?purpose=inline)

[help.nice-incontact.com](https://help.nice-incontact.com/content/admin/employees/setupemployees.htm?utm_source=chatgpt.com)

L'agent :

1. Identifie le champ du nom.
2. Saisit le nom.
3. Identifie le champ du prénom.
4. Saisit le prénom.
5. Renseigne l'adresse électronique.
6. Renseigne le téléphone.
7. Sélectionne les informations complémentaires.
8. Vérifie les champs obligatoires.
9. Contrôle les valeurs saisies.

Le responsable observe réellement le curseur se déplacer et les champs se remplir dans la fenêtre du navigateur.

L'agent remarque ensuite qu'une information obligatoire manque.

Il ne l'invente pas.

Il demande au responsable de la fournir.

Le responsable transmet l'information manquante.

L'agent reprend son opération.

### **Étape 5 — Création du dossier administratif**

La personne étant enregistrée, l'agent ouvre le module administratif.

Il parcourt les rubriques nécessaires.

Il identifie les champs correspondant au dossier administratif.

Il complète les informations autorisées.

Il associe le dossier à la bonne organisation.

Il vérifie les informations avant validation.

À ce stade, le système peut distinguer les opérations préparatoires des opérations définitives.

L'agent peut remplir un formulaire et préparer une opération, mais ne doit pas franchir une étape nécessitant une approbation sans l'obtenir.

### **Étape 6 — Association à l'organisation et affectation**

L'agent ouvre le module des organisations.

Il navigue vers l'établissement concerné.

Il identifie le département demandé.

Il ouvre le formulaire d'affectation.

[Browse thousands of Hr Dashboard UI images for design inspiration | Dribbble](https://images.openai.com/static-rsc-4/yE8-jBCu1lvD7BHucbtFeUFwPgflZN4WDiNz1TjfBCTZQLiRlMETevhlhgqiPzTnixpUJku-8Q-ZDt2BKXZmCjAjp4gTHNgAlbNrZH6v19MURGAcqWWowubpNvzj7hn4QnZVBb5JDxbm-pFo9CKeiNYcPvP-6tbt7o1uyCVU7W8?purpose=inline)

[dribbble.com](https://dribbble.com/search/hr-dashboard-ui?utm_source=chatgpt.com)

Il sélectionne :

- L'organisation.
- Le département.
- La fonction.
- Le type de relation professionnelle.

Il vérifie que les informations correspondent à la demande initiale.

Il prépare l'affectation.

Si l'affectation nécessite une validation, il s'arrête et présente une demande d'approbation au responsable.

### **Étape 7 — Intervention humaine**

Le responsable reçoit une notification dans EGEN.

Il ouvre la session.

Il voit le formulaire préparé et les informations renseignées.

L'agent explique :

> Le dossier de l'enseignant a été préparé. L'identité est créée, l'organisation est identifiée et l'affectation au département est prête. Une validation est nécessaire pour finaliser l'opération.

Le responsable examine les informations.

Il peut demander une correction ou autoriser la validation.

L'agent ne considère pas une simple demande de validation comme une autorisation obtenue.

Après approbation explicite, il poursuit l'opération.

### **Étape 8 — Vérification finale**

L'agent valide l'opération.

Il attend le résultat de l'application.

Il vérifie que :

- La personne apparaît dans le répertoire.
- Le dossier administratif existe.
- L'organisation est correctement associée.
- L'affectation apparaît dans le module concerné.
- Aucune erreur n'est affichée.

Il ne déclare pas une opération réussie uniquement parce qu'il a cliqué sur le bouton d'enregistrement.

Il doit observer une confirmation réelle.

### **Étape 9 — Rapport final**

L'agent présente au responsable un compte rendu :

**Compte rendu de l'opération**

Terminé

- Identité de l'enseignant créée.
- Dossier administratif préparé et enregistré.
- Organisation associée.
- Affectation validée après approbation.
- Vérification des informations effectuée.

**Résultat :** le dossier est opérationnel dans l'application.

Les références et preuves d'enregistrement sont conservées dans l'historique de la session, selon les règles de journalisation.

## **4. Ce que ce scénario apporte à l'utilisateur**

Avant Browser Interaction :

- L'utilisateur doit connaître les modules.
- Il doit savoir où se trouvent les fonctionnalités.
- Il doit naviguer manuellement.
- Il doit remplir plusieurs formulaires.
- Il doit gérer lui-même les étapes successives.
- Il doit vérifier les résultats dans plusieurs endroits.

Après Browser Interaction :

- Il exprime son besoin.
- L'agent comprend l'objectif.
- Il effectue les manipulations nécessaires.
- L'utilisateur observe le travail.
- Il intervient uniquement lorsque son autorisation ou son jugement est nécessaire.

**La valeur réelle : EGEN ne devient plus seulement un logiciel que les utilisateurs doivent apprendre à manipuler. Il devient un environnement que les utilisateurs peuvent faire travailler à leur place, sous leur contrôle.**

# **Scénario 2 — Un agent IA travaille avec plusieurs applications Web indépendantes**

Interopérabilité et automatisation

## **1. Contexte**

Imaginons maintenant une organisation qui utilise EGEN, mais également plusieurs applications externes :

- Un logiciel de gestion financière.
- Une plateforme de gestion des ressources humaines.
- Un portail administratif gouvernemental.
- Une application de gestion documentaire.
- Une plateforme de reporting.

Ces applications sont indépendantes.

Elles possèdent leurs propres interfaces, leurs propres mécanismes d'authentification et leurs propres modes de fonctionnement.

Certaines ne proposent pas d'API publique exploitable.

D'autres disposent d'API, mais leur intégration nécessiterait des développements spécifiques.

L'organisation souhaite néanmoins automatiser un processus transversal.

**L'objectif : préparer et réaliser une opération administrative qui implique plusieurs systèmes sans développer une intégration spécifique entre chacun d'eux.**

## **2. Situation de départ**

Un directeur administratif demande à son agent :

> Prépare le dossier de recrutement de ce nouvel employé. Enregistre ses informations dans notre système RH, vérifie les informations nécessaires sur le portail administratif, prépare son dossier documentaire et renseigne les informations correspondantes dans notre environnement EGEN. Fais-moi un rapport des opérations et demande mon approbation avant toute validation définitive.

Cette demande concerne plusieurs applications.

L'agent doit comprendre que le processus est transversal.

Il décompose la mission en plusieurs opérations.

[Glidesk - Intelligent Workforce Management for Modern Enterprises](https://images.openai.com/static-rsc-4/Ti2uMbICmAHwJ8V3cVE1nqIPPTkH9WtrfJcFkBOihJ33KAL4agW516CHci0NvF7stO_cSUQVf3GBdBlHU4OkYdeVnmR38RI0YGln91ZT_gstZOLtjUFPCF8NoMl_bsUbc4si8Hy210dSqKahi6UU9KXV6AhcH5Xa2T20HMtIpBM?purpose=inline)

[glidesk.com](https://glidesk.com/?utm_source=chatgpt.com)

## **3. Préparation du travail**

L'agent identifie les applications nécessaires.

Le backend Browser Interaction prépare les sessions autorisées.

Par exemple :

| Session | Application           | Objectif                                |
| ------- | --------------------- | --------------------------------------- |
| 1       | EGEN                  | Préparer le dossier interne             |
| 2       | Logiciel RH           | Enregistrer les informations du salarié |
| 3       | Portail administratif | Vérifier les informations disponibles   |
| 4       | Gestion documentaire  | Déposer et classer les pièces           |

Chaque session est isolée.

L'agent ne mélange pas les contextes des différents systèmes.

Le responsable peut visualiser les sessions depuis son interface EGEN.

## **4. Première application : le système RH**

L'agent ouvre le logiciel RH.

[Support Lucca](https://images.openai.com/static-rsc-4/XaOghQOs-JMsec57z2Kun8nYEtCQY3-pG8VA9OiXg0pPp7lp-zO4TtO2_Gedm6udUMWRFh1IXWEx6zc0VZH1B7MHRaFALHVXasrW3xxZx-Are98QkL-z0B2HfQw3bHKm_vLpingxUhAOBjkIavPiW31XJWpSIaQJBBRd6h8F7Dw?purpose=inline)

[support.luccasoftware.com](https://support.luccasoftware.com/s/article/param%C3%A9trer-l-onboarding?utm_source=chatgpt.com)

Il observe l'interface.

Il identifie le module des employés.

Il ouvre le formulaire de création.

Il renseigne les informations communiquées par le directeur.

Il sélectionne les paramètres demandés.

Il vérifie les champs.

Il prépare l'enregistrement.

L'application RH ne dispose pas nécessairement d'une API accessible à EGEN.

Mais cela ne bloque pas nécessairement l'opération : l'agent utilise les fonctionnalités de l'interface Web comme un utilisateur autorisé.

Il ne contourne pas les protections de l'application.

## **5. Deuxième application : le portail administratif**

L'agent ouvre une deuxième session.

Il accède au portail administratif autorisé.

[Edistrict Delhi Govt Portal - Online Govt Services for Delhi Citizens](https://images.openai.com/static-rsc-4/GEvIcbynXq78DUEfddqTUSFmVG2spOhdK-6eXM-Zn3KsjVRoB5Xw2-NxShlh6gaT7b5CqwfWUZ8VmdMVaoIGM-i2Y5AcuEzUUDXh126L4M-MvnlXaJoNPD6ZuuP9Y9oAiSrEL-eI6WrzGuty7tlSuASz9PAZYPZHcA46MfNQHAU?purpose=inline)

[magicbricks.com](https://www.magicbricks.com/blog/edistrict-delhi-govt/132976.html?utm_source=chatgpt.com)

Il navigue dans les rubriques disponibles.

Il recherche les informations nécessaires.

Il observe les résultats.

Il vérifie les données qui peuvent légalement être consultées par l'organisation.

Si le portail demande une authentification supplémentaire, un CAPTCHA ou une validation humaine, l'agent s'arrête et sollicite l'intervention appropriée.

Il ne cherche pas à contourner ces protections.

Les informations obtenues sont comparées à celles communiquées par le directeur.

En cas de différence, l'agent signale l'écart au lieu de modifier arbitrairement les informations.

## **6. Troisième application : gestion documentaire**

L'agent ouvre le système documentaire.

[Top 5 Data Room Software Options for Investors, VCs, and Startup Deal Teams](https://images.openai.com/static-rsc-4/pNXv8-PMTWlFXbg7Uk1_W4stVzC8wiXLXFECVylD7qZsjzf_KHXEh7iHVN8IMC39K-ZjCM1Fnqyhbrror0Qz9UG8mjHfeXznMcLiWiI770GA4Yv5v5xA7EdbJy_bOwxAi4OYqsaD6Accnw2edCs3lBXTE2VvpTCYW3QZYJqimKQ?purpose=inline)

[techloy.com](https://www.techloy.com/top-5-data-room-software-options-for-investors-vcs-and-startup-deal-teams/?utm_source=chatgpt.com)

Il identifie les catégories documentaires.

Il crée ou prépare le dossier correspondant au nouvel employé.

Il classe les documents disponibles.

Il renseigne les métadonnées.

Il vérifie que les documents sont correctement associés.

Si une pièce manque, il le signale.

L'agent ne fabrique pas de justificatifs et ne déclare pas qu'un document existe lorsqu'il n'a pas pu le vérifier.

## **7. Quatrième application : retour dans EGEN**

L'agent retourne dans l'application EGEN.

Il ouvre le dossier de l'organisation.

Il renseigne les informations nécessaires.

Il associe les références documentaires.

Il met à jour le suivi du processus.

Il prépare le dossier pour validation.

Cette opération est particulièrement intéressante : EGEN peut devenir le point de coordination d'activités réalisées dans plusieurs systèmes indépendants.

## **8. Supervision centralisée**

Pendant tout le processus, le directeur peut consulter les opérations depuis EGEN.

[rtrvr.ai: Retrieve, Research, Robotize the Web with AI](https://images.openai.com/static-rsc-4/aCJlzi6_-ebgMUSbc12BP-OikTKlXSSsLi6e5SJqnzK_Bpe9Kt5qv680NcKShkCqTiih92YJnwsbOj8namR_NyXp78FpRBNH76MQ5UasyZW3qz7TyH9-Xt9jkP9Q8J1aNzEGRBId5a4qWHErxcsEdU5GuzyEnoJ9C0dyq6z3ddk?purpose=inline)

[rtrvr.ai](https://www.rtrvr.ai/blog?utm_source=chatgpt.com)

Il peut suivre chaque session :

- Le système RH.
- Le portail administratif.
- La gestion documentaire.
- EGEN.

Il voit les actions effectuées, les changements de pages, les formulaires remplis et les résultats observés.

Il n'a pas besoin d'ouvrir quatre applications sur son propre ordinateur.

Il dispose d'un environnement centralisé de supervision.

Il peut également interrompre une session si une anomalie est détectée.

## **9. Gestion d'une anomalie**

Imaginons que le logiciel RH refuse l'enregistrement parce que le numéro de téléphone est déjà associé à un autre dossier.

L'agent constate l'erreur.

Il ne recommence pas aveuglément l'opération.

Il :

1. Identifie le message d'erreur.
2. Comprend que l'enregistrement n'a pas été confirmé.
3. Suspend cette partie du processus.
4. Informe le directeur.
5. Attend ses instructions.

Le reste du processus peut être conservé dans son état courant.

Une fois le problème résolu, l'agent peut reprendre le travail si la session est toujours valide.

C'est important : l'agent ne doit pas seulement être capable de cliquer. Il doit savoir gérer les situations dans lesquelles une interaction échoue.

## **10. Validation et rapport final**

Après avoir terminé les différentes opérations préparatoires, l'agent présente un rapport consolidé.

**Rapport transversal — Recrutement**

Préparation terminée

**Système RH**

Dossier préparé

Vérifié

**Portail administratif**

Informations consultées

Vérifié

**Gestion documentaire**

Dossier classé

Vérifié

**EGEN**

Dossier interne préparé

Vérifié

**Décision attendue**

Validation du directeur avant les enregistrements définitifs nécessitant son approbation.

## **11. Ce que ce scénario apporte à l'organisation**

Sans Browser Interaction :

- Il faut intégrer chaque logiciel individuellement.
- Il faut développer des connecteurs spécifiques.
- Il faut gérer les différences entre les API.
- Il faut maintenir ces intégrations.
- Les applications sans API restent difficiles à automatiser.

Avec Browser Interaction :

- L'agent peut utiliser les interfaces existantes.
- Il peut travailler avec plusieurs applications indépendantes.
- Il peut enchaîner des opérations transversales.
- Il peut observer les résultats.
- Il peut demander une intervention humaine.
- L'organisation peut centraliser la supervision dans EGEN.

**La valeur stratégique : EGEN peut devenir une plateforme d'orchestration du travail numérique, capable de mobiliser des applications qui ne font pas nécessairement partie de son propre écosystème.**

# **3. Comparaison des deux scénarios**

| Dimension         | Scénario 1 : EGEN            | Scénario 2 : Multi-applications        |
| ----------------- | ---------------------------- | -------------------------------------- |
| Environnement     | Applications EGEN            | Applications indépendantes             |
| Utilisateur       | Responsable administratif    | Directeur / gestionnaire               |
| Objectif          | Exécuter un processus métier | Coordonner un processus transversal    |
| Navigation        | Plusieurs modules EGEN       | Plusieurs logiciels Web                |
| Intérêt principal | Productivité                 | Interopérabilité opérationnelle        |
| Valeur            | Simplification du travail    | Réduction des intégrations spécifiques |
| Supervision       | Depuis ESM Core              | Depuis ESM Core                        |

# **4. Ce que ces scénarios démontrent pour EGEN**

Il y a quatre capacités fondamentales à retenir.

**1. Capacité d'action**

L'agent ne se limite plus à répondre ou à appeler des services. Il peut utiliser les interfaces Web pour réaliser des opérations.

**2. Capacité d'observation**

L'agent observe l'état des interfaces, comprend les résultats et adapte ses actions.

**3. Capacité d'orchestration**

L'agent peut enchaîner des opérations, naviguer entre plusieurs modules et travailler avec différents logiciels.

**4. Capacité de collaboration humain-agent**

L'utilisateur peut observer, intervenir, approuver, corriger et reprendre le contrôle lorsque nécessaire.

# **5. La vision à long terme : un utilisateur qui délègue, un agent qui agit**

Ces deux scénarios permettent de comprendre que Browser Interaction n'est pas simplement une fonctionnalité permettant à une IA de déplacer une souris.

C'est une nouvelle capacité opérationnelle pour les agents EGEN.

Jusqu'à présent, un agent IA pouvait principalement :

- Comprendre une demande.
- Produire une réponse.
- Consulter des informations.
- Appeler des outils.
- Interagir avec des API.

Avec cette nouvelle capacité, il peut également :

- Utiliser des logiciels.
- Manipuler des interfaces.
- Effectuer des tâches répétitives.
- Travailler dans des applications qui ne disposent pas de connecteurs spécifiques.
- Coordonner des processus entre plusieurs systèmes.
- Vérifier visuellement le résultat de son travail.

Il faut néanmoins garder une distinction : Browser Interaction ne remplace pas les API métier, les connecteurs natifs ou les mécanismes d'interopérabilité structurés lorsqu'ils existent. Il constitue une capacité complémentaire, notamment lorsque l'interaction par interface est nécessaire ou que les intégrations directes ne sont pas disponibles.

**La vision que je retiendrais pour EGEN :**

> Un agent ne doit pas être limité aux fonctionnalités que son système sait appeler directement. Lorsqu'il en a l'autorisation, il doit également pouvoir utiliser les environnements numériques auxquels un utilisateur humain a accès, accomplir des tâches dans ces environnements et rendre compte de son travail.

C'est ce passage d'un agent qui assiste intellectuellement à un agent qui participe réellement à l'exécution du travail qui donne tout son intérêt à ce projet.

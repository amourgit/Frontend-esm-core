# INTÉGRATION DE TWEAKCN DANS EGEN CORE
## Création du Theme Studio natif d'EGEN

## 1. OBJECTIF

Nous avons décidé d'utiliser **TweakCN comme base de l'application de création et de personnalisation visuelle des thèmes d'EGEN**.

L'objectif n'est pas d'ajouter TweakCN comme une application externe à côté d'EGEN.

Nous voulons **intégrer et adapter profondément TweakCN dans le Core EGEN** afin qu'il devienne le **Theme Studio natif du framework**.

Le résultat final doit être une application intégrée à EGEN permettant aux utilisateurs autorisés de construire, modifier, prévisualiser, importer, exporter et appliquer leurs Design Systems directement depuis l'environnement EGEN.

TweakCN constitue donc **la base de l'expérience d'édition visuelle**, mais le résultat final doit être une expérience EGEN.

---

# 2. IMPORTANT : NE PAS ESSAYER DE CONSERVER TWEAKCN TEL QUEL

TweakCN est un point de départ.

Il ne faut pas considérer son interface, son organisation interne, son modèle de thème ou ses limites actuelles comme définitifs.

Nous devons conserver ce qui est pertinent dans son expérience de création visuelle et adapter tout le reste aux besoins d'EGEN.

Le résultat recherché n'est donc pas :

> « TweakCN intégré dans EGEN »

mais :

> **« EGEN Theme Studio, construit à partir de TweakCN. »**

La différence est importante.

L'utilisateur final ne doit pas avoir l'impression d'utiliser une application tierce intégrée artificiellement dans EGEN.

Il doit avoir l'impression que le Theme Studio fait naturellement partie du framework.

---

# 3. LE RÉSULTAT FINAL ATTENDU

Le Theme Studio doit permettre à un utilisateur de construire visuellement l'apparence complète d'EGEN.

Il doit pouvoir :

- créer un thème ;
- partir d'un thème existant ;
- dupliquer un thème ;
- modifier un thème ;
- importer un thème ;
- exporter un thème ;
- prévisualiser les changements ;
- appliquer un thème ;
- changer de thème à chaud ;
- créer des variantes ;
- gérer Light/Dark ;
- personnaliser les composants ;
- personnaliser les états ;
- personnaliser les effets ;
- personnaliser la typographie ;
- personnaliser les dimensions ;
- personnaliser les surfaces ;
- personnaliser les layouts ;
- etc.

Le niveau de précision recherché est très élevé.

Nous devons pouvoir passer :

**du design global**

jusqu'à

**la propriété visuelle d'un composant précis.**

---

# 4. LE THEME STUDIO DOIT ÊTRE VISUEL

L'utilisateur ne doit pas être obligé de manipuler directement le JSON pour construire son thème.

Le JSON existe comme représentation structurée et échangeable du thème.

Mais l'interface principale doit être visuelle.

L'utilisateur doit pouvoir modifier une propriété et voir immédiatement son résultat.

Par exemple :

Il modifie le rayon des boutons.

Il doit voir immédiatement les boutons changer.

Il modifie la couleur primaire.

Il doit voir immédiatement les composants concernés changer.

Il modifie une ombre.

Il doit voir immédiatement les surfaces concernées évoluer.

Il modifie la typographie.

Il doit voir immédiatement la hiérarchie visuelle évoluer.

---

# 5. LE SYSTÈME DOIT ÊTRE CONÇU AUTOUR DU DESIGN SYSTEM EGEN

TweakCN possède son propre contexte de Design System.

Nous devons progressivement le faire évoluer pour qu'il corresponde au contexte EGEN.

Le Theme Studio EGEN doit pouvoir représenter plusieurs catégories de design.

### Fondations

Notamment :

- couleurs ;
- typographie ;
- tailles ;
- poids ;
- espacements ;
- rayons ;
- bordures ;
- ombres ;
- opacités ;
- effets ;
- blur ;
- transitions ;
- animations ;
- icônes ;
- responsive ;
- etc.

### Surfaces

Notamment :

- background ;
- card ;
- popover ;
- sidebar ;
- header ;
- modal ;
- dropdown ;
- toast ;
- tooltip ;
- overlay ;
- input ;
- etc.

### Layout

Notamment :

- header ;
- sidebar ;
- contenu ;
- footer ;
- largeur maximale ;
- espacements ;
- grilles ;
- breakpoints ;
- etc.

---

# 6. LES COMPOSANTS DOIVENT DEVENIR PERSONNALISABLES

Le Theme Studio doit progressivement permettre de personnaliser les composants EGEN.

Par exemple :

- Button ;
- Input ;
- Select ;
- Checkbox ;
- Radio ;
- Switch ;
- Card ;
- Badge ;
- Alert ;
- Dialog ;
- Modal ;
- Dropdown ;
- Tabs ;
- Table ;
- Tooltip ;
- Toast ;
- Navigation ;
- Sidebar ;
- Header ;
- etc.

Il ne faut pas limiter l'éditeur aux propriétés globales.

La vision est de pouvoir descendre jusqu'au composant.

---

# 7. LES VARIANTES DOIVENT ÊTRE PRISES EN COMPTE

Un composant peut avoir plusieurs variantes.

Par exemple, un bouton peut avoir :

- primary ;
- secondary ;
- destructive ;
- success ;
- warning ;
- outline ;
- ghost ;
- transparent ;
- etc.

Le Theme Studio doit permettre de gérer ces variantes lorsqu'elles existent dans le Design System EGEN.

L'objectif est que l'utilisateur puisse personnaliser une variante sans nécessairement modifier toutes les autres.

---

# 8. LES ÉTATS DOIVENT ÊTRE PERSONNALISABLES

La personnalisation doit également pouvoir concerner les états.

Par exemple :

- default ;
- hover ;
- focus ;
- active ;
- disabled ;
- selected ;
- loading ;
- readonly ;
- error ;
- success.

L'utilisateur doit pouvoir définir l'apparence correspondant à ces états.

Le système doit conserver une cohérence entre :

**composant → variante → état.**

---

# 9. LE JSON EST IMPORTANT

Le Theme Studio doit fonctionner avec une représentation structurée du thème.

Nous avons déjà un modèle de thème EGEN riche contenant notamment :

- colors ;
- surface ;
- border ;
- typography ;
- layout ;
- borderRadius ;
- shadows ;
- animation ;
- transitions ;
- effects ;
- zIndex ;
- icons ;
- panels ;
- light/dark ;
- variantes ;
- tailles ;
- etc.

Cette richesse doit être prise en compte dans la nouvelle solution.

Il ne faut pas réduire le thème EGEN au modèle minimal utilisé par TweakCN.

TweakCN doit être adapté afin de pouvoir travailler avec le niveau de richesse recherché par EGEN.

---

# 10. LE THÈME EGEN DOIT RESTER LA SOURCE DE VÉRITÉ

L'objectif n'est pas de faire de TweakCN le propriétaire du modèle de thème d'EGEN.

EGEN doit conserver la maîtrise de son système de Design System.

TweakCN fournit principalement l'expérience visuelle d'édition.

Le thème EGEN doit rester une entité propre au framework.

Cela signifie que nous devons pouvoir faire évoluer le système de thème EGEN indépendamment de TweakCN.

---

# 11. INTÉGRATION AVEC TOKIFORGE

Le Theme Studio doit être pensé dès le départ pour fonctionner avec TokiForge.

Le flux recherché est conceptuellement :

**Theme Studio EGEN**

→ création/modification visuelle

→ **Thème EGEN**

→ **TokiForge**

→ système de tokens/design runtime

→ composants EGEN

Le Theme Studio ne doit donc pas créer un deuxième moteur de tokens.

TokiForge doit assurer le rôle de moteur du système de Design System.

Le Theme Studio est l'interface permettant à l'utilisateur de manipuler ce système.

---

# 12. APPLICATION À CHAUD

Le Theme Studio doit permettre de voir les changements immédiatement.

Lorsque l'utilisateur modifie le thème, les composants utilisés dans la prévisualisation doivent changer sans nécessiter de reconstruction manuelle de l'application.

À terme, le même mécanisme doit permettre de modifier le thème actif d'un environnement EGEN à chaud.

L'objectif est de pouvoir passer par exemple :

**Thème A → Thème B**

sans modifier les applications.

---

# 13. PRÉVISUALISATION

Le Theme Studio doit fournir une zone permettant de visualiser le résultat.

Cette prévisualisation doit être suffisamment riche pour montrer les conséquences réelles du thème.

Elle doit notamment pouvoir présenter :

- boutons ;
- champs ;
- cartes ;
- tableaux ;
- menus ;
- badges ;
- notifications ;
- dialogues ;
- panneaux ;
- navigation ;
- typographie ;
- états ;
- etc.

L'objectif est que le designer puisse comprendre le résultat avant de publier le thème.

---

# 14. LE THEME STUDIO DOIT POUVOIR TRAVAILLER SUR PLUSIEURS NIVEAUX

Il doit être possible d'avoir une approche progressive.

### Niveau global

Modifier l'identité générale.

### Niveau catégorie

Modifier par exemple :

- couleurs ;
- typographie ;
- surfaces ;
- effets ;
- layout.

### Niveau composant

Modifier un bouton ou une carte.

### Niveau variante

Modifier une variante particulière.

### Niveau état

Modifier hover, focus, disabled, etc.

Cela permet d'avoir une expérience adaptée aussi bien à un utilisateur qui veut simplement changer les couleurs qu'à un designer qui veut contrôler très précisément l'interface.

---

# 15. LE SYSTÈME DOIT PERMETTRE LES OVERRIDES

Il doit exister une logique claire entre les valeurs globales et les valeurs spécifiques.

Par exemple :

Le thème définit un rayon général.

Tous les composants peuvent naturellement l'utiliser.

Mais une carte particulière peut avoir un rayon différent.

La personnalisation spécifique doit pouvoir prendre le dessus sur la valeur générale lorsque cela est nécessaire.

Même logique pour :

- couleurs ;
- ombres ;
- bordures ;
- typographie ;
- espacements ;
- etc.

L'objectif est d'obtenir :

**cohérence par défaut + liberté lorsque nécessaire.**

---

# 16. LIGHT / DARK

Le Theme Studio doit prendre en charge les variantes de thème clair et sombre.

Il ne faut pas considérer le Dark Mode comme une simple inversion automatique.

Un thème peut définir des valeurs spécifiques pour :

- surfaces ;
- texte ;
- bordures ;
- ombres ;
- couleurs fonctionnelles ;
- transparence ;
- effets ;
- composants.

L'utilisateur doit donc pouvoir travailler sur les deux environnements.

---

# 17. IMPORT

Le Theme Studio doit permettre d'importer un thème existant.

Par exemple :

```text
theme.json
```

Le système doit pouvoir prendre ce thème et le rendre exploitable dans le Theme Studio.

L'utilisateur doit pouvoir :

1. importer ;
2. visualiser ;
3. modifier ;
4. prévisualiser ;
5. sauvegarder ;
6. appliquer ;
7. exporter.

---

# 18. EXPORT

Le résultat du travail doit pouvoir être exporté.

Le format principal attendu est le JSON du Design System EGEN.

L'export doit conserver la richesse du thème.

Il ne faut pas exporter uniquement quelques variables de couleur.

L'objectif est de pouvoir récupérer l'ensemble du thème construit.

---

# 19. COMPATIBILITÉ AVEC LES THÈMES GÉNÉRÉS

Le Theme Studio doit également être capable de recevoir des thèmes produits par d'autres systèmes.

À terme, nous voulons pouvoir avoir :

```text
Service de génération de thème
            ↓
       Theme JSON
            ↓
      Theme Studio
            ↓
       Modification
            ↓
        Validation
            ↓
        Application
```

Cela permettra plus tard d'intégrer :

- génération par IA ;
- générateur de thèmes ;
- outils de branding ;
- import de chartes graphiques ;
- services externes ;
- etc.

Le Theme Studio doit donc être pensé comme **l'interface universelle de gestion des thèmes EGEN**.

---

# 20. L'APPLICATION DOIT ÊTRE NATIVE À L'EXPÉRIENCE EGEN

L'intégration doit être naturelle.

Elle doit respecter :

- l'identité du Core ;
- la navigation ;
- les conventions visuelles ;
- les permissions ;
- les mécanismes de configuration ;
- les composants EGEN ;
- le système de thème lui-même.

L'utilisateur ne doit pas avoir l'impression d'être redirigé vers un outil externe.

---

# 21. LE THEME STUDIO DOIT POUVOIR ÊTRE UTILISÉ PAR DIFFÉRENTS PROFILS

Nous devons garder à l'esprit plusieurs usages.

### Utilisateur non technique

Il veut simplement :

> « Je veux que mon application soit bleue et orange. »

Il doit pouvoir le faire simplement.

### Administrateur

Il veut :

> « Je veux définir le thème officiel de mon organisation. »

Il doit pouvoir gérer le thème global.

### Designer

Il veut :

> « Je veux contrôler précisément chaque détail visuel. »

Il doit pouvoir aller beaucoup plus loin.

### Générateur automatique

Un service externe doit pouvoir :

> « produire un thème complet »

puis le transmettre au Theme Studio.

Le même système doit pouvoir répondre à ces différents besoins.

---

# 22. IL FAUT PRÉSERVER LA SIMPLICITÉ D'UTILISATION

La richesse du système ne doit pas rendre l'interface inutilisable.

Nous devons avoir une progression naturelle :

**Simple → Avancé → Expert**

Un utilisateur peut commencer par :

- couleurs ;
- police ;
- rayon ;
- mode clair/sombre.

Puis ouvrir les réglages avancés pour :

- composants ;
- variantes ;
- états ;
- effets ;
- transitions ;
- etc.

L'objectif est de ne pas exposer toute la complexité immédiatement.

---

# 23. CE QUI DOIT ÊTRE ADAPTÉ DE TWEAKCN

Le développeur doit étudier TweakCN et identifier notamment :

- l'éditeur visuel ;
- les contrôles ;
- les interactions ;
- les prévisualisations ;
- la gestion des thèmes ;
- la logique de modification ;
- l'expérience utilisateur ;
- les mécanismes d'import/export ;
- les éléments réutilisables.

Ces éléments constituent notre point de départ.

Mais tout ce qui est spécifiquement lié au modèle shadcn/Tailwind de TweakCN doit être progressivement remplacé ou adapté lorsque cela ne correspond pas à EGEN.

---

# 24. CE QUI NE DOIT PAS ÊTRE FAIT

Ne pas :

- créer un nouveau Theme Engine ;
- maintenir l'ancien système de thème EGEN ;
- faire fonctionner deux moteurs en parallèle ;
- enfermer EGEN dans le modèle de thème de TweakCN ;
- limiter EGEN aux possibilités natives de TweakCN ;
- limiter le thème EGEN à quelques variables CSS ;
- modifier manuellement chaque application pour chaque nouveau thème ;
- créer des composants spécifiques uniquement pour le Theme Studio.

---

# 25. LE THEME STUDIO DOIT ÊTRE UNE VITRINE DU DESIGN SYSTEM

Une conséquence importante de cette intégration est que le Theme Studio doit pouvoir montrer ce que le Design System EGEN sait réellement faire.

Si EGEN possède un nouveau composant, il doit progressivement pouvoir être représenté dans le Theme Studio.

Le Theme Studio devient donc également un moyen de :

- découvrir les composants ;
- visualiser leurs variantes ;
- visualiser leurs états ;
- tester un thème ;
- vérifier la cohérence du Design System.

---

# 26. OBJECTIF DE LONG TERME

À terme, nous voulons arriver à un système dans lequel :

Un développeur construit un nouveau composant EGEN.

Le composant respecte le Design System.

Le Theme Studio peut l'exposer.

Un designer peut le personnaliser.

TokiForge assure la gestion du système de tokens.

Le thème est appliqué immédiatement.

L'application existante n'a pas besoin d'être réécrite.

C'est cette boucle complète qui doit être recherchée.

---

# 27. VISION GLOBALE

Le résultat final doit pouvoir être résumé ainsi :

```text
                    EGEN CORE
                       │
                       ▼
               EGEN THEME STUDIO
                       │
             ┌─────────┼─────────┐
             │         │         │
          Visual      JSON    Preview
          Editor       │         │
             │         │         │
             └─────────┼─────────┘
                       ▼
                  TOKIFORGE
                       │
                       ▼
              DESIGN SYSTEM EGEN
                       │
          ┌────────────┼────────────┐
          │            │            │
       Components   Applications   Modules
          │            │            │
          └────────────┼────────────┘
                       ▼
                  EGEN RUNTIME
```

---

# 28. CRITÈRE DE RÉUSSITE

L'intégration sera considérée comme réussie lorsque l'on pourra faire quelque chose de très simple :

**prendre EGEN, ouvrir le Theme Studio, modifier profondément son apparence, voir immédiatement le résultat, sauvegarder le thème, l'exporter, le réimporter et l'appliquer sans modifier le code des applications.**

Et surtout :

**le même système doit pouvoir gérer aussi bien une modification très simple qu'une personnalisation extrêmement poussée.**

Exemple :

> « Change simplement la couleur principale. »

doit être aussi naturel que :

> « Je veux modifier précisément l'apparence des boutons, de leurs variantes, de leurs états, des cartes, des panneaux, des surfaces, de la typographie et des effets de toute l'application. »

Les deux doivent être possibles dans le même système.

---

# 29. DIRECTIVE FINALE AU DÉVELOPPEUR

Commence par étudier TweakCN comme base de travail.

Ne cherche pas à reproduire son code ou son comportement à l'identique.

Identifie ce qui peut devenir le socle de l'expérience visuelle du Theme Studio.

Ensuite, adapte progressivement cette expérience aux exigences du Design System EGEN.

Le résultat doit être **EGEN Theme Studio**, et non simplement TweakCN embarqué dans EGEN.

Le système doit être pensé dès le départ pour fonctionner avec TokiForge et avec le modèle de thème EGEN.

La priorité est :

1. une excellente expérience visuelle de création ;
2. une personnalisation extrêmement précise ;
3. une représentation complète du Design System ;
4. une prévisualisation immédiate ;
5. l'application dynamique ;
6. l'import/export ;
7. la compatibilité avec les thèmes générés ;
8. l'intégration naturelle dans EGEN Core ;
9. l'extensibilité à tous les futurs composants EGEN.

**Nous ne voulons plus construire notre propre éditeur de thèmes depuis zéro.**

**Nous voulons capitaliser sur TweakCN pour l'expérience de création, sur TokiForge pour le moteur de Design System, et construire par-dessus une véritable expérience native EGEN.**

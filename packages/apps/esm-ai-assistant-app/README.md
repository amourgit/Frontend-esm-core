# `@egen/esm-ai-assistant-app`

Couche 2 IA EGEN — widget assistant conversationnel (texte + dictée vocale),
accessible sur toutes les pages authentifiées (même périmètre de routes que
`esm-footer-app` / la TopBar de `esm-primary-navigation-app`).

## Rôle

Cette app est la **première consommatrice réelle** des packages Couche 1
(`packages/framework/esm-ai-*`) : jusqu'ici, ces packages existaient mais
n'étaient jamais initialisés ni utilisés par aucune app du monorepo. Elle :

1. Appelle `initAIFramework()` (une fois, depuis `startupApp()`) — enregistre
   les 10 tools natifs et démarre la réactivité du contexte IA.
2. Affiche un bouton flottant + un panneau de conversation minimaliste.
3. Envoie chaque message au backend proxy IA (`EGEN_AI_BACKEND_URL`), avec :
   le message, l'historique, le contexte EGEN sérialisé (déjà tronqué selon
   `EGEN_AI_CONTEXT_MAX_SIZE`) et le schéma des tools **déjà filtré selon les
   privilèges de l'utilisateur courant** (`useAvailableToolsSchema()`).
4. Exécute côté client tout appel de tool demandé par le LLM, via le pipeline
   complet de `@egen/esm-ai-tools` (validation d'arguments + revérification
   des permissions + timeout) — jamais en confiance aveugle du backend/LLM.

## Démarrage rapide (une seule clé API à coller)

Par défaut (`EGEN_AI_DIRECT_MODE=true`), le frontend appelle Gemini
**directement**, sans backend :

1. Crée une clé API gratuite sur https://aistudio.google.com/apikey
2. Colle-la dans **`.env.development.local`** à la racine du monorepo (fichier
   non versionné — ne jamais mettre la vraie clé dans `.env.development`) :
   ```
   EGEN_AI_API_KEY=colle-ta-clé-ici
   ```
3. Relance `yarn start`.

Le modèle par défaut, `gemini-2.5-flash`, est gratuit sur le tier gratuit de
Google AI Studio et accepte texte **et audio** en entrée.

⚠️ **Ce mode expose la clé API dans le navigateur** (visible dans l'onglet
Network des DevTools). Acceptable pour du développement local ou une démo
interne. **Jamais pour un déploiement accessible à des utilisateurs non
contrôlés** — voir la section suivante.

## Pourquoi la clé API Gemini n'est jamais dans ce package (mode production)

Avec `EGEN_AI_DIRECT_MODE=false`, le provider (`EGEN_AI_PROVIDER=gemini`) et
le modèle restent de la configuration, mais l'appel réel au LLM — et donc la
clé API — vit **côté backend** (`EGEN_AI_BACKEND_URL`, ex. `civitas-core`).
Ce frontend ne parle qu'à ce backend, jamais directement à
`generativelanguage.googleapis.com`. Voir `.env.development` à la racine du
monorepo pour la configuration complète (`EGEN_AI_*`).

## Le tool `navigate`, bout en bout

Aucun traitement spécial : `navigate` est un tool natif comme les 9 autres
(voir `packages/framework/esm-ai-tools/src/native/index.ts`). Le chemin est :

```
Message utilisateur
  → backend IA (function-calling Gemini)
  → { tool: "navigate", arguments: { route: "..." } }
  → useExecuteTool().execute(...)
      → validation des arguments (schéma du tool)
      → vérification des privilèges (requiredPrivileges, vide pour navigate)
      → navigateTool.execute() → @egen/esm-navigation.navigate({ to })
  → résultat renvoyé au LLM → réponse finale
```

L'UI affiche chaque étape en direct (badge "en cours" → "✓ Navigation vers
/…") dans la bulle de réponse de l'assistant.

## Configuration

- Comportement du moteur IA (provider, backend, mémoire, sécurité, contexte) :
  variables d'environnement `EGEN_AI_*`, voir `@egen/esm-ai-config`.
- Présentation du widget (nom affiché, message d'accueil, suggestions,
  activation du micro, entreprise à l'origine du projet) : schéma de config
  de cette app (`src/config-schema.ts`), surchargeable par tenant comme
  n'importe quelle config EGEN.

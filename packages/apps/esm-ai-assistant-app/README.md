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

## Pourquoi la clé API Gemini n'est jamais dans ce package

Le provider (`EGEN_AI_PROVIDER=gemini`) et le modèle sont une information de
configuration, mais l'appel réel au LLM — et donc la clé API — vit **côté
backend** (`EGEN_AI_BACKEND_URL`, ex. `civitas-core`). Ce frontend ne parle
qu'à ce backend, jamais directement à `generativelanguage.googleapis.com`.
Voir `.env.development` à la racine du monorepo pour la configuration
complète (`EGEN_AI_*`).

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

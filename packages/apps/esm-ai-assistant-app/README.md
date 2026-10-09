# `@egen/esm-ai-assistant-app`

Interface de l'assistant IA EGEN (texte + voix). **Aucun moteur IA ici** : modèle,
prompt système, mémoire/historique, STT/TTS et orchestration vivent dans le backend.

## Rôle du frontend

1. Afficher la conversation (widget, panneau, expérience plein écran) et l'état de la connexion.
2. Capturer le micro (VAD, dictée) et **lire l'audio** renvoyé par le backend.
3. Envoyer au backend, sur le **canal temps réel** (`@egen-civitas/esm-ai-channel`, WebSocket), ce que dit/écrit l'utilisateur.
4. Provisionner au backend le **catalogue des tools frontend** autorisés pour l'utilisateur et exécuter les `tool.call` du backend
   (navigation, description d'écran, actions UI…) via le pipeline `esm-ai-tools` (validation, permissions, timeout) — géré par le framework, pas par cette app.

Cette app ne garde **rien** : ni prompt, ni mémoire, ni historique (ni `localStorage`), ni appel HTTP vers un LLM.
L'historique est réhydraté depuis le backend à chaque connexion.

## Canal

Configuré par `EGEN_AI_CHANNEL_URL` (voir `@egen-civitas/esm-ai-config`) ; protocole et contrat backend :
`packages/framework/esm-ai-channel/README.md` du dépôt framework. Hors ligne, le panneau affiche « Assistant hors ligne —
reconnexion en cours… » et les envois échouent avec une erreur explicite (aucune réponse n'est jamais inventée).

## Configuration

- Canal, heartbeat, reconnexion, sécurité des tools : variables `EGEN_AI_*`.
- Présentation (nom, accueil, suggestions, micro, entreprise) : `src/config-schema.ts`.

# `@egen/esm-ai-assistant-app`

Interface de l'assistant IA EGEN (texte + voix). **Aucun moteur IA ici** : modèle,
prompt système, mémoire, STT/TTS et function-calling vivent dans le backend.

## Rôle du frontend

1. Afficher la conversation (widget, panneau, expérience plein écran).
2. Capturer le micro (VAD, dictée) et **lire l'audio** renvoyé par le backend.
3. Envoyer au backend : message, mode choisi, historique affiché, contexte EGEN
   sérialisé et schéma des tools frontend autorisés pour l'utilisateur.
4. **Exécuter les tools frontend** demandés par le backend (navigation, description
   d'écran, actions UI…) via `@egen-civitas/esm-ai-framework`, avec revalidation
   des arguments et des permissions — jamais en confiance aveugle.

## Backend attendu

- Chat/tools : `EGEN_AI_BACKEND_URL` + `/chat` et `/chat/stream` (SSE : `token`, `tool_call`, `done`, `error`).
- Expérience plein écran : `assistant.agentApiBaseUrl` (défaut `/api/agent`) → `/stream`, `/message`, `/transcribe`, `/tts`.
  Le backend construit le prompt à partir du `mode` reçu.

Si le backend ne répond pas, une erreur explicite est affichée (aucun repli, aucune réponse inventée).

## Configuration

- Transport / exécution des tools : variables `EGEN_AI_*` (voir `@egen-civitas/esm-ai-config`).
- Présentation (nom, accueil, suggestions, micro, entreprise) : `src/config-schema.ts`.

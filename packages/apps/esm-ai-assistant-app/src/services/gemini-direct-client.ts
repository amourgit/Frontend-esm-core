// =============================================================================
//  @egen/esm-ai-assistant-app — Client direct Gemini (mode prototypage)
//
//  ⚠️  AVERTISSEMENT SÉCURITÉ
//  Ce client appelle generativelanguage.googleapis.com DIRECTEMENT depuis le
//  navigateur, avec la clé API dans l'en-tête `x-goog-api-key` de chaque
//  requête. La clé est donc visible dans l'onglet Network des DevTools
//  (requêtes sortantes) de quiconque inspecte l'application. C'est
//  acceptable pour du développement local ou une démo interne, JAMAIS pour
//  une mise en production exposée à des utilisateurs non contrôlés — voir
//  README.md de cette app.
//
//  Activé uniquement si EGEN_AI_DIRECT_MODE=true (ou si EGEN_AI_API_KEY est
//  renseignée). Sinon, `ai-backend-client.ts` (backend proxy) est utilisé.
//
//  Implémente EXACTEMENT le même contrat que ai-backend-client.ts
//  (ChatRequestBody → ChatResponseDTO / StreamEvent) afin que
//  hooks/use-ai-chat.ts n'ait AUCUNE connaissance du provider utilisé.
// =============================================================================

import { getAIConfig } from '@egen/esm-ai-framework';
import type { ChatMessageDTO, ChatRequestBody, ChatResponseDTO, StreamEvent, ToolCallRequest } from './ai-backend-client';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// ─── Conversion du schéma de tools EGEN (JSON Schema) → Gemini functionDeclarations ──
// Le schéma retourné par getToolsSchemaForLLM() (voir esm-ai-tools/registry.ts)
// place directement `tool.parameters` — le format INTERNE EGEN — comme
// `properties`. Ce format interne annote CHAQUE propriété avec un champ
// `required: true|false` (booléen) en plus du tableau `required: string[]`
// déjà calculé correctement au niveau racine du schéma. Un schéma Gemini
// (sous-ensemble OpenAPI) n'accepte `required` QUE sous forme de tableau au
// niveau de l'objet parent — un `required` booléen sur une propriété enfant
// est un champ invalide qui fait échouer TOUTE la requête avec 400
// INVALID_ARGUMENT (vérifié : l'erreur survient qu'importe le modèle utilisé).
// On retire donc `required` uniquement quand sa valeur est un booléen (celui
// d'une propriété), en conservant intact le tableau `required` du parent.
// On retire aussi `default`, que Gemini ignore/rejette selon les versions.
function toGeminiFunctionDeclarations(tools: object[]): object[] {
  return tools.map((tool) =>
    JSON.parse(JSON.stringify(tool), (key, value) => {
      if (key === 'default') return undefined;
      if (key === 'required' && typeof value === 'boolean') return undefined;
      return value;
    }),
  );
}

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
  /**
   * Marque une part comme faisant partie du raisonnement interne du modèle
   * (Gemini 3.x, "thinking") plutôt que de la réponse finale. Ne doit
   * JAMAIS être affichée à l'utilisateur — filtrée explicitement partout
   * où l'on lit `part.text`, même si elle n'apparaît pas par défaut sans
   * `thinkingConfig.includeThoughts: true` (qu'on ne définit pas ici).
   */
  thought?: boolean;
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

/**
 * Convertit l'historique générique (ChatMessageDTO[]) en `contents` Gemini.
 *
 * Point important : quand on rencontre un message role:'tool' (résultat d'un
 * tool déjà exécuté), Gemini exige que le tour précédent soit un tour
 * "model" contenant le `functionCall` correspondant — sinon l'API rejette la
 * requête. Comme ChatMessageDTO ne représente pas ce tour explicitement, on
 * le RECONSTRUIT ici à partir de `toolName`/`toolArguments` (voir
 * ChatMessageDTO.toolArguments).
 */
export function toGeminiContents(history: ChatMessageDTO[]): GeminiContent[] {
  const contents: GeminiContent[] = [];

  for (const message of history) {
    if (message.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: message.content }] });
    } else if (message.role === 'assistant') {
      if (message.content) {
        contents.push({ role: 'model', parts: [{ text: message.content }] });
      }
    } else if (message.role === 'tool') {
      // Tour "model" reconstruit — annonce l'appel de fonction que Gemini a demandé.
      contents.push({
        role: 'model',
        parts: [{ functionCall: { name: message.toolName ?? '', args: message.toolArguments ?? {} } }],
      });
      // Tour "user" — le résultat renvoyé au modèle. Bien que ce tour porte
      // sémantiquement une réponse de fonction et non un message humain,
      // l'API Gemini n'accepte que role:'user'|'model' sur Content (voir la
      // doc officielle ai.google.dev/gemini-api/docs/function-calling, dont
      // tous les exemples 2026 utilisent role:'user' ici — jamais 'function',
      // qui n'existe pas dans le schéma actuel de l'API REST).
      let response: Record<string, unknown>;
      try {
        response = JSON.parse(message.content);
      } catch {
        response = { result: message.content };
      }
      contents.push({
        role: 'user',
        parts: [{ functionResponse: { name: message.toolName ?? '', response } }],
      });
    }
  }

  return contents;
}

export function parseGeminiResponse(json: any): ChatResponseDTO {
  const candidate = json?.candidates?.[0];
  const parts: GeminiPart[] = candidate?.content?.parts ?? [];

  let message = '';
  const toolCalls: ToolCallRequest[] = [];

  for (const part of parts) {
    if (part.thought) continue; // raisonnement interne — jamais affiché
    if (part.text) {
      message += part.text;
    } else if (part.functionCall) {
      toolCalls.push({
        // Gemini ne fournit pas d'ID d'appel — on en génère un stable pour
        // cette réponse, utilisé uniquement pour l'affichage/le suivi côté UI.
        id: `gemini-call-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        tool: part.functionCall.name,
        arguments: part.functionCall.args ?? {},
      });
    }
  }

  return { message, toolCalls, done: toolCalls.length === 0 };
}

function buildRequestPayload(body: ChatRequestBody) {
  const { provider } = getAIConfig();

  const history: ChatMessageDTO[] = [...body.history, ...(body.message ? [{ role: 'user' as const, content: body.message }] : [])];

  return {
    contents: toGeminiContents(history),
    tools: body.tools.length > 0 ? [{ functionDeclarations: toGeminiFunctionDeclarations(body.tools) }] : undefined,
    systemInstruction: {
      parts: [
        {
          text:
            'Tu es un assistant intégré à une plateforme EGEN. Utilise les tools mis à ta disposition ' +
            "pour agir au nom de l'utilisateur (navigation, recherche, etc.) plutôt que de simplement " +
            "décrire ce qu'il faudrait faire. Voici le contexte applicatif actuel (JSON) : " +
            body.context,
        },
      ],
    },
    generationConfig: {
      temperature: provider.temperature,
      topP: provider.topP,
      topK: provider.topK,
      maxOutputTokens: provider.maxTokens,
    },
  };
}

function requireApiKey(): string {
  const { provider } = getAIConfig();
  if (!provider.apiKey) {
    throw new Error(
      'EGEN_AI_DIRECT_MODE est activé mais EGEN_AI_API_KEY est vide. ' +
        'Renseignez votre clé API Gemini dans .env.development (ou .env.development.local).',
    );
  }
  return provider.apiKey;
}

// Note (2026) : Google migre les clés API Gemini du format historique
// "AIza..." (passé en query param ?key=...) vers un nouveau format "AQ.Ab..."
// ("Auth key"), qui doit être transmis via l'en-tête HTTP `x-goog-api-key` —
// voir sendChatMessage/streamChatMessage ci-dessous. Les clés créées
// aujourd'hui sur https://aistudio.google.com/apikey sont déjà au nouveau
// format par défaut. On ne valide jamais la FORME de la clé ici (un préfixe
// est une opinion de Google qui peut encore changer) : on se contente de la
// transmettre telle quelle et de laisser l'API trancher.

/**
 * Parse un unique bloc SSE (le texte entre deux lignes vides du flux) en
 * JSON. Traite tout le bloc — pas seulement sa première ligne — car Gemini
 * étale parfois le JSON d'un même évènement sur plusieurs lignes physiques
 * sans répéter le préfixe "data:" (voir streamChatMessage). Retourne `null`
 * si le bloc n'est pas un évènement `data:` exploitable.
 */
export function parseSseDataFrame(frame: string): any | null {
  const trimmedFrame = frame.trim();
  if (!trimmedFrame.startsWith('data:')) return null;
  const raw = trimmedFrame.slice(5).trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function sendChatMessage(body: ChatRequestBody, signal?: AbortSignal): Promise<ChatResponseDTO> {
  const { provider } = getAIConfig();
  const apiKey = requireApiKey();

  const response = await fetch(`${GEMINI_API_BASE}/${provider.model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(buildRequestPayload(body)),
    signal,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Gemini a répondu ${response.status} ${response.statusText} — ${errorBody.slice(0, 300)}`);
  }

  return parseGeminiResponse(await response.json());
}

/**
 * Streaming Gemini via `:streamGenerateContent?alt=sse`. Chaque frame SSE
 * contient une réponse JSON PARTIELLE (pas un delta) — on ne remonte que le
 * texte des `parts[].text` rencontrées, et les `functionCall` dès qu'ils
 * apparaissent dans une frame.
 */
export async function streamChatMessage(
  body: ChatRequestBody,
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const { provider } = getAIConfig();
  const apiKey = requireApiKey();

  const response = await fetch(`${GEMINI_API_BASE}/${provider.model}:streamGenerateContent?alt=sse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', 'x-goog-api-key': apiKey },
    body: JSON.stringify(buildRequestPayload(body)),
    signal,
  });

  if (!response.ok || !response.body) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Gemini a répondu ${response.status} ${response.statusText} — ${errorBody.slice(0, 300)}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const seenToolCallSignatures = new Set<string>();

  // Traite un morceau de buffer déjà décodé : découpe en blocs SSE séparés
  // par une ligne vide, traite chacun, et renvoie le reliquat incomplet.
  const processBuffer = (text: string): string => {
    // Certains environnements (proxys, certains navigateurs) terminent les
    // lignes SSE en CRLF ("\r\n") plutôt qu'en LF seul ("\n"). Si on ne
    // découpe que sur "\n\n" littéral, la séquence "\r\n\r\n" ne matche
    // JAMAIS (il y a toujours un \r entre les deux \n) : aucun bloc n'est
    // alors jamais isolé, et tout le flux reste bloqué dans le buffer sans
    // qu'aucun token ne soit traité — silence total côté UI, sans la
        // moindre erreur. On normalise donc CRLF → LF avant de découper.
    const normalized = text.replace(/\r\n/g, '\n');
    const frames = normalized.split('\n\n');
    const remainder = frames.pop() ?? '';

    for (const frame of frames) {
      // Un bloc SSE peut étaler le JSON d'un même évènement sur PLUSIEURS
      // lignes physiques, sans répéter le préfixe "data:" sur les lignes
      // de continuation (constaté en pratique sur l'API Gemini). Ne
      // prendre que la première ligne (comme le fait un parseur SSE
      // "ligne par ligne" naïf) tronque le JSON et fait échouer
      // silencieusement le parsing — perdant tout le texte de la
      // réponse sans la moindre erreur visible.
      const json = parseSseDataFrame(frame);
      if (!json) continue;

      const parts: GeminiPart[] = json?.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if (part.thought) continue; // raisonnement interne — jamais affiché
        if (part.text) {
          onEvent({ type: 'token', text: part.text });
        } else if (part.functionCall) {
          const signature = `${part.functionCall.name}:${JSON.stringify(part.functionCall.args ?? {})}`;
          if (seenToolCallSignatures.has(signature)) continue; // évite les doublons entre frames partielles
          seenToolCallSignatures.add(signature);
          onEvent({
            type: 'tool_call',
            id: `gemini-call-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            tool: part.functionCall.name,
            arguments: part.functionCall.args ?? {},
          });
        }
      }
    }

    return remainder;
  };

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) {
        // Traite tout reliquat restant (dernier bloc sans "\n\n" final).
        buffer += decoder.decode();
        processBuffer(buffer + '\n\n');
        break;
      }

      buffer = processBuffer(buffer + decoder.decode(value, { stream: true }));
    }
    onEvent({ type: 'done' });
  } finally {
    reader.releaseLock();
  }
}

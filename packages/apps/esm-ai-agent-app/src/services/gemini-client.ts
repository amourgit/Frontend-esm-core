import { getToolsSchemaForLLM } from '@egen/esm-ai-tools';

// =============================================================================
//  Client Gemini (Google Generative Language API)
//
//  ⚠️ Provisoire : appel direct depuis le navigateur avec la clé API en
//  paramètre de requête (voir AIProviderConfig.apiKey). Tant qu'aucun backend
//  proxy IA (AIBackendConfig) n'est déployé, la clé est exposée côté client.
//  À migrer derrière un backend dès que possible — voir le commentaire sur
//  AIBackendConfig dans @egen/esm-ai-config/src/types.ts.
// =============================================================================

type GeminiPart =
  | { text: string }
  | { functionCall: { name: string; args: Record<string, unknown> } }
  | { functionResponse: { name: string; response: Record<string, unknown> } };

export interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

interface GeminiSchema {
  type: string;
  description?: string;
  enum?: string[];
  items?: GeminiSchema;
  properties?: Record<string, GeminiSchema>;
  required?: string[];
}

export interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters: GeminiSchema;
}

const JSON_TYPE_TO_GEMINI_TYPE: Record<string, string> = {
  string: 'STRING',
  number: 'NUMBER',
  boolean: 'BOOLEAN',
  object: 'OBJECT',
  array: 'ARRAY',
};

/** Convertit un AIToolParam (schéma JSON simplifié interne) en schéma Gemini (types en MAJUSCULES, clés reconnues uniquement) */
function toGeminiSchema(param: {
  type: string;
  description?: string;
  enum?: unknown[];
  items?: { type: string };
  properties?: Record<string, unknown>;
}): GeminiSchema {
  const schema: GeminiSchema = { type: JSON_TYPE_TO_GEMINI_TYPE[param.type] ?? 'STRING' };

  if (param.description) schema.description = param.description;
  if (param.enum?.length) schema.enum = param.enum.map(String);

  if (param.type === 'array' && param.items) {
    schema.items = toGeminiSchema(param.items as any);
  }

  if (param.type === 'object' && param.properties) {
    schema.properties = Object.fromEntries(
      Object.entries(param.properties).map(([key, value]) => [key, toGeminiSchema(value as any)]),
    );
  }

  return schema;
}

/**
 * Construit les déclarations de fonctions Gemini depuis le registre de tools
 * EGEN (Layer 1), filtrées selon les privilèges de l'utilisateur courant.
 */
export function getGeminiFunctionDeclarations(userPrivileges: string[]): GeminiFunctionDeclaration[] {
  const tools = getToolsSchemaForLLM(userPrivileges) as Array<{
    name: string;
    description: string;
    parameters: { type: string; properties: Record<string, unknown>; required: string[] };
  }>;

  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: {
      type: 'OBJECT',
      properties: Object.fromEntries(
        Object.entries(tool.parameters.properties).map(([key, value]) => [key, toGeminiSchema(value as any)]),
      ),
      required: tool.parameters.required,
    },
  }));
}

export interface GeminiCallParams {
  apiKey: string;
  apiEndpoint: string;
  model: string;
  systemInstruction: string;
  contents: GeminiContent[];
  tools: GeminiFunctionDeclaration[];
  generationConfig: {
    temperature: number;
    topP: number;
    topK: number;
    maxOutputTokens: number;
  };
}

export interface GeminiCallResult {
  parts: GeminiPart[];
  finishReason?: string;
}

/** Appelle `models/{model}:generateContent` et retourne les parts du premier candidat */
export async function callGemini(params: GeminiCallParams): Promise<GeminiCallResult> {
  if (!params.apiKey) {
    throw new Error(
      "Aucune clé API configurée (EGEN_AI_API_KEY). Voir .env.development et le pont window.egenAi* dans index.ejs.",
    );
  }

  const base = params.apiEndpoint.replace(/\/+$/, '');
  const url = `${base}/models/${params.model}:generateContent?key=${encodeURIComponent(params.apiKey)}`;

  const body: Record<string, unknown> = {
    system_instruction: { parts: [{ text: params.systemInstruction }] },
    contents: params.contents,
    generationConfig: {
      temperature: params.generationConfig.temperature,
      topP: params.generationConfig.topP,
      topK: params.generationConfig.topK,
      maxOutputTokens: params.generationConfig.maxOutputTokens,
    },
  };

  if (params.tools.length > 0) {
    body.tools = [{ functionDeclarations: params.tools }];
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Gemini a répondu ${response.status} : ${errorText.slice(0, 300) || response.statusText}`);
  }

  const data = await response.json();
  const candidate = data?.candidates?.[0];

  if (!candidate) {
    const blockReason = data?.promptFeedback?.blockReason;
    throw new Error(
      blockReason
        ? `Réponse bloquée par Gemini (raison : ${blockReason}).`
        : 'Réponse Gemini vide (aucun candidat).',
    );
  }

  return {
    parts: candidate.content?.parts ?? [],
    finishReason: candidate.finishReason,
  };
}

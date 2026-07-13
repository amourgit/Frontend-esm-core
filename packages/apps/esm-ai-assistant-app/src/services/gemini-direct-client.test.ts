import { describe, it, expect } from 'vitest';
import { toGeminiContents, parseGeminiResponse } from './gemini-direct-client';
import type { ChatMessageDTO } from './ai-backend-client';

describe('toGeminiContents', () => {
  it('reconstructs a matching functionCall/functionResponse pair before a tool result', () => {
    const history: ChatMessageDTO[] = [
      { role: 'user', content: 'Emmène-moi sur la page des étudiants' },
      {
        role: 'tool',
        content: JSON.stringify({ navigated: true }),
        toolCallId: 'call-1',
        toolName: 'navigate',
        toolArguments: { route: '/students' },
      },
    ];

    const contents = toGeminiContents(history);

    expect(contents).toEqual([
      { role: 'user', parts: [{ text: 'Emmène-moi sur la page des étudiants' }] },
      { role: 'model', parts: [{ functionCall: { name: 'navigate', args: { route: '/students' } } }] },
      { role: 'user', parts: [{ functionResponse: { name: 'navigate', response: { navigated: true } } }] },
    ]);
  });

  it('drops empty assistant messages instead of sending blank turns', () => {
    const history: ChatMessageDTO[] = [
      { role: 'user', content: 'Bonjour' },
      { role: 'assistant', content: '' },
    ];

    expect(toGeminiContents(history)).toEqual([{ role: 'user', parts: [{ text: 'Bonjour' }] }]);
  });
});

describe('parseGeminiResponse', () => {
  it('extracts plain text with no tool calls as a final answer', () => {
    const json = {
      candidates: [{ content: { role: 'model', parts: [{ text: 'Bonjour !' }] } }],
    };

    expect(parseGeminiResponse(json)).toEqual({ message: 'Bonjour !', toolCalls: [], done: true });
  });

  it('extracts a functionCall as a pending tool call, not done', () => {
    const json = {
      candidates: [{ content: { role: 'model', parts: [{ functionCall: { name: 'navigate', args: { route: '/x' } } }] } }],
    };

    const result = parseGeminiResponse(json);
    expect(result.done).toBe(false);
    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls[0]).toMatchObject({ tool: 'navigate', arguments: { route: '/x' } });
  });
});

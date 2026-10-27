import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearLogs, detectLevel, logStore, pushLog, resetLogStoreForTests, setLogsPaused, MAX_LINES } from './log-store';

const flush = () => new Promise((resolve) => setTimeout(resolve, 40));

describe('log-store', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetLogStoreForTests();
  });

  it('classe le texte par niveau', () => {
    expect(detectLevel('Error: x')).toBe('error');
    expect(detectLevel('compiled')).toBe('success');
    expect(detectLevel('hello')).toBe('info');
  });

  it('ajoute et compte les lignes', async () => {
    pushLog('error', 'a');
    pushLog('info', 'b');
    await flush();
    const { lines, counts } = logStore.getSnapshot();
    expect(lines).toHaveLength(2);
    expect(counts).toMatchObject({ error: 1, info: 1 });
  });

  it('met en attente pendant la pause puis restitue', async () => {
    setLogsPaused(true);
    pushLog('warn', 'w');
    await flush();
    expect(logStore.getSnapshot()).toMatchObject({ paused: true, pending: 1 });
    expect(logStore.getSnapshot().lines).toHaveLength(0);
    setLogsPaused(false);
    await flush();
    expect(logStore.getSnapshot().lines).toHaveLength(1);
  });

  it('plafonne le tampon et efface', async () => {
    for (let i = 0; i < MAX_LINES + 10; i++) pushLog('info', String(i));
    await flush();
    expect(logStore.getSnapshot().lines).toHaveLength(MAX_LINES);
    expect(logStore.getSnapshot().counts.info).toBe(MAX_LINES);
    clearLogs();
    await flush();
    expect(logStore.getSnapshot().lines).toHaveLength(0);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { startLogCapture, clearLogs, detectLevel, logStore, pushLog, resetLogStoreForTests, setLogsPaused, MAX_LINES } from './log-store';

const flush = () => new Promise((resolve) => setTimeout(resolve, 40));

describe('log-store', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetLogStoreForTests();
  });

  it('classe le texte par niveau', () => {
    expect(detectLevel('Error: x')).toBe('error');
    expect(detectLevel('Rspack compiled successfully')).toBe('success');
    expect(detectLevel('compiled with 6 errors')).toBe('error');
    expect(detectLevel('./a.json 779 bytes [built]')).toBe('info');
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

  describe('flux terminal', () => {
    class FakeEventSource {
      static CLOSED = 2;
      static last: FakeEventSource;
      readyState = 0;
      onopen?: () => void;
      onerror?: () => void;
      onmessage?: (event: { data: string }) => void;
      constructor(public url: string) {
        FakeEventSource.last = this;
      }
      close() {
        this.readyState = FakeEventSource.CLOSED;
      }
      send(entry: object) {
        this.onmessage?.({ data: JSON.stringify(entry) });
      }
    }
    const entry = (id: number, level = 'info', message = `ligne ${id}`) => ({ id, ts: id, source: 'esm-x', level, message });

    beforeEach(() => {
      vi.stubGlobal('EventSource', FakeEventSource);
      (window as unknown as { egenLogsUrl: string }).egenLogsUrl = '/spa/__egen_logs__/';
    });

    it('se connecte, reçoit en temps réel et ignore les doublons de reprise', async () => {
      startLogCapture();
      const source = FakeEventSource.last;
      expect(source.url).toBe('/spa/__egen_logs__/stream');
      source.onopen?.();
      source.send(entry(10, 'error', 'Error: boom'));
      source.send(entry(11));
      source.send(entry(11)); // renvoyé après une reconnexion
      source.send(entry(5)); // plus ancien : ignoré
      await flush();
      const { lines, connection, counts } = logStore.getSnapshot();
      expect(connection).toBe('live');
      expect(lines.map((l) => l.message)).toEqual(['Error: boom', 'ligne 11']);
      expect(lines[0]).toMatchObject({ origin: 'terminal', source: 'esm-x', level: 'error' });
      expect(counts.error).toBe(1);
    });

    it('signale un flux indisponible quand la reconnexion est abandonnée', async () => {
      startLogCapture();
      FakeEventSource.last.close();
      FakeEventSource.last.onerror?.();
      await flush();
      expect(logStore.getSnapshot().connection).toBe('unavailable');
    });

    it('capte la console du navigateur et les erreurs', async () => {
      startLogCapture();
      console.warn('attention');
      window.dispatchEvent(new ErrorEvent('error', { message: 'kaboom' }));
      await flush();
      const levels = logStore.getSnapshot().lines.map((l) => [l.level, l.origin]);
      expect(levels).toContainEqual(['warn', 'browser']);
      expect(levels).toContainEqual(['error', 'browser']);
    });
  });
});

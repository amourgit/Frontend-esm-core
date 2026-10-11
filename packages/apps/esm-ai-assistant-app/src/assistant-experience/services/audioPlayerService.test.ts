import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioPlayerService } from './audioPlayerService';

// ─── Faux Web Audio ──────────────────────────────────────────────────────────

class FakeSource {
  buffer: any = null;
  onended: (() => void) | null = null;
  startedAt: number | null = null;
  stopped = false;
  connect() {}
  start(t: number) {
    this.startedAt = t;
  }
  stop() {
    this.stopped = true;
  }
  end() {
    this.onended?.();
  }
}

class FakeCtx {
  static last: FakeCtx;
  state = 'running';
  currentTime = 10;
  destination = {};
  sources: FakeSource[] = [];
  constructor() {
    FakeCtx.last = this;
  }
  resume = vi.fn(async () => {});
  createAnalyser() {
    return { fftSize: 0, frequencyBinCount: 4, connect() {}, disconnect() {}, getByteFrequencyData() {} };
  }
  createBuffer(_c: number, length: number, rate: number) {
    return { duration: length / rate, getChannelData: () => new Float32Array(length) };
  }
  createBufferSource() {
    const s = new FakeSource();
    this.sources.push(s);
    return s;
  }
}

/** n échantillons PCM16 LE en base64 */
const pcm = (samples: number) => btoa(String.fromCharCode(...new Array(samples * 2).fill(1)));

beforeEach(() => {
  vi.stubGlobal('AudioContext', FakeCtx);
  (window as any).AudioContext = FakeCtx;
});
afterEach(() => vi.unstubAllGlobals());

describe('lecture audio en direct (flux PCM)', () => {
  it('démarre dès le premier fragment, sans attendre la fin de la réponse', () => {
    const onStart = vi.fn();
    const p = new AudioPlayerService({ onStart });
    p.startPcmStream(24000);
    expect(onStart).not.toHaveBeenCalled();
    p.pushPcmChunk(pcm(2400)); // 100 ms
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(p.isPlaying()).toBe(true);
    expect(FakeCtx.last.sources[0].startedAt).toBeCloseTo(10.08, 5); // currentTime + lead initial
  });

  it('enchaîne les fragments bout à bout, sans trou ni chevauchement', () => {
    const p = new AudioPlayerService();
    p.startPcmStream(24000);
    p.pushPcmChunk(pcm(2400)); // 0,1 s
    p.pushPcmChunk(pcm(4800)); // 0,2 s
    p.pushPcmChunk(pcm(2400));
    const t = FakeCtx.last.sources.map((s) => s.startedAt!);
    expect(t[1]).toBeCloseTo(t[0] + 0.1, 5);
    expect(t[2]).toBeCloseTo(t[1] + 0.2, 5);
  });

  it('recale la lecture après une sous-alimentation (réseau en retard) sans accumuler de retard', () => {
    const p = new AudioPlayerService();
    p.startPcmStream(24000);
    p.pushPcmChunk(pcm(2400));
    FakeCtx.last.currentTime = 11; // 1 s plus tard : tout est déjà joué
    p.pushPcmChunk(pcm(2400));
    expect(FakeCtx.last.sources[1].startedAt).toBeCloseTo(11.02, 5);
  });

  it('recolle un échantillon 16 bits coupé entre deux fragments', () => {
    const p = new AudioPlayerService();
    p.startPcmStream(24000);
    const bytes = new Array(8).fill(1); // 4 échantillons
    p.pushPcmChunk(btoa(String.fromCharCode(...bytes.slice(0, 3)))); // 1 échantillon + 1 octet orphelin
    p.pushPcmChunk(btoa(String.fromCharCode(...bytes.slice(3)))); // 5 octets → 3 échantillons (orphelin recollé)
    const lengths = FakeCtx.last.sources.map((s) => Math.round(s.buffer.duration * 24000));
    expect(lengths).toEqual([1, 3]);
  });

  it('signale la fin seulement quand le flux est clos ET tout joué', () => {
    const onEnd = vi.fn();
    const p = new AudioPlayerService({ onEnd });
    p.startPcmStream(24000);
    p.pushPcmChunk(pcm(2400));
    p.pushPcmChunk(pcm(2400), true); // fragment final
    FakeCtx.last.sources[0].end();
    expect(onEnd).not.toHaveBeenCalled();
    FakeCtx.last.sources[1].end();
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(p.isPlaying()).toBe(false);
    expect(p.isPcmStreaming()).toBe(false);
  });

  it("n'achève pas la lecture tant que le backend peut encore envoyer des fragments", () => {
    const onEnd = vi.fn();
    const p = new AudioPlayerService({ onEnd });
    p.startPcmStream(24000);
    p.pushPcmChunk(pcm(2400));
    FakeCtx.last.sources[0].end(); // tout ce qui est reçu est joué, mais le flux reste ouvert
    expect(onEnd).not.toHaveBeenCalled();
    p.finishPcmStream();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('stop() coupe immédiatement tous les fragments planifiés (interruption utilisateur)', () => {
    const onEnd = vi.fn();
    const p = new AudioPlayerService({ onEnd });
    p.startPcmStream(24000);
    p.pushPcmChunk(pcm(2400));
    p.pushPcmChunk(pcm(2400));
    p.stop();
    expect(FakeCtx.last.sources.every((s) => s.stopped)).toBe(true);
    expect(p.isPlaying()).toBe(false);
    expect(p.isPcmStreaming()).toBe(false);
    p.pushPcmChunk(pcm(2400)); // fragment tardif d'une réponse interrompue : ignoré
    expect(FakeCtx.last.sources).toHaveLength(2);
  });
});

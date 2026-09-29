/**
 * Voice Activity Detection (VAD) & Canonical 16kHz WAV PCM Recorder
 * - Calibre dynamiquement le bruit ambiant (noise floor).
 * - Détecte avec précision le début et la fin de parole réelle (filtre clics et silences).
 * - Génère un flux WAV PCM 16-bit 16kHz pur avec en-tête RIFF conforme.
 * - Ne transmet JAMAIS d'audio vide ou de faux-positifs à l'IA.
 */

export interface VadConfig {
  /** Fréquence cible d'échantillonnage pour Gemini (16000 Hz) */
  targetSampleRate?: number;
  /** Seuil minimal d'énergie RMS pour la voix (0.012 à 0.030) */
  energyThreshold?: number;
  /** Durée de silence requise pour clore la parole (ms) */
  silenceDurationMs?: number;
  /** Durée minimale d'expression vocale pour valider un message réel (ms) */
  minSpeechDurationMs?: number;
  /** Temps de confirmation avant déclenchement de la parole (ms) */
  speechStartDebounceMs?: number;
  /** Arrêt automatique et envoi après le silence */
  autoStopOnSilence?: boolean;
}

export const DEFAULT_VAD_CONFIG: Required<VadConfig> = {
  targetSampleRate: 16000,
  energyThreshold: 0.012,
  silenceDurationMs: 1600, // 1600 ms (1.6s) pour permettre une respiration naturelle et des pauses sans coupure
  minSpeechDurationMs: 250,
  speechStartDebounceMs: 40,
  autoStopOnSilence: true,
};

export interface VadEvents {
  onSpeechStart?: () => void;
  onSpeechEnd?: (audioBlob: Blob, base64Audio: string, durationMs: number) => void;
  /** Événement émis lorsque l'utilisateur marque une pause de souffle sans que l'enregistrement ne soit coupé */
  onSpeechPause?: (isPausing: boolean, remainingMs: number) => void;
  onVolumeChange?: (volumePercent: number) => void;
  onError?: (error: Error) => void;
}

export class VoiceActivityDetector {
  private config: Required<VadConfig>;
  private events: VadEvents;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private muteGainNode: GainNode | null = null;

  // Tampons d'échantillons audio Float32
  private recordedChunks: Float32Array[] = [];
  private preRollChunks: Float32Array[] = [];
  private readonly maxPreRoll = 16; // ~400ms de son avant la détection pour ne jamais rogner la première consonne

  private isRunning: boolean = false;
  private isSpeaking: boolean = false;
  private hasDetectedGenuineSpeech: boolean = false;
  private speechStartTime: number = 0;
  private lastVoiceActiveTime: number = 0;
  private speechPotentialStartTime: number = 0;
  private noiseFloor: number = 0.005;
  private animationFrameId: number | null = null;

  constructor(config: VadConfig = {}, events: VadEvents = {}) {
    this.config = { ...DEFAULT_VAD_CONFIG, ...config };
    this.events = events;
  }

  public updateConfig(newConfig: Partial<VadConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Démarre l'écoute microphone avec calibration VAD
   */
  public async start(): Promise<void> {
    if (this.isRunning) return;

    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Le microphone n'est pas supporté sur ce navigateur.");
      }

      // 1. Accès au microphone matériel avec filtres audio
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // 2. Initialisation Web Audio
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioContextClass();

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // 3. Analyser pour calcul de l'énergie RMS
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.2;
      source.connect(this.analyser);

      // 4. Capture continue des échantillons audio bruts
      this.processorNode = this.audioContext.createScriptProcessor(2048, 1, 1);
      this.muteGainNode = this.audioContext.createGain();
      this.muteGainNode.gain.value = 0; // Évite tout larsen / écho sur les haut-parleurs

      this.recordedChunks = [];
      this.preRollChunks = [];
      this.hasDetectedGenuineSpeech = false;
      this.isSpeaking = false;
      this.speechStartTime = 0;
      this.lastVoiceActiveTime = Date.now();
      this.speechPotentialStartTime = 0;
      this.noiseFloor = 0.005;

      this.processorNode.onaudioprocess = (e) => {
        if (!this.isRunning) return;
        const inputBuffer = e.inputBuffer.getChannelData(0);
        const chunk = new Float32Array(inputBuffer.length);
        chunk.set(inputBuffer);

        if (this.isSpeaking) {
          this.recordedChunks.push(chunk);
        } else {
          this.preRollChunks.push(chunk);
          if (this.preRollChunks.length > this.maxPreRoll) {
            this.preRollChunks.shift();
          }
        }
      };

      source.connect(this.processorNode);
      this.processorNode.connect(this.muteGainNode);
      this.muteGainNode.connect(this.audioContext.destination);

      this.isRunning = true;

      // 5. Boucle d'analyse d'énergie vocale
      this.monitorAudioEnergy();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.cleanup();
      if (this.events.onError) {
        this.events.onError(error);
      }
      throw error;
    }
  }

  /**
   * Arrête la capture et produit un fichier WAV valide si la parole a été détectée
   */
  public async stop(): Promise<{ blob: Blob; base64: string; durationMs: number } | null> {
    if (!this.isRunning) return null;

    const sourceContext = this.audioContext;
    const inputSampleRate = sourceContext?.sampleRate || 44100;
    const durationMs = this.speechStartTime > 0 ? Date.now() - this.speechStartTime : 0;
    const wasGenuine = this.hasDetectedGenuineSpeech && this.recordedChunks.length > 0;

    const allChunks = [...this.preRollChunks, ...this.recordedChunks];
    this.isRunning = false;
    this.cleanup();

    if (!wasGenuine || allChunks.length === 0) {
      return null;
    }

    // Fusion de tous les Float32Array
    let totalLength = 0;
    for (const chunk of allChunks) {
      totalLength += chunk.length;
    }

    if (totalLength < inputSampleRate * 0.25) {
      // Trop court (< 250ms), ignoré
      return null;
    }

    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of allChunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    // Rééchantillonnage vers 16000 Hz si nécessaire pour optimiser Gemini
    const resampled = this.downsampleTo16k(merged, inputSampleRate, this.config.targetSampleRate);
    const wavBlob = this.encodeWav16Bit(resampled, this.config.targetSampleRate);
    const base64 = await this.blobToBase64(wavBlob);

    if (base64 && base64.length > 200) {
      if (this.events.onSpeechEnd) {
        this.events.onSpeechEnd(wavBlob, base64, durationMs);
      }
      return { blob: wavBlob, base64, durationMs };
    }

    return null;
  }

  /**
   * Annulation immédiate
   */
  public cancel(): void {
    this.isRunning = false;
    this.cleanup();
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Analyse du niveau sonore et machine à états VAD
   */
  private monitorAudioEnergy = () => {
    if (!this.isRunning || !this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    this.analyser.getFloatTimeDomainData(dataArray);

    let sumSquares = 0;
    for (let i = 0; i < bufferLength; i++) {
      sumSquares += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sumSquares / bufferLength);

    // Volume normalisé 0..100 pour l'UI
    const normalizedVolume = Math.min(100, Math.round(rms * 450));
    if (this.events.onVolumeChange) {
      this.events.onVolumeChange(normalizedVolume);
    }

    const now = Date.now();

    // Calibration continue du bruit de fond (quand l'utilisateur ne parle pas)
    if (!this.isSpeaking) {
      this.noiseFloor = this.noiseFloor * 0.95 + rms * 0.05;
    }

    // Hystérésis : seuil d'attaque plus strict pour déclencher la parole,
    // mais seuil de maintien plus indulgent une fois engagé pour ne pas couper sur les respirations ou consonnes faibles
    const attackThreshold = Math.max(this.config.energyThreshold, this.noiseFloor * 2.2 + 0.005);
    const holdThreshold = Math.max(this.config.energyThreshold * 0.65, this.noiseFloor * 1.5 + 0.002);
    const effectiveThreshold = this.isSpeaking ? holdThreshold : attackThreshold;
    const isAboveThreshold = rms > effectiveThreshold;

    if (isAboveThreshold) {
      this.lastVoiceActiveTime = now;

      if (!this.isSpeaking) {
        if (this.speechPotentialStartTime === 0) {
          this.speechPotentialStartTime = now;
        } else if (now - this.speechPotentialStartTime >= this.config.speechStartDebounceMs) {
          // Début de parole validé
          this.isSpeaking = true;
          this.hasDetectedGenuineSpeech = true;
          this.speechStartTime = now;
          if (this.events.onSpeechStart) {
            this.events.onSpeechStart();
          }
        }
      } else {
        // En train de parler activement : réinitialise l'état de pause
        if (this.events.onSpeechPause) {
          this.events.onSpeechPause(false, this.config.silenceDurationMs);
        }
      }
    } else {
      this.speechPotentialStartTime = 0;

      if (this.isSpeaking) {
        const silenceElapsed = now - this.lastVoiceActiveTime;
        const speechDuration = now - this.speechStartTime;

        // Détection de pause naturelle (respiration ou réflexion) : entre 350ms et la fin de tolérance
        const isPausing = silenceElapsed >= 350 && silenceElapsed < this.config.silenceDurationMs;
        if (this.events.onSpeechPause) {
          this.events.onSpeechPause(isPausing, Math.max(0, this.config.silenceDurationMs - silenceElapsed));
        }

        if (silenceElapsed >= this.config.silenceDurationMs) {
          if (speechDuration >= this.config.minSpeechDurationMs) {
            this.isSpeaking = false;
            if (this.events.onSpeechPause) {
              this.events.onSpeechPause(false, 0);
            }
            if (this.config.autoStopOnSilence) {
              this.stop();
              return;
            }
          } else {
            // Bruit parasite trop court, on réinitialise sans couper l'écoute
            this.isSpeaking = false;
            this.recordedChunks = [];
            this.hasDetectedGenuineSpeech = false;
            if (this.events.onSpeechPause) {
              this.events.onSpeechPause(false, 0);
            }
          }
        }
      }
    }

    this.animationFrameId = requestAnimationFrame(this.monitorAudioEnergy);
  };

  /**
   * Rééchantillonneur linéaire haute performance vers 16kHz
   */
  private downsampleTo16k(input: Float32Array, inputRate: number, targetRate: number): Float32Array {
    if (inputRate === targetRate) return input;
    const ratio = inputRate / targetRate;
    const newLength = Math.round(input.length / ratio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const originalIndex = i * ratio;
      const indexFloor = Math.floor(originalIndex);
      const indexCeil = Math.min(input.length - 1, indexFloor + 1);
      const fraction = originalIndex - indexFloor;
      result[i] = input[indexFloor] * (1 - fraction) + input[indexCeil] * fraction;
    }

    return result;
  }

  /**
   * Encodeur WAV RIFF 16-bit Mono Canonique (standard 44 octets)
   */
  private encodeWav16Bit(samples: Float32Array, sampleRate: number): Blob {
    const numChannels = 1;
    const bytesPerSample = 2; // 16-bit
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    this.writeAscii(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    this.writeAscii(view, 8, 'WAVE');

    // fmt sub-chunk
    this.writeAscii(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 pour PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 pour PCM linéaire)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true); // BitsPerSample

    // data sub-chunk
    this.writeAscii(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Écriture des données audio 16-bit signées
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  private writeAscii(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private cleanup() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }

    if (this.muteGainNode) {
      this.muteGainNode.disconnect();
      this.muteGainNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this.analyser = null;
    this.isSpeaking = false;
  }
}
